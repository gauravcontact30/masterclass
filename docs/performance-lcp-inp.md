# LCP / INP work and validation

24 October 2026.

## Targets

User acceptance targets: **LCP ≤ 1,000 ms; INP ≤ 50 ms**. Evaluate p75 separately for mobile and desktop using production traffic. These targets have **not been achieved or verified** by this work. A short local experiment cannot establish field INP or production p75.

## Changes made

- Landing server: fetch sale, official docs, content overrides and daily additions concurrently rather than serializing the sale lookup ahead of the other reads.
- News: remove the below-the-fold fetch preload and cover-image preload; request news when its section approaches the viewport. Pause autoplay when offscreen or in a hidden tab. Keep SSR headings, loading state, cancellation and retry behavior.
- API reference: disable automatic prefetch on individual identifier links, retain client navigation, memoize unchanged rows, defer query filtering and cache normalized entry text across filtering passes. All identifiers remain accessible; no catalog entries were removed.
- Official Docs: memoize the reader so unrelated catalog typing/filter changes do not rerender its code and exercises.
- Shared carousels: defer card geometry measurements until the track approaches the viewport; disconnect the visibility observer on unmount. This change followed the first browser measurements.
- Notepad: constrain the canvas sizing and wrap imported preformatted/nowrap content without discarding text or suppressing legitimate zoom overflow.

## Measurements and limits

`scripts/audit-web-vitals.mjs` launches a separate headless Chrome profile against a **local production server**, clears the browser cache per run, and records LCP, TTFB, long tasks and Event Timing durations for three hero-next interactions. The mobile profile uses a 390×844 viewport and 4× CPU slowdown; desktop uses 1440×900 and native CPU. Transport is localhost with no network throttling. Host load and warmed server/image caches vary. This is not a controlled before/after benchmark.

First-pass build measurements, before the final shared-carousel optimization:

| Profile | LCP samples (ms) | Largest sampled interaction duration per run (ms) |
| --- | --- | --- |
| Desktop | 4,424 / 5,200 / 1,196 | 144 / 200 / 112 |
| Mobile, 4× CPU slowdown | 2,104 / 2,400 / 1,444 | 2,088 / 3,248 / 4,416 |

Event Timing samples are **not field INP**. They show substantial responsiveness problems still requiring work. Raw local output: `artifacts/performance-audit.json` (ignored artifact).

A browser-only `content-visibility` experiment produced one mobile LCP sample of 916 ms but still very slow interactions; desktop LCP was 1,408 ms. This single exploratory sample does not prove a target pass. The CSS experiment was **not applied** to application styles. `PERF_CONTAIN_PREVIEW=1` retains the experiment in the audit utility for investigation.

The production build completed all 3,550 static paths, with existing live-news prerender fetch warnings. Its compilation preceded the last API filtering/shared-carousel refinements; use final TypeScript and regression checks for those refinements, then rebuild for release. Authenticated dashboard field performance was not measured. No production deployment or traffic-data review was performed.

## Validation

- Initial learning audit: eight suites / 96 tests passed; TypeScript passed.
- Performance regression run: six suites / 35 tests passed (news, offscreen request, API behavior/layout, documentation reader, carousel). A further offscreen-carousel regression was added afterwards and checked with Notepad tests.
- A broader slider run found four pre-existing expectation mismatches: tests expect five slides and older exam copy while the unchanged implementation has four slides. These were not rewritten to conceal the mismatch.
- Notepad real Chrome layout fixture: `scrollWidth === clientWidth` at 390, 768, 1280 and 1920 CSS pixels with long preformatted code, inline nowrap code and tables. This checks actual CSS geometry, not a screenshot of an authenticated admin session.

## Work still required to reach the targets

1. Record production Chrome traces on representative mid-range Android devices. Identify the LCP element and separate TTFB, resource transfer and render delay. Attribute long tasks to actual stacks, especially hydration and layout observers.
2. Reduce initial landing hydration and serialized data: move noninteractive section content to server components; isolate each interactive carousel and load optional reading/quiz/code tools on intent. Dynamic imports alone do not guarantee deferred hydration.
3. Profile large catalog interactions; introduce bounded pagination/virtualization where traces justify it, retaining search/deep links and accessible navigation. Measure the authenticated API/docs/quiz flows, not just hero clicks.
4. Review the existing `ClientMonitor` document-lifetime versus soft-navigation attribution before using its per-route figures as release gates. Confirm device and connection segmentation without collecting learner content.
5. Rebuild and repeat controlled cold/warm tests, then collect production p75 results. Treat the 1,000/50 budgets as unmet until measured across the relevant journeys.

Reference: [Google Core Web Vitals definitions and p75 reporting](https://support.google.com/webmasters/answer/9205520?hl=en). Learning content priorities and every dashboard route are covered in `docs/learning-dashboard-improvement-plan.md`.
