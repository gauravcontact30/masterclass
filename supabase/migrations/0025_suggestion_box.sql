-- Private suggestion inbox. All access goes through validated server endpoints.
begin;
create table public.suggestions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 80),
  email text check (length(email) <= 254),
  category text not null check (category in ('feature','content','bug','accessibility','other')),
  title text not null check (length(title) between 5 and 140),
  body text not null check (length(body) between 20 and 5000),
  access_hash text not null check (length(access_hash) = 64),
  status text not null default 'new' check (status in ('new','reviewing','planned','in_progress','completed','declined')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.suggestion_updates (
  id uuid primary key default gen_random_uuid(),
  suggestion_id uuid not null references public.suggestions(id) on delete cascade,
  actor_id text not null,
  status text not null,
  priority text not null,
  reply text check (length(reply) <= 4000),
  created_at timestamptz not null default now()
);
create index suggestions_created on public.suggestions(created_at desc);
create index suggestions_status on public.suggestions(status, created_at desc);
create index suggestion_updates_parent on public.suggestion_updates(suggestion_id, created_at);
alter table public.suggestions enable row level security;
alter table public.suggestion_updates enable row level security;
revoke all on public.suggestions, public.suggestion_updates from anon, authenticated;
grant select, insert, update on public.suggestions to service_role;
grant select, insert on public.suggestion_updates to service_role;

create function public.admin_update_suggestion(p_id uuid, p_version integer, p_status text, p_priority text, p_reply text, p_actor text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare result public.suggestions;
begin
  select * into result from public.suggestions where id=p_id for update;
  if not found then raise exception 'not_found'; end if;
  if result.version <> p_version then raise exception 'conflict'; end if;
  if result.status=p_status and result.priority=p_priority and coalesce(trim(p_reply),'')='' then
    return to_jsonb(result) - 'access_hash';
  end if;
  update public.suggestions set status=p_status, priority=p_priority, version=version+1, updated_at=now() where id=p_id returning * into result;
  insert into public.suggestion_updates(suggestion_id,actor_id,status,priority,reply)
    values(p_id,p_actor,p_status,p_priority,nullif(trim(p_reply),''));
  return to_jsonb(result) - 'access_hash';
end $$;
revoke all on function public.admin_update_suggestion(uuid,integer,text,text,text,text) from public, anon, authenticated;
grant execute on function public.admin_update_suggestion(uuid,integer,text,text,text,text) to service_role;

create function public.admin_list_suggestions(p_search text default '', p_status text default '', p_category text default '', p_priority text default '', p_page integer default 1, p_sort text default 'newest', p_from timestamptz default null, p_to timestamptz default null)
returns jsonb language sql stable security definer set search_path = public as $$
  with filtered as (
    select s.* from suggestions s
    where (p_search='' or strpos(lower(concat_ws(' ',s.id::text,s.name,s.email,s.title,s.body)),lower(p_search))>0
      or exists(select 1 from suggestion_updates u where u.suggestion_id=s.id and strpos(lower(coalesce(u.reply,'')),lower(p_search))>0))
      and (p_status='' or s.status=p_status) and (p_category='' or s.category=p_category)
      and (p_priority='' or s.priority=p_priority)
      and (p_from is null or s.created_at>=p_from) and (p_to is null or s.created_at<p_to)
  ), paged as (
    select * from filtered order by
      case when p_sort='oldest' then created_at end asc,
      case when p_sort='updated' then updated_at end desc,
      created_at desc, id
    limit 10 offset ((greatest(p_page,1)-1)::bigint*10)
  ) select jsonb_build_object('total',(select count(*) from filtered),
    'suggestions',coalesce((select jsonb_agg(to_jsonb(p)-'access_hash') from paged p),'[]'::jsonb),
    'counts',(select coalesce(jsonb_object_agg(status,n),'{}') from (select status,count(*) n from suggestions group by status) c));
$$;
revoke all on function public.admin_list_suggestions(text,text,text,text,integer,text,timestamptz,timestamptz) from public,anon,authenticated;
grant execute on function public.admin_list_suggestions(text,text,text,text,integer,text,timestamptz,timestamptz) to service_role;
notify pgrst, 'reload schema';
commit;
