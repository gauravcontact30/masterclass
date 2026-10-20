-- Idempotent: safe to run again where already applied.
-- Finer IP-based location for the Super Admin's new-user location cards: the postal (PIN) code and the approximate
-- coordinates the hosting platform derives from the address (x-vercel-ip-postal-code / -latitude / -longitude).
-- Coordinates are a city or network centroid, not a street or village; the nearest major city is computed from them
-- at read time (lib/nearby-city.ts). app/api/track/route.ts keeps writing visits without these columns until this runs.
alter table public.site_visits add column if not exists postal_code text;
alter table public.site_visits add column if not exists latitude double precision;
alter table public.site_visits add column if not exists longitude double precision;

create index if not exists site_visits_user_time on public.site_visits(user_id, created_at) where user_id is not null;
