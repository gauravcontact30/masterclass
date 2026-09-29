-- Preserve paid access on terminal events, and never undo a scheduled cancellation
-- when an older in-flight reconciliation finishes after the cancellation request.
create or replace function public.apply_subscription(p_event text,p_user text,p_ref text,p_tier text,p_status text,p_end timestamptz,p_synced timestamptz,p_cancel boolean)
returns boolean language plpgsql security definer set search_path=public as $$
declare old public.subscriptions; paid_end timestamptz;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user,1));
  if exists(select 1 from webhook_events where provider='razorpay' and event_id=p_event) then return false; end if;
  select * into old from subscriptions where user_id=p_user;
  if found and old.provider_ref<>p_ref then
    insert into webhook_events(provider,event_id,user_id) values('razorpay',p_event,p_user);
    return false;
  end if;
  if not found or old.synced_at<=p_synced then
    paid_end := case when p_status in ('cancelled','completed','pending','halted','paused') then coalesce(p_end,old.current_period_end) else p_end end;
    insert into subscriptions(user_id,provider_ref,tier,status,current_period_end,synced_at,cancel_at_cycle_end,grace_until)
    values(p_user,p_ref,p_tier,p_status,paid_end,p_synced,p_cancel or coalesce(old.cancel_at_cycle_end,false),
      case when p_status='pending' and old.status in ('active','pending') then coalesce(old.grace_until,old.current_period_end+interval '3 days') else null end)
    on conflict(user_id) do update set tier=excluded.tier,status=excluded.status,current_period_end=excluded.current_period_end,
      synced_at=excluded.synced_at,cancel_at_cycle_end=excluded.cancel_at_cycle_end,grace_until=excluded.grace_until;
  end if;
  insert into webhook_events(provider,event_id,user_id) values('razorpay',p_event,p_user);
  return true;
end $$;
revoke all on function public.apply_subscription(text,text,text,text,text,timestamptz,timestamptz,boolean) from public,anon,authenticated;
grant execute on function public.apply_subscription(text,text,text,text,text,timestamptz,timestamptz,boolean) to service_role;
