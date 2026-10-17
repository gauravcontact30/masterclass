-- Idempotent: safe to run again where already applied (tables and indexes "if not exists"; functions and
-- triggers "create or replace"; grants and revokes repeat harmlessly).
-- Private monitoring data: only server-side, verified super-admin routes can read it.
create table if not exists public.monitor_events (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
  kind text not null, actor_id text, resource text, action text not null,
  status integer, duration_ms numeric, bytes bigint, details jsonb not null default '{}'
);
create index if not exists monitor_events_time on public.monitor_events(created_at desc);
create index if not exists monitor_events_kind_time on public.monitor_events(kind,created_at desc);
alter table public.monitor_events enable row level security;
revoke all on public.monitor_events from anon, authenticated;
grant select, insert on public.monitor_events to service_role;

create table if not exists public.billing_ledger (
  event_id text primary key, created_at timestamptz not null default now(),
  event text not null, entity_id text, subscription_ref text, user_id text,
  amount bigint, currency text, invoice_id text
);
alter table public.billing_ledger enable row level security;
revoke all on public.billing_ledger from anon, authenticated;
grant select, insert, update on public.billing_ledger to service_role;

-- Record keys and changed column names, never credentials, document bodies or payment secrets.
create or replace function public.monitor_change() returns trigger language plpgsql security definer set search_path=public as $$
declare before_row jsonb; after_row jsonb; row_data jsonb; changed jsonb;
begin
  before_row := case when tg_op <> 'INSERT' then to_jsonb(old) else '{}'::jsonb end;
  after_row := case when tg_op <> 'DELETE' then to_jsonb(new) else '{}'::jsonb end;
  row_data := case when tg_op='DELETE' then before_row else after_row end;
  select coalesce(jsonb_agg(key), '[]') into changed from jsonb_each(row_data) where before_row->key is distinct from after_row->key;
  insert into monitor_events(kind,actor_id,resource,action,details) values
    ('audit',auth.jwt()->>'sub',tg_table_name,lower(tg_op),jsonb_build_object('record_id',coalesce(row_data->>'id',row_data->>'user_id',row_data->>'event_id'),'owner_id',row_data->>'user_id','changed_fields',changed,'source',case when auth.jwt()->>'sub' is null then 'service/database' else 'authenticated' end));
  return coalesce(new,old);
end $$;
revoke all on function public.monitor_change() from public,anon,authenticated;
do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname='public' and tablename not in ('monitor_events','billing_ledger','rate_limits','oauth_states') loop
    execute format('create or replace trigger monitor_changes after insert or update or delete on public.%I for each row execute function public.monitor_change()',t);
  end loop;
end $$;

create or replace function public.monitor_auth_change() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if old.raw_app_meta_data->>'role' is distinct from new.raw_app_meta_data->>'role' or old.banned_until is distinct from new.banned_until then
    insert into monitor_events(kind,actor_id,resource,action,details) values ('audit',auth.jwt()->>'sub','auth.users','access_changed',jsonb_build_object('record_id',new.id,'previous_role',old.raw_app_meta_data->>'role','role',new.raw_app_meta_data->>'role','banned_until',new.banned_until));
  end if;
  return new;
end $$;
revoke all on function public.monitor_auth_change() from public,anon,authenticated;
create or replace trigger monitor_auth_access after update on auth.users for each row execute function public.monitor_auth_change();

-- Auth-owned fields are projected explicitly. Never return tokens, passwords or raw metadata.
create or replace function public.super_admin_snapshot(p_days integer default 30) returns jsonb
language sql security definer set search_path=public as $$
select jsonb_build_object(
 'counts',jsonb_build_object('users',(select count(*) from auth.users),'documents',(select count(*) from documents),'activeSubscriptions',(select count(*) from subscriptions where status='active' and current_period_end>now()),'failedDocuments',(select count(*) from documents where status='failed')),
 'users',coalesce((select jsonb_agg(r) from (select id,email,created_at,last_sign_in_at,email_confirmed_at,banned_until,coalesce(raw_app_meta_data->>'role','viewer') as role from auth.users order by created_at desc limit 200) r),'[]'),
 'sessions',coalesce((select jsonb_agg(r) from (select id,user_id,created_at,updated_at,not_after,ip::text,user_agent from auth.sessions where (not_after is null or not_after>now()) order by updated_at desc nulls last limit 200) r),'[]'),
 'logins',coalesce((select jsonb_agg(r) from (select id,created_at,ip_address,payload->>'action' as action,payload->>'actor_id' as actor_id from auth.audit_log_entries where created_at>now()-make_interval(days=>least(greatest(p_days,1),90)) order by created_at desc limit 200) r),'[]'),
 'subscriptions',coalesce((select jsonb_agg(r) from (select * from subscriptions order by synced_at desc limit 200) r),'[]'),
 'recurring',jsonb_build_object('monthly',(select count(*) from subscriptions where status='active' and tier='monthly' and current_period_end>now()),'yearly',(select count(*) from subscriptions where status='active' and tier='yearly' and current_period_end>now())),
 'billing',coalesce((select jsonb_agg(r) from (select * from billing_ledger where created_at>now()-make_interval(days=>least(greatest(p_days,1),90)) order by created_at desc limit 200) r),'[]'),
 'revenue',coalesce((select jsonb_agg(r) from (select currency,coalesce(sum(amount) filter(where event='payment.captured'),0) as gross,coalesce(sum(amount) filter(where event='refund.processed'),0) as refunds,count(*) filter(where event='payment.failed') as failed from (select distinct on (entity_id,event) * from billing_ledger where created_at>now()-make_interval(days=>least(greatest(p_days,1),90)) order by entity_id,event,created_at) payments group by currency) r),'[]'),
 'events',coalesce((select jsonb_agg(r) from (select * from monitor_events where created_at>now()-make_interval(days=>least(greatest(p_days,1),90)) order by created_at desc limit 200) r),'[]'),
 'requests',jsonb_build_object('count',(select count(*) from monitor_events where kind='request' and created_at>now()-make_interval(days=>least(greatest(p_days,1),90))),'errors',(select count(*) from monitor_events where kind='request' and status>=500 and created_at>now()-make_interval(days=>least(greatest(p_days,1),90))),'p95',(select percentile_cont(0.95) within group(order by duration_ms) from monitor_events where kind='request' and created_at>now()-make_interval(days=>least(greatest(p_days,1),90)))),
 'documents',coalesce((select jsonb_agg(r) from (select id,user_id,title,status,error_code,created_at from documents order by created_at desc limit 200) r),'[]'),
 'integrations',coalesce((select jsonb_agg(r) from (select user_id,provider,expires_at from integration_connections order by expires_at desc limit 200) r),'[]')
);
$$;
revoke all on function public.super_admin_snapshot(integer) from public,anon,authenticated;
grant execute on function public.super_admin_snapshot(integer) to service_role;
