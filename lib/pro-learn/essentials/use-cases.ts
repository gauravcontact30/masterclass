import type { TopicUseCase } from "./types";

/**
 * What each technology, and each area inside it, is actually used for.
 *
 * A catalogue row says what a topic *is*. This says why anyone reaches for it:
 * the situation a working developer recognises, and the problem that would be
 * theirs to solve by hand without it. A card shows the narrowest entry that
 * matches — the row's own authored use case first, then its category's, then
 * the technology's — so no card is left saying only where it sits.
 *
 * Written as one situation and one consequence. A line that could be pasted
 * under any other topic is not a use case and does not belong here.
 */
export type TechnologyUseCases = {
  /** Handbook titles and catalogue names these belong to, matched exactly. */
  technologies: string[];
  /** The leading real use for the whole technology. */
  useCase: TopicUseCase;
  /**
   * Further real uses for the whole technology.
   *
   * A card lists its uses rather than naming one, so a technology whose
   * categories are not separately written up still gives a reader two
   * situations to recognise instead of one.
   */
  alsoUsedFor?: TopicUseCase[];
  categoryUseCases?: Record<string, TopicUseCase>;
};

export const USE_CASES: TechnologyUseCases[] = [
  {
    technologies: ["React 19+ — Components, Actions & Server UI"],
    useCase: { title: "Interfaces that change while people use them", scenario: "Screens whose contents depend on live data and user choices — a dashboard, a checkout, an inbox — where hand-written DOM updates drift out of step with the state they came from." },
    categoryUseCases: {
      "Foundations": { title: "Building a screen from reusable parts", scenario: "One card, row or field is written once and used in fifty places, so a design change lands in one file instead of fifty copies drifting apart." },
      "State & effects": { title: "Keeping the screen and the outside world in step", scenario: "A filter, a subscription or a timer has to survive re-renders and be torn down on unmount, or the app leaks listeners and shows results for a query the reader already changed." },
      "Actions & forms": { title: "Submitting a form without four state variables", scenario: "Every mutation needs pending, error, success and optimistic states; Actions supply them so a submit button cannot get stuck spinning after a failed request." },
      "Async UI": { title: "Loading and failing without blanking the page", scenario: "Slow data and thrown errors are contained to the part of the screen that owns them, so one failing panel does not take the whole route down." },
      "Server & client": { title: "Keeping data work off the browser", scenario: "Rendering a list of records on the server ships markup instead of a query library plus the records, which is what keeps a content-heavy page fast on a phone." },
      "Performance": { title: "A list that stays responsive while typing", scenario: "A large table or search result re-renders on every keystroke; the work here is deciding what may be skipped so typing does not stutter." },
      "Modern React": { title: "Adopting what replaced the old workarounds", scenario: "Patterns that used to need a library or a wrapper — forwarding refs, setting document metadata, coordinating stylesheets — are now part of React, so the workaround can be deleted." },
    },
  },
  {
    technologies: ["React 19+ Hooks — State, Effects & Actions"],
    useCase: { title: "Giving a component memory and behaviour", scenario: "A function component has no instance of its own, so anything that must survive a re-render — a value, a subscription, a DOM node — needs a Hook to hold it." },
    categoryUseCases: {
      "Rules and foundations": { title: "Keeping Hooks callable in the same order", scenario: "A Hook behind an `if` breaks the order React relies on, which is the bug behind 'rendered fewer hooks than expected' after a refactor." },
      "State hooks": { title: "Remembering what the reader has done", scenario: "A selected tab, a draft, a toggled row — state that belongs to one screen and should not be pushed into a global store or the URL." },
      "Effect hooks": { title: "Talking to something that is not React", scenario: "A WebSocket, a map widget, an event listener or an analytics call needs setting up and tearing down in step with the component that owns it." },
      "Ref hooks": { title: "Focusing an input or measuring a node", scenario: "Some work is imperative — focus, scroll position, a canvas — and needs a stable handle to the DOM that does not trigger a re-render when it changes." },
      "Context hooks": { title: "Passing the theme, user or locale down", scenario: "A value needed at ten levels of depth would otherwise be threaded through every component in between, including the ones that do not use it." },
      "Action hooks": { title: "Wiring a form to a server mutation", scenario: "Submit, pending, failure and optimistic display come from one Hook instead of four state variables that must be kept in sync by hand." },
      "Concurrency hooks": { title: "Keeping input responsive during heavy work", scenario: "Marking a filter or navigation as non-urgent lets keystrokes render first, which is the difference between a laggy search box and a smooth one." },
      "Async hooks": { title: "Reading a promise inside render", scenario: "Data that arrives later is read where it is used, and the loading state comes from a Suspense boundary instead of a hand-written `isLoading` flag." },
      "External store hooks": { title: "Subscribing to a store outside React", scenario: "A Redux-like store, a browser API or a third-party cache can be read safely during concurrent rendering without tearing." },
      "Utility hooks": { title: "Generating ids that match on the server", scenario: "Linking a label to an input needs an id that is identical in the server render and the client render, or hydration warns and accessibility breaks." },
      "Performance hooks": { title: "Skipping work that would repeat", scenario: "An expensive calculation or a callback passed to a memoized child is kept stable so a parent's re-render does not cascade into the whole subtree." },
      "Testing Hooks": { title: "Proving a Hook behaves before it ships", scenario: "Hook logic tested through a component catches the dependency and cleanup mistakes that only show as leaks in production." },
      "Hook patterns": { title: "Naming a behaviour so it can be reused", scenario: "Fetching, debouncing or media-query logic repeated in five components becomes one custom Hook with one set of bugs to fix." },
    },
  },
  {
    technologies: ["Next.js 16+ — Routing, Rendering & Caching"],
    useCase: { title: "Shipping a React app that is fast on first load", scenario: "Routing, data loading, caching and deployment come as one system, so a team is not assembling a router, a bundler and a rendering strategy before writing the first page." },
    categoryUseCases: {
      "Routing": { title: "Turning a folder into a site map", scenario: "URLs, shared layouts and nested sections come from the file system, so adding a page does not mean editing a central route table that everyone conflicts on." },
      "Rendering": { title: "Choosing what is built when", scenario: "A marketing page can be static and a dashboard dynamic in the same app, which is how one codebase serves both without paying for the slowest option everywhere." },
      "Data & caching": { title: "Not re-fetching what has not changed", scenario: "A product page hit a thousand times a minute should not run a thousand database queries; caching and revalidation decide how stale is too stale." },
      "Mutations": { title: "Writing data without a separate API layer", scenario: "A form posts to a server function and the affected pages refresh, instead of a hand-written endpoint plus client fetch plus manual cache invalidation." },
      "Request handling": { title: "Reading cookies, headers and the URL safely", scenario: "Auth checks and locale decisions need request data on the server, and reading it wrongly is what silently opts a whole route out of caching." },
      "Toolchain": { title: "Keeping builds quick as the app grows", scenario: "Compilation, bundling and dev-server reloads are what a team waits on fifty times a day; this is where that wait is spent or saved." },
      "Performance": { title: "Passing Core Web Vitals on real phones", scenario: "Images, fonts and scripts are the usual cause of a slow page; the tooling here is what keeps layout shift and main-thread work down." },
      "API routes": { title: "Serving webhooks and third-party callbacks", scenario: "Payment and auth providers need a plain HTTP endpoint in the same deployment as the app, sharing its environment and its database access." },
      "Navigation": { title: "Moving between pages without a reload", scenario: "Prefetching and client transitions keep scroll position and state while the next route's data is already on its way." },
    },
  },
  {
    technologies: ["Next.js 16+ Hooks — App Router Navigation"],
    useCase: { title: "Reacting to the URL from a component", scenario: "Filters, tabs and pagination live in the address bar so they survive a reload and can be shared as a link; these Hooks are how a component reads and changes that." },
    categoryUseCases: {
      "URL hooks": { title: "Driving a filtered list from the address bar", scenario: "Search terms and filters kept in the URL make results shareable and back-button-correct, instead of vanishing on refresh." },
      "Navigation hooks": { title: "Redirecting after a successful action", scenario: "A save, a sign-in or a delete has to send the reader somewhere and refresh what changed, without a full page load." },
      "Layout hooks": { title: "Knowing which section is open", scenario: "A sidebar or breadcrumb needs to know where in the nested layout the reader is, including inside parallel routes." },
      "Observability hooks": { title: "Reporting real user performance", scenario: "Web Vitals from real sessions are what show a regression that a local Lighthouse run never reproduces." },
      "Connectivity hooks": { title: "Behaving sensibly offline", scenario: "A form on a train should say the connection dropped and keep the draft rather than failing silently on submit." },
      "Rules and boundaries": { title: "Keeping server-only work off the client", scenario: "Calling a client Hook in a Server Component is a build error, and the rules here are what keep the boundary deliberate." },
      "Mutations": { title: "Refreshing the page after writing data", scenario: "After a server action the stale route has to be revalidated, or the reader sees the list they just edited unchanged." },
      "Hook patterns": { title: "Composing navigation logic once", scenario: "Read-the-query-then-replace-it logic repeated across pages becomes one Hook, so the debounce and the history behaviour match everywhere." },
    },
  },
  {
    technologies: ["JavaScript (ECMAScript 2026) — Language & Runtime"],
    useCase: { title: "The language every web codebase is written in", scenario: "Whatever framework sits on top, the bugs that reach production come from how values, scope, equality and asynchrony actually behave." },
    categoryUseCases: {
      "Foundations": { title: "Structuring a codebase into modules", scenario: "Imports and scope decide what can be shared and what stays private, which is what stops a project becoming one file everything reaches into." },
      "Language core": { title: "Getting comparisons and objects right", scenario: "Coercion, identity and prototypes are behind the classic production bug where two equal-looking values fail to match." },
      "Async JavaScript": { title: "Doing several things without blocking", scenario: "Fetching, timers and streams share one thread, so understanding the queue is what separates a responsive page from a frozen one." },
      "ES2026 additions": { title: "Replacing a utility library with the platform", scenario: "Set operations, base64 conversion and safe regex escaping now ship in the runtime, so a dependency can be dropped." },
      "Shipping JavaScript": { title: "Supporting the browsers you actually have", scenario: "Feature detection and module format decide whether the code runs on a three-year-old phone or throws on load." },
      "Array methods": { title: "Reshaping data between the API and the screen", scenario: "Server rows are rarely the shape a component wants; these are the transforms that get them there without mutating what was fetched." },
      "String methods": { title: "Cleaning and formatting user text", scenario: "Names, emails and pasted content arrive with whitespace, accents and case that break comparison and display until they are normalized." },
      "Object & JSON": { title: "Moving state across a boundary", scenario: "Anything stored, sent or cloned passes through serialization, and knowing what it drops is what prevents a Date arriving as a string." },
      "Promise API": { title: "Coordinating several requests", scenario: "A page needs three calls at once, a timeout on a slow one and a sensible result when a single call fails." },
    },
  },
  {
    technologies: ["TypeScript 7 — Types, Compiler & Migration"],
    useCase: { title: "Catching the bug before the test does", scenario: "Renamed fields, missing null checks and wrong arguments are found while typing rather than in review, which is most of what static types buy a team." },
    categoryUseCases: {
      "Compiler": { title: "Keeping typecheck fast in a large repo", scenario: "A typecheck that takes four minutes stops being run before pushing, so build configuration is a workflow decision, not a detail." },
      "Type system": { title: "Modelling the data you really receive", scenario: "An API field that is sometimes absent should be a union the compiler makes you handle, not an optimistic `any` that crashes at runtime." },
      "Type manipulation": { title: "Deriving types instead of duplicating them", scenario: "Form, API and database shapes drift apart when written three times; derived types make one the source and the rest follow." },
      "Configuration": { title: "Deciding how strict the codebase is", scenario: "Each strict flag turns a class of runtime failure into a compile error, and turning them on is a migration plan, not a switch." },
      "JavaScript interop": { title: "Using a library with no types of its own", scenario: "Declaration files and module augmentation let a plain JavaScript dependency be consumed without giving up checking at the call site." },
      "Migration": { title: "Moving a JavaScript project across gradually", scenario: "A codebase cannot stop shipping to be converted, so the work is file by file with the escape hatches shrinking over time." },
    },
  },
  {
    technologies: ["Python"],
    useCase: { title: "Scripting, data work and backend services", scenario: "The language reached for when the job is automation, analysis or an API, and readability matters more than raw speed." },
    categoryUseCases: {
      "Language basics": { title: "Writing a script someone else can read", scenario: "Names, values and formatting decide whether a one-off script survives being handed to a colleague." },
      "Collections": { title: "Choosing the structure for the lookup", scenario: "A list scan where a dict lookup belongs is the difference between a report that runs in a second and one that runs in a minute." },
      "Control flow": { title: "Handling every branch of the data", scenario: "Real input has empty cases and odd rows; the branching decides whether they are handled or crash the run." },
      "Functions": { title: "Naming a step so it can be tested", scenario: "A hundred-line script becomes a few named functions, which is what makes any part of it testable in isolation." },
      "Objects & classes": { title: "Modelling a domain with behaviour", scenario: "When data and the rules about it travel together — an order, a document — a class keeps them from drifting apart." },
      "Errors & testing": { title: "Failing loudly and proving it works", scenario: "A nightly job that swallows an exception reports success while producing nothing; explicit errors and tests are what surface that." },
      "Files & data": { title: "Reading the CSV, JSON or path correctly", scenario: "Encoding, newline and path handling are where scripts break when they move from a laptop to a server." },
      "Typing": { title: "Making a large Python codebase navigable", scenario: "Type hints let an editor and a checker answer what a function returns without reading its body." },
      "Async & concurrency": { title: "Waiting on many network calls at once", scenario: "A job fetching a thousand URLs sequentially takes hours; concurrency turns that into minutes without threads everywhere." },
      "Modules & packaging": { title: "Shipping code someone can install", scenario: "An importable, versioned package is what turns a shared folder of scripts into something a team can depend on." },
      "Standard library": { title: "Solving it without a dependency", scenario: "Dates, paths, hashing and CSV are already in the runtime, and each dependency avoided is one fewer to keep patched." },
      "Data & scientific": { title: "Analysing a dataset that will not fit in a spreadsheet", scenario: "Millions of rows need vectorised operations and memory awareness rather than a loop over the file." },
    },
  },
  {
    technologies: ["AWS"],
    useCase: { title: "Running a product without owning the hardware", scenario: "Compute, storage, networking and identity are rented per hour, so a service can start on one instance and grow without a data-centre purchase." },
    categoryUseCases: {
      "Core AWS Services": { title: "The base every architecture starts from", scenario: "Compute, storage and networking are chosen first; the rest of the design is constrained by what they can and cannot do." },
      "Storage & Backup": { title: "Keeping files that must not be lost", scenario: "User uploads, exports and backups need durability, lifecycle rules and a way to recover a file deleted by mistake." },
      "Databases": { title: "Choosing where the records live", scenario: "Relational, key-value and cache each fail differently under load, and the choice decides what an outage looks like." },
      "Security & Identity": { title: "Giving each service only what it needs", scenario: "Broad permissions are how one compromised component becomes a full breach; least privilege is enforced here." },
      "Networking & Edge": { title: "Getting traffic to the right place quickly", scenario: "Routing, DNS and edge caching decide both latency for a distant user and what is reachable from the public internet." },
      "Monitoring & Reliability": { title: "Knowing it broke before customers say so", scenario: "Metrics, logs and alarms are the difference between a five-minute incident and one reported on social media." },
      "DevOps & CI/CD": { title: "Shipping a change without a manual release", scenario: "Build, test and deploy run as a pipeline, so a rollback is a button rather than a scramble." },
      "Messaging & Integration": { title: "Letting services fail independently", scenario: "A queue between two services means the slow one does not take the fast one down with it." },
      "AI & Machine Learning": { title: "Adding a model without training one", scenario: "Transcription, extraction and generation are available as managed calls, which is usually cheaper than building the pipeline." },
      "Analytics & Data Engineering": { title: "Answering questions over collected data", scenario: "Event and log data become reports and dashboards without loading everything into the production database." },
      "Containers": { title: "Running the same image everywhere", scenario: "A container that ran locally runs in staging and production, which removes the environment from the list of suspects." },
      "Cost & Billing": { title: "Finding what the bill is actually for", scenario: "Cloud spend grows quietly; tagging and budgets are what make a surprise invoice explainable." },
    },
  },
  {
    technologies: ["AI terms"],
    useCase: { title: "Talking about a model build precisely", scenario: "Design and review conversations turn on these words; using them loosely is how teams agree on a plan and then build different things." },
    categoryUseCases: {
      "Model foundations": { title: "Knowing what the model actually does", scenario: "Cost, latency and failure modes all follow from tokens, context and sampling rather than from the product idea." },
      "Prompting & control": { title: "Getting a usable answer every time", scenario: "A prompt that works once and fails on the tenth input is the normal starting point; control is what makes output dependable enough to parse." },
      "Training & alignment": { title: "Understanding why a model refuses or drifts", scenario: "Behaviour comes from how it was trained, which is what decides whether a problem is fixable by prompting at all." },
      "Retrieval & memory": { title: "Answering from your own documents", scenario: "A model that has never seen your handbook must be given the passage, or it will produce something plausible and wrong." },
      "Agents & tools": { title: "Letting a model take actions", scenario: "Calling an API or writing a file turns a chat into a system, and turns a wrong answer into a wrong action." },
      "Building with AI": { title: "Putting a feature in front of users", scenario: "Streaming, evaluation, caching and fallbacks are what separate a demo from something that can take real traffic." },
      "Practice & perspective": { title: "Deciding whether to use a model at all", scenario: "Some problems are cheaper and more reliable as ordinary code, and knowing which is the judgement being tested." },
    },
  },

  // Every remaining handbook, written at the technology's own level: one
  // leading use and one more, so a card in a catalogue whose categories are
  // not separately written up still shows two real situations rather than
  // an empty block.
  {
    technologies: ["Modern Full-Stack Technologies — Tools, Data & Infrastructure"],
    useCase: { title: "Choosing the stack before writing the app", scenario: "Auth, data, payments, jobs and hosting are decided once and lived with for years, and the cost of a wrong pick is a rewrite rather than a refactor." },
    alsoUsedFor: [
      { title: "Reading a codebase you did not write", scenario: "Recognising what each dependency is for is what turns an unfamiliar repository into one you can change on the first day." },
    ],
  },
  {
    technologies: ["uv package manager"],
    useCase: { title: "Making a Python project run the same everywhere", scenario: "A resolved lockfile turns “works on my machine” into a checkout, one command and a running project." },
    alsoUsedFor: [
      { title: "Replacing a stack of Python tooling", scenario: "Environment creation, resolution, installs and tool runs come from one binary instead of pyenv, pip-tools, pipx and virtualenv kept in step by hand." },
    ],
  },
  {
    technologies: ["Redis caching solutions"],
    useCase: { title: "Taking repeated reads off the database", scenario: "The same query answered a thousand times a second is served from memory, which is what keeps a launch from taking the database down." },
    alsoUsedFor: [
      { title: "Coordinating work between servers", scenario: "Locks, counters, queues and pub/sub need one place every instance agrees on, which is the job an in-process cache cannot do." },
    ],
  },
  {
    technologies: ["Zod validation libraries"],
    useCase: { title: "Trusting data that came from outside", scenario: "Form input, query strings, webhooks and third-party responses are parsed into known shapes at the boundary rather than hoped about downstream." },
    alsoUsedFor: [
      { title: "Keeping types and checks in one place", scenario: "One schema gives both the runtime check and the TypeScript type, so the two cannot drift apart as the shape changes." },
    ],
  },
  {
    technologies: ["Zustand"],
    useCase: { title: "Sharing state without wrapping the app", scenario: "A value several screens need lives in a store any component can read, with no provider tree and no re-render of everything that consumes it." },
    alsoUsedFor: [
      { title: "Reading app state from outside React", scenario: "A worker, an animation loop or an event handler can read and set the same store the components use." },
    ],
  },
  {
    technologies: ["Redux"],
    useCase: { title: "Making state changes inspectable", scenario: "Every change is a named action in a log, which is what lets a bug be replayed instead of described." },
    alsoUsedFor: [
      { title: "Agreeing one way to change shared state", scenario: "A large team needs a single pattern, or each feature invents its own and the app becomes several apps." },
    ],
  },
  {
    technologies: ["Redux Toolkit"],
    useCase: { title: "Writing Redux without the boilerplate", scenario: "Slices, immutable updates and the store setup come configured, so a feature is a reducer rather than four files." },
    alsoUsedFor: [
      { title: "Fetching and caching server data", scenario: "RTK Query turns endpoints into hooks with caching, invalidation and loading state, replacing hand-written thunks per request." },
    ],
  },
  {
    technologies: ["TanStack Query"],
    useCase: { title: "Keeping server data fresh on screen", scenario: "Caching, background refetch, retries and invalidation are the work behind every list and detail view, and they are the same work every time." },
    alsoUsedFor: [
      { title: "Removing loading flags from components", scenario: "Pending, error and success come from the query rather than from state variables that get out of step with the request." },
    ],
  },
  {
    technologies: ["TanStack Form"],
    useCase: { title: "Building a form that is not a pile of state", scenario: "Values, touched fields, errors and submission are managed as one thing, so a long form does not become twenty separate state variables." },
    alsoUsedFor: [
      { title: "Validating with the schema you already have", scenario: "The same schema validates on the field, on submit and on the server, rather than three checks written separately." },
    ],
  },
  {
    technologies: ["TanStack Table"],
    useCase: { title: "Turning rows into a real data grid", scenario: "Sorting, filtering, grouping, pagination and column visibility are expected of any internal tool and are weeks of work to write by hand." },
    alsoUsedFor: [
      { title: "Keeping the markup yours", scenario: "The table supplies the behaviour and none of the DOM, so a grid matches the product's design instead of a vendor's." },
    ],
  },
  {
    technologies: ["TanStack Router"],
    useCase: { title: "Putting screen state in the URL safely", scenario: "Filters, tabs and pagination belong in the address bar, and typed search parameters make them refactorable rather than stringly-typed." },
    alsoUsedFor: [
      { title: "Loading data before the screen paints", scenario: "Route loaders fetch on navigation, so a page arrives with its data instead of mounting empty and then fetching." },
    ],
  },
  {
    technologies: ["TanStack Start"],
    useCase: { title: "Running the router on a server", scenario: "Server rendering, server functions and streaming are added to an app already built on the router, without moving to a different framework." },
    alsoUsedFor: [
      { title: "Mutating data without an API layer", scenario: "A server function is called like an ordinary function from the client, so a small app does not need a REST surface to change one row." },
    ],
  },
  {
    technologies: ["TanStack Virtual"],
    useCase: { title: "Rendering a list of fifty thousand rows", scenario: "Only the visible window is in the DOM, which is the difference between a scroll that stutters and one that does not." },
    alsoUsedFor: [
      { title: "Virtualizing content of unknown height", scenario: "Chat messages, comments and cards vary in size, and measuring them as they appear is what keeps the scrollbar honest." },
    ],
  },
  {
    technologies: ["Prisma"],
    useCase: { title: "Querying a database with types that match it", scenario: "The schema generates the client, so a renamed column is a compile error rather than a runtime one." },
    alsoUsedFor: [
      { title: "Changing a schema safely in production", scenario: "Migrations are generated, reviewed and applied in order, which is what makes a schema change a pull request rather than an event." },
    ],
  },
  {
    technologies: ["Drizzle ORM"],
    useCase: { title: "Writing SQL you can still read", scenario: "Queries stay close to SQL while staying typed, so a complex join is tuned in place instead of fought through an abstraction." },
    alsoUsedFor: [
      { title: "Running on a serverless runtime", scenario: "A small client with no engine to start is what makes per-request database access affordable on an edge or serverless deploy." },
    ],
  },
  {
    technologies: ["Neon"],
    useCase: { title: "Giving every branch its own database", scenario: "A copy-on-write branch gives a pull request real data in seconds, instead of a shared staging database that one migration breaks for everyone." },
    alsoUsedFor: [
      { title: "Paying nothing for an idle project", scenario: "Compute suspends when no one is connected, which is what makes a demo, a side project or a preview environment cheap to keep alive." },
    ],
  },
  {
    technologies: ["Upstash"],
    useCase: { title: "Using Redis from a serverless function", scenario: "An HTTP API removes the connection pool a short-lived function cannot keep, which is what makes caching work on serverless at all." },
    alsoUsedFor: [
      { title: "Rate limiting without running a server", scenario: "Counters shared across every region come from a managed store rather than a Redis instance someone has to operate." },
    ],
  },
  {
    technologies: ["Authentication with Auth.js & Kinde Auth"],
    useCase: { title: "Letting people sign in with an account they have", scenario: "Social and email providers are configured rather than implemented, which removes the password storage and reset flows nobody wants to own." },
    alsoUsedFor: [
      { title: "Deciding what a signed-in user may do", scenario: "Sessions, tokens and callbacks are where authorization is actually enforced, and getting them wrong is the common security bug in an app." },
    ],
  },
  {
    technologies: ["BetterAuth"],
    useCase: { title: "Owning your users without writing auth", scenario: "Sessions, accounts and providers run in your own database and codebase, so there is no user directory in a vendor you cannot query." },
    alsoUsedFor: [
      { title: "Adding organizations and multi-tenancy", scenario: "Teams, invitations and per-organization access arrive as plugins rather than as a schema redesign months in." },
    ],
  },
  {
    technologies: ["Clerk user management"],
    useCase: { title: "Shipping sign-in on the first day", scenario: "Hosted components, sessions and a user database cover what would otherwise be the first sprint of any product." },
    alsoUsedFor: [
      { title: "Selling to companies rather than to people", scenario: "Organizations, roles, invitations and single sign-on are what an enterprise buyer asks for before a contract." },
    ],
  },
  {
    technologies: ["Terraform"],
    useCase: { title: "Describing infrastructure as reviewable code", scenario: "A plan shows exactly what will change before anything does, which is what makes an infrastructure change a pull request rather than a console click." },
    alsoUsedFor: [
      { title: "Rebuilding an environment from nothing", scenario: "Staging, production and a recovery region come from the same configuration, so they cannot quietly differ." },
    ],
  },
  {
    technologies: ["Kubernetes"],
    useCase: { title: "Keeping a service running without anyone watching", scenario: "Declared desired state is restored after a crash, a node failure or a bad deploy, instead of by a person restarting a process." },
    alsoUsedFor: [
      { title: "Running many services on shared hardware", scenario: "Scheduling, limits and namespaces let dozens of teams share a cluster without one workload starving another." },
    ],
  },
  {
    technologies: ["GitHub Actions"],
    useCase: { title: "Running the same checks on every change", scenario: "Tests, types, lint and build run identically for everyone, which is what makes a green pull request mean something." },
    alsoUsedFor: [
      { title: "Deploying without a person in the loop", scenario: "A merge produces a release, with approvals and environment secrets held by the pipeline rather than by whoever is on call." },
    ],
  },
  {
    technologies: ["Webhook"],
    useCase: { title: "Reacting to something that happened elsewhere", scenario: "A payment, a commit or a form submission reaches your system as it happens, rather than being discovered by polling minutes later." },
    alsoUsedFor: [
      { title: "Surviving a delivery that arrives twice", scenario: "Providers retry, reorder and duplicate, so verification and idempotency are what stand between a webhook and a double charge." },
    ],
  },
  {
    technologies: ["Inngest services"],
    useCase: { title: "Running work that outlives the request", scenario: "Emails, exports, syncs and retries continue after the response is sent, without a queue and a worker fleet to operate." },
    alsoUsedFor: [
      { title: "Writing a multi-day workflow as one function", scenario: "Onboarding sequences, trial reminders and dunning are steps with waits between them, and each step is retried and resumed on its own." },
    ],
  },
  {
    technologies: ["Arcjet"],
    useCase: { title: "Stopping abuse at the route that suffers it", scenario: "Rate limits, bot detection and signup protection sit next to the handler, where the application knows who the user is and what they asked for." },
    alsoUsedFor: [
      { title: "Keeping signup and login honest", scenario: "Fake accounts, credential stuffing and scripted form posts cost real money per attempt until they are refused before the work is done." },
    ],
  },
  {
    technologies: ["Payment gateway integration"],
    useCase: { title: "Taking money without losing track of it", scenario: "Authorization, capture, refund and dispute are distinct states, and treating payment as one call is how a business loses reconciliation." },
    alsoUsedFor: [
      { title: "Staying correct when the network is not", scenario: "Retries, timeouts and out-of-order webhooks are normal, so idempotency keys and a webhook-driven source of truth are the design rather than a detail." },
    ],
  },
  {
    technologies: ["Conform - Validation libraries"],
    useCase: { title: "Making a form work before JavaScript loads", scenario: "Progressive enhancement means a submitted form is handled by the server, which is what keeps a slow connection from being a broken page." },
    alsoUsedFor: [
      { title: "Validating the same rules on both sides", scenario: "One schema drives the browser check and the server check, so a client-side pass cannot let an invalid record through." },
    ],
  },
  {
    technologies: ["T3 environment"],
    useCase: { title: "Failing at build time instead of at runtime", scenario: "A missing or misspelled variable stops the build rather than reaching production and failing on the first request that needs it." },
    alsoUsedFor: [
      { title: "Keeping secrets out of the browser bundle", scenario: "Server-only variables are separated from public ones by type, so leaking a key becomes a compile error." },
    ],
  },
  {
    technologies: ["System Design"],
    useCase: { title: "Deciding how a system should be shaped", scenario: "Storage, caching, queues and consistency are chosen deliberately before traffic arrives, because they are the decisions that are expensive to reverse." },
    alsoUsedFor: [
      { title: "Passing the interview that gates senior roles", scenario: "The design round is conducted in this vocabulary, and real experience is only credited when it can be expressed in it." },
    ],
  },
  {
    technologies: ["Playwright Automation — Browser Testing & Debugging"],
    useCase: { title: "Proving a real user journey still works", scenario: "Sign in, search, add to basket, pay: the flows that matter cross pages and services, and only a browser can check them end to end." },
    alsoUsedFor: [
      { title: "Finding out why a test failed", scenario: "Traces, videos and the inspector show the run rather than a stack trace, which is what makes a flaky failure diagnosable." },
    ],
  },
  {
    technologies: ["Playwright — API, Locators, Fixtures & Tooling"],
    useCase: { title: "Writing a test that does not go flaky", scenario: "Locators that wait for the element and assertions that retry remove the sleeps that make a suite untrustworthy." },
    alsoUsedFor: [
      { title: "Testing a page without its backend", scenario: "Network interception returns known responses, so a test covers the edge case the real API will not produce on demand." },
    ],
  },
  {
    technologies: ["Jest — Unit Testing, Mocks & Coverage"],
    useCase: { title: "Proving logic without running the app", scenario: "Pricing, permissions and parsing are checked in milliseconds, which is what lets them be checked on every save." },
    alsoUsedFor: [
      { title: "Isolating the code under test", scenario: "Mocks and fake timers cut the network, the clock and the filesystem out, so a failure means the logic is wrong rather than the environment." },
    ],
  },
  {
    technologies: ["Vitest — Fast Unit Testing & Mocks"],
    useCase: { title: "Testing a modern project without a second build", scenario: "The test runner uses the same transform pipeline as the app, so TypeScript, aliases and ESM work with no parallel configuration." },
    alsoUsedFor: [
      { title: "Getting a result while you are still typing", scenario: "Watch mode that reruns only what changed is what keeps tests part of writing code rather than a step before a commit." },
    ],
  },
  {
    technologies: ["React Testing Library — User-Centered UI Tests"],
    useCase: { title: "Testing what the user can actually do", scenario: "Queries by role, label and text fail when a screen stops being usable, which an implementation test passes through." },
    alsoUsedFor: [
      { title: "Refactoring without rewriting the tests", scenario: "A test that never names a component or a class survives the redesign that changes both." },
    ],
  },
  {
    technologies: ["Cypress — End-to-End Testing & Network Control"],
    useCase: { title: "Watching a flow run and fail in a real browser", scenario: "The time-travelling runner shows the application at each step, which turns a failed journey into an obvious cause." },
    alsoUsedFor: [
      { title: "Controlling what the backend returns", scenario: "Stubbing requests makes error states, slow responses and empty results testable without a backend built to produce them." },
    ],
  },
  {
    technologies: ["Node.js — Runtime, APIs, Streams & Operations"],
    useCase: { title: "Serving many connections from one process", scenario: "An event loop holds thousands of open sockets, which is what suits APIs, proxies and realtime services." },
    alsoUsedFor: [
      { title: "Handling data too large to hold in memory", scenario: "Uploads, exports and logs are streamed through, so file size stops being what decides whether the process survives." },
    ],
  },
  {
    technologies: ["Nest.js — APIs, Architecture, Security & Testing"],
    useCase: { title: "Giving a backend a structure the team agrees on", scenario: "Modules, providers and controllers put the same thing in the same place in every service, which is what makes one readable by another team." },
    alsoUsedFor: [
      { title: "Applying validation and auth in one place", scenario: "Pipes, guards, interceptors and filters handle what every route needs, rather than the same four lines at the top of each handler." },
    ],
  },
  {
    technologies: ["Node.js Packages — Modules, Libraries & Middleware"],
    useCase: { title: "Knowing what to reach for before installing it", scenario: "Half of what a service needs is already in the runtime, and a dependency added for it is one more thing to patch forever." },
    alsoUsedFor: [
      { title: "Assembling a server from known parts", scenario: "Framework, middleware, database client and logger are choices with real trade-offs, and recognising them is what makes a stack deliberate." },
    ],
  },
  {
    technologies: ["Nest.js Packages — Decorators, Providers & Modules"],
    useCase: { title: "Wiring a feature into the framework properly", scenario: "The decorator or provider that exists for a job is shorter and safer than the custom code written because it was not known about." },
    alsoUsedFor: [
      { title: "Adding transport, data and realtime layers", scenario: "Microservices, GraphQL, WebSockets and ORMs arrive as first-party modules rather than as an integration each team writes once." },
    ],
  },
  {
    technologies: ["Next.js 16+ APIs — Directives, Functions, Hooks & Config"],
    useCase: { title: "Looking up what a framework API actually does", scenario: "Config keys, file conventions and server functions have exact behaviour, and guessing is what produces a build that works locally and not in production." },
    alsoUsedFor: [
      { title: "Upgrading code written for an older version", scenario: "Several of these changed shape between versions, so recognising the current form is what makes a copied snippet safe to paste." },
    ],
  },
  {
    technologies: ["Python Packages — Standard Library & Ecosystem"],
    useCase: { title: "Solving a problem without adding a dependency", scenario: "Paths, dates, CSV, JSON, subprocesses and concurrency are already in the standard library, and every avoided package is one less thing to maintain." },
    alsoUsedFor: [
      { title: "Choosing the right library for real work", scenario: "Web, data, machine learning and automation each have a small set of packages worth knowing, and the rest are noise." },
    ],
  },
  {
    technologies: ["GraphQL — Schema, Servers, Clients & Tooling"],
    useCase: { title: "Serving several clients from one API", scenario: "A phone app, a website and a partner integration each ask for the fields they show, without an endpoint per screen." },
    alsoUsedFor: [
      { title: "Letting teams own parts of one API", scenario: "Federation composes separately deployed services into a single graph, so one team's release does not block another's." },
    ],
  },
  {
    technologies: ["LangChain"],
    useCase: { title: "Building an app around a model rather than a prompt", scenario: "Models, tools, retrieval and memory are composed into something that can be tested and changed, instead of one long prompt nobody dares edit." },
    alsoUsedFor: [
      { title: "Grounding answers in your own content", scenario: "Retrieval puts the right passage in front of the model, which is the difference between an answer and a plausible invention." },
    ],
  },
  {
    technologies: ["LangGraph"],
    useCase: { title: "Running an agent that survives a restart", scenario: "State is checkpointed at each step, so a long-running task resumes rather than starting over when a process dies." },
    alsoUsedFor: [
      { title: "Requiring a human before an action lands", scenario: "An interrupt pauses the graph for approval, which is what makes an agent safe to let near money, email or production data." },
    ],
  },
  {
    technologies: ["LangSmith"],
    useCase: { title: "Seeing what an AI feature actually did", scenario: "Every call, tool use, retrieval and token is traced, which is the only way to explain a bad answer after the fact." },
    alsoUsedFor: [
      { title: "Knowing whether a prompt change helped", scenario: "A dataset and a scored run turn a change from an opinion into a measurement across the cases that matter." },
    ],
  },
  {
    technologies: ["n8n"],
    useCase: { title: "Automating work that spans several systems", scenario: "A form, a spreadsheet, a CRM and an email tool are connected without a service written, deployed and maintained for the join." },
    alsoUsedFor: [
      { title: "Letting an operations team change the workflow", scenario: "The steps are visible and editable by the people who own the process, instead of queued behind engineering for every rule change." },
    ],
  },
  {
    technologies: ["Docker"],
    useCase: { title: "Shipping the environment with the code", scenario: "Runtime, libraries and configuration travel as one image, which ends the class of failure that only happens on one machine." },
    alsoUsedFor: [
      { title: "Running the whole stack locally", scenario: "Database, cache and services start together with one command, so a new developer is productive before lunch." },
    ],
  },
  {
    technologies: ["DevOps with AWS CI/CD"],
    useCase: { title: "Getting a change from a commit to production", scenario: "Build, test, artefact and deploy are one automated path, so releasing is a merge rather than a scheduled event." },
    alsoUsedFor: [
      { title: "Deploying without taking the service down", scenario: "Blue/green and canary releases move traffic gradually and roll back automatically, which is what makes a mid-day deploy reasonable." },
    ],
  },
  {
    technologies: ["Agentic AI"],
    useCase: { title: "Letting a model do the work rather than describe it", scenario: "Tools, planning and memory turn an answer into an action, which is where the value and the risk both are." },
    alsoUsedFor: [
      { title: "Making generated answers trustworthy", scenario: "Retrieval, guardrails and evaluation are what stand between a demo and something allowed to face a customer." },
    ],
  },
  {
    technologies: ["Git — Commands, Branching, Rebase & History"],
    useCase: { title: "Working on the same code as other people", scenario: "Without a version control system, two people editing one file means one of the two edits is lost, and there is no record of which or when." },
    alsoUsedFor: [
      { title: "Getting back to a state that worked", scenario: "A commit is a point you can return to exactly, which is what makes an experiment cheap and a bad afternoon recoverable." },
    ],
    categoryUseCases: {
      "Getting started": { title: "Putting a project under version control", scenario: "Work with no history cannot be compared, reverted, blamed or bisected — the only record of yesterday is whatever the editor still holds." },
      "Branching & merging": { title: "Shipping a fix without shipping the half-built feature", scenario: "One line of development means every change waits for the slowest one, and an urgent release drags in whatever else happens to be in progress." },
      "Rebase & cherry-pick": { title: "Putting one change where it is needed", scenario: "Re-implementing a fix on a release branch by hand produces a second, slightly different fix, and the one nobody tested is the one that ships." },
      "Remotes & collaboration": { title: "Making your work exist off your laptop", scenario: "Unpushed commits are invisible to review, absent from CI, and gone with the machine." },
      "Undoing & recovering": { title: "Taking back something that has gone wrong", scenario: "Knowing which of reset, revert, restore and reflog applies is the difference between a clean undo and destroying a colleague's work." },
      "Inspecting history": { title: "Finding out why the code is the way it is", scenario: "Without blame, log and bisect, a regression is found by reading every commit since the release, and an odd-looking guard clause is either kept forever or removed with the edge case it protected." },
      "How Git works": { title: "Reasoning about Git instead of memorising recipes", scenario: "Remembered command sequences fail the first time the situation differs, and the recovery then looks like guesswork." },
    },
  },
];
