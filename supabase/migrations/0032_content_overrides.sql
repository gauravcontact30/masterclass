-- Learning Dashboard content editing: the Super Admin edits the text of any built-in card or section in place, or
-- removes it, and every user (dashboard and landing previews) sees the result. The built-in content stays in the
-- codebase; a row here only overrides named text fields of one item, or hides it, so any change can be reset.
-- Every write is kept in content_override_history for audit and undo.
-- Row level security is on with no policies, so every read and write goes through the server's validated
-- endpoints (Super Admin only for writes). Safe to re-run: every object is created only if missing.
begin;
create table if not exists public.content_overrides (
  -- "<kind>:<id>", e.g. "pulse:langgraph-checkpoints" or "section:ai-pulse".
  key text primary key check (key ~ '^[a-z][a-z0-9-]{0,30}:[A-Za-z0-9._:/-]{1,160}$'),
  -- Field name → replacement text, e.g. {"title": "…", "points.0": "…"}.
  fields jsonb not null default '{}'::jsonb check (jsonb_typeof(fields) = 'object' and octet_length(fields::text) <= 200000),
  deleted boolean not null default false,
  updated_by text,
  updated_at timestamptz not null default now()
);
create table if not exists public.content_override_history (
  id bigint generated always as identity primary key,
  key text not null,
  action text not null check (action in ('edit','reset','delete','restore')),
  field text,
  before text,
  after text,
  actor text,
  created_at timestamptz not null default now()
);
create index if not exists content_override_history_key_time on public.content_override_history (key, created_at desc);
alter table public.content_overrides enable row level security;
alter table public.content_override_history enable row level security;
revoke all on public.content_overrides, public.content_override_history from anon, authenticated;
commit;
