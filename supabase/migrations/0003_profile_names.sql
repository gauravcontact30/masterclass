-- Additive: give profiles a display name, and create the row at sign-up time.
-- Until now a profile row only appeared lazily, on the first authenticated API
-- call (see lib/server/repository.ts). A visitor who signed up and never
-- generated anything had no row at all, so their name had nowhere to live.
alter table public.profiles add column if not exists name text not null default '';

-- Runs as definer because auth.users is not writable by the anon role that
-- triggers the insert. Mirrors the name captured by AuthPage's sign-up form.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, name)
  values (new.id::text, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

-- on conflict do nothing above keeps the pre-existing lazy upsert safe, so the
-- trigger and repository.profile() can both run without fighting each other.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Backfill anyone who signed up before this migration.
insert into public.profiles(id, name)
select u.id::text, coalesce(u.raw_user_meta_data->>'full_name', '')
from auth.users u on conflict (id) do nothing;
