-- User activities and the Overview's Live command centre: figures audited against the raw visit table (2026-10-28).
--
-- 1. Automated sessions are left out, as the Live visitor stream already does (lib/visit-quality.ts): a session whose
--    page view reports a headless screen (800x600, 0x0, 1x1), a POSIX locale, an "Etc/Unknown" zone or a desktop on
--    bare UTC, and beacons from loopback or private addresses. Before this the reports counted them as people, so
--    "Views, today" and the stream beside it disagreed.
-- 2. Top pages counted every row for a path, so each page_leave beacon (one per visible stretch) added to "views".
--    Views now count page views only, and avg_seconds is the time read per view (all of a view's stretches together),
--    not the average stretch.
-- 3. "On the site now" counted anyone with any beacon in the last 5 minutes, including the leave beacon of someone who
--    had just closed the tab, and missed a reader whose last beacon was older. It now uses the Live stream's rule
--    (lib/live-visits.ts, LIVE_MS): a page heartbeat in the last 100 seconds with no leave beacon after it, or a page
--    opened in the last 100 seconds and not yet left.
-- 4. "Bots filtered" counted beacons; it now counts sessions (crawler sessions plus the automated ones above).
--
-- admin_user_activity(p_days) now reports through admin_user_activity_since, so the two windows can never drift apart.

create or replace function public.admin_user_activity_since(p_since timestamptz)
returns jsonb language sql stable security definer set search_path = '' as $$
-- Never earlier than 90 days ago, the longest window admin_user_activity reports.
with win as (select greatest(p_since, now() - interval '90 days') as since),
-- Sessions that are not a person (see 1 above); judged by their page views, and the whole session goes.
auto as (
  select distinct s.session_id from public.site_visits s, win
  where s.created_at > win.since - interval '1 day' and (
    (s.event = 'page_view' and (s.screen in ('800x600', '0x0', '1x1') or s.language like '%@posix%' or s.timezone = 'Etc/Unknown'
      or (s.timezone in ('UTC', 'Etc/UTC') and s.device = 'Desktop')))
    or s.ip_masked ~* '^(::1|::ffff:127\.|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|fc|fd|fe80:)')),
linked as (select visitor_id, (array_agg(user_id order by created_at desc))[1] as user_id from public.site_visits where user_id is not null group by visitor_id),
v as (
  select s.*, coalesce(s.user_id, l.user_id) as person_user, coalesce(s.user_id::text, l.user_id::text, 'visitor:' || s.visitor_id) as person
  from public.site_visits s cross join win left join linked l on l.visitor_id = s.visitor_id
  where s.created_at > win.since and not s.is_bot and not exists (select 1 from auto a where a.session_id = s.session_id)),
views as (select * from v where event = 'page_view'),
sess as (select session_id, min(created_at) as started, max(created_at) as ended, count(*) filter (where event = 'page_view') as pages,
  coalesce(sum(duration_ms) filter (where event = 'page_leave'), 0) as engaged_ms from v group by session_id),
-- Who has a page open right now (see 3 above).
live as (
  select p.session_id, p.visitor_id, p.user_id from public.site_presence p
  where p.seen_at > now() - interval '100 seconds'
    and not exists (select 1 from public.site_visits l where l.event = 'page_leave' and l.session_id = p.session_id and l.path = p.path and l.created_at >= p.seen_at)
  union all
  select s.session_id, s.visitor_id, s.user_id from public.site_visits s
  where s.event = 'page_view' and not s.is_bot and s.created_at > now() - interval '100 seconds'
    and not exists (select 1 from public.site_visits l where l.event = 'page_leave' and l.session_id = s.session_id and l.path = s.path and l.created_at >= s.created_at)),
live_people as (select * from live where not exists (select 1 from auto a where a.session_id = live.session_id))
select jsonb_build_object(
  'totals', jsonb_build_object(
    'pageViews', (select count(*) from views),
    'visitors', (select count(distinct visitor_id) from views),
    'people', (select count(distinct person) from views),
    'sessions', (select count(*) from sess where pages > 0),
    'signedInUsers', (select count(distinct person_user) from views where person_user is not null),
    'newVisitors', (select count(distinct visitor_id) from views where new_visitor),
    'newAccounts', (select count(*) from auth.users, win where created_at > win.since),
    'liveNow', (select count(distinct visitor_id) from live_people),
    'liveSignedIn', (select count(distinct user_id) from live_people where user_id is not null),
    'bounceRate', (select round(100.0 * count(*) filter (where pages = 1) / nullif(count(*) filter (where pages > 0), 0), 1) from sess),
    'avgSessionSeconds', (select round(avg(greatest(extract(epoch from ended - started), engaged_ms / 1000.0))) from sess where pages > 0),
    'pagesPerSession', (select round(avg(pages), 2) from sess where pages > 0),
    'bots', (select count(distinct s.session_id) from public.site_visits s, win where s.created_at > win.since and (s.is_bot or s.session_id in (select session_id from auto)))),
  'daily', coalesce((select jsonb_agg(r order by r.day) from (
    select (created_at at time zone 'Asia/Kolkata')::date as day, count(*) as views, count(distinct visitor_id) as visitors,
      count(distinct visitor_id) filter (where new_visitor) as new_visitors, count(distinct person_user) as users
    from views group by 1) r), '[]'),
  'hours', coalesce((select jsonb_agg(r order by r.hour) from (
    select extract(hour from created_at at time zone 'Asia/Kolkata')::int as hour, count(*) as views from views group by 1) r), '[]'),
  'pages', coalesce((select jsonb_agg(r) from (select path, count(*) filter (where event = 'page_view') as views,
    count(distinct visitor_id) filter (where event = 'page_view') as visitors,
    round(coalesce(sum(duration_ms) filter (where event = 'page_leave'), 0) / 1000.0 / count(*) filter (where event = 'page_view')) as avg_seconds
    from v group by path having count(*) filter (where event = 'page_view') > 0 order by 2 desc, 3 desc limit 15) r), '[]'),
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
      count(*) filter (where v.event = 'page_view') as views, count(distinct v.session_id) filter (where v.event = 'page_view') as sessions,
      round(coalesce(sum(v.duration_ms) filter (where v.event = 'page_leave'), 0) / 1000.0) as engaged_seconds,
      (array_agg(v.path order by v.created_at desc))[1] as last_path,
      (array_agg(v.country order by v.created_at desc))[1] as country, (array_agg(v.city order by v.created_at desc))[1] as city,
      (array_agg(v.device order by v.created_at desc))[1] as device, (array_agg(v.browser order by v.created_at desc))[1] as browser,
      (array_agg(v.os order by v.created_at desc))[1] as os
    from v left join auth.users u on u.id = v.person_user
    group by v.person, u.id, u.email, u.created_at having count(*) filter (where v.event = 'page_view') > 0
    order by max(v.created_at) desc limit 400) r), '[]'),
  'recent', coalesce((select jsonb_agg(r order by r.created_at desc) from (
    select v.created_at, v.event, v.person, v.person_user as user_id, u.email, v.visitor_id, v.session_id, v.new_visitor, v.path, v.title, v.referrer_host,
      v.utm_source, v.country, v.region, v.city, v.ip_masked, v.browser, v.os, v.device, v.language, v.timezone, v.screen, v.duration_ms
    from v left join auth.users u on u.id = v.person_user order by v.created_at desc limit 500) r), '[]')
);
$$;

create or replace function public.admin_user_activity(p_days integer default 7)
returns jsonb language sql stable security definer set search_path = '' as $$
  select public.admin_user_activity_since(now() - make_interval(days => least(greatest(p_days, 1), 90)));
$$;

-- The Audience explorer's full lists, with the same two corrections: automated sessions left out, and avg_seconds
-- (per page and per country) as time read per page view rather than per visible stretch.
create or replace function public.admin_activity_breakdowns(p_days integer default 7)
returns jsonb language sql stable security definer set search_path = '' as $$
with win as (select now() - make_interval(days => least(greatest(p_days, 1), 90)) as since),
auto as (
  select distinct s.session_id from public.site_visits s, win
  where s.created_at > win.since - interval '1 day' and (
    (s.event = 'page_view' and (s.screen in ('800x600', '0x0', '1x1') or s.language like '%@posix%' or s.timezone = 'Etc/Unknown'
      or (s.timezone in ('UTC', 'Etc/UTC') and s.device = 'Desktop')))
    or s.ip_masked ~* '^(::1|::ffff:127\.|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|fc|fd|fe80:)')),
linked as (select visitor_id, (array_agg(user_id order by created_at desc))[1] as user_id from public.site_visits where user_id is not null group by visitor_id),
v as (
  select s.*, coalesce(s.user_id, l.user_id) as person_user
  from public.site_visits s cross join win left join linked l on l.visitor_id = s.visitor_id
  where s.created_at > win.since and not s.is_bot and not exists (select 1 from auto a where a.session_id = s.session_id)),
views as (select * from v where event = 'page_view'),
country_reads as (select coalesce(country, 'Unknown') as country,
  round(coalesce(sum(duration_ms) filter (where event = 'page_leave'), 0) / 1000.0 / nullif(count(*) filter (where event = 'page_view'), 0)) as avg_seconds
  from v group by 1)
select jsonb_build_object(
  'totals', jsonb_build_object('visitors', (select count(distinct visitor_id) from views), 'views', (select count(*) from views)),
  'countries', coalesce((select jsonb_agg(r order by r.visitors desc, r.views desc) from (
    select c.*, cr.avg_seconds from (
      select coalesce(country, 'Unknown') as country, count(distinct visitor_id) as visitors, count(*) as views,
        count(distinct session_id) as sessions, count(distinct person_user) as signed_in,
        count(distinct visitor_id) filter (where new_visitor) as new_visitors,
        count(distinct nullif(city, '')) as cities, count(distinct nullif(region, '')) as regions, max(created_at) as last_seen
      from views group by 1 order by 2 desc limit 1000) c
    left join country_reads cr on cr.country = c.country) r), '[]'),
  'cities', coalesce((select jsonb_agg(r order by r.visitors desc, r.views desc) from (
    select coalesce(city, 'Unknown') as city, coalesce(region, '') as region, coalesce(country, '') as country,
      count(distinct visitor_id) as visitors, count(*) as views, count(distinct person_user) as signed_in,
      count(distinct visitor_id) filter (where new_visitor) as new_visitors, max(created_at) as last_seen
    from views group by 1, 2, 3 order by 4 desc limit 1000) r), '[]'),
  'pages', coalesce((select jsonb_agg(r order by r.views desc) from (
    select path, max(title) as title, count(*) filter (where event = 'page_view') as views,
      count(distinct visitor_id) filter (where event = 'page_view') as visitors,
      count(distinct person_user) filter (where event = 'page_view') as signed_in,
      round(coalesce(sum(duration_ms) filter (where event = 'page_leave'), 0) / 1000.0 / count(*) filter (where event = 'page_view')) as avg_seconds,
      max(created_at) as last_seen
    from v group by path having count(*) filter (where event = 'page_view') > 0 order by 3 desc limit 1000) r), '[]'),
  'referrers', coalesce((select jsonb_agg(r order by r.views desc) from (
    select coalesce(referrer_host, 'Direct / none') as referrer, count(*) as views, count(distinct visitor_id) as visitors,
      count(distinct person_user) as signed_in, count(distinct visitor_id) filter (where new_visitor) as new_visitors, max(created_at) as last_seen
    from views group by 1 order by 2 desc limit 1000) r), '[]'));
$$;

revoke all on function public.admin_activity_breakdowns(integer) from public, anon, authenticated;
grant execute on function public.admin_activity_breakdowns(integer) to service_role;
revoke all on function public.admin_user_activity_since(timestamptz) from public, anon, authenticated;
grant execute on function public.admin_user_activity_since(timestamptz) to service_role;
revoke all on function public.admin_user_activity(integer) from public, anon, authenticated;
grant execute on function public.admin_user_activity(integer) to service_role;
