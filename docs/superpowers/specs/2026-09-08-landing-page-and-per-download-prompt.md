# Claude Code Prompt — Marketing Landing Page + Pay-Per-Download Tier

Paste this whole file as the instruction to a Claude Code session working in
this repo. It is scoped to the two things that are genuinely missing —
everything else it references already exists and works; do not rebuild it.

## Context: what already exists (do not recreate)

This is **not** a greenfield project. The app already has, fully working:

- Clerk auth + Supabase DB (`lib/server/db.ts`, `lib/supabase*`), Clerk→Supabase
  identity via native third-party-auth JWT bridging.
- Razorpay **subscriptions** (Monthly ₹299 / Yearly ₹2999): checkout
  (`components/membership.tsx` → `POST /api/billing`), webhook verification +
  reconciliation (`app/api/webhooks/razorpay/route.ts`,
  `lib/server/billing.ts`, the `apply_subscription` SQL RPC in
  `supabase/migrations/0001_masterclass.sql`), advisory-locked idempotent
  quota/usage tracking (`reserve_document`, `usage_periods`).
- Technology + Topic dropdowns → Claude-generated PDF/PPTX curricula
  (`components/generation-form.tsx`, `lib/domain.ts` schemas,
  `app/api/documents/route.ts`, `lib/server/worker.ts`).
- "Learn in App" modal (`components/learn-modal.tsx`) with TOC, bookmarks,
  notes, zoom, fullscreen, and a sandboxed **interactive JS code playground**
  (`components/playground.tsx`, gated by `NEXT_PUBLIC_PLAYGROUND_ENABLED`).
- Three selectable generated-document styles (`theme` enum in
  `lib/domain.ts`): `minimal` ("Minimalist Tech"), `corporate` ("Clean
  Corporate"), `cyberpunk` ("Cyberpunk") — all three already ship, user
  picks per generation.
- Direct Figma + Canva integrations — OAuth connect, browse, export
  (`components/connections.tsx`, `app/api/integrations/**`,
  `lib/server/design.ts`) — this is the "direct third-party API hook" design
  path; there is no separate simulated-webhook design-token path in the
  current app and this prompt does not add one.
- English/Hindi i18n, default English, persisted (`components/language-provider.tsx`,
  `lib/i18n.ts` — flat `en`/`hi` objects keyed by `TranslationKey`).
- Jest + React Testing Library (`__tests__/`, `jest.config.mjs`) and a
  PGlite-based SQL/RLS integration test (`scripts/test-database.mjs`, run via
  `npm run test:db`).

`app/layout.tsx` already sets `signInFallbackRedirectUrl="/dashboard"` and
`signUpFallbackRedirectUrl="/dashboard"` — i.e. the app already expects `/`
to be free for something other than the authenticated shell. `app/page.tsx`
and `app/dashboard/page.tsx` currently render the identical `<Workspace/>`;
that duplication is what Task 1 resolves.

Match the existing code's density/style in any file you touch (compact
inline JSX, `useLanguage()`/`TranslationKey` for all copy, `errorKey`/
`requestJson` for client fetches, `HttpError` + typed error codes on the
server, security-definer SQL RPCs for anything that touches money or quota).
Do not introduce a new component library, a new i18n mechanism, or a second
state-management approach.

---

## Task 1 — Public marketing landing page at `/`

**Goal:** `/` becomes a real, signed-out-friendly marketing page. Signed-in
visitors hitting `/` are redirected to `/dashboard` (which keeps working
exactly as it does today — do not change `app/dashboard/page.tsx`).

1. In `app/page.tsx`, check auth server-side (same pattern as
   `app/dashboard/page.tsx`'s `auth.protect()`, but here: if `authConfigured()`
   and a user is signed in, `redirect("/dashboard")`; otherwise render a new
   `LandingPage` component). Keep `dynamic = "force-dynamic"`.
2. Build one reusable, accessible autoplay carousel —
   `components/carousel.tsx` — and use it for **both** the hero and the
   testimonials section below, rather than writing two separate slider
   implementations. Requirements:
   - Auto-advances on an interval (~5s), pauses on hover/focus and while a
     user is interacting with prev/next/dots.
   - Skips/disables autoplay entirely when
     `window.matchMedia("(prefers-reduced-motion: reduce)").matches`.
   - Keyboard operable (arrow keys / focusable dot buttons), proper
     `aria-live`/`aria-roledescription="carousel"` semantics.
   - Full-width (edge-to-edge) at the hero call site; the same component
     renders narrower for testimonials via props/className, not a fork.
3. `components/landing-page.tsx` (new), composed of:
   - **Nav**: wordmark, language toggle (reuse `useLanguage`), `Sign in`
     (`/sign-in`) and `Get started` (`/sign-up`) — reuse existing Clerk
     routes, don't add new auth pages.
   - **Hero carousel** (4 slides), one real feature per slide: (a) pick a
     technology/topic from two dropdowns → get a structured PDF/PPTX guide,
     (b) Learn in App modal with notes/bookmarks/zoom + interactive code
     playground, (c) three document styles — Minimalist Tech / Clean
     Corporate / Cyberpunk, (d) import your own Figma/Canva design system.
   - **Feature grid**: static cards restating those four plus EN/हिन्दी
     support and flexible pricing, for users who don't wait through the
     slider.
   - **Try it free**: reuse the existing `SampleLessons` component as-is
     (it already opens `LearnModal` with `sampleResource` and needs no
     auth) so visitors can open a real sample before signing up.
   - **Testimonials carousel**: 6 entries using the same `Carousel`
     component. Use clearly-fictional placeholder names/quotes (e.g. "Aisha
     R., B.Tech CSE" — invented) and leave a `// TODO(real-quotes): replace
     placeholder testimonials before launch` comment directly above the
     data array so no one ships fake attributed quotes by accident.
   - **Pricing section**: read-only cards mirroring `/api/billing`'s tiers
     (Free / Monthly / Yearly / **Per Download**, see Task 2) — same prices,
     same `Intl.NumberFormat` INR formatting already used in
     `components/membership.tsx`. CTA on every paid card points to
     `/sign-up`, not a checkout action (no purchase before auth).
   - **Footer**.
4. Add every new string to **both** `en` and `hi` in `lib/i18n.ts`, following
   the existing flat-key convention exactly (no nested objects, no new i18n
   library).
5. Tests (`__tests__/components/landing-page.test.tsx`,
   `__tests__/components/carousel.test.tsx`): carousel autoplay advances
   slides on a mocked timer, pauses on hover/focus, honors
   `prefers-reduced-motion` (mock `matchMedia`), and is operable via
   keyboard/dot buttons; landing page renders nav/hero/pricing and the
   sign-in/get-started links point at the right routes.

---

## Task 2 — Per-download pricing tier (₹49, one-time Razorpay payment)

**Goal:** a user who has exhausted their free monthly quota (or has no
subscription) can pay ₹49 once via Razorpay to unlock exactly one additional
document generation/download, without starting a subscription. This is
additive to the existing `free`/`monthly`/`yearly` tiers, not a replacement —
`Tier` in `lib/domain.ts` stays as-is; credits are an orthogonal balance.

**Reuse the existing checkout→webhook→refresh pattern** (see
`components/membership.tsx`'s `paymentPending`/"refresh" flow) rather than
adding client-side payment verification — Razorpay Checkout.js confirms the
popup succeeded, but the balance is only ever credited by the HMAC-verified
webhook, exactly like subscriptions today.

1. **Migration** `supabase/migrations/0002_download_credits.sql` (additive,
   same style as `0001_masterclass.sql`):
   - `alter table public.profiles add column credit_balance integer not null default 0 check (credit_balance >= 0);`
   - `alter table public.documents add column used_credit boolean not null default false;`
   - New SQL function `public.credit_download(p_event text, p_user text, p_credits integer)`,
     mirroring `apply_subscription`'s idempotency: advisory-lock on
     `p_user`, no-op (return `false`) if `p_event` already exists in
     `webhook_events` for provider `razorpay`, otherwise
     `update profiles set credit_balance = credit_balance + p_credits`,
     insert into `webhook_events`, return `true`. `security definer`,
     `revoke all ... grant execute ... to service_role` only, same as the
     other RPCs.
   - Modify `reserve_document`: when `used_count >= p_limit`, instead of
     immediately raising `quota_exceeded`, try
     `update profiles set credit_balance = credit_balance - 1 where id = p_user and credit_balance > 0 returning credit_balance` —
     if that update affects no row, raise `quota_exceeded` as today; if it
     succeeds, insert the document row with `used_credit = true` and skip
     incrementing `usage_periods`.
   - Modify `fail_document`'s refund branch: check `item.used_credit` — if
     true, refund via `update profiles set credit_balance = credit_balance + 1 where id = item.user_id`
     instead of decrementing `usage_periods.used`. Same for `claim_document`'s
     expired-lease refund branch.
2. **`lib/server/billing.ts`**: add `createDownloadOrder(userId: string)`
   calling Razorpay's Orders API (`orders`, not `subscriptions`) for
   ₹49.00 (amount in paise: `4900`), `notes: { user_id: userId, kind:
   "download_credit" }`. Add `reconcileDownloadCredit(orderId, paymentId,
   eventId)` that looks up the order's `notes.user_id` from Razorpay (do not
   trust a client-supplied user id) and calls the `credit_download` RPC.
3. **`app/api/billing/route.ts`**: add a `"buyDownloadCredit"` action
   returning `{ order_id, amount, currency, key_id }` for the client to open
   Razorpay Checkout.js with (do not return a hosted `short_url` — one-time
   orders use the embedded Checkout modal, unlike the subscription flow's
   redirect).
4. **`app/api/webhooks/razorpay/route.ts`**: branch on `event.event` —
   keep the existing `subscription.*` handling untouched; add handling for
   `payment.captured` where `payload.payment.entity.order_id` and
   `notes.kind === "download_credit"`, calling `reconcileDownloadCredit`.
   Continue using the SHA-256 hash of the raw verified body as the
   idempotency key, consistent with the existing subscription branch.
5. **`components/membership.tsx`**: add a 4th pricing card, "Per Download",
   ₹49, one `Buy a download` button. On click, call the new billing action,
   then load Razorpay's Checkout.js (`https://checkout.razorpay.com/v1/checkout.js`)
   and open it with the returned `order_id`/`amount`/`key_id`. On modal
   dismiss (success or cancel), just show the same `paymentPending`-style
   message and rely on the existing "Refresh" button (already present in
   this component) to reflect the credited balance — no new verification
   endpoint.
6. Surface `credit_balance` in `/api/account`'s response and in
   `components/workspace.tsx`'s stats grid (a `Download credits` stat next
   to `remaining`/`materials`), and in the `quota_exceeded` error banner —
   when `credit_balance > 0`, don't show the upgrade-only message; mention
   the available credit instead.
7. Add `perDownload`, `buyDownloadCredit`, `downloadCredits`,
   `creditAvailable` (etc., as needed) to **both** `en` and `hi` in
   `lib/i18n.ts`.
8. **Tests**: extend `scripts/test-database.mjs` following its existing
   `assert`-based style — cover: exhausting the free quota then spending a
   credit succeeds and does not touch `usage_periods`; `credit_download` is
   idempotent on a repeated `p_event`; a failed credit-funded document
   refunds `credit_balance` (not `usage_periods.used`). Add a Jest test for
   the webhook route's new `payment.captured` branch (mirroring the existing
   `__tests__` coverage style for the `subscription.*` branch) and a
   component test for the new pricing card and Checkout.js invocation
   (mock the script/`window.Razorpay`).

## Explicit non-goals for this pass

- No bulk credit packs (buy 5/10 at once) — single ₹49-per-download only.
- No changes to the existing subscription checkout/webhook/refresh flow
  beyond adding the new branch alongside it.
- No changes to `app/dashboard/page.tsx`, the generation engine, the Learn
  in App modal, or the Figma/Canva integrations.
- Real testimonial content is out of scope — ship clearly-marked placeholders.
