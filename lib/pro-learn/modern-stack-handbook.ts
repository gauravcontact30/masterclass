import type { AwsHighlight } from "./aws-highlights";

const topic = (name: string, category: string, summary: string, points?: string[]): AwsHighlight =>
  ({ name, category, summary, ...(points ? { points } : {}) });

export const MODERN_STACK_HANDBOOK: {
  title: string;
  description: string;
  questionPrefix: string;
  topics: AwsHighlight[];
} = {
  title: "Modern Full-Stack Technologies — Tools, Data & Infrastructure",
  description: "Practical topics for building, securing, deploying and operating modern TypeScript applications.",
  questionPrefix: "Modern full-stack development",
  topics: [
    topic("uv package manager", "Tooling", "Manage fast, reproducible Python environments and dependencies with the uv package manager.", [
      "A single Rust-built tool replaces pip, virtualenv and the resolver around them.",
      "A universal lockfile is what makes an environment reproduce on another machine.",
      "It installs interpreters too, so the Python version is part of the project.",
    ]),
    topic("Redis caching solutions", "Data & caching", "Design Redis caches, expirations, invalidation and reliable cache-aside patterns for applications.", [
      "Cache-aside reads the store first and fills it on a miss.",
      "An expiry is the simplest correctness mechanism, because staleness becomes bounded.",
      "Invalidation on write is what a cache that must not lag needs instead.",
    ]),
    topic("Zod", "Validation", "Define TypeScript-first schemas that validate untrusted input and infer useful static types.", [
      "Schemas are written in TypeScript and the static type is inferred from them.",
      "One declaration gives both the runtime check and the compile-time type.",
      "Parsing at the boundary is what makes everything inside it trustworthy.",
    ]),
    topic("n8n Automation", "Automation", "Build visual n8n workflows that connect APIs, trigger jobs and automate recurring business processes.", [
      "Workflows are built visually from nodes that connect APIs and services.",
      "The canvas makes the data path inspectable at each step.",
      "Self-hosting keeps the credentials and the data inside your own network.",
    ]),
    topic("System Design", "Architecture", "Reason about scalable system design through boundaries, data flow, reliability, consistency and trade-offs.", [
      "Boundaries, data flow, reliability and consistency are reasoned about explicitly.",
      "Every choice is a trade, so naming what is given up is the real skill.",
      "Estimating scale first is what decides which designs are even candidates.",
    ]),
    topic("TanStack Query", "TanStack", "Fetch, cache, synchronize and mutate server state with TanStack Query in client applications.", [
      "Server state is treated as a cache keyed by a query key, not as component state.",
      "Staleness decides refetching, which removes most manual loading logic.",
      "Invalidation marks entries for refetch rather than deleting them.",
    ]),
    topic("TanStack Form", "TanStack", "Build type-safe, performant forms with TanStack Form and explicit field-level validation.", [
      "Forms are type-safe with validation declared per field.",
      "Field-level subscriptions keep a large form from re-rendering wholesale.",
      "The same schema can validate on the client and on the server.",
    ]),
    topic("TanStack Table", "TanStack", "Create headless sortable, filterable, paginated and virtualized data tables with TanStack Table.", [
      "Row models, sorting, filtering and pagination are headless.",
      "Headless means the markup and styling stay entirely yours.",
      "Virtualisation is a separate concern that composes with it.",
    ]),
    topic("TanStack Router", "TanStack", "Model type-safe application routing, loaders, search parameters and navigation with TanStack Router.", [
      "Routes, loaders, search parameters and navigation are type-safe end to end.",
      "Search parameters are validated and typed rather than parsed by hand.",
      "Loaders fetch before the route renders, which removes a waterfall.",
    ]),
    topic("TanStack Start", "TanStack", "Build full-stack React applications with TanStack Start, server functions and typed routing.", [
      "Full-stack React is built on server functions and typed routing.",
      "A server function is called like a function and runs on the server.",
      "Streaming and middleware are part of the framework rather than bolted on.",
    ]),
    topic("TanStack Virtual", "TanStack", "Render large lists and grids efficiently by virtualizing only the visible rows and columns.", [
      "Only the visible rows and columns of a large list are rendered.",
      "The cost becomes proportional to the viewport, not to the data.",
      "Dynamic measurement is what handles rows of differing heights.",
    ]),
    topic("Zustand", "State management", "Manage lightweight client state with small Zustand stores, selectors and predictable updates.", [
      "Small stores hold client state with selectors driving re-renders.",
      "A selector means a component re-renders only for the slice it reads.",
      "There is no provider requirement, so a store can live outside React.",
    ]),
    topic("Redux Toolkit", "State management", "Structure Redux applications with slices, modern immutable updates, middleware and Redux Toolkit.", [
      "Slices, immutable updates, middleware and RTK Query come configured.",
      "It removes most of the boilerplate hand-written Redux needed.",
      "Immutable updates are written as if they were mutations and compiled correctly.",
    ]),
    topic("Redux", "State management", "Understand Redux stores, actions, reducers, selectors and one-way state updates in larger applications.", [
      "Stores, actions, reducers and selectors give one-way state updates.",
      "A single direction of flow is what makes a change traceable.",
      "Every update is an explicit action, which is also its main cost.",
    ]),
    topic("GitHub Actions", "DevOps", "Automate testing, builds, releases and deployments with secure GitHub Actions workflows.", [
      "Testing, builds, releases and deployments run from versioned workflow files.",
      "Each job is a fresh machine, so nothing carries over implicitly.",
      "Least-privilege tokens and pinned actions are what make it safe.",
    ]),
    topic("Webhook", "Integrations", "Receive and verify webhook events safely with signatures, idempotency, retries and durable processing.", [
      "Inbound events are received, verified and processed durably.",
      "Signature verification is what separates a real event from anyone's request.",
      "Delivery is at least once, so handling must be idempotent.",
    ]),
    topic("Terraform", "Infrastructure", "Provision repeatable cloud infrastructure with Terraform modules, state, plans and safe changes.", [
      "Infrastructure is declared and provisioned repeatably from configuration.",
      "The plan shows what will change before anything does.",
      "State is the source of truth, so losing or corrupting it is the real risk.",
    ]),
    topic("Kubernetes", "DevOps", "Deploy and operate containerized workloads with Kubernetes resources, services, probes and rolling updates.", [
      "Containerised workloads are declared and reconciled toward a desired state.",
      "Nothing is imperative; controllers keep making reality match the declaration.",
      "Probes decide what counts as healthy, so they shape every rollout.",
    ]),
    topic("Authentication with Auth.js & Kinde Auth", "Authentication", "Implement secure sign-in, sessions, OAuth providers and protected routes with Auth.js and Kinde Auth.", [
      "Sign-in, sessions, OAuth providers and route protection are implemented.",
      "Who owns the user store decides migrations, pricing and outage behaviour.",
      "A JWT session is cheap to read and cannot be revoked early.",
    ]),
    topic("Payment gateway integration", "Payments", "Integrate payment gateways with checkout sessions, webhook fulfillment, refunds and failure-safe idempotency.", [
      "Checkout, webhook fulfilment, refunds and idempotency are wired together.",
      "The webhook, not the browser redirect, is the authoritative completion signal.",
      "Amounts are minor units, because floating point loses money.",
    ]),
    topic("Prisma", "Data & persistence", "Model relational data and perform type-safe queries, migrations and transactions with Prisma.", [
      "Relational data is modelled and queried with generated, type-safe access.",
      "The client is generated from the schema, so a stale client is a real failure mode.",
      "Migrations are files, which is what makes the schema reviewable.",
    ]),
    topic("Neon", "Data & persistence", "Use Neon serverless Postgres branching, pooled connections and environment-friendly database workflows.", [
      "Serverless Postgres branches, pools connections and suits ephemeral environments.",
      "Copy-on-write branching makes a database branch as cheap as a code branch.",
      "Scaling to zero trades idle cost for a resume delay.",
    ]),
    topic("Drizzle ORM", "Data & persistence", "Build SQL-oriented, type-safe data access and migrations with Drizzle ORM.", [
      "SQL-oriented, type-safe access where the builder mirrors the clauses.",
      "The query you write is close to the SQL that runs, which keeps it predictable.",
      "Types are inferred from the schema rather than declared twice.",
    ]),
    topic("Conform - Validation libraries", "Validation", "Build progressively enhanced forms with Conform and connect server-side validation to accessible field errors.", [
      "Progressively enhanced forms connect server validation to accessible field errors.",
      "The form works before JavaScript loads and improves once it does.",
      "Client validation is a convenience; the server check is the real one.",
    ]),
    topic("Zod validation libraries", "Validation", "Compose reusable Zod validation schemas for forms, APIs, environment variables and database boundaries.", [
      "Reusable schemas cover forms, APIs, environment variables and database boundaries.",
      "One schema shared across boundaries stops the two sides drifting apart.",
      "Composition is what keeps a large schema readable.",
    ]),
    topic("Arcjet", "Security", "Protect applications with Arcjet rules for bot detection, rate limiting, access control and abuse prevention.", [
      "Bot detection, rate limiting and abuse prevention run inside the application.",
      "Running in-app means decisions can use data the edge never sees.",
      "Rules are code, so they are reviewed and deployed like anything else.",
    ]),
    topic("Inngest services", "Background jobs", "Run durable, retryable and observable background functions with Inngest event-driven services.", [
      "Durable, retryable background functions are driven by events.",
      "Steps are checkpointed, so a retry resumes rather than restarting.",
      "Concurrency and flow control are declared rather than managed by hand.",
    ]),
    topic("Upstash", "Data & infrastructure", "Use Upstash serverless Redis and Kafka APIs for globally distributed, usage-based application infrastructure.", [
      "Serverless Redis and messaging are reached over HTTP with usage-based pricing.",
      "HTTP access is what makes it usable where a TCP socket cannot survive.",
      "Per-request pricing suits spiky traffic and punishes chatty code.",
    ]),
    topic("BetterAuth", "Authentication", "Configure Better Auth for sessions, social providers, plugins and application-ready authentication flows.", [
      "Sessions, social providers and plugins are configured in your own database.",
      "Plugins extend the schema and the client together, so both stay in step.",
      "Owning the tables means every feature arrives as a migration.",
    ]),
    topic("T3 environment", "Configuration", "Validate and safely expose environment variables with the T3 Env approach in full-stack applications.", [
      "Environment variables are validated and split between server and client.",
      "Validation at boot turns a missing variable into a startup failure.",
      "The split is what stops a secret reaching the browser bundle.",
    ]),
    topic("Clerk user management", "Authentication", "Add Clerk sign-in, organizations, profiles and user management while protecting application routes.", [
      "Sign-in, organizations, profiles and route protection are hosted.",
      "Prebuilt components carry flows that would otherwise be written by hand.",
      "Webhooks mirror identity into your database, where joins actually happen.",
    ]),
  ],
};
