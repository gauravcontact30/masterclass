-- Migration 0036: Expand supported profile and upload languages to include major global tech & AI languages
-- Supported: en (English), hi (Hindi), es (Spanish), ja (Japanese), de (German), fr (French), zh (Chinese)

do $$
begin
  -- Drop and update check constraint on public.profiles
  alter table public.profiles drop constraint if exists profiles_language_check;
  alter table public.profiles add constraint profiles_language_check
    check (language in ('en', 'hi', 'es', 'ja', 'de', 'fr', 'zh'));

  -- Drop and update check constraint on public.learning_uploads if it exists
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'learning_uploads') then
    alter table public.learning_uploads drop constraint if exists learning_uploads_language_check;
    alter table public.learning_uploads add constraint learning_uploads_language_check
      check (language in ('all', 'en', 'hi', 'es', 'ja', 'de', 'fr', 'zh'));
  end if;
exception
  when others then
    raise notice 'Migration 0036 constraint update notice: %', sqlerrm;
end $$;
