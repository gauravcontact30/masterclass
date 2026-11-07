-- Custom goals (DataFast "Track custom user actions", mirrored into Supabase): one row per goal a visitor completes,
-- written by /api/goals through the service role (lib/goals.ts is the client helper) and read by the super admin
-- Overview's "Goals" panel (app/api/super-admin/goals). No browser role can read or write it.
-- Parameters follow DataFast's limits (at most 10, short strings) and never carry an email or name.
begin;

create table if not exists public.site_goals (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null check (name ~ '^[a-z0-9_-]{1,64}$'),
  params jsonb not null default '{}'::jsonb check (jsonb_typeof(params) = 'object'),
  visitor_id text check (visitor_id is null or length(visitor_id) between 8 and 64),
  session_id text check (session_id is null or length(session_id) between 8 and 64),
  user_id uuid,
  path text not null check (length(path) <= 300),
  utm_source text, utm_medium text, utm_campaign text, referrer_host text,
  country text, device text
);
create index if not exists site_goals_time on public.site_goals(created_at desc);
create index if not exists site_goals_name_time on public.site_goals(name, created_at desc);
create index if not exists site_goals_visitor on public.site_goals(visitor_id, created_at desc);

alter table public.site_goals enable row level security;
revoke all on public.site_goals from anon, authenticated;

commit;
