-- Tech Buzz reader actions on an opened story: following and muting topics and authors, reposts, the saved reading
-- list, hidden stories, "show less like this", highlights and a real discussion thread. One row per (reader, kind, key)
-- in tech_buzz_marks: `key` is an article id for save/repost/hide/less (a uuid for stored stories, a text id for built-in
-- ones, as in tech_buzz_claps), a lower-cased name for topic/author/mute_topic/mute_author, and a setting name for pref.
-- Read and written with the service role only (lib/server/tech-buzz-marks.ts).
-- Safe to run more than once.

create table if not exists public.tech_buzz_marks (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  key text not null check (char_length(key) between 1 and 200),
  created_at timestamptz not null default now(),
  primary key (user_id, kind, key)
);

alter table public.tech_buzz_marks drop constraint if exists tech_buzz_marks_kind_check;
alter table public.tech_buzz_marks add constraint tech_buzz_marks_kind_check
  check (kind in ('save', 'topic', 'author', 'repost', 'hide', 'less', 'mute_topic', 'mute_author', 'pref'));

create index if not exists idx_tech_buzz_marks_kind_key on public.tech_buzz_marks (kind, key);

create table if not exists public.tech_buzz_comments (
  id uuid primary key default gen_random_uuid(),
  article_key text not null check (char_length(article_key) between 1 and 200),
  user_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 120),
  author_avatar text not null default '',
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists idx_tech_buzz_comments_article on public.tech_buzz_comments (article_key, created_at desc);
create index if not exists idx_tech_buzz_comments_user on public.tech_buzz_comments (user_id);

-- A reader's highlighted passages. The quote is the exact text selected in one paragraph of the story.
create table if not exists public.tech_buzz_highlights (
  id uuid primary key default gen_random_uuid(),
  article_key text not null check (char_length(article_key) between 1 and 200),
  user_id uuid not null references auth.users (id) on delete cascade,
  quote text not null check (char_length(quote) between 1 and 600),
  created_at timestamptz not null default now(),
  unique (article_key, user_id, quote)
);

create index if not exists idx_tech_buzz_highlights_quote on public.tech_buzz_highlights (article_key, quote);
create index if not exists idx_tech_buzz_highlights_user on public.tech_buzz_highlights (user_id);

alter table public.tech_buzz_highlights enable row level security;
alter table public.tech_buzz_marks enable row level security;
alter table public.tech_buzz_comments enable row level security;
-- No policies: only the service role (which bypasses RLS) reads or writes these.

-- Readers' comments and reposts for many stories at once (the Tech Buzz lists and the open story's live counts).
create or replace function public.tech_buzz_engagement_totals(p_keys text[])
returns table (article_key text, comments bigint, reposts bigint)
language sql
stable
security definer
set search_path = public
as $$
  select k.article_key,
    (select count(*) from public.tech_buzz_comments c where c.article_key = k.article_key)::bigint,
    (select count(*) from public.tech_buzz_marks m where m.kind = 'repost' and m.key = k.article_key)::bigint
  from unnest(p_keys) as k(article_key);
$$;

-- Passages several readers highlighted, most-highlighted first, with no reader identities.
create or replace function public.tech_buzz_top_highlights(p_key text, p_min integer default 2)
returns table (quote text, readers bigint)
language sql
stable
security definer
set search_path = public
as $$
  select h.quote, count(*)::bigint
  from public.tech_buzz_highlights h
  where h.article_key = p_key
  group by h.quote
  having count(*) >= p_min
  order by count(*) desc, h.quote
  limit 20;
$$;

revoke all on table public.tech_buzz_highlights from public, anon, authenticated;
revoke all on function public.tech_buzz_top_highlights(text, integer) from public, anon, authenticated;
revoke all on table public.tech_buzz_marks from public, anon, authenticated;
revoke all on table public.tech_buzz_comments from public, anon, authenticated;
revoke all on function public.tech_buzz_engagement_totals(text[]) from public, anon, authenticated;
