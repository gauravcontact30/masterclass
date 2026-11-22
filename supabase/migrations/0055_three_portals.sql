-- Three portals, three separate accounts (2026-11-22).
-- The Exams portal splits in two, one per audience:
--   boards       Board Scholars: Class 10 and 12 students (UP Board, CBSE, ICSE / ISC), /exams/board-exams
--   competitive  Exam Aspirants: government and competitive exam candidates, /exams/competitive-exams
-- Each new exam account is its own profile (own trial, membership and data); its id is a UUID v5 of the portal name
-- and the auth user id, derived by the app (lib/server/portal.ts).
--
-- Rows already stored as 'exams' are kept unchanged. The app treats such a legacy Exams account as holding both exam
-- portals with its one profile, so members who paid before the split keep everything they paid for.

alter table public.portal_accounts drop constraint if exists portal_accounts_portal_check;
alter table public.portal_accounts add constraint portal_accounts_portal_check check (portal in ('tech', 'exams', 'boards', 'competitive'));

comment on table public.portal_accounts is 'Which portals (tech, boards, competitive; legacy exams = both exam portals) a login identity has an account in, and the profile that account uses.';
