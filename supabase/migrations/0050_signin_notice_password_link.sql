-- The "Signed in successfully" notification told learners to change their password in Settings, which had no password
-- form, and linked to /dashboard/settings from before the move to /learning (2026-10-25). Settings now has a
-- "Sign-in and security" panel opening /reset-password (2026-10-30), so point the notice there. Also fixes the welcome
-- for accounts created already confirmed (see below). The rest is unchanged from the live definition.
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
  -- Accounts created already confirmed (Google sign-in, guest checkout: auth.admin.createUser with email_confirm) are
  -- inserted unconfirmed and confirmed within the same request, so the welcome above wrongly promised a confirmation
  -- email. Turn it into the trial welcome instead of adding an "Email verified" note nobody asked for.
  if old.email_confirmed_at is null and new.email_confirmed_at is not null and new.created_at > now() - interval '10 seconds' then
    update notifications set body = 'Your 1-day free trial has started. Explore the library, Study Buddy and interview prep.'
      where user_id = new.id and kind = 'account_created';
  elsif old.email_confirmed_at is null and new.email_confirmed_at is not null then
    insert into notifications(user_id, kind, title, body, link) values (new.id, 'email_verified',
      'Email verified', coalesce(new.email, 'Your email') || ' is confirmed. You can now sign in from any device.', '/dashboard');
  end if;
  if new.last_sign_in_at is distinct from old.last_sign_in_at and new.last_sign_in_at is not null
     and not exists (select 1 from notifications where user_id = new.id and kind = 'sign_in' and created_at > now() - interval '10 minutes') then
    insert into notifications(user_id, kind, title, body, link) values (new.id, 'sign_in',
      'Signed in successfully', 'New sign-in at ' || to_char(new.last_sign_in_at at time zone 'Asia/Kolkata', 'DD Mon YYYY, HH12:MI AM') || ' IST. If this was not you, change your password under Settings → Sign-in and security.', '/learning/settings');
  end if;
  -- Keep each learner's list short: anything older than 90 days goes.
  delete from notifications where user_id = new.id and created_at < now() - interval '90 days';
  return new;
exception when others then
  -- A notification must never block sign-up or sign-in.
  raise warning 'notify_account_events: %', sqlerrm;
  return new;
end $$;
