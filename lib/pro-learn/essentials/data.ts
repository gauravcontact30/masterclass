import type { TechnologyEssentials } from "./types";

/** Databases, caches, state containers, validation and the TanStack family. */
export const DATA_ESSENTIALS: TechnologyEssentials[] = [
  {
    technologies: ["Prisma"],
    points: [
      "The schema file is the source of truth, and the client is generated from it. A type error after a schema edit usually means the client was not regenerated, not that the query is wrong.",
      "`migrate dev` is for development and can reset data; `migrate deploy` only applies what already exists. Running the wrong one against a real database is the mistake to know about before you make it.",
      "Nothing is included by default: a query returns the model's own fields, and relations arrive only with `include` or `select`. This is why an untouched relation reads as `undefined` rather than empty.",
      "One `PrismaClient` per process, not per request. Serverless runtimes make this bite quickly, and a pooler is the answer when the platform opens a connection per invocation.",
      "A breaking column change ships as three migrations — add nullable, backfill, then require — because a single migration that rewrites a large table locks it.",
    ],
    categories: {
      "Querying": ["`findMany` without `take` will happily return the whole table. Pagination is a correctness concern, not a UX one.", "N+1 queries come from looping and querying. `include` or a batched query is the fix, and the query log is how you spot it."],
      "Transactions & production": ["An interactive transaction holds a connection for its whole body, so anything slow inside it — an HTTP call, a queue publish — starves the pool."],
      "Migrations": ["Drift means the database no longer matches the migration history. Resolving it by hand-editing the database makes the next deploy worse."],
    },
  },
  {
    technologies: ["Drizzle ORM"],
    points: [
      "The query builder mirrors SQL rather than hiding it, so knowing SQL transfers directly — and a query that would be invalid SQL usually fails to compile.",
      "Types are inferred from the schema you declared, not read from the database. If the two drift, the types are confidently wrong, which is what migrations exist to prevent.",
      "The relational query API and the core select builder return different shapes. Expecting nested relations from a plain select is the most common source of confusion between them.",
      "Schema is TypeScript, so it composes: shared column sets and helpers are ordinary functions instead of a bespoke schema language.",
    ],
    categories: {
      "Runtimes & operation": ["Each serverless driver has its own connection behaviour. The same query can be fine on a long-lived server and exhaust connections on a per-request runtime."],
      "Writes & migrations": ["Generated SQL is a file you can read before it runs. Reading it is the habit that catches an accidental table rewrite."],
    },
  },
  {
    technologies: ["Neon"],
    points: [
      "Storage and compute are separate, which is what makes a branch cheap: a branch copies the data logically instead of duplicating it.",
      "Compute can scale to zero, so the first query after idle pays a wake-up. Treat that latency as expected and keep a connection strategy that tolerates it.",
      "A database branch per preview environment is the point of the model — every pull request can have real data without a seeding script.",
      "Pooled and direct connection strings behave differently: migrations want a direct connection, application traffic wants the pooler.",
    ],
  },
  {
    technologies: ["Upstash"],
    points: [
      "It is Redis reached over HTTP, which is what makes it usable from runtimes that cannot hold a TCP socket open.",
      "Pricing is per request, so the shape of your access pattern is the cost model. One pipelined round trip beats ten small ones twice over — latency and bill.",
      "Durability and replication are configuration, not assumptions. Decide whether a value may be lost on failover before you store something that must not be.",
      "Global replication reduces read latency and introduces replication lag, so a read-after-write from another region can return the previous value.",
    ],
  },
  {
    technologies: ["Redis caching solutions"],
    points: [
      "A cache is a copy, so every entry needs a TTL and an invalidation story. An entry with no expiry and no owner is a bug with a delay on it.",
      "Redis is single-threaded for command execution, which is what makes operations atomic and why one `KEYS` on a large database stalls everything.",
      "The hard part of caching is not reading — it is the stampede when a popular key expires and every request misses at once.",
      "Choosing the data structure is most of the design: a sorted set for a leaderboard, a hash for an object, a stream for events, a string only when the value is opaque.",
    ],
    categories: {
      "Caching patterns": ["Cache-aside is the default: read, miss, load, write back. Write-through couples your write path to the cache's availability."],
      "Atomicity & messaging": ["Multiple commands are atomic only inside a transaction or a script. Read-modify-write across two round trips is a race."],
      "Redis operations": ["Eviction policy decides what happens when memory fills. The default may drop keys you assumed were persistent."],
    },
  },
  {
    technologies: ["Zod validation libraries"],
    points: [
      "A schema is one declaration that produces both the runtime check and the TypeScript type, so the two cannot drift apart.",
      "Parse at the boundary — request body, env, third-party response — and the inside of the application can trust its types honestly.",
      "`parse` throws and `safeParse` returns a result. Which one you use decides whether validation failures are exceptions or ordinary data, and forms want the second.",
      "Unknown keys are stripped by default rather than rejected. That is usually what you want, and it is worth knowing before you debug a missing field.",
    ],
    categories: {
      "Rules & transformations": ["A transform changes the output type, so the inferred type after `.transform()` is no longer the input shape."],
      "Validation integration": ["Validating the same rule in the browser and on the server from one schema is the entire value proposition; duplicating rules by hand undoes it."],
    },
  },
  {
    technologies: ["Conform - Validation libraries"],
    points: [
      "It builds on the platform's own form behaviour, so validation works before JavaScript loads and improves after — not two separate code paths.",
      "The form's state lives in the DOM and the URL rather than in a store, which is why a refresh or a back button does the expected thing.",
      "One schema drives client and server validation. The server result is authoritative, and the client copy exists only to answer faster.",
      "Field names are the API for nested and repeated fields. Getting the naming convention right is what makes arrays and nested objects work without custom code.",
    ],
  },
  {
    technologies: ["T3 environment"],
    points: [
      "Environment variables are validated once, at startup, so a missing value fails the boot instead of surfacing as `undefined` in a request three hours later.",
      "Server and client variables are declared separately on purpose: the split is what stops a secret being bundled into the browser.",
      "A variable is a string until you coerce it. `\"false\"` is truthy, which is the bug this kind of schema exists to prevent.",
      "Builds and runtimes read environment at different moments, so a value baked at build time cannot be changed by restarting the container.",
    ],
  },
  {
    technologies: ["Zustand"],
    points: [
      "The store is a hook, and a component re-renders when the slice it selected changes. Selecting the whole store re-renders on every update — the first performance mistake everyone makes.",
      "Updates are shallow-merged at the top level. Nested state needs an explicit copy, or a helper that makes one for you.",
      "The store exists outside React, so it can be read and written from anywhere — an event handler, a socket, a test — without a provider.",
      "That same freedom makes it easy to hide business logic in components. Keeping actions in the store is what keeps the logic testable.",
    ],
    categories: {
      "Selectors & subscriptions": ["A selector returning a new object each call defeats equality checks. Select primitives, or supply a shallow comparator."],
      "Middleware & architecture": ["Persistence middleware rehydrates asynchronously, so the first render can see the pre-hydration value."],
    },
  },
  {
    technologies: ["Redux"],
    points: [
      "State is replaced, never mutated: a reducer returns a new object. Mutating the argument works in development and breaks memoized selectors and time-travel debugging.",
      "A reducer must be a pure function of state and action — no fetches, no `Date.now()`, no randomness — because it is replayed by the devtools.",
      "An action is a fact that happened, not a command. Naming actions after events rather than setters is what keeps a reducer from becoming a switch of setters.",
      "The value is the audit trail: every state change has a named action with a payload, which is why Redux still wins on hard-to-reproduce bugs.",
    ],
  },
  {
    technologies: ["Redux Toolkit"],
    points: [
      "`createSlice` writes the action creators and reducer together, and Immer lets you write mutating code that produces an immutable update. The mutation is on a draft, not on state.",
      "The bundled defaults matter: the store comes with the devtools, thunk and checks that catch a non-serializable value or an accidental mutation in development.",
      "A thunk is for coordination — dispatch, await, dispatch — not for business rules. Rules that belong to state belong in the reducer.",
      "RTK Query replaces most hand-written data-fetching state: cache, loading, invalidation and deduplication come from the endpoint definition rather than from reducers you maintain.",
    ],
    categories: {
      "RTK Query": ["Tags describe what a query holds and what a mutation touches. Invalidation is declared, so a refetch after a write is not something you remember to call."],
      "Toolkit production": ["A non-serializable value in state disables persistence and devtools replay, which is why the check exists at all."],
    },
  },
  {
    technologies: ["TanStack Query"],
    points: [
      "It manages server state, which is a copy of someone else's data. The questions are how stale it may be and when to refetch — not how to store it.",
      "The query key is the cache identity. Anything the request depends on belongs in the key, or two different requests will share one cache entry.",
      "`staleTime` decides when a refetch may happen; garbage-collection time decides how long unused data is kept. Confusing the two is the usual reason a refetch 'does not work'.",
      "A mutation does not know what it changed. Invalidating the affected keys — or writing the result into the cache — is the step that keeps the UI honest.",
    ],
    categories: {
      "Caching & invalidation": ["Refetch on window focus is on by default, which surprises people debugging network panels with devtools focused."],
      "Mutations": ["An optimistic update needs a rollback path, and the rollback is the half that is usually untested."],
      "Server rendering & testing": ["Hydration needs the same keys on both sides; a key built from something request-specific will mismatch."],
    },
  },
  {
    technologies: ["TanStack Form"],
    points: [
      "Form state is kept per field, so typing in one input does not re-render the whole form. That is the difference that shows up on large forms.",
      "Validation is a function of values, which means sync and async rules compose the same way and a schema library can supply either.",
      "Submission is async and can fail. Treating the error as part of form state, rather than a toast fired from a handler, keeps the failure visible next to the field.",
      "Controlled or uncontrolled is a decision about who owns the value; mixing the two in one field is what produces a cursor that jumps.",
    ],
  },
  {
    technologies: ["TanStack Table"],
    points: [
      "It is headless: it computes rows, sorting, grouping and selection, and renders nothing. Every visual decision stays yours.",
      "Column definitions are the schema of the table — accessor, header, cell, and the sorting or filtering behaviour for that column in one place.",
      "Sorting and filtering can happen in the client or on the server, and the switch is a configuration flag. Deciding early avoids a rewrite at the first large dataset.",
      "Row identity comes from a row id you supply. Without a stable one, selection and expansion follow positions instead of rows.",
    ],
  },
  {
    technologies: ["TanStack Router"],
    points: [
      "Routes are typed, so a link to a route that does not exist — or one missing a parameter — is a compile error rather than a 404 in testing.",
      "Search parameters are first-class state with a schema, which is what makes a filtered, sorted view shareable as a URL.",
      "Loaders run before the route renders, so the component has its data at first paint instead of a spinner and an effect.",
      "The router is a state machine you can inspect. Pending, error and not-found are route-level states rather than conditionals inside components.",
    ],
  },
  {
    technologies: ["TanStack Start"],
    points: [
      "Server functions are typed end to end, so the call site and the implementation share one type without a generated client in between.",
      "The router is the framework's centre: rendering, data loading and navigation all hang off the same typed route tree.",
      "Streaming and server rendering are the default path, so a slow loader delays part of the page instead of the whole document.",
      "Anything that must not reach the browser stays in a server function. The boundary is the file and the directive, not your intention.",
    ],
  },
  {
    technologies: ["TanStack Virtual"],
    points: [
      "Only the visible window is rendered, so a list of a hundred thousand rows costs about what twenty rows cost. Everything else is a scrollbar illusion.",
      "The scroll container needs a known size, and each item needs a measurable one. A measurement that changes after render is what makes a virtual list jump.",
      "Dynamic heights are supported through measurement, not estimation alone — the estimate is for the first paint, the measurement corrects it.",
      "Virtualized content is invisible to in-page search and to naive tests, because it genuinely is not in the DOM.",
    ],
  },
  {
    technologies: ["uv package manager"],
    points: [
      "It resolves and installs from a lockfile, so an environment is reproducible by construction rather than by a `requirements.txt` that drifted.",
      "It manages interpreters too, which removes the class of problem where the project needs a Python version the machine does not have.",
      "The lockfile is the artifact CI and production should install from. Installing from the loose dependency list is how two machines end up different.",
      "Tools are installed in their own isolated environments, so a formatter's dependencies cannot conflict with the project's.",
    ],
  },
];
