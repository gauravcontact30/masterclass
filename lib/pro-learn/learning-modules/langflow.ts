import type { LearningModule } from "./module";

export const LANGFLOW_MODULE: LearningModule = {
  technology: "LangFlow",
  definition: "Langflow is an open-source, Python-based tool for building and deploying AI-powered agents and workflows through a visual, low-code interface, where every flow can also be served as an API or exposed as an MCP server.",
  overview: "Langflow sits between notebooks and hand-written orchestration code: you compose models, prompts, vector stores, tools and agents as components on a canvas, test them instantly in the Playground, then call the same flow from any application over HTTP. It shortens the path from an idea to a running RAG pipeline or agent while keeping the escape hatch of custom Python components.",
  architecture: [
    { title: "Architecture: a visual editor over a Python runtime", detail: "Langflow is a FastAPI backend with a React Flow front end. A flow is a directed graph of components saved as JSON; the backend builds the graph, resolves each component's inputs from upstream outputs in dependency order and runs it. The same server exposes the editor, the Playground, the REST API and an MCP server, and it can run in backend-only mode for production." },
    { title: "Under the hood: components and typed ports", detail: "Every node is a Python `Component` class with declared inputs and outputs. Edges connect typed ports such as Message, JSON and Table (named Data and DataFrame before Langflow 1.9), so incompatible connections are rejected in the editor. Built-in components cover chat input and output, prompts, model providers, agents, memory, embeddings, vector stores, document loaders and tools; any component's code can be opened and edited, and custom components are plain Python classes imported from `lfx` (Langflow 1.7 and later)." },
    { title: "Core building blocks: flows, global variables, APIs and MCP", detail: "Global variables store API keys and settings outside the flow JSON. Each flow gets a run endpoint (`/api/v1/run/{flow_id}`) authenticated with an `x-api-key` header, with `session_id` scoping chat memory per conversation and tweaks overriding component parameters per request. Flows in a project can be published as tools on that project's MCP server, so MCP clients such as Claude can call them directly." },
  ],
  code: [
    { path: "terminal.sh", note: "Install and start Langflow locally", code: `uv pip install langflow     # Python 3.10+; installs the server and editor
uv run langflow run         # opens the visual editor at http://localhost:7860` },
    { path: "app/api/ask/route.ts", note: "Call a published flow from a Next.js Route Handler", code: `// Runs a Langflow chat flow server-side so the API key never reaches the browser.
export async function POST(request: Request) {
  const { question, conversationId } = await request.json();

  const response = await fetch(
    \`\${process.env.LANGFLOW_URL}/api/v1/run/\${process.env.LANGFLOW_FLOW_ID}\`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.LANGFLOW_API_KEY!,   // created in Langflow settings
      },
      body: JSON.stringify({
        input_value: question,
        input_type: "chat",
        output_type: "chat",
        session_id: conversationId,                    // separate memory per conversation
      }),
    },
  );
  if (!response.ok) return Response.json({ error: "Flow failed" }, { status: 502 });

  const data = await response.json();
  // The chat output's message lives under the first output of the first run.
  const answer = data.outputs?.[0]?.outputs?.[0]?.results?.message?.text ?? "";
  return Response.json({ answer });
}` },
  ],
  problem: { title: "Slow iteration on AI pipelines locked inside code", scenario: "Without Langflow, every experiment with a different splitter, embedding model, retriever setting or agent prompt means editing code, rerunning scripts and wiring a test UI, and product or domain experts cannot take part. Langflow makes the pipeline a visible graph that anyone on the team can rewire and test in the Playground in seconds, then serves the exact flow that was tested as an API, removing the rewrite between prototype and integration." },
  useCases: [
    { title: "Internal RAG assistant from prototype to API", scenario: "An HR team uploads policy PDFs; an engineer builds a flow of File loader, Split Text, Embeddings and a vector store, plus a retrieval chat flow. HR reviewers test answers in the Playground, and the intranet calls the flow's run endpoint with a per-employee `session_id`." },
    { title: "Tool-using agents exposed over MCP", scenario: "A platform team builds flows for order lookup and incident summaries, then publishes them on the project's MCP server. Developers use them from Claude or Cursor as tools, without anyone writing a separate MCP server." },
    { title: "Rapid evaluation of model and prompt variants", scenario: "A product team duplicates a support-triage flow to compare two models and prompt versions, uses tweaks to override parameters per request in a batch script, and promotes the winning variant by exporting its JSON to version control." },
  ],
  subjective: [
    { rating: "High / Common", question: "How does Langflow execute a flow, and how does that affect how you design components?", answer: "The backend loads the flow JSON, builds a graph of component vertices and determines an execution order from the edges, so each component runs once its upstream inputs are available. Inputs arrive as typed values (Message, JSON, Table), and each component's output method produces the value passed downstream. Because components are plain Python classes executed by the server, they should be small, single-purpose, side-effect-aware and explicit about their input and output types; heavy clients should be created once rather than per call, and secrets should come from global variables rather than being typed into fields stored in the flow JSON." },
    { rating: "Critical for Senior Roles", question: "What changes when you take a Langflow deployment from a laptop to production?", answer: "Run it as a container in backend-only mode behind a reverse proxy with TLS, disable auto-login and require API keys, and move from the default SQLite database to PostgreSQL so state survives restarts and multiple instances. Keep secrets in global variables populated from environment variables, export flows as JSON into version control and promote them through environments, pin the Langflow version, and size workers for the slowest model calls. Add observability by connecting a tracing integration such as LangSmith, and put rate limiting and authentication in front of public endpoints because each run spends model credits." },
    { rating: "Common in architecture discussions", question: "When would you choose Langflow over writing LangChain or LangGraph code directly, and when not?", answer: "Choose Langflow when speed of iteration and collaboration matter more than fine-grained control: prototyping RAG pipelines, letting non-engineers tune prompts, standing up internal tools quickly, or exposing flows over an API or MCP with little code. Prefer code when you need complex deterministic control flow, durable long-running execution with interrupts, strict testing and code review of every change, unusual performance tuning, or deep integration with an existing codebase. Many teams combine them: prototype in Langflow, then either serve the flow or reimplement the proven design in LangGraph." },
  ],
  objective: [
    { question: "How does an external application run a published Langflow flow?", options: ["By importing the flow JSON into the browser", "By sending a POST request to `/api/v1/run/{flow_id}` with an `x-api-key` header", "By connecting directly to Langflow's SQLite file", "Flows can only run inside the Playground"], answer: 1, explanation: "Each flow is served over the REST run endpoint, authenticated with a Langflow API key. The JSON is the flow's definition, not something the client executes; the database is internal storage; and the Playground is only for testing." },
    { question: "What is the recommended way to supply an LLM provider's API key to components in a flow?", options: ["Type it into the component field so it is saved in the flow JSON", "Store it as a global variable (credential), ideally sourced from an environment variable", "Put it in the flow's description", "Pass it in the chat message"], answer: 1, explanation: "Global variables keep secrets out of exported flow JSON and can be loaded from the environment, which is what production deployments need. Keys typed into fields or descriptions travel with the flow, and sending them in chat exposes them to the model and logs." },
    { question: "What does `session_id` control when calling a chat flow?", options: ["Which flow version runs", "Which conversation's message history the memory components read and write", "The model's temperature", "The API key's permissions"], answer: 1, explanation: "`session_id` scopes chat memory, so each user conversation keeps its own history. Flow selection is by flow ID, temperature is a component parameter (overridable with tweaks), and permissions come from the API key." },
  ],
  keyPoints: [
    "A flow is a graph of Python components connected by typed ports (Message, JSON, Table), saved as JSON.",
    "Every flow is an API: `POST /api/v1/run/{flow_id}` with an `x-api-key` header.",
    "Global variables keep secrets out of exported flows.",
    "Projects can publish flows as tools on an MCP server.",
  ],
  sources: [
    { title: "Langflow documentation", url: "https://docs.langflow.org/" },
    { title: "Get started: quickstart", url: "https://docs.langflow.org/get-started-quickstart" },
    { title: "Trigger flows with the Langflow API", url: "https://docs.langflow.org/concepts-publish" },
    { title: "Langflow as an MCP server", url: "https://docs.langflow.org/mcp-server" },
  ],
};
