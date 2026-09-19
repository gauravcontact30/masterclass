-- Super admin: learner support, generation queue control, announcements and
-- learning insights. Every function is callable by service_role only — the
-- verified super-admin API routes — and every mutation writes its audit event
-- in the same transaction as the change, so a change never lands unrecorded.
begin;

-- ---------------------------------------------------------------- announcements
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 3 and 120),
  body text not null check (length(body) between 3 and 600),
  tone text not null default 'info' check (tone in ('info','success','warning','maintenance')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  active boolean not null default true,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_window check (ends_at is null or ends_at > starts_at)
);
create index announcements_live on public.announcements(active, starts_at desc);
-- Learners receive announcements through a server route, never the Data API.
alter table public.announcements enable row level security;
revoke all on public.announcements from anon, authenticated;
grant select, insert, update, delete on public.announcements to service_role;
create trigger monitor_changes after insert or update or delete on public.announcements
  for each row execute function public.monitor_change();

-- -------------------------------------------------------------- learner support
-- One learner, everything support needs to answer "what happened to my account?".
-- Definer because it reads auth.users; search_path is empty so every name is qualified.
create function public.admin_learner(p_user uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
select jsonb_build_object(
  'account', (select jsonb_build_object('id', u.id, 'email', u.email, 'created_at', u.created_at, 'last_sign_in_at', u.last_sign_in_at,
      'email_confirmed_at', u.email_confirmed_at, 'banned_until', u.banned_until, 'role', coalesce(u.raw_app_meta_data->>'role', 'viewer'))
    from auth.users u where u.id = p_user),
  'profile', (select jsonb_build_object('name', p.name, 'language', p.language, 'credit_balance', p.credit_balance, 'created_at', p.created_at)
    from public.profiles p where p.id = p_user::text),
  'subscription', (select to_jsonb(s) from public.subscriptions s where s.user_id = p_user::text),
  'usage', jsonb_build_object(
    'period', date_trunc('month', now() at time zone 'UTC')::date,
    'used', coalesce((select up.used from public.usage_periods up where up.user_id = p_user::text and up.period = date_trunc('month', now() at time zone 'UTC')::date), 0)),
  'documents', jsonb_build_object(
    'byStatus', coalesce((select jsonb_object_agg(status, total) from (select d.status, count(*) as total from public.documents d where d.user_id = p_user::text group by d.status) s), '{}'),
    'recent', coalesce((select jsonb_agg(r) from (select d.id, d.title, d.status, d.error_code, d.attempts, d.used_credit, d.created_at
      from public.documents d where d.user_id = p_user::text order by d.created_at desc limit 20) r), '[]')),
  'progress', (select jsonb_build_object('started', count(*), 'completed', count(*) filter (where lp.completed), 'last_active', max(lp.updated_at))
    from public.learning_progress lp where lp.user_id = p_user::text),
  'sessions', (select count(*) from auth.sessions s where s.user_id = p_user and (s.not_after is null or s.not_after > now())),
  'reports', coalesce((select jsonb_agg(r) from (select cr.id, cr.path, cr.reason, cr.status, cr.created_at
    from public.content_reports cr where cr.user_id = p_user::text order by cr.created_at desc limit 20) r), '[]'),
  'history', coalesce((select jsonb_agg(r) from (select e.created_at, e.kind, e.action, e.resource, e.details
    from public.monitor_events e
    where e.kind in ('admin', 'audit') and (e.resource = p_user::text or e.details->>'owner_id' = p_user::text or e.details->>'record_id' = p_user::text)
    order by e.created_at desc limit 50) r), '[]')
);
$$;

-- Grant or take back download credits. The balance can never go negative.
create function public.admin_adjust_credits(p_user text, p_delta integer, p_actor text, p_reason text) returns integer
language plpgsql set search_path = public as $$
declare balance integer;
begin
  if p_delta = 0 or abs(p_delta) > 100 then raise exception 'invalid_delta'; end if;
  update profiles set credit_balance = credit_balance + p_delta
    where id = p_user and credit_balance + p_delta >= 0 returning credit_balance into balance;
  if not found then
    if exists (select 1 from profiles where id = p_user) then raise exception 'insufficient_credits'; end if;
    raise exception 'not_found';
  end if;
  insert into monitor_events(kind, actor_id, resource, action, details)
    values ('admin', p_actor, p_user, 'credits_adjusted', jsonb_build_object('delta', p_delta, 'balance', balance, 'reason', p_reason, 'owner_id', p_user));
  return balance;
end $$;

-- Give back this month's generation allowance, e.g. after a platform fault.
create function public.admin_reset_usage(p_user text, p_actor text, p_reason text) returns integer
language plpgsql set search_path = public as $$
declare previous integer; month_start date := date_trunc('month', now() at time zone 'UTC')::date;
begin
  if not exists (select 1 from profiles where id = p_user) then raise exception 'not_found'; end if;
  select used into previous from usage_periods where user_id = p_user and period = month_start for update;
  previous := coalesce(previous, 0);
  update usage_periods set used = 0 where user_id = p_user and period = month_start;
  insert into monitor_events(kind, actor_id, resource, action, details)
    values ('admin', p_actor, p_user, 'usage_reset', jsonb_build_object('period', month_start, 'previous', previous, 'reason', p_reason, 'owner_id', p_user));
  return previous;
end $$;

-- Sign a learner out everywhere. Deleting sessions cascades to their refresh
-- tokens, so no session can be renewed; an access token already issued stays
-- valid until it expires (the project's JWT expiry, one hour by default).
create function public.admin_revoke_sessions(p_user uuid, p_actor text, p_reason text) returns integer
language plpgsql security definer set search_path = '' as $$
declare removed integer;
begin
  if not exists (select 1 from auth.users where id = p_user) then raise exception 'not_found'; end if;
  delete from auth.sessions where user_id = p_user;
  get diagnostics removed = row_count;
  insert into public.monitor_events(kind, actor_id, resource, action, details)
    values ('admin', p_actor, p_user::text, 'sessions_revoked', jsonb_build_object('sessions', removed, 'reason', p_reason, 'owner_id', p_user::text));
  return removed;
end $$;

-- ------------------------------------------------------------- generation queue
create function public.admin_queue() returns jsonb
language sql stable set search_path = public as $$
select jsonb_build_object(
  'counts', coalesce((select jsonb_object_agg(status, total) from (select status, count(*) as total from documents group by status) s), '{}'),
  'oldestQueuedSeconds', (select extract(epoch from now() - min(created_at))::integer from documents where status = 'queued'),
  -- A generating job whose lease ran out: its worker died. claim_document picks
  -- it up again on the next worker tick, or fails and refunds it after 3 tries.
  'expiredLeases', (select count(*) from documents where status = 'generating' and lease_until < now()),
  'failuresByCode', coalesce((select jsonb_agg(r) from (select coalesce(error_code, 'unknown') as error_code, count(*) as failures, max(created_at) as last_seen
    from documents where status = 'failed' and created_at > now() - interval '30 days' group by 1 order by 2 desc) r), '[]'),
  'failed', coalesce((select jsonb_agg(r) from (select id, title, user_id, error_code, attempts, used_credit, refunded, created_at
    from documents where status = 'failed' order by created_at desc limit 100) r), '[]'),
  'inFlight', coalesce((select jsonb_agg(r) from (select id, title, user_id, status, attempts, available_at, lease_until, created_at
    from documents where status in ('queued', 'generating') order by created_at limit 100) r), '[]')
);
$$;

-- Put a failed generation back in the queue. `refunded` is left set: the learner
-- was already refunded when it failed, so if the retry fails too they are not
-- refunded a second time, and if it succeeds the retry was on the house.
create function public.admin_retry_document(p_id uuid, p_actor text, p_reason text) returns text
language plpgsql set search_path = public as $$
declare item documents;
begin
  select * into item from documents where id = p_id for update;
  if not found then raise exception 'not_found'; end if;
  if item.status <> 'failed' then raise exception 'not_failed'; end if;
  -- documents_reuse allows one non-failed copy per request; the learner may have made one since.
  if exists (select 1 from documents where user_id = item.user_id and cache_key = item.cache_key and status <> 'failed' and id <> p_id) then
    raise exception 'duplicate_active';
  end if;
  update documents set status = 'queued', attempts = 0, error_code = null, lease = null, lease_until = null, available_at = now() where id = p_id;
  insert into monitor_events(kind, actor_id, resource, action, details)
    values ('admin', p_actor, p_id::text, 'document_retried', jsonb_build_object('owner_id', item.user_id, 'previous_error', item.error_code, 'reason', p_reason));
  return 'queued';
end $$;

-- ------------------------------------------------------------- learning insights
create function public.admin_insights(p_days integer default 30) returns jsonb
language sql stable security definer set search_path = '' as $$
with win as (select now() - make_interval(days => least(greatest(p_days, 1), 90)) as since)
select jsonb_build_object(
  'learners', jsonb_build_object(
    'total', (select count(*) from auth.users),
    'new', (select count(*) from auth.users, win where created_at > win.since),
    -- Active means they generated something or moved through a guide.
    'active7', (select count(distinct user_id) from (
      select user_id from public.learning_progress where updated_at > now() - interval '7 days'
      union all select user_id from public.documents where created_at > now() - interval '7 days') a),
    'active30', (select count(distinct user_id) from (
      select user_id from public.learning_progress where updated_at > now() - interval '30 days'
      union all select user_id from public.documents where created_at > now() - interval '30 days') a)),
  'plans', jsonb_build_object(
    'monthly', (select count(*) from public.subscriptions where status = 'active' and tier = 'monthly' and current_period_end > now()),
    'yearly', (select count(*) from public.subscriptions where status = 'active' and tier = 'yearly' and current_period_end > now())),
  'credits', jsonb_build_object(
    'outstanding', (select coalesce(sum(credit_balance), 0) from public.profiles),
    'holders', (select count(*) from public.profiles where credit_balance > 0)),
  'progress', (select jsonb_build_object('started', count(*), 'completed', count(*) filter (where completed)) from public.learning_progress),
  'signups', coalesce((select jsonb_agg(r order by r.day) from (select date_trunc('day', created_at)::date as day, count(*) as signups
    from auth.users, win where created_at > win.since group by 1) r), '[]'),
  'generations', coalesce((select jsonb_agg(r order by r.day) from (select date_trunc('day', created_at)::date as day, count(*) as requested,
      count(*) filter (where status = 'ready') as ready, count(*) filter (where status = 'failed') as failed
    from public.documents, win where created_at > win.since group by 1) r), '[]'),
  'technologies', coalesce((select jsonb_agg(r) from (
    select coalesce(t.title, d.request->>'technologyId', 'Other') as technology, count(*) as documents, count(distinct d.user_id) as learners
    from public.documents d cross join win left join public.technologies t on t.id = d.request->>'technologyId'
    where d.created_at > win.since group by 1 order by 2 desc limit 15) r), '[]')
);
$$;

-- Only the verified super-admin routes (service_role) may call any of this.
revoke all on function public.admin_learner(uuid) from public, anon, authenticated;
revoke all on function public.admin_adjust_credits(text, integer, text, text) from public, anon, authenticated;
revoke all on function public.admin_reset_usage(text, text, text) from public, anon, authenticated;
revoke all on function public.admin_revoke_sessions(uuid, text, text) from public, anon, authenticated;
revoke all on function public.admin_queue() from public, anon, authenticated;
revoke all on function public.admin_retry_document(uuid, text, text) from public, anon, authenticated;
revoke all on function public.admin_insights(integer) from public, anon, authenticated;
grant execute on function public.admin_learner(uuid) to service_role;
grant execute on function public.admin_adjust_credits(text, integer, text, text) to service_role;
grant execute on function public.admin_reset_usage(text, text, text) to service_role;
grant execute on function public.admin_revoke_sessions(uuid, text, text) to service_role;
grant execute on function public.admin_queue() to service_role;
grant execute on function public.admin_retry_document(uuid, text, text) to service_role;
grant execute on function public.admin_insights(integer) to service_role;

commit;
