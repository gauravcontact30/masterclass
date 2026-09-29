# Razorpay subscriptions

## What is implemented

- Monthly and yearly subscriptions, at the existing configurable INR 299/month and INR 2,999/year defaults.
- Embedded Standard Checkout; server-owned subscription IDs, HMAC SHA-256 payment verification, authoritative provider reconciliation, and webhook signature checks.
- Server-side plan amount/currency/interval validation before checkout; no client amount or plan ID is trusted.
- Reuse of incomplete checkouts, duplicate checkout protection, and cleanup of losing concurrent subscription creations.
- Separate messages for success, activation pending, dismissal, provider failure and verification failure. A successful mandate alone never grants access.
- Scheduled cancellation for an active paid cycle; immediate cancellation for incomplete/failed subscriptions. Paid access ends at its stored expiry. Cancellation is irreversible at Razorpay; a new subscription may be purchased after the old paid period ends.
- Protected learning pages/APIs with a verified super admin exemption. Membership management remains available at `/dashboard?tab=plans` and through the learner profile menu.
- Latest 30 invoices for the current subscription, fetched server-side and scoped to the signed-in owner. Previous subscription invoices remain in Razorpay; the admin billing ledger retains webhook records.
- Super admin Revenue & billing: secret-presence indicators, test/live mode, plan validation, subscription table, payment/refund ledger and revenue summaries. No secret values are sent to the browser.
- Signed subscription events and `invoice.paid` reconcile the latest provider state. Optional scheduled reconciliation recovers missed webhooks. Disabling new checkout does not disable existing account management or webhooks.

## Configure Test Mode

1. In Razorpay, enable Subscriptions and generate **Test Mode** API keys. Set the five Razorpay variables shown in `docs/razorpay.env.example` in `.env` and deployment secrets.
2. Create two plans in the same account/mode: interval 1, period monthly, amount 29900 paise; interval 1, period yearly, amount 299900 paise, currency INR. If prices differ, also change `PRO_MONTHLY_PRICE_INR` / `PRO_YEARLY_PRICE_INR`. The app refuses mismatched prices or intervals. Each subscription has a maximum ten-year schedule (120 monthly or 10 yearly cycles); Razorpay mandates are not indefinite.
3. Apply the existing database migrations, including `0018_super_admin_monitoring.sql` (billing ledger) and the new `0021_subscription_reconciliation.sql`. Use the Supabase SQL editor or your normal migration deployment. The new migration does not create subscriptions or charge customers.
4. Configure a webhook to `https://YOUR_PUBLIC_DOMAIN/api/webhooks/razorpay` using your webhook secret. Localhost requires a public HTTPS tunnel pointing to your development server; register that public endpoint in Razorpay Test Mode.
5. Subscribe to `subscription.authenticated`, `subscription.activated`, `subscription.charged`, `subscription.pending`, `subscription.halted`, `subscription.paused`, `subscription.resumed`, `subscription.cancelled`, `subscription.completed`, plus `payment.captured`, `payment.failed`, `refund.processed`, `invoice.paid`, `invoice.expired`. Only enable events offered by your account. Lifecycle events remain authoritative for entitlement.
6. Set `BILLING_ENABLED=true`, keep `ALLOW_LIVE_BILLING=false`, restart the app, and run `node --env-file=.env scripts/check-razorpay.mjs`. This is a read-only provider check. You can also verify plans in the super admin billing panel.
7. For webhook-loss recovery, schedule a POST to `/api/internal/billing-reconcile` with `Authorization: Bearer <WORKER_SECRET>` every few minutes. Each call processes up to ten oldest nonterminal subscriptions; adjust schedule frequency for your volume. Treat non-200 responses as retryable and alert on persistent failures. Keep this secret server-side.

## End-to-end provider test checklist

Use a regular learner account, not the super admin (which bypasses subscription gates). Never use real payment details for a Test Mode checkout.

1. Open `/dashboard?tab=plans`, select preparation and a billing period, and choose the plan. Confirm the displayed amount and Razorpay amount agree.
2. Complete Checkout using Razorpay's current official subscription test payment details. Verify the server reports success, the subscription becomes active, and a previously blocked learning page/API is accessible.
3. Repeat with a separate learner for the yearly plan. Check the invoice and plan interval.
4. Close Checkout before paying, reopen it and confirm it reuses the pending subscription. Try changing the cycle: it must ask you to cancel the unfinished subscription first.
5. Simulate payment failure: confirm no access is granted, retry remains possible, and the disabled/loading state clears when Checkout closes.
6. Replay a valid webhook: no duplicate entitlement or double-counted revenue. Tamper with the body or signature: HTTP 401. Out-of-order lifecycle payloads must still fetch the provider's current state.
7. Trigger test renewal success and failure in Razorpay. Check the new expiry, pending grace window, halted state and recovery. Grace is capped at three days after the last stored paid expiry and retries do not extend it.
8. Cancel an active subscription from Membership. Confirm Razorpay schedules cancellation, renewal is marked off, and paid access persists until expiry. An incomplete subscription cancels immediately and can then be replaced.
9. Disable `BILLING_ENABLED`: checkout must stop, but signed webhooks, refresh, cancellation and invoice history must continue working.
10. Confirm a second learner cannot verify or view another learner's subscription/invoices, and unpaid users cannot access protected learning URLs directly.

## Automated checks and limits

`npx jest __tests__/billing-flow.test.ts __tests__/billing.test.ts __tests__/server-billing.test.ts __tests__/webhooks-razorpay.test.ts __tests__/razorpay-checkout.test.ts __tests__/membership.test.tsx __tests__/subscription-access.test.ts --runInBand`

`node scripts/test-database.mjs`

The lifecycle tests use real route handlers, HMAC verification and reconciliation code with a simulated Razorpay API/database adapter. The database script executes the real SQL functions in PGlite and checks concurrency-related invariants, duplicates, delayed events, cancellation preservation and bounded grace. These tests do **not** prove actual bank authorization, mandate registration, public webhook delivery or production provider connectivity.

Refunds and disputes are managed in the Razorpay Dashboard; refund events are recorded in the admin ledger. A refund does not automatically cancel a recurring mandate or revoke a paid subscription. Decide and publish your refund policy before accepting customers, and cancel the mandate separately when appropriate. No automatic refund issuance is implemented.

## Go live

Complete the checklist in Test Mode first. Use a separate live key pair, live plan IDs and live webhook configuration/secret, finish Razorpay activation and required business policies, then deliberately set `ALLOW_LIVE_BILLING=true` and `BILLING_ENABLED=true`. Restart/redeploy and recheck plan amounts and webhook delivery. This integration never switches itself to live mode.

References: [Razorpay subscription integration and signature verification](https://razorpay.com/docs/payments/subscriptions/integration-guide/), [subscription testing](https://razorpay.com/docs/payments/subscriptions/test/), [webhook validation](https://razorpay.com/docs/webhooks/validate-test/), [cancellation](https://razorpay.com/docs/api/payments/subscriptions/cancel-subscription/), [subscription invoices](https://razorpay.com/docs/api/payments/subscriptions/fetch-invoices).
