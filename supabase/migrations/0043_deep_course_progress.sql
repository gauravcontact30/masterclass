-- In-depth course progress (Core Java, Advanced Java, Spring Boot, C++, DSA, Java Basic to Advanced): one row per
-- (learner, course, topic) holding the topic checklist the learner ticked and whether they marked it complete.
-- Read and written with the service role only (lib/server/deep-progress.ts); until this runs, progress stays in the
-- learner's browser and is copied up on their next visit after it has.
-- Safe to run more than once.

create table if not exists public.deep_course_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id text not null check (course_id ~ '^[a-z0-9-]{1,40}$'),
  topic_id text not null check (topic_id ~ '^[a-z0-9-]{1,80}$'),
  checklist text[] not null default '{}' check (cardinality(checklist) <= 16),
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id, topic_id)
);

alter table public.deep_course_progress enable row level security;
-- No policies: only the service role (which bypasses RLS) reads or writes progress.

grant all on public.deep_course_progress to service_role;

notify pgrst, 'reload schema';
