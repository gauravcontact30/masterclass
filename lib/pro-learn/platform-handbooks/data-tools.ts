import { defineHandbook } from "./shared";

export const DATA_TOOL_HANDBOOKS = [
  defineHandbook("uv package manager", "Python projects, interpreters, dependencies, tools, workspaces, builds and reproducible automation.", "https://docs.astral.sh/uv/", {
    mechanism: "A project declares dependencies in pyproject.toml; uv resolves compatible versions into uv.lock and synchronizes the environment. Interpreter selection, resolution and installation are separate concerns.",
    example: "Initialize a project, add a dependency, commit pyproject.toml and uv.lock, then run uv sync --locked in CI. A stale lockfile should fail the build rather than silently resolving a new release.",
    pitfall: "--locked checks lockfile freshness; --frozen uses the existing lockfile without that check. Do not treat them as interchangeable reproducibility guarantees.",
  }, {
    "uv projects": [
      ["uv init", "Create an application or library project and inspect its pyproject.toml before adding dependencies.", [
        "An application layout gets a main module; a library layout gets a package and a build backend.",
        "The generated manifest already carries the name, version and Python requirement.",
        "Nothing is installed yet, so the first run or sync creates the environment.",
      ]],
      ["pyproject.toml", "Declare metadata, Python requirements, dependencies and tool configuration in the project's standard manifest.", [
        "One file holds metadata, the Python requirement and the dependency lists.",
        "Tool sections let formatters, linters and type checkers share the same manifest.",
        "Hand edits are legitimate, but the lockfile must be refreshed after them.",
      ]],
      ["uv add and remove", "Update declared dependencies and the resolution together instead of manually editing an environment.", [
        "Adding a package writes the manifest, updates the lock and installs in one step.",
        "A version specifier given at add time is recorded rather than pinned silently.",
        "Removing takes the entry out of the manifest and drops what nothing else needs.",
      ]],
      ["uv run", "Run a command in the project environment with automatic synchronization unless explicitly disabled.", [
        "The command runs against the project environment without activating it first.",
        "uv checks the lock and syncs beforehand unless it is told not to.",
        "It is what makes a checked-out repository runnable with no setup steps.",
      ]],
      ["uv sync", "Synchronize installed packages to the project resolution; exact sync can remove undeclared packages.", [
        "Sync makes the environment match the lockfile exactly, install and uninstall alike.",
        "A package installed by hand is removed, which is what makes the result reproducible.",
        "Group and extra flags decide which optional dependencies are included.",
      ]],
      ["uv lock", "Resolve dependency versions without confusing the lockfile with an installed environment.", [
        "Locking resolves versions for every supported platform, not just the current one.",
        "The lockfile is committed, so a colleague and CI resolve to the same versions.",
        "Resolution on its own changes nothing that is installed on the machine.",
      ]],
      ["uv tree", "Inspect direct and transitive dependencies to diagnose unexpected packages or conflicts.", [
        "The tree shows which package pulled in a transitive dependency you did not expect.",
        "It reports version conflicts alongside the requirement that forced each choice.",
        "Reading it is the fastest way to find why a resolution is pinned low.",
      ]],
      ["Dependency groups and extras", "Separate development groups from optional features that consumers may request.", [
        "A development group is for contributors and never ships to consumers.",
        "An extra is an opt-in feature a consumer requests by name at install time.",
        "Putting test tooling in an extra exposes it as a public part of the package.",
      ]],
    ],
    "Python environments": [
      ["Python installation", "Install supported Python interpreters and distinguish managed interpreters from system installations.", [
        "uv can download and manage interpreters independently of the system package manager.",
        "A managed interpreter is standalone, so an operating system upgrade cannot disturb it.",
        "Pointing at a system interpreter stays possible when a project requires it.",
      ]],
      ["Python version pinning", "Record a project interpreter preference and keep it compatible with requires-python.", [
        "A pinned version file records which interpreter the project expects locally.",
        "The pin must satisfy the manifest requirement or commands refuse to run.",
        "Pinning an exact patch release is usually stricter than a project actually needs.",
      ]],
      ["Virtual environments", "Isolate installed distributions and choose the interpreter before creating an environment.", [
        "The environment lives in the project directory and is disposable by design.",
        "Choose the interpreter at creation time, because it cannot be changed afterwards.",
        "Deleting the directory and syncing again is a legitimate repair.",
      ]],
      ["uv pip install", "Use uv's pip-compatible interface when managing an environment outside the project workflow.", [
        "The pip-compatible surface helps when migrating an existing workflow gradually.",
        "It installs into the environment without touching the manifest or the lockfile.",
        "Anything installed this way disappears at the next exact sync.",
      ]],
      ["uv pip compile and sync", "Resolve requirements files and synchronize a compatible environment from their pinned output.", [
        "Compiling turns a loose requirements file into a fully pinned one.",
        "Pin per target platform, since one file cannot describe every environment.",
        "This path suits deployment tooling that cannot read the project lockfile.",
      ]],
      ["Platform markers", "Declare dependencies that apply only to specific Python versions or operating systems.", [
        "A marker attaches a dependency to a Python version or an operating system.",
        "Markers are evaluated at install time, so one lockfile covers several targets.",
        "They keep a Windows-only or GPU-only package out of environments that cannot use it.",
      ]],
    ],
    "Resolution & workspaces": [
      ["Locked versus frozen", "Use --locked to reject manifest drift; --frozen skips checking whether the lock matches current metadata.", [
        "Freshness checking fails the command when the lock no longer matches the manifest.",
        "Skipping that check installs the lock as it stands, drift included.",
        "CI wants the checking form, so a stale lock is caught in review rather than production.",
      ]],
      ["Dependency upgrades", "Upgrade selected dependencies deliberately and review transitive changes in the lockfile.", [
        "Upgrade one package at a time so a regression has an obvious cause.",
        "The lockfile diff shows the transitive moves the upgrade dragged along.",
        "A full re-resolution is a separate, deliberate change rather than a side effect.",
      ]],
      ["Constraints and overrides", "Distinguish restricting allowed versions from replacing a dependency's declared requirement.", [
        "A constraint narrows the versions the resolver may pick but adds no dependency.",
        "An override replaces what a package declares, which can produce an unsupported combination.",
        "Reach for an override only to work around a wrong upstream pin, and record why.",
      ]],
      ["Package indexes", "Configure index priority and authentication without enabling dependency-confusion paths.", [
        "Index order decides which source wins when a name exists in more than one.",
        "An unpinned private name on a public index is the dependency-confusion risk.",
        "Keep credentials in the environment or a keyring rather than in the manifest.",
      ]],
      ["Git and path dependencies", "Reference a source revision or local package with an explicit reproducibility strategy.", [
        "A git dependency should name a tag or a commit, never a moving branch.",
        "A path dependency is for a sibling package in the same checkout.",
        "Neither is reproducible for consumers once the package is published.",
      ]],
      ["Workspace members", "Resolve a multi-package workspace together while choosing which member to run or sync.", [
        "A workspace resolves every member together against one shared lockfile.",
        "Members depend on each other by name and pick up local changes immediately.",
        "Commands take a package flag to sync or run inside one member.",
      ]],
      ["Editable installations", "Use editable source during development and verify the built distribution separately.", [
        "An editable install points at the source tree, so edits take effect without reinstalling.",
        "It hides packaging mistakes, because files outside the distribution still import.",
        "Build a wheel and install it once before release to check what is actually shipped.",
      ]],
      ["Lockfile export", "Export a supported format when another deployment tool cannot consume uv.lock directly.", [
        "Export produces a requirements file for a platform that cannot read the lock.",
        "The export is generated output and belongs in the build, not in the repository.",
        "It flattens the resolution, so the markers and hashes it keeps matter.",
      ]],
    ],
    "Tools & delivery": [
      ["uvx and uv tool run", "Run a Python CLI in an isolated tool environment rather than adding it to application dependencies.", [
        "A tool runs from its own ephemeral environment and never enters the project.",
        "This keeps a formatter or a generator out of the application dependency graph.",
        "Pin the tool version in automation so a release cannot change the output.",
      ]],
      ["uv tool install", "Install a persistent user-level CLI and understand where its executable is exposed.", [
        "An installed tool is available on the path for every project on the machine.",
        "Each tool keeps its own isolated environment, so two tools cannot conflict.",
        "The executable directory has to be on the path or the command appears missing.",
      ]],
      ["Script metadata", "Declare a standalone script's dependencies using supported inline metadata.", [
        "Inline metadata lets a single file declare the packages it needs.",
        "The script becomes runnable on any machine with no project and no manual install.",
        "uv builds a cached environment for the script on its first run.",
      ]],
      ["uv build", "Produce source and wheel distributions and inspect what files are actually packaged.", [
        "The build produces a source distribution and a wheel into a dist directory.",
        "Inspect the archive: a missing data file or an accidental test package shows up there.",
        "Packaging configuration, not the working tree, decides what is included.",
      ]],
      ["uv publish", "Publish an already-built distribution using scoped credentials and a deliberate target index.", [
        "Publish uploads artifacts that were already built, so build and release stay separate.",
        "Use a token scoped to one project rather than an account-wide credential.",
        "Upload to a test index first, because a released version can never be reused.",
      ]],
      ["uv in Docker", "Cache dependency installation separately from application source and avoid copying local virtual environments.", [
        "Copy the manifest and lock, install, then copy the source so the layer caches.",
        "Never copy a host virtual environment into an image; its paths do not transfer.",
        "A multi-stage build keeps compilers out of the runtime image.",
      ]],
      ["uv in CI", "Pin the tool and interpreter, restore compatible caches and fail on stale lockfiles.", [
        "Pin both the uv version and the interpreter so a runner update changes nothing.",
        "Cache the uv download cache rather than the environment directory itself.",
        "Fail the job on a stale lock instead of resolving fresh versions during a build.",
      ]],
      ["Cache management", "Inspect and prune cache data without confusing it with the project's declared dependencies.", [
        "The cache is shared across projects and is safe to delete at any time.",
        "Pruning removes entries nothing references any more, unlike a full clear.",
        "A corrupted entry shows up as a strange install error and clears with a prune.",
      ]],
    ],
  }),
  defineHandbook("Redis caching solutions", "Cache strategies, data structures, consistency, expiration, clustering, persistence and production diagnostics.", "https://redis.io/docs/latest/", {
    mechanism: "Redis stores keyed data with operations tailored to each data type. A cache sits beside a source of truth; its key design, lifetime and invalidation policy determine whether reads are both fast and correct.",
    example: "For a product lookup, read product:42 from Redis. On a miss, load the database row and cache it with a TTL. After an update, invalidate or replace the cached value and test concurrent readers.",
    pitfall: "A TTL limits how long stale data may survive; it does not prove read-after-write consistency. Include tenant and authorization scope in keys and prevent a cache miss storm from overwhelming the database.",
  }, {
    "Client hooks & events": [
      ["Client error events", "Attach an error listener at creation: an unhandled client error can take the process down.", [
        "Attach the client's error listener before initiating a connection.",
        "Record the operation context without logging credentials.",
        "Treat error notifications separately from per-command promise failures.",
      ]],
      ["Connection lifecycle events", "connect, ready, reconnecting and end are the states a pool's health check should read.", [
        "Distinguish connecting, ready, reconnecting and closed states.",
        "Gate operations on the readiness guarantees of the chosen client.",
        "Release listeners and connections during application shutdown.",
      ]],
      ["Reconnect strategy", "Supply a backoff function so a flapping server is not hammered by every instance at once.", [
        "Use bounded exponential reconnect delay with jitter.",
        "Avoid a tight retry loop during a Redis outage.",
        "Decide whether queued commands remain valid after reconnection.",
      ]],
      ["reconnectOnError", "Decide per error whether the client should reconnect, for cases such as a failed-over replica.", [
        "Use reconnectOnError only with a client that supports it.",
        "Select the server errors that justify reconnecting deliberately.",
        "Consider duplicate writes before automatically resending a failed command.",
      ]],
      ["Keyspace notifications", "Subscribe to expiry and eviction events instead of polling for keys that vanished.", [
        "Enable only the notification classes the application needs.",
        "Subscribe to the correct database and event channels.",
        "Notifications are ephemeral and cannot replace a durable event log.",
      ]],
      ["Client-side cache invalidation", "CLIENT TRACKING pushes invalidation messages so a local cache can drop a stale entry.", [
        "Enable tracking with a client and server that support it.",
        "Remove local entries when invalidation messages arrive.",
        "Define recovery behavior when the invalidation connection is lost.",
      ]],
      ["Pub/Sub message handlers", "A subscriber connection cannot run ordinary commands, which shapes how handlers are wired.", [
        "Use a dedicated subscription connection where the client requires one.",
        "Keep message handlers fast and catch processing failures.",
        "Resubscribe after reconnecting without assuming missed messages are replayed.",
      ]],
      ["Server-side scripts as hooks", "A Lua script or function runs atomically on the server, where a read-modify-write would race.", [
        "Execute bounded Lua scripts or registered functions near the data.",
        "Pass accessed keys explicitly for cluster-aware execution.",
        "Avoid slow scripts that block other server work.",
      ]],
    ],
    "Redis foundations": [
      ["Keys and namespacing", "Design stable keys that include entity and tenant boundaries; distinguish missing keys from empty values.", [
        "Include application, tenant and data purpose in key names.",
        "Choose a predictable version suffix when payload shape changes.",
        "Use SCAN rather than blocking key enumeration in production.",
      ]],
      ["Strings and counters", "Store byte strings and use atomic increments for counters instead of client-side read-modify-write.", [
        "Use GET and SET for byte strings or serialized values.",
        "Use atomic INCR operations for counters.",
        "Set expiry explicitly when a counter belongs to a time window.",
      ]],
      ["Hashes", "Group named fields for an entity and compare field-level updates with replacing one serialized value.", [
        "Store related fields in one hash when partial updates are useful.",
        "Read or update only the fields the operation needs.",
        "Bound hash size and avoid mixing unrelated ownership scopes.",
      ]],
      ["Lists", "Use ordered sequences for suitable queue-like patterns while checking reliability requirements.", [
        "Push and pop values from the intended end of the list.",
        "Use blocking operations carefully with dedicated worker connections.",
        "Prefer streams when acknowledgements and durable consumer tracking are needed.",
      ]],
      ["Sets", "Represent unique membership and use set operations when order is irrelevant.", [
        "Use sets for unique membership and set operations.",
        "Check membership without downloading the entire set.",
        "Watch memory growth when storing unbounded user-generated values.",
      ]],
      ["Sorted sets", "Associate members with scores for ranking, scheduling and bounded range queries.", [
        "Associate each unique member with a numeric ordering score.",
        "Query bounded score or rank ranges for leaderboards.",
        "Define tie-breaking and pagination behavior explicitly.",
      ]],
      ["Streams", "Store append-oriented event records and track consumer progress with the supported stream mechanisms.", [
        "Append events with ordered stream IDs.",
        "Use consumer groups and acknowledge completed processing.",
        "Inspect pending entries and reclaim abandoned work.",
      ]],
      ["JSON and search capabilities", "Check the deployed Redis capabilities before relying on document storage or secondary search features.", [
        "Check which JSON and search features the deployment supports.",
        "Define indexes around actual query and filter patterns.",
        "Measure write amplification and index memory separately from cached values.",
      ]],
    ],
    "Caching patterns": [
      ["Cache-aside", "Load the source of truth on a miss, populate Redis and define how writes invalidate cached values.", [
        "Read the cache before loading from the source database.",
        "Populate misses with a bounded TTL.",
        "Invalidate or refresh entries after authoritative writes.",
      ]],
      ["Read-through caching", "Place retrieval logic behind a cache abstraction so callers use one read contract.", [
        "Use a cache layer that loads missing values on behalf of callers.",
        "Keep the loader's errors distinct from a valid missing record.",
        "Coalesce concurrent loads for the same key.",
      ]],
      ["Write-through caching", "Coordinate source writes and cache updates and document what happens when one succeeds and the other fails.", [
        "Update the cache as part of the application's write path.",
        "Define recovery when the database write and cache update disagree.",
        "Keep the database as the explicit authority unless designed otherwise.",
      ]],
      ["Write-behind tradeoffs", "Buffer writes only when delayed persistence and potential loss match the business requirements.", [
        "Buffered writes reduce immediate database pressure.",
        "A crash can lose unflushed updates without durable buffering.",
        "Define ordering, flush retries and acceptable data-loss bounds.",
      ]],
      ["TTL and expiration", "Set expiry according to freshness requirements and understand that eviction is a separate mechanism.", [
        "Apply TTLs that match freshness and retention requirements.",
        "Redis expiration removes a key rather than refreshing its content.",
        "Add jitter when many keys would expire together.",
      ]],
      ["Cache invalidation", "Invalidate affected keys after changes without overlooking derived lists or aggregate views.", [
        "Invalidate keys affected by the committed domain change.",
        "Use versioned keys when enumerating dependent entries is impractical.",
        "Test races between stale loaders and fresh writes.",
      ]],
      ["Cache stampede", "Use request coalescing, jitter or controlled regeneration when many readers miss simultaneously.", [
        "Coalesce concurrent requests for the same missing value.",
        "Use bounded locks or single-flight loading to protect the database.",
        "Spread expirations and consider serving an acceptable stale value.",
      ]],
      ["Negative caching", "Cache absent results briefly when useful, with safeguards against hiding newly created data.", [
        "Cache confirmed absence for a shorter, deliberate lifetime.",
        "Distinguish not-found from authorization and dependency failures.",
        "Invalidate negative entries when the resource is created.",
      ]],
      ["Stale-while-revalidate", "Serve bounded stale data while refreshing when the product can tolerate temporary staleness.", [
        "Serve an acceptable cached value while refreshing asynchronously.",
        "Track fresh and stale windows separately.",
        "Stop serving stale data when its correctness window expires.",
      ]],
      ["Hot keys and large values", "Identify skewed traffic and oversized payloads before simply adding more capacity.", [
        "Measure key access skew and serialized payload size.",
        "Split oversized records or cache a smaller projection.",
        "Protect a hot key from concentrating all traffic on one shard.",
      ]],
    ],
    "Atomicity & messaging": [
      ["Pipelining", "Reduce network round trips for independent commands without assuming the batch becomes a transaction.", [
        "Batch independent commands to reduce network round trips.",
        "Inspect each returned result for command-level errors.",
        "Pipelining does not make the group atomic.",
      ]],
      ["MULTI, EXEC and WATCH", "Use Redis transactions and optimistic checks with an explicit response to concurrent modification.", [
        "Queue commands with MULTI and execute them with EXEC.",
        "Use WATCH to detect concurrent changes before committing.",
        "Redis transactions do not provide automatic rollback of runtime errors.",
      ]],
      ["Lua scripts and functions", "Move bounded atomic logic to the server without blocking it with expensive computation.", [
        "Keep server-side logic small and deterministic.",
        "Use atomic scripts for read-modify-write sequences.",
        "Bound loops and data sizes to avoid blocking the Redis server.",
      ]],
      ["Locks and leases", "Use unique ownership tokens and bounded leases; design for expiry while work is still running.", [
        "Acquire a lease with a unique ownership token and expiry.",
        "Release only when the stored token still matches the owner.",
        "Use fencing when stale owners could corrupt external resources.",
      ]],
      ["Pub/Sub", "Use transient broadcasting only where missed messages are acceptable or handled separately.", [
        "Publish messages to channels for currently connected subscribers.",
        "Disconnected consumers do not receive a durable replay.",
        "Choose streams or a queue when delivery tracking is required.",
      ]],
      ["Rate limiting", "Choose fixed-window, sliding-window or token-bucket semantics and update the state atomically.", [
        "Combine counters or sorted sets with an appropriate time window.",
        "Make quota evaluation and updates atomic.",
        "Scope keys to the authenticated subject and protected operation.",
      ]],
    ],
    "Redis operations": [
      ["Memory limits and eviction", "Select a maxmemory policy that fits the workload and monitor rejected writes or eviction churn.", [
        "Set maxmemory and an eviction policy that fits the workload.",
        "Distinguish cache eviction from durability requirements.",
        "Monitor memory fragmentation and rejected writes near capacity.",
      ]],
      ["RDB and AOF persistence", "Compare snapshot and append-log recovery tradeoffs instead of assuming in-memory data is durable.", [
        "RDB snapshots and AOF logs have different recovery trade-offs.",
        "Configure persistence around acceptable data loss and restart time.",
        "Test restoring backups instead of assuming persistence is sufficient.",
      ]],
      ["Replication and failover", "Understand replica lag and how failure recovery can affect recently acknowledged writes.", [
        "Replicas can lag behind the primary's acknowledged writes.",
        "Plan client reconnection and role discovery after failover.",
        "Understand that failover can lose writes not replicated in time.",
      ]],
      ["Sentinel", "Use monitoring and failover coordination for the supported primary-replica topology.", [
        "Sentinel monitors a non-clustered Redis primary and replicas.",
        "Configure quorum and independent Sentinel instances.",
        "Use Sentinel-aware clients to discover the current primary.",
      ]],
      ["Redis Cluster and hash slots", "Partition keys and account for cross-slot restrictions when designing multi-key operations.", [
        "Redis Cluster partitions keys across 16,384 hash slots.",
        "Use hash tags when related multi-key operations need one slot.",
        "Handle redirection and topology changes with a cluster-aware client.",
      ]],
      ["Connections and pooling", "Bound connection counts and choose clients appropriate to serverless or long-lived runtimes.", [
        "Reuse connections according to the client and deployment model.",
        "Isolate blocking or subscription workloads when required.",
        "Bound connection counts in serverless or highly concurrent applications.",
      ]],
      ["ACLs and TLS", "Restrict commands, key patterns and network access for each application identity.", [
        "Restrict users to required commands and key patterns.",
        "Encrypt transport and verify the server's certificate.",
        "Rotate credentials without exposing them in application logs.",
      ]],
      ["Slow log and latency analysis", "Separate command cost, network delay and connection saturation when diagnosing a slow cache.", [
        "Inspect slow commands alongside application-observed latency.",
        "Check payload size, blocking scripts and network delays.",
        "Profile representative workloads before changing server capacity.",
      ]],
    ],
  }),
  defineHandbook("Zod validation libraries", "Runtime schemas, TypeScript inference, transformations, errors, forms, API boundaries and schema composition.", "https://zod.dev/", {
    mechanism: "A Zod schema checks untrusted runtime values and produces a typed result. TypeScript types disappear at runtime, so an external request still needs parsing even when its expected type is declared.",
    example: "Define an object with an email and a positive integer quantity, call safeParse on the request body, return field errors when success is false, and pass only the parsed data to the service.",
    pitfall: "Validation is not authorization. Coercion can turn unexpected input into a valid-looking value, and transforms can make input and output types differ; test those boundaries explicitly.",
  }, {
    "Zod foundations": [
      ["Runtime validation vs TypeScript", "Validate external values at runtime instead of relying on a type assertion that performs no check.", [
        "Types are erased at build time and check nothing about a real request body.",
        "A cast tells the compiler what to assume; a schema tells the program what arrived.",
        "Parse at every boundary: request bodies, query strings, storage reads and third-party responses.",
      ]],
      ["parse and safeParse", "Choose exception-based parsing or a discriminated success result according to the surrounding error flow.", [
        "parse throws on failure, which suits code already wrapped in an error handler.",
        "safeParse returns a success flag with either the data or the issues, and never throws.",
        "A route that renders field errors wants the result object, not an exception.",
      ]],
      ["parseAsync and safeParseAsync", "Await parsing when refinements or transformations perform asynchronous work.", [
        "Any schema with an async check has to be awaited or it throws at parse time.",
        "A uniqueness lookup against the database is the usual reason to go async.",
        "Keep async work out of a schema used on the hot path of a render.",
      ]],
      ["z.infer, z.input and z.output", "Derive types from a schema and distinguish accepted input from transformed output.", [
        "One schema is the single definition of both the check and the type.",
        "Input and output differ as soon as a transform or a default is involved.",
        "Type a function argument from the input and its result from the output.",
      ]],
      ["Strings and formats", "Apply length, pattern and supported format constraints according to the actual domain contract.", [
        "Length and pattern rules belong on the schema, not scattered through handlers.",
        "Built-in formats cover email, URL, UUID and datetime without hand-written patterns.",
        "Trim before checking length, or a padded value passes a rule it should fail.",
      ]],
      ["Numbers and coercion", "Reject invalid numeric values and test how empty strings or booleans behave under conversion.", [
        "A JSON number arrives typed; a query string or form field never does.",
        "Coercion accepts anything convertible, so an empty string can become zero.",
        "Bound the value with min, max and integer rules after converting it.",
      ]],
      ["Booleans, literals and enums", "Model a finite allowed set rather than accepting arbitrary strings for a controlled field.", [
        "An enum narrows to exactly the members the code has branches for.",
        "A literal pins one value, which is what makes a tagged variant work.",
        "A checkbox posts a string, so a boolean field needs an explicit mapping.",
      ]],
      ["Optional, nullable and nullish", "Distinguish an absent value from an explicit null and decide which the API permits.", [
        "Optional allows the key to be absent; nullable allows it to be present and null.",
        "A patch endpoint needs that distinction to tell skip from clear.",
        "Nullish accepts both and is right only when the two truly mean the same thing.",
      ]],
    ],
    "Schema composition": [
      ["Object schemas", "Validate a structured record and choose how unknown properties should be handled.", [
        "An object schema validates each known key and reports issues by path.",
        "Unknown keys are stripped by default, so parsed output carries no extras.",
        "Nest schemas to mirror the shape of the payload rather than flattening it.",
      ]],
      ["Strict and loose objects", "Reject or preserve extra keys deliberately at public request boundaries.", [
        "A strict object rejects unknown keys, which catches a renamed client field early.",
        "A passthrough object keeps extras, useful when forwarding a payload untouched.",
        "Strict at a public ingress point; permissive when wrapping a partner response.",
      ]],
      ["Arrays and tuples", "Distinguish a repeated element type from a fixed positional contract.", [
        "An array checks every element against one schema and can bound its length.",
        "A tuple fixes the length and gives each position its own schema.",
        "Validating a large array on every request is a real cost worth measuring.",
      ]],
      ["Records, maps and sets", "Model keyed collections and unique collections with validation of their contained values.", [
        "A record validates keys and values when the key names are not known ahead of time.",
        "Map and Set schemas check the collection type itself, not just its contents.",
        "A record with an unbounded key space is a place to impose a size limit.",
      ]],
      ["Unions", "Accept one of several explicit input shapes and provide meaningful errors for unmatched input.", [
        "A union tries each member and fails only when none matches.",
        "The error lists every branch, which reads poorly for more than a few members.",
        "Order matters when members overlap, because the first match wins.",
      ]],
      ["Discriminated unions", "Use a literal tag to select a variant and simplify downstream type narrowing.", [
        "A shared literal key selects one branch instead of trying them all.",
        "Errors come from the matched variant, so the message points at the real problem.",
        "Parsing stays fast because only one member is ever evaluated.",
      ]],
      ["Intersections", "Combine compatible requirements while understanding how the resulting values are merged.", [
        "An intersection requires a value to satisfy both schemas at once.",
        "Conflicting requirements make a schema nothing can satisfy, with no warning.",
        "Extending an object is usually clearer than intersecting two of them.",
      ]],
      ["pick, omit and partial", "Derive related object contracts without accidentally weakening required production checks.", [
        "Derive a narrower contract from the canonical schema rather than restating it.",
        "A partial schema suits a patch body where every field is genuinely optional.",
        "Partial applied to a create schema quietly drops the checks that mattered.",
      ]],
      ["extend and schema reuse", "Compose fields from shared contracts and avoid incompatible overrides.", [
        "Extend adds fields and can also replace one, which silently relaxes it.",
        "Keep shared field definitions in one place so a rule changes once.",
        "A base schema plus per-endpoint extensions beats one schema with everything optional.",
      ]],
      ["Recursive schemas", "Describe nested structures with explicit recursion and realistic size or depth limits.", [
        "A self-referencing schema needs a lazy wrapper or the definition cannot close.",
        "Annotate the type by hand, since inference cannot resolve the cycle alone.",
        "Cap the depth, or a deliberately nested payload becomes a denial of service.",
      ]],
    ],
    "Rules & transformations": [
      ["refine and superRefine", "Express domain rules that primitive constraints cannot represent and attach issues to useful paths.", [
        "refine adds one predicate with one message to an already-parsed value.",
        "superRefine can add several issues and attach each to its own path.",
        "Refinements run only after the base checks pass, so ordering is predictable.",
      ]],
      ["Cross-field validation", "Validate relationships such as matching passwords or a start date preceding an end date.", [
        "A rule spanning two fields belongs on the object, not on either field.",
        "Attach the issue to the field the user must change, not to the object root.",
        "Confirm-password and date-range checks are the cases that come up first.",
      ]],
      ["Transforms", "Convert accepted values into application-ready output while tracking the changed output type.", [
        "A transform reshapes the value after validation, so output stops matching input.",
        "Normalising a string or splitting a name is a transform, not a check.",
        "A transformed schema can no longer be used to validate its own output.",
      ]],
      ["Preprocessing", "Normalize raw input before validation only when the normalization is part of the intended contract.", [
        "Preprocessing runs before validation and can convert a value into a valid one.",
        "Use it for genuine normalisation such as trimming, never to paper over bad input.",
        "A preprocessor that swallows errors makes failures impossible to diagnose.",
      ]],
      ["Pipelines and codecs", "Compose validation and conversion stages, checking support in the installed Zod release.", [
        "A pipeline feeds one schema output into the next schema input.",
        "It keeps a parse step and a domain check separate rather than merged into one refine.",
        "Support differs between releases, so confirm what the installed version offers.",
      ]],
      ["Defaults and fallbacks", "Distinguish a value supplied for missing input from recovery after invalid input.", [
        "A default fills in a missing value before validation runs.",
        "A fallback replaces the result after validation fails, hiding the failure.",
        "A fallback on a security-relevant field turns bad input into a valid request.",
      ]],
      ["Branded and readonly types", "Add type-level distinctions while understanding what runtime guarantees are actually enforced.", [
        "A brand separates a validated identifier from any other string in the type system.",
        "The brand exists only at compile time and costs nothing at runtime.",
        "Readonly stops accidental mutation in code but does not freeze the object.",
      ]],
      ["Metadata and JSON Schema", "Export schema descriptions where supported and inspect how non-JSON transformations are represented.", [
        "Descriptions carried on a schema can generate documentation from the same source.",
        "Export to JSON Schema only covers constructs that format can express.",
        "A transform has no JSON Schema equivalent and is dropped from the export.",
      ]],
    ],
    "Validation integration": [
      ["Error formatting", "Turn structured issues into field and form errors without discarding nested paths.", [
        "Every issue carries a path, so a nested failure can reach the right input.",
        "Flatten for a simple form; walk the tree when fields are nested or repeated.",
        "Collect all issues rather than showing the user one mistake at a time.",
      ]],
      ["Custom error messages", "Give precise corrective feedback while avoiding disclosure of sensitive internal constraints.", [
        "A message written for the field beats a generic type complaint.",
        "Say what is required, not what the internal rule is called.",
        "Do not leak limits or internal names that reveal how the backend is built.",
      ]],
      ["FormData validation", "Handle strings, repeated fields and files before assuming browser form values match domain types.", [
        "Every form value arrives as a string, including numbers and checkboxes.",
        "A repeated field name yields several entries that must be collected into an array.",
        "A file input needs size and type checks before anything touches storage.",
      ]],
      ["API request and response schemas", "Validate ingress and assert egress contracts without exposing private database fields.", [
        "Validate ingress so a handler never works on an unchecked shape.",
        "Parse the response too, so an internal field cannot leak into the payload.",
        "Sharing the schema with the client keeps both ends on one contract.",
      ]],
      ["Environment validation", "Fail early on missing server settings while preventing secrets from entering public client configuration.", [
        "Check configuration once at startup rather than at first use.",
        "A missing setting should stop the process, not surface as a runtime failure later.",
        "Keep server settings in a schema the client bundle never imports.",
      ]],
      ["Schema testing and migration", "Test valid, invalid and boundary cases before changing a contract used by existing clients.", [
        "Test the boundaries: empty, maximum length, wrong type and extra keys.",
        "Tightening a live schema rejects payloads that used to work, so stage it.",
        "Accept both shapes during a migration window, then drop the old one.",
      ]],
    ],
  }),
];
