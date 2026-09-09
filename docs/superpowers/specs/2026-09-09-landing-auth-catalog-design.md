# Landing redesign, named sign-up, catalogue expansion, artistic documents

Date: 2026-09-09
Status: implemented

Five workstreams delivered in one pass against the live Supabase project
`masterclassbuddy_db` (ref `hqvxmlrslkqhyktxbtzs`).

## 1. Configuration

`.env.local.example` previously carried a real anon key *and* a real
`service_role` key for the live project. Both were replaced with `xxx`
placeholders. **The exposed `service_role` key still needs rotating in the
Supabase dashboard** — it bypasses Row Level Security entirely and was committed
to a tracked file.

`CHROMIUM_EXECUTABLE_PATH` and `DOCUMENT_FONT_PATH` no longer have to be set.
`lib/server/config.ts` probes the usual install locations when they are blank
(Chrome/Edge; `C:/Windows/Fonts/Nirmala.ttf`, which covers Latin and Devanagari).
An explicit env value always wins.

## 2. Sign-up captures a name

`public.profiles` gained a `name` column, and `on_auth_user_created` on
`auth.users` now creates the profile row at sign-up, copying
`raw_user_meta_data->>'full_name'` (migration `0003_profile_names.sql`).

This closed a real gap: profile rows were previously created lazily, on the first
authenticated API call, so a visitor who signed up and never generated anything
had no row at all. `on conflict do nothing` keeps the pre-existing lazy upsert in
`repository.profile()` safe alongside the trigger.

Verified against the live database: inserting an `auth.users` row with
`full_name` produced a matching `profiles` row automatically.

## 3. Catalogue

20 technologies across six categories, 98 topics
(`0004_catalog_expansion.sql`). Exactly one `full_track` topic per technology, so
a learner can generate a single topic or the complete path for that technology.

`generation-form.tsx` groups the first dropdown by category and the second into
"Full learning path" / "Single topics" — a flat list of 98 was not scannable. The
topic filter by `technology_id` was already correct and was left alone.

## 4. Landing page

Restructured: the auto-rotating four-slide hero carousel was replaced by a static
hero, and the slides became a "How it works" sequence. Sections are now nav →
hero → steps → features → sample → testimonials → pricing → closing CTA → footer.

Design concept: the app shell is paper-on-white, so the landing inverts it. The
canvas is a dark study-hall indigo and the generated guide pages are the bright
paper objects on it — the product's own output is the first thing seen, via
`components/guide-stack.tsx`, a facsimile of what `render.ts` really produces in
the three document themes. Gold behaves like foil (rules and one band); violet is
reserved for interactive elements.

Type: Fraunces for display, Mukta for body. Mukta was chosen because it covers
Devanagari as well as Latin, so the page keeps one typographic personality when a
visitor switches to हिन्दी.

Numbered markers appear only on the steps, which genuinely are a sequence. The
all-caps eyebrows and the `PDF · PPTX · English · हिन्दी` middot string were
dropped.

## 5. Artistic documents

`render.ts` moved from one page template to four archetypes — cover, divider
(lesson opener), text, code. `theme.ts` gained `accent2`, `surface` and a `motif`
per theme; each motif draws deterministic inline SVG geometry (grid / arcs /
scan) seeded on the page index, so no two openers match. Nothing loads over the
network; the browser aborts every non-`data:` request.

`content.ts` now emits a divider page per lesson, and the pages that follow carry
section labels instead of repeating the lesson title, so the reader's contents
list stays scannable.

The PPTX path mirrors the same structure with native pptxgenjs shapes rather than
screenshots, keeping text selectable and editable in PowerPoint.

## 6. Campus band

A full-bleed four-slide autoplay carousel sits directly under the header: library,
quad, lab, amphitheatre steps, on a five-second rotation, each captioned with the
location and what the student is doing. The wordmark's ✦ was added to the tablet
in the quad scene and the centre lab monitor, so the scenes read as the app in
use. The steps section below dropped its artwork and became typographic, since
the band now carries the page's imagery.

The slides are drawn scenes, not photographs, and the band says so beneath it.
Swapping in real photography means replacing `HeroArt` with `next/image` inside
the `CAMPUS` map in `landing-page.tsx`; the captions and carousel need no change.

Testimonial avatars remain illustrations. The quotes are invented placeholder
copy, so they must not be paired with photographs of real students — that would
attribute words to people who never said them. Real reviews require the quote,
name and photo to be replaced together, and only with the reviewer's consent.

## Outstanding

Generation cannot run end-to-end until `SUPABASE_SERVICE_ROLE_KEY`,
`ANTHROPIC_API_KEY` and `WORKER_SECRET` are set in `.env.local`. Without the
service-role key every server route throws `CONFIG:SUPABASE_SERVICE_ROLE_KEY`,
which is why the dashboard dropdowns render empty regardless of catalogue
contents. The artistic renderer is therefore verified by build, typecheck, lint
and unit tests, but has not yet produced a real PDF.
