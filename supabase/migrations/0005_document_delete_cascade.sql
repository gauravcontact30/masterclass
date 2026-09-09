-- Lets a user delete a document without a dangling learning_progress row
-- blocking it with a foreign-key violation. Additive: only changes ON DELETE
-- behaviour, no data moves.
alter table public.learning_progress drop constraint learning_progress_document_id_fkey;
alter table public.learning_progress add constraint learning_progress_document_id_fkey
  foreign key (document_id) references public.documents(id) on delete cascade;
