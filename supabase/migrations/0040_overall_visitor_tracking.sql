-- Aggregate in PostgreSQL: totals include all retained rows, without a browser/API row cap.
begin;
create or replace function public.overall_visitor_tracking() returns jsonb
language sql stable security definer set search_path = '' as $$
with views as materialized (
  select * from public.site_visits
  where event = 'page_view' and not is_bot and created_at <= now()
    and path !~ '^/(dashboard/)?super-admin(/|$)' and path !~ '^/api/'
), totals as (
  select count(*) as views, count(distinct visitor_id) as visitors,
    count(distinct (visitor_id, session_id)) as sessions,
    count(distinct user_id) as accounts,
    count(distinct visitor_id) filter (where created_at > now() - interval '5 minutes') as recent,
    min(created_at) as first, max(created_at) as latest from views
)
select jsonb_build_object(
  'totals', (select row_to_json(totals) from totals),
  'daily', coalesce((select jsonb_agg(r order by r.day desc) from (
    select (created_at at time zone 'Asia/Kolkata')::date as day,
      count(*) as views, count(distinct visitor_id) as visitors,
      count(distinct (visitor_id,session_id)) as sessions from views group by 1
  ) r), '[]'::jsonb),
  'pages', coalesce((select jsonb_agg(r order by r.views desc, r.path) from (
    select path, count(*) as views, count(distinct visitor_id) as visitors
    from views group by path order by views desc, path limit 50
  ) r), '[]'::jsonb),
  'sources', coalesce((select jsonb_agg(r order by r.views desc, r.source) from (
    select coalesce(nullif(lower(btrim(utm_source)),''), nullif(lower(btrim(referrer_host)),''), 'Direct / unknown') as source,
      count(*) as views, count(distinct visitor_id) as visitors
    from views group by 1 order by views desc, source limit 50
  ) r), '[]'::jsonb),
  'countries', coalesce((select jsonb_agg(r order by r.views desc, r.country) from (
    select coalesce(nullif(country,''),'Unknown') as country,
      count(*) as views, count(distinct visitor_id) as visitors
    from views group by 1 order by views desc, country limit 50
  ) r), '[]'::jsonb),
  'generatedAt', now()
);
$$;
revoke all on function public.overall_visitor_tracking() from public, anon, authenticated;
grant execute on function public.overall_visitor_tracking() to service_role;

-- A single database lookup replaces a remote auth request per visitor on every refresh.
create or replace function public.promotion_visitor_emails(p_ids uuid[]) returns table(id uuid, email text)
language sql stable security definer set search_path = '' as $$
  select u.id, u.email::text from auth.users u where u.id = any(p_ids);
$$;
revoke all on function public.promotion_visitor_emails(uuid[]) from public, anon, authenticated;
grant execute on function public.promotion_visitor_emails(uuid[]) to service_role;
commit;
