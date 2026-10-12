import type { ApiDetail } from "./api-docs-details";

/**
 * Extra reference for the "Agentic AI frameworks" category: Deep Agents,
 * LangChain, LangGraph, the partner integrations, LangSmith and Langflow.
 *
 * Written from the official documentation at docs.langchain.com and
 * docs.langflow.org (October 2026). Each `add` call creates one catalog row and
 * its authored page; AGENTIC_ADDITIONS is appended to api-docs-catalog.json by
 * name, so the two can't drift. Every entry, old and new, also gets a section,
 * which is how the API Docs page groups a framework's list.
 */
const LANGCHAIN_DOCS = "https://docs.langchain.com";
const LANGFLOW_DOCS = "https://docs.langflow.org";
const lines = (...rows: string[]) => rows.join("\n");

export const AGENTIC_PACKAGE_IDS = ["deepagents", "langchain", "langgraph", "integrations", "langsmith", "langflow"] as const;
type Pkg = (typeof AGENTIC_PACKAGE_IDS)[number];
type Draft = Omit<ApiDetail, "source" | "language" | "related"> & { page: string; language?: ApiDetail["language"]; related?: string[] };

export const AGENTIC_ADDITIONS: Record<Pkg, { name: string; kind: string; status: string }[]> = { deepagents: [], langchain: [], langgraph: [], integrations: [], langsmith: [], langflow: [] };
const DETAILS: Record<string, ApiDetail> = {};
const SECTION_ORDER: Record<Pkg, string[]> = { deepagents: [], langchain: [], langgraph: [], integrations: [], langsmith: [], langflow: [] };
const SECTION_OF = new Map<string, string>();

function sections(pkg: Pkg, names: string[]) { SECTION_ORDER[pkg] = names; }
/** Put entries that already exist in the catalog under a section heading. */
function place(pkg: Pkg, section: string, names: string[]) { for (const name of names) SECTION_OF.set(`${pkg}:${name}`, section); }
function add(pkg: Pkg, section: string, name: string, kind: string, status: string, { page, language = "python", related = [], ...draft }: Draft) {
  AGENTIC_ADDITIONS[pkg].push({ name, kind, status });
  SECTION_OF.set(`${pkg}:${name}`, section);
  const base = pkg === "langflow" ? LANGFLOW_DOCS : LANGCHAIN_DOCS;
  DETAILS[`${pkg}:${name}`] = { ...draft, language, related, source: page.startsWith("http") ? page : `${base}/${page}` };
}

/* ═════════════════════════════ Deep Agents ═════════════════════════════ */

sections("deepagents", ["Agent harness", "Built-in tools", "Subagents", "Backends & sandboxes", "Skills, memory & permissions", "Middleware"]);
place("deepagents", "Agent harness", ["create_deep_agent", "DeepAgentState", "HarnessProfile", "HarnessProfileConfig", "ProviderProfile", "GeneralPurposeSubagentProfile", "ExecutionBudget", "PlanMilestone", "BudgetExceededError", "MemoryScratchpad", "AgentCheckpointer"]);
place("deepagents", "Built-in tools", ["read_file", "write_file", "edit_file", "delete_file", "ls", "glob", "grep", "execute_bash", "find_by_name", "view_file_outline", "verify_solution"]);
place("deepagents", "Subagents", ["SubagentConfig", "SubagentResult", "SubagentDelegateMiddleware"]);
place("deepagents", "Backends & sandboxes", ["SandboxEnvironment", "DockerSandbox", "LocalFilesystemSandbox"]);
place("deepagents", "Middleware", ["NemotronToolCallShim", "ReadFileContinuationNoticeMiddleware", "ModelRateLimitRetryMiddleware", "ChatNVIDIAMessageCompatibilityMiddleware", "FollowupDisciplineMiddleware", "EntityResolutionGuardMiddleware", "FinalAnswerGuardMiddleware", "ContextWindowGuardMiddleware", "ToolOutputTruncationMiddleware", "ToolDisciplinePolicy"]);

add("deepagents", "Built-in tools", "write_todos", "F", "s", {
  page: "oss/python/deepagents/tools",
  packageName: "langchain.agents.middleware (TodoListMiddleware)",
  description: "The planning tool. The agent writes and updates a todo list for a long task, so it can break work into steps and track what is done, in progress and pending.",
  signature: "write_todos(todos: list[{ content: str, status: 'pending' | 'in_progress' | 'completed' }])",
  parameters: [{ name: "todos", type: "list[dict]", description: "The full, updated list. Each item has the task text and its status." }],
  returns: "The todo list is saved in agent state under `todos`, where a UI or a later step can read it.",
  notes: [
    "It comes from TodoListMiddleware. In recent Deep Agents releases planning is opt-in: add the middleware to enable it.",
    "Planning helps most on multi-step research and coding tasks; for one-shot questions it only adds tokens.",
    "Stream the `todos` key to show live progress in a front end.",
  ],
  useCases: ["Long research tasks with several sub-questions", "Coding tasks that touch many files", "Showing an agent's plan to the user"],
  code: lines(
    "from deepagents import create_deep_agent",
    "from langchain.agents.middleware import TodoListMiddleware",
    "",
    "agent = create_deep_agent(",
    "    model=\"anthropic:claude-sonnet-5\",",
    "    middleware=[TodoListMiddleware()],",
    ")",
    "result = agent.invoke({\"messages\": [{\"role\": \"user\", \"content\": \"Audit the repo and list risky dependencies\"}]})",
    "print(result[\"todos\"])",
  ),
  related: ["create_deep_agent", "task", "DeepAgentState"],
});

add("deepagents", "Built-in tools", "task", "F", "s", {
  page: "oss/python/deepagents/subagents",
  packageName: "deepagents (SubAgentMiddleware)",
  description: "The delegation tool. The main agent calls task to hand a self-contained job to a subagent, which works in its own context window and returns only its final answer.",
  signature: "task(description: str, subagent_type: str)",
  parameters: [
    { name: "description", type: "str", description: "Everything the subagent needs to know; it does not see the parent's conversation in isolated mode." },
    { name: "subagent_type", type: "str", description: "The `name` of a configured subagent, or \"general-purpose\"." },
  ],
  returns: "The subagent's final message, added to the parent's history as one tool result.",
  notes: [
    "Delegation keeps the parent's context small: intermediate tool calls stay inside the subagent.",
    "A general-purpose subagent with the parent's tools is always available.",
    "Several task calls in one turn run in parallel.",
  ],
  useCases: ["Researching several topics in parallel", "Isolating a noisy, tool-heavy job", "Routing work to a specialist with its own prompt and tools"],
  code: lines(
    "from deepagents import create_deep_agent",
    "",
    "critic = {",
    "    \"name\": \"critic\",",
    "    \"description\": \"Reviews a draft report and lists concrete fixes\",",
    "    \"system_prompt\": \"You are a strict technical editor.\",",
    "}",
    "agent = create_deep_agent(model=\"openai:gpt-5.5\", subagents=[critic])",
    "agent.invoke({\"messages\": [{\"role\": \"user\", \"content\": \"Draft a report, then ask the critic to review it\"}]})",
  ),
  related: ["SubAgent", "CompiledSubAgent", "SubAgentMiddleware", "AsyncSubAgent"],
});

add("deepagents", "Built-in tools", "execute", "F", "s", {
  page: "oss/python/deepagents/sandboxes",
  packageName: "deepagents (sandbox backends)",
  description: "Runs a shell command. The tool is added only when the agent's backend can execute commands: a sandbox backend or LocalShellBackend.",
  signature: "execute(command: str) -> output, exit code",
  parameters: [{ name: "command", type: "str", description: "The shell command to run inside the backend's environment." }],
  returns: "The combined output and the exit code; long output is truncated.",
  notes: [
    "With the default StateBackend there is no shell, so the tool is hidden from the model.",
    "Sandboxes (LangSmith, Daytona, E2B, Modal, Runloop, Vercel and others) isolate commands from your machine.",
    "LocalShellBackend runs commands on the host with no isolation; use it only for trusted local work.",
  ],
  useCases: ["Running tests after editing code", "Installing packages in a sandbox", "Data analysis with Python scripts"],
  code: lines(
    "from daytona import Daytona",
    "from deepagents import create_deep_agent",
    "from langchain_daytona import DaytonaSandbox",
    "",
    "backend = DaytonaSandbox(sandbox=Daytona().create())",
    "agent = create_deep_agent(model=\"anthropic:claude-sonnet-5\", backend=backend)",
    "agent.invoke({\"messages\": [{\"role\": \"user\", \"content\": \"Run the test suite and fix failures\"}]})",
  ),
  related: ["LocalShellBackend", "SandboxBackendProtocol", "execute_bash"],
});

add("deepagents", "Subagents", "SubAgent", "T", "s", {
  page: "oss/python/deepagents/subagents",
  packageName: "deepagents.middleware.subagents",
  description: "A dictionary that defines a custom subagent: its name, when to use it, its prompt, and optionally its own tools, model, middleware and skills.",
  signature: "{ name, description, system_prompt, mode?, tools?, model?, middleware?, interrupt_on?, skills?, response_format?, permissions? }",
  parameters: [
    { name: "name / description", type: "str", description: "Required. The main agent picks a subagent from its description." },
    { name: "system_prompt", type: "str", description: "Required in isolated mode; it is not inherited." },
    { name: "mode", type: "\"isolated\" | \"fork\"", description: "Defaults to isolated. Fork inherits the parent's conversation and system prompt." },
    { name: "tools / model", type: "list | str", description: "Override the inherited tools or use a different model, e.g. 'openai:gpt-5.5'." },
    { name: "response_format", type: "ResponseFormat", description: "Structured output schema; the parent receives JSON. Needs deepagents>=0.5.3." },
  ],
  returns: "A spec passed in `subagents=[...]` to create_deep_agent.",
  notes: ["Middleware, skills and permissions are not inherited unless set.", "`interrupt_on` is inherited and needs a checkpointer."],
  useCases: ["A research specialist with a search tool", "A cheaper model for routine sub-tasks", "A reviewer that returns structured findings"],
  code: lines(
    "from deepagents import create_deep_agent",
    "",
    "def internet_search(query: str) -> str:",
    "    \"\"\"Run a web search.\"\"\"",
    "    return f\"results for {query}\"",
    "",
    "researcher = {",
    "    \"name\": \"research-agent\",",
    "    \"description\": \"Use for in-depth research questions\",",
    "    \"system_prompt\": \"You are a careful researcher.\",",
    "    \"tools\": [internet_search],",
    "    \"model\": \"openai:gpt-5.5\",",
    "}",
    "agent = create_deep_agent(model=\"anthropic:claude-sonnet-5\", subagents=[researcher])",
  ),
  related: ["CompiledSubAgent", "task", "SubAgentMiddleware"],
});

add("deepagents", "Subagents", "CompiledSubAgent", "C", "s", {
  page: "oss/python/deepagents/subagents",
  packageName: "deepagents",
  description: "Wraps an already-built LangGraph graph or LangChain agent as a subagent, so any custom workflow can be delegated to with task.",
  signature: "CompiledSubAgent(name: str, description: str, runnable: Runnable, mode='isolated')",
  parameters: [
    { name: "runnable", type: "Runnable", description: "A compiled graph; call .compile() first." },
    { name: "name / description", type: "str", description: "How the main agent identifies and chooses it." },
  ],
  returns: "A subagent spec for `subagents=[...]`.",
  notes: ["The runnable's state must include `messages`; its last message becomes the result.", "Use it for deterministic pipelines that shouldn't be free-form agents."],
  useCases: ["Reusing an existing LangGraph workflow", "A data-analysis agent with its own graph", "Mixing hand-built and dictionary subagents"],
  code: lines(
    "from deepagents import CompiledSubAgent, create_deep_agent",
    "from langchain.agents import create_agent",
    "",
    "analyst = create_agent(model=\"openai:gpt-5.5\", tools=[], system_prompt=\"You analyse tabular data.\")",
    "data_subagent = CompiledSubAgent(",
    "    name=\"data-analyzer\",",
    "    description=\"Specialised agent for complex data analysis\",",
    "    runnable=analyst,",
    ")",
    "agent = create_deep_agent(model=\"anthropic:claude-sonnet-5\", subagents=[data_subagent])",
  ),
  related: ["SubAgent", "task"],
});

add("deepagents", "Subagents", "AsyncSubAgent", "C", "p", {
  page: "oss/python/deepagents/async-subagents",
  packageName: "deepagents",
  description: "A background subagent that runs on an Agent Protocol server. The supervisor starts it, keeps working, and checks, steers or cancels it later.",
  signature: "AsyncSubAgent(name: str, description: str, graph_id: str, url: str | None = None)",
  parameters: [
    { name: "graph_id", type: "str", description: "The graph or assistant ID on the server; must match langgraph.json for LangGraph deployments." },
    { name: "url", type: "str | None", description: "Omit for a co-deployed graph (ASGI transport); set it for a remote deployment over HTTP." },
  ],
  returns: "A spec for `subagents=[...]`; the supervisor gets start_async_task, check_async_task, update_async_task, cancel_async_task and list_async_tasks.",
  notes: ["Suited to long-running or parallel work that needs mid-flight steering.", "Added by AsyncSubAgentMiddleware when async subagents are configured."],
  useCases: ["Parallel research and coding workstreams", "Jobs that outlive a single model turn"],
  code: lines(
    "from deepagents import AsyncSubAgent, create_deep_agent",
    "",
    "agent = create_deep_agent(",
    "    model=\"google_genai:gemini-3.6-flash\",",
    "    subagents=[",
    "        AsyncSubAgent(name=\"researcher\", description=\"Gathers and synthesises information\", graph_id=\"researcher\"),",
    "        AsyncSubAgent(name=\"coder\", description=\"Writes and reviews code\", graph_id=\"coder\"),",
    "    ],",
    ")",
  ),
  related: ["SubAgent", "task"],
});

add("deepagents", "Subagents", "SubAgentMiddleware", "C", "s", {
  page: "oss/python/deepagents/subagents",
  packageName: "deepagents.middleware.subagents",
  description: "The middleware that adds the task tool and runs subagents. create_deep_agent includes it; add it yourself to give subagents to a plain create_agent agent.",
  signature: "SubAgentMiddleware(default_model, default_tools=[], subagents=[])",
  parameters: [
    { name: "default_model", type: "str | BaseChatModel", description: "Model for subagents that don't set one." },
    { name: "default_tools", type: "list", description: "Tools inherited by subagents that don't set their own." },
    { name: "subagents", type: "list[SubAgent | CompiledSubAgent]", description: "The specialists the agent can delegate to." },
  ],
  returns: "Middleware for `middleware=[...]`.",
  notes: ["Each subagent runs in a fresh context and returns one message.", "Use it to add delegation without the rest of the deep agent harness."],
  useCases: ["Adding delegation to an existing LangChain agent"],
  code: lines(
    "from langchain.agents import create_agent",
    "from deepagents.middleware.subagents import SubAgentMiddleware",
    "",
    "agent = create_agent(",
    "    model=\"openai:gpt-5.5\",",
    "    middleware=[SubAgentMiddleware(default_model=\"openai:gpt-5.5\", subagents=[])],",
    ")",
  ),
  related: ["task", "SubAgent", "FilesystemMiddleware"],
});

add("deepagents", "Backends & sandboxes", "StateBackend", "C", "s", {
  page: "oss/python/deepagents/backends",
  packageName: "deepagents.backends",
  description: "The default backend. Files the agent writes live in LangGraph state for the current thread, so they persist across turns in that thread but not between threads.",
  signature: "StateBackend()",
  parameters: [],
  returns: "A backend for `backend=`.",
  notes: ["Needs a checkpointer for files to survive between invocations.", "Nothing touches your disk, which makes it safe for hosted agents."],
  useCases: ["Scratch files and plans for one conversation", "The default route in a CompositeBackend"],
  code: lines(
    "from deepagents import create_deep_agent",
    "from deepagents.backends import StateBackend",
    "from langgraph.checkpoint.memory import InMemorySaver",
    "",
    "agent = create_deep_agent(model=\"openai:gpt-5.5\", backend=StateBackend(), checkpointer=InMemorySaver())",
  ),
  related: ["CompositeBackend", "StoreBackend", "FilesystemBackend"],
});

add("deepagents", "Backends & sandboxes", "FilesystemBackend", "C", "s", {
  page: "oss/python/deepagents/backends",
  packageName: "deepagents.backends",
  description: "Reads and writes real files under a root directory on the machine running the agent.",
  signature: "FilesystemBackend(root_dir: str, virtual_mode: bool = False)",
  parameters: [
    { name: "root_dir", type: "str", description: "The directory the agent works in." },
    { name: "virtual_mode", type: "bool", description: "When True, paths are confined to root_dir. The docs recommend True; False applies no path restriction." },
  ],
  returns: "A backend for `backend=`.",
  notes: ["Use with filesystem permissions to stop writes outside allowed paths.", "Pair with LocalShellBackend if the agent must also run commands."],
  useCases: ["Local coding agents", "Persisting memories to a folder"],
  code: lines(
    "from deepagents import create_deep_agent",
    "from deepagents.backends import FilesystemBackend",
    "",
    "backend = FilesystemBackend(root_dir=\"./workspace\", virtual_mode=True)",
    "agent = create_deep_agent(model=\"anthropic:claude-sonnet-5\", backend=backend)",
  ),
  related: ["LocalShellBackend", "CompositeBackend", "FilesystemPermission"],
});

add("deepagents", "Backends & sandboxes", "LocalShellBackend", "C", "s", {
  page: "oss/python/deepagents/backends",
  packageName: "deepagents.backends",
  description: "FilesystemBackend plus the execute tool: shell commands run directly on the host, with no sandboxing.",
  signature: "LocalShellBackend(root_dir, virtual_mode=False, env=None, inherit_env=..., timeout=120, max_output_bytes=100_000)",
  parameters: [
    { name: "timeout", type: "int", description: "Seconds before a command is stopped (default 120)." },
    { name: "max_output_bytes", type: "int", description: "Output kept per command (default 100,000)." },
    { name: "env / inherit_env", type: "dict / bool", description: "Environment variables for commands." },
  ],
  returns: "A backend for `backend=`.",
  notes: ["Commands can do anything your user account can; prefer a sandbox for untrusted tasks.", "Combine with human-in-the-loop approval for execute."],
  useCases: ["Trusted local development agents"],
  code: lines(
    "from deepagents import create_deep_agent",
    "from deepagents.backends import LocalShellBackend",
    "",
    "agent = create_deep_agent(",
    "    model=\"anthropic:claude-sonnet-5\",",
    "    backend=LocalShellBackend(root_dir=\".\", virtual_mode=True, timeout=60),",
    "    interrupt_on={\"execute\": True},",
    ")",
  ),
  related: ["execute", "FilesystemBackend", "interrupt_on"],
});

add("deepagents", "Backends & sandboxes", "StoreBackend", "C", "s", {
  page: "oss/python/deepagents/backends",
  packageName: "deepagents.backends",
  description: "Keeps files in a LangGraph store, so they persist across threads: long-term memory shared per user, per assistant or globally.",
  signature: "StoreBackend(namespace: Callable[[Runtime], tuple[str, ...]], store: BaseStore | None = None)",
  parameters: [
    { name: "namespace", type: "Callable", description: "Builds the namespace from the runtime, e.g. per user: lambda rt: (rt.server_info.user.identity,)." },
    { name: "store", type: "BaseStore", description: "Omit on LangSmith Deployment, which provides one." },
  ],
  returns: "A backend for `backend=` or a CompositeBackend route.",
  notes: ["Usually routed to a prefix such as /memories/ while scratch files stay in state."],
  useCases: ["User preferences remembered across chats", "Shared team knowledge files"],
  code: lines(
    "from deepagents.backends import StoreBackend",
    "from langgraph.store.memory import InMemoryStore",
    "",
    "backend = StoreBackend(",
    "    namespace=lambda rt: (rt.execution_info.thread_id,),",
    "    store=InMemoryStore(),",
    ")",
  ),
  related: ["CompositeBackend", "StateBackend"],
});

add("deepagents", "Backends & sandboxes", "CompositeBackend", "C", "s", {
  page: "oss/python/deepagents/backends",
  packageName: "deepagents.backends",
  description: "Routes file paths by prefix to different backends: for example scratch files to state and /memories/ to disk or a store.",
  signature: "CompositeBackend(default: Backend, routes: dict[str, Backend])",
  parameters: [
    { name: "default", type: "Backend", description: "Used for any path that matches no route." },
    { name: "routes", type: "dict", description: "Path prefix → backend. When prefixes overlap, the longer one wins." },
  ],
  returns: "A backend for `backend=`.",
  notes: ["ls, glob and grep merge results from every backend and keep the original prefixes."],
  useCases: ["Ephemeral workspace plus persistent memory", "Read-only reference docs next to a writable workspace"],
  code: lines(
    "from deepagents import create_deep_agent",
    "from deepagents.backends import CompositeBackend, FilesystemBackend, StateBackend",
    "",
    "agent = create_deep_agent(",
    "    model=\"google_genai:gemini-3.6-flash\",",
    "    backend=CompositeBackend(",
    "        default=StateBackend(),",
    "        routes={\"/memories/\": FilesystemBackend(root_dir=\"/deepagents/myagent\", virtual_mode=True)},",
    "    ),",
    ")",
  ),
  related: ["StateBackend", "FilesystemBackend", "StoreBackend"],
});

add("deepagents", "Backends & sandboxes", "BackendProtocol", "I", "s", {
  page: "oss/python/deepagents/backends",
  packageName: "deepagents.backends.protocol",
  description: "The interface every backend implements. Subclass it to store agent files anywhere: a database, object storage or an API.",
  signature: "ls(path) · read(file_path, offset, limit) · write(file_path, content) · edit(file_path, old_string, new_string, replace_all) · glob(pattern, path) · grep(pattern, path, glob) · delete(file_path)",
  parameters: [{ name: "delete", type: "method", description: "Optional. If unsupported, the delete tool is hidden from the model." }],
  returns: "Structured results (LsResult, ReadResult, WriteResult...) with an `error` field instead of raised exceptions.",
  notes: ["Return errors as data so the model can recover.", "Add `execute` by implementing SandboxBackendProtocol."],
  useCases: ["Storing agent files in S3 or a database"],
  code: lines(
    "from deepagents.backends.protocol import BackendProtocol",
    "",
    "class S3Backend(BackendProtocol):",
    "    def read(self, file_path, offset=0, limit=2000):",
    "        ...",
    "    def write(self, file_path, content):",
    "        ...",
  ),
  related: ["SandboxBackendProtocol", "CompositeBackend"],
});

add("deepagents", "Backends & sandboxes", "SandboxBackendProtocol", "I", "s", {
  page: "oss/python/deepagents/sandboxes",
  packageName: "deepagents.backends.protocol",
  description: "BackendProtocol plus execute. Sandbox integrations such as DaytonaSandbox, E2BSandbox, ModalSandbox, RunloopSandbox, VercelSandbox and LangSmithSandbox implement it.",
  signature: "execute(command: str) -> ExecuteResponse(output, exit_code, truncated)",
  parameters: [],
  returns: "A backend that gives the agent the execute tool.",
  notes: ["Sandbox classes live in partner packages, e.g. langchain-daytona.", "Each run gets an isolated machine, so the agent can install and run anything safely."],
  useCases: ["Coding agents that run tests", "Data analysis in a disposable machine"],
  code: lines(
    "from daytona import Daytona",
    "from langchain_daytona import DaytonaSandbox",
    "",
    "backend = DaytonaSandbox(sandbox=Daytona().create())",
    "result = backend.execute(\"python --version\")",
    "print(result.output)",
  ),
  related: ["execute", "BackendProtocol"],
});

add("deepagents", "Skills, memory & permissions", "skills", "M", "s", {
  page: "oss/python/deepagents/skills",
  packageName: "deepagents (create_deep_agent skills=)",
  description: "Skills are folders with a SKILL.md file (the Agent Skills standard). The agent sees each skill's name and description and loads the full instructions only when a task needs them.",
  signature: "create_deep_agent(..., skills=[\"./skills/\"])  ·  SKILL.md front matter: name, description",
  parameters: [{ name: "skills", type: "list[str]", description: "Directories that contain skill folders, read through the agent's backend." }],
  returns: "Skills the agent can read on demand.",
  notes: ["Progressive disclosure keeps the prompt small even with many skills.", "A skill can bundle scripts and reference files next to SKILL.md.", "Subagents don't inherit skills, except the general-purpose one."],
  useCases: ["Company-specific procedures", "Reusable workflows such as PDF handling"],
  code: lines(
    "from deepagents import create_deep_agent",
    "",
    "# skills/pdf/SKILL.md starts with front matter: name: pdf / description: Helps with PDFs.",
    "agent = create_deep_agent(model=\"anthropic:claude-sonnet-5\", skills=[\"./skills/\"])",
  ),
  related: ["memory (AGENTS.md)", "create_deep_agent"],
});

add("deepagents", "Skills, memory & permissions", "memory (AGENTS.md)", "M", "s", {
  page: "oss/python/deepagents/memory",
  packageName: "deepagents (create_deep_agent memory=)",
  description: "Persistent instructions from AGENTS.md files, loaded into the system prompt at start. The agent can edit the file to remember preferences for next time.",
  signature: "create_deep_agent(..., memory=[\"/memories/AGENTS.md\"])",
  parameters: [{ name: "memory", type: "list[str]", description: "Paths to AGENTS.md files, read through the backend." }],
  returns: "Instructions that persist across sessions when the path is on a persistent backend.",
  notes: ["Route /memories/ to a StoreBackend or FilesystemBackend so edits survive.", "Keep the file short; it is sent on every call."],
  useCases: ["Remembering a user's coding style", "Project conventions for a coding agent"],
  code: lines(
    "from deepagents import create_deep_agent",
    "from deepagents.backends import CompositeBackend, FilesystemBackend, StateBackend",
    "",
    "agent = create_deep_agent(",
    "    model=\"openai:gpt-5.5\",",
    "    memory=[\"/memories/AGENTS.md\"],",
    "    backend=CompositeBackend(default=StateBackend(), routes={\"/memories/\": FilesystemBackend(root_dir=\"./mem\", virtual_mode=True)}),",
    ")",
  ),
  related: ["skills", "StoreBackend", "CompositeBackend"],
});

add("deepagents", "Skills, memory & permissions", "FilesystemPermission", "C", "s", {
  page: "oss/python/deepagents/permissions",
  packageName: "deepagents",
  description: "A rule that allows or denies file operations on matching paths, enforced before the agent's file tools run.",
  signature: "FilesystemPermission(operations: list['read' | 'write'], paths: list[str], mode: 'allow' | 'deny')",
  parameters: [
    { name: "operations", type: "list", description: "Which operations the rule covers." },
    { name: "paths", type: "list[str]", description: "Glob patterns such as /** or /secrets/**." },
    { name: "mode", type: "str", description: "allow or deny." },
  ],
  returns: "A rule for `permissions=[...]`.",
  notes: ["A subagent's permissions replace the parent's entirely when set.", "Combine with virtual_mode=True on FilesystemBackend."],
  useCases: ["A read-only analysis agent", "Protecting configuration or secrets folders"],
  code: lines(
    "from deepagents import FilesystemPermission, create_deep_agent",
    "",
    "agent = create_deep_agent(",
    "    model=\"openai:gpt-5.5\",",
    "    permissions=[FilesystemPermission(operations=[\"write\"], paths=[\"/**\"], mode=\"deny\")],",
    ")",
  ),
  related: ["FilesystemBackend", "interrupt_on"],
});

add("deepagents", "Skills, memory & permissions", "interrupt_on", "M", "s", {
  page: "oss/python/deepagents/human-in-the-loop",
  packageName: "deepagents (create_deep_agent interrupt_on=)",
  description: "Human-in-the-loop for tools. Named tool calls pause the run so a person can approve, edit or reject them before they execute.",
  signature: "interrupt_on={\"edit_file\": True, \"execute\": {\"allowed_decisions\": [\"approve\", \"reject\"]}}",
  parameters: [{ name: "tool name → True | config", type: "dict", description: "True uses the default decisions; a config limits them." }],
  returns: "The run pauses with an interrupt; resume with Command(resume={\"decisions\": [...]}).",
  notes: ["Requires a checkpointer, because the paused state must be saved.", "Subagents inherit interrupt_on by default."],
  useCases: ["Approving file edits", "Gating shell commands or emails"],
  code: lines(
    "from deepagents import create_deep_agent",
    "from langgraph.checkpoint.memory import InMemorySaver",
    "from langgraph.types import Command",
    "",
    "agent = create_deep_agent(model=\"openai:gpt-5.5\", interrupt_on={\"edit_file\": True}, checkpointer=InMemorySaver())",
    "config = {\"configurable\": {\"thread_id\": \"review-1\"}}",
    "agent.invoke({\"messages\": [{\"role\": \"user\", \"content\": \"Fix the typo in README.md\"}]}, config)",
    "agent.invoke(Command(resume={\"decisions\": [{\"type\": \"approve\"}]}), config)",
  ),
  related: ["create_deep_agent", "LocalShellBackend"],
});

add("deepagents", "Middleware", "FilesystemMiddleware", "C", "s", {
  page: "oss/python/deepagents/tools",
  packageName: "deepagents.middleware.filesystem",
  description: "Adds the file tools (ls, read_file, write_file, edit_file, glob, grep, delete, and execute on shell backends) backed by any backend. Usable on plain LangChain agents too.",
  signature: "FilesystemMiddleware(backend=None, system_prompt=None, custom_tool_descriptions=None, tools=None)",
  parameters: [
    { name: "backend", type: "Backend", description: "Where files live; defaults to state." },
    { name: "tools", type: "list[str]", description: "Allowlist of tool names to expose." },
    { name: "custom_tool_descriptions", type: "dict", description: "Override what the model reads about each tool." },
  ],
  returns: "Middleware for `middleware=[...]`.",
  notes: ["Large tool results can be offloaded to files to save context."],
  useCases: ["Giving any agent a scratch filesystem", "A read-only toolset via the tools allowlist"],
  code: lines(
    "from langchain.agents import create_agent",
    "from deepagents.middleware import FilesystemMiddleware",
    "",
    "agent = create_agent(",
    "    model=\"openai:gpt-5.5\",",
    "    middleware=[FilesystemMiddleware(tools=[\"ls\", \"read_file\", \"grep\"])],",
    ")",
  ),
  related: ["SubAgentMiddleware", "BackendProtocol"],
});

add("deepagents", "Middleware", "RubricMiddleware", "C", "p", {
  page: "oss/python/deepagents/rubric",
  packageName: "deepagents",
  description: "Self-evaluation loop (beta). A grader model checks the agent's answer against a rubric and sends it back to revise until it passes or runs out of iterations.",
  signature: "RubricMiddleware(model: str, max_iterations: int = 3, on_evaluation=None)",
  parameters: [
    { name: "model", type: "str", description: "The grader model." },
    { name: "max_iterations", type: "int", description: "How many grade-and-revise rounds are allowed." },
    { name: "on_evaluation", type: "Callable", description: "Called with each RubricEvaluation, for logging or UI." },
  ],
  returns: "Middleware; pass a `rubric` string in the input state to start grading.",
  notes: ["Needs a checkpointer.", "Works with invoke(), stream() and stream_events()."],
  useCases: ["Enforcing output requirements", "Collecting grading data for evals"],
  code: lines(
    "from deepagents import RubricMiddleware, create_deep_agent",
    "from langgraph.checkpoint.memory import InMemorySaver",
    "",
    "agent = create_deep_agent(",
    "    model=\"google_genai:gemini-3.6-flash\",",
    "    middleware=[RubricMiddleware(model=\"anthropic:claude-haiku-4-5\", max_iterations=3)],",
    "    checkpointer=InMemorySaver(),",
    ")",
    "agent.invoke(",
    "    {\"messages\": [{\"role\": \"user\", \"content\": \"Write a haiku about spring\"}], \"rubric\": \"- Three lines\\n- 5-7-5 syllables\"},",
    "    {\"configurable\": {\"thread_id\": \"rubric-1\"}},",
    ")",
  ),
  related: ["create_deep_agent", "FilesystemMiddleware"],
});

add("deepagents", "Middleware", "CodeInterpreterMiddleware", "C", "p", {
  page: "oss/python/deepagents/interpreters",
  packageName: "langchain_quickjs",
  description: "Adds an eval tool that runs JavaScript in a QuickJS interpreter, so the agent can do stateful calculations and deterministic data transforms without a full sandbox.",
  signature: "CodeInterpreterMiddleware()",
  parameters: [],
  returns: "Middleware for `middleware=[...]`.",
  notes: ["Requires langchain-quickjs>=0.2.0 and Python 3.11+.", "Lighter than a sandbox: no shell and no network."],
  useCases: ["Arithmetic and data reshaping", "Keeping intermediate values between tool calls"],
  code: lines(
    "from deepagents import create_deep_agent",
    "from langchain_quickjs import CodeInterpreterMiddleware",
    "",
    "agent = create_deep_agent(model=\"openai:gpt-5.5\", middleware=[CodeInterpreterMiddleware()])",
  ),
  related: ["execute", "FilesystemMiddleware"],
});

/* ═════════════════════════════ LangChain ═════════════════════════════ */

sections("langchain", ["Agents", "Middleware", "Structured output", "Models & messages", "Tools & runtime", "MCP", "Runnables & prompts", "Retrieval & parsing"]);
place("langchain", "Agents", ["create_agent", "AgentState", "AgentExecutor"]);
place("langchain", "Models & messages", ["init_chat_model", "BaseChatModel", "AIMessage", "HumanMessage", "SystemMessage", "ToolMessage", "trim_messages", "filter_messages", "merge_message_runs"]);
place("langchain", "Tools & runtime", ["tool", "BaseTool", "StructuredTool"]);
place("langchain", "Middleware", ["HumanInTheLoopMiddleware", "ModelCallLimitMiddleware", "ToolCallLimitMiddleware", "ClearToolUsesEdit"]);
place("langchain", "MCP", ["MCPAdapter", "MCPElicitationRequest", "MCPElicitationInterrupt", "MCPElicitationAccept", "MCPToolArtifact"]);
place("langchain", "Runnables & prompts", ["Runnable", "RunnableConfig", "RunnableSequence", "RunnableParallel", "RunnableLambda", "RunnablePassthrough", "ChatPromptTemplate", "PromptTemplate"]);
place("langchain", "Retrieval & parsing", ["init_embeddings", "Embeddings", "BaseRetriever", "VectorStore", "Document", "RecursiveCharacterTextSplitter", "BaseOutputParser", "StrOutputParser", "JsonOutputParser", "PydanticOutputParser", "BaseChatMessageHistory"]);

const hookNote = "Import from langchain.agents.middleware and pass the decorated function in create_agent(middleware=[...]).";

add("langchain", "Middleware", "AgentMiddleware", "C", "s", {
  page: "oss/python/langchain/middleware/custom",
  packageName: "langchain.agents.middleware",
  description: "Base class for custom middleware. Override hooks that run before or after the agent and the model, or that wrap each model or tool call.",
  signature: "class MyMiddleware(AgentMiddleware): before_agent · before_model · after_model · after_agent · wrap_model_call · wrap_tool_call (+ async variants)",
  parameters: [
    { name: "state_schema", type: "class attribute", description: "Extend AgentState with extra keys the middleware needs." },
    { name: "tools", type: "class attribute", description: "Tools the middleware adds to the agent." },
  ],
  returns: "A middleware instance for create_agent(middleware=[...]).",
  notes: ["Use a class when you need several hooks or configuration; use decorators for a single hook.", "Middleware runs in list order before the model and in reverse order after it.", "Hooks that jump must declare targets with hook_config(can_jump_to=[...])."],
  useCases: ["Guardrails, logging and cost control in one place", "Adding state such as a user profile"],
  code: lines(
    "from langchain.agents import create_agent",
    "from langchain.agents.middleware import AgentMiddleware, AgentState",
    "",
    "class CountCalls(AgentMiddleware):",
    "    def before_model(self, state: AgentState, runtime):",
    "        print(f\"{len(state['messages'])} messages so far\")",
    "        return None",
    "",
    "agent = create_agent(model=\"openai:gpt-5.5\", tools=[], middleware=[CountCalls()])",
  ),
  related: ["before_model", "wrap_model_call", "hook_config", "create_agent"],
});

add("langchain", "Middleware", "before_model", "@", "s", {
  page: "oss/python/langchain/middleware/custom",
  packageName: "langchain.agents.middleware",
  description: "Decorator for a hook that runs before every model call. Return a dict to update state, or None to leave it unchanged.",
  signature: "@before_model(state_schema=None, can_jump_to=None) def hook(state: AgentState, runtime: Runtime) -> dict | None",
  parameters: [{ name: "can_jump_to", type: "list", description: "Allowed jump targets: 'end', 'tools' or 'model'." }],
  returns: "A middleware object.",
  notes: [hookNote, "Return {\"jump_to\": \"end\"} to stop the agent early."],
  useCases: ["Trimming history before each call", "Blocking requests that break a policy"],
  code: lines(
    "from typing import Any",
    "from langchain.agents.middleware import AgentState, before_model",
    "from langgraph.runtime import Runtime",
    "",
    "@before_model",
    "def log_message_count(state: AgentState, runtime: Runtime) -> dict[str, Any] | None:",
    "    print(f\"Calling model with {len(state['messages'])} messages\")",
    "    return None",
  ),
  related: ["after_model", "before_agent", "AgentMiddleware"],
});

add("langchain", "Middleware", "after_model", "@", "s", {
  page: "oss/python/langchain/middleware/custom",
  packageName: "langchain.agents.middleware",
  description: "Decorator for a hook that runs after every model response, before any tools execute.",
  signature: "@after_model def hook(state: AgentState, runtime: Runtime) -> dict | None",
  parameters: [],
  returns: "A middleware object.",
  notes: [hookNote, "The last message in state is the model's reply, including its tool calls."],
  useCases: ["Checking output for banned content", "Recording token usage"],
  code: lines(
    "from langchain.agents.middleware import AgentState, after_model",
    "",
    "@after_model",
    "def check_reply(state: AgentState, runtime) -> dict | None:",
    "    reply = state[\"messages\"][-1]",
    "    print(\"tool calls:\", len(reply.tool_calls))",
    "    return None",
  ),
  related: ["before_model", "after_agent", "AgentMiddleware"],
});

add("langchain", "Middleware", "before_agent", "@", "s", {
  page: "oss/python/langchain/middleware/custom",
  packageName: "langchain.agents.middleware",
  description: "Decorator for a hook that runs once when the agent starts, before the first model call.",
  signature: "@before_agent def hook(state: AgentState, runtime: Runtime) -> dict | None",
  parameters: [],
  returns: "A middleware object.",
  notes: [hookNote, "Good for loading context once per invocation instead of on every model call."],
  useCases: ["Loading a user profile", "Input validation"],
  code: lines(
    "from langchain.agents.middleware import AgentState, before_agent",
    "",
    "@before_agent",
    "def reject_empty(state: AgentState, runtime) -> dict | None:",
    "    if not state[\"messages\"][-1].content:",
    "        return {\"jump_to\": \"end\"}",
    "    return None",
  ),
  related: ["after_agent", "before_model"],
});

add("langchain", "Middleware", "after_agent", "@", "s", {
  page: "oss/python/langchain/middleware/custom",
  packageName: "langchain.agents.middleware",
  description: "Decorator for a hook that runs once when the agent finishes.",
  signature: "@after_agent def hook(state: AgentState, runtime: Runtime) -> dict | None",
  parameters: [],
  returns: "A middleware object.",
  notes: [hookNote, "Use it for audit logs or final output checks."],
  useCases: ["Saving a transcript", "Final safety review"],
  code: lines(
    "from langchain.agents.middleware import AgentState, after_agent",
    "",
    "@after_agent",
    "def audit(state: AgentState, runtime) -> None:",
    "    print(\"finished with\", len(state[\"messages\"]), \"messages\")",
  ),
  related: ["before_agent", "after_model"],
});

add("langchain", "Middleware", "wrap_model_call", "@", "s", {
  page: "oss/python/langchain/middleware/custom",
  packageName: "langchain.agents.middleware",
  description: "Decorator that wraps each model call. You receive the request and a handler, so you can change the request, retry, fall back, or replace the response.",
  signature: "@wrap_model_call def hook(request: ModelRequest, handler: Callable[[ModelRequest], ModelResponse]) -> ModelResponse",
  parameters: [
    { name: "request", type: "ModelRequest", description: "Messages, system_message, tools, state and runtime; change it with request.override(...)." },
    { name: "handler", type: "Callable", description: "Calls the model (and any inner middleware)." },
  ],
  returns: "A middleware object.",
  notes: [hookNote, "Call handler zero, one or several times; this is how retries and fallbacks are built."],
  useCases: ["Switching models by conversation length", "Retrying on transient errors"],
  code: lines(
    "from typing import Callable",
    "from langchain.agents.middleware import ModelRequest, ModelResponse, wrap_model_call",
    "",
    "@wrap_model_call",
    "def retry_once(request: ModelRequest, handler: Callable[[ModelRequest], ModelResponse]) -> ModelResponse:",
    "    try:",
    "        return handler(request)",
    "    except Exception:",
    "        return handler(request)",
  ),
  related: ["wrap_tool_call", "ModelRequest", "dynamic_prompt"],
});

add("langchain", "Middleware", "wrap_tool_call", "@", "s", {
  page: "oss/python/langchain/middleware/custom",
  packageName: "langchain.agents.middleware",
  description: "Decorator that wraps each tool execution: inspect the call, change it, retry it, or return your own ToolMessage.",
  signature: "@wrap_tool_call def hook(request: ToolCallRequest, handler) -> ToolMessage | Command",
  parameters: [{ name: "request.tool_call", type: "dict", description: "The call's name, args and id." }],
  returns: "A middleware object.",
  notes: [hookNote, "ToolCallRequest comes from langchain.tools.tool_node."],
  useCases: ["Turning tool errors into helpful messages", "Caching tool results"],
  code: lines(
    "from langchain.agents.middleware import wrap_tool_call",
    "from langchain.messages import ToolMessage",
    "",
    "@wrap_tool_call",
    "def friendly_errors(request, handler):",
    "    try:",
    "        return handler(request)",
    "    except Exception as error:",
    "        return ToolMessage(content=f\"Tool failed: {error}. Try different input.\", tool_call_id=request.tool_call[\"id\"])",
  ),
  related: ["wrap_model_call", "ToolRetryMiddleware"],
});

add("langchain", "Middleware", "dynamic_prompt", "@", "s", {
  page: "oss/python/langchain/middleware/custom",
  packageName: "langchain.agents.middleware",
  description: "Decorator that builds the system prompt for each model call from the current request, state or runtime context.",
  signature: "@dynamic_prompt def prompt(request: ModelRequest) -> str",
  parameters: [],
  returns: "A middleware object that sets the system prompt.",
  notes: [hookNote, "Read per-user values from request.runtime.context."],
  useCases: ["Role-based instructions", "Adding today's date or user preferences"],
  code: lines(
    "from langchain.agents import create_agent",
    "from langchain.agents.middleware import ModelRequest, dynamic_prompt",
    "",
    "@dynamic_prompt",
    "def by_role(request: ModelRequest) -> str:",
    "    role = request.runtime.context.get(\"role\", \"user\")",
    "    return \"Answer in depth.\" if role == \"expert\" else \"Explain simply.\"",
    "",
    "agent = create_agent(model=\"openai:gpt-5.5\", tools=[], middleware=[by_role])",
  ),
  related: ["wrap_model_call", "ModelRequest"],
});

add("langchain", "Middleware", "hook_config", "F", "s", {
  page: "oss/python/langchain/middleware/custom",
  packageName: "langchain.agents.middleware",
  description: "Declares which nodes a class-based hook may jump to. Jumps are refused unless declared.",
  signature: "@hook_config(can_jump_to=[\"end\", \"tools\", \"model\"])",
  parameters: [{ name: "can_jump_to", type: "list[str]", description: "'end' finishes the agent, 'tools' runs tools, 'model' calls the model again." }],
  returns: "A decorator for an AgentMiddleware method.",
  notes: ["Decorator hooks take can_jump_to directly instead."],
  useCases: ["Ending early when a guardrail fails"],
  code: lines(
    "from langchain.agents.middleware import AgentMiddleware, hook_config",
    "",
    "class StopOnBlock(AgentMiddleware):",
    "    @hook_config(can_jump_to=[\"end\"])",
    "    def before_model(self, state, runtime):",
    "        if \"blocked\" in state[\"messages\"][-1].content:",
    "            return {\"jump_to\": \"end\"}",
    "        return None",
  ),
  related: ["AgentMiddleware", "before_model"],
});

add("langchain", "Middleware", "ModelRequest", "C", "s", {
  page: "oss/python/langchain/middleware/custom",
  packageName: "langchain.agents.middleware",
  description: "What wrap_model_call and dynamic_prompt receive: the messages, system message, tools, state and runtime for one model call.",
  signature: "request.messages · request.system_message · request.tools · request.state · request.runtime · request.override(**changes)",
  parameters: [{ name: "override", type: "method", description: "Returns a copy with fields replaced, e.g. a different model or tool list." }],
  returns: "Passed to handler(request) to call the model.",
  notes: ["Use override instead of mutating the request.", "ModelResponse is what the handler returns."],
  useCases: ["Swapping the model for long conversations", "Filtering tools per call"],
  code: lines(
    "from langchain.agents.middleware import wrap_model_call",
    "from langchain.chat_models import init_chat_model",
    "",
    "large = init_chat_model(\"openai:gpt-5.5\")",
    "",
    "@wrap_model_call",
    "def bigger_model_for_long_chats(request, handler):",
    "    if len(request.messages) > 20:",
    "        request = request.override(model=large)",
    "    return handler(request)",
  ),
  related: ["wrap_model_call", "dynamic_prompt"],
});

add("langchain", "Middleware", "SummarizationMiddleware", "C", "s", {
  page: "oss/python/langchain/middleware/built-in",
  packageName: "langchain.agents.middleware",
  description: "Summarises older messages when the conversation gets long, keeping recent messages intact so the agent stays within its context window.",
  signature: "SummarizationMiddleware(model, trigger=(\"tokens\", 4000), keep=(\"messages\", 20), summary_prompt=None)",
  parameters: [
    { name: "model", type: "str | BaseChatModel", description: "Model used to write the summary; a small one is fine." },
    { name: "trigger", type: "tuple | dict | list", description: "When to summarise, e.g. (\"tokens\", 4000) or {\"tokens\": 4000, \"messages\": 10}." },
    { name: "keep", type: "tuple", description: "What to keep verbatim, e.g. (\"messages\", 20)." },
  ],
  returns: "Middleware for create_agent.",
  notes: ["Summaries replace old messages in state, so later turns cost fewer tokens.", "Tool call and result pairs are kept together."],
  useCases: ["Long-running chat assistants", "Agents with many tool calls"],
  code: lines(
    "from langchain.agents import create_agent",
    "from langchain.agents.middleware import SummarizationMiddleware",
    "",
    "agent = create_agent(",
    "    model=\"openai:gpt-5.5\",",
    "    tools=[],",
    "    middleware=[SummarizationMiddleware(model=\"openai:gpt-5.4-mini\", trigger=(\"tokens\", 4000), keep=(\"messages\", 20))],",
    ")",
  ),
  related: ["ContextEditingMiddleware", "trim_messages"],
});

add("langchain", "Middleware", "PIIMiddleware", "C", "s", {
  page: "oss/python/langchain/guardrails",
  packageName: "langchain.agents.middleware",
  description: "Detects personal data such as emails, credit cards or API keys and redacts, masks, hashes or blocks it in inputs, outputs or tool results.",
  signature: "PIIMiddleware(pii_type, strategy='redact', detector=None, apply_to_input=True, apply_to_output=False, apply_to_tool_results=False)",
  parameters: [
    { name: "pii_type", type: "str", description: "Built-in types such as \"email\" or \"credit_card\", or your own name with a detector." },
    { name: "strategy", type: "str", description: "redact, mask, hash or block (raises an error)." },
    { name: "detector", type: "regex | callable", description: "Custom pattern, e.g. r\"sk-[a-zA-Z0-9]{32}\"." },
  ],
  returns: "Middleware for create_agent.",
  notes: ["Add one instance per kind of data.", "Blocking stops the run before data reaches the model."],
  useCases: ["Keeping customer emails out of model logs", "Stopping leaked API keys"],
  code: lines(
    "from langchain.agents import create_agent",
    "from langchain.agents.middleware import PIIMiddleware",
    "",
    "agent = create_agent(",
    "    model=\"openai:gpt-5.5\",",
    "    tools=[],",
    "    middleware=[",
    "        PIIMiddleware(\"email\", strategy=\"redact\", apply_to_input=True),",
    "        PIIMiddleware(\"api_key\", detector=r\"sk-[a-zA-Z0-9]{32}\", strategy=\"block\"),",
    "    ],",
    ")",
  ),
  related: ["HumanInTheLoopMiddleware", "AgentMiddleware"],
});

add("langchain", "Middleware", "ModelFallbackMiddleware", "C", "s", {
  page: "oss/python/langchain/middleware/built-in",
  packageName: "langchain.agents.middleware",
  description: "Tries backup models in order when the primary model call fails.",
  signature: "ModelFallbackMiddleware(first_model, *additional_models)",
  parameters: [{ name: "first_model, *additional_models", type: "str | BaseChatModel", description: "Fallbacks, tried left to right." }],
  returns: "Middleware for create_agent.",
  notes: ["Pair with ModelRetryMiddleware to retry before falling back."],
  useCases: ["Surviving a provider outage", "Cheaper fallback for rate limits"],
  code: lines(
    "from langchain.agents import create_agent",
    "from langchain.agents.middleware import ModelFallbackMiddleware",
    "",
    "agent = create_agent(",
    "    model=\"openai:gpt-5.5\",",
    "    tools=[],",
    "    middleware=[ModelFallbackMiddleware(\"anthropic:claude-sonnet-5\", \"google_genai:gemini-3.6-flash\")],",
    ")",
  ),
  related: ["ModelRetryMiddleware", "wrap_model_call"],
});

add("langchain", "Middleware", "ModelRetryMiddleware", "C", "s", {
  page: "oss/python/langchain/middleware/built-in",
  packageName: "langchain.agents.middleware",
  description: "Retries failed model calls with exponential backoff.",
  signature: "ModelRetryMiddleware(max_retries=2, retry_on=(Exception,), on_failure='continue', backoff_factor=2.0, initial_delay=1.0, max_delay=60.0, jitter=True)",
  parameters: [
    { name: "max_retries", type: "int", description: "Attempts after the first failure." },
    { name: "retry_on", type: "tuple | callable", description: "Which errors to retry." },
    { name: "on_failure", type: "str | callable", description: "What happens when retries run out." },
  ],
  returns: "Middleware for create_agent.",
  notes: ["Use ToolRetryMiddleware for tool calls."],
  useCases: ["Flaky networks", "Rate-limited providers"],
  code: lines(
    "from langchain.agents import create_agent",
    "from langchain.agents.middleware import ModelRetryMiddleware",
    "",
    "agent = create_agent(model=\"openai:gpt-5.5\", tools=[], middleware=[ModelRetryMiddleware(max_retries=3, initial_delay=2.0)])",
  ),
  related: ["ModelFallbackMiddleware", "ToolRetryMiddleware"],
});

add("langchain", "Middleware", "ToolRetryMiddleware", "C", "s", {
  page: "oss/python/langchain/middleware/built-in",
  packageName: "langchain.agents.middleware",
  description: "Retries failed tool calls with backoff, optionally only for chosen tools or errors.",
  signature: "ToolRetryMiddleware(max_retries=2, tools=None, retry_on=(Exception,), on_failure='return_message', backoff_factor=2.0, initial_delay=1.0, max_delay=60.0, jitter=True)",
  parameters: [{ name: "tools", type: "list | None", description: "Limit retries to these tools; None means all." }],
  returns: "Middleware for create_agent.",
  notes: ["By default the final failure goes back to the model as a message so it can adapt."],
  useCases: ["Unreliable external APIs", "Search tools that time out"],
  code: lines(
    "from langchain.agents import create_agent",
    "from langchain.agents.middleware import ToolRetryMiddleware",
    "",
    "agent = create_agent(model=\"openai:gpt-5.5\", tools=[], middleware=[ToolRetryMiddleware(max_retries=3, tools=[\"web_search\"])])",
  ),
  related: ["ModelRetryMiddleware", "wrap_tool_call"],
});

add("langchain", "Middleware", "TodoListMiddleware", "C", "s", {
  page: "oss/python/langchain/middleware/built-in",
  packageName: "langchain.agents.middleware",
  description: "Gives the agent a write_todos tool and planning instructions, so it can plan and track multi-step tasks.",
  signature: "TodoListMiddleware(system_prompt=None, tool_description=None)",
  parameters: [{ name: "system_prompt / tool_description", type: "str", description: "Override the default planning instructions." }],
  returns: "Middleware for create_agent; the plan is stored under state[\"todos\"].",
  notes: ["The same middleware powers planning in Deep Agents."],
  useCases: ["Complex research or coding tasks", "Showing progress in a UI"],
  code: lines(
    "from langchain.agents import create_agent",
    "from langchain.agents.middleware import TodoListMiddleware",
    "",
    "agent = create_agent(model=\"openai:gpt-5.5\", tools=[], middleware=[TodoListMiddleware()])",
  ),
  related: ["create_agent", "AgentMiddleware"],
});

add("langchain", "Middleware", "LLMToolSelectorMiddleware", "C", "s", {
  page: "oss/python/langchain/middleware/built-in",
  packageName: "langchain.agents.middleware",
  description: "Uses a small model to pick the relevant tools before each main model call, which helps agents with many tools.",
  signature: "LLMToolSelectorMiddleware(model=None, system_prompt=None, max_tools=None, always_include=None)",
  parameters: [
    { name: "max_tools", type: "int", description: "The most tools passed to the main model." },
    { name: "always_include", type: "list[str]", description: "Tools that are always available." },
  ],
  returns: "Middleware for create_agent.",
  notes: ["Fewer tools mean fewer prompt tokens and better tool choice."],
  useCases: ["Agents with dozens of tools"],
  code: lines(
    "from langchain.agents import create_agent",
    "from langchain.agents.middleware import LLMToolSelectorMiddleware",
    "",
    "agent = create_agent(",
    "    model=\"openai:gpt-5.5\",",
    "    tools=[],",
    "    middleware=[LLMToolSelectorMiddleware(model=\"openai:gpt-5.4-mini\", max_tools=3, always_include=[\"search\"])],",
    ")",
  ),
  related: ["ToolCallLimitMiddleware", "create_agent"],
});

add("langchain", "Middleware", "ContextEditingMiddleware", "C", "s", {
  page: "oss/python/langchain/middleware/built-in",
  packageName: "langchain.agents.middleware",
  description: "Edits the context sent to the model when it grows too large, for example by clearing old tool results with ClearToolUsesEdit.",
  signature: "ContextEditingMiddleware(edits=[ClearToolUsesEdit(trigger=100_000, keep=3)], token_count_method='approximate')",
  parameters: [{ name: "edits", type: "list", description: "Edit strategies applied in order." }],
  returns: "Middleware for create_agent.",
  notes: ["Cleared tool results are replaced by a short placeholder."],
  useCases: ["Agents that read many large files or pages"],
  code: lines(
    "from langchain.agents import create_agent",
    "from langchain.agents.middleware import ClearToolUsesEdit, ContextEditingMiddleware",
    "",
    "agent = create_agent(",
    "    model=\"openai:gpt-5.5\",",
    "    tools=[],",
    "    middleware=[ContextEditingMiddleware(edits=[ClearToolUsesEdit(trigger=100_000, keep=3)])],",
    ")",
  ),
  related: ["ClearToolUsesEdit", "SummarizationMiddleware"],
});

add("langchain", "Middleware", "ShellToolMiddleware", "C", "s", {
  page: "oss/python/langchain/middleware/built-in",
  packageName: "langchain.agents.middleware",
  description: "Gives the agent a persistent shell session in a workspace directory, with optional startup commands, execution policy and output redaction.",
  signature: "ShellToolMiddleware(workspace_root=None, startup_commands=None, shutdown_commands=None, execution_policy=None, redaction_rules=None, env=None)",
  parameters: [
    { name: "workspace_root", type: "str", description: "Directory the shell starts in." },
    { name: "execution_policy", type: "policy", description: "Where and how commands run, e.g. a Docker-based policy for isolation." },
  ],
  returns: "Middleware for create_agent.",
  notes: ["The session keeps state (cwd, variables) between commands.", "Use an isolating execution policy for untrusted work."],
  useCases: ["Coding agents", "DevOps automation"],
  code: lines(
    "from langchain.agents import create_agent",
    "from langchain.agents.middleware import ShellToolMiddleware",
    "",
    "agent = create_agent(model=\"openai:gpt-5.5\", tools=[], middleware=[ShellToolMiddleware(workspace_root=\"./workspace\")])",
  ),
  related: ["HumanInTheLoopMiddleware", "AgentMiddleware"],
});

add("langchain", "Structured output", "ToolStrategy", "C", "s", {
  page: "oss/python/langchain/structured-output",
  packageName: "langchain.agents.structured_output",
  description: "Gets structured output through tool calling, which works with any model that supports tools. Invalid output is sent back to the model to fix.",
  signature: "ToolStrategy(schema, handle_errors=True)",
  parameters: [
    { name: "schema", type: "Pydantic model | dataclass | TypedDict | JSON schema", description: "The shape of the answer." },
    { name: "handle_errors", type: "bool | str | type | callable", description: "True retries with the error; False lets exceptions propagate." },
  ],
  returns: "Used as create_agent(response_format=...); the result is in result[\"structured_response\"].",
  notes: ["Passing a schema directly lets LangChain choose between ToolStrategy and ProviderStrategy.", "JSON schema dicts must be wrapped explicitly."],
  useCases: ["Extracting contact details", "Returning a typed plan or report"],
  code: lines(
    "from pydantic import BaseModel",
    "from langchain.agents import create_agent",
    "from langchain.agents.structured_output import ToolStrategy",
    "",
    "class ContactInfo(BaseModel):",
    "    name: str",
    "    email: str",
    "",
    "agent = create_agent(model=\"openai:gpt-5.5\", tools=[], response_format=ToolStrategy(ContactInfo))",
    "result = agent.invoke({\"messages\": [{\"role\": \"user\", \"content\": \"John Doe, john@example.com\"}]})",
    "print(result[\"structured_response\"])",
  ),
  related: ["ProviderStrategy", "create_agent", "with_structured_output"],
});

add("langchain", "Structured output", "ProviderStrategy", "C", "s", {
  page: "oss/python/langchain/structured-output",
  packageName: "langchain.agents.structured_output",
  description: "Uses the provider's native structured output (JSON schema mode), which is the most reliable option on models that support it.",
  signature: "ProviderStrategy(schema, strict=None)",
  parameters: [{ name: "strict", type: "bool", description: "Ask the provider to enforce the schema strictly (langchain>=1.2)." }],
  returns: "Used as create_agent(response_format=...).",
  notes: ["Only for providers with native structured output, such as OpenAI, Anthropic and Gemini."],
  useCases: ["Guaranteed-valid JSON from supported models"],
  code: lines(
    "from pydantic import BaseModel",
    "from langchain.agents import create_agent",
    "from langchain.agents.structured_output import ProviderStrategy",
    "",
    "class Weather(BaseModel):",
    "    city: str",
    "    temperature_c: float",
    "",
    "agent = create_agent(model=\"openai:gpt-5.5\", tools=[], response_format=ProviderStrategy(Weather, strict=True))",
  ),
  related: ["ToolStrategy", "create_agent"],
});

add("langchain", "Models & messages", "with_structured_output", "F", "s", {
  page: "oss/python/langchain/models",
  packageName: "langchain_core (BaseChatModel method)",
  description: "Returns a model that answers with an object matching your schema instead of free text. Use it for single model calls; agents use response_format.",
  signature: "model.with_structured_output(schema, method=None, include_raw=False)",
  parameters: [
    { name: "schema", type: "Pydantic model | TypedDict | JSON schema", description: "The output shape." },
    { name: "include_raw", type: "bool", description: "Also return the raw message, useful for debugging." },
  ],
  returns: "A Runnable whose invoke returns the parsed object.",
  notes: ["Field descriptions guide the model; write them clearly."],
  useCases: ["Classification", "Extraction from text"],
  code: lines(
    "from pydantic import BaseModel, Field",
    "from langchain.chat_models import init_chat_model",
    "",
    "class Movie(BaseModel):",
    "    title: str = Field(description=\"The movie title\")",
    "    year: int",
    "",
    "model = init_chat_model(\"openai:gpt-5.5\").with_structured_output(Movie)",
    "print(model.invoke(\"Tell me about Inception\"))",
  ),
  related: ["ToolStrategy", "init_chat_model", "bind_tools"],
});

add("langchain", "Models & messages", "bind_tools", "F", "s", {
  page: "oss/python/langchain/models",
  packageName: "langchain_core (BaseChatModel method)",
  description: "Makes tools available to a chat model. The model can then reply with tool calls that your code (or an agent) executes.",
  signature: "model.bind_tools(tools, tool_choice=None)",
  parameters: [{ name: "tool_choice", type: "str", description: "\"any\" forces a tool call; a tool name forces that tool." }],
  returns: "A model whose replies may include `tool_calls`.",
  notes: ["create_agent binds tools for you; use bind_tools when building your own loop."],
  useCases: ["Custom tool loops in LangGraph"],
  code: lines(
    "from langchain.chat_models import init_chat_model",
    "from langchain.tools import tool",
    "",
    "@tool",
    "def get_weather(city: str) -> str:",
    "    \"\"\"Get the weather for a city.\"\"\"",
    "    return f\"Sunny in {city}\"",
    "",
    "model = init_chat_model(\"openai:gpt-5.5\").bind_tools([get_weather])",
    "print(model.invoke(\"Weather in Pune?\").tool_calls)",
  ),
  related: ["tool", "with_structured_output", "init_chat_model"],
});

add("langchain", "Models & messages", "content_blocks", "M", "s", {
  page: "oss/python/langchain/messages",
  packageName: "langchain.messages",
  description: "A standard, provider-independent view of a message's content: text, reasoning, tool calls, images and other blocks, read the same way for every provider.",
  signature: "message.content_blocks -> list[{\"type\": \"text\" | \"reasoning\" | \"tool_call\" | \"image\" | ..., ...}]",
  parameters: [],
  returns: "A list of typed blocks.",
  notes: ["Works on streamed chunks too, so you can render reasoning and text separately."],
  useCases: ["Showing reasoning tokens", "Handling multimodal replies"],
  code: lines(
    "from langchain.chat_models import init_chat_model",
    "",
    "model = init_chat_model(\"openai:gpt-5.5\")",
    "for chunk in model.stream(\"What color is the sky?\"):",
    "    for block in chunk.content_blocks:",
    "        print(block[\"type\"], block.get(\"text\", \"\"))",
  ),
  related: ["AIMessage", "init_chat_model"],
});

add("langchain", "Models & messages", "batch", "F", "s", {
  page: "oss/python/langchain/models",
  packageName: "langchain_core (Runnable method)",
  description: "Runs many independent inputs in parallel on the client. batch_as_completed yields each result as soon as it is ready.",
  signature: "model.batch(inputs, config={\"max_concurrency\": 5})  ·  model.batch_as_completed(inputs)",
  parameters: [{ name: "max_concurrency", type: "int", description: "Limit parallel calls in the RunnableConfig." }],
  returns: "A list of results in input order (batch) or an iterator of (index, result) (batch_as_completed).",
  notes: ["This is client-side parallelism, not a provider batch API."],
  useCases: ["Classifying many documents", "Generating variations"],
  code: lines(
    "from langchain.chat_models import init_chat_model",
    "",
    "model = init_chat_model(\"openai:gpt-5.5\")",
    "answers = model.batch(",
    "    [\"Explain closures\", \"Explain promises\", \"Explain generators\"],",
    "    config={\"max_concurrency\": 2},",
    ")",
  ),
  related: ["init_chat_model", "RunnableConfig"],
});

add("langchain", "Models & messages", "InMemoryRateLimiter", "C", "s", {
  page: "oss/python/langchain/models",
  packageName: "langchain.rate_limiters",
  description: "A thread-safe token-bucket limiter that chat models accept through rate_limiter, to stay under a provider's request rate.",
  signature: "InMemoryRateLimiter(requests_per_second, check_every_n_seconds=0.1, max_bucket_size=1)",
  parameters: [
    { name: "requests_per_second", type: "float", description: "Average allowed rate, e.g. 0.1 = one request every 10 seconds." },
    { name: "max_bucket_size", type: "int", description: "Largest burst allowed." },
  ],
  returns: "A limiter passed as rate_limiter= when creating a model.",
  notes: ["It limits requests, not tokens, and only within one process."],
  useCases: ["Free-tier API keys", "Batch jobs"],
  code: lines(
    "from langchain.chat_models import init_chat_model",
    "from langchain.rate_limiters import InMemoryRateLimiter",
    "",
    "limiter = InMemoryRateLimiter(requests_per_second=0.1, check_every_n_seconds=0.1, max_bucket_size=10)",
    "model = init_chat_model(\"openai:gpt-5.5\", rate_limiter=limiter)",
  ),
  related: ["init_chat_model", "batch"],
});

add("langchain", "Tools & runtime", "ToolRuntime", "C", "s", {
  page: "oss/python/langchain/tools",
  packageName: "langchain.tools",
  description: "Add a `runtime: ToolRuntime` parameter to a tool to read agent state, runtime context, the long-term store, the stream writer and the tool call ID. It is injected automatically and hidden from the model.",
  signature: "def my_tool(arg: str, runtime: ToolRuntime) -> str  ·  runtime.state · runtime.context · runtime.store · runtime.stream_writer · runtime.tool_call_id",
  parameters: [
    { name: "runtime.state", type: "dict", description: "The current conversation state, e.g. messages." },
    { name: "runtime.context", type: "context_schema", description: "Per-run data such as user_id, passed via invoke(context=...)." },
    { name: "runtime.store", type: "BaseStore", description: "Long-term memory across threads." },
  ],
  returns: "Nothing extra; the tool body reads from it.",
  notes: ["Don't name your own arguments config or runtime; those names are reserved.", "Return a Command to update state from a tool."],
  useCases: ["Per-user lookups", "Tools that remember preferences", "Streaming progress from a slow tool"],
  code: lines(
    "from dataclasses import dataclass",
    "from langchain.tools import ToolRuntime, tool",
    "",
    "@dataclass",
    "class Context:",
    "    user_id: str",
    "",
    "@tool",
    "def get_account(runtime: ToolRuntime[Context]) -> str:",
    "    \"\"\"Look up the current user's account.\"\"\"",
    "    return f\"Account for {runtime.context.user_id}\"",
  ),
  related: ["tool", "create_agent", "BaseTool"],
});

add("langchain", "Agents", "Agent streaming", "M", "s", {
  page: "oss/python/langchain/streaming",
  packageName: "langchain.agents",
  description: "Stream an agent's progress as it runs: step updates, model tokens, or custom data your tools emit.",
  signature: "agent.stream(input, stream_mode=\"updates\" | \"messages\" | \"custom\" | [...], version=\"v2\")",
  parameters: [
    { name: "updates", type: "stream mode", description: "One event after each agent step." },
    { name: "messages", type: "stream mode", description: "Token chunks from the model as they are generated." },
    { name: "custom", type: "stream mode", description: "Data written with get_stream_writer() inside tools." },
  ],
  returns: "An iterator of chunks; with version=\"v2\" each is a dict with type, ns and data.",
  notes: ["Pass subgraphs=True to get tokens from an agent used as a subgraph.", "Use astream in async code."],
  useCases: ["Chat UIs that render tokens live", "Progress bars for tool calls"],
  code: lines(
    "from langchain.agents import create_agent",
    "",
    "agent = create_agent(model=\"openai:gpt-5.5\", tools=[])",
    "for chunk in agent.stream(",
    "    {\"messages\": [{\"role\": \"user\", \"content\": \"Tell me a joke\"}]},",
    "    stream_mode=\"messages\",",
    "    version=\"v2\",",
    "):",
    "    print(chunk[\"data\"])",
  ),
  related: ["create_agent", "Short-term memory"],
});

add("langchain", "Agents", "Short-term memory", "M", "s", {
  page: "oss/python/langchain/short-term-memory",
  packageName: "langchain.agents",
  description: "Conversation memory for an agent. Give create_agent a checkpointer and pass a thread_id; each call on that thread continues from the saved state.",
  signature: "create_agent(..., checkpointer=InMemorySaver())  ·  agent.invoke(input, {\"configurable\": {\"thread_id\": \"1\"}})",
  parameters: [{ name: "thread_id", type: "str", description: "Identifies the conversation; a new ID starts fresh." }],
  returns: "Messages and custom state persist per thread.",
  notes: ["Use PostgresSaver or another persistent checkpointer in production.", "Combine with SummarizationMiddleware or trim_messages for long threads."],
  useCases: ["Multi-turn chatbots", "Resuming after a human approval"],
  code: lines(
    "from langchain.agents import create_agent",
    "from langgraph.checkpoint.memory import InMemorySaver",
    "",
    "agent = create_agent(model=\"openai:gpt-5.5\", tools=[], checkpointer=InMemorySaver())",
    "config = {\"configurable\": {\"thread_id\": \"user-42\"}}",
    "agent.invoke({\"messages\": [{\"role\": \"user\", \"content\": \"My name is Asha\"}]}, config)",
    "agent.invoke({\"messages\": [{\"role\": \"user\", \"content\": \"What is my name?\"}]}, config)",
  ),
  related: ["create_agent", "SummarizationMiddleware", "Agent streaming"],
});

/* ═════════════════════════════ LangGraph ═════════════════════════════ */

sections("langgraph", ["Graph API", "Functional API", "Control flow & human-in-the-loop", "Streaming", "Persistence & time travel", "Memory store", "Fault tolerance & caching", "Prebuilt & deployment", "Pregel runtime & channels"]);
place("langgraph", "Graph API", ["StateGraph", "Graph", "CompiledStateGraph", "MessageGraph", "START", "END", "add_messages", "MessagesState"]);
place("langgraph", "Functional API", ["entrypoint", "task"]);
place("langgraph", "Control flow & human-in-the-loop", ["Command", "Send", "interrupt"]);
place("langgraph", "Persistence & time travel", ["MemorySaver", "BaseCheckpointSaver", "AsyncSqliteSaver", "SqliteSaver", "PostgresSaver", "AsyncPostgresSaver", "BaseCheckpointSerializer", "Checkpoint", "CheckpointMetadata", "CheckpointTuple", "StateSnapshot", "get_state", "update_state"]);
place("langgraph", "Memory store", ["InMemoryStore", "BaseStore", "Item", "SearchItem"]);
place("langgraph", "Prebuilt & deployment", ["create_react_agent"]);
place("langgraph", "Pregel runtime & channels", ["Pregel", "PregelExecutable", "PregelTask", "Channel", "BinaryOperatorAggregate", "LastValue", "Topic", "EphemeralValue", "RemainingSteps", "ResubmitConfig"]);

add("langgraph", "Graph API", "add_conditional_edges", "F", "s", {
  page: "oss/python/langgraph/graph-api",
  packageName: "langgraph.graph (StateGraph method)",
  description: "Routes from a node to the next node(s) chosen at runtime by a function that reads the state.",
  signature: "builder.add_conditional_edges(source, path, path_map=None)",
  parameters: [
    { name: "source", type: "str", description: "The node to branch from, or START for a conditional entry point." },
    { name: "path", type: "Callable", description: "Returns a node name, a list of names, Send objects or END." },
    { name: "path_map", type: "dict", description: "Optional mapping from return values to node names; also draws the graph correctly." },
  ],
  returns: "The builder, for chaining.",
  notes: ["Returning several names runs those nodes in parallel.", "Use Command from inside a node when the node itself should decide."],
  useCases: ["Tool-call loops", "Routing by intent", "Retry or finish decisions"],
  code: lines(
    "from langgraph.graph import END, START, StateGraph",
    "",
    "def route(state: dict) -> str:",
    "    return \"tools\" if state[\"needs_tool\"] else END",
    "",
    "builder = StateGraph(dict)",
    "builder.add_node(\"agent\", lambda state: state)",
    "builder.add_node(\"tools\", lambda state: state)",
    "builder.add_edge(START, \"agent\")",
    "builder.add_conditional_edges(\"agent\", route, {\"tools\": \"tools\", END: END})",
  ),
  related: ["StateGraph", "Send", "Command"],
});

add("langgraph", "Graph API", "add_sequence", "F", "s", {
  page: "oss/python/langgraph/use-graph-api",
  packageName: "langgraph.graph (StateGraph method)",
  description: "Shorthand that adds several nodes and connects them in order.",
  signature: "builder.add_sequence([node_1, node_2, node_3])",
  parameters: [{ name: "nodes", type: "list[Callable | (name, Callable)]", description: "Functions (named after themselves) or (name, function) pairs." }],
  returns: "The builder, for chaining.",
  notes: ["You still connect START to the first node."],
  useCases: ["Linear pipelines such as retrieve → grade → answer"],
  code: lines(
    "from langgraph.graph import START, StateGraph",
    "",
    "def step_1(state: dict) -> dict:",
    "    return {\"value\": 1}",
    "",
    "def step_2(state: dict) -> dict:",
    "    return {\"value\": state[\"value\"] + 1}",
    "",
    "builder = StateGraph(dict).add_sequence([step_1, step_2])",
    "builder.add_edge(START, \"step_1\")",
  ),
  related: ["StateGraph", "add_conditional_edges"],
});

add("langgraph", "Graph API", "Runtime & context_schema", "C", "s", {
  page: "oss/python/langgraph/graph-api",
  packageName: "langgraph.runtime",
  description: "Run-scoped values that aren't part of state, such as a user ID or model choice. Declare a context_schema and read it in nodes through runtime.context.",
  signature: "StateGraph(State, context_schema=Context)  ·  def node(state, runtime: Runtime[Context])  ·  graph.invoke(input, context={...})",
  parameters: [
    { name: "runtime.context", type: "Context", description: "The values passed with invoke(context=...)." },
    { name: "runtime.store", type: "BaseStore", description: "The long-term store, when the graph has one." },
  ],
  returns: "Nothing; nodes read from it.",
  notes: ["Context is not checkpointed; pass it on every call.", "Replaces putting such values into config[\"configurable\"]."],
  useCases: ["Choosing an LLM provider per request", "Passing the signed-in user's ID"],
  code: lines(
    "from dataclasses import dataclass",
    "from langgraph.graph import StateGraph",
    "from langgraph.runtime import Runtime",
    "",
    "@dataclass",
    "class Context:",
    "    llm_provider: str = \"openai\"",
    "",
    "def node(state: dict, runtime: Runtime[Context]) -> dict:",
    "    return {\"provider\": runtime.context.llm_provider}",
    "",
    "builder = StateGraph(dict, context_schema=Context)",
  ),
  related: ["StateGraph", "get_store"],
});

add("langgraph", "Graph API", "input_schema / output_schema", "M", "s", {
  page: "oss/python/langgraph/graph-api",
  packageName: "langgraph.graph",
  description: "Separate schemas for what a graph accepts and what it returns, while nodes can still use the full internal state.",
  signature: "StateGraph(OverallState, input_schema=InputState, output_schema=OutputState)",
  parameters: [],
  returns: "invoke() accepts only input keys and returns only output keys.",
  notes: ["Keeps internal scratch fields private to the graph."],
  useCases: ["A clean public API for a graph", "Hiding intermediate results"],
  code: lines(
    "from typing import TypedDict",
    "from langgraph.graph import StateGraph",
    "",
    "class InputState(TypedDict):",
    "    question: str",
    "",
    "class OutputState(TypedDict):",
    "    answer: str",
    "",
    "class OverallState(InputState, OutputState):",
    "    notes: list[str]",
    "",
    "builder = StateGraph(OverallState, input_schema=InputState, output_schema=OutputState)",
  ),
  related: ["StateGraph", "MessagesState"],
});

add("langgraph", "Graph API", "recursion_limit", "K", "s", {
  page: "oss/python/langgraph/graph-api",
  packageName: "langgraph (config key)",
  description: "The maximum number of super-steps a run may take before LangGraph raises GraphRecursionError. It protects against endless loops.",
  signature: "graph.invoke(input, config={\"recursion_limit\": 25})",
  parameters: [],
  returns: "GraphRecursionError when exceeded.",
  notes: ["It is a top-level config key, not inside configurable.", "Read the current step in a node from config[\"metadata\"][\"langgraph_step\"].", "Use RemainingSteps in state to finish gracefully before the limit."],
  useCases: ["Capping agent loops"],
  code: lines(
    "from langgraph.errors import GraphRecursionError",
    "",
    "try:",
    "    graph.invoke({\"messages\": []}, config={\"recursion_limit\": 5})",
    "except GraphRecursionError:",
    "    print(\"Stopped after 5 steps\")",
  ),
  related: ["RemainingSteps", "StateGraph"],
});

add("langgraph", "Control flow & human-in-the-loop", "Command(resume=...)", "M", "s", {
  page: "oss/python/langgraph/interrupts",
  packageName: "langgraph.types",
  description: "Resumes a graph paused by interrupt(). The resume value becomes interrupt()'s return value inside the node.",
  signature: "graph.invoke(Command(resume=value), config)",
  parameters: [{ name: "resume", type: "Any", description: "The person's answer, e.g. True, an edited dict or a list of decisions." }],
  returns: "The run continues from the paused node.",
  notes: ["Use the same thread_id as the paused run.", "The paused node restarts from its beginning, so code before interrupt() runs again; keep it idempotent."],
  useCases: ["Approving a tool call", "Editing a draft before sending"],
  code: lines(
    "from langgraph.types import Command, interrupt",
    "",
    "def review(state: dict) -> dict:",
    "    approved = interrupt(\"Do you approve this action?\")",
    "    return {\"approved\": approved}",
    "",
    "config = {\"configurable\": {\"thread_id\": \"t1\"}}",
    "graph.invoke({\"draft\": \"...\"}, config)",
    "graph.invoke(Command(resume=True), config)",
  ),
  related: ["interrupt", "Command"],
});

add("langgraph", "Control flow & human-in-the-loop", "Command.PARENT", "K", "s", {
  page: "oss/python/langgraph/graph-api",
  packageName: "langgraph.types",
  description: "Sends a Command's goto and update to the parent graph, so a node inside a subgraph can hand off to a sibling of its subgraph.",
  signature: "Command(goto=\"other_agent\", update={...}, graph=Command.PARENT)",
  parameters: [],
  returns: "Control moves to a node in the parent graph.",
  notes: ["Shared keys updated this way need a reducer in the parent state.", "The basis of multi-agent handoffs."],
  useCases: ["Agent-to-agent handoffs"],
  code: lines(
    "from typing import Literal",
    "from langgraph.types import Command",
    "",
    "def transfer_to_billing(state: dict) -> Command[Literal[\"billing_agent\"]]:",
    "    return Command(goto=\"billing_agent\", update={\"topic\": \"refund\"}, graph=Command.PARENT)",
  ),
  related: ["Command", "Subgraphs"],
});

add("langgraph", "Control flow & human-in-the-loop", "Subgraphs", "M", "s", {
  page: "oss/python/langgraph/use-subgraphs",
  packageName: "langgraph.graph",
  description: "A compiled graph used as a node in another graph. Subgraphs build multi-agent systems and reusable components.",
  signature: "builder.add_node(\"research\", research_graph)  # compiled graph as a node",
  parameters: [],
  returns: "The subgraph runs as one step of the parent.",
  notes: ["With shared state keys you can add it directly; with different schemas, call it from a node and map inputs and outputs.", "Stream with subgraphs=True to see its events."],
  useCases: ["Multi-agent teams", "Reusing a RAG pipeline"],
  code: lines(
    "from langgraph.graph import START, StateGraph",
    "",
    "child = StateGraph(dict)",
    "child.add_node(\"work\", lambda state: {\"done\": True})",
    "child.add_edge(START, \"work\")",
    "",
    "parent = StateGraph(dict)",
    "parent.add_node(\"child\", child.compile())",
    "parent.add_edge(START, \"child\")",
  ),
  related: ["Command.PARENT", "StateGraph"],
});

add("langgraph", "Streaming", "stream_mode", "M", "s", {
  page: "oss/python/langgraph/streaming",
  packageName: "langgraph (CompiledStateGraph.stream)",
  description: "Chooses what graph.stream emits: full state, per-node updates, LLM tokens, custom data, checkpoints, task events or debug traces.",
  signature: "graph.stream(input, stream_mode=\"values\" | \"updates\" | \"messages\" | \"custom\" | \"checkpoints\" | \"tasks\" | \"debug\" | [...], subgraphs=False, version=\"v2\")",
  parameters: [
    { name: "version=\"v2\"", type: "str", description: "Each chunk is a StreamPart dict: {type, ns, data}. Needs LangGraph 1.1+." },
    { name: "subgraphs", type: "bool", description: "Include events from subgraphs; ns tells you which graph produced each." },
  ],
  returns: "An iterator of chunks.",
  notes: ["Pass a list to combine modes.", "messages streams tokens from any LangChain chat model used inside nodes."],
  useCases: ["Token-by-token chat", "Progress updates per node"],
  code: lines(
    "for chunk in graph.stream(",
    "    {\"query\": \"example\"},",
    "    stream_mode=[\"updates\", \"custom\"],",
    "    subgraphs=True,",
    "    version=\"v2\",",
    "):",
    "    print(chunk[\"type\"], chunk[\"ns\"], chunk[\"data\"])",
  ),
  related: ["get_stream_writer", "stream_events"],
});

add("langgraph", "Streaming", "get_stream_writer", "F", "s", {
  page: "oss/python/langgraph/streaming",
  packageName: "langgraph.config",
  description: "Returns a writer that sends custom data from inside a node or tool to the caller, received with stream_mode=\"custom\".",
  signature: "writer = get_stream_writer(); writer({...})",
  parameters: [],
  returns: "A callable that emits one custom chunk per call.",
  notes: ["Works in tools called by agents too."],
  useCases: ["\"Fetched 3 of 10 pages\" progress", "Partial results"],
  code: lines(
    "from langgraph.config import get_stream_writer",
    "",
    "def node(state: dict) -> dict:",
    "    writer = get_stream_writer()",
    "    writer({\"status\": \"working\"})",
    "    return {\"answer\": \"done\"}",
  ),
  related: ["stream_mode"],
});

add("langgraph", "Streaming", "stream_events", "F", "p", {
  page: "oss/python/langgraph/event-streaming",
  packageName: "langgraph (CompiledStateGraph method)",
  description: "The newer event-streaming API. It returns a stream object with separate projections (messages, values, subgraphs, interrupts, output) that can be read independently.",
  signature: "stream = graph.stream_events(input, config, version=\"v3\")  ·  stream.messages · stream.values · stream.subgraphs · stream.interrupts · stream.output",
  parameters: [],
  returns: "A stream object; reading one projection doesn't consume another.",
  notes: ["stream.interrupted is True when the run pauses for human input.", "Custom transformers add your own projections under stream.extensions."],
  useCases: ["Front ends that show messages and state together", "Human-in-the-loop UIs"],
  code: lines(
    "stream = graph.stream_events({\"messages\": [{\"role\": \"user\", \"content\": \"Hi\"}]}, version=\"v3\")",
    "for message in stream.messages:",
    "    print(message)",
    "final_state = stream.output",
  ),
  related: ["stream_mode", "interrupt"],
});

add("langgraph", "Persistence & time travel", "get_state_history", "F", "s", {
  page: "oss/python/langgraph/use-time-travel",
  packageName: "langgraph (CompiledStateGraph method)",
  description: "Lists every checkpoint of a thread, newest first. Use it to inspect past steps, replay from one, or fork the run.",
  signature: "graph.get_state_history(config) -> Iterator[StateSnapshot]",
  parameters: [{ name: "config", type: "dict", description: "Must include configurable.thread_id." }],
  returns: "StateSnapshot objects with values, next, config and metadata.",
  notes: ["Replay: invoke(None, snapshot.config).", "Fork: update_state on an old checkpoint, then invoke(None, new_config). The original history stays intact."],
  useCases: ["Debugging a bad agent decision", "Trying an alternative path"],
  code: lines(
    "config = {\"configurable\": {\"thread_id\": \"1\"}}",
    "history = list(graph.get_state_history(config))",
    "for state in history:",
    "    print(state.next, state.config[\"configurable\"][\"checkpoint_id\"])",
    "graph.invoke(None, history[2].config)",
  ),
  related: ["get_state", "update_state", "StateSnapshot"],
});

add("langgraph", "Persistence & time travel", "durability", "M", "s", {
  page: "oss/python/langgraph/persistence",
  packageName: "langgraph (invoke/stream argument)",
  description: "How eagerly checkpoints are written: only at the end (\"exit\"), in the background while the next step runs (\"async\"), or before every next step (\"sync\").",
  signature: "graph.stream(input, config, durability=\"exit\" | \"async\" | \"sync\")",
  parameters: [],
  returns: "No value; it changes when state is saved.",
  notes: ["exit is fastest but can't recover mid-run after a crash.", "sync is safest for long, expensive runs."],
  useCases: ["Long-running agents that must survive restarts"],
  code: lines(
    "graph.stream(",
    "    {\"input\": \"test\"},",
    "    {\"configurable\": {\"thread_id\": \"1\"}},",
    "    durability=\"sync\",",
    ")",
  ),
  related: ["PostgresSaver", "RetryPolicy"],
});

add("langgraph", "Persistence & time travel", "InMemorySaver", "C", "s", {
  page: "oss/python/langgraph/persistence",
  packageName: "langgraph.checkpoint.memory",
  description: "A checkpointer that keeps checkpoints in memory. Ideal for tests and prototypes; everything is lost when the process stops.",
  signature: "InMemorySaver()",
  parameters: [],
  returns: "A checkpointer for compile(checkpointer=...) or create_agent(checkpointer=...).",
  notes: ["MemorySaver is the older name.", "Use SqliteSaver, PostgresSaver or MongoDBSaver in production."],
  useCases: ["Unit tests", "Notebooks and demos"],
  code: lines(
    "from langgraph.checkpoint.memory import InMemorySaver",
    "",
    "graph = builder.compile(checkpointer=InMemorySaver())",
    "graph.invoke({\"messages\": []}, {\"configurable\": {\"thread_id\": \"1\"}})",
  ),
  related: ["MemorySaver", "PostgresSaver", "get_state_history"],
});

add("langgraph", "Memory store", "get_store", "F", "s", {
  page: "oss/python/langgraph/stores",
  packageName: "langgraph.config",
  description: "Returns the graph's long-term store from inside a node or tool, without passing it explicitly.",
  signature: "store = get_store()",
  parameters: [],
  returns: "The BaseStore compiled into the graph.",
  notes: ["Inside nodes you can also read runtime.store."],
  useCases: ["Saving user memories from a tool"],
  code: lines(
    "from langgraph.config import get_store",
    "",
    "def remember(state: dict) -> dict:",
    "    store = get_store()",
    "    store.put((\"user-1\", \"memories\"), \"food\", {\"likes\": \"pizza\"})",
    "    return {}",
  ),
  related: ["InMemoryStore", "Semantic memory search"],
});

add("langgraph", "Memory store", "Semantic memory search", "M", "s", {
  page: "oss/python/langgraph/stores",
  packageName: "langgraph.store",
  description: "Configure a store with an embedding index to find memories by meaning instead of exact keys.",
  signature: "InMemoryStore(index={\"embed\": embeddings, \"dims\": 1536, \"fields\": [\"$\"]})  ·  store.search(namespace, query=\"...\", limit=3)",
  parameters: [
    { name: "embed", type: "Embeddings", description: "Embedding model, e.g. init_embeddings(\"openai:text-embedding-3-small\")." },
    { name: "fields", type: "list[str]", description: "Which value fields to embed; \"$\" means the whole value." },
  ],
  returns: "search returns SearchItem results ranked by similarity.",
  notes: ["Without query, search lists a namespace (up to limit, default 10)."],
  useCases: ["Recalling relevant user facts in a chatbot"],
  code: lines(
    "from langchain.embeddings import init_embeddings",
    "from langgraph.store.memory import InMemoryStore",
    "",
    "store = InMemoryStore(index={\"embed\": init_embeddings(\"openai:text-embedding-3-small\"), \"dims\": 1536, \"fields\": [\"food_preference\", \"$\"]})",
    "store.put((\"user-1\", \"memories\"), \"1\", {\"food_preference\": \"I love Italian food\"})",
    "print(store.search((\"user-1\", \"memories\"), query=\"What food does the user like?\", limit=3))",
  ),
  related: ["InMemoryStore", "get_store", "SearchItem"],
});

add("langgraph", "Fault tolerance & caching", "RetryPolicy", "C", "s", {
  page: "oss/python/langgraph/fault-tolerance",
  packageName: "langgraph.types",
  description: "Retries a node automatically when it raises, with configurable attempts, backoff and which errors count.",
  signature: "builder.add_node(\"call_api\", fn, retry_policy=RetryPolicy(max_attempts=3, retry_on=...))",
  parameters: [
    { name: "max_attempts", type: "int", description: "Total attempts including the first." },
    { name: "retry_on", type: "type | Callable", description: "Errors to retry; default_retry_on is the built-in rule." },
  ],
  returns: "Nothing; it configures the node.",
  notes: ["Completed nodes in the same step aren't re-run thanks to pending writes."],
  useCases: ["Calling flaky APIs", "Rate-limited model calls"],
  code: lines(
    "from langgraph.types import RetryPolicy",
    "",
    "builder.add_node(\"call_model\", call_model, retry_policy=RetryPolicy(max_attempts=3))",
  ),
  related: ["TimeoutPolicy", "durability"],
});

add("langgraph", "Fault tolerance & caching", "TimeoutPolicy", "C", "s", {
  page: "oss/python/langgraph/fault-tolerance",
  packageName: "langgraph.types",
  description: "Limits how long an async node may run in total (run_timeout) or without progress (idle_timeout).",
  signature: "builder.add_node(\"call_model\", fn, timeout=TimeoutPolicy(run_timeout=120, idle_timeout=30))",
  parameters: [{ name: "timeout", type: "int | timedelta | TimeoutPolicy", description: "A number or timedelta sets a simple wall-clock cap." }],
  returns: "NodeTimeoutError when exceeded, which a RetryPolicy can retry.",
  notes: ["Only async nodes support timeouts; sync nodes with a timeout fail at compile time."],
  useCases: ["Stopping hung model or HTTP calls"],
  code: lines(
    "from langgraph.types import RetryPolicy, TimeoutPolicy",
    "",
    "builder.add_node(",
    "    \"call_model\",",
    "    call_model,",
    "    timeout=TimeoutPolicy(run_timeout=120, idle_timeout=30),",
    "    retry_policy=RetryPolicy(max_attempts=3),",
    ")",
  ),
  related: ["RetryPolicy"],
});

add("langgraph", "Fault tolerance & caching", "CachePolicy", "C", "s", {
  page: "oss/python/langgraph/graph-api",
  packageName: "langgraph.types",
  description: "Caches a node's result by its input, so repeated inputs skip the work. Compile the graph with a cache such as InMemoryCache.",
  signature: "builder.add_node(\"expensive\", fn, cache_policy=CachePolicy(ttl=120))  ·  builder.compile(cache=InMemoryCache())",
  parameters: [
    { name: "ttl", type: "int | None", description: "Seconds until an entry expires; omit to keep it forever." },
    { name: "key_func", type: "Callable", description: "Builds the cache key from the node input." },
  ],
  returns: "Nothing; it configures the node.",
  notes: ["InMemoryCache is imported from langgraph.cache.memory."],
  useCases: ["Expensive retrieval or computations"],
  code: lines(
    "from langgraph.cache.memory import InMemoryCache",
    "from langgraph.types import CachePolicy",
    "",
    "builder.add_node(\"expensive_node\", expensive_node, cache_policy=CachePolicy(ttl=3))",
    "graph = builder.compile(cache=InMemoryCache())",
  ),
  related: ["RetryPolicy", "StateGraph"],
});

add("langgraph", "Prebuilt & deployment", "ToolNode", "C", "s", {
  page: "oss/python/langgraph/use-graph-api",
  packageName: "langgraph.prebuilt",
  description: "A node that runs the tool calls in the last AI message (in parallel) and adds the results as ToolMessages. It also applies Commands returned by tools.",
  signature: "ToolNode(tools, handle_tool_errors=True)",
  parameters: [{ name: "handle_tool_errors", type: "bool | str | callable", description: "Turn exceptions into error messages for the model instead of failing." }],
  returns: "A node to add with add_node(\"tools\", ToolNode(tools)).",
  notes: ["Pair with tools_condition to loop between model and tools."],
  useCases: ["Building a custom ReAct loop"],
  code: lines(
    "from langgraph.graph import START, MessagesState, StateGraph",
    "from langgraph.prebuilt import ToolNode, tools_condition",
    "",
    "builder = StateGraph(MessagesState)",
    "builder.add_node(\"agent\", call_model)",
    "builder.add_node(\"tools\", ToolNode([get_weather]))",
    "builder.add_edge(START, \"agent\")",
    "builder.add_conditional_edges(\"agent\", tools_condition)",
    "builder.add_edge(\"tools\", \"agent\")",
  ),
  related: ["tools_condition", "create_react_agent"],
});

add("langgraph", "Prebuilt & deployment", "tools_condition", "F", "s", {
  page: "oss/python/langgraph/use-graph-api",
  packageName: "langgraph.prebuilt",
  description: "A ready-made router: goes to the \"tools\" node if the last message has tool calls, otherwise to END.",
  signature: "builder.add_conditional_edges(\"agent\", tools_condition)",
  parameters: [],
  returns: "\"tools\" or END.",
  notes: ["Name your tool node \"tools\", or pass a path_map."],
  useCases: ["The standard model ↔ tools loop"],
  code: lines(
    "from langgraph.prebuilt import tools_condition",
    "",
    "builder.add_conditional_edges(\"agent\", tools_condition)",
  ),
  related: ["ToolNode", "add_conditional_edges"],
});

add("langgraph", "Prebuilt & deployment", "langgraph.json", "M", "s", {
  page: "oss/python/langgraph/application-structure",
  packageName: "langgraph-cli",
  description: "The configuration file that tells the LangGraph CLI and Agent Server which graphs to serve, which dependencies to install and where environment variables come from.",
  signature: "{ \"dependencies\": [...], \"graphs\": { \"agent\": \"./src/agent.py:graph\" }, \"env\": \"./.env\" }",
  parameters: [
    { name: "graphs", type: "object", description: "Graph ID → path:variable of a compiled graph (or a factory)." },
    { name: "dependencies", type: "array", description: "Packages or local paths to install." },
    { name: "env", type: "string | object", description: "A .env file path or inline variables." },
  ],
  returns: "Used by langgraph dev, langgraph build and deployments.",
  notes: ["Graph IDs are what clients and async subagents refer to."],
  useCases: ["Preparing an agent for deployment"],
  code: lines(
    "{",
    "  \"dependencies\": [\"langchain_openai\", \"./your_package\"],",
    "  \"graphs\": { \"agent\": \"./your_package/agent.py:graph\" },",
    "  \"env\": \"./.env\"",
    "}",
  ),
  language: "json",
  related: ["langgraph dev", "RemoteGraph"],
});

add("langgraph", "Prebuilt & deployment", "langgraph dev", "CLI", "s", {
  page: "oss/python/langgraph/local-server",
  packageName: "langgraph-cli[inmem]",
  description: "Starts a local Agent Server in memory with hot reload, and links to LangSmith Studio to visualise and debug the graph.",
  signature: "langgraph dev [--tunnel] [--port 2024]",
  parameters: [{ name: "--tunnel", type: "flag", description: "Exposes the server through a public tunnel, useful for browsers that block localhost." }],
  returns: "An API at http://127.0.0.1:2024 plus a Studio link.",
  notes: ["In-memory mode is for development only; deploy with persistent storage for production.", "Install with pip install -U \"langgraph-cli[inmem]\"."],
  useCases: ["Local testing with Studio", "Trying the SDK against a running server"],
  code: lines(
    "pip install -U \"langgraph-cli[inmem]\"",
    "langgraph dev",
  ),
  language: "bash",
  related: ["langgraph.json", "RemoteGraph"],
});

add("langgraph", "Prebuilt & deployment", "RemoteGraph", "C", "s", {
  page: "oss/python/langgraph/deploy",
  packageName: "langgraph.pregel.remote",
  description: "Calls a deployed graph with the same interface as a local one (invoke, stream, get_state), so a deployment can be used as a node or subgraph.",
  signature: "RemoteGraph(graph_id, url=None, api_key=None)",
  parameters: [
    { name: "graph_id", type: "str", description: "The graph name from langgraph.json." },
    { name: "url", type: "str", description: "The deployment URL." },
  ],
  returns: "A graph-like object.",
  notes: ["Pass a thread_id in config to keep state on the server."],
  useCases: ["Calling a deployed agent from another service", "Composing deployments"],
  code: lines(
    "from langgraph.pregel.remote import RemoteGraph",
    "",
    "remote = RemoteGraph(\"agent\", url=\"http://127.0.0.1:2024\")",
    "result = remote.invoke({\"messages\": [{\"role\": \"user\", \"content\": \"Hello\"}]})",
  ),
  related: ["langgraph dev", "langgraph.json"],
});

/* ═════════════════════════════ Integrations ═════════════════════════════ */

sections("integrations", ["Chat models", "Embeddings & rerankers", "Vector stores", "Document loaders", "Tools & search", "MCP", "Checkpointers", "Callbacks"]);
place("integrations", "Chat models", ["ChatOpenAI", "ChatAnthropic", "ChatGoogleGenerativeAI", "ChatBedrock", "ChatGroq", "ChatOllama", "ChatMistralAI", "ChatCohere", "ChatVertexAI", "ChatTogether", "ChatFireworks"]);
place("integrations", "Embeddings & rerankers", ["OpenAIEmbeddings", "GoogleGenerativeAIEmbeddings", "BedrockEmbeddings", "HuggingFaceEmbeddings", "OllamaEmbeddings", "MistralAIEmbeddings", "CohereEmbeddings", "CohereRerank", "VertexAIEmbeddings"]);
place("integrations", "Vector stores", ["PineconeVectorStore", "Chroma", "PGVector", "QdrantVectorStore", "FAISS", "Milvus", "WeaviateVectorStore", "VectorStoreRetriever"]);
place("integrations", "Tools & search", ["TavilySearchResults", "DuckDuckGoSearchRun", "WikipediaQueryRun", "ArxivQueryRun"]);
place("integrations", "MCP", ["MultiServerMCPClient", "BaseMCPClient", "StdioServerTransport", "SseServerTransport"]);
place("integrations", "Callbacks", ["StreamlitCallbackHandler"]);

function chatModel(name: string, pkg: string, page: string, description: string, init: string, notes: string[], related: string[], imports = `from ${pkg.replace(/-/g, "_")} import ${name}`) {
  add("integrations", "Chat models", name, "C", "s", {
    page, packageName: pkg, description,
    signature: init,
    parameters: [{ name: "model", type: "str", description: "The provider's model ID." }, { name: "temperature / max_tokens", type: "float / int", description: "Standard generation settings." }],
    returns: "A LangChain chat model with invoke, stream, batch, bind_tools and with_structured_output.",
    notes,
    useCases: ["Using this provider in create_agent or a LangGraph node", "Switching providers without changing the rest of the code"],
    code: lines(imports, "", `model = ${init}`, "reply = model.invoke(\"Explain vector databases in one sentence\")", "print(reply.content)"),
    related,
  });
}

chatModel("AzureChatOpenAI", "langchain-openai", "oss/python/integrations/providers/microsoft",
  "Chat model for OpenAI models deployed on Azure OpenAI / Microsoft Foundry.",
  "AzureChatOpenAI(azure_deployment=\"gpt-5.4-mini\", api_version=\"2025-04-01-preview\")",
  ["Reads AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT.", "On Azure's v1 API you can use ChatOpenAI directly against your Azure endpoint without api_version."],
  ["ChatOpenAI", "OpenAIEmbeddings"]);
chatModel("ChatXAI", "langchain-xai", "oss/python/integrations/chat/index",
  "Chat model for xAI's Grok models.", "ChatXAI(model=\"grok-4\")",
  ["Reads XAI_API_KEY.", "Supports tool calling and structured output."], ["ChatOpenAI", "ChatGroq"]);
chatModel("ChatDeepSeek", "langchain-deepseek", "oss/python/integrations/chat/index",
  "Chat model for DeepSeek, including its reasoning models.", "ChatDeepSeek(model=\"deepseek-chat\")",
  ["Reads DEEPSEEK_API_KEY.", "Reasoning output is exposed as reasoning content blocks."], ["ChatOpenAI", "ChatTogether"]);
chatModel("ChatPerplexity", "langchain-perplexity", "oss/python/integrations/chat/index",
  "Chat model for Perplexity's search-grounded Sonar models.", "ChatPerplexity(model=\"sonar\")",
  ["Reads PPLX_API_KEY.", "The same package provides PerplexitySearchRetriever for search results."], ["TavilySearch", "ChatOpenAI"]);
chatModel("ChatHuggingFace", "langchain-huggingface", "oss/python/integrations/providers/huggingface",
  "Chat model over Hugging Face models, through Inference Providers or a local pipeline.",
  "ChatHuggingFace(llm=HuggingFaceEndpoint(repo_id=\"Qwen/Qwen3-8B\"))",
  ["Wraps an HuggingFaceEndpoint or HuggingFacePipeline LLM.", "Reads HUGGINGFACEHUB_API_TOKEN for hosted models."], ["HuggingFaceEmbeddings", "ChatOllama"],
  "from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint");
chatModel("ChatNVIDIA", "langchain-nvidia-ai-endpoints", "oss/python/integrations/providers/nvidia",
  "Chat model for NVIDIA NIM endpoints, hosted or self-hosted.", "ChatNVIDIA(model=\"meta/llama-3.3-70b-instruct\")",
  ["Reads NVIDIA_API_KEY for the hosted catalogue.", "Point base_url at your own NIM container to self-host."], ["ChatOpenAI", "ChatOllama"]);
chatModel("ChatOpenRouter", "langchain-openrouter", "oss/python/integrations/chat/index",
  "Chat model for OpenRouter, one API for models from OpenAI, Anthropic, Google, Meta and more.", "ChatOpenRouter(model=\"anthropic/claude-sonnet-5\")",
  ["Reads OPENROUTER_API_KEY.", "Model names are vendor/model strings."], ["ChatOpenAI", "ChatAnthropic"]);

add("integrations", "Embeddings & rerankers", "VoyageAIEmbeddings", "C", "s", {
  page: "oss/python/integrations/embeddings/index",
  packageName: "langchain-voyageai",
  description: "Embeddings from Voyage AI, strong for retrieval including code and domain-specific models.",
  signature: "VoyageAIEmbeddings(model=\"voyage-3.5\")",
  parameters: [{ name: "model", type: "str", description: "A Voyage embedding model." }],
  returns: "An Embeddings object with embed_documents and embed_query.",
  notes: ["Reads VOYAGE_API_KEY."],
  useCases: ["High-quality RAG retrieval", "Code search"],
  code: lines("from langchain_voyageai import VoyageAIEmbeddings", "", "embeddings = VoyageAIEmbeddings(model=\"voyage-3.5\")", "vector = embeddings.embed_query(\"What is LangGraph?\")"),
  related: ["OpenAIEmbeddings", "CohereRerank"],
});

function vectorStore(name: string, pkg: string, importPath: string, description: string, init: string, notes: string[]) {
  add("integrations", "Vector stores", name, "C", "s", {
    page: "oss/python/integrations/vectorstores/index",
    packageName: pkg, description, signature: init,
    parameters: [{ name: "embedding", type: "Embeddings", description: "The model that turns text into vectors." }],
    returns: "A VectorStore with add_documents, similarity_search and as_retriever.",
    notes,
    useCases: ["Retrieval-augmented generation", "Semantic search over documents"],
    code: lines(`from ${importPath} import ${name}`, "from langchain_openai import OpenAIEmbeddings", "", `store = ${init.replace("embeddings", "OpenAIEmbeddings()")}`, "store.add_texts([\"LangGraph builds stateful agents.\"])", "print(store.similarity_search(\"What builds agents?\", k=1))"),
    related: ["VectorStoreRetriever", "Chroma", "OpenAIEmbeddings"],
  });
}
vectorStore("InMemoryVectorStore", "langchain-core", "langchain_core.vectorstores", "A vector store kept in memory. The quickest way to prototype RAG; nothing persists.", "InMemoryVectorStore(embedding=embeddings)", ["Good for tests and demos only.", "No extra package or server needed."]);
vectorStore("ElasticsearchStore", "langchain-elasticsearch", "langchain_elasticsearch", "Vector and hybrid search on Elasticsearch.", "ElasticsearchStore(index_name=\"docs\", embedding=embeddings, es_url=\"http://localhost:9200\")", ["Supports hybrid keyword and vector retrieval strategies."]);
vectorStore("MongoDBAtlasVectorSearch", "langchain-mongodb", "langchain_mongodb", "Vector search inside MongoDB Atlas collections, next to your application data.", "MongoDBAtlasVectorSearch(collection=collection, embedding=embeddings, index_name=\"vector_index\")", ["Create an Atlas Vector Search index first.", "The same package offers MongoDBSaver for LangGraph checkpoints."]);
vectorStore("RedisVectorStore", "langchain-redis", "langchain_redis", "Vector search on Redis, useful when Redis already serves your app.", "RedisVectorStore(embeddings, redis_url=\"redis://localhost:6379\")", ["Needs Redis with the search module (Redis Stack or Redis 8)."]);

add("integrations", "Document loaders", "PyPDFLoader", "C", "s", {
  page: "oss/python/integrations/document_loaders/index",
  packageName: "langchain-community",
  description: "Loads a PDF with pypdf, one Document per page with page metadata.",
  signature: "PyPDFLoader(file_path).load() -> list[Document]",
  parameters: [{ name: "file_path", type: "str", description: "Local path or URL of the PDF." }],
  returns: "A list of Documents.",
  notes: ["Use lazy_load() for large files.", "Split pages with RecursiveCharacterTextSplitter before embedding."],
  useCases: ["Indexing manuals and reports for RAG"],
  code: lines("from langchain_community.document_loaders import PyPDFLoader", "", "pages = PyPDFLoader(\"handbook.pdf\").load()", "print(len(pages), pages[0].metadata)"),
  related: ["DoclingLoader", "InMemoryVectorStore"],
});

add("integrations", "Document loaders", "DoclingLoader", "C", "s", {
  page: "oss/python/integrations/document_loaders/index",
  packageName: "langchain-docling",
  description: "Parses PDFs, Office files, HTML and more with Docling, keeping layout such as tables and headings.",
  signature: "DoclingLoader(file_path=FILE_PATH).load()",
  parameters: [{ name: "file_path", type: "str | list[str]", description: "One or more files or URLs." }],
  returns: "Documents with structure-aware chunks.",
  notes: ["Better than plain text extraction for tables and complex layouts."],
  useCases: ["RAG over complex PDFs"],
  code: lines("from langchain_docling.loader import DoclingLoader", "", "docs = DoclingLoader(file_path=\"https://arxiv.org/pdf/2408.09869\").load()", "print(docs[0].page_content[:200])"),
  related: ["PyPDFLoader"],
});

add("integrations", "Tools & search", "TavilySearch", "C", "s", {
  page: "oss/python/integrations/tools/index",
  packageName: "langchain-tavily",
  description: "Web search built for agents, from the dedicated langchain-tavily package. It replaces the older community TavilySearchResults tool.",
  signature: "TavilySearch(max_results=5, topic=\"general\")",
  parameters: [
    { name: "max_results", type: "int", description: "How many results to return." },
    { name: "topic", type: "str", description: "general, news or finance." },
  ],
  returns: "A tool returning titles, URLs, content and an optional answer.",
  notes: ["Reads TAVILY_API_KEY.", "The package also has Tavily extract, crawl and map tools."],
  useCases: ["Giving an agent up-to-date web knowledge"],
  code: lines(
    "from langchain.agents import create_agent",
    "from langchain_tavily import TavilySearch",
    "",
    "agent = create_agent(model=\"openai:gpt-5.5\", tools=[TavilySearch(max_results=3)])",
  ),
  related: ["TavilySearchResults", "DuckDuckGoSearchRun"],
});

add("integrations", "Checkpointers", "MongoDBSaver", "C", "s", {
  page: "oss/python/integrations/checkpointers/index",
  packageName: "langgraph-checkpoint-mongodb",
  description: "A LangGraph checkpointer that stores threads in MongoDB, for production agents that already use MongoDB.",
  signature: "MongoDBSaver(client, db_name=\"checkpoints\")",
  parameters: [{ name: "client", type: "MongoClient", description: "A connected PyMongo client." }],
  returns: "A checkpointer for compile(checkpointer=...) or create_agent(checkpointer=...).",
  notes: ["Postgres users choose PostgresSaver from langgraph-checkpoint-postgres."],
  useCases: ["Durable chat history in production"],
  code: lines(
    "from langgraph.checkpoint.mongodb import MongoDBSaver",
    "from pymongo import MongoClient",
    "",
    "checkpointer = MongoDBSaver(MongoClient(\"mongodb://localhost:27017\"))",
    "graph = builder.compile(checkpointer=checkpointer)",
  ),
  related: ["MongoDBAtlasVectorSearch"],
});

/* ═════════════════════════════ LangSmith ═════════════════════════════ */

sections("langsmith", ["Setup", "Tracing", "Evaluation", "Datasets & feedback", "Prompts", "Testing (pytest & Vitest)", "Clients"]);
place("langsmith", "Clients", ["Client", "AsyncClient", "ApiKeyAuth", "create_presigned_url"]);
place("langsmith", "Tracing", ["traceable", "wrap_openai", "RunTree", "tracing_context", "get_current_run_tree", "Run", "Trace", "RunType"]);
place("langsmith", "Evaluation", ["evaluate", "aevaluate", "run_on_dataset", "EvaluationResult", "RunEvaluator", "StringEvaluator", "DynamicRunEvaluator", "ExactMatchEvaluator", "CriteriaEvaluator", "EmbeddingDistanceEvaluator", "as_run_evaluator"]);
place("langsmith", "Datasets & feedback", ["Dataset", "Example", "Feedback", "FeedbackSource", "FeedbackCategory", "ScoreType"]);
place("langsmith", "Testing (pytest & Vitest)", ["expect", "unit", "pytest-plugin"]);

function envVar(name: string, description: string, value: string, notes: string[], related: string[]) {
  add("langsmith", "Setup", name, "K", "s", {
    page: "langsmith/observability-quickstart",
    packageName: "langsmith (environment)",
    description, signature: `${name}=${value}`, parameters: [],
    returns: "Read by the SDK at start-up; no code changes needed.",
    notes, useCases: ["Configuring tracing per environment"],
    code: lines(`export ${name}=${value}`),
    language: "bash", related,
  });
}
envVar("LANGSMITH_TRACING", "Turns tracing on. Wrappers and @traceable only send traces when this is true.", "true", ["Set it to false to switch tracing off without code changes.", "tracing_context(enabled=...) overrides it for a block of code."], ["LANGSMITH_API_KEY", "traceable", "tracing_context"]);
envVar("LANGSMITH_API_KEY", "Your LangSmith API key, used to authenticate every trace and API call.", "<your-api-key>", ["Keep it in a secret manager or .env file, never in source code."], ["LANGSMITH_TRACING", "Client"]);
envVar("LANGSMITH_PROJECT", "The tracing project that receives runs. Defaults to \"default\".", "my-agent-prod", ["Use one project per app and environment to keep traces easy to filter."], ["LANGSMITH_TRACING"]);
envVar("LANGSMITH_ENDPOINT", "The API endpoint. Set it for non-US regions or self-hosted LangSmith.", "https://eu.api.smith.langchain.com", ["Don't add a trailing slash."], ["LANGSMITH_API_KEY"]);

add("langsmith", "Tracing", "wrap_anthropic", "F", "s", {
  page: "langsmith/trace-anthropic",
  packageName: "langsmith.wrappers",
  description: "Wraps an Anthropic client so every messages call is traced, with tool calls and multimodal content rendered properly.",
  signature: "client = wrap_anthropic(anthropic.Anthropic())",
  parameters: [],
  returns: "The same client, now traced.",
  notes: ["LANGSMITH_TRACING must be true.", "Works alongside @traceable for the rest of your code."],
  useCases: ["Tracing a Claude-based app without LangChain"],
  code: lines(
    "import anthropic",
    "from langsmith.wrappers import wrap_anthropic",
    "",
    "client = wrap_anthropic(anthropic.Anthropic())",
    "message = client.messages.create(",
    "    model=\"claude-sonnet-5\",",
    "    max_tokens=200,",
    "    messages=[{\"role\": \"user\", \"content\": \"Hello\"}],",
    ")",
  ),
  related: ["wrap_openai", "traceable"],
});

add("langsmith", "Tracing", "Metadata & tags", "M", "s", {
  page: "langsmith/add-metadata-tags",
  packageName: "langsmith",
  description: "Attach tags and metadata to runs so traces can be filtered and grouped, for example by user, version or feature.",
  signature: "@traceable(tags=[...], metadata={...})  ·  fn(..., langsmith_extra={\"tags\": [...], \"metadata\": {...}})  ·  tracing_context(metadata={...})",
  parameters: [
    { name: "tags", type: "list[str]", description: "Short labels such as \"beta\" or \"checkout\"." },
    { name: "metadata", type: "dict", description: "Key-value pairs such as user_id or app_version." },
  ],
  returns: "Searchable fields on the run.",
  notes: ["langsmith_extra sets them per call; tracing_context sets defaults for a block."],
  useCases: ["Comparing app versions", "Finding one user's traces"],
  code: lines(
    "import langsmith as ls",
    "",
    "@ls.traceable(tags=[\"my-tag\"], metadata={\"my-key\": \"my-value\"})",
    "def answer(question: str) -> str:",
    "    return \"42\"",
    "",
    "answer(\"meaning?\", langsmith_extra={\"metadata\": {\"user_id\": \"u-1\"}})",
  ),
  related: ["traceable", "tracing_context", "Threads"],
});

add("langsmith", "Tracing", "Threads", "M", "s", {
  page: "langsmith/threads",
  packageName: "langsmith",
  description: "Groups the traces of one conversation. Set session_id, thread_id or conversation_id in metadata on every run, and LangSmith shows them as a thread.",
  signature: "langsmith_extra={\"metadata\": {\"session_id\": \"conv-123\"}}",
  parameters: [],
  returns: "A thread view with all turns, token counts and costs.",
  notes: ["Set the key on all runs, including child runs, for filtering and token totals to work.", "LangGraph thread IDs are linked automatically."],
  useCases: ["Reviewing whole conversations", "Multi-turn online evaluation"],
  code: lines(
    "import langsmith as ls",
    "",
    "@ls.traceable",
    "def chat_turn(message: str) -> str:",
    "    return \"reply\"",
    "",
    "chat_turn(\"Hi\", langsmith_extra={\"metadata\": {\"session_id\": \"conv-123\"}})",
  ),
  related: ["Metadata & tags", "traceable"],
});

add("langsmith", "Tracing", "Distributed tracing", "M", "s", {
  page: "langsmith/distributed-tracing",
  packageName: "langsmith",
  description: "Continues one trace across services by passing trace headers in HTTP requests.",
  signature: "headers.update(get_current_run_tree().to_headers())  ·  with tracing_context(parent=request.headers): ...",
  parameters: [],
  returns: "Spans from both services appear in one trace.",
  notes: ["The client sends langsmith-trace and baggage headers; the server continues from them."],
  useCases: ["Tracing a front-end API call into a separate agent service"],
  code: lines(
    "import langsmith as ls",
    "",
    "@ls.traceable",
    "def handle(request):",
    "    with ls.tracing_context(parent=request.headers):",
    "        return run_agent(request.json())",
  ),
  related: ["get_current_run_tree", "tracing_context"],
});

add("langsmith", "Evaluation", "create_llm_as_judge", "F", "s", {
  page: "langsmith/openevals",
  packageName: "openevals.llm",
  description: "Builds an LLM-as-judge evaluator from a prompt. openevals ships ready-made prompts such as CORRECTNESS_PROMPT.",
  signature: "create_llm_as_judge(prompt, model=\"openai:gpt-5.5\", feedback_key=\"correctness\")",
  parameters: [
    { name: "prompt", type: "str", description: "Judge instructions; prebuilt prompts live in openevals.prompts." },
    { name: "feedback_key", type: "str", description: "The name of the score in your experiment." },
  ],
  returns: "An evaluator callable for evaluate() or pytest tests.",
  notes: ["Install with pip install openevals.", "TypeScript: createLLMAsJudge from \"openevals\"."],
  useCases: ["Scoring correctness or helpfulness", "Grading RAG answers against references"],
  code: lines(
    "from openevals.llm import create_llm_as_judge",
    "from openevals.prompts import CORRECTNESS_PROMPT",
    "",
    "correctness = create_llm_as_judge(prompt=CORRECTNESS_PROMPT, model=\"openai:gpt-5.5\", feedback_key=\"correctness\")",
    "result = correctness(inputs={\"q\": \"2+2\"}, outputs={\"a\": \"4\"}, reference_outputs={\"a\": \"4\"})",
  ),
  related: ["evaluate", "Pairwise evaluation"],
});

add("langsmith", "Evaluation", "Pairwise evaluation", "M", "s", {
  page: "langsmith/evaluate-pairwise",
  packageName: "langsmith",
  description: "Compares two existing experiments side by side. A pairwise evaluator sees both outputs for each example and ranks them.",
  signature: "evaluate((\"experiment-a\", \"experiment-b\"), evaluators=[ranked_preference], randomize_order=True)",
  parameters: [{ name: "randomize_order", type: "bool", description: "Shuffle the outputs per example to reduce position bias." }],
  returns: "A comparative experiment with a preference score per example.",
  notes: ["evaluate_comparative() handles more than two experiments."],
  useCases: ["Choosing between prompt or model versions"],
  code: lines(
    "from langsmith import evaluate",
    "",
    "def ranked_preference(inputs: dict, outputs: list[dict]) -> list:",
    "    first_longer = len(outputs[0][\"answer\"]) > len(outputs[1][\"answer\"])",
    "    return [1, 0] if first_longer else [0, 1]",
    "",
    "evaluate((\"prompt-v1\", \"prompt-v2\"), evaluators=[ranked_preference], randomize_order=True)",
  ),
  related: ["evaluate", "create_llm_as_judge"],
});

add("langsmith", "Datasets & feedback", "create_dataset", "F", "s", {
  page: "langsmith/manage-datasets-programmatically",
  packageName: "langsmith (Client method)",
  description: "Creates a dataset for evaluations; add examples with create_examples in one bulk request.",
  signature: "client.create_dataset(dataset_name, description=None)  ·  client.create_examples(dataset_id=..., examples=[...])",
  parameters: [{ name: "examples", type: "list[dict]", description: "Each has inputs, optional outputs (references) and metadata." }],
  returns: "A Dataset.",
  notes: ["Use create_example for a single example."],
  useCases: ["Building a regression test set", "Turning production traces into examples"],
  code: lines(
    "from langsmith import Client",
    "",
    "client = Client()",
    "dataset = client.create_dataset(\"qa-basics\", description=\"Simple QA pairs\")",
    "client.create_examples(",
    "    dataset_id=dataset.id,",
    "    examples=[{\"inputs\": {\"question\": \"2+2?\"}, \"outputs\": {\"answer\": \"4\"}}],",
    ")",
  ),
  related: ["Dataset", "Example", "evaluate"],
});

add("langsmith", "Datasets & feedback", "create_feedback", "F", "s", {
  page: "langsmith/attach-user-feedback",
  packageName: "langsmith (Client method)",
  description: "Records feedback such as a thumbs up or a score on a run, typically from your app's users.",
  signature: "client.create_feedback(run_id=None, key=..., score=None, comment=None, trace_id=None)",
  parameters: [
    { name: "key", type: "str", description: "Feedback name, e.g. \"user_score\"." },
    { name: "score", type: "float | bool", description: "The value." },
    { name: "trace_id", type: "UUID", description: "When passed, the Python client sends feedback in the background." },
  ],
  returns: "A Feedback object.",
  notes: ["Get the run ID from the trace context when the request is handled."],
  useCases: ["Thumbs up/down in a chat UI", "Collecting labels for datasets"],
  code: lines(
    "from langsmith import Client",
    "",
    "client = Client()",
    "client.create_feedback(run_id=run_id, key=\"user_score\", score=1.0, comment=\"Helpful answer\")",
  ),
  related: ["Feedback", "create_presigned_url"],
});

add("langsmith", "Prompts", "push_prompt", "F", "s", {
  page: "langsmith/manage-prompts-programmatically",
  packageName: "langsmith (Client method)",
  description: "Saves a prompt (or a prompt with its model) to LangSmith, creating a new commit you can version and share.",
  signature: "client.push_prompt(prompt_identifier, object=prompt)",
  parameters: [{ name: "object", type: "ChatPromptTemplate | Runnable", description: "A prompt, or prompt | model to save the model settings too." }],
  returns: "The URL of the new prompt commit.",
  notes: ["Every push is a commit; tag commits to promote versions."],
  useCases: ["Letting non-developers edit prompts", "Versioning prompts with your releases"],
  code: lines(
    "from langchain_core.prompts import ChatPromptTemplate",
    "from langsmith import Client",
    "",
    "client = Client()",
    "prompt = ChatPromptTemplate.from_template(\"Tell me a joke about {topic}\")",
    "url = client.push_prompt(\"joke-generator\", object=prompt)",
  ),
  related: ["pull_prompt"],
});

add("langsmith", "Prompts", "pull_prompt", "F", "s", {
  page: "langsmith/manage-prompts-programmatically",
  packageName: "langsmith (Client method)",
  description: "Loads a saved prompt, optionally with its model configuration, so code always uses the latest or a pinned version.",
  signature: "client.pull_prompt(\"name[:commit-or-tag]\", include_model=False)",
  parameters: [{ name: "include_model", type: "bool", description: "Return prompt | model ready to invoke." }],
  returns: "A ChatPromptTemplate, or a runnable chain when include_model=True.",
  notes: ["Pin a commit hash or tag in production for reproducibility."],
  useCases: ["Hot-swapping prompts without a deploy"],
  code: lines(
    "from langsmith import Client",
    "",
    "client = Client()",
    "chain = client.pull_prompt(\"joke-generator-with-model\", include_model=True)",
    "print(chain.invoke({\"topic\": \"cats\"}))",
  ),
  related: ["push_prompt"],
});

add("langsmith", "Testing (pytest & Vitest)", "pytest.mark.langsmith", "@", "s", {
  page: "langsmith/pytest",
  packageName: "langsmith[pytest]",
  description: "Marks a pytest test to be tracked in LangSmith: inputs, outputs, feedback and pass/fail become an experiment.",
  signature: "@pytest.mark.langsmith  ·  langsmith.testing: log_inputs · log_outputs · log_reference_outputs · log_feedback · trace_feedback",
  parameters: [],
  returns: "Results in a LangSmith test suite (set LANGSMITH_TEST_SUITE).",
  notes: ["Run with --langsmith-output for a results table.", "LANGSMITH_TEST_TRACKING=false runs locally without syncing; LANGSMITH_TEST_CACHE caches HTTP calls."],
  useCases: ["LLM tests in CI", "Tracking quality over time"],
  code: lines(
    "import pytest",
    "from langsmith import testing as t",
    "",
    "@pytest.mark.langsmith",
    "def test_addition() -> None:",
    "    t.log_inputs({\"a\": 2, \"b\": 3})",
    "    t.log_reference_outputs({\"sum\": 5})",
    "    result = 2 + 3",
    "    t.log_outputs({\"sum\": result})",
    "    t.log_feedback(key=\"is_correct\", score=result == 5)",
    "    assert result == 5",
  ),
  related: ["pytest-plugin", "expect", "Vitest & Jest"],
});

add("langsmith", "Testing (pytest & Vitest)", "Vitest & Jest", "M", "s", {
  page: "langsmith/vitest-jest",
  packageName: "langsmith/vitest · langsmith/jest",
  description: "TypeScript test integration. Import describe and test from langsmith/vitest or langsmith/jest; each test logs inputs, outputs and feedback to LangSmith.",
  signature: "import * as ls from \"langsmith/vitest\"; ls.describe(name, fn); ls.test(name, { inputs, referenceOutputs }, fn); ls.logOutputs({...})",
  parameters: [],
  returns: "A LangSmith experiment per test suite.",
  notes: ["Add the reporter (langsmith/vitest/reporter) to your test config for a results table."],
  useCases: ["Evaluating a TypeScript agent in CI"],
  code: lines(
    "import * as ls from \"langsmith/vitest\";",
    "",
    "ls.describe(\"generate sql demo\", () => {",
    "  ls.test(\"lists users\", { inputs: { question: \"all users\" }, referenceOutputs: { sql: \"SELECT * FROM users;\" } }, async ({ inputs }) => {",
    "    const sql = \"SELECT * FROM users;\";",
    "    ls.logOutputs({ sql });",
    "  });",
    "});",
  ),
  language: "typescript",
  related: ["pytest.mark.langsmith"],
});

/* ═════════════════════════════ Langflow ═════════════════════════════ */

// Langflow's existing entries are grouped by kind; see LANGFLOW_KIND_SECTIONS.
sections("langflow", ["Concepts", "Components", "Command line", "REST API", "Python & TypeScript API", "Settings & headers"]);

function component(name: string, page: string, draft: Omit<Draft, "page" | "packageName" | "language">) {
  add("langflow", "Components", name, "Co", "s", { page, packageName: "Langflow core components", language: "text", ...draft });
}

component("API Request", "api-request", {
  description: "Sends HTTP requests to one or more URLs, or runs a full curl command, and returns the response as JSON.",
  signature: "API Request(mode: URL | curl, urls, method, query_params, body, headers, timeout, follow_redirects=False)",
  parameters: [
    { name: "mode", type: "URL | curl", description: "Call comma-separated URLs, or paste a curl command that fills the other fields." },
    { name: "body / headers", type: "dict", description: "Sent with POST, PATCH and PUT requests." },
    { name: "follow_redirects", type: "bool", description: "Off by default since 1.7 to reduce SSRF risk." },
    { name: "include_httpx_metadata", type: "bool", description: "Adds status code, headers and redirect history." },
  ],
  returns: "A JSON object with the response.",
  notes: ["Some fields are hidden; open the inspection panel to see all.", "Provider-specific API components live in Bundles.", "Enable Tool Mode to let an Agent call APIs."],
  useCases: ["Calling a REST API from a flow", "Fetching data for a prompt"],
  code: lines("Chat Input ──Message──▶ API Request (mode: URL, method: GET) ──JSON──▶ Parser ──Message──▶ Chat Output"),
  related: ["URL", "Parser", "Tool Mode"],
});

component("Read File", "read-file", {
  description: "Parses uploaded or server files (PDF, DOCX, CSV, JSON, Markdown, code, archives and more) into JSON, Table or Message output. Renamed from File in 1.7.",
  signature: "Read File(path | file_path, separator, silent_errors=False, advanced_parser=False, concurrency_multithreading=1)",
  parameters: [
    { name: "path", type: "Files", description: "Local or Langflow-managed files; storage can be local, AWS S3 or Google Drive." },
    { name: "file_path", type: "JSON | Message", description: "A managed file reference; takes priority over path." },
    { name: "advanced_parser", type: "bool", description: "Docling parsing for one file (standard or vlm pipeline, optional OCR)." },
  ],
  returns: "Raw Content (Message), Structured Content (Table/JSON for csv, xlsx, parquet, json) or a Files table for several files.",
  notes: ["Maximum size defaults to 1024 MB (LANGFLOW_MAX_FILE_SIZE_UPLOAD).", "Docling parsing needs an opt-in install.", "Pass an uploaded file's path with a tweak to file_path."],
  useCases: ["Chat with your PDF", "Loading CSVs into a flow"],
  code: lines("Read File ──Message──▶ Split Text ──Table──▶ Knowledge Base", "Read File (Raw Content) ──Message──▶ Prompt Template (context)"),
  related: ["Write File", "Split Text", "POST /api/v2/files"],
});

component("Write File", "write-file", {
  description: "Saves JSON, Table or Message output to a file locally, on AWS or in Google Drive. Renamed from Save File in 1.7.",
  signature: "Write File(input, storage_location: Local | AWS | Google Drive, file_name, file_format)",
  parameters: [
    { name: "file_name", type: "str", description: "Name or path without extension; missing folders are created. Default folder is the Langflow data directory." },
    { name: "file_format", type: "str", description: "Table: CSV, Excel, JSON, Markdown. JSON: CSV, Excel, JSON, Markdown. Message: TXT, JSON, Markdown." },
  ],
  returns: "A Message confirming the type, name and absolute path of the saved file.",
  notes: ["Same name, path and extension is overwritten without warning.", "Excel output needs openpyxl."],
  useCases: ["Exporting extracted data to CSV", "Saving reports"],
  code: lines("Structured Output ──Table──▶ Write File (file_format: CSV)"),
  related: ["Read File", "Structured Output"],
});

component("Type Convert", "type-convert", {
  description: "Converts data between JSON (Data), Table (DataFrame) and Message, so an output fits a downstream input.",
  signature: "Type Convert(input_data, output_type: Data | DataFrame | Message)",
  parameters: [{ name: "output_type", type: "str", description: "The target type; the output port changes to match." }],
  returns: "The converted value.",
  notes: ["A common fix for port-colour mismatches."],
  useCases: ["Web Search Table → Message for a prompt's context"],
  code: lines("Web Search ──Table──▶ Type Convert (Message) ──Message──▶ Prompt Template (context)"),
  related: ["Components & ports", "Parser"],
});

component("Smart Transform", "smart-transform", {
  description: "Uses a language model to write a small Lambda function from plain-English instructions, then runs it to filter or reshape data. Formerly Lambda Filter / Smart Function.",
  signature: "Smart Transform(data, model, filter_instruction, sample_size=1000, max_size=30000)",
  parameters: [
    { name: "model", type: "LanguageModel", description: "Required; connect a Language Model output." },
    { name: "filter_instruction", type: "str", description: "Short, one-sentence instructions work best." },
    { name: "sample_size / max_size", type: "int", description: "Large inputs are sampled from head and tail." },
  ],
  returns: "JSON, Table or Message; match the output type to the input type.",
  notes: ["Put extra context in the model's input or a Prompt Template, not in the instructions."],
  useCases: ["\"keep only orders over 100\"", "Renaming or selecting fields"],
  code: lines("Language Model (Language Model output) ──▶ Smart Transform ◀──Table── Read File"),
  related: ["Parser", "Language Model"],
});

component("SQL Database", "sql-database", {
  description: "Runs SQL against any SQLAlchemy database (PostgreSQL, MySQL, SQLite...). In Tool Mode an Agent writes the SQL from a question.",
  signature: "SQL Database(database_url, query, include_columns=True, add_error=False)",
  parameters: [
    { name: "database_url", type: "str", description: "SQLAlchemy URL, e.g. postgresql://user:pass@host/db." },
    { name: "query", type: "str", description: "The SQL to run; not set in Tool Mode." },
  ],
  returns: "Result Table.",
  notes: ["Use a read-only database user for agent access.", "For CQL use the DataStax bundle."],
  useCases: ["Natural-language questions over a database"],
  code: lines("SQL Database (Tool Mode) ──Toolset──▶ Agent (Tools)"),
  related: ["Agent", "Tool Mode"],
});

component("LLM Selector", "llm-selector", {
  description: "Routes each request to the best model in a pool. A judge model picks one by quality, speed, cost or balance. Called LLM Router before 1.7.",
  signature: "LLM Selector(models, input_value, judge_llm, optimization='balanced', use_openrouter_specs=True, timeout=10, fallback_to_first=True)",
  parameters: [
    { name: "models", type: "LanguageModel[]", description: "The pool; the first connected model is the fallback." },
    { name: "judge_llm", type: "LanguageModel", description: "Exactly one model that makes the choice." },
    { name: "optimization", type: "str", description: "quality, speed, cost or balanced." },
  ],
  returns: "Output (Message), Selected Model Info (JSON) and Routing Decision (Message).",
  notes: ["Routing Decision explains the choice, useful for debugging."],
  useCases: ["Cheap models for easy questions, strong ones for hard ones"],
  code: lines("Language Model A, B, C ──▶ LLM Selector (models)", "Language Model J ──▶ LLM Selector (judge_llm) ──Message──▶ Chat Output"),
  related: ["Language Model", "Smart Router"],
});

component("Calculator", "calculator", {
  description: "Evaluates arithmetic expressions: addition, subtraction, multiplication, division and exponentiation.",
  signature: "Calculator(expression: str)",
  parameters: [{ name: "expression", type: "str", description: "For example 4*4*(33/22)+12-20." }],
  returns: "result (JSON) with the evaluated expression.",
  notes: ["Enable Tool Mode so an Agent does exact maths instead of guessing."],
  useCases: ["Agents that need reliable arithmetic"],
  code: lines("Calculator (Tool Mode) ──Toolset──▶ Agent (Tools)"),
  related: ["Agent", "Tool Mode"],
});

component("Current Date", "current-date", {
  description: "Returns the current date and time in a chosen timezone.",
  signature: "Current Date(timezone: str)",
  parameters: [{ name: "timezone", type: "str", description: "e.g. Asia/Kolkata or UTC." }],
  returns: "current_date (string).",
  notes: ["Give agents this tool so they know today's date."],
  useCases: ["Scheduling assistants", "Time-aware answers"],
  code: lines("Current Date (Tool Mode) ──Toolset──▶ Agent (Tools)"),
  related: ["Agent"],
});

add("langflow", "Concepts", "LangSmith & tracing integrations", "M", "s", {
  page: "integrations-langsmith",
  packageName: "Langflow observability",
  language: "bash",
  description: "Send every flow run to an LLM observability tool. For LangSmith, set its environment variables and restart Langflow; Arize, Langfuse, LangWatch, Openlayer, Opik and Traceloop are also supported.",
  signature: "LANGSMITH_TRACING=True · LANGSMITH_ENDPOINT · LANGSMITH_API_KEY · LANGSMITH_PROJECT",
  parameters: [{ name: "LANGSMITH_PROJECT", type: "env", description: "The LangSmith project that receives Langflow traces." }],
  returns: "Traces of each component run in the tracing tool's dashboard.",
  notes: ["Restart with langflow run --env-file .env after setting variables.", "Langflow's own Traces view and the /monitor/traces API work without any integration."],
  useCases: ["Debugging slow or failing components", "Cost tracking"],
  code: lines(
    "LANGSMITH_TRACING=True",
    "LANGSMITH_ENDPOINT=https://api.smith.langchain.com/",
    "LANGSMITH_API_KEY=<your-api-key>",
    "LANGSMITH_PROJECT=langflow-prod",
    "langflow run --env-file .env",
  ),
  related: ["GET /api/v1/monitor/traces", "langflow run"],
});

add("langflow", "Concepts", "Voice mode", "M", "d", {
  page: "concepts-voice-mode",
  packageName: "Langflow Playground",
  language: "text",
  description: "Talk to a flow by microphone and hear spoken replies. Deprecated in Langflow 1.10: the Playground microphone now does speech-to-text only, while the voice WebSocket endpoints still work.",
  signature: "WebSocket /ws/flow_tts/{flow_id} (OpenAI Realtime-compatible)",
  parameters: [{ name: "OpenAI API key", type: "global variable", description: "Required; ElevenLabs is optional for extra voices." }],
  returns: "Audio replies generated from the flow's output.",
  notes: ["Not available in Langflow Desktop.", "Voice context lasts only for the current conversation."],
  useCases: ["Hands-free assistants built on an existing flow"],
  code: lines("Chat Input ──▶ Language Model ──▶ Chat Output   (Playground ▸ Microphone)"),
  related: ["Playground", "Session ID"],
});

export const AGENTIC_DETAILS = DETAILS;

/** Langflow's original entries are grouped by kind; new ones are placed explicitly. */
const LANGFLOW_KIND_SECTIONS: Record<string, string> = { M: "Concepts", Co: "Components", CLI: "Command line", SVC: "REST API", C: "Python & TypeScript API", F: "Python & TypeScript API", K: "Settings & headers" };

/** Section headings for a framework, in display order; undefined for other packages. */
export function agenticSections(packageId: string): string[] | undefined {
  return (AGENTIC_PACKAGE_IDS as readonly string[]).includes(packageId) ? SECTION_ORDER[packageId as Pkg] : undefined;
}

/** The section an entry is listed under on the API Docs page. */
export function agenticSection(packageId: string, name: string, kind: string): string {
  return SECTION_OF.get(`${packageId}:${name}`) ?? (packageId === "langflow" ? LANGFLOW_KIND_SECTIONS[kind] : undefined) ?? "More reference";
}
