-- Crawler fleets with an emulated near-square desktop screen (audit 2026-11-25).
--
-- lib/visit-quality.ts now treats a Desktop page view whose physical screen is near-square
-- (0.85 <= height / width <= 1.2) as automated: real desktop displays run from 16:9 to 5:4, or portrait when rotated.
-- In the five days audited, 561 of 734 sessions not already marked as bots had such a screen (1280x1200 and 1366x1366
-- on Asia/Shanghai time from US, CA and SG addresses; randomised ~1390x1270 on zh-CN from Beijing, Hong Kong and
-- Singapore), all with no referrer and one or two pages. /api/track marks new ones is_bot on arrival; this marks the
-- rows already stored, whole sessions at a time, so every report that reads "not is_bot" (admin_user_activity_since,
-- admin_activity_breakdowns, traffic sources, portals, page signals) leaves them out as the Live visitor stream does.
--
-- Reversible with the same predicate (set is_bot = false) if ever needed.

update public.site_visits s
set is_bot = true
where not s.is_bot
  and s.session_id in (
    select distinct v.session_id from public.site_visits v
    where v.event = 'page_view' and v.device = 'Desktop' and v.screen ~ '^[0-9]+x[0-9]+$'
      and split_part(v.screen, 'x', 1)::numeric > 0
      and split_part(v.screen, 'x', 2)::numeric / split_part(v.screen, 'x', 1)::numeric between 0.85 and 1.2);
