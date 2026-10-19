/** Original learning exercises grounded in the linked official documentation. */
export type WorkflowLesson = {
  id: string;
  group: string;
  title: string;
  summary: string;
  concepts: string[];
  steps: string[];
  exercise: string;
  sources: { title: string; url: string }[];
};

const source = (title: string, url: string) => ({ title, url });
const agents = source("LangChain: agents", "https://docs.langchain.com/oss/python/langchain/agents");
const persistence = source("LangGraph: persistence", "https://docs.langchain.com/oss/python/langgraph/persistence");
const patterns = source("LangGraph: workflows and agents", "https://docs.langchain.com/oss/python/langgraph/workflows-agents");
const evaluation = source("LangSmith: evaluation", "https://docs.langchain.com/langsmith/evaluation");
const langflow = source("Langflow: Workflow API quickstart", "https://docs.langflow.org/workflow-api-quickstart");
const n8n = source("n8n: LangChain integration", "https://docs.n8n.io/advanced-ai/langchain/overview/");

export const WORKFLOW_LESSONS: WorkflowLesson[] = [
  {
    id: "architecture-review", group: "System Design", title: "Review a system before scaling it",
    summary: "Turn a request path into an architecture review using AWS Well-Architected guidance. System design has no single official website; AWS supplies the framework for this exercise.",
    concepts: ["Reliability: recovery from component failure.", "Performance efficiency: resources matched to demand.", "Cost optimization and sustainability: useful work per resource consumed."],
    steps: ["Draw client, service, queue and database boundaries; record expected load and latency targets.", "Review operational excellence, security, reliability, performance efficiency, cost optimization and sustainability.", "Identify failure points and choose recovery procedures with explicit owners.", "Compare a baseline and a proposed design using a load test and a failure drill."],
    exercise: "Design an order service. Explain what happens when its database is unavailable, and record recovery time, failed requests and cost per order.",
    sources: [source("AWS: Well-Architected Framework", "https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html")],
  },
  {
    id: "langchain-tool-agent", group: "LangChain", title: "Build a typed tool-calling agent",
    summary: "Connect a model to a small tool set with create_agent.",
    concepts: ["Harness: prompt, tools and middleware around the model loop.", "Tool: a callable with an input contract.", "Structured output: a validated response schema."],
    steps: ["Define a read-only product lookup tool with typed arguments.", "Create the agent with a model, tools and a system prompt.", "Invoke it with a user message and inspect the tool result.", "Validate the final answer against a response schema."],
    exercise: "Ask about an unknown product and verify that the agent reports missing data instead of inventing stock.",
    sources: [agents],
  },
  {
    id: "langgraph-resume", group: "LangGraph", title: "Resume a workflow from saved state",
    summary: "Use checkpoints and thread identifiers to preserve a graph run.",
    concepts: ["State: values shared by graph nodes.", "Checkpoint: a saved execution snapshot.", "Thread: the identity used to retrieve saved state."],
    steps: ["Define nodes for intake, review and completion.", "Compile the graph with a checkpointer and invoke it with a thread_id.", "Inspect saved state after a step completes.", "Resume the same thread and verify which work is replayed."],
    exercise: "Restart a worker during a review. Confirm that a durable checkpoint survives and that a retried external write is idempotent.",
    sources: [persistence],
  },
  {
    id: "langflow-api", group: "LangFlow", title: "Turn a visual flow into an API",
    summary: "Build a flow visually, then run it through Langflow's Workflow API.",
    concepts: ["Components: connected units of flow behavior.", "Workflow API: an HTTP execution boundary.", "Execution mode: synchronous, streaming or background."],
    steps: ["Connect input, model and output components in a flow.", "Save the flow and identify the inputs expected by its components.", "Call POST /api/v2/workflows with authentication and the flow configuration.", "Choose an execution mode and inspect the returned result or events."],
    exercise: "Run the same sample from the editor and an HTTP client. Compare outputs and record how your client handles an invalid input.",
    sources: [langflow],
  },
  {
    id: "langsmith-regression", group: "LangSmith", title: "Evaluate an agent before release",
    summary: "Use datasets and experiments to compare changes against a repeatable baseline.",
    concepts: ["Dataset: examples used to test behavior.", "Evaluator: a scoring function or review process.", "Experiment: results from running an application on a dataset."],
    steps: ["Create examples covering ordinary requests, missing context and tool failures.", "Define evaluators for correctness and task completion.", "Run a baseline and a candidate on the same examples.", "Inspect regressions before promoting the candidate; use online evaluation for production behavior."],
    exercise: "Change one prompt instruction and compare results on ten examples. Explain one regression using its trace.",
    sources: [evaluation],
  },
  {
    id: "n8n-ai-routing", group: "n8n", title: "Route incoming requests with an AI workflow",
    summary: "Combine n8n automation nodes with its LangChain-based AI components.",
    concepts: ["Trigger: starts a workflow.", "Cluster nodes: a root node with connected AI sub-nodes.", "Agent tools: operations available to the model."],
    steps: ["Start with a chat or webhook trigger and normalize the request.", "Connect an AI agent to a chat model and a read-only lookup tool.", "Route its result to a review step or a business integration.", "Inspect execution data for missing inputs and tool failures."],
    exercise: "Build a support router using sample tickets. Keep outbound messages in a review queue until you have checked the classification.",
    sources: [n8n],
  },
  {
    id: "python-agent-io", group: "Python with AI and Agentic AI", title: "Coordinate asynchronous agent tools",
    summary: "Use Python concurrency to manage independent tool requests without blocking the event loop.",
    concepts: ["Coroutine: an async function's awaitable execution.", "TaskGroup: structured lifetime management for related tasks.", "Timeout and cancellation: limits on how long work can continue."],
    steps: ["Define async tools with explicit inputs and bounded responses.", "Use asyncio.TaskGroup for independent network requests.", "Wrap work in asyncio.timeout and clean up resources when cancellation occurs.", "Pass validated results to the model; keep blocking I/O outside the event loop."],
    exercise: "Simulate three lookup tools, including one slow tool. Confirm that the timeout ends the operation and that cleanup still runs.",
    sources: [source("Python: coroutines and tasks", "https://docs.python.org/3/library/asyncio-task.html"), agents],
  },
  {
    id: "agentic-terms", group: "Agentic AI core concepts and terms", title: "Read the anatomy of an agent run",
    summary: "Learn the vocabulary by annotating a concrete request, tool call and response.",
    concepts: ["Workflow: predefined execution paths; agent: model-directed tool selection.", "State and memory: current run data and information retained across interactions.", "Routing, parallelization and evaluator loops: different ways to organize execution."],
    steps: ["Write a task with a clear completion condition.", "Mark the model input, tool arguments, tool observation and final response.", "Separate fixed routing rules from choices delegated to the model.", "Identify where shared state, review and termination belong."],
    exercise: "Annotate a product lookup transcript. Explain why a fixed lookup pipeline may be sufficient without an autonomous loop.",
    sources: [patterns, agents],
  },
  {
    id: "nextjs-ai-routing", group: "Next.js with OpenRouter and Vercel AI Gateway", title: "Serve AI responses through a server route",
    summary: "Compare two AI SDK provider configurations in a Next.js application.",
    concepts: ["Server boundary: credentials stay outside browser bundles.", "OpenRouter: an AI SDK provider integration.", "AI Gateway: a gateway configured with a provider/model identifier."],
    steps: ["Create a server Route Handler that validates the request and authenticates the caller.", "Configure OpenRouter using its AI SDK provider and a server environment variable.", "Configure Vercel AI Gateway as an alternative model route with its own credentials.", "Return the SDK response to the UI and handle provider failures, cancellation and usage limits."],
    exercise: "Run the same prompt through each configuration. Compare latency and usage; verify that neither API key appears in browser requests.",
    sources: [source("Next.js: Route Handlers", "https://nextjs.org/docs/app/getting-started/route-handlers"), source("OpenRouter: Vercel AI SDK integration", "https://openrouter.ai/docs/guides/community/vercel-ai-sdk"), source("Vercel: AI Gateway setup", "https://vercel.com/docs/ai-gateway/getting-started")],
  },
  {
    id: "react19-actions", group: "React 19+", title: "Build a form with Actions and optimistic feedback",
    summary: "Coordinate a submission, pending state and an optimistic view using React 19 APIs.",
    concepts: ["Action: an update that can include asynchronous work.", "useActionState: state and pending status for an Action.", "useOptimistic: temporary UI state while an Action runs."],
    steps: ["Model the submitted value, validation result and pending state.", "Connect a form Action through useActionState.", "Apply a temporary optimistic update inside the Action.", "Show the confirmed result or an error and reconcile with the authoritative state."],
    exercise: "Build a feedback form with delayed success and failure responses. Confirm that failed submissions do not leave a false success in the UI.",
    sources: [source("React: useActionState", "https://react.dev/reference/react/useActionState"), source("React: useOptimistic", "https://react.dev/reference/react/useOptimistic")],
  },
  {
    id: "agentic-patterns", group: "Agentic AI", title: "Choose an execution pattern for a research task",
    summary: "Compare routing, parallel work and an evaluator loop before choosing an agent architecture.",
    concepts: ["Router: selects a specialized path.", "Parallelization: independent subtasks run concurrently.", "Evaluator-optimizer: feedback drives another attempt."],
    steps: ["Split research into collection, synthesis and review.", "Use parallel collection only for independent sources.", "Evaluate the draft against explicit acceptance criteria.", "Limit revision attempts and send unresolved results for review."],
    exercise: "Compare a fixed three-step workflow with an evaluator loop on the same research brief. Record completeness, calls and elapsed time.",
    sources: [patterns],
  },
  {
    id: "integrated-agent-workflow", group: "n8n + LangChain + LangGraph + LangSmith + LangFlow", title: "Connect automation, agent execution and evaluation",
    summary: "An integration exercise: n8n handles events, LangGraph coordinates state, LangChain supplies agent tools, Langflow exposes a flow, and LangSmith evaluates results.",
    concepts: ["HTTP contracts separate the services.", "Correlation IDs connect a request to its execution records.", "Persistence and evaluation serve different purposes."],
    steps: ["Receive an event in n8n and call your authenticated graph service over HTTP.", "Run a LangChain agent inside the graph; checkpoint the run using a stable thread identifier.", "Invoke a Langflow Workflow API flow as a separate service when that processing step is needed.", "Instrument supported calls with LangSmith and evaluate saved examples; return a result to n8n."],
    exercise: "Process a sample support ticket end to end. Simulate one service failure and verify that retrying does not create duplicate tickets. This is a proposed architecture, not a built-in connector for every pair of tools.",
    sources: [n8n, persistence, langflow, evaluation],
  },
];
