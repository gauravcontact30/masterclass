import type { AwsHighlight } from "../aws-highlights";

/**
 * Agentic AI concepts the eight learning paths do not cover on their own:
 * the design patterns agents are built from, the protocols that connect them,
 * how they manage memory and context, and what running them in production
 * takes. Each card is a short definition, its core features, one worked use
 * case and the interview questions it is most often asked through — written to
 * add to the existing rows, never restate them (tool authorization, checkpoints
 * and multi-agent coordination already have their own cards).
 */
type Concept = Omit<AwsHighlight, "category">;

const group = (category: string, concepts: Concept[]): AwsHighlight[] => concepts.map(concept => ({ ...concept, category }));

export const AGENTIC_AI_CONCEPTS: AwsHighlight[] = [
  ...group("Agent Design Patterns", [
    {
      name: "ReAct: reasoning and acting",
      summary: "An agent alternates between reasoning about the next step, calling a tool, and reading the observation before deciding again.",
      points: [
        "Interleaves a thought, an action (tool call) and an observation in each iteration.",
        "Grounds each decision in fresh tool results instead of one up-front plan.",
        "Exposes a readable trace of why each action was taken, which helps debugging.",
        "Needs an iteration cap and a clear finish action so the loop terminates.",
      ],
      useCase: { title: "Answering a question across live systems", scenario: "A support agent asked \"why was order 1042 delayed?\" first looks up the order, sees it is waiting on a shipment, queries the carrier API with the tracking number, reads that the parcel is held at customs, and only then answers. Each lookup is chosen from what the previous one returned, which a fixed script could not anticipate." },
      interview: [
        { question: "How does ReAct differ from chain-of-thought prompting?", answer: "Chain-of-thought reasons in one pass using only what the model already knows. ReAct interleaves reasoning with tool calls, so each step can use new external evidence, which reduces hallucinated facts on knowledge-heavy tasks." },
        { question: "What are the failure modes of a ReAct loop and how do you contain them?", answer: "Repeating the same call, drifting off the goal and running up cost. Contain them with a maximum step count, detection of repeated identical calls, a token or cost budget, and an explicit final-answer action the loop checks for." },
      ],
    },
    {
      name: "Plan-and-execute agents",
      summary: "A planner writes the whole multi-step plan first; an executor carries out each step, and the plan is revised only when a step's result requires it.",
      points: [
        "Separates planning (one capable model call) from execution (cheaper, focused calls).",
        "Makes progress visible as a checklist that can be reviewed before work starts.",
        "Replans on failure or new information rather than at every step.",
        "Uses fewer expensive reasoning calls than deciding every step from scratch.",
      ],
      useCase: { title: "Researching and writing a market brief", scenario: "Asked for a competitor brief, the planner lists: identify five competitors, collect each one's pricing page, extract plan tiers, compare features, draft the summary. Executors run each step; when one pricing page is behind a login, the planner swaps that step for the competitor's public docs instead of restarting the whole job." },
      interview: [
        { question: "When would you choose plan-and-execute over a ReAct loop?", answer: "When the task decomposes into mostly predictable steps and you want lower cost, a reviewable plan or parallel execution. ReAct suits exploratory tasks where the next step depends heavily on the last observation." },
        { question: "What triggers a replan?", answer: "A failed step, a result that invalidates a later step's assumption, or new information that changes the goal. Replanning on every step throws away the cost advantage." },
      ],
    },
    {
      name: "Reflection and self-critique",
      summary: "The agent reviews its own draft against explicit criteria, writes a critique, and revises — trading extra calls for higher-quality output.",
      points: [
        "Generates, critiques against a rubric, then revises in a bounded number of rounds.",
        "Works best when the critique can use objective signals such as tests, linters or schemas.",
        "Can use a different prompt or model as the critic to avoid self-agreement.",
        "Stops when the criteria pass or the round limit is reached, not when the model feels done.",
      ],
      useCase: { title: "Generating code that must pass tests", scenario: "A coding agent writes a function, runs the unit tests, and feeds the failing assertions back as the critique. The revision targets the exact failures, and the loop ends when the tests pass or after three rounds, at which point the remaining failures are reported to a human." },
      interview: [
        { question: "Why can self-critique fail to improve answers?", answer: "A model often cannot spot its own factual errors without new evidence, so it may approve or even worsen a wrong draft. Grounding the critique in external checks — test results, retrieved sources, validators — is what makes reflection reliable." },
        { question: "How do you keep reflection from becoming too expensive?", answer: "Cap the rounds, only reflect on outputs that fail a cheap check, and use a smaller model for the critique where its accuracy is sufficient." },
      ],
    },
    {
      name: "Prompt chaining",
      summary: "A task is split into a fixed sequence of model calls, each consuming the previous output, with programmatic checks between steps.",
      points: [
        "Each call has one narrow job, which makes it easier to prompt and to test.",
        "Gates between steps validate intermediate output before the next call runs.",
        "Trades latency for accuracy: more calls, but each one is simpler.",
        "Is a workflow, not an agent: the code fixes the order of steps.",
      ],
      useCase: { title: "Producing a translated marketing email", scenario: "Step one drafts the email from a product brief; a check confirms it mentions the required offer and stays under 150 words; step two translates the approved draft into Spanish; step three adapts tone for the regional audience. A failed check reruns only its step, not the whole chain." },
      interview: [
        { question: "What is the advantage of a gate between chained calls?", answer: "It catches a bad intermediate result early, before later calls build on it, and gives a precise place to retry or fail — instead of discovering the problem only in the final output." },
        { question: "When is chaining the wrong choice?", answer: "When the steps cannot be known in advance or vary per input; then routing or an agent loop fits better. Chaining also adds latency, so it is unnecessary when a single call already meets the quality bar." },
      ],
    },
    {
      name: "Routing workflows",
      summary: "A classifier step sends each input to the specialised prompt, tool set or model that handles that category best.",
      points: [
        "Separates concerns so each downstream prompt is optimised for one kind of input.",
        "Can route by cost: simple requests to a small model, hard ones to a larger one.",
        "The classifier can be an LLM call or a traditional model, and it must be evaluated on its own.",
        "Needs a fallback route for inputs that match no category.",
      ],
      useCase: { title: "Triaging customer messages", scenario: "Incoming messages are classified as billing, technical issue, refund request or general question. Billing goes to an agent with invoice tools, technical issues to one with log-search tools, refunds to a workflow that requires human approval, and general questions to a small, cheap model — so each path stays simple and well-tested." },
      interview: [
        { question: "How do you measure whether a router is working?", answer: "Evaluate it as a classifier on a labelled set: accuracy and confusion between routes, plus the end-to-end quality of each route. A misroute often hurts more than a weak answer on the right route." },
        { question: "How does routing reduce cost?", answer: "Most traffic is usually easy. Sending it to a smaller, cheaper model and reserving the expensive model for the hard category cuts average cost without lowering quality where it matters." },
      ],
    },
    {
      name: "Parallelization: sectioning and voting",
      summary: "Independent subtasks run as simultaneous model calls (sectioning), or the same task runs several times and the results are combined (voting).",
      points: [
        "Sectioning splits a task into independent parts that run concurrently, cutting latency.",
        "Voting runs the same check several times and aggregates for higher confidence.",
        "Each parallel call keeps a narrow focus, which often improves accuracy.",
        "Needs a deterministic aggregation step: merge, majority vote or threshold.",
      ],
      useCase: { title: "Reviewing a pull request", scenario: "Three calls run at once: one checks security issues, one checks performance, one checks style against the team guide. Separately, the security check is run three times and a finding is reported only if at least two runs agree, which cuts false alarms without slowing the review." },
      interview: [
        { question: "When does voting help, and when does it waste money?", answer: "It helps when individual runs are noisy and the cost of a wrong answer is high, such as safety or security checks. It wastes money when outputs are already stable or errors are systematic, since repeated runs then make the same mistake." },
        { question: "How is sectioning different from multi-agent systems?", answer: "Sectioning is a fixed workflow: code decides the split and the merge. A multi-agent system lets models decide how to divide and coordinate work at run time." },
      ],
    },
    {
      name: "Orchestrator-workers",
      summary: "A central model breaks a task into subtasks at run time, delegates each to a worker call, and synthesises their results.",
      points: [
        "Subtasks are decided by the orchestrator per input, unlike fixed parallelization.",
        "Workers get a focused brief and only the context their subtask needs.",
        "The orchestrator owns synthesis and decides when the task is complete.",
        "Clear briefs and output formats prevent duplicated or overlapping worker effort.",
      ],
      useCase: { title: "Making a change across a codebase", scenario: "Asked to rename a configuration option, the orchestrator searches for every file that uses it, then assigns one worker per affected module with the exact files and the new name. It collects their diffs, checks they are consistent, and runs the build once at the end." },
      interview: [
        { question: "What is the main risk in orchestrator-worker designs?", answer: "Poor delegation: vague briefs make workers duplicate effort, miss parts or return incompatible results. Give each worker an objective, boundaries, the expected output format and the tools it may use." },
        { question: "How does this pattern control context size?", answer: "Each worker sees only its subtask, and the orchestrator receives condensed results rather than every worker's full transcript, so no single context window has to hold the whole job." },
      ],
    },
    {
      name: "Evaluator-optimizer loop",
      summary: "One model generates a candidate while a second model evaluates it against clear criteria and returns feedback, repeating until the evaluation passes.",
      points: [
        "Splits creation and judgement into separate roles with separate prompts.",
        "Works when evaluation criteria are clear and feedback measurably improves the result.",
        "The evaluator returns specific, actionable feedback, not just a score.",
        "Bounded by a maximum number of rounds and a pass threshold.",
      ],
      useCase: { title: "Translating legal text faithfully", scenario: "A generator translates a contract clause; an evaluator compares it with the source and flags a dropped condition and a mistranslated term. The generator revises with that feedback, and the loop ends once the evaluator finds no meaning changes or after four rounds." },
      interview: [
        { question: "How is evaluator-optimizer different from reflection?", answer: "Reflection has the same agent critique itself; evaluator-optimizer gives judgement to a separate evaluator, often with its own model or rubric, which reduces the tendency to approve one's own work." },
        { question: "What makes a good evaluator prompt?", answer: "Explicit pass/fail criteria, a request for specific evidence for each issue, and a structured output (verdict plus feedback list) that the loop can act on programmatically." },
      ],
    },
  ]),
  ...group("Agent Protocols and Tools", [
    {
      name: "Model Context Protocol (MCP)",
      summary: "An open protocol that lets AI applications connect to external tools, data and prompts through a standard client–server interface.",
      points: [
        "Servers expose three primitives: tools (actions), resources (readable data) and prompts (templates).",
        "A host application runs MCP clients, each holding a connection to one server.",
        "Uses JSON-RPC messages over stdio for local servers or Streamable HTTP for remote ones.",
        "Write a server once and use it from any MCP-compatible host instead of building per-app integrations.",
      ],
      useCase: { title: "Giving an assistant access to company systems", scenario: "A team publishes an MCP server for its ticketing system that exposes search_tickets and create_ticket tools plus ticket resources. The same server works in a desktop assistant, an IDE agent and an internal chatbot, and access is controlled in one place through the server's OAuth-based authorization." },
      interview: [
        { question: "What problem does MCP solve compared with plain function calling?", answer: "Function calling defines how a model requests a tool inside one application. MCP standardises how tools and data are discovered and served across applications, so N apps and M integrations need N + M implementations instead of N × M." },
        { question: "What security concerns come with MCP servers?", answer: "A server can run code or reach data with the user's permissions, and tool descriptions or results can carry prompt injection. Use trusted servers, least-privilege credentials, user consent for sensitive actions and validation of tool output." },
      ],
    },
    {
      name: "Agent2Agent (A2A) protocol",
      summary: "An open protocol for agents built by different vendors to discover each other, exchange messages and delegate tasks without sharing their internals.",
      points: [
        "Agents advertise skills and endpoints in an Agent Card that clients use for discovery.",
        "Work is organised as tasks with a lifecycle, exchanging messages and returning artifacts.",
        "Built on HTTP, JSON-RPC and server-sent events, with support for long-running tasks.",
        "Complements MCP: MCP connects an agent to tools; A2A connects agents to agents.",
      ],
      useCase: { title: "Delegating across organisations", scenario: "A travel company's planning agent finds a hotel partner's booking agent through its Agent Card, sends a task to hold a room for given dates, receives status updates while availability is checked, and gets a confirmation artifact back — without either side exposing its prompts, tools or models." },
      interview: [
        { question: "How do A2A and MCP differ?", answer: "MCP standardises the agent-to-tool connection: a model calls tools and reads resources. A2A standardises agent-to-agent collaboration between independent, opaque agents that negotiate and complete tasks, potentially over long durations." },
        { question: "Why does A2A treat remote agents as opaque?", answer: "Partners can collaborate without revealing proprietary prompts, tools or data, and each agent stays free to change its implementation as long as it honours the advertised interface." },
      ],
    },
    {
      name: "Tool design for agents",
      summary: "Agents use tools only as well as the tools are named, described and shaped, so tool interfaces deserve the same care as prompts.",
      points: [
        "Give each tool a clear name, a description of when to use it and documented parameters.",
        "Prefer a few task-level tools over many low-level endpoints the model must chain.",
        "Return concise, relevant results with meaningful errors the model can recover from.",
        "Use strict input schemas so malformed calls are rejected before they run.",
      ],
      useCase: { title: "Replacing a raw API with an agent-friendly tool", scenario: "An agent struggled with three calendar endpoints (list users, list events, create event). Replacing them with one schedule_meeting tool that takes attendees and a time window, finds a free slot and returns a short confirmation — or a clear \"no common slot this week\" error — cut failed calls sharply." },
      interview: [
        { question: "Why can wrapping every API endpoint as a tool hurt an agent?", answer: "Many overlapping low-level tools increase confusion over which to call, consume context with descriptions, and force the model to chain calls correctly. Task-shaped tools encode that chaining in code, where it is reliable." },
        { question: "What should a tool return on failure?", answer: "A short, specific error saying what went wrong and what to try instead, such as an invalid date format with the expected format. A stack trace or a generic failure leaves the model guessing." },
      ],
    },
    {
      name: "Computer-use and browser agents",
      summary: "Agents that operate graphical interfaces by viewing screenshots and issuing mouse, keyboard or browser actions when no API is available.",
      points: [
        "Loop over screenshot, decide an action (click, type, scroll), execute, take a new screenshot.",
        "Reach legacy or third-party systems that offer no API.",
        "Slower and less reliable than APIs, so prefer an API whenever one exists.",
        "Must run in an isolated VM or container with limited credentials and human checkpoints.",
      ],
      useCase: { title: "Filing data into a legacy web portal", scenario: "An insurer's claims system has no API. A browser agent in an isolated container logs in with a restricted account, fills the claim form from structured data, screenshots the confirmation, and pauses for human approval before the final submit button." },
      interview: [
        { question: "What are the main risks of computer-use agents?", answer: "Prompt injection from on-screen content, unintended actions such as purchases or deletions, and credential exposure. Mitigate with sandboxed environments, allow-listed sites, minimal permissions and confirmation for irreversible steps." },
        { question: "Why are they less reliable than API-based tools?", answer: "They depend on visual layout, timing and pop-ups that change without warning, and each step is a perception task that can misread the screen; an API returns structured, stable data." },
      ],
    },
    {
      name: "Code-executing agents",
      summary: "Agents that write and run code in a sandbox to compute, transform data or call many tools in one step, instead of issuing tool calls one at a time.",
      points: [
        "Code expresses loops, conditionals and data processing that would take many separate tool calls.",
        "Keeps large intermediate data in the sandbox instead of the context window.",
        "Requires an isolated runtime with resource limits, no secrets and controlled network access.",
        "Execution results and errors feed back into the loop for correction.",
      ],
      useCase: { title: "Analysing a large CSV export", scenario: "Asked which region's revenue fell most last quarter, the agent writes Python to load a 200 MB export, group by region and quarter, and compute changes. Only the final ten-row table returns to the model, which explains the result — the raw data never enters the context window." },
      interview: [
        { question: "Why can code execution be more token-efficient than tool calls?", answer: "Filtering, joining and aggregating happen inside the sandbox, so only the result goes back to the model instead of every intermediate tool output passing through the context." },
        { question: "How do you run model-written code safely?", answer: "In an isolated container or VM with CPU, memory and time limits, a read-only or scratch filesystem, no production credentials and network egress restricted to approved hosts." },
      ],
    },
    {
      name: "Agent skills",
      summary: "Packaged folders of instructions, scripts and resources that an agent loads on demand when a task needs that expertise.",
      points: [
        "Each skill carries a short description that is always visible; the full content loads only when relevant.",
        "Bundles procedural knowledge — steps, templates, scripts — instead of repeating it in every prompt.",
        "Progressive disclosure keeps the context window small while many skills stay available.",
        "Versioned and reviewed like code, because a skill's instructions change agent behaviour.",
      ],
      useCase: { title: "Standardising report generation", scenario: "A finance team packages its quarterly-report procedure as a skill: formatting rules, a chart script and a checklist. Any agent asked for a quarterly report loads that skill and follows the same procedure, while agents doing unrelated work never spend context on it." },
      interview: [
        { question: "How do skills differ from tools?", answer: "A tool is an action the agent calls; a skill is knowledge about how to do a kind of task, which may include instructions, reference files and scripts the agent then runs with its tools." },
        { question: "What is progressive disclosure and why does it matter?", answer: "Only skill names and descriptions sit in context until a skill is needed, then its full instructions load. It lets an agent have many capabilities without paying their context cost on every request." },
      ],
    },
  ]),
  ...group("Agent Memory and Context", [
    {
      name: "Context engineering",
      summary: "Deciding exactly what enters the model's context at each step — instructions, tools, retrieved data, history — so it has what it needs and nothing that distracts it.",
      points: [
        "Treats context as a limited budget: more tokens can reduce accuracy as well as raise cost.",
        "Selects, compresses and orders information per step rather than appending everything.",
        "Includes tool definitions, examples, memory and retrieved documents, not just the prompt.",
        "Moves bulky state to files or stores the agent can read back on demand.",
      ],
      useCase: { title: "Keeping a long-running coding agent on track", scenario: "After two hours, a coding agent's transcript holds thousands of lines of old test output. Instead of sending it all, each step supplies the task goal, the current plan, the files being edited, the latest test failures and a short summary of decisions so far — and the agent stays focused." },
      interview: [
        { question: "How is context engineering different from prompt engineering?", answer: "Prompt engineering focuses on wording instructions. Context engineering manages everything the model sees across a multi-step run — which documents, tool results, memories and history to include, compress or drop at each step." },
        { question: "What is context rot?", answer: "Model accuracy degrades as the context grows long and cluttered, even within the window limit, because relevant details get lost among irrelevant ones. Curating context counters it." },
      ],
    },
    {
      name: "Short-term and long-term memory",
      summary: "Short-term memory is the working context of the current task; long-term memory persists selected facts across sessions in an external store.",
      points: [
        "Short-term memory lives in the conversation or graph state and ends with the session.",
        "Long-term memory is written to a database or vector store and retrieved when relevant.",
        "An agent must decide what is worth storing, which avoids saving noise or sensitive data.",
        "Stored memories need updates and deletion, or outdated facts keep resurfacing.",
      ],
      useCase: { title: "A personal assistant that remembers preferences", scenario: "During one chat a user mentions they are vegetarian and prefer morning meetings. The agent stores these as long-term memories tied to the user ID. Weeks later, booking a team lunch, it retrieves them and suggests a vegetarian-friendly place at 12:00 without being told again." },
      interview: [
        { question: "Why not keep the full conversation history as memory?", answer: "It grows without bound, costs tokens on every call, buries relevant facts and can exceed the context window. Extracting durable facts into long-term storage scales far better." },
        { question: "What privacy controls should long-term memory have?", answer: "Per-user isolation, consent for what is stored, the ability to view and delete memories, retention limits and exclusion of sensitive data such as credentials." },
      ],
    },
    {
      name: "Episodic, semantic and procedural memory",
      summary: "A cognitive-science split for agent memory: episodes (what happened), facts (what is true) and procedures (how to do things).",
      points: [
        "Episodic memory stores past interactions or runs, often as examples to reuse.",
        "Semantic memory stores facts about users, entities and the domain.",
        "Procedural memory stores how to act — instructions or prompts the agent can refine over time.",
        "Each type has its own write trigger, storage format and retrieval method.",
      ],
      useCase: { title: "An agent that improves at support tickets", scenario: "A support agent stores successful resolutions as episodes and retrieves similar ones as few-shot examples (episodic), keeps product facts and customer plan details (semantic), and after repeated reviewer feedback updates its own escalation rules in its system instructions (procedural)." },
      interview: [
        { question: "Give an example of procedural memory in an agent.", answer: "The agent rewrites part of its own instructions after feedback — for example adding \"always confirm the account ID before issuing a refund\" — so the behaviour persists in future sessions." },
        { question: "How would you retrieve episodic memories?", answer: "Embed past episodes and retrieve the most similar to the current task, then insert them as worked examples, filtered by user or tenant and recency." },
      ],
    },
    {
      name: "Agentic RAG",
      summary: "Retrieval driven by an agent that decides whether, where and how often to search, and checks the results before answering.",
      points: [
        "Decides per question whether retrieval is needed at all.",
        "Chooses among sources — vector index, SQL, web, APIs — and reformulates queries.",
        "Grades retrieved documents and searches again when evidence is missing or weak.",
        "Costs more calls and latency than single-shot RAG, so reserve it for hard questions.",
      ],
      useCase: { title: "Answering a multi-part policy question", scenario: "Asked whether a contractor in Germany can expense a co-working space, the agent first searches the expense policy, finds that contractor rules live in a separate document, searches that, then queries the HR database for German-specific exceptions — and answers only once each part of the question has supporting evidence." },
      interview: [
        { question: "How does agentic RAG differ from standard RAG?", answer: "Standard RAG retrieves once with the user's query and answers. Agentic RAG puts retrieval in a loop the agent controls: choosing sources, rewriting queries, judging relevance and retrieving again until the evidence is sufficient." },
        { question: "How do you stop an agentic RAG loop from searching forever?", answer: "Set a retrieval budget, require a relevance grade before continuing, and let the agent answer with stated uncertainty once the budget is spent." },
      ],
    },
    {
      name: "Prompt caching for agents",
      summary: "Reusing the processed form of a repeated prompt prefix — system prompt, tool definitions, documents — so later calls cost less and respond faster.",
      points: [
        "Agents resend the same long prefix on every loop iteration, which makes caching especially valuable.",
        "Only an exact matching prefix is reused, so stable content goes first and changing content last.",
        "Cache reads are billed far below normal input tokens; cache entries expire after a time window.",
        "Editing tools or the system prompt mid-run invalidates the cache from that point on.",
      ],
      useCase: { title: "Cutting the cost of a document-review agent", scenario: "An agent reviews a 100-page contract over twenty tool-using turns. With the contract and tool definitions placed first and cached, each turn re-reads them at a fraction of the input price, and only the new turn's messages are processed in full — lowering both cost and latency for the whole run." },
      interview: [
        { question: "How should you order a prompt to benefit from caching?", answer: "Put stable content first — tool definitions, system instructions, reference documents — and variable content such as the latest user message last, because only an identical prefix can be reused." },
        { question: "What silently breaks prompt caching?", answer: "Anything that changes the prefix: a timestamp in the system prompt, reordered tools, or edits to earlier messages. Each change forces the prefix to be processed again at full price." },
      ],
    },
  ]),
  ...group("Production Agents", [
    {
      name: "Agent observability and tracing",
      summary: "Recording every model call, tool call, input, output, latency and cost of an agent run as a trace, so failures can be found and fixed.",
      points: [
        "A trace is a tree of spans: the run, each model call and each tool call with timings.",
        "Captures prompts, tool arguments, results, token usage and errors for each step.",
        "Lets you replay failed runs and turn them into evaluation cases.",
        "Requires redaction and access controls because traces contain user data.",
      ],
      useCase: { title: "Debugging an agent that gives wrong refunds", scenario: "Users report wrong refund amounts. The traces show the agent called the order tool correctly, but the tool returned prices in cents and the model read them as dollars. The team fixes the tool's output format and adds the failing trace to the regression dataset." },
      interview: [
        { question: "Why are logs insufficient for debugging agents?", answer: "Agent failures arise from sequences of decisions. Flat logs lose the parent–child structure and the exact context the model saw at each step, which a trace preserves for replay and analysis." },
        { question: "Which metrics would you track for agents in production?", answer: "Task success rate, steps and tool calls per task, latency, token cost per task, tool error rate, escalation or human-handoff rate, and user feedback." },
      ],
    },
    {
      name: "Agent cost and latency budgets",
      summary: "Explicit limits on tokens, tool calls, time and spend per task so an agent's open-ended loop stays affordable and responsive.",
      points: [
        "Sets ceilings for steps, tokens, wall-clock time and money per task, enforced in code.",
        "Matches the model to the step: smaller models for routine steps, larger for hard reasoning.",
        "Streams partial progress so users are not waiting on a silent long run.",
        "Ends gracefully at the budget with the best answer and a clear statement of what is unfinished.",
      ],
      useCase: { title: "Bounding a research agent", scenario: "A research agent may use at most 15 searches, 200k tokens and 3 minutes per question. Query rewriting and summaries run on a small model; only the final synthesis uses the large one. When the search budget runs out, it answers from what it has and lists the open questions." },
      interview: [
        { question: "How do you reduce an agent's cost without hurting quality?", answer: "Cache stable prompt prefixes, route easy steps to smaller models, trim context to what each step needs, cap retries, and measure quality on an eval set after every change." },
        { question: "What should happen when an agent hits its budget?", answer: "Stop cleanly, return the best partial result with a note on what is incomplete, and log the event, rather than failing silently or exceeding the limit." },
      ],
    },
    {
      name: "Reasoning models and thinking budgets",
      summary: "Models that spend extra tokens reasoning before answering, with controls to set how much thinking a request may use.",
      points: [
        "Extended reasoning improves multi-step maths, coding, planning and analysis tasks.",
        "Thinking tokens add latency and cost, so the effort level should match task difficulty.",
        "In agent loops, models can reason between tool calls to interpret results before acting.",
        "Simple extraction or classification rarely benefits from deep reasoning.",
      ],
      useCase: { title: "Choosing effort per step", scenario: "A data-pipeline agent uses low effort to rename columns and parse dates, but high effort when designing a schema migration that must preserve existing data — spending reasoning where mistakes are costly and saving it everywhere else." },
      interview: [
        { question: "When would you not use a reasoning model?", answer: "For latency-sensitive, simple tasks such as classification, extraction or short replies, where extra thinking adds cost and delay without improving accuracy." },
        { question: "How does reasoning change prompt design?", answer: "Give clear goals, constraints and success criteria rather than step-by-step instructions; the model plans the steps itself, and over-prescribing can reduce quality." },
      ],
    },
    {
      name: "Levels of agent autonomy",
      summary: "How much an agent may decide and do without a human — from suggesting actions, to acting with approval, to acting alone within limits.",
      points: [
        "Suggest-only: the agent proposes and a human executes.",
        "Approve-to-act: the agent acts after a human confirms each sensitive step.",
        "Act-within-bounds: the agent acts alone inside limits and escalates exceptions.",
        "Autonomy is earned per action type, based on measured reliability and the cost of mistakes.",
      ],
      useCase: { title: "Rolling out an IT-helpdesk agent", scenario: "In month one the agent only drafts replies for staff. Once evaluations show 95% accuracy on password resets, it performs resets on its own, while account deletions and permission changes still need a technician's approval." },
      interview: [
        { question: "How do you decide what an agent may do autonomously?", answer: "Weigh reversibility, blast radius and measured accuracy for that action: reversible, low-impact, well-evaluated actions can be autonomous; irreversible or high-impact ones keep a human approval step." },
        { question: "What does escalation look like in a well-designed agent?", answer: "The agent recognises low confidence, missing permissions or out-of-policy requests, stops, and hands the case to a human with a summary of what it found and what it attempted." },
      ],
    },
  ]),
];
