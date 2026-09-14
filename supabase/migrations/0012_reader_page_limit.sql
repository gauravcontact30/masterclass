-- Hand-authored guides can contain up to 900 pages (React 19 has 530 slides).
-- The progress endpoint also checks each page against the document's actual length.
alter table public.learning_progress
  drop constraint if exists learning_progress_page_check;
alter table public.learning_progress
  add constraint learning_progress_page_check check (page between 1 and 900);
