-- Every library opens with the shared "Complete Next.js 16 path" guide in all
-- three formats, seeded on first account read (lib/server/default-library.ts).
-- This marker records that the seed already ran for an account, so a learner
-- who deliberately deletes one of the three copies does not get it re-added
-- on their next dashboard load.
alter table public.profiles add column if not exists default_library_at timestamptz;
