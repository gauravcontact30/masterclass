-- Diwali: discounted recurring plans, including every renewal.
begin;

create table if not exists public.festive_sales (
  slug text primary key check (slug ~ '^[a-z0-9][a-z0-9-]{1,40}$'),
  title text not null check (length(title) between 3 and 80),
  title_hi text check (title_hi is null or length(title_hi) <= 80),
  discount_percent integer not null check (discount_percent between 1 and 90),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean not null default false,
  razorpay_plan_monthly text check (razorpay_plan_monthly is null or razorpay_plan_monthly ~ '^plan_[A-Za-z0-9]{6,40}$'),
  razorpay_plan_yearly text check (razorpay_plan_yearly is null or razorpay_plan_yearly ~ '^plan_[A-Za-z0-9]{6,40}$'),
  updated_at timestamptz not null default now(),
  updated_by text,
  constraint festive_sales_window check (ends_at > starts_at)
);
alter table public.festive_sales enable row level security;
revoke all on public.festive_sales from anon, authenticated;
grant select, insert, update, delete on public.festive_sales to service_role;

-- Enrolment window; subscriptions retain the discounted plan after this window.
insert into public.festive_sales (slug, title, title_hi, discount_percent, starts_at, ends_at, active)
values ('diwali-2026', 'Diwali Festive Sale', 'दिवाली फ़ेस्टिव सेल', 25, '2026-10-24 00:00:00+05:30', '2026-11-15 23:59:59+05:30', true)
on conflict (slug) do nothing;

-- Which sale, if any, a subscription was bought under (for revenue reports and support).
alter table public.subscriptions add column if not exists festive_sale text;
alter table public.subscriptions add column if not exists razorpay_plan_id text;
alter table public.guest_checkouts add column if not exists festive_sale text;
alter table public.guest_checkouts add column if not exists razorpay_plan_id text;

alter table public.subscriptions add column if not exists recurring_amount_inr numeric(12,2);
alter table public.guest_checkouts add column if not exists recurring_amount_inr numeric(12,2);
commit;
