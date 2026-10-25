# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Two audiences share one product:
- **Technology learners and job seekers** (students and early-career developers) who want to learn a stack, practise interviews and understand system design.
- **School and exam students in India** (CBSE, NCERT, ICSE, ISC; SSC, banking, railways, defence, teaching, state exams, JEE, NEET; IELTS) preparing with concept notes, worked answers and timed practice, often more comfortable reading Hindi.

The landing page leads with the AI learning tools as the product, then shows school, exam and language paths as what those tools cover (confirmed 2026-09-24).

## Product Purpose
MasterClass puts every learning tool a learner needs into one dashboard, bilingual in English and Hindi, so a study session starts with a clear next step instead of a search. Success is a learner who signs up, picks their preparations, and comes back to study.

## Positioning
A bilingual (English/Hindi) AI study workspace. It pairs prepared, published notes with AI answers, and covers school, competitive exams and technology careers in one place.

## Operating Context
Public: landing page (`/`), `/courses`, `/about`, `/contact`, `/privacy`, `/terms`. Everything else is behind sign-in, under `/learning`:
- **Search:** answers questions from the app's own notes, or from an AI model when AI Mode is on (Anthropic, Perplexity).
- **On The Go** (`/learning/step-by-step`): step-by-step build guides for 60+ technologies, with comparisons between technologies.
- **Class Room:** topic explanations with worked answers, diagrams and a Hindi toggle.
- **Vocabulary:** English word finder with Hindi meanings, synonyms and antonyms.
- **Notes** library, **Bookmarks**, reading progress and personal notes.
- **Profissional Learn** track (spelled this way in the UI): Techy (live code lab / sandbox), API Docs, Lessons, Quiz, Interview, Mentors.
- **Study Buddy:** a floating AI chat assistant.
- **Membership:** monthly or yearly plans, paid through Razorpay; selectable preparations.

## Capabilities and Constraints
- Next.js 16 App Router, Supabase auth/DB, Razorpay billing. Pricing is fetched live from `/api/billing`; never hard-code prices.
- The whole UI is bilingual: every string goes through the `text(en, hi)` / `ExpandedText` pattern.
- Guide coverage varies by path; the product states this before subscribing.
- Revision notes and bookmarks are stored in the browser.

## Brand Commitments
- Name: **MasterClass**, with the open-book "M" mark and gold spark (`components/brand-mark.tsx`, `app/icon.svg`).
- The landing page has its own identity, Notebook: yellowish cream with highlighter yellow on study-desk materials (user-directed 2026-09-25, replacing the earlier rule that it share the dashboard's Claude look). The dashboard keeps its Claude paper world.
- Voice: calm, encouraging and concrete ("Your next skill starts with one clear step.").

## Evidence on Hand
- Student reviews in `components/student-reviews.tsx`; the user confirmed these are real, so keep them.
- Real catalogue data: `lib/study/catalog.ts`, `lib/study/preparations.ts`, `lib/step-by-step/technologies.ts`, `lib/pro-learn/technology-handbooks.ts`, `lib/landing-pro-preview.ts`.
- Imagery: AI-generated landing photography in `public/images/landing/` (prompts in each file's EXIF). These are illustrative scenes, not real students, and must never be presented as testimonials. Also `public/images/reviews` and `public/images/tech`.
- Absent: no press, no partner logos, no usage metrics. Do not invent any.

## Product Principles
1. Show the real product. The dashboard's actual tools are the proof.
2. Every path equal in both languages; Hindi is never an afterthought.
3. Be honest about coverage and price before asking for commitment.
4. One clear next step at every point on the page.

## Accessibility & Inclusion
Keyboard reachable, visible focus, reduced-motion respected, and `lang` set correctly on Hindi text. Many users are on mid-range Android phones over mobile data, so performance is an accessibility concern.
