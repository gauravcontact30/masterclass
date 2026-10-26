-- Razorpay retains the original payment. Keep only a deletion marker locally so
-- fresh provider responses and webhook retries cannot restore deleted records.
begin;
create table if not exists public.deleted_transactions (
  payment_id text primary key check (payment_id ~ '^pay_[A-Za-z0-9]+$' and length(payment_id) <= 80),
  deleted_at timestamptz not null default now(),
  deleted_by text not null
);
alter table public.deleted_transactions enable row level security;
revoke all on public.deleted_transactions from public, anon, authenticated;
grant select on public.deleted_transactions to service_role;

-- Card access used the ledger as its entitlement store. Separate that access
-- before deleting financial rows, so removing a report entry does not revoke a purchase.
create table if not exists public.card_unlock_entitlements (
  user_id text not null,
  unlock_key text not null,
  primary key (user_id, unlock_key)
);
alter table public.card_unlock_entitlements enable row level security;
revoke all on public.card_unlock_entitlements from public, anon, authenticated;
grant select on public.card_unlock_entitlements to service_role;
insert into public.card_unlock_entitlements(user_id, unlock_key)
  select user_id, subscription_ref from public.billing_ledger
  where event = 'card_unlock.captured' and user_id is not null and subscription_ref like 'unlock:%'
  on conflict do nothing;

create or replace function public.prevent_deleted_transaction_write() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.event = 'card_unlock.captured' and new.user_id is not null and new.subscription_ref like 'unlock:%' then
    insert into card_unlock_entitlements(user_id, unlock_key) values (new.user_id, new.subscription_ref)
      on conflict do nothing;
  end if;
  if new.entity_id like 'pay\_%' escape '\' then
    perform pg_advisory_xact_lock(hashtextextended(new.entity_id, 39));
    if exists (select 1 from deleted_transactions where payment_id = new.entity_id) then
      return null;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.prevent_deleted_transaction_write() from public, anon, authenticated;
create or replace trigger prevent_deleted_transaction_write
before insert or update on public.billing_ledger
for each row execute function public.prevent_deleted_transaction_write();

-- One atomic operation: either the marker and physical deletion both commit, or neither does.
-- The shared lock also serializes concurrent webhook writes for this payment.
create or replace function public.delete_transaction(p_payment_id text, p_actor text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_payment_id is null or p_payment_id !~ '^pay_[A-Za-z0-9]+$' or length(p_payment_id) > 80
    or p_actor is null or btrim(p_actor) = '' then
    raise exception 'invalid_transaction_deletion';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_payment_id, 39));
  insert into deleted_transactions(payment_id, deleted_by) values (p_payment_id, p_actor)
    on conflict (payment_id) do nothing;
  delete from billing_ledger where entity_id = p_payment_id;
end;
$$;
revoke all on function public.delete_transaction(text, text) from public, anon, authenticated;
grant execute on function public.delete_transaction(text, text) to service_role;
commit;
