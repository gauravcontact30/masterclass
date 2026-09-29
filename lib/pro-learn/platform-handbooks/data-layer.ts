import { defineHandbook } from "./shared";

/**
 * The persistence layer: two ORMs and the two serverless data services the app
 * teaches alongside them.
 *
 * Prisma and Drizzle are kept apart rather than merged into one "ORM" tab
 * because their models genuinely differ — Prisma owns a schema language and a
 * migration engine, Drizzle stays close to SQL — and a learner is choosing
 * between them, not learning both at once.
 */
export const DATA_LAYER_HANDBOOKS = [
  defineHandbook("Prisma", "Schema modelling, generated client, relations, migrations, transactions and production operation.", "https://www.prisma.io/docs", {
    mechanism: "The schema file is the source of truth. Prisma generates a typed client from it, and migrate turns schema changes into ordered SQL migration files, so the database shape and the client types move together.",
    example: "Adding a nullable column is a migration and a regenerated client. Backfilling it is a separate migration, and only once every row has a value does a third migration make the column required — three safe steps instead of one that locks the table.",
    pitfall: "Instantiating PrismaClient per request exhausts the connection pool under serverless load. Reuse one instance, and use a pooler when the platform opens a connection per invocation.",
  }, {
    "Schema & modelling": [
      ["Datasource and generator", "Declare the database connection and the client the schema generates.", [
        "One block names the database, another names the client to generate.",
        "The generated client is a build artifact, so it must be regenerated after a schema edit.",
        "The connection URL is read at generation and at runtime, which are different moments.",
      ]],
      ["Models and fields", "Map a model to a table with typed, explicitly nullable fields.", [
        "A model maps to a table, and every field states its type and nullability.",
        "Optional in the schema is nullable in the database, not merely absent from a write.",
        "Renaming a field renames the column unless a mapping keeps the old name.",
      ]],
      ["Attributes and defaults", "Set primary keys, defaults, unique constraints and database-level mappings.", [
        "Keys, defaults, unique constraints and column mappings are declared as attributes.",
        "A default declared here is applied by the database, not by the client.",
        "A mapping is what lets a friendly field name sit over an existing column name.",
      ]],
      ["Relations", "Express one-to-one, one-to-many and many-to-many with explicit relation fields.", [
        "One-to-one, one-to-many and many-to-many are expressed with explicit relation fields.",
        "The scalar field holds the key; the relation field is how the client traverses it.",
        "An implicit many-to-many creates a join table you never named.",
      ]],
      ["Enums and composite types", "Model a constrained set of values and reuse a shared field shape.", [
        "A constrained value set becomes a real database enum where the dialect has one.",
        "Adding a value is safe; removing one breaks rows that still hold it.",
        "A composite type reuses a field shape without creating another table.",
      ]],
      ["Indexes", "Add indexes for the queries a feature actually runs, not for every column.", [
        "Indexes are added for the queries a feature runs, not for every column.",
        "A composite index only helps when the query filters on its leading columns.",
        "Every index is a cost on write, so an unused one is pure overhead.",
      ]],
    ],
    "Querying": [
      ["findMany and filtering", "Compose where conditions the client types check before the query runs.", [
        "Conditions compose as objects the generated types check before the query runs.",
        "A typo in a field name fails at compile time rather than returning nothing.",
        "An empty filter object matches everything, which is rarely what was meant.",
      ]],
      ["select and include", "Return only needed columns and relations instead of whole rows by default.", [
        "Only the needed columns and relations come back instead of whole rows.",
        "Without either, every scalar column is selected by default.",
        "select and include cannot both be used at the same level.",
      ]],
      ["Nested writes", "Create or connect related records in a single, consistent operation.", [
        "Related records are created or connected in one consistent operation.",
        "It runs in a single transaction, so a partial write cannot survive.",
        "connect fails if the target does not exist, which is the check you want.",
      ]],
      ["Pagination", "Choose cursor pagination for stable paging over offset for arbitrary jumps.", [
        "Cursor paging is stable under concurrent inserts; offset paging is not.",
        "Offset is right for jumping to an arbitrary page and wrong for a feed.",
        "A deep offset makes the database count rows it then discards.",
      ]],
      ["Aggregations and groupBy", "Count, sum and group in the database rather than in application memory.", [
        "Counting, summing and grouping happen in the database rather than in memory.",
        "Pulling rows to aggregate in the application moves data that is then thrown away.",
        "Grouped queries must name every non-aggregated field they select.",
      ]],
      ["Raw queries", "Drop to SQL safely with parameterized queries when the client cannot express it.", [
        "SQL is available, parameterised, for what the client cannot express.",
        "Parameters are bound rather than interpolated, which is what keeps input out of the statement.",
        "The result is untyped, so its shape is asserted rather than inferred.",
      ]],
    ],
    "Migrations": [
      ["migrate dev", "Generate and apply a migration during development from a schema change.", [
        "A schema change becomes a migration file and is applied locally.",
        "It can reset the database when history and schema have diverged, so it is development only.",
        "It uses transactions to read the current state, which pooled connections can break.",
      ]],
      ["migrate deploy", "Apply pending migrations in CI or production without generating new ones.", [
        "Pending migrations are applied without generating anything new.",
        "It is the documented command for CI and production.",
        "Behind PgBouncer it must use the direct connection, since the Schema Engine needs a single connection.",
      ]],
      ["Expand and contract", "Ship a breaking column change as separate additive, backfill and cleanup steps.", [
        "A breaking column change ships as additive, backfill and cleanup steps.",
        "Each step leaves the old and new code paths both working.",
        "Doing it in one step means the deploy and the migration must be simultaneous.",
      ]],
      ["Baselining", "Adopt Prisma on a database that already has tables without recreating them.", [
        "An existing database is adopted without recreating its tables.",
        "The first migration is marked applied rather than actually run.",
        "Skipping this makes the tool try to create tables that already exist.",
      ]],
      ["Drift detection", "Recognize when the database no longer matches the migration history.", [
        "The tool reports when the database no longer matches the migration history.",
        "Drift usually means someone changed the schema outside the migrations.",
        "Resolving it by resetting destroys data, so it is the wrong reflex in production.",
      ]],
      ["Seeding", "Populate reference data reproducibly and keep it separate from test fixtures.", [
        "Reference data is populated reproducibly and kept apart from test fixtures.",
        "Seeds must be idempotent, because they will run more than once.",
        "Mixing fixtures into seeds puts test rows into a real environment.",
      ]],
    ],
    "Transactions & production": [
      ["Interactive transactions", "Run dependent reads and writes atomically with an explicit timeout.", [
        "`$transaction(async tx => …)` takes `maxWait`, `timeout` and `isolationLevel`.",
        "The documented defaults are 2000ms to acquire and 5000ms to run.",
        "Every query must use the `tx` handle, or it runs outside the transaction.",
      ]],
      ["Batch transactions", "Submit independent operations together when none depends on another's result.", [
        "Independent operations are submitted together when none needs another's result.",
        "There is no round trip between them, which is where the speed comes from.",
        "A later operation cannot read what an earlier one in the batch wrote.",
      ]],
      ["Isolation levels", "Choose an isolation level deliberately when concurrent writes can interleave.", [
        "`isolationLevel` is set per transaction, defaulting to the database's own setting.",
        "`Prisma.TransactionIsolationLevel.Serializable` is the strictest option.",
        "The docs note isolation levels are not supported on MongoDB.",
      ]],
      ["Connection pooling", "Size the pool for the runtime and pool externally on serverless platforms.", [
        "`DATABASE_URL` carries the pooled string for runtime queries.",
        "`DIRECT_URL` bypasses the pooler, which the CLI needs for migrations and introspection.",
        "In Prisma 7 the runtime client is constructed with a driver adapter such as `@prisma/adapter-pg`.",
      ]],
      ["Client lifecycle", "Reuse a single client across requests and shut it down cleanly.", [
        "One client is reused across requests and shut down cleanly.",
        "A client per request exhausts connections under any real load.",
        "Hot reload in development creates clients repeatedly unless one is cached.",
      ]],
      ["Query logging", "Log slow queries and inspect the SQL the client actually emitted.", [
        "Slow queries are logged and the emitted SQL inspected.",
        "Seeing the real SQL is what explains a query the types made look cheap.",
        "Logging every query in production is itself a performance cost.",
      ]],
    ],
  }),

  defineHandbook("Drizzle ORM", "SQL-first schema, typed queries, relations, migrations and serverless drivers.", "https://orm.drizzle.team/docs/overview", {
    mechanism: "The schema is TypeScript that describes SQL tables, and the query builder mirrors SQL clauses rather than hiding them. Types are inferred from the schema, so a query that would not compile would not have been valid SQL either.",
    example: "A reporting query joins three tables, groups by month and filters on an indexed column. The builder produces the SQL you would have written by hand, and the result type is inferred from the selected columns.",
    pitfall: "The relational query API and the core select builder are different tools. Mixing assumptions between them — expecting nested relation results from a plain select — produces shapes that do not match the types you expected.",
  }, {
    "Schema definition": [
      ["Table definitions", "Describe a table and its columns in TypeScript with database-accurate types.", [
        "A table is TypeScript that describes real SQL columns rather than an abstraction over them.",
        "The declaration is the single source for both the migration and the inferred types.",
        "A column whose declared type differs from the database is a runtime surprise, not a compile error.",
      ]],
      ["Column types and modifiers", "Set nullability, defaults and generated values explicitly per dialect.", [
        "Nullability, defaults and generated values are stated per column and per dialect.",
        "A default set in TypeScript and a default set in SQL are not the same thing.",
        "Dialects disagree on types, so a column that ports cleanly is a deliberate choice.",
      ]],
      ["Primary and composite keys", "Declare single or multi-column keys the way the database enforces them.", [
        "Keys are declared the way the database will actually enforce them.",
        "A composite key changes what a conflict target and a join must name.",
        "A surrogate key hides a natural uniqueness that still needs a constraint.",
      ]],
      ["Indexes and constraints", "Add unique constraints, checks and indexes alongside the table.", [
        "Unique constraints, checks and indexes sit beside the table that owns them.",
        "A constraint is enforced by the database; a check in application code is not.",
        "An index the query planner cannot use costs writes and returns nothing.",
      ]],
      ["Relations", "Declare relations so the relational query API can traverse them.", [
        "Relations are declared so the relational query API can traverse them.",
        "They describe shape for queries and do not themselves create a foreign key.",
        "A relation declared in one direction only is traversable in one direction only.",
      ]],
      ["Schema organization", "Split a growing schema across files and re-export one entry point.", [
        "A growing schema is split across files and re-exported from one entry point.",
        "The single entry is what migrations and the client are both generated from.",
        "Circular imports between table files break inference before they break the build.",
      ]],
    ],
    "Querying": [
      ["Select builder", "Compose select, from, where and join the way the SQL clauses compose.", [
        "select, from, where and join compose the way the SQL clauses compose.",
        "The result type is inferred from the columns actually selected.",
        "Selecting whole tables where columns would do moves rows you never read.",
      ]],
      ["Operators", "Build conditions with eq, and, or, inArray and friends instead of string concatenation.", [
        "Conditions are built from eq, and, or and inArray rather than concatenated strings.",
        "Parameters are bound, which is what keeps input out of the statement text.",
        "inArray with an empty list is the edge case that quietly matches nothing.",
      ]],
      ["Joins", "Choose inner, left and full joins knowingly and read the resulting row shape.", [
        "Inner, left and full joins are chosen knowingly, and each returns a different row shape.",
        "A left join makes every column on the right side nullable in the result type.",
        "A join that multiplies rows turns one aggregate into a wrong number.",
      ]],
      ["Relational queries", "Fetch nested related rows in one call with typed nesting.", [
        "Nested related rows come back in one call with the nesting typed.",
        "This is a different tool from the select builder and returns a different shape.",
        "Nesting deeply fetches more than a page usually renders.",
      ]],
      ["Aggregations and grouping", "Group, count and aggregate with the builder's typed helpers.", [
        "Grouping, counting and aggregating use the builder's typed helpers.",
        "Every non-aggregated selected column has to appear in the grouping.",
        "Counting a left-joined column counts matches, not parent rows.",
      ]],
      ["Prepared statements", "Reuse a compiled query with bound parameters on a hot path.", [
        "A compiled query is reused with bound parameters on a hot path.",
        "Preparing moves the planning cost off every call.",
        "A prepared statement is tied to its connection, which matters when pooling.",
      ]],
    ],
    "Writes & migrations": [
      ["Insert and upsert", "Insert rows and resolve conflicts with an explicit update target.", [
        "Rows are inserted and conflicts resolved against an explicit target.",
        "The conflict target must match a real unique constraint or nothing is caught.",
        "An upsert that updates every column overwrites fields it was never given.",
      ]],
      ["Update and delete", "Restrict writes with the same conditions the select builder uses.", [
        "Writes are restricted by the same conditions the select builder uses.",
        "An update with no condition rewrites the whole table.",
        "Testing the condition as a select first is what makes the write safe.",
      ]],
      ["Returning clauses", "Read back generated values without a second query.", [
        "Generated values are read back without issuing a second query.",
        "It returns the row as written, including defaults the database supplied.",
        "Not every dialect supports returning on every statement.",
      ]],
      ["Transactions", "Group dependent statements and roll back on failure.", [
        "Dependent statements are grouped and rolled back together on failure.",
        "Every statement must use the transaction handle or it runs outside it.",
        "Work held open across a network call holds locks for that long.",
      ]],
      ["drizzle-kit generate", "Produce SQL migration files from schema changes.", [
        "SQL migration files are produced from the difference in the schema.",
        "The generated SQL is reviewed, because a rename can read as a drop and an add.",
        "Generating without applying leaves the code ahead of the database.",
      ]],
      ["Applying migrations", "Run migrations at deploy time and keep the journal in version control.", [
        "Migrations run at deploy time and the journal is kept in version control.",
        "The journal is what tells an environment which migrations it has already run.",
        "Two instances migrating at once need a lock or they race.",
      ]],
    ],
    "Runtimes & operation": [
      ["Driver selection", "Pick the driver that matches the database and the runtime.", [
        "The driver is chosen to match both the database and the runtime it runs in.",
        "A driver that opens raw sockets cannot run where sockets are unavailable.",
        "Drivers differ in what they support, so the choice affects more than connection setup.",
      ]],
      ["Serverless drivers", "Use an HTTP or pooled driver where long-lived sockets are unavailable.", [
        "An HTTP or pooled driver is used where long-lived sockets do not exist.",
        "Each invocation is short-lived, so connecting per request exhausts the database.",
        "An HTTP driver adds latency per statement, which makes chatty code expensive.",
      ]],
      ["Connection management", "Reuse a connection across invocations and avoid per-request pools.", [
        "A connection is reused across invocations rather than created per request.",
        "A pool created inside a handler is a new pool on every call.",
        "Pool size multiplied by instance count is what the database actually sees.",
      ]],
      ["Type inference helpers", "Derive insert and select types from a table instead of restating them.", [
        "Insert and select types are derived from the table instead of restated.",
        "Derived types change with the schema, so they cannot drift from it.",
        "Hand-written duplicates are what silently disagree after a column changes.",
      ]],
      ["Raw SQL escape hatch", "Use the sql template safely for expressions the builder lacks.", [
        "The sql template covers expressions the builder does not express.",
        "Interpolated values are still bound as parameters rather than inlined.",
        "Raw SQL is not type-checked, so the result shape is asserted, not inferred.",
      ]],
      ["Testing", "Run migrations against a disposable database and assert on real SQL behaviour.", [
        "Migrations are run against a disposable database and assertions made on real SQL behaviour.",
        "Only a real database enforces constraints, defaults and collation.",
        "A mocked query proves the code ran, not that the SQL was right.",
      ]],
    ],
  }),

  defineHandbook("Neon", "Serverless Postgres branching, connection pooling, autoscaling and environment workflows.", "https://neon.com/docs/introduction", {
    mechanism: "Neon separates storage from compute. Storage is copy-on-write, so a branch is a near-instant snapshot of the database rather than a copy, and compute can scale to zero and resume on the next connection.",
    example: "Every pull request gets a branch of production's schema and data. Preview deployments point at that branch, migrations run against it, and merging deletes it — so a risky migration is tested on realistic data without touching production.",
    pitfall: "Scale-to-zero means the first connection after idle pays a resume delay, and a direct connection string is not the pooled one. Using the unpooled endpoint from a serverless function exhausts connections quickly.",
  }, {
    "Platform model": [
      ["Projects and branches", "Understand the hierarchy that holds compute, storage and databases.", [
        "A project holds branches, and a branch holds compute, storage and databases.",
        "The hierarchy is what makes a database branch as cheap as a code branch.",
        "Storage belongs to the branch; compute is attached to it separately.",
      ]],
      ["Copy-on-write branching", "Create a branch of real data without duplicating storage.", [
        "A branch of real data is created without duplicating the storage.",
        "Only what diverges consumes new space, so branching is near-instant.",
        "A long-lived branch that drifts far from its parent stops being cheap.",
      ]],
      ["Compute endpoints", "Attach compute to a branch and size it for the workload.", [
        "Compute is attached to a branch and sized for its workload.",
        "The same branch data can be served by a differently sized endpoint.",
        "Resizing restarts the endpoint, which drops open connections.",
      ]],
      ["Autoscaling", "Let compute grow with load within bounds you set.", [
        "Compute grows with load between the bounds you set.",
        "Bounds are what stop a runaway query becoming a runaway bill.",
        "Scaling reacts to load, so the first moments of a spike are served small.",
      ]],
      ["Scale to zero", "Trade idle cost for a resume delay and know where that delay lands.", [
        "An idle database suspends, so cost follows use rather than uptime.",
        "The next connection pays a resume delay before it is served.",
        "A health check that never lets it idle removes the saving entirely.",
      ]],
      ["Regions", "Place data close to the application and understand cross-region latency.", [
        "Data is placed near the application, and cross-region latency understood.",
        "A round trip across regions dominates any query the database runs.",
        "A project's region is fixed, so moving means a new project.",
      ]],
    ],
    "Connecting": [
      ["Pooled connections", "Use the pooled endpoint from short-lived serverless invocations.", [
        "The pooled endpoint carries a `-pooler` suffix in its hostname.",
        "It runs PgBouncer in transaction mode and accepts up to 10,000 client connections.",
        "The documented pool size is 90% of `max_connections` — 377 of 419 on a 1 CU compute.",
      ]],
      ["Direct connections", "Reserve the direct endpoint for migrations and long-lived sessions.", [
        "The direct endpoint is the hostname without the `-pooler` suffix.",
        "Schema migrations, `pg_dump`/`pg_restore` and logical replication all require it.",
        "Anything relying on `SET`, `LISTEN`/`NOTIFY` or session state needs it too.",
      ]],
      ["Serverless driver", "Query over HTTP where a TCP socket cannot survive the runtime.", [
        "Queries travel over HTTP where a TCP socket cannot survive the runtime.",
        "It removes the connection lifecycle entirely for one-shot queries.",
        "Each statement is its own request, so chatty code pays per statement.",
      ]],
      ["Connection strings", "Manage per-branch credentials without hardcoding them.", [
        "Per-branch credentials are managed rather than hardcoded.",
        "Each branch has its own string, which is what keeps environments apart.",
        "A string committed to the repository is a credential leak, not a config.",
      ]],
      ["SSL requirements", "Connect with the encryption the platform requires.", [
        "The platform requires encrypted connections.",
        "A client that disables verification is encrypted but not authenticated.",
        "Some drivers need the mode stated explicitly or they fail to connect.",
      ]],
      ["Connection limits", "Recognize pool exhaustion and correct the endpoint choice.", [
        "PgBouncer accepts up to 10,000 client connections in front of far fewer server ones.",
        "`max_connections` scales with compute size, so a small endpoint exhausts sooner.",
        "Exhaustion usually means direct connections were used where pooled were needed.",
      ]],
    ],
    "Workflows": [
      ["Preview branches", "Give each pull request an isolated database automatically.", [
        "Each pull request gets an isolated database automatically.",
        "Isolation means a destructive test cannot reach shared data.",
        "Branches created per pull request must also be destroyed per pull request.",
      ]],
      ["Migration testing", "Run a migration against production-shaped data before shipping it.", [
        "A migration runs against production-shaped data before it ships.",
        "Real data volume is what surfaces a migration that locks a table too long.",
        "A schema-only branch will not reveal that, because it has no rows.",
      ]],
      ["Point-in-time restore", "Recover by branching from an earlier moment rather than restoring a dump.", [
        "Recovery branches from an earlier moment instead of restoring a dump.",
        "The original branch stays untouched, so the two can be compared.",
        "The window is bounded by retention, so an old mistake may be past it.",
      ]],
      ["Schema-only branches", "Share structure without copying sensitive rows.", [
        "Structure is shared without copying sensitive rows.",
        "It is the safe branch to hand to a contractor or a preview environment.",
        "Queries that depend on data volume behave nothing like production here.",
      ]],
      ["Branch cleanup", "Expire ephemeral branches so storage and cost stay bounded.", [
        "Ephemeral branches expire so storage and cost stay bounded.",
        "A branch left open keeps diverging and keeps costing.",
        "Automatic expiry is what stops cleanup depending on someone remembering.",
      ]],
      ["Environment separation", "Keep development, preview and production credentials distinct.", [
        "Development, preview and production credentials are kept distinct.",
        "One shared string means a preview deploy can write to production.",
        "Separation has to be enforced by the credential, not by convention.",
      ]],
    ],
  }),

  defineHandbook("Upstash", "Serverless Redis, rate limiting, QStash and durable workflows, with legacy Kafka migration topics.", "https://upstash.com/docs", {
    mechanism: "Upstash provides HTTP access to Redis and asynchronous HTTP delivery through QStash. Workflow builds durable execution from named steps. Legacy Kafka examples describe migration concepts rather than an available Upstash service.",
    example: "An API route rate-limits an authenticated account, caches a response under a versioned Redis key, and publishes follow-up work to QStash. The receiver verifies the signature and processes the job idempotently.",
    pitfall: "Per-request pricing makes a chatty loop expensive and slow. Batch with pipelines, and remember that an HTTP call inside a hot loop costs a network round trip that a local Redis client would not.",
  }, {
    "Callbacks & lifecycle": [
      ["QStash callbacks", "Point a message at a callback URL so the result arrives as a normal HTTP request.", [
        "Configure a callback URL for QStash delivery results.",
        "Verify callback authenticity before trusting its status payload.",
        "Correlate the result with the original message identifier.",
      ]],
      ["QStash failure callbacks", "Receive a request when every retry has been exhausted, instead of finding it in a dashboard.", [
        "Send exhausted-delivery notifications to an authorized failure endpoint.",
        "Record the last destination error and original message reference.",
        "Make recovery actions idempotent if callbacks are retried.",
      ]],
      ["Workflow failure functions", "Handle a workflow run that could not complete, in code, next to the workflow itself.", [
        "Use the Workflow failure hook for terminal run failures.",
        "Include run and step identifiers in diagnosis.",
        "Keep compensation safe to repeat and separately observable.",
      ]],
      ["Workflow steps", "context.run records each step's result, which is what makes a resumed run skip finished work.", [
        "Wrap durable units of work in named Workflow steps.",
        "Return serializable results required by later steps.",
        "Keep external side effects safe across execution retries.",
      ]],
      ["Ratelimit results", "The limit call returns remaining and reset, which is what a response header should carry.", [
        "Inspect success, remaining allowance and reset information.",
        "Return a clear rate-limit response when permission is denied.",
        "Complete pending analytics work using the runtime's supported lifetime mechanism.",
      ]],
      ["blockUntilReady", "Wait for capacity up to a deadline rather than rejecting a request immediately.", [
        "Wait only up to the configured timeout for capacity.",
        "Handle a denied result when the waiting budget expires.",
        "Avoid holding latency-sensitive requests indefinitely.",
      ]],
      ["Client retry configuration", "The REST client retries with backoff; set it deliberately for a serverless caller.", [
        "Set retry counts and delay behavior deliberately.",
        "Distinguish a failed request from an uncertain write outcome.",
        "Bound retries to the enclosing operation's deadline.",
      ]],
    ],
    "Serverless Redis": [
      ["REST and HTTP clients", "Call Redis without a persistent connection from an edge or serverless runtime.", [
        "Use the REST client in runtimes where persistent TCP is unsuitable.",
        "Keep database URL and authorization token in server configuration.",
        "Reuse the client and account for per-request network latency.",
      ]],
      ["Core data types", "Use strings, hashes, lists, sets and sorted sets for the right access pattern.", [
        "Choose strings, hashes, sets or sorted sets by access pattern.",
        "Use atomic commands for counters and membership changes.",
        "Check supported commands before adopting a Redis-specific extension.",
      ]],
      ["Expiry and eviction", "Set TTLs deliberately and know what happens when memory fills.", [
        "Set explicit TTLs for temporary data.",
        "Distinguish expired keys from entries removed under memory pressure.",
        "Keep durable business records outside an eviction-dependent cache.",
      ]],
      ["Pipelines", "Batch commands into one round trip instead of paying per call.", [
        "Batch independent Redis commands to reduce HTTP overhead.",
        "Inspect command results in their submitted order.",
        "Do not rely on a pipeline for transaction isolation.",
      ]],
      ["Transactions", "Group commands so they apply together.", [
        "Use the client's transactional API for grouped atomic operations.",
        "Keep related keys compatible with deployment restrictions.",
        "Handle individual command errors without assuming automatic rollback.",
      ]],
      ["Global replication", "Read from a nearby replica and understand the consistency that implies.", [
        "Choose regions around actual readers and writers.",
        "Account for replication delay when reading remote copies.",
        "Verify consistency requirements before routing critical reads.",
      ]],
    ],
    "Application patterns": [
      ["Rate limiting", "Apply fixed, sliding or token-bucket limits with the ratelimit library.", [
        "Identify users or tenants with trusted limiter keys.",
        "Select a fixed, sliding or token-based algorithm for the workload.",
        "Distinguish quota exhaustion from limiter-service failure.",
      ]],
      ["Caching", "Cache responses under versioned keys with an explicit invalidation rule.", [
        "Cache a bounded projection of expensive source data.",
        "Include tenant and relevant query parameters in the key.",
        "Invalidate or expire values when authoritative data changes.",
      ]],
      ["Session storage", "Store sessions with an expiry that matches the cookie's lifetime.", [
        "Use unpredictable session IDs and bounded expiry.",
        "Store only server-controlled session attributes.",
        "Revoke sessions deliberately rather than waiting only for expiration.",
      ]],
      ["Idempotency keys", "Record processed request ids so a retry cannot duplicate an effect.", [
        "Create a unique operation key before applying a side effect.",
        "Store operation status long enough to cover client retries.",
        "Avoid treating an expired key as proof the operation never occurred.",
      ]],
      ["Locks", "Serialize work across invocations with a lock that expires on failure.", [
        "Use token-owned leases with bounded validity.",
        "Release a lock only if its ownership token still matches.",
        "Protect external writes from owners whose lease has already expired.",
      ]],
      ["Counters and leaderboards", "Use atomic increments and sorted sets instead of read-modify-write.", [
        "Increment counters atomically instead of reading and rewriting values.",
        "Use sorted-set scores for ordered rankings.",
        "Define retention and tie behavior for rolling leaderboards.",
      ]],
    ],
    "Messaging & operation": [
      ["Kafka over HTTP", "Understand the former HTTP Kafka integration when migrating a legacy Upstash workload.", [
        "Upstash Kafka is a discontinued legacy product.",
        "Treat HTTP Kafka examples as migration context, not new-service setup.",
        "Select a supported Kafka provider or suitable QStash workflow.",
      ]],
      ["Topics and consumer groups", "Understand Kafka partitioning and consumer offsets when migrating legacy streaming workloads.", [
        "Kafka topics retain partitioned records for consumers.",
        "Consumer groups divide partitions and track processing offsets.",
        "Migrate legacy Upstash Kafka workloads to a supported platform.",
      ]],
      ["QStash", "Schedule and deliver HTTP messages with retries and delays.", [
        "Publish HTTP work for asynchronous destination delivery.",
        "Verify QStash signatures in the receiving endpoint.",
        "Configure bounded retries and idempotent destination processing.",
      ]],
      ["Dead letter handling", "Capture messages that exhaust their retries for inspection.", [
        "Inspect messages whose delivery retry budget is exhausted.",
        "Fix the destination or payload before replaying.",
        "Alert on dead-letter age so failed work is not forgotten.",
      ]],
      ["Observability", "Watch command latency, request counts and cost per endpoint.", [
        "Track request latency, error rate, usage and quota pressure.",
        "Correlate QStash message IDs with destination processing logs.",
        "Exclude database tokens and sensitive values from diagnostics.",
      ]],
      ["Security", "Scope tokens per environment and rotate them without downtime.", [
        "Keep write-capable service tokens off the client.",
        "Use narrowly scoped credentials and rotate exposed secrets.",
        "Validate webhook signatures and restrict accessible destinations.",
      ]],
    ],
  }),
];
