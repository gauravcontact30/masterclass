-- Super admin: who visits the site and what they do there.
-- Every page view (and how long it was read) from anonymous visitors and signed-in users,
-- recorded by /api/track through the service role. Learners never read this table.
-- IPs are stored masked (last IPv4 octet / last 80 IPv6 bits zeroed) plus a salted hash for counting,
-- never in full. Rows older than 180 days are removed by prune_monitoring().
begin;

create table public.site_visits (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  event text not null check (event in ('page_view', 'page_leave')),
  visitor_id text not null check (length(visitor_id) between 8 and 64),
  session_id text not null check (length(session_id) between 8 and 64),
  user_id uuid,
  new_visitor boolean not null default false,
  path text not null check (length(path) <= 300),
  title text check (length(title) <= 200),
  referrer_host text check (length(referrer_host) <= 120),
  utm_source text, utm_medium text, utm_campaign text,
  country text, region text, city text,
  ip_masked text, ip_hash text,
  browser text, os text, device text,
  is_bot boolean not null default false,
  language text, timezone text, screen text,
  duration_ms integer check (duration_ms is null or duration_ms between 0 and 86400000)
);
create index site_visits_time on public.site_visits(created_at desc);
create index site_visits_visitor on public.site_visits(visitor_id, created_at desc);
create index site_visits_user on public.site_visits(user_id, created_at desc) where user_id is not null;
create index site_visits_session on public.site_visits(session_id);
alter table public.site_visits enable row level security;
revoke all on public.site_visits from anon, authenticated;
grant select, insert, delete on public.site_visits to service_role;
grant usage on sequence public.site_visits_id_seq to service_role;
-- No monitor_change trigger: a page view is itself the record, and auditing it would double every write.

-- --------------------------------------------------------------- the activity page
-- Totals, trends, breakdowns, the people list and the recent visit log for one reporting window.
-- Bots are counted but kept out of every other figure. A visitor who later signs in is attributed to
-- their account for all of their visits, so one person is one row in "people".
create function public.admin_user_activity(p_days integer default 7) returns jsonb
language sql stable security definer set search_path = '' as $$
with win as (select now() - make_interval(days => least(greatest(p_days, 1), 90)) as since),
linked as (select visitor_id, (array_agg(user_id order by created_at desc))[1] as user_id from public.site_visits where user_id is not null group by visitor_id),
v as (
  select s.*, coalesce(s.user_id, l.user_id) as person_user, coalesce(s.user_id::text, l.user_id::text, 'visitor:' || s.visitor_id) as person
  from public.site_visits s cross join win left join linked l on l.visitor_id = s.visitor_id
  where s.created_at > win.since and not s.is_bot),
views as (select * from v where event = 'page_view'),
sess as (select session_id, min(created_at) as started, max(created_at) as ended, count(*) filter (where event = 'page_view') as pages,
  coalesce(sum(duration_ms) filter (where event = 'page_leave'), 0) as engaged_ms from v group by session_id)
select jsonb_build_object(
  'totals', jsonb_build_object(
    'pageViews', (select count(*) from views),
    'visitors', (select count(distinct visitor_id) from views),
    'people', (select count(distinct person) from views),
    'sessions', (select count(*) from sess where pages > 0),
    'signedInUsers', (select count(distinct person_user) from views where person_user is not null),
    'newVisitors', (select count(distinct visitor_id) from views where new_visitor),
    'newAccounts', (select count(*) from auth.users, win where created_at > win.since),
    'liveNow', (select count(distinct visitor_id) from public.site_visits where created_at > now() - interval '5 minutes' and not is_bot),
    'liveSignedIn', (select count(distinct user_id) from public.site_visits where created_at > now() - interval '5 minutes' and user_id is not null and not is_bot),
    'bounceRate', (select round(100.0 * count(*) filter (where pages = 1) / nullif(count(*) filter (where pages > 0), 0), 1) from sess),
    'avgSessionSeconds', (select round(avg(greatest(extract(epoch from ended - started), engaged_ms / 1000.0))) from sess where pages > 0),
    'pagesPerSession', (select round(avg(pages), 2) from sess where pages > 0),
    'bots', (select count(*) from public.site_visits, win where created_at > win.since and is_bot)),
  'daily', coalesce((select jsonb_agg(r order by r.day) from (
    select (created_at at time zone 'Asia/Kolkata')::date as day, count(*) as views, count(distinct visitor_id) as visitors,
      count(distinct visitor_id) filter (where new_visitor) as new_visitors, count(distinct person_user) as users
    from views group by 1) r), '[]'),
  'hours', coalesce((select jsonb_agg(r order by r.hour) from (
    select extract(hour from created_at at time zone 'Asia/Kolkata')::int as hour, count(*) as views from views group by 1) r), '[]'),
  'pages', coalesce((select jsonb_agg(r) from (select path, count(*) as views, count(distinct visitor_id) as visitors,
    round(avg(duration_ms) filter (where duration_ms is not null) / 1000.0) as avg_seconds
    from v group by path having count(*) filter (where event = 'page_view') > 0 order by count(*) filter (where event = 'page_view') desc limit 15) r), '[]'),
  'referrers', coalesce((select jsonb_agg(r) from (select coalesce(referrer_host, 'Direct / none') as referrer, count(*) as views, count(distinct visitor_id) as visitors
    from views group by 1 order by 2 desc limit 12) r), '[]'),
  'campaigns', coalesce((select jsonb_agg(r) from (select utm_source as source, coalesce(utm_medium, '—') as medium, coalesce(utm_campaign, '—') as campaign, count(*) as views
    from views where utm_source is not null group by 1, 2, 3 order by 4 desc limit 12) r), '[]'),
  'countries', coalesce((select jsonb_agg(r) from (select coalesce(country, 'Unknown') as country, count(distinct visitor_id) as visitors, count(*) as views
    from views group by 1 order by 2 desc limit 12) r), '[]'),
  'cities', coalesce((select jsonb_agg(r) from (select coalesce(city, 'Unknown') as city, coalesce(country, '') as country, count(distinct visitor_id) as visitors
    from views group by 1, 2 order by 3 desc limit 12) r), '[]'),
  'devices', coalesce((select jsonb_agg(r) from (select coalesce(device, 'Unknown') as device, count(distinct visitor_id) as visitors from views group by 1 order by 2 desc) r), '[]'),
  'browsers', coalesce((select jsonb_agg(r) from (select coalesce(browser, 'Unknown') as browser, count(distinct visitor_id) as visitors from views group by 1 order by 2 desc limit 8) r), '[]'),
  'systems', coalesce((select jsonb_agg(r) from (select coalesce(os, 'Unknown') as os, count(distinct visitor_id) as visitors from views group by 1 order by 2 desc limit 8) r), '[]'),
  'people', coalesce((select jsonb_agg(r order by r.last_seen desc) from (
    select v.person, max(v.person_user::text) as user_id, u.email,
      case when u.id is not null and u.created_at > (select since from win) then 'new account'
           when u.id is not null then 'existing account'
           when bool_or(v.new_visitor) then 'new visitor' else 'returning visitor' end as status,
      min(v.created_at) as first_seen, max(v.created_at) as last_seen,
      count(*) filter (where v.event = 'page_view') as views, count(distinct v.session_id) as sessions,
      round(coalesce(sum(v.duration_ms), 0) / 1000.0) as engaged_seconds,
      (array_agg(v.path order by v.created_at desc))[1] as last_path,
      (array_agg(v.country order by v.created_at desc))[1] as country, (array_agg(v.city order by v.created_at desc))[1] as city,
      (array_agg(v.device order by v.created_at desc))[1] as device, (array_agg(v.browser order by v.created_at desc))[1] as browser,
      (array_agg(v.os order by v.created_at desc))[1] as os
    from v left join auth.users u on u.id = v.person_user
    group by v.person, u.id, u.email, u.created_at order by max(v.created_at) desc limit 400) r), '[]'),
  'recent', coalesce((select jsonb_agg(r order by r.created_at desc) from (
    select v.created_at, v.event, v.person, v.person_user as user_id, u.email, v.visitor_id, v.session_id, v.new_visitor, v.path, v.title, v.referrer_host,
      v.utm_source, v.country, v.region, v.city, v.ip_masked, v.browser, v.os, v.device, v.language, v.timezone, v.screen, v.duration_ms
    from v left join auth.users u on u.id = v.person_user order by v.created_at desc limit 500) r), '[]')
);
$$;

-- One person's full trail: their visits (including those made before they signed in on the same browser),
-- account, devices, sign-ins and the audit/admin events that concern them. p_person is a user id or "visitor:<id>".
create function public.admin_person_timeline(p_person text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare uid uuid; vid text;
begin
  if p_person like 'visitor:%' then vid := substr(p_person, 9);
  else begin uid := p_person::uuid; exception when others then raise exception 'not_found'; end; end if;
  return jsonb_build_object(
    'account', (select jsonb_build_object('id', u.id, 'email', u.email, 'created_at', u.created_at, 'last_sign_in_at', u.last_sign_in_at,
        'email_confirmed_at', u.email_confirmed_at, 'banned_until', u.banned_until, 'role', coalesce(u.raw_app_meta_data->>'role', 'viewer'),
        'provider', u.raw_app_meta_data->>'provider')
      from auth.users u where u.id = uid),
    'visits', coalesce((select jsonb_agg(r order by r.created_at desc) from (
      select s.created_at, s.event, s.path, s.title, s.referrer_host, s.utm_source, s.session_id, s.visitor_id, s.user_id, s.new_visitor,
        s.country, s.region, s.city, s.ip_masked, s.browser, s.os, s.device, s.screen, s.language, s.timezone, s.duration_ms
      from public.site_visits s
      where (uid is not null and (s.user_id = uid or s.visitor_id in (select visitor_id from public.site_visits where user_id = uid)))
         or (vid is not null and s.visitor_id = vid)
      order by s.created_at desc limit 600) r), '[]'),
    'devices', coalesce((select jsonb_agg(r) from (
      select s.browser, s.os, s.device, s.screen, s.country, s.city, s.ip_masked, min(s.created_at) as first_seen, max(s.created_at) as last_seen, count(*) as hits
      from public.site_visits s
      where (uid is not null and (s.user_id = uid or s.visitor_id in (select visitor_id from public.site_visits where user_id = uid)))
         or (vid is not null and s.visitor_id = vid)
      group by 1, 2, 3, 4, 5, 6, 7 order by max(s.created_at) desc limit 30) r), '[]'),
    'logins', coalesce((select jsonb_agg(r) from (
      select a.created_at, a.payload->>'action' as action, a.ip_address from auth.audit_log_entries a
      where uid is not null and a.payload->>'actor_id' = uid::text order by a.created_at desc limit 100) r), '[]'),
    'events', coalesce((select jsonb_agg(r) from (
      select e.created_at, e.kind, e.action, e.resource, e.status, e.details from public.monitor_events e
      where uid is not null and (e.actor_id = uid::text or e.resource = uid::text or e.details->>'owner_id' = uid::text)
      order by e.created_at desc limit 200) r), '[]')
  );
end $$;

-- Visits are kept for 180 days; the rest of the monitoring retention is unchanged.
create or replace function public.prune_monitoring() returns void language sql security definer set search_path=public as $$
  delete from learning_presence where last_seen_at<now()-interval '1 day';
  delete from monitor_events where created_at<now()-interval '90 days' and kind in ('request','page','hosting','ai','uptime');
  delete from site_visits where created_at<now()-interval '180 days';
$$;

revoke all on function public.admin_user_activity(integer) from public, anon, authenticated;
revoke all on function public.admin_person_timeline(text) from public, anon, authenticated;
revoke all on function public.prune_monitoring() from public, anon, authenticated;
grant execute on function public.admin_user_activity(integer) to service_role;
grant execute on function public.admin_person_timeline(text) to service_role;
grant execute on function public.prune_monitoring() to service_role;

commit;
