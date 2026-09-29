import { defineHandbook } from "./shared";

/**
 * System design, taught as trade-offs rather than as a component catalogue.
 *
 * The interview version of this subject rewards naming a queue; the useful
 * version explains what the queue costs. Each topic is therefore phrased around
 * the decision being made and what is given up, because a design with no stated
 * trade-off is a design nobody has finished thinking about.
 */
export const SYSTEM_DESIGN_HANDBOOKS = [
  defineHandbook("System Design", "Requirements, estimation, data modelling, scaling, consistency, reliability and the interview itself.", "https://aws.amazon.com/builders-library/", {
    mechanism: "A design is a sequence of trade-offs under stated constraints. Read volume, write volume, consistency needs and acceptable downtime determine the architecture; without those numbers every component choice is arbitrary.",
    example: "A URL shortener is read-heavy by roughly a thousand to one, so reads are cached aggressively and writes go to a single authoritative store. Reversing that ratio would change the storage engine, the cache strategy and the partitioning scheme.",
    pitfall: "Naming components before establishing requirements produces a design that cannot be evaluated. Scale is also not free: sharding, caching and queues each add failure modes, and adding them to a system that does not need them is a cost with no benefit.",
  }, {
    "Framing the problem": [
      ["Functional requirements", "Agree what the system must do before choosing anything to do it with.", [
        "List the concrete actions users and external systems perform.",
        "Identify the main inputs, outputs and success conditions.",
        "Prioritize the core flow before adding secondary features.",
      ]],
      ["Non-functional requirements", "State latency, availability, durability and consistency targets explicitly.", [
        "State latency, availability, durability and privacy targets explicitly.",
        "Define how each requirement will be measured.",
        "Distinguish mandatory constraints from desirable improvements.",
      ]],
      ["Back-of-envelope estimation", "Size traffic, storage and bandwidth well enough to choose between options.", [
        "Estimate requests, storage and bandwidth with visible assumptions.",
        "Separate average traffic from expected peak load.",
        "Check orders of magnitude before choosing infrastructure.",
      ]],
      ["Read and write ratios", "Let the dominant access pattern drive the architecture.", [
        "Estimate reads and writes for each important operation.",
        "Account for fan-out, background work and cache misses.",
        "Use the ratio to guide indexing and replica choices.",
      ]],
      ["Constraints and assumptions", "Write down what you are assuming so it can be challenged.", [
        "Record limits imposed by budget, region, team and existing systems.",
        "Mark uncertain assumptions and their effect on the design.",
        "Revisit assumptions when requirements or measurements change.",
      ]],
      ["Scoping", "Cut the problem to what fits the time, and say what you cut.", [
        "Choose the use cases the first version must support.",
        "Declare excluded features so capacity estimates stay meaningful.",
        "Design extension points only for plausible next requirements.",
      ]],
    ],
    "Data": [
      ["Relational versus non-relational", "Choose by access pattern and consistency need, not by familiarity.", [
        "Choose storage around query patterns and transaction needs.",
        "Relational models support constraints and joined relationships.",
        "Non-relational choices trade flexible access patterns against other guarantees.",
      ]],
      ["Schema design", "Model entities and relationships for the queries that will actually run.", [
        "Model entities, relationships and ownership boundaries first.",
        "Encode uniqueness and integrity constraints where possible.",
        "Plan how schema changes coexist with older application versions.",
      ]],
      ["Indexing", "Speed reads deliberately and pay for it on writes.", [
        "Build indexes for frequent filters, joins and ordering.",
        "Measure their effect on write cost and storage size.",
        "Inspect query plans instead of indexing every column.",
      ]],
      ["Partitioning and sharding", "Split data by a key that spreads load without splitting transactions.", [
        "Choose a partition key with balanced load and locality.",
        "Plan for hot partitions and future resharding.",
        "Identify operations that become cross-shard transactions.",
      ]],
      ["Replication", "Copy data for availability and read scale, and accept the lag.", [
        "Replicate data to meet availability and read-capacity goals.",
        "Specify how lag affects user-visible reads.",
        "Test failover, promotion and recovery of a former primary.",
      ]],
      ["Denormalization", "Duplicate data to avoid a join, and own the update problem it creates.", [
        "Duplicate data only to serve a clear read requirement.",
        "Define which record is authoritative when copies disagree.",
        "Plan propagation and repair of derived representations.",
      ]],
    ],
    "Scaling & performance": [
      ["Vertical and horizontal scaling", "Know which one a bottleneck actually responds to.", [
        "Vertical scaling increases one node's resources.",
        "Horizontal scaling spreads work across additional nodes.",
        "Identify shared-state bottlenecks before adding replicas.",
      ]],
      ["Load balancing", "Distribute traffic and handle an unhealthy instance.", [
        "Distribute requests only to healthy eligible backends.",
        "Choose routing around connection length and state affinity.",
        "Account for graceful draining during deployment and scale-down.",
      ]],
      ["Caching strategies", "Choose cache-aside, write-through or write-behind for the consistency you need.", [
        "Cache expensive results close to their consumers.",
        "Define ownership, freshness and acceptable miss behavior.",
        "Measure hit rate alongside origin load and response latency.",
      ]],
      ["Cache invalidation", "Decide what makes an entry stale before you add the cache.", [
        "List every write that makes a cached value obsolete.",
        "Coordinate invalidation with the authoritative commit.",
        "Use versioning or TTLs when dependency tracking is too expensive.",
      ]],
      ["Content delivery networks", "Serve static and cacheable content close to the reader.", [
        "Serve cacheable content from locations near users.",
        "Configure cache keys and headers to avoid leaking private variants.",
        "Plan purge and versioned-asset behavior for updates.",
      ]],
      ["Asynchronous processing", "Move slow work off the request path with a queue.", [
        "Move slow work into a durable queue or workflow.",
        "Define acknowledgement, retry and duplicate-processing semantics.",
        "Expose progress when users depend on eventual completion.",
      ]],
    ],
    "Distributed systems": [
      ["CAP and PACELC", "Reason about what a partition forces you to give up, and the latency cost otherwise.", [
        "During a partition, CAP concerns consistency versus availability.",
        "PACELC also considers latency versus consistency without a partition.",
        "Apply the trade-off to a specific operation and guarantee.",
      ]],
      ["Consistency models", "Distinguish strong, eventual and read-your-writes consistency.", [
        "Define whether reads require linearizable, causal or eventual behavior.",
        "Specify read-your-writes expectations for user workflows.",
        "Test anomalies the chosen model intentionally permits.",
      ]],
      ["Consensus", "Understand where leader election and quorum are required.", [
        "Use consensus to agree on a replicated sequence of decisions.",
        "Account for quorum availability and network communication costs.",
        "Prefer established implementations over custom consensus protocols.",
      ]],
      ["Idempotency", "Make a retried operation converge on one outcome.", [
        "Associate repeated attempts with one stable operation identifier.",
        "Atomically record accepted work and its result.",
        "Return the existing outcome when a duplicate request arrives.",
      ]],
      ["Distributed transactions", "Prefer sagas and compensation over two-phase commit.", [
        "Choose atomic commitment or compensating workflows deliberately.",
        "Understand blocking and coordinator risks in two-phase commit.",
        "Make saga compensation explicit for externally visible side effects.",
      ]],
      ["Clock and ordering problems", "Avoid depending on synchronized wall clocks for correctness.", [
        "Wall-clock timestamps can disagree across machines.",
        "Use logical ordering or versions where causal order matters.",
        "Avoid resolving every write conflict by untrusted client time.",
      ]],
    ],
    "Reliability & operations": [
      ["Failure modes", "Enumerate what breaks and what each failure takes down with it.", [
        "Consider crashes, slow responses and partial dependency outages.",
        "Specify detection, containment and recovery for each failure.",
        "Include correlated failures such as a regional outage.",
      ]],
      ["Timeouts and retries", "Bound every call and retry with backoff and jitter.", [
        "Set timeouts from the caller's total latency budget.",
        "Retry only operations whose duplicate execution is controlled.",
        "Use jitter and retry limits to avoid amplifying overload.",
      ]],
      ["Circuit breakers and bulkheads", "Stop a failing dependency from consuming the whole system.", [
        "Open a circuit after a defined pattern of dependency failures.",
        "Isolate resources so one failing workload cannot exhaust all capacity.",
        "Probe recovery before restoring normal traffic volume.",
      ]],
      ["Rate limiting and backpressure", "Shed load deliberately instead of collapsing under it.", [
        "Limit arrivals before overloaded services exhaust resources.",
        "Apply backpressure through bounded queues or rejection.",
        "Scope quotas fairly across users and tenants.",
      ]],
      ["Observability", "Design metrics, logs and traces before the incident needs them.", [
        "Connect metrics, logs and traces with request identifiers.",
        "Monitor user-facing objectives as well as host health.",
        "Make alerts actionable with ownership and diagnostic context.",
      ]],
      ["Capacity and cost", "Know the cost per request and where it grows non-linearly.", [
        "Estimate peak compute, storage and network usage separately.",
        "Include replication, backups and operational overhead in costs.",
        "Set headroom based on measured growth and failure scenarios.",
      ]],
    ],
    "Working through a design": [
      ["Clarifying questions", "Turn an open prompt into a bounded problem.", [
        "Ask about scale, main workflows and required guarantees.",
        "Resolve ambiguous consistency and latency expectations early.",
        "Record answers that change major architectural choices.",
      ]],
      ["High-level diagram", "Sketch components and data flow before detailing any one of them.", [
        "Show clients, service boundaries, stores and asynchronous paths.",
        "Label data flow and the responsibilities of major components.",
        "Keep enough detail to explain one complete request.",
      ]],
      ["Deep dive", "Choose the riskiest component and design it properly.", [
        "Choose the subsystem carrying the largest risk or scale burden.",
        "Explain its data model, algorithms and failure behavior.",
        "Tie each mechanism back to a stated requirement.",
      ]],
      ["Identifying bottlenecks", "Find what saturates first and say what you would do about it.", [
        "Estimate the capacity of each step in the critical path.",
        "Look for hot keys, serial work and shared dependencies.",
        "Validate suspected limits with load tests and measurements.",
      ]],
      ["Stating trade-offs", "Justify each choice against the alternative you rejected.", [
        "Name the benefit and cost of each major decision.",
        "Compare credible alternatives under the same constraints.",
        "Explain which changed requirement would reverse the choice.",
      ]],
      ["Evolving the design", "Explain what changes when traffic grows by two orders of magnitude.", [
        "Begin with the smallest architecture that meets current needs.",
        "Define measurable triggers for splitting or scaling components.",
        "Plan migrations that preserve compatibility and rollback options.",
      ]],
    ],
  }),
];
