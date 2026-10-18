# Suggestion Box

## Database

Apply both migrations, in order, to the Supabase project configured by `NEXT_PUBLIC_SUPABASE_URL`, using the SQL editor or your migration pipeline. The service-role API key cannot run DDL. No new application secrets are required.

- `0025_suggestion_box.sql`: the tables, the paged listing and the single-suggestion update. This is live in production.
- `0026_suggestion_box_admin.sql` is additive. It adds `admin_list_suggestions_v2` (field-scoped search, the replied filter, reply counts, priority sort and an export page size of up to 1,000), `admin_bulk_update_suggestions` and `admin_delete_suggestions`. Until it is applied, the inbox runs in **basic mode**: the API falls back to 0025's listing, and the page shows a notice. Scoped search, the replied filter, priority sort, reply counts, bulk actions, delete and CSV export are disabled until then.

## Landing page

The header's Suggestion Box button is a pill that cross-fades through six light tones, one every ten seconds, with a shimmer, a floating icon and a pulsing "live" dot. Under `prefers-reduced-motion` only the colour change remains. At 1081–1340px and on phones, the button becomes a round icon, and its label stays in the accessibility tree. The dialog code is loaded on first hover, focus or click (`components/suggestion-box-panel.tsx`), so the navbar ships only the button.

`lib/suggestions.ts` must stay zod-free because the landing navbar imports it. The request schemas live in `lib/suggestions-schema.ts`, which only server routes import.

The public POST endpoint validates bounded fields and limits each network address to five submissions per hour. Email is optional and is not treated as a verified identity. The response returns a private tracking code once, and the contributor must save it before closing or reloading the page. Tracking codes are never put into URLs or browser storage. The database stores only a SHA-256 hash of the random 256-bit secret.

The public GET endpoint requires that secret in the Authorization header. It returns only the suggestion and its public reply and status history, excluding email, admin identity and priority. Reads are limited to 30 per minute. No emails are sent.

## Super admin → Suggestion Box

- **Tiles:** All, Awaiting review, Needs a reply, Urgent & open and Completed. Each tile is also a one-click filter.
- **Search:** a single bar with a clear button (Esc also clears it) and a **Search in** scope: all fields, title, message, contributor, replies or ID.
- **Filters:** status chips with whole-inbox counts. The Filters panel adds category, priority and replied/awaiting-reply chips, inclusive UTC dates and sorting (newest, oldest, recently updated, highest priority). Active filters show as removable tokens, with a "Clear all" control.
- **Table:** ten rows per page with server-side pagination. On phones and tablets (below 1280px beside the sidebar) the table becomes cards.
- **Row options (⋯ menu):** review & reply, copy the ID, email the contributor (`mailto:`), set the status, and delete.
- **Bulk actions:** select rows to set status or priority, or to delete. Each changed suggestion gets one history row, so a no-op change writes nothing. Deletion asks for confirmation and removes the replies with the suggestion.
- **Export CSV:** exports up to 1,000 rows matching the current filters. Cells are quoted, and formula prefixes are neutralised.
- **Review dialog:** a status picker, internal priority, quick-reply templates and a reply field. Saves are atomic and version-checked: stale edits get a conflict, and the admin must reload before saving again.

Both tables use RLS with no direct anon or authenticated access. Admin endpoints use the existing verified-owner authorization, and only the service role can execute the admin functions. All public data is rendered as text. The hosting proxy must overwrite forwarded IP headers for network-address rate limiting, consistent with the existing guest checkout endpoint.

## Validation

`node scripts/test-suggestions.mjs` runs both migrations on PGlite. It checks pagination, scoped search, the replied filter, reply counts, priority sort, the export size, bulk update and delete (with history and cascade), private-field exclusion and role isolation.

`npx jest --runInBand __tests__/suggestions.test.ts __tests__/suggestion-box-ui.test.tsx __tests__/landing-comparison-pagination.test.tsx` checks the API boundaries (bulk validation, the 0025 fallback, CSV escaping), the guest flow, admin paging, filters, bulk actions and the basic-mode notice.
