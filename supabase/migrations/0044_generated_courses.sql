-- In-depth courses for every technology on the platform beyond the six hand-written ones (lib/server/course-generator.ts).
-- A course's outline is researched from official documentation and written the first time anyone opens it; each
-- topic is written (and editor-scored) the first time anyone opens that topic. Stored once, served to everyone.
-- status 'generating' plus started_at doubles as a lock, so two learners opening the same course do not pay twice.
-- Read and written with the service role only.
-- Safe to run more than once.

create table if not exists public.generated_courses (
  track_id text primary key check (track_id ~ '^[a-z0-9-]{1,40}$'),
  status text not null default 'generating' check (status in ('generating', 'ready', 'failed')),
  intro text[] not null default '{}',
  topics jsonb not null default '[]'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  error text,
  started_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generated_course_topics (
  track_id text not null references public.generated_courses (track_id) on delete cascade,
  topic_id text not null check (topic_id ~ '^[a-z0-9-]{1,80}$'),
  status text not null default 'generating' check (status in ('generating', 'ready', 'failed')),
  content jsonb,
  editor_score numeric(2,1),
  sources jsonb not null default '[]'::jsonb,
  error text,
  started_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (track_id, topic_id)
);

alter table public.generated_courses enable row level security;
alter table public.generated_course_topics enable row level security;
-- No policies: only the service role (which bypasses RLS) reads or writes these.

grant all on public.generated_courses to service_role;
grant all on public.generated_course_topics to service_role;

notify pgrst, 'reload schema';
