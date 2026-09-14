import type { Lesson } from "@/lib/domain";

/**
 * Three lessons appended to the Next.js 16 path, covering what the main guide
 * does not: the build and dev toolchain (Turbopack as the default bundler,
 * filesystem caching, the React Compiler through SWC), instant navigations
 * (Cache Components plus partial prefetching, the App Shell and the shared
 * layout rule), and the tooling around the framework (the DevTools MCP server
 * and the adapters API).
 *
 * Written against the installed Next.js 16.3 documentation in
 * node_modules/next/dist/docs, not from memory: `use cache`, `cacheLife`,
 * `cacheTag`, `updateTag`, `refresh`, `revalidateTag`, `cacheComponents`,
 * `partialPrefetching`, `turbopackFileSystemCache*`, `adapterPath` and the
 * proxy file convention all appear there with these exact names.
 */
export const NEXTJS_16_ADDITIONS: Lesson[] = [
  {
    title: "Turbopack, filesystem caching and the React Compiler",
    diagram: {
      kind: "flow",
      caption: "Where build time goes in Next.js 16, and what removes it: Turbopack as the default bundler, a filesystem cache that survives restarts, and the React Compiler applied only to files that need it.",
      items: [
        { label: "next dev / next build", detail: "Turbopack is the default bundler" },
        { label: "Filesystem cache read", detail: ".next/dev/cache/turbopack, reused across restarts" },
        { label: "Module graph", detail: "only changed modules are recompiled" },
        { label: "SWC pre-pass", detail: "finds files with JSX or Hooks" },
        { label: "React Compiler (Babel)", detail: "runs only on those files" },
        { label: "Fast Refresh", detail: "edit to update, without losing state" },
        { label: "Build output", detail: "cached again for the next run" },
      ],
    },
    explanation: "- Turbopack is the default bundler in Next.js 16 for both `next dev` and `next build`, so the incremental, Rust-based pipeline is what you get without opting in\n- Turbopack's filesystem cache persists compilation work between runs: `turbopackFileSystemCacheForDev` (default true) stores dev work in `.next/dev/cache/turbopack`, so restarting the dev server reuses the previous compilation instead of starting cold\n- `turbopackFileSystemCacheForBuild` does the same for production builds, which matters most in CI where each run would otherwise start from nothing — pair it with a cache step that preserves `.next/cache`\n- Because the cache is keyed by inputs, a dependency upgrade or a config change invalidates what it should and reuses the rest; a corrupted cache is fixed by deleting `.next`\n- The React Compiler is supported through `reactCompiler` in next.config, and Next.js adds an SWC pre-pass that finds files containing JSX or Hooks and runs the Babel-based compiler only on those, rather than on the whole project\n- That matters practically: the compiler is a Babel plugin, so builds are slightly slower than pure SWC, and limiting it to relevant files keeps the cost small and localised\n- Install `babel-plugin-react-compiler` alongside the config flag; the compiler then memoises components and values automatically, so most hand-written `useMemo` and `useCallback` become unnecessary\n- Memory use during long development sessions was reduced substantially in the 16.3 line, which is the difference between a dev server you restart hourly and one you leave running all day\n- Measure your own project rather than trusting headline numbers: time a cold build, a warm build with the filesystem cache and a Fast Refresh edit, and record all three before and after a toolchain change",
    keyPoints: [
      { tone: "key", title: "Turbopack is the default, not an experiment", text: "Both `next dev` and `next build` use it in Next.js 16, so bundler-specific workarounds written for webpack are usually dead weight." },
      { tone: "key", title: "The filesystem cache is what makes restarts cheap", text: "Dev compilation is stored under .next and reused, so restarting after a config change or a crash no longer means a cold compile." },
      { tone: "key", title: "The React Compiler is scoped by an SWC pre-pass", text: "Next.js runs the Babel-based compiler only on files with JSX or Hooks, which keeps the build cost proportional to the React code you actually have." },
      { tone: "tip", title: "Cache .next/cache in CI", text: "The build filesystem cache only helps if CI preserves it between runs; add it to your cache key alongside the lockfile." },
      { tone: "tip", title: "Delete .next to rule out cache weirdness", text: "When behaviour looks impossible, a clean build is the fastest way to separate a cache problem from a code problem." },
      { tone: "warning", title: "Custom webpack config is not a Turbopack config", text: "Loaders and plugins written for webpack do not transfer; check the Turbopack options before porting a build hack." },
      { tone: "warning", title: "The compiler does not fix render-time work", text: "It removes re-render cost. Data waterfalls and heavy computation in render are separate problems it cannot touch." },
    ],
    example: "- `next dev` after a restart recompiles only what changed, because the previous compilation is on disk\n- A CI job that caches `.next/cache` cuts several minutes from every build\n- Deleting 140 `useMemo` calls after enabling `reactCompiler` leaves behaviour unchanged\n- A long dev session no longer grows to multiple gigabytes of memory before a restart\n- A webpack loader in the old config turns out to be unnecessary once Turbopack handles the file type natively",
    code: "// next.config.ts — the toolchain flags, with what each one buys.\nimport type { NextConfig } from 'next'\n\nconst nextConfig: NextConfig = {\n  // Turbopack is the default bundler in Next.js 16; this block only carries options.\n  turbopack: {\n    // Example: resolve aliases, extensions and rules live here rather than in a webpack config.\n    resolveAlias: { '@ui': './components/ui' },\n  },\n\n  experimental: {\n    // Reuse compilation work between runs.\n    turbopackFileSystemCacheForDev: true,    // default: true — restarts reuse .next/dev/cache/turbopack\n    turbopackFileSystemCacheForBuild: true,  // biggest win in CI, where every run is otherwise cold\n  },\n\n  // Automatic memoisation. Requires: npm i -D babel-plugin-react-compiler\n  // Next.js runs an SWC pre-pass so the Babel plugin only touches files with JSX or Hooks.\n  reactCompiler: true,\n}\n\nexport default nextConfig\n\n# .github/workflows/build.yml — the cache step that makes the build cache real.\n- uses: actions/cache@v4\n  with:\n    path: |\n      ~/.npm\n      ${{ github.workspace }}/.next/cache\n    key: next-${{ runner.os }}-${{ hashFiles('package-lock.json') }}-${{ hashFiles('**/*.ts', '**/*.tsx') }}\n    restore-keys: |\n      next-${{ runner.os }}-${{ hashFiles('package-lock.json') }}-\n\n// components/report.tsx — what the React Compiler removes from your code.\n// Before:\n//   const rows = useMemo(() => filter(data, query), [data, query])\n//   const onPick = useCallback((id: string) => select(id), [])\n// After: plain expressions; the compiler inserts the memoisation.\nexport function Report({ data, query }: { data: Row[]; query: string }) {\n  const rows = filter(data, query)\n  const onPick = (id: string) => select(id)\n  return <Table rows={rows} onPick={onPick} />\n}",
    apiReference: [
      {
        name: "turbopackFileSystemCache",
        kind: "config",
        signature: "experimental: { turbopackFileSystemCacheForDev?: boolean, turbopackFileSystemCacheForBuild?: boolean }",
        params: [
          { name: "turbopackFileSystemCacheForDev", type: "boolean", description: "Default true; caches dev compilation in .next/dev/cache/turbopack so restarts reuse it." },
          { name: "turbopackFileSystemCacheForBuild", type: "boolean", description: "Caches production build work, which pays off most in CI." },
        ],
        returns: "Compilation work that survives process restarts.",
        notes: "Delete .next to discard the cache when diagnosing build behaviour.",
      },
      {
        name: "reactCompiler",
        kind: "config",
        signature: "reactCompiler: boolean | { compilationMode?, panicThreshold? }",
        params: [
          { name: "reactCompiler", type: "boolean", description: "Enables the React Compiler, applied through Babel to files an SWC pre-pass identifies." },
        ],
        returns: "Automatically memoised components and values.",
        notes: "Requires babel-plugin-react-compiler as a dev dependency.",
      },
    ],
    vocabulary: [
      { word: "Bundler", meaning: "The tool that resolves modules and produces the JavaScript a browser loads.", example: "Turbopack compiling the app router tree.", synonyms: ["build tool", "module compiler", "packer", "asset pipeline", "toolchain"], antonyms: ["runtime", "interpreter", "server process", "browser engine"] },
      { word: "Filesystem cache", meaning: "Compilation work stored on disk and reused by later runs.", example: ".next/dev/cache/turbopack after a restart.", synonyms: ["persistent cache", "on-disk cache", "build cache", "warm cache", "incremental store"], antonyms: ["cold start", "in-memory only", "clean build", "cache miss"] },
      { word: "Fast Refresh", meaning: "Applying an edit to the running app while preserving component state.", example: "Editing a form without losing typed input.", synonyms: ["hot reload", "live update", "instant edit", "state-preserving reload"], antonyms: ["full page reload", "restart", "cold reload", "lost state"] },
      { word: "Pre-pass", meaning: "A cheap first analysis that decides which files a costlier step must process.", example: "SWC finding files with JSX before Babel runs.", synonyms: ["scan", "triage step", "filter pass", "analysis phase"], antonyms: ["whole-project compile", "unconditional transform", "blanket processing"] },
      { word: "Incremental build", meaning: "Recompiling only what changed since the previous run.", example: "One edited component recompiled, not the app.", synonyms: ["partial rebuild", "delta compile", "changed-files build", "cached rebuild"], antonyms: ["full rebuild", "clean compile", "from-scratch build"] },
      { word: "Cache key", meaning: "The inputs that decide whether cached work can be reused.", example: "Lockfile hash plus source hashes in CI.", synonyms: ["invalidation key", "cache signature", "fingerprint", "reuse token"], antonyms: ["unconditional reuse", "stale cache", "ignored inputs"] },
    ],
    useCase: {
      scenario: "A large application takes nine minutes to build in CI and forty seconds to start locally, and developers restart the dev server several times a day because memory climbs until the machine slows down.",
      example: "The project moves to the Next.js 16 defaults: Turbopack for dev and build, filesystem caching on for both, and `.next/cache` preserved by the CI cache step with the lockfile in the key. `reactCompiler` is enabled with babel-plugin-react-compiler installed, and manual memoisation is removed file by file as components are touched.",
      usage: "Warm CI builds finish in a fraction of the time, a dev restart reuses the previous compilation instead of starting cold, and long sessions stop being memory-bound.",
    },
    exercise: "- Time a cold build, a warm build and a Fast Refresh edit, and write the three numbers down\n- Turn on the build filesystem cache and add `.next/cache` to your CI cache step, then re-time the build\n- Enable reactCompiler with the Babel plugin installed and confirm behaviour is unchanged\n- Remove manual memoisation from one component and verify with the Profiler that renders did not increase",
    checkpoint: "- Which bundler does `next build` use by default in Next.js 16?\n- What does the filesystem cache change about restarting the dev server?\n- Why does Next.js run an SWC pre-pass before the React Compiler?",
    mistake: "- Do not port webpack loaders and plugins blindly; check whether Turbopack handles it natively\n- Do not enable the build cache without preserving `.next/cache` in CI — it will never be warm\n- Do not expect the React Compiler to fix data waterfalls or work that should not be in render",
    interview: [
      {
        question: "What changed about the Next.js build pipeline in version 16?",
        definition: "Turbopack became the default bundler for both development and production builds, with a filesystem cache that persists work between runs.",
        answer: "Previously Turbopack was opt-in for dev and webpack ran production builds; in Next.js 16 it is the default for both, so the incremental, Rust-based pipeline is what you get out of the box. The filesystem cache is the second half: dev compilation is written under `.next/dev/cache/turbopack` and reused after a restart, and the equivalent build cache makes CI runs warm when the pipeline preserves `.next/cache`. The practical consequences are that webpack-specific loaders and plugins need reviewing rather than porting, and that build timings should be measured cold and warm separately.",
        similar: [
          { question: "Where does Turbopack configuration live?", answer: "In the top-level `turbopack` key of next.config, with the filesystem cache flags under `experimental`." },
          { question: "How do you invalidate the cache?", answer: "It is keyed by inputs, so changes invalidate what they should; deleting `.next` forces a clean build." },
        ],
      },
      {
        question: "How does Next.js integrate the React Compiler, and what does it cost?",
        definition: "Through the `reactCompiler` config flag and the Babel plugin, scoped by an SWC pre-pass that finds files containing JSX or Hooks.",
        answer: "The compiler itself is a Babel plugin, which is slower than the Rust pipeline, so Next.js first analyses the project with SWC and applies the plugin only to files that actually contain React code. That keeps the build cost small and localised rather than paying Babel on every file. In return, components and values are memoised automatically, so most hand-written useMemo and useCallback disappear — along with the stale dependency arrays that came with them. It optimises only code that follows the Rules of React, so the lint rules are the part worth adopting first.",
        similar: [
          { question: "What must be installed?", answer: "babel-plugin-react-compiler as a dev dependency, alongside the reactCompiler flag in next.config." },
          { question: "Is any memoisation still worth writing?", answer: "Yes, where a stable identity is needed as an Effect dependency rather than for speed." },
        ],
      },
    ],
    objectiveQuestions: [
      {
        question: "In Next.js 16, which bundler runs `next build` by default?",
        options: ["webpack", "Turbopack", "esbuild", "Rollup"],
        correct: 1,
        shortAnswer: "Turbopack",
        explanation: "Next.js 16 promoted Turbopack to the default bundler for both `next dev` and `next build`, so the incremental Rust pipeline applies to production builds without an opt-in flag. Webpack-era loaders and plugins therefore need checking rather than assuming they still apply.",
      },
      {
        question: "What does turbopackFileSystemCacheForDev provide?",
        options: ["A CDN cache for static assets", "Compilation work stored on disk so restarting the dev server reuses it", "Caching of fetch responses in development", "Persistent React state across reloads"],
        correct: 1,
        shortAnswer: "On-disk compilation reuse across dev server restarts",
        explanation: "The flag caches Turbopack's dev compilation under .next/dev/cache/turbopack, so a restart picks up the previous work instead of compiling from scratch. It has nothing to do with HTTP caching, data fetching or component state, each of which is handled by a different mechanism.",
      },
      {
        question: "Why does Next.js run an SWC pre-pass before applying the React Compiler?",
        options: ["To type-check the project", "To limit the Babel-based compiler to files containing JSX or Hooks", "To minify output", "To generate route types"],
        correct: 1,
        shortAnswer: "To scope the Babel plugin to relevant files",
        explanation: "The React Compiler runs as a Babel plugin, which is slower than SWC, so Next.js analyses the project first and applies it only to files that contain React code. That keeps the build-time cost proportional to the React surface rather than paying Babel across the whole project.",
      },
    ],
  },
  {
    title: "Instant navigations: partial prefetching and the App Shell",
    diagram: {
      kind: "flow",
      caption: "A navigation feels instant when the destination's static shell is already on the client and only the uncached holes stream in. The shared layout decides how much of the page can be reused.",
      items: [
        { label: "cacheComponents: true", detail: "use cache defines what is prerenderable" },
        { label: "partialPrefetching: true", detail: "prefetch payloads carry only what is needed" },
        { label: "Link enters the viewport", detail: "the static shell is prefetched" },
        { label: "User clicks", detail: "shell renders immediately from the client cache" },
        { label: "Shared layout is reused", detail: "only the segments below it re-render" },
        { label: "Suspense boundaries below it", detail: "fallbacks cover the dynamic holes" },
        { label: "Server streams the rest", detail: "uncached data fills the fallbacks" },
        { label: "Validate", detail: "the framework reports what blocks instant navigation" },
      ],
    },
    explanation: "- A navigation is instant when the browser can start rendering the destination the moment the user clicks: static, cached and fallback content appear immediately while the server streams the remainder into those fallbacks\n- The definition assumes warm caches. A cold cache still needs the server to compute the cached result once, so the first navigation to a route can wait\n- Getting there requires two flags together: `cacheComponents: true`, which makes `use cache` the way a result becomes prerenderable, and `partialPrefetching: true`, which shrinks prefetch payloads to what the navigation actually needs\n- A direct visit and a client navigation to the same route produce different initial UI. A direct visit receives the static shell as HTML, usually from a CDN; a client navigation only re-renders below the layout the two routes share\n- That is the rule worth internalising: a `<Suspense>` boundary above the shared layout cannot help during a client navigation, because it sits outside the re-rendered scope. Boundaries must sit below the shared layout to cover the holes that navigation creates\n- The same asymmetry explains a familiar confusion: `useSearchParams()` suspends during server rendering because params are not known at build time, but resolves synchronously on a client navigation because the router already has them\n- Layout deduplication follows from the shared-layout rule: data the layout already fetched is not refetched for a sibling route, so moving between sibling pages transfers only the differences\n- `prefetch={true}` on a Link resolves that link's URL data — its params and search params — before navigation, but it cannot rescue a route that blocks. Make the route instant first, then tune prefetching\n- Work route by route: enable the flags, read the validation errors the framework raises, and fix the segment they name rather than trying to convert an application in one pass\n- Lock the behaviour in with an end-to-end test that asserts the destination's shell content is visible immediately after the click, so a later change cannot silently reintroduce a blocking fetch",
    keyPoints: [
      { tone: "key", title: "Two flags, not one", text: "cacheComponents defines what is prerenderable and partialPrefetching shrinks what is sent. Instant navigation is the result of both." },
      { tone: "key", title: "The shared layout sets the re-render scope", text: "Only segments below the layout two routes share re-render, so that is where Suspense boundaries have to live." },
      { tone: "key", title: "Direct visit and client navigation differ", text: "One gets the static shell as HTML from a CDN; the other reuses the shared layout. The same page can be instant in one case and blocking in the other." },
      { tone: "tip", title: "Follow the validation errors", text: "With the flags on, the framework names the segments that prevent an instant navigation — that list is the migration plan." },
      { tone: "tip", title: "Prefetching cannot fix a blocking route", text: "Make the route's shell renderable first; per-link prefetching is a tuning step afterwards, not a substitute." },
      { tone: "warning", title: "A boundary above the shared layout does nothing on navigation", text: "It is outside the re-rendered scope, which is why a page that streams beautifully on load can still block on a click." },
      { tone: "warning", title: "Cold caches still wait", text: "The instant guarantee is about warm caches. Measure the first request to a route separately from subsequent ones." },
    ],
    example: "- Moving between /store/shoes and /store/hats re-renders only below the /store layout\n- A Suspense boundary in the root layout covers a page load but not that navigation\n- useSearchParams suspends on a direct visit and resolves synchronously on a client navigation\n- Enabling both flags produces a list of segments that block, which becomes the work queue\n- An end-to-end test asserts the destination heading is visible in the same frame as the click",
    code: "// next.config.ts — instant navigation needs both flags.\nimport type { NextConfig } from 'next'\n\nconst nextConfig: NextConfig = {\n  cacheComponents: true,      // 'use cache' defines what can be prerendered\n  partialPrefetching: true,   // prefetch payloads carry only what the navigation needs\n}\n\nexport default nextConfig\n\n// app/store/layout.tsx — the shared layout: everything below it re-renders on navigation.\nexport default function StoreLayout({ children }: { children: React.ReactNode }) {\n  return <div className=\"store\"><StoreNav />{children}</div>\n}\n\n// app/store/[category]/page.tsx\n// The cached part becomes the shell; the uncached part sits behind a boundary\n// BELOW the shared layout, so it is usable during a client navigation.\nimport { Suspense } from 'react'\nimport { cacheLife, cacheTag } from 'next/cache'\n\nasync function CategoryHeader({ category }: { category: string }) {\n  'use cache'\n  cacheLife('hours')\n  cacheTag(`category:${category}`)\n  const meta = await db.category.find(category)\n  return <header><h1>{meta.title}</h1><p>{meta.blurb}</p></header>\n}\n\nasync function LiveStock({ category }: { category: string }) {\n  // Request-time data: deliberately NOT cached, so it streams into the fallback.\n  const stock = await fetch(`https://api.example.com/stock/${category}`, { cache: 'no-store' }).then(r => r.json())\n  return <StockTable rows={stock} />\n}\n\nexport default async function Page({ params }: { params: Promise<{ category: string }> }) {\n  const { category } = await params\n  return (\n    <>\n      <CategoryHeader category={category} />\n      <Suspense fallback={<StockSkeleton />}>\n        <LiveStock category={category} />\n      </Suspense>\n    </>\n  )\n}\n\n// e2e/instant.spec.ts — lock the behaviour in, so a later fetch cannot regress it.\nimport { test, expect } from '@playwright/test'\n\ntest('navigating between categories is instant', async ({ page }) => {\n  await page.goto('/store/shoes')\n  await page.getByRole('link', { name: 'Hats' }).click()\n  // The shell must be present immediately, not after the data resolves.\n  await expect(page.getByRole('heading', { name: 'Hats' })).toBeVisible({ timeout: 300 })\n  await expect(page.getByTestId('stock-skeleton')).toBeVisible()\n})",
    apiReference: [
      {
        name: "cacheComponents",
        kind: "config",
        signature: "cacheComponents: boolean",
        params: [{ name: "cacheComponents", type: "boolean", description: "Enables the Cache Components model, where 'use cache' gives a result a lifetime and makes it prerenderable." }],
        returns: "A rendering model in which cached results form the static shell.",
        notes: "With it enabled, GET Route Handlers follow the same prerendering model as pages.",
      },
      {
        name: "partialPrefetching",
        kind: "config",
        signature: "partialPrefetching: boolean",
        params: [{ name: "partialPrefetching", type: "boolean", description: "Sends smaller prefetch payloads containing only what a navigation requires." }],
        returns: "Lower network overhead per prefetched link.",
        notes: "Pairs with cacheComponents; instant navigation generally needs both.",
      },
      {
        name: "Link prefetch",
        kind: "component prop",
        signature: "<Link href=\"/store/hats\" prefetch={true | false} />",
        params: [{ name: "prefetch", type: "boolean", description: "true resolves the link's params and search params before navigation." }],
        returns: "A warmed client cache entry for that destination.",
        notes: "Cannot make a blocking route instant; fix the route's shell first.",
      },
    ],
    vocabulary: [
      { word: "Static shell", meaning: "The prerendered part of a route that can be served immediately.", example: "The category header rendered from cache.", synonyms: ["prerendered frame", "cached skeleton", "instant shell", "static output", "app shell"], antonyms: ["dynamic hole", "request-time render", "blocking content", "uncached segment"] },
      { word: "Dynamic hole", meaning: "A region that must be computed per request and streams into a fallback.", example: "Live stock behind a Suspense boundary.", synonyms: ["streamed region", "request-time segment", "uncached slot", "deferred content"], antonyms: ["static shell", "cached result", "prerendered region"] },
      { word: "Shared layout", meaning: "The nearest layout two routes have in common, which is not re-rendered between them.", example: "/store/layout.tsx between two categories.", synonyms: ["common ancestor layout", "reused frame", "persistent layout"], antonyms: ["re-rendered segment", "route-specific page", "full remount"] },
      { word: "Prefetch payload", meaning: "The data sent ahead of a navigation so the destination can render on click.", example: "A partial payload for one link.", synonyms: ["preloaded route data", "navigation payload", "warmed cache entry"], antonyms: ["on-click fetch", "cold navigation", "unprefetched route"] },
      { word: "Layout deduplication", meaning: "Not refetching data a shared layout already has when moving between sibling routes.", example: "Store navigation kept between categories.", synonyms: ["shared-data reuse", "avoided refetch", "layout reuse"], antonyms: ["duplicate fetch", "full-tree refetch", "redundant request"] },
      { word: "Warm cache", meaning: "A cache that already holds the computed result for a route.", example: "The second visitor to a cached category page.", synonyms: ["primed cache", "populated cache", "hot path"], antonyms: ["cold cache", "first request", "cache miss"] },
    ],
    useCase: {
      scenario: "A catalogue application streams beautifully on first load, but clicking between categories shows a blank content area for half a second while data is fetched, and the team's attempts to fix it with prefetch={true} change nothing.",
      example: "Cache Components and partial prefetching are enabled together, and the validation errors name the segments that block. The category header moves into a `use cache` scope with a cacheLife and a cacheTag, so it is part of the shell, while live stock keeps its request-time fetch behind a Suspense boundary placed below the shared /store layout rather than in the root layout. A Playwright test asserts the destination heading is visible within 300ms of the click.",
      usage: "Category-to-category navigation renders the header immediately with a skeleton for stock, and the test stops a future fetch from silently reintroducing the blank frame.",
    },
    exercise: "- Enable cacheComponents and partialPrefetching and write down every validation error you get\n- Find a Suspense boundary that sits above a shared layout and move it below\n- Put one route's stable content in a `use cache` scope with a cacheLife, leaving request-time data outside it\n- Add an end-to-end test asserting the destination's shell is visible immediately after a click",
    checkpoint: "- Why can a Suspense boundary in the root layout fail to help a client navigation?\n- What is the difference between what a direct visit and a client navigation receive?\n- Why can prefetch={true} not make a blocking route instant?",
    mistake: "- Do not enable partial prefetching alone and expect instant navigation; it pairs with Cache Components\n- Do not put the only Suspense boundary above the shared layout\n- Do not benchmark with a cold cache and conclude instant navigation does not work",
    interview: [
      {
        question: "What makes a Next.js navigation instant, and what prevents it?",
        definition: "The destination's shell is already available on the client, so rendering starts on click while uncached regions stream into fallbacks.",
        answer: "Two things have to be true: the route must have a prerenderable shell, which Cache Components provides through `use cache` with a lifetime, and the prefetch must be small enough to be worth sending ahead, which partial prefetching handles. The usual blocker is boundary placement: a client navigation only re-renders below the layout the two routes share, so a Suspense boundary above that layout cannot cover the new page's dynamic regions and the navigation waits for data. The fix is to move boundaries below the shared layout and to cache the stable parts, then verify with a test rather than by feel.",
        similar: [
          { question: "Why do direct visits behave differently?", answer: "A direct visit renders from the document root and receives the full static shell as HTML; a navigation reuses the shared layout." },
          { question: "Does this work with a cold cache?", answer: "No — the first request still computes the cached result, so measure cold and warm separately." },
        ],
      },
      {
        question: "Why does useSearchParams() behave differently on a page load and a client navigation?",
        definition: "Search params are unknown at build time on the server, but already held by the router during a client navigation.",
        answer: "During server rendering the hook suspends, because the values are not available until a request arrives — which is why a component using it needs a Suspense boundary to avoid blocking the whole page. On a client navigation the router already parsed the URL, so the hook resolves synchronously and the component renders immediately. The same component can therefore appear instantly in one path and sit behind a fallback in the other, which is worth remembering when a page seems to behave inconsistently between a refresh and a link click.",
        similar: [
          { question: "What is the practical consequence?", answer: "Wrap components that read search params in a boundary so a direct visit streams rather than blocks." },
          { question: "Does the same apply to params?", answer: "Route params are known for a prerendered path, but per-link prefetching resolves both params and search params before navigation." },
        ],
      },
    ],
    objectiveQuestions: [
      {
        question: "Which pair of configuration flags underpins instant navigation?",
        options: ["reactCompiler and turbopack", "cacheComponents and partialPrefetching", "output: 'export' and trailingSlash", "ppr and runtime: 'edge'"],
        correct: 1,
        shortAnswer: "cacheComponents and partialPrefetching",
        explanation: "Cache Components makes cached results prerenderable so a route has a static shell, and partial prefetching shrinks the payload sent ahead of a navigation. Compiler and bundler options affect build performance, static export changes the deployment model, and neither addresses what the client holds before a click.",
      },
      {
        question: "During a client navigation between two sibling routes, which Suspense boundaries can provide fallbacks?",
        options: ["Any boundary in the tree, including the root layout", "Only boundaries below the layout the two routes share", "Only boundaries in the destination page file", "Boundaries are ignored during client navigations"],
        correct: 1,
        shortAnswer: "Only boundaries below the shared layout",
        explanation: "A client navigation re-renders only the segments beneath the nearest common layout, so a boundary above that point is outside the re-rendered scope and never triggers. That is why a page that streams well on a direct visit can still block on a click until its boundaries are moved below the shared layout.",
      },
      {
        question: "A route blocks on navigation. What does adding prefetch={true} to its Link achieve?",
        options: ["It makes the route instant", "It resolves the link's params and search params early, but cannot fix a blocking route", "It disables streaming for that route", "It forces a full page load"],
        correct: 1,
        shortAnswer: "It resolves URL data early but cannot fix a blocking route",
        explanation: "Per-link prefetching warms what it can ahead of the click, including the link's params and search params, but if the destination has no prerenderable shell there is nothing useful to render on arrival. The route has to be made instant first — by caching its stable parts and placing boundaries correctly — after which prefetching is a tuning step.",
      },
    ],
  },
  {
    title: "Framework tooling: the DevTools MCP server and build adapters",
    diagram: {
      kind: "split",
      caption: "Two tooling surfaces added around the framework: one lets a coding agent read your running application, the other lets a deployment platform hook into the build.",
      headings: ["DevTools MCP (agents)", "Adapters API (platforms)"],
      items: [
        { label: "next-devtools-mcp", detail: "an MCP server for your dev instance", group: 0 },
        { label: ".mcp.json entry", detail: "the agent connects automatically", group: 0 },
        { label: "Build, runtime and type errors", detail: "read without copy-pasting", group: 0 },
        { label: "Route and component metadata", detail: "what rendered, and how", group: 0 },
        { label: "adapterPath in next.config", detail: "or NEXT_ADAPTER_PATH for zero config", group: 1 },
        { label: "Hooks into the build", detail: "outputs, routes, runtime requirements", group: 1 },
        { label: "Platform-specific packaging", detail: "any host, not just one vendor", group: 1 },
        { label: "Reference implementation", detail: "the Vercel adapter is open", group: 1 },
      ],
    },
    explanation: "- Next.js 16 ships MCP support so coding agents can read a running application's internals rather than being handed pasted logs; you install the `next-devtools-mcp` package to use it\n- Configuration is one entry in `.mcp.json` at the project root, after which the server discovers and connects to your running dev instance when it starts\n- What it exposes is the information you would otherwise copy by hand: current build errors, runtime errors and type errors, live application state, and page metadata such as routes, components and rendering details\n- That is what makes an agent useful on a real application: it can see the actual error and the actual route tree rather than reasoning from an out-of-date description\n- Unified logging is the same idea for the other direction: browser and server logs arriving in one place means an agent (or a person) can follow a failure across the boundary without stitching two consoles together\n- Treat agent access like any other tool access: it reads your development environment, so keep it to development, and remember the MCP server is a local process, not a production endpoint\n- The adapters API is the deployment-side counterpart: `adapterPath` in next.config points at an adapter module, and `NEXT_ADAPTER_PATH` lets a platform enable one with zero configuration\n- An adapter hooks into the build to learn what was produced — routes, outputs, runtime requirements — so a host other than the framework's own platform can package and serve an application correctly\n- The Vercel adapter is published as a reference implementation, which is the fastest way to understand what an adapter has to answer for a given hosting model\n- For most application teams this is background knowledge rather than daily work: it matters when you self-host, build an internal platform, or need to explain why a feature behaves differently on a particular host",
    keyPoints: [
      { tone: "key", title: "MCP gives agents the real error", text: "Build, runtime and type errors come from the running dev server, so an agent stops working from stale pasted text." },
      { tone: "key", title: "One .mcp.json entry is the whole setup", text: "The server discovers the dev instance itself; there is no per-project wiring beyond the command." },
      { tone: "key", title: "Adapters make Next.js portable", text: "adapterPath lets a host hook into the build and package the output, which is what makes non-Vercel deployment a supported path rather than a workaround." },
      { tone: "tip", title: "Unified logs beat two consoles", text: "Server and browser output in one stream is what lets anyone follow a failure across the network boundary." },
      { tone: "tip", title: "Read the reference adapter", text: "The published Vercel adapter shows exactly which build outputs and route metadata a host must handle." },
      { tone: "warning", title: "Keep the MCP server to development", text: "It exposes application internals and is designed for a local dev instance, not for a production environment." },
      { tone: "warning", title: "An adapter is not a config shim", text: "It participates in the build contract; treat a version upgrade as something to test rather than assume." },
    ],
    example: "- An agent reads the current type error directly instead of asking for the terminal output\n- Page metadata tells the agent which route rendered a component before it edits\n- Browser and server logs in one stream reveal that a 500 came from a server action, not the client\n- `adapterPath: require.resolve('./my-adapter.js')` wires a custom host into the build\n- `NEXT_ADAPTER_PATH` lets a platform enable its adapter without touching the project's config",
    code: "// .mcp.json — the entire DevTools MCP setup.\n{\n  \"mcpServers\": {\n    \"next-devtools\": {\n      \"command\": \"npx\",\n      \"args\": [\"-y\", \"next-devtools-mcp@latest\"]\n    }\n  }\n}\n\n// With the dev server running, an agent can ask for:\n//   - current build errors, runtime errors and type errors\n//   - live application state\n//   - page metadata: routes, components, rendering details\n// which removes the copy-paste step that makes agent debugging unreliable.\n\n// next.config.ts — hooking a deployment platform into the build.\nimport type { NextConfig } from 'next'\n\nconst nextConfig: NextConfig = {\n  adapterPath: require.resolve('./my-adapter.js'),\n  // Alternatively, platforms set NEXT_ADAPTER_PATH for zero-config usage.\n}\n\nexport default nextConfig\n\n// my-adapter.js — the shape of an adapter: it observes the build and reports\n// what the host must serve. See the published reference adapter for the full contract.\nmodule.exports = {\n  name: 'internal-platform-adapter',\n  async modifyConfig(config) {\n    return config\n  },\n  async onBuildComplete({ routes, outputs }) {\n    // routes: what paths exist and how each is rendered\n    // outputs: the files and functions the host must deploy\n    await writeDeploymentManifest({ routes, outputs })\n  },\n}",
    apiReference: [
      {
        name: "next-devtools-mcp",
        kind: "package",
        signature: ".mcp.json → { mcpServers: { \"next-devtools\": { command: \"npx\", args: [\"-y\", \"next-devtools-mcp@latest\"] } } }",
        params: [
          { name: "errors", type: "capability", description: "Current build, runtime and type errors from the dev server." },
          { name: "live state", type: "capability", description: "Real-time application state and runtime information." },
          { name: "page metadata", type: "capability", description: "Routes, components and rendering details." },
        ],
        returns: "An MCP server a coding agent connects to alongside the running dev instance.",
        notes: "Requires Next.js 16 or above; it connects to the dev server automatically.",
      },
      {
        name: "adapterPath",
        kind: "config",
        signature: "adapterPath: string  — or the NEXT_ADAPTER_PATH environment variable",
        params: [
          { name: "adapterPath", type: "string", description: "Module path for the adapter that hooks into the build process." },
          { name: "NEXT_ADAPTER_PATH", type: "env", description: "Lets a deployment platform enable an adapter without project config." },
        ],
        returns: "A build that reports its routes and outputs to the host platform.",
        notes: "The Vercel adapter is published as a reference implementation.",
      },
    ],
    vocabulary: [
      { word: "MCP server", meaning: "A process exposing tools and data to an AI application over the Model Context Protocol.", example: "next-devtools-mcp attached to a dev server.", synonyms: ["tool server", "agent integration", "context provider", "protocol endpoint"], antonyms: ["manual copy-paste", "screenshot", "pasted log", "closed tooling"] },
      { word: "Agent logging", meaning: "Browser and server output merged into one stream a tool can read.", example: "Following a 500 from click to server action.", synonyms: ["unified logs", "merged output", "cross-boundary logging"], antonyms: ["split consoles", "separate log files", "manual correlation"] },
      { word: "Build adapter", meaning: "A module that hooks into the build so a host can package the output.", example: "An internal platform's deployment manifest.", synonyms: ["deployment integration", "platform hook", "build plugin", "host adapter"], antonyms: ["manual deployment", "hand-written packaging", "unsupported host"] },
      { word: "Build output", meaning: "The files and functions a build produces for a host to serve.", example: "Static assets plus server functions per route.", synonyms: ["deployment artefact", "compiled result", "emitted bundle"], antonyms: ["source tree", "development server", "uncompiled code"] },
      { word: "Zero-config integration", meaning: "A platform enabling behaviour without changes to the project's configuration.", example: "NEXT_ADAPTER_PATH set by the host.", synonyms: ["convention-based setup", "automatic wiring", "out-of-the-box integration"], antonyms: ["manual configuration", "per-project setup", "explicit wiring"] },
      { word: "Route metadata", meaning: "Information about which paths exist and how each is rendered.", example: "Static, dynamic and streaming segments per route.", synonyms: ["route manifest", "rendering map", "path inventory"], antonyms: ["opaque bundle", "unknown routing", "undocumented output"] },
    ],
    useCase: {
      scenario: "A team uses a coding agent that constantly asks for terminal output and guesses at routing, and the same application is deployed to an internal Kubernetes platform through a hand-maintained script that breaks on every Next.js upgrade.",
      example: "The DevTools MCP server is added with one .mcp.json entry, so the agent reads current build, runtime and type errors and the real route metadata from the running dev server instead of asking. Separately, the deployment script is replaced by an adapter wired through NEXT_ADAPTER_PATH, modelled on the published reference adapter, which receives the build's routes and outputs and writes the platform's deployment manifest.",
      usage: "Debugging with the agent stops depending on copy-paste accuracy, and framework upgrades surface as adapter contract changes rather than as a mysteriously broken deployment.",
    },
    exercise: "- Add the .mcp.json entry, start the dev server, and have an agent report your current build errors\n- Introduce a type error deliberately and confirm the agent sees it without being told\n- Read the published reference adapter and list what a host must handle\n- Sketch an adapter that writes a deployment manifest from the build's routes and outputs",
    checkpoint: "- What does the DevTools MCP server expose to a coding agent?\n- Why is unified browser and server logging useful for debugging?\n- What problem does the adapters API solve for a non-Vercel host?",
    mistake: "- Do not expose the DevTools MCP server outside development; it reveals application internals\n- Do not treat an adapter as configuration; it participates in the build contract and needs testing on upgrade\n- Do not let an agent edit routes it has not read; the metadata is there precisely so it can check",
    interview: [
      {
        question: "What does Next.js's MCP support give a coding agent?",
        definition: "Live access to a running dev server's errors, state and route metadata through the Model Context Protocol.",
        answer: "Installing next-devtools-mcp and adding one entry to .mcp.json lets an agent query the application while it runs: current build errors, runtime errors and type errors, live application state, and page metadata covering routes, components and rendering details. The value is that the agent stops working from a stale description or pasted output — it reads the actual failure and the actual route tree before proposing a change. It is a development-time tool connected to the dev server, so it belongs in local workflows rather than anywhere near production.",
        similar: [
          { question: "What is the setup?", answer: "One mcpServers entry running npx next-devtools-mcp@latest; it discovers the dev instance automatically." },
          { question: "What version is required?", answer: "Next.js 16 or above." },
        ],
      },
      {
        question: "What is the adapters API for?",
        definition: "It lets a deployment platform or build system hook into the Next.js build and package its outputs.",
        answer: "An adapter is a module named by `adapterPath` in next.config, or by the NEXT_ADAPTER_PATH environment variable so a platform can enable it with no project configuration. It participates in the build and receives what the build produced — the routes and their rendering modes, the outputs that must be deployed — so a host can package and serve the application correctly instead of reverse-engineering the output directory. That turns self-hosting and internal platforms into a supported integration point, and the published reference adapter documents the contract in practice.",
        similar: [
          { question: "Who writes an adapter?", answer: "Deployment platforms and internal platform teams, rarely application teams." },
          { question: "Why not just copy .next?", answer: "Routes have different rendering and runtime requirements; the adapter is how a host learns them rather than guessing." },
        ],
      },
    ],
    objectiveQuestions: [
      {
        question: "What does next-devtools-mcp expose to a connected agent?",
        options: ["Production traffic and analytics", "Build, runtime and type errors, live state and page metadata from the dev server", "Database contents", "The deployment history"],
        correct: 1,
        shortAnswer: "Dev-server errors, live state and page metadata",
        explanation: "The MCP server surfaces what an agent would otherwise ask a human to paste: current build, runtime and type errors, real-time application state, and route and component metadata. It attaches to the running development instance, so production traffic, databases and deployment history are outside its scope.",
      },
      {
        question: "Which configuration lets a deployment platform hook into the Next.js build?",
        options: ["output: 'standalone'", "adapterPath, or the NEXT_ADAPTER_PATH environment variable", "assetPrefix", "distDir"],
        correct: 1,
        shortAnswer: "adapterPath / NEXT_ADAPTER_PATH",
        explanation: "The adapters API is enabled by pointing adapterPath at an adapter module, or by a platform setting NEXT_ADAPTER_PATH for zero-config use. Standalone output, asset prefixes and the build directory all change what is produced or where, but none of them give a host the build's route and output information.",
      },
      {
        question: "Where should the Next.js DevTools MCP server be used?",
        options: ["In production, so agents can debug live incidents", "In development, attached to the local dev server", "In CI only", "In the browser extension"],
        correct: 1,
        shortAnswer: "In development, with the local dev server",
        explanation: "The server is designed to attach to a running development instance and exposes application internals such as live state and errors. That is exactly what makes it useful locally and inappropriate to expose in production, where the same information is sensitive and the dev server is not running.",
      },
    ],
  },
];
