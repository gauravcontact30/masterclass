import type { TechnologyEssentials } from "./types";

/**
 * Languages, frameworks and runtimes.
 *
 * The Next.js points are written against the installed version's own docs in
 * `node_modules/next/dist/docs/`, not from memory: Turbopack by default, `proxy`
 * in place of the deprecated `middleware` convention, async request APIs, and
 * Cache Components behind its flag.
 */
export const WEB_ESSENTIALS: TechnologyEssentials[] = [
  {
    technologies: ["React 19+ — Components, Actions & Server UI"],
    points: [
      "Rendering must be a pure function of props and state. Every rule that looks arbitrary — no side effects in the body, no mutation of props, no hooks in conditions — exists so React can call your component twice, or not at all, and get the same UI.",
      "State updates are queued, not applied. Reading the state variable straight after setting it gives the old value, which is why an updater function is the fix for anything computed from the previous value.",
      "An Effect is for synchronizing with something outside React — a subscription, a timer, a non-React widget. Work that only derives a value from props or state belongs in the render body or a memo, not in an Effect.",
      "Server Components are the default in a React Server Components setup; `'use client'` marks the boundary where interactivity begins. Props crossing that boundary must be serializable, which is why a function cannot simply be passed down.",
      "Actions replace hand-written submit handlers for mutations: the pending state, the error and the optimistic result all come from the framework instead of from four `useState` calls you keep in sync yourself.",
    ],
    categories: {
      "Performance": ["Measure before memoizing. `memo`, `useMemo` and `useCallback` all cost something, and the React Compiler removes most of the reason to write them by hand.", "A list without stable `key` props re-creates DOM and loses component state on reorder — the most common performance bug that looks like a correctness bug."],
      "Server & client": ["A Server Component can render a Client Component, but not the reverse; a Client Component receives server output as children instead.", "Secrets stay safe only on the server side of that boundary. Anything reachable from a `'use client'` module ships to the browser."],
      "State & effects": ["Two pieces of state that always change together are one piece of state. Most 'impossible' UI states come from splitting what should have been a single value.", "An Effect with a missing dependency does not fail loudly — it reads a stale value. The linter's dependency warning is a correctness warning."],
      "Actions & forms": ["A form that works without JavaScript works better with it. Progressive enhancement is the default behaviour of Actions, not an extra feature.", "`useOptimistic` shows the intended result immediately and rolls back if the action rejects, so the rollback path is code you must actually test."],
      "Modern React": ["The React Compiler memoizes automatically for code that follows the rules. Code that breaks purity silently opts out of the optimization instead of erroring."],
    },
  },
  {
    technologies: ["React 19+ Hooks — State, Effects & Actions"],
    points: [
      "Hooks are matched to their component by call order, not by name. That single implementation detail explains why they cannot sit inside a condition, a loop or an early return.",
      "The dependency array is a correctness contract, not a performance knob. Omitting a value does not skip work — it captures a stale copy of that value forever.",
      "Cleanup runs before every re-run of an Effect, not only on unmount. An Effect that subscribes without returning an unsubscribe leaks one listener per dependency change.",
      "A custom hook is a naming device, not a sharing device: each call gets its own independent state. Sharing state across components needs context, a store or a server.",
    ],
    categories: {
      "Effect hooks": ["In development, React mounts, unmounts and remounts a component to surface missing cleanup. Double-invocation is the test, not the bug."],
      "Performance hooks": ["`useMemo` caches a value, `useCallback` caches a function identity; neither prevents the component from re-rendering.", "A memo whose dependencies change every render is pure overhead, and an object literal in the dependency array does exactly that."],
      "Ref hooks": ["Writing to a ref does not re-render. Reading one during render is unsafe, because the value can differ between the render and the commit."],
      "State hooks": ["Passing a function to `useState` defers the expensive initializer to the first render only; passing the computed value runs it on every render."],
      "Testing Hooks": ["A hook is tested through a component that uses it, or through a renderer that provides one — there is no React context outside a render."],
    },
  },
  {
    technologies: ["Next.js 16+ — Routing, Rendering & Caching"],
    points: [
      "Turbopack is the default bundler for both `next dev` and `next build` in Next.js 16. A project with a custom `webpack` config fails the build on purpose rather than silently ignoring it; `--webpack` opts out.",
      "The `middleware` file convention is deprecated in favour of `proxy`. The upgrade codemod migrates it, and new code should be written against `proxy` from the start.",
      "Request data is async: `params`, `searchParams`, `cookies()`, `headers()` and `draftMode()` are awaited. Reading them synchronously is a compatibility path from 15, not the shape to write today.",
      "Cache Components — `use cache` and `cacheLife` in place of the `dynamic`, `revalidate` and `fetchCache` segment configs — is opt-in behind the `cacheComponents` flag in 16, so which caching model applies depends on that flag.",
      "A layout does not re-render on navigation between the routes it wraps. State held there survives the navigation, which is both the feature and the reason a layout is the wrong place for per-page data.",
    ],
    categories: {
      "Data & caching": ["Cache a value only where it is read; caching deep in a helper makes the lifetime invisible at the call site.", "A revalidation window is a promise about staleness, not freshness: a reader can always be served the previous value."],
      "Rendering": ["Streaming changes when content arrives, not how much work is done. A slow query stays slow — it just stops blocking the shell."],
      "Mutations": ["A Server Action is a public POST endpoint with a generated name. It must authorize every call itself; being unexported from a page proves nothing."],
      "Toolchain": ["`next lint` is gone in 16 — lint runs through the ESLint CLI directly."],
      "Performance": ["The bundle you ship is decided by the client boundary, not by the import graph you imagined. Check the analyzer before optimizing components."],
    },
  },
  {
    technologies: ["Next.js 16+ Hooks — App Router Navigation"],
    points: [
      "Navigation hooks are client-only. In a Server Component the equivalent data arrives as props — `params` and `searchParams` — because there is no render-time router to read.",
      "Reading the URL is how App Router state survives a refresh, a share or a back button. Keeping that state in a store instead makes those three cases silently diverge.",
      "`useSearchParams` makes a component depend on the request, so a page using it needs a Suspense boundary or it opts the route out of static rendering.",
      "`router.push` performs a client navigation that keeps React state; a full reload does not. Mixing the two produces bugs that only appear when a user arrives from a link.",
    ],
    categories: {
      "Mutations": ["`router.refresh()` re-fetches server data for the current route without losing client state — the pairing for a mutation that changed something the page displays."],
      "Rules and boundaries": ["A hook that reads the request must sit inside a boundary that can suspend, otherwise the whole route becomes dynamic."],
    },
  },
  {
    technologies: ["Next.js 16+ APIs — Directives, Functions, Hooks & Config"],
    points: [
      "File conventions are the API: a filename decides whether something is a page, a layout, a loading state or an error boundary. Renaming a file changes behaviour in a way no import statement records.",
      "The `unstable_` prefix is gone from APIs that stabilized in 16 — an import that still carries it is either removed or renamed.",
      "A directive (`'use client'`, `'use server'`, `use cache`) applies to the whole module and everything it pulls in, not to the line it sits on.",
      "Config in `next.config` is build-time, and Turbopack options moved to their own `turbopack` key in 16. A value read from the environment there is frozen at build, not at request.",
    ],
    categories: {
      "Caching APIs": ["Tag a cache entry when something else will need to invalidate it. Time-based revalidation alone cannot express 'when this record changes'."],
      "Request APIs": ["Every request API is awaited in 16, and calling one marks the route as request-dependent."],
      "Route segment config": ["`experimental_ppr` is removed from pages and layouts in 16; the codemod strips it."],
    },
  },
  {
    technologies: ["JavaScript (ECMAScript 2026) — Language & Runtime"],
    points: [
      "One thread runs your code, and the event loop decides what runs next. Every async surprise — a `setTimeout(0)` that lands after a promise, a handler that fires 'too late' — comes back to that queue order.",
      "`const` freezes the binding, not the value: the object it points at stays mutable. Deep immutability needs a copy or a structure that provides it.",
      "Equality has two levels and one trap: `===` does not coerce, `==` does, and `NaN !== NaN`. Comparison of objects is identity, never contents.",
      "A closure captures the variable, not its value at the time. This is what makes a counter work and what makes a loop-built list of callbacks all report the last item when declared with `var`.",
    ],
    categories: {
      "Async JavaScript": ["An `await` inside a loop serializes work that could have run together; `Promise.all` is the difference between one second and ten.", "A rejected promise nobody awaits is an unhandled rejection, which some runtimes treat as fatal."],
      "Shipping JavaScript": ["Modules are static: imports are resolved before execution, which is what makes tree shaking possible and why conditional imports need `import()`."],
      "Language core": ["`this` depends on how a function is called, except in arrow functions, which take it from where they were written."],
    },
  },
  {
    technologies: ["TypeScript 7 — Types, Compiler & Migration"],
    points: [
      "Types are erased at build. Every guarantee is compile-time only, so data entering from a network call, a form or `JSON.parse` needs a runtime check regardless of how it is typed.",
      "`any` disables checking for everything downstream of it; `unknown` keeps the value but forces a narrowing step. Preferring `unknown` at boundaries is the single highest-value habit in a codebase.",
      "`strict` is a set of flags, and most migration pain is `strictNullChecks` specifically. Turning it on file by file beats turning it off project-wide.",
      "Structural typing means a type matches by shape, not by name. Two unrelated interfaces with the same fields are interchangeable, which is convenient until an identifier is accidentally assignable to another.",
    ],
    categories: {
      "Configuration": ["Compiler defaults change with the target and the module setting, so a tsconfig copied between projects rarely means the same thing in both."],
      "Migration": ["A type assertion silences the compiler without changing the value. In a migration it is a note saying 'checked by hand', so it deserves the comment that explains why."],
      "Type manipulation": ["Conditional and mapped types are evaluated by the compiler on every check. A clever type can make an editor slow in a way no runtime profiler will show."],
      "JavaScript interop": ["Declaration files describe what a JavaScript module does; nothing verifies they are accurate, so a wrong `.d.ts` is worse than none."],
    },
  },
  {
    technologies: ["Node.js — Runtime, APIs, Streams & Operations"],
    points: [
      "One event loop serves every request. A synchronous CPU-bound call — a big `JSON.parse`, a sync crypto hash, a blocking file read — stalls every other connection in the process, which is why it belongs in a worker.",
      "Streams exist to bound memory. Reading a file or a response body into a string works until the file is large, and then it fails in production under load rather than in development.",
      "Backpressure is the part people skip: ignoring the return value of `write` turns a stream into an unbounded buffer, and `pipeline` handles both that and error propagation.",
      "An unhandled rejection or an uncaught exception leaves the process in an unknown state. Log it and exit; let the supervisor restart you rather than continuing on a corrupted heap.",
    ],
    categories: {
      "Modules": ["ESM and CommonJS differ in resolution, in hoisting and in whether `require` works at all. The `type` field in package.json decides which one a `.js` file is."],
      "Performance": ["Async does not mean parallel. Ten awaited calls in a row still take the sum of their latencies."],
      "Operations": ["Graceful shutdown means stop accepting connections, finish in-flight work, then exit — in that order, with a timeout."],
      "Networking": ["The default HTTP agent limits sockets per host. An unexplained latency ceiling under load is often queueing there, not in the server you are calling."],
    },
  },
  {
    technologies: ["Node.js Packages — Modules, Libraries & Middleware"],
    points: [
      "A dependency you add runs with the same privileges as your code. The realistic questions are how many transitive packages it brings, how recently it was published, and what happens if it stops being maintained.",
      "The standard library covers more than it used to — a test runner, a watch mode, fetch, structured cloning — so reach for a package after checking whether Node already ships it.",
      "Middleware order is program order. An auth check registered after a route handler protects nothing, and this reads as a security bug, not a style problem.",
      "Semantic-version ranges mean a fresh install can differ from yesterday's. The lockfile is what makes a build reproducible, so it belongs in the repository and in review.",
    ],
    categories: {
      "Crypto & security": ["Compare secrets with a timing-safe function and never with `===`; a plain comparison leaks length and prefix information."],
      "Streams & buffers": ["A Buffer is raw bytes. Converting to a string without naming the encoding is a bug waiting for a non-ASCII input."],
      "Testing & diagnostics": ["Node's built-in test runner covers most of what a small project needs, with no configuration to maintain."],
    },
  },
  {
    technologies: ["Nest.js — APIs, Architecture, Security & Testing"],
    points: [
      "Everything is wired by dependency injection, so a class declares what it needs and the container supplies it. Tests substitute a provider instead of monkey-patching an import.",
      "The request pipeline has a fixed order — middleware, guards, interceptors, pipes, handler, then filters on the way out. Choosing the wrong layer is the usual cause of a rule that 'does not run'.",
      "A module's `providers` are private until exported. Most 'cannot resolve dependency' errors are a missing `exports`, not a missing `@Injectable()`.",
      "Validation belongs in a pipe with a DTO class, applied globally. Hand-checking request bodies in controllers drifts out of sync with the types the controller claims.",
    ],
    categories: {
      "Security": ["A guard returning `false` produces a 403, which is a different statement from 401. Say which one you mean."],
      "Testing": ["The testing module builds a real container with fakes in it, so a test can assert on wiring instead of only on a single class."],
      "Operations": ["Provider scopes change lifetime: a request-scoped provider is constructed per request, and injecting it into a singleton quietly widens that lifetime."],
    },
  },
  {
    technologies: ["Nest.js Packages — Decorators, Providers & Modules"],
    points: [
      "A decorator is metadata the framework reads at startup, not code that runs at the call site. That is why a decorator applied conditionally does not behave conditionally.",
      "Custom decorators compose: a parameter decorator that extracts the current user keeps controllers free of request plumbing and keeps the extraction testable in one place.",
      "Dynamic modules (`forRoot`, `forRootAsync`) exist so configuration is passed in rather than read from the environment deep inside a library.",
      "Class-based providers are singletons by default. Shared mutable state on a provider is shared across every request in the process.",
    ],
  },
  {
    technologies: ["GraphQL — Schema, Servers, Clients & Tooling"],
    points: [
      "The schema is the contract, and it is the one artifact both sides can verify against. Anything not in the schema does not exist, whatever the resolver returns.",
      "A resolver runs per field, which is why the naive implementation issues one query per item. Batching with a loader is not an optimization here; it is the baseline.",
      "GraphQL has no HTTP status semantics: a 200 can carry errors, and partial data with errors is a normal response. Clients must read `errors`, not just `data`.",
      "Every field is reachable by any client, so depth limits, complexity limits and per-field authorization are the security model. Hiding a field from your UI hides nothing.",
    ],
    categories: {
      "Security & performance": ["An unbounded nested query is a denial-of-service vector by design. Cap depth and cost before opening the endpoint."],
      "Code generation": ["Generated types are only as true as the schema they were generated from, so regeneration belongs in CI, not in a developer's memory."],
      "Federation & gateway": ["A federated graph moves the coupling from code to schema ownership: entity keys become a cross-team contract."],
    },
  },
  {
    technologies: ["Python Packages — Standard Library & Ecosystem", "Python"],
    points: [
      "The standard library is the first place to look, and it is unusually deep: paths, dates, JSON, CSV, subprocesses, threads, testing and typing all ship with the interpreter.",
      "A mutable default argument is created once, at definition time, and shared by every call. `def f(items=[])` accumulating across calls is the classic Python bug.",
      "Assignment binds a name to an object; it never copies. Two names can reach the same list, so a 'copy' that is not `copy()` or a slice is not a copy.",
      "The GIL means threads help with I/O waiting and not with CPU work; processes or native extensions are the answer for computation.",
      "Virtual environments are not optional hygiene — they are how a project pins what it runs against, which is the difference between reproducible and 'works on my machine'.",
    ],
    categories: {
      "Concurrency & async": ["`async` code is cooperative: one blocking call inside a coroutine stalls the whole loop, so blocking work goes to an executor."],
      "Testing & typing": ["Type hints are not enforced at runtime. A checker reads them; the interpreter ignores them."],
      "Files & paths": ["`pathlib` handles separators, and text mode without an explicit encoding takes the platform default — the reason a file reads fine locally and fails in a container."],
      "Data formats": ["`pickle` executes code on load. Never unpickle data you did not produce."],
    },
  },
];
