-- Additive: pay-per-download credits, layered on top of the monthly quota.
-- A credit is spent only once a user's monthly usage_periods quota is exhausted.
alter table public.profiles add column if not exists credit_balance integer not null default 0 check (credit_balance >= 0);
alter table public.documents add column if not exists used_credit boolean not null default false;

create or replace function public.reserve_document(p_user text,p_key text,p_title text,p_request jsonb,p_limit integer)
returns public.documents language plpgsql security definer set search_path=public as $$
declare item public.documents; used_count integer; month_start date := date_trunc('month',now() at time zone 'UTC')::date; spent_credit boolean := false;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user,0));
  select * into item from documents where user_id=p_user and cache_key=p_key and status<>'failed';
  if found then return item; end if;
  insert into usage_periods(user_id,period) values(p_user,month_start) on conflict do nothing;
  select used into used_count from usage_periods where user_id=p_user and period=month_start for update;
  if used_count>=p_limit then
    update profiles set credit_balance=credit_balance-1 where id=p_user and credit_balance>0;
    if not found then raise exception 'quota_exceeded'; end if;
    spent_credit:=true;
  else
    update usage_periods set used=used+1 where user_id=p_user and period=month_start;
  end if;
  insert into documents(user_id,title,request,cache_key,period,used_credit) values(p_user,p_title,p_request,p_key,month_start,spent_credit) returning * into item;
  return item;
end $$;

create or replace function public.claim_document() returns setof public.documents language plpgsql security definer set search_path=public as $$
declare expired public.documents;
begin
  -- Return reserved credits exactly once for workers that died on their final attempt.
  for expired in select * from documents where status='generating' and lease_until<now() and attempts>=3 for update skip locked loop
    if not expired.refunded then
      if expired.used_credit then
        update profiles set credit_balance=credit_balance+1 where id=expired.user_id;
      else
        update usage_periods set used=greatest(0,used-1) where user_id=expired.user_id and period=expired.period;
      end if;
    end if;
    update documents set status='failed',refunded=true,error_code='generation_failed',lease=null,lease_until=null where id=expired.id;
  end loop;
  return query update documents set status='generating',attempts=attempts+1,lease=gen_random_uuid(),lease_until=now()+interval '10 minutes'
  where id=(select id from documents where ((status='queued' and available_at<=now()) or (status='generating' and lease_until<now())) and attempts<3 order by created_at for update skip locked limit 1) returning *;
end $$;

create or replace function public.fail_document(p_id uuid,p_lease uuid) returns void language plpgsql security definer set search_path=public as $$
declare item public.documents;
begin
  select * into item from documents where id=p_id and lease=p_lease and status='generating' for update;
  if not found then return; end if;
  if item.attempts>=3 then
    if not item.refunded then
      if item.used_credit then
        update profiles set credit_balance=credit_balance+1 where id=item.user_id;
      else
        update usage_periods set used=greatest(0,used-1) where user_id=item.user_id and period=item.period;
      end if;
    end if;
    update documents set status='failed',refunded=true,error_code='generation_failed',lease=null,lease_until=null where id=p_id;
  else
    update documents set status='queued',available_at=now()+interval '30 seconds',lease=null,lease_until=null where id=p_id;
  end if;
end $$;

-- Mirrors apply_subscription's idempotency pattern for one-time download-credit purchases.
create function public.credit_download(p_event text,p_user text,p_credits integer)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user,2));
  if exists(select 1 from webhook_events where provider='razorpay' and event_id=p_event) then return false; end if;
  update profiles set credit_balance=credit_balance+p_credits where id=p_user;
  if not found then raise exception 'invalid_request'; end if;
  insert into webhook_events(provider,event_id,user_id) values('razorpay',p_event,p_user);
  return true;
end $$;

revoke all on function public.credit_download(text,text,integer) from public,anon,authenticated;
grant execute on function public.credit_download(text,text,integer) to service_role;
