-- The Super Admin Live command centre counts "today" from midnight IST, so every card starts fresh each day instead
-- of rolling over the last 24 hours. admin_user_activity_since is admin_user_activity (0023) with its window opening
-- at a given instant (the API passes today's 00:00 Asia/Kolkata); the report itself is unchanged.
-- Additive and safe to run more than once. Until it is applied, the dashboard keeps the rolling 24 h window.

create or replace function public.admin_user_activity_since(p_since timestamptz) returns jsonb
language sql stable security definer set search_path = '' as $$
-- Never earlier than 90 days ago, the longest window admin_user_activity reports.
with win as (select greatest(p_since, now() - interval '90 days') as since),
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

revoke all on function public.admin_user_activity_since(timestamptz) from public, anon, authenticated;
grant execute on function public.admin_user_activity_since(timestamptz) to service_role;
