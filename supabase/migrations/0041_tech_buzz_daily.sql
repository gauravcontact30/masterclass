-- Tech Buzz: likes/dislikes columns (the app has always written them, but 0037 never created them, so every insert
-- through lib/server/tech-buzz-storage.ts failed with PGRST204), a tag index for the daily 5:00 AM IST edition
-- (rows tagged 'mcb-daily'), and an atomic counter bump for likes, dislikes and claps.
-- Safe to run more than once.

alter table public.tech_buzz_articles add column if not exists likes integer not null default 0 check (likes >= 0);
alter table public.tech_buzz_articles add column if not exists dislikes integer not null default 0 check (dislikes >= 0);

create index if not exists idx_tech_buzz_tags on public.tech_buzz_articles using gin (tags);

-- One reader reaction: adds p_delta (-1..50) to likes, dislikes or claps, never below zero, and returns the new counts.
-- Called with the service role from /api/tech-buzz/action only.
create or replace function public.tech_buzz_bump(p_id uuid, p_field text, p_delta integer)
returns table (likes integer, dislikes integer, claps integer)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_field not in ('likes', 'dislikes', 'claps') or p_delta < -1 or p_delta > 50 then
    raise exception 'invalid bump' using errcode = '22023';
  end if;
  return query
  update public.tech_buzz_articles a set
    likes = case when p_field = 'likes' then greatest(0, a.likes + p_delta) else a.likes end,
    upvotes = case when p_field = 'likes' then greatest(0, a.likes + p_delta) else a.upvotes end,
    dislikes = case when p_field = 'dislikes' then greatest(0, a.dislikes + p_delta) else a.dislikes end,
    claps = case when p_field = 'claps' then greatest(0, a.claps + p_delta) else a.claps end
  where a.id = p_id and a.status = 'published'
  returning a.likes, a.dislikes, a.claps;
end;
$$;

revoke all on function public.tech_buzz_bump(uuid, text, integer) from public, anon, authenticated;
