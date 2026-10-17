import type { QuestionSet } from "@/lib/interview-questions";

/**
 * Tech Topics comparisons: one slide per "what is the difference between…" question, covering the technologies
 * taught across the platform. Each comparison names its technologies with a one-line definition and a short
 * description, an at-a-glance table, and a bank of 40+ difference questions with answers. The banks live in
 * ./banks/<id>.ts and load as their own chunk when a slide comes near, so this list stays small.
 * Pictures: `npm run images:comparisons` paints them into the topics folder under ["comparisons", id].
 */
export type ComparedTech = { name: string; definition: string; description: string };
export type ComparisonGroup = "AI & agents" | "Frontend" | "State & data fetching" | "Backend & APIs" | "Testing" | "Data & storage" | "Cloud & DevOps" | "Python & data" | "Architecture";
export type Comparison = {
  id: string; group: ComparisonGroup;
  /** The comparison as people ask it. */
  question: string;
  /** Two or three sentences: the one thing to remember. */
  summary: string;
  techs: ComparedTech[];
  /** At a glance: one row per aspect, one value per technology, in the order of `techs`. */
  aspects: [aspect: string, ...values: string[]][];
  /** Set when the facts were checked against a named source, shown on the slide. */
  source?: string;
};

const LC = "Sourced from Docs by LangChain (MCP)";

export const COMPARISONS: Comparison[] = [
  {
    id: "langchain-langgraph-langsmith", group: "AI & agents", source: LC,
    question: "What is the difference among LangChain, LangGraph and LangSmith?",
    summary: "LangChain is the agent framework, LangGraph is the orchestration runtime underneath it, and LangSmith is the platform that traces, evaluates and deploys what you build with either.",
    techs: [
      { name: "LangChain", definition: "An open-source agent framework with standard interfaces to models, tools and agent loops.", description: "Its create_agent gives a configurable harness: prompt, tools and middleware around the model loop. Start here for most agents." },
      { name: "LangGraph", definition: "A low-level orchestration framework and runtime for long-running, stateful agents.", description: "It models work as a graph of nodes and edges with durable execution, streaming, human-in-the-loop and persistence. LangChain's create_agent runs on it." },
      { name: "LangSmith", definition: "A platform for tracing, evaluation, prompts and deployment across frameworks.", description: "It records every run, scores quality with datasets and evaluators, and hosts agents. It works with LangChain, LangGraph or neither." },
    ],
    aspects: [["Role", "Agent framework", "Orchestration runtime", "Observability & evaluation platform"], ["Level", "High-level", "Low-level", "Platform / service"], ["Typical code", "create_agent(model, tools)", "StateGraph, nodes, edges", "Tracing env vars, evaluate()"], ["Open source", "Yes", "Yes", "SDKs yes; platform is a service"], ["Use when", "Building a standard agent fast", "Custom control flow, durability, approvals", "Debugging, testing and monitoring LLM apps"]],
  },
  {
    id: "redux-zustand-rtk", group: "State & data fetching",
    question: "What is the difference among Redux, Zustand and Redux Toolkit?",
    summary: "Redux is the pattern and core library, Redux Toolkit is the official way to write Redux today, and Zustand is a separate, much smaller store with almost no ceremony.",
    techs: [
      { name: "Redux", definition: "A predictable state container: one store, actions describe changes, pure reducers apply them.", description: "Core Redux is small but verbose by hand. Its strengths are a single source of truth, middleware and time-travel debugging." },
      { name: "Redux Toolkit", definition: "The official, recommended toolset for writing Redux logic.", description: "configureStore, createSlice with Immer, createAsyncThunk and RTK Query remove most boilerplate while keeping Redux's model and DevTools." },
      { name: "Zustand", definition: "A small, hook-based state library built on a simple store and selectors.", description: "You create a store with a function, read slices with a hook, and update with set(). No providers, actions or reducers are required." },
    ],
    aspects: [["Boilerplate", "High", "Low", "Very low"], ["Provider needed", "Yes", "Yes", "No"], ["Immutability", "Manual", "Immer built in", "Manual or immer middleware"], ["Server data", "Add middleware", "RTK Query included", "Pair with TanStack Query"], ["Best for", "Learning the model, legacy apps", "Large apps and teams", "Small to mid apps, simple global state"]],
  },
  {
    id: "nextjs-tanstack", group: "Frontend",
    question: "What is the difference between Next.js 16 and TanStack (Start, Router and Query)?",
    summary: "Next.js is a full framework built around React Server Components and the App Router. TanStack is a family of headless, type-safe libraries; TanStack Start builds a full-stack framework from TanStack Router and Vite.",
    techs: [
      { name: "Next.js 16", definition: "A full-stack React framework with the App Router, Server Components and Cache Components.", description: "File-based routing, server rendering, Partial Prerendering, `use cache`, proxy.ts and Turbopack come integrated, with first-class deployment on Vercel." },
      { name: "TanStack Start", definition: "A full-stack React framework built on TanStack Router and Vite.", description: "It adds server functions, SSR and streaming to a fully type-safe router, with client-first data loading and no lock-in to one host." },
      { name: "TanStack Query & Router", definition: "Headless libraries for server-state caching and type-safe routing.", description: "Query caches, dedupes and refetches server data in any React app, Next.js included; Router gives typed routes and search params as state." },
    ],
    aspects: [["Kind", "Framework", "Framework", "Libraries"], ["Rendering model", "Server Components first", "SSR + client-first loaders", "Client (works anywhere)"], ["Routing", "File-based App Router", "TanStack Router (typed)", "Router: typed, code or file based"], ["Bundler", "Turbopack", "Vite", "Any"], ["Choose when", "Server-first apps, SEO, Vercel", "Type-safe full stack on Vite", "Adding caching or typed routing to any app"]],
  },
  {
    id: "n8n-langchain-langgraph", group: "AI & agents", source: LC,
    question: "What is the difference between n8n and LangChain and LangGraph?",
    summary: "n8n is a visual workflow-automation tool that connects apps with nodes and can call AI. LangChain and LangGraph are code frameworks for building the AI agents themselves.",
    techs: [
      { name: "n8n", definition: "A source-available workflow automation platform with a visual node editor and hundreds of integrations.", description: "Triggers, app nodes and AI nodes are wired on a canvas and run on n8n's engine; it suits business automations built by technical and non-technical people." },
      { name: "LangChain", definition: "A code framework with standard interfaces to models, tools and agent loops.", description: "You write the agent in Python or TypeScript with create_agent, tools and middleware, and ship it inside your own service." },
      { name: "LangGraph", definition: "A code-level orchestration runtime for stateful, long-running agents.", description: "Graphs of nodes give durable execution, human approvals and precise control over agent steps." },
    ],
    aspects: [["Interface", "Visual canvas", "Code", "Code"], ["Main job", "Automating workflows between apps", "Building agents and LLM features", "Orchestrating complex agents"], ["Integrations", "Built-in app nodes", "Model and tool integrations", "Uses LangChain or your own code"], ["Hosting", "n8n cloud or self-hosted", "Your service", "Your service or LangSmith deployment"], ["Best for", "Ops and business automations", "Developers adding AI features", "Production agents needing control"]],
  },
  {
    id: "langflow-langchain", group: "AI & agents",
    question: "What is the difference between LangFlow and LangChain?",
    summary: "LangFlow is a visual builder where you drag components into a flow and serve it as an API; LangChain is the code framework you would otherwise write the same pipeline in.",
    techs: [
      { name: "LangFlow", definition: "An open-source visual IDE for building and serving AI flows and agents.", description: "Components for models, prompts, vector stores and tools connect on a canvas, test in the Playground and run through an API or as an MCP server." },
      { name: "LangChain", definition: "A code framework for models, tools, retrieval and agents.", description: "Everything is expressed in Python or TypeScript, reviewed and tested like any other code, and deployed with your application." },
    ],
    aspects: [["Interface", "Drag-and-drop canvas", "Code"], ["Speed to prototype", "Very fast", "Fast for developers"], ["Version control", "Exported JSON flows", "Normal source code"], ["Custom logic", "Custom Python components", "Anything you can code"], ["Best for", "Prototypes, demos, mixed teams", "Production code and complex logic"]],
  },
  {
    id: "rag-finetuning-prompting", group: "AI & agents",
    question: "What is the difference among RAG, fine-tuning and prompt engineering?",
    summary: "Prompt engineering changes the instructions, RAG changes the knowledge the model sees at answer time, and fine-tuning changes the model's weights to change its behaviour.",
    techs: [
      { name: "Prompt engineering", definition: "Designing instructions, examples and format so a model behaves as needed.", description: "The cheapest lever: system prompts, few-shot examples and structured output. Try it first." },
      { name: "RAG", definition: "Retrieval-augmented generation: fetch relevant documents and give them to the model as context.", description: "Keeps answers grounded in your current data with citations, without retraining; quality depends on retrieval." },
      { name: "Fine-tuning", definition: "Further training a model on your examples to adjust its weights.", description: "Best for consistent style, format or narrow skills; it does not reliably add fresh facts and costs data and training." },
    ],
    aspects: [["Changes", "Instructions", "Context (knowledge)", "Model weights"], ["Fresh data", "No", "Yes, instantly", "Only after retraining"], ["Cost", "Lowest", "Medium (index + retrieval)", "Highest"], ["Citations", "No", "Yes", "No"], ["Use for", "Behaviour and format", "Facts from your documents", "Style, format, specialised skills"]],
  },
  {
    id: "agent-workflow-chatbot", group: "AI & agents",
    question: "What is the difference among an AI agent, an AI workflow and a chatbot?",
    summary: "A chatbot converses, a workflow runs predefined steps with LLM calls inside them, and an agent lets the model decide which steps and tools to use until the goal is met.",
    techs: [
      { name: "Chatbot", definition: "A conversational interface that answers messages, often with an LLM.", description: "Focused on dialogue; it may retrieve information but usually does not take actions on its own." },
      { name: "AI workflow", definition: "A fixed sequence of steps in code where some steps call an LLM.", description: "Predictable, testable and cheap; the developer, not the model, decides the path." },
      { name: "AI agent", definition: "A system where an LLM chooses tools and next steps in a loop to reach a goal.", description: "Flexible for open-ended tasks, but needs limits, evaluation and often human approval for risky actions." },
    ],
    aspects: [["Who decides the path", "Mostly scripted", "Developer", "Model"], ["Takes actions", "Rarely", "Yes, fixed", "Yes, chosen dynamically"], ["Predictability", "High", "High", "Lower"], ["Typical tools", "Chat UI + LLM", "Pipelines, LangGraph graphs", "Tool-calling loops"], ["Use for", "Q&A and support chat", "Known, repeatable processes", "Open-ended multi-step tasks"]],
  },
  {
    id: "mcp-a2a-function-calling", group: "AI & agents",
    question: "What is the difference among MCP, A2A and function calling?",
    summary: "Function calling is how a model asks to run a tool, MCP is a standard way to expose tools and data to any AI app, and A2A is a protocol for agents to talk to other agents.",
    techs: [
      { name: "Function calling", definition: "A model feature that returns a structured request to call one of the tools you described.", description: "Your code runs the tool and sends the result back; it is the building block underneath agents." },
      { name: "MCP", definition: "The Model Context Protocol: an open standard for exposing tools, resources and prompts to AI applications.", description: "Build a server once and any MCP client (IDEs, chat apps, agents) can discover and use its tools." },
      { name: "A2A", definition: "The Agent2Agent protocol for agents from different vendors to discover each other and collaborate.", description: "Agents publish capabilities and exchange tasks and messages, so one agent can delegate work to another." },
    ],
    aspects: [["Connects", "Model ↔ your code", "AI app ↔ tools and data", "Agent ↔ agent"], ["Scope", "One API call", "Reusable server", "Network of agents"], ["Standard", "Provider-specific formats", "Open protocol", "Open protocol"], ["Unit", "Tool call", "Tool / resource / prompt", "Task"], ["Use for", "Any tool use", "Sharing tools across apps", "Delegating between agents"]],
  },
  {
    id: "react-nextjs", group: "Frontend",
    question: "What is the difference between React and Next.js?",
    summary: "React is a library for building user interfaces from components; Next.js is a framework on top of React that adds routing, server rendering, data fetching, caching and deployment conventions.",
    techs: [
      { name: "React 19", definition: "A JavaScript library for building UIs from components and state.", description: "Hooks, Actions, use(), Server Components support and the React Compiler; routing and bundling are left to a framework." },
      { name: "Next.js 16", definition: "A React framework for full-stack web apps.", description: "Adds the App Router, server rendering, streaming, Cache Components, image and font optimisation, and API routes." },
    ],
    aspects: [["Type", "Library", "Framework"], ["Routing", "Not included", "File-based App Router"], ["Rendering", "Client by default", "Server Components, SSR, prerendering"], ["Data & caching", "Bring your own", "use cache, revalidation, fetch"], ["SEO", "Needs a framework", "Built in"]],
  },
  {
    id: "server-client-components", group: "Frontend",
    question: "What is the difference between React Server Components and Client Components?",
    summary: "Server Components render on the server, can read data directly and send no JavaScript; Client Components hydrate in the browser so they can use state, effects and event handlers.",
    techs: [
      { name: "Server Components", definition: "Components that run only on the server and stream their result to the browser.", description: "They can be async, read databases and secrets, and add nothing to the client bundle." },
      { name: "Client Components", definition: "Components marked with \"use client\" that render on the server and hydrate in the browser.", description: "They use useState, effects, browser APIs and event handlers, and their code ships to the client." },
    ],
    aspects: [["Runs in", "Server only", "Server render + browser"], ["JS sent", "None", "Component code"], ["State & effects", "No", "Yes"], ["Direct data access", "Yes (async)", "Via props, fetch or actions"], ["Use for", "Data, layout, static content", "Interactivity"]],
  },
  {
    id: "ssr-ssg-isr-ppr", group: "Frontend",
    question: "What is the difference among SSR, SSG, ISR and Partial Prerendering?",
    summary: "SSG builds HTML once, ISR rebuilds it in the background on a schedule, SSR renders on every request, and Partial Prerendering serves a static shell instantly while dynamic parts stream in.",
    techs: [
      { name: "SSG", definition: "Static site generation: HTML built at build time.", description: "Fastest and cheapest, served from a CDN; content only changes on rebuild." },
      { name: "ISR", definition: "Incremental static regeneration: static pages refreshed after a time or on demand.", description: "Static speed with periodic freshness; in Next.js 16 this is cacheLife and revalidateTag." },
      { name: "SSR", definition: "Server-side rendering on every request.", description: "Always fresh and personalised, but each request costs server time." },
      { name: "PPR", definition: "Partial Prerendering: a static shell plus streamed dynamic holes.", description: "Next.js 16 Cache Components ships the shell instantly and streams request-time parts inside Suspense." },
    ],
    aspects: [["Rendered", "At build", "At build + revalidation", "Every request", "Shell at build, holes per request"], ["Freshness", "Until rebuild", "Time or tag based", "Always", "Mixed per component"], ["Speed", "Fastest", "Fastest", "Slower", "Fast shell"], ["Personalisation", "No", "No", "Yes", "Yes, in holes"]],
  },
  {
    id: "javascript-typescript", group: "Frontend",
    question: "What is the difference between JavaScript and TypeScript?",
    summary: "TypeScript is JavaScript with a static type system; the types are checked while you write and build, then erased, so the code that runs is plain JavaScript.",
    techs: [
      { name: "JavaScript", definition: "The language of the web, dynamically typed and run by browsers and Node.js.", description: "Flexible and universal; type errors surface only at runtime." },
      { name: "TypeScript", definition: "A typed superset of JavaScript that compiles to JavaScript.", description: "Interfaces, generics, narrowing and editor tooling catch bugs early and make large codebases safer to change." },
    ],
    aspects: [["Typing", "Dynamic", "Static (checked at build)"], ["Runs directly", "Yes", "After compiling or type stripping"], ["Errors found", "At runtime", "In the editor and build"], ["Learning curve", "Lower", "Higher"], ["Best for", "Scripts, quick prototypes", "Teams and large apps"]],
  },
  {
    id: "node-express-nestjs", group: "Backend & APIs",
    question: "What is the difference among Node.js, Express and NestJS?",
    summary: "Node.js is the JavaScript runtime, Express is a minimal web framework running on it, and NestJS is an opinionated, structured framework that usually runs on top of Express or Fastify.",
    techs: [
      { name: "Node.js", definition: "A JavaScript runtime built on V8 with an event loop and non-blocking I/O.", description: "Runs servers, CLIs and tooling; its http module is low-level, so frameworks are built on top." },
      { name: "Express", definition: "A minimal, unopinionated web framework for Node.js.", description: "Routing and middleware with little structure; fast to start, structure is up to you." },
      { name: "NestJS", definition: "A TypeScript-first, opinionated framework for scalable server apps.", description: "Modules, providers, dependency injection, guards and pipes give large teams a consistent architecture." },
    ],
    aspects: [["Layer", "Runtime", "Web framework", "Application framework"], ["Opinionated", "No", "No", "Yes"], ["TypeScript", "Supported", "Optional", "First-class"], ["Architecture", "None", "Middleware chain", "Modules + DI"], ["Best for", "Anything server-side", "Small APIs, quick services", "Large, structured backends"]],
  },
  {
    id: "rest-graphql", group: "Backend & APIs",
    question: "What is the difference between REST and GraphQL?",
    summary: "REST exposes many resource URLs with fixed responses; GraphQL exposes one endpoint and a typed schema where the client asks for exactly the fields it needs.",
    techs: [
      { name: "REST", definition: "An architectural style using resource URLs and HTTP methods.", description: "Simple, cacheable with HTTP, widely understood; clients may over- or under-fetch." },
      { name: "GraphQL", definition: "A query language and runtime for APIs with a typed schema.", description: "One request fetches nested data in the shape the client asks for; needs care with N+1 queries, caching and query cost." },
    ],
    aspects: [["Endpoints", "Many", "One"], ["Response shape", "Server decides", "Client decides"], ["HTTP caching", "Easy", "Harder (POST, per query)"], ["Typing", "Optional (OpenAPI)", "Built-in schema"], ["Best for", "Simple public APIs", "Complex UIs with nested data"]],
  },
  {
    id: "fastapi-express", group: "Backend & APIs",
    question: "What is the difference between FastAPI and Express?",
    summary: "Both build HTTP APIs, but FastAPI is Python with type-hint validation and automatic OpenAPI docs, while Express is Node.js with a minimal middleware model.",
    techs: [
      { name: "FastAPI", definition: "A modern Python web framework for APIs based on type hints and Pydantic.", description: "Validation, serialisation and interactive OpenAPI docs come from your type hints; async support is built in." },
      { name: "Express", definition: "A minimal Node.js web framework built on middleware.", description: "Tiny core and huge ecosystem; validation and docs come from libraries you add." },
    ],
    aspects: [["Language", "Python", "JavaScript / TypeScript"], ["Validation", "Built in (Pydantic)", "Add a library (Zod, Joi)"], ["API docs", "Automatic OpenAPI", "Add a library"], ["Async", "async/await, ASGI", "Event loop"], ["Best for", "ML and data APIs, typed Python services", "JS teams, full-stack JavaScript"]],
  },
  {
    id: "zod-pydantic", group: "Backend & APIs",
    question: "What is the difference between Zod and Pydantic?",
    summary: "Both validate untrusted data at runtime and produce typed results: Zod is the TypeScript schema library, Pydantic is the Python model library behind FastAPI.",
    techs: [
      { name: "Zod", definition: "A TypeScript-first schema validation library.", description: "Define a schema once, parse unknown input, and infer the static type with z.infer." },
      { name: "Pydantic", definition: "A Python data validation library using type hints on model classes.", description: "BaseModel classes validate and coerce data, serialise to JSON and power FastAPI and settings management." },
    ],
    aspects: [["Language", "TypeScript", "Python"], ["Defines", "Schemas", "Model classes"], ["Static types", "Inferred from schema", "From type hints"], ["Coercion", "Opt-in (z.coerce)", "On by default (lax mode)"], ["Common with", "Next.js, tRPC, forms", "FastAPI, settings, LLM output"]],
  },
  {
    id: "jest-vitest", group: "Testing",
    question: "What is the difference between Jest and Vitest?",
    summary: "Both are unit test runners with a similar API; Vitest is built on Vite, so it shares your Vite config and is very fast with native ESM, while Jest is the long-established standard.",
    techs: [
      { name: "Jest", definition: "A JavaScript test runner with matchers, mocks, snapshots and coverage.", description: "Mature and widely used; transforms code with Babel or SWC and has historically needed extra setup for ESM." },
      { name: "Vitest", definition: "A Vite-powered test runner with a Jest-compatible API.", description: "Reuses Vite's transforms and plugins, has fast watch mode, native ESM and TypeScript, and a browser mode." },
    ],
    aspects: [["Built on", "Its own runtime", "Vite"], ["ESM / TS", "Needs config", "Native"], ["API", "jest.fn, expect", "vi.fn, expect (compatible)"], ["Speed", "Good", "Very fast in watch mode"], ["Best for", "Existing Jest projects, React Native", "Vite projects, new codebases"]],
  },
  {
    id: "playwright-cypress", group: "Testing",
    question: "What is the difference between Playwright and Cypress?",
    summary: "Both run end-to-end tests in real browsers. Playwright drives browsers from outside with multi-browser and multi-tab support; Cypress runs inside the browser with an interactive runner.",
    techs: [
      { name: "Playwright", definition: "A Microsoft end-to-end testing framework for Chromium, Firefox and WebKit.", description: "Auto-waiting locators, parallel runs, multiple tabs and origins, traces and a built-in test runner." },
      { name: "Cypress", definition: "A JavaScript end-to-end and component testing tool that runs in the browser.", description: "Time-travel debugging in an interactive runner, automatic retries and cy.intercept for network control." },
    ],
    aspects: [["Browsers", "Chromium, Firefox, WebKit", "Chromium family, Firefox, WebKit (experimental)"], ["Multiple tabs / origins", "Yes", "Limited"], ["Languages", "JS/TS, Python, Java, .NET", "JavaScript / TypeScript"], ["Parallelism", "Built in, free", "Via Cypress Cloud or CI split"], ["Debugging", "Trace viewer", "Interactive time-travel runner"]],
  },
  {
    id: "unit-integration-e2e", group: "Testing",
    question: "What is the difference among unit tests, integration tests and end-to-end tests?",
    summary: "Unit tests check one piece in isolation, integration tests check pieces working together, and end-to-end tests drive the real app in a browser the way a user would.",
    techs: [
      { name: "Unit tests", definition: "Fast tests of a single function or component in isolation.", description: "Jest or Vitest with React Testing Library; many of them, run on every change." },
      { name: "Integration tests", definition: "Tests of several units together, such as a component with its data layer.", description: "Catch wiring mistakes that unit tests miss; mock only external services." },
      { name: "End-to-end tests", definition: "Tests that drive the full application in a real browser.", description: "Playwright or Cypress; slowest and fewest, covering critical user journeys." },
    ],
    aspects: [["Scope", "One unit", "Several units", "Whole app"], ["Speed", "Milliseconds", "Seconds", "Seconds to minutes"], ["How many", "Most", "Some", "Fewest"], ["Tools", "Jest, Vitest", "Vitest + RTL, Supertest", "Playwright, Cypress"], ["Catches", "Logic bugs", "Wiring bugs", "Broken user journeys"]],
  },
  {
    id: "tanstack-query-rtk-query", group: "State & data fetching",
    question: "What is the difference between TanStack Query and RTK Query?",
    summary: "Both cache server data, dedupe requests and refetch in the background. TanStack Query is standalone and framework-agnostic; RTK Query is built into Redux Toolkit and stores its cache in the Redux store.",
    techs: [
      { name: "TanStack Query", definition: "A standalone library for fetching, caching and updating server state.", description: "Query keys, stale times, mutations, invalidation, infinite queries and SSR hydration, in React, Vue, Solid and more." },
      { name: "RTK Query", definition: "Redux Toolkit's data fetching and caching layer.", description: "Endpoints defined in createApi generate hooks; cache lives in Redux with tag-based invalidation." },
    ],
    aspects: [["Requires Redux", "No", "Yes"], ["Definition style", "Per-call query keys", "Central API with endpoints"], ["Invalidation", "Query keys", "Tags"], ["Frameworks", "React, Vue, Solid, Svelte, Angular", "React (and any Redux app)"], ["Best for", "Most apps", "Apps already on Redux Toolkit"]],
  },
  {
    id: "context-zustand-redux", group: "State & data fetching",
    question: "What is the difference among React Context, Zustand and Redux for global state?",
    summary: "Context passes values down the tree but re-renders every consumer on change; Zustand and Redux keep state in an external store and let components subscribe to just the slice they need.",
    techs: [
      { name: "React Context", definition: "A built-in way to pass a value to deep components without props.", description: "Ideal for rarely changing values like theme or auth; frequent updates re-render all consumers." },
      { name: "Zustand", definition: "A small external store with hook-based selectors.", description: "Components re-render only when their selected slice changes; minimal API." },
      { name: "Redux (Toolkit)", definition: "A single external store updated through actions and reducers.", description: "Structured, traceable updates with DevTools and middleware for large apps." },
    ],
    aspects: [["Built in", "Yes", "No", "No"], ["Re-render control", "All consumers", "Selector-based", "Selector-based"], ["Boilerplate", "Low", "Very low", "Medium with RTK"], ["DevTools", "React DevTools", "Redux DevTools via middleware", "Redux DevTools"], ["Use for", "Theme, locale, auth user", "App state in small/mid apps", "Complex shared state, big teams"]],
  },
  {
    id: "sql-nosql", group: "Data & storage",
    question: "What is the difference between SQL and NoSQL databases (PostgreSQL vs MongoDB)?",
    summary: "SQL databases store related tables with a fixed schema, joins and strong transactions; NoSQL databases such as MongoDB store flexible documents and scale out easily, trading some relational power.",
    techs: [
      { name: "PostgreSQL", definition: "An open-source relational database with SQL, ACID transactions and rich types.", description: "Joins, constraints, JSONB, full-text search and extensions such as pgvector make it a strong default." },
      { name: "MongoDB", definition: "A document database storing JSON-like documents in collections.", description: "Flexible schemas, nested documents and built-in sharding; data modelled around access patterns." },
    ],
    aspects: [["Data model", "Tables and rows", "Documents"], ["Schema", "Defined up front", "Flexible"], ["Joins", "Native, powerful", "$lookup, usually embed instead"], ["Transactions", "Full ACID", "Multi-document supported"], ["Best for", "Relational data, reporting, money", "Varied documents, fast iteration"]],
  },
  {
    id: "prisma-drizzle-mongoose", group: "Data & storage",
    question: "What is the difference among Prisma, Drizzle and Mongoose?",
    summary: "Prisma and Drizzle are type-safe ORMs for SQL databases (Prisma with its own schema language, Drizzle with SQL-like TypeScript); Mongoose is the object modelling library for MongoDB.",
    techs: [
      { name: "Prisma", definition: "A TypeScript ORM with a schema file, generated client and migrations.", description: "Readable queries and strong types from schema.prisma; adds a generation step and its own query engine layer." },
      { name: "Drizzle", definition: "A lightweight TypeScript ORM whose queries look like SQL.", description: "Schemas are TypeScript, queries are close to SQL, and it stays small for serverless and edge use." },
      { name: "Mongoose", definition: "An ODM for MongoDB with schemas, validation and middleware.", description: "Adds structure, casting and hooks to MongoDB documents in Node.js." },
    ],
    aspects: [["Database", "SQL (and MongoDB)", "SQL", "MongoDB"], ["Schema defined in", "schema.prisma", "TypeScript", "JavaScript / TS schemas"], ["Query style", "Object API", "SQL-like builder", "Model methods"], ["Migrations", "Prisma Migrate", "drizzle-kit", "Not applicable"], ["Best for", "Productivity, readable data access", "Lean, SQL-minded teams", "Node apps on MongoDB"]],
  },
  {
    id: "redis-postgres-cache", group: "Data & storage",
    question: "What is the difference between Redis and a database like PostgreSQL?",
    summary: "Redis keeps data in memory for microsecond reads and rich data structures, so it is used as a cache, queue or rate limiter; PostgreSQL is the durable system of record with SQL and transactions.",
    techs: [
      { name: "Redis", definition: "An in-memory data store with strings, hashes, lists, sets, sorted sets and streams.", description: "Extremely fast, with TTLs, Pub/Sub and atomic commands; persistence is optional and memory is the limit." },
      { name: "PostgreSQL", definition: "A durable relational database on disk.", description: "Stores the source of truth with constraints, transactions and complex queries." },
    ],
    aspects: [["Storage", "Memory (optional persistence)", "Disk"], ["Latency", "Sub-millisecond", "Milliseconds"], ["Query power", "Key and structure commands", "Full SQL"], ["Typical role", "Cache, sessions, queues, rate limits", "System of record"], ["Data size", "Bounded by RAM", "Very large"]],
  },
  {
    id: "supabase-neon-firebase", group: "Data & storage",
    question: "What is the difference among Supabase, Neon and Firebase?",
    summary: "Supabase is a Postgres-based backend platform with auth, storage and APIs; Neon is serverless Postgres with branching; Firebase is Google's NoSQL backend platform.",
    techs: [
      { name: "Supabase", definition: "An open-source backend platform built on PostgreSQL.", description: "Postgres with auth, row-level security, storage, realtime and edge functions in one project." },
      { name: "Neon", definition: "Serverless PostgreSQL with separated storage and compute.", description: "Scales to zero, autoscales and creates instant database branches for previews and tests." },
      { name: "Firebase", definition: "Google's backend platform with Firestore, auth and hosting.", description: "Realtime NoSQL documents with client SDKs and security rules; strong for mobile apps." },
    ],
    aspects: [["Database", "PostgreSQL", "PostgreSQL", "Firestore (NoSQL)"], ["Auth & storage", "Included", "Bring your own", "Included"], ["Branching", "Available", "Core feature", "No"], ["Open source", "Yes", "Core is open source", "No"], ["Best for", "Full backend on Postgres", "Postgres for serverless apps", "Mobile and realtime NoSQL apps"]],
  },
  {
    id: "clerk-authjs-betterauth", group: "Backend & APIs",
    question: "What is the difference among Clerk, Auth.js and Better Auth?",
    summary: "Clerk is a hosted authentication service with ready-made UI; Auth.js and Better Auth are open-source libraries you run in your own app, with Better Auth offering a broader built-in feature set.",
    techs: [
      { name: "Clerk", definition: "A hosted user-management and authentication service.", description: "Prebuilt sign-in components, organisations, MFA and session management; you pay per active user." },
      { name: "Auth.js", definition: "An open-source authentication library (formerly NextAuth.js).", description: "OAuth providers, email and credentials with adapters for your database; you own the data and UI." },
      { name: "Better Auth", definition: "A framework-agnostic TypeScript authentication library.", description: "Email and password, OAuth, two-factor, organisations and plugins, running in your own app and database." },
    ],
    aspects: [["Hosting", "Hosted service", "Your app", "Your app"], ["UI", "Prebuilt components", "Build your own", "Build your own"], ["Data ownership", "Clerk", "You", "You"], ["Cost", "Per user", "Free", "Free"], ["Best for", "Fastest, full-featured setup", "Next.js OAuth sign-in", "Self-hosted, feature-rich auth"]],
  },
  {
    id: "lambda-ec2-ecs", group: "Cloud & DevOps",
    question: "What is the difference among AWS Lambda, EC2 and ECS?",
    summary: "EC2 gives you virtual servers to manage, ECS runs your containers on managed infrastructure, and Lambda runs functions on demand with no servers to manage and pay-per-use pricing.",
    techs: [
      { name: "AWS Lambda", definition: "Serverless functions run on events and billed per request and duration.", description: "Scales automatically to zero; limited run time and cold starts are the trade-offs." },
      { name: "Amazon EC2", definition: "Virtual machines you configure and manage.", description: "Full control of OS, runtime and networking; you handle patching and scaling." },
      { name: "Amazon ECS", definition: "A managed container orchestration service, on EC2 or Fargate.", description: "Runs Docker containers as services or tasks; with Fargate there are no servers to manage." },
    ],
    aspects: [["Unit", "Function", "Virtual machine", "Container"], ["Server management", "None", "Full", "None with Fargate"], ["Scaling", "Automatic, to zero", "Auto Scaling groups", "Service auto scaling"], ["Pricing", "Per request and ms", "Per instance hour", "Per task resources"], ["Best for", "Event-driven, spiky work", "Full control, long-running", "Containerised services"]],
  },
  {
    id: "docker-kubernetes", group: "Cloud & DevOps",
    question: "What is the difference between Docker and Kubernetes?",
    summary: "Docker packages and runs containers; Kubernetes orchestrates many containers across many machines, handling scheduling, scaling, networking and self-healing.",
    techs: [
      { name: "Docker", definition: "A platform for building and running containers from images.", description: "Dockerfiles define images; docker run and Compose start containers on one host." },
      { name: "Kubernetes", definition: "An open-source system for orchestrating containers across a cluster.", description: "Deployments, Services and autoscaling keep the desired number of healthy containers running." },
    ],
    aspects: [["Job", "Build and run containers", "Orchestrate containers"], ["Scope", "Single host", "Cluster of hosts"], ["Scaling", "Manual / Compose", "Automatic"], ["Self-healing", "Restart policies", "Reschedules failed pods"], ["Use together", "Builds the images", "Runs them at scale"]],
  },
  {
    id: "git-github-actions", group: "Cloud & DevOps",
    question: "What is the difference among Git, GitHub and GitHub Actions?",
    summary: "Git is the version-control tool on your machine, GitHub hosts Git repositories with collaboration features, and GitHub Actions runs automated workflows (CI/CD) on GitHub events.",
    techs: [
      { name: "Git", definition: "A distributed version-control system.", description: "Commits, branches, merges and rebases track history locally and sync with remotes." },
      { name: "GitHub", definition: "A hosting platform for Git repositories.", description: "Pull requests, reviews, issues, permissions and project tools around your repositories." },
      { name: "GitHub Actions", definition: "GitHub's automation and CI/CD service.", description: "YAML workflows run jobs on runners when you push, open a PR, on a schedule or manually." },
    ],
    aspects: [["Kind", "Tool", "Platform", "Automation service"], ["Runs", "On your machine", "In the cloud", "On hosted or self-hosted runners"], ["Key objects", "Commits, branches", "Repos, pull requests", "Workflows, jobs, steps"], ["Works offline", "Yes", "No", "No"], ["Use for", "Tracking changes", "Collaboration", "Testing and deploying automatically"]],
  },
  {
    id: "git-merge-rebase", group: "Cloud & DevOps",
    question: "What is the difference between git merge and git rebase?",
    summary: "Merge joins two branches with a merge commit and keeps history as it happened; rebase replays your commits on top of another branch for a straight line, rewriting their hashes.",
    techs: [
      { name: "git merge", definition: "Combines another branch into the current one, adding a merge commit when histories diverged.", description: "Safe on shared branches because existing commits are untouched." },
      { name: "git rebase", definition: "Moves your commits to start from a new base commit.", description: "Gives a linear, readable history; never rebase commits others already pulled." },
    ],
    aspects: [["History", "True, branched", "Linear, rewritten"], ["New commits", "One merge commit", "Copies of your commits"], ["Safe on shared branches", "Yes", "No"], ["Conflict handling", "Once", "Per replayed commit"], ["Use for", "Integrating shared branches", "Cleaning up your own branch"]],
  },
  {
    id: "monolith-microservices", group: "Architecture",
    question: "What is the difference between a monolith and microservices?",
    summary: "A monolith deploys one application and one codebase; microservices split the system into independently deployable services that talk over the network, trading simplicity for team and scaling independence.",
    techs: [
      { name: "Monolith", definition: "One deployable application containing all features.", description: "Simple to build, test and deploy; can become hard to change and scale as teams grow." },
      { name: "Microservices", definition: "Many small services, each owning a capability and its data.", description: "Teams deploy and scale independently, at the cost of network calls, distributed data and operations work." },
    ],
    aspects: [["Deploys", "One unit", "Many independent units"], ["Data", "Shared database", "Database per service"], ["Complexity", "Low at first", "High (network, observability)"], ["Scaling", "Whole app", "Per service"], ["Best for", "Early products, small teams", "Large orgs with clear domains"]],
  },
  {
    id: "sqs-sns-kafka", group: "Architecture",
    question: "What is the difference among SQS, SNS and Kafka?",
    summary: "SQS is a queue where each message is processed by one consumer, SNS fans one message out to many subscribers, and Kafka is a durable, replayable log read by many consumer groups.",
    techs: [
      { name: "Amazon SQS", definition: "A fully managed message queue.", description: "Producers enqueue, one consumer processes each message, with retries and dead-letter queues." },
      { name: "Amazon SNS", definition: "A managed publish/subscribe service.", description: "One published message is pushed to many subscribers: queues, Lambdas, HTTP endpoints, email or SMS." },
      { name: "Apache Kafka", definition: "A distributed, partitioned and replicated event log.", description: "Consumer groups read at their own pace, events are retained and can be replayed, with ordering per partition." },
    ],
    aspects: [["Pattern", "Queue (point-to-point)", "Pub/sub fan-out", "Log / streaming"], ["Retention", "Up to 14 days, deleted when processed", "Not stored", "Configurable, replayable"], ["Ordering", "FIFO queues", "FIFO topics", "Per partition"], ["Operations", "Fully managed", "Fully managed", "Self-managed or MSK / Confluent"], ["Best for", "Background jobs", "Notifications, fan-out", "Event streaming, analytics"]],
  },
  {
    id: "inngest-queues-cron", group: "Architecture",
    question: "What is the difference among Inngest, a job queue and a cron job?",
    summary: "A cron job runs on a schedule, a job queue runs work in the background when it is enqueued, and Inngest runs durable, event-driven functions with steps, retries and scheduling built in.",
    techs: [
      { name: "Cron job", definition: "A task that runs on a fixed schedule.", description: "Simple and good for periodic work; no built-in retries, state or fan-out." },
      { name: "Job queue", definition: "A queue plus workers that process enqueued jobs in the background (for example BullMQ or SQS).", description: "Decouples slow work from requests with retries; you run and scale the workers." },
      { name: "Inngest", definition: "A durable workflow platform for event-driven background functions.", description: "Functions triggered by events or schedules run in steps that are retried and resumed independently, without managing queues." },
    ],
    aspects: [["Trigger", "Time", "Enqueued job", "Events and schedules"], ["Retries", "No", "Yes", "Yes, per step"], ["Multi-step state", "No", "Manual", "Built in (steps)"], ["Infrastructure", "Scheduler", "Queue + workers", "Managed service + your endpoint"], ["Best for", "Periodic maintenance", "High-volume background jobs", "Reliable multi-step workflows"]],
  },
  {
    id: "python-javascript", group: "Python & data",
    question: "What is the difference between Python and JavaScript?",
    summary: "Python is a general-purpose language strong in data science, AI and scripting; JavaScript is the language of the web, running in browsers and on servers with Node.js.",
    techs: [
      { name: "Python", definition: "A readable, dynamically typed, general-purpose language.", description: "Rich ecosystem for data, ML and automation: pandas, NumPy, PyTorch, FastAPI." },
      { name: "JavaScript", definition: "A dynamically typed language for the web.", description: "Runs in every browser and on Node.js; React, Next.js and npm power full-stack apps." },
    ],
    aspects: [["Main home", "Data, AI, scripting, backends", "Web front ends and full stack"], ["Concurrency", "asyncio, threads (GIL)", "Event loop, async/await"], ["Typing", "Optional type hints", "Optional via TypeScript"], ["Package manager", "pip, uv", "npm, pnpm"], ["Best for", "ML, data analysis, automation", "Interactive web apps"]],
  },
  {
    id: "pandas-polars-numpy", group: "Python & data",
    question: "What is the difference among pandas, Polars and NumPy?",
    summary: "NumPy provides fast n-dimensional arrays, pandas builds labelled DataFrames for analysis on top of them, and Polars is a newer, multi-threaded DataFrame library with a lazy query engine.",
    techs: [
      { name: "NumPy", definition: "The core library for numerical arrays and vectorised math in Python.", description: "Fast homogeneous arrays, broadcasting and linear algebra underpin most of scientific Python." },
      { name: "pandas", definition: "A DataFrame library for labelled, tabular data analysis.", description: "Indexing, group-by, joins, time series and I/O; the default for analysis in notebooks." },
      { name: "Polars", definition: "A fast DataFrame library written in Rust with an expression API.", description: "Multi-threaded, columnar (Arrow) and lazy query optimisation for large datasets." },
    ],
    aspects: [["Data structure", "ndarray", "DataFrame / Series", "DataFrame / LazyFrame"], ["Labels", "No", "Index and columns", "Columns (no index)"], ["Performance", "Very fast numerics", "Good, mostly single-threaded", "Very fast, multi-threaded"], ["Execution", "Eager", "Eager", "Eager or lazy"], ["Best for", "Math and arrays", "Everyday analysis", "Large data and pipelines"]],
  },
  {
    id: "pytorch-tensorflow", group: "Python & data",
    question: "What is the difference between PyTorch and TensorFlow (with Keras)?",
    summary: "Both train deep-learning models on GPUs. PyTorch is Pythonic with eager execution and dominates research; TensorFlow with Keras offers a high-level API and strong production and mobile deployment tooling.",
    techs: [
      { name: "PyTorch", definition: "An open-source deep-learning framework with dynamic computation graphs.", description: "Feels like regular Python, easy to debug, with torch.compile for speed; most new research and LLM work uses it." },
      { name: "TensorFlow + Keras", definition: "Google's deep-learning platform with Keras as its high-level API.", description: "Keras makes models concise; TensorFlow Serving, Lite and JS help deploy to servers, mobile and browsers." },
    ],
    aspects: [["Style", "Pythonic, eager", "High-level Keras, graph compilation"], ["Debugging", "Standard Python tools", "Harder inside compiled graphs"], ["Research use", "Dominant", "Smaller share"], ["Deployment", "TorchScript, ONNX, serving tools", "TF Serving, TF Lite, TF.js"], ["Best for", "Research, LLMs, custom models", "Production pipelines, mobile"]],
  },
  {
    id: "vercel-ai-sdk-langchain", group: "AI & agents",
    question: "What is the difference between the Vercel AI SDK and LangChain?",
    summary: "The AI SDK is a TypeScript toolkit focused on calling models, streaming to UIs and tool calling in web apps; LangChain is an agent framework with broad integrations, retrieval and agent harnesses in Python and TypeScript.",
    techs: [
      { name: "Vercel AI SDK", definition: "A TypeScript toolkit for building AI features in web apps.", description: "Unified model API, streaming text and structured output, tool calling and React hooks for chat UIs." },
      { name: "LangChain", definition: "An agent framework with standard interfaces to models, tools and retrieval.", description: "create_agent with middleware, document loaders, vector stores and many integrations, in Python and TypeScript." },
    ],
    aspects: [["Languages", "TypeScript", "Python and TypeScript"], ["Focus", "Model calls and streaming UI", "Agents, retrieval, integrations"], ["UI hooks", "Yes (useChat)", "No (bring your own)"], ["Integrations", "Model providers", "Models, vector stores, loaders, tools"], ["Best for", "Chat and AI features in web apps", "Agents and RAG pipelines"]],
  },
];

export const comparison = (id: string) => COMPARISONS.find(item => item.id === id);

/** Each comparison's question bank as its own chunk. */
const LOADERS: Record<string, () => Promise<{ default: QuestionSet }>> = {
  "langchain-langgraph-langsmith": () => import("./banks/langchain-langgraph-langsmith"),
  "redux-zustand-rtk": () => import("./banks/redux-zustand-rtk"),
  "nextjs-tanstack": () => import("./banks/nextjs-tanstack"),
};

export const hasComparisonBank = (id: string) => id in LOADERS;
export async function loadComparisonBank(id: string): Promise<QuestionSet> {
  const load = LOADERS[id];
  return load ? (await load()).default : { subjective: [], objective: [] };
}
