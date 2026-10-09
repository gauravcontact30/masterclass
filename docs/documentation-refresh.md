# Documentation refresh

The dashboard header's **Latest documentation** control checks the official
overview URL for any technology in `OFFICIAL_DOCS`. Use **Check selected** or
**Check all technologies**, review the fetched source, then **Import latest
source** / **Upgrade documentation**. Imported text is also shown above the
selected technology in the Official Documentation Hub.

## What is checked

- Checks fetch uncached text from approved official hosts, including every
  redirect. Requests time out after 20 seconds and reject oversized responses.
- Text is extracted from the overview page, up to 24,000 characters. This is
  a source snapshot, not a crawl of every page or an automatic rewrite of
  authored lessons, examples, translations, or version labels.
- The first successful check creates a baseline. After an import, a different
  normalized content hash produces an **Update available** notification.
- A failed check keeps the previous imported content and reports a failure.
- Checks run on dashboard mount when the last check is at least six hours old,
  and every six hours while the dashboard is open and visible. No background
  scheduler is installed; closed dashboards do not poll.

## Persistence and access

Snapshots live in the private Supabase Storage bucket `documentation-updates`,
which the server provisions. Published and pending revisions are saved together
per technology. The API serves only public official-source text; account data
is not included. Imports require the hash of the reviewed revision.

The control follows this application's public dashboard access. Mutations
reject cross-origin browser requests and are limited by the existing database
`rate_limit` function to a shared 120 requests per hour. Each check request is
limited to three catalog technology IDs, never client-provided URLs. Rechecks
within 60 seconds reuse the last successful check. Failed batches disclose
individual failures. Production requires the configured Supabase service role
and Storage service, just like bookmarks and learning marks.

## Missing monitoring schema

The restored database was reachable, but `learning_presence` and
`content_reports` were missing. Both are defined in the existing migration
`supabase/migrations/0019_admin_operations.sql`, which also installs the
operations functions and access restrictions. Apply that pending migration
through your normal Supabase migration workflow or SQL Editor; this migration
expects the preceding migrations, including `0018`, to have been applied.

Until then, presence tracking reports `enabled: false` and stops its heartbeat
instead of repeatedly throwing HTTP 500 errors. The server retries schema
availability after five minutes; reload the dashboard after applying the
migration. Documentation refresh does not depend on these optional tables.
