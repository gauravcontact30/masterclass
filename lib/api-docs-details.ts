import type { CodeLanguage } from "./code-highlight";
import { LANGFLOW_DETAILS } from "./api-docs-langflow";
import { AGENTIC_DETAILS } from "./api-docs-agentic";

export type ApiDetail = { packageName: string; description: string; signature: string; parameters: { name: string; type: string; description: string }[]; returns: string; notes: string[]; useCases: string[]; code: string; language: CodeLanguage; source: string; related: string[] };

export const API_DETAILS: Record<string, ApiDetail> = {
  "nextjs:usePathname": {
    packageName: "next/navigation",
    description: "Read the current URL pathname in a Client Component and update the UI when navigation changes it.",
    signature: "const pathname = usePathname()",
    parameters: [],
    returns: "The pathname string, excluding the query string and hash. Pages Router compatibility can allow null while its router initializes.",
    notes: ["Import usePathname from next/navigation in a Client Component marked with 'use client'.", "The hook takes no arguments and does not navigate; use Link or useRouter to change routes.", "For /dashboard?tab=activity, the pathname is /dashboard. Read query parameters with useSearchParams.", "Use the pathname to derive active navigation state; it updates after client navigation.", "Rewrites can cause the server and browser pathnames to differ. Isolate pathname-dependent UI and update it after mount when necessary.", "With Cache Components and unresolved dynamic route parameters, the component may need a Suspense boundary."],
    useCases: ["Highlight the current navigation link", "Display a breadcrumb or current location", "React to route changes in a client-side effect"],
    code: "'use client';\nimport Link from 'next/link';\nimport { usePathname } from 'next/navigation';\n\nexport function PathnameExample() {\n  const pathname = usePathname();\n  return <main>\n    <h1>Current location</h1>\n    <p>{pathname ?? 'Router is initializing'}</p>\n    <nav aria-label=\"Example navigation\">\n      <Link href=\"/\" aria-current={pathname === '/' ? 'page' : undefined}>Home</Link>\n      {' | '}\n      <Link href=\"/dashboard/techy\" aria-current={pathname === '/dashboard/techy' ? 'page' : undefined}>Topics</Link>\n    </nav>\n  </main>;\n}",
    language: "typescript",
    source: "https://nextjs.org/docs/app/api-reference/functions/use-pathname",
    related: ["useRouter", "useSearchParams", "useSelectedLayoutSegment"],
  },
  "react:useState": {
    packageName: "react", description: "Add a state value to a component. Calling its setter queues an update and lets React render the next state snapshot.", signature: "const [state, setState] = useState(initialState)",
    parameters: [{ name: "initialState", type: "T | (() => T)", description: "An initial value, or a pure initializer function evaluated during initialization." }], returns: "[T, Dispatch<SetStateAction<T>>] — the state snapshot and a stable setter.",
    notes: ["Use a functional updater when the next value depends on pending state.", "Treat arrays and objects as immutable snapshots.", "Call Hooks at the top level of a component or custom Hook."], useCases: ["Form input values", "Disclosure state", "Local counters"],
    code: "import { useState } from 'react';\n\nexport function Counter() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(n => n + 1)}>{count}</button>;\n}", language: "tsx", source: "https://react.dev/reference/react/useState", related: ["useReducer", "useEffect", "useRef"],
  },
  "react:useEffect": {
    packageName: "react", description: "Synchronize a component with an external system after a commit and release that synchronization through cleanup.", signature: "useEffect(setup, dependencies?)",
    parameters: [{ name: "setup", type: "() => void | (() => void)", description: "Starts the synchronization and optionally returns cleanup." }, { name: "dependencies", type: "readonly unknown[]", description: "All reactive values read by setup. React compares entries with Object.is." }], returns: "undefined", notes: ["Effects run on the client.", "Cleanup runs before changed dependencies are synchronized and on unmount.", "Avoid Effects for values that can be calculated during rendering."], useCases: ["Subscriptions", "Timers", "External widget connections"], code: "import { useEffect, useState } from 'react';\n\nexport function Clock() {\n  const [ticks, setTicks] = useState(0);\n  useEffect(() => {\n    const id = setInterval(() => setTicks(n => n + 1), 1000);\n    return () => clearInterval(id);\n  }, []);\n  return <output>{ticks}</output>;\n}", language: "tsx", source: "https://react.dev/reference/react/useEffect", related: ["useState", "useRef", "useLayoutEffect"],
  },
  "react:useRef": {
    packageName: "react", description: "Keep a mutable reference across renders without triggering rendering when current changes.", signature: "const ref = useRef(initialValue)", parameters: [{ name: "initialValue", type: "T", description: "The initial current value; later initialValue arguments do not replace it." }], returns: "{ current: T } — a stable mutable ref object.", notes: ["Use state for values that determine rendered output.", "DOM refs are assigned when React commits the relevant element."], useCases: ["Focus management", "Timer identifiers"], code: "import { useRef } from 'react';\nexport function Search() {\n  const input = useRef<HTMLInputElement>(null);\n  return <><input ref={input} /><button onClick={() => input.current?.focus()}>Focus</button></>;\n}", language: "tsx", source: "https://react.dev/reference/react/useRef", related: ["useState", "useEffect"],
  },
  "javascript:map": {
    packageName: "JavaScript / Array.prototype", description: "Create an array from the return value of a callback applied to each present element in an array.", signature: "array.map(callbackFn, thisArg?)", parameters: [{ name: "callbackFn", type: "(value, index, array) => U", description: "Computes the output for each present element." }, { name: "thisArg", type: "unknown", description: "Optional this value for an ordinary callback; arrow functions retain lexical this." }], returns: "A new array of callback results; holes in sparse arrays remain holes.", notes: ["map does not mutate the input by itself, but your callback can.", "Use forEach for side effects when you do not need returned values."], useCases: ["Project API records into display models", "Transform numeric arrays"], code: "const records = [{ name: 'Ada' }, { name: 'Lin' }];\nconst names = records.map(record => record.name);\nconsole.log(names); // ['Ada', 'Lin']", language: "javascript", source: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map", related: ["filter", "reduce", "forEach", "flatMap"],
  },
  "javascript:filter": {
    packageName: "JavaScript / Array.prototype", description: "Build a new array containing elements whose predicate evaluates to a truthy result.", signature: "array.filter(callbackFn, thisArg?)", parameters: [{ name: "callbackFn", type: "(value, index, array) => unknown", description: "Predicate evaluated for each present element." }], returns: "A shallow array of retained elements.", notes: ["Object elements retain their original references.", "The original array is not changed by filter itself."], useCases: ["Visible search results", "Selecting eligible records"], code: "const values = [1, 2, 3, 4];\nconsole.log(values.filter(value => value % 2 === 0)); // [2, 4]", language: "javascript", source: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter", related: ["map", "find", "some", "every"],
  },
  "javascript:reduce": {
    packageName: "JavaScript / Array.prototype", description: "Accumulate array elements into a single result by repeatedly applying a reducer callback.", signature: "array.reduce(callbackFn, initialValue?)", parameters: [{ name: "callbackFn", type: "(accumulator, currentValue, index, array) => U", description: "Returns the next accumulator." }, { name: "initialValue", type: "U", description: "Starting accumulator; strongly recommended, especially for potentially empty arrays." }], returns: "The final accumulator. An empty array without initialValue throws.", notes: ["Avoid mutating shared state inside the reducer.", "Prefer a simple loop when it makes the operation clearer."], useCases: ["Totals", "Grouping or indexing records"], code: "const amounts = [10, 20, 5];\nconst total = amounts.reduce((sum, amount) => sum + amount, 0);\nconsole.log(total); // 35", language: "javascript", source: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce", related: ["map", "filter", "Object.groupBy"],
  },
  "angular:HttpClient": {
    packageName: "@angular/common/http", description: "Send HTTP requests through Angular's injectable HTTP client and consume typed response Observables.", signature: "class HttpClient {\n  get<T>(url: string, options?): Observable<T>;\n}\n// Simplified JSON-body overload; official docs list all overloads.", parameters: [{ name: "url", type: "string", description: "The requested resource address." }, { name: "options", type: "HTTP options", description: "Headers, parameters and response observation settings. See the official overloads for exact types." }], returns: "Observable<T> for the illustrated JSON-body overload; other overloads return events or full responses.", notes: ["Configure provideHttpClient in application providers.", "The generic type is an assertion about the response, not runtime JSON validation.", "Each subscription can make a separate request."], useCases: ["Typed application data requests", "Interceptor-based HTTP workflows"], code: "import { Injectable, inject } from '@angular/core';\nimport { HttpClient } from '@angular/common/http';\n\n@Injectable({ providedIn: 'root' })\nexport class Users {\n  private http = inject(HttpClient);\n  list() {\n    return this.http.get<{ id: number; name: string }[]>('/api/users');\n  }\n}", language: "typescript", source: "https://angular.dev/api/common/http/HttpClient", related: ["Injectable", "inject", "Observable"],
  },
  "angular:signal": {
    packageName: "@angular/core", description: "Create a writable reactive value. Reading the signal by calling it lets Angular track that dependency.", signature: "signal<T>(initialValue: T, options?: CreateSignalOptions<T>): WritableSignal<T>", parameters: [{ name: "initialValue", type: "T", description: "The signal's initial value." }, { name: "options", type: "CreateSignalOptions<T>", description: "Optional configuration, including equality behavior." }], returns: "WritableSignal<T> with read, set, update and readonly-view capabilities.", notes: ["Read with signal(), not a value property.", "Use computed for derived state.", "Avoid mutating an object without notifying the signal."], useCases: ["Component state", "Reactive derived views"], code: "import { signal, computed } from '@angular/core';\nconst count = signal(0);\nconst doubled = computed(() => count() * 2);\ncount.update(n => n + 1);\nconsole.log(doubled()); // 2", language: "typescript", source: "https://angular.dev/api/core/signal", related: ["computed", "effect", "input"],
  },
  "python:len": {
    packageName: "Python / builtins", description: "Return the number of items in a supported container or object implementing the length protocol.", signature: "len(s)", parameters: [{ name: "s", type: "Sized", description: "A sequence, collection or object implementing __len__." }], returns: "A nonnegative integer length.", notes: ["A generator does not ordinarily have a known length.", "String length counts code points, which need not correspond to user-perceived characters."], useCases: ["Collection size checks", "Input constraints"], code: "names = ['Ada', 'Lin']\nprint(len(names))  # 2\nprint(len({'ready': True}))  # 1", language: "python", source: "https://docs.python.org/3/library/functions.html#len", related: ["list", "dict", "range"],
  },
  "python:sorted": {
    packageName: "Python / builtins", description: "Return a new sorted list from an iterable, optionally using a key function and reverse ordering.", signature: "sorted(iterable, /, *, key=None, reverse=False)", parameters: [{ name: "iterable", type: "Iterable[T]", description: "Values to sort." }, { name: "key", type: "Callable | None", description: "Computes a comparison key for each item." }, { name: "reverse", type: "bool", description: "Request descending order when true." }], returns: "A new list containing the sorted values.", notes: ["Sorting is stable: equal-key items retain relative order.", "The input is not sorted in place."], useCases: ["Ranking records", "Deterministic presentation order"], code: "people = [{'name': 'Ada', 'score': 8}, {'name': 'Lin', 'score': 9}]\nprint(sorted(people, key=lambda person: person['score'], reverse=True))", language: "python", source: "https://docs.python.org/3/library/functions.html#sorted", related: ["list", "len", "enumerate"],
  },
  "nextjs:useRouter": {
    packageName: "next/navigation", description: "Access App Router navigation methods in a Client Component.", signature: "const router = useRouter()", parameters: [], returns: "An App Router instance with push, replace, refresh, back, forward and prefetch methods.", notes: ["Use next/link for ordinary navigation links.", "Do not pass untrusted URLs directly to push or replace."], useCases: ["Navigation after a completed user action", "Refreshing server-rendered route data"], code: "'use client';\nimport { useRouter } from 'next/navigation';\nexport function BackToTopics() {\n  const router = useRouter();\n  return <button onClick={() => router.push('/dashboard/techy')}>Topics</button>;\n}", language: "tsx", source: "https://nextjs.org/docs/app/api-reference/functions/use-router", related: ["usePathname", "useSearchParams", "Link"],
  },
  "zustand:create": {
    packageName: "zustand", description: "Create a React-bound store hook that exposes selected state and store actions.", signature: "const useStore = create<State>()(stateCreator)", parameters: [{ name: "stateCreator", type: "(set, get, store) => State", description: "Defines initial state and actions, using set for immutable updates." }], returns: "A bound store hook with getState, setState, subscribe and getInitialState APIs.", notes: ["Subscribe to the smallest useful slice.", "set performs a shallow merge by default.", "For server rendering, isolate user-specific state per request."], useCases: ["Shared client UI state", "Application preference state"], code: "import { create } from 'zustand';\ntype Store = { count: number; add: () => void };\nexport const useCounter = create<Store>()(set => ({\n  count: 0,\n  add: () => set(state => ({ count: state.count + 1 })),\n}));", language: "typescript", source: "https://zustand.docs.pmnd.rs/apis/create", related: ["persist", "useShallow", "createStore"],
  },
  "deepagents:create_deep_agent": {
    packageName: "deepagents",
    description: "Build and compile a production-ready deep research or autonomous coding agent graph with sandboxed filesystem execution, subagent delegation, and tool discipline middleware.",
    signature: "def create_deep_agent(\n    model: BaseChatModel | str,\n    tools: list[BaseTool] | None = None,\n    profile: HarnessProfile | None = None,\n    middleware: list[Any] | None = None,\n    checkpointer: BaseCheckpointSaver | None = None,\n    state_schema: type[DeepAgentState] = DeepAgentState,\n) -> CompiledStateGraph",
    parameters: [
      { name: "model", type: "BaseChatModel | str", description: "The core reasoning LLM (or model identifier string) powering the agent's planning and synthesis." },
      { name: "tools", type: "list[BaseTool] | None", description: "Optional list of sandboxed execution tools (read_file, write_file, edit_file, ls, grep)." },
      { name: "profile", type: "HarnessProfile | None", description: "Harness profile defining tool call shims, prompt formatting, token limits, and subagent specs." },
      { name: "middleware", type: "list[Any] | None", description: "List of discipline middlewares (e.g., NemotronToolCallShim, ModelRateLimitRetryMiddleware)." },
      { name: "checkpointer", type: "BaseCheckpointSaver | None", description: "Persistence saver (e.g., MemorySaver, AsyncSqliteSaver) for durable agent threads." },
      { name: "state_schema", type: "type[DeepAgentState]", description: "The typed graph state schema, defaulting to DeepAgentState." }
    ],
    returns: "CompiledStateGraph — a compiled runnable LangGraph capable of streaming, resuming, and executing tools.",
    notes: [
      "Deep Agents encapsulate multi-step research and code synthesis loops in a durable stateful graph.",
      "Subagents can be invoked recursively for isolated deep search without cluttering the root agent's context.",
      "Tool discipline middleware validates arguments, prevents loops, and formats reasoning tokens before tool calls.",
      "Compatible with both closed Frontier models and open-weights models (via Nemotron and NIM shims).",
      "Integrates with LangSmith for comprehensive trace logging and evaluation of deep agent workflows."
    ],
    useCases: [
      "Autonomous multi-file repository refactoring",
      "Deep iterative web research and cross-source synthesis",
      "Sandboxed code execution and test verification loops"
    ],
    code: "from deepagents import create_deep_agent\nfrom deepagents.middleware import ModelRateLimitRetryMiddleware, NemotronToolCallShim\nfrom langchain_openai import ChatOpenAI\nfrom langgraph.checkpoint.memory import MemorySaver\n\n# Initialize the reasoning model and memory checkpointer\nmodel = ChatOpenAI(model=\"gpt-4o\", temperature=0)\ncheckpointer = MemorySaver()\n\n# Build the sandboxed deep agent with discipline middleware\nagent = create_deep_agent(\n    model=model,\n    middleware=[\n        NemotronToolCallShim(),\n        ModelRateLimitRetryMiddleware(max_retries=3, backoff_factor=1.5),\n    ],\n    checkpointer=checkpointer,\n)\n\n# Stream execution with thread-level isolation\nconfig = {\"configurable\": {\"thread_id\": \"session-42\"}}\nfor step in agent.stream(\n    {\"messages\": [(\"user\", \"Audit authentication security and propose fixes.\")]},\n    config=config,\n):\n    print(\"Agent step:\", step)",
    language: "python",
    source: "https://reference.langchain.com/python/deepagents",
    related: ["DeepAgentState", "GeneralPurposeSubagentProfile", "NemotronToolCallShim", "read_file"]
  },
  "deepagents:DeepAgentState": {
    packageName: "deepagents",
    description: "Typed state schema dictionary representing the full execution context of a Deep Agent workflow, including messages, execution plans, scratchpad notes, and subagent outputs.",
    signature: "class DeepAgentState(TypedDict, total=False):\n    messages: list[AnyMessage]\n    plan: list[str]\n    completed_steps: list[str]\n    scratchpad: dict[str, Any]\n    subagent_results: dict[str, Any]\n    errors: list[str]",
    parameters: [
      { name: "messages", type: "list[AnyMessage]", description: "Sequential list of conversation and tool interaction messages." },
      { name: "plan", type: "list[str]", description: "Ordered list of planned steps generated during the initial reasoning phase." },
      { name: "completed_steps", type: "list[str]", description: "Checklist of executed milestones verified by guard middleware." },
      { name: "scratchpad", type: "dict[str, Any]", description: "Episodic key-value working memory for intermediate tool observations." }
    ],
    returns: "DeepAgentState dictionary tracking persistent workflow progress.",
    notes: [
      "Supports immutable state transitions conforming to LangGraph state reduction semantics.",
      "Scratchpad stores partial file contents and tool outputs to keep context window usage bounded.",
      "Used as the default state container in create_deep_agent."
    ],
    useCases: [
      "Tracking long-horizon multi-step task plans",
      "Storing subagent deliverables",
      "Resuming interrupted agent executions"
    ],
    code: "from deepagents import DeepAgentState\n\ninitial_state: DeepAgentState = {\n    \"messages\": [(\"user\", \"Audit authentication security\")],\n    \"plan\": [\n        \"1. Scan routes in auth.py\",\n        \"2. Check session token expiration logic\",\n        \"3. Generate remediation report\",\n    ],\n    \"completed_steps\": [],\n    \"scratchpad\": {},\n    \"subagent_results\": {},\n}\nprint(\"Initialized DeepAgentState with\", len(initial_state[\"plan\"]), \"milestones.\")",
    language: "python",
    source: "https://reference.langchain.com/python/deepagents",
    related: ["create_deep_agent", "GeneralPurposeSubagentProfile", "FinalAnswerGuardMiddleware"]
  },
  "langchain:create_agent": {
    packageName: "langchain",
    description: "High-level factory function to create a standardized reasoning agent from a chat model, tools, and system prompt instructions.",
    signature: "def create_agent(\n    model: BaseChatModel | str,\n    tools: Sequence[BaseTool | Callable],\n    system_prompt: str | SystemMessage | None = None,\n    middleware: list[Any] | None = None,\n    name: str | None = None,\n) -> CompiledStateGraph",
    parameters: [
      { name: "model", type: "BaseChatModel | str", description: "Chat model instance (e.g. ChatOpenAI, ChatAnthropic) or model string parsed by init_chat_model." },
      { name: "tools", type: "Sequence[BaseTool | Callable]", description: "Collection of tools available to the agent for actions and data retrieval." },
      { name: "system_prompt", type: "str | SystemMessage | None", description: "Persona definition, guidelines, and behavioral boundaries." },
      { name: "middleware", type: "list[Any] | None", description: "Optional interceptors for human-in-the-loop approvals and token limit guards." }
    ],
    returns: "CompiledStateGraph ready to invoke or stream with user messages.",
    notes: [
      "Built on top of LangGraph for durable, stateful execution and streaming.",
      "Tools are bound to the model with standard schema definitions and tool call validation.",
      "Supports asynchronous streaming of values, state updates, and token deltas."
    ],
    useCases: [
      "Conversational search assistants",
      "Customer service automation bots",
      "Enterprise question-answering agents"
    ],
    code: "from langchain.agents import create_agent\nfrom langchain_core.tools import tool\nfrom langchain_openai import ChatOpenAI\n\n@tool\ndef fetch_weather(city: str) -> str:\n    \"\"\"Get the current weather forecast for a given city.\"\"\"\n    return f\"The weather in {city} is 22°C and sunny.\"\n\nmodel = ChatOpenAI(model=\"gpt-4o-mini\", temperature=0)\nagent = create_agent(\n    model=model,\n    tools=[fetch_weather],\n    system_prompt=\"You are a helpful assistant with real-time tool access.\",\n)\n\nresponse = agent.invoke({\"messages\": [(\"user\", \"What's the weather in Tokyo?\")]})\nprint(\"Final reply:\", response[\"messages\"][-1].content)",
    language: "python",
    source: "https://reference.langchain.com/python/langchain",
    related: ["AgentState", "init_chat_model", "tool", "AgentExecutor"]
  },
  "langchain:init_chat_model": {
    packageName: "langchain",
    description: "Universal chat model initializer returning a preconfigured BaseChatModel instance across providers using unified kwargs.",
    signature: "def init_chat_model(\n    model: str,\n    model_provider: str | None = None,\n    temperature: float = 0.0,\n    **kwargs: Any,\n) -> BaseChatModel",
    parameters: [
      { name: "model", type: "str", description: "Model identifier string, optionally provider-prefixed (e.g. 'openai:gpt-4o', 'anthropic:claude-3-5-sonnet')." },
      { name: "model_provider", type: "str | None", description: "Explicit provider string if not specified in the model name." },
      { name: "temperature", type: "float", description: "Sampling temperature controlling creativity versus determinism." }
    ],
    returns: "A provider-specific BaseChatModel subclass instance implementing the standard LangChain chat interface.",
    notes: [
      "Eliminates hardcoded provider imports, allowing runtime model switching with zero code changes.",
      "Automatically loads API keys from standard environment variables.",
      "Supports tool calling, structured outputs, and streaming out of the box across all supported backends."
    ],
    useCases: [
      "Dynamic multi-model fallback routines",
      "A/B testing model quality",
      "Config-driven agent backends"
    ],
    code: "from langchain.chat_models import init_chat_model\n\nllm = init_chat_model(\"claude-3-5-sonnet-20241022\", model_provider=\"anthropic\", temperature=0.2)\nai_msg = llm.invoke(\"Summarize the benefits of declarative graph architectures in one sentence.\")\nprint(ai_msg.content)",
    language: "python",
    source: "https://reference.langchain.com/python/langchain",
    related: ["BaseChatModel", "create_agent", "AIMessage"]
  },
  "langchain:tool": {
    packageName: "langchain",
    description: "Decorator to transform any standard Python function into a schema-validated LangChain BaseTool with automatic type inference and docstring parsing.",
    signature: "@tool(name_or_callable=None, parse_docstring=True, return_direct=False, args_schema=None)",
    parameters: [
      { name: "name_or_callable", type: "str | Callable | None", description: "Optional custom tool name overriding the Python function name." },
      { name: "parse_docstring", type: "bool", description: "When True, parses the function docstring into field descriptions for model tool calling." },
      { name: "return_direct", type: "bool", description: "When True, returns the tool output directly to the user without sending it back to the LLM." }
    ],
    returns: "A StructuredTool instance ready to pass to any LangChain agent or chat model.",
    notes: [
      "Uses Python type hints to generate an exact JSON schema for the model's tool calling API.",
      "Supports both sync and async function definitions.",
      "Can accept Pydantic models for complex nested input schemas."
    ],
    useCases: [
      "Calculators and database queries",
      "REST API integration tools",
      "Local filesystem search"
    ],
    code: "from langchain.tools import tool\n\n@tool\ndef calculate_compound_interest(principal: float, rate: float, years: int) -> float:\n    \"\"\"Calculate future compound interest for a monetary investment.\n    \n    Args:\n        principal: Starting amount in dollars.\n        rate: Annual interest rate as a decimal (e.g. 0.05 for 5%).\n        years: Number of years to compound.\n    \"\"\"\n    return round(principal * ((1 + rate) ** years), 2)\n\nprint(\"Tool schema:\", calculate_compound_interest.args)\nprint(\"Result:\", calculate_compound_interest.invoke({\"principal\": 1000, \"rate\": 0.07, \"years\": 10}))",
    language: "python",
    source: "https://reference.langchain.com/python/langchain",
    related: ["BaseTool", "StructuredTool", "create_agent"]
  },
  "langgraph:StateGraph": {
    packageName: "langgraph",
    description: "Primary stateful computation graph in LangGraph where nodes receive and return state dictionaries according to a TypedDict or Pydantic schema with custom channel reducers.",
    signature: "class StateGraph(Generic[StateType]):\n    def __init__(self, state_schema: type[StateType], config_schema: type[Any] | None = None)\n    def add_node(self, node: str, action: Callable) -> Self\n    def add_edge(self, start_key: str, end_key: str) -> Self\n    def add_conditional_edges(self, source: str, path: Callable, path_map: dict | None = None) -> Self\n    def compile(self, checkpointer=None, store=None, interrupt_before=None, interrupt_after=None) -> CompiledStateGraph",
    parameters: [
      { name: "state_schema", type: "type[StateType]", description: "The TypedDict or Pydantic model defining state fields and reducer annotations." },
      { name: "checkpointer", type: "BaseCheckpointSaver | None", description: "Saver instance persisting thread state across steps." },
      { name: "interrupt_before", type: "Sequence[str] | None", description: "Node names before which execution pauses for human-in-the-loop review." }
    ],
    returns: "CompiledStateGraph with invoke, stream, astream, and update_state capabilities.",
    notes: [
      "Channels manage how state updates merge; use Annotated[list, operator.add] for append-only lists.",
      "Cycles are first-class: nodes can link back to earlier nodes for validation and retry loops.",
      "Time-travel debugging lets you inspect or rewind graph state to any historical checkpoint."
    ],
    useCases: [
      "Multi-actor agent debate systems",
      "Self-correcting code generation graphs",
      "Human-approved order processing workflows"
    ],
    code: "from typing import TypedDict, Annotated\nimport operator\nfrom langgraph.graph import StateGraph, START, END\n\nclass AgentState(TypedDict):\n    messages: Annotated[list[str], operator.add]\n    attempts: int\n\ndef researcher(state: AgentState) -> dict:\n    return {\"messages\": [\"Found 3 sources on LangGraph\"], \"attempts\": state.get(\"attempts\", 0) + 1}\n\ndef verifier(state: AgentState) -> dict:\n    return {\"messages\": [\"Verification passed.\"]}\n\nbuilder = StateGraph(AgentState)\nbuilder.add_node(\"research\", researcher)\nbuilder.add_node(\"verify\", verifier)\nbuilder.add_edge(START, \"research\")\nbuilder.add_edge(\"research\", \"verify\")\nbuilder.add_edge(\"verify\", END)\n\ngraph = builder.compile()\noutput = graph.invoke({\"messages\": [\"Start project\"], \"attempts\": 0})\nprint(\"Result messages:\", output[\"messages\"])",
    language: "python",
    source: "https://reference.langchain.com/python/langgraph",
    related: ["CompiledStateGraph", "MemorySaver", "Command", "interrupt"]
  },
  "langgraph:entrypoint": {
    packageName: "langgraph",
    description: "Decorator in LangGraph's Functional API that designates an entrypoint function for durable, long-running agent workflows with automatic checkpointing and state tracking.",
    signature: "@entrypoint(checkpointer=None, store=None)\ndef my_workflow(inputs: InputType, *, previous: OutputType | None = None) -> OutputType",
    parameters: [
      { name: "checkpointer", type: "BaseCheckpointSaver | None", description: "Optional checkpoint saver to record execution history." },
      { name: "store", type: "BaseStore | None", description: "Optional key-value store for cross-thread shared memory." }
    ],
    returns: "An executable entrypoint runnable that can be invoked or streamed.",
    notes: [
      "The Functional API provides a Pythonic alternative to explicit StateGraph builder schemas.",
      "Tasks inside the entrypoint decorated with @task execute with automatic caching and retry.",
      "Supports human-in-the-loop interrupts using the interrupt() function directly inside the flow."
    ],
    useCases: [
      "Linear pipelines with occasional human approvals",
      "Hierarchical sub-workflow delegation",
      "Functional streaming apps"
    ],
    code: "from langgraph.func import entrypoint, task\nfrom langgraph.checkpoint.memory import MemorySaver\n\n@task\ndef fetch_data(query: str) -> str:\n    return f\"Retrieved documents for: {query}\"\n\n@task\ndef synthesize(docs: str) -> str:\n    return f\"Executive summary based on: {docs}\"\n\n@entrypoint(checkpointer=MemorySaver())\ndef research_pipeline(query: str) -> str:\n    raw = fetch_data(query).result()\n    summary = synthesize(raw).result()\n    return summary\n\nconfig = {\"configurable\": {\"thread_id\": \"thread-1\"}}\nprint(research_pipeline.invoke(\"Agentic AI Architecture 2026\", config=config))",
    language: "python",
    source: "https://reference.langchain.com/python/langgraph",
    related: ["task", "StateGraph", "interrupt", "MemorySaver"]
  },
  "langgraph:interrupt": {
    packageName: "langgraph",
    description: "Pause graph execution at a specific step to surface data to a human reviewer, and resume with the human's response.",
    signature: "def interrupt(value: Any) -> Any",
    parameters: [
      { name: "value", type: "Any", description: "Data surfaced to the human reviewer (e.g. proposed action, question, confirmation prompt)." }
    ],
    returns: "The input provided by the human when the graph is resumed via Command(resume=...).",
    notes: [
      "Requires a checkpointer on the compiled graph so the paused state is stored durably.",
      "Execution resumes right after the interrupt() call with the passed resume value.",
      "Safe for multi-tenant web apps: the web request can finish and the human can reply minutes or days later."
    ],
    useCases: [
      "Sensitive financial transaction approval",
      "Human editing of generated email drafts",
      "Ambiguity resolution prompts"
    ],
    code: "from langgraph.types import interrupt, Command\nfrom langgraph.graph import StateGraph, START, END\nfrom langgraph.checkpoint.memory import MemorySaver\nfrom typing import TypedDict\n\nclass State(TypedDict):\n    query: str\n    approved: bool\n\ndef review_step(state: State) -> dict:\n    decision = interrupt(f\"Do you approve executing query: {state['query']}?\")\n    return {\"approved\": decision == \"YES\"}\n\nbuilder = StateGraph(State)\nbuilder.add_node(\"review\", review_step)\nbuilder.add_edge(START, \"review\")\nbuilder.add_edge(\"review\", END)\ngraph = builder.compile(checkpointer=MemorySaver())\n\n# 1. Run until paused by interrupt\nconfig = {\"configurable\": {\"thread_id\": \"tx-101\"}}\ngraph.invoke({\"query\": \"DROP TABLE test;\", \"approved\": False}, config=config)\n\n# 2. Resume with user decision\nfinal = graph.invoke(Command(resume=\"NO\"), config=config)\nprint(\"Approved status:\", final[\"approved\"])",
    language: "python",
    source: "https://reference.langchain.com/python/langgraph",
    related: ["StateGraph", "Command", "MemorySaver"]
  },
  "integrations:ChatOpenAI": {
    packageName: "langchain-openai",
    description: "Enterprise integration class connecting LangChain and LangGraph to OpenAI models including GPT-4o, o1, o3, and custom fine-tuned deployments with tool calling, vision, and streaming.",
    signature: "class ChatOpenAI(BaseChatModel):\n    model: str = \"gpt-4o\"\n    temperature: float = 0.7\n    api_key: SecretStr | None = None\n    max_tokens: int | None = None\n    streaming: bool = True",
    parameters: [
      { name: "model", type: "str", description: "Target model name (e.g. 'gpt-4o', 'gpt-4o-mini', 'o1', 'o3-mini')." },
      { name: "temperature", type: "float", description: "Sampling temperature between 0 and 2." },
      { name: "api_key", type: "SecretStr | None", description: "OpenAI API key; reads from OPENAI_API_KEY environment variable by default." }
    ],
    returns: "ChatOpenAI model client instance with invoke, stream, bind_tools, and with_structured_output.",
    notes: [
      "Supports parallel tool calling with strict JSON schema validation via with_structured_output.",
      "Natively streams both message tokens and partial tool argument chunks.",
      "Compatible with custom OpenAI-compatible proxy endpoints via base_url parameter."
    ],
    useCases: [
      "Production chatbot backends",
      "Multi-modal vision analysis",
      "Structured JSON data extraction"
    ],
    code: "from langchain_openai import ChatOpenAI\nfrom pydantic import BaseModel, Field\n\nclass ExtractedContact(BaseModel):\n    name: str = Field(description=\"Full name of person\")\n    email: str = Field(description=\"Email address\")\n\nllm = ChatOpenAI(model=\"gpt-4o-mini\", temperature=0)\nstructured_llm = llm.with_structured_output(ExtractedContact)\ncontact = structured_llm.invoke(\"Reach out to Dr. Jane Doe at jane.doe@university.edu for the keynote.\")\nprint(\"Extracted contact:\", contact.name, contact.email)",
    language: "python",
    source: "https://reference.langchain.com/python/integrations/overview",
    related: ["OpenAIEmbeddings", "ChatAnthropic", "ChatGoogleGenerativeAI"]
  },
  "integrations:MultiServerMCPClient": {
    packageName: "langchain-mcp-adapters",
    description: "Model Context Protocol (MCP) client managing connections to multiple local and remote MCP tool servers and exposing their tools directly to LangChain agents.",
    signature: "class MultiServerMCPClient:\n    def __init__(self, connections: dict[str, ConnectionConfig])\n    async def initialize(self) -> None\n    async def get_tools(self) -> list[BaseTool]\n    async def close(self) -> None",
    parameters: [
      { name: "connections", type: "dict[str, ConnectionConfig]", description: "Dictionary mapping server identifiers to connection configs (stdio, sse, or websocket)." }
    ],
    returns: "MultiServerMCPClient instance capable of discovering and executing tools across all registered servers.",
    notes: [
      "Standardizes external tool discovery and execution via the open Model Context Protocol.",
      "Transforms MCP schemas into native LangChain BaseTool instances seamlessly.",
      "Supports stdio subprocess transport as well as remote SSE (Server-Sent Events) transports."
    ],
    useCases: [
      "Connecting coding agents to IDE and git MCP servers",
      "Orchestrating multi-service database tools",
      "Standardized cross-agent tool registries"
    ],
    code: "import asyncio\nfrom langchain_mcp_adapters.client import MultiServerMCPClient\nfrom langchain.agents import create_agent\nfrom langchain_openai import ChatOpenAI\n\nasync def run_mcp_agent():\n    client = MultiServerMCPClient({\n        \"filesystem\": {\"command\": \"npx\", \"args\": [\"-y\", \"@modelcontextprotocol/server-filesystem\", \"./data\"]},\n    })\n    await client.initialize()\n    tools = await client.get_tools()\n    \n    agent = create_agent(model=ChatOpenAI(model=\"gpt-4o\"), tools=tools)\n    result = await agent.ainvoke({\"messages\": [(\"user\", \"List files in data folder\")]})\n    print(\"Agent result:\", result[\"messages\"][-1].content)\n    await client.close()\n\n# asyncio.run(run_mcp_agent())",
    language: "python",
    source: "https://reference.langchain.com/python/integrations/overview",
    related: ["ChatOpenAI", "ChatAnthropic", "BaseTool"]
  },
  "langsmith:Client": {
    packageName: "langsmith",
    description: "Official SDK client for interacting with the LangSmith observability platform to log runs, create datasets, evaluate outputs, and inspect production traces.",
    signature: "class Client:\n    def __init__(self, api_key: str | None = None, api_url: str | None = None)\n    def create_run(self, name: str, run_type: str, inputs: dict, **kwargs) -> None\n    def update_run(self, run_id: str, outputs: dict | None = None, error: str | None = None) -> None\n    def create_dataset(self, dataset_name: str, description: str | None = None) -> Dataset\n    def create_example(self, inputs: dict, outputs: dict, dataset_id: str) -> Example\n    def read_run(self, run_id: str) -> Run",
    parameters: [
      { name: "api_key", type: "str | None", description: "LangSmith API key (defaults to LANGSMITH_API_KEY environment variable)." },
      { name: "api_url", type: "str | None", description: "LangSmith endpoint URL (defaults to https://api.smith.langchain.com)." }
    ],
    returns: "Configured Client instance with full CRUD operations for runs, datasets, and feedback.",
    notes: [
      "Setting LANGCHAIN_TRACING_V2=true enables automatic tracing for all LangChain and LangGraph calls.",
      "Provides dataset versioning, splitting, and benchmark evaluation tracking.",
      "Tracks token counts, execution latency, and error root causes automatically."
    ],
    useCases: [
      "Production trace debugging and error tracking",
      "Ground-truth benchmark dataset curation",
      "LLM-as-a-judge automated evaluations"
    ],
    code: "from langsmith import Client\n\nclient = Client()\n# Create benchmark evaluation dataset\ndataset = client.create_dataset(\n    dataset_name=\"support-agent-v1\",\n    description=\"Test scenarios for customer service edge cases\",\n)\nclient.create_example(\n    inputs={\"question\": \"Can I cancel my subscription after 30 days?\"},\n    outputs={\"expected\": \"Subscriptions can be cancelled anytime with pro-rated refunds within 30 days.\"},\n    dataset_id=dataset.id,\n)\nprint(\"Created dataset:\", dataset.name, \"with ID:\", dataset.id)",
    language: "python",
    source: "https://reference.langchain.com/python/langsmith",
    related: ["traceable", "evaluate", "wrap_openai", "EvaluationResult"]
  },
  "langsmith:traceable": {
    packageName: "langsmith",
    description: "Decorator to wrap any Python function into a tracked LangSmith execution span capturing inputs, outputs, execution latency, and errors.",
    signature: "@traceable(\n    name: str | None = None,\n    run_type: Literal[\"tool\", \"chain\", \"llm\", \"retriever\", \"prompt\"] = \"chain\",\n    metadata: dict[str, Any] | None = None,\n    tags: list[str] | None = None,\n)",
    parameters: [
      { name: "name", type: "str | None", description: "Display name for the span in the LangSmith UI (defaults to the function name)." },
      { name: "run_type", type: "str", description: "Span categorization: 'chain', 'tool', 'llm', 'retriever', or 'prompt'." },
      { name: "metadata", type: "dict[str, Any] | None", description: "Custom dictionary of telemetry attributes (e.g. user_id, environment)." },
      { name: "tags", type: "list[str] | None", description: "List of searchable strings to group and filter runs." }
    ],
    returns: "Decorated function with automatic background telemetry recording.",
    notes: [
      "Works with ANY Python code — no LangChain or LangGraph dependency required.",
      "Automatically captures nested child function calls inside the parent trace tree.",
      "Safe in production: telemetry errors never crash user application logic."
    ],
    useCases: [
      "Tracing custom proprietary LLM pipelines",
      "Monitoring standalone tool execution times",
      "Capturing prompt templates and output formats"
    ],
    code: "from langsmith import traceable\n\n@traceable(run_type=\"tool\", tags=[\"math\", \"calculation\"])\ndef calculate_vat(subtotal: float, rate: float = 0.20) -> float:\n    return round(subtotal * rate, 2)\n\n@traceable(run_type=\"chain\", name=\"billing-workflow\")\ndef process_invoice(amount: float) -> str:\n    vat = calculate_vat(amount)\n    total = amount + vat\n    return f\"Total invoice amount: ${total} (including ${vat} VAT)\"\n\nprint(process_invoice(150.00))",
    language: "python",
    source: "https://reference.langchain.com/python/langsmith",
    related: ["Client", "wrap_openai", "evaluate", "RunTree"]
  },
  "langsmith:evaluate": {
    packageName: "langsmith",
    description: "High-level offline evaluation runner benchmarking an agent or pipeline against a dataset of examples with automated scoring metrics.",
    signature: "def evaluate(\n    target: Callable[[dict], dict],\n    data: str | Dataset | Iterable[Example],\n    evaluators: Sequence[RunEvaluator | Callable],\n    experiment_prefix: str | None = None,\n    max_concurrency: int | None = None,\n) -> ExperimentResults",
    parameters: [
      { name: "target", type: "Callable[[dict], dict]", description: "The function or agent taking example inputs and producing predictions." },
      { name: "data", type: "str | Dataset | Iterable[Example]", description: "Dataset name, Dataset object, or iterable of test examples." },
      { name: "evaluators", type: "Sequence[RunEvaluator | Callable]", description: "List of evaluation functions or RunEvaluators scoring accuracy, latency, and correctness." },
      { name: "experiment_prefix", type: "str | None", description: "Name prefix for the experiment visible in the LangSmith dashboard." }
    ],
    returns: "ExperimentResults object summarizing metrics, scores, and links to the web UI.",
    notes: [
      "Parallelizes evaluations across examples with configurable max_concurrency.",
      "Provides side-by-side regression testing when comparing new prompts or models.",
      "Integrates with CI/CD pipelines to block deployments on quality regressions."
    ],
    useCases: [
      "Continuous regression testing before deployment",
      "Prompt optimization benchmarking",
      "Model migration quality assurance"
    ],
    code: "from langsmith import evaluate, Client\n\nclient = Client()\n\ndef format_answer(inputs: dict) -> dict:\n    return {\"output\": f\"Answer to: {inputs['question']}\"}\n\ndef exact_match_evaluator(run, example) -> dict:\n    match = run.outputs.get(\"output\") == example.outputs.get(\"expected\")\n    return {\"key\": \"exact_match\", \"score\": 1.0 if match else 0.0}\n\n# evaluate(\n#     format_answer,\n#     data=\"sample-qa-dataset\",\n#     evaluators=[exact_match_evaluator],\n#     experiment_prefix=\"prompt-v2-test\",\n# )",
    language: "python",
    source: "https://reference.langchain.com/python/langsmith",
    related: ["Client", "traceable", "EvaluationResult", "expect"]
  },
  "langchain:Runnable": {
    packageName: "langchain_core.runnables",
    description: "Core interface uniting all LangChain Expression Language (LCEL) components with consistent sync, async, batch, and streaming methods.",
    signature: "class Runnable(Generic[Input, Output], ABC):\n    def invoke(self, input: Input, config: RunnableConfig | None = None) -> Output\n    async def ainvoke(self, input: Input, config: RunnableConfig | None = None) -> Output\n    def stream(self, input: Input, config: RunnableConfig | None = None) -> Iterator[Output]\n    async def astream(self, input: Input, config: RunnableConfig | None = None) -> AsyncIterator[Output]\n    def batch(self, inputs: list[Input], config: RunnableConfig | None = None) -> list[Output]\n    async def abatch(self, inputs: list[Input], config: RunnableConfig | None = None) -> list[Output]",
    parameters: [{"name":"input","type":"Input","description":"The input payload passed to the runnable (e.g. dict, string, or message list)."},{"name":"config","type":"RunnableConfig | None","description":"Optional execution configuration dictionary specifying callbacks, tags, metadata, and recursion limits."}],
    returns: "Output — computed result, batch list, or streaming chunk generator.",
    notes: ["Supports composition using the Unix-style pipe operator (|) to create RunnableSequences.","Every chat model, prompt template, tool, retriever, and output parser implements Runnable.","Provides standardized streaming deltas without modifying downstream consumer code."],
    useCases: ["Composing custom multi-step LLM pipelines","Streaming tokens to web clients","Concurrent batch processing of document queries"],
    code: "from langchain_core.runnables import RunnableLambda\n\n# Define a simple transformation step\nstep1 = RunnableLambda(lambda x: x[\"text\"].strip().lower())\nstep2 = RunnableLambda(lambda text: f\"Processed: {text}\")\n\n# Compose using the pipe operator\nchain = step1 | step2\n\n# Execute with invoke or stream\nresult = chain.invoke({\"text\": \"   Hello LangChain 2026!  \"})\nprint(result)",
    language: "python",
    source: "https://reference.langchain.com/python/langchain",
    related: ["RunnableConfig","RunnableSequence","RunnableParallel","RunnableLambda"],
  },
  "langchain:trim_messages": {
    packageName: "langchain_core.messages",
    description: "Utility function that trims a sequence of chat messages to fit within a maximum token count or message count, preserving conversational context and tool calling invariants.",
    signature: "def trim_messages(\n    messages: Sequence[BaseMessage],\n    max_tokens: int,\n    token_counter: Callable[[Sequence[BaseMessage]], int] | BaseChatModel,\n    strategy: Literal[\"first\", \"last\"] = \"last\",\n    allow_partial: bool = False,\n    end_on: type[BaseMessage] | Sequence[type[BaseMessage]] | None = None,\n    start_on: type[BaseMessage] | Sequence[type[BaseMessage]] | None = None,\n    include_system: bool = True,\n) -> list[BaseMessage]",
    parameters: [{"name":"messages","type":"Sequence[BaseMessage]","description":"The sequence of messages to trim."},{"name":"max_tokens","type":"int","description":"Maximum allowable tokens in the returned slice."},{"name":"token_counter","type":"Callable | BaseChatModel","description":"Model instance or callable computing token length of messages."},{"name":"strategy","type":"str","description":"'last' keeps the most recent messages; 'first' keeps earliest messages."}],
    returns: "list[BaseMessage] — pruned message list adhering to context constraints.",
    notes: ["Preserves tool calling integrity: never splits a tool call AIMessage from its corresponding ToolMessage responses.","The include_system flag ensures the root SystemMessage is never dropped.","Essential for prevention of ContextWindowExceeded errors in long-running agent loops."],
    useCases: ["Long-running agent chat memory compaction","Bounded context preparation before model invocation","Multi-turn customer support bots"],
    code: "from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, trim_messages\nfrom langchain_openai import ChatOpenAI\n\nmessages = [\n    SystemMessage(content=\"You are an expert financial researcher.\"),\n    HumanMessage(content=\"Tell me about interest rates in 2025.\"),\n    AIMessage(content=\"Central banks initiated rate cuts across global markets...\"),\n    HumanMessage(content=\"How about inflation trends in 2026?\"),\n]\n\nmodel = ChatOpenAI(model=\"gpt-4o-mini\")\npruned = trim_messages(\n    messages,\n    max_tokens=60,\n    token_counter=model,\n    strategy=\"last\",\n    include_system=True,\n)\nprint(\"Retained messages:\", len(pruned))",
    language: "python",
    source: "https://reference.langchain.com/python/langchain",
    related: ["filter_messages","merge_message_runs","BaseChatModel","AgentState"],
  },
  "langchain:ChatPromptTemplate": {
    packageName: "langchain_core.prompts",
    description: "Prompt template designed specifically for chat models, composing multi-turn conversation roles (system, human, AI) with runtime variable interpolation.",
    signature: "class ChatPromptTemplate(BasePromptTemplate):\n    @classmethod\n    def from_messages(cls, messages: Sequence[MessageLikeRepresentation]) -> ChatPromptTemplate\n    def format_messages(self, **kwargs: Any) -> list[BaseMessage]",
    parameters: [{"name":"messages","type":"Sequence[MessageLikeRepresentation]","description":"List of role-content tuples, template strings, or BaseMessagePromptTemplate instances."},{"name":"kwargs","type":"Any","description":"Named replacement parameters substituted into template placeholders."}],
    returns: "ChatPromptTemplate instance that produces formatted list[BaseMessage] when invoked.",
    notes: ["Supports ('role', '{placeholder}') shorthand tuples for concise declarations.","Can embed MessagesPlaceholder to dynamically inject conversation history arrays.","Type-checks input variables and produces valid structured chat messages."],
    useCases: ["Configuring role-specific system prompts","Injecting multi-turn history into reasoning chains","Standardizing agent prompt layouts"],
    code: "from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder\n\ntemplate = ChatPromptTemplate.from_messages([\n    (\"system\", \"You are a senior {domain} engineer. Provide succinct technical answers.\"),\n    MessagesPlaceholder(variable_name=\"chat_history\"),\n    (\"human\", \"{question}\"),\n])\n\nprompt_value = template.invoke({\n    \"domain\": \"distributed systems\",\n    \"chat_history\": [],\n    \"question\": \"Explain the Raft consensus protocol leader election.\"\n})\nprint(prompt_value.to_messages())",
    language: "python",
    source: "https://reference.langchain.com/python/langchain",
    related: ["PromptTemplate","create_agent","Runnable","BaseChatModel"],
  },
  "langgraph:add_messages": {
    packageName: "langgraph.graph.message",
    description: "Built-in reducer function for LangGraph state channels that appends new messages, updates existing messages by ID, and preserves message history integrity.",
    signature: "def add_messages(left: list[AnyMessage], right: list[AnyMessage] | AnyMessage) -> list[AnyMessage]",
    parameters: [{"name":"left","type":"list[AnyMessage]","description":"The existing list of messages stored in the graph state channel."},{"name":"right","type":"list[AnyMessage] | AnyMessage","description":"New messages, deltas, or RemoveMessage directives to merge into the state."}],
    returns: "list[AnyMessage] — updated message sequence with deduplicated IDs and mutations applied.",
    notes: ["If a message in right has an id matching a message in left, it replaces the existing message.","Passing a RemoveMessage(id=...) removes the targeted message from the history channel.","Used as the default reducer in LangGraph's MessagesState TypedDict schema."],
    useCases: ["Agent conversation history accumulation","Message streaming updates","Pruning or correcting erroneous agent responses"],
    code: "from typing import Annotated, TypedDict\nfrom langchain_core.messages import HumanMessage, AIMessage\nfrom langgraph.graph.message import add_messages\nfrom langgraph.graph import StateGraph, START, END\n\nclass ChatState(TypedDict):\n    messages: Annotated[list, add_messages]\n\ndef bot_node(state: ChatState) -> dict:\n    return {\"messages\": [AIMessage(content=\"Hello! How can I assist you?\")]}\n\nbuilder = StateGraph(ChatState)\nbuilder.add_node(\"bot\", bot_node)\nbuilder.add_edge(START, \"bot\")\nbuilder.add_edge(\"bot\", END)\ngraph = builder.compile()\n\nresult = graph.invoke({\"messages\": [HumanMessage(content=\"Hi\")]})\nprint(\"Total messages:\", len(result[\"messages\"]))",
    language: "python",
    source: "https://reference.langchain.com/python/langgraph",
    related: ["MessagesState","StateGraph","CompiledStateGraph"],
  },
  "langgraph:MessagesState": {
    packageName: "langgraph.graph",
    description: "Standard base state TypedDict for conversational LangGraph agents with a pre-configured messages channel utilizing the add_messages reducer.",
    signature: "class MessagesState(TypedDict):\n    messages: Annotated[list[AnyMessage], add_messages]",
    parameters: [{"name":"messages","type":"Annotated[list[AnyMessage], add_messages]","description":"The sequence of conversation messages managed by the add_messages reducer."}],
    returns: "MessagesState TypedDict schema for StateGraph definitions.",
    notes: ["Subclass MessagesState to easily add custom fields (e.g. user_id, current_step, documents).","Compatible out of the box with LangGraph's create_react_agent factory function.","Handles both single message appends and bulk message array replacements seamlessly."],
    useCases: ["Rapid prototyping of conversational agents","ReAct tool-calling agent graphs","Customer service dialogue loops"],
    code: "from langgraph.graph import MessagesState, StateGraph, START, END\nfrom langchain_core.messages import HumanMessage, AIMessage\n\nclass CustomAgentState(MessagesState):\n    session_id: str\n    task_complete: bool\n\ndef answer_node(state: CustomAgentState) -> dict:\n    return {\n        \"messages\": [AIMessage(content=\"Task completed successfully.\")],\n        \"task_complete\": True\n    }\n\nbuilder = StateGraph(CustomAgentState)\nbuilder.add_node(\"agent\", answer_node)\nbuilder.add_edge(START, \"agent\")\nbuilder.add_edge(\"agent\", END)\ngraph = builder.compile()",
    language: "python",
    source: "https://reference.langchain.com/python/langgraph",
    related: ["add_messages","StateGraph","create_react_agent"],
  },
  "langgraph:SqliteSaver": {
    packageName: "langgraph.checkpoint.sqlite",
    description: "Durable SQLite-backed checkpoint saver for persisting LangGraph execution threads, checkpoints, and time-travel states to a local database file.",
    signature: "class SqliteSaver(BaseCheckpointSaver):\n    @classmethod\n    def from_conn_string(cls, conn_string: str) -> SqliteSaver\n    def get_tuple(self, config: RunnableConfig) -> CheckpointTuple | None\n    def put(self, config: RunnableConfig, checkpoint: Checkpoint, metadata: CheckpointMetadata, new_versions: ChannelVersions) -> RunnableConfig",
    parameters: [{"name":"conn_string","type":"str","description":"SQLite database connection URI or file path (e.g. 'checkpoints.db')."}],
    returns: "SqliteSaver instance ready to pass to StateGraph.compile(checkpointer=...)",
    notes: ["Persists checkpoints across process restarts, enabling long-lived agent workflows.","Supports time-travel state recovery and human-in-the-loop review resumption.","Thread-safe for synchronous Python applications and local background tasks."],
    useCases: ["Local development and CLI agent state persistence","Single-node desktop applications","Fault-tolerant agent resumption"],
    code: "import sqlite3\nfrom langgraph.checkpoint.sqlite import SqliteSaver\nfrom langgraph.graph import StateGraph, START, END\n\n# Connect to local SQLite checkpointer\nwith sqlite3.connect(\"checkpoints.db\", check_same_thread=False) as conn:\n    checkpointer = SqliteSaver(conn)\n    # Compile graph with persistent checkpointer\n    # graph = builder.compile(checkpointer=checkpointer)\n    print(\"SqliteSaver initialized successfully.\")",
    language: "python",
    source: "https://reference.langchain.com/python/langgraph",
    related: ["MemorySaver","AsyncSqliteSaver","PostgresSaver","StateGraph"],
  },
  "langsmith:unit": {
    packageName: "langsmith.testing",
    description: "Testing decorator that registers Python test functions with LangSmith for automated test tracking, regression detection, and assertion metric logging.",
    signature: "@unit(\n    name: str | None = None,\n    output_keys: Sequence[str] | None = None,\n    tags: list[str] | None = None,\n)",
    parameters: [{"name":"name","type":"str | None","description":"Display name for the test run in the LangSmith test dashboard."},{"name":"output_keys","type":"Sequence[str] | None","description":"Dictionary keys from test return values to index as primary evaluation metrics."}],
    returns: "Decorated test function compatible with pytest and native test runners.",
    notes: ["Integrates seamlessly with pytest via `pytest --langsmith-output`.","Automatically uploads test run inputs, outputs, assertions, and execution spans to LangSmith.","Provides visual pass/fail diffs and latency distribution charts in the web interface."],
    useCases: ["CI/CD prompt regression testing","Unit testing agent tool invocations","Automated model migration verification"],
    code: "from langsmith.testing import unit\nfrom langchain_openai import ChatOpenAI\n\n@unit(name=\"test_currency_conversion\", tags=[\"finance\", \"tools\"])\ndef test_currency_conversion():\n    model = ChatOpenAI(model=\"gpt-4o-mini\", temperature=0)\n    response = model.invoke(\"Convert 100 USD to EUR at 0.92 rate. Output only the number.\")\n    assert \"92\" in response.content\n    return {\"response\": response.content}",
    language: "python",
    source: "https://reference.langchain.com/python/langsmith",
    related: ["Client","evaluate","expect","ExactMatchEvaluator"],
  },
  "langsmith:ExactMatchEvaluator": {
    packageName: "langsmith.evaluation",
    description: "Evaluator checking exact textual or token equivalence between an agent's predicted output and the expected reference ground truth.",
    signature: "class ExactMatchEvaluator(RunEvaluator):\n    def __init__(self, key: str = \"exact_match\", strip_whitespace: bool = True, ignore_case: bool = False)\n    def evaluate_run(self, run: Run, example: Example | None = None) -> EvaluationResult",
    parameters: [{"name":"key","type":"str","description":"Evaluation metric label in the LangSmith results table."},{"name":"strip_whitespace","type":"bool","description":"Whether to strip leading and trailing whitespace before comparison."},{"name":"ignore_case","type":"bool","description":"When True, performs case-insensitive equality checks."}],
    returns: "EvaluationResult with score 1.0 (match) or 0.0 (mismatch).",
    notes: ["Ideal for classification, code generation, entity extraction, and structured output tests.","Can be passed directly into langsmith.evaluate() evaluators list.","Zero-cost deterministic evaluator that requires no additional LLM inference tokens."],
    useCases: ["Evaluating JSON schema extraction accuracy","Benchmarking classification prompts","Regression unit tests"],
    code: "from langsmith.evaluation import ExactMatchEvaluator\nfrom langsmith import evaluate\n\nevaluator = ExactMatchEvaluator(strip_whitespace=True, ignore_case=True)\n\ndef predict(inputs: dict) -> dict:\n    return {\"output\": \"Paris\"}\n\n# evaluate(\n#     predict,\n#     data=\"capitals-benchmark\",\n#     evaluators=[evaluator],\n# )",
    language: "python",
    source: "https://reference.langchain.com/python/langsmith",
    related: ["evaluate","EvaluationResult","CriteriaEvaluator","RunEvaluator"],
  },
  "deepagents:execute_bash": {
    packageName: "deepagents.tools",
    description: "Sandboxed terminal tool allowing deep research and coding agents to execute bash shell commands in a secure containerized environment with timeout and output capture.",
    signature: "def execute_bash(\n    command: str,\n    timeout: int = 60,\n    workdir: str | None = None,\n    env: dict[str, str] | None = None,\n) -> dict[str, Any]",
    parameters: [{"name":"command","type":"str","description":"The bash command string to execute."},{"name":"timeout","type":"int","description":"Maximum wall-clock execution time in seconds before termination."},{"name":"workdir","type":"str | None","description":"Working directory path relative to the sandboxed workspace."}],
    returns: "dict with exit_code (int), stdout (str), stderr (str), and timed_out (bool).",
    notes: ["Executes inside isolated Docker or local sandbox environments with strict network policy.","Captures stdout and stderr streams; automatically truncates excessive outputs to preserve model tokens.","Monitored by ToolDisciplinePolicy to prevent dangerous system calls and infinite loops."],
    useCases: ["Running automated test suites (pytest, npm test)","Compiling build artifacts and code repositories","Git history inspection and branch management"],
    code: "from deepagents.tools import execute_bash\n\n# Execute a test verification command in the sandbox\nresult = execute_bash(\"pytest tests/test_auth.py -v\", timeout=30)\nprint(\"Exit code:\", result[\"exit_code\"])\nprint(\"Output snippet:\", result[\"stdout\"][:300])",
    language: "python",
    source: "https://reference.langchain.com/python/deepagents",
    related: ["SandboxEnvironment","DockerSandbox","read_file","write_file"],
  },
  "deepagents:SandboxEnvironment": {
    packageName: "deepagents.sandbox",
    description: "Core abstract interface governing isolated execution environments for deep agents, managing filesystem virtualization, process isolation, and security guardrails.",
    signature: "class SandboxEnvironment(ABC):\n    @abstractmethod\n    async def read_file(self, path: str, offset: int = 0, limit: int | None = None) -> str:\n        pass\n    @abstractmethod\n    async def write_file(self, path: str, content: str) -> None:\n        pass\n    @abstractmethod\n    async def execute_command(self, command: str, timeout: int = 60) -> ProcessResult:\n        pass\n    @abstractmethod\n    async def teardown(self) -> None:\n        pass",
    parameters: [{"name":"path","type":"str","description":"Target file path relative to sandbox root."},{"name":"command","type":"str","description":"Shell command string to run inside the containerized sandbox."}],
    returns: "SandboxEnvironment instance providing secure file and process primitives.",
    notes: ["Implemented by DockerSandbox for full OS container isolation and LocalFilesystemSandbox for local testing.","Guarantees that rogue agent commands cannot compromise host machines or escape designated workspaces.","Includes snapshotting and rollbacks for speculative multi-agent coding trials."],
    useCases: ["Safe autonomous code generation and testing","Containerized repository refactoring","Secure untrusted script analysis"],
    code: "from deepagents.sandbox import DockerSandbox\n\nasync def setup_agent_env():\n    sandbox = DockerSandbox(image=\"python:3.11-slim\", workspace_dir=\"/workspace\")\n    await sandbox.initialize()\n    result = await sandbox.execute_command(\"python --version\")\n    print(\"Sandbox Python version:\", result.stdout)\n    await sandbox.teardown()",
    language: "python",
    source: "https://reference.langchain.com/python/deepagents",
    related: ["DockerSandbox","LocalFilesystemSandbox","execute_bash","create_deep_agent"],
  },
  "integrations:TavilySearchResults": {
    packageName: "langchain-community.tools.tavily_search",
    description: "High-precision search tool powered by the Tavily Search API, optimized specifically for LLMs and autonomous agents to retrieve factual web content with raw text extracts.",
    signature: "class TavilySearchResults(BaseTool):\n    max_results: int = 5\n    search_depth: Literal[\"basic\", \"advanced\"] = \"basic\"\n    include_answer: bool = True\n    include_raw_content: bool = False\n    def _run(self, query: str) -> list[dict[str, str]]",
    parameters: [{"name":"query","type":"str","description":"Search query string to submit to the Tavily search engine."},{"name":"max_results","type":"int","description":"Maximum number of search results to return."},{"name":"search_depth","type":"str","description":"'basic' for rapid responses; 'advanced' for deep RAG-focused analysis."}],
    returns: "list[dict] — search results containing url, content, and title strings.",
    notes: ["Returns cleaned text snippets stripped of boilerplate HTML, ads, and irrelevant page clutter.","Reads TAVILY_API_KEY from the environment automatically.","Can be bound directly to any LangChain agent or LangGraph node with bind_tools([TavilySearchResults()])."],
    useCases: ["Real-time fact checking in conversational agents","Autonomous deep research web discovery","Current events and breaking news retrieval"],
    code: "from langchain_community.tools.tavily_search import TavilySearchResults\nfrom langchain.agents import create_agent\nfrom langchain_openai import ChatOpenAI\n\nsearch_tool = TavilySearchResults(max_results=3)\nllm = ChatOpenAI(model=\"gpt-4o\", temperature=0)\n\nagent = create_agent(model=llm, tools=[search_tool])\nresponse = agent.invoke({\"messages\": [(\"user\", \"What happened in tech policy today?\")]})\nprint(response[\"messages\"][-1].content)",
    language: "python",
    source: "https://reference.langchain.com/python/integrations/overview",
    related: ["ChatOpenAI","create_agent","BaseTool","DuckDuckGoSearchRun"],
  },
  "integrations:ChatMistralAI": {
    packageName: "langchain-mistralai",
    description: "Integration client connecting LangChain and LangGraph to Mistral AI's family of frontier and open models including Mistral Large, Codestral, and Pixtral with tool calling and structured output.",
    signature: "class ChatMistralAI(BaseChatModel):\n    model_name: str = \"mistral-large-latest\"\n    temperature: float = 0.7\n    api_key: SecretStr | None = None\n    max_tokens: int | None = None",
    parameters: [{"name":"model_name","type":"str","description":"Model identifier (e.g. 'mistral-large-latest', 'codestral-latest', 'pixtral-large-latest')."},{"name":"temperature","type":"float","description":"Sampling temperature between 0 and 1."}],
    returns: "ChatMistralAI instance implementing BaseChatModel.",
    notes: ["First-class function calling and JSON output mode support.","Optimized for multilingual code generation and enterprise reasoning tasks.","Compatible with Mistral's fast European inference infrastructure."],
    useCases: ["Autonomous code generation with Codestral","Multilingual customer service assistants","High-speed JSON entity extraction"],
    code: "from langchain_mistralai import ChatMistralAI\n\nllm = ChatMistralAI(model_name=\"codestral-latest\", temperature=0.1)\nmsg = llm.invoke(\"Write a Python async generator that yields fibonacci numbers up to n.\")\nprint(msg.content)",
    language: "python",
    source: "https://reference.langchain.com/python/integrations/overview",
    related: ["MistralAIEmbeddings","ChatOpenAI","ChatAnthropic"],
  },
  "integrations:QdrantVectorStore": {
    packageName: "langchain-qdrant",
    description: "Production vector database integration connecting LangChain to Qdrant for dense, sparse, and hybrid vector search with rich payload metadata filtering.",
    signature: "class QdrantVectorStore(VectorStore):\n    @classmethod\n    def from_documents(cls, documents: list[Document], embedding: Embeddings, **kwargs) -> QdrantVectorStore\n    def similarity_search(self, query: str, k: int = 4, filter: MetadataFilter | None = None) -> list[Document]",
    parameters: [{"name":"documents","type":"list[Document]","description":"List of Document instances to embed and index."},{"name":"embedding","type":"Embeddings","description":"Embedding model used to calculate vector representations."},{"name":"k","type":"int","description":"Number of nearest neighbors to retrieve."}],
    returns: "QdrantVectorStore instance supporting fast similarity_search and similarity_search_with_score.",
    notes: ["Supports both managed Qdrant Cloud clusters and local in-memory/disk instances (:memory:).","Provides native hybrid search combining dense neural embeddings with BM25 sparse vectors.","Allows deep payload filtering on structured document metadata fields."],
    useCases: ["Enterprise RAG pipelines","Hybrid keyword + semantic knowledge bases","Real-time user recommendation engines"],
    code: "from langchain_qdrant import QdrantVectorStore\nfrom langchain_openai import OpenAIEmbeddings\nfrom langchain_core.documents import Document\n\nembeddings = OpenAIEmbeddings(model=\"text-embedding-3-small\")\ndocs = [\n    Document(page_content=\"LangGraph manages cyclic multi-agent graphs.\", metadata={\"category\": \"framework\"}),\n    Document(page_content=\"LangSmith tracks production LLM telemetry.\", metadata={\"category\": \"observability\"}),\n]\n\n# Initialize local in-memory Qdrant store\nstore = QdrantVectorStore.from_documents(docs, embeddings, location=\":memory:\", collection_name=\"ai-tools\")\nresults = store.similarity_search(\"agent orchestration\", k=1)\nprint(\"Matched:\", results[0].page_content)",
    language: "python",
    source: "https://reference.langchain.com/python/integrations/overview",
    related: ["PineconeVectorStore","Chroma","OpenAIEmbeddings","BaseRetriever"],
  },
  ...LANGFLOW_DETAILS,
  ...AGENTIC_DETAILS,
};
