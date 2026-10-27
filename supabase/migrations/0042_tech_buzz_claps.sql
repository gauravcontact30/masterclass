-- Tech Buzz claps, Medium style: each signed-in reader may give a story up to 50 claps, in as many presses as they
-- like, and can undo them. One row per (story, reader). Stories are keyed by their app id (a uuid for stored stories,
-- a text id for the built-in ones), so the built-in stories are clappable too.
-- A story's displayed total is its starting count (tech_buzz_articles.claps or the built-in figure) plus the readers'
-- claps recorded here. Read and written with the service role only (lib/server/tech-buzz-claps.ts).
-- Safe to run more than once.

create table if not exists public.tech_buzz_claps (
  article_key text not null check (char_length(article_key) between 1 and 200),
  user_id uuid not null references auth.users (id) on delete cascade,
  claps smallint not null check (claps between 1 and 50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (article_key, user_id)
);

create index if not exists idx_tech_buzz_claps_user on public.tech_buzz_claps (user_id);

alter table public.tech_buzz_claps enable row level security;
-- No policies: only the service role (which bypasses RLS) reads or writes claps.

-- Adds p_delta claps (1..50) from one reader, capped at 50 in total, or undoes all of them (p_delta = 0).
-- Returns the reader's claps, the story's reader-clap total and how many readers clapped.
create or replace function public.tech_buzz_clap(p_key text, p_user uuid, p_delta integer)
returns table (mine integer, total bigint, clappers bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_delta < 0 or p_delta > 50 then
    raise exception 'invalid clap count' using errcode = '22023';
  end if;
  if p_delta = 0 then
    delete from public.tech_buzz_claps c where c.article_key = p_key and c.user_id = p_user;
  else
    insert into public.tech_buzz_claps as c (article_key, user_id, claps)
    values (p_key, p_user, least(50, p_delta))
    on conflict (article_key, user_id)
    do update set claps = least(50, c.claps + excluded.claps), updated_at = now();
  end if;
  return query
  select
    coalesce((select c.claps::integer from public.tech_buzz_claps c where c.article_key = p_key and c.user_id = p_user), 0),
    coalesce((select sum(c.claps) from public.tech_buzz_claps c where c.article_key = p_key), 0)::bigint,
    (select count(*) from public.tech_buzz_claps c where c.article_key = p_key)::bigint;
end;
$$;

-- Reader-clap totals for many stories at once (the Tech Buzz lists), plus one reader's own claps when p_user is given.
create or replace function public.tech_buzz_clap_totals(p_keys text[], p_user uuid default null)
returns table (article_key text, total bigint, clappers bigint, mine integer)
language sql
stable
security definer
set search_path = public
as $$
  select c.article_key, sum(c.claps)::bigint, count(*)::bigint,
    coalesce(max(c.claps) filter (where c.user_id = p_user), 0)::integer
  from public.tech_buzz_claps c
  where c.article_key = any (p_keys)
  group by c.article_key;
$$;

revoke all on table public.tech_buzz_claps from public, anon, authenticated;
revoke all on function public.tech_buzz_clap(text, uuid, integer) from public, anon, authenticated;
revoke all on function public.tech_buzz_clap_totals(text[], uuid) from public, anon, authenticated;
