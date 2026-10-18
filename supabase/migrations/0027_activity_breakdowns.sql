-- Super admin → User activities → Audience explorer: complete (not top-12) breakdowns by country, city, page
-- and traffic source for one reporting window, with richer per-row figures. Same window, bot exclusion and
-- visitor→account linking as admin_user_activity (0023). Additive and idempotent; the dashboard falls back to
-- 0023's top-12 lists until this is applied.
begin;

create or replace function public.admin_activity_breakdowns(p_days integer default 7) returns jsonb
language sql stable security definer set search_path = '' as $$
with win as (select now() - make_interval(days => least(greatest(p_days, 1), 90)) as since),
linked as (select visitor_id, (array_agg(user_id order by created_at desc))[1] as user_id from public.site_visits where user_id is not null group by visitor_id),
v as (
  select s.*, coalesce(s.user_id, l.user_id) as person_user
  from public.site_visits s cross join win left join linked l on l.visitor_id = s.visitor_id
  where s.created_at > win.since and not s.is_bot),
views as (select * from v where event = 'page_view'),
leaves as (select * from v where event = 'page_leave' and duration_ms is not null),
country_reads as (select coalesce(country, 'Unknown') as country, round(avg(duration_ms) / 1000.0) as avg_seconds from leaves group by 1)
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
      round(avg(duration_ms) filter (where event = 'page_leave') / 1000.0) as avg_seconds, max(created_at) as last_seen
    from v group by path having count(*) filter (where event = 'page_view') > 0 order by 3 desc limit 1000) r), '[]'),
  'referrers', coalesce((select jsonb_agg(r order by r.views desc) from (
    select coalesce(referrer_host, 'Direct / none') as referrer, count(*) as views, count(distinct visitor_id) as visitors,
      count(distinct person_user) as signed_in, count(distinct visitor_id) filter (where new_visitor) as new_visitors, max(created_at) as last_seen
    from views group by 1 order by 2 desc limit 1000) r), '[]'));
$$;
revoke all on function public.admin_activity_breakdowns(integer) from public, anon, authenticated;
grant execute on function public.admin_activity_breakdowns(integer) to service_role;

notify pgrst, 'reload schema';
commit;
