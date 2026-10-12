import type { ApiDetail } from "./api-docs-details";

/**
 * Langflow reference, written from the official documentation at
 * https://docs.langflow.org (Langflow 1.12.x). Every entry here has a matching
 * name in the "langflow" package of api-docs-catalog.json; LANGFLOW_ENTRIES
 * below is the single list both are generated from.
 */
const DOCS = "https://docs.langflow.org";
const lines = (...rows: string[]) => rows.join("\n");
type Draft = Omit<ApiDetail, "packageName" | "source"> & { page: string; packageName?: string };
const entry = ({ page, packageName = "langflow", ...rest }: Draft): ApiDetail => ({ packageName, source: `${DOCS}/${page}`, ...rest });

/** Catalog rows for the package, in reading order: kind codes follow API_TYPES, status "s" stable, "p" preview. */
export const LANGFLOW_ENTRIES: { name: string; kind: string; status: string }[] = [];
const DETAILS: Record<string, ApiDetail> = {};
function add(name: string, kind: string, status: string, draft: Draft) {
  LANGFLOW_ENTRIES.push({ name, kind, status });
  DETAILS[`langflow:${name}`] = entry(draft);
}

/* ───────────────────────── Concepts ───────────────────────── */

add("Flow", "M", "s", {
  page: "concepts-flows",
  description: "A flow is a Langflow application: a graph of components connected by typed ports, built in the visual editor, stored as JSON, and run from the Playground, the API, an MCP client or LFX.",
  signature: "Flow JSON = { name, description, data: { nodes: [...], edges: [...] }, endpoint_name?, ... }",
  parameters: [
    { name: "data.nodes", type: "array", description: "The components in the flow, each with an id such as ChatInput-b67sL and its saved field values." },
    { name: "data.edges", type: "array", description: "Connections from one component's output port to another component's input port." },
    { name: "endpoint_name", type: "string", description: "Optional alias that replaces the flow ID in /v1/run URLs. Letters, numbers, hyphens and underscores only." },
  ],
  returns: "A runnable graph. Each run returns the outputs of its output components, usually a Message from Chat Output.",
  notes: [
    "Build flows in the visual editor; every node is a component and every connection carries one data type (Message, JSON, Table, Embeddings, LanguageModel...).",
    "A flow ID is a UUID shown in the flow URL and in Share > API access; any `endpoint_name` alias works wherever the ID does.",
    "Flows are exported and imported as JSON, alone or a whole project as a ZIP, so they can be versioned in Git.",
    "Langflow automatically generates Python, JavaScript and curl snippets for each flow under Share > API access.",
    "Templates such as Basic Prompting and Simple Agent are starter flows you can copy and modify.",
  ],
  useCases: ["Chatbots and RAG assistants built from Chat Input, a model and Chat Output", "Agent flows that call tools and MCP servers", "Event-driven automations started by a Webhook component"],
  code: lines(
    "# Run a flow by ID (or by its endpoint_name alias)",
    "curl -X POST \"$LANGFLOW_SERVER_URL/api/v1/run/$FLOW_ID\" \\",
    "  -H \"Content-Type: application/json\" \\",
    "  -H \"x-api-key: $LANGFLOW_API_KEY\" \\",
    "  -d '{\"input_value\": \"Hello!\", \"input_type\": \"chat\", \"output_type\": \"chat\"}'",
  ),
  language: "bash",
  related: ["Components & ports", "POST /api/v1/run/{flow_id}", "Playground", "POST /api/v1/flows/upload/"],
});

add("Components & ports", "M", "s", {
  page: "concepts-components",
  description: "Components are the nodes of a flow. Each one has typed input and output ports, and you connect an output to an input of the same type (port colour) to pass data between them.",
  signature: "Component(inputs: [...fields], outputs: [...ports]) → data types: Message | JSON | Table | Embeddings | LanguageModel | Memory | Tool",
  parameters: [
    { name: "Message", type: "port type", description: "Chat text plus metadata (sender, session_id, files). Used by chat, prompt and model components." },
    { name: "JSON (formerly Data)", type: "port type", description: "A structured object with a .data dictionary and a text_key. Renamed from Data in Langflow 1.9; old flows still load." },
    { name: "Table (formerly DataFrame)", type: "port type", description: "A pandas DataFrame subclass for rows of records. Renamed from DataFrame in 1.9." },
    { name: "LanguageModel / Embeddings", type: "port type", description: "Configured model instances passed to components that need an LLM or an embedder." },
  ],
  returns: "Each output port returns the value of the method it is bound to.",
  notes: [
    "Hover a port to see what it accepts; click it to search for compatible components.",
    "Incompatible types need a converter such as the Type Convert component.",
    "Some fields are hidden by default; select a component to edit every parameter in the inspection panel.",
    "Core components cover I/O, models, agents, processing and flow control; provider integrations ship as bundles.",
    "Enable Tool Mode on a component to expose its actions to an Agent through a Toolset port.",
  ],
  useCases: ["Wiring Chat Input → Prompt Template → Language Model → Chat Output", "Converting a Table of search results into Message text with Parser", "Passing a LanguageModel output into Structured Output or Smart Router"],
  code: lines(
    "Chat Input ──Message──▶ Prompt Template ──Message──▶ Language Model ──Message──▶ Chat Output",
    "Web Search ──Table──▶ Parser ──Message──▶ Prompt Template",
    "Language Model (output type: Language Model) ──LanguageModel──▶ Structured Output",
  ),
  language: "text",
  related: ["Flow", "Message", "JSON", "Table", "Tool Mode"],
});

add("Tweaks", "M", "s", {
  page: "concepts-publish",
  description: "Tweaks are one-time, per-request overrides of component parameters. They change a run without changing the saved flow.",
  signature: "\"tweaks\": { \"<component_id>\": { \"<field_name>\": <value> } }",
  parameters: [
    { name: "component_id", type: "string", description: "The node id, such as ChatInput-b67sL or OpenAIModel-d1wOZ, as shown in the API access snippets." },
    { name: "field_name", type: "string", description: "The component field to override, such as temperature, model_name or should_store_message." },
  ],
  returns: "Nothing by itself; the run uses the overridden values for that request only.",
  notes: [
    "To add tweaks to the generated snippets, select a component, open Parameters, and click API on each field you want to expose (saved as `api_editable`).",
    "Marking a field API only adds it to snippets; the server still accepts other tweaks unless `LANGFLOW_TWEAKS_POLICY` restricts them.",
    "A refused tweak fails the run with 422 and `code: TWEAKS_REFUSED`; `input_value` and `session_id` are not tweaks and are always accepted.",
    "Tweaks are accepted by /v1/run, /v1/run/advanced, /v1/build and the v2 Workflow API.",
    "For large or shared runtime values, prefer the Workflow API `globals` field or X-LANGFLOW-GLOBAL-VAR-* headers.",
  ],
  useCases: ["Switching the model or temperature per request", "Attaching an uploaded file path to a Chat Input or Read File component", "Disabling Store Messages for a stateless API call"],
  code: lines(
    "curl -X POST \"$LANGFLOW_SERVER_URL/api/v1/run/$FLOW_ID?stream=false\" \\",
    "  -H \"Content-Type: application/json\" \\",
    "  -H \"x-api-key: $LANGFLOW_API_KEY\" \\",
    "  -d '{",
    "    \"input_value\": \"Summarise this\",",
    "    \"tweaks\": {",
    "      \"ChatInput-b67sL\": { \"should_store_message\": false },",
    "      \"OpenAIModel-d1wOZ\": { \"temperature\": 0.2 }",
    "    }",
    "  }'",
  ),
  language: "bash",
  related: ["LANGFLOW_TWEAKS_POLICY", "POST /api/v1/run/{flow_id}", "X-LANGFLOW-GLOBAL-VAR-*", "Global variables"],
});

add("Session ID", "M", "s", {
  page: "session-id",
  description: "A session ID groups the messages of one conversation. Langflow stores chat messages by session_id, so separate sessions keep separate context within the same flow.",
  signature: "{ \"input_value\": \"...\", \"session_id\": \"user-42-chat\" }",
  parameters: [{ name: "session_id", type: "string", description: "Any string. Reuse it to continue a thread; omit it and the flow ID is used as the session ID." }],
  returns: "The run's session_id is echoed in the response so the next request can continue it.",
  notes: [
    "Set it in the API payload or in a component's advanced settings; the API value takes precedence.",
    "A custom session ID set upstream is used by all downstream components that accept one.",
    "Agent memory and the Message History component retrieve history per `session_id`.",
    "Use distinct session IDs per user or per application when many callers share one flow.",
    "Read stored messages for a session with `GET /api/v1/monitor/messages?session_id=...`.",
  ],
  useCases: ["Separate chat histories per end user", "Continuing a multi-turn conversation across API calls", "Resetting context by starting a new session string"],
  code: lines(
    "import os, requests",
    "",
    "url = f\"{os.environ['LANGFLOW_SERVER_URL']}/api/v1/run/{os.environ['FLOW_ID']}\"",
    "headers = {\"Content-Type\": \"application/json\", \"x-api-key\": os.environ[\"LANGFLOW_API_KEY\"]}",
    "",
    "for question in [\"My name is Asha.\", \"What is my name?\"]:",
    "    body = {\"input_value\": question, \"session_id\": \"user-asha\"}",
    "    reply = requests.post(url, headers=headers, json=body, timeout=60).json()",
    "    print(reply[\"outputs\"][0][\"outputs\"][0][\"results\"][\"message\"][\"text\"])",
  ),
  language: "python",
  related: ["Message History", "GET /api/v1/monitor/messages", "Agent"],
});

add("Global variables", "M", "s", {
  page: "configuration-global-variables",
  description: "Global variables are named, reusable values (credentials or generic settings) stored in Langflow and bound to component fields, so secrets are not typed into flows.",
  signature: "Settings > Global Variables > Add New  →  field  🌐  → select VARIABLE_NAME",
  parameters: [
    { name: "Name", type: "string", description: "The variable name, such as OPENAI_API_KEY." },
    { name: "Type", type: "Credential | Generic", description: "Credential values are encrypted with LANGFLOW_SECRET_KEY and hidden in the UI." },
    { name: "Value", type: "string", description: "The stored value." },
  ],
  returns: "Bound fields read the variable's value at run time.",
  notes: [
    "Langflow auto-creates global variables for known provider keys found in the environment, such as `OPENAI_API_KEY`.",
    "Add more with `LANGFLOW_VARIABLES_TO_GET_FROM_ENVIRONMENT=VAR1,VAR2` or a JSON list.",
    "`LANGFLOW_STORE_ENVIRONMENT_VARIABLES=False` stops sourcing variables from the environment.",
    "`LANGFLOW_FALLBACK_TO_ENV_VAR=True` lets a flow use an OS environment variable when a referenced variable is missing.",
    "Per-request values can be passed with X-LANGFLOW-GLOBAL-VAR-* headers (v1) or the `globals` body field (v2 Workflow API).",
  ],
  useCases: ["Sharing one provider API key across many flows", "Keeping secrets out of exported flow JSON", "Kubernetes deployments that load variables from Secrets"],
  code: lines(
    "# .env",
    "OPENAI_API_KEY=sk-...",
    "LANGFLOW_VARIABLES_TO_GET_FROM_ENVIRONMENT=WATSONX_PROJECT_ID,WATSONX_API_KEY",
    "LANGFLOW_FALLBACK_TO_ENV_VAR=False",
    "",
    "# start Langflow with it",
    "uv run langflow run --env-file .env",
  ),
  language: "bash",
  related: ["LANGFLOW_VARIABLES_TO_GET_FROM_ENVIRONMENT", "X-LANGFLOW-GLOBAL-VAR-*", "LANGFLOW_SECRET_KEY"],
});

add("Tool Mode", "M", "s", {
  page: "agents-tools",
  description: "Tool Mode turns a component into a tool an Agent can call. The component gets a Toolset port that you connect to the Agent's Tools port.",
  signature: "Component header menu → Tool Mode: On   ⇒   Toolset ──▶ Agent.Tools",
  parameters: [{ name: "tool_mode", type: "bool (on an input)", description: "In custom components, mark an input with tool_mode=True so it can be filled by the agent." }],
  returns: "A Tool object whose name and description tell the agent when to use it.",
  notes: [
    "Any component can be a tool, including another Agent (multi-agent flows) and MCP Tools.",
    "Tool descriptions matter: the agent chooses tools by name and description.",
    "The Playground shows each tool call with its input and raw output, which helps debugging.",
    "Agent tools can be set to require approval, pausing the run for Human-in-the-Loop review.",
  ],
  useCases: ["Giving an agent Web Search, URL and Calculator tools", "Using a whole flow as a tool through Run Flow", "Exposing an MCP server's tools to an agent"],
  code: lines(
    "from lfx.custom import Component",
    "from lfx.io import MessageTextInput, Output",
    "from lfx.schema import Message",
    "",
    "class Shout(Component):",
    "    display_name = \"Shout\"",
    "    description = \"Upper-cases the text it is given.\"",
    "    inputs = [MessageTextInput(name=\"text\", display_name=\"Text\", tool_mode=True)]",
    "    outputs = [Output(name=\"result\", display_name=\"Result\", method=\"shout\")]",
    "",
    "    def shout(self) -> Message:",
    "        return Message(text=self.text.upper())",
  ),
  language: "python",
  related: ["Agent", "MCP Tools", "Run Flow", "Component"],
});

add("Playground", "M", "s", {
  page: "concepts-playground",
  description: "The Playground is the built-in chat and test surface for a flow. It runs the flow, shows messages per session, and exposes tool calls and component output for debugging.",
  signature: "Visual editor → Playground (requires Chat Input / Chat Output for chat)",
  parameters: [{ name: "Session", type: "sidebar list", description: "Each conversation is a session; switch, rename or delete sessions from the left pane." }],
  returns: "Interactive runs; messages are stored in the Langflow database by session.",
  notes: [
    "Flows built only from the legacy Text Input/Output components can't chat in the Playground; use Chat Input and Chat Output.",
    "Agent runs stream the input message, each tool call with input and result, tokens and the final answer.",
    "The Shareable Playground publishes a flow's chat at a public URL (not available in Langflow Desktop).",
    "Message logs in the Playground show every `Message` attribute, not just the text.",
  ],
  useCases: ["Manually testing a flow before calling it from an app", "Inspecting an agent's tool calls", "Sharing a demo chat with teammates"],
  code: lines(
    "1. Open a flow that has Chat Input and Chat Output.",
    "2. Click Playground and send a message.",
    "3. Expand a tool call or open message logs to inspect inputs and outputs.",
    "4. Start a new session to test with empty memory.",
  ),
  language: "text",
  related: ["Session ID", "Chat Input", "Chat Output"],
});

add("Projects", "M", "s", {
  page: "concepts-flows",
  description: "Projects group flows. Each project can be served as an MCP server, exported as a ZIP and imported elsewhere.",
  signature: "Projects page → New Project · MCP Server tab · Download / Upload",
  parameters: [{ name: "project_id", type: "UUID", description: "Used by the /projects endpoints and the project MCP URL." }],
  returns: "A container of flows with its own MCP server configuration.",
  notes: [
    "New projects are added to the MCP server configuration automatically unless `LANGFLOW_ADD_PROJECTS_TO_MCP_SERVERS=false`.",
    "Moving a flow into a project through the API moves it; it isn't copied.",
    "Export a project with `GET /api/v1/projects/download/{project_id}` and import it with `POST /api/v1/projects/upload/`.",
  ],
  useCases: ["Separating flows per team or product", "Publishing a set of flows as one MCP server", "Promoting flows between environments as a ZIP"],
  code: lines(
    "curl -X GET \"$LANGFLOW_URL/api/v1/projects/\" \\",
    "  -H \"accept: application/json\" -H \"x-api-key: $LANGFLOW_API_KEY\"",
  ),
  language: "bash",
  related: ["POST /api/v1/projects/", "GET /api/v1/projects/download/{project_id}", "/api/v1/mcp/project/{project_id}/streamable"],
});

/* ───────────────────────── CLI ───────────────────────── */

add("uv pip install langflow", "CLI", "s", {
  page: "get-started-installation",
  description: "Install the Langflow OSS Python package into a uv virtual environment. Langflow needs Python 3.10–3.14; Langflow Desktop and Docker are the other install options.",
  signature: "uv venv VENV_NAME && uv pip install langflow [==VERSION] [-U | --force-reinstall]",
  parameters: [
    { name: "langflow", type: "package", description: "The full application (visual editor, server, CLI). langflow-base is the slimmer base package." },
    { name: "==VERSION", type: "pin", description: "Install a specific version, e.g. langflow==1.4.22." },
    { name: "-U", type: "flag", description: "Upgrade to the latest release." },
  ],
  returns: "The langflow CLI in the environment; start it with uv run langflow run.",
  notes: [
    "Minimum hardware: dual-core CPU and 2 GB RAM; recommended: multi-core and at least 4 GB RAM.",
    "Default server address after start: http://127.0.0.1:7860 (or localhost:7860).",
    "Langflow Desktop (macOS 13+, Windows) manages dependencies for you but lacks some features, such as the Shareable Playground and Voice Mode.",
    "`uv pip install langflow --force-reinstall` reinstalls all dependencies.",
  ],
  useCases: ["Local development of flows", "Pinning a version for a reproducible environment", "Building custom components against the installed lfx package"],
  code: lines(
    "uv venv langflow-env",
    "source langflow-env/bin/activate   # Windows: langflow-env\\Scripts\\activate",
    "uv pip install langflow",
    "uv run langflow run",
    "# open http://localhost:7860",
  ),
  language: "bash",
  related: ["langflow run", "docker run langflowai/langflow"],
});

add("langflow run", "CLI", "s", {
  page: "configuration-cli",
  description: "Start the Langflow server (backend and visual editor). Options override the matching LANGFLOW_* environment variables and the .env file.",
  signature: "uv run langflow run [--host HOST] [--port 7860] [--env-file .env] [--backend-only] [--workers 1] [OPTIONS]",
  parameters: [
    { name: "--host / --port", type: "string / int", description: "Defaults localhost and 7860; a busy port is replaced with a free one." },
    { name: "--env-file", type: "path", description: "Load LANGFLOW_* settings from a .env file; later CLI options win." },
    { name: "--backend-only", type: "bool", description: "Headless mode: API and CLI only, no visual editor." },
    { name: "--components-path", type: "path", description: "Directory of custom components." },
    { name: "--workers / --worker-timeout", type: "int", description: "Worker processes (default 1) and timeout in seconds (default 300)." },
    { name: "--cache", type: "async|redis|memory|disk", description: "Cache backend, default async." },
    { name: "--log-level / --log-file", type: "string", description: "debug, info, warning, error or critical (default critical); default file logs/langflow.log." },
    { name: "--max-file-size-upload", type: "int (MB)", description: "Upload limit, default 1024." },
    { name: "--deployment-profile", type: "dev|prod", description: "prod runs production preflight and aborts boot if a required service is missing." },
    { name: "--ssl-cert-file-path / --ssl-key-file-path", type: "path", description: "Serve HTTPS directly." },
  ],
  returns: "A running server on the chosen host and port.",
  notes: [
    "Boolean options have `--option` and `--no-option` forms, e.g. `--no-remove-api-keys`.",
    "`--remove-api-keys` strips API keys and tokens from flows saved in the database.",
    "`--auto-saving` (default on) and `--auto-saving-interval 1000` control draft auto-save.",
    "Universal options: `--version`, `--help`, `--install-completion`, `--show-completion`.",
    "Sensitive settings (database URL, secret key) belong in the environment or .env, not on the command line.",
  ],
  useCases: ["Local development with the visual editor", "Headless API server in production with --backend-only", "Starting with a team .env file"],
  code: lines(
    "uv run langflow run --env-file .env",
    "uv run langflow run --host 0.0.0.0 --port 7860 --backend-only --workers 2",
    "uv run langflow run --components-path ./custom_components --log-level info",
  ),
  language: "bash",
  related: ["langflow superuser", "langflow api-key", "LANGFLOW_WORKERS", "LANGFLOW_COMPONENTS_PATH"],
});

add("langflow superuser", "CLI", "s", {
  page: "configuration-cli",
  description: "Create a superuser account with the given username and password.",
  signature: "uv run langflow superuser --username NAME --password PASSWORD [--log-level error]",
  parameters: [
    { name: "--username", type: "string", description: "Required, no default." },
    { name: "--password", type: "string", description: "Required, no default." },
  ],
  returns: "A new superuser in the Langflow database.",
  notes: [
    "Controlled by `LANGFLOW_ENABLE_SUPERUSER_CLI` (default True); set it to False in production to disable this command.",
    "Server-start superuser defaults come from `LANGFLOW_SUPERUSER` (default username langflow) and `LANGFLOW_SUPERUSER_PASSWORD`.",
    "Those defaults don't apply to this command; both flags are always required.",
  ],
  useCases: ["Bootstrapping an admin on a new server", "Recovering access in a self-hosted deployment"],
  code: "uv run langflow superuser --username admin --password 'a-long-random-password'",
  language: "bash",
  related: ["LANGFLOW_SUPERUSER", "LANGFLOW_AUTO_LOGIN", "POST /api/v1/users/"],
});

add("langflow api-key", "CLI", "s", {
  page: "api-keys-and-authentication",
  description: "Create a Langflow API key from the command line. Required when the server runs with --backend-only and has no Settings UI.",
  signature: "uv run langflow api-key [--log-level error]",
  parameters: [{ name: "--log-level", type: "string", description: "debug, info, warning, error (default) or critical." }],
  returns: "A new API key printed to the terminal.",
  notes: [
    "You must be a superuser; keys created with the CLI therefore have superuser privileges.",
    "An API key adopts the privileges of the user who created it.",
    "Pass the key in an `x-api-key` header or `?x-api-key=` query parameter.",
    "Revoke keys in Settings > Langflow API Keys; deletion invalidates them immediately.",
  ],
  useCases: ["Headless deployments", "CI pipelines that call flows", "Automation scripts"],
  code: lines("uv run langflow api-key", "export LANGFLOW_API_KEY=\"sk-...\""),
  language: "bash",
  related: ["POST /api/v1/api_key/", "LANGFLOW_API_KEY_SOURCE", "langflow superuser"],
});

add("langflow migration", "CLI", "s", {
  page: "configuration-cli",
  description: "Manage database schema changes with Alembic. The default test mode previews migrations; --fix applies them.",
  signature: "uv run langflow migration [--fix]",
  parameters: [{ name: "--fix", type: "flag", description: "Apply migrations. Destructive: can delete data." }],
  returns: "A report of the migrations that would run (test mode) or that ran (--fix).",
  notes: [
    "Always run `langflow migration` first and review the preview before `--fix`.",
    "Back up the database (SQLite file or PostgreSQL) before applying.",
    "`LANGFLOW_ALEMBIC_LOG_TO_STDOUT=True` logs Alembic output to stdout instead of a file.",
  ],
  useCases: ["Upgrading Langflow versions", "Checking schema drift on a shared PostgreSQL database"],
  code: lines("uv run langflow migration        # preview", "uv run langflow migration --fix  # apply after reviewing"),
  language: "bash",
  related: ["LANGFLOW_DATABASE_URL", "langflow copy-db"],
});

add("langflow copy-db", "CLI", "s", {
  page: "configuration-cli",
  description: "Copy langflow.db (and langflow-pre.db if present) from the cache directory into the current Langflow installation directory.",
  signature: "uv run langflow copy-db",
  parameters: [],
  returns: "Database files copied next to the installed package's __main__.py.",
  notes: ["Find the target directory with `which langflow`.", "Only copies files that exist in the cache directory.", "For external databases, use LANGFLOW_DATABASE_URL instead."],
  useCases: ["Moving a local SQLite database into the install directory", "Inspecting the database file alongside the package"],
  code: "uv run langflow copy-db",
  language: "bash",
  related: ["langflow migration", "LANGFLOW_CONFIG_DIR"],
});

add("docker run langflowai/langflow", "CLI", "s", {
  page: "deployment-docker",
  description: "Run Langflow from the official Docker image. Official images set LANGFLOW_AUTO_LOGIN=false, so a superuser password is required.",
  signature: "docker run -p 7860:7860 -e LANGFLOW_AUTO_LOGIN=false -e LANGFLOW_SUPERUSER_PASSWORD=... langflowai/langflow:latest",
  parameters: [
    { name: "-p 7860:7860", type: "port", description: "Expose the web UI and API." },
    { name: "LANGFLOW_SUPERUSER_PASSWORD", type: "env", description: "Required when auto-login is off; can't be the legacy default 'langflow'." },
    { name: "-v ./custom_components:/app/custom_components", type: "volume", description: "Mount custom components, with LANGFLOW_COMPONENTS_PATH pointing to it." },
  ],
  returns: "A container serving Langflow at http://localhost:7860.",
  notes: [
    "For a persistent PostgreSQL setup, use `docker compose up` in the repository's `docker_example` directory.",
    "Package flows into an image and load them with `LANGFLOW_LOAD_FLOWS_PATH` (requires auto-login).",
    "Install Node.js in a custom image if MCP servers use `npx`.",
    "Podman works with the same commands.",
  ],
  useCases: ["Quick local trial without Python", "Production with Compose and PostgreSQL", "Shipping a flow as a standalone container"],
  code: lines(
    "docker run -d --name langflow -p 7860:7860 \\",
    "  -e LANGFLOW_AUTO_LOGIN=false \\",
    "  -e LANGFLOW_SUPERUSER_PASSWORD=change-me-to-a-strong-password \\",
    "  -e LANGFLOW_COMPONENTS_PATH=/app/custom_components \\",
    "  -v ./custom_components:/app/custom_components \\",
    "  langflowai/langflow:latest",
  ),
  language: "bash",
  related: ["LANGFLOW_DATABASE_URL", "LANGFLOW_LOAD_FLOWS_PATH", "LANGFLOW_COMPONENTS_PATH"],
});

add("lfx run", "CLI", "s", {
  page: "lfx-run",
  description: "LFX (Langflow Executor) runs a flow JSON or Python script once, statelessly, and streams the result to stdout — no Langflow server, database or UI. No API key is required.",
  signature: "uv run lfx run FLOW.json|FLOW.py [INPUT] [--input-value TEXT] [--format json|text|message|result] [--stdin] [--flow-json STR]",
  parameters: [
    { name: "--input-value", type: "string", description: "Input to the graph; required with --stdin and --flow-json." },
    { name: "--format, -f", type: "json|text|message|result", description: "Output format, default json." },
    { name: "--session-id", type: "string", description: "Conversation tracking; auto-generated if unset." },
    { name: "--check-variables / --no-check-variables", type: "flag", description: "Validate the flow's global variables (default check)." },
    { name: "--upgrade-flow", type: "check|safe", description: "check reports compatibility issues; safe applies safe upgrades in memory." },
    { name: "--timing / -v / -vv / -vvv", type: "flag", description: "Timing data and increasing diagnostic detail." },
  ],
  returns: "The flow result on stdout in the chosen format.",
  notes: [
    "LFX uses a no-op database (`NoopSession`): nothing is persisted, so stateful features don't work.",
    "Install the bundles that provide the flow's components; missing ones report `component-not-found` with a hint.",
    "`lfx requirements FLOW.json` lists extra Python packages the flow needs.",
    "Restrict loaded categories with `LANGFLOW_COMPONENT_CATEGORY_ALLOWLIST` / `_BLOCKLIST`.",
  ],
  useCases: ["Running exported flows in CI or cron jobs", "Piping a flow from an API into the executor with --stdin", "Editing a flow with jq before running it"],
  code: lines(
    "uv pip install lfx",
    "lfx requirements simple-agent-flow.json",
    "uv run lfx run simple-agent-flow.json \"Hello world\"",
    "cat simple-agent-flow.json | uv run lfx run --stdin --input-value \"Hello\" --format json | jq '.result'",
  ),
  language: "bash",
  related: ["lfx serve", "lfx push", "Flow"],
});

add("lfx serve", "CLI", "s", {
  page: "lfx-serve",
  description: "Start a lightweight FastAPI server that exposes one or more flow JSON files at POST /flows/{flow_id}/run. A LANGFLOW_API_KEY is required.",
  signature: "uv run lfx serve FLOW.json|FLOWS_DIR/ [--env-file .env]",
  parameters: [
    { name: "FLOW.json | directory", type: "path", description: "A single flow, a .py script, or a directory of .json flows." },
    { name: "LANGFLOW_API_KEY", type: "env", description: "Any secure token; callers send it as x-api-key. Not stored in a database." },
  ],
  returns: "A server (default http://127.0.0.1:8000) printing each loaded flow_id.",
  notes: [
    "Generate the key locally, e.g. `python -c \"import secrets; print(secrets.token_urlsafe(32))\"`.",
    "Send `{\"input_value\": \"...\"}` to `/flows/{flow_id}/run` with the `x-api-key` header or query parameter.",
    "Stateless: same NoopSession limits as lfx run.",
  ],
  useCases: ["Serving production flows without the full Langflow app", "Containerised microservices per flow", "Serverless-style deployments"],
  code: lines(
    "export LANGFLOW_API_KEY=\"$(python -c 'import secrets; print(secrets.token_urlsafe(32))')\"",
    "export OPENAI_API_KEY=\"sk-...\"",
    "uv run lfx serve simple-agent-flow.json",
    "",
    "curl -X POST http://localhost:8000/flows/$FLOW_ID/run \\",
    "  -H \"Content-Type: application/json\" -H \"x-api-key: $LANGFLOW_API_KEY\" \\",
    "  -d '{\"input_value\": \"Hello, world!\"}'",
  ),
  language: "bash",
  related: ["lfx run", "POST /api/v1/run/{flow_id}"],
});

add("lfx push", "CLI", "s", {
  page: "lfx-overview",
  description: "Part of the LFX Flow DevOps commands: version flows as files and sync them with a remote Langflow instance by stable ID.",
  signature: "lfx init | lfx login | lfx create | lfx validate | lfx status | lfx push | lfx pull | lfx export | lfx requirements",
  parameters: [
    { name: "lfx validate", type: "command", description: "Validate flow JSON before pushing." },
    { name: "lfx status", type: "command", description: "Compare local flow files against the remote instance." },
    { name: "lfx push / lfx pull", type: "command", description: "Push local flows to, or pull them from, a remote instance by stable ID." },
    { name: "lfx export", type: "command", description: "Normalise flow JSON for clean git diffs." },
  ],
  returns: "Flows synchronised between files and a Langflow server.",
  notes: [
    "`lfx init` scaffolds a versioned flow project with CI templates.",
    "`lfx login` validates credentials against a remote Langflow instance.",
    "Combine with code review: normalise with `lfx export` so diffs show only real changes.",
  ],
  useCases: ["GitOps for flows", "Promoting flows from staging to production", "Reviewing flow changes in pull requests"],
  code: lines("lfx init my-flows", "lfx validate flows/support-agent.json", "lfx status", "lfx push", "lfx pull"),
  language: "bash",
  related: ["lfx run", "POST /api/v1/flows/upload/"],
});

/* ───────────────────────── REST API ───────────────────────── */

const runCurl = lines(
  "curl -X POST \"$LANGFLOW_SERVER_URL/api/v1/run/$FLOW_ID?stream=false\" \\",
  "  -H \"Content-Type: application/json\" \\",
  "  -H \"x-api-key: $LANGFLOW_API_KEY\" \\",
  "  -d '{",
  "    \"input_value\": \"Tell me about something interesting!\",",
  "    \"session_id\": \"chat-123\",",
  "    \"input_type\": \"chat\",",
  "    \"output_type\": \"chat\",",
  "    \"output_component\": \"\",",
  "    \"tweaks\": null",
  "  }'",
);

add("POST /api/v1/run/{flow_id}", "SVC", "s", {
  page: "api-flows-run",
  description: "Run a flow by ID or endpoint name and get its outputs. This is the main endpoint for using flows in applications; add ?stream=true for token streaming.",
  signature: "POST /api/v1/run/{flow_id_or_name}?stream=false\nHeaders: Content-Type: application/json, x-api-key: <key>",
  parameters: [
    { name: "input_value", type: "string", description: "Main input text; default null." },
    { name: "input_type", type: "\"chat\" | \"text\"", description: "Default \"chat\"." },
    { name: "output_type", type: "\"chat\" | \"any\" | \"debug\"", description: "Default \"chat\"." },
    { name: "output_component", type: "string", description: "Target a specific output component; default \"\"." },
    { name: "tweaks", type: "object", description: "Per-component overrides; refused keys return 422 TWEAKS_REFUSED." },
    { name: "session_id", type: "string", description: "Conversation context ID; defaults to the flow ID." },
    { name: "stream", type: "query bool", description: "Stream LLM tokens as add_message/token events ending in an end event." },
  ],
  returns: "{ session_id, outputs: [{ inputs, outputs: [{ results: { message: { text, sender, session_id, ... } } }] }] }",
  notes: [
    "Extract the text at `outputs[0].outputs[0].results.message.text`; responses are verbose.",
    "Optional `X-LANGFLOW-GLOBAL-VAR-*` headers pass request-scoped global variables.",
    "Missing variables fail the run unless `LANGFLOW_FALLBACK_TO_ENV_VAR=True`.",
    "Deprecated predecessors: `/process` and `/predict`.",
    "Since Langflow 1.5 an API key is required (`x-api-key` header or query parameter).",
  ],
  useCases: ["Backend calling a chatbot flow", "Batch scripts processing inputs", "Streaming answers to a web UI"],
  code: runCurl,
  language: "bash",
  related: ["POST /api/v1/run/advanced/{flow_id}", "POST /api/v2/workflows", "Tweaks", "Session ID", "X-LANGFLOW-GLOBAL-VAR-*"],
});

add("POST /api/v1/run/advanced/{flow_id}", "SVC", "s", {
  page: "api-reference-api-examples",
  description: "Advanced run with explicit inputs, outputs and tweaks lists, plus an optional session_id, for flows with several inputs or outputs.",
  signature: "POST /api/v1/run/advanced/{flow_id}\nBody: { inputs: [...], outputs: [...], tweaks: {...}, session_id?: string, stream?: bool }",
  parameters: [
    { name: "inputs", type: "array", description: "Input values addressed to specific input components." },
    { name: "outputs", type: "array", description: "Component ids whose results should be returned." },
    { name: "tweaks", type: "object", description: "Per-component overrides, subject to LANGFLOW_TWEAKS_POLICY." },
    { name: "session_id", type: "string", description: "Optional conversation ID." },
  ],
  returns: "The same run result shape as /v1/run, limited to the requested outputs.",
  notes: ["Use the simple `/run` endpoint for single-input chat flows.", "Refused tweaks return 422 `TWEAKS_REFUSED`, as on `/run`.", "Requires an API key."],
  useCases: ["Flows with multiple Chat/Text inputs", "Returning several outputs from one run"],
  code: lines(
    "curl -X POST \"$LANGFLOW_SERVER_URL/api/v1/run/advanced/$FLOW_ID\" \\",
    "  -H \"Content-Type: application/json\" -H \"x-api-key: $LANGFLOW_API_KEY\" \\",
    "  -d '{\"inputs\": [{\"components\": [\"ChatInput-b67sL\"], \"input_value\": \"Hi\"}],",
    "       \"outputs\": [\"ChatOutput-ylMzN\"], \"session_id\": \"chat-1\"}'",
  ),
  language: "bash",
  related: ["POST /api/v1/run/{flow_id}", "Tweaks"],
});

add("POST /api/v1/webhook/{flow_id}", "SVC", "s", {
  page: "webhook",
  description: "Start a flow that contains a Webhook component by POSTing any JSON payload. The run starts in the background and the response only confirms it started.",
  signature: "POST /api/v1/webhook/{flow_id_or_name}\nBody: any JSON (non-JSON is wrapped in { \"payload\": ... })",
  parameters: [{ name: "body", type: "any JSON", description: "Delivered to the Webhook component's Data output; parse it with a Parser component." }],
  returns: "{ \"message\": \"Task started in the background\", \"status\": \"in progress\" }",
  notes: [
    "API key required by default (`LANGFLOW_WEBHOOK_AUTH_ENABLE=True`); when disabled, requests run as the flow owner.",
    "Get a ready-made request from Share > API access > Webhook curl.",
    "Pair Webhook with Parser and reference keys in the template, e.g. `{id}`, `{email}`.",
    "To debug payloads, set Parser mode to Stringify and print it with Chat Output.",
  ],
  useCases: ["Processing form submissions or survey feedback", "Reacting to monitoring alerts", "E-commerce order and inventory events"],
  code: lines(
    "curl -X POST \"$LANGFLOW_SERVER_URL/api/v1/webhook/$FLOW_ID\" \\",
    "  -H \"Content-Type: application/json\" -H \"x-api-key: $LANGFLOW_API_KEY\" \\",
    "  -d '{\"id\": \"12345\", \"name\": \"alex\", \"email\": \"alex@email.com\"}'",
  ),
  language: "bash",
  related: ["Webhook", "Parser", "LANGFLOW_WEBHOOK_AUTH_ENABLE"],
});

add("POST /api/v2/workflows", "SVC", "p", {
  page: "workflow-api",
  description: "Workflow API (Beta): execute a flow in sync, stream or background mode. Stream mode emits Langflow EventManager events or the AG-UI protocol over SSE.",
  signature: "POST /api/v2/workflows\nBody: { flow_id, input_value?, mode?: \"sync\"|\"stream\"|\"background\", stream_protocol?: \"langflow\"|\"agui\", session_id?, tweaks?, globals?, output_ids? }",
  parameters: [
    { name: "flow_id", type: "string (required)", description: "UUID of the flow." },
    { name: "mode", type: "sync | stream | background", description: "Default sync. Background returns a job_id immediately." },
    { name: "stream_protocol", type: "langflow | agui", description: "Unknown values return 422 with an `available` list." },
    { name: "globals", type: "object", description: "Request-level global variables (sync only); keys ≤256 chars, values ≤64 KB." },
    { name: "output_ids", type: "array", description: "Output components used to resolve sync answers." },
    { name: "data / files / start_component_id / stop_component_id", type: "various", description: "Stream and background only: live-canvas override, file paths and partial runs." },
  ],
  returns: "sync: { output: { text, reason, source }, outputs, has_errors, session_id, created_timestamp } · background: { object: \"job\", job_id, links }",
  notes: [
    "Requires `LANGFLOW_DEVELOPER_API_ENABLED=true`; otherwise these endpoints return 404.",
    "`output.reason` is single, multiple, none, non_string or failed; `output.text` is set only for single.",
    "EventManager events include vertices_sorted, add_message, token, end_vertex, output, end, error and cancelled.",
    "AG-UI events include RUN_STARTED/RUN_FINISHED, TEXT_MESSAGE_*, TOOL_CALL_* and STATE_SNAPSHOT.",
    "Errors: 403 bad key, 404 missing flow or API disabled, 422 bad protocol/field or TWEAKS_REFUSED.",
  ],
  useCases: ["Long-running flows as background jobs", "AG-UI frontends that render agent lifecycle events", "Simple sync calls that need the final answer text"],
  code: lines(
    "import os, requests",
    "",
    "base = os.environ[\"LANGFLOW_SERVER_URL\"]",
    "headers = {\"Content-Type\": \"application/json\", \"x-api-key\": os.environ[\"LANGFLOW_API_KEY\"]}",
    "body = {\"flow_id\": os.environ[\"FLOW_ID\"], \"input_value\": \"Hello\", \"mode\": \"sync\", \"session_id\": \"s1\"}",
    "",
    "result = requests.post(f\"{base}/api/v2/workflows\", headers=headers, json=body, timeout=120).json()",
    "print(result[\"output\"][\"text\"] if result[\"output\"][\"reason\"] == \"single\" else result[\"outputs\"])",
  ),
  language: "python",
  related: ["GET /api/v2/workflows", "GET /api/v2/workflows/{job_id}/events", "POST /api/v2/workflows/stop", "Tweaks"],
});

add("GET /api/v2/workflows", "SVC", "p", {
  page: "workflow-api",
  description: "Poll the status and result of a Workflow API job by job_id.",
  signature: "GET /api/v2/workflows?job_id={job_id}",
  parameters: [{ name: "job_id", type: "string (required)", description: "Returned by a background or stream run." }],
  returns: "queued / in_progress / cancelled → job object; completed → WorkflowExecutionResponse; failed → HTTP 500; timed_out → HTTP 408.",
  notes: [
    "Status values: queued, in_progress, suspended (waiting for human input), completed, failed, cancelled, timed_out.",
    "Prefer re-attaching to `/events` for live output instead of tight polling.",
    "Beta: the response format may change.",
  ],
  useCases: ["Polling background jobs from a worker", "Showing job progress in a dashboard"],
  code: lines(
    "curl \"$LANGFLOW_SERVER_URL/api/v2/workflows?job_id=$JOB_ID\" \\",
    "  -H \"x-api-key: $LANGFLOW_API_KEY\"",
  ),
  language: "bash",
  related: ["POST /api/v2/workflows", "GET /api/v2/workflows/{job_id}/events"],
});

add("GET /api/v2/workflows/{job_id}/events", "SVC", "p", {
  page: "workflow-api",
  description: "Re-attach to a background run's Server-Sent Events: replay buffered events and tail the stream until the job finishes.",
  signature: "GET /api/v2/workflows/{job_id}/events\nHeader (optional): Last-Event-ID: <id>",
  parameters: [{ name: "Last-Event-ID", type: "header", description: "Resume after the last SSE id you received." }],
  returns: "An SSE stream in the protocol chosen when the job was created (langflow or agui).",
  notes: ["Each frame has a monotonic `id:` line and a `data:` JSON line.", "Use `curl -N` so the client doesn't buffer.", "Also returned as `links.events` on the job object."],
  useCases: ["Reconnecting a UI after a network drop", "Tailing a long background run from a CLI"],
  code: "curl -N \"$LANGFLOW_SERVER_URL/api/v2/workflows/$JOB_ID/events\" -H \"x-api-key: $LANGFLOW_API_KEY\" -H \"Last-Event-ID: 42\"",
  language: "bash",
  related: ["POST /api/v2/workflows", "GET /api/v2/workflows"],
});

add("POST /api/v2/workflows/stop", "SVC", "p", {
  page: "workflow-api",
  description: "Stop a running Workflow API job by job_id.",
  signature: "POST /api/v2/workflows/stop\nBody: { \"job_id\": \"...\" }",
  parameters: [{ name: "job_id", type: "string (required)", description: "The job to cancel." }],
  returns: "Confirmation; the job status becomes cancelled and streams emit a cancelled event.",
  notes: ["Also returned as `links.stop` on the job object.", "Completed steps are not rolled back."],
  useCases: ["User presses Stop in a chat UI", "Killing a runaway background job"],
  code: lines(
    "curl -X POST \"$LANGFLOW_SERVER_URL/api/v2/workflows/stop\" \\",
    "  -H \"Content-Type: application/json\" -H \"x-api-key: $LANGFLOW_API_KEY\" \\",
    "  -d '{\"job_id\": \"'\"$JOB_ID\"'\"}'",
  ),
  language: "bash",
  related: ["POST /api/v2/workflows"],
});

add("POST /api/v1/responses", "SVC", "s", {
  page: "api-openai-responses",
  description: "OpenAI Responses API–compatible endpoint. Use existing OpenAI client libraries by setting model to a flow ID and authenticating with x-api-key.",
  signature: "POST /api/v1/responses\nBody: { model: <flow_id>, input: string, stream?: bool, background?: bool, previous_response_id?: string, include?: string[] }",
  parameters: [
    { name: "model", type: "string (required)", description: "The flow ID or endpoint name." },
    { name: "input", type: "string (required)", description: "Text sent to the flow's Chat Input." },
    { name: "stream", type: "bool", description: "Return response.chunk deltas until a completed chunk." },
    { name: "previous_response_id", type: "string", description: "Continue a conversation." },
    { name: "include", type: "string[]", description: "Extra data such as ['tool_call.results']." },
  ],
  returns: "An OpenAI-style response: { id, object: \"response\", created_at, model, status, output: [...], usage, ... }",
  notes: [
    "The flow must contain a Chat Input component.",
    "The `tools` parameter isn't supported and returns an error.",
    "OpenAI clients send `Authorization: Bearer`; set `default_headers={'x-api-key': ...}` and any placeholder `api_key`.",
    "Fixed OpenAI defaults are returned for compatibility (temperature 1.0, top_p 1.0, truncation disabled...).",
  ],
  useCases: ["Swapping an OpenAI call for a Langflow flow with minimal code changes", "Using OpenAI SDK streaming against Langflow"],
  code: lines(
    "import os",
    "from openai import OpenAI",
    "",
    "client = OpenAI(",
    "    base_url=f\"{os.environ['LANGFLOW_SERVER_URL']}/api/v1/\",",
    "    api_key=\"dummy-api-key\",",
    "    default_headers={\"x-api-key\": os.environ[\"LANGFLOW_API_KEY\"]},",
    ")",
    "response = client.responses.create(model=os.environ[\"FLOW_ID\"], input=\"Hello, how are you?\")",
    "print(response.output_text)",
  ),
  language: "python",
  related: ["POST /api/v1/run/{flow_id}", "Chat Input"],
});

add("POST /api/v1/build/{flow_id}/flow", "SVC", "s", {
  page: "api-build",
  description: "Internal endpoint used by the visual editor to build and execute a flow, returning a job_id whose events stream from /build/{job_id}/events. Use /run in applications.",
  signature: "POST /api/v1/build/{flow_id}/flow  →  { job_id }\nGET /api/v1/build/{job_id}/events?stream=true",
  parameters: [
    { name: "inputs", type: "object", description: "Input values for flow components." },
    { name: "data", type: "object", description: "Flow data overriding the stored configuration." },
    { name: "files", type: "string[]", description: "File paths to use." },
    { name: "start_component_id / stop_component_id", type: "string", description: "Partial runs, like Run component in the editor." },
    { name: "log_builds", type: "bool", description: "Record build logs; default true." },
  ],
  returns: "A job_id; the events endpoint streams build events (or returns them all with stream=false).",
  notes: ["Meant for contributors to the Langflow codebase.", "Tweaks policy applies here too.", "Cancel with `POST /api/v1/build/{job_id}/cancel`."],
  useCases: ["Understanding how the editor runs flows", "Partial runs up to a chosen component"],
  code: lines(
    "curl -X POST \"$LANGFLOW_SERVER_URL/api/v1/build/$FLOW_ID/flow\" \\",
    "  -H \"Content-Type: application/json\" -H \"x-api-key: $LANGFLOW_API_KEY\" \\",
    "  -d '{\"inputs\": {\"input_value\": \"Hi\"}, \"stop_component_id\": \"OpenAIModel-d1wOZ\"}'",
  ),
  language: "bash",
  related: ["POST /api/v1/run/{flow_id}", "GET /api/v1/monitor/builds"],
});

add("POST /api/v1/flows/", "SVC", "s", {
  page: "api-flows",
  description: "Create a flow from a JSON definition. Related endpoints read, update, delete and batch-create flows.",
  signature: "POST /api/v1/flows/   ·   POST /api/v1/flows/batch/   ·   GET|DELETE /api/v1/flows/{flow_id}",
  parameters: [
    { name: "name / description", type: "string", description: "Flow metadata." },
    { name: "data", type: "object", description: "The nodes and edges of the flow." },
    { name: "endpoint_name", type: "string", description: "Optional alias for /run URLs." },
    { name: "project_id", type: "UUID", description: "Target project." },
    { name: "webhook / is_component / tags", type: "various", description: "Optional flags and tags." },
  ],
  returns: "The created flow object, including its id.",
  notes: ["`POST /api/v1/flows/batch/` takes `{\"flows\": [...]}` and returns an array.", "`DELETE /api/v1/flows/` deletes several flows by ID.", "`GET /api/v1/flows/basic_examples/` lists sample flows."],
  useCases: ["Provisioning flows from code", "Cloning flows between servers"],
  code: lines(
    "curl -X POST \"$LANGFLOW_URL/api/v1/flows/\" \\",
    "  -H \"Content-Type: application/json\" -H \"x-api-key: $LANGFLOW_API_KEY\" \\",
    "  -d '{\"name\": \"support-bot\", \"description\": \"FAQ assistant\", \"data\": {}, \"endpoint_name\": \"support-bot\"}'",
  ),
  language: "bash",
  related: ["GET /api/v1/flows/", "PATCH /api/v1/flows/{flow_id}", "POST /api/v1/flows/upload/"],
});

add("GET /api/v1/flows/", "SVC", "s", {
  page: "api-flows",
  description: "List flows with pagination and filters, optionally scoped to one project.",
  signature: "GET /api/v1/flows/?get_all=false&page=1&size=50&project_id=...&remove_example_flows=true&components_only=false&header_flows=false",
  parameters: [
    { name: "page / size", type: "int", description: "Pagination when get_all=false." },
    { name: "project_id", type: "UUID", description: "Only flows in this project." },
    { name: "remove_example_flows", type: "bool", description: "Hide starter examples." },
    { name: "components_only / header_flows", type: "bool", description: "Return only saved components, or lightweight headers." },
  ],
  returns: "A list (or page) of flow objects.",
  notes: ["Read one flow with `GET /api/v1/flows/{flow_id}`.", "Public flows are readable at `/api/v1/flows/public_flow/{flow_id}`."],
  useCases: ["Finding flow IDs from scripts", "Auditing flows per project"],
  code: "curl \"$LANGFLOW_URL/api/v1/flows/?get_all=false&page=1&size=50&project_id=$PROJECT_ID\" -H \"x-api-key: $LANGFLOW_API_KEY\"",
  language: "bash",
  related: ["POST /api/v1/flows/", "Projects"],
});

add("PATCH /api/v1/flows/{flow_id}", "SVC", "s", {
  page: "api-flows",
  description: "Update a flow's name, description, data, project, endpoint name or lock state.",
  signature: "PATCH /api/v1/flows/{flow_id}\nBody: { name?, description?, data?, project_id?, endpoint_name?, locked? }",
  parameters: [
    { name: "endpoint_name", type: "string", description: "Rename the /run alias, e.g. my_new_endpoint_name." },
    { name: "locked", type: "bool", description: "Lock the flow against edits." },
    { name: "project_id", type: "UUID", description: "Move the flow to another project." },
  ],
  returns: "The updated flow object.",
  notes: ["Only fields you send are changed.", "Delete with `DELETE /api/v1/flows/{flow_id}`."],
  useCases: ["Setting a stable endpoint name after import", "Locking production flows"],
  code: lines(
    "curl -X PATCH \"$LANGFLOW_URL/api/v1/flows/$FLOW_ID\" \\",
    "  -H \"Content-Type: application/json\" -H \"x-api-key: $LANGFLOW_API_KEY\" \\",
    "  -d '{\"endpoint_name\": \"support-bot\", \"locked\": true}'",
  ),
  language: "bash",
  related: ["POST /api/v1/flows/", "Flow"],
});

add("POST /api/v1/flows/upload/", "SVC", "s", {
  page: "api-flows",
  description: "Import flows by uploading a Langflow JSON file, optionally into a specific project folder.",
  signature: "POST /api/v1/flows/upload/?folder_id={project_id}   (multipart/form-data, field: file)",
  parameters: [{ name: "folder_id", type: "UUID (query)", description: "Target project; it must already exist." }],
  returns: "The imported flow objects.",
  notes: ["List project IDs with `GET /api/v1/projects/`.", "Pair with `POST /api/v1/flows/download/` to move flows between servers."],
  useCases: ["Deploying exported flows", "Restoring backups"],
  code: lines(
    "curl -X POST \"$LANGFLOW_URL/api/v1/flows/upload/?folder_id=$FOLDER_ID\" \\",
    "  -H \"x-api-key: $LANGFLOW_API_KEY\" \\",
    "  -F \"file=@agent-with-astra-db-tool.json;type=application/json\"",
  ),
  language: "bash",
  related: ["POST /api/v1/flows/download/", "POST /api/v1/projects/"],
});

add("POST /api/v1/flows/download/", "SVC", "s", {
  page: "api-flows",
  description: "Export the listed flows as a ZIP of Langflow JSON files.",
  signature: "POST /api/v1/flows/download/\nBody: [\"<flow_id>\", ...]",
  parameters: [{ name: "body", type: "string[]", description: "Flow IDs to export." }],
  returns: "A ZIP file (save with --output).",
  notes: ["Exported JSON can be committed to Git and imported elsewhere.", "Set `--remove-api-keys` on the server to keep keys out of saved flows."],
  useCases: ["Backups", "Versioning flows in Git"],
  code: lines(
    "curl -X POST \"$LANGFLOW_URL/api/v1/flows/download/\" \\",
    "  -H \"Content-Type: application/json\" -H \"x-api-key: $LANGFLOW_API_KEY\" \\",
    "  -d '[\"e1e40c77-0541-41a9-88ab-ddb3419398b5\"]' --output langflow-flows.zip",
  ),
  language: "bash",
  related: ["POST /api/v1/flows/upload/", "GET /api/v1/projects/download/{project_id}"],
});

add("POST /api/v1/projects/", "SVC", "s", {
  page: "api-projects",
  description: "Create a project, optionally moving existing flows and components into it. Read, update and delete use /projects/{project_id}.",
  signature: "POST /api/v1/projects/\nBody: { name, description?, components_list?: UUID[], flows_list?: UUID[] }",
  parameters: [
    { name: "name", type: "string", description: "Project name." },
    { name: "flows_list / components_list", type: "UUID[]", description: "Flows/components to move into the project (they are moved, not copied)." },
  ],
  returns: "The created project with its id.",
  notes: ["`PATCH /api/v1/projects/{id}` updates only fields you send.", "`DELETE /api/v1/projects/{id}` deletes a project.", "`GET /api/v1/starter-projects/` lists templates."],
  useCases: ["Organising flows per client", "Scripted environment setup"],
  code: lines(
    "curl -X POST \"$LANGFLOW_URL/api/v1/projects/\" \\",
    "  -H \"Content-Type: application/json\" -H \"x-api-key: $LANGFLOW_API_KEY\" \\",
    "  -d '{\"name\": \"support\", \"description\": \"Support flows\", \"components_list\": [], \"flows_list\": []}'",
  ),
  language: "bash",
  related: ["Projects", "GET /api/v1/projects/download/{project_id}"],
});

add("GET /api/v1/projects/download/{project_id}", "SVC", "s", {
  page: "api-projects",
  description: "Download all flows in a project as a ZIP; re-import with POST /api/v1/projects/upload/.",
  signature: "GET /api/v1/projects/download/{project_id}",
  parameters: [{ name: "project_id", type: "UUID", description: "Project to export." }],
  returns: "A ZIP of the project's flows.",
  notes: ["Import creates the project and its flows on the target server.", "Use for moving a whole project between environments."],
  useCases: ["Promoting a project from staging to production", "Project backups"],
  code: "curl \"$LANGFLOW_URL/api/v1/projects/download/$PROJECT_ID\" -H \"x-api-key: $LANGFLOW_API_KEY\" --output langflow-project.zip",
  language: "bash",
  related: ["POST /api/v1/projects/", "POST /api/v1/flows/download/"],
});

add("POST /api/v1/files/upload/{flow_id}", "SVC", "s", {
  page: "api-files",
  description: "Upload a file (including images) to a flow with the v1 Files API, then pass the returned file_path to components through tweaks.",
  signature: "POST /api/v1/files/upload/{flow_id}   (multipart/form-data, field: file)",
  parameters: [{ name: "file", type: "form file", description: "Default size limit 1024 MB (LANGFLOW_MAX_FILE_SIZE_UPLOAD)." }],
  returns: "{ flowId, file_path: \"FLOW_ID/TIMESTAMP_FILENAME.EXT\" }",
  notes: [
    "v1 files are attached to a flow; list, download and delete with `/v1/files/list|download|delete/{flow_id}/...`.",
    "Images must use v1 — `/v2/files` doesn't support images.",
    "Send the path to Chat Input with a `files` tweak, e.g. `{\"ChatInput-b67sL\": {\"files\": \"<file_path>\"}}`.",
  ],
  useCases: ["Asking a vision model to describe an uploaded image", "Feeding a document into a flow"],
  code: lines(
    "curl -X POST \"$LANGFLOW_URL/api/v1/files/upload/$FLOW_ID\" \\",
    "  -H \"x-api-key: $LANGFLOW_API_KEY\" -F \"file=@image-file.png\"",
    "# then run with: \"tweaks\": {\"ChatInput-b67sL\": {\"files\": \"$FLOW_ID/2024-11-27_14-47-50_image-file.png\", \"input_value\": \"describe this image\"}}",
  ),
  language: "bash",
  related: ["POST /api/v2/files", "Tweaks", "Chat Input"],
});

add("POST /api/v2/files", "SVC", "s", {
  page: "api-files",
  description: "Upload a file owned by the current user (v2). Files are tracked in the database and reusable across flows; supports bulk download and delete.",
  signature: "POST /api/v2/files   ·   GET /api/v2/files   ·   GET|PUT|DELETE /api/v2/files/{file_id}   ·   POST|DELETE /api/v2/files/batch/",
  parameters: [
    { name: "file", type: "form file", description: "The file to upload." },
    { name: "name", type: "query (PUT)", description: "Rename a file by ID." },
  ],
  returns: "File metadata including id and path.",
  notes: ["v2 files are organised by user_id, not flow_id.", "v2 doesn't support image files; use the v1 upload for images.", "You can only access your own files, even as a superuser."],
  useCases: ["Uploading a PDF once and using it in several flows", "Cleaning up all of a user's files"],
  code: lines(
    "curl -X POST \"$LANGFLOW_URL/api/v2/files\" -H \"x-api-key: $LANGFLOW_API_KEY\" -F \"file=@report.pdf\"",
    "# use the returned path with a Read File component tweak: {\"Read-File-1olS3\": {\"path\": [\"<user_id>/<file>.pdf\"]}}",
  ),
  language: "bash",
  related: ["POST /api/v1/files/upload/{flow_id}"],
});

add("GET /api/v1/monitor/messages", "SVC", "s", {
  page: "api-monitor",
  description: "Read stored chat messages, filtered by flow, session, sender and order. Related endpoints update, delete and re-key messages and sessions.",
  signature: "GET /api/v1/monitor/messages?flow_id=&session_id=&sender=&sender_name=&order_by=timestamp&order=ASC&limit=100&offset=0",
  parameters: [
    { name: "flow_id / session_id", type: "string", description: "Scope to one flow or conversation." },
    { name: "sender", type: "User | Machine", description: "Filter by sender type." },
    { name: "order_by / order / limit / offset", type: "string / int", description: "Sorting and paging." },
  ],
  returns: "A list of message objects.",
  notes: [
    "`DELETE /api/v1/monitor/messages` deletes by a list of IDs.",
    "`PUT /api/v1/monitor/messages/{id}` edits message text.",
    "`PATCH .../messages/session/{old}?new_session_id=` renames a session; `DELETE .../messages/session/{id}` clears it.",
  ],
  useCases: ["Exporting chat transcripts", "Clearing a user's conversation on request"],
  code: "curl \"$LANGFLOW_URL/api/v1/monitor/messages?flow_id=$FLOW_ID&session_id=chat-123&order=ASC&limit=100\" -H \"x-api-key: $LANGFLOW_API_KEY\"",
  language: "bash",
  related: ["Session ID", "GET /api/v1/monitor/traces"],
});

add("GET /api/v1/monitor/builds", "SVC", "s", {
  page: "api-monitor",
  description: "Get (or delete) vertex builds for a flow — the per-component results recorded by Playground and editor runs. Transactions are listed at /monitor/transactions.",
  signature: "GET|DELETE /api/v1/monitor/builds?flow_id={flow_id}   ·   GET /api/v1/monitor/transactions?flow_id=&page=1&size=50",
  parameters: [{ name: "flow_id", type: "UUID", description: "The flow whose builds to read or delete." }],
  returns: "Vertex build records keyed by component.",
  notes: ["Retention: `LANGFLOW_MAX_VERTEX_BUILDS_TO_KEEP` (3000) and `LANGFLOW_MAX_VERTEX_BUILDS_PER_VERTEX` (2).", "Transactions retention: `LANGFLOW_MAX_TRANSACTIONS_TO_KEEP` (3000)."],
  useCases: ["Debugging which component produced an output", "Cleaning build history"],
  code: "curl \"$LANGFLOW_URL/api/v1/monitor/builds?flow_id=$FLOW_ID\" -H \"x-api-key: $LANGFLOW_API_KEY\"",
  language: "bash",
  related: ["GET /api/v1/monitor/traces", "POST /api/v1/build/{flow_id}/flow"],
});

add("GET /api/v1/monitor/traces", "SVC", "s", {
  page: "traces",
  description: "Read native execution traces: one trace per flow run with spans for each component and for LangChain chains, tools, retrievers and LLM calls, including latency and token usage.",
  signature: "GET /api/v1/monitor/traces?flow_id={flow_id}   ·   GET /api/v1/monitor/traces/{trace_id}",
  parameters: [{ name: "flow_id", type: "UUID", description: "Filter traces to one flow." }],
  returns: "Traces with spans: name, type, start/end, latency_ms, inputs, outputs, errors and attributes such as token counts.",
  notes: [
    "Stored in the `trace` and `span` tables; shown in Flow Activity and Trace Details pages.",
    "Enabled by default; `LANGFLOW_NATIVE_TRACING=false` turns it off for an external provider.",
    "Human-in-the-Loop decisions appear as approved/rejected spans in the same trace.",
    "External options include Langfuse, LangSmith, LangWatch, Arize, Opik and OpenTelemetry.",
  ],
  useCases: ["Finding slow components", "Tracking token cost per run", "Debugging failed tool calls"],
  code: "curl \"$LANGFLOW_URL/api/v1/monitor/traces?flow_id=$FLOW_ID\" -H \"x-api-key: $LANGFLOW_API_KEY\"",
  language: "bash",
  related: ["GET /api/v1/monitor/builds", "GET /logs-stream"],
});

add("GET /logs-stream", "SVC", "s", {
  page: "api-logs",
  description: "Stream server logs over Server-Sent Events, or fetch a window of logs from GET /logs. Requires a superuser and log retrieval enabled.",
  signature: "GET /logs-stream (text/event-stream)   ·   GET /logs?lines_before=0&lines_after=0&timestamp=0",
  parameters: [
    { name: "lines_before / lines_after", type: "int", description: "Lines around the timestamp; with all defaults (0) the last 10 lines are returned." },
    { name: "timestamp", type: "int", description: "Starting point for /logs." },
  ],
  returns: "Log records as SSE events or JSON.",
  notes: [
    "Enable with `LANGFLOW_ENABLE_LOG_RETRIEVAL=True`, `LANGFLOW_LOG_RETRIEVER_BUFFER_SIZE=10000`, `LANGFLOW_LOG_LEVEL=DEBUG`.",
    "Note these paths are not under /api/v1.",
    "The TypeScript client exposes `client.logs.stream()`.",
  ],
  useCases: ["Live debugging a deployment", "Tailing logs while a flow runs"],
  code: "curl -N \"$LANGFLOW_URL/logs-stream\" -H \"accept: text/event-stream\" -H \"x-api-key: $LANGFLOW_API_KEY\"",
  language: "bash",
  related: ["GET /api/v1/monitor/traces", "LangflowClient"],
});

add("POST /api/v1/users/", "SVC", "s", {
  page: "api-users",
  description: "Create a user account. With authentication enabled, superusers manage accounts through the Users API.",
  signature: "POST /api/v1/users/  ·  GET /api/v1/users/?skip=0&limit=10  ·  PATCH|DELETE /api/v1/users/{user_id}  ·  PATCH /api/v1/users/{user_id}/reset-password",
  parameters: [
    { name: "username / password", type: "string", description: "New account credentials." },
    { name: "is_active / is_superuser", type: "bool (PATCH)", description: "Activate or promote a user (superuser only)." },
    { name: "current_password / password", type: "string (reset-password)", description: "Users reset their own password." },
  ],
  returns: "The user object.",
  notes: [
    "Public self-registration is controlled by `LANGFLOW_ENABLE_SIGNUP` (default True) and always off with auto-login.",
    "New accounts stay inactive until activated unless `LANGFLOW_NEW_USER_IS_ACTIVE=True`.",
    "You cannot delete your own account.",
  ],
  useCases: ["Onboarding team members", "Activating sign-ups", "Promoting an admin"],
  code: lines(
    "curl -X POST \"$LANGFLOW_URL/api/v1/users/\" -H \"Content-Type: application/json\" -H \"x-api-key: $LANGFLOW_API_KEY\" \\",
    "  -d '{\"username\": \"newuser2\", \"password\": \"securepassword123\"}'",
    "curl -X PATCH \"$LANGFLOW_URL/api/v1/users/$USER_ID\" -H \"Content-Type: application/json\" -H \"x-api-key: $LANGFLOW_API_KEY\" \\",
    "  -d '{\"is_active\": true}'",
  ),
  language: "bash",
  related: ["GET /api/v1/users/whoami", "langflow superuser", "LANGFLOW_AUTO_LOGIN"],
});

add("GET /api/v1/users/whoami", "SVC", "s", {
  page: "api-users",
  description: "Return the user that the current API key or session belongs to.",
  signature: "GET /api/v1/users/whoami",
  parameters: [],
  returns: "{ id, username, is_active, is_superuser, ... }",
  notes: ["Handy to verify which account a key acts as.", "Keys inherit their creator's privileges."],
  useCases: ["Checking an API key in CI", "Showing the signed-in user in a custom UI"],
  code: "curl \"$LANGFLOW_URL/api/v1/users/whoami\" -H \"x-api-key: $LANGFLOW_API_KEY\"",
  language: "bash",
  related: ["POST /api/v1/users/", "POST /api/v1/api_key/"],
});

add("POST /api/v1/api_key/", "SVC", "s", {
  page: "api-keys-and-authentication",
  description: "Create an API key for the current user. GET lists keys and DELETE /api/v1/api_key/{api_key_id} revokes one.",
  signature: "POST /api/v1/api_key/  ·  GET /api/v1/api_key/  ·  DELETE /api/v1/api_key/{api_key_id}",
  parameters: [{ name: "name", type: "string", description: "A label for the key." }],
  returns: "The new key (shown once) and its metadata.",
  notes: [
    "Usage is tracked in `total_uses` and `last_used_at`; disable with `LANGFLOW_DISABLE_TRACK_APIKEY_USAGE=True` under high concurrency.",
    "With `LANGFLOW_API_KEY_SOURCE=env`, keys are checked against `LANGFLOW_API_KEY` instead.",
    "A key can't access resources outside its own Langflow server.",
  ],
  useCases: ["Issuing per-application keys", "Rotating credentials"],
  code: "curl -X POST \"$LANGFLOW_URL/api/v1/api_key/\" -H \"Content-Type: application/json\" -H \"x-api-key: $LANGFLOW_API_KEY\" -d '{\"name\": \"mobile-app\"}'",
  language: "bash",
  related: ["langflow api-key", "LANGFLOW_API_KEY_SOURCE"],
});

add("GET /health_check", "SVC", "s", {
  page: "api-reference-api-examples",
  description: "Health check that validates database and chat-service connectivity; returns 500 if a service is unavailable. Also see GET /api/v1/version and /api/v1/config.",
  signature: "GET /health_check   ·   GET /api/v1/version   ·   GET /api/v1/config",
  parameters: [],
  returns: "{ \"status\": \"ok\", \"chat\": \"ok\", \"db\": \"ok\" } when healthy.",
  notes: ["`GET /health` is served by uvicorn before Langflow finishes starting, so it isn't a reliable readiness probe.", "`/api/v1/config` requires an API key."],
  useCases: ["Kubernetes readiness probes", "Uptime monitoring", "Checking the deployed version"],
  code: lines("curl \"$LANGFLOW_URL/health_check\"", "curl \"$LANGFLOW_URL/api/v1/version\""),
  language: "bash",
  related: ["GET /api/v1/all"],
});

add("GET /api/v1/all", "SVC", "s", {
  page: "api-reference-api-examples",
  description: "Return a dictionary of every available component type. Custom-component endpoints sit alongside it.",
  signature: "GET /api/v1/all   ·   POST /api/v1/custom_component   ·   POST /api/v1/validate/code   ·   POST /api/v1/validate/prompt",
  parameters: [],
  returns: "Components grouped by category with their templates.",
  notes: ["Requires an API key.", "`POST /api/v1/validate/code` checks custom component Python before you save it."],
  useCases: ["Tooling that lists available components", "Validating custom component code in CI"],
  code: "curl \"$LANGFLOW_URL/api/v1/all\" -H \"x-api-key: $LANGFLOW_API_KEY\"",
  language: "bash",
  related: ["Component", "GET /health_check"],
});

add("/api/v1/mcp/project/{project_id}/streamable", "SVC", "s", {
  page: "mcp-server",
  description: "Each Langflow project is an MCP server: its enabled flows become MCP tools, served over streamable HTTP (SSE as fallback) at this URL.",
  signature: "http://LANGFLOW_SERVER_ADDRESS/api/v1/mcp/project/{project_id}/streamable",
  parameters: [
    { name: "project_id", type: "UUID", description: "The project whose flows are exposed." },
    { name: "x-api-key", type: "header", description: "Required when the server has authentication (AUTO_LOGIN=false)." },
  ],
  returns: "An MCP endpoint listing the project's flows as tools.",
  notes: [
    "Flows need a Chat Output component to be usable as tools.",
    "Give tools clear names and descriptions in Projects > MCP Server > Edit Tools — the default name is the flow ID.",
    "Tool timeout defaults to 180 s; raise with `LANGFLOW_MCP_TOOL_EXECUTION_TIMEOUT` or per component.",
    "`LANGFLOW_ADD_PROJECTS_TO_MCP_SERVERS=false` stops new projects being exposed automatically.",
  ],
  useCases: ["Using Langflow flows as tools in Cursor or Claude Desktop", "Sharing internal workflows with any MCP client"],
  code: lines(
    "{",
    "  \"mcpServers\": {",
    "    \"support-flows\": {",
    "      \"command\": \"uvx\",",
    "      \"args\": [",
    "        \"mcp-proxy\", \"--transport\", \"streamablehttp\",",
    "        \"--headers\", \"x-api-key\", \"YOUR_LANGFLOW_API_KEY\",",
    "        \"http://localhost:7860/api/v1/mcp/project/PROJECT_ID/streamable\"",
    "      ]",
    "    }",
    "  }",
    "}",
  ),
  language: "json",
  related: ["MCP Tools", "Projects", "POST /api/v1/a2a/{flow_id}/jsonrpc"],
});

add("POST /api/v1/a2a/{flow_id}/jsonrpc", "SVC", "p", {
  page: "a2a-server",
  description: "Serve a flow as an Agent2Agent (A2A) agent. Clients discover it through its agent card and call it over JSON-RPC.",
  signature: "GET /api/v1/a2a/{flow_id}/.well-known/agent-card.json   ·   POST /api/v1/a2a/{flow_id}/jsonrpc",
  parameters: [
    { name: "method", type: "JSON-RPC", description: "message/send, message/stream, tasks/get, tasks/cancel, tasks/resubscribe, tasks/pushNotificationConfig/*." },
    { name: "contextId", type: "string", description: "Maps to the flow's chat session so turns share history." },
  ],
  returns: "A completed task; the reply text is at result.artifacts[0].parts[0].text.",
  notes: [
    "Off by default since 1.11: set `LANGFLOW_A2A_ENABLED=true`.",
    "The flow needs a Chat Input (or Human Input) and a Chat Output.",
    "Publish from the editor's Agent pane: toggle Serve as an A2A agent, then Save (status Live).",
    "The agent card is public per the A2A spec; the JSON-RPC endpoint follows project authentication.",
  ],
  useCases: ["Letting other agent platforms call your Langflow agent", "Multi-agent systems across vendors"],
  code: lines(
    "curl -X POST \"$LANGFLOW_URL/api/v1/a2a/$FLOW_ID/jsonrpc\" \\",
    "  -H \"Content-Type: application/json\" -H \"x-api-key: $LANGFLOW_API_KEY\" \\",
    "  -d '{\"jsonrpc\": \"2.0\", \"id\": 1, \"method\": \"message/send\",",
    "       \"params\": {\"message\": {\"role\": \"user\", \"messageId\": \"m1\", \"contextId\": \"chat-1\",",
    "                  \"parts\": [{\"kind\": \"text\", \"text\": \"Hello\"}]}}}'",
  ),
  language: "bash",
  related: ["/api/v1/mcp/project/{project_id}/streamable", "Agent"],
});

/* ───────────────────────── Components ───────────────────────── */

add("Chat Input", "Co", "s", {
  page: "chat-input-and-output",
  description: "Entry point for chat flows. Builds a Message from the user's text (and files) and passes it on; required for the Playground, embedded chat and the Responses API.",
  signature: "Chat Input(input_value, sender, sender_name, session_id, files, should_store_message) → Message",
  parameters: [
    { name: "input_value", type: "string", description: "The message text (Input Text)." },
    { name: "sender / sender_name", type: "string", description: "User or Language Model, and a display name." },
    { name: "session_id", type: "string", description: "Chat session; empty uses the current session." },
    { name: "files", type: "file[]", description: "Files sent with the message." },
    { name: "should_store_message", type: "bool", description: "Store in chat history (Store Messages)." },
  ],
  returns: "A Message with text, sender, session_id, files and timestamp.",
  notes: ["API runs fill `input_value` from the request.", "Send files by uploading them and tweaking `files` with the returned path.", "Text Input/Output are legacy and don't support chat context."],
  useCases: ["Every chatbot flow", "Vision prompts with attached images"],
  code: "{\"input_value\": \"describe this image\", \"tweaks\": {\"ChatInput-b67sL\": {\"files\": \"FLOW_ID/2024-11-27_14-47-50_image-file.png\"}}}",
  language: "json",
  related: ["Chat Output", "Message", "POST /api/v1/files/upload/{flow_id}"],
});

add("Chat Output", "Co", "s", {
  page: "chat-input-and-output",
  description: "Displays and returns the flow's reply as a Message. Its output is what /run returns and what MCP tools and the Playground show.",
  signature: "Chat Output(input_value, should_store_message, sender, sender_name, session_id, data_template, clean_data) → Message",
  parameters: [
    { name: "input_value", type: "Message | JSON | Table", description: "What to output." },
    { name: "data_template", type: "string", description: "Template to turn JSON into text; defaults to the text key." },
    { name: "clean_data", type: "bool", description: "Clean Table input when converting to text." },
    { name: "should_store_message", type: "bool", description: "Store in chat history." },
  ],
  returns: "A Message.",
  notes: ["A flow needs Chat Output to be served as an MCP tool.", "Use `output_component` in /run to pick between several outputs."],
  useCases: ["Returning the model answer", "Printing parsed webhook data while debugging"],
  code: "Language Model ──Message──▶ Chat Output",
  language: "text",
  related: ["Chat Input", "Message"],
});

add("Agent", "Co", "s", {
  page: "agents",
  description: "The core agent component: an LLM that reasons over the input, calls connected tools and replies. Includes built-in chat memory per session.",
  signature: "Agent(agent_llm, system_prompt, input_value, tools[], n_messages, add_current_date_tool, handle_parsing_errors, verbose) → Response: Message | Structured Response: JSON",
  parameters: [
    { name: "agent_llm (Language Model)", type: "dropdown | LanguageModel", description: "A globally configured model, or a connected model component." },
    { name: "system_prompt (Agent Instructions)", type: "string", description: "Instructions applied to every conversation." },
    { name: "tools", type: "Tool[]", description: "Components in Tool Mode, MCP Tools, or other agents." },
    { name: "Number of Chat History Messages", type: "int", description: "How much memory to load per session." },
    { name: "add_current_date_tool / handle_parsing_errors / verbose", type: "bool", description: "Extra built-in behaviours." },
  ],
  returns: "Response (Message) and an optional Structured Response (JSON) built from an Output Schema.",
  notes: [
    "Configure providers in Settings > Model Providers; one key per provider.",
    "Structured Response makes a separate LLM call and doesn't write chat history.",
    "Use Message History only for external memory such as Mem0 or extra filtering.",
    "Tools can require approval, pausing the run for a human decision.",
  ],
  useCases: ["Research agents with Web Search and URL tools", "Multi-agent flows using agents as tools", "MCP-powered assistants"],
  code: "Chat Input ──▶ Agent ◀── Toolset (Web Search, URL, Calculator, MCP Tools)\nAgent ──Response──▶ Chat Output",
  language: "text",
  related: ["Tool Mode", "MCP Tools", "Message History", "Language Model"],
});

add("Language Model", "Co", "s", {
  page: "components-models",
  description: "Call an LLM from any configured provider. Outputs a Message reply, or a LanguageModel instance for components that need a model.",
  signature: "Language Model(provider, model_name, input_value, system_message, stream, temperature) → Message | LanguageModel",
  parameters: [
    { name: "provider / model_name", type: "string", description: "From the global Models configuration." },
    { name: "system_message", type: "string", description: "Sets the assistant's behaviour." },
    { name: "temperature", type: "float [0,1]", description: "Default 0.1." },
    { name: "stream", type: "bool", description: "Stream the response; default false." },
  ],
  returns: "Model Response (Message) or Language Model (a LangChain chat model).",
  notes: ["Switch the output type to Language Model to feed Structured Output, Smart Router or Batch Run.", "Provider-specific model components live in bundles."],
  useCases: ["Basic prompting flows", "Supplying a model to Structured Output"],
  code: "Prompt Template ──Message──▶ Language Model ──Message──▶ Chat Output",
  language: "text",
  related: ["Prompt Template", "Structured Output", "Embedding Model"],
});

add("Embedding Model", "Co", "s", {
  page: "components-embedding-models",
  description: "Produce vector embeddings with a configured provider for vector stores and the Knowledge Base.",
  signature: "Embedding Model(provider, model, api_base, dimensions, chunk_size=1000, max_retries=3, ...) → Embeddings",
  parameters: [
    { name: "provider / model", type: "list", description: "Configured in the global Models pane." },
    { name: "dimensions", type: "int", description: "Output vector size where supported." },
    { name: "chunk_size", type: "int", description: "Text chunk size; default 1000." },
  ],
  returns: "An Embeddings instance.",
  notes: ["Connect to a vector store's Embedding port.", "The same model must be used for ingest and query."],
  useCases: ["RAG ingestion", "Semantic search"],
  code: "Split Text ──▶ Vector Store ◀──Embeddings── Embedding Model",
  language: "text",
  related: ["Knowledge Base", "Split Text"],
});

add("Prompt Template", "Co", "s", {
  page: "components-prompts",
  description: "Build a prompt from a template. Each {variable} becomes an input port; enable double brackets for Mustache {{variable}} syntax.",
  signature: "Prompt Template(template, use_double_brackets=False) → Message",
  parameters: [
    { name: "template", type: "string", description: "Text with {VARIABLE_NAME} placeholders." },
    { name: "use_double_brackets", type: "bool", description: "Use {{variable}} so literal braces (e.g. JSON) are safe." },
  ],
  returns: "A Message containing the rendered prompt.",
  notes: ["Each placeholder adds a field you can fill or connect.", "Use Mustache mode when the prompt includes JSON examples."],
  useCases: ["Injecting retrieved context into a RAG prompt", "Reusable instruction templates"],
  code: "Answer using only this context:\n{context}\n\nQuestion: {question}",
  language: "text",
  related: ["Language Model", "Parser"],
});

add("Message History", "Co", "s", {
  page: "message-history",
  description: "Retrieve or store chat messages by session from Langflow storage or external memory.",
  signature: "Message History(mode: Retrieve|Store, template, memory?, n_messages=100, order, sender_type, session_id)",
  parameters: [
    { name: "n_messages", type: "int", description: "Messages to retrieve; default 100." },
    { name: "order", type: "Ascending|Descending", description: "Default Ascending." },
    { name: "sender_type", type: "User|Machine|Machine and User", description: "Filter by sender." },
    { name: "memory", type: "External Memory", description: "Use an external store; empty means Langflow storage." },
    { name: "template", type: "string", description: "Format with {text}, {sender} or other keys." },
  ],
  returns: "Formatted history as a Message (or Table).",
  notes: ["Agents have built-in memory; this component is needed for external memory or extra control.", "Session ID defaults to the current run's session."],
  useCases: ["Adding chat history to a prompt", "Using Mem0 or Redis as memory"],
  code: "Message History (Retrieve) ──▶ Prompt Template {history}",
  language: "text",
  related: ["Session ID", "Agent"],
});

add("Structured Output", "Co", "s", {
  page: "structured-output",
  description: "Use an LLM to extract structured data that matches an Output Schema table.",
  signature: "Structured Output(llm: LanguageModel, input_value, system_prompt, schema_name, output_schema: Table) → JSON | Table",
  parameters: [
    { name: "llm", type: "LanguageModel", description: "Model from a Language Model component." },
    { name: "system_prompt (Format Instructions)", type: "string", description: "Extraction instructions." },
    { name: "output_schema", type: "Table", description: "Rows of Name, Type, Description and As List." },
  ],
  returns: "Structured data as JSON or Table.",
  notes: ["Choose the output type next to the output port.", "Pairs well with Loop to process many records."],
  useCases: ["Extracting entities from emails", "Turning free text into rows for a database"],
  code: "Language Model ──LanguageModel──▶ Structured Output ──Table──▶ Parser",
  language: "text",
  related: ["Language Model", "Loop", "JSON", "Table"],
});

add("Parser", "Co", "s", {
  page: "parser",
  description: "Format JSON or Table data into text with a template, or stringify it.",
  signature: "Parser(input_data: JSON|Table, mode: Parser|Stringify, pattern, sep=\"\\n\", clean_data=True) → Message",
  parameters: [
    { name: "pattern", type: "string", description: "Template with {KEY_NAME} variables." },
    { name: "sep", type: "string", description: "Separator between rows; default newline." },
    { name: "clean_data", type: "bool", description: "Remove empty rows and lines; default true." },
  ],
  returns: "Parsed text as a Message.",
  notes: ["The usual partner of Webhook.", "Stringify mode is the quickest way to see raw payloads."],
  useCases: ["Formatting search results for a prompt", "Turning webhook JSON into a sentence"],
  code: "ID: {id} - Name: {name} - Email: {email}",
  language: "text",
  related: ["Webhook", "Prompt Template", "JSON"],
});

add("Split Text", "Co", "s", {
  page: "split-text",
  description: "Split text into overlapping chunks by a separator, ready for embedding.",
  signature: "Split Text(data_inputs, chunk_size, chunk_overlap, separator, text_key=\"text\", keep_separator) → Table",
  parameters: [
    { name: "chunk_size / chunk_overlap", type: "int", description: "Target chunk length and overlap characters." },
    { name: "separator", type: "string", description: "e.g. \\n, \\n\\n or }," },
    { name: "keep_separator", type: "False|True|Start|End", description: "Where separators go in chunks." },
  ],
  returns: "Chunks as a Table.",
  notes: ["Accepts Message, JSON or Table input.", "Overlap preserves context across chunk boundaries."],
  useCases: ["Preparing documents for RAG", "Chunking long transcripts"],
  code: "Read File ──▶ Split Text ──▶ Knowledge Base (Ingest)",
  language: "text",
  related: ["Knowledge Base", "Embedding Model"],
});

add("Loop", "Co", "s", {
  page: "loop",
  description: "Iterate over a list of JSON or Table items: each item goes out of the Item port, comes back through Looping, and the aggregate leaves from Done.",
  signature: "Loop(inputs: JSON[] | Table) → Item (JSON per item) · Done (aggregated JSON)",
  parameters: [{ name: "inputs", type: "JSON | Table", description: "e.g. a CSV split into rows." }],
  returns: "Done: the aggregated results of all iterations.",
  notes: ["The last component in the item chain must connect back to Looping.", "If-Else isn't compatible with Loop; filter data before looping instead."],
  useCases: ["Translating every row of a CSV", "Structuring many records and storing them in a vector DB"],
  code: "Loop.Item ──▶ Type Convert ──▶ Structured Output ──▶ Loop.Looping\nLoop.Done ──▶ Chroma DB",
  language: "text",
  related: ["Structured Output", "If-Else"],
});

add("If-Else", "Co", "s", {
  page: "if-else",
  description: "Route a message to a True or False branch by comparing text.",
  signature: "If-Else(input_text, match_text, operator, case_sensitive=False, max_iterations=10, default_route) → true_result | false_result",
  parameters: [
    { name: "operator", type: "equals|not equals|contains|starts with|ends with|regex", description: "Default equals." },
    { name: "max_iterations / default_route", type: "int / route", description: "Guard against cycles; default 10 then false_result." },
  ],
  returns: "A Message on the matching branch.",
  notes: ["Case sensitivity doesn't apply to regex.", "Use Smart Router for LLM-based categorisation."],
  useCases: ["Routing by keyword", "Simple validation gates"],
  code: "If-Else(operator=contains, match_text=\"refund\") ──true──▶ Refund flow",
  language: "text",
  related: ["Smart Router", "Loop"],
});

add("Smart Router", "Co", "s", {
  page: "smart-router",
  description: "Let an LLM classify input into routes defined in a table; each route is an output, with an optional Else.",
  signature: "Smart Router(Language Model, Input, Routes: Table, Override Output?, Additional Instructions?, Include Else Output=False)",
  parameters: [
    { name: "Routes", type: "Table", description: "Route name, optional description and optional output message." },
    { name: "Include Else Output", type: "bool", description: "Adds an Else branch for unmatched input." },
  ],
  returns: "A Message on the chosen route's output.",
  notes: ["The LLM returns the exact route name.", "Override Output replaces the message on any route."],
  useCases: ["Sentiment-based routing of feedback", "Intent routing in support bots"],
  code: "Routes: Positive | Negative | Neutral → separate handling flows",
  language: "text",
  related: ["If-Else", "Language Model"],
});

add("Run Flow", "Co", "s", {
  page: "run-flow",
  description: "Run another flow as a sub-flow, with generated inputs and optional tweaks; also usable as an agent tool.",
  signature: "Run Flow(flow_name_selected, session_id?, flow_tweak_data?, ...dynamic inputs) → run_outputs",
  parameters: [
    { name: "flow_name_selected", type: "dropdown", description: "The flow to run." },
    { name: "flow_tweak_data", type: "dict", description: "Tweaks for the sub-flow." },
  ],
  returns: "All outputs of the sub-flow (JSON, Message or Table).",
  notes: ["Internal sub-flow calls aren't restricted by `LANGFLOW_TWEAKS_POLICY=off`.", "Enable Tool Mode to let an agent call the sub-flow."],
  useCases: ["Reusing a RAG flow inside several agents", "Composing large systems from small flows"],
  code: "Agent ◀──Toolset── Run Flow (flow: \"Document Q&A\")",
  language: "text",
  related: ["Tool Mode", "Agent"],
});

add("URL", "Co", "s", {
  page: "url",
  description: "Fetch and recursively crawl web pages and return their content as text, Markdown or HTML.",
  signature: "URL(urls[], max_depth, prevent_outside, use_async, format, timeout, headers)",
  parameters: [
    { name: "max_depth", type: "int", description: "1 fetches only the given pages." },
    { name: "prevent_outside", type: "bool", description: "Stay on the root domain." },
    { name: "format", type: "Text|Markdown|HTML", description: "Default Text." },
  ],
  returns: "Page content as a Table / Message.",
  notes: ["Common agent tool.", "SSRF protection settings (`LANGFLOW_SSRF_*`) govern private hosts."],
  useCases: ["Summarising a web page", "Crawling docs for ingestion"],
  code: "Agent ◀──Toolset── URL (Tool Mode)",
  language: "text",
  related: ["Web Search", "Agent"],
});

add("Web Search", "Co", "s", {
  page: "web-search",
  description: "Search the web (DuckDuckGo), news (Google News) or RSS feeds and return results as a Table.",
  signature: "Web Search(search_mode: Web|News|RSS, query, timeout=5, max_results=5, max_content_length=2000, ...) → Table",
  parameters: [
    { name: "search_mode", type: "Web | News | RSS", description: "Default Web." },
    { name: "hl / gl / ceid / topic / location", type: "string", description: "News-mode localisation and topics." },
    { name: "max_results", type: "int", description: "0 returns all results." },
  ],
  returns: "A Table of title, link, snippet and content (news: title, link, published, summary).",
  notes: ["Enable Tool Mode to give agents live search.", "Lower max_content_length to save tokens."],
  useCases: ["Today's tech news summaries", "Grounding answers in current information"],
  code: "Agent ◀──Toolset── Web Search (Tool Mode, Search Mode = News)",
  language: "text",
  related: ["URL", "Agent", "Table"],
});

add("Python Interpreter", "Co", "s", {
  page: "python-interpreter",
  description: "Execute Python code in a flow, with an allowlist of importable modules. Can run in an isolated microVM.",
  signature: "Python Interpreter(global_imports: \"math,pandas\", python_code) → JSON",
  parameters: [
    { name: "global_imports", type: "string", description: "Comma-separated modules the code may import." },
    { name: "python_code", type: "code", description: "Code to run." },
  ],
  returns: "JSON with printed output or errors.",
  notes: [
    "Set `LANGFLOW_SANDBOX_BACKEND=exec-sandbox` to run each execution in a QEMU microVM (requires `langflow[sandbox]`).",
    "Sandbox limits: `LANGFLOW_SANDBOX_TIMEOUT_SECONDS` (30), `LANGFLOW_SANDBOX_MEMORY_MB` (192), network off by default.",
    "`LANGFLOW_BLOCK_CODE_INTERPRETER_COMPONENTS=true` blocks code-execution components for untrusted users.",
  ],
  useCases: ["Calculations an agent can call", "Quick data transformations"],
  code: "import math\nprint(math.sqrt(1764))",
  language: "python",
  related: ["Tool Mode", "Agent"],
});

add("MCP Tools", "Co", "s", {
  page: "mcp-client",
  description: "Connect a flow to an MCP server (stdio, HTTP or SSE) so an Agent can use its tools; can also connect to Langflow's own project MCP servers.",
  signature: "Settings > MCP Servers > Add (JSON | STDIO | HTTP/SSE)  →  drag server to canvas  →  MCP Tools(Tool?) ─Toolset─▶ Agent",
  parameters: [
    { name: "MCP Server", type: "select", description: "A registered server." },
    { name: "Tool", type: "select", description: "One tool, or blank for all tools." },
    { name: "Tool Execution Timeout (seconds)", type: "int", description: "Per-component override; 0 uses the global setting." },
  ],
  returns: "A Toolset for an Agent.",
  notes: [
    "Register servers first; since 1.9 MCP Tools isn't a draggable palette component.",
    "`uvx` ships with Langflow; `npx` servers need Node.js (install it in Docker images).",
    "Header values can reference global variables; incoming `x-api-key` can be propagated to nested servers.",
    "`LANGFLOW_MCP_SERVER_ENV_ALLOWLIST` restricts which environment variables stdio configs may set.",
  ],
  useCases: ["Fetching web pages with mcp-server-fetch", "Querying Astra DB through its MCP server"],
  code: lines("Command: uvx", "Arguments: mcp-server-fetch", "Then: Tool Mode on → connect Toolset to Agent.Tools"),
  language: "text",
  related: ["Agent", "/api/v1/mcp/project/{project_id}/streamable", "Tool Mode"],
});

add("Webhook", "Co", "s", {
  page: "webhook",
  description: "Start a flow from an external HTTP POST. Outputs the received payload as JSON.",
  signature: "Webhook(endpoint, curl) → Data (JSON)",
  parameters: [{ name: "Endpoint", type: "read-only", description: "The /api/v1/webhook/{flow_id} URL to call." }],
  returns: "The payload as JSON; non-JSON bodies are wrapped in { payload }.",
  notes: ["Usually followed by Parser.", "Responses only confirm the run started."],
  useCases: ["Composio or SaaS event triggers", "Alert-driven automations"],
  code: "Webhook ──JSON──▶ Parser ──Message──▶ Agent",
  language: "text",
  related: ["POST /api/v1/webhook/{flow_id}", "Parser"],
});

add("Knowledge Base", "Co", "s", {
  page: "knowledge-base",
  description: "Ingest data into a local knowledge base with embeddings, or retrieve from it by semantic similarity and metadata filters.",
  signature: "Knowledge Base(mode: Ingest|Retrieve, knowledge_base, ...)",
  parameters: [
    { name: "column_config (Ingest)", type: "table", description: "Mark columns to Vectorize and an Identifier column." },
    { name: "metadata_json (Ingest)", type: "JSON", description: "Metadata applied to every chunk." },
    { name: "search_query / top_k (Retrieve)", type: "string / int", description: "Query and result count (default 5)." },
    { name: "metadata_filter (Retrieve)", type: "JSON", description: "e.g. {\"tag\": [\"invoice\", \"audit\"]}." },
  ],
  returns: "Retrieve mode returns a Table of matching chunks.",
  notes: ["The embedding model is chosen when the knowledge base is created.", "`allow_duplicates` is off by default."],
  useCases: ["Local RAG without an external vector DB", "Filtering documents by tag and year"],
  code: "Split Text ──▶ Knowledge Base (Ingest)\nChat Input ──▶ Knowledge Base (Retrieve) ──▶ Parser ──▶ Prompt",
  language: "text",
  related: ["Split Text", "Embedding Model"],
});

add("Guardrails", "Co", "s", {
  page: "guardrails",
  description: "Validate input text with an LLM against security guardrails (PII, secrets, jailbreak, offensive or malicious content) and custom rules.",
  signature: "Guardrails(model: LanguageModel, enabled_guardrails[], input_text, enable_custom_guardrail, custom_guardrail_explanation, heuristic_threshold)",
  parameters: [
    { name: "enabled_guardrails", type: "multiselect", description: "PII, Tokens/Passwords, Jailbreak, Offensive Content, Malicious Code..." },
    { name: "heuristic_threshold", type: "0.0–1.0", description: "Score threshold for heuristic jailbreak detection." },
  ],
  returns: "Pass and fail branches for the checked input.",
  notes: ["Place it before the agent or model.", "Custom guardrails are described in plain language."],
  useCases: ["Blocking prompt injection", "Stopping PII from reaching a model"],
  code: "Chat Input ──▶ Guardrails ──pass──▶ Agent",
  language: "text",
  related: ["Agent", "Language Model"],
});

add("Batch Run", "Co", "s", {
  page: "batch-run",
  description: "Run a language model over every row of a Table and add the responses as a new column.",
  signature: "Batch Run(model, system_message, df: Table, column_name, output_column_name=\"model_response\", enable_metadata) → Table",
  parameters: [
    { name: "column_name", type: "string", description: "Column to send; empty sends all columns as TOML." },
    { name: "output_column_name", type: "string", description: "Default model_response." },
  ],
  returns: "The input Table plus the response column.",
  notes: ["Requires a LanguageModel input.", "Good alternative to Loop for one-call-per-row jobs."],
  useCases: ["Classifying a CSV of tickets", "Bulk summarisation"],
  code: "Read File (CSV) ──Table──▶ Batch Run ◀── Language Model",
  language: "text",
  related: ["Loop", "Table"],
});

add("Human Input", "Co", "s", {
  page: "human-input",
  description: "Pause a flow at a checkpoint and wait for a human decision; each User Action becomes an output branch. Completed steps aren't re-run on resume.",
  signature: "Human Input(prompt, decisions[], timeout?, enable_fallback?) → one output per decision (+ Fallback)",
  parameters: [
    { name: "prompt (Form Content)", type: "string", description: "Content shown for review." },
    { name: "decisions (User Actions)", type: "string[]", description: "e.g. Approve, Reject." },
    { name: "timeout / enable_fallback", type: "duration / bool", description: "Take the Fallback branch if nobody answers." },
  ],
  returns: "Continues on the chosen branch; jobs show status suspended while waiting.",
  notes: ["Agents can instead mark individual tools as requiring approval.", "Decisions are recorded as spans in traces."],
  useCases: ["Approving a Git commit drafted by an agent", "Reviewing outbound emails"],
  code: "Agent (draft) ──▶ Human Input [Approve | Reject]\n  Approve ──▶ Commit tool\n  Reject  ──▶ Revise",
  language: "text",
  related: ["Agent", "GET /api/v2/workflows"],
});

add("langflow-chat", "Co", "s", {
  page: "concepts-publish",
  description: "Embeddable chat widget web component. Paste the generated snippet into a site to chat with a flow.",
  signature: "<langflow-chat host_url=\"https://...\" flow_id=\"...\" api_key=\"...\"></langflow-chat>",
  parameters: [
    { name: "host_url", type: "string", description: "Langflow server URL; must be HTTPS, no trailing slash." },
    { name: "flow_id", type: "string", description: "Flow to embed." },
    { name: "api_key", type: "string", description: "Recommended so the widget can run the flow." },
  ],
  returns: "A responsive chat UI bound to the flow.",
  notes: ["Get it from Share > Embed into site.", "The flow needs Chat Input and Chat Output.", "Angular needs `CUSTOM_ELEMENTS_SCHEMA`; React needs a JSX declaration."],
  useCases: ["Website support bots", "Internal tool chat panels"],
  code: lines(
    "<script src=\"https://cdn.jsdelivr.net/gh/langflow-ai/langflow-embedded-chat@v1.0.7/dist/build/static/js/bundle.min.js\"></script>",
    "<langflow-chat",
    "  host_url=\"https://langflow.example.com\"",
    "  flow_id=\"dcbed533-859f-4b99-b1f5-16fce884f28f\"",
    "  api_key=\"YOUR_LANGFLOW_API_KEY\">",
    "</langflow-chat>",
  ),
  language: "html",
  related: ["Chat Input", "POST /api/v1/run/{flow_id}"],
});

/* ───────────────────────── Python & TypeScript API ───────────────────────── */

add("Component", "C", "s", {
  page: "components-custom-components",
  packageName: "lfx.custom",
  description: "Base class for custom Python components. Subclass it, declare inputs and outputs, and implement the output methods.",
  signature: "class MyComponent(Component):\n    display_name: str; description: str; icon: str; name: str\n    inputs = [...]; outputs = [Output(name, display_name, method)]",
  parameters: [
    { name: "display_name / description / icon", type: "str", description: "Shown in the editor; icon is a Lucide icon name." },
    { name: "inputs", type: "list", description: "Instances from lfx.io such as StrInput, MessageTextInput, DropdownInput." },
    { name: "outputs", type: "list[Output]", description: "Each bound to a method by name." },
    { name: "self.status / self.ctx", type: "attributes", description: "Status text in the UI; a dict shared between methods." },
  ],
  returns: "Output methods return Message, JSON (Data), Table (DataFrame) or primitives.",
  notes: [
    "Import from `lfx` since 1.7; `langflow.custom` still works.",
    "Place files in a category folder with `__init__.py` under `LANGFLOW_COMPONENTS_PATH`; max depth 2.",
    "Hooks: `_pre_run_setup()` and overriding `_run`.",
    "Since 1.12.4, input names must not clash with method names such as `run`, `index` or `log`.",
  ],
  useCases: ["Wrapping an internal API", "Custom data processing", "Reusable tools for agents"],
  code: lines(
    "from lfx.custom import Component",
    "from lfx.io import MessageTextInput, Output",
    "from lfx.schema import Data",
    "",
    "class WordCounter(Component):",
    "    display_name = \"Word Counter\"",
    "    description = \"Counts words in a text.\"",
    "    icon = \"hash\"",
    "    inputs = [MessageTextInput(name=\"text\", display_name=\"Text\")]",
    "    outputs = [Output(name=\"count\", display_name=\"Count\", method=\"count_words\")]",
    "",
    "    def count_words(self) -> Data:",
    "        words = len(self.text.split())",
    "        self.status = f\"{words} words\"",
    "        return Data(data={\"words\": words})",
  ),
  language: "python",
  related: ["Output", "update_build_config", "LANGFLOW_COMPONENTS_PATH", "Tool Mode"],
});

add("Output", "C", "s", {
  page: "components-custom-components",
  packageName: "lfx.io",
  description: "Declares an output port on a custom component and the method that produces it.",
  signature: "Output(name: str, display_name: str, method: str, group_outputs: bool = False, ...)",
  parameters: [
    { name: "method", type: "str", description: "Name of the component method to call." },
    { name: "group_outputs", type: "bool", description: "False: one port with a selector; True: every output is its own port." },
  ],
  returns: "A port whose type comes from the method's return annotation.",
  notes: ["Annotate methods (`-> Message`, `-> Data`, `-> DataFrame`) for colour-coding and connection validation.", "Use group_outputs=True for branch-like components (True/False)."],
  useCases: ["Components with debug and result outputs", "Router components with several branches"],
  code: lines(
    "outputs = [",
    "    Output(name=\"true_result\", display_name=\"True\", method=\"true_response\", group_outputs=True),",
    "    Output(name=\"false_result\", display_name=\"False\", method=\"false_response\", group_outputs=True),",
    "]",
  ),
  language: "python",
  related: ["Component", "Message"],
});

add("update_build_config", "F", "s", {
  page: "components-custom-components",
  packageName: "lfx.custom",
  description: "Hook called when a field with real_time_refresh=True changes; adjust other fields' visibility or options in the editor.",
  signature: "def update_build_config(self, build_config: dict, field_value: Any, field_name: str | None = None) -> dict",
  parameters: [
    { name: "build_config", type: "dict", description: "Current field configuration." },
    { name: "field_value / field_name", type: "Any / str", description: "The changed field and its value." },
  ],
  returns: "The updated build_config.",
  notes: ["Mark dependent inputs `dynamic=True` and `show=False` initially.", "Keep it fast — it runs on every change."],
  useCases: ["Showing a regex field only when operator is regex", "Loading model options for a chosen provider"],
  code: lines(
    "def update_build_config(self, build_config, field_value, field_name=None):",
    "    if field_name == \"operator\":",
    "        build_config[\"regex_pattern\"][\"show\"] = field_value == \"regex\"",
    "    return build_config",
  ),
  language: "python",
  related: ["Component"],
});

add("Message", "C", "s", {
  page: "data-types",
  packageName: "lfx.schema",
  description: "Chat message data type: extends JSON with text, sender, session_id, files and content blocks.",
  signature: "Message(text: str, sender: str, sender_name: str, session_id: str, files: list, content_blocks: list, category: str, ...)",
  parameters: [
    { name: "text", type: "str", description: "Main content." },
    { name: "sender / sender_name", type: "str", description: "User or Language Model and a display name." },
    { name: "session_id / flow_id", type: "str", description: "Equal when no custom session ID is used." },
    { name: "category", type: "message|error|warning|info", description: "Message kind." },
  ],
  returns: "Serialised as JSON in API responses.",
  notes: ["Most chat components accept any Message-compatible input.", "Errors from the LLM appear in `content_blocks`."],
  useCases: ["Returning chat output from custom components", "Reading history"],
  code: "from lfx.schema import Message\n\nreply = Message(text=\"Hello! from typed method!\", sender=\"System\")",
  language: "python",
  related: ["JSON", "Table", "Chat Output"],
});

add("JSON", "C", "s", {
  page: "data-types",
  packageName: "lfx.schema",
  description: "Structured data type (named Data before Langflow 1.9): a .data dict plus a text_key naming the primary text field.",
  signature: "Data(data: dict, text_key: str = \"text\", default_value: str = \"\")",
  parameters: [
    { name: "data", type: "dict", description: "Key-value payload." },
    { name: "text_key", type: "str", description: "Which key holds the main text; default \"text\"." },
    { name: "default_value", type: "str", description: "Fallback if text_key is missing." },
  ],
  returns: "A validated object, serialisable to JSON.",
  notes: ["Old flows using Data load unchanged.", "Connects only to JSON (Data) inputs."],
  useCases: ["Passing API payloads between components", "Structured agent output"],
  code: "from lfx.schema import Data\n\nprofile = Data(text_key=\"text\", data={\"text\": \"Hello world\", \"name\": \"Charlie\", \"age\": 28})",
  language: "python",
  related: ["Table", "Message", "Parser"],
});

add("Table", "C", "s", {
  page: "data-types",
  packageName: "lfx.schema",
  description: "Tabular data type (named DataFrame before 1.9): a pandas DataFrame subclass with Langflow helpers.",
  signature: "DataFrame(data: list[Data] | list[dict] | pd.DataFrame)",
  parameters: [{ name: "data", type: "rows", description: "Lists of JSON objects, dicts or a DataFrame." }],
  returns: "A DataFrame with to_data_list(), add_row(), add_rows(), to_lc_documents(), to_data() and to_message().",
  notes: ["Full pandas API.", "Keeps text_key/default_value for JSON compatibility."],
  useCases: ["Search results", "CSV processing", "Batch LLM jobs"],
  code: "from lfx.schema import DataFrame\nimport pandas as pd\n\ntable = DataFrame(pd.DataFrame({\"A\": [1, 2], \"B\": [3, 4]}))",
  language: "python",
  related: ["JSON", "Batch Run", "Loop"],
});

add("LangflowClient", "C", "s", {
  page: "typescript-client",
  packageName: "@datastax/langflow-client",
  description: "Official TypeScript client for the Langflow API: run or stream flows, pass tweaks and session IDs, and stream logs.",
  signature: "new LangflowClient({ baseUrl, apiKey? })\nclient.flow(flowId).run(input, { session_id?, tweaks? }) · .stream(...) · client.logs.stream()",
  parameters: [
    { name: "baseUrl", type: "string", description: "e.g. http://localhost:7860." },
    { name: "apiKey", type: "string", description: "Langflow API key." },
  ],
  returns: "FlowResponse { sessionId, outputs, chatOutputText() }, or a ReadableStream of events for stream().",
  notes: ["Install with `npm install @datastax/langflow-client`.", "`chatOutputText()` returns just the Chat Output text.", "Log streaming needs `LANGFLOW_ENABLE_LOG_RETRIEVAL=True`."],
  useCases: ["Node.js backends", "Next.js route handlers calling flows"],
  code: lines(
    "import { LangflowClient } from \"@datastax/langflow-client\";",
    "",
    "const client = new LangflowClient({ baseUrl: \"http://localhost:7860\", apiKey: process.env.LANGFLOW_API_KEY });",
    "const response = await client.flow(\"aa5a238b-02c0-4f03-bc5c-cc3a83335cdf\").run(\"Is anyone there?\", {",
    "  session_id: \"test-session\",",
    "  tweaks: { model_name: \"gpt-4o-mini\" },",
    "});",
    "console.log(response.chatOutputText());",
    "",
    "for await (const event of await client.flow(\"aa5a238b-02c0-4f03-bc5c-cc3a83335cdf\").stream(\"Hi\")) console.log(event);",
  ),
  language: "typescript",
  related: ["POST /api/v1/run/{flow_id}", "GET /logs-stream"],
});

/* ───────────────────────── Configuration ───────────────────────── */

const envDetail = (name: string, page: string, summary: string, type: string, def: string, notes: string[], useCases: string[], code: string, related: string[]) =>
  add(name, "K", "s", { page, description: summary, signature: `${name}=${def}`, parameters: [{ name, type, description: `Default: ${def}.` }], returns: "Read at server start; CLI options override it.", notes, useCases, code, language: "bash", related });

envDetail("LANGFLOW_AUTO_LOGIN", "api-keys-and-authentication",
  "Whether the visual editor signs everyone in automatically as the superuser (single-user mode) or requires login.",
  "Boolean", "True (official Docker images set false)",
  [
    "With False, users sign in, CLI admin commands need superuser auth, and `LANGFLOW_SUPERUSER_PASSWORD` must be set.",
    "Even with True, API requests need a key unless `LANGFLOW_SKIP_AUTH_AUTO_LOGIN=true` (to be removed).",
    "Self-registration is always disabled with auto-login.",
    "Use False for any shared or production deployment.",
  ],
  ["Local single-user development (True)", "Multi-user servers (False)"],
  "LANGFLOW_AUTO_LOGIN=False\nLANGFLOW_SUPERUSER=admin\nLANGFLOW_SUPERUSER_PASSWORD=a-long-random-password",
  ["LANGFLOW_SUPERUSER", "LANGFLOW_SECRET_KEY", "POST /api/v1/users/"]);

envDetail("LANGFLOW_SUPERUSER", "api-keys-and-authentication",
  "Username (with LANGFLOW_SUPERUSER_PASSWORD) of the server's superuser.",
  "String", "langflow",
  [
    "`LANGFLOW_SUPERUSER_PASSWORD` is required when auto-login is off, and can't be the legacy value `langflow`.",
    "With auto-login on and no password, Langflow generates an unknown bootstrap password.",
    "Startup fails closed instead of creating a default password.",
  ],
  ["Bootstrapping the admin account in Docker or Kubernetes"],
  "LANGFLOW_SUPERUSER=administrator\nLANGFLOW_SUPERUSER_PASSWORD=securepassword",
  ["LANGFLOW_AUTO_LOGIN", "langflow superuser"]);

envDetail("LANGFLOW_SECRET_KEY", "api-keys-and-authentication",
  "Secret used to encrypt stored credentials (Fernet) and to sign JWTs with HS256.",
  "String", "auto-generated",
  [
    "Set it explicitly in production, and identically on every instance behind a load balancer.",
    "Generate one with `python -c \"from secrets import token_urlsafe; print(token_urlsafe(32))\"`.",
    "Rotate with Langflow's migration script so stored credentials are re-encrypted.",
    "JWT options: `LANGFLOW_ALGORITHM` (HS256/RS256/RS512), access token 3600 s, refresh token 604800 s.",
  ],
  ["Kubernetes and multi-instance deployments", "Credential rotation"],
  "python3 -c \"from secrets import token_urlsafe; print(f'LANGFLOW_SECRET_KEY={token_urlsafe(32)}')\" >> .env",
  ["Global variables", "LANGFLOW_AUTO_LOGIN"]);

envDetail("LANGFLOW_DATABASE_URL", "configuration-custom-database",
  "Database connection URL. Replace the default SQLite database with PostgreSQL for production and multi-instance deployments.",
  "String", "SQLite in the config directory",
  [
    "SQLite URLs need an absolute path: `sqlite:////absolute/path/to/langflow.db`.",
    "PostgreSQL supports SSL options such as `sslmode=verify-ca` in the URL.",
    "`LANGFLOW_DATABASE_CONNECTION_RETRY` retries lost connections.",
    "Several Langflow instances can share one PostgreSQL database.",
  ],
  ["Production deployments", "Docker Compose with a postgres service"],
  "LANGFLOW_DATABASE_URL=postgresql://langflow:langflow@postgres:5432/langflow",
  ["langflow migration", "LANGFLOW_CONFIG_DIR", "docker run langflowai/langflow"]);

envDetail("LANGFLOW_API_KEY_SOURCE", "api-keys-and-authentication",
  "Where API keys are validated: db (keys stored in Langflow) or env (a single key in LANGFLOW_API_KEY).",
  "db | env", "db",
  [
    "`env` grants superuser privileges to the one shared key; designed for single-tenant or automated deployments.",
    "Rotate an env key by changing the variable and restarting.",
    "Works well with LFX and Kubernetes Secrets.",
  ],
  ["Stateless Kubernetes deployments", "CI/CD pipelines"],
  "LANGFLOW_API_KEY_SOURCE=env\nLANGFLOW_API_KEY=your-secure-api-key",
  ["POST /api/v1/api_key/", "lfx serve"]);

envDetail("LANGFLOW_COMPONENTS_PATH", "components-custom-components",
  "Directory of custom components, organised in category folders with __init__.py files.",
  "String (path)", "not set",
  [
    "Components can be at most two levels deep (`category/component.py`).",
    "The category folder name decides where components appear in the menu.",
    "`LANGFLOW_ALLOW_CUSTOM_COMPONENTS=false` blocks custom components entirely.",
  ],
  ["Shipping company-specific components", "Docker images with bundled components"],
  "LANGFLOW_COMPONENTS_PATH=/app/custom_components\n# /app/custom_components/data/__init__.py\n# /app/custom_components/data/word_counter.py",
  ["Component", "langflow run"]);

envDetail("LANGFLOW_WORKERS", "environment-variables",
  "Number of server worker processes. Multiple workers need a shared job queue.",
  "Integer", "1",
  [
    "Set `LANGFLOW_JOB_QUEUE_TYPE=redis` for more than one worker.",
    "`LANGFLOW_WORKER_TIMEOUT` defaults to 300 seconds.",
    "Running several workers without a shared queue requires `LANGFLOW_DANGEROUSLY_ALLOW_MULTI_WORKER_WITHOUT_SHARED_QUEUE` and breaks the UI and MCP over SSE.",
  ],
  ["Scaling a headless API server"],
  "LANGFLOW_WORKERS=4\nLANGFLOW_JOB_QUEUE_TYPE=redis",
  ["langflow run", "LANGFLOW_CACHE_TYPE"]);

envDetail("LANGFLOW_CONFIG_DIR", "logging",
  "Directory where Langflow stores files, logs, monitor data and secret keys (and the database if LANGFLOW_SAVE_DB_IN_CONFIG_DIR=True).",
  "String (path)", "varies by installation",
  [
    "Mount it as a volume in containers so data survives restarts.",
    "Logs go to `LANGFLOW_LOG_FILE` when set.",
  ],
  ["Persistent Docker volumes", "Separating environments on one host"],
  "LANGFLOW_CONFIG_DIR=/app/langflow\nLANGFLOW_SAVE_DB_IN_CONFIG_DIR=True",
  ["LANGFLOW_DATABASE_URL"]);

envDetail("LANGFLOW_TWEAKS_POLICY", "deployment-tweaks-policy",
  "Limits which component fields API callers may change through tweaks.",
  "permissive | declared | off", "permissive",
  [
    "`permissive`: almost any field (code and privileged fields stay blocked).",
    "`declared`: only fields marked API on the flow; a flow with none behaves as permissive.",
    "`off`: no tweaks; `input_value` and `session_id` still work.",
    "Refusals return 422 with `code: TWEAKS_REFUSED` and the list of `fields`.",
  ],
  ["Production APIs exposed to untrusted callers", "Run-only serving"],
  "LANGFLOW_TWEAKS_POLICY=declared",
  ["Tweaks", "POST /api/v1/run/{flow_id}"]);

envDetail("LANGFLOW_WEBHOOK_AUTH_ENABLE", "webhook",
  "Whether webhook endpoints require an API key and check that the caller owns the flow.",
  "Boolean", "True",
  ["With False, requests are treated as sent by the flow owner — use only in trusted networks.", "Pass the key as an `x-api-key` header or query parameter."],
  ["Locking down public webhook URLs"],
  "LANGFLOW_WEBHOOK_AUTH_ENABLE=True",
  ["POST /api/v1/webhook/{flow_id}", "Webhook"]);

envDetail("LANGFLOW_VARIABLES_TO_GET_FROM_ENVIRONMENT", "configuration-global-variables",
  "Extra environment variable names to import as global variables at startup.",
  "comma list | JSON list", "not set",
  ["Lists only names; values come from the environment.", "Known provider keys like OPENAI_API_KEY are imported automatically."],
  ["Injecting secrets from a secret manager"],
  "LANGFLOW_VARIABLES_TO_GET_FROM_ENVIRONMENT=WATSONX_PROJECT_ID,WATSONX_API_KEY",
  ["Global variables"]);

envDetail("LANGFLOW_CACHE_TYPE", "memory",
  "Backend for Langflow's internal cache: async, redis or memory.",
  "String", "async",
  ["With redis, set `LANGFLOW_REDIS_HOST`, `_PORT` (6379), `_DB`, `_PASSWORD` and `_CACHE_EXPIRE` (3600).", "`LANGFLOW_LANGCHAIN_CACHE` picks InMemoryCache or SQLiteCache for LangChain."],
  ["Sharing cache across workers"],
  "LANGFLOW_CACHE_TYPE=redis\nLANGFLOW_REDIS_HOST=redis\nLANGFLOW_REDIS_PORT=6379",
  ["LANGFLOW_WORKERS"]);

envDetail("LANGFLOW_LOAD_FLOWS_PATH", "environment-variables",
  "Directory of flow JSON files loaded on startup, typically baked into a Docker image.",
  "String (path)", "not set",
  ["Requires `LANGFLOW_AUTO_LOGIN=True`.", "`LANGFLOW_LOAD_FLOWS_OVERWRITE_ON_NAME_MATCH` (False) controls same-name, different-id flows.", "Variable bindings from the editor are preserved on reload by default."],
  ["Immutable images with prepackaged flows"],
  "LANGFLOW_LOAD_FLOWS_PATH=/app/flows\nLANGFLOW_AUTO_LOGIN=True",
  ["docker run langflowai/langflow", "Flow"]);

add("X-LANGFLOW-GLOBAL-VAR-*", "K", "s", {
  page: "api-flows-run",
  description: "Request headers that pass global variables to a single run. Names are upper-cased and take precedence over OS environment variables.",
  signature: "X-LANGFLOW-GLOBAL-VAR-{VARIABLE_NAME}: <value>",
  parameters: [{ name: "VARIABLE_NAME", type: "header suffix", description: "X-LANGFLOW-GLOBAL-VAR-api-key becomes API_KEY in the flow." }],
  returns: "Variables available only during that request; nothing is persisted.",
  notes: [
    "The variables don't need to exist in Langflow first.",
    "Supported on `/v1/run` and `/v1/responses`; the v2 Workflow API prefers the `globals` body field.",
    "Missing variables fail the run unless `LANGFLOW_FALLBACK_TO_ENV_VAR=True`.",
  ],
  useCases: ["Per-tenant API keys", "Passing a user ID into a flow"],
  code: lines(
    "curl -X POST \"$LANGFLOW_SERVER_URL/api/v1/run/$FLOW_ID\" \\",
    "  -H \"Content-Type: application/json\" -H \"x-api-key: $LANGFLOW_API_KEY\" \\",
    "  -H \"X-LANGFLOW-GLOBAL-VAR-USER_ID: user123\" \\",
    "  -d '{\"input_value\": \"Hi\", \"input_type\": \"chat\", \"output_type\": \"chat\"}'",
  ),
  language: "bash",
  related: ["Global variables", "POST /api/v1/run/{flow_id}", "Tweaks"],
});

export const LANGFLOW_DETAILS = DETAILS;

/** Catalog card for the package; the catalog JSON row is generated from this. */
export const LANGFLOW_PACKAGE = {
  id: "langflow",
  name: "Langflow",
  icon: "🧩",
  description: "low-code visual builder for AI agents and workflows, served through a REST API, MCP and A2A servers, and the LFX runtime",
  docs: DOCS,
  accent: "#7528FC",
  topics: ["Flows & components", "Run API & tweaks", "Workflow API (v2)", "Webhooks", "MCP server & client", "Custom Python components", "LFX runtime", "Deployment & authentication"],
};
