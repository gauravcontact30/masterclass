-- Whether a page view came from a private (incognito) window, as the browser reported it (lib/early-track.ts):
-- true / false from Firefox and Safari, null where the browser cannot tell (Chromium) or before this column existed.
-- /api/track and the Overview's Live visitor stream both work without it; apply it to record the browser's answer.
alter table public.site_visits add column if not exists private_mode boolean;
