-- Two portals, two separate accounts (2026-11-15).
-- The site has a Tech portal (/learning, Tech Buzz) and an Exams portal (/exams: Board Exams, Competitive Exams,
-- the Exams blog). Supabase Auth keeps one login identity per email, so a "portal account" is a row here that links
-- that identity to its own profile. public.profiles.id is text and every account-scoped table (subscriptions,
-- usage_periods, documents, ...) hangs off it, so the Exams account is simply a second profile with its own id:
-- its own trial clock, its own membership and its own data. The Tech account keeps the auth user's id as before.
--
-- account_id for the Exams portal is a deterministic UUID (v5) derived from the auth user id by the app
-- (lib/server/portal.ts), never the auth id itself.

create table if not exists public.portal_accounts (
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  portal text not null check (portal in ('tech', 'exams')),
  account_id text not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (auth_user_id, portal)
);
comment on table public.portal_accounts is 'Which portals (tech, exams) a login identity has an account in, and the profile that account uses.';

alter table public.portal_accounts enable row level security;
revoke all on public.portal_accounts from anon, authenticated;
grant select, insert, update, delete on public.portal_accounts to service_role;

-- Everyone who has an account today has a Tech account: their profile id is their auth user id.
insert into public.portal_accounts (auth_user_id, portal, account_id)
select u.id, 'tech', p.id
from auth.users u
join public.profiles p on p.id = u.id::text
on conflict do nothing;

-- Which portal an account belongs to, for Super Admin lists and support.
create or replace view public.portal_account_directory with (security_invoker = true) as
select a.auth_user_id, a.portal, a.account_id, a.created_at, p.name
from public.portal_accounts a
join public.profiles p on p.id = a.account_id;
revoke all on public.portal_account_directory from anon, authenticated;
grant select on public.portal_account_directory to service_role;
