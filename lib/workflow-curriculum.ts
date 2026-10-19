import { WORKFLOW_CURRICULUM_EXTRA } from "./workflow-curriculum-extra";

export type WorkflowTopic = { title: string; question: string; answer: string };
export type WorkflowCurriculum = {
  topics: WorkflowTopic[];
  sources: { title: string; url: string }[];
};
const topic = (title: string, question: string, answer: string): WorkflowTopic => ({ title, question, answer });
const source = (title: string, url: string) => ({ title, url });

/** Interview practice selected for coverage, not a measured ranking of question frequency. */
const FOUNDATION_CURRICULUM: Record<string, WorkflowCurriculum> = {
  "System Design": {
    topics: [
      topic("Capacity estimation", "How do you estimate capacity before choosing infrastructure?", "Estimate peak requests, payload size, retention and read/write ratio. Calculate storage and bandwidth, then validate assumptions with a load test."),
      topic("Load balancing and horizontal scaling", "Why do stateless services scale more easily?", "Any healthy instance can serve a request when session state lives outside the process. Scaling still depends on downstream database and queue capacity."),
      topic("Caching and invalidation", "What can go wrong with cache-aside?", "Stale values, hot keys and simultaneous misses can overload the database. Use bounded TTLs, deliberate invalidation and request coalescing where appropriate."),
      topic("Replication and consistency", "Does a read replica guarantee read-your-writes?", "Not with asynchronous replication. Route consistency-sensitive reads to an authoritative store or use an explicit consistency mechanism; explain the latency tradeoff."),
      topic("Sharding and hot partitions", "How do you choose a shard key?", "Balance access locality against even distribution. A popular tenant can create a hot shard; plan rebalancing and cross-shard query behavior."),
      topic("Queues and idempotency", "How do you handle duplicate message delivery?", "Use a stable operation ID and persist deduplication with the business write. Acknowledge after committing; retries must not repeat the side effect."),
      topic("Rate limiting and backpressure", "How are rate limits different from backpressure?", "Rate limits enforce admission policies. Backpressure slows producers when consumers cannot keep up; bounded queues prevent unbounded memory growth."),
      topic("Timeouts, retries and circuit breakers", "Why can retries make an outage worse?", "Unbounded retries amplify traffic. Use deadlines, capped exponential backoff with jitter and a retry budget; a circuit breaker temporarily stops calls to a failing dependency."),
      topic("Saga and transactional outbox", "How do you coordinate a database write and event publication?", "Write an outbox record in the same transaction, then publish asynchronously. A saga coordinates multiple local transactions with explicit compensating actions."),
      topic("SLOs, observability and recovery", "What would you measure for a checkout service?", "Track success rate, tail latency, queue lag and recovery time. Define an availability objective and test restoration against recovery point and recovery time targets."),
    ],
    sources: [source("Microsoft: cloud design patterns", "https://learn.microsoft.com/en-us/azure/architecture/patterns/"), source("AWS: Well-Architected Framework", "https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html")],
  },
  LangChain: {
    topics: [
      topic("Models and messages", "Why preserve message roles and tool-call IDs?", "Roles distinguish instructions, user requests and tool results. Matching call IDs lets the model associate each observation with the tool invocation that produced it."),
      topic("create_agent and the tool loop", "When is an agent preferable to a fixed chain?", "Use an agent when tool selection depends on intermediate results. Prefer explicit steps when the execution path is already known."),
      topic("Tool schemas", "What makes a reliable tool interface?", "Use narrow responsibilities, typed arguments and clear descriptions. Validate inputs and authorization in application code; a model-generated call is only a proposal."),
      topic("Structured output", "Does valid JSON guarantee a correct answer?", "No. Schema validation checks shape and types; domain rules and evidence checks must establish whether values are meaningful and supported."),
      topic("RAG and retrieval", "Why can retrieval quality limit answer quality?", "The model cannot reliably use evidence it never receives. Evaluate chunking, metadata filters and relevant-document recall before tuning the answer prompt."),
      topic("Embeddings and vector search", "Is the nearest vector always the right evidence?", "Similarity is a ranking signal, not a correctness guarantee. Combine retrieval with access filters, relevance checks and, where useful, reranking."),
      topic("Short-term and long-term memory", "How should conversation state differ from durable user memory?", "Conversation state belongs to a thread. Durable memory needs deliberate storage, retrieval, access rules and deletion rather than retaining every message indefinitely."),
      topic("Middleware and guardrails", "Where should you put model and tool policies?", "Middleware can intercept model or tool calls for validation, context changes and error handling. Enforce consequential permissions at the tool boundary too."),
      topic("Streaming and tool errors", "How should a UI handle a failing tool during streaming?", "Distinguish partial model text from completed results. Return a structured error and a retry or escalation path instead of presenting the unfinished run as success."),
      topic("LangChain versus LangGraph", "When would you move to explicit graph orchestration?", "Use LangChain for a configurable agent loop. Use LangGraph when you need detailed control over state transitions, branching, persistence and human review."),
    ],
    sources: [source("LangChain: overview", "https://docs.langchain.com/oss/python/langchain/overview"), source("LangChain: retrieval", "https://docs.langchain.com/oss/python/langchain/retrieval"), source("LangChain: middleware", "https://docs.langchain.com/oss/python/langchain/middleware/overview"), source("LangChain: context engineering", "https://docs.langchain.com/oss/python/langchain/context-engineering")],
  },
  LangGraph: {
    topics: [
      topic("StateGraph, nodes and edges", "What does a graph node return?", "A node returns updates to shared state rather than needing to replace the entire state. Edges determine the next computation."),
      topic("Reducers and concurrent updates", "Why do parallel branches need reducers?", "Multiple branches may update the same state key. A suitable reducer defines how updates combine instead of relying on accidental execution order."),
      topic("Conditional routing", "How do you express a decision after a node?", "Route using state-derived conditions or a Command that combines an update with navigation. Keep routing outcomes explicit and test every branch."),
      topic("Fan-out and fan-in", "How do you parallelize a variable number of subtasks?", "Use dynamic dispatch, such as Send, to create work for each input. Aggregate outputs with a reducer and define when downstream processing should proceed."),
      topic("Checkpointers and thread IDs", "What happens if two unrelated requests reuse a thread ID?", "They may access the same persisted execution history. Assign thread identifiers deliberately and enforce tenant ownership before loading or resuming state."),
      topic("Interrupts and human review", "How does an interrupted graph continue?", "Persist the graph with a checkpointer, then resume the same thread with a Command resume value. Code before the interrupt can run again."),
      topic("Replay and side effects", "Does checkpointing make external writes exactly once?", "No. Replay can repeat work. Make external operations idempotent and isolate side effects so recovery does not duplicate payments, messages or records."),
      topic("Subgraphs and state boundaries", "Why put part of a workflow in a subgraph?", "Subgraphs encapsulate reusable execution logic. Define shared versus private state keys and map inputs and outputs when schemas differ."),
      topic("Streaming state and tokens", "What should a graph UI stream?", "Choose the relevant state updates, messages or custom progress events. Keep internal state and sensitive tool data out of public client events."),
      topic("Cycles and termination", "How do you prevent an agent graph from looping forever?", "Define completion conditions, step limits and a bounded recovery path. Repeated tool failure should lead to an error or human escalation."),
    ],
    sources: [source("LangGraph: Graph API", "https://docs.langchain.com/oss/python/langgraph/graph-api"), source("LangGraph: interrupts", "https://docs.langchain.com/oss/python/langgraph/interrupts"), source("LangGraph: persistence", "https://docs.langchain.com/oss/python/langgraph/persistence")],
  },
  LangFlow: {
    topics: [
      topic("Components and typed ports", "Why can two components fail to connect?", "Their input and output types may be incompatible. Inspect port types and add an explicit conversion rather than assuming every output is plain text."),
      topic("Messages and structured data", "Why distinguish a chat message from a data object?", "A message carries conversational information; structured data represents fields for processing. Preserve the expected type as values pass between components."),
      topic("Prompt variables", "How do you debug a prompt with missing values?", "Inspect the upstream output and variable names. Test the smallest connected path before adding retrieval, agents or downstream integrations."),
      topic("RAG ingestion and query flows", "Why separate ingestion from question answering?", "Ingestion loads, chunks and indexes documents. Query execution retrieves evidence; rebuilding the index for every question adds unnecessary cost and latency."),
      topic("Agent tools", "How is a tool different from a mandatory flow step?", "An agent can choose an available tool based on context. A directly connected processing path runs according to the flow's dependency structure."),
      topic("Custom Python components", "When would you write a custom component?", "Use one for domain logic or an integration absent from the catalog. Declare inputs and outputs clearly, validate values and return the promised type."),
      topic("API authentication", "Where should a flow API key live?", "Keep credentials in a trusted server or secret store. A browser should call your authorized backend rather than expose a privileged flow credential."),
      topic("Sync, streaming and background runs", "How do you choose a Workflow API execution mode?", "Use synchronous responses for bounded requests, streaming for incremental events and background execution when completion may outlive a normal interactive request."),
      topic("Flow versioning and reproducibility", "How would you reproduce a failed flow run?", "Retain the flow definition, component configuration, dependency versions and sanitized input. Secrets should be supplied separately rather than embedded in exported artifacts."),
      topic("Debugging and deployment", "What should you verify before exposing a prototype flow?", "Test type boundaries, missing inputs, model failures and concurrent requests. Define request limits and monitor latency and error rates after deployment."),
    ],
    sources: [source("Langflow: visual editor", "https://docs.langflow.org/concepts-overview"), source("Langflow: custom components", "https://docs.langflow.org/components-custom-components"), source("Langflow: Workflow API", "https://docs.langflow.org/workflow-api-quickstart")],
  },
  LangSmith: {
    topics: [
      topic("Traces and runs", "How do traces help debug an agent?", "A trace groups related runs so you can inspect model calls, tool execution and their timing. It reveals which step produced an incorrect result."),
      topic("Metadata and correlation", "How do you locate one failed customer request?", "Attach a request identifier and appropriate metadata to execution records. Avoid placing secrets or unnecessary personal information in searchable fields."),
      topic("Datasets and reference answers", "What makes a useful evaluation dataset?", "Include realistic inputs, edge cases and expected behavior. Reference answers help when correctness can be specified, but not every task has one exact valid answer."),
      topic("Deterministic evaluators", "When should you use code instead of an LLM judge?", "Use code for exact properties such as schema validity, required fields and executable outcomes. It is generally more reproducible for those checks."),
      topic("LLM-as-judge", "How do you make model-based evaluation more credible?", "Specify a rubric, calibrate against human judgments and investigate disagreement. Judge scores are measurements with limitations, not ground truth."),
      topic("Experiments and regression analysis", "How do you compare two prompts fairly?", "Run both on the same dataset and compare individual cases as well as aggregate scores. Keep model and configuration differences visible."),
      topic("Offline versus online evaluation", "Why do you need both evaluation modes?", "Offline evaluation compares changes on repeatable examples. Online evaluation observes actual production traffic, which may contain new behaviors and failure modes."),
      topic("Human feedback and annotation", "How should user feedback improve the system?", "Link feedback to the relevant run, review ambiguous reports and turn confirmed failures into test cases. A thumbs-down alone does not identify the cause."),
      topic("Latency, tokens and cost", "Why is answer quality not the only release criterion?", "A better answer may require more calls or longer latency. Compare quality with task completion, response time and usage before choosing a configuration."),
      topic("Sampling and privacy", "Should every production payload be traced verbatim?", "Choose sampling and redaction policies suited to the application. Preserve enough execution context for diagnosis while limiting sensitive data exposure."),
    ],
    sources: [source("LangSmith: observability", "https://docs.langchain.com/langsmith/observability"), source("LangSmith: evaluation", "https://docs.langchain.com/langsmith/evaluation")],
  },
  n8n: {
    topics: [
      topic("Triggers and webhooks", "How should a webhook workflow acknowledge long-running work?", "Validate and accept the request promptly, then process asynchronously when necessary. Give callers a stable reference instead of forcing them to hold a connection indefinitely."),
      topic("Items, expressions and mappings", "Why might a node process unexpected values?", "Check the incoming items and field mappings. Expressions are evaluated in an execution context; verify which item's data a downstream node actually receives."),
      topic("Branching and merging", "What do you check when merging two branches?", "Define how items correspond and what happens when one branch returns nothing. Test cardinality rather than assuming equal-length outputs."),
      topic("Batching and pagination", "How do you import a large external dataset?", "Follow the API's pagination contract, process bounded batches and preserve progress. Respect rate limits instead of launching an unbounded request burst."),
      topic("Credentials and environments", "Why separate credentials from workflow logic?", "It enables rotation and environment-specific configuration without rewriting nodes. Share only the access necessary for the workflow's operations."),
      topic("Error workflows", "How do you centralize failure handling?", "Configure an error workflow to react to failed executions. Capture useful context and notify an owner; deliberately thrown errors can route invalid business states there."),
      topic("Retries and duplicate events", "Why is retrying a CRM write dangerous?", "The write may have succeeded before the response was lost. Use a stable external identifier or deduplication record so repeating the operation does not create duplicates."),
      topic("Queue mode and workers", "How does queue mode scale execution?", "Execution jobs are distributed through Redis to workers. Shared persistence and consistent encryption configuration are necessary; adding workers does not remove downstream bottlenecks."),
      topic("AI root nodes and sub-nodes", "What is special about n8n's AI node structure?", "AI root nodes connect to supporting model, memory or tool sub-nodes. Inspect each node's input semantics instead of assuming ordinary item processing rules."),
      topic("Sub-workflows and HTTP integration", "When should a workflow call a separate service?", "Use a service boundary for specialized runtime logic or independent scaling. Define authentication, request schemas, timeouts and error behavior explicitly."),
    ],
    sources: [source("n8n: error handling", "https://docs.n8n.io/flow-logic/error-handling/"), source("n8n: queue mode", "https://docs.n8n.io/hosting/scaling/queue-mode/"), source("n8n: LangChain integration", "https://docs.n8n.io/advanced-ai/langchain/overview/")],
  },
  "Python with AI and Agentic AI": {
    topics: [
      topic("Mutability and object identity", "Why are mutable default arguments risky?", "A default object is created once and can be shared across calls. Use a sentinel such as None and create the collection inside the function."),
      topic("Iterators and generators", "Why stream a large document collection?", "Generators yield items incrementally, reducing peak memory. They still require deliberate handling of errors, cleanup and downstream backpressure."),
      topic("Type hints and runtime validation", "Do type hints validate model-generated arguments?", "No. Annotations describe intended types but do not enforce external inputs at runtime. Validate tool arguments before performing operations."),
      topic("Context managers", "How should a tool release network and file resources?", "Use context managers or try/finally so cleanup runs on success, error and cancellation. Do not depend on garbage collection for timely release."),
      topic("Async I/O versus CPU work", "Will async def make CPU-heavy embedding preparation faster?", "Not by itself. Async coordinates waiting; CPU work may need processes or native implementations. Blocking work inside the event loop delays other tasks."),
      topic("TaskGroup and cancellation", "What happens when a TaskGroup child fails?", "For ordinary non-cancellation failures, the group cancels remaining tasks and waits for them. Handle grouped errors and avoid swallowing cancellation during cleanup."),
      topic("Timeouts and bounded concurrency", "How do you prevent thousands of simultaneous tool calls?", "Use an explicit concurrency bound, deadlines and a bounded input queue. Retries also need a budget so failures cannot multiply pending work indefinitely."),
      topic("Exceptions and retry policy", "Should every exception trigger a retry?", "No. Retry transient failures when the operation is safe to repeat. Invalid inputs and authorization failures generally need correction rather than repeated requests."),
      topic("Tool contracts and structured responses", "How do you make a Python tool usable by an agent?", "Provide a narrow function, clear description and input schema. Return bounded structured results and keep authorization separate from the model's choice to invoke it."),
      topic("Testing nondeterministic applications", "How can you test an AI service reliably?", "Test deterministic boundaries with fixtures and simulated tools, then evaluate model behavior on a fixed dataset. Include timeouts, malformed outputs and partial failures."),
    ],
    sources: [source("Python: classes and generators", "https://docs.python.org/3/tutorial/classes.html"), source("Python: asyncio tasks", "https://docs.python.org/3/library/asyncio-task.html"), source("Python: control flow and functions", "https://docs.python.org/3/tutorial/controlflow.html"), source("Python: errors and exceptions", "https://docs.python.org/3/tutorial/errors.html")],
  },
  "Agentic AI core concepts and terms": {
    topics: [
      topic("Agent versus workflow", "What makes an execution agentic?", "A model chooses actions based on observations. A workflow can contain model calls while still following a predefined sequence of steps."),
      topic("Tokens and context window", "Why is more context not always better?", "Extra context consumes budget and may bury relevant evidence. Select information needed for the task instead of appending every available document."),
      topic("Embeddings and semantic retrieval", "What is an embedding used for?", "It represents content numerically for similarity comparisons. Similarity supports retrieval but does not establish truth, permissions or task relevance."),
      topic("RAG versus fine-tuning", "When is retrieval a better first step?", "Use retrieval when answers depend on changing or private evidence. Fine-tuning changes learned behavior; it is not a substitute for reliable access to current facts."),
      topic("Tools and observations", "Does a tool call execute itself?", "No. The application validates and executes the proposed operation, then returns an observation. Authorization remains the application's responsibility."),
      topic("State, memory and checkpoints", "How do these three terms differ?", "State represents current execution data, memory retains selected information for later use, and a checkpoint saves execution state for inspection or continuation."),
      topic("Planning and reflection", "Does asking a model to review itself prove correctness?", "No. Self-review can help but shares model limitations. Prefer external evidence, executable checks and independent evaluation for consequential claims."),
      topic("Grounding and hallucination", "How do you check whether an answer is grounded?", "Verify that cited evidence supports the actual claims. Fluent wording and a valid citation URL are insufficient if the source does not substantiate the answer."),
      topic("Prompt injection and trust boundaries", "Why should retrieved text not control tool permissions?", "Retrieved content is data from a less trusted source. Keep permissions in application policy and validate actions regardless of instructions embedded in documents."),
      topic("Evaluation and task success", "How is task success different from text quality?", "An elegant response may fail the user's objective. Measure the actual outcome, evidence quality and failure behavior alongside the readability of the answer."),
    ],
    sources: [source("LangChain: context engineering", "https://docs.langchain.com/oss/python/langchain/context-engineering"), source("LangChain: retrieval", "https://docs.langchain.com/oss/python/langchain/retrieval"), source("LangGraph: workflow patterns", "https://docs.langchain.com/oss/python/langgraph/workflows-agents")],
  },
  "Next.js with OpenRouter and Vercel AI Gateway": {
    topics: [
      topic("Server and Client Components", "Where should model credentials and chat interactions live?", "Keep provider calls and credentials on the server. Use Client Components for interactive input, local state and browser events."),
      topic("Route Handlers and authorization", "Is a server endpoint private by default?", "No. Authenticate callers, authorize resource access and validate bodies in the handler. Server placement protects secrets, not automatic access control."),
      topic("Streaming and cancellation", "What should happen when a user cancels generation?", "Propagate cancellation where supported and stop updating the abandoned UI. Distinguish completed messages from interrupted output and record partial usage when available."),
      topic("AI SDK provider adapters", "Are OpenRouter and AI Gateway the same service?", "No. They are separate routing options with distinct configuration and credentials. An AI SDK integration can standardize calls without making all provider features identical."),
      topic("Model fallback versus provider fallback", "How do these fallback strategies differ?", "Model fallback changes the selected model; provider fallback can route the same model to another provider. Check capability, pricing and output differences."),
      topic("Tool calling and structured output", "What must be tested before changing models?", "Verify tool calling, response schemas, context limits and streaming behavior. A successful text completion alone does not prove compatibility with an agent workflow."),
      topic("Caching and revalidation", "Should private chat responses be globally cached?", "No. Cache only with deliberate user isolation and freshness rules. Follow the installed Next.js caching model and invalidate shared reference data separately."),
      topic("Usage limits and cost controls", "How would you enforce a per-user AI budget?", "Authorize before starting, reserve or limit usage, and reconcile actual consumption afterward. Bound input size, output size and tool iterations."),
      topic("Error handling and partial responses", "Can you silently restart after streaming has begun?", "That may duplicate text or change the answer midstream. Surface a clear interrupted state and use a deliberate retry strategy with a fresh message identity."),
      topic("Deployment and observability", "What should you log for a failed provider request?", "Record request ID, route choice, latency and sanitized error information. Check runtime limits and keep secrets and private prompt content out of general logs."),
    ],
    sources: [source("Next.js: server and client components", "https://nextjs.org/docs/app/getting-started/server-and-client-components"), source("Next.js: caching", "https://nextjs.org/docs/app/getting-started/caching"), source("OpenRouter: model fallbacks", "https://openrouter.ai/docs/guides/routing/model-fallbacks"), source("Vercel: provider routing and fallbacks", "https://vercel.com/docs/ai-gateway/models-and-providers/provider-options")],
  },
  "React 19+": {
    topics: [
      topic("Render purity and state snapshots", "Why does state appear unchanged immediately after a setter?", "Each render sees its own state snapshot. A setter schedules another render; use functional updates when the next value depends on the previous value."),
      topic("Keys and component identity", "Why can array indexes cause form state bugs?", "Keys identify siblings across renders. When rows reorder, index keys can attach existing state to the wrong item; use stable identifiers."),
      topic("Effects and cleanup", "When is an Effect unnecessary?", "Derived values can usually be calculated during render and user-triggered work belongs in handlers. Effects synchronize with external systems and need appropriate cleanup."),
      topic("Actions and useActionState", "What does useActionState coordinate?", "It connects an Action to its returned state and pending status. Handle validation and errors deliberately instead of treating every completed request as success."),
      topic("useOptimistic", "What is the source of truth for an optimistic UI?", "Confirmed application state remains authoritative. Optimistic state temporarily reflects an anticipated result while an Action runs and must reconcile with the outcome."),
      topic("useFormStatus", "Why might a submit button not see a form's pending state?", "The hook reads the status of a parent form. Place the consuming component inside that form rather than beside it or above it."),
      topic("use and Suspense", "How does reading a Promise with use affect rendering?", "A pending Promise suspends at a Suspense boundary; rejection is handled by an error boundary. Use stable resources rather than recreating promises on each render."),
      topic("Transitions and responsiveness", "Do transitions make network requests faster?", "No. They mark eligible updates as non-urgent so urgent interactions can remain responsive. They do not reduce remote latency or replace loading and error states."),
      topic("Refs and imperative APIs", "When should a component expose a ref?", "Use refs for imperative tasks such as focus or measurement. React 19 supports ref as a prop; avoid using refs as a substitute for rendered state."),
      topic("Context, memoization and performance", "Should every value be wrapped in useMemo?", "No. Measure a performance problem first. Memoization has costs and is an optimization; it should not be required for correctness or hide inefficient state placement."),
    ],
    sources: [source("React: API reference", "https://react.dev/reference/react"), source("React: avoiding unnecessary Effects", "https://react.dev/learn/you-might-not-need-an-effect"), source("React: React 19 features", "https://react.dev/blog/2024/12/05/react-19")],
  },
  "Agentic AI": {
    topics: [
      topic("Deterministic versus autonomous execution", "When should you avoid an autonomous agent?", "Use explicit execution when the task has a known sequence or tight predictability requirements. Add model-directed choices only where they improve the outcome."),
      topic("Prompt chaining and routing", "How do chaining and routing solve different problems?", "Chaining decomposes a task into ordered steps. Routing chooses an appropriate specialized path based on the input or intermediate state."),
      topic("Parallelization", "Which subtasks can safely run concurrently?", "Independent tasks with compatible resource budgets can run together. Shared writes and data dependencies require coordination and explicit aggregation."),
      topic("Orchestrator-worker architecture", "When is a worker pattern useful?", "Use it when the required subtasks vary by request. The orchestrator delegates bounded work and combines results instead of granting every worker unrestricted control."),
      topic("Evaluator-optimizer loops", "What makes a revision loop useful?", "A clear rubric provides actionable feedback and a stopping condition. Limit attempts and escalate when repeated revisions do not improve the result."),
      topic("Multi-agent handoffs", "What context should be passed to another agent?", "Pass the task, relevant evidence, constraints and necessary state. Avoid forwarding an entire unrelated history or exposing tools the receiving agent does not need."),
      topic("Human approval", "Where should approval appear in an agent workflow?", "Place approval before consequential external actions. Show the proposed action concretely and bind approval to that action rather than granting blanket permission."),
      topic("Durability and recovery", "How should a long-running agent survive a restart?", "Persist execution state and use stable identifiers. Resume with idempotent operations so recovery cannot repeat an already completed external effect."),
      topic("Budgets and termination", "How do you bound agent cost?", "Set limits on tokens, tool calls, elapsed time and concurrency. Exhausting a budget should produce a clear partial result or escalation, not another unbounded loop."),
      topic("Evaluation and rollout", "How do you release a new agent safely?", "Evaluate task outcomes and tool behavior on representative cases, compare with a baseline, then observe a limited rollout before expanding traffic."),
    ],
    sources: [source("LangGraph: workflows and agents", "https://docs.langchain.com/oss/python/langgraph/workflows-agents"), source("LangChain: multi-agent systems", "https://docs.langchain.com/oss/python/langchain/multi-agent"), source("LangGraph: persistence", "https://docs.langchain.com/oss/python/langgraph/persistence")],
  },
  "n8n + LangChain + LangGraph + LangSmith + LangFlow": {
    topics: [
      topic("Responsibilities and service boundaries", "Why use these tools together?", "n8n handles integrations, LangChain supplies agent primitives, LangGraph controls execution state, Langflow offers visual flows, and LangSmith supports observation and evaluation. Use only the pieces needed."),
      topic("HTTP contracts and schema evolution", "How do independently deployed components stay compatible?", "Define versioned request and response schemas. Validate at boundaries and evolve contracts so one service deployment does not silently break downstream consumers."),
      topic("Identity and tenant isolation", "How should a tenant identity reach the graph service?", "Derive it from authenticated context, not an untrusted request field alone. Authorize access before loading thread state or calling tenant-scoped tools."),
      topic("Idempotency across services", "What prevents a retried n8n event from running twice?", "Persist a stable event identifier and operation status at the service boundary. Repeated requests should return existing progress or results where appropriate."),
      topic("Thread IDs versus trace IDs", "Can a trace ID replace a checkpoint thread ID?", "No. Thread identity locates persisted conversation or execution state; trace identity supports observation of a run. Correlate them without treating them as interchangeable."),
      topic("Langflow as a tool service", "How should a graph call a Langflow flow?", "Wrap the authenticated API call with explicit input validation, a deadline and structured error handling. Validate output before another node uses it."),
      topic("Human review and resume", "How do you resume after an external approval?", "Persist the paused graph and validate the approval callback against the pending action. Resume the authorized thread once and handle duplicate callbacks."),
      topic("Timeouts and asynchronous status", "What if graph execution exceeds a webhook timeout?", "Return an accepted job reference and expose status or a callback. A dropped HTTP connection should not be confused with a failed business operation."),
      topic("Tracing and evaluation", "How do you debug a failure across all services?", "Propagate a correlation identifier, capture sanitized boundary errors and inspect linked runs. Turn confirmed failures into evaluation examples for future releases."),
      topic("End-to-end failure testing", "What failure cases should the integration test cover?", "Test duplicate events, worker restarts, expired credentials, malformed responses and delayed approvals. Verify that each case preserves state and avoids repeated external writes."),
    ],
    sources: [source("n8n: error handling", "https://docs.n8n.io/flow-logic/error-handling/"), source("LangGraph: interrupts", "https://docs.langchain.com/oss/python/langgraph/interrupts"), source("Langflow: Workflow API", "https://docs.langflow.org/workflow-api-quickstart"), source("LangSmith: observability", "https://docs.langchain.com/langsmith/observability")],
  },
};

export const WORKFLOW_CURRICULUM: Record<string, WorkflowCurriculum> = Object.fromEntries(
  Object.entries(FOUNDATION_CURRICULUM).map(([group, foundation]) => {
    const extra = WORKFLOW_CURRICULUM_EXTRA[group];
    return [group, {
      topics: [...foundation.topics, ...(extra?.topics ?? [])],
      sources: [...new Map([...foundation.sources, ...(extra?.sources ?? [])].map(source => [source.url, source])).values()],
    }];
  }),
);

