# Masterclass Platform — Design Spec

Date: 2026-09-08
Status: Approved for planning

## 1. Summary

Masterclass is a subscription-based Next.js 16 (App Router) platform where
college students pick a category + topic and get a high-fidelity, "Cyberpunk
Tech Noir" styled PDF/PPTX learning guide, generated on demand via the Claude
API, plus an in-app modal viewer with a live code playground (Sandpack).
Auth is Clerk; persistence is Supabase (Postgres + Storage). Access is gated
by subscription tier (Monthly Pass / Yearly Pro).

## 2. Non-Goals (this pass)

- Real payment processing (Stripe checkout/webhooks). Subscription state is
  modeled and gated, but upgrade/checkout routes stub the write instead of
  calling a payment provider.
- Production-quality Hindi translations beyond a representative string set
  and working toggle infrastructure.
- Visual regression testing of generated PDFs.

## 3. Tech Stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS.
- Shadcn UI (Radix primitives), customized theme tokens for Cyberpunk Tech
  Noir (`#0a0a12` background, `#00f0ff` neon cyan, `#ff007f` neon magenta,
  slate borders).
- `@clerk/nextjs` for auth.
- `@supabase/supabase-js` + `@supabase/ssr`, using Clerk's native
  Supabase third-party-auth JWT integration (Supabase verifies Clerk JWTs
  directly; no shared-secret bridging).
- `puppeteer-core` + `@sparticuz/chromium` for serverless HTML→PDF.
- `pptxgenjs` for PPTX generation.
- `@codesandbox/sandpack-react` for the live code playground.
- `@anthropic-ai/sdk` for server-side structured content generation.
- Jest + React Testing Library + `@testing-library/user-event` for tests.

## 4. Architecture Overview

```
Clerk (auth) --webhook--> /api/webhooks/clerk --> Supabase profiles
                                                        |
User in browser --(dashboard)--> Supabase (topics, read)
        |
        |-- Download --> /api/generate/pdf|pptx --> Claude API (schema)
        |                        |--> Puppeteer/pptxgenjs --> Supabase Storage
        |                        |--> Supabase documents (metadata)
        |
        |-- Learn in App --> LearnModal (renders schema_json) + Sandpack
```

Design-token ingestion is a side channel: `/api/generate/webhook` receives
simulated Figma/Canva payloads and persists them to `design_tokens`; the
theme-injection step in the PDF/PPTX renderer reads the latest applied row
and merges it over the default Cyberpunk Tech Noir CSS variables.

## 5. Auth & Middleware

- `middleware.ts` wraps `clerkMiddleware()`. Public routes: `/`,
  `/(auth)/**`, `/api/webhooks/**`. Everything under `/(dashboard)/**`
  requires a signed-in user (`auth().userId`).
- Premium-only sub-routes (full technology tracks, premium templates) call a
  `requireTier(userId, ['monthly','yearly'])` helper that reads
  `profiles.tier` from Supabase; unauthorized requests redirect to
  `/pricing`.
- Clerk webhook (`app/api/webhooks/clerk/route.ts`) verifies the Svix
  signature, handles `user.created`/`user.updated`, upserts into
  `profiles` (id = Clerk `userId`). This is the only writer of identity
  fields on `profiles` — client code never writes them directly.

## 6. Supabase Schema

Migration file `supabase/migrations/0001_init.sql`:

- `profiles(id text pk, email text, full_name text, tier text default 'free' check in ('free','monthly','yearly'), downloads_this_month int default 0, subscription_period_end timestamptz, created_at timestamptz default now())`
- `topics(id uuid pk default gen_random_uuid(), category text, name text, slug text unique, is_full_track boolean default false, created_at timestamptz default now())`
- `documents(id uuid pk default gen_random_uuid(), topic_id uuid fk topics, user_id text fk profiles, format text check in ('pdf','pptx'), storage_path text, schema_json jsonb, created_at timestamptz default now())`
- `subscriptions(id uuid pk default gen_random_uuid(), user_id text fk profiles, tier text, status text, provider_ref text, current_period_end timestamptz, created_at timestamptz default now())`
- `design_tokens(id uuid pk default gen_random_uuid(), source text check in ('figma','canva'), payload_json jsonb, applied boolean default false, created_at timestamptz default now())`
- Storage bucket `generated-docs` (private); access via short-lived signed
  URLs issued by the generate routes.
- RLS: `profiles`/`documents`/`subscriptions` — `user_id = auth.jwt() ->> 'sub'`
  for select; no client insert/update (writes go through server routes using
  the service role). `topics` — public select, no client writes.

## 7. Dashboard & Localization

- `context/language-context.tsx`: `LanguageProvider` holding `lang` (`en`|`hi`,
  default `en`), `setLang`, and `t(key)` resolving against
  `lib/i18n/en.json` / `lib/i18n/hi.json`. Persists selection to
  `localStorage`; falls back to `en` on read failure.
- `context/subscription-context.tsx`: client context hydrated from a server
  component fetch of the current profile; exposes `tier`,
  `downloadsRemaining`, `canAccessFullTrack`.
- `app/(dashboard)/dashboard/page.tsx`: two Shadcn `Combobox`s — Category
  (static list) and Topic (fetched via a server action filtered by selected
  category, includes `is_full_track` entries). `Download` and `Learn in App`
  buttons are disabled via `useState`/derived state until both selections
  are non-empty; the topic fetch uses `useTransition` for pending state.

## 8. Document Generation Engine

- `lib/generation/schema.ts`: Zod schema `DeckSchema` — ordered `slides[]`,
  each `{ id, title, bodyBlocks[], codeBlocks[], anchor }`.
- `lib/generation/llm.ts`: `generateDeck(topic)` calls Claude with a prompt
  requesting the `DeckSchema` shape as JSON (tool-use / structured output);
  validates the response with Zod before returning; throws a typed
  `GenerationError` on malformed output so routes can return a clean 502.
- `app/api/generate/pdf/route.ts`: resolve topic → `generateDeck` (or reuse
  an existing `documents.schema_json` if one exists for topic+user) → render
  an HTML template with injected theme CSS vars → Puppeteer prints to PDF
  buffer → upload to `generated-docs/{userId}/{topicSlug}.pdf` → insert
  `documents` row → return signed URL. Enforces monthly download cap for
  `monthly` tier (15/mo) by checking/incrementing `profiles.downloads_this_month`;
  `yearly` tier is unlimited; `free` tier is rejected with 403.
- `app/api/generate/pptx/route.ts`: same resolution path, renders via
  `pptxgenjs` slide-by-slide using the same theme tokens.
- `app/api/generate/webhook/route.ts`: accepts a payload shaped like either
  a Figma "Component Tokens" export or a Canva "Brand Kit" export
  (discriminated by a `source` field), validates with Zod, persists to
  `design_tokens`. A payload with `applied: true` becomes the active theme
  override for subsequent generations (color/font/spacing fields only —
  unrecognized fields are ignored, not errors).
- Theme engine: `lib/theme/tokens.ts` exports the default Cyberpunk Tech
  Noir CSS variable set; `mergeDesignTokens(defaults, activeRow)` produces
  the variables injected into both the HTML-for-PDF template and the
  in-app modal.

## 9. In-App Modal Viewer + Playground

- `components/shared/learn-modal.tsx`: full-screen Shadcn `Dialog` rendering
  `schema_json` slides as anchored sections with a sidebar TOC; typography
  tuned for long-form reading against the dark theme.
- `components/shared/code-playground.tsx`: wraps `@codesandbox/sandpack-react`;
  `activeSlideIndex` prop selects which slide's `codeBlocks` seed the
  Sandpack `files` prop, so navigating slides swaps the playground content.

## 10. Subscription Tiers

- `lib/subscription/tiers.ts`: `TIERS = { monthly: { price: 9.99, downloadsPerMonth: 15, ... }, yearly: { price: 79.99, downloadsPerMonth: Infinity, fullTracks: true, ... } }`, single source of truth used by pricing UI, middleware gating, and generate-route caps.
- `app/api/subscription/upgrade/route.ts`: stub endpoint — validates the
  requested tier, writes a `subscriptions` row and updates
  `profiles.tier`/`subscription_period_end` directly (no external payment
  call). Structured so a later pass can slot in a real Stripe
  checkout/webhook without changing the read side.

## 11. Error Handling

- Generation routes distinguish: auth/tier failures (401/403 with a reason
  code the UI maps to a message), LLM/schema failures (502, generic retry
  message, logged with the raw model output for debugging), and
  storage/render failures (500). No partial `documents` rows on failure —
  DB insert happens only after successful upload.
- Webhook route returns 400 with field-level Zod errors on malformed
  payloads; unknown `source` values are rejected rather than silently
  stored.
- Client dashboard surfaces a toast (Shadcn `sonner`/`toast`) on any
  generation failure; playground/modal errors are scoped to the modal and
  don't crash the dashboard.

## 12. Testing Strategy

`__tests__/` mirrors `app/`:

- `context/language-context.test.tsx`: toggling language updates rendered
  text nodes for a sample component consuming `t()`.
- `app/(dashboard)/dashboard.test.tsx`: Category→Topic combobox interaction;
  Download/Learn-in-App buttons stay disabled until both selections are made.
- `middleware.test.ts`: Clerk auth mocked authenticated vs unauthenticated;
  verifies redirect behavior for protected vs public routes, and tier-gated
  routes for free vs paid mocked profiles.
- `components/shared/code-playground.test.tsx`: simulates editing the
  Sandpack input and asserts the preview/output reflects the change.

## 13. Directory Structure

```
/app
  /(auth)/sign-in, /(auth)/sign-up
  /(dashboard)/dashboard, /(dashboard)/pricing
  /api/webhooks/clerk
  /api/generate/pdf, /api/generate/pptx, /api/generate/webhook
  /api/subscription/upgrade
/components
  /ui              (Shadcn primitives)
  /shared          (language toggle, learn-modal, code-playground, comboboxes)
/context           (language-context, subscription-context)
/lib
  /generation      (schema.ts, llm.ts)
  /theme           (tokens.ts)
  /subscription    (tiers.ts)
  /i18n            (en.json, hi.json)
  /supabase        (client.ts, server.ts)
/supabase/migrations
/__tests__         (mirrors /app and /components structure)
```

## 14. Open Follow-Ups (explicitly deferred, not blocking this spec)

- Wire real Stripe checkout + webhooks in place of the upgrade stub.
- Expand Hindi translation coverage beyond the initial string set.
- Add PDF visual regression testing once the theme engine stabilizes.
