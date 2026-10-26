# Visitor reporting

Apply `supabase/migrations/0040_overall_visitor_tracking.sql` before deploying these changes. The migration adds read-only, service-role-only reporting functions; it does not change visit retention. Overall Visitors Tracking counts all retained non-bot page views in PostgreSQL, without the API's former 20,000-row cap. Daily drill-down trails still disclose their 20,000-record limits. Overall summary counts are not derived by adding platform or daily unique-browser counts.

Overall coverage is the recorded date range, not lifetime history. The application currently retains visits for five days (`lib/visit-retention.ts`). Pruned history cannot be reconstructed. Browser IDs are not people: cookies, blockers and unavailable referrers affect coverage. Locations are approximate.

The Platforms cards refresh website referral traffic every 30 seconds while visible. UTM sources take precedence over referrers. Attribution advances chronologically and never rewrites earlier direct views. Cross-platform browser/session totals are deduplicated and chart dates use IST. New accounts are accounts created in the selected window and observed via a source; this is observational attribution, not proof that a platform caused a signup. Active members require both active status and an unexpired paid period.

Platform impressions, reach, engagement, revenue and promotion status remain manually entered values. They are labelled as such and are not live integrations with external social accounts. Their reporting periods may differ from website traffic. Overall sources include direct and non-social referrals. Unknown data is not invented.

Visible reports update every 30 seconds, show their last successful refresh and retain an error indication when stale. Hidden tabs pause polling; returning to the tab refreshes overall and platform reports immediately. Daily email enrichment is one database query per batch of 200 accounts instead of one remote auth request per account.

Verification: visitor reporting unit/API/UI tests and `node scripts/test-overall-visitors.mjs` (20,005 views from one browser verifies totals are uncapped and distinct counts are not inflated).
