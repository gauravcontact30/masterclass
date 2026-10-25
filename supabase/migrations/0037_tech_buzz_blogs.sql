-- Migration 0037: Tech Buzz Blogs Database Integration
-- Adds public.tech_buzz_articles table for full end-to-end publishing from Super Admin Upload Learning
-- Expands public.learning_uploads surface to include 'tech_buzz'

begin;

-- 1. Create table public.tech_buzz_articles
create table if not exists public.tech_buzz_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{0,99}$'),
  title text not null check (length(title) between 1 and 250),
  subtitle text not null check (length(subtitle) between 1 and 500),
  category text not null check (length(category) between 1 and 80),
  technology text not null check (length(technology) between 1 and 80),
  tech_badge_color text not null default '#ea580c' check (length(tech_badge_color) <= 30),
  read_time_minutes integer not null default 5 check (read_time_minutes between 1 and 120),
  featured boolean not null default false,
  trending_rank integer check (trending_rank is null or (trending_rank between 1 and 20)),
  claps integer not null default 0 check (claps >= 0),
  rating_average numeric(3,2) not null default 4.90 check (rating_average between 1.00 and 5.00),
  rating_count integer not null default 1 check (rating_count >= 0),
  rating_breakdown jsonb not null default '{"1":0,"2":0,"3":2,"4":15,"5":80}'::jsonb,
  author jsonb not null default '{"name":"Study Buddy Team","role":"Principal Architect","avatar":"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80","handle":"@studybuddy","verified":true}'::jsonb,
  cover_image text not null check (length(cover_image) between 1 and 1000),
  tags text[] not null default '{}'::text[],
  upvotes integer not null default 0 check (upvotes >= 0),
  ranking_score numeric(5,2) not null default 98.0 check (ranking_score between 0 and 100),
  source jsonb not null default '{"name":"Tech Buzz Radar","domain":"masterclass.internal","trustScore":"99.2"}'::jsonb,
  summary_bullets text[] not null default '{}'::text[],
  reactions jsonb not null default '{"heart":0,"unicorn":0,"rocket":0,"mindblown":0}'::jsonb,
  comments_count integer not null default 0 check (comments_count >= 0),
  comments jsonb not null default '[]'::jsonb,
  series jsonb,
  tech_stack text[] not null default '{}'::text[],
  audio_voiceover jsonb,
  newsletter_edition text,
  membership_tier text not null default 'Pro Member' check (membership_tier in ('Free Preview', 'Pro Member', 'All-Access')),
  builder_metrics jsonb,
  founder_takeaway text,
  content_sections jsonb not null default '[]'::jsonb,
  status text not null default 'published' check (status in ('draft', 'published', 'hidden', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Indexes for queries
create index if not exists idx_tech_buzz_slug on public.tech_buzz_articles(slug);
create index if not exists idx_tech_buzz_status_pub on public.tech_buzz_articles(status, published_at desc);
create index if not exists idx_tech_buzz_category on public.tech_buzz_articles(category, published_at desc);
create index if not exists idx_tech_buzz_technology on public.tech_buzz_articles(technology, published_at desc);
create index if not exists idx_tech_buzz_featured on public.tech_buzz_articles(featured, published_at desc);

-- 3. Expand learning_uploads surface check constraint to allow 'tech_buzz'
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'learning_uploads') then
    alter table public.learning_uploads drop constraint if exists learning_uploads_surface_check;
    alter table public.learning_uploads add constraint learning_uploads_surface_check
      check (surface in ('dashboard','landing','sign_in','sign_up','super_admin','tech_buzz'));
  end if;
exception
  when others then
    raise notice 'surface constraint notice: %', sqlerrm;
end $$;

-- 4. Enable Row Level Security and Grants
alter table public.tech_buzz_articles enable row level security;

-- Allow public read access to published articles
drop policy if exists "tech_buzz_public_read" on public.tech_buzz_articles;
create policy "tech_buzz_public_read" on public.tech_buzz_articles
  for select using (status = 'published');

-- Allow service_role full control
grant all on public.tech_buzz_articles to service_role;
grant select on public.tech_buzz_articles to anon, authenticated;

notify pgrst, 'reload schema';
commit;
