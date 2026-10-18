-- Suggestion Box, admin tools: field-scoped search, reply counts, a "replied" filter, priority sort,
-- an export page size, bulk status/priority changes and deletion. Additive: 0025's functions stay in place,
-- and the API falls back to them until this file is applied.
begin;

create function public.admin_list_suggestions_v2(
  p_search text default '', p_scope text default 'all', p_status text default '', p_category text default '',
  p_priority text default '', p_replied text default '', p_page integer default 1, p_limit integer default 10,
  p_sort text default 'newest', p_from timestamptz default null, p_to timestamptz default null)
returns jsonb language sql stable security definer set search_path = public as $$
  with replies as (
    select suggestion_id, count(reply)::int as reply_count, max(created_at) filter (where reply is not null) as last_reply_at
    from suggestion_updates group by suggestion_id
  ), base as (
    select s.*, coalesce(r.reply_count, 0) as reply_count, r.last_reply_at
    from suggestions s left join replies r on r.suggestion_id = s.id
  ), filtered as (
    select b.* from base b
    where (p_search = '' or case p_scope
        when 'title' then strpos(lower(b.title), lower(p_search)) > 0
        when 'message' then strpos(lower(b.body), lower(p_search)) > 0
        when 'contributor' then strpos(lower(concat_ws(' ', b.name, b.email)), lower(p_search)) > 0
        when 'id' then strpos(b.id::text, lower(p_search)) > 0
        when 'reply' then exists(select 1 from suggestion_updates u where u.suggestion_id = b.id and strpos(lower(coalesce(u.reply, '')), lower(p_search)) > 0)
        else strpos(lower(concat_ws(' ', b.id::text, b.name, b.email, b.title, b.body)), lower(p_search)) > 0
          or exists(select 1 from suggestion_updates u where u.suggestion_id = b.id and strpos(lower(coalesce(u.reply, '')), lower(p_search)) > 0)
      end)
      and (p_status = '' or b.status = p_status) and (p_category = '' or b.category = p_category)
      and (p_priority = '' or b.priority = p_priority)
      and (p_replied = '' or (p_replied = 'yes' and b.reply_count > 0) or (p_replied = 'no' and b.reply_count = 0))
      and (p_from is null or b.created_at >= p_from) and (p_to is null or b.created_at < p_to)
  ), paged as (
    select f.*, row_number() over (order by
        case when p_sort = 'oldest' then f.created_at end asc,
        case when p_sort = 'updated' then f.updated_at end desc,
        case when p_sort = 'priority' then array_position(array['urgent','high','normal','low'], f.priority) end asc,
        f.created_at desc, f.id) as rn
    from filtered f
  ), page as (
    select * from paged
    where rn > (greatest(p_page, 1) - 1)::bigint * least(greatest(p_limit, 1), 1000)
      and rn <= greatest(p_page, 1)::bigint * least(greatest(p_limit, 1), 1000)
  ) select jsonb_build_object(
    'total', (select count(*) from filtered),
    'suggestions', coalesce((select jsonb_agg(to_jsonb(p) - 'access_hash' - 'rn' order by p.rn) from page p), '[]'::jsonb),
    'counts', (select coalesce(jsonb_object_agg(status, n), '{}') from (select status, count(*) n from suggestions group by status) c),
    'awaitingReply', (select count(*) from base where reply_count = 0 and status not in ('completed', 'declined')),
    'urgent', (select count(*) from suggestions where priority = 'urgent' and status not in ('completed', 'declined')));
$$;
revoke all on function public.admin_list_suggestions_v2(text,text,text,text,text,text,integer,integer,text,timestamptz,timestamptz) from public, anon, authenticated;
grant execute on function public.admin_list_suggestions_v2(text,text,text,text,text,text,integer,integer,text,timestamptz,timestamptz) to service_role;

-- Changes status and/or priority (null keeps the current value) and writes one history row per suggestion that changed.
create function public.admin_bulk_update_suggestions(p_ids uuid[], p_status text, p_priority text, p_actor text)
returns integer language plpgsql security definer set search_path = public as $$
declare changed_count integer;
begin
  if coalesce(cardinality(p_ids), 0) not between 1 and 100 or (p_status is null and p_priority is null) then
    raise exception 'invalid_request';
  end if;
  with changed as (
    update suggestions s set status = coalesce(p_status, s.status), priority = coalesce(p_priority, s.priority),
      version = s.version + 1, updated_at = now()
    where s.id = any(p_ids)
      and (s.status <> coalesce(p_status, s.status) or s.priority <> coalesce(p_priority, s.priority))
    returning s.id, s.status, s.priority
  ), logged as (
    insert into suggestion_updates(suggestion_id, actor_id, status, priority)
    select id, p_actor, status, priority from changed returning 1
  ) select count(*) into changed_count from logged;
  return changed_count;
end $$;
revoke all on function public.admin_bulk_update_suggestions(uuid[],text,text,text) from public, anon, authenticated;
grant execute on function public.admin_bulk_update_suggestions(uuid[],text,text,text) to service_role;

-- Permanent removal (history rows cascade). The inbox asks for confirmation first.
create function public.admin_delete_suggestions(p_ids uuid[])
returns integer language plpgsql security definer set search_path = public as $$
declare removed integer;
begin
  if coalesce(cardinality(p_ids), 0) not between 1 and 100 then raise exception 'invalid_request'; end if;
  delete from suggestions where id = any(p_ids);
  get diagnostics removed = row_count;
  return removed;
end $$;
revoke all on function public.admin_delete_suggestions(uuid[]) from public, anon, authenticated;
grant execute on function public.admin_delete_suggestions(uuid[]) to service_role;

notify pgrst, 'reload schema';
commit;
