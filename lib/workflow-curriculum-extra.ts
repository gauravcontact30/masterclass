import type { WorkflowCurriculum, WorkflowTopic } from "./workflow-curriculum";

// Authored questions and answers, one distinct feature or design decision per row.
const topics = (rows: string): WorkflowTopic[] => rows.trim().split("\n").map(row => {
  const [title, question, answer] = row.split("|");
  return { title, question, answer };
});
const refs = (...entries: [string, string][]) => entries.map(([title, url]) => ({ title, url }));

export const WORKFLOW_CURRICULUM_EXTRA: Record<string, WorkflowCurriculum> = {
  "System Design": {
    topics: topics(`
Functional requirements|What should you clarify before drawing services?|Identify users, operations and success criteria. Separate essential behavior from optional features so the architecture solves a specific problem.
Nonfunctional requirements|How do constraints change an architecture?|Latency, availability, data residency and cost targets determine acceptable tradeoffs. Quantify them before choosing storage or communication patterns.
Peak versus average load|Why is average request volume insufficient?|Bursts can exceed capacity despite a low daily average. Estimate peak concurrency, burst duration and recovery behavior, then test those conditions.
Latency percentiles|Why discuss p99 rather than only average latency?|Averages hide slow requests. Tail latency exposes the experience of less fortunate users and becomes important when requests fan out across dependencies.
Availability versus durability|Can a durable system be unavailable?|Yes. Data may remain safely stored while requests fail. Availability concerns serving operations; durability concerns retaining acknowledged data despite failures.
CAP tradeoffs|What choice arises during a network partition?|A distributed system cannot guarantee both linearizable consistency and availability for every request during a partition. Discuss which operations may wait or fail.
Strong versus eventual consistency|Where is eventual consistency acceptable?|It can suit feeds and analytics where temporary staleness is tolerable. Inventory reservation or financial invariants may require stronger coordination.
SQL versus document storage|How do you choose a data model?|Start with access patterns, relationships and consistency needs. Relational constraints support cross-record invariants; document models can simplify aggregate-oriented reads.
Indexes and write amplification|Why not index every field?|Indexes accelerate selected reads but consume storage and add write work. Use query plans and workload measurements to justify each index.
Composite indexes|Why does column order matter?|Index order affects which predicates and ordering operations can use it efficiently. Design around actual query patterns rather than field popularity alone.
Transactions and isolation|Why can concurrent valid requests violate an invariant?|Each request may read stale intermediate information. Choose isolation, locking or constraints that protect the invariant across concurrent transactions.
Optimistic concurrency|How does version-based conflict detection work?|Read a version and update only if it still matches. A mismatch indicates concurrent modification and requires retry or conflict resolution.
Pessimistic locking|When might a lock be preferable?|Use controlled locking when contention makes repeated optimistic retries expensive. Keep transactions short and plan for deadlocks and timeouts.
Leader election|Why does failover need fencing?|An old leader may continue operating after losing authority. Fencing tokens let storage reject writes from stale leaders.
Quorum reads and writes|Does a quorum automatically guarantee linearizability?|No. Quorum overlap alone is insufficient; version ordering, failure handling and the replication protocol also determine the consistency guarantee.
Consistent hashing|Why use virtual nodes in consistent hashing?|Virtual nodes spread ownership more evenly and ease rebalancing when machines differ in capacity. They do not eliminate application-level hot keys.
Range partitioning|When is range sharding useful?|It supports ordered scans and locality. Sequential writes can concentrate traffic on the newest range, so splitting and placement need planning.
Read-through versus write-through|How do these cache strategies differ?|Read-through loads missing data through the cache layer. Write-through updates the backing store through that layer; failure and ordering semantics still matter.
Write-behind caching|What risk accompanies asynchronous persistence?|Acknowledged cache writes may be lost before reaching durable storage. Define durability expectations, recovery and ordering before using write-behind for important data.
Cache stampedes|How do you prevent simultaneous misses from overwhelming storage?|Coalesce requests for the same key, stagger expirations and consider serving bounded stale data during refresh. Protect the backing store with admission limits.
Negative caching|Why cache a missing result?|Repeated requests for nonexistent keys can burden storage. Cache absence briefly and invalidate appropriately when the resource is created.
CDN cache keys|How can a bad cache key leak personalized content?|If user-specific responses share a public cache key, another user may receive them. Separate public assets from authenticated or personalized responses.
DNS caching and failover|Why is changing DNS not instant failover?|Resolvers and clients cache records. Existing connections may persist, so failover planning must include TTLs, health checks and connection behavior.
L4 versus L7 balancing|What does application-aware balancing add?|L7 balancing can route using HTTP paths or headers. L4 operates at transport level, offering different performance and protocol tradeoffs.
Sticky sessions|What is the scaling cost of session affinity?|Affinity reduces flexibility when instances fail or workloads skew. External session storage makes moving requests between instances easier.
WebSockets versus server-sent events|Which fits one-way live updates?|Server-sent events support server-to-client HTTP streams. WebSockets support bidirectional messaging; choose based on traffic direction and infrastructure constraints.
Cursor pagination|Why prefer a cursor for a changing feed?|A stable ordering key avoids the shifting offsets caused by concurrent inserts. Define tie-breakers and consistency expectations for repeated page requests.
Unique ID generation|What tradeoffs exist between random and time-ordered IDs?|Random IDs distribute writes and avoid coordination but may reduce index locality. Time-ordered IDs improve locality while exposing ordering and requiring clock handling.
Deduplication windows|Can a short-lived deduplication cache guarantee permanent uniqueness?|No. A replay after expiry may repeat work. Keep a durable uniqueness constraint when the business requirement extends beyond the cache window.
Dead-letter queues|What should happen after repeated processing failure?|Quarantine the message with diagnostic context, alert an owner and provide a controlled replay path. Avoid endlessly recycling poison messages.
Ordering guarantees|Why partition messages by business entity?|Entity-based partitioning can preserve relevant order without serializing all traffic. Consumers must still handle retries and duplicates.
CQRS read models|Why separate read and write representations?|Each can match its workload independently. The cost is synchronization complexity and potentially stale read projections.
Event sourcing snapshots|Why snapshot an event-sourced aggregate?|Snapshots reduce reconstruction time by replaying only later events. Events remain the history, and snapshot formats require versioning.
Event schema evolution|How do old consumers survive new event fields?|Prefer compatible additive changes and explicit schema versions when semantics change. Test consumers against both older and newer payloads.
Saga compensation|Is compensation equivalent to rolling back a transaction?|No. It is another business operation and can fail. Some effects are irreversible, so model reconciliation and manual recovery explicitly.
Bulkheads|How do bulkheads contain an outage?|Separate resource pools or workloads so one failing dependency cannot consume all threads or connections. Size the isolation boundaries deliberately.
Load shedding|Why reject work before total saturation?|Controlled rejection preserves capacity for requests that can complete. Queuing indefinitely increases latency and can turn a small overload into a collapse.
Multi-region writes|Why are active-active writes difficult?|Concurrent updates can conflict during network delays or partitions. Define conflict resolution, ownership and invariants rather than assuming replication solves them.
Backup restoration|Why is a successful backup job insufficient?|The backup may be unusable or too slow to restore. Regularly test restoration and verify data integrity against recovery objectives.
Deployment compatibility|Why must database changes support overlapping versions?|During rollout, old and new application instances may coexist. Use compatible migrations and remove obsolete fields only after old readers stop depending on them.
Distributed tracing|How does a trace complement metrics?|Metrics reveal trends and alerts; a trace follows one request across services to locate latency or failure. Correlate both with structured logs.
Cost per operation|Why measure unit cost instead of only monthly spend?|Unit cost separates growth from inefficiency. Track compute, storage and network cost per useful operation while maintaining quality and reliability targets.`),
    sources: refs(
      ["Microsoft: cache-aside", "https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside"],
      ["Microsoft: CQRS", "https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs"],
      ["Microsoft: event sourcing", "https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing"],
      ["Microsoft: sharding", "https://learn.microsoft.com/en-us/azure/architecture/patterns/sharding"],
      ["Microsoft: saga", "https://learn.microsoft.com/en-us/azure/architecture/patterns/saga"],
      ["Microsoft: circuit breaker", "https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker"]),
  },
  LangChain: {
    topics: topics(`
Provider packages|Why separate provider integrations from core code?|Provider packages adapt authentication and model-specific behavior. Pin compatible versions and test capabilities rather than assuming all adapters behave identically.
Model initialization|What should model configuration include?|Specify the provider, model and appropriate generation settings. Keep credentials external and record configuration alongside evaluation results for reproducibility.
System instructions|Why keep instructions separate from retrieved documents?|Instructions define application behavior; documents supply evidence. Mixing them without boundaries makes untrusted text easier to mistake for authority.
Few-shot examples|When are examples useful in a prompt?|Examples clarify desired behavior and formatting. Choose representative cases and avoid consuming the context window with redundant demonstrations.
Multimodal content blocks|Can every model consume image and audio messages?|No. Input modalities and message formats vary by provider and model. Validate support and payload limits before constructing multimodal requests.
Temperature tradeoffs|Does temperature zero guarantee identical outputs?|No. It reduces sampling variability but infrastructure and model behavior can still vary. Evaluate distributions instead of relying on perfect determinism.
Token accounting|Why measure input and output tokens separately?|Long contexts and long answers contribute differently to latency and cost. Track both, including repeated tool-loop calls.
Stop conditions|Why bound an agent loop?|An agent can repeatedly call tools without completing the task. Set call or iteration budgets and return a useful failure or escalation state.
Tool descriptions|How can a description improve tool selection?|State what the tool does, when to use it and important constraints. Ambiguous overlapping tools make selection harder even with valid schemas.
Hidden tool context|Should a user ID be a model-generated argument?|Prefer trusted runtime context for identity. A model should not choose which tenant or privileged account a tool operates on.
Tool input validation|Why validate after schema generation?|External values may violate business constraints even if their types match. Check ranges, ownership and permitted operations inside the tool implementation.
Tool result size|Why limit returned tool data?|Large observations inflate context and may expose unnecessary information. Return relevant fields, summaries or references with an explicit truncation indicator.
Parallel tool calls|When should independent tool calls run together?|Parallelism helps when calls are independent and within rate limits. Serialize dependent writes and define how partial failures affect the final result.
Tool exception handling|What should the model see after a tool failure?|Return a bounded, actionable error without secrets. Distinguish retryable failures from invalid requests and stop repeated attempts when recovery is impossible.
Provider-native structured output|Why prefer native schema enforcement when supported?|It can constrain generation to a schema directly. Still validate semantic correctness and verify the selected model actually supports the requested schema features.
Tool-based output strategies|How can tool calling represent a final structured response?|The model supplies schema-shaped arguments to a designated output tool. Parse and validate them while preventing confusion with ordinary business tools.
Schema repair|How should malformed structured output be handled?|Return focused validation feedback and allow a limited correction attempt. Do not loop indefinitely or silently coerce consequential values.
Document loaders|What metadata should ingestion preserve?|Keep source identifiers, permissions, timestamps and locations. Retrieval needs provenance and access filters as well as text.
Chunk size|Why can very small chunks hurt retrieval?|They can lose context needed to interpret facts. Very large chunks dilute relevance, so tune size against actual question types.
Chunk overlap|What does overlap trade off?|Overlap preserves context across boundaries but increases storage and repeated evidence. Evaluate whether it improves retrieval enough to justify the duplication.
Embedding model changes|Can you query old vectors with a new embedding model?|Usually not safely. Compatible dimensions do not imply compatible vector spaces; rebuild or maintain separate indexes when changing embedding models.
Metadata filtering|Where should tenant permissions affect retrieval?|Apply trusted authorization filters before evidence reaches the model. Asking the model to hide unauthorized content is not an access-control mechanism.
Hybrid retrieval|Why combine lexical and semantic search?|Lexical matching captures exact names and identifiers; semantic search captures meaning. Combine and evaluate rankings for the application's query distribution.
Reranking|What does a reranker add after retrieval?|It reorders candidate passages using a more focused relevance assessment. Measure quality gains against added latency and cost.
Query rewriting|How can conversational retrieval use earlier messages?|Rewrite a follow-up into a self-contained search query using relevant context. Preserve the user's intent and avoid inventing unsupported constraints.
Two-step RAG|When is fixed retrieve-then-generate appropriate?|Use it when each request predictably needs evidence. It offers a controlled path and simpler latency budgeting than open-ended retrieval decisions.
Agentic retrieval|When should retrieval itself become a tool?|Use a tool when the agent must decide whether, where or how often to search. Bound searches and evaluate evidence selection.
Citation validation|How do you prevent fabricated citations?|Keep source IDs from retrieved documents and verify cited claims against those sources. A plausible-looking URL is not sufficient evidence.
Message trimming|What must survive context trimming?|Keep essential instructions and valid tool-call/result relationships. Arbitrarily removing messages can break the conversation protocol or lose critical constraints.
Conversation summarization|What risk comes with summary-based memory?|A summary can omit facts or introduce errors. Preserve important structured state separately and test whether later tasks retain required information.
Memory namespaces|Why partition long-term memory by user or tenant?|It prevents accidental cross-user retrieval and supports targeted deletion. Enforce namespace selection from authenticated context.
Memory retention|Should every agent observation become permanent memory?|No. Store only useful, justified information with retention rules. Transient tool responses and sensitive values may not belong in durable memory.
Dynamic model selection|When can routing to different models help?|Simple tasks may use cheaper models while difficult tasks need stronger capabilities. Route based on measured requirements and maintain compatible output contracts.
Dynamic tool selection|Why expose only a subset of tools?|A smaller relevant tool set reduces ambiguity and unnecessary authority. Select tools using trusted context and task needs.
Before-model middleware|What work belongs before a model call?|Prepare relevant context, trim messages or apply policy checks. Preserve required conversation structure and avoid inserting untrusted instructions as trusted policy.
After-model middleware|What should happen after generation?|Inspect outputs for task-specific constraints or update state. Model output still needs validation before it causes external effects.
Wrap-tool middleware|Why wrap execution rather than only edit prompts?|A wrapper can enforce runtime policy, record outcomes and handle failures at the actual action boundary, regardless of what the model says.
Human approval middleware|Which tool calls benefit from approval?|Consequential operations such as sending or deleting can pause for concrete review. Bind approval to the proposed arguments and reject changed actions.
Prompt-injection defenses|Why is a warning prompt insufficient?|Untrusted content can still influence generation. Restrict tools, validate actions and separate trusted policy from retrieved instructions.
Async invocation|Why use asynchronous calls in a service?|Async invocation allows waiting on network operations without occupying the event loop. Bound concurrency and propagate cancellation across tool calls.
Batch evaluation|Why evaluate many representative inputs together?|It reveals failure patterns hidden by a successful demo. Keep inputs and configurations stable when comparing models or prompts.
Migration testing|How should an older agent implementation be upgraded?|Check current APIs and deprecations, then verify tool behavior, memory and output schemas on regression cases before replacing the production path.`),
    sources: refs(
      ["LangChain: models", "https://docs.langchain.com/oss/python/langchain/models"],
      ["LangChain: tool interfaces", "https://docs.langchain.com/oss/python/langchain/tools"],
      ["LangChain: structured output", "https://docs.langchain.com/oss/python/langchain/structured-output"],
      ["LangChain: short-term memory", "https://docs.langchain.com/oss/python/langchain/short-term-memory"],
      ["LangChain: long-term memory", "https://docs.langchain.com/oss/python/langchain/long-term-memory"],
      ["LangChain: prebuilt middleware", "https://docs.langchain.com/oss/python/langchain/middleware/built-in"]),
  },
  LangGraph: {
    topics: topics(`
State schemas|Why define a typed state schema?|A schema documents data exchanged by nodes and helps catch mismatches. Runtime validation of external inputs remains a separate responsibility.
Input and output schemas|Why expose less than the internal state?|Public inputs and outputs should omit internal bookkeeping and sensitive fields. Separate boundary schemas keep implementation details from becoming accidental API contracts.
Partial state updates|Must every node return every state field?|No. Nodes can return only changed fields. Reducers determine how those updates combine with the existing state.
Default overwrite behavior|What happens without a custom reducer?|A state update ordinarily replaces the prior value for that key. Use a reducer when accumulation or concurrent contributions are intended.
Message reducers|Why use a message-aware reducer?|It handles message semantics such as identifiers and updates rather than blindly concatenating objects. This matters when messages are corrected or removed.
Reducer associativity|Why should aggregation tolerate execution order?|Parallel work may complete in different orders. Associative aggregation makes results more predictable; ordering-sensitive results need explicit ordering metadata.
START and END|What do graph entry and termination markers express?|They define where execution begins and which paths finish. Every intended path should reach completion or a deliberate pause.
Graph compilation|What is checked before executing a compiled graph?|Compilation prepares the graph structure and runtime configuration. Test reachability and state contracts rather than assuming compilation proves business correctness.
Conditional edge mappings|Why use explicit routing destinations?|They make branches reviewable and easier to test. Unexpected routing values should fail clearly instead of silently taking an unintended path.
Command updates|Why combine state changes with navigation?|A Command can express both the data update and next destination from one decision. Keep its routing intent consistent with other configured edges.
Dynamic Send payloads|Why give each dispatched task its own state?|Each worker needs a bounded input relevant to its subtask. Avoid sharing unnecessary mutable context across dynamically spawned work.
Super-steps|How do parallel nodes advance execution?|Nodes scheduled in the same logical step execute, and their updates feed subsequent computation. Understand barriers before relying on intermediate results.
Node retry policies|Which failures should a node retry?|Retry transient failures with bounded attempts. Invalid input and permanent authorization failures need correction, not repeated execution.
Node timeouts|Why use a node-level execution deadline?|One stalled dependency can block the entire workflow. Deadlines make failure explicit and allow a controlled fallback or escalation path.
Recursion limits|Does a recursion limit replace business termination?|No. It is a runtime bound. Define domain completion criteria so normal execution ends intentionally before exhausting that limit.
Checkpoint storage selection|Why is in-memory persistence unsuitable for restart recovery?|Process memory disappears on restart and is not shared across workers. Choose a durable backend with the required operational guarantees.
Checkpoint history|How can saved state help debugging?|Inspect state at earlier execution points to identify where an incorrect value appeared. Handle stored sensitive data according to retention policy.
Checkpoint versus store|How do checkpoints differ from long-term stores?|Checkpoints persist execution state associated with threads. Stores support application information that may be shared or retrieved beyond one execution history.
Thread ownership|What should happen before loading a thread?|Verify the authenticated caller owns or can access it. Possessing a thread identifier alone should not grant permission.
Resume values|What does a human review resume value represent?|It supplies the result expected at the interruption point. Validate that value and its relationship to the pending action before resuming.
Multiple interrupts|Why keep interrupt ordering stable within a node?|Resume values are associated with interruption points. Reordering or conditionally skipping interrupts can mismatch expected values during replay.
Interrupt serialization|What should an interrupt payload contain?|Use serializable data that clearly describes the pending decision. Avoid process-local objects, secrets and unnecessary internal state.
Code before interrupt|Why must pre-interrupt side effects be safe to repeat?|Resuming can restart node execution before the pause. Move effects or make them idempotent so review does not duplicate operations.
Static breakpoints|How do debugging breakpoints differ from business approval?|Breakpoints pause at configured execution boundaries for inspection. Business review needs explicit decision data, authorization and resume handling.
State inspection APIs|Why inspect state before resuming a job?|Confirm the execution is actually awaiting the expected action. Reject stale callbacks that target a completed or different workflow state.
Updating saved state|Can changing state affect later routing?|Yes. State corrections can alter downstream decisions. Record why the correction occurred and test its effect before continuing consequential work.
Time-travel debugging|What is useful about replaying from an earlier checkpoint?|It lets you investigate alternative continuations. Replayed model calls and external effects may differ, so do not confuse replay with an exact historical recording.
Durability modes|What tradeoff exists between checkpoint frequency and speed?|More immediate persistence reduces potential lost progress but adds overhead. Choose a durability mode based on recovery requirements.
Task isolation in replay|Why isolate nondeterministic work in tasks?|Recorded task results can support durable execution without unnecessarily repeating external calls. Design boundaries around nondeterminism and side effects.
Functional entrypoints|When is the Functional API convenient?|It adds durable execution concepts to ordinary control flow. Use it when function-based orchestration is clearer than an explicit graph topology.
Graph versus Functional API|How do you choose between the two APIs?|Choose the representation that makes state, branching and recovery understandable. Both still require deliberate persistence and side-effect handling.
Shared-schema subgraphs|How can a subgraph communicate through shared keys?|Compatible state keys can carry updates between parent and child graphs. Define reducers carefully where both may contribute values.
Private subgraph state|Why keep some child state private?|It prevents internal implementation details from leaking into the parent contract. Map only required inputs and outputs across the boundary.
Subgraph persistence|What should you verify about a child graph's checkpoints?|Understand whether state persists per invocation or across calls and how the parent checkpointer participates. Match persistence lifetime to the task.
Parent navigation|Why might a child need to route back to its parent?|A specialized subgraph may finish by handing control to a parent destination. Make that transition explicit and preserve required shared state updates.
State-value streaming|When are full-state events useful?|They help inspection when consumers need current state snapshots. Filter sensitive fields and consider payload growth before sending snapshots to a browser.
State-update streaming|Why stream deltas instead of full state?|Updates are smaller and show what changed. Consumers need clear merge semantics to reconstruct a correct view.
Custom progress events|What belongs in a custom stream event?|Use bounded user-relevant progress such as completed subtasks. Avoid exposing raw prompts or internal credentials through progress messages.
Nested stream namespaces|Why identify the originating subgraph in events?|Nested workflows can emit similar event types. Namespaces help clients and operators attribute progress to the correct execution scope.
Testing branch coverage|How do you test a graph beyond one happy path?|Exercise each routing outcome, interruption, retry and termination condition with controlled node outputs. Assert both state and externally visible effects.
Concurrent thread execution|What risk comes from resuming the same thread twice?|Concurrent continuations can race or repeat work. Enforce an execution policy and idempotent callbacks at the service boundary.
Graph version compatibility|Why is changing a paused graph risky?|Saved state may resume against changed node names or schemas. Preserve compatibility or migrate pending executions deliberately before deploying incompatible changes.`),
    sources: refs(
      ["LangGraph: graph reference", "https://docs.langchain.com/oss/python/langgraph/graph-api"],
      ["LangGraph: checkpoint persistence", "https://docs.langchain.com/oss/python/langgraph/persistence"],
      ["LangGraph: interruption and resume", "https://docs.langchain.com/oss/python/langgraph/interrupts"],
      ["LangGraph: streaming", "https://docs.langchain.com/oss/python/langgraph/streaming"],
      ["LangGraph: subgraphs", "https://docs.langchain.com/oss/python/langgraph/use-subgraphs"],
      ["LangGraph: Functional API", "https://docs.langchain.com/oss/python/langgraph/functional-api"]),
  },
  LangFlow: {
    topics: topics(`
Flow topology|How do you explain a visual flow in an interview?|Describe inputs, transformations, model calls and outputs in dependency order. Identify where errors and user-visible results leave the graph.
Component configuration|Why inspect configuration as well as connections?|A correct connection can still carry inappropriate settings. Model choice, prompt variables and retrieval limits determine runtime behavior.
Port compatibility|What should a custom output declare?|Declare the type the downstream component actually receives. Clear output contracts prevent connections that look valid but fail during execution.
Input defaults|When can default values hide a bug?|A missing mapped value may silently fall back to a default. Test required fields explicitly and avoid defaults for consequential identifiers.
Required fields|How should a flow react to missing mandatory input?|Reject it early with a useful validation error. Letting empty values reach models makes failures harder to locate.
Message metadata|Why preserve session and sender information?|Conversation components use metadata to distinguish participants and sessions. Losing it can mix histories or misattribute responses.
DataFrame processing|When is tabular data preferable to chat text?|Use structured rows and columns for deterministic transforms and analysis. Convert to a prompt only when model interpretation is actually needed.
Text conversion|Why explicitly convert structured outputs to text?|Explicit formatting makes included fields and truncation visible. Implicit conversion can expose irrelevant metadata or produce confusing prompts.
Prompt templates|How should prompt placeholders be tested?|Run with representative values, missing fields and unusual characters. Confirm every placeholder maps to the intended upstream output.
Model credentials|Why use credential configuration rather than prompt text?|Credentials authorize transport-level calls and should never be instructions sent to a model. Keep them separate from exported flow content.
Global variables|What problem do global variables solve?|They centralize reusable configuration across flows. Apply appropriate secret handling and avoid coupling unrelated environments through shared mutable values.
Environment configuration|Why separate development and production settings?|Models, credentials and endpoints may differ. Explicit configuration prevents a test flow from accidentally accessing production resources.
File ingestion|What should be checked before parsing an uploaded file?|Validate size and format, apply access controls and handle parser failures. Treat extracted content as untrusted evidence.
Text splitting|Why test chunk boundaries with real documents?|Tables, headings and code can lose meaning when split arbitrarily. Evaluate retrieval against realistic questions rather than only inspecting chunk lengths.
Embedding consistency|Why must ingestion and query embeddings align?|The vector index and query must use compatible embedding spaces. Changing models usually requires rebuilding or versioning the index.
Vector-store persistence|What happens if an index exists only in memory?|Restarting can lose the indexed data. Choose persistent storage and a repeatable ingestion process for deployed retrieval flows.
Retriever filters|Where should permissions be enforced in a RAG flow?|Filter accessible documents before retrieval results reach the model. Do not rely on the generated answer to conceal unauthorized evidence.
Retrieval top-k|Why is a larger top-k not always better?|More passages can add irrelevant context, latency and cost. Measure answer quality and evidence recall while tuning the candidate count.
Empty retrieval results|What should a flow do when no evidence is found?|Return a clear insufficiency response or request clarification. Avoid encouraging the model to invent a sourced answer.
Grounded answer formatting|How should citations be carried through a flow?|Preserve source identifiers with retrieved content and validate final references. Formatting alone does not ensure claims are supported.
Tool mode|Why expose a component as an agent tool?|Tool mode lets the agent select an operation when needed. Keep the component contract narrow and clearly describe its intended use.
Tool naming|How can tool names affect selection?|Distinct descriptive names reduce ambiguity. Avoid near-identical tools without clear differences in purpose or input requirements.
Agent iteration budgets|Why bound tool use in a visual agent?|A connected agent can repeatedly choose tools. Define limits and a failure path rather than assuming a visually small graph has bounded execution.
Memory session isolation|What makes chat memory unsafe across users?|Reusing a session identifier can mix histories. Derive session ownership from authenticated context and enforce isolation before loading messages.
Custom component inputs|What should a component input definition express?|Specify names, types and required behavior clearly. Validate business constraints inside the implementation in addition to editor-level configuration.
Custom component outputs|Why avoid returning inconsistent types?|Downstream components depend on a stable contract. Return the declared type even for empty results, or signal failure explicitly.
Custom component lifecycle|Why keep initialization separate from per-request work?|Expensive reusable setup differs from request-specific processing. Avoid accidentally retaining user data in long-lived component state.
Custom dependencies|What makes a component reproducible across deployments?|Pin compatible dependencies and document required configuration. A component that works locally may fail when packages or environment settings differ.
Component status messages|What belongs in a diagnostic status?|Include concise operational information useful for debugging. Do not put secrets or full sensitive payloads in editor-visible diagnostics.
Flow export and import|What should be reviewed in an exported flow?|Review component definitions, references and configuration. Remove embedded secrets and verify compatibility before importing into another environment.
Flow identifiers|Why distinguish a display name from an API identifier?|Names can change or collide. Stable identifiers make automation target the intended flow and simplify version tracking.
Workflow request payloads|Why generate requests from the deployed flow contract?|Component inputs and execution APIs can differ by version. Inspect the actual contract instead of copying stale payloads from unrelated examples.
Streaming consumption|How should a client handle partial events?|Parse events incrementally and distinguish progress from completion. Handle disconnects without treating an unfinished output as successful.
Background execution|What must a caller retain after submitting background work?|Keep the returned execution reference and a supported way to inspect completion. Submission success is not the same as processing success.
API error mapping|Why translate internal errors before returning them?|Clients need actionable status without stack traces or secrets. Preserve a correlation identifier for operator investigation.
MCP server exposure|What changes when a flow is exposed through MCP?|The flow becomes discoverable as a callable capability for MCP clients. Authentication, input contracts and permissions still require deliberate configuration.
MCP tool descriptions|Why review descriptions of published flows?|Clients use descriptions to choose tools. State purpose and constraints accurately, and avoid advertising capabilities the flow cannot perform reliably.
MCP versus HTTP API|Are these interchangeable execution contracts?|They are different integration interfaces. Choose the supported interface for the client and verify its authentication and request semantics.
Concurrent flow runs|What shared state can make concurrency unsafe?|Mutable globals, shared files or reused session IDs can cross-contaminate runs. Isolate request state and coordinate shared writes.
Version upgrade regression|What should be checked after upgrading Langflow?|Verify component availability, types, API payloads and custom code. Run saved input-output scenarios before changing production traffic.
Health versus readiness|Can a running server still be unready for requests?|Yes. Model credentials, databases or indexes may be unavailable. Readiness checks should reflect the dependencies needed to execute the flow.
Flow acceptance tests|How do you prove a visual flow meets its purpose?|Run representative inputs and assert task outcomes, citations and failure behavior. Include missing data and unavailable dependencies, not only a demo prompt.`),
    sources: refs(
      ["Langflow: editor concepts", "https://docs.langflow.org/concepts-overview"],
      ["Langflow: Python components", "https://docs.langflow.org/components-custom-components"],
      ["Langflow: Workflow API", "https://docs.langflow.org/workflow-api-quickstart"],
      ["Langflow: agents", "https://docs.langflow.org/agents"],
      ["Langflow: MCP server", "https://docs.langflow.org/mcp-server"],
      ["Langflow: global variables", "https://docs.langflow.org/configuration-global-variables"]),
  },
  LangSmith: {
    topics: topics(`
Trace hierarchy|Why preserve parent-child relationships between runs?|They show which model and tool calls belong to one operation. Flat logs lose the causal structure needed to diagnose failures.
Root run boundaries|How do you choose a trace's scope?|Use a meaningful user request or job as the root. Include related steps without combining unrelated requests into one trace.
Run inputs and outputs|What should be recorded for a model call?|Capture the information needed to diagnose behavior under a privacy policy. Redact secrets and unnecessary personal data before transmission.
Run names|Why use stable descriptive run names?|Consistent names make filtering and comparisons useful across releases. Avoid embedding high-cardinality user content in operation names.
Tags versus metadata|How do tags and metadata serve different needs?|Tags label broad categories; metadata stores structured context such as release or tenant scope. Choose fields that support actual investigation workflows.
Error traces|Why trace failures as well as successful outputs?|Failures reveal unavailable dependencies, invalid requests and broken assumptions. Record enough context to distinguish the cause without leaking sensitive payloads.
Time to first token|Why measure it separately from total latency?|It reflects how quickly a streaming interface begins responding. A fast first token can still hide a long or stalled completion.
Tool latency breakdown|How can you identify a slow agent dependency?|Compare durations of child tool runs with model time. Optimize the actual bottleneck instead of assuming generation dominates every request.
Token usage completeness|Why can reported cost be incomplete?|Some integrations may omit usage or pricing information. Treat missing data explicitly and reconcile against provider records where necessary.
Custom instrumentation|When is automatic tracing insufficient?|Application-specific routing and external services may need explicit spans or runs. Instrument important boundaries while maintaining correct parent context.
Asynchronous trace context|What can break trace nesting in concurrent work?|Losing context propagation can detach child operations from their parent. Verify trace relationships when using tasks, threads or background workers.
Cross-service correlation|How do you connect a webhook to an agent trace?|Carry a stable correlation identifier through authorized service calls and record it as metadata. Do not confuse correlation with authentication.
Dataset examples|What belongs in an evaluation example?|Include the input and relevant expected behavior or reference output. Keep the example sufficient to reproduce the test conditions.
Dataset splits|Why separate development and holdout examples?|Tuning repeatedly on the same cases can overfit. A holdout provides a less biased check of whether changes generalize.
Dataset versions|Why record which dataset an experiment used?|Examples and references evolve. Version identity makes comparisons interpretable and prevents confusing a changed dataset with a better model.
Dataset provenance|Why retain the origin of an example?|It helps validate permissions, understand coverage and investigate incorrect references. Sanitized production failures and synthetic examples have different limitations.
Synthetic test cases|What is the danger of only synthetic evaluation data?|Generated cases may miss real user behavior and share model biases. Combine them with reviewed realistic examples and observed failures.
Edge-case coverage|Which cases should complement ordinary questions?|Include ambiguity, missing evidence, malformed input, tool failures and unauthorized requests. These reveal reliability problems that fluent happy-path answers hide.
Reference-free evaluation|Can a task be evaluated without a single reference answer?|Yes. Rubrics, executable checks or human review can score requirements. Define the criterion precisely enough to make the result meaningful.
Reference-based evaluation|When is a reference answer useful?|It helps assess factual or constrained tasks with known expected behavior. Allow valid alternative wording instead of equating string equality with correctness.
Pairwise comparison|Why compare outputs side by side?|Relative judgments can reveal preferences difficult to express as absolute scores. Randomize presentation when possible to reduce position bias.
Rubric design|What makes a scoring rubric actionable?|Separate measurable dimensions and define score meanings. Vague criteria such as good answer make judge agreement and debugging difficult.
Judge calibration|How do you assess an LLM evaluator?|Compare its decisions with reviewed human labels on representative cases. Investigate systematic disagreement before relying on aggregate scores.
Judge independence|Why avoid judging every output with the same generation setup?|Shared weaknesses can hide errors. Use independent checks and human calibration rather than assuming a second model call proves correctness.
Deterministic format checks|Which outputs should be scored with code?|Schema validity, required fields and allowed enum values have explicit checks. Reserve model judgment for criteria that cannot be reliably expressed deterministically.
Executable task checks|How do you evaluate an agent that modifies records?|Check the resulting authorized state and absence of unintended changes. A convincing textual explanation is not proof that the operation succeeded.
Trajectory evaluation|Why evaluate intermediate tool choices?|A correct final answer may hide unsafe, wasteful or unauthorized steps. Inspect whether the execution path follows the task's constraints.
Retrieval evaluation|What should be measured before answer generation?|Measure whether retrieved evidence includes relevant authorized material. Distinguish retrieval failure from the model failing to use good evidence.
Groundedness scoring|How is groundedness different from correctness?|Groundedness asks whether claims follow supplied evidence. A claim can be true yet unsupported by that evidence, or supported by a flawed source.
Evaluation concurrency|Why bound parallel experiment runs?|Unbounded evaluation can trigger provider limits and distort latency measurements. Balance throughput against stable conditions and account budgets.
Repeated trials|Why run a nondeterministic case more than once?|A single result may be lucky or unlucky. Repetition helps estimate variability and reveals intermittent failures.
Experiment configuration|What should accompany every result set?|Record prompt, model, tool versions and relevant runtime settings. Without them, a score difference may be impossible to explain or reproduce.
Aggregate versus per-case scores|Why inspect individual regressions after an average improves?|Gains on easy cases can mask serious failures on critical cases. Use slices and case review alongside overall metrics.
Dataset slices|What is a useful evaluation slice?|Group examples by meaningful attributes such as language, task or difficulty. Slices expose uneven quality hidden by aggregate scores.
Confidence and sample size|Why avoid treating a small score change as definitive?|Small datasets and stochastic outputs introduce noise. Consider sample size and variability before declaring a release better.
Annotation queues|Why use a review queue for traces?|It organizes human inspection of selected runs. Define labeling instructions and prioritize examples where review will improve understanding or test coverage.
Annotator disagreement|What should happen when reviewers disagree?|Review the rubric and ambiguous evidence before collapsing labels. Disagreement can reveal unclear requirements rather than poor annotator performance.
Feedback attribution|Why link feedback to the exact run?|A user may interact with several versions or retries. Precise attribution prevents assigning a failure to the wrong prompt or configuration.
Online sampling bias|What can a production sample miss?|Sampling may underrepresent rare failures or important user segments. Combine random sampling with targeted review of errors and critical cases.
Redaction before export|Why mask data before sending a trace?|Once exported, sensitive information may persist outside the application. Redact at the boundary and verify nested fields, not only top-level strings.
Retention and deletion|What should a tracing data policy specify?|Define what is stored, who can access it and how long it remains. Include deletion workflows for sensitive or user-associated records.
Release gates|How should evaluation influence deployment?|Set explicit acceptable outcomes and critical-failure rules. Use results as evidence alongside operational checks, not as an automatic guarantee of safety.`),
    sources: refs(
      ["LangSmith: tracing overview", "https://docs.langchain.com/langsmith/observability"],
      ["LangSmith: evaluation concepts", "https://docs.langchain.com/langsmith/evaluation-concepts"],
      ["LangSmith: dataset management", "https://docs.langchain.com/langsmith/manage-datasets-in-application"],
      ["LangSmith: agent evaluation", "https://docs.langchain.com/langsmith/evaluate-llm-application"],
      ["LangSmith: inline annotations", "https://docs.langchain.com/langsmith/annotate-traces-inline"],
      ["LangSmith: sensitive-data masking", "https://docs.langchain.com/langsmith/mask-inputs-outputs"]),
  },
  n8n: {
    topics: topics(`
Manual versus production execution|Why can a manual test differ from a live workflow?|Triggers, pinned data and credentials may differ. Validate the production entry point and real payload shape before considering a manual run representative.
Webhook test URLs|Why should callers use the correct webhook URL?|Testing and production webhook endpoints serve different execution contexts. Verify the published workflow configuration rather than leaving callers on a temporary test endpoint.
Webhook signatures|How do you verify an event came from its claimed sender?|Validate the provider's signature against the raw request using the configured secret. A familiar JSON structure is not proof of authenticity.
Replay protection|Why check event identity as well as signature?|A correctly signed event can be delivered again. Store an event identifier or enforce the provider's replay constraints before repeating side effects.
Schedule time zones|Why can scheduled workflows run at unexpected times?|Server, workflow and business time zones may differ. Specify the intended zone and test daylight-saving transitions where relevant.
Polling intervals|What tradeoff does frequent polling introduce?|It reduces detection delay but increases requests and rate-limit pressure. Prefer events when available or choose polling based on business freshness requirements.
JSON item envelopes|What is the usual structure passed between nodes?|Nodes exchange arrays of items containing JSON data, with binary data represented separately. Preserve that structure when returning custom transformations.
Binary payloads|Why avoid treating an uploaded file as ordinary JSON text?|Binary data has storage and transfer semantics distinct from fields. Use supported binary handling and bound file size to protect memory.
Item linking|Why can references to earlier nodes become ambiguous?|Transforms can change item counts or ordering. Preserve item relationships or use explicit identifiers when combining outputs from different stages.
Field mapping|What does dragging a field into a parameter usually create?|It creates a reference to data at that path. Validate how the expression resolves for each incoming item, especially when fields are missing.
Expression scope|Why might an expression work for one item but fail for another?|Items can have different shapes. Guard optional fields and inspect the actual execution context instead of assuming every item contains the same properties.
Null versus empty values|Why distinguish null, empty text and missing fields?|APIs may interpret them differently, such as clearing a value versus leaving it unchanged. Normalize deliberately before sending requests.
Date normalization|What should happen before comparing timestamps?|Parse them with explicit timezone assumptions and convert to a consistent representation. Comparing formatted strings can produce incorrect ordering.
Code node modes|Why choose between per-item and all-items processing?|Per-item logic fits independent transforms; all-items logic supports aggregation. Match the return shape and avoid unintentionally duplicating work.
Code node restrictions|Can a Code node assume arbitrary packages are available?|No. Execution environment and configuration determine supported modules and runtimes. Verify deployment capabilities before relying on local libraries.
Filtering versus branching|How do removing items and routing branches differ?|Filtering drops items from a path. Branching preserves alternative processing routes; choose based on whether rejected items need further handling.
Switch fallback paths|Why configure an unmatched route?|New or malformed values should not disappear silently. Send unmatched cases to explicit review, logging or validation failure.
Merge cardinality|Why can combining branches multiply records?|Join conditions and matching modes can produce multiple combinations. Test duplicate keys and unmatched items before writing results externally.
Loop Over Items|When is an explicit loop useful?|Many nodes already process items. Use explicit loops for controlled batching or special sequencing, not simply because the input contains an array.
Pagination termination|How do you avoid an infinite API pagination loop?|Follow the documented next-page signal and detect repeated cursors. Add a maximum page or item budget as a defensive bound.
API rate limits|How should a workflow react to a 429 response?|Respect retry guidance, wait with bounded backoff and reduce concurrency. Repeating immediately usually increases rejection rather than making progress.
HTTP status handling|Why not treat every response body as success?|APIs return error payloads and non-success status codes. Validate status and expected structure before downstream nodes use the result.
OAuth refresh|What failure can occur despite a previously valid credential?|Tokens can expire or be revoked. Use supported credential refresh and distinguish temporary authentication problems from permanently removed access.
Least-privilege credentials|Why avoid an administrator credential for a narrow workflow?|A bug or compromised node could access unnecessary resources. Grant only the operations and scope required for the automation.
Sub-workflow contracts|What should a reusable sub-workflow document?|Specify accepted inputs, output shape and failure behavior. Version consequential changes so callers do not silently receive incompatible data.
Error Trigger|What is the role of a dedicated error workflow?|It receives failure context for centralized handling. Use it to classify incidents and notify an owner without recursively triggering the same failure.
Stop And Error|When should business validation deliberately fail execution?|When continuing would produce an invalid or unsafe outcome. Emit an actionable error rather than letting later nodes process known-bad data.
Continue-on-error tradeoffs|Why can continuing after failure be dangerous?|Downstream nodes may interpret missing or error data as valid input. Separate successful and failed outcomes explicitly when partial progress is intended.
Wait and resume|What must be validated when resuming paused work?|Check that the callback belongs to the expected execution and is authorized. Handle duplicate or expired callbacks without repeating the action.
Execution history|What makes a saved execution useful for debugging?|It captures node inputs, outputs and errors. Balance retention with privacy and inspect the first divergent node rather than only the final failure.
Pinned data|Why should pinned data not substitute for integration testing?|It helps repeatable editor tests but can hide upstream changes or failures. Test with actual incoming data before release.
Partial executions|What can be missed when running only one section?|Upstream context and branch behavior may differ from a full run. Use partial execution for diagnosis, then verify the complete path.
Workflow activation|Why verify trigger registration after publishing changes?|A correct editor graph does not prove production events arrive. Confirm the intended trigger is active and receives a realistic event.
Queue infrastructure|Why does queue mode need more than extra workers?|Redis, persistence and shared configuration must remain reliable. Worker scaling is ineffective if coordination or the database is saturated.
Worker concurrency|How do you choose concurrent executions per worker?|Measure CPU, memory and downstream limits. Excess concurrency can increase failures and tail latency rather than improve throughput.
Shared encryption keys|Why must distributed instances agree on credential encryption configuration?|Workers need to decrypt stored credentials consistently. Mismatched configuration can cause execution failures even when workflows and data are shared.
Binary storage in scaled deployments|What must be checked before scaling workflows with files?|Verify the selected binary storage mode is supported across workers. Local files may not be accessible to the worker executing a later step.
AI model sub-nodes|Why inspect AI sub-node expression behavior?|Sub-nodes can resolve inputs differently from ordinary nodes. Test multiple items instead of assuming each item receives an independently resolved configuration.
Chat memory keys|How do you avoid mixing conversations?|Use a stable session identifier scoped to the authenticated user. Do not reuse a single global key for unrelated chats.
Structured AI output|Why validate an agent's result before routing business work?|Generated text may violate the expected schema or domain rules. Parse and validate fields before selecting actions or updating external records.
Human review queues|How can an AI draft be kept from sending automatically?|Store the proposed content and require an authorized approval step before the sending node. Approval should apply to the exact reviewed draft.
Workflow upgrades|What should be tested after changing a node version?|Verify parameter semantics, credentials, item shapes and failure handling. Keep representative execution fixtures to detect changes before production use.`),
    sources: refs(
      ["n8n: item data structure", "https://docs.n8n.io/data/data-structure/"],
      ["n8n: expressions", "https://docs.n8n.io/code/expressions/"],
      ["n8n: loops", "https://docs.n8n.io/flow-logic/looping/"],
      ["n8n: errors", "https://docs.n8n.io/flow-logic/error-handling/"],
      ["n8n: queue scaling", "https://docs.n8n.io/hosting/scaling/queue-mode/"],
      ["n8n: AI integrations", "https://docs.n8n.io/advanced-ai/"]),
  },
  "Python with AI and Agentic AI": {
    topics: topics(`
Lists versus tuples|When would you use a tuple rather than a list?|Tuples express fixed collections and are immutable containers. Their elements can still reference mutable objects, so tuple immutability is not deep immutability.
Dictionaries and sets|Why use a set for membership checks?|Sets support efficient membership and uniqueness for hashable values. Use a dictionary when each key also needs associated data.
Hashability|Why cannot a list be a dictionary key?|Dictionary keys need stable hash behavior. Lists are mutable and unhashable; use an appropriate immutable representation when identity depends on contents.
Equality versus identity|When should you use is instead of ==?|Use identity checks for singleton objects such as None. Equality compares values and can be customized by a type.
Shallow versus deep copy|Why can a copied list still share nested state?|A shallow copy duplicates the outer container, not nested objects. Use deliberate reconstruction or deep copying when independent nested state is required.
Comprehensions|When is a comprehension less appropriate than a loop?|Complex branching or side effects can obscure intent. Prefer a readable loop when a transformation is no longer simple and declarative.
Generator expressions|Why choose a generator expression for a large pipeline?|It produces values lazily instead of building a full intermediate list. Remember it is consumed as iteration proceeds.
Iteration exhaustion|Why might a second pass over a generator be empty?|Generators retain execution state and are exhausted after completion. Recreate the generator or materialize results if repeated traversal is needed.
Closures and late binding|Why can loop-created callbacks all see the final value?|Closures refer to variables resolved when called. Capture the intended value explicitly when creating each callback.
Decorators|What should a decorator preserve?|Preserve the wrapped function's metadata and expected behavior, commonly using functools.wraps. Async functions need wrappers that correctly await their result.
Positional and keyword arguments|Why make some parameters keyword-only?|Keyword-only parameters make configuration calls clearer and reduce accidental positional mistakes. Use them for options whose meaning is otherwise ambiguous.
Argument unpacking|What is the risk of forwarding arbitrary keyword arguments?|Unexpected or privileged options may pass through unnoticed. Validate the accepted keys at an external boundary before forwarding them.
Dataclasses|When are dataclasses useful for agent state?|They reduce boilerplate for structured Python objects. They do not automatically validate untrusted model output or make contained objects deeply immutable.
Protocols|Why use a Protocol for a model client interface?|It describes required behavior structurally, allowing interchangeable implementations. Static conformance does not replace runtime compatibility testing.
TypedDict|How does TypedDict differ from a runtime validation model?|It describes dictionary shapes for type checkers. Ordinary dictionaries remain ordinary runtime values and need separate validation at input boundaries.
Generic types|Why parameterize a reusable result container?|Generics preserve the relationship between input and output types. They help tools detect mismatches without forcing every result to become an untyped object.
Union narrowing|Why inspect a result discriminator before accessing fields?|A result can represent different variants. Narrowing to success or failure makes field access explicit and prevents treating errors as valid data.
Exception chaining|Why preserve the original exception when raising a domain error?|Chaining retains diagnostic context while exposing a meaningful application-level failure. Avoid losing the dependency error that explains the cause.
Finally blocks|What belongs in finally?|Release resources or restore invariants regardless of success. Avoid returning from finally because it can mask an exception or earlier return value.
Async context managers|Why use async with for an asynchronous client?|It allows asynchronous setup and cleanup without blocking. Ensure cancellation still closes connections and releases resources.
Async generators|When is an async generator useful in an AI application?|It can yield streaming tokens or events as they arrive. Consumers must handle cancellation and close unfinished streams.
Coroutine versus Task|What is the difference between creating a coroutine and scheduling it?|Calling an async function creates a coroutine object. Awaiting or scheduling it as a task starts coordinated execution in an event loop.
gather versus TaskGroup|How do their failure semantics differ?|TaskGroup provides structured cancellation of sibling tasks on ordinary failure. gather behavior depends on its options and does not provide identical sibling-cancellation semantics.
Semaphore limits|Why wrap provider calls with a semaphore?|It caps simultaneous in-flight calls. Combine it with rate and queue limits because concurrency bounds alone do not enforce requests per minute.
Async queues|How does a bounded queue provide backpressure?|Producers must wait when the queue is full. This limits memory growth and exposes when consumers cannot keep up.
Cancellation propagation|Why should CancelledError usually be re-raised?|Swallowing it can prevent parent operations from stopping cleanly. Perform cleanup and allow cancellation to propagate unless intentionally implementing a documented boundary.
Timeout scope|Why distinguish connection timeouts from overall deadlines?|A request may connect quickly but stall while reading. An overall deadline bounds the whole operation, including retries and processing.
Thread offloading|When does asyncio.to_thread help?|It moves blocking work off the event-loop thread. It is commonly useful for blocking I/O, not a universal solution for CPU parallelism.
Process pools|When should CPU-heavy preprocessing use separate processes?|Independent CPU-bound work can benefit from processes. Account for serialization, startup cost and memory duplication before assuming faster execution.
GIL considerations|Does Python always prevent parallel execution of Python code?|It depends on the interpreter build and workload. Understand the deployed runtime, including free-threaded configurations, instead of assuming all Python execution has identical constraints.
Thread safety|Why is shared mutable state still risky with async code?|Tasks interleave at await points and threads may run concurrently. Protect multi-step invariants and avoid assuming individual safe operations make a sequence atomic.
Connection pooling|Why reuse an HTTP client across related requests?|Pooling reduces connection setup overhead. Scope client lifetime deliberately and close it during shutdown instead of creating a new client for every tool call.
Retry backoff|Why add jitter to retry delays?|Clients retrying at identical intervals can synchronize into bursts. Jitter spreads attempts while a bounded policy prevents unlimited load amplification.
Environment secrets|Why avoid storing provider keys in source files?|Source and logs are widely copied. Read secrets from appropriate runtime configuration and prevent accidental inclusion in exceptions or test fixtures.
Package isolation|Why use an isolated environment for an AI project?|Framework and provider packages can have incompatible dependencies. An isolated, reproducible environment reduces accidental interference between projects.
Serialization boundaries|Why not deserialize untrusted pickle data?|Pickle can execute code during loading. Use an appropriate data format and explicit validation for values received from users or external services.
JSON numeric constraints|Why validate numbers after parsing JSON?|Syntactically valid values may exceed allowed ranges or precision requirements. Apply domain checks before using them for quotas, money or array sizes.
Deterministic tool fixtures|How can tests avoid calling a real model every time?|Inject controlled model and tool clients for boundary tests. Keep separate evaluation runs to measure actual model behavior.
Property-based invariants|What invariant is useful for a retryable tool?|Repeated execution with the same operation identifier should not create additional effects. Generate varied inputs and failure points to test that property.
Structured logging|What should an agent service log?|Record operation IDs, durations and sanitized error categories. Avoid raw secrets and make related tool calls traceable across asynchronous tasks.
Profiling before optimization|Why profile an agent service before rewriting it?|Latency may come from network waits, retrieval or serialization rather than Python execution. Optimize the measured bottleneck instead of guessing.
Graceful shutdown|What should happen when a worker is asked to stop?|Stop accepting new work, cancel or finish tasks within a deadline, persist recoverable progress and close network resources.`),
    sources: refs(
      ["Python: data structures", "https://docs.python.org/3/tutorial/datastructures.html"],
      ["Python: object model and generators", "https://docs.python.org/3/tutorial/classes.html"],
      ["Python: function arguments", "https://docs.python.org/3/tutorial/controlflow.html"],
      ["Python: exception handling", "https://docs.python.org/3/tutorial/errors.html"],
      ["Python: task coordination", "https://docs.python.org/3/library/asyncio-task.html"],
      ["Python: typing", "https://docs.python.org/3/library/typing.html"],
      ["Python: executor pools", "https://docs.python.org/3/library/concurrent.futures.html"]),
  },
  "React 19+": {
    topics: topics(`
JSX and component composition|Why prefer composition over one large configurable component?|Small components express clear responsibilities and reusable structure. Avoid excessive flags that create hard-to-test combinations of behavior.
Props immutability|Why should a component not mutate its props?|Props are inputs owned by the caller. Mutation breaks predictable rendering and can affect other components sharing the same object.
State ownership|How do you choose where state should live?|Place it in the nearest owner that needs to coordinate updates. Keep local concerns local instead of moving every value to global context.
Lifting state|When should sibling components share an owner?|Lift state when siblings need a consistent value or coordinated behavior. Pass values and handlers explicitly before introducing broader state infrastructure.
Controlled inputs|What makes an input controlled?|Its displayed value comes from React state and changes through a handler. Keep the value consistently controlled throughout its lifetime.
Uncontrolled inputs|When can defaultValue be useful?|It sets the initial DOM value while leaving subsequent changes to the input. Read the value through form submission or a ref when appropriate.
Functional state updates|Why use an updater for consecutive increments?|Each updater receives the pending previous state. Reusing a captured value can collapse multiple intended increments into the same update.
Batching|Why can multiple setters produce one render?|React batches eligible updates to avoid unnecessary intermediate renders. Do not rely on a separate synchronous DOM update after every setter.
Immutable object updates|Why create a new object when changing state?|A new reference communicates the change and preserves earlier render snapshots. Mutating existing state can leave React and other readers with inconsistent assumptions.
Reducer design|When is useReducer clearer than several setters?|It centralizes related state transitions under named actions. Keep reducers pure and represent invalid transitions explicitly.
Derived state|Why avoid storing a filtered list separately from its source?|It creates two values that can drift apart. Derive the filtered list during render unless there is a specific reason to persist a separate snapshot.
Stable list keys|Why is Math.random a poor key?|A new key makes React treat the item as a different component, resetting state and recreating DOM unnecessarily on each render.
Resetting with keys|When is changing a key intentional?|Use a new key when a component represents a different identity and should discard prior local state, such as switching an editor to another record.
Event propagation|When should stopPropagation be used?|Use it when a nested interaction must not trigger a parent handler. Avoid blanket suppression that breaks expected keyboard or container behavior.
Custom hooks|What should a custom hook encapsulate?|It should reuse stateful behavior with a clear contract. Each call owns its state; a custom hook does not automatically create shared global state.
Rules of Hooks|Why cannot most hooks be called conditionally?|React relies on consistent hook ordering between renders. Keep ordinary hooks at the top level of components or custom hooks.
Effect dependencies|Why is removing a dependency to silence reruns incorrect?|It can leave the Effect using stale values. Restructure the synchronization logic so its dependencies accurately describe what it reads.
Stale closures|How can a timer observe an old state value?|Its callback closes over the render that created it. Use the appropriate updater, dependency or current-value pattern for the required behavior.
Effect cleanup|When does React run an Effect cleanup?|Cleanup runs before the Effect reruns with changed dependencies and on unmount. It should undo subscriptions or resources created by setup.
Strict Mode checks|Why might setup and cleanup run extra times in development?|Strict Mode checks expose missing cleanup and impure behavior. Fix the underlying assumptions rather than disabling the checks to hide symptoms.
useLayoutEffect|When is layout timing important?|Use it for measurements or adjustments that must occur before paint. It can block painting, so ordinary synchronization usually belongs in useEffect.
Refs versus state|Why does changing ref.current not update the screen?|Refs retain mutable values without scheduling a render. Use state for values that should change rendered output.
Callback ref cleanup|What should a callback ref clean up?|Release subscriptions or registrations associated with the DOM node. React 19 supports cleanup from callback refs, so keep the lifecycle symmetrical.
useImperativeHandle|Why expose a narrow imperative interface?|A parent may need focus or reset without accessing all internals. Expose specific operations rather than leaking the full implementation.
Context provider values|Why can recreating a provider object trigger consumers?|A changed context value reference can notify consumers. Split unrelated contexts or stabilize values when measurements show a meaningful performance issue.
Context scope|Why might a consumer read the default value?|It may be outside the matching provider. Verify tree placement and ensure provider and consumer use the same context object.
memo limitations|Does memo prevent all rerenders?|No. Local state and context updates still matter, and changing props can trigger rendering. Treat memo as an optimization rather than a correctness mechanism.
useCallback|What does useCallback memoize?|It preserves a function reference between renders when dependencies are unchanged. It does not execute the function or automatically make its work faster.
useMemo invalidation|Why must memoized calculations remain pure?|React can recompute or discard cached values. Correctness must not depend on the calculation running exactly once.
useDeferredValue|When is a deferred value useful?|It lets a less urgent view lag behind an immediate input. It does not debounce network requests by itself.
Transition pending state|Why show pending state during a transition?|It explains that a non-urgent update is still underway while the current UI remains usable. Avoid conflating it with every unrelated network request.
Action error handling|How should a failed form Action update the UI?|Return or handle a meaningful validation state and preserve useful input. Do not display success merely because the asynchronous function finished.
Action previous state|Why does an Action reducer receive previous state?|It can derive the next form result from the prior result and submitted payload. Keep the parameter order consistent with useActionState's contract.
Optimistic reconciliation|What happens when optimistic assumptions are wrong?|The interface must reconcile with confirmed state and communicate failure. Preserve stable item identities so pending and confirmed records do not duplicate.
Form status placement|Where should a useFormStatus submit component be rendered?|Render it as a descendant of the relevant form. Calling the hook in the component that creates that same form does not observe it as a parent.
Suspense boundary placement|Why not wrap an entire application in one loading boundary?|One slow resource could replace too much useful UI. Place boundaries around meaningful sections with appropriate loading behavior.
Promise stability with use|Why avoid creating a new Promise on every client render?|Repeated promises can cause repeated suspension and unstable fetching. Use a framework-supported resource or a stable promise supplied by an appropriate owner.
Error boundaries|Do error boundaries catch every asynchronous error?|No. They primarily handle rendering errors in descendants. Event handlers and unrelated asynchronous callbacks need their own error handling.
Hydration consistency|Why can browser-only values cause hydration mismatches?|Server and first client output may differ. Use deterministic initial rendering and move browser-dependent updates to the appropriate client lifecycle.
Server Component boundaries|Can a Server Component contain a Client Component?|Yes. The server can compose interactive client islands, passing supported serializable data across the boundary. Keep server-only dependencies out of client imports.
useId and accessibility|Why use useId for label relationships?|It creates identifiers suitable for matching labels and controls across rendering. It is not a replacement for stable data-derived list keys.
React Compiler awareness|Does a compiler remove the need for good state design?|No. Optimization cannot fix impure rendering or incorrect ownership. Follow React's rules and verify behavior independently of memoization improvements.`),
    sources: refs(
      ["React: use resources", "https://react.dev/reference/react/use"],
      ["React: Effects", "https://react.dev/reference/react/useEffect"],
      ["React: transitions", "https://react.dev/reference/react/useTransition"],
      ["React: Suspense", "https://react.dev/reference/react/Suspense"],
      ["React: Action state", "https://react.dev/reference/react/useActionState"],
      ["React: optimistic state", "https://react.dev/reference/react/useOptimistic"],
      ["React: Strict Mode", "https://react.dev/reference/react/StrictMode"]),
  },
  "Next.js with OpenRouter and Vercel AI Gateway": {
    topics: topics(`
App Router composition|Why separate layouts from page-specific content?|Layouts express shared structure while pages define route content. Keep expensive or interactive behavior at the smallest appropriate boundary.
Server-only modules|How do you prevent a model client entering the browser bundle?|Keep it behind a server-only boundary and avoid imports from Client Components. Environment naming alone is not a substitute for module separation.
Public environment variables|Why must provider secrets not use NEXT_PUBLIC prefixes?|Public variables are intended for browser exposure. Store provider keys in server environment configuration and never pass them as client props.
Request validation|What should an AI Route Handler validate?|Check message structure, allowed roles, input length and resource ownership. Reject unsupported fields rather than forwarding arbitrary client options to providers.
Trusted system prompts|Should a client supply the application's system instructions?|Construct trusted instructions on the server. Client input is untrusted content and should not override application policy or tool permissions.
Conversation ownership|Why authorize every chat-history lookup?|A guessed conversation ID must not expose another user's messages. Scope reads and writes to authenticated ownership before constructing model context.
UI versus model messages|Why distinguish rendered messages from provider inputs?|UI records can contain presentation metadata and tool states. Convert and validate them using the installed SDK's supported message contract.
Chat transport|What does a transport boundary provide?|It defines how the UI submits messages and receives updates. Authentication, cancellation and protocol compatibility must match the server endpoint.
Stream framing|Why cannot arbitrary text chunks always be treated as complete messages?|Chunks may split tokens or protocol events. Use the supported stream parser and maintain a distinct completed-message state.
Abort propagation|Why connect the request signal to upstream work?|A cancelled client request should stop unnecessary generation where supported. Also define whether background business actions continue or are independently recoverable.
Disconnect recovery|How should a UI recover after losing a stream?|Reload authoritative message state or restart through a deliberate retry path. Do not concatenate a fresh generation onto an unknown partial result.
Message persistence|When should streamed content be saved?|Use a defined policy for completed and interrupted messages. Preserve stable IDs and avoid treating every partial chunk as a final answer.
Duplicate submissions|How can double-clicking create duplicate model costs?|Two requests may start separate generations. Use a request identity and appropriate server-side deduplication for operations that should run once.
Provider adapter configuration|Why verify the adapter against the installed AI SDK version?|Integration APIs and supported features evolve. Pin compatible packages and test the actual message, tool and streaming contracts.
OpenRouter model identifiers|Why avoid assuming identifiers match another provider's naming?|A routing service has its own catalog and naming conventions. Validate configured identifiers against its supported model list.
Gateway model selection|What must be considered beyond a model's name?|Check available providers, capabilities, context limits and routing configuration. The same logical model may have different serving characteristics.
Provider allowlists|Why restrict providers for some workloads?|Data handling, region or capability requirements may limit acceptable routes. A fallback should not silently bypass those constraints.
Fallback order|How should a fallback list be chosen?|Order compatible alternatives by task requirements and operational policy. Test quality, cost and schema behavior instead of assuming any available model is equivalent.
Unsupported parameters|What can happen when routing to a different provider?|Some parameters may be unsupported or behave differently. Validate required capabilities and fail explicitly when a critical setting cannot be honored.
Context-length failures|What is better than retrying the same oversized prompt?|Reduce or summarize context deliberately and preserve required evidence. Repeating an unchanged invalid request wastes time and budget.
Multimodal requests|What should be checked before forwarding images?|Validate supported formats, size and model modality. Authenticate access to referenced files and avoid forwarding arbitrary internal URLs.
Structured response schemas|Why test schema support across fallback models?|Models and providers may implement different schema subsets. Validate results and define behavior when a required constraint is unsupported.
Server-side tools|Why execute consequential tools on the server?|The server can enforce authorization and protect credentials. Model-selected arguments still require validation before any external effect.
Tool approval states|How should a chat UI represent pending approval?|Display the concrete proposed action and arguments separately from completion. Execute only after validated approval and show rejected or failed states clearly.
Tool result serialization|Why keep tool results bounded and serializable?|They cross runtime and model boundaries. Large or unsupported objects can break streaming, inflate context or reveal internal data.
Multi-step generation limits|Why cap tool-assisted model steps?|Repeated tool loops multiply latency and cost. Enforce a task-specific limit and return a clear partial result or escalation when exhausted.
Prompt caching versus response caching|How are these caching strategies different?|Prompt caching may reuse provider processing of repeated input. Response caching reuses an application answer and needs explicit freshness and authorization rules.
Cache tags|Why tag reusable reference data?|Tags let related cached data be invalidated intentionally. Keep user-specific chat state separate from broadly shared reference content.
Revalidation after mutation|Why refresh cached data after a successful tool write?|Otherwise the UI or later model context may read stale values. Tie invalidation to the committed operation and the installed Next.js cache APIs.
Dynamic request data|Why handle cookies and headers outside shared cache assumptions?|They represent per-request identity and behavior. Mixing them into a shared cached result without isolation can produce incorrect or private responses.
Runtime compatibility|Why check the runtime before selecting a provider SDK?|SDKs may depend on APIs unavailable in a chosen runtime. Test network, crypto and streaming support in the actual deployment environment.
Execution duration limits|Why can a locally working agent time out after deployment?|Hosting imposes request and execution limits. Bound interactive work or move long-running processing to a durable job model.
Rate limits by identity|Why limit authenticated users rather than only IP addresses?|Shared networks can group unrelated users while attackers may rotate IPs. Combine identity-aware quotas with other abuse controls.
Budget reservations|Why reserve budget before a long generation?|Concurrent requests can otherwise each pass the same balance check. Reserve capacity atomically and reconcile actual usage after completion.
Usage reconciliation|What if a request fails after consuming tokens?|Failure does not imply zero cost. Record available partial usage and reconcile against provider reporting without double-counting retries.
Sanitized error responses|Why avoid returning raw provider exceptions?|They may reveal credentials, internal routes or sensitive prompts. Return a useful error category and a correlation ID for diagnosis.
Gateway observability|What does gateway telemetry add to application logs?|It can show routing, usage and provider behavior. Correlate it with application request IDs to connect infrastructure symptoms to user outcomes.
Latency decomposition|How do you locate slow chat responses?|Measure authentication, history retrieval, model startup, tool execution and completion separately. Optimizing rendering will not fix a slow upstream tool.
Prompt versioning|Why associate a prompt version with each request?|It makes regressions attributable and supports reproducible evaluation. Store the version without exposing secret or sensitive prompt contents in general logs.
Provider contract tests|What should a provider smoke test verify?|Check basic generation, streaming, tool calls and structured output for the configured model. A successful plain-text request is insufficient coverage.
Server Action security|Does a Server Action automatically authorize a model operation?|No. Validate identity, input and resource access inside the action just as for an API endpoint. Server execution does not imply permission.
Deployment rollback|What should a rollback preserve for active chats?|Maintain compatible stored message formats and tool states. Reverting code should not strand pending approvals or make existing conversations unreadable.`),
    sources: refs(
      ["Next.js: component boundaries", "https://nextjs.org/docs/app/getting-started/server-and-client-components"],
      ["Next.js: Route Handler contracts", "https://nextjs.org/docs/app/getting-started/route-handlers"],
      ["Next.js: caching", "https://nextjs.org/docs/app/getting-started/caching"],
      ["Next.js: revalidation", "https://nextjs.org/docs/app/getting-started/revalidating"],
      ["Next.js: environment configuration", "https://nextjs.org/docs/app/guides/environment-variables"],
      ["AI SDK: chatbot", "https://ai-sdk.dev/docs/ai-sdk-ui/chatbot"],
      ["AI SDK: tool calling", "https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling"],
      ["OpenRouter: provider routing", "https://openrouter.ai/docs/guides/routing/provider-selection"],
      ["Vercel: gateway observability", "https://vercel.com/docs/ai-gateway/observability"]),
  },
  "Agentic AI core concepts and terms": {
    topics: topics(`
Foundation model|What does a foundation model provide to an agent?|It supplies general learned capabilities such as language understanding and generation. The application adds tools, state and control over real-world actions.
Inference|How does inference differ from training?|Inference uses an existing model to produce outputs. Training changes learned parameters; ordinary conversation history does not automatically retrain the model.
Autoregressive generation|Why can a fluent answer still be wrong?|Generation predicts plausible continuations rather than verifying every claim. External evidence and task-specific checks remain necessary.
Sampling|What does sampling change in model output?|It affects which possible continuation is selected. Different settings influence variability but do not establish factual accuracy.
Context engineering|How is context engineering broader than prompt wording?|It includes selecting messages, evidence, tools and state available at each step. Good wording cannot compensate for missing or irrelevant information.
System versus user messages|Why preserve role boundaries?|Roles distinguish application instructions from user content. The application should control trusted instructions and treat external material according to its trust level.
Few-shot prompting|What do few-shot examples teach at inference time?|They demonstrate desired patterns within the current context. They do not permanently update model weights or guarantee generalization beyond the examples.
Zero-shot prompting|When can a zero-shot request be sufficient?|A clear task with familiar requirements may need no examples. Evaluate whether examples improve difficult cases enough to justify context cost.
Tool schema|What is a tool schema's purpose?|It describes accepted arguments and structure for a callable operation. It does not authorize the operation or prove the values are correct.
Function calling|Is function calling the same as executing Python code?|No. The model proposes structured arguments to a named operation. Trusted application code decides whether and how to execute it.
Observation|What is an observation in an agent loop?|It is information returned after an action, such as a search result or error. The next decision should account for that evidence.
ReAct-style loop|What distinguishes an action-observation loop?|The system alternates model decisions and tool observations. It needs bounded execution and external validation, not unrestricted access based on generated reasoning.
Reasoning versus evidence|Why should generated explanations not be treated as proof?|Explanations can be persuasive but unsupported. Check observable tool results and source evidence when judging whether the task was completed correctly.
Planner|What does a planner contribute?|It decomposes a goal into proposed steps. Plans are provisional and should change when observations contradict their assumptions.
Executor|How does an executor differ from a planner?|An executor performs permitted steps and reports outcomes. Separating execution from planning can make authorization and failure handling clearer.
Replanning|When should an agent revise its plan?|When new evidence invalidates assumptions or a step fails irrecoverably. Replanning should remain within the original goal and execution budget.
Router|What is the router's responsibility?|It selects an appropriate handler or specialist for an input. Routing quality depends on clear categories and an explicit fallback for ambiguity.
Supervisor|What does a supervisor agent coordinate?|It assigns bounded work, tracks progress and combines results. Supervision does not remove the need for permission checks in each tool.
Worker agent|Why give a worker a narrow task?|A bounded scope reduces unnecessary context and authority. Require a structured result that the coordinating process can validate.
Handoff|How is a handoff different from calling a helper tool?|A handoff changes which agent controls the interaction. A helper call typically returns its result to the original controller.
Skills and progressive disclosure|Why load specialized instructions only when needed?|It reduces irrelevant context while retaining access to detailed procedures. Skill selection must still match the actual task and authority boundaries.
MCP host|What role does an MCP host play?|The host application manages user interaction and MCP clients. It decides which connected capabilities are available under its policies.
MCP client|What does an MCP client connect to?|It maintains a protocol connection to an MCP server. The client and host still need to manage authentication, permissions and returned data safely.
MCP server|What can an MCP server expose?|It can expose protocol-defined capabilities such as tools, resources and prompts. Availability does not imply the host should invoke every capability automatically.
MCP resources versus tools|How do resources differ from tools conceptually?|Resources expose contextual data; tools perform callable operations. Read access and action authority should be evaluated separately.
MCP prompts|What is a reusable protocol prompt?|It is a server-provided prompt template or interaction pattern. Hosts should treat its contents according to source trust rather than as overriding system policy.
Vector database|What does a vector database store for retrieval?|It stores vectors and associated information for similarity search. Applications still need document provenance, access control and update policies.
Chunking|Why split documents before embedding?|Smaller coherent units improve targeted retrieval within context limits. Splitting poorly can separate facts from the context needed to interpret them.
Reranker|How does reranking differ from initial retrieval?|It re-evaluates a candidate set for relevance. It cannot recover evidence that never entered that candidate set.
Semantic cache|What is the risk of reusing answers to similar questions?|Similar wording may hide different permissions or constraints. Validate equivalence, freshness and user scope before returning a cached answer.
Ground truth|Why is ground truth sometimes difficult for agent tasks?|Many tasks have multiple valid outputs or depend on changing external state. Define observable acceptance criteria instead of assuming one ideal sentence.
Precision and recall|How do these apply to retrieval?|Precision concerns how much retrieved material is relevant; recall concerns how much needed evidence was found. Tune the tradeoff for the task.
Trajectory|What is an agent trajectory?|It is the sequence of decisions, tool calls and observations in a run. Evaluate it when intermediate behavior matters as much as the final answer.
Guardrail|What can a guardrail enforce?|It can check inputs, outputs or actions against explicit constraints. No single guardrail replaces authorization, isolation and outcome evaluation.
Least privilege|How does least privilege apply to agents?|Expose only the data and operations needed for the task. Restrict permissions in executable policy rather than relying on the model to self-limit.
Sandbox|What does sandboxing protect?|It limits execution access to files, processes or networks. The sandbox must be configured and enforced outside the model's generated instructions.
Human in the loop|What makes human review meaningful?|The reviewer sees the concrete proposed action and relevant context before execution. Vague approval of an entire session offers weaker control.
Idempotency|Why is idempotency important for agent tools?|Failures and retries can repeat calls. An idempotent operation preserves the intended effect when the same logical request executes again.
Checkpoint|What does a checkpoint not guarantee?|It saves execution state but does not automatically make external effects exactly once or ensure the final answer is correct.
Token budget|Why budget more than the final response length?|Prompts, retrieval, tool observations and repeated model calls all consume tokens. Budget the complete run rather than only its visible answer.
Latency budget|Why allocate latency across stages?|Retrieval, models and tools compete for the same response deadline. Stage budgets reveal where to stop, parallelize or defer work.
Abstention|When should an agent say it cannot answer reliably?|When required evidence or authority is missing. A clear limitation or clarification request is preferable to inventing facts or actions.`),
    sources: refs(
      ["LangChain: context engineering", "https://docs.langchain.com/oss/python/langchain/context-engineering"],
      ["LangChain: retrieval concepts", "https://docs.langchain.com/oss/python/langchain/retrieval"],
      ["LangChain: guardrails", "https://docs.langchain.com/oss/python/langchain/guardrails"],
      ["MCP: architecture", "https://modelcontextprotocol.io/docs/learn/architecture"],
      ["MCP: server concepts", "https://modelcontextprotocol.io/docs/learn/server-concepts"],
      ["LangChain: skills", "https://docs.langchain.com/oss/python/langchain/multi-agent/skills"]),
  },
  "Agentic AI": {
    topics: topics(`
Task acceptance criteria|Why define success before selecting agent tools?|A concrete outcome lets the system decide when to stop and evaluators judge completion. Otherwise tool activity can be mistaken for progress.
Autonomy boundaries|How do you decide which decisions a model may make?|Delegate choices that benefit from interpretation while keeping permissions and hard invariants deterministic. Start with the minimum autonomy needed.
Tool allowlists|Why should available tools depend on task scope?|Broad tool access increases ambiguity and potential impact. Select a relevant subset using trusted application policy and authenticated context.
Read versus write tools|Why separate retrieval from state-changing operations?|Read tools gather evidence, while write tools cause effects that may require approval and idempotency. Separate contracts make those differences explicit.
Tool preconditions|What should be checked immediately before execution?|Verify authorization, current resource state and business constraints. A previously valid plan can become invalid as external state changes.
Tool postconditions|Why verify an operation after a success response?|Transport success may not establish the intended business outcome. Check authoritative state or an appropriate receipt when the effect matters.
Plan representation|Why use structured plans instead of only narrative text?|Structured steps make dependencies, completion and permissions inspectable. Keep the plan flexible enough to accommodate new evidence.
Plan invalidation|What should happen when a prerequisite becomes false?|Stop dependent actions and revise or escalate. Continuing an obsolete plan can cause incorrect writes even if each tool call is syntactically valid.
Sequential dependencies|When is parallel execution inappropriate?|When a step needs another step's result or both modify a shared invariant. Express dependencies rather than relying on completion timing.
Fan-out limits|Why limit the number of delegated subtasks?|Unbounded delegation multiplies model and tool usage. Set concurrency and total-work budgets before launching workers.
Fan-in aggregation|How should a coordinator combine worker outputs?|Validate each result, preserve provenance and handle missing workers explicitly. Do not blindly concatenate conflicting claims into a final answer.
Worker specialization|When does a specialist agent improve a workflow?|A distinct tool set or context can benefit a specialized task. Splitting identical roles adds coordination cost without guaranteed quality gains.
Context isolation|Why isolate worker histories?|It reduces irrelevant information and accidental cross-task influence. Share only necessary evidence and a clear output contract.
Supervisor bottlenecks|How can a supervisor become inefficient?|It may serialize too much work or repeatedly reinterpret every result. Use deterministic aggregation where possible and delegate bounded independent tasks.
Handoff state|What must survive a transfer to another agent?|Preserve the user's goal, relevant constraints and verified progress. Avoid copying unrelated sensitive history or losing pending obligations.
Router uncertainty|What should a router do with an ambiguous request?|Use a clarification or fallback path rather than forcing an unreliable category. Track misroutes as evaluation cases.
Evaluator independence|Why should evaluation use more than agent self-confidence?|Confidence language is not calibrated proof. Combine external checks, evidence review and human assessment where the task requires it.
Revision budgets|How do you prevent an evaluator loop from stalling?|Set a maximum number of revisions and a clear acceptance criterion. Return unresolved issues when further iterations stop improving results.
Evidence provenance|Why attach source identity to intermediate claims?|It lets later steps verify and cite evidence. Losing provenance makes unsupported synthesis harder to detect.
Conflicting evidence|How should an agent handle sources that disagree?|Compare authority, date and scope, then state uncertainty or seek clarification. Do not silently select whichever claim fits the draft.
Context compression|What should survive summarization between stages?|Retain goals, constraints, verified facts and unresolved issues. Store critical structured data separately from lossy narrative summaries.
Memory write policy|Who should decide what becomes durable memory?|Use explicit application rules and appropriate user control. A model's suggestion alone should not justify storing sensitive or permanent personal information.
Memory poisoning|How can untrusted content affect later sessions?|If malicious instructions are stored as trusted memory, they can influence future runs. Validate memory writes and preserve source trust metadata.
Prompt-injection testing|What should an adversarial retrieval test include?|Documents that ask the agent to ignore rules, reveal secrets or invoke unrelated tools. Assert that application permissions remain enforced.
Output validation|Why validate the final result independently of tool success?|Successful tools can still be combined into an incorrect answer. Check task constraints, evidence and expected output structure.
Approval freshness|Why should approvals expire or bind to a state version?|Resources and proposed arguments can change. Stale approval should not authorize a materially different action.
Denied approvals|How should the agent respond to rejection?|Respect the denial and explain the resulting limitation. Do not retry the same action through a different tool to bypass review.
Reversible actions|Why prefer a draft or preview stage for consequential work?|It gives users a concrete result to inspect before external effects. Keep the transition from draft to committed action explicit.
Cancellation semantics|What should cancel mean for an agent with tools?|Stop future work and propagate cancellation where possible. Already committed external effects may need compensation rather than pretending they never happened.
Long-running jobs|When should an agent task outlive an HTTP request?|Tasks with approvals or substantial work need durable job state. Return a reference and provide progress instead of relying on one fragile connection.
Recovery ownership|Who should resume a failed durable run?|An authorized worker should acquire the right to continue the execution. Prevent simultaneous resumptions and repeatable side effects.
External idempotency keys|What should an idempotency key identify?|It should identify the logical business operation, not each retry attempt. Preserve it across recovery and reject conflicting payload reuse.
Compensating actions|Why must compensation be designed before execution?|Some multi-step tasks can partially succeed. Define how to restore an acceptable state or escalate when an effect cannot be undone.
Dependency degradation|What should happen when a nonessential tool is unavailable?|Continue only if the task can still meet its criteria, clearly noting missing evidence. Do not substitute invented results.
Model substitution|Why evaluate fallback models on the full workflow?|Different models may choose tools differently or violate output expectations. Plain-text compatibility does not establish agent-level compatibility.
Security-sensitive logs|Why avoid recording every tool argument verbatim?|Arguments can contain secrets or personal data. Use redaction and access controls while preserving diagnostic identifiers.
Outcome metrics|What metric is more meaningful than number of tool calls?|Measure completed authorized tasks and quality under constraints. More calls can indicate inefficiency rather than greater capability.
Cost-quality frontiers|How do you compare two agent designs fairly?|Evaluate quality, latency and total run cost on the same task distribution. A cheaper model may become expensive if it needs many retries.
Shadow execution|What can a shadow rollout reveal?|It compares proposed behavior on real inputs without committing side effects. Ensure shadow tools cannot accidentally perform live writes.
Canary rollout|Why release to a limited audience first?|It exposes operational and behavioral issues under realistic conditions while limiting impact. Monitor predefined rollback signals.
Regression libraries|Which incidents should become permanent tests?|Convert confirmed failures and critical edge cases into reviewed examples. Keep references and expected behavior current as the product changes.
Architecture simplification|When should a multi-agent system become a simpler workflow?|When specialization adds cost without measurable benefit. Replace unnecessary model decisions with explicit code while retaining the flexibility the task actually needs.`),
    sources: refs(
      ["LangChain: multi-agent architecture", "https://docs.langchain.com/oss/python/langchain/multi-agent"],
      ["LangChain: subagents", "https://docs.langchain.com/oss/python/langchain/multi-agent/subagents"],
      ["LangChain: handoffs", "https://docs.langchain.com/oss/python/langchain/multi-agent/handoffs"],
      ["LangChain: routers", "https://docs.langchain.com/oss/python/langchain/multi-agent/router"],
      ["LangChain: action guardrails", "https://docs.langchain.com/oss/python/langchain/guardrails"],
      ["LangSmith: agent evaluation", "https://docs.langchain.com/langsmith/evaluate-llm-application"]),
  },
  "n8n + LangChain + LangGraph + LangSmith + LangFlow": {
    topics: topics(`
Reference architecture|What is the smallest useful integrated architecture?|Start with an event source, one execution service and an outcome store. Add visual flows and evaluation components only where they solve a concrete need.
Avoiding duplicate orchestration|Why not let every platform retry and replan independently?|Nested policies can multiply attempts and cause conflicting control. Assign ownership of execution, retries and business decisions explicitly.
Event envelopes|What fields should an incoming business event carry?|Include a stable event ID, type, schema version and relevant timestamp. Derive trusted identity from authentication rather than blindly trusting event fields.
Webhook validation boundary|What should n8n validate before forwarding an event?|Check authenticity, required shape and basic size limits. The receiving service should still enforce its own authorization and domain rules.
Canonical request schemas|Why normalize different integrations before calling the agent?|A canonical contract isolates the agent from provider-specific payload variations. Preserve provenance so errors can still be traced to their source.
Contract version negotiation|How do you introduce a breaking service change?|Publish a new contract version and migrate callers deliberately. Keep old behavior available until dependent workflows are updated or retired.
Service authentication|Why is network reachability not authorization?|An endpoint reachable inside a network may still receive unauthorized requests. Authenticate service identity and enforce the permitted operations.
Credential rotation|How should shared integrations survive rotating a secret?|Update managed configuration, allow a deliberate transition where supported and verify callers. Avoid hard-coded credentials embedded in exported workflows.
Tenant propagation|Why must downstream tools recheck tenant scope?|A compromised or buggy upstream component can send incorrect identifiers. Enforce ownership at each data-access boundary, not only at the webhook.
Correlation headers|What should a correlation header be used for?|It connects logs and traces across services. It is diagnostic context, not proof that a caller is trusted.
Business IDs versus execution IDs|Why keep these identifiers separate?|One business operation may have multiple execution attempts. Separate IDs let retries be observed without treating them as new business work.
Idempotency payload conflicts|What if the same event ID arrives with different contents?|Reject or investigate the conflict rather than silently reusing an unrelated result. Bind deduplication records to a payload fingerprint or equivalent contract.
Deduplication persistence|Why must deduplication survive worker restarts?|A memory-only record disappears and allows replayed events to execute again. Store logical operation status durably with appropriate uniqueness constraints.
Acknowledgment ordering|When should an event be acknowledged?|After durable acceptance or committed processing according to the contract. Acknowledging before recoverable storage can lose work on a crash.
Accepted-job responses|What should a 202-style response communicate?|It confirms acceptance, not successful completion. Include an execution reference and a supported way to obtain status or results.
Status state machines|Why define explicit job states?|Queued, running, awaiting approval, succeeded and failed have different meanings. Validate transitions so clients cannot observe impossible or misleading combinations.
Callback authentication|How do you trust a completion callback?|Authenticate the sender and bind the callback to an existing job. Validate freshness and payload structure before changing authoritative state.
Callback deduplication|What should happen when completion is delivered twice?|Apply the same final transition once and return the existing result. Duplicate callbacks must not send duplicate notifications or restart processing.
Polling backoff|Why should status clients not poll continuously?|Aggressive polling adds load without making work faster. Use bounded backoff, completion signals or a suitable callback mechanism.
Graph service boundaries|Why keep graph runtime details behind a service contract?|It allows independent runtime upgrades and controlled access to threads. Clients should not manipulate internal checkpoint data directly.
LangChain tool wrappers|What should an HTTP-backed agent tool encapsulate?|Validate arguments, attach authorized context, enforce a deadline and normalize the result. Keep transport errors distinct from business outcomes.
Langflow input mapping|Why map fields explicitly when invoking a flow?|Component input names and types may not match the service's canonical schema. Explicit mapping prevents accidental omission or unsafe forwarding.
Langflow output validation|Why validate a successful flow response?|HTTP success does not guarantee the returned data satisfies downstream business requirements. Parse the expected structure before updating graph state.
MCP integration choice|When might MCP be preferable to a custom HTTP wrapper?|Use it when clients benefit from standardized capability discovery and supported tool contracts. It does not remove authentication or compatibility testing.
Timeout hierarchy|How should timeouts relate across n8n, graph and tool calls?|Inner calls should fit within outer deadlines, leaving time for cleanup and error reporting. Avoid an upstream timeout while unbounded downstream work continues.
Retry ownership|Which layer should retry a failed external write?|Choose one authoritative policy for the logical operation. Other layers should return or inspect status rather than independently multiplying attempts.
Circuit isolation|How do you stop one failing flow service from blocking everything?|Use bounded concurrency, timeouts and a circuit policy around that dependency. Isolate its work from unrelated requests.
Backpressure across platforms|What should happen when graph workers are saturated?|Queue within defined limits or reject admission clearly. Do not let n8n create an unlimited backlog that exceeds recovery capacity.
Durable approval records|What should be stored before asking for approval?|Store the proposed action, arguments, owner and relevant state version. The callback must reference that concrete proposal.
Approval expiry|Why reject an old approval callback?|The job or resource may have changed, making the original decision invalid. Require renewed review when the proposed effect is no longer the same.
Cross-service cancellation|What does cancelling a job require?|Mark the authoritative state, notify active workers and stop future effects. Define how to report operations already committed before cancellation.
Compensation ownership|Who coordinates recovery after partial business success?|The workflow's authoritative orchestrator should track completed effects and compensations. Individual tools should report outcomes rather than invent global recovery policy.
Outbox notifications|Why publish completion notifications through a durable outbox?|It couples result persistence with intent to notify. A separate publisher can retry delivery without losing or duplicating the business completion.
Trace context propagation|What should be preserved across asynchronous boundaries?|Carry request correlation and supported tracing context when enqueueing work. Reconstruct parent relationships without exposing credentials in metadata.
Tracing gaps|Why can a multi-platform trace be incomplete?|Not every component is automatically instrumented, and context can be lost across HTTP or queues. Add explicit boundary instrumentation where supported.
Cross-platform redaction|Where should sensitive data be removed from telemetry?|Apply redaction before data leaves each service. A downstream masking policy cannot erase sensitive values already stored upstream.
Evaluation fixtures|What makes a useful end-to-end test fixture?|Include the original event, controlled tool responses and expected authorized outcome. Keep sensitive production data sanitized and contracts versioned.
Failure injection|Where should you simulate failures in the combined workflow?|Test before and after durable writes, during external calls and while awaiting review. Verify recovery never repeats a completed business effect.
Schema rollout sequencing|Why coordinate service and workflow deployments?|A new flow schema can break an older graph wrapper or n8n mapping. Deploy compatible readers first and retire old contracts deliberately.
Disaster recovery|What data must be restored together after an outage?|Restore execution state, business records and deduplication information consistently. Reconcile external effects before blindly replaying queued events.
Integration cost attribution|How do you calculate cost per completed ticket?|Combine model usage, workflow execution and relevant infrastructure costs using a business identifier. Count retries and failed attempts, not only successful calls.
Operational runbooks|What should a support runbook explain?|Document how to locate a job, inspect traces, approve recovery and replay safely. Include ownership and escalation for failures spanning multiple platforms.`),
    sources: refs(
      ["n8n: execution error handling", "https://docs.n8n.io/flow-logic/error-handling/"],
      ["n8n: distributed execution", "https://docs.n8n.io/hosting/scaling/queue-mode/"],
      ["LangChain: tool contracts", "https://docs.langchain.com/oss/python/langchain/tools"],
      ["LangGraph: durable state", "https://docs.langchain.com/oss/python/langgraph/persistence"],
      ["LangGraph: approval interrupts", "https://docs.langchain.com/oss/python/langgraph/interrupts"],
      ["Langflow: API execution", "https://docs.langflow.org/workflow-api-quickstart"],
      ["LangSmith: cross-run observability", "https://docs.langchain.com/langsmith/observability"],
      ["MCP: integration architecture", "https://modelcontextprotocol.io/docs/learn/architecture"]),
  },
};
