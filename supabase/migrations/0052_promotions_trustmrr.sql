-- Trust MRR joins the tracked promotion platforms (components/super-admin-promotions.tsx, lib/promotions.ts).
-- Adds the platform and a "listing" format. Its manual figures live in promotions.platform_metrics:
--   trustmrr: listing_views, website_clicks, upvotes, followers, mrr_inr
begin;
alter table public.promotions drop constraint if exists promotions_platform_check;
alter table public.promotions add constraint promotions_platform_check check (platform in
  ('instagram','facebook','linkedin','telegram','medium','pinterest','coursera','trustmrr','youtube','x','whatsapp','google_search','other'));
alter table public.promotions drop constraint if exists promotions_format_check;
alter table public.promotions add constraint promotions_format_check
  check (format in ('post','reel','story','video','ad','article','pin','idea_pin','board','course','lecture','group','channel','live','listing'));
commit;
