-- Exclude the owner's audience telemetry, including historical browser-linked visits.
-- Administrative, billing and security audit events are deliberately retained.
begin;

create or replace function public.skip_owner_telemetry() returns trigger
language plpgsql security definer set search_path = '' as $$
declare actor text;
begin
  if TG_TABLE_NAME = 'monitor_events' then
    if new.kind <> 'page' then return new; end if;
    actor := new.actor_id;
  else
    actor := new.user_id::text;
  end if;
  if exists (select 1 from auth.users u where u.id::text = actor
    and lower(trim(u.email)) = 'garvcontact30@gmail.com') then
    return null;
  end if;
  return new;
end;
$$;
revoke all on function public.skip_owner_telemetry() from public, anon, authenticated;

create or replace trigger skip_owner_visits before insert or update on public.site_visits
for each row execute function public.skip_owner_telemetry();
create or replace trigger skip_owner_presence before insert or update on public.learning_presence
for each row execute function public.skip_owner_telemetry();
create or replace trigger skip_owner_pages before insert or update on public.monitor_events
for each row execute function public.skip_owner_telemetry();

with owners as (select id from auth.users where lower(trim(email)) = 'garvcontact30@gmail.com'),
owner_browsers as (select distinct visitor_id from public.site_visits where user_id in (select id from owners))
delete from public.site_visits where user_id in (select id from owners)
  or (user_id is null and visitor_id in (select visitor_id from owner_browsers));
delete from public.learning_presence where user_id in
  (select id::text from auth.users where lower(trim(email)) = 'garvcontact30@gmail.com');
delete from public.monitor_events where kind = 'page' and actor_id in
  (select id::text from auth.users where lower(trim(email)) = 'garvcontact30@gmail.com');
commit;
