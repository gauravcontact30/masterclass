-- Promotional tracking for Medium, Pinterest and Coursera (components/super-admin-promotions.tsx, lib/promotions.ts).
--
-- Widens the platform and format checks of public.promotions (migration 0024) and adds platform_metrics: the
-- figures only one platform reports, which an admin copies from its analytics. Keys per platform:
--   medium:    views, reads, claps, responses, member_reading_minutes, earnings_inr
--   pinterest: saves, pin_clicks, outbound_clicks, video_views
--   coursera:  enrollments, active_learners, completions, ratings, rating_average, earnings_inr
-- The API validates the keys and values; the database only insists on a JSON object.

begin;

alter table public.promotions drop constraint if exists promotions_platform_check;
alter table public.promotions add constraint promotions_platform_check
  check (platform in ('instagram', 'facebook', 'linkedin', 'telegram', 'medium', 'pinterest', 'coursera', 'youtube', 'x', 'whatsapp', 'other'));

alter table public.promotions drop constraint if exists promotions_format_check;
alter table public.promotions add constraint promotions_format_check
  check (format in ('post', 'reel', 'story', 'video', 'ad', 'article', 'pin', 'idea_pin', 'board', 'course', 'lecture', 'group', 'channel', 'live'));

alter table public.promotions add column if not exists platform_metrics jsonb not null default '{}'::jsonb;
alter table public.promotions drop constraint if exists promotions_platform_metrics_object;
alter table public.promotions add constraint promotions_platform_metrics_object check (jsonb_typeof(platform_metrics) = 'object');

commit;
