-- The Super Admin "SEO Audit" page (components/super-admin-seo.tsx, lib/server/seo-suite.ts): site audits of the site's own
-- pages, tracked keywords with their daily Google Search Console positions, Ahrefs API snapshots (Domain Rating,
-- backlinks, keywords, competitors) kept as history, the competitors being watched, and AI-answer visibility checks.
-- Only the service role reads or writes these tables; the API routes check for a super admin first.

begin;

create table if not exists public.seo_audits (
  id bigint generated always as identity primary key,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'done', 'failed')),
  pages_crawled integer not null default 0,
  issues_count integer not null default 0,
  score integer check (score between 0 and 100),
  summary jsonb not null default '{}'::jsonb,
  error text
);

create table if not exists public.seo_audit_pages (
  id bigint generated always as identity primary key,
  audit_id bigint not null references public.seo_audits (id) on delete cascade,
  url text not null,
  status integer,
  load_ms integer,
  title text,
  description text,
  h1_count integer not null default 0,
  word_count integer not null default 0,
  images integer not null default 0,
  images_missing_alt integer not null default 0,
  canonical text,
  noindex boolean not null default false,
  internal_links integer not null default 0,
  issues jsonb not null default '[]'::jsonb
);
create index if not exists seo_audit_pages_audit_idx on public.seo_audit_pages (audit_id);

create table if not exists public.seo_keywords (
  id bigint generated always as identity primary key,
  keyword text not null,
  country text not null default 'in',
  target_url text,
  created_at timestamptz not null default now(),
  unique (keyword, country)
);

-- One row per tracked keyword per day: Google's average position, clicks and impressions (Search Console).
create table if not exists public.seo_rank_history (
  keyword_id bigint not null references public.seo_keywords (id) on delete cascade,
  day date not null,
  position numeric(6, 2),
  clicks integer not null default 0,
  impressions integer not null default 0,
  ctr numeric(7, 5),
  page text,
  primary key (keyword_id, day)
);

-- Every Ahrefs API answer that was paid for is kept, so history (Domain Rating over time) costs nothing to show again.
create table if not exists public.seo_ahrefs_snapshots (
  id bigint generated always as identity primary key,
  tool text not null,
  target text not null,
  params jsonb not null default '{}'::jsonb,
  data jsonb not null,
  fetched_at timestamptz not null default now()
);
create index if not exists seo_ahrefs_snapshots_lookup_idx on public.seo_ahrefs_snapshots (tool, target, fetched_at desc);

create table if not exists public.seo_competitors (
  id bigint generated always as identity primary key,
  domain text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.seo_ai_prompts (
  id bigint generated always as identity primary key,
  prompt text not null unique,
  created_at timestamptz not null default now()
);

-- One AI-search answer to a tracked prompt: whether the brand was named and whether the site was cited as a source.
create table if not exists public.seo_ai_checks (
  id bigint generated always as identity primary key,
  prompt_id bigint not null references public.seo_ai_prompts (id) on delete cascade,
  checked_at timestamptz not null default now(),
  engine text not null,
  mentioned boolean not null default false,
  cited boolean not null default false,
  cited_rank integer,
  competitors_cited text[] not null default '{}',
  answer text,
  citations jsonb not null default '[]'::jsonb
);
create index if not exists seo_ai_checks_prompt_idx on public.seo_ai_checks (prompt_id, checked_at desc);

do $$
declare t text;
begin
  foreach t in array array['seo_audits', 'seo_audit_pages', 'seo_keywords', 'seo_rank_history', 'seo_ahrefs_snapshots', 'seo_competitors', 'seo_ai_prompts', 'seo_ai_checks'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to service_role', t);
  end loop;
end $$;

commit;
