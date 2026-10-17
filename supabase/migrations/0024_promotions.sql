-- Promotional tracking for the super admin's "Promotional Tracking" page (components/super-admin-promotions.tsx).
--
-- One row per promotion the team runs on a social platform: a post, reel, story, video, ad, article, group or
-- channel message. Each carries the utm_campaign its link uses, so the page can join it to real traffic in
-- public.site_visits (migration 0023), and the figures the platform reports (reach, impressions, engagement,
-- spend), which only the platform knows and an admin enters. Only the service role reads or writes it.

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  platform text not null check (platform in ('instagram', 'facebook', 'linkedin', 'telegram', 'youtube', 'x', 'whatsapp', 'other')),
  title text not null check (length(title) between 3 and 160),
  format text not null default 'post' check (format in ('post', 'reel', 'story', 'video', 'ad', 'article', 'group', 'channel', 'live')),
  status text not null default 'planned' check (status in ('planned', 'live', 'paused', 'ended')),
  url text check (url is null or (length(url) <= 500 and url ~ '^https?://')),
  utm_campaign text not null check (utm_campaign ~ '^[a-z0-9][a-z0-9_-]{0,79}$'),
  audience text check (audience is null or length(audience) <= 160),
  owner text check (owner is null or length(owner) <= 80),
  starts_on date,
  ends_on date,
  budget_inr numeric(12, 2) not null default 0 check (budget_inr >= 0),
  spend_inr numeric(12, 2) not null default 0 check (spend_inr >= 0),
  reach integer not null default 0 check (reach >= 0),
  impressions integer not null default 0 check (impressions >= 0),
  engagements integer not null default 0 check (engagements >= 0),
  followers_gained integer not null default 0 check (followers_gained >= 0),
  notes text check (notes is null or length(notes) <= 1000),
  constraint promotions_window check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create index if not exists promotions_platform_idx on public.promotions (platform, created_at desc);
create index if not exists promotions_campaign_idx on public.promotions (utm_campaign);

-- Attribution reads site_visits by campaign and source over a window.
create index if not exists site_visits_campaign_idx on public.site_visits (utm_campaign, created_at desc) where utm_campaign is not null;
create index if not exists site_visits_source_idx on public.site_visits (created_at desc, utm_source, referrer_host) where event = 'page_view' and not is_bot;

alter table public.promotions enable row level security;
revoke all on public.promotions from anon, authenticated;
