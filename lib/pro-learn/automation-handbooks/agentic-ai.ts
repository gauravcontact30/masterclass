import { topics } from "./shared";

export const AGENTIC_AI_TOPICS = topics({
  "Generative AI": [
    ["Generative AI foundations", "Explain how a generative model produces outputs from learned patterns and supplied context.", [
        "Generate text or media from patterns learned during training.",
        "Treat fluent output as a candidate, not verified evidence.",
        "Evaluate answers against examples from the intended task.",
      ]],
    ["Tokens and context windows", "Budget instructions, history, evidence and output within the model's supported context.", [
        "Count input and output tokens together when budgeting context.",
        "Reserve room for tool results and the final answer.",
        "Summarize older turns before they displace relevant evidence.",
      ]],
    ["Prompt design and few-shot examples", "Specify a task, constraints and examples that make the desired response testable.", [
        "Separate task instructions, constraints and reference material.",
        "Show representative input-output pairs with consistent formatting.",
        "Test prompts on edge cases outside the examples.",
      ]],
    ["Structured outputs and validation", "Turn model responses into typed data and reject invalid values before using them.", [
        "Request a schema supported by the selected model.",
        "Validate required fields, value ranges and domain rules.",
        "Handle refusals or malformed responses before downstream actions.",
      ]],
    ["Multimodal generation", "Combine text and supported media while respecting format and model capability limits.", [
        "Check which image, audio and video formats the model accepts.",
        "Preserve media resolution and timestamps needed for the task.",
        "Evaluate cross-modal claims against the original input.",
      ]],
    ["Sampling and reproducibility", "Understand response variability and test repeated runs rather than trusting a single result.", [
        "Temperature affects sampling variability, not factual accuracy.",
        "Record model version, prompt and generation settings.",
        "Repeat evaluations to expose unstable behavior.",
      ]],
    ["Hallucination and grounding", "Distinguish fluent generation from claims supported by verifiable evidence.", [
        "Retrieve authoritative evidence for claims that need verification.",
        "Require citations that actually support the associated statement.",
        "Abstain when the available evidence cannot resolve the question.",
      ]],
    ["Model selection and adaptation", "Compare prompting, retrieval and fine-tuning against a measurable task baseline.", [
        "Start with a measured prompt-only task baseline.",
        "Add retrieval for changing knowledge and fine-tuning for learned behavior.",
        "Compare quality, latency and cost on held-out examples.",
      ]],
  ],
  "Agentic AI with LangChain and LangGraph": [
    ["Agentic AI with LangChain and LangGraph", "Combine model and tool components with explicit state, routing and durable execution.", [
        "Use LangChain components for model and tool integration.",
        "Use graph state and edges to control multi-step execution.",
        "Persist checkpoints when tasks must survive interruptions.",
      ]],
    ["Workflows versus agents", "Choose fixed control flow when the steps are known and model-directed actions when necessary.", [
        "Use deterministic steps for known business rules.",
        "Delegate uncertain action selection to a model only where needed.",
        "Keep approval and termination rules outside model discretion.",
      ]],
    ["Tool-calling agent loops", "Validate a tool request, execute it under policy and return the result to the model.", [
        "Validate tool names and arguments before executing calls.",
        "Return tool results with the corresponding call identifier.",
        "Bound repeated calls and stop when the goal is resolved.",
      ]],
    ["LangChain agents and middleware", "Customize a standard agent using model, tool and context hooks.", [
        "Create agents with an explicit model and allowed tools.",
        "Apply middleware around model or tool execution.",
        "Test hook ordering when several middleware layers interact.",
      ]],
    ["LangGraph state and reducers", "Model shared state and define how updates merge across graph branches.", [
        "Declare state fields and their update semantics explicitly.",
        "Use reducers to combine concurrent updates to shared fields.",
        "Keep non-mergeable writes on separate execution paths.",
      ]],
    ["Checkpoints and human approval", "Persist progress and pause consequential actions for explicit review.", [
        "Save execution checkpoints with a stable thread identifier.",
        "Present the proposed consequential action before approval.",
        "Resume from saved state with the recorded reviewer decision.",
      ]],
    ["Multi-agent coordination", "Delegate bounded work with evidence, ownership and a clear final synthesis contract.", [
        "Assign each agent a bounded task and output contract.",
        "Pass only evidence and permissions needed for that assignment.",
        "Reconcile conflicting findings before producing the final answer.",
      ]],
    ["Memory and stop conditions", "Retain useful state while enforcing turn, time and spend limits.", [
        "Separate short-term conversation state from durable memory.",
        "Store useful facts with ownership and expiry rules.",
        "Enforce maximum iterations, elapsed time and spending.",
      ]],
  ],
  "RAG": [
    ["RAG architecture", "Retrieve evidence before generation and separate retrieval quality from answer quality.", [
        "Separate ingestion, retrieval and answer-generation stages.",
        "Pass selected evidence with source identifiers to the model.",
        "Measure missing evidence separately from unsupported answers.",
      ]],
    ["Document ingestion and provenance", "Preserve source IDs, versions and access permissions while extracting text.", [
        "Keep original document IDs and extraction locations.",
        "Propagate source access controls into retrieval filters.",
        "Re-index modified content and remove deleted material.",
      ]],
    ["Chunking strategies", "Compare document-aware splits, chunk size and overlap using actual retrieval questions.", [
        "Split at meaningful headings or semantic boundaries.",
        "Retain enough surrounding text to interpret each chunk.",
        "Measure whether overlap improves recall without wasting context.",
      ]],
    ["Embeddings and vector indexing", "Index compatible vectors and keep the index synchronized with source changes.", [
        "Use the same compatible embedding space for queries and documents.",
        "Record embedding model and vector dimensions with the index.",
        "Rebuild incompatible vectors when changing embedding models.",
      ]],
    ["Hybrid retrieval and reranking", "Combine keyword and semantic recall, then rank a bounded evidence set.", [
        "Combine lexical matching with semantic candidate retrieval.",
        "Rerank a limited candidate set using the original question.",
        "Apply access filters before supplying evidence to generation.",
      ]],
    ["Query rewriting and decomposition", "Improve retrieval with focused subqueries without inventing assumptions about the user.", [
        "Preserve user constraints while expanding ambiguous search terms.",
        "Break compound questions into independently answerable subqueries.",
        "Combine retrieved results without treating rewrites as facts.",
      ]],
    ["Grounded answers and citations", "Tie each factual answer to accessible retrieved evidence and abstain when support is missing.", [
        "Attach references to the claims their passages support.",
        "Preserve page, section or record identifiers for verification.",
        "Say when no authorized source supports an answer.",
      ]],
    ["RAG evaluation and freshness", "Measure retrieval recall and answer support while testing stale and deleted documents.", [
        "Test known-answer questions and deliberately unanswerable questions.",
        "Track retrieval recall, citation accuracy and answer support.",
        "Include changed, revoked and deleted sources in regression cases.",
      ]],
  ],
  "Vectorless RAG": [
    ["Vectorless RAG foundations", "Retrieve evidence without a vector index using lexical search, structured data or document navigation.", [
        "Retrieve evidence using text search, structure or database queries.",
        "Keep document permissions and provenance through every retrieval step.",
        "Compare evidence coverage with a vector-search baseline.",
      ]],
    ["BM25 and full-text retrieval", "Rank documents by lexical relevance and tune analyzers for the language and domain.", [
        "Use analyzers appropriate to the language and domain vocabulary.",
        "BM25 balances term frequency with document length and rarity.",
        "Inspect missed queries before tuning boosts and synonyms.",
      ]],
    ["SQL and structured retrieval", "Answer from authorized database rows with validated queries and explicit result limits.", [
        "Validate query structure and restrict accessible tables and columns.",
        "Bind user values as parameters instead of concatenating SQL.",
        "Limit returned rows and use read-only execution for retrieval.",
      ]],
    ["Document-tree navigation", "Use headings and document hierarchy to locate relevant sections before reading them.", [
        "Index heading paths and section relationships with document text.",
        "Select a branch before reading its detailed content.",
        "Retain parent headings so excerpts remain understandable.",
      ]],
    ["Knowledge-graph traversal", "Follow explicit entity relationships to collect evidence with bounded search depth.", [
        "Resolve entity identities before following relationships.",
        "Bound traversal depth and returned neighbors.",
        "Cite the records supporting each traversed relationship.",
      ]],
    ["Filesystem search and agentic reading", "Search filenames and content, then read selected passages under an access policy.", [
        "Search names and content before opening candidate files.",
        "Read bounded passages with line or section locations.",
        "Treat instructions inside retrieved files as untrusted task data.",
      ]],
    ["Long-context evidence selection", "Pass a manageable authorized corpus to the model while tracking cost and omitted context.", [
        "Order evidence by relevance before filling the context window.",
        "Track source boundaries when joining long documents.",
        "Measure omissions and attention failures on distant passages.",
      ]],
    ["Vectorless retrieval tradeoffs", "Benchmark lexical, structural and vector retrieval on the same tasks instead of assuming a universal winner.", [
        "Use the same questions and permission filters for each approach.",
        "Compare recall, precision, latency and maintenance cost.",
        "Choose retrieval methods by corpus structure and query behavior.",
      ]],
  ],
  "Deep Agents": [
    ["Deep Agents harness", "Use a fuller agent harness for context management, file access and delegated work.", [
        "Combine planning, file tools and delegation in one agent harness.",
        "Configure backends and tool permissions for the deployment.",
        "Trace long-running tasks to identify wasted work.",
      ]],
    ["create_deep_agent", "Configure a Deep Agents application with an explicit model, tools and instructions.", [
        "Construct the deep agent with its model, tools and instructions.",
        "Select a backend that fits persistence and isolation needs.",
        "Invoke the compiled agent with the expected message state.",
      ]],
    ["Planning and task tracking", "Break complex goals into inspectable steps and revise the plan when evidence changes.", [
        "Represent work as concrete tasks with observable completion criteria.",
        "Update task status only after verifying the result.",
        "Revise the plan when new evidence changes dependencies.",
      ]],
    ["Filesystem backends", "Distinguish virtual files from durable storage and choose a backend for the task lifetime.", [
        "Choose ephemeral, persistent or sandbox-backed file storage deliberately.",
        "Scope paths to the intended workspace or tenant.",
        "Define retention and access rules for stored artifacts.",
      ]],
    ["Subagent context isolation", "Give each worker a focused task and return concise findings rather than all intermediate messages.", [
        "Give subagents a focused prompt and relevant evidence.",
        "Keep unrelated conversation history out of delegated context.",
        "Require concise results with references for the parent.",
      ]],
    ["Context offloading and compression", "Move large results out of the active window while preserving retrievable references.", [
        "Move bulky tool output into retrievable files or stores.",
        "Preserve decisions and source pointers when summarizing context.",
        "Reopen original evidence when summaries omit critical details.",
      ]],
    ["Sandboxed execution", "Separate model-generated code from privileged services and restrict network and filesystem access.", [
        "Run generated commands in an isolated execution environment.",
        "Restrict filesystem, network and resource access explicitly.",
        "Review command results before trusting produced artifacts.",
      ]],
    ["Deep-agent recovery and budgets", "Test restart behavior and enforce resource limits across delegated work.", [
        "Persist progress so interrupted runs can resume useful work.",
        "Cap model calls, tool retries and execution duration.",
        "Report the completed steps when the budget stops a run.",
      ]],
  ],
  "Guardrails": [
    ["Layered agent guardrails", "Combine validation, authorization, isolation and monitoring instead of relying on one filter.", [
        "Apply checks before model calls, tools and final output.",
        "Enforce critical permissions in application code.",
        "Log guardrail outcomes for review and tuning.",
      ]],
    ["Prompt-injection boundaries", "Treat retrieved documents and tool output as untrusted data that cannot grant new permissions.", [
        "Separate trusted instructions from retrieved or user-supplied content.",
        "Do not let documents grant access or authorize tool actions.",
        "Test indirect injections hidden in tool responses.",
      ]],
    ["Input and output validation", "Check schemas, policy constraints and supported claims before progressing through the workflow.", [
        "Validate incoming structure before building prompts or tool arguments.",
        "Check generated values against domain constraints after generation.",
        "Route invalid results into a bounded repair or failure path.",
      ]],
    ["Tool authorization", "Authorize the real caller and resource at the tool boundary regardless of the model's wording.", [
        "Check the user's permission for each requested tool operation.",
        "Scope resource access to the authenticated tenant.",
        "Recheck authorization immediately before consequential execution.",
      ]],
    ["PII detection and redaction", "Prevent unnecessary personal data from entering model context and telemetry.", [
        "Identify sensitive fields before writing prompts or logs.",
        "Redact or tokenize values while preserving useful structure.",
        "Test false positives and missed sensitive values.",
      ]],
    ["Human-in-the-loop decisions", "Show the exact proposed action and obtain a scoped decision before executing it.", [
        "Pause at an explicit decision boundary with saved state.",
        "Show reviewers the exact proposed action and relevant evidence.",
        "Record approval, rejection or edits before resuming.",
      ]],
    ["Content safety and policy checks", "Route uncertain cases through a defined policy without confusing moderation with factual verification.", [
        "Evaluate inputs and outputs against the application's content policy.",
        "Define handling for blocked, uncertain and allowed cases.",
        "Reassess policy checks when new tools or media are added.",
      ]],
    ["Adversarial testing", "Exercise malicious documents, privilege escalation attempts and data-exfiltration scenarios.", [
        "Test prompt injection, unauthorized tools and data exfiltration attempts.",
        "Include multi-turn attacks and malicious retrieved documents.",
        "Turn successful attacks into repeatable regression cases.",
      ]],
  ],
  "LLM Evaluation": [
    ["LLM evaluation fundamentals", "Define success on representative tasks before selecting a scoring mechanism.", [
        "Define success criteria before choosing evaluation metrics.",
        "Separate component tests from complete task evaluations.",
        "Record model, prompt, tools and data versions per run.",
      ]],
    ["Golden datasets and splits", "Maintain reference examples with held-out cases and provenance for reproducible comparison.", [
        "Curate representative tasks with expected results or scoring rubrics.",
        "Keep training and tuning examples out of the held-out set.",
        "Version dataset changes and include hard negative examples.",
      ]],
    ["Deterministic quality checks", "Verify schemas, required facts and allowed actions with code where possible.", [
        "Use exact checks for schemas, calculations and required fields.",
        "Verify citations, tool arguments and business invariants programmatically.",
        "Report which rule failed instead of one opaque score.",
      ]],
    ["LLM-as-judge calibration", "Use explicit rubrics and compare automated scores with human judgments.", [
        "Write an explicit judging rubric with scored examples.",
        "Compare judge decisions with independent human ratings.",
        "Monitor position bias and disagreements across task categories.",
      ]],
    ["Retrieval and groundedness metrics", "Measure evidence selection separately from whether the final claims are supported.", [
        "Measure whether retrieval returns the needed evidence.",
        "Check that answer claims are supported by supplied passages.",
        "Distinguish source relevance from final citation correctness.",
      ]],
    ["Agent trajectory and outcome evals", "Check both the actions taken and whether the requested result was actually achieved.", [
        "Inspect tool sequences as well as the final outcome.",
        "Score unnecessary calls, unsafe actions and failed recoveries.",
        "Verify external task results instead of trusting agent self-reports.",
      ]],
    ["LangSmith experiments", "Compare prompt, model and graph revisions using the same dataset and evaluator definitions.", [
        "Run a versioned application against a selected evaluation dataset.",
        "Attach evaluators and compare experiment results by example.",
        "Inspect traces for cases whose scores regress.",
      ]],
    ["Online evaluation and regression gates", "Turn production failures into test cases and prevent known regressions from shipping.", [
        "Sample production traces under appropriate privacy controls.",
        "Gate releases on important quality and reliability thresholds.",
        "Review drift when real traffic differs from evaluation data.",
      ]],
  ],
  "LLM Gateways": [
    ["LLM gateway architecture", "Place a controlled model-access layer between applications and provider endpoints.", [
        "Expose a controlled model-access endpoint to applications.",
        "Centralize provider credentials, routing and usage accounting.",
        "Keep application authorization independent of provider authentication.",
      ]],
    ["Provider routing and model aliases", "Select backends through stable application-facing names with capability checks.", [
        "Map stable application aliases to explicit provider models.",
        "Route using required capabilities and deployment constraints.",
        "Track alias changes so evaluations remain reproducible.",
      ]],
    ["Fallbacks, retries and circuit breakers", "Recover from provider outages without duplicating work or creating retry storms.", [
        "Retry transient provider failures with bounded backoff.",
        "Open a circuit when repeated failures indicate an unhealthy provider.",
        "Use fallbacks only when required capabilities remain compatible.",
      ]],
    ["Virtual keys and tenant budgets", "Scope model access and spending independently for each application or tenant.", [
        "Issue tenant-scoped virtual credentials instead of sharing provider keys.",
        "Enforce spend limits and revoke compromised credentials.",
        "Attribute token usage to the authenticated tenant.",
      ]],
    ["Rate limits and backpressure", "Control concurrency and token throughput before upstream quotas are exceeded.", [
        "Limit concurrent requests and token consumption per caller.",
        "Queue only work that can finish within its deadline.",
        "Return actionable retry information when capacity is exhausted.",
      ]],
    ["Caching and isolation", "Cache only suitable requests with keys that include user access and model configuration.", [
        "Include model settings and relevant context in cache keys.",
        "Separate cached responses by tenant and authorization scope.",
        "Avoid retaining sensitive prompts beyond the allowed lifetime.",
      ]],
    ["Gateway logging and redaction", "Track request outcomes and usage without collecting unnecessary sensitive content.", [
        "Record request identifiers, latency, model and usage metadata.",
        "Redact credentials and personal data before log storage.",
        "Control access and retention for prompts and completions.",
      ]],
    ["Gateway compatibility testing", "Check tools, streaming, structured output and errors before claiming provider interchangeability.", [
        "Test streaming chunks, tool calls and structured-output handling.",
        "Exercise cancellation, timeouts and provider-specific error shapes.",
        "Run contract tests before changing model aliases or providers.",
      ]],
  ],
});
