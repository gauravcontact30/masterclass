-- Google Search shares the existing promotion CRUD and website attribution pipeline.
begin;
alter table public.promotions drop constraint if exists promotions_platform_check;
alter table public.promotions add constraint promotions_platform_check check (platform in
  ('instagram','facebook','linkedin','telegram','medium','pinterest','coursera','youtube','x','whatsapp','google_search','other'));
-- Supports the uncapped keyset report scan without sorting the full event table.
create index if not exists site_visits_promotion_scan_idx on public.site_visits (id, created_at)
  where event = 'page_view' and not is_bot;
commit;
