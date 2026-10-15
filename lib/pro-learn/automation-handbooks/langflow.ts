import type { AwsHighlight } from "../aws-highlights";

/**
 * Langflow lessons, written from the official documentation (docs.langflow.org,
 * Langflow 1.12). Each row teaches one idea with its points, a real use case,
 * an interview question and, where it helps, code. The API reference rows that
 * follow these in the tab come from lib/api-docs-langflow.ts (see langflow-api.ts).
 */
type Lesson = [name: string, summary: string, points: string[], useCase: [title: string, scenario: string], interview: [question: string, answer: string], code?: { path: string; code: string }[]];

const lessons = (groups: Record<string, Lesson[]>): AwsHighlight[] =>
  Object.entries(groups).flatMap(([category, rows]) => rows.map(([name, summary, points, [title, scenario], [question, answer], code]) => ({
    name, category, summary, points, useCase: { title, scenario }, interview: [{ question, answer }], ...(code ? { code } : {}),
  })));

export const LANGFLOW_TOPICS = lessons({
  "Getting started": [
    ["Langflow overview", "Build agents and AI workflows visually, then serve the same flow as an API, MCP tool or A2A agent.", [
      "A flow is a graph of components drawn on a canvas and stored as JSON.",
      "The flow tested in the Playground is the flow the API serves.",
      "Visual building speeds iteration but does not remove the need to review what the flow does.",
    ], ["From whiteboard to working API", "A product team sketches a support assistant on the canvas, tests it in the Playground the same afternoon, and the web app calls it through the run endpoint the next day."],
    ["What is Langflow, and where does it sit relative to LangChain and LangGraph?", "Langflow is an open-source, Python-based visual builder and runtime for AI flows. Many of its components wrap LangChain integrations, but you assemble them on a canvas instead of in code, and the server runs and serves the result as an API, MCP server or A2A agent. LangGraph is a code-first orchestration library for durable, stateful agents. Langflow trades some low-level control for speed of iteration and collaboration."]],
    ["Installation options", "Choose Langflow Desktop, the Python package or the Docker image depending on who runs it and where.", [
      "Langflow Desktop is the quickest single-user install on Windows and macOS.",
      "The `langflow` Python package needs Python 3.10–3.14 and is installed with `uv pip install langflow`.",
      "Official Docker images disable auto-login, so they need a superuser password.",
    ], ["Matching the install to the job", "A data scientist uses Desktop to prototype, the platform team runs the Docker image on Kubernetes for the shared instance, and CI uses the Python package with LFX to run flows headlessly."],
    ["Why do official Docker images set `LANGFLOW_AUTO_LOGIN=false`, and what must you configure as a result?", "Auto-login signs every visitor in as the superuser, which is acceptable on a laptop but dangerous on a network. Containers are usually reachable by others, so the images require login. You must set `LANGFLOW_SUPERUSER` and a strong `LANGFLOW_SUPERUSER_PASSWORD`, and then create API keys for programmatic access."],
    [{ path: "terminal.sh", code: "# Python package (Python 3.10–3.14)\nuv venv && uv pip install langflow\nuv run langflow run            # http://localhost:7860\n\n# Docker\ndocker run -p 7860:7860 \\\n  -e LANGFLOW_SUPERUSER=admin \\\n  -e LANGFLOW_SUPERUSER_PASSWORD=change-me-to-a-long-secret \\\n  langflowai/langflow:latest" }]],
    ["Your first flow: Basic Prompting", "Connect Chat Input, a Prompt Template, a Language Model and Chat Output, then test it in the Playground.", [
      "Chat Input turns the user's text into a Message; Chat Output returns the reply.",
      "The Prompt Template's `{variables}` become input ports you wire upstream outputs into.",
      "Templates such as Basic Prompting and Simple Agent are starting points you copy and modify.",
    ], ["A tone-of-voice rewriter", "A marketing team builds a flow whose prompt rewrites any text into the brand voice, tests ten examples in the Playground, and shares the flow's API snippet with the CMS developer."],
    ["Which components does every chat flow need, and why?", "Chat Input and Chat Output. Chat Input creates the Message (with session ID and files) that starts a chat run, and it is required by the Playground, the embedded chat widget and the Responses API. Chat Output is what `/run` returns, what the Playground displays and what an MCP tool call receives. Everything between them is the flow's logic."]],
    ["Projects and flow organization", "Group related flows into projects, which are also the unit exported as a ZIP and served as one MCP server.", [
      "A project's enabled flows become the tools of that project's MCP server.",
      "A whole project can be downloaded as a ZIP and imported into another instance.",
      "Grouping by purpose keeps MCP tool lists small and relevant for clients.",
    ], ["One project per consuming team", "A company keeps a 'Support tools' project and a 'Finance tools' project, so the support team's MCP client sees only lookup and refund-policy flows and never the finance ones."],
    ["How would you structure projects for an organization with several teams?", "Use projects as the boundary of ownership and exposure: one per team or product area, so each project's MCP server exposes only the tools that audience needs. Keep shared utility flows in their own project and call them with Run Flow. Export projects regularly into version control, and give flows clear names and descriptions, because those become MCP tool names and descriptions."]],
    ["Flow JSON, export and templates", "A flow is saved as JSON containing its nodes, edges and field values, which makes it portable and versionable.", [
      "Export one flow as JSON or a whole project as a ZIP.",
      "The JSON contains every saved field value, so check it for secrets before sharing.",
      "An `endpoint_name` alias can replace the flow's UUID in API URLs.",
    ], ["Promoting a flow from staging to production", "An engineer exports the reviewed flow JSON, commits it, and the deployment pipeline imports it into the production instance with the same endpoint name, so client code never changes."],
    ["What is the benefit of setting an `endpoint_name` on a flow?", "Clients call `/api/v1/run/<endpoint_name>` instead of a UUID. When the flow is re-imported or replaced, its UUID can change, but the alias can stay the same, so applications, webhooks and documentation keep working. It also makes logs and URLs readable."]],
  ],
  "Building flows": [
    ["Typed data: Message, JSON and Table", "Ports carry typed data, and an output connects only to an input that accepts the same type.", [
      "Message carries chat text plus sender, session ID and files.",
      "JSON (named Data before 1.9) is a structured record; Table (named DataFrame before 1.9) holds rows.",
      "Parser and type-conversion components bridge types when a flow mixes them.",
    ], ["Turning search results into an answer", "Web Search returns a Table of results; a Parser formats the rows into text, which feeds a Prompt Template whose output becomes the Message the model answers."],
    ["Why does Langflow type its ports, and how do you connect two components whose types differ?", "Typing catches wiring mistakes in the editor rather than at run time: an output can only connect to inputs of a compatible type, shown by port colour. When types differ, insert a converter: Parser turns JSON or Table into text with a template, and type-conversion components change between Message, JSON and Table. Choosing the right shape early, for example keeping records as a Table until the last step, keeps flows simpler."]],
    ["Prompt design in flows", "Use Prompt Template variables to inject context, history and instructions explicitly rather than concatenating text.", [
      "Each `{variable}` becomes an input port; double-bracket mode allows Mustache `{{variable}}` syntax.",
      "Literal braces in single-bracket mode are read as variables, so escape them or switch mode.",
      "Keep instructions in the template and data in variables so prompts stay reviewable.",
    ], ["Grounded answers with citations", "A template has `{context}` filled by retrieved chunks and `{question}` from Chat Input, with an instruction to answer only from the context and cite the document titles."],
    ["How do you keep prompts maintainable as a flow grows?", "Treat the Prompt Template as the single place for instructions, with every dynamic part a named variable wired from upstream components. Avoid building prompts by text concatenation in custom code. Use tweaks to try prompt variants without editing the saved flow, and version the flow JSON so prompt changes are diffable and reviewable."]],
    ["Chat memory and sessions", "Langflow stores chat messages per `session_id`, so each conversation keeps its own history.", [
      "The Agent component includes built-in chat memory per session.",
      "Message History reads or stores messages by session from Langflow storage or external memory.",
      "Without a stable session ID from the app, separate users can end up sharing context.",
    ], ["Per-customer support conversations", "The web app passes the ticket ID as `session_id` on every call, so the agent remembers earlier turns of that ticket and never mixes customers."],
    ["What goes wrong if a client calls a chat flow without a consistent `session_id`?", "Either every call starts a new conversation, so the assistant forgets earlier turns, or several users share one default session and see each other's context. The client should derive a stable ID per conversation (for example a user ID plus thread ID) and pass it on every request. History should also be bounded, through the number of history messages read, so long sessions do not overflow the context window."]],
    ["Branching: If-Else and Smart Router", "Route a run down different paths by exact comparison (If-Else) or by LLM classification (Smart Router).", [
      "If-Else compares text and sends the message to its True or False output.",
      "Smart Router asks an LLM to pick one of the routes defined in a table, with an optional Else.",
      "Deterministic checks are cheaper and more predictable; use the LLM router for fuzzy intent.",
    ], ["Intent-based triage", "A support flow uses Smart Router to send billing questions to a billing sub-flow, outages to an incident flow, and everything else to a general agent, with If-Else first catching the literal command 'human'."],
    ["When would you use If-Else rather than Smart Router?", "Use If-Else whenever the decision can be expressed as a deterministic comparison (an exact keyword, a status value, a regex-like match), because it is free, instant and fully predictable. Use Smart Router when the categories describe intent in natural language and inputs vary too much for rules. A common pattern is rules first for the obvious cases, then the router for the rest."]],
    ["Loops and batch processing", "Process lists item by item with Loop, or run a model over every row of a Table with Batch Run.", [
      "Loop sends each item out of Item, receives it back through Looping, and emits the aggregate from Done.",
      "Batch Run adds the model's response for each row as a new Table column.",
      "Large batches multiply model calls, so test on a sample and watch cost.",
    ], ["Classifying a backlog of feedback", "An analyst loads 2,000 survey responses as a Table and uses Batch Run with a classification prompt, producing a new 'theme' column ready to chart."],
    ["How do Loop and Batch Run differ, and how would you control cost in either?", "Loop is general iteration: each item can pass through any chain of components before returning, which suits multi-step processing per item. Batch Run is specialised: one model call per row, results appended as a column, which is simpler and faster to build. Control cost by sampling first, using a cheaper model for classification, keeping prompts short, and caching or deduplicating repeated inputs."]],
    ["Sub-flows with Run Flow", "Call another flow as a step, or give it to an agent as a tool, to reuse logic across flows.", [
      "Run Flow generates inputs for the target flow and accepts optional tweaks.",
      "In Tool Mode it lets an agent call a whole flow as one tool.",
      "Shared sub-flows mean one fix reaches every flow that uses them.",
    ], ["A shared 'look up customer' flow", "Three different assistants call one customer-lookup flow through Run Flow, so when the CRM API changes only that flow is updated."],
    ["What are the trade-offs of composing flows with Run Flow?", "It brings reuse and separation of concerns: each flow is smaller, testable on its own and owned by one team. The costs are extra latency per call, harder end-to-end debugging across flows, and coupling to the sub-flow's inputs and outputs, which become an interface. Keep those interfaces stable, name them clearly, and use traces to follow a run across flows."]],
    ["Structured extraction", "Use Structured Output to have an LLM return fields that match a schema table instead of free text.", [
      "The Output Schema table defines field names, types and descriptions.",
      "The result is JSON or a Table, ready for downstream components or APIs.",
      "Validate business rules after extraction; a schema guarantees shape, not truth.",
    ], ["Invoices into the accounting system", "Uploaded invoices are converted to text, Structured Output extracts vendor, total, currency and due date, and a custom component posts the record to the finance API."],
    ["Why prefer Structured Output over asking the model to 'reply in JSON'?", "A schema gives the component explicit field names, types and descriptions to enforce, so the output parses reliably and downstream components receive typed JSON or Table data. Free-text JSON instructions break on extra prose, missing fields or invalid syntax. Even so, the values can be wrong, so add validation and a fallback path for records that fail checks."]],
  ],
  "Agents & tools": [
    ["How the Agent component works", "The Agent runs a tool-calling loop: an LLM reasons over the input, calls connected tools and replies, with chat memory per session.", [
      "Agent Instructions set the system prompt; the Language Model input picks the model.",
      "Tools connect to the Tools port from components in Tool Mode, MCP Tools or Run Flow.",
      "The Playground shows each tool call, which is the first place to debug agent behaviour.",
    ], ["An IT helpdesk agent", "An agent with tools for password-reset status, device inventory and the knowledge base answers employee questions and shows each tool call in the Playground for review."],
    ["How would you debug an Langflow agent that calls the wrong tool?", "Open the run in the Playground or traces and read the tool calls and their inputs. Most causes are tool descriptions that overlap or are vague, too many tools connected, or agent instructions that do not say when to use each. Fix the descriptions and names first, reduce the toolset, add explicit guidance in the instructions, and test with a fixed set of questions before and after."]],
    ["Designing tools with Tool Mode", "Turn almost any component into a tool an Agent can call by switching it to Tool Mode.", [
      "A component in Tool Mode exposes a Toolset port to connect to the Agent.",
      "You choose which of its actions are exposed and edit their names and descriptions.",
      "Every exposed tool widens what the agent can do, so expose only what is needed.",
    ], ["Letting an agent fetch web pages", "The URL component is switched to Tool Mode and connected to the agent, which can now read a page the user links before answering."],
    ["What makes a good tool for an LLM agent?", "A clear, distinct name and a description that says when to use it and what it returns; a small, typed set of inputs; deterministic, fast behaviour; and outputs that are concise enough for the context window. Dangerous actions should be separate tools that need approval, and read-only tools should be preferred where possible."]],
    ["Connecting MCP servers", "Use the MCP Tools component to give an agent the tools of any MCP server over stdio, HTTP or SSE.", [
      "MCP Tools can connect to external servers or to Langflow's own project MCP servers.",
      "Server tools appear to the agent like any other connected tool.",
      "Only connect servers you trust; their tools run with the access you give them.",
    ], ["Agents that work with GitHub and the filesystem", "An engineering assistant connects GitHub and filesystem MCP servers, letting it read issues and repository files to draft release notes."],
    ["What security considerations apply when connecting an agent to MCP servers?", "An MCP server's tools execute with whatever credentials and access the server has, and tool outputs can contain prompt-injection text. Connect only trusted servers, scope their credentials to the minimum, avoid exposing destructive tools without an approval step, treat tool output as untrusted data, and log tool calls through traces for audit."]],
    ["Human-in-the-loop with Human Input", "Pause a flow at a checkpoint until a person chooses an action; each action becomes an output branch.", [
      "Each User Action defined on the component is its own output path.",
      "Completed steps are not re-run when the flow resumes.",
      "Use it before irreversible actions such as payments, emails or data changes.",
    ], ["Approving outbound customer emails", "An agent drafts a reply, Human Input pauses with Approve and Edit actions, and only the Approve branch reaches the component that sends the email."],
    ["Where should human approval go in an AI workflow, and why does 'not re-running completed steps' matter?", "Approval belongs immediately before any irreversible or high-impact action, with the draft and its supporting evidence shown to the reviewer. Because completed steps are not re-run on resume, expensive model calls and side effects that happened before the pause are not repeated, which keeps costs predictable and prevents duplicate actions."]],
    ["Guardrails for input safety", "Validate incoming text with an LLM check for PII, secrets, jailbreak attempts and harmful content before it reaches the agent.", [
      "Built-in checks cover PII, secrets, jailbreaks, offensive and malicious content, plus custom rules.",
      "Place guardrails right after Chat Input so unsafe input never reaches tools.",
      "LLM-based checks can miss or over-flag, so combine them with deterministic rules.",
    ], ["Keeping secrets out of a public chatbot", "A public assistant routes input through Guardrails; messages containing API keys or card numbers are blocked with a polite explanation instead of being sent to the model and logged."],
    ["Are LLM-based guardrails enough on their own? What else would you add?", "No. They are probabilistic and can be bypassed or produce false positives. Add deterministic validation (regexes for card numbers and keys, length limits), least-privilege tools so a successful injection cannot do much, output checks before anything leaves the system, rate limiting, and monitoring of blocked and passed messages to tune the rules."]],
  ],
  "RAG & data": [
    ["Ingestion pipeline", "Load documents, split them into chunks, embed them and store them in a vector store or Knowledge Base.", [
      "Split Text sets chunk size, overlap and separator for each chunk.",
      "The same embedding model must be used for ingestion and retrieval.",
      "Run ingestion as its own flow so it can be scheduled or triggered separately.",
    ], ["Indexing a policy library", "An ingestion flow loads 400 HR PDFs, splits them into 800-character chunks with overlap, embeds them and writes them to the Knowledge Base; it reruns whenever HR uploads a new version."],
    ["How do you choose chunk size and overlap?", "Chunks should hold one coherent idea: too small loses context, too large dilutes relevance and wastes the context window. Start around a few hundred to a thousand characters, add 10–20% overlap so sentences that span a boundary survive, split on natural separators such as paragraphs, and then measure retrieval quality on real questions rather than guessing."]],
    ["Retrieval flow", "Embed the question, search the store for similar chunks, and pass them as context to the prompt.", [
      "Retrieval returns the top matching chunks, optionally filtered by metadata.",
      "A Parser formats chunks, with their sources, into the prompt's context variable.",
      "Tell the model to answer only from the context and to say when it is missing.",
    ], ["Product documentation assistant", "A docs assistant retrieves the five most similar chunks filtered by product version, and the answer cites the page titles it used."],
    ["The RAG assistant gives confident wrong answers. How do you investigate?", "Separate retrieval from generation. Inspect what was retrieved for the failing questions: if the right chunk is missing, fix ingestion (chunking, stale documents, metadata filters) or the embedding model; if the right chunk is present, fix the prompt so it insists on grounding and allows 'I don't know'. Build a small set of question-and-expected-source pairs and check retrieval hit rate as you change things."]],
    ["Knowledge Base vs an external vector store", "Use the built-in Knowledge Base for local, self-contained retrieval, and an external vector database for scale and sharing.", [
      "The Knowledge Base stores embeddings locally and supports similarity search with metadata filters.",
      "External stores such as Astra DB, pgvector or Chroma suit large or shared corpora.",
      "Choose by data size, who else needs the index, and operational ownership.",
    ], ["Start local, move out later", "A team prototypes with the Knowledge Base, then moves to a managed vector database when three applications need the same index and the corpus passes a million chunks."],
    ["When would you move from the built-in Knowledge Base to an external vector database?", "When the corpus or query volume outgrows a local store, when several applications or services must share the same index, when you need managed backups, replication and access control, or when the data must live in an existing platform. The flows change little because only the store components are swapped, as long as the embedding model stays the same."]],
    ["Web data: URL and Web Search", "Fetch and crawl pages with URL, or search the web, news and RSS with Web Search, to bring fresh information into a flow.", [
      "URL can crawl recursively and return text, Markdown or HTML.",
      "Web Search returns results as a Table for parsing or batch processing.",
      "Treat fetched content as untrusted input: it can contain prompt injection.",
    ], ["Competitive news digest", "A scheduled flow searches news for competitor names, fetches the top articles with URL, summarizes each and posts a daily digest."],
    ["What risks come with feeding web content into an LLM flow?", "Web pages can contain instructions aimed at the model (indirect prompt injection), misinformation, or huge payloads that overflow the context. Mitigate by limiting crawl depth and size, stripping to readable text, instructing the model to treat the content as data, keeping tools available to that flow minimal, and citing sources so users can verify."]],
  ],
  "Integrate & serve": [
    ["Choosing the right endpoint", "Pick between run, advanced run, webhook, the v2 Workflow API and the Responses API based on how your client calls the flow.", [
      "`/api/v1/run/{flow_id}` is the main synchronous (or streamed) call for applications.",
      "`/api/v1/webhook/{flow_id}` starts a flow from any JSON payload and returns immediately.",
      "`/api/v1/responses` lets existing OpenAI clients call a flow by using its ID as the model.",
    ], ["One flow, three callers", "The web app calls `/run` with streaming, Stripe events hit the webhook endpoint, and an internal tool built on the OpenAI SDK calls the same flow through `/responses`."],
    ["When would you use the webhook endpoint instead of `/run`?", "Use the webhook when another system pushes events and does not need the flow's output in the response: payment events, form submissions, repository events. The run starts in the background and the call returns quickly, which suits senders with short timeouts and retries. Use `/run` when the caller needs the answer, and the v2 Workflow API (beta) when you need background jobs you can poll, stream or stop."]],
    ["Streaming responses", "Add `?stream=true` to the run endpoint to receive tokens as they are generated instead of waiting for the full reply.", [
      "Streaming improves perceived latency for chat interfaces.",
      "The v2 Workflow API can stream Langflow events or the AG-UI protocol over SSE.",
      "Proxy the stream through your own server so the API key never reaches the browser.",
    ], ["A responsive chat UI", "A Next.js route handler forwards the streamed run to the browser, so users see the answer forming within half a second."],
    ["Why proxy Langflow streaming through your backend rather than calling it from the browser?", "Calling from the browser would expose the Langflow API key and the server URL to anyone. A backend proxy keeps the key secret, can enforce authentication, rate limiting and input validation, can attach the session ID from the user's session, and can log or transform the stream before forwarding it."]],
    ["Calling flows from TypeScript", "Use the official `@datastax/langflow-client` (LangflowClient) to run or stream flows with tweaks and session IDs.", [
      "The client wraps the run endpoint with typed options.",
      "Pass the base URL and API key from server-side environment variables.",
      "It also supports streaming and log access.",
    ], ["Typed integration in a Node backend", "An Express service uses LangflowClient to run the summarization flow with a per-request tweak for the target length."],
    ["How do tweaks help when integrating a flow into an application?", "Tweaks override component parameters for a single request without changing the saved flow, keyed by component ID. An application can choose a model, temperature, prompt variant or file path per call, run A/B tests, or adapt behaviour per customer tier, while the flow in Langflow stays the single reviewed definition."],
    [{ path: "lib/langflow.ts", code: "import { LangflowClient } from \"@datastax/langflow-client\";\n\nconst client = new LangflowClient({\n  baseUrl: process.env.LANGFLOW_URL!,\n  apiKey: process.env.LANGFLOW_API_KEY!,\n});\n\nexport async function summarize(text: string, sessionId: string) {\n  const flow = client.flow(process.env.LANGFLOW_FLOW_ID!);\n  const response = await flow.run(text, {\n    session_id: sessionId,\n    tweaks: { \"LanguageModel-abc12\": { temperature: 0.2 } }, // per-request override\n  });\n  return response.chatOutputText();\n}" }]],
    ["Embedding the chat widget", "Paste the generated `langflow-chat` web component snippet into a site to chat with a flow.", [
      "The snippet is generated under the flow's sharing options.",
      "It needs a host URL, flow ID and API key, so use a key scoped for public use.",
      "For public sites, put rate limiting and abuse protection in front of the server.",
    ], ["A help widget on a documentation site", "The docs team embeds the chat widget on every page so readers can ask questions answered by the documentation RAG flow."],
    ["What are the risks of embedding a chat widget that talks to Langflow directly from public web pages?", "The key and server are visible to anyone who views the page, so the key can be reused to run the flow at your expense or to probe other flows it can reach. Mitigate with a dedicated key and user with minimal access, a reverse proxy with rate limits and origin checks, a flow without dangerous tools, and monitoring of usage."]],
    ["Serving flows as MCP tools", "Each project is an MCP server: its enabled flows become tools served over streamable HTTP.", [
      "The project MCP URL is `/api/v1/mcp/project/{project_id}/streamable`.",
      "Flow names and descriptions become the tool names and descriptions clients see.",
      "MCP clients authenticate with a Langflow API key.",
    ], ["Company workflows in Claude", "An operations team enables its 'incident summary' and 'on-call lookup' flows in a project and adds the project's MCP URL to Claude, which can then call them during incidents."],
    ["What should you check before exposing a project's flows to MCP clients?", "That only the flows meant to be tools are enabled; that each has a precise name and description, since the client's model chooses tools from them; that inputs are simple; that flows with side effects have approvals or limits; and that clients use dedicated API keys so access can be revoked and audited."]],
    ["Serving flows as A2A agents", "Expose a flow as an Agent2Agent agent that other agents discover through its agent card and call over JSON-RPC.", [
      "A2A support is a preview feature.",
      "The agent card describes what the agent can do so other agents can discover it.",
      "Calls go to `/api/v1/a2a/{flow_id}/jsonrpc`.",
    ], ["Cross-team agent collaboration", "A planning agent built elsewhere delegates 'check inventory' tasks to a Langflow inventory agent exposed over A2A."],
    ["How do MCP and A2A differ in what they expose?", "MCP exposes tools (and resources and prompts) for a model or agent to call as functions: the caller stays in control. A2A exposes whole agents that accept tasks, may work over multiple turns and return results: the callee has autonomy. Langflow can do both: project flows as MCP tools, and a single flow as an A2A agent."]],
  ],
  "Custom components": [
    ["Writing a custom component", "Subclass `Component`, declare inputs and outputs, and implement the method each output names.", [
      "Import from `lfx` since Langflow 1.7; `langflow.custom` still works.",
      "Inputs come from `lfx.io` (such as `MessageTextInput`, `DropdownInput`); each `Output` binds to a method.",
      "Output methods return Message, JSON, Table or primitives.",
    ], ["Wrapping an internal API", "A team writes a component that calls the internal order service with the user's order ID and returns the order as JSON for the agent."],
    ["When should you write a custom component instead of using built-ins?", "When you need to call an internal system, apply domain logic or data processing that no built-in covers, or package a reusable step with a clean interface for other flow builders. Prefer built-ins when they suffice, because custom code is yours to test, secure and upgrade. Keep each custom component focused, typed and free of hard-coded secrets."],
    [{ path: "components/orders/order_lookup.py", code: "from lfx.custom import Component\nfrom lfx.io import MessageTextInput, Output\nfrom lfx.schema import Data\nimport httpx\n\n\nclass OrderLookup(Component):\n    display_name = \"Order Lookup\"\n    description = \"Fetch an order from the internal order service.\"\n    icon = \"package\"\n    inputs = [MessageTextInput(name=\"order_id\", display_name=\"Order ID\", tool_mode=True)]\n    outputs = [Output(name=\"order\", display_name=\"Order\", method=\"lookup\")]\n\n    def lookup(self) -> Data:\n        response = httpx.get(f\"https://orders.internal/api/orders/{self.order_id}\", timeout=10)\n        response.raise_for_status()\n        self.status = f\"Fetched order {self.order_id}\"   # shown in the editor\n        return Data(data=response.json())" }]],
    ["Dynamic fields with update_build_config", "Change other fields' visibility or options in the editor when a field marked `real_time_refresh` changes.", [
      "The hook receives the build config, the changed field's value and its name.",
      "Use it to show provider-specific fields or load dropdown options.",
      "Keep it fast: it runs while the user edits the flow.",
    ], ["Provider-aware settings", "Choosing 'Azure' in a provider dropdown reveals deployment-name and API-version fields, and hides them for other providers."],
    ["What belongs in `update_build_config`, and what does not?", "Editor-time configuration: showing or hiding fields, changing options, setting defaults based on another field. It should not perform the component's real work, make slow network calls on every keystroke, or depend on run-time data, because it executes during editing rather than during a flow run."]],
    ["Loading and packaging components", "Place custom component files in category folders under `LANGFLOW_COMPONENTS_PATH` so Langflow loads them beside the built-ins.", [
      "Each category folder needs an `__init__.py`; nesting depth is limited to two.",
      "Dependencies a component imports must be installed in Langflow's environment.",
      "Since 1.12.4, input names must not clash with methods such as `run`, `index` or `log`.",
    ], ["Shipping components in a Docker image", "The platform team bakes the company's component folder and its Python dependencies into a custom image built from the official one, mounted at the components path."],
    ["How would you distribute custom components to every Langflow instance in an organization?", "Keep them in a versioned repository with tests, build a custom Docker image that installs their dependencies and copies them to the components path (or mount them as a volume), and roll the image out like any other service. Pin Langflow's version in that image, because component APIs can change between releases."]],
  ],
  "Production & operations": [
    ["Authentication hardening", "Disable auto-login, set a strong superuser password and secret key, and require API keys for every programmatic call.", [
      "`LANGFLOW_AUTO_LOGIN=false` makes the editor require sign-in.",
      "API keys are sent in the `x-api-key` header and can be revoked individually.",
      "Set `LANGFLOW_SECRET_KEY` so stored credentials are encrypted with a key you control.",
    ], ["Securing a shared instance", "Before opening Langflow to the whole company, the platform team disables auto-login, creates per-team users and API keys, and puts the server behind SSO-protected ingress."],
    ["List the steps to harden a Langflow deployment before exposing it to a network.", "Disable auto-login and set a strong superuser password; set a persistent secret key; create users and API keys per consumer; run behind TLS and a reverse proxy; restrict CORS and network access; use backend-only mode for API-only servers; keep secrets in global variables; pin and patch the Langflow version; and monitor logs and usage for abuse."]],
    ["Secrets and global variables", "Store credentials as global variables bound to component fields, never as literal values saved in flows.", [
      "Credential-type global variables keep secrets out of exported flow JSON.",
      "Global variables can be populated from environment variables at startup.",
      "`X-LANGFLOW-GLOBAL-VAR-*` request headers can pass a variable for a single run.",
    ], ["Per-tenant API keys", "A multi-tenant app passes each tenant's own model key in an `X-LANGFLOW-GLOBAL-VAR-OPENAI_API_KEY` header, so usage is billed to the right account."],
    ["Why is a credential typed directly into a component field a problem?", "The field value is saved inside the flow, so it travels with every export, backup, ZIP and Git commit, and anyone with access to the flow can read it. Rotating it means editing every flow that contains it. A credential global variable is stored once, encrypted, referenced by name and rotated in one place."]],
    ["Database, scaling and deployment", "Use PostgreSQL instead of the default SQLite, run multiple workers or replicas, and separate the API from the editor.", [
      "PostgreSQL lets state survive restarts and be shared across replicas.",
      "`--backend-only` serves the API without the visual editor.",
      "Size workers and timeouts for the slowest model calls in your flows.",
    ], ["Production on Kubernetes", "An editor instance for builders runs separately from three backend-only API replicas behind a load balancer, all sharing one managed PostgreSQL database."],
    ["Why separate the editor from the API servers in production?", "The editor is an administrative surface used by few people, while the API serves application traffic. Separating them reduces the attack surface of the public-facing servers, lets each scale independently, and allows strict network rules: only builders can reach the editor, while applications reach only the API."]],
    ["Flow DevOps with LFX", "Version flows as files and run or serve them headlessly with the LFX (Langflow Executor) commands.", [
      "`lfx run` executes a flow JSON once without a server, database or UI.",
      "`lfx serve` exposes flow files over a lightweight FastAPI server.",
      "`lfx push` and `lfx pull` sync versioned flows with a remote instance by stable ID.",
    ], ["Testing flows in CI", "Every pull request that changes a flow JSON runs `lfx run` against a set of sample inputs, and the merge is blocked if outputs fail checks."],
    ["How does LFX change the way you ship Langflow flows?", "Flows become artifacts in version control that can be reviewed, tested in CI with `lfx run`, deployed to a lightweight runtime with `lfx serve`, or synced to a Langflow instance with `lfx push`. That brings normal software practice (code review, automated tests, reproducible deploys) to visually built flows, and removes the need for a full server where only execution is required."],
    [{ path: "terminal.sh", code: "# Run a flow once, headless, and print the result\nuv run lfx run flows/support.json \"Where is order 42?\" --format json\n\n# Serve flow files over HTTP (requires LANGFLOW_API_KEY)\nuv run lfx serve flows/ --env-file .env\n\n# Validate, then sync versioned flows with a remote Langflow instance\nlfx validate flows/support.json\nlfx status\nlfx push" }]],
    ["Observability and tracing", "Read native traces, monitor endpoints and logs, or connect LangSmith or Langfuse to see every component and model call.", [
      "Native traces record one trace per run with spans for each component and LLM call, including tokens and latency.",
      "`/api/v1/monitor/messages` and `/monitor/builds` expose stored messages and component results.",
      "External tracing sends prompts and outputs to a third party, which matters for sensitive data.",
    ], ["Explaining a cost spike", "Traces show one flow's agent looping through a search tool twelve times per question; tightening the instructions halves token usage."],
    ["What would you monitor for a Langflow deployment in production?", "Per-flow request rate, error rate and latency; token usage and cost per flow; tool-call counts per run to catch loops; queue and worker saturation; database health from the health check; and quality signals such as user feedback or evaluator scores from a connected tracing platform. Alert on errors, latency and cost anomalies."]],
    ["Upgrades and migrations", "Pin the Langflow version, read release notes, and run database migrations deliberately when upgrading.", [
      "`langflow migration` previews schema changes; `--fix` applies them.",
      "Component and data-type renames (such as Data to JSON in 1.9) can affect custom code.",
      "Test exported flows on the new version in staging before upgrading production.",
    ], ["A safe minor upgrade", "The team upgrades staging, runs migrations, replays its CI flow tests with LFX, fixes one custom component that used a renamed input, then upgrades production."],
    ["Why pin Langflow's version, and how do you upgrade safely?", "Releases change components, data types and APIs, so an unpinned image can change flow behaviour without anyone deciding to. Upgrade by reading the release notes, backing up the database, applying the version in staging, running migrations, re-running flow tests and custom-component tests, and only then promoting the pinned new version to production."]],
  ],
});
