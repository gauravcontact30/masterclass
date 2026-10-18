The verified account `garvcontact30@gmail.com` is excluded from page visits, live presence, and successful-request analytics. Email matching ignores case and surrounding whitespace. The browser receives an HTTP-only opt-out cookie lasting one year; visits after sign-out in that browser remain excluded. A new browser cannot be identified until the account signs in.

Deploy the application and apply `supabase/migrations/0028_tracking_exclusion.sql` through the normal database migration process. The migration removes existing visits attributed to this account, anonymous visits linked to its recorded browser IDs, presence records, and page events. It preserves other signed-in users' visits and administrative/security audit records. Database triggers prevent future page and presence writes for this account, including writes outside these API routes.

The migration has been tested locally, not applied to the hosted database. Historical anonymous visits with no recorded link to the account cannot be identified reliably. Extra addresses in `TRACKING_EXCLUDED_EMAILS` are excluded by the application only; the database migration targets the requested account.

Security changes enforce the actual streamed tracking-body size, reject explicitly cross-site requests even without Origin, preserve failed-request telemetry despite analytics opt-out, and apply anti-framing, object-embedding, base-URL and device-permission restrictions across routes. These are targeted protections, not a full penetration test or a guarantee against compromise.

Validation: `node scripts/test-tracking-exclusion.mjs` and the tracking-security, presence-availability, request-tracing, authorization and super-admin Jest suites.
