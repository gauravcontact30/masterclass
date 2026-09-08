-- Additive initial schema. Apply to a new or reviewed Supabase project.
create table public.profiles (id text primary key, language text not null default 'en' check(language in ('en','hi')), created_at timestamptz not null default now());
create table public.technologies (id text primary key, title text not null, title_hi text not null, category text not null);
create table public.topics (id text primary key, technology_id text not null references public.technologies, title text not null, title_hi text not null, full_track boolean not null default false, version integer not null default 1, "references" jsonb not null default '[]');
create table public.subscriptions (user_id text primary key references public.profiles, provider_ref text unique not null, tier text not null check(tier in ('monthly','yearly')), status text not null, current_period_end timestamptz, grace_until timestamptz, synced_at timestamptz not null default now(), cancel_at_cycle_end boolean not null default false);
create table public.usage_periods (user_id text references public.profiles, period date not null, used integer not null default 0 check(used>=0), primary key(user_id,period));
create table public.documents (id uuid primary key default gen_random_uuid(), user_id text not null references public.profiles, title text not null, request jsonb not null, cache_key text not null, status text not null default 'queued' check(status in ('queued','generating','ready','failed')), period date not null, attempts integer not null default 0, lease uuid, lease_until timestamptz, available_at timestamptz not null default now(), refunded boolean not null default false, error_code text, curriculum jsonb, storage_path text, preview_paths jsonb not null default '[]', page_titles jsonb not null default '[]', created_at timestamptz not null default now());
create unique index documents_reuse on public.documents(user_id,cache_key) where status <> 'failed';
create index documents_owner_created on public.documents(user_id,created_at desc);
create index documents_queue on public.documents(status,available_at);
create table public.learning_progress (user_id text not null references public.profiles, document_id uuid not null references public.documents, page integer not null default 1 check(page between 1 and 500), completed boolean not null default false, bookmarks jsonb not null default '[]', notes text not null default '' check(length(notes)<=20000), updated_at timestamptz not null default now(), primary key(user_id,document_id));
create table public.integration_connections (user_id text not null references public.profiles, provider text not null check(provider in ('figma','canva')), credentials text not null, expires_at timestamptz not null, provider_user_id text, refresh_lease_until timestamptz, primary key(user_id,provider));
create table public.oauth_states (state_hash text primary key, user_id text not null references public.profiles, provider text not null, verifier text not null, expires_at timestamptz not null);
create table public.webhook_events (provider text not null, event_id text not null, user_id text, received_at timestamptz not null default now(), primary key(provider,event_id));
create table public.design_assets (id uuid primary key default gen_random_uuid(), user_id text not null references public.profiles, provider text not null, external_id text not null, name text not null, metadata jsonb not null default '{}', updated_at timestamptz not null default now(), unique(user_id,provider,external_id));
create table public.rate_limits (key text primary key, started_at timestamptz not null, hits integer not null);

alter table public.profiles enable row level security;
alter table public.technologies enable row level security;
alter table public.topics enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_periods enable row level security;
alter table public.documents enable row level security;
alter table public.learning_progress enable row level security;
alter table public.integration_connections enable row level security;
alter table public.oauth_states enable row level security;
alter table public.webhook_events enable row level security;
alter table public.design_assets enable row level security;
alter table public.rate_limits enable row level security;
create policy catalog_read on public.technologies for select using(true);
create policy topics_read on public.topics for select using(true);
create policy own_profile on public.profiles for select to authenticated using(id = auth.jwt()->>'sub');
create policy own_documents on public.documents for select to authenticated using(user_id = auth.jwt()->>'sub');
create policy own_progress on public.learning_progress for select to authenticated using(user_id = auth.jwt()->>'sub');
create policy own_subscription on public.subscriptions for select to authenticated using(user_id = auth.jwt()->>'sub');
create policy own_usage on public.usage_periods for select to authenticated using(user_id = auth.jwt()->>'sub');
-- Credentials, queue writes, billing writes and storage have no client policies.
insert into storage.buckets(id,name,public,file_size_limit) values('generated-docs','generated-docs',false,52428800) on conflict(id) do nothing;

create function public.reserve_document(p_user text,p_key text,p_title text,p_request jsonb,p_limit integer)
returns public.documents language plpgsql security definer set search_path=public as $$
declare item public.documents; used_count integer; month_start date := date_trunc('month',now() at time zone 'UTC')::date;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user,0));
  select * into item from documents where user_id=p_user and cache_key=p_key and status<>'failed';
  if found then return item; end if;
  insert into usage_periods(user_id,period) values(p_user,month_start) on conflict do nothing;
  select used into used_count from usage_periods where user_id=p_user and period=month_start for update;
  if used_count>=p_limit then raise exception 'quota_exceeded'; end if;
  update usage_periods set used=used+1 where user_id=p_user and period=month_start;
  insert into documents(user_id,title,request,cache_key,period) values(p_user,p_title,p_request,p_key,month_start) returning * into item;
  return item;
end $$;

create function public.claim_document() returns setof public.documents language plpgsql security definer set search_path=public as $$
declare expired public.documents;
begin
  -- Return reserved credits exactly once for workers that died on their final attempt.
  for expired in select * from documents where status='generating' and lease_until<now() and attempts>=3 for update skip locked loop
    if not expired.refunded then
      update usage_periods set used=greatest(0,used-1) where user_id=expired.user_id and period=expired.period;
    end if;
    update documents set status='failed',refunded=true,error_code='generation_failed',lease=null,lease_until=null where id=expired.id;
  end loop;
  return query update documents set status='generating',attempts=attempts+1,lease=gen_random_uuid(),lease_until=now()+interval '10 minutes'
  where id=(select id from documents where ((status='queued' and available_at<=now()) or (status='generating' and lease_until<now())) and attempts<3 order by created_at for update skip locked limit 1) returning *;
end $$;

create function public.finish_document(p_id uuid,p_lease uuid,p_curriculum jsonb,p_path text,p_previews jsonb,p_titles jsonb)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  update documents set status='ready',curriculum=p_curriculum,storage_path=p_path,preview_paths=p_previews,page_titles=p_titles,error_code=null,lease=null,lease_until=null where id=p_id and lease=p_lease and status='generating' and lease_until>now();
  return found;
end $$;
create function public.fail_document(p_id uuid,p_lease uuid) returns void language plpgsql security definer set search_path=public as $$
declare item public.documents;
begin
  select * into item from documents where id=p_id and lease=p_lease and status='generating' for update;
  if not found then return; end if;
  if item.attempts>=3 then
    if not item.refunded then update usage_periods set used=greatest(0,used-1) where user_id=item.user_id and period=item.period; end if;
    update documents set status='failed',refunded=true,error_code='generation_failed',lease=null,lease_until=null where id=p_id;
  else
    update documents set status='queued',available_at=now()+interval '30 seconds',lease=null,lease_until=null where id=p_id;
  end if;
end $$;

create function public.rate_limit(p_key text,p_max integer,p_seconds integer) returns boolean language plpgsql security definer set search_path=public as $$
declare count_hits integer;
begin
  insert into rate_limits(key,started_at,hits) values(p_key,now(),1) on conflict(key) do update set
    hits=case when rate_limits.started_at<now()-make_interval(secs=>p_seconds) then 1 else rate_limits.hits+1 end,
    started_at=case when rate_limits.started_at<now()-make_interval(secs=>p_seconds) then now() else rate_limits.started_at end returning hits into count_hits;
  return count_hits<=p_max;
end $$;

create function public.apply_subscription(p_event text,p_user text,p_ref text,p_tier text,p_status text,p_end timestamptz,p_synced timestamptz,p_cancel boolean)
returns boolean language plpgsql security definer set search_path=public as $$
declare old public.subscriptions;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user,1));
  if exists(select 1 from webhook_events where provider='razorpay' and event_id=p_event) then return false; end if;
  select * into old from subscriptions where user_id=p_user;
  if found and old.provider_ref<>p_ref then raise exception 'subscription_mismatch'; end if;
  if not found or old.synced_at<=p_synced then
    insert into subscriptions(user_id,provider_ref,tier,status,current_period_end,synced_at,cancel_at_cycle_end,grace_until)
    values(p_user,p_ref,p_tier,p_status,p_end,p_synced,p_cancel,
      case when p_status='pending' and old.status in ('active','pending') then coalesce(old.grace_until,old.current_period_end+interval '3 days') else null end)
    on conflict(user_id) do update set tier=excluded.tier,status=excluded.status,current_period_end=excluded.current_period_end,synced_at=excluded.synced_at,cancel_at_cycle_end=excluded.cancel_at_cycle_end,grace_until=excluded.grace_until;
  end if;
  insert into webhook_events(provider,event_id,user_id) values('razorpay',p_event,p_user);
  return true;
end $$;

-- SECURITY DEFINER RPCs are server-only; Postgres grants EXECUTE to PUBLIC by default.
revoke all on function public.reserve_document(text,text,text,jsonb,integer) from public,anon,authenticated;
revoke all on function public.claim_document() from public,anon,authenticated;
revoke all on function public.finish_document(uuid,uuid,jsonb,text,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.fail_document(uuid,uuid) from public,anon,authenticated;
revoke all on function public.rate_limit(text,integer,integer) from public,anon,authenticated;
revoke all on function public.apply_subscription(text,text,text,text,text,timestamptz,timestamptz,boolean) from public,anon,authenticated;
grant execute on function public.reserve_document(text,text,text,jsonb,integer), public.claim_document(), public.finish_document(uuid,uuid,jsonb,text,jsonb,jsonb), public.fail_document(uuid,uuid), public.rate_limit(text,integer,integer), public.apply_subscription(text,text,text,text,text,timestamptz,timestamptz,boolean) to service_role;
