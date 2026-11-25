-- A fourth portal: IELTS Achievers (2026-11-24).
-- IELTS candidates get their own sign-up, sign-in, dashboard (/ielts/dashboard) and plans, and their own account:
-- a profile whose id is a UUID v5 of 'ielts:' and the auth user id, derived by the app (lib/server/portal.ts), with its
-- own trial, membership and data, exactly like Board Scholars and Exam Aspirants. Unlike those it is open worldwide.
-- Until this runs, IELTS sign-up answers "portal_unavailable" and the other portals carry on as before.
begin;

alter table public.portal_accounts drop constraint if exists portal_accounts_portal_check;
alter table public.portal_accounts add constraint portal_accounts_portal_check check (portal in ('tech', 'exams', 'boards', 'competitive', 'ielts'));
comment on table public.portal_accounts is 'Which portals (tech, boards, competitive, ielts; legacy exams = both exam portals) a login identity has an account in, and the profile that account uses.';

commit;
