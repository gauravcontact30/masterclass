/**
 * The field guide for each headline technology on API Docs: what it is, how to think about it, the five APIs to learn
 * first and the mistakes its own documentation warns about. Everything here is free to read, on the landing page and
 * in the dashboard, so it holds short descriptions only; parameters, examples and practice stay on the member pages.
 * Facts come from each project's official documentation, checked on CHECKED_AT. The site does not link out, so
 * `source` is plain text (LangChain-family guides name the Docs by LangChain MCP servers they were checked against).
 */
export type GuideEssential = { name: string; summary: string; signature: string };
export type FieldGuide = {
  id: string; name: string; logo: string; tagline: string; version?: string; install: string; source: string;
  idea: string; mentalModel: string[]; essentials: GuideEssential[]; pitfalls: string[];
};

export const CHECKED_AT = "2026-11-03";
/** How many APIs a non-member can read, per technology. */
export const FREE_APIS = 5;

export const FIELD_GUIDES: FieldGuide[] = [
  {
    id: "langchain", name: "LangChain", logo: "/images/tech/langchain.png", version: "v1", install: "pip install -U langchain", source: "Sourced from Docs by LangChain (MCP)",
    tagline: "Build an agent from a model, tools and middleware.",
    idea: "LangChain is the quickest way to a working agent. You pick a model, hand it tools, and it loops until the job is done.",
    mentalModel: [
      "An agent is a model plus a harness: the prompt, the tools and the middleware around the model loop.",
      "The loop is simple: call the model, run the tools it chooses, and stop when it calls no more tools.",
      "Middleware is where you customise: hooks run before and after the agent, the model call and each tool call.",
      "Agents run on LangGraph, so persistence, streaming and human review come with them.",
    ],
    essentials: [
      { name: "create_agent", summary: "Builds a ready-to-run agent from a model, tools, a prompt and middleware.", signature: "create_agent(model, tools=[...], system_prompt=\"...\")" },
      { name: "init_chat_model", summary: "Starts any provider's chat model through one function.", signature: "init_chat_model(\"provider:model\")" },
      { name: "tool", summary: "Turns a plain Python function into a tool the model can call.", signature: "@tool\ndef search(query: str) -> str: ..." },
      { name: "AgentMiddleware", summary: "Base class for your own hooks around model and tool calls.", signature: "class Audit(AgentMiddleware): ..." },
      { name: "ToolStrategy", summary: "Makes the agent return structured output through a tool call.", signature: "response_format=ToolStrategy(Schema)" },
    ],
    pitfalls: [
      "create_agent replaces langgraph.prebuilt.create_react_agent. Move old agents across.",
      "Chains, hub and older retrievers moved to the langchain-classic package, so their imports change.",
      "Only agents, messages, tools, chat_models and embeddings remain in the core langchain namespace.",
    ],
  },
  {
    id: "langgraph", name: "LangGraph", logo: "/images/tech/langgraph.png", install: "pip install -U langgraph", source: "Sourced from Docs by LangChain (MCP)",
    tagline: "Run long, stateful agents you can pause and resume.",
    idea: "LangGraph is the runtime underneath agents. Use it when you need to control every step, save progress and bring a person into the loop.",
    mentalModel: [
      "It only orchestrates. Prompts and architecture stay your choice.",
      "One graph can mix fixed, hand-written steps with steps the model decides.",
      "Two APIs share one runtime: the Graph API draws nodes and edges, the Functional API uses plain functions.",
      "A checkpointer saves progress per thread, which is what makes pause, resume and memory possible.",
    ],
    essentials: [
      { name: "StateGraph", summary: "Defines a workflow as shared state, nodes and edges.", signature: "StateGraph(State)" },
      { name: "MessagesState", summary: "Ready-made state with a messages list, for chat agents.", signature: "StateGraph(MessagesState)" },
      { name: "InMemorySaver", summary: "Saves checkpoints in memory while you develop.", signature: "builder.compile(checkpointer=InMemorySaver())" },
      { name: "interrupt", summary: "Pauses a run for human input; Command(resume=...) continues it.", signature: "answer = interrupt(payload)" },
      { name: "entrypoint", summary: "Starts a Functional API workflow with no graph to draw.", signature: "@entrypoint(checkpointer=saver)" },
    ],
    pitfalls: [
      "Put side effects such as emails and file writes inside a task, or they run again on resume.",
      "Wrap random values and timestamps in a task too, or a resumed run can take a different path.",
      "With a checkpointer, entrypoint and task data must be JSON-serializable.",
    ],
  },
  {
    id: "langsmith", name: "LangSmith", logo: "/images/tech/langsmith.png", install: "pip install -U langsmith", source: "Sourced from Docs by LangChain (MCP)",
    tagline: "See what your agents did, then measure if they improved.",
    idea: "LangSmith records every step of an agent run and lets you test changes against real examples, whichever framework you use.",
    mentalModel: [
      "A trace is the full record of one request, with nested spans for each model and tool call.",
      "For LangChain and LangGraph, tracing starts from environment variables alone.",
      "Traces belong to an agent and an environment: local, development, staging or production.",
      "Evaluation runs your app over a dataset and scores the results, so changes are measured.",
    ],
    essentials: [
      { name: "traceable", summary: "Wraps a Python function so its inputs, outputs and nested calls become a trace.", signature: "@traceable(run_type=\"tool\")" },
      { name: "wrap_openai", summary: "Wraps a provider client so each call is logged as a span.", signature: "client = wrap_openai(OpenAI())" },
      { name: "LANGSMITH_TRACING", summary: "Turns tracing on, together with your API key.", signature: "LANGSMITH_TRACING=true" },
      { name: "evaluate", summary: "Runs a target over a dataset and scores it with your evaluators.", signature: "evaluate(target, data=\"...\", evaluators=[...])" },
      { name: "Client", summary: "The SDK entry point for datasets, runs, prompts and feedback.", signature: "client = Client()" },
    ],
    pitfalls: [
      "Accounts outside the US must set LANGSMITH_ENDPOINT to their region, or the key is not recognised.",
      "Agent-based workspaces use LANGSMITH_AGENT_ID and LANGSMITH_AGENT_ENVIRONMENT. Remove LANGSMITH_PROJECT there.",
      "Register an agent once, not on every trace.",
    ],
  },
  {
    id: "langflow", name: "LangFlow", logo: "/images/tech/langflow.png", version: "1.13", install: "uv pip install langflow", source: "Source: Langflow documentation",
    tagline: "Draw an AI workflow, then serve it as an API.",
    idea: "Langflow is a visual builder. You connect components into a flow, test it in the Playground, and call it from your app over REST.",
    mentalModel: [
      "A flow is a graph of components, and each component is one step.",
      "Any component setting can be fixed or a variable, and tweaks override settings at run time.",
      "The Playground tests a whole flow; you can also run one component at a time.",
      "Custom components are Python classes, so you can add what the catalogue lacks.",
    ],
    essentials: [
      { name: "Flow", summary: "The workflow itself: connected components you can run and share.", signature: "Flow = components + connections" },
      { name: "Tweaks", summary: "Override any component setting for a single API call.", signature: "\"tweaks\": { \"ChatOutput-6zcZt\": { ... } }" },
      { name: "POST /api/v1/run/{flow_id}", summary: "Runs a flow from your own code and returns its output.", signature: "POST /api/v1/run/{flow_id}?stream=false" },
      { name: "Component", summary: "Base class for writing your own Python component.", signature: "class MyTool(Component): ..." },
      { name: "langflow run", summary: "Starts the local server and visual editor on port 7860.", signature: "uv run langflow run" },
    ],
    pitfalls: [
      "Since 1.13 auto-login is off by default. Set LANGFLOW_SUPERUSER_PASSWORD before you upgrade.",
      "Back up first: export each project with GET /api/v1/projects/download/{project_id}.",
      "Use /health_check for service health, because /health can answer before Langflow is ready.",
    ],
  },
  {
    id: "nextjs", name: "Next.js", logo: "/images/tech/nextjs.png", version: "16", install: "npx create-next-app@latest", source: "Source: Next.js documentation",
    tagline: "Full-stack React with files as routes and caching you opt into.",
    idea: "Next.js turns folders into routes and runs React on the server by default, sending JavaScript to the browser only where you ask.",
    mentalModel: [
      "Folders define routes; page, layout, loading and error files define what each route shows.",
      "Components run on the server unless you mark a client boundary with \"use client\".",
      "With Cache Components on, caching is explicit: you choose what to cache with \"use cache\".",
      "Proxy runs before a request reaches a route, and it replaces Middleware in version 16.",
    ],
    essentials: [
      { name: "use client", summary: "Marks where server code ends and browser code begins.", signature: "\"use client\";" },
      { name: "use cache", summary: "Caches a function, component or file's output.", signature: "\"use cache\";" },
      { name: "proxy", summary: "Runs code before a request completes, to redirect or rewrite it.", signature: "export function proxy(request) { ... }" },
      { name: "useRouter", summary: "Navigates from a Client Component in response to user actions.", signature: "const router = useRouter()" },
      { name: "generateMetadata", summary: "Builds a page's title and description from its data.", signature: "export async function generateMetadata({ params })" },
    ],
    pitfalls: [
      "middleware.js is deprecated. Rename it to proxy.js, which runs on the Node.js runtime by default.",
      "revalidateTag without a second argument is deprecated. Use profile \"max\", or updateTag in a Server Action.",
      "unstable_cacheLife and unstable_cacheTag are deprecated in favour of cacheLife and cacheTag.",
    ],
  },
  {
    id: "react", name: "React", logo: "/images/tech/react.png", version: "19.3", install: "npm install react react-dom", source: "Source: react.dev",
    tagline: "Describe the screen for any state, and React keeps it in step.",
    idea: "React builds interfaces from components. You describe what the screen should show, and React updates only what changed.",
    mentalModel: [
      "Rendering is a calculation: the same props and state should give the same output.",
      "State is a snapshot. Setting it asks for a new render and does not change the current one.",
      "Effects connect a component to outside systems and are not for calculating values.",
      "Activity hides a subtree and keeps its state, but its Effects are cleaned up while hidden.",
    ],
    essentials: [
      { name: "useState", summary: "Adds a value to a component that triggers a render when it changes.", signature: "const [value, setValue] = useState(initial)" },
      { name: "useEffect", summary: "Keeps a component in sync with something outside React.", signature: "useEffect(setup, dependencies?)" },
      { name: "use", summary: "Reads a Promise or a context, and can be called conditionally.", signature: "const data = use(promise)" },
      { name: "useActionState", summary: "Tracks the result and pending state of a form action.", signature: "const [state, action, pending] = useActionState(fn, initial)" },
      { name: "Activity", summary: "Hides part of the screen without losing its state.", signature: "<Activity mode=\"hidden\">...</Activity>" },
    ],
    pitfalls: [
      "Hidden video, audio and iframes keep playing inside Activity. Pause them in an Effect cleanup.",
      "Never use useEffectEvent to hide a missing dependency, and call it only from Effects.",
      "render, hydrate and findDOMNode were removed in React 19. Use createRoot and hydrateRoot.",
    ],
  },
  {
    id: "zustand", name: "Zustand", logo: "/images/tech/zustand.png", install: "npm install zustand", source: "Source: Zustand documentation",
    tagline: "Shared state in one small hook, with no provider.",
    idea: "Zustand keeps shared state in a store you call like a hook. Components subscribe to the pieces they use and re-render only when those change.",
    mentalModel: [
      "A store is a hook. Call it anywhere, with no provider around your app.",
      "Pass a selector and the component re-renders only when that value changes.",
      "Actions live in the store beside the state they change.",
      "The same store works outside React, through the vanilla API.",
    ],
    essentials: [
      { name: "create", summary: "Creates a store and returns the hook that reads it.", signature: "const useStore = create((set) => ({ ... }))" },
      { name: "useShallow", summary: "Stops re-renders when a selector returns a new object with equal values.", signature: "useStore(useShallow((s) => [s.a, s.b]))" },
      { name: "persist", summary: "Saves a store to storage and restores it on load.", signature: "create(persist(creator, { name: \"key\" }))" },
      { name: "createStore", summary: "Creates a store for use outside React.", signature: "const store = createStore((set) => ({ ... }))" },
      { name: "devtools", summary: "Connects a store to Redux DevTools for debugging.", signature: "create(devtools(creator))" },
    ],
    pitfalls: [
      "A selector that returns a new object or array re-renders every time. Wrap it in useShallow.",
      "set merges one level only, so spread nested objects yourself.",
      "On the server, create a store per request, so one user's data never reaches another.",
    ],
  },
  {
    id: "tanstack", name: "TanStack", logo: "/images/tech/tanstack.png", install: "npm install @tanstack/react-query", source: "Source: TanStack documentation",
    tagline: "Headless, type-safe tools for data, routes, tables and forms.",
    idea: "TanStack is a family of libraries. Query caches server data, Router handles type-safe routes, and Table, Form and Virtual handle the logic while you own the markup.",
    mentalModel: [
      "Server state is not client state: it is remote, shared and can go stale.",
      "A query key identifies cached data, and the query refetches when the key changes.",
      "status says whether you have data; fetchStatus says whether a request is running.",
      "Router treats search params as typed state in the URL, and its loaders cache results.",
    ],
    essentials: [
      { name: "useQuery", summary: "Fetches, caches and refreshes server data for a component.", signature: "useQuery({ queryKey, queryFn })" },
      { name: "useMutation", summary: "Sends changes to the server and tracks their progress.", signature: "useMutation({ mutationFn })" },
      { name: "createFileRoute", summary: "Defines a type-safe route from a file in TanStack Router.", signature: "createFileRoute(\"/posts\")({ ... })" },
      { name: "useReactTable", summary: "Provides sorting, filtering and paging logic for your own table markup.", signature: "useReactTable({ data, columns, getCoreRowModel })" },
      { name: "useForm", summary: "Manages form state and validation, field by field.", signature: "useForm({ defaultValues, onSubmit })" },
    ],
    pitfalls: [
      "isPending stays true for a disabled query with no data. Use isLoading for dependent queries.",
      "refetch does nothing when queryFn is skipToken. Use enabled: false for manual fetching.",
      "select runs again when its function reference changes, so keep that function stable.",
    ],
  },
  {
    id: "fastapi", name: "FastAPI", logo: "/images/brands/fastapi.svg", version: "0.162", install: "pip install \"fastapi[standard]\"", source: "Source: FastAPI documentation",
    tagline: "Python type hints become validation and live API docs.",
    idea: "FastAPI builds web APIs from typed Python functions. Your type hints validate requests and produce interactive documentation automatically.",
    mentalModel: [
      "A path operation is a path plus an HTTP method, tied to one function by a decorator.",
      "Return a dict, a list or a Pydantic model, and FastAPI sends it as JSON.",
      "Dependencies are functions FastAPI runs for you and passes in, and they handle shared work such as auth.",
      "Your code generates an OpenAPI schema, which powers the docs at /docs and /redoc.",
    ],
    essentials: [
      { name: "FastAPI", summary: "Creates the application that holds all your routes.", signature: "app = FastAPI()" },
      { name: "@app.get", summary: "Connects a function to a GET request on a path.", signature: "@app.get(\"/items/{item_id}\")" },
      { name: "Depends", summary: "Injects shared logic such as auth or a database session.", signature: "def read(user = Depends(get_user)): ..." },
      { name: "HTTPException", summary: "Stops a request and returns an HTTP error to the client.", signature: "raise HTTPException(status_code=404)" },
      { name: "BackgroundTasks", summary: "Runs work after the response has been sent.", signature: "tasks.add_task(send_email, address)" },
    ],
    pitfalls: [
      "If you pass lifespan, startup and shutdown handlers stop running. Use one or the other.",
      "Lifespan runs only for the main app, not for mounted sub-applications.",
      "Since 0.162, an omitted boolean form field is no longer False. Give checkboxes a False default.",
    ],
  },
  {
    id: "pydantic", name: "Pydantic", logo: "/images/brands/pydantic.svg", version: "2.14", install: "pip install pydantic", source: "Source: Pydantic documentation",
    tagline: "Type hints that check, convert and export your data.",
    idea: "Pydantic validates data using Python type hints. Describe the shape once, and it checks input, converts values and exports clean JSON.",
    mentalModel: [
      "A model is a class of typed fields, and creating one validates the data.",
      "Validators run at set moments: before, after, wrapped around or in place of the type check.",
      "Annotated reuses a field's rules across any model that needs them.",
      "Validation and serialization are separate steps, each with its own controls.",
    ],
    essentials: [
      { name: "BaseModel", summary: "The base class for a validated data model.", signature: "class User(BaseModel): name: str" },
      { name: "Field", summary: "Adds defaults, limits and metadata to one field.", signature: "age: int = Field(gt=0)" },
      { name: "field_validator", summary: "Adds your own check or conversion to a field.", signature: "@field_validator(\"name\", mode=\"after\")" },
      { name: "model_dump", summary: "Exports a model as a dictionary.", signature: "user.model_dump(exclude_none=True)" },
      { name: "TypeAdapter", summary: "Validates any type without writing a model.", signature: "TypeAdapter(list[int]).validate_python(data)" },
    ],
    pitfalls: [
      "A plain validator ends validation, so the type check never runs and bad values can pass.",
      "A validator must return the value, or the field becomes None.",
      "info.data holds only fields validated so far, so do not read a field defined later.",
    ],
  },
  {
    id: "pandas", name: "Pandas", logo: "/images/brands/pandas.svg", version: "3.1", install: "pip install pandas", source: "Source: pandas documentation",
    tagline: "Labelled tables for cleaning, joining and summarising data.",
    idea: "pandas gives Python a table called a DataFrame. You load data, select by label, group it, join it and summarise it in a few lines.",
    mentalModel: [
      "A DataFrame is a set of columns, and each column is a Series with its own type.",
      "Operations line up on labels. Labels that do not match produce missing values.",
      ".loc selects by label and includes the end; .iloc selects by position and excludes it.",
      "Missing values are left out of calculations by default.",
    ],
    essentials: [
      { name: "DataFrame", summary: "The two-dimensional table at the centre of pandas.", signature: "pd.DataFrame({\"a\": [1, 2]})" },
      { name: "pd.read_csv", summary: "Loads a CSV file into a DataFrame.", signature: "df = pd.read_csv(\"data.csv\")" },
      { name: "df.loc", summary: "Selects rows and columns by their labels.", signature: "df.loc[df[\"a\"] > 1, \"b\"]" },
      { name: "df.groupby", summary: "Splits rows into groups so you can summarise each one.", signature: "df.groupby(\"city\")[\"sales\"].sum()" },
      { name: "pd.merge", summary: "Joins two tables on shared columns.", signature: "pd.merge(left, right, on=\"id\")" },
    ],
    pitfalls: [
      "applymap is gone from the DataFrame reference. Use DataFrame.map.",
      "Adding rows one by one is slow. Build a list of records, then create the DataFrame.",
      "Text columns now show the str dtype, so older checks for object may need updating.",
    ],
  },
  {
    id: "numpy", name: "NumPy", logo: "/images/brands/numpy.svg", version: "2.5", install: "pip install numpy", source: "Source: NumPy documentation",
    tagline: "Fast maths on whole arrays, without writing loops.",
    idea: "NumPy stores numbers in compact arrays and works on all of them at once, which is both faster and shorter than a Python loop.",
    mentalModel: [
      "An array has one data type and a rectangular shape, and its size cannot change.",
      "Slicing gives a view of the same data, not a copy.",
      "Broadcasting lets different shapes work together when sizes match or one of them is 1.",
      "axis names the dimension that gets collapsed in a calculation.",
    ],
    essentials: [
      { name: "np.array", summary: "Creates an array from a list or other sequence.", signature: "np.array([1, 2, 3])" },
      { name: "ndarray.reshape", summary: "Gives the same data a new shape.", signature: "a.reshape(2, 3)" },
      { name: "Broadcasting", summary: "How NumPy combines arrays of different shapes.", signature: "np.ones((3, 3)) + np.arange(3)" },
      { name: "np.where", summary: "Chooses values from two options using a condition.", signature: "np.where(a > 0, a, 0)" },
      { name: "np.random.default_rng", summary: "Creates the recommended random number generator.", signature: "rng = np.random.default_rng(42)" },
    ],
    pitfalls: [
      "Changing a slice changes the original array. Call .copy() when you need separate data.",
      "Incompatible shapes raise a ValueError. Check that sizes match or are 1.",
      "in1d and row_stack no longer appear in the routine lists. Use isin and vstack.",
    ],
  },
  {
    id: "playwright", name: "Playwright", logo: "/images/tech/playwright.png", version: "1.64", install: "npm init playwright@latest", source: "Source: Playwright documentation",
    tagline: "Browser tests that wait for the page, the way a user does.",
    idea: "Playwright drives real browsers to test your app. Locators find elements as a user would, and assertions keep retrying until the page is ready.",
    mentalModel: [
      "Test what users see, not how the code is built.",
      "Locators wait for elements automatically, so tests rarely need manual waits.",
      "Web-first assertions retry until they pass or time out, and must be awaited.",
      "Each test gets its own isolated browser context, with its own storage and cookies.",
    ],
    essentials: [
      { name: "test", summary: "Declares a test and gives it a fresh page.", signature: "test(\"title\", async ({ page }) => { ... })" },
      { name: "page.getByRole", summary: "Finds an element by its role and accessible name.", signature: "page.getByRole(\"button\", { name: \"Save\" })" },
      { name: "toBeVisible", summary: "Waits until an element is visible on the page.", signature: "await expect(locator).toBeVisible()" },
      { name: "page.route", summary: "Intercepts network requests so you can mock them.", signature: "await page.route(\"**/api/*\", handler)" },
      { name: "defineConfig", summary: "Sets browsers, retries, traces and projects for the suite.", signature: "export default defineConfig({ ... })" },
    ],
    pitfalls: [
      "Avoid expect(await x.isVisible()).toBe(true). It checks once and never retries.",
      "Avoid CSS and XPath chains tied to markup. Prefer getByRole and other user-facing locators.",
      "Do not set trace to on in config. Record traces on first retry and debug CI with the trace viewer.",
    ],
  },
];

const BY_ID = new Map(FIELD_GUIDES.map(guide => [guide.id, guide]));
export const fieldGuide = (packageId: string) => BY_ID.get(packageId);
