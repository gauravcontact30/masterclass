# Audience and country access

- Tech professionals and tech college students: worldwide landing page, Learning Dashboard, Tech Buzz and its articles.
- Board exam aspirants: India only, UP Board / CBSE / ICSE (Class 10) and ISC (Class 12). The board picker supports only Classes 10 and 12.
- Indian government job seekers: India only, including Defence, Banks, Railways, Police, IAS / UPSC Civil Services and PCS / State PSC.

The two India audiences share the existing Exams account and membership. Tech accounts remain separate. This change does not migrate accounts or alter subscriptions.

## Production country source

On Vercel (`VERCEL=1`), the application uses the platform-provided `x-vercel-ip-country` header automatically. See https://vercel.com/docs/headers/request-headers.

For a different deployment, set `TRUSTED_GEO_PROVIDER=cloudflare` (or `vercel` for a trusted Vercel ingress). The selected ingress MUST overwrite the country header and the origin MUST be inaccessible except through that ingress. Never enable this on a directly reachable server that accepts visitor-supplied country headers.

Only `IN` enables Exams. Missing, invalid, unknown or untrusted country information produces the worldwide Tech experience. Browser language, currency, cookies, account preferences and query parameters cannot grant access. No public country switch is provided.

The landing HTML is globally cacheable and contains the Tech experience. Its India sections are mounted after the uncached `/api/geo` response. No India content flashes while detection is pending or fails. Returning to a tab or restoring a page rechecks the decision. Direct exam navigation, legacy learning URLs, prefetch/RSC requests and Exams APIs are gated in `proxy.ts`; account entry and shared API account selection also check the country on the server. Denials and personalized responses use `private, no-store`.

Exams pages are noindex and absent from the global sitemap. Tech Buzz stays publicly accessible and indexable.

## Local checks

Localhost has no platform geolocation. Set `DEV_VISITOR_COUNTRY=IN` in the development server environment and restart it to preview all audiences. Use `US` for Tech only, or unset it to test unknown location. This override is ignored in production. Do not set a NEXT_PUBLIC country override.

Run `npx jest --runInBand __tests__/audience-access.test.ts __tests__/audience-ui.test.tsx __tests__/audience-portal.test.ts`.

This is IP-country access control, not proof of citizenship, student enrollment or exam eligibility. VPNs and travel can change the detected country. Existing sign-in and paid-access checks still apply.
