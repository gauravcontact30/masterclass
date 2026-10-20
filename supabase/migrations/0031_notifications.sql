-- Idempotent: safe to run again where already applied (tables and indexes "if not exists", functions "create or
-- replace", triggers dropped and recreated, policies dropped and recreated).
--
-- In-app notifications. Account events are written by the database itself, from auth.users, so the browser can
-- never forge them: "account created" on sign-up, "email verified" when the confirmation link is opened, and
-- "new sign-in" on every sign-in (at most one per 10 minutes). Learners read and mark their own notifications
-- (row level security); only the database and the service role can create them.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('account_created', 'email_verified', 'sign_in', 'announcement', 'billing', 'learning', 'security')),
  title text not null check (char_length(title) between 1 and 160),
  body text not null default '' check (char_length(body) <= 1000),
  link text check (link is null or link ~ '^/(?!/)'),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists notifications_user_time on public.notifications(user_id, created_at desc);
create index if not exists notifications_user_unread on public.notifications(user_id) where read_at is null;

alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
-- A learner can only mark a notification read: no other column is writable from the browser.
grant update (read_at) on public.notifications to authenticated;
drop policy if exists notifications_read_own on public.notifications;
create policy notifications_read_own on public.notifications for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists notifications_mark_own on public.notifications;
create policy notifications_mark_own on public.notifications for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Account events from auth.users. SECURITY DEFINER with a fixed search_path: the trigger runs as the owner, never
-- with the caller's privileges or a caller-controlled schema.
create or replace function public.notify_account_events() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    insert into notifications(user_id, kind, title, body, link) values (new.id, 'account_created',
      'Welcome to MasterClass: your account is ready',
      case when new.email_confirmed_at is null
        then 'We sent a confirmation link to ' || coalesce(new.email, 'your email') || '. Open it to verify your email and sign in.'
        else 'Your 1-day free trial has started. Explore the library, Study Buddy and interview prep.' end,
      '/dashboard');
    return new;
  end if;
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    insert into notifications(user_id, kind, title, body, link) values (new.id, 'email_verified',
      'Email verified', coalesce(new.email, 'Your email') || ' is confirmed. You can now sign in from any device.', '/dashboard');
  end if;
  if new.last_sign_in_at is distinct from old.last_sign_in_at and new.last_sign_in_at is not null
     and not exists (select 1 from notifications where user_id = new.id and kind = 'sign_in' and created_at > now() - interval '10 minutes') then
    insert into notifications(user_id, kind, title, body, link) values (new.id, 'sign_in',
      'Signed in successfully', 'New sign-in at ' || to_char(new.last_sign_in_at at time zone 'Asia/Kolkata', 'DD Mon YYYY, HH12:MI AM') || ' IST. If this was not you, change your password in Settings.', '/dashboard/settings');
  end if;
  -- Keep each learner's list short: anything older than 90 days goes.
  delete from notifications where user_id = new.id and created_at < now() - interval '90 days';
  return new;
exception when others then
  -- A notification must never block sign-up or sign-in.
  raise warning 'notify_account_events: %', sqlerrm;
  return new;
end $$;
revoke all on function public.notify_account_events() from public, anon, authenticated;

drop trigger if exists on_auth_user_notify_insert on auth.users;
create trigger on_auth_user_notify_insert after insert on auth.users for each row execute function public.notify_account_events();
drop trigger if exists on_auth_user_notify_update on auth.users;
create trigger on_auth_user_notify_update after update of email_confirmed_at, last_sign_in_at on auth.users for each row execute function public.notify_account_events();
