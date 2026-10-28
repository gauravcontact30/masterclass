/*
 * Hand-planned outlines for generated courses whose shape matters more than an AI outline would give: the modules
 * and topics are fixed here, and lib/server/course-generator.ts writes each topic's content on first open (or in
 * scripts/pregenerate-courses.ts) exactly as for any other generated course. A planned outline replaces the stored
 * one wherever a course row is read, so changing it here re-plans the course; topics whose id survives keep their
 * written content.
 */

export type PlannedTopic = { id: string; title: string; module: string; level: "Beginner" | "Intermediate" | "Advanced"; minutes: number; summary: string };
export type PlannedOutline = { intro: string[]; topics: PlannedTopic[] };

const topic = (module: string, id: string, title: string, level: PlannedTopic["level"], minutes: number, summary: string): PlannedTopic => ({ id, title, module, level, minutes, summary });

/** TanStack, by the ecosystem's own categories: Framework, Data & State, UI, UX and Tooling. */
const TANSTACK: PlannedOutline = {
  intro: [
    "TanStack is a family of open-source, headless and type-safe libraries for building web applications. Each library solves one hard problem well, such as routing, server state, tables, forms or virtualized lists, and most of them work with React, Solid, Vue, Svelte, Angular or plain TypeScript.",
    "The libraries are used on their own or together: a TanStack Start app routes with TanStack Router, loads data with TanStack Query or TanStack DB, renders grids with TanStack Table and forms with TanStack Form, and inspects all of them in one Devtools panel.",
    "This course follows the ecosystem's own categories: Framework, Data & State, UI, UX and Tooling. Each library gets its own topics, from the first install to production patterns, with runnable examples, interview questions and practice.",
  ],
  topics: [
    topic("Foundations", "tanstack-ecosystem-overview", "The TanStack ecosystem: headless, type-safe, framework-agnostic libraries", "Beginner", 14, "Explain what TanStack is, the ideas every library shares and where each one fits in an app."),
    topic("Foundations", "tanstack-choosing-libraries", "Choosing TanStack libraries for an app and how they work together", "Beginner", 12, "Pick the right TanStack libraries for a project and plan how they connect."),

    topic("Framework", "start-getting-started", "TanStack Start: creating a full-stack app with SSR and streaming", "Beginner", 20, "Create a TanStack Start app and render routes on the server with streaming."),
    topic("Framework", "start-server-functions", "TanStack Start server functions, middleware and API routes", "Intermediate", 22, "Call server code safely from the client with server functions and middleware."),
    topic("Framework", "start-production", "TanStack Start in production: authentication, caching and deployment", "Advanced", 20, "Ship a TanStack Start app with sessions, caching headers and a deployment target."),
    topic("Framework", "router-route-tree", "TanStack Router: file-based routes, nested layouts and type-safe links", "Beginner", 20, "Build a type-safe route tree with nested layouts and links the compiler checks."),
    topic("Framework", "router-search-params", "TanStack Router path params and validated, typed search params", "Intermediate", 18, "Treat the URL as typed state with path params and validated search params."),
    topic("Framework", "router-loaders", "TanStack Router loaders, beforeLoad, route context and pending states", "Intermediate", 20, "Load data per route with loaders and context, and handle pending and error states."),
    topic("Framework", "router-advanced", "Code splitting, preloading, route guards and SSR with TanStack Router", "Advanced", 20, "Make routing fast and safe with code splitting, preloading and guarded routes."),
    topic("Framework", "redact-getting-started", "TanStack Redact: getting started and core concepts", "Intermediate", 14, "Set up TanStack Redact and use its core API as the official documentation describes it."),

    topic("Data & State", "query-fundamentals", "TanStack Query: QueryClient, useQuery, query keys and UI states", "Beginner", 20, "Fetch server state with useQuery and render its loading, error and success states."),
    topic("Data & State", "query-caching", "TanStack Query caching: staleTime, gcTime, refetching and dependent queries", "Intermediate", 18, "Control freshness and refetching, and chain queries that depend on each other."),
    topic("Data & State", "query-mutations", "TanStack Query mutations, invalidation and optimistic updates with rollback", "Intermediate", 20, "Change server data with mutations and keep the cache correct, optimistically."),
    topic("Data & State", "query-advanced", "Infinite queries, prefetching and SSR hydration with TanStack Query", "Advanced", 22, "Paginate endlessly, prefetch ahead of the user and hydrate server-fetched data."),
    topic("Data & State", "db-collections", "TanStack DB: collections, live queries and optimistic mutations", "Intermediate", 22, "Keep client data in collections and render it with fast live queries."),
    topic("Data & State", "db-sync", "TanStack DB with Query and sync engines: joins and incremental updates", "Advanced", 20, "Back TanStack DB collections with Query or a sync engine and join them on the client."),
    topic("Data & State", "store-reactive-state", "TanStack Store: framework-agnostic reactive stores and derived state", "Beginner", 15, "Hold shared client state in a TanStack Store and derive values from it."),
    topic("Data & State", "ai-getting-started", "TanStack AI: type-safe chat, streaming and tool calling", "Intermediate", 20, "Build a streaming AI chat with typed tools using TanStack AI."),

    topic("UI", "table-fundamentals", "TanStack Table: headless tables, column definitions and row models", "Beginner", 20, "Render a headless table from column definitions and row models."),
    topic("UI", "table-features", "TanStack Table sorting, filtering, pagination, grouping and column visibility", "Intermediate", 22, "Add the everyday table features users expect, client side."),
    topic("UI", "table-server-and-scale", "Server-side data and very large tables with Table, Query and Virtual", "Advanced", 20, "Drive a table from the server and keep huge tables smooth with virtualization."),
    topic("UI", "charts-getting-started", "TanStack Charts: building type-safe data visualisations", "Intermediate", 16, "Turn data into charts with TanStack Charts' axes, series and interactions."),
    topic("UI", "form-fundamentals", "TanStack Form: form and field APIs, validation and submission", "Beginner", 20, "Build a type-safe form with fields, validation messages and submission."),
    topic("UI", "form-advanced", "TanStack Form schema validators, async validation, field arrays and SSR", "Advanced", 20, "Validate with schemas and async checks, and manage dynamic field arrays."),
    topic("UI", "markdown-rendering", "TanStack Markdown: rendering and customising Markdown content", "Intermediate", 14, "Render Markdown with TanStack Markdown and customise how elements appear."),
    topic("UI", "highlight-code", "TanStack Highlight: syntax-highlighting code in your UI", "Intermediate", 12, "Show highlighted code blocks with TanStack Highlight."),

    topic("UX", "virtual-lists", "TanStack Virtual: virtualizing long lists, grids and dynamic sizes", "Intermediate", 18, "Render thousands of rows smoothly by drawing only what is on screen."),
    topic("UX", "pacer-timing", "TanStack Pacer: debouncing, throttling, rate limiting and queuing", "Intermediate", 18, "Control how often work runs with Pacer's debouncers, throttlers, limiters and queues."),
    topic("UX", "hotkeys-shortcuts", "TanStack Hotkeys: type-safe keyboard shortcuts", "Beginner", 12, "Add keyboard shortcuts to an app with TanStack Hotkeys."),

    topic("Tooling", "devtools-panel", "TanStack Devtools: one panel for Query, Router, Form and more", "Beginner", 14, "Inspect every TanStack library in an app from one Devtools panel."),
    topic("Tooling", "config-packages", "TanStack Config: building, testing and publishing packages", "Advanced", 14, "Use TanStack Config's shared tooling to build and publish a package."),
    topic("Tooling", "cli-scaffolding", "TanStack CLI: scaffolding apps and adding integrations", "Beginner", 12, "Create a new TanStack app and add integrations from the command line."),
    topic("Tooling", "intent-getting-started", "TanStack Intent: getting started and core concepts", "Intermediate", 12, "Set up TanStack Intent and use its core API as the official documentation describes it."),
  ],
};

export const PLANNED_OUTLINES: Record<string, PlannedOutline> = { tanstack: TANSTACK };
