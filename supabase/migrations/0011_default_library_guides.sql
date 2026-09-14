-- Libraries are now seeded with several versioned default guides (Next.js 16
-- and React 19, see lib/server/default-library.ts) instead of one. Each entry
-- records "<guide id>@<version>" once that guide is in the account, so a new
-- guide is added to existing libraries, a new version of a guide refreshes
-- the seeded copies in place, and a deliberately deleted copy stays deleted.
alter table public.profiles add column if not exists default_library_guides text[] not null default '{}';

-- Accounts seeded before this column existed received version 1 of the
-- Next.js guide; record that so they get the React guide added and their
-- Next.js copies refreshed, rather than a duplicate Next.js seed.
update public.profiles
set default_library_guides = array['nextjs-16@1']
where default_library_at is not null and default_library_guides = '{}';
