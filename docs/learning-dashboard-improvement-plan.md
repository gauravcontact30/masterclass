# Learning dashboard audit and implementation plan

Date: 24 October 2026. Scope: repository route inventory, Learning dashboard page implementations, representative content and generation pipelines, supporting account/admin architecture, focused tests, and current primary-source research. This is not a claim that every lesson has been fact-checked or that production journeys have been browser-tested.

## Recommendation

Strengthen complete, assessed learning paths before adding more technology cards. Organize existing material into six outcomes: full-stack development, Python backend, AI engineering, cloud/platform engineering, data engineering, and application security. Keep the existing bilingual school/exam paths separate from career recommendations. Add measured progress, reviewed sources, working projects, and explicit version coverage to the existing pages.

## Verified baseline

| Evidence | Finding | Implication |
| --- | --- | --- |
| `lib/pro-learn/tracks.json`, `lessons.json` | 53 professional tracks and 85 prepared lessons across those tracks | Catalog breadth exceeds prepared lesson depth; count modules and outcomes, not cards |
| `lib/catalog-preview.json` | 40 technologies and 177 topics | This preview is a different catalog from professional tracks; unify IDs and coverage reporting |
| `content/official/search/*.json` | 1,195 stored card records in 45 files, checked dates 15–16 October | Stored records are not equivalent to current, human-reviewed lessons |
| `content/official/api/*.json` | 3,114 stored card records in 41 files, checked dates 15–16 October | Inventory and reconcile against current runtime identifiers |
| `content/official/STATUS.md` | Older report says Search 1,072 done / 230 rejected / 1,815 pending; API 1,048 / 379 / 4,127 | Report is stale relative to stored JSON. Do not publish these as today's completion percentages |
| `lib/official-content/card.ts` | Verifier checks quotation presence for key points/gotchas, source policy, minimum points and copying | It does not establish semantic correctness of all prose, signatures, quiz answers or executable examples |
| `lib/server/prepared-catalog.ts`, `lib/official-content/apply.ts` | Authored, fallback and official additions can be merged | Show provenance per content unit; a verified addition must not imply the entire merged answer is verified |
| `components/pro-lessons.tsx`, `components/pro-quiz.tsx` | Completion/history keys are browser-wide; lesson completion parses stored JSON without a parse guard | Scope state by account, recover corrupt storage, then sync across devices |
| `lib/learning-path.ts` | Existing goal planner with three stages, catalog-constrained AI output and rule fallback | Extend it with prerequisites and assessments; do not rebuild a second planner |
| `components/pro-quiz.tsx` | Timed practice, missed-question review and flashcards already exist | Add scheduled retrieval and skill mastery on top of existing practice |
| `components/techy.tsx` | Current Techy provides topic decks, code reading/copying and local setup instructions | Product documentation describing it as a universal live sandbox is inaccurate |
| `app/(learning)/dashboard/workflow/page.tsx` | Metadata advertises LangChain 0.3+, LangGraph 0.2+, LangSmith 0.2+ | Audit examples against supported versions and provide migration paths |
| `lib/certifications.ts` | Exam facts embedded in prose; provider source is optional at track level | Add per-exam official URL, checked date, region and exam version |
| `components/workspace.tsx`, vocabulary and professional pages | Several visible strings bypass bilingual helpers; one Hindi Notes aria-label is question marks | Include translations and accessible labels in page acceptance tests |

Counts above are read-only file counts, not production database totals. The 35 questions in `lib/pro-learn/interview.json` are only one bank; `lib/interview-bank/` and other catalogs contain additional questions.

Validation before performance changes: direct TypeScript check passed; eight existing suites passed, 96 tests total (official content, learning content/discovery/path/categories, certifications, professional learning, authorization). These checks do not prove editorial correctness or a complete application audit.

## Current demand and curriculum priorities

The 2026 Stack Overflow survey reports widespread use of JavaScript, SQL, Python and TypeScript. These are adoption signals, not vacancy counts. Its respondents are self-selected, so do not label a technology the most demanded job skill based solely on this survey. [2026 technology data](https://survey.stackoverflow.co/2026/technology/data).

The World Economic Forum identifies AI/big data and networks/cybersecurity among fast-growing skill areas through 2030. This supports deeper AI, data and security pathways, but does not establish a local hiring ranking. [Future of Jobs 2025](https://www.weforum.org/publications/the-future-of-jobs-report-2025).

LangChain's official v1 documentation changes agent construction and moves legacy functionality into `langchain-classic`. Teach a tested version and migration exercise rather than treating the existing 0.x examples as universally current. [LangChain v1](https://docs.langchain.com/oss/python/releases/langchain-v1).

Recommended ordering below is editorial judgment combining those signals with this application's existing content. Confirm India-specific hiring priorities with a dated, deduplicated sample of employer job descriptions before displaying a job-demand score.

| Priority | Path and work to add or deepen | Demonstrable outcome |
| --- | --- | --- |
| P1 | TypeScript + React + Next.js: rendering/caching, forms, auth, SQL, testing, accessibility and performance | Deploy a tested, accessible full-stack app with measured performance |
| P1 | Python backend: Python fundamentals, uv, FastAPI, Pydantic, PostgreSQL, async I/O, migrations, tests | Ship a documented API with authentication, migrations and failure handling |
| P1 | Applied AI engineering: retrieval, tool calling, MCP, context/memory, structured output, evaluations, tracing, prompt injection and cost controls | Build a cited assistant with an evaluation dataset and reproducible quality/cost results |
| P1 | Cloud/platform: Linux, networking, Docker, CI/CD, AWS, Terraform, observability, reliability and cost | Deploy a service, diagnose a failure and demonstrate rollback |
| P2 | SQL/data engineering: query plans, modeling, ETL/ELT, dbt, orchestration, data quality and warehouse concepts | Build and test a pipeline with documented lineage |
| P2 | Application security: threat modeling, sessions/OAuth, authorization, dependency risks, secrets, secure AI tools | Produce a threat model and fix a deliberately vulnerable training app |
| P2 | QA automation: Playwright, unit/integration/contract tests, flaky-test diagnosis, CI and accessibility | Submit a repeatable test pipeline with actionable failure reports |
| P3 | Java/Spring, C#/.NET, Go, mobile and Rust specialization | Add only after demand validation and an editor can own a complete path |

The app already contains many of these technologies. The proposal is deeper sequencing and evidence of competence, not duplicate categories. Keep experimental tools in a dated exploration shelf; promote them only after stable examples and learner demand exist.

## Every Learning dashboard page

| Route | Refinement and additions | Acceptance criterion |
| --- | --- | --- |
| `/dashboard` | Continue learning, one recommended next activity, due reviews, selected career path; separate news from core curriculum | Learner resumes a specific lesson in one action; recommendations explain prerequisites and reason |
| `/dashboard/search` | Unified concept IDs, version/source filters, distinguish authored/fallback/AI material, link to lesson/lab/quiz | Result shows source and review status; missing evidence never receives a verified badge |
| `/dashboard/step-by-step` | Turn guides into checkpoints with tested starter/completed projects and troubleshooting | Fresh install completes every command; each checkpoint has observable output |
| `/dashboard/notes` | Versioned notes, compact revision sheets, glossary, linked practice, migration changes | Every featured note has objective, prerequisite, source, reviewed date and next exercise |
| `/dashboard/library` | Consolidate personal/generated materials, course coverage, resume and outdated-version notices | No duplicate path entries; notes and progress survive account-safe synchronization |
| `/dashboard/official-docs` | Source-backed learning guide distinct from official publisher text; version selector, changelog and migration labs | Selected version matches examples; link checking and snippet execution pass |
| `/dashboard/api-docs` and `/dashboard/api-docs/[packageId]/[name]` | Tested signatures, parameter/return examples, deprecations, error cases and related concepts | Featured APIs have source, tested version and executable example; direct links and rename handling work |
| `/dashboard/techy` | Keep quick decks; add genuine JS/TS, Python and SQL exercises with fixtures and expected output | Clearly distinguish read-only examples, local projects and runnable labs; unsupported runtimes explain local setup |
| `/dashboard/workflow` | Current agent APIs, state/checkpoints, approval/resume, retries, evaluation, tracing and resource budgets | One reproducible end-to-end workflow per topology, including failure and recovery tests |
| `/dashboard/certifications` | Provider exam links, objectives mapping, current exam versions, diagnostic/mock exams | Separate vendor certifications from course completion certificates; never imply app-issued vendor accreditation |
| `/dashboard/lessons` | Coherent beginner/intermediate/advanced modules; add worked example, practice and solution | Each priority path has enough reviewed lessons to meet its declared outcome; completion is not labeled mastery |
| `/dashboard/quiz` | Skill-tagged questions, explanation for each option, scheduled retries and practical assessment | Scoring is reproducible; answer sources reviewed; missed concepts create follow-up practice |
| `/dashboard/interview` | Role/level paths, coding/debugging/system design, communication rubrics and mock sessions | Rubric explains score and next practice; company/frequency claims have provenance or are labeled editorial |
| `/dashboard/mentors` | Grounded hints, prerequisite diagnosis, project feedback and links to known content | Mentor cites curriculum and signals uncertainty; verify discoverability because route is absent from current professional sidebar list |
| `/dashboard/vocabulary` | Technical English/Hindi, pronunciation, stand-up/PR/design-review examples | Preserve general language learning; contextual technical vocabulary links back to lessons |
| `/dashboard/vocabs` | Keep legacy redirect to Vocabulary | Existing bookmarks resolve without duplicate content |
| `/dashboard/coffee-and-code` and article route | Dated engineering explainers, release impact and short migration exercises | Article links to primary sources and a related lesson; news dates are distinct from review dates |
| `/dashboard/bookmark` | Collections by goal, scheduled revision and stale-content notices | Stable content IDs survive renaming; account boundaries tested |
| `/dashboard/learn/[slug]` | Use existing owner-created pages for curated paths; add editorial draft/review/publish workflow | Drafts remain private; published pages inherit metadata and accessibility checks |
| `/dashboard/[category]` | Keep preparation-specific and system-design learning aligned with access selections; add prerequisites to technology cases | Invalid categories redirect; school/exam coverage is explicit and not claimed complete |
| `/dashboard/plans` | Show real course coverage and included learning features before purchase | Live prices and server-enforced access remain correct; no unverified outcomes promises |
| `/dashboard/settings` | Learning goals, level, weekly time, language, notification and progress controls | Preferences persist and affect recommendations; users can export/reset progress |

## Supporting application work

- Public landing/courses/library/learn/API/interview/workflow/compare pages: derive previews from the same reviewed content IDs as paid pages. Publish real coverage, source dates and prerequisites. Avoid duplicate copies that drift.
- Authentication and subscription APIs: preserve server-side subscription checks; test anonymous, trial, expired, subscribed and admin journeys. No client-only entitlement decisions.
- Super Admin: extend existing Upload Learning, content overrides and revisions with reviewer assignment, failed-check queues, scheduled review and rollback. Do not add a competing CMS.
- Generation workers: create drafts with source snapshots, not auto-published truth. Record failures and editor disposition. Evaluate citations, correctness, unsafe recommendations and bilingual parity independently.
- Analytics/support: add lesson-start, exercise-pass, quiz-complete, due-review and project-complete events; avoid recording answers/code by default. Use current suggestions and monitoring surfaces for feedback.
- Documentation: reconcile README, PRODUCT and older implementation notes with current routes and behavior; several describe retired formats or earlier experiences.

## Content model and release gate

Extend existing catalogs and upload revisions through adapters before migrating everything. Use stable IDs and a shared metadata contract: technology, concept, skill, prerequisite IDs, level, outcome, estimated duration, language, content revision, supported/tested versions, source URL and retrieval date, reviewer and review date, next review date, publication status, lab ID and assessment IDs. Keep source retrieval separate from human review and executable validation.

Draft → schema/link checks → technical review → example execution → English/Hindi review → published revision. Rejected entries need repair or an explicitly labeled fallback. Retain older versions and redirect renamed content. Automated quote matching remains one check, not the publication gate.

Each priority module should contain: a measurable objective, prerequisites, concise explanation, working example, failure/debugging scenario, guided exercise, independent task, explanation-rich assessment, review cards, sources and a next step. Budget 12–16 modules per flagship path only as an initial planning estimate; adjust after the outcome map is reviewed.

For progress, introduce account-owned enrollments, lesson progress, assessment attempts, skill evidence and review scheduling. Reuse existing progress/marks APIs where their semantics fit. Use RLS and user-scoped storage, idempotent event IDs, explicit conflict rules and a careful import of legacy browser data. Do not silently assign shared-device legacy progress to a new account.

## Delivery sequence

Estimates assume two engineers, a technical editor and part-time Hindi review; they are not a committed schedule.

| Phase | Work | Exit condition |
| --- | --- | --- |
| 0: week 1 | Reconcile catalogs/status counts, select first two paths, establish performance baseline; fix account-safe storage and corrupt JSON handling | Reproducible content inventory and test baseline; no false verified labels |
| 1: weeks 2–3 | Metadata adapters, source/review UI, editorial gates; pilot full-stack and Python backend modules | Two complete modules per path pass all content gates |
| 2: weeks 4–6 | Complete pilot paths, connect lessons/labs/quiz/review, sync progress and resume | Fresh learner completes a path and capstone without broken prerequisites or missing material |
| 3: weeks 7–9 | AI/cloud modules, workflow version migrations, practical assessments and interview rubrics | Tested capstones, evaluation evidence and version coverage published |
| 4: weeks 10–12 | Data/security expansion, accessibility and Hindi audit, demand-based prioritization | Outcome metrics and editorial capacity justify expansion |

First backlog: (1) catalog/status reconciliation, (2) source/reviewer/version metadata, (3) account-safe persistence, (4) two pilot curricula, (5) reproducible project fixtures, (6) skill-tagged assessments, (7) next-step navigation, (8) workflow migration audit, (9) certification provenance, (10) bilingual/accessibility checks.

## Performance targets and validation

User targets: **LCP ≤ 1,000 ms and INP ≤ 50 ms**, assessed at p75 separately for mobile and desktop. Also monitor CLS to avoid trading speed for layout instability. These are stricter than the standard good thresholds; they are targets, not achieved measurements. [Google's metric definitions](https://support.google.com/webmasters/answer/9205520?hl=en).

Track landing, dashboard, search, API reference, official docs, quiz and reader journeys. Capture cold/warm production loads, navigation, rapid search, tab switching, accordion opening and quiz submission under documented device/network profiles. Lab event timing is diagnostic; Lighthouse TBT is not INP. Keep real-user results separate from local results.

Current code changes and validation are recorded in `docs/performance-lcp-inp.md`. Use the existing monitoring endpoint rather than introducing a second analytics pipeline. Review its hard-navigation/soft-navigation metric attribution before using per-route values as release gates.

Success measures: first-session meaningful exercise completion, return-to-study rate, seven-day recall, capstone completion, outdated/incorrect-content reports, review turnaround and p75 performance. Establish baselines before assigning uplift claims. Avoid optimizing for raw card counts or time spent alone.
