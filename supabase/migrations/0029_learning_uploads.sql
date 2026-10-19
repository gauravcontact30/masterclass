-- Upload Learning: Notepad documents the owner publishes to the Learning Dashboard, landing, sign-in, sign-up and
-- Super Admin pages, plus custom Learning Dashboard pages, earlier versions of each upload, and view counts.
-- Row level security is on with no policies, so every read and write goes through the server's validated
-- endpoints (owner-only for writes). Safe to re-run: every object is created only if missing.
begin;
create table if not exists public.learning_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{0,59}$'),
  title text not null check (length(title) between 1 and 80),
  description text check (length(description) <= 300),
  icon text not null default 'BookOpen' check (length(icon) <= 40),
  position integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.learning_uploads (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 160),
  summary text check (length(summary) <= 400),
  html text not null check (length(html) <= 4000000),
  background text not null default '#ffffff' check (background ~ '^#[0-9a-fA-F]{6}$'),
  source_file_id text check (length(source_file_id) <= 80),
  surface text not null check (surface in ('dashboard','landing','sign_in','sign_up','super_admin')),
  page text not null check (length(page) between 1 and 80),
  section text not null check (length(section) between 1 and 40),
  layout text not null default 'card' check (layout in ('card','banner','full','accordion')),
  tone text not null default 'ivory' check (tone in ('ivory','sky','mint','lavender','rose','peach','butter')),
  show_title boolean not null default true,
  position integer not null default 0,
  pinned boolean not null default false,
  audience text not null default 'everyone' check (audience in ('everyone','signed_out','signed_in','members')),
  device text not null default 'all' check (device in ('all','desktop','mobile')),
  language text not null default 'all' check (language in ('all','en','hi')),
  cta_label text check (length(cta_label) <= 40),
  cta_url text check (length(cta_url) <= 500 and (cta_url ~ '^(/[^/]|https://)')),
  tags text[] not null default '{}' check (cardinality(tags) <= 10),
  status text not null default 'draft' check (status in ('draft','published','hidden')),
  starts_at timestamptz,
  ends_at timestamptz,
  views bigint not null default 0,
  version integer not null default 1,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);
-- The content of an upload before each edit that changed it, so any earlier version can be restored.
create table if not exists public.learning_upload_revisions (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null references public.learning_uploads(id) on delete cascade,
  version integer not null,
  title text not null,
  summary text,
  html text not null,
  background text not null,
  created_at timestamptz not null default now()
);
create index if not exists learning_uploads_placement on public.learning_uploads(surface, page, status, pinned desc, position);
create index if not exists learning_pages_order on public.learning_pages(position, title);
create index if not exists learning_upload_revisions_parent on public.learning_upload_revisions(upload_id, version desc);

-- Counts a view without a read-modify-write race.
create or replace function public.learning_upload_view(p_id uuid) returns void language sql security definer set search_path = public as $$
  update public.learning_uploads set views = views + 1 where id = p_id and status = 'published';
$$;

alter table public.learning_pages enable row level security;
alter table public.learning_uploads enable row level security;
alter table public.learning_upload_revisions enable row level security;
revoke all on public.learning_pages, public.learning_uploads, public.learning_upload_revisions from anon, authenticated;
grant all on public.learning_pages, public.learning_uploads, public.learning_upload_revisions to service_role;
revoke all on function public.learning_upload_view(uuid) from public, anon, authenticated;
grant execute on function public.learning_upload_view(uuid) to service_role;
notify pgrst, 'reload schema';
commit;
