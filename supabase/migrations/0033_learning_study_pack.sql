-- Upload Learning study packs: what the Learning Dashboard shows for an upload besides its document. A thumbnail
-- and illustrations painted through Vercel AI Gateway, and a generated pack (description, most-asked interview
-- questions, workflow, diagram) kept as JSON. `published_at` is when the upload first went live, for the card's
-- date. The app reads and writes these columns best-effort, so publishing keeps working before this is applied.
-- Safe to re-run.
begin;
alter table public.learning_uploads add column if not exists thumbnail_url text check (thumbnail_url is null or thumbnail_url ~ '^https://');
alter table public.learning_uploads add column if not exists study_pack jsonb;
alter table public.learning_uploads add column if not exists pack_status text not null default 'none' check (pack_status in ('none','generating','ready','failed'));
alter table public.learning_uploads add column if not exists pack_error text check (length(pack_error) <= 300);
alter table public.learning_uploads add column if not exists published_at timestamptz;
update public.learning_uploads set published_at = coalesce(starts_at, updated_at) where status = 'published' and published_at is null;
notify pgrst, 'reload schema';
commit;
