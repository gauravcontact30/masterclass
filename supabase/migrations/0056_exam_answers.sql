-- Saved practice answers for Board Exams and Competitive Exams (2026-11-22).
-- One row per objective question an account has answered (or revealed, choice -1), so Board Scholars and Exam
-- Aspirants keep their progress across devices and visits. account_id is the portal's own account (lib/server/portal.ts),
-- so portals never share answers. The same pages also open inside the Tech Pro Learning Dashboard (portal tech). Written and read only by /api/exams/answers through the service role.
--   scope     the question set: a competitive exam id (nda, banks, ...) or board-class-subject (up-10-math, ...)
--   item_key  the question's id inside that set
begin;

create table if not exists public.exam_answers (
  account_id text not null references public.profiles(id) on delete cascade,
  portal text not null check (portal in ('tech', 'boards', 'competitive')),
  scope text not null check (scope ~ '^[a-z0-9-]{1,40}$'),
  item_key text not null check (length(item_key) between 1 and 120),
  choice smallint not null check (choice between -1 and 9),
  correct boolean not null,
  answered_at timestamptz not null default now(),
  primary key (account_id, portal, scope, item_key)
);
create index if not exists exam_answers_portal_time on public.exam_answers(portal, answered_at desc);

alter table public.exam_answers enable row level security;
revoke all on public.exam_answers from anon, authenticated;

comment on table public.exam_answers is 'Objective practice answers per portal account (tech, boards, competitive); service role only.';

commit;
