import { o, s, type WorkflowPrep } from "./types";

/** Full detail and the most-asked interview questions for the LangChain, LangGraph, LangFlow and LangSmith blueprints. */
export const AGENTIC_PREP: Record<string, WorkflowPrep> = {
  "langchain-rag": {
    stack: ["LangChain document loaders & text splitters", "Embedding model (OpenAI, Voyage, BGE)", "Vector store (pgvector, Pinecone, Chroma, Qdrant)", "Chat model", "LangSmith for tracing and evals"],
    decisions: [
      "Chunk by document structure (headings, paragraphs) with some overlap, so each chunk is a self-contained idea.",
      "Hybrid search (vectors plus keywords such as BM25) with a reranker, because pure vectors miss exact terms like product codes.",
      "Answer only from the retrieved context, cite the sources, and say 'I don't know' when the context does not cover it.",
    ],
    pitfalls: [
      "Chunks that are too big (diluted matches) or too small (missing context).",
      "Never re-indexing, so answers quote outdated policies.",
      "Judging quality by eye instead of measuring retrieval and answer accuracy on a test set.",
    ],
    metrics: ["Retrieval hit rate / recall@k", "Answer faithfulness to the sources", "Share of 'don't know' answers", "Latency and cost per question"],
    subjective: [
      s(5, "What is RAG and why use it instead of fine-tuning?", "Retrieval-augmented generation fetches relevant passages from your own data at question time and puts them in the prompt, so the model answers from current, citable facts. Fine-tuning changes the model's behaviour or style but is a poor way to add knowledge: it is costly to update, cannot cite, and still hallucinates. RAG suits knowledge that changes; fine-tuning suits format and tone."),
      s(5, "How do you evaluate a RAG system?", "Evaluate retrieval and generation separately. Retrieval: did the top-k chunks contain the answer (recall@k, MRR)? Generation: is the answer faithful to the context, relevant to the question and correct against a reference? Build a dataset of real questions with expected answers, run it on every change, and use LLM-as-judge plus spot checks by people."),
      s(4, "How do you choose a chunk size and overlap?", "Start around a few hundred tokens with 10–20% overlap, split on natural boundaries, and then tune on your own evaluation set. Dense technical documents often need smaller chunks; narrative documents larger ones. Parent-document retrieval (search small chunks, return their larger parent) gets precise matching with enough context."),
    ],
    objective: [
      o(5, "What does an embedding model produce for a chunk of text?", ["A summary", "A numeric vector capturing its meaning", "A list of keywords", "A SQL query"], 1, "Embeddings map text to vectors, so similar meanings end up close together for similarity search."),
      o(4, "Which technique improves the ordering of retrieved chunks before they reach the model?", ["Temperature tuning", "A reranker (cross-encoder)", "Lowering top-k to 1", "Removing overlap"], 1, "A reranker scores each question–chunk pair together, which is more accurate than vector distance alone."),
      o(4, "Why combine keyword (BM25) search with vector search?", ["Vectors cannot store text", "Exact terms such as IDs and codes are matched better by keywords", "BM25 is always more accurate", "It removes the need for embeddings"], 1, "Hybrid search catches exact-match terms that semantic vectors can miss."),
    ],
  },
  "langchain-agent": {
    stack: ["LangChain create_agent", "Tool definitions with typed arguments", "Chat model with tool calling", "Middleware (guardrails, summarisation, human approval)", "LangSmith tracing"],
    decisions: [
      "Give the agent a small set of well-described tools with clear argument schemas; the descriptions are part of the prompt.",
      "Cap the number of steps and add timeouts, so a confused agent cannot loop forever.",
      "Keep tools read-only by default and require approval for anything that changes data or spends money.",
    ],
    pitfalls: [
      "Twenty overlapping tools with vague names, so the model picks the wrong one.",
      "Returning huge raw tool outputs that flood the context window.",
      "Letting the model build raw SQL or shell commands with no validation.",
    ],
    metrics: ["Task success rate", "Average steps and tool calls per task", "Tool error rate", "Cost and latency per task"],
    subjective: [
      s(5, "Explain the ReAct loop behind a tool-calling agent.", "The model reasons about the task and either answers or emits a tool call with arguments. The runtime executes the tool and feeds the result back as a message. The model reads it and decides the next step. This repeats until the model produces a final answer or a step limit is reached."),
      s(5, "When would you use an agent instead of a fixed chain?", "Use a chain when the steps are known and always the same: it is cheaper, faster and more predictable. Use an agent when the steps depend on what is found along the way, such as research or troubleshooting. Many production systems are mostly fixed workflows with an agent only where flexibility is needed."),
      s(4, "How do you make tool calling reliable?", "Clear tool names and descriptions, strict argument schemas, few tools per agent, validation and helpful error messages returned to the model so it can correct itself, and examples in the prompt. Then trace runs and evaluate tool choice on a dataset."),
    ],
    objective: [
      o(5, "In a tool-calling agent, who actually executes the tool?", ["The language model itself", "Your application runtime", "The vector store", "The user's browser always"], 1, "The model only outputs the tool name and arguments; your code runs the tool and returns the result."),
      o(4, "What stops an agent from looping forever?", ["A higher temperature", "A maximum number of steps or a recursion limit", "More tools", "A longer system prompt"], 1, "A step or recursion limit ends the run if the agent has not finished."),
      o(3, "What does the model read to choose a tool?", ["Only the tool's source code", "The tool's name, description and argument schema", "The tool's file path", "Nothing; it picks at random"], 1, "Tool metadata is sent to the model, so good descriptions directly improve tool choice."),
    ],
  },
  "langgraph-hitl": {
    stack: ["LangGraph StateGraph", "Checkpointer (InMemorySaver for dev, PostgresSaver in production)", "interrupt() and Command(resume=…)", "thread_id per conversation", "LangSmith tracing"],
    decisions: [
      "Model the agent as explicit nodes and conditional edges, so loops and branches are visible and testable.",
      "A checkpointer saves state after every step, so a run can pause for a person and resume hours later.",
      "Pause with interrupt() before any irreversible action, and resume with the reviewer's decision.",
    ],
    pitfalls: [
      "Using an in-memory checkpointer in production, so restarts lose every paused run.",
      "Side effects before the interrupt in the same node, which run again when the node resumes.",
      "Reusing one thread_id for different users and mixing their state.",
    ],
    metrics: ["Runs paused vs. approved vs. rejected", "Time waiting for human review", "Resume success rate"],
    subjective: [
      s(5, "What does LangGraph add over a simple LangChain agent?", "Explicit control: you define state, nodes and edges, including cycles and branches. It adds durable execution through checkpointers, human-in-the-loop pauses, streaming of intermediate steps, time travel to earlier states, and multi-agent patterns, while still letting a node call any model or tool."),
      s(5, "How does human-in-the-loop work in LangGraph?", "A node calls interrupt() with a payload, such as the proposed action. The graph saves its state through the checkpointer and returns the interrupt to the caller. Later, the app invokes the graph again with the same thread_id and Command(resume=value), and execution continues from that node with the reviewer's answer."),
      s(4, "Why must the node be safe to re-run after an interrupt?", "When resumed, the node runs again from its start, and interrupt() returns the resume value this time. Any code before the interrupt, such as an API call, runs twice, so put side effects after the interrupt or in a separate node, or make them idempotent."),
    ],
    objective: [
      o(5, "What does a LangGraph checkpointer store?", ["Model weights", "The graph state after each step, per thread", "Only the final answer", "The vector index"], 1, "Saved state per thread_id is what enables pause/resume, memory and time travel."),
      o(4, "Which call resumes a graph paused by interrupt()?", ["graph.restart()", "Invoking again with Command(resume=…) and the same thread_id", "Deleting the checkpoint", "Calling the tool directly"], 1, "Command(resume=…) passes the human's answer back into the paused node."),
      o(3, "What decides which node runs after the agent node?", ["The order nodes were added", "A conditional edge function reading the state", "Alphabetical node names", "The checkpointer"], 1, "Conditional edges inspect the state (for example, whether there are tool calls) and return the next node."),
    ],
  },
  "langgraph-supervisor": {
    stack: ["LangGraph", "Supervisor agent with handoff tools (or the langgraph-supervisor package)", "Specialist agents with their own tools", "Shared message state", "LangSmith for per-agent traces"],
    decisions: [
      "Each specialist has a narrow job and few tools, which makes it more reliable than one agent with everything.",
      "The supervisor only routes and decides when the task is done; it does not do the specialists' work.",
      "Pass each specialist only the context it needs, not the full history, to save tokens and reduce confusion.",
    ],
    pitfalls: [
      "Agents handing work back and forth in a loop with no stopping rule.",
      "Every agent seeing every message, so costs grow quickly.",
      "Using multiple agents where one agent with good tools would do.",
    ],
    metrics: ["Handoffs per task", "Task success rate per specialist", "Tokens per task vs. a single-agent baseline"],
    subjective: [
      s(5, "When is a multi-agent system better than a single agent?", "When the task splits into distinct skills with different tools and prompts, when one agent's tool list or context gets too large to choose well, or when parts can run in parallel. The costs are more tokens, more latency and harder debugging, so start with one agent and split when you measure a problem."),
      s(4, "Compare the supervisor and network (swarm) patterns.", "In a supervisor pattern a central agent decides who acts next, and specialists report back to it: predictable and easy to trace. In a network or swarm, agents hand off directly to each other: more flexible and fewer hops, but harder to control and debug."),
      s(4, "How do agents share information in LangGraph?", "Through the graph state: usually a shared list of messages, or a typed state with fields per agent. Handoffs are tool calls or Command objects that update the state and name the next node. Subgraphs can keep private state and return only a result."),
    ],
    objective: [
      o(5, "What is the supervisor's main job?", ["Run every tool itself", "Route work to the right specialist and decide when it is done", "Store vectors", "Fine-tune the specialists"], 1, "It plans and delegates; the specialists do the work with their own tools."),
      o(4, "What is a common downside of multi-agent systems?", ["They cannot use tools", "Higher token cost and latency", "They cannot be traced", "They require fine-tuning"], 1, "Extra coordination messages and model calls add cost and time."),
      o(3, "In LangGraph, how does one agent hand control to another?", ["By editing the source code", "With a handoff tool or a Command naming the next node", "By restarting the graph", "Through the vector store"], 1, "A handoff updates the state and routes execution to the target agent's node."),
    ],
  },
  langflow: {
    stack: ["Langflow (open source, Python)", "Components: Chat Input/Output, Prompt, model, vector store", "Playground", "REST API and MCP server", "Docker or Langflow Desktop"],
    decisions: [
      "Build and test visually, then call the same flow through the API, so prototypes and production use one definition.",
      "Keep secrets in global variables or environment variables, not inside component fields.",
      "Export the flow as JSON and keep it in version control like code.",
    ],
    pitfalls: [
      "Leaving API keys typed into components, which then end up in exported flows.",
      "Shipping a flow that only worked in the Playground, without testing it through the API with real inputs.",
      "One giant flow instead of smaller flows reused as components or tools.",
    ],
    metrics: ["Flow run success rate", "Latency per component", "API calls per day", "Answer quality on a test set"],
    subjective: [
      s(4, "What is Langflow and who is it for?", "Langflow is an open-source visual builder for LLM apps and agents: you drag components (inputs, prompts, models, retrievers, tools, agents) onto a canvas, wire them and test in a Playground. It suits fast prototyping and teams mixing developers and non-developers, and every flow can be served through an API or exposed as an MCP tool. Under the hood it is Python, and you can write custom components."),
      s(4, "How do you take a Langflow flow to production?", "Self-host Langflow (Docker or Kubernetes) with a proper database, keep keys in environment variables, export the flow JSON into Git, and call it through the run API with tweaks for per-request settings. Add tracing (LangSmith or Langfuse), authentication on the API, and tests that run real inputs through it."),
      s(3, "When would you outgrow a visual builder?", "When the logic needs complex branching, custom state, heavy testing, fine control over retries, or many engineers working on it at once. Then teams usually move the core into code, often LangGraph, and keep Langflow for prototypes or simpler flows."),
    ],
    objective: [
      o(4, "How can an application call a Langflow flow?", ["Only from the Playground", "Through its REST API (or as an MCP tool)", "By copying the canvas screenshot", "Through FTP"], 1, "Each flow gets an API endpoint, and flows can also be exposed through Langflow's MCP server."),
      o(3, "What is the Playground used for?", ["Billing", "Testing a flow interactively and inspecting each component's output", "Training models", "Hosting the database"], 1, "It runs the flow in a chat-like view and shows what each step produced."),
      o(3, "What language are Langflow custom components written in?", ["Java", "Python", "Go", "Rust"], 1, "Langflow is built on Python, and custom components are Python classes."),
    ],
  },
  langsmith: {
    stack: ["LangSmith SDK (Python / TypeScript)", "LANGSMITH_TRACING and LANGSMITH_API_KEY", "@traceable / traceable()", "Datasets & experiments", "Online evaluators, dashboards and alerts"],
    decisions: [
      "Trace everything from day one; the trace tree is how you debug an LLM app.",
      "Build datasets from real production traces, not only invented examples.",
      "Run an experiment for every prompt, model or code change and compare it with the baseline before shipping.",
    ],
    pitfalls: [
      "Only checking a few examples by eye after each change.",
      "Logging personal data in traces without masking it.",
      "Evaluators that are never checked against human judgement.",
    ],
    metrics: ["Evaluation scores per experiment", "Error rate, latency and cost per run", "User feedback score", "Regressions caught before release"],
    subjective: [
      s(5, "Why is observability harder for LLM apps than for normal services?", "Outputs are non-deterministic and free text, so 'did it work?' is a judgement, not a status code. A single request can involve many model and tool calls. You need the full trace of inputs, outputs, tokens, cost and latency per step, plus quality evaluation, not only uptime and error metrics."),
      s(5, "How would you set up evaluation for an LLM feature?", "Collect a dataset of representative inputs, with reference outputs where possible, from real traffic. Define evaluators: code checks for format, exact or semantic match against references, and LLM-as-judge with a clear rubric for qualities such as helpfulness. Run an experiment per change, compare against the baseline, check the judge against human labels, and keep adding failures to the dataset."),
      s(4, "What is LLM-as-a-judge and what are its risks?", "Using a model to score another model's output against a rubric. It scales well, but judges can be biased toward longer or their own answers, inconsistent, or wrong on specialist topics. Mitigate with specific rubrics, reference answers, pairwise comparison, and regular calibration against human scores."),
    ],
    objective: [
      o(5, "What is a trace in LangSmith?", ["A database backup", "The tree of every step (model and tool calls) in one run", "A billing invoice", "A Git commit"], 1, "A trace records each nested run with inputs, outputs, timing and token usage."),
      o(4, "What does an experiment compare?", ["Two databases", "Outputs and scores of one app version over a dataset, against others", "Server CPU usage", "Git branches"], 1, "Experiments run a version over a dataset and score it, so versions can be compared side by side."),
      o(3, "How do you turn on tracing for a LangChain app?", ["Recompile LangChain", "Set the LangSmith tracing and API key environment variables", "Install a browser extension", "Add a database trigger"], 1, "Setting LANGSMITH_TRACING=true and an API key is enough for LangChain and LangGraph runs to be traced."),
    ],
  },
  "ecommerce-support": {
    stack: ["LangGraph agent", "Small fast model for intent routing", "Order, courier and refund API tools", "Refund policy retrieval", "interrupt() for approvals", "LangSmith tracing"],
    decisions: [
      "Route simple intents (where is my order?) with a cheap model and send only complex cases to the full agent.",
      "Encode the refund policy as rules in code, with retrieval only for explaining it, so limits are never 'negotiated' by the model.",
      "Refunds above a threshold pause for a human through interrupt().",
    ],
    pitfalls: [
      "Letting the model decide refund amounts on its own.",
      "Tools that accept an order ID without checking it belongs to the signed-in customer.",
      "No handoff to a human when the customer is angry or the case is unusual.",
    ],
    metrics: ["Automated resolution rate", "Refunds escalated vs. auto-approved", "Customer satisfaction (CSAT)", "Average handling time"],
    subjective: [
      s(5, "How do you stop a support agent from issuing refunds it should not?", "Put the policy in code: the refund tool checks eligibility, amount limits and order ownership itself, whatever the model asks for. Anything above a threshold or outside policy goes through a human-approval step. Log every refund with its trace and review samples."),
      s(4, "How do you protect against prompt injection from customers?", "Treat customer text as data. Tools enforce permissions and ownership server-side, the agent cannot reveal system prompts or other customers' data because its tools cannot fetch them, and suspicious requests are escalated. Test with adversarial examples in the evaluation set."),
      s(4, "When should the bot hand over to a human?", "When confidence is low, the customer asks for a person, sentiment turns negative, the action needs approval, or the same issue has failed twice. The handoff should pass a summary and the trace, so the customer does not repeat themselves."),
    ],
    objective: [
      o(5, "Where should the maximum auto-refund amount be enforced?", ["In the system prompt only", "In the refund tool's code", "In the customer's message", "In the vector store"], 1, "Code enforces the limit reliably; a prompt can be ignored or manipulated."),
      o(4, "Why use a small model for intent routing?", ["It is always more accurate", "It is cheaper and faster for a simple classification", "Large models cannot classify", "It avoids tracing"], 1, "Routing is an easy task, so a small model saves cost and latency on every message."),
      o(3, "Which LangGraph feature pauses for a manager's approval?", ["Streaming", "interrupt()", "Subgraphs", "Reducers"], 1, "interrupt() saves the state and waits for a resume value from a person."),
    ],
  },
  "healthcare-prior-auth": {
    stack: ["LangGraph", "FHIR API to the EHR", "Payer criteria retrieval (coverage policies)", "Clinician review UI", "HIPAA-eligible hosting with audit logs"],
    decisions: [
      "Check each payer criterion separately and attach the exact evidence from the record for it.",
      "Ask the clinic for missing evidence instead of guessing or filling gaps.",
      "A clinician signs off before anything is submitted to the payer.",
    ],
    pitfalls: [
      "Sending protected health information to services without a business associate agreement (BAA).",
      "Summaries that sound right but cite no source in the record.",
      "Outdated payer criteria, because policies change often.",
    ],
    metrics: ["First-pass approval rate", "Time from order to submission", "Requests returned for missing information", "Clinician edits per draft"],
    subjective: [
      s(4, "How do you keep an AI system compliant when handling patient data?", "Use providers and hosting covered by a BAA, keep only the minimum data needed, encrypt it in transit and at rest, control access by role, audit every access and action, mask data in traces, and keep a clinician responsible for every decision. Follow HIPAA in the US and local equivalents elsewhere."),
      s(4, "Why check criteria one by one instead of asking the model for an overall verdict?", "Each criterion gets its own evidence and a clear met / not met / missing result, which is easier to verify, explain to the payer and evaluate. One overall answer hides which part was weak and invites hallucination."),
      s(3, "What is FHIR?", "Fast Healthcare Interoperability Resources: an HL7 standard for exchanging health data through REST APIs, using resources such as Patient, Condition, Observation and MedicationRequest. Most modern EHRs expose FHIR APIs, which lets an agent read records in a standard way."),
    ],
    objective: [
      o(4, "Which standard is commonly used to read EHR data through APIs?", ["SMTP", "FHIR", "GraphQL only", "SOAP 1.0 only"], 1, "FHIR is the HL7 standard for healthcare data exchange over REST."),
      o(4, "Who must approve the request before it goes to the insurer?", ["Nobody", "The clinician", "The vector store", "The patient's employer"], 1, "Clinical responsibility stays with the clinician; the agent only drafts."),
      o(3, "If evidence for a criterion is missing, the agent should…", ["Infer it from similar patients", "Ask the clinic for it", "Mark the criterion as met", "Skip the request"], 1, "Guessing clinical facts is unsafe; it should request the missing documentation."),
    ],
  },
  "hospital-triage": {
    stack: ["LangGraph", "Vitals and symptoms intake", "ESI triage guidelines retrieval", "Bed and staffing system APIs", "Paging integration", "Full audit trail"],
    decisions: [
      "The agent suggests a triage level; nurses decide, and can always override.",
      "Hard rules for critical vital signs page the team immediately, without waiting for the model.",
      "Live capacity data is read from source systems, never estimated by the model.",
    ],
    pitfalls: [
      "Letting a model's suggestion delay care for a critical patient.",
      "Alert fatigue from too many low-value pages.",
      "No record of who accepted or changed each suggestion.",
    ],
    metrics: ["Door-to-triage time", "Agreement between suggested and final acuity", "Under-triage rate (most important)", "Time to bed"],
    subjective: [
      s(4, "How do you design AI for a safety-critical setting such as an emergency department?", "Keep humans in charge of decisions, use deterministic rules for life-threatening signs, show the evidence behind each suggestion, log everything for audit, test heavily on historical cases with clinicians, and monitor under-triage closely. Roll out in shadow mode first, where suggestions are recorded but not shown."),
      s(3, "What is shadow mode and why use it?", "The system runs on real cases, but its outputs are only recorded, not acted on. You compare them with what clinicians actually decided, measure accuracy and risk, and fix problems before anyone relies on the system."),
      s(3, "Why is under-triage worse than over-triage?", "Under-triage means a seriously ill patient waits too long, which can cause harm or death. Over-triage uses extra resources but is safer. Systems are tuned to minimise under-triage, even at the cost of more over-triage."),
    ],
    objective: [
      o(4, "Who makes the final triage decision?", ["The agent", "The triage or charge nurse", "The bed planner tool", "The patient"], 1, "The agent assists; licensed staff decide."),
      o(3, "How should critical vital signs be handled?", ["Queued for the model", "Hard-coded rules that page the team at once", "Summarised at the end of the shift", "Ignored until a bed is free"], 1, "Deterministic rules are faster and more reliable for life-threatening values."),
      o(3, "Which error matters most to minimise in triage?", ["Over-triage", "Under-triage", "Duplicate logs", "Slow dashboards"], 1, "Under-triage delays care for patients who need it most."),
    ],
  },
  "bank-fraud": {
    stack: ["LangChain agent", "Read-only tools: transactions, device, KYC, sanctions lists", "Case management system", "SAR drafting template", "LangSmith evals on analyst decisions"],
    decisions: [
      "Every tool is read-only, so the agent can gather evidence but never block or move money.",
      "The case summary links each claim to the record it came from.",
      "Analyst decisions become labelled data for evaluating the agent.",
    ],
    pitfalls: [
      "An agent that can freeze accounts on its own.",
      "Summaries that leave out evidence pointing to innocence.",
      "Using customer data in prompts without regulatory approval and masking.",
    ],
    metrics: ["Analyst time per case", "False-positive rate of alerts", "Agreement with analyst decisions", "SAR filing time"],
    subjective: [
      s(4, "Why give the fraud agent only read-only tools?", "The agent's job is to assemble evidence; decisions with legal and customer impact, such as blocking an account or filing a report, belong to accountable analysts. Read-only tools also limit damage if the agent is wrong or manipulated, and make regulators more comfortable."),
      s(4, "How would you evaluate a fraud investigation copilot?", "Use past cases with known outcomes. Measure whether the summary includes the key evidence, whether its recommendation matches the analyst's decision, how often it misses or invents facts, and how much time it saves. Track drift as fraud patterns change."),
      s(3, "What is a SAR?", "A Suspicious Activity Report (in India, a Suspicious Transaction Report to FIU-IND) that a bank must file with its financial intelligence unit when it suspects money laundering or fraud. It needs a clear factual narrative, which the agent can draft for the analyst to review."),
    ],
    objective: [
      o(4, "What should the evidence agent be allowed to do?", ["Freeze accounts", "Read transaction, device and KYC data", "Reverse payments", "Email customers directly"], 1, "Read-only access lets it investigate without taking action on accounts."),
      o(3, "What makes a case summary trustworthy for an analyst?", ["Long paragraphs", "Each claim linked to its source record", "A confident tone", "No numbers"], 1, "Links let the analyst verify every statement quickly."),
      o(3, "Analyst decisions on cases are most useful as…", ["Deleted after closing", "Labelled data to evaluate and improve the agent", "Public reports", "Marketing material"], 1, "They are ground truth for measuring the agent's accuracy over time."),
    ],
  },
  "insurance-claims": {
    stack: ["LangGraph with parallel branches", "Document and image readers (OCR, vision model)", "Policy rules engine", "Fraud scoring", "Adjuster workbench"],
    decisions: [
      "Check documents, cover, damage and fraud signals in parallel, then join them at one decision node.",
      "Fast-track only low-value, low-risk claims; everything else goes to an adjuster with the evidence gathered.",
      "Cover rules are code, not model judgement.",
    ],
    pitfalls: [
      "Auto-rejecting claims, rather than routing doubtful ones to people.",
      "Vision estimates used as final amounts without a range or confidence.",
      "Not explaining a decision, which regulators often require.",
    ],
    metrics: ["Straight-through processing rate", "Claim cycle time", "Leakage (overpayment)", "Complaint and reopen rates"],
    subjective: [
      s(4, "How does LangGraph run several checks in parallel?", "Fan out from one node to several nodes with edges (or the Send API for a dynamic number of items); they run in the same step, and each writes its result to the state. Reducers merge the outputs, and a join node runs once all branches are done."),
      s(4, "Which claims should be fast-tracked?", "Low-value claims with complete documents, clear cover, damage that matches the description, and no fraud signals. Thresholds are set by the business and tuned using outcomes; anything outside them goes to an adjuster."),
      s(3, "Why must an automated claims decision be explainable?", "Customers have the right to know why a claim was reduced or refused, regulators audit decisions, and adjusters need to check the reasoning. Each decision should list the rules applied and the evidence used."),
    ],
    objective: [
      o(4, "Where are parallel branch results combined in LangGraph?", ["In the vector store", "In the graph state, merged by reducers", "In the browser", "They cannot be combined"], 1, "Reducers define how updates from parallel nodes are merged into the shared state."),
      o(3, "A high-value claim with fraud signals should go to…", ["Fast-track payout", "An adjuster with the full evidence", "Automatic rejection", "The customer for self-approval"], 1, "Risky cases need a person's judgement."),
      o(3, "Policy cover should be checked by…", ["The model's general knowledge", "A rules engine applying the policy terms", "The customer's description only", "Random sampling"], 1, "Cover depends on exact contract terms, which code applies consistently."),
    ],
  },
  "corporate-helpdesk": {
    stack: ["Langflow", "Slack / Microsoft Teams bot", "HR handbook retrieval", "Okta / Active Directory tools", "Jira Service Management / ServiceNow"],
    decisions: [
      "A router sends each question to one branch: policy answers, approved IT actions, or a ticket.",
      "IT actions are a short allow-list (password reset, group access request) with the employee's identity verified.",
      "Unresolved requests become tickets with the conversation attached.",
    ],
    pitfalls: [
      "Answering from an outdated handbook.",
      "Letting the agent grant access without the usual approval workflow.",
      "No source shown, so employees cannot check a policy answer.",
    ],
    metrics: ["Deflection rate (resolved without a ticket)", "Time to resolution", "Employee satisfaction", "Wrong-answer reports"],
    subjective: [
      s(4, "How do you decide which IT actions the bot may perform?", "Start with high-volume, low-risk, reversible actions that already have a clear process, such as password resets and requesting (not granting) access. Each runs through the same identity checks and approvals as the manual process, and everything is logged."),
      s(3, "How do you keep HR answers accurate?", "Index only the official, current handbook, re-index when it changes, cite the section in every answer, answer 'I don't know' outside it, and route sensitive topics (grievances, health) to a person."),
      s(3, "What is ticket deflection and why measure it?", "The share of requests resolved without creating a ticket for a person. It shows the bot's real value, but must be balanced with satisfaction and reopen rates, so the bot is not simply blocking people from getting help."),
    ],
    objective: [
      o(4, "Which IT action is safest to automate first?", ["Granting admin rights", "Password reset with identity verification", "Deleting user accounts", "Changing payroll"], 1, "It is common, low-risk and already well defined."),
      o(3, "What should an HR policy answer include?", ["A joke", "The source section of the handbook", "The bot's opinion", "Other employees' data"], 1, "Citing the source lets the employee verify the answer."),
      o(3, "What happens to a request the flow cannot resolve?", ["It is ignored", "A ticket is created with the conversation attached", "The bot guesses", "It is emailed to everyone"], 1, "The helpdesk gets full context without asking the employee again."),
    ],
  },
  "sre-incident": {
    stack: ["LangGraph", "Datadog / Grafana / Prometheus query tools", "Deploy history (GitHub, Argo CD)", "Runbook and postmortem retrieval", "PagerDuty / Slack integration"],
    decisions: [
      "The agent investigates and proposes; an engineer approves any rollback or change.",
      "Tools are read-only except one approved, reversible action (rollback) behind interrupt().",
      "The hypothesis links the exact graphs, logs and diffs that support it.",
    ],
    pitfalls: [
      "Agents that restart services on their own and make the incident worse.",
      "Querying huge log volumes and blowing the context window.",
      "Trusting a confident root cause without evidence.",
    ],
    metrics: ["Mean time to acknowledge and to resolve (MTTA / MTTR)", "Hypothesis accuracy confirmed in postmortems", "Engineer time saved per incident"],
    subjective: [
      s(4, "How would an incident agent gather context without flooding the model?", "Use targeted tools that return summaries: error counts by service and time window, top log messages, deploys in the last hour, the diff of the suspicious deploy. Filter and aggregate in the tools, not in the prompt, and fetch details only when the hypothesis needs them."),
      s(4, "What is MTTR and how can an agent reduce it?", "Mean time to recovery: the average time from an incident starting to service being restored. The agent shortens the investigation phase by collecting logs, metrics, recent changes and similar incidents in parallel within minutes, so the engineer starts from a hypothesis instead of a blank page."),
      s(3, "Why keep a human approval step for rollbacks?", "Rolling back can lose data migrations, conflict with other fixes or hide the real cause. The engineer has context the agent lacks, and accountability stays with a person. The agent prepares the exact command and its risks."),
    ],
    objective: [
      o(4, "What does MTTR measure?", ["Monthly traffic", "Average time to restore service after an incident", "Model token usage", "Deploy frequency"], 1, "Mean time to recovery (or resolve) measures how quickly incidents are fixed."),
      o(3, "Which change is most often linked to a sudden error spike?", ["A recent deploy or config change", "A new logo", "A team meeting", "Documentation updates"], 0, "Most incidents follow a change, so recent deploys are checked first."),
      o(3, "Which action may the agent take without approval?", ["Rolling back production", "Querying logs and metrics", "Deleting a database", "Scaling to zero"], 1, "Read-only investigation is safe; changes need an engineer's approval."),
    ],
  },
  "legal-contracts": {
    stack: ["LangChain", "PDF parsing and clause segmentation", "Playbook retrieval (preferred and fallback positions)", "Word redline output", "LangSmith evals from lawyer edits"],
    decisions: [
      "Review clause by clause against the company's own playbook, not the model's general idea of 'fair'.",
      "Each risk flag states the reason and the playbook rule it relies on.",
      "Lawyers approve every redline; their edits are saved as evaluation data.",
    ],
    pitfalls: [
      "Missing clauses that are absent (no liability cap) rather than badly worded.",
      "Splitting clauses wrongly because of numbering or tables in the PDF.",
      "Sending confidential contracts to services without proper data agreements.",
    ],
    metrics: ["Review time per contract", "Agreement with lawyer flags", "Share of redlines accepted unchanged", "Missed high-risk clauses"],
    subjective: [
      s(4, "How do you catch clauses that are missing from a contract?", "Keep a checklist of required clause types from the playbook and check that each one is present. Report 'not found' explicitly. Absence (no limitation of liability, no data-protection terms) is often the biggest risk and will not appear in a clause-by-clause review."),
      s(3, "How do lawyers' edits improve the system?", "Each accepted, changed or rejected redline is labelled data. Store them as LangSmith dataset examples, measure the agreement rate of new prompt or model versions against them, and add the hardest cases to regression tests."),
      s(3, "What is a negotiation playbook?", "A company's agreed positions for each clause type: the preferred wording, acceptable fallbacks and walk-away points, with who can approve exceptions. It makes reviews consistent and gives the model a concrete standard to compare against."),
    ],
    objective: [
      o(4, "What should each clause be compared with?", ["Random internet contracts", "The company's playbook positions", "The vendor's preferences", "The longest clause"], 1, "The playbook defines what is acceptable for this company."),
      o(3, "Who approves suggested redlines?", ["The vendor", "A lawyer", "The model", "Nobody"], 1, "Legal responsibility stays with the lawyer."),
      o(3, "Which risk does a clause-by-clause review easily miss?", ["Spelling mistakes", "A clause that is missing entirely", "Long sentences", "Bold formatting"], 1, "Missing clauses need an explicit checklist."),
    ],
  },
  "supply-chain": {
    stack: ["LangGraph multi-agent", "ERP and inventory APIs (SAP, Oracle)", "Carrier rate and transit-time APIs", "Simulation / optimisation code", "Planner approval UI"],
    decisions: [
      "Agents propose options; costs and delays come from simulation code and live quotes, not the model's estimates.",
      "A planner chooses; the system never books shipments on its own.",
      "Customer notifications go out only after a plan is approved.",
    ],
    pitfalls: [
      "Letting the model invent freight rates or transit times.",
      "Optimising only cost and ignoring stock-out risk for key customers.",
      "Notifying customers before the plan is confirmed.",
    ],
    metrics: ["Time from disruption to approved plan", "Orders delivered on the new date", "Extra freight cost", "Stock-outs avoided"],
    subjective: [
      s(4, "Why use code for the cost and delay simulation instead of the model?", "Numbers must be correct and reproducible. Code applies real rates, transit times, inventory levels and constraints the same way every time. The model is good at understanding the situation and proposing options; the calculation belongs in deterministic tools."),
      s(3, "How would you rank recovery options?", "Score each on total cost, delivery delay, stock-out risk and customer priority, with weights the business sets. Show the trade-offs side by side, highlight the recommended option and explain why, and let the planner choose."),
      s(3, "What makes a good disruption signal?", "Reliable and early: carrier status feeds, port and weather alerts, supplier notifications and news, each with a location and expected duration that can be matched to routes and orders."),
    ],
    objective: [
      o(4, "Where should freight rates come from?", ["The model's memory", "Live carrier quote APIs", "Last year's slides", "Customer emails"], 1, "Rates change constantly, so they must come from live sources."),
      o(3, "Who confirms the recovery plan?", ["The impact agent", "A human planner", "The carrier", "The customer"], 1, "The planner owns the decision and its cost."),
      o(3, "When should customers be told the new dates?", ["Immediately after the disruption", "After the plan is approved", "Never", "Before options are priced"], 1, "Sharing unconfirmed dates causes confusion and lost trust."),
    ],
  },
  "coding-agent-evals": {
    stack: ["LangSmith datasets & experiments", "CI (GitHub Actions) tests and lint", "LLM judge with a rubric", "Golden tasks with known solutions", "Online evaluators"],
    decisions: [
      "Objective checks first (tests pass, lint clean), then an LLM judge for qualities tests cannot see.",
      "A fixed golden dataset, so every version is measured on the same tasks.",
      "A release gate: ship only if the new version scores at least as well as the baseline.",
    ],
    pitfalls: [
      "Golden tasks that leak into the prompt or training data, inflating scores.",
      "A judge rubric so vague that scores vary run to run.",
      "Comparing single runs, when agent results vary; run several times and compare averages.",
    ],
    metrics: ["Task pass rate (tests green)", "Judge score per rubric item", "Cost and time per task", "Regressions per release"],
    subjective: [
      s(5, "How would you evaluate a coding agent?", "Use a set of realistic tasks in real repositories, each with hidden tests. Measure whether the tests pass, the size and scope of the diff, and whether lint and type checks pass, then add an LLM judge or human review for readability and fit. Run each task several times because of randomness, and track cost and time."),
      s(4, "Why run each evaluation more than once?", "Agent outputs vary from run to run. One run can pass or fail by luck, so compare the average pass rate (or pass@k) over several runs, with a confidence interval, before deciding one version is better."),
      s(3, "What should a judge rubric look like?", "A few specific, observable criteria with clear scales and examples: for instance, 'changes only files needed for the task (0–2)'. Ask for a reason before the score, check the judge's agreement with human reviewers, and keep the rubric versioned."),
    ],
    objective: [
      o(4, "Which check should come before an LLM judge?", ["Asking the agent if it is confident", "Running the tests and linters", "Counting lines of code", "Checking the commit message length"], 1, "Objective, cheap checks catch clear failures before spending on a judge."),
      o(4, "What does a release gate compare?", ["Two developers' opinions", "The new version's scores against the baseline", "Server costs", "Number of commits"], 1, "It blocks a release that scores worse than the current version."),
      o(3, "What is a golden dataset?", ["A dataset of gold prices", "A fixed set of tasks with known good answers", "Production logs only", "A list of passwords"], 1, "It stays constant so versions can be compared fairly."),
    ],
  },
  "invoice-extraction": {
    stack: ["LangChain with_structured_output", "Pydantic models", "PDF loaders + OCR (Tesseract, Textract, Azure Document Intelligence)", "Validation code", "ERP integration (SAP, Tally, Zoho Books)"],
    decisions: [
      "A Pydantic schema defines every field and type once, and the model must return data in that shape.",
      "Arithmetic and business checks run in code, never trusted to the model.",
      "Low-confidence or failing invoices go to a person with the source highlighted.",
    ],
    pitfalls: [
      "Letting the model 'fix' totals so they add up.",
      "No duplicate-invoice check, causing double payments.",
      "Treating dates and currencies loosely (DD/MM vs. MM/DD, ₹ vs. $).",
    ],
    metrics: ["Field-level accuracy", "Straight-through rate (no human touch)", "Duplicate payments prevented", "Time per invoice"],
    subjective: [
      s(5, "What does with_structured_output do?", "It binds a schema (Pydantic model, TypedDict or JSON Schema) to a chat model, using the provider's tool calling or JSON mode, so the model returns an object matching the schema instead of free text. You get typed, validated data, and a validation error when it does not fit."),
      s(4, "Why validate extracted data with code?", "Models can misread digits or invent values that look plausible. Code checks that line items sum to the total, tax rates are valid, the vendor exists, the purchase order matches and the invoice is not a duplicate. Failing checks route the invoice to a person."),
      s(3, "How do you measure extraction accuracy?", "Label a sample of real invoices field by field, compare the extracted values per field (exact match for IDs, tolerance for amounts), and report accuracy per field and per supplier template. Track it over time as new templates appear."),
    ],
    objective: [
      o(5, "What defines the fields the model must return?", ["The PDF file name", "A schema such as a Pydantic model", "The temperature setting", "The vector store"], 1, "The schema is passed to with_structured_output and enforced on the result."),
      o(4, "Who should check that line items add up to the total?", ["The model", "Validation code", "The supplier", "Nobody"], 1, "Deterministic arithmetic belongs in code."),
      o(3, "What prevents paying the same invoice twice?", ["A larger model", "A duplicate check on vendor + invoice number + amount", "OCR", "Lower temperature"], 1, "A uniqueness check catches resubmitted invoices."),
    ],
  },
  "sql-analytics": {
    stack: ["LangChain SQL toolkit / custom query tool", "Warehouse read replica (Postgres, BigQuery, Snowflake)", "Read-only database role", "Schema and example-query retrieval", "Chart rendering"],
    decisions: [
      "A read-only database user and an allow-list of tables, enforced by the database, not the prompt.",
      "Retrieve only the relevant table schemas and example queries, so large warehouses fit in the prompt.",
      "Show the SQL with every answer, so analysts can verify it.",
    ],
    pitfalls: [
      "Connecting the agent with a role that can write or drop tables.",
      "Queries without LIMIT or time filters that scan billions of rows.",
      "Ambiguous business terms (revenue, active user) the model guesses at.",
    ],
    metrics: ["Execution accuracy on a test set of questions", "Query error and retry rate", "Warehouse cost per question", "Analyst corrections"],
    subjective: [
      s(5, "How do you make a text-to-SQL agent safe?", "Least privilege first: a read-only role limited to approved tables or views, statement timeouts and row limits, and a read replica. Validate the SQL before running it (parse it, block anything but SELECT), and never let model output become part of a command without those checks."),
      s(4, "How do you help the model with business definitions?", "Provide a semantic layer or glossary: what 'revenue', 'active user' or 'region' mean, with example queries for common questions. Retrieve the relevant definitions with the schema. Curated views that already encode the definitions work even better."),
      s(3, "How do you evaluate a text-to-SQL system?", "Build a set of questions with correct SQL or expected results. Run the generated SQL and compare results (execution accuracy) rather than the SQL text, since many queries are equivalent. Track failures by type: wrong table, wrong join, wrong filter."),
    ],
    objective: [
      o(5, "What is the strongest protection against destructive SQL?", ["A polite system prompt", "A read-only database role", "Lower temperature", "A longer schema description"], 1, "The database refuses writes, whatever the model generates."),
      o(4, "Why run analytics queries on a read replica?", ["Replicas are free", "So heavy queries do not slow the production primary", "Replicas allow writes", "They need no indexes"], 1, "It isolates analytical load from the transactional database."),
      o(3, "Execution accuracy compares…", ["SQL text character by character", "The results of running the generated and reference queries", "Query length", "Token counts"], 1, "Different SQL can give the same correct result, so results are compared."),
    ],
  },
  "lead-qualifier": {
    stack: ["Langflow", "Webhook component", "Structured output component", "API Request component (CRM)", "If-Else component", "Calendar and email integrations"],
    decisions: [
      "Qualification rules live in an If-Else component the sales team can read and change.",
      "Check the CRM first, so returning buyers keep their history and agent.",
      "Hot leads are booked automatically; everyone else is nurtured, not dropped.",
    ],
    pitfalls: [
      "Scoring leads with an opaque model prompt nobody can explain.",
      "Contacting people who did not consent, against privacy and telecom rules.",
      "Duplicate CRM records because the lookup step was skipped.",
    ],
    metrics: ["Time to first contact for hot leads", "Lead-to-visit conversion", "Share of leads correctly scored", "Duplicate records created"],
    subjective: [
      s(3, "How does a webhook start a Langflow flow?", "The Webhook component gives the flow an endpoint. A form tool or WhatsApp provider POSTs the lead as JSON to it, and the flow runs with that payload as input. It is protected with an API key, and the payload is validated before use."),
      s(3, "Why keep qualification rules visible instead of inside a prompt?", "Sales managers need to understand and adjust why a lead is hot, explain it to agents, and keep it consistent. Visible rules (budget ≥ X, timeline under 3 months) are testable and auditable; a prompt's judgement is not."),
      s(3, "What should happen to cold leads?", "They join a nurture sequence with useful, relevant listings and an easy way to opt out, and their score updates when they engage. Many cold leads become buyers later."),
    ],
    objective: [
      o(3, "Which Langflow component starts a flow from an external system?", ["Chat Output", "Webhook", "Prompt", "Text splitter"], 1, "The Webhook component exposes an endpoint other systems can POST to."),
      o(3, "Why check the CRM before scoring?", ["To slow the flow down", "To recognise returning buyers and avoid duplicates", "To train the model", "To send spam"], 1, "Existing records carry history and an assigned agent."),
      o(3, "Which component routes leads by rule?", ["If-Else", "Embedding model", "File loader", "Chat Input"], 0, "If-Else compares values and sends data down the matching branch."),
    ],
  },
  "review-triage": {
    stack: ["Langflow", "Review sources (Google Business Profile, booking sites, surveys)", "Scheduler calling the flow API", "If-Else routing", "Brand-voice examples", "Reporting sheet or BI tool"],
    decisions: [
      "Urgent categories (safety, hygiene, billing) are routed by rules to a manager immediately.",
      "Replies are drafted from brand-voice examples and approved by a person before posting.",
      "Every review is tagged by topic, so weekly trends are counted, not guessed.",
    ],
    pitfalls: [
      "Auto-posting replies that sound robotic or promise refunds.",
      "Missing urgent reviews written in other languages.",
      "Tag lists that change every week, making trends meaningless.",
    ],
    metrics: ["Time to respond to urgent reviews", "Reply coverage", "Rating trend by topic", "Manager edits per reply"],
    subjective: [
      s(3, "Why should a person approve review replies?", "Public replies speak for the brand; a wrong apology, promise or tone can make things worse or create legal risk. Drafting saves most of the time, and a quick approval keeps quality and accountability."),
      s(3, "How do you keep topic tags consistent over time?", "Use a fixed list of topics in the classifier's structured output, review and change it deliberately, and evaluate the classifier on a labelled sample. Consistent tags make week-on-week comparisons meaningful."),
      s(2, "How would you handle reviews in several languages?", "Detect the language, classify in a multilingual model or translate first, route urgent issues the same way, and draft the reply in the reviewer's language for a manager who can check it."),
    ],
    objective: [
      o(3, "Which reviews should alert the duty manager straight away?", ["All five-star reviews", "Safety, hygiene and billing issues", "Reviews mentioning breakfast", "Reviews longer than 100 words"], 1, "Those need fast action and carry the most risk."),
      o(3, "Why tag reviews with a fixed topic list?", ["To hide complaints", "So trends can be counted consistently", "To speed up posting", "To translate them"], 1, "A stable list makes weekly reports comparable."),
      o(2, "How is the flow run every hour?", ["By opening the Playground", "A scheduler calls the flow's API", "The model wakes itself", "Guests trigger it"], 1, "An external scheduler or cron job calls the flow endpoint."),
    ],
  },
  "prompt-experiments": {
    stack: ["LangSmith Playground", "LangSmith prompts with commits and tags", "Datasets of real questions", "Evaluators (reference-based, LLM-as-judge)", "Pairwise comparison view"],
    decisions: [
      "Prompts are versioned and tagged, and the app pulls a tag, so changing the prompt does not need a code deploy.",
      "Every candidate runs on the same dataset, so scores are comparable.",
      "Cost and latency are compared next to quality, not after.",
    ],
    pitfalls: [
      "Choosing a prompt from a handful of favourite examples.",
      "A dataset with no hard or edge cases.",
      "Changing the prompt and the model at the same time, so you cannot tell which helped.",
    ],
    metrics: ["Correctness vs. reference", "Judge score for tone and level", "Pairwise win rate", "Cost and latency per answer"],
    subjective: [
      s(4, "How do you decide whether a new prompt is better?", "Run both on the same representative dataset, score them with evaluators that reflect what matters (correctness, format, tone), compare averages and look at examples where they differ, and check the difference is larger than run-to-run noise. Then check cost and latency before switching."),
      s(4, "What is pairwise evaluation and when is it useful?", "A judge (person or model) sees two answers to the same input and picks the better one. It is useful for subjective qualities such as helpfulness or tone, where absolute scores are unreliable but comparisons are consistent."),
      s(3, "Why manage prompts outside the code?", "Prompts change more often than code and are often edited by people who are not engineers. Versioning them with commits and tags gives history, review and rollback, and lets you promote a tested version without redeploying."),
    ],
    objective: [
      o(4, "To compare two prompts fairly you should…", ["Test each on different questions", "Run both on the same dataset", "Only test the newer one", "Use the longest prompt"], 1, "The same inputs make the scores comparable."),
      o(3, "What does a pairwise evaluator output?", ["A SQL query", "Which of two answers is better", "A new prompt", "A token count only"], 1, "It compares two outputs for the same input."),
      o(3, "Why change only one thing per experiment?", ["It is cheaper to log", "So you know which change caused the difference", "LangSmith requires it", "Models refuse multiple changes"], 1, "Changing the prompt and the model together hides which one helped."),
    ],
  },
  "feedback-loop": {
    stack: ["LangSmith feedback API", "Automation rules", "Annotation queues", "Datasets", "Online evaluators", "Pre-release regression experiments"],
    decisions: [
      "Feedback is attached to the exact run ID, so reviewers see the full trace behind a thumbs-down.",
      "Rules send negative feedback and low evaluator scores to an annotation queue automatically.",
      "Corrected answers become dataset examples and run before every release.",
    ],
    pitfalls: [
      "Collecting feedback that is never reviewed.",
      "Feedback not linked to the run, so the cause cannot be found.",
      "Storing customers' personal details in datasets without masking.",
    ],
    metrics: ["Thumbs-down rate over time", "Time from feedback to correction", "Dataset size and coverage", "Regressions caught before release"],
    subjective: [
      s(4, "How do you turn user feedback into improvements?", "Log feedback against the run ID, route negative or low-scored runs to an annotation queue, have experts write the correct answer and label the failure type, add the corrected examples to a dataset, fix the prompt, retrieval or tools, and run the dataset as a regression test before every release."),
      s(4, "What are online evaluators?", "Evaluators that run automatically on a sample of live production traces, scoring things like correctness, safety or policy compliance without waiting for user feedback. They catch problems most users never report."),
      s(3, "Why is user feedback alone not enough?", "Few users give it, and those who do are not representative; some bad answers look convincing, so nobody complains. Combine feedback with online evaluators and regular reviews of sampled traces."),
    ],
    objective: [
      o(4, "What should feedback be linked to?", ["The user's email address", "The run ID of the answer", "The deploy date", "The model's name only"], 1, "The run ID connects the feedback to the full trace."),
      o(3, "Where do reviewers correct flagged answers in LangSmith?", ["Annotation queues", "The billing page", "Git history", "The vector store"], 0, "Annotation queues hold runs for people to review and label."),
      o(3, "Why run the corrected dataset before each release?", ["To train the model", "So mistakes that were fixed do not come back", "To reduce cost", "To delete old traces"], 1, "It acts as a regression test for known failures."),
    ],
  },
};
