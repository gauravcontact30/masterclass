# Visitor reporting

## Google Search and platform attribution (2026-10-29)

Apply `supabase/migrations/0047_promotions_google_search.sql` after the existing migrations and before deploying. It allows Google Search promotion records and indexes the paged website-report scan. It does not change retention or grant public access. Validate locally with `node scripts/test-promotions-google.mjs`. The migration has been tested locally; it has not been applied to the connected production database by this change.

Google Search now appears in platform cards, charts, campaigns, landing pages, and the daily platform selector. Recognized search referrers use Google's published domain list and exclude Google Mail, Docs, Accounts and lookalike domains. `utm_source=google` requires an explicit search medium (`organic`, `cpc`, `ppc`, `paidsearch`, `paid_search`); `google_search` is also recognized. Explicit unrelated UTM sources override referrers. A referrer alone cannot establish organic versus paid traffic or reveal a search query. The link builder produces `google/cpc` links for ads; do not tag organic canonical URLs.

Ingestion and daily/platform reports share source resolution. Campaign-only links retain their source and update the campaign; explicit new sources clear old campaigns. Admin/API paths are excluded. Browser events wait for the preceding response, including the early view, to avoid competing first-visit cookies. This only serializes requests from one page; it does not guarantee cross-tab identity or recover blocked/lost requests.

Each platform shows recorded views, unique browser/session counts, observed new accounts and active memberships, latest recorded activity, UTM/referrer evidence, and tagged paid/organic subsets. No traffic means no evidence, not a verified healthy integration. Native platform metrics are explicitly manual: Instagram likes/comments/shares/saves/profile visits/link clicks; Facebook reactions/comments/shares/link clicks/video views; LinkedIn reactions/comments/reposts/link clicks; Telegram views/reactions/shares/subscribers; YouTube views/watch hours/likes/comments/subscribers; X likes/replies/reposts/link clicks/bookmarks; WhatsApp sent/delivered/read messages; and the existing Medium, Pinterest and Coursera fields. These are stored and validated by the promotion backend, not fetched from social accounts. Availability and definitions depend on the platform/account/content type. Enter non-overlapping periods: reach totals are not deduplicated people, and provider metrics are not comparable across platforms.

## Search Console setup

The application includes an independent super-admin-only endpoint at `/api/super-admin/promotions/search-console?days=30` using Google's official authentication library and read-only Search Console scope. A verified Search Console property in a browser does not automatically authorize this server.

Configure these **server-only** environment variables locally in `.env` and in the deployment's secret settings (never `NEXT_PUBLIC_*`, never commit a private key):

```dotenv
GOOGLE_SEARCH_CONSOLE_PROPERTY=https://www.masterclassbuddy.com/tech-buzz
GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL=<service-account-email>
GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY=<service-account-PEM-private-key>
```

The default property above is the URL supplied by the owner. Confirm that this exact URL-prefix property exists in Search Console; its scope is only `/tech-buzz`. For all pages, use the exact root URL-prefix property `https://www.masterclassbuddy.com/` or the domain property `sc-domain:masterclassbuddy.com`, if verified. A domain URL and a domain property identifier are different; trailing slashes and prefixes must match Google's registered identifier.

Enable the Search Console API in the service account's Google Cloud project. Grant that service account read access to the chosen Search Console property, and supply its key through secret settings. Both multiline PEM values and literal `\n` escapes are supported. Restart/redeploy after changing credentials. Credentials and OAuth tokens stay server-side. This task did not create credentials or change Google account permissions. The existing local environment contains no Search Console credentials, so live Google metrics remain unverified until this setup is completed.

The Google section shows property, requested date range, fetch timestamp, finalized web-search clicks/impressions/CTR/average position, daily data, top 100 queries/pages, countries, and devices. Totals are fetched separately without dimensions, never reconstructed from the truncated query/page tables. Search Console uses **Pacific time**; website reports use **IST**. The window ends yesterday in Pacific time, and recent finalized data can still be absent. Queries can be privacy-filtered and Google limits returned rows. A missing configuration, denied access, invalid provider response, or rate limit is displayed explicitly rather than fabricated zero metrics. These limitations mean neither this application nor Search Console can promise 100% attribution coverage.

Sources: [Search Analytics API](https://developers.google.com/webmaster-tools/v1/searchanalytics/query), [Google service-account authentication](https://developers.google.com/identity/protocols/oauth2/service-account), [Search Console and Analytics differences](https://developers.google.com/search/docs/monitor-debug/google-analytics-search-console), [Google search domains](https://www.google.com/supported_domains).

## Performance and validation

Website reports share concurrent reads and cache successful results for 15 seconds per server instance, with authorization performed on every request and local invalidation after promotion changes. Other instances can retain their cached result for at most 15 seconds. User enrichment runs at most eight database queries concurrently. Promotion grouping avoids rescanning all promotions for every campaign. Counts remain uncapped. Search Console shares requests and caches successful results for 15 minutes to respect provider quotas; failed reads are not cached. All HTTP responses remain private/no-store, and hidden tabs pause polling. These are scoped performance improvements, not a whole-application benchmark.

Read-only connected-database audit on 2026-10-29: website visit storage and the overall reporting RPC responded successfully; 238 retained non-bot page views and zero registered promotions were present. This verifies storage/report availability, not every external platform's attribution. No production records were inserted for testing.

Regression tests cover host/UTM classification, campaign transitions, Google funnels/daily reports, cookie request ordering, super-admin access, Google promotion CRUD and metric validation, Search Console failures/empty results/date boundaries, cache behavior and UI provenance. `npm run typecheck` and targeted ESLint validate the implementation. Broader Tech Buzz tests currently have unrelated language/font expectations failing; their default `showcase=false` does not render the changed earlier-editions section.

The Tech Buzz **From earlier editions** section now starts with a selected **All** tab. It shows all loaded earlier-edition articles together, newest first, without per-track pagination in that view. The listing now fetches cached article summaries instead of full article bodies and comments. Technology tabs keep their pagination; only the active tab's articles are mounted. The newest edition stays in Today's 5 at 5.

## Existing overall reporting

Apply `supabase/migrations/0040_overall_visitor_tracking.sql` before deploying these changes. The migration adds read-only, service-role-only reporting functions; it does not change visit retention. Overall Visitors Tracking counts all retained non-bot page views in PostgreSQL, without the API's former 20,000-row cap. Daily drill-down trails still disclose their 20,000-record limits. Overall summary counts are not derived by adding platform or daily unique-browser counts.

Overall coverage is the recorded date range, not lifetime history. The application currently retains visits for five days (`lib/visit-retention.ts`). Pruned history cannot be reconstructed. Browser IDs are not people: cookies, blockers and unavailable referrers affect coverage. Locations are approximate.

The Platforms cards refresh website referral traffic every 30 seconds while visible. UTM sources take precedence over referrers. Attribution advances chronologically and never rewrites earlier direct views. Cross-platform browser/session totals are deduplicated and chart dates use IST. New accounts are accounts created in the selected window and observed via a source; this is observational attribution, not proof that a platform caused a signup. Active members require both active status and an unexpired paid period.

Platform impressions, reach, engagement, revenue and promotion status remain manually entered values. They are labelled as such and are not live integrations with external social accounts. Their reporting periods may differ from website traffic. Overall sources include direct and non-social referrals. Unknown data is not invented.

Visible reports update every 30 seconds, show their last successful refresh and retain an error indication when stale. Hidden tabs pause polling; returning to the tab refreshes overall and platform reports immediately. Daily email enrichment is one database query per batch of 200 accounts instead of one remote auth request per account.

Verification: visitor reporting unit/API/UI tests and `node scripts/test-overall-visitors.mjs` (20,005 views from one browser verifies totals are uncapped and distinct counts are not inflated).
