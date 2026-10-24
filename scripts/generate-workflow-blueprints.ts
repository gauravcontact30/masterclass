/**
 * Writes the Workflow blueprints added on 2026-10-23 (cab booking, e-commerce end to end, school and university
 * management, campus placement, and one per company: Google, Amazon, Microsoft, Meta, Anthropic, OpenAI, Apple,
 * Salesforce, Flipkart) and on 2026-10-24 (eleven or twelve more each for System Design, LangChain, LangGraph,
 * LangFlow, LangSmith and the new n8n category). LangChain, LangGraph and LangSmith blueprints are written against
 * reference notes checked with the Docs by LangChain MCP server (REFERENCE below), and their questions carry its
 * source label. For each: the diagram (nodes on the 5 × 3 grid of the 1000 × 380 canvas, edges, numbered
 * steps), its brief (industry, problem, outcome), the full detail (stack, decisions, pitfalls, metrics) with three
 * subjective and three objective questions, and 30 + 30 more questions in their own chunk.
 *
 * Every diagram is checked (unique cells, edges between real nodes, badges within the steps, short labels) and sent
 * back to the model with the errors until it passes. Parts are cached in node_modules/.cache/workflow-blueprints,
 * so a stopped run resumes. Output: lib/landing-workflows-extra.ts, lib/workflow-prep/extra.ts,
 * lib/workflow-prep/questions-extra.ts and lib/workflow-prep/questions/<id>.ts.
 *
 * Run: npx tsx --env-file=.env scripts/generate-workflow-blueprints.ts [id…]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { z } from "zod";
import { gateway, generateText, Output } from "ai";
import type { Workflow } from "../lib/landing-workflows";

const MODEL = process.env.WORKFLOW_MODEL || "anthropic/claude-opus-5-5";
const CACHE = "node_modules/.cache/workflow-blueprints";
const MORE = 30;

type Spec = { id: string; group: Workflow["group"]; dashboardOnly?: boolean; title: string; brief: string };
const LANGCHAIN_SOURCE = "Sourced from Docs by LangChain (MCP)";
/** Groups whose facts were checked with the Docs by LangChain MCP server; their questions show LANGCHAIN_SOURCE. */
const MCP_GROUPS = new Set<Spec["group"]>(["LangChain", "LangGraph", "LangSmith"]);

/*
 * Facts each group's blueprints must agree with. LangChain, LangGraph and LangSmith notes were looked up with the Docs
 * by LangChain MCP server on 2026-10-24; Langflow is not covered by that server, and n8n notes are general knowledge.
 */
const REFERENCE: Partial<Record<Spec["group"], string>> = {
  LangChain: `LangChain v1 (Docs by LangChain): agents are built with create_agent (Python) / createAgent (JS), a model + tools + optional system prompt, running the model-tool loop on LangGraph. Customisation is middleware passed to create_agent: built-in SummarizationMiddleware (trigger e.g. ("tokens", 4000), keep e.g. ("messages", 20)), HumanInTheLoopMiddleware (interrupt_on per tool with allowed decisions approve/edit/reject), PIIMiddleware (redact/mask/block e.g. email, phone), model fallback middleware (fallback models tried in order on failure), tool retry, model call limit, LLM tool selector; custom middleware hooks before_model/after_model/wrap_model_call/wrap_tool_call. Structured output with response_format. Short-term memory is thread-scoped via a checkpointer; long-term memory uses LangGraph stores (JSON documents by namespace and key, optional semantic search). Models via init_chat_model("provider:model"). MCP tools are adapted into LangChain tools with the MCP adapters (MultiServerMCPClient / MCPAdapter). RAG uses document loaders, text splitters, embeddings, vector stores and retrievers. create_deep_agent (Deep Agents) pre-assembles filesystem, summarization, subagents and prompt caching for long tasks.`,
  LangGraph: `LangGraph (Docs by LangChain): StateGraph with a typed state, nodes (functions returning state updates), edges and conditional edges, START/END, reducers on state keys (e.g. operator.add for lists). Send objects returned from a conditional edge fan out to a node with per-item state (map-reduce). Checkpointers (InMemorySaver for dev, Postgres in production) save state per thread_id at every super-step, enabling durable execution, resuming after failure, and time travel (replay or fork from an earlier checkpoint with get_state_history / update_state). interrupt() pauses a node for human input and Command(resume=...) continues; Command(goto=..., update=...) also routes and updates from inside nodes (handoffs). Stores (InMemoryStore, PostgresStore) give long-term memory across threads, organised by namespace tuples, with optional semantic search. Subgraphs compose graphs as nodes. Streaming modes: values, updates, messages (LLM tokens with node metadata), custom, debug. Multi-agent patterns: supervisor, swarm/handoffs, hierarchical teams. Deployment on LangSmith's Agent Server exposes agents over an API and an MCP endpoint at /mcp.`,
  LangSmith: `LangSmith (Docs by LangChain): tracing via LANGSMITH_TRACING and the @traceable decorator / wrappers (wrap_openai), integrations for LangChain, LangGraph, Vercel AI SDK and others, and native OpenTelemetry (OTLP endpoint, fan-out via a collector). Runs and traces grouped into projects; threads group multi-turn conversations. Offline evaluation: datasets of examples (inputs + reference outputs, from curated cases, production traces or synthetic data), evaluators (human, code rules, LLM-as-judge with prebuilt templates and few-shot, pairwise), experiments via evaluate() with repetitions, concurrency and caching, compared for benchmarking, unit tests, regression tests and backtesting. pytest (@pytest.mark.langsmith) and Vitest/Jest integrations turn test files into datasets and experiments. agentevals provides trajectory evaluators (e.g. trajectory LLM-as-judge). Online evaluation: evaluators on production runs or threads with filters and sampling rates, dashboards and alerts, automation rules and webhooks. Annotation queues: single-run queues (rubrics, assertions, export to datasets) and pairwise queues (exactly two experiments), with reviewer counts and reservations. Prompts are versioned and managed in the Prompt Hub / Playground with commits and tags. Running an online evaluator upgrades a trace to extended retention.`,
  LangFlow: `Langflow: an open-source visual builder (Python) where flows are graphs of components (inputs, prompts, models, vector stores, agents, tools, outputs) connected on a canvas, tested in the Playground, and run through the API (POST /api/v1/run/<flow-id>, with tweaks to override component settings) or webhooks. The Agent component takes tools (components switched to tool mode, other flows, MCP tools). Langflow can act as an MCP server, exposing flows as tools to MCP clients, and as an MCP client. Custom components are Python classes with inputs and outputs. Message history gives chat memory per session id. Tracing integrations include LangSmith and Langfuse. Do not invent component names beyond these general ones.`,
  n8n: `n8n: a fair-code workflow automation platform (self-hosted or n8n Cloud). Workflows start from trigger nodes (Webhook, Schedule, app triggers such as Gmail or Form, Chat Trigger) and pass items (JSON) through nodes: HTTP Request, Code (JavaScript or Python), IF, Switch, Merge, Loop Over Items (batches), Wait (including waiting for a form or webhook approval), Set/Edit Fields, Execute Workflow (sub-workflows), plus app nodes (Slack, Google Sheets, Postgres, CRMs). Credentials are stored encrypted and referenced by nodes. Error workflows (Error Trigger) and per-node retry-on-fail handle failures; executions are logged. AI: the AI Agent node (LangChain-based in n8n) with a chat model sub-node, memory sub-node and tool sub-nodes, plus vector store, embeddings, text classifier, information extractor and summarisation nodes. Model calls in these blueprints go through Vercel AI Gateway: an OpenAI-compatible chat model node whose base URL is https://ai-gateway.vercel.sh/v1 with an AI Gateway API key, so one credential reaches many providers (models named like "anthropic/claude-sonnet-4.5" or "openai/gpt-5"), with fallbacks, spend tracking and no provider keys in n8n. Queue mode with Redis and workers scales executions.`,
};
const COMPANY = "Show BOTH sides of the company on this one slide: the diagram is the end-to-end system behind its flagship product, and the steps, decisions and questions also cover how the company plans, builds and launches (its publicly documented engineering and operating practices). Use only well-known public information; do not invent internal numbers or secret details, and say 'publicly described' practices in general terms.";

export const SPECS: Spec[] = [
  { id: "cab-booking", group: "System Design", title: "Cab booking end to end (Uber & Ola)", brief: "A complete ride-hailing app like Uber and Ola: rider sets pickup and drop, fare estimate with surge, booking, driver matching by geo cells and ETA, driver accepts, OTP-verified pickup, live trip tracking, fare calculation, payment (UPI, cards, wallet, cash), ratings, cancellations with fees, and safety (SOS, trip sharing). Indian context (UPI, cash, autos and bikes) where natural." },
  { id: "ecommerce-platform", group: "System Design", title: "E-commerce platform: buy, sell, deliver, return", brief: "An end-to-end marketplace: sellers onboard and list products (catalogue, inventory), buyers search, add to cart and check out with payment, order splitting by seller and warehouse, inventory reservation, shipment creation and courier handover, delivery status tracking with events, delivery confirmation, and the full return and refund flow (return request, pickup, quality check, refund to source or wallet, seller settlement)." },
  { id: "school-university", group: "System Design", title: "School & university management system", brief: "A management platform for schools and universities: admissions and enrolment, student and staff records, timetables and class scheduling, attendance, fees and payments, courses and learning management, exams and results with grading, parent and student portals, notifications, and reports for administrators, with role-based access and student data privacy." },
  { id: "campus-placement", group: "System Design", title: "Campus placement workflow", brief: "A campus placement portal end to end: students build profiles and resumes, the placement cell verifies records, companies register drives with eligibility criteria, eligible students are notified and apply, online assessments, interview scheduling, panels record feedback, offers are released and accepted, the one-offer policy is enforced, and placement statistics are reported, with fairness and audit trails." },
  { id: "company-google", group: "Companies", dashboardOnly: true, title: "Google: Search & Ads, and how Google ships", brief: `Google. Flagship system: a search query from the browser through Google's front end, query understanding, fan-out to sharded indexes, ranking, a parallel ads auction, and results, with click logs feeding quality evaluation. Operating side: design docs and reviews, monorepo with code review and presubmit tests, experiments and launch reviews, SRE with SLOs and error budgets. ${COMPANY}` },
  { id: "company-amazon", group: "Companies", dashboardOnly: true, title: "Amazon: order to doorstep, and working backwards", brief: `Amazon. Flagship system: an order on amazon.com or amazon.in through cart, checkout and payment, inventory and fulfilment-centre selection, picking and packing, sortation, last-mile delivery and tracking, with services communicating through APIs. Operating side: working backwards with a press release and FAQ, six-page narratives, two-pizza teams that own services ('you build it, you run it'), weekly business reviews. ${COMPANY}` },
  { id: "company-microsoft", group: "Companies", dashboardOnly: true, title: "Microsoft: Teams & Azure, and how Microsoft ships", brief: `Microsoft. Flagship system: a Microsoft Teams meeting and chat on Azure: sign-in with Entra ID, presence, chat messages, real-time media for calls, recording and storage, and Copilot features, across Azure regions. Operating side: planning and roadmaps, safe deployment practices with staged rollouts by ring, incident management, security development lifecycle. ${COMPANY}` },
  { id: "company-meta", group: "Companies", dashboardOnly: true, title: "Meta: feed & ads, and how Meta ships", brief: `Meta. Flagship system: a person opens Facebook or Instagram: the feed service gathers candidate posts, ML ranking orders them, ads are inserted by an auction, content passes integrity checks, and interactions are logged back for ranking models. Operating side: small teams, continuous deployment with gatekeepers and feature flags, A/B experiments, code review and on-call. ${COMPANY}` },
  { id: "company-anthropic", group: "Companies", dashboardOnly: true, title: "Anthropic: from model training to the Claude API", brief: `Anthropic. Flagship system: how a Claude model goes from training to serving: data, pretraining, fine-tuning with human and AI feedback (Constitutional AI), safety evaluations under the Responsible Scaling Policy, release, then the Claude API and apps serving requests with rate limits, prompt caching and usage monitoring. Operating side: safety research and evaluations gating releases, staged access, public model cards and usage policies. ${COMPANY}` },
  { id: "company-openai", group: "Companies", dashboardOnly: true, title: "OpenAI: serving ChatGPT, and how OpenAI ships", brief: `OpenAI. Flagship system: a ChatGPT message from the app through authentication, conversation storage, moderation, routing to a model, GPU inference with streaming tokens, tool use (search, code), and the API platform with keys, rate limits and usage billing. Operating side: model training and evaluation, preparedness and safety testing before release, staged rollouts, system cards. ${COMPANY}` },
  { id: "company-apple", group: "Companies", dashboardOnly: true, title: "Apple: App Store to iPhone, and how Apple ships", brief: `Apple. Flagship system: an app's path from a developer to an iPhone: Xcode build and signing, App Store Connect upload, TestFlight beta, App Review, publishing to the App Store, a user's download over a CDN, in-app purchases, and updates; plus iCloud sync on the device. Operating side: tightly integrated hardware and software teams, annual OS release cycle announced at WWDC, betas for developers, privacy-by-design reviews. ${COMPANY}` },
  { id: "company-salesforce", group: "Companies", dashboardOnly: true, title: "Salesforce: lead to cash on a multi-tenant CRM", brief: `Salesforce. Flagship system: a lead captured from a web form, routed and scored, converted to an opportunity, quoted, closed, then handed to service with cases, all on a multi-tenant platform with metadata-driven customisation, governor limits, APIs and AI (Einstein/Agentforce) features. Operating side: three major releases a year with sandboxes and release previews, trust and availability practices, the AppExchange partner ecosystem. ${COMPANY}` },
  { id: "company-flipkart", group: "Companies", dashboardOnly: true, title: "Flipkart: Big Billion Days, and how Flipkart ships", brief: `Flipkart. Flagship system: a flash sale during The Big Billion Days: traffic surge at the edge, a virtual queue, catalogue and price caching, inventory reservation without overselling, checkout with UPI and EMI, order allocation to fulfilment centres, and delivery through Ekart, including cash on delivery. Operating side: sale-readiness load testing and capacity planning months ahead, feature freezes, war rooms during the sale. ${COMPANY}` },
  // 2026-10-24: more System Design.
  { id: "sd-ticket-booking", group: "System Design", title: "Movie & event ticket booking (BookMyShow)", brief: "Seat selection with temporary seat locks (TTL), payment within the hold window, no double booking under a rush for a popular show, release of expired holds, e-ticket with QR, cancellations and refunds, and a waiting room for blockbuster openings." },
  { id: "sd-hotel-booking", group: "System Design", title: "Hotel reservation & room inventory", brief: "Search by city and dates, availability per room type per night, holds during checkout, overbooking policy, payments and deposits, channel manager sync with online travel agencies, cancellations, and consistency of per-night inventory." },
  { id: "sd-stock-exchange", group: "System Design", title: "Stock trading & order matching engine", brief: "Broker app to exchange: order validation and risk checks (margin), the order book per symbol with price-time priority matching, trade confirmations, market data fan-out, settlement handoff, and the very low latency and strict ordering it needs." },
  { id: "sd-upi-payments", group: "System Design", title: "UPI payment flow end to end", brief: "A UPI payment from a payment app: VPA resolution, PSP bank, NPCI switch, payer bank debit and payee bank credit, collect requests vs pay requests, PIN authentication on device, idempotency, timeouts and deemed-approved/pending states, reconciliation and refunds." },
  { id: "sd-distributed-cache", group: "System Design", title: "Distributed cache cluster", brief: "A Redis-like distributed cache: consistent hashing with virtual nodes, replication and failover, eviction policies (LRU/LFU), TTLs, hot keys, cache stampede protection, write-through vs write-back, and adding nodes without mass misses." },
  { id: "sd-file-storage", group: "System Design", title: "Cloud file storage & sync (Google Drive, Dropbox)", brief: "Upload and download with chunking and resumable uploads, deduplication by content hash, metadata service, sync across devices with change notifications, conflict handling, sharing and permissions, versions and trash, and object storage behind it." },
  { id: "sd-web-crawler", group: "System Design", title: "Web crawler at scale", brief: "Seed URLs, URL frontier with priorities and per-host politeness, robots.txt, DNS caching, fetchers, parsing and link extraction, duplicate URL and near-duplicate content detection, storage for pages, recrawl scheduling, and traps." },
  { id: "sd-collab-editor", group: "System Design", title: "Collaborative document editing (Google Docs)", brief: "Real-time co-editing with operational transformation or CRDTs, WebSocket sessions per document, presence and cursors, offline edits and merge, snapshots plus operation logs, comments, permissions and version history." },
  { id: "sd-monitoring", group: "System Design", title: "Metrics, logs & alerting platform", brief: "Agents collecting metrics and logs, ingestion through a queue, time-series storage with downsampling, log indexing, dashboards, alert rules with deduplication and routing to on-call, retention tiers, and high-cardinality problems." },
  { id: "sd-api-gateway", group: "System Design", title: "API gateway with canary releases", brief: "Single entry for microservices: TLS termination, authentication (JWT/OAuth), rate limiting, routing and service discovery, request transformation, circuit breaking and retries, canary and blue-green routing by percentage, and observability per route." },
  { id: "sd-quick-commerce", group: "System Design", title: "10-minute grocery delivery (dark stores)", brief: "Quick commerce like Blinkit or Zepto: serviceability by location, dark store assignment, real-time inventory per store, order picking and packing SLAs, rider assignment, live tracking, substitutions and refunds, and demand forecasting for restocking." },
  { id: "sd-leaderboard", group: "System Design", title: "Real-time gaming leaderboard", brief: "Score updates from millions of players, sorted sets for global and friends leaderboards, rank queries, top-N and around-me views, sharding by region or season, anti-cheat validation, and periodic resets with archived seasons." },
  // 2026-10-24: more LangChain.
  { id: "lc-structured-extraction", group: "LangChain", title: "Resume screening with structured output", brief: "An agent built with create_agent and response_format that turns resumes into a validated schema (skills, experience, education), scores them against a job description, redacts personal details with PII middleware before the model sees them, and stores the results." },
  { id: "lc-hybrid-rag", group: "LangChain", title: "Hybrid search RAG with reranking and citations", brief: "Keyword plus vector retrieval over product manuals, merging results, a reranker, a prompt that cites sources, and a refusal when nothing relevant is found." },
  { id: "lc-memory-assistant", group: "LangChain", title: "Customer chat with short- and long-term memory", brief: "A banking FAQ assistant: thread-scoped short-term memory with a checkpointer, summarization middleware for long chats, and a long-term store of the customer's preferences across conversations." },
  { id: "lc-middleware-guardrails", group: "LangChain", title: "Email agent with middleware guardrails", brief: "An email assistant whose agent reads, drafts and sends mail: PII middleware, summarization middleware, and human-in-the-loop middleware so send_email needs approve, edit or reject; plus a model call limit." },
  { id: "lc-mcp-tools", group: "LangChain", title: "Agent with tools from MCP servers", brief: "An internal operations agent that loads tools from several MCP servers (ticketing, docs, database) through the MCP adapters, passes them to create_agent, and handles authentication and tool errors." },
  { id: "lc-model-fallback", group: "LangChain", title: "Resilient agent with model fallbacks & retries", brief: "A customer-facing agent that stays up during provider outages: model fallback middleware across providers, tool retry, call limits, timeouts, and cost control by routing simple turns to smaller models." },
  { id: "lc-research-report", group: "LangChain", title: "Web research agent that writes a report", brief: "An analyst agent that plans searches, calls a web search tool, reads pages, keeps notes, and returns a structured report with sources; long tasks use Deep Agents (create_deep_agent) with subagents and a filesystem." },
  { id: "lc-multimodal-claims", group: "LangChain", title: "Multimodal document understanding for KYC", brief: "Reading ID cards and address proofs (images and PDFs) with a multimodal chat model, extracting fields into a schema, checking them with tools, and flagging mismatches for a human." },
  { id: "lc-pr-review", group: "LangChain", title: "Pull request review assistant", brief: "A code review agent with tools to fetch the diff and files, run linters, and post review comments; it follows a review checklist and asks a human before requesting changes." },
  { id: "lc-semantic-faq", group: "LangChain", title: "Support FAQ bot with semantic caching", brief: "An FAQ bot for a telecom company: embeddings-based semantic cache in front of RAG to answer repeated questions cheaply, cache invalidation when articles change, and handoff to a human." },
  { id: "lc-sales-copilot", group: "LangChain", title: "CRM sales copilot", brief: "A copilot that answers questions about accounts from CRM data via tools, drafts follow-up emails, and logs activities, with structured output for CRM updates and human approval for writes." },
  // 2026-10-24: more LangGraph.
  { id: "lg-plan-execute", group: "LangGraph", title: "Plan-and-execute agent with replanning", brief: "A planner node writes a step list, an executor runs each step with tools, a replanner updates the plan from results, and the graph ends when the goal is met; state holds the plan and past steps." },
  { id: "lg-reflection-codegen", group: "LangGraph", title: "Self-correcting code generation loop", brief: "Generate code, run tests in a sandbox, reflect on failures, and retry with a bounded loop; conditional edges decide pass, retry or give up, and a checkpointer keeps every attempt." },
  { id: "lg-swarm-travel", group: "LangGraph", title: "Travel booking with agent handoffs", brief: "Flight, hotel and payments agents hand off to each other with Command(goto=...) while sharing state; a human approves the final booking via interrupt()." },
  { id: "lg-long-term-memory", group: "LangGraph", title: "Personal assistant with long-term memory", brief: "A store keeps user facts and preferences by namespace (user id), with semantic search to recall them; a memory-writing node decides what to save after each conversation; threads use a checkpointer." },
  { id: "lg-loan-underwriting", group: "LangGraph", title: "Loan underwriting with durable execution", brief: "Document intake, bureau check, income verification and risk scoring as nodes; a Postgres checkpointer makes the run resume after failures; an underwriter approves edge cases through interrupt()." },
  { id: "lg-map-reduce-summaries", group: "LangGraph", title: "Parallel summarisation with the Send API", brief: "Split a large set of documents (e.g. quarterly reports), fan out with Send to summarise each in parallel, collect with a reducer, then a reduce node writes the final brief." },
  { id: "lg-time-travel-debug", group: "LangGraph", title: "Debugging an agent with time travel", brief: "Inspect state history from checkpoints, replay from an earlier step, fork with update_state to try a different tool result, and compare outcomes; used to fix a misbehaving support agent." },
  { id: "lg-kyc-subgraphs", group: "LangGraph", title: "Customer onboarding (KYC) with subgraphs", brief: "A parent graph orchestrates identity, address and sanctions-screening subgraphs, each with its own state, and merges results; failed checks route to manual review." },
  { id: "lg-streaming-tutor", group: "LangGraph", title: "Streaming tutor app", brief: "A tutoring agent streams tokens with the messages mode, step progress with updates mode, and custom events for hints to a web UI; threads persist each student's session." },
  { id: "lg-corrective-rag", group: "LangGraph", title: "Corrective (adaptive) RAG", brief: "Route the question, retrieve, grade documents for relevance, rewrite the query or fall back to web search when retrieval is poor, generate, then check the answer for grounding before returning it." },
  { id: "lg-deep-research", group: "LangGraph", title: "Deep research agent with subagents", brief: "A long-running research agent (Deep Agents on LangGraph) that keeps a todo plan, delegates topics to subagents with isolated context, writes notes to a filesystem, and compiles a cited report." },
  // 2026-10-24: more LangFlow.
  { id: "lf-pdf-qa-api", group: "LangFlow", title: "PDF Q&A flow served as an API", brief: "Upload PDFs, split and embed into a vector store, then a chat flow that answers with context; the flow is called from a web app through the Langflow run API with tweaks." },
  { id: "lf-agent-tools", group: "LangFlow", title: "Agent component with tools", brief: "A Langflow Agent with tools (calculator, URL fetch, API request, another flow as a tool) answering operations questions, tested in the Playground." },
  { id: "lf-mcp-server", group: "LangFlow", title: "Exposing flows as MCP tools", brief: "Publishing Langflow flows as tools through Langflow's MCP server so an IDE assistant or desktop client can call them, with descriptions, authentication and versioning." },
  { id: "lf-content-pipeline", group: "LangFlow", title: "Multi-agent content pipeline", brief: "Researcher, writer and editor stages chained in one flow to produce a blog post from a topic, with a human review step before publishing." },
  { id: "lf-webhook-enrichment", group: "LangFlow", title: "Webhook-triggered ticket enrichment", brief: "A helpdesk webhook starts a flow that classifies the ticket, extracts fields, looks up the customer, and writes back priority and a suggested reply." },
  { id: "lf-memory-chatbot", group: "LangFlow", title: "Chatbot with per-session memory", brief: "A restaurant reservations chatbot using message history keyed by session id, a prompt with instructions, and tools to check availability." },
  { id: "lf-email-extraction", group: "LangFlow", title: "Structured extraction from emails into a database", brief: "Incoming order emails parsed into structured fields with a model and schema, validated, and inserted into a database, with failures routed to a queue." },
  { id: "lf-custom-component", group: "LangFlow", title: "Building a custom component", brief: "Writing a custom Python component (inputs, outputs, logic) that wraps a company API, testing it, and sharing it across flows." },
  { id: "lf-ingestion-pipeline", group: "LangFlow", title: "Document ingestion pipeline", brief: "File loaders, text splitter, embeddings and a vector store write, scheduled to refresh a knowledge base, with metadata for filtering." },
  { id: "lf-marketing-copy", group: "LangFlow", title: "Marketing copy with prompt chaining", brief: "Product details flow through chained prompts (benefits, headline variants, ad copy for channels) with variables, then a check for brand rules." },
  { id: "lf-production-tracing", group: "LangFlow", title: "Taking a flow to production with tracing", brief: "Deploying Langflow (Docker), securing the API with keys, configuring environment variables and tracing to LangSmith or Langfuse, and monitoring latency and errors." },
  // 2026-10-24: LangSmith.
  { id: "ls-rag-evaluation", group: "LangSmith", title: "Evaluating a RAG application", brief: "A dataset of questions with reference answers, evaluators for correctness, groundedness and retrieval relevance (LLM-as-judge), experiments comparing chunk sizes and retrievers." },
  { id: "ls-judge-calibration", group: "LangSmith", title: "Calibrating LLM-as-judge evaluators", brief: "Writing a judge prompt with few-shot examples, checking its agreement with human labels from an annotation queue, and iterating until it matches reviewers." },
  { id: "ls-pairwise", group: "LangSmith", title: "Pairwise comparison of two app versions", brief: "Two experiments on the same dataset compared with a pairwise evaluator and a pairwise annotation queue to decide which version ships." },
  { id: "ls-online-monitoring", group: "LangSmith", title: "Online evaluation & production alerts", brief: "Online evaluators on sampled production runs and threads, dashboards for quality, latency and cost, alerts and automation rules that route bad runs to review." },
  { id: "ls-annotation-queues", group: "LangSmith", title: "Human review with annotation queues", brief: "Single-run queues with rubrics and assertions, multiple reviewers, reservations, and exporting reviewed runs to datasets." },
  { id: "ls-prompt-hub", group: "LangSmith", title: "Prompt versioning in the Prompt Hub", brief: "Editing prompts in the Playground, committing versions, tagging production and staging, pulling a tagged prompt in code, and rolling back." },
  { id: "ls-agent-trajectory", group: "LangSmith", title: "Evaluating agent trajectories", brief: "Datasets of reference tool-call sequences, trajectory evaluators (agentevals, trajectory LLM-as-judge), and final-answer checks for a support agent." },
  { id: "ls-cost-latency", group: "LangSmith", title: "Cost & latency monitoring from traces", brief: "Tracing token usage and latency per run, finding slow steps in traces, dashboards by model and feature, and alerts on cost spikes." },
  { id: "ls-otel-tracing", group: "LangSmith", title: "Tracing any app with OpenTelemetry", brief: "Instrumenting a non-LangChain service with @traceable and OpenTelemetry, exporting spans over OTLP through a collector that fans out to LangSmith and another backend, and distributed tracing across services." },
  { id: "ls-dataset-curation", group: "LangSmith", title: "Curating golden datasets from production", brief: "Selecting representative and failing production traces, adding them to datasets with splits and versions, adding synthetic edge cases, and keeping the dataset fresh." },
  { id: "ls-ci-evals", group: "LangSmith", title: "Evals in CI with pytest and Vitest", brief: "Marking tests with @pytest.mark.langsmith or langsmith/vitest so each run creates an experiment, failing the build on regressions, and reviewing results in the UI." },
  // 2026-10-24: n8n (new category).
  { id: "n8n-lead-scoring", group: "n8n", title: "Lead capture, enrichment & AI scoring", brief: "A website form webhook starts the workflow, the lead is enriched over HTTP, an AI model (through Vercel AI Gateway) scores and summarises it, IF routes hot leads to Slack and all leads into the CRM." },
  { id: "n8n-support-triage", group: "n8n", title: "Support email triage with AI drafts", brief: "Gmail trigger, AI text classification of intent and urgency (through Vercel AI Gateway), Switch routing, AI-drafted replies saved as drafts for an agent to send, and urgent tickets paged to Slack." },
  { id: "n8n-rag-chatbot", group: "n8n", title: "Company docs chatbot with the AI Agent node", brief: "A chat trigger feeds the n8n AI Agent node with a chat model via Vercel AI Gateway, a memory sub-node, and a vector store tool built from documents ingested by a separate scheduled workflow." },
  { id: "n8n-invoice-processing", group: "n8n", title: "Invoice extraction & approval", brief: "Invoices arrive by email, an information-extractor step (model via Vercel AI Gateway) pulls fields, totals are validated in a Code node, a Wait node holds for manager approval, then rows go to accounting and Google Sheets." },
  { id: "n8n-social-content", group: "n8n", title: "News to social posts pipeline", brief: "A Schedule trigger reads RSS feeds, deduplicates items, summarises them with a model via Vercel AI Gateway into channel-specific posts, waits for approval in Slack, then publishes and logs." },
  { id: "n8n-meeting-notes", group: "n8n", title: "Meeting recordings to notes & tasks", brief: "A recording upload webhook, transcription, summary and action items from a model via Vercel AI Gateway, tasks created in the project tool and the summary emailed to attendees." },
  { id: "n8n-ecommerce-ops", group: "n8n", title: "E-commerce order sync & stock alerts", brief: "Store order webhooks update inventory in Postgres, Loop Over Items handles batches, low stock triggers WhatsApp/Slack alerts and a purchase draft, and an error workflow catches failures." },
  { id: "n8n-hr-onboarding", group: "n8n", title: "Employee onboarding automation", brief: "An HR form starts sub-workflows (Execute Workflow) to create accounts, send documents for signature, schedule intro meetings, and a personalised welcome message written via Vercel AI Gateway." },
  { id: "n8n-incident-alerts", group: "n8n", title: "Incident alert routing with AI summaries", brief: "Monitoring webhooks are deduplicated, enriched with recent logs over HTTP, summarised with likely causes by a model via Vercel AI Gateway, and routed by severity to on-call paging and a status channel." },
  { id: "n8n-resume-screening", group: "n8n", title: "Resume screening with human approval", brief: "Applications from a form, resume text extracted, scored against the job by a model via Vercel AI Gateway, shortlisted candidates sent to a recruiter who approves via a Wait-for-form step, then interview invites go out." },
  { id: "n8n-etl-sync", group: "n8n", title: "Scheduled ETL between systems", brief: "A nightly Schedule trigger pulls data from an API with pagination, transforms it in Code nodes, upserts into a warehouse, with retries on fail, an Error Trigger workflow, and run reports." },
  { id: "n8n-booking-agent", group: "n8n", title: "Appointment booking agent on WhatsApp", brief: "A clinic's WhatsApp messages reach an AI Agent node (model via Vercel AI Gateway) with tools to check calendar slots, book, reschedule and cancel, conversation memory, and handoff to staff." },
];

const CELL_X = [100, 300, 500, 700, 900], CELL_Y = [62, 190, 318];
const KINDS = ["actor", "service", "store", "queue", "llm", "tool", "decision"] as const;
const SYSTEM = `You are a principal engineer and interview coach writing workflow blueprints for MasterClass Buddy, an Indian learning platform. Learners use them for system design interviews and real work.
Rules: accurate, current (2026) and specific; plain clear English; no marketing; never invent figures, prices or internal details. Questions end with "?", "." or "…".`;

const subjective = z.object({ stars: z.number().int().min(1).max(5).describe("How often it is asked, 5 = very often."), question: z.string(), answer: z.string().describe("A strong spoken answer, 60-140 words.") });
const objective = z.object({ stars: z.number().int().min(1).max(5), question: z.string(), options: z.array(z.string()).length(4), answer: z.number().int().min(0).max(3), why: z.string().describe("Why the answer is right, one or two sentences.") });
const blueprintSchema = z.object({
  title: z.string(), summary: z.string().describe("One or two sentences: what the workflow does and what it must never get wrong."),
  industry: z.string().describe("A short industry name, e.g. 'Ride hailing', 'E-Commerce', 'Education'."),
  problem: z.string().describe("The real-life problem it solves, 1-2 sentences."), outcome: z.string().describe("What changes once it is in place, 1-2 sentences."),
  nodes: z.array(z.object({
    id: z.string().describe("short kebab-case id"), label: z.string().describe("Two short lines separated by \\n, each at most 20 characters, e.g. 'Order service\\nsaga orchestrator'."),
    col: z.number().int().min(0).max(4), row: z.number().int().min(0).max(2), kind: z.enum(KINDS), step: z.number().int().min(1).max(9).optional(),
  })).min(9).max(15).describe("Place nodes on a 5-column × 3-row grid; every (col,row) cell at most once. Put the user/actor on the left, the flow left to right."),
  edges: z.array(z.object({ from: z.string(), to: z.string(), label: z.string().optional().describe("At most 22 characters."), dashed: z.boolean().optional().describe("Background or failure path.") })).min(10).max(18),
  steps: z.array(z.string()).min(6).max(9).describe("The numbered steps, one or two sentences each; node `step` badges refer to these numbers."),
  stack: z.array(z.string()).min(4).max(8), decisions: z.array(z.string()).min(3).max(5), pitfalls: z.array(z.string()).min(3).max(5), metrics: z.array(z.string()).min(3).max(5),
  subjective: z.array(subjective).length(3).describe("The three most-asked subjective interview questions."),
  objective: z.array(objective).length(3).describe("The three most-asked objective questions."),
});
const moreSchema = z.object({ subjective: z.array(subjective).min(MORE).max(MORE + 2), objective: z.array(objective).min(MORE).max(MORE + 2) });
type Blueprint = z.infer<typeof blueprintSchema>;
type More = z.infer<typeof moreSchema>;

const cached = <T,>(name: string): T | null => existsSync(`${CACHE}/${name}.json`) ? JSON.parse(readFileSync(`${CACHE}/${name}.json`, "utf8")) as T : null;
const store = (name: string, value: unknown) => writeFileSync(`${CACHE}/${name}.json`, JSON.stringify(value));
const ends = (text: string) => /[?.…]$/.test(text.trim()) ? text.trim() : `${text.trim()}?`;

/** What is wrong with a diagram, or nothing when it draws cleanly. */
function problems(b: Blueprint): string[] {
  const out: string[] = [], ids = new Set(b.nodes.map(node => node.id)), cells = new Set<string>();
  if (ids.size !== b.nodes.length) out.push("Node ids must be unique.");
  for (const node of b.nodes) {
    const cell = `${node.col},${node.row}`;
    if (cells.has(cell)) out.push(`Two nodes share cell ${cell}.`); cells.add(cell);
    const lines = node.label.split("\n");
    if (lines.length > 2 || lines.some(line => line.length > 20)) out.push(`Label "${node.label}" must be at most two lines of 20 characters.`);
    if (node.step && node.step > b.steps.length) out.push(`Node ${node.id} has step ${node.step} but there are only ${b.steps.length} steps.`);
  }
  for (const edge of b.edges) {
    if (!ids.has(edge.from) || !ids.has(edge.to)) out.push(`Edge ${edge.from} → ${edge.to} names a missing node.`);
    if (edge.label && edge.label.length > 22) out.push(`Edge label "${edge.label}" is longer than 22 characters.`);
  }
  const badges = b.nodes.filter(node => node.step).length;
  if (badges < Math.min(5, b.steps.length)) out.push("Put numbered step badges on at least five nodes, matching the steps.");
  for (const q of b.objective) if (new Set(q.options).size !== 4) out.push(`Objective "${q.question}" needs four different options.`);
  for (const q of b.subjective) if (q.answer.length < 90) out.push(`Answer to "${q.question}" is too short.`);
  return out;
}

async function ask<T>(schema: z.ZodType<T>, prompt: string): Promise<T> {
  for (let tries = 1; ; tries++) {
    try {
      const { output } = await generateText({ model: gateway(MODEL), system: SYSTEM, prompt, output: Output.object({ schema }), maxRetries: 2, abortSignal: AbortSignal.timeout(600_000) });
      return output as T;
    } catch (error) {
      if (tries >= 3) throw error;
      console.log(`  retry (${tries}): ${String(error).slice(0, 160)}`);
    }
  }
}

async function blueprint(spec: Spec): Promise<Blueprint> {
  const hit = cached<Blueprint>(`${spec.id}-blueprint`);
  if (hit) return hit;
  const notes = REFERENCE[spec.group];
  let prompt = `Write the workflow blueprint "${spec.title}" for the ${spec.group} category.\n${spec.brief}\nKeep the given title unless a clearer one is needed.${notes ? `\n\nReference notes for ${spec.group}; everything you write must agree with them, and use their API and component names where they fit:\n${notes}` : ""}`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const draft = await ask(blueprintSchema, prompt);
    const wrong = problems(draft);
    if (!wrong.length) { store(`${spec.id}-blueprint`, draft); console.log(`ok ${spec.id} blueprint`); return draft; }
    console.log(`  ${spec.id} diagram fix (${attempt}): ${wrong.slice(0, 3).join(" ")}`);
    prompt = `${prompt}\n\nYour previous draft had these problems; fix every one:\n- ${wrong.join("\n- ")}`;
  }
  throw new Error(`${spec.id}: diagram still invalid`);
}

async function more(spec: Spec, base: Blueprint): Promise<More> {
  const hit = cached<More>(`${spec.id}-more`);
  if (hit) return hit;
  const existing = [...base.subjective, ...base.objective].map(q => `- ${q.question}`).join("\n");
  const result = await ask(moreSchema, [
    `Workflow blueprint (${spec.group}): ${base.title}. ${base.summary}`, ...(REFERENCE[spec.group] ? [`Reference notes; every question and answer must agree with them:\n${REFERENCE[spec.group]}`] : []), `Steps:\n${base.steps.map((step, at) => `${at + 1}. ${step}`).join("\n")}`,
    `Already written (do not repeat or rephrase):\n${existing}`,
    `Write exactly ${MORE} more subjective interview questions with model answers and exactly ${MORE} more objective (multiple-choice, four different options, one correct) questions about this workflow: architecture, data model, scaling estimates, consistency, failure handling, security and privacy, trade-offs, and${spec.group === "Companies" ? " the company's engineering and operating practices," : ""} follow-ups an interviewer would ask. Mix easy, medium and hard; star the most-asked ones higher.`,
  ].join("\n\n"));
  const seen = new Set(existing.split("\n").map(line => line.slice(2)));
  const keep = <Q extends { question: string }>(list: Q[]) => list.filter(q => { const key = ends(q.question); if (seen.has(key)) return false; seen.add(key); return true; });
  const clean = { subjective: keep(result.subjective).filter(q => q.answer.length > 90), objective: keep(result.objective).filter(q => new Set(q.options).size === 4 && q.why.length > 25) };
  if (clean.subjective.length < 28 || clean.objective.length < 28) throw new Error(`${spec.id}: too few usable extra questions`);
  store(`${spec.id}-more`, clean); console.log(`ok ${spec.id} more`);
  return clean;
}

const q = JSON.stringify;
const sourced = (spec: Spec, call: string) => MCP_GROUPS.has(spec.group) ? `{ ...${call}, source: ${q(LANGCHAIN_SOURCE)} }` : call;
const subjectiveCall = (spec: Spec, x: z.infer<typeof subjective>) => sourced(spec, `s(${x.stars}, ${q(ends(x.question))}, ${q(x.answer.trim())})`);
const objectiveCall = (spec: Spec, x: z.infer<typeof objective>) => sourced(spec, `o(${x.stars}, ${q(ends(x.question))}, ${q(x.options.map(option => option.trim()))}, ${x.answer}, ${q(x.why.trim())})`);

function writeOutputs(done: { spec: Spec; base: Blueprint; extra: More }[]) {
  const header = (what: string) => `// Generated by scripts/generate-workflow-blueprints.ts (${what}); edit the specs there and re-run rather than editing by hand.\n`;
  writeFileSync("lib/landing-workflows-extra.ts", `${header("diagrams and briefs")}import type { Workflow } from "./landing-workflows";

/** The blueprints added on 2026-10-23 and 2026-10-24, merged into WORKFLOWS by lib/landing-workflows.ts. */
export const EXTRA_WORKFLOWS: Workflow[] = ${q(done.map(({ spec, base }) => ({
    id: spec.id, group: spec.group, ...(spec.dashboardOnly ? { dashboardOnly: true } : {}), title: base.title, summary: base.summary,
    industry: base.industry, problem: base.problem, outcome: base.outcome,
    nodes: base.nodes.map(node => ({ id: node.id, label: node.label, x: CELL_X[node.col], y: CELL_Y[node.row], kind: node.kind, ...(node.step ? { step: node.step } : {}) })),
    edges: base.edges.map(edge => ({ from: edge.from, to: edge.to, ...(edge.label ? { label: edge.label } : {}), ...(edge.dashed ? { dashed: true } : {}) })),
    steps: base.steps,
  })), null, 2)};
`);
  writeFileSync("lib/workflow-prep/extra.ts", `${header("full detail")}import { o, s, type WorkflowPrep } from "./types";

/** Full detail and the most-asked interview questions for the blueprints in lib/landing-workflows-extra.ts. */
export const EXTRA_PREP: Record<string, WorkflowPrep> = {
${done.map(({ spec, base }) => `  ${q(spec.id)}: {
    stack: ${q(base.stack)},
    decisions: ${q(base.decisions)},
    pitfalls: ${q(base.pitfalls)},
    metrics: ${q(base.metrics)},
    subjective: [
${base.subjective.map(x => `      ${subjectiveCall(spec, x)},`).join("\n")}
    ],
    objective: [
${base.objective.map(x => `      ${objectiveCall(spec, x)},`).join("\n")}
    ],
  },`).join("\n")}
};
`);
  for (const { spec, extra } of done) writeFileSync(`lib/workflow-prep/questions/${spec.id}.ts`, `${header("extra questions")}import { o, s, type QuestionSet } from "@/lib/interview-questions";

const bank: QuestionSet = {
  subjective: [
${extra.subjective.map(x => `    ${subjectiveCall(spec, x)},`).join("\n")}
  ],
  objective: [
${extra.objective.map(x => `    ${objectiveCall(spec, x)},`).join("\n")}
  ],
};
export default bank;
`);
  writeFileSync("lib/workflow-prep/questions-extra.ts", `${header("question loaders")}import type { QuestionSet } from "@/lib/interview-questions";

export const MORE_EXTRA: Record<string, () => Promise<{ default: QuestionSet }>> = {
${done.map(({ spec }) => `  ${q(spec.id)}: () => import(${q(`./questions/${spec.id}`)}),`).join("\n")}
};
`);
}

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) throw new Error("AI_GATEWAY_API_KEY must be set.");
  mkdirSync(CACHE, { recursive: true });
  const only = process.argv.slice(2);
  const failures: string[] = [];
  const queue = SPECS.filter(spec => !only.length || only.includes(spec.id));
  await Promise.all(Array.from({ length: 4 }, async () => {
    for (let spec = queue.shift(); spec; spec = queue.shift()) {
      try { await more(spec, await blueprint(spec)); } catch (error) { failures.push(`${spec.id}: ${String(error).slice(0, 200)}`); }
    }
  }));
  // Outputs always cover every spec whose parts are cached, in SPECS order.
  const done = SPECS.flatMap(spec => { const base = cached<Blueprint>(`${spec.id}-blueprint`), extra = cached<More>(`${spec.id}-more`); return base && extra ? [{ spec, base, extra }] : []; });
  writeOutputs(done);
  console.log(`wrote ${done.length} of ${SPECS.length} blueprints`);
  if (failures.length) { console.log(`\n${failures.length} failed:\n${failures.join("\n")}`); process.exitCode = 1; }
}
void main();
