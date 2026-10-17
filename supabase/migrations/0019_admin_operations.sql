-- Idempotent: safe to run again where already applied (tables and indexes "if not exists"; functions and
-- triggers "create or replace"; grants and revokes repeat harmlessly).
-- StockersAI-inspired operations adapted to MasterClass's verified-owner authorization.
begin;
create table if not exists public.learning_presence (
  user_id text not null, session_id uuid not null, path text not null,
  device text not null, started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(), primary key(user_id,session_id)
);
create index if not exists learning_presence_seen on public.learning_presence(last_seen_at desc);
create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(), user_id text not null,
  path text not null, reason text not null check(reason in ('incorrect','inappropriate','spam','broken')),
  description text not null check(length(description) between 10 and 2000),
  status text not null default 'open' check(status in ('open','reviewing','resolved','dismissed')),
  resolution text, reviewed_by text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists content_reports_status on public.content_reports(status,created_at desc);
alter table public.learning_presence enable row level security;
alter table public.content_reports enable row level security;
revoke all on public.learning_presence,public.content_reports from anon,authenticated;
grant select,insert,update,delete on public.learning_presence to service_role;
grant select,insert,update on public.content_reports to service_role;
create or replace trigger monitor_changes after insert or update or delete on public.content_reports for each row execute function public.monitor_change();

create or replace function public.super_admin_operations(p_days integer default 30) returns jsonb
language sql security definer set search_path=public as $$
with activity as (select * from monitor_events where created_at > now()-make_interval(days=>least(greatest(p_days,1),90)))
select jsonb_build_object(
 'liveCount',(select count(distinct user_id) from learning_presence where last_seen_at>now()-interval '90 seconds'),
 'live',coalesce((select jsonb_agg(r) from (select p.*,u.email from learning_presence p left join auth.users u on u.id::text=p.user_id where p.last_seen_at>now()-interval '90 seconds' order by last_seen_at desc limit 200) r),'[]'),
 'traffic',coalesce((select jsonb_agg(r) from (select date_trunc('day',created_at) as day,count(*) as views,count(distinct actor_id) as learners,round(avg(duration_ms)) as load_ms from activity where kind='page' group by 1 order by 1 desc) r),'[]'),
 'pages',coalesce((select jsonb_agg(r) from (select resource as path,count(*) as views,count(distinct actor_id) as learners,round(avg(duration_ms)) as load_ms from activity where kind='page' group by resource order by views desc limit 100) r),'[]'),
 'ai',coalesce((select jsonb_agg(r) from (select resource as feature,details->>'model' as model,count(*) as calls,count(*) filter(where status>=400) as failures,round(avg(duration_ms)) as latency_ms,sum((details->>'input_tokens')::bigint) as input_tokens,sum((details->>'output_tokens')::bigint) as output_tokens from activity where kind='ai' group by resource,details->>'model' order by calls desc) r),'[]'),
 'reports',coalesce((select jsonb_agg(r) from (select * from content_reports order by created_at desc limit 200) r),'[]'),
 'openReports',(select count(*) from content_reports where status in ('open','reviewing')),
 'hosting',coalesce((select jsonb_agg(r) from (select created_at,resource,action,status,duration_ms,details from activity where kind='hosting' order by created_at desc limit 200) r),'[]'),
 'uptime',coalesce((select jsonb_agg(r) from (select created_at,resource,status,duration_ms,details from activity where kind='uptime' order by created_at desc limit 200) r),'[]'),
 'availability',jsonb_build_object('samples',(select count(*) from activity where kind='uptime'),'percent',(select round(100.0*count(*) filter(where status between 200 and 299)/nullif(count(*),0),2) from activity where kind='uptime'),'lastSample',(select max(created_at) from activity where kind='uptime')),
 'alerts',coalesce((select jsonb_agg(r) from (select resource,count(*) as failures,max(created_at) as last_seen from activity where status>=500 and created_at>now()-interval '15 minutes' group by resource having count(*)>=3 order by failures desc limit 50) r),'[]'),
 'security',coalesce((select jsonb_agg(r) from (select resource,status,count(*) as attempts,max(created_at) as last_seen from activity where kind='request' and status in (401,403,429) group by resource,status order by attempts desc limit 100) r),'[]')
);
$$;
revoke all on function public.super_admin_operations(integer) from public,anon,authenticated;
grant execute on function public.super_admin_operations(integer) to service_role;
create or replace function public.prune_monitoring() returns void language sql security definer set search_path=public as $$
  delete from learning_presence where last_seen_at<now()-interval '1 day';
  delete from monitor_events where created_at<now()-interval '90 days' and kind in ('request','page','hosting','ai','uptime');
$$;
revoke all on function public.prune_monitoring() from public,anon,authenticated;
grant execute on function public.prune_monitoring() to service_role;
commit;
