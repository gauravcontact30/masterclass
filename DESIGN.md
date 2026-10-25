# Design

Two visual worlds, on purpose. The **dashboard** keeps Claude's warm paper world (`components/step-by-step.module.css`: cream `#faf9f5`, white paper, `#e8e6dc` hairlines, serif display, clay `#b5573a` action; kind inks technology `#9a4a2c`, API `#2f5f82`, course `#3f6b35`, word `#5e4a8f`, techy `#7a5d10`, card tints in `CARD_TONES` in `components/step-by-step.tsx`). The **landing page** has its own identity, **Notebook** (user-directed 2026-09-25): the Indian study desk, with a yellowish cream and highlighter yellow as its two colours (user-directed; this replaced a brief orange pass the same evening). Its tokens live on `.home` in `components/landing-home.module.css`; older section stylesheets read them through `--cc-*` aliases.

## Landing tokens (Notebook)

| Token | Value | Role |
|---|---|---|
| `--nb-paper` / `--nb-sheet` | `#fffdf8` / `#ffffff` | Page ground / sheets and panels |
| `--nb-rule` / `--nb-rule-2` | `#f0e5c8` / `#e6d3a0` | Ruled lines, hairlines / input borders (pale highlighter) |
| `--nb-wash` | `#fff7df` | Hover, selected wells |
| `--nb-orange` / hover | `#f3e3b3` / `#ecd592` | Yellowish cream: the main fills (navbar CTA, overview action and Vocabulary card, library preview). Graphite text, and a 1px golden inset edge `#d9bf73` so it holds against the paper (the token keeps its old name) |
| `--nb-ink` / `--nb-ink-deep` | `#7a5a12` / `#5e450d` | Deep mustard for text, links, focus rings, small accents and any fill that carries white text (about 6:1) |
| `--nb-highlight` | `#ffe36e` | Highlighter yellow: the hero action, the library's "Opens in" button, text selection, the selected library row (`#ffefb0`) |
| `--nb-margin` | `#d8433a` | The exercise book's double red margin rule |
| `--nb-kraft` | `#b98a55` | Kraft-paper covers |
| `--nb-graphite` / `--nb-text` / `--nb-muted` | `#1f2330` / `#3a4152` / `#5e6577` | Headings / body / secondary text |
| hero washes | `rgba(40, 22, 12, …)` | Warm dark brown over the photographs |

Library shelf colours: technology `#5d6a14`, API `#0f6e78`, exams `#2f7a3a`, words `#6a3fb0`, Techy `#8a6212`.

## Landing type

- **One family: Anek Devanagari** via `next/font` (`components/landing-fonts.ts`, variable `--font-anek`, subsets latin + devanagari, width axis). It covers English and Hindi in one design, so both languages share a voice.
- **Display:** weight 700 with the width axis opened (`font-variation-settings: "wdth" 112–118`) for the hero and the overview statement; section headings weight 600 at default width. No italics, no single-word colour accents; emphasis is size and weight.
- **Paragraphs:** every paragraph on the landing page is justified with `hyphens: auto` (a zero-specificity `.home :where(p)` rule, so components can refine it). Paragraphs in centred blocks (the pricing note) keep `text-align-last: center`.
- **Numbers:** `font-variant-numeric: tabular-nums` wherever counts sit in columns or tabs.
- **Learning content** in On The Go (dashboard) stays justified (`text-align: justify; hyphens: auto`) with `lang` set, via the `.prose` class.

## Photography

- **Warm editorial photography** of Indian learners in real study moments: a desk at home, a metro commute, a library, a café. The palette is cream and terracotta, with soft natural light and shallow depth of field. Screens show only abstract, blurred UI, never readable text.
- Every image in `public/images/landing/` is AI-generated (Z-Image-Turbo). Its prompt is stored in the file's EXIF `ImageDescription`, so it can be regenerated or replaced.
- Slides are 1920×1080 WebP at quality 80, and path images are 1200×800. Each slide sets a focal point (`--focus`) so the person stays in frame on the 4:5 phone crop.

## Components

- **Navbar:** fixed and transparent over the hero photographs (ivory text, links in a translucent pill), then a solid cream bar (72px, hairline, soft shadow) once the page scrolls or the menu opens; the height never animates. A pill (revealed with an animated `clip-path` inset, so it never triggers layout) follows the pointer across the links and rests on the section in view (scrollspy). The current link turns clay on cream. EN | हि is a segmented toggle, and the CTA is a clay pill whose arrow nudges on hover. Below 1080px the links become a serif-set dropdown with its own CTA.
- **Hero slider:** full-bleed, four slides, `min(100svh, 900px)` tall. Each slide has its own serif headline, body and two pill actions, set bottom-left over three dark washes (under the navbar, behind the copy, under the controls). Slides cross-fade with a slow 1.08→1 settle and a staggered copy reveal. Along the bottom: labelled progress segments that fill during autoplay (the authored motion), a serif 01 / 04 counter, and round previous, next and pause buttons, kept clear of the fixed Study Buddy launcher. Autoplay pauses on hover, focus or pause, and never runs under reduced motion. Arrow keys and swipe navigate, and hidden slides are `inert`.
- **Subject ribbon:** a slow loop of real subject pills (technologies, exams, API packages, words) tinted by kind, with faded edges. It pauses on hover and is static under reduced motion.
- **Paths** ("One membership, three ways in"): left, the heading on the margin rule, three large vertical tabs (icon well, label, chevron; the selected one cream with a golden edge and a highlighter icon well) and the selected path's title, description, "Includes" tags and a mustard "See what's covered" link. Right, a light silver tablet drawn in CSS (white bezel, camera dot, soft floor shadow) with a Safari-light browser showing the dashboard in its own colours at the real route (`/learning/cbse`, `/learning/ssc`, `/learning/step-by-step`): a Class 10 worked answer with the Hindi toggle, a timed SSC question, or Next.js build steps. The screen swaps with the selection; everything in it is sized in `cqi` so it scales with the tablet, and it is `aria-hidden` because the tab panel carries the same facts. Stacks below 980px; tabs go side by side on phones. The tab ids keep the #school / #exams / #courses anchors working.
- **Overview** ("One dashboard. Two languages. A clear next step."), under the subject marquee: the three-line statement written on ruled lines and hung on the margin rule, one cream action, and three staggered columns of tiles: a sage notebook cover `#d7e3c0` with a name label (Class Room, graphite text), a highlighter sheet (On The Go), a blush card `#f4d3cb` with graphite text and a `#e3b3a6` edge (Vocabulary), and learner photographs grounded in warm brown or kraft. Two-up checkerboard on phones.
- **Ledger** (landing library section, "Search the whole library before you join", after Paths): a compact white sheet on a ruled band. Search field and Filters button (10px corners), shelf tabs in their shelf colours with true catalogue counts (the pressed one fills), a list beside a cream preview card with graphite text and a highlighter "Opens in" button, the selected row highlighted like a marked line, and "try" chips that run real searches beside the tally. List and preview share a fixed 300px height so filtering never moves the page.
- **Study engine** ("Ask once. Get an answer you can check.", `components/landing-study-engine.tsx`, `#study-engine`, replaced the membership FAQ 2026-09-26): a Claude Code session in charcoal `#262624` with clay `#d97757` prompt, ivory text and a green result dot, beside four hairline-ruled steps (library first, right model, sources, English or Hindi), a "Works with" row of provider tags (6px) and one clay "Try Search" button. The terminal is `aria-hidden` (the steps carry the same facts); its lines appear in sequence once the section is in view, CSS only, static under reduced motion. `content-visibility: auto` keeps it out of first render work.
- **Closing band** ("Make today chapter one."): highlighter yellow `#ffe36e` ruled like a notebook page, graphite heading, graphite button with yellow text. **Footer:** graphite `#1f2330`; the tagline and the whole logo mark (spark included) are highlighter yellow.
- **Section headings:** one scale for every landing section title (not hero slides), clamp(28px, 2.7vw, 40px) in Anek 600, on one line from 900px up (wrapping on phones). Each hangs on the exercise book's double red margin rule, drawn in its left gutter. The overview opts out of the scale with `data-own-heading` but keeps the rule.
- **On The Go answer:** numbered sections (the sequence is real), Definition and Answer each followed by a diamond-bulleted point list, feature tiles (hairline border, clay diamond before the name), and use-case cards on a tone wash, each with the code viewer.

## Rules

- No labels stacked above headings, no decorative section numbers, no side-stripe borders, no gradient text.
- Claims come from data: counts are computed from the catalogues (`lib/landing-library.ts`); never hard-code them.
- Every string exists in English and Hindi.
- Motion respects `prefers-reduced-motion`.
