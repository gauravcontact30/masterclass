-- Super admin → Overview → Live visitor stream: who is reading a page right now, and since when.
-- components/visit-tracker.tsx sends a heartbeat every 45 seconds while a page is visible (and once more when a
-- hidden tab comes back); /api/track upserts one row per open page (session + path). The stream adds the time since
-- `started_at` (the start of the current visible stretch) to the page's leave beacons, so a page still open is timed
-- to the second, a page whose leave beacon was lost is timed up to its last heartbeat, and a visitor counts as on the
-- site only while their heartbeat is fresh. Kept apart from site_visits so heartbeats never dilute the visit log,
-- reports or exports. Rows are tiny (one per open page) and pruned with the visit retention job.
-- Idempotent: safe to run again.
begin;

create table if not exists public.site_presence (
  session_id text not null check (length(session_id) between 8 and 64),
  path text not null check (length(path) <= 300),
  visitor_id text not null check (length(visitor_id) between 8 and 64),
  user_id uuid,
  started_at timestamptz not null default now(),
  seen_at timestamptz not null default now(),
  primary key (session_id, path)
);
create index if not exists site_presence_seen on public.site_presence(seen_at desc);
alter table public.site_presence enable row level security;
revoke all on public.site_presence from anon, authenticated;
grant select, insert, update, delete on public.site_presence to service_role;

commit;
