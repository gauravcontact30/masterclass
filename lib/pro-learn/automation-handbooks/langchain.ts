import { topics } from "./shared";

export const LANGCHAIN_TOPICS = topics({
  "Framework foundations": [
    ["LangChain architecture", "Separate model integrations, agent behavior and the LangGraph runtime when designing an application.", [
        "Model integrations, agent behaviour and the graph runtime are separate layers.",
        "Separating them is what lets a provider change without touching agent logic.",
        "Treating the layers as one produces code that cannot be tested in pieces.",
      ]],
    ["Python and JavaScript packages", "Choose the SDK for your runtime and install provider integrations separately.", [
        "The SDK is chosen for the runtime, and provider integrations installed separately.",
        "Keeping providers out of core is what stops one install pulling in all of them.",
        "The two SDKs track each other but are not always at feature parity.",
      ]],
    ["Environment and API credentials", "Load provider credentials on the server and keep them out of prompts, logs and browser bundles.", [
        "Provider credentials load on the server and stay out of prompts, logs and bundles.",
        "A key that reaches the browser is published, not merely exposed.",
        "A key echoed into a trace is leaked to whoever can read traces.",
      ]],
    ["LangChain vs LangGraph vs Deep Agents", "Choose a configurable agent, custom state graph or fuller agent harness for the task.", [
        "A configurable agent, a custom state graph or a fuller harness suit different tasks.",
        "Branching, persistence and approvals are what push a task toward a graph.",
        "Starting with the heaviest option costs complexity the task may never need.",
      ]],
    ["Current and legacy APIs", "Recognize older chain examples and check their migration path before mixing package generations.", [
        "Older chain examples belong to an earlier package generation.",
        "Mixing generations produces imports that resolve but behave differently.",
        "Checking the migration path first is cheaper than debugging the mixture.",
      ]],
    ["Provider integration packages", "Keep core interfaces separate from provider-specific model, tool and embedding implementations.", [
        "Core interfaces stay separate from provider-specific implementations.",
        "The interface is what makes a provider swap a configuration change.",
        "Provider-specific behaviour still leaks through, so a swap needs retesting.",
      ]],
  ],
  "Models & messages": [
    ["Chat model initialization", "Configure a model with explicit provider, model name, timeout and generation settings.", [
        "Provider, model name, timeout and generation settings are all stated explicitly.",
        "Defaults differ per provider, so relying on them makes behaviour unportable.",
        "Without a timeout, a hung provider call hangs the whole request.",
      ]],
    ["System, human and AI messages", "Represent conversation roles explicitly instead of concatenating untrusted text into instructions.", [
        "Roles are represented as message objects rather than concatenated text.",
        "Concatenating untrusted text into instructions is prompt injection by construction.",
        "The role is what the model uses to weigh instruction against data.",
      ]],
    ["Tool messages and call IDs", "Pair every tool result with its originating call so the model can continue correctly.", [
        "Every tool result is paired with the call id that produced it.",
        "The id is how the model matches a result to the request it made.",
        "A missing or mismatched id breaks the conversation the model is reconstructing.",
      ]],
    ["Multimodal content blocks", "Pass supported image, audio and text blocks while respecting provider input constraints.", [
        "Image, audio and text blocks travel in one request where the provider supports it.",
        "Support differs per provider, so a block that works on one fails on another.",
        "Non-text blocks consume context, often far more than they appear to.",
      ]],
    ["invoke, batch and async calls", "Choose single, concurrent or asynchronous execution and bound request concurrency.", [
        "Single, concurrent and asynchronous execution are separate choices.",
        "Batching amortises overhead across requests that do not depend on each other.",
        "Unbounded concurrency hits provider rate limits rather than going faster.",
      ]],
    ["Token streaming and chunks", "Merge partial model output and surface progress without treating incomplete JSON as final.", [
        "Partial output is merged so progress appears before the answer is complete.",
        "Streaming changes perceived latency without changing total time.",
        "A partial JSON chunk is not parseable, so it must not be treated as final.",
      ]],
    ["Token usage and context limits", "Track input and output tokens, reserve response space and trim irrelevant history.", [
        "Input and output tokens are tracked and response space reserved.",
        "Filling the window with history leaves no room for the answer.",
        "Trimming has to keep tool calls and their results together to stay coherent.",
      ]],
    ["Model configuration and fallbacks", "Switch compatible model implementations while testing tool and structured-output behavior.", [
        "Compatible implementations can be switched while behaviour is retested.",
        "A fallback keeps the feature alive when one provider degrades.",
        "Tool calling and structured output are where providers differ most.",
      ]],
  ],
  "Prompts & structured output": [
    ["Prompt templates", "Bind named inputs into reusable prompts and keep trusted instructions separate from data.", [
        "Named inputs bind into a reusable prompt.",
        "Templating keeps trusted instructions separate from interpolated data.",
        "Formatting user text straight into the template reopens injection.",
      ]],
    ["Chat prompt templates", "Compose role-aware prompts with conversation placeholders and bounded history.", [
        "Role-aware prompts compose with conversation placeholders.",
        "A placeholder is what lets bounded history sit inside a fixed structure.",
        "Unbounded history in the placeholder eventually exceeds the window.",
      ]],
    ["Few-shot examples", "Show representative input-output pairs without leaking evaluation answers into the prompt.", [
        "Representative input-output pairs demonstrate the task.",
        "Examples usually teach format more reliably than instructions do.",
        "Drawing them from the evaluation set leaks the answers being measured.",
      ]],
    ["Structured output schemas", "Define typed output contracts with required fields, allowed values and validation.", [
        "`response_format` takes a Pydantic model that validates the reply.",
        "The parsed value is read from `result[\"structured_response\"]`.",
        "A reply that validates against the schema can still be semantically wrong.",
      ]],
    ["ProviderStrategy and ToolStrategy", "Compare provider-native structured responses with tool-based schema extraction.", [
        "Provider-native structured output and tool-based extraction are different mechanisms.",
        "Native support is usually more reliable where the provider offers it.",
        "The tool route works everywhere, at the cost of an extra call shape.",
      ]],
    ["Output parsing and repair", "Handle invalid or incomplete output with bounded retries and explicit failure states.", [
        "Invalid or incomplete output is retried within a bounded budget.",
        "A bound is what stops a malformed reply becoming an infinite retry.",
        "An explicit failure state beats returning something that merely parsed.",
      ]],
  ],
  "Tools & agents": [
    ["create_agent and createAgent", "Build the agent loop in Python or JavaScript with an explicit model, tools and instructions.", [
        "It takes `model`, `tools`, `system_prompt`, `middleware`, `state_schema` and `checkpointer`.",
        "`model` accepts a `provider:model` string such as `anthropic:claude-sonnet-5`, or an instance.",
        "The docs describe it as a model calling tools in a loop until the task is complete.",
      ]],
    ["Tool schemas and descriptions", "Write narrow tool contracts that make arguments, effects and failure modes understandable.", [
        "Tools may be plain callables, LangChain tools or tool dicts.",
        "The description is prompt text, so a vague one produces wrong calls.",
        "A tool that does several things is selected wrongly more often than one that does not.",
      ]],
    ["Tool runtime context", "Inject request-scoped dependencies and identity into tools without asking the model to supply them.", [
        "Request-scoped dependencies and identity are injected rather than asked for.",
        "The model must never supply identity, because it can be persuaded to change it.",
        "Injecting it keeps authorization out of the probabilistic path.",
      ]],
    ["Tool error handling", "Return actionable errors for recoverable failures and stop on invalid authorization.", [
        "Recoverable failures return actionable errors the model can respond to.",
        "An error the model can read is a retry it can make correctly.",
        "An authorization failure must stop the loop rather than invite another attempt.",
      ]],
    ["Parallel tool calls", "Allow independent read operations while serializing dependent actions and writes.", [
        "Independent reads run together while dependent actions serialise.",
        "Parallel reads cut latency where there is no ordering to respect.",
        "Two writes running together is a race the model did not consider.",
      ]],
    ["Agent state and messages", "Follow state changes across model and tool turns to diagnose loops and stale context.", [
        "`state_schema` subclasses `AgentState` to track fields beyond the messages.",
        "A `checkpointer` such as `InMemorySaver` is what persists the conversation.",
        "`context_schema` carries per-run configuration separately from the state.",
      ]],
    ["Agent stop conditions", "Limit turns, elapsed time and spend and return a clear incomplete result when exhausted.", [
        "Turns, elapsed time and spend are all bounded.",
        "Without a bound a confused agent runs until the budget is gone.",
        "Returning a clear incomplete result beats returning a confident wrong one.",
      ]],
    ["MCP tool adapters", "Connect external tool servers while preserving authentication and tool permission boundaries.", [
        "External tool servers connect while authentication boundaries are preserved.",
        "One protocol means an integration is written once rather than per application.",
        "A server's tool descriptions are untrusted text, not instructions to obey.",
      ]],
  ],
  "Agent middleware": [
    ["Middleware lifecycle", "Choose hooks around model and tool execution for validation, observation and customization.", [
        "Middleware exposes hooks before and after each step of the agent loop.",
        "It is where logging, analytics and debugging attach without touching the agent.",
        "Prompts, tool selection and output formatting can all be transformed there.",
      ]],
    ["Dynamic prompts", "Select instructions from verified runtime context rather than arbitrary user role claims.", [
        "Instructions are selected from verified runtime context.",
        "Verified context is the only safe basis, since claims can be fabricated.",
        "Choosing instructions from a user-supplied role is privilege escalation.",
      ]],
    ["Dynamic model selection", "Route simple and complex turns to appropriate models using measured task requirements.", [
        "Simple and complex turns route to different models on measured requirements.",
        "Routing is where most of the cost saving in an agent actually lives.",
        "Routing on a guess rather than a measurement usually degrades quality.",
      ]],
    ["Tool-call middleware", "Validate arguments, enforce permissions and record outcomes at the execution boundary.", [
        "Arguments are validated and permissions enforced at the execution boundary.",
        "The boundary is the last deterministic point before an effect happens.",
        "Checking inside the tool scatters the same check across every tool.",
      ]],
    ["Summarization middleware", "Compress older messages while retaining decisions, unresolved work and tool-call consistency.", [
        "`SummarizationMiddleware` condenses the conversation as it grows.",
        "Compressing older turns is what keeps a long run inside the context window.",
        "A summary that drops a tool call without its result leaves history inconsistent.",
      ]],
    ["Human-in-the-loop middleware", "Pause specified tool actions for approval, editing or rejection before execution.", [
        "`HumanInTheLoopMiddleware` pauses on named tools, as in `interrupt_on={\"send_email\": True}`.",
        "Naming the tools is what confines approval to the consequential ones.",
        "The pause happens before the tool executes, which is what makes it a control.",
      ]],
    ["Guardrails and PII middleware", "Apply input and output checks while keeping authorization in deterministic application code.", [
        "The built-in PII detection middleware identifies and handles sensitive data.",
        "Guardrails and rate limiting are applied in the same middleware layer.",
        "A guardrail reduces risk; it does not replace a deterministic access check.",
      ]],
    ["Retry and model-call budgets", "Bound retry behavior and invocation counts so transient failures cannot create runaway costs.", [
        "Tool retry and model fallback ship as built-in middleware.",
        "A model call limit is what bounds invocations against a runaway loop.",
        "Retrying a deterministic failure just pays for the same error twice.",
      ]],
  ],
  "Retrieval & knowledge": [
    ["Document loaders", "Extract content with source identifiers, metadata and access permissions preserved.", [
        "Content is extracted with source identifiers, metadata and permissions intact.",
        "Carrying permissions through is what makes filtered retrieval possible later.",
        "Losing the source identifier makes a citation impossible to produce.",
      ]],
    ["Text splitters and chunking", "Choose chunk boundaries and overlap based on document structure and retrieval tests.", [
        "Boundaries and overlap are chosen from document structure and retrieval tests.",
        "A chunk that severs its context retrieves as noise.",
        "Overlap preserves meaning across a boundary at the cost of duplication.",
      ]],
    ["Embedding models", "Keep embedding dimensions and model versions compatible across indexing and queries.", [
        "Dimensions and model versions stay compatible across indexing and querying.",
        "A query embedded by a different model does not sit in the same space.",
        "Changing model means re-embedding everything, not just new documents.",
      ]],
    ["Vector stores", "Persist searchable embeddings together with document IDs, metadata and deletion rules.", [
        "Embeddings persist alongside document ids, metadata and deletion rules.",
        "Metadata stored beside the vector is what makes filtering possible.",
        "Without a deletion path, removed documents keep being retrieved.",
      ]],
    ["Retriever interfaces", "Expose evidence retrieval independently from answer generation so each can be tested.", [
        "Evidence retrieval is exposed independently of answer generation.",
        "Separating them is what lets retrieval be measured on its own.",
        "A bad answer is often a retrieval failure wearing a generation costume.",
      ]],
    ["Metadata filtering", "Filter retrieval by tenant, permissions, document version and domain before generation.", [
        "Retrieval filters by tenant, permission, version and domain before generation.",
        "Filtering before generation is what stops one tenant seeing another's data.",
        "Filtering after retrieval still put the data in the context.",
      ]],
    ["Hybrid retrieval and reranking", "Combine lexical and semantic candidates and rerank a bounded set for relevance.", [
        "Lexical and semantic candidates combine, then a bounded set is reranked.",
        "Lexical search catches exact terms that embeddings blur.",
        "Reranking costs a model call, so the candidate set must stay bounded.",
      ]],
    ["Two-step RAG", "Retrieve evidence first and generate a grounded answer with traceable citations second.", [
        "Evidence is retrieved first, then a grounded answer is generated with citations.",
        "Citations are what make the answer checkable rather than merely plausible.",
        "The answer is bounded by retrieval; nothing fetched cannot be cited.",
      ]],
    ["Agentic RAG", "Let an agent decide when to retrieve and reformulate queries within a bounded search loop.", [
        "The agent decides when to retrieve and how to reformulate the query.",
        "Reformulating is what rescues a question the first query missed.",
        "An unbounded search loop is the failure mode this invites.",
      ]],
    ["Retrieval without vectors", "Use full-text search, structured queries or document navigation when embeddings are unnecessary.", [
        "Full-text search, structured queries or navigation replace embeddings where they suit.",
        "An exact identifier lookup does not need a similarity search at all.",
        "Embedding everything by default adds cost that a where clause avoids.",
      ]],
  ],
  "Memory & context": [
    ["Short-term memory", "Persist conversation state by thread and trim it to fit the current model context.", [
        "Conversation state persists per thread and is trimmed to fit the context.",
        "The thread is the unit, which is what keeps two conversations apart.",
        "Trimming without preserving structure breaks tool-call pairing.",
      ]],
    ["Long-term memory stores", "Store user-approved durable facts separately from transient conversation checkpoints.", [
        "Durable approved facts are stored apart from transient checkpoints.",
        "Separating them is what stops a passing remark becoming permanent.",
        "Anything remembered is context that must be paid for later.",
      ]],
    ["Memory namespaces", "Isolate tenants and users so retrieval cannot mix one person's memory with another's.", [
        "Tenants and users are isolated so retrieval cannot cross between them.",
        "The namespace is the boundary, not a filter applied afterwards.",
        "A shared namespace mixes one person's memory into another's answer.",
      ]],
    ["Context selection", "Choose relevant history, evidence and tool results rather than forwarding everything.", [
        "Relevant history, evidence and tool results are chosen rather than all forwarded.",
        "Irrelevant context costs money and dilutes attention on what matters.",
        "Selection is the lever that most changes both quality and cost.",
      ]],
    ["Memory correction and deletion", "Support updating stale facts and deleting stored information throughout the memory pipeline.", [
        "Stale facts can be updated and stored information deleted.",
        "Without deletion, a wrong fact is repeated forever.",
        "Deletion must reach every copy, including any derived index.",
      ]],
    ["Conversation persistence", "Resume the right thread using stable identifiers and a production persistence backend.", [
        "The right thread resumes through stable identifiers and a real backend.",
        "A stable identifier is what makes resumption possible at all.",
        "In-memory persistence loses every conversation on restart.",
      ]],
  ],
  "Composition & multi-agent": [
    ["Runnable composition", "Compose reusable model and transformation steps while understanding current versus legacy abstractions.", [
        "An agent can be given a `name`, which the docs note matters in multi-agent systems.",
        "Named components are what make a trace readable when several agents run.",
        "Composition is how a step is replaced without rewriting the surrounding chain.",
      ]],
    ["Routing between specialists", "Select a specialist using explicit routing criteria and a fallback for unknown tasks.", [
        "A specialist is selected by explicit criteria, with a fallback for the unknown.",
        "Explicit criteria are what make a routing decision reviewable.",
        "Without a fallback an unrecognised task has nowhere to go.",
      ]],
    ["Subagents and tool delegation", "Expose a specialized agent as a bounded capability with a clear result contract.", [
        "A specialised agent is exposed as a bounded capability with a result contract.",
        "The contract is what keeps the caller independent of the subagent's internals.",
        "Nesting agents multiplies latency and cost at every level.",
      ]],
    ["Handoffs", "Transfer control and only the necessary context when another agent becomes responsible.", [
        "Control and only the necessary context transfer to another agent.",
        "Passing everything defeats the purpose and refills the window.",
        "The receiving agent needs the goal, not the whole transcript.",
      ]],
    ["Parallel agent workflows", "Merge independent findings with source attribution and explicit conflict handling.", [
        "Independent findings merge with attribution and explicit conflict handling.",
        "Attribution is what makes a merged answer traceable.",
        "Two agents disagreeing is a case the merge must actually decide.",
      ]],
    ["Custom LangGraph workflows", "Move beyond a standard agent loop when branching, persistence or approvals need explicit control.", [
        "Explicit control is taken when branching, persistence or approvals demand it.",
        "A standard loop cannot express a branch that must be resumable.",
        "The cost is that the graph becomes yours to maintain.",
      ]],
  ],
  "Testing & production": [
    ["LangSmith tracing", "Inspect model calls, tool arguments and timing with sensitive fields redacted.", [
        "Model calls, tool arguments and timing are inspected with sensitive fields redacted.",
        "A trace is what turns an opaque run into something explicable.",
        "Redaction has to happen before the trace is sent, not after.",
      ]],
    ["Dataset-based evaluation", "Compare candidate changes on representative tasks and fixed success criteria.", [
        "Candidate changes are compared on representative tasks with fixed criteria.",
        "A fixed dataset is what makes two runs comparable at all.",
        "A dataset that drifts with the product stops measuring regression.",
      ]],
    ["Tool unit tests", "Test validation, permission failures and deterministic outputs without a live model.", [
        "Validation, permission failures and deterministic output are tested without a model.",
        "Tools are ordinary code, so they are testable in the ordinary way.",
        "A tool tested only through the agent is tested through a random variable.",
      ]],
    ["Agent integration tests", "Check final outcomes, allowed tool trajectories and retry behavior together.", [
        "Final outcomes, allowed trajectories and retry behaviour are checked together.",
        "Asserting on the outcome tolerates the nondeterminism in the path.",
        "Asserting on an exact tool sequence makes the test flake by design.",
      ]],
    ["Serving and cancellation", "Expose an agent safely through a service with request limits and client cancellation.", [
        "The agent is exposed through a service with request limits and cancellation.",
        "Cancellation is what stops a closed browser tab from still spending money.",
        "Without a limit one caller can consume the whole budget.",
      ]],
    ["Latency and cost optimization", "Measure model, retrieval and tool time before changing caching, concurrency or routing.", [
        "Model, retrieval and tool time are measured before anything is changed.",
        "Measuring first is what stops caching being added where it saves nothing.",
        "The slowest step is usually not the one that feels slow.",
      ]],
    ["Dependency upgrades", "Pin versions and replay evaluation datasets before promoting framework changes.", [
        "Versions are pinned and evaluations replayed before promoting a change.",
        "Framework behaviour changes between versions in ways types do not catch.",
        "Replaying the dataset is the only evidence quality held.",
      ]],
    ["Production incident debugging", "Reconstruct a failed run from traces and checkpoints without exposing private inputs.", [
        "A failed run is reconstructed from traces and checkpoints.",
        "A checkpoint is what makes the failure reproducible rather than described.",
        "Reconstruction must not expose the private inputs that caused it.",
      ]],
  ],
  "Hooks & callbacks": [
    ["Agent middleware", "Wrap an agent with middleware instead of rewriting it, so behaviour composes in one place.", [
        "An agent is wrapped rather than rewritten, so behaviour composes in one place.",
        "Composition is what keeps two unrelated concerns from tangling.",
        "Every layer runs on every turn, so its cost is multiplied.",
      ]],
    ["before_model hooks", "Inspect or rewrite the request on its way to the model - trim history, inject context, deny early.", [
        "The request is inspected or rewritten on its way to the model.",
        "It is the last point to trim history or inject context cheaply.",
        "Denying here avoids paying for a call that should not happen.",
      ]],
    ["after_model hooks", "Read or replace the model's reply before the agent acts on it.", [
        "The reply is read or replaced before the agent acts on it.",
        "Acting on a replaced reply is how an output guardrail takes effect.",
        "Rewriting silently makes the trace disagree with what the model said.",
      ]],
    ["wrap_model_call", "Own both sides of one model call, which is where retries and fallbacks belong.", [
        "Both sides of a single model call are owned in one place.",
        "Owning both sides is what makes retries and fallbacks expressible.",
        "A retry here is invisible to the surrounding agent loop.",
      ]],
    ["Callback handlers", "Receive start, end, token and error events from every runnable in a chain.", [
        "Start, end, token and error events arrive from every runnable in a chain.",
        "One handler observes the whole chain rather than one step.",
        "A handler that throws can take the run down with it.",
      ]],
    ["Streaming event hooks", "Consume the event stream to drive a UI, rather than waiting for a final answer.", [
        "The event stream drives an interface instead of awaiting a final answer.",
        "Events carry structure, not just tokens, so progress can be meaningful.",
        "The stream must be consumed or the producer eventually blocks.",
      ]],
    ["Runnable listeners", "Attach start, end and error listeners to one runnable without touching its neighbours.", [
        "Start, end and error listeners attach to one runnable in isolation.",
        "Scoping to one step is what keeps an experiment from affecting neighbours.",
        "They see that step only, so a chain-wide view needs a handler.",
      ]],
    ["Tool call interception", "Validate arguments in a hook before a tool runs, since the caller is probabilistic.", [
        "Arguments are validated in a hook before the tool executes.",
        "The caller is probabilistic, so its arguments are untrusted input.",
        "Validating inside every tool repeats the same code everywhere.",
      ]],
    ["Tracing callbacks", "Tracing is a callback handler, which is why it composes with every other hook.", [
        "Tracing is itself a callback handler.",
        "Being a handler is why it composes with every other hook.",
        "It therefore carries the same cost and failure modes as any handler.",
      ]],
  ],
});
