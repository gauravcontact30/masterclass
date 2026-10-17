-- Subscriptions bought without signing in. The row is created with the Razorpay
-- subscription and linked to an account (found or created by email) only once
-- Razorpay reports a paid mandate, from either the browser or the webhook.
-- Idempotent: safe to run again where already applied ("if not exists", "create or replace"; grants repeat harmlessly).
create table if not exists public.guest_checkouts (
  id uuid primary key,
  email text not null check (email = lower(email) and length(email) <= 254),
  name text not null default '' check (length(name) <= 80),
  tier text not null check (tier in ('monthly','yearly')),
  selections jsonb not null default '[]',
  provider_ref text unique not null,
  status text not null default 'created' check (status in ('created','fulfilled','conflict')),
  user_id text references public.profiles,
  -- True when this checkout created the account (it has no password; the owner signs in by emailed link).
  created_user boolean not null default false,
  created_at timestamptz not null default now(),
  fulfilled_at timestamptz
);
create index if not exists guest_checkouts_email_created on public.guest_checkouts(email, created_at desc);
create index if not exists guest_checkouts_open on public.guest_checkouts(created_at) where status = 'created';
alter table public.guest_checkouts enable row level security;
revoke all on public.guest_checkouts from anon, authenticated;
grant select, insert, update on public.guest_checkouts to service_role;

-- Look an account up by email without creating one (auth.admin has no such call).
create or replace function public.auth_user_id_by_email(p_email text)
returns text language sql stable security definer set search_path = auth, public as $$
  select id::text from auth.users where lower(email) = lower(p_email) limit 1
$$;
revoke all on function public.auth_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.auth_user_id_by_email(text) to service_role;
