export interface FrameworkTopicDetail {
  title: string;
  version: string;
  badge: string;
  role: string;
  primitives: string[];
  howItWorks: string;
  bestPractice: string;
  watchOut: string;
}

export interface WorkflowFrameworkLearnings {
  langchain: FrameworkTopicDetail;
  langgraph: FrameworkTopicDetail;
  langsmith: FrameworkTopicDetail;
}

const FRAMEWORK_LEARNINGS_MAP: Record<string, WorkflowFrameworkLearnings> = {
  "customer-support-human-in-the-loop": {
    langchain: {
      title: "LangChain Tool Calling & Schema Binding",
      version: "v0.3+",
      badge: "🦜️🔗 LangChain v0.3+",
      role: "Defines customer service tools (order lookups, knowledge base querying, and refund processing) with strict Pydantic argument schemas, bound directly to ChatOpenAI.",
      primitives: ["@tool", "bind_tools", "ChatPromptTemplate", "BaseModel (Pydantic v2)"],
      howItWorks: "Tools use LangChain's @tool decorator with typed Pydantic models. When the user queries an order, the LLM emits a tool_call with structured parameters that the LangChain runtime executes and converts back into ToolMessage objects.",
      bestPractice: "Always define docstrings and Pydantic field descriptions on @tool functions; model providers use these descriptions as system instructions for argument synthesis.",
      watchOut: "Never execute financial transactions or state mutations directly in tool bodies without upstream input validation and guardrail checks."
    },
    langgraph: {
      title: "LangGraph StateGraph & interrupt() Primitive",
      version: "v0.2+",
      badge: "🕸️ LangGraph v0.2+",
      role: "Orchestrates the ReAct conversation cycle, maintains thread message history with add_messages, and halts execution via interrupt() when refund exceeds $100.",
      primitives: ["StateGraph", "add_messages", "interrupt()", "Command(resume=...)", "SqliteSaver"],
      howItWorks: "The graph compiles with a persistent checkpointer (SqliteSaver). When a refund exceeds $100, the support node calls interrupt(refund_payload). Execution pauses and thread state checkpoints to SQLite. When the human supervisor submits an approval via Command(resume={'approved': True}), the thread resumes seamlessly.",
      bestPractice: "Always use the add_messages reducer for message channels to ensure messages are appended and deduplicated by their unique ID without in-place mutation.",
      watchOut: "Calling interrupt() without an active checkpointer registered during builder.compile(checkpointer=...) will throw a fatal runtime exception."
    },
    langsmith: {
      title: "LangSmith Distributed Tracing & HITL Telemetry",
      version: "v0.2+",
      badge: "🛠️ LangSmith v0.2+",
      role: "Captures full multi-turn conversation traces, records human supervisor approval latency, and validates escalation correctness with eval.py.",
      primitives: ["@traceable", "Client", "evaluate()", "RunTree", "Tags & Metadata"],
      howItWorks: "All graph execution spans are logged under project 'customer-support-hitl'. LangSmith traces capture the exact moment interrupt() halts execution and correlate it with the subsequent Command(resume=...) event, recording end-to-end supervisor resolution latency.",
      bestPractice: "Tag customer runs with tags=['production', 'hitl'] and attach user_id and order_id in metadata to filter and debug failed runs in the LangSmith dashboard.",
      watchOut: "Ensure LANGCHAIN_TRACING_V2='true' and LANGCHAIN_API_KEY are configured in the environment; otherwise traces will silently fail to export."
    }
  },
  "software-engineering-squad": {
    langchain: {
      title: "LangChain Role Prompts & Structured Code Generation",
      version: "v0.3+",
      badge: "🦜️🔗 LangChain v0.3+",
      role: "Powers specialized personas (Architect, Coder, Reviewer) using ChatPromptTemplate and enforces structured output schemas for code, tests, and reviews.",
      primitives: ["ChatPromptTemplate", "with_structured_output", "SystemMessage", "HumanMessage"],
      howItWorks: "Each squad member uses a dedicated LangChain prompt pipeline. The Architect's specification is fed into the Coder's prompt, and the resulting code is validated into typed Pydantic models with explicit code, filename, and test assertions.",
      bestPractice: "Use model.with_structured_output(Schema) to guarantee that agent outputs conform to strict JSON schemas rather than parsing raw markdown code blocks.",
      watchOut: "Avoid monolithic prompts trying to do architecture, coding, and code review simultaneously; decompose responsibilities across modular LangChain agents."
    },
    langgraph: {
      title: "LangGraph Multi-Agent Supervisor & Cyclic Reflection",
      version: "v0.2+",
      badge: "🕸️ LangGraph v0.2+",
      role: "Routes tasks hierarchically from Architect to Coder, executing unit tests in the Reviewer and routing back to the Coder on test failures.",
      primitives: ["StateGraph", "Supervisor Node", "Conditional Edges", "MemorySaver", "START / END"],
      howItWorks: "The graph routes state through architect -> coder -> reviewer. A conditional edge evaluates test_results['passed']. If false and iteration < max_iterations, the edge cycles back to coder with error_traceback; otherwise it terminates at END.",
      bestPractice: "Return explicit dictionary updates from each node (e.g. {'code': ..., 'iteration': state['iteration'] + 1}) rather than mutating the state object directly.",
      watchOut: "Always enforce a recursion limit or max_iteration counter in cyclic self-correction graphs to prevent infinite LLM generation loops."
    },
    langsmith: {
      title: "LangSmith Multi-Agent Token Telemetry & Eval Suites",
      version: "v0.2+",
      badge: "🛠️ LangSmith v0.2+",
      role: "Traces hierarchical multi-agent delegations, monitors token cost per squad role, and benchmarks pass@1 code generation accuracy.",
      primitives: ["@traceable", "Client.evaluate()", "Pass@1 Evaluator", "Nested Spans"],
      howItWorks: "The entire squad execution tree is traced as nested spans under a single root run. eval.py pulls 25 algorithmic benchmark specifications from LangSmith datasets and computes the percentage of generated solutions that pass on the first attempt.",
      bestPractice: "Use @traceable(name='coder_node') with custom run names to distinguish identical LLM calls originating from different agent squad roles.",
      watchOut: "Multi-agent reflection loops can quickly exhaust token budgets; track cumulative token usage per thread in LangSmith run metadata."
    }
  },
  "deep-research-plan-execute": {
    langchain: {
      title: "LangChain Research Decomposition & Search Tooling",
      version: "v0.3+",
      badge: "🦜️🔗 LangChain v0.3+",
      role: "Decomposes complex research queries into structured sub-topic queries and extracts factual evidence with source citations using search tools.",
      primitives: ["@tool", "with_structured_output", "ChatPromptTemplate", "Pydantic Schema"],
      howItWorks: "The planner LLM emits a Pydantic ResearchPlan containing a list of sub-topic questions. Search tools execute queries and return cleaned, markdown-stripped text snippets with source URL metadata.",
      bestPractice: "Enforce strict schema validation on search queries to ensure queries contain domain keywords and temporal constraints.",
      watchOut: "Do not pass uncurated, full-page raw HTML to the model; sanitize and chunk content using LangChain document transformers."
    },
    langgraph: {
      title: "LangGraph Dynamic Parallel Fan-out via Send()",
      version: "v0.2+",
      badge: "🕸️ LangGraph v0.2+",
      role: "Spawns concurrent worker nodes dynamically using LangGraph v0.2 Send() API and aggregates results in a reduce synthesis node.",
      primitives: ["Send() API", "StateGraph", "operator.add channel reducer", "START / END"],
      howItWorks: "Instead of fixed static edges, a conditional edge returns a list of Send('research_worker', {'query': q}) objects. LangGraph schedules all workers concurrently across worker threads and appends findings to the shared state channel.",
      bestPractice: "Use Send() when the number of sub-tasks is determined dynamically at runtime by an upstream planner node.",
      watchOut: "Ensure the destination channel in state uses an additive reducer (e.g. operator.add) so parallel worker returns accumulate rather than overwriting each other."
    },
    langsmith: {
      title: "LangSmith Parallel Span Tracing & Citation Auditing",
      version: "v0.2+",
      badge: "🛠️ LangSmith v0.2+",
      role: "Visualizes parallel worker fan-out traces, measures search tool latencies, and evaluates factual groundedness and citation precision.",
      primitives: ["@traceable", "RunTree", "Hallucination Evaluator", "Latency Metrics"],
      howItWorks: "LangSmith automatically groups concurrent Send() executions as sibling spans under the parent graph run, making it trivial to identify slow or failing search tool calls.",
      bestPractice: "Evaluate synthesized research reports with custom LangSmith evaluators checking that every claim has a corresponding URL citation in findings.",
      watchOut: "High fan-out concurrency can trigger upstream API rate limits; configure LangSmith tags with retry attempts for visibility."
    }
  },
  "financial-audit-fraud-detection": {
    langchain: {
      title: "LangChain Strict Accounting Pydantic Schemas",
      version: "v0.3+",
      badge: "🦜️🔗 LangChain v0.3+",
      role: "Extracts and validates complex financial statement entries (Assets, Liabilities, Equity) enforcing exact accounting equation identities.",
      primitives: ["with_structured_output", "BaseModel", "field_validator", "ChatPromptTemplate"],
      howItWorks: "Financial disclosure documents are ingested and parsed through model.with_structured_output(BalanceSheet). Pydantic field validators verify that Total Assets == Total Liabilities + Total Equity.",
      bestPractice: "Use Pydantic @field_validator to enforce mathematical identities during schema parsing so invalid financial states fail fast.",
      watchOut: "Large tables in financial filings can be truncated if token context windows are exceeded; pre-chunk financial tables before schema extraction."
    },
    langgraph: {
      title: "LangGraph Cyclic Self-Correction & Anomaly Routing",
      version: "v0.2+",
      badge: "🕸️ LangGraph v0.2+",
      role: "Directs balance sheet extraction through mathematical verification, cycling back to the extraction node if accounting discrepancies are flagged.",
      primitives: ["StateGraph", "Conditional Edges", "MemorySaver", "START / END"],
      howItWorks: "If the validator node detects a mathematical anomaly, it writes the discrepancy into state['anomalies'] and routes via conditional edge back to extract_node with corrective instructions.",
      bestPractice: "Include exact discrepancy values and row numbers in the feedback state channel so subsequent LLM passes have targeted context to fix errors.",
      watchOut: "Failing to check whether anomalies are already resolved can cause unnecessary looping; always compare previous anomaly sets against current."
    },
    langsmith: {
      title: "LangSmith Financial Accuracy & Anomaly Detection Evals",
      version: "v0.2+",
      badge: "🛠️ LangSmith v0.2+",
      role: "Benchmarks extraction accuracy against 10-K golden sets, calculating precision/recall on intentional accounting discrepancies.",
      primitives: ["@traceable", "Client.evaluate()", "Exact Match Evaluators", "Audit Logs"],
      howItWorks: "Every audit run is tagged with company_ticker and filing_year. eval.py executes automated assertions comparing extracted line items with verified SEC EDGAR filings.",
      bestPractice: "Store SEC filing datasets in LangSmith Dataset Hub to benchmark extraction prompt updates against ground-truth balance sheets.",
      watchOut: "Do not store unredacted PII or sensitive confidential financial records in LangSmith without configuring project masking."
    }
  },
  "adversarial-debate-eval": {
    langchain: {
      title: "LangChain Adversarial Prompting & Rubric Scoring",
      version: "v0.3+",
      badge: "🦜️🔗 LangChain v0.3+",
      role: "Enforces dialectical opposing viewpoints (Advocate vs Skeptic) and provides structured evaluation rubrics for the impartial Judge node.",
      primitives: ["ChatPromptTemplate", "with_structured_output", "FewShotChatMessagePromptTemplate"],
      howItWorks: "The Advocate is prompted to present steelmanned arguments; the Skeptic is prompted to identify logical fallacies and empirical counterexamples. The Judge uses a structured Pydantic rubric to emit an auditable verdict.",
      bestPractice: "Use explicit system prompt guardrails preventing debaters from conceding prematurely or adopting conversational pleasantries.",
      watchOut: "Bias can easily leak into the Judge prompt; enforce neutral, criteria-weighted scoring rubrics with structured output."
    },
    langgraph: {
      title: "LangGraph Multi-Turn Alternating Conversation Graph",
      version: "v0.2+",
      badge: "🕸️ LangGraph v0.2+",
      role: "Coordinates round-robin turns between debaters, maintaining turn synchronization in graph state before final handoff to the Judge.",
      primitives: ["StateGraph", "add_messages", "Conditional Edges", "Round Counter"],
      howItWorks: "State transitions alternate: advocate -> skeptic -> advocate_rebuttal -> skeptic_rebuttal -> judge. A conditional edge checks state['round'] < max_rounds to control debate depth.",
      bestPractice: "Store each debater's points in separate state channels (advocate_points, skeptic_points) in addition to the shared message history.",
      watchOut: "Ensure the Judge node does not execute until both debaters have completed their final rebuttals to maintain dialectical fairness."
    },
    langsmith: {
      title: "LangSmith Pairwise Consistency & Hallucination Evals",
      version: "v0.2+",
      badge: "🛠️ LangSmith v0.2+",
      role: "Tracks debate convergence, measures Judge decision consistency across reversed argument orders, and detects factual hallucinations.",
      primitives: ["@traceable", "Pairwise Evaluator", "Consistency Metrics", "Client"],
      howItWorks: "LangSmith traces log full multi-turn exchanges. eval.py tests Judge consistency by swapping the presentation order of arguments to verify that the verdict remains unbiased.",
      bestPractice: "Use LangSmith pairwise comparison evaluators to benchmark judge stability across different temperature settings.",
      watchOut: "Debates generate large message sequences; ensure run names clearly delineate Advocate, Skeptic, and Judge execution spans."
    }
  },
  "sandbox-code-interpreter": {
    langchain: {
      title: "LangChain Code Generation & Traceback Feedback",
      version: "v0.3+",
      badge: "🦜️🔗 LangChain v0.3+",
      role: "Generates self-contained, typed Python 3.12 algorithmic code with assertions and parses subprocess execution tracebacks for targeted repairs.",
      primitives: ["ChatPromptTemplate", "with_structured_output", "SystemMessage", "Pydantic Schema"],
      howItWorks: "The generator LLM is instructed to emit pure Python 3.12 code without external dependencies. On execution failure, error tracebacks are fed into a repair prompt that diagnoses the exact line and failure reason.",
      bestPractice: "Instruct the code generation model to include self-validating doctests or assert statements in the output module.",
      watchOut: "Never allow unverified string concatenations into code generation prompts; use typed Pydantic fields for requirement specifications."
    },
    langgraph: {
      title: "LangGraph Subprocess Sandbox Isolation & Repair Loop",
      version: "v0.2+",
      badge: "🕸️ LangGraph v0.2+",
      role: "Executes generated code in an isolated Python subprocess, tracks iteration counters in state, and routes to self-repair or escalation nodes.",
      primitives: ["StateGraph", "Conditional Edges", "MemorySaver", "Subprocess Execution Node"],
      howItWorks: "The execute_code node writes code to a temporary file and spawns subprocess.run([sys.executable, temp_file], timeout=5, capture_output=True). If returncode != 0, state['error_traceback'] is updated and the conditional edge cycles to reflect_node.",
      bestPractice: "Enforce strict execution timeouts (e.g. 5 seconds) in subprocess calls to prevent generated infinite loops from hanging graph execution.",
      watchOut: "Never execute untrusted LLM-generated code in the primary Python runtime process; always isolate in an OS subprocess or container sandbox."
    },
    langsmith: {
      title: "LangSmith Pass@K Metrics & Sandbox Telemetry",
      version: "v0.2+",
      badge: "🛠️ LangSmith v0.2+",
      role: "Tracks code execution latencies, logs subprocess stdout/stderr streams, and computes pass@1 and pass@3 metrics on benchmark programming problems.",
      primitives: ["@traceable", "Client.evaluate()", "Pass@1 / Pass@3 Metrics", "Run Trees"],
      howItWorks: "The sandbox execution node is decorated with @traceable. LangSmith logs whether each attempt exited cleanly or timed out, enabling visual debugging of iterative repair chains.",
      bestPractice: "Record stderr, return codes, and memory limits as run metadata in LangSmith to pinpoint syntax vs runtime errors.",
      watchOut: "Do not log huge binary outputs or infinite stdout buffers; truncate stdout/stderr to 4KB before recording in LangSmith spans."
    }
  },
  "incident-commander-sre": {
    langchain: {
      title: "LangChain SRE Diagnostic Tools & Metric Querying",
      version: "v0.3+",
      badge: "🦜️🔗 LangChain v0.3+",
      role: "Provides typed SRE diagnostic tools for querying Prometheus time-series metrics, Loki stack trace logs, and deployment configurations.",
      primitives: ["@tool", "bind_tools", "ChatPromptTemplate", "BaseModel"],
      howItWorks: "Specialist agents invoke tools like query_prometheus_metrics and fetch_loki_pod_logs. LangChain binds tools to ChatOpenAI with strict Pydantic parameter schemas (metric_name, service_name, time_window).",
      bestPractice: "Set default query time windows (e.g. last 15 minutes) on SRE tools to prevent overwhelming metrics backends with unbounded queries.",
      watchOut: "Ensure tools do not expose unparameterized shell or raw database credentials in their docstrings or default parameters."
    },
    langgraph: {
      title: "LangGraph Hierarchical SRE Squad & Remediation Gates",
      version: "v0.2+",
      badge: "🕸️ LangGraph v0.2+",
      role: "Coordinates Log Analyst, Metric Correlator, and Remediation Planner agents, with an interrupt() safety gate before executing cluster rollbacks.",
      primitives: ["StateGraph", "interrupt()", "Command(resume=...)", "SqliteSaver", "Supervisor Pattern"],
      howItWorks: "Commander routes diagnosis to parallel specialists. When the Remediation Planner drafts an action (e.g. rollback deployment), the node calls interrupt(plan_payload). Once on-call engineers approve, the graph resumes via Command(resume=True).",
      bestPractice: "Store incident snapshots in a persistent SqliteSaver or PostgresSaver so incident state is preserved across on-call engineer shifts.",
      watchOut: "Never automate destructive cluster actions (pod restarts, rollbacks, node drains) without an explicit in-node interrupt() human approval gate."
    },
    langsmith: {
      title: "LangSmith MTTR Telemetry & Postmortem Evals",
      version: "v0.2+",
      badge: "🛠️ LangSmith v0.2+",
      role: "Monitors Mean-Time-to-Detect (MTTD) and Mean-Time-to-Remediate (MTTR), tracking automated incident resolution traces in production.",
      primitives: ["@traceable", "RunTree", "MTTR Telemetry", "Postmortem Evaluator"],
      howItWorks: "Every incident run is tagged with incident_id, severity (P1-P3), and target_service. LangSmith measures the exact span duration from alert ingestion to final human approval and resolution.",
      bestPractice: "Use LangSmith evaluators to score the completeness of auto-generated incident postmortems against corporate SRE postmortem templates.",
      watchOut: "Ensure production alerts do not spam tracing projects; configure rate-limiting and separate staging from production LangSmith namespaces."
    }
  },
  "enterprise-rag-memory": {
    langchain: {
      title: "LangChain Semantic Memory Recall & Query Rewriting",
      version: "v0.3+",
      badge: "🦜️🔗 LangChain v0.3+",
      role: "Performs dense semantic vector similarity search against user memory stores and rewrites user prompts incorporating historical context.",
      primitives: ["VectorStoreRetriever", "ChatPromptTemplate", "with_structured_output", "Embeddings"],
      howItWorks: "LangChain retrieves top-K memories from a vector store matching user_id. A query rewriting prompt synthesizes the user's latest prompt with recalled facts into a standalone, disambiguated technical search query.",
      bestPractice: "Filter vector store queries using metadata filters (e.g. {'user_id': uid}) to guarantee multi-tenant data isolation.",
      watchOut: "Avoid injecting entire unfiltered memory archives into prompts; enforce score threshold cutoffs on similarity searches."
    },
    langgraph: {
      title: "LangGraph Long-Term State Channels & Memory Extraction",
      version: "v0.2+",
      badge: "🕸️ LangGraph v0.2+",
      role: "Maintains conversational thread checkpoints and asynchronously extracts persistent long-term memories into vector stores upon completion.",
      primitives: ["StateGraph", "add_messages", "Async Memory Node", "MemorySaver"],
      howItWorks: "Graph execution proceeds: recall_memories -> rewrite_query -> retrieve_docs -> generate_response -> extract_new_memory. The final node checks if the turn contained new durable facts and writes them to the vector store.",
      bestPractice: "Differentiate short-term conversation thread state (in MemorySaver/SqliteSaver) from long-term user semantic memory (in vector stores).",
      watchOut: "Do not perform slow external vector store writes synchronously in the main user response path; structure memory extraction as a trailing node."
    },
    langsmith: {
      title: "LangSmith RAG Triad Evaluators & Groundedness Tracking",
      version: "v0.2+",
      badge: "🛠️ LangSmith v0.2+",
      role: "Benchmarks RAG Triad metrics (Context Relevance, Groundedness, Answer Relevance) and audits memory extraction precision.",
      primitives: ["@traceable", "Client.evaluate()", "RAG Triad Metrics", "Dataset Versioning"],
      howItWorks: "Every retrieved context chunk and generated answer is logged as a sub-span in LangSmith. Automated evaluators score whether the generated code answer is strictly supported by the retrieved documentation.",
      bestPractice: "Run continuous LangSmith evaluation on production sample queries to detect retrieval drift when underlying documentation changes.",
      watchOut: "Logging full document text chunks can increase trace payload size; configure text truncation or LangSmith dataset references."
    }
  },
  "kyc-compliance-workflow": {
    langchain: {
      title: "LangChain KYC Schema Validation & Registry Tools",
      version: "v0.3+",
      badge: "🦜️🔗 LangChain v0.3+",
      role: "Parses applicant passport MRZ strings into typed Pydantic schemas and queries OFAC / PEP sanctions registries via fuzzy string search tools.",
      primitives: ["with_structured_output", "@tool", "BaseModel", "ChatPromptTemplate"],
      howItWorks: "The Document OCR agent uses with_structured_output(PassportSchema) to extract name, birthdate, and nationality. The Screener agent invokes search_sanctions_registry with fuzzy string distance algorithms.",
      bestPractice: "Enforce strict checksum validation algorithms on MRZ numbers inside Pydantic field validators before calling external APIs.",
      watchOut: "Do not pass unverified applicant data into screening tools; validate string types, date formats, and country ISO codes."
    },
    langgraph: {
      title: "LangGraph Parallel Verification & Compliance Officer Gates",
      version: "v0.2+",
      badge: "🕸️ LangGraph v0.2+",
      role: "Executes document verification and sanctions screening in parallel, computes risk scores, and triggers interrupt() if score > 75.",
      primitives: ["StateGraph", "interrupt()", "Command(resume=...)", "SqliteSaver", "Parallel Edges"],
      howItWorks: "Supervisor forks parallel branches to OCR and Sanctions agents. The Risk Profiler aggregates findings into a composite score (0-100). If score > 75 or an ambiguous match is detected, the graph calls interrupt() for compliance sign-off.",
      bestPractice: "Store the complete serialized applicant dossier in SqliteSaver checkpointers to provide tamper-evident compliance audit logs.",
      watchOut: "Ensure the approval decision returned by Command(resume=...) includes certified compliance officer credentials and notes."
    },
    langsmith: {
      title: "LangSmith Compliance Audit Trails & False-Positive Evals",
      version: "v0.2+",
      badge: "🛠️ LangSmith v0.2+",
      role: "Maintains tamper-evident audit records of all compliance decisions and evaluates screening precision against synthetic benchmark datasets.",
      primitives: ["@traceable", "Client", "evaluate()", "Audit Trail Logging"],
      howItWorks: "All compliance runs are tagged with applicant_id and risk_tier. eval.py tests the workflow against 100 known OFAC test profiles to verify that 100% of true sanctions matches trigger human approval interrupts.",
      bestPractice: "Cryptographically sign run IDs and attach supervisor decision metadata to LangSmith trace feedback for regulatory examination.",
      watchOut: "Never store unredacted passport scan images or national tax identifiers in LangSmith trace metadata; hash or mask sensitive fields."
    }
  },
  "competitive-market-intelligence": {
    langchain: {
      title: "LangChain Competitive Extraction & Briefing Synthesis",
      version: "v0.3+",
      badge: "🦜️🔗 LangChain v0.3+",
      role: "Extracts competitor pricing, rate limits, and model capabilities into structured comparative tables and formats executive briefings.",
      primitives: ["with_structured_output", "ChatPromptTemplate", "Pydantic Schema", "@tool"],
      howItWorks: "Web search results are structured via model.with_structured_output(CompetitorOfferings). The synthesizer prompt consumes structured records and outputs an executive briefing with formatted markdown tables.",
      bestPractice: "Use nested Pydantic models for pricing tiers (e.g. input_tokens, output_tokens, audio_per_minute) to ensure standardized comparison units.",
      watchOut: "Pricing and rate limits change rapidly; require extraction models to capture effective date timestamps on every price tier."
    },
    langgraph: {
      title: "LangGraph Dynamic Parallel Dispatch via Send()",
      version: "v0.2+",
      badge: "🕸️ LangGraph v0.2+",
      role: "Generates research tasks dynamically from user inquiries and schedules concurrent research workers via Send() before final synthesis.",
      primitives: ["Send() API", "StateGraph", "add_messages", "operator.add channel reducer"],
      howItWorks: "The planner node emits a list of ResearchTask objects. A conditional edge returns [Send('worker', task) for task in tasks]. LangGraph schedules workers concurrently and aggregates findings into state['findings'].",
      bestPractice: "Use state channel reducers with operator.add so parallel worker outputs merge seamlessly into a list without race conditions.",
      watchOut: "Failing to handle empty search results in worker nodes can cause the reduce synthesizer node to receive incomplete comparative data."
    },
    langsmith: {
      title: "LangSmith Research Completeness & Latency Benchmarks",
      version: "v0.2+",
      badge: "🛠️ LangSmith v0.2+",
      role: "Traces parallel worker execution latencies, measures tool success rates, and scores report completeness against reference market matrices.",
      primitives: ["@traceable", "Client.evaluate()", "Completeness Evaluator", "Span Graphs"],
      howItWorks: "Each worker span records the targeted competitor name and query latency. eval.py evaluates whether the final markdown report includes all required competitors and pricing dimensions.",
      bestPractice: "Tag runs with target_companies=['openai', 'anthropic', 'google'] to allow targeted filtering in the LangSmith run monitor.",
      watchOut: "Parallel web requests can encounter transient 429 rate limits; monitor tool error rates in the LangSmith dashboard."
    }
  },
  "text-to-sql-sandboxed": {
    langchain: {
      title: "LangChain Database Schema Grounding & SQL Synthesis",
      version: "v0.3+",
      badge: "🦜️🔗 LangChain v0.3+",
      role: "Inspects SQLite/PostgreSQL database schemas and prompts chat models to emit dialect-compliant, parameter-safe SQL queries.",
      primitives: ["ChatPromptTemplate", "with_structured_output", "SystemMessage", "Pydantic Schema"],
      howItWorks: "Schema introspection tools load CREATE TABLE DDLs and foreign key relationships into prompt context. The SQL generator model outputs structured query objects containing SQL text and required parameter bindings.",
      bestPractice: "Always ground SQL prompts with exact table names, column types, and foreign key relationships to prevent column hallucination.",
      watchOut: "Never allow models to execute raw concatenated strings without query parameterization to eliminate SQL injection risks."
    },
    langgraph: {
      title: "LangGraph Sandboxed EXPLAIN Validation & Self-Repair",
      version: "v0.2+",
      badge: "🕸️ LangGraph v0.2+",
      role: "Runs candidate queries through an EXPLAIN QUERY PLAN validation node, cycling back to self-repair if syntax or operational errors occur.",
      primitives: ["StateGraph", "Conditional Edges", "MemorySaver", "Validation Node"],
      howItWorks: "The validator node tests candidate SQL using EXPLAIN QUERY PLAN on a read-only database connection. If an OperationalError occurs, error text is stored in state['sql_error'] and the graph routes to self-repair up to 3 retries.",
      bestPractice: "Execute query validation exclusively on read-only transactions with strict execution timeouts to ensure security and performance.",
      watchOut: "Queries that pass syntax checks can still return empty result sets; validate both syntax and logical filter predicates in graph state."
    },
    langsmith: {
      title: "LangSmith SQL Safety Assertions & Semantic Evals",
      version: "v0.2+",
      badge: "🛠️ LangSmith v0.2+",
      role: "Benchmarks generated queries against golden Spider/BIRD dataset questions, verifying result set equivalence and zero data mutations.",
      primitives: ["@traceable", "Client.evaluate()", "SQL Exact Match Evaluator", "Safety Assertion"],
      howItWorks: "LangSmith runs record generated SQL and execution times. eval.py executes both candidate and golden SQL queries on test databases and asserts that result dataframes match identically.",
      bestPractice: "Implement safety assertion evaluators in LangSmith that flag any generated queries containing DROP, TRUNCATE, ALTER, or DELETE keywords.",
      watchOut: "Database query outputs can be large; do not log complete table dump payloads into LangSmith spans; log row counts and schema shapes."
    }
  },
  "hierarchical-document-summarizer": {
    langchain: {
      title: "LangChain Chunk Summarization & Executive Briefs",
      version: "v0.3+",
      badge: "🦜️🔗 LangChain v0.3+",
      role: "Summarizes overlapping semantic text chunks and synthesizes chunk takeaways into executive briefs with key insights and action items.",
      primitives: ["ChatPromptTemplate", "with_structured_output", "Pydantic Schema", "Document Transformers"],
      howItWorks: "Documents are split into semantic chunks. Individual chunk summarization prompts extract salient facts into typed summaries. The reduce prompt synthesizes all chunk summaries into a structured executive brief.",
      bestPractice: "Include section headers and chunk index metadata in summarization prompts so the final synthesizer maintains narrative continuity.",
      watchOut: "Do not discard document structure; preserve section headings and table structures across intermediate summary stages."
    },
    langgraph: {
      title: "LangGraph Map-Reduce Topology via Send()",
      version: "v0.2+",
      badge: "🕸️ LangGraph v0.2+",
      role: "Implements high-throughput Map-Reduce document summarization by dynamically fanning out chunk tasks via Send() and reducing results.",
      primitives: ["Send() API", "StateGraph", "operator.add channel reducer", "START / END"],
      howItWorks: "The chunking node slices documents and returns [Send('summarize_chunk', chunk) for chunk in chunks]. Worker nodes run concurrently, appending section summaries to the state channel before the reduce node runs.",
      bestPractice: "Use Send() for map-reduce architectures over large documents to achieve linear speedups across multi-threaded workers.",
      watchOut: "Ensure the state channel accumulating summaries uses operator.add; using a non-reducing channel will overwrite intermediate summaries."
    },
    langsmith: {
      title: "LangSmith Compression Ratio & Faithfulness Telemetry",
      version: "v0.2+",
      badge: "🛠️ LangSmith v0.2+",
      role: "Tracks token compression ratios across map-reduce stages and evaluates factual faithfulness against the original source document.",
      primitives: ["@traceable", "Client.evaluate()", "Faithfulness Evaluator", "Token Tracking"],
      howItWorks: "LangSmith traces log tokens consumed in map tasks vs reduce tasks. eval.py evaluates final summaries against source documents using LangSmith factual faithfulness evaluators.",
      bestPractice: "Track token compression ratio (output tokens / input tokens) in LangSmith run metadata to maintain consistent executive brevity.",
      watchOut: "Large documents can generate dozens of concurrent LLM calls; ensure your model provider tier supports the required TPM rate limits."
    }
  },
  "cybersecurity-threat-hunter": {
    langchain: {
      title: "LangChain SIEM Query Tools & CVE Lookup Bindings",
      version: "v0.3+",
      badge: "🦜️🔗 LangChain v0.3+",
      role: "Binds threat hunting tools (firewall log queries, authentication log audits, NIST NVD CVE searches) to security analyst agents.",
      primitives: ["@tool", "bind_tools", "ChatPromptTemplate", "BaseModel"],
      howItWorks: "Security analyst agents invoke typed tools such as query_auth_logs and search_cve_database. LangChain binds tools to ChatOpenAI with strict Pydantic parameter schemas.",
      bestPractice: "Enforce strict IP address, CIDR block, and CVE identifier regex formats in Pydantic tool argument models.",
      watchOut: "Sanitize all log query inputs to prevent SIEM query injection attacks in Splunk or Elasticsearch tools."
    },
    langgraph: {
      title: "LangGraph Security Squad & Firewall Approval Gates",
      version: "v0.2+",
      badge: "🕸️ LangGraph v0.2+",
      role: "Coordinates Recon, Vulnerability, and Patch agents with an in-node interrupt() safety gate before automated firewall rule modifications.",
      primitives: ["StateGraph", "interrupt()", "Command(resume=...)", "SqliteSaver", "Supervisor Pattern"],
      howItWorks: "Recon identifies anomalous traffic; Vulnerability matches known CVEs; Patch drafts iptables rules. Before modifying network boundaries, the node calls interrupt(patch_payload). On-call SecOps approve via Command(resume=True).",
      bestPractice: "Maintain persistent state in SqliteSaver to ensure that security incident investigations can be audited forensically.",
      watchOut: "Never permit automated agent execution of network perimeter modifications without human security engineer authorization."
    },
    langsmith: {
      title: "LangSmith SecOps Precision Evals & Latency Audits",
      version: "v0.2+",
      badge: "🛠️ LangSmith v0.2+",
      role: "Measures Mean-Time-to-Respond (MTTR) on critical security alerts and benchmarks threat detection precision against synthetic attack logs.",
      primitives: ["@traceable", "Client.evaluate()", "Precision / Recall Metrics", "Forensic Run Trees"],
      howItWorks: "All incident investigation spans are logged under project 'security-threat-hunter'. eval.py tests detection accuracy against benchmark attack simulations.",
      bestPractice: "Attach threat severity tags (e.g. tags=['CRITICAL', 'CVE-2026-1182']) to LangSmith runs to enable real-time alerting on high-risk detections.",
      watchOut: "Ensure firewall credentials and internal network topologies are scrubbed from LangSmith trace metadata."
    }
  },
  "autonomous-supply-chain-dispatch": {
    langchain: {
      title: "LangChain Freight Calculator & Logistics Tools",
      version: "v0.3+",
      badge: "🦜️🔗 LangChain v0.3+",
      role: "Binds warehouse inventory auditing and carrier freight rate calculation tools, enforcing typed Pydantic procurement schemas.",
      primitives: ["@tool", "bind_tools", "ChatPromptTemplate", "BaseModel"],
      howItWorks: "Logistics agents invoke check_warehouse_inventory and calculate_freight_rates. LangChain handles argument formatting and converts outputs to ToolMessage instances.",
      bestPractice: "Define typed Pydantic schemas for carrier procurement options, capturing carrier name, rate, estimated transit hours, and reliability scores.",
      watchOut: "Ensure tools handle warehouse regional partition failures gracefully without returning null or empty responses to the agent."
    },
    langgraph: {
      title: "LangGraph Inventory Routing & Director Approval Gate",
      version: "v0.2+",
      badge: "🕸️ LangGraph v0.2+",
      role: "Coordinates inventory auditing, route optimization, and carrier procurement, triggering interrupt() when freight cost exceeds $5,000.",
      primitives: ["StateGraph", "interrupt()", "Command(resume=...)", "MemorySaver", "Sequential Edges"],
      howItWorks: "Inventory Auditor audits regional stock; Route Optimizer selects the best carrier bid. If freight_cost > $5,000, Procurement Agent calls interrupt(contract_payload). Operations Director approves via Command(resume=True) to emit the Bill of Lading.",
      bestPractice: "Use state snapshots to inspect pending interrupt contracts and verify authorization conditions before resuming the graph.",
      watchOut: "Do not emit final contractual Bills of Lading or commitments until director_approved is verified in graph state."
    },
    langsmith: {
      title: "LangSmith Spend Threshold Compliance & Routing Evals",
      version: "v0.2+",
      badge: "🛠️ LangSmith v0.2+",
      role: "Audits supply chain contract spend compliance and tracks logistics routing optimization performance across multi-regional hubs.",
      primitives: ["@traceable", "Client.evaluate()", "Spend Compliance Evaluator", "Cost Tracking"],
      howItWorks: "Every dispatch run records carrier name, SKU, required quantity, and agreed freight cost. eval.py asserts that 100% of contracts over $5,000 have recorded director approval in trace logs.",
      bestPractice: "Record freight cost savings (difference between highest and selected carrier bid) in LangSmith run metadata to quantify agentic ROI.",
      watchOut: "Ensure supplier negotiated rate contracts are stored securely and sanitized in trace logs according to corporate procurement policies."
    }
  }
};

export function getWorkflowFrameworkLearnings(workflow: { id: string; title: string; category: string; type: string }): WorkflowFrameworkLearnings {
  if (FRAMEWORK_LEARNINGS_MAP[workflow.id]) {
    return FRAMEWORK_LEARNINGS_MAP[workflow.id];
  }

  // Resilient fallback for any custom or future topologies
  const isMulti = workflow.type === "multi";
  return {
    langchain: {
      title: "LangChain Core Architecture & Tool System",
      version: "v0.3+",
      badge: "🦜️🔗 LangChain v0.3+",
      role: `Provides prompt management, schema-validated tool definitions, and structured output generation for ${workflow.title}.`,
      primitives: ["@tool", "with_structured_output", "ChatPromptTemplate", "BaseModel"],
      howItWorks: "Uses LangChain v0.3 standard tool calling and Pydantic v2 schemas to ensure deterministic model interactions and type-safe tool execution.",
      bestPractice: "Always specify detailed docstrings and field descriptions on Pydantic models and tools to guide model argument synthesis.",
      watchOut: "Avoid legacy LangChain chains or untyped dictionary inputs; use LCEL runnables and bind_tools exclusively."
    },
    langgraph: {
      title: "LangGraph Stateful Runtime & Graph Topology",
      version: "v0.2+",
      badge: "🕸️ LangGraph v0.2+",
      role: `Manages stateful execution, channel reduction with add_messages, and ${isMulti ? "multi-agent coordination" : "cyclic self-correction"} for this topology.`,
      primitives: ["StateGraph", "add_messages", "Conditional Edges", "Checkpointer (SqliteSaver / MemorySaver)"],
      howItWorks: "State transitions are managed through typed channels and conditional edges. Graph state is persisted across execution steps using registered checkpointers.",
      bestPractice: "Return explicit state delta dictionaries from all graph nodes; never mutate the existing state dictionary in-place.",
      watchOut: "Always specify recursion limits and checkpointer configurations to prevent unhandled infinite loops or state loss."
    },
    langsmith: {
      title: "LangSmith Distributed Tracing & Continuous Evaluation",
      version: "v0.2+",
      badge: "🛠️ LangSmith v0.2+",
      role: `Captures distributed span trees, tracks latency and token costs, and powers automated regression testing via eval.py for ${workflow.title}.`,
      primitives: ["@traceable", "Client", "evaluate()", "RunTree", "Dataset Hub"],
      howItWorks: "Decorates nodes and tools with @traceable to generate nested span trees in the LangSmith dashboard, recording complete inputs, outputs, and latencies.",
      bestPractice: "Organize runs with descriptive tags and metadata, and maintain versioned ground-truth test datasets for continuous evaluation.",
      watchOut: "Ensure LANGCHAIN_TRACING_V2=true and valid API keys are configured before graph execution to prevent silent trace drops."
    }
  };
}
