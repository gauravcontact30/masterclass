import { GUIDE_EXTRAS } from "./guide-extras";
import type { LibraryGuide, StepCategory, StepLevel } from "./types";

/** A guide as written below; its pointwise extras live in `guide-extras.ts`. */
type BaseGuide = Omit<LibraryGuide, "definitionPoints" | "answerPoints" | "features" | "useCases">;

/**
 * Built-in step-by-step guides. They are the answer when AI Mode is off or no
 * provider is configured, and the starter cards before anything is asked, so
 * each one is complete: every file it imports is in `files`, and every step
 * says which command it runs and why.
 */
const BASE_GUIDES: BaseGuide[] = [
  {
    id: "nextjs-protected-routes",
    question: "How do I protect routes in Next.js with proxy.ts and a session cookie?",
    category: "Next.js", level: "intermediate",
    tags: ["proxy", "middleware", "auth", "redirect", "cookies", "app router"],
    definition: "Route protection stops signed-out visitors from reaching private pages. In Next.js 16 the `proxy.ts` file (formerly `middleware.ts`) runs before a route renders, so it can redirect a request that carries no session.",
    answer: "Create `proxy.ts` at the project root, read the session cookie from `request.cookies`, redirect to `/login` when it is missing, and limit the proxy to private paths with `config.matcher`. Re-check the session inside the page too, because the proxy is an optimistic gate, not your only check.",
    steps: [
      { title: "Create the app", detail: "Start from a fresh App Router project so `app/` and the project root exist where Next.js looks for `proxy.ts`.", file: "",
        commands: [{ command: "npx create-next-app@latest secure-app --ts --app", description: "Scaffolds a TypeScript App Router project named secure-app." }, { command: "cd secure-app && npm run dev", description: "Enters the project and starts the dev server on http://localhost:3000." }], code: "" },
      { title: "Add a session helper", detail: "Keep the cookie name and the check in one module so the proxy, the login action and the page agree on what a session is.", file: "/lib/session.ts", commands: [], code: "export const SESSION_COOKIE = \"session\";\nexport function isValidSession(value?: string) {\n  return typeof value === \"string\" && value.length > 10;\n}" },
      { title: "Write proxy.ts", detail: "Export a `proxy` function. It runs before rendering; when the cookie is missing it redirects to `/login` and remembers where the visitor was going.", file: "/proxy.ts", commands: [], code: "export function proxy(request: NextRequest) {\n  const token = request.cookies.get(SESSION_COOKIE)?.value;\n  if (!isValidSession(token)) {\n    const url = new URL(\"/login\", request.url);\n    url.searchParams.set(\"from\", request.nextUrl.pathname);\n    return NextResponse.redirect(url);\n  }\n  return NextResponse.next();\n}" },
      { title: "Limit it with a matcher", detail: "Without a matcher the proxy runs on every request, including static assets. Target only the private area.", file: "/proxy.ts", commands: [], code: "export const config = { matcher: [\"/dashboard/:path*\"] };" },
      { title: "Sign in with a server action", detail: "The login form posts to a server action that sets an httpOnly cookie and redirects back.", file: "/app/login/actions.ts", commands: [], code: "" },
      { title: "Verify in the browser", detail: "Visit `/dashboard` signed out: you land on `/login?from=/dashboard`. Sign in and the same URL renders.", file: "",
        commands: [{ command: "curl -I http://localhost:3000/dashboard", description: "Shows the 307 redirect and its Location header when no cookie is sent." }], code: "" },
    ],
    files: [
      { path: "/proxy.ts", note: "Runs before every /dashboard request.", code: "import { NextResponse } from \"next/server\";\nimport type { NextRequest } from \"next/server\";\nimport { SESSION_COOKIE, isValidSession } from \"./lib/session\";\n\nexport function proxy(request: NextRequest) {\n  const token = request.cookies.get(SESSION_COOKIE)?.value;\n  if (!isValidSession(token)) {\n    const url = new URL(\"/login\", request.url);\n    url.searchParams.set(\"from\", request.nextUrl.pathname);\n    return NextResponse.redirect(url);\n  }\n  return NextResponse.next();\n}\n\nexport const config = { matcher: [\"/dashboard/:path*\"] };\n" },
      { path: "/lib/session.ts", note: "One definition of a session.", code: "export const SESSION_COOKIE = \"session\";\n\nexport function isValidSession(value?: string) {\n  return typeof value === \"string\" && value.length > 10;\n}\n" },
      { path: "/app/login/actions.ts", note: "Sets the cookie on the server.", code: "\"use server\";\n\nimport { cookies } from \"next/headers\";\nimport { redirect } from \"next/navigation\";\nimport { randomUUID } from \"node:crypto\";\nimport { SESSION_COOKIE } from \"@/lib/session\";\n\nexport async function signIn(formData: FormData) {\n  const email = String(formData.get(\"email\") ?? \"\");\n  const from = String(formData.get(\"from\") || \"/dashboard\");\n  if (!email.includes(\"@\")) redirect(\"/login?error=email\");\n  const store = await cookies();\n  store.set(SESSION_COOKIE, randomUUID(), { httpOnly: true, sameSite: \"lax\", secure: true, path: \"/\" });\n  redirect(from.startsWith(\"/\") ? from : \"/dashboard\");\n}\n" },
      { path: "/app/login/page.tsx", note: "The form posts to the server action.", code: "import { signIn } from \"./actions\";\n\nexport default async function LoginPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {\n  const { from = \"/dashboard\" } = await searchParams;\n  return (\n    <form action={signIn}>\n      <input type=\"hidden\" name=\"from\" value={from} />\n      <input name=\"email\" type=\"email\" placeholder=\"you@example.com\" required />\n      <button type=\"submit\">Sign in</button>\n    </form>\n  );\n}\n" },
      { path: "/app/dashboard/page.tsx", note: "Checks again on the server.", code: "import { cookies } from \"next/headers\";\nimport { redirect } from \"next/navigation\";\nimport { SESSION_COOKIE, isValidSession } from \"@/lib/session\";\n\nexport default async function DashboardPage() {\n  const store = await cookies();\n  if (!isValidSession(store.get(SESSION_COOKIE)?.value)) redirect(\"/login\");\n  return <h1>Private dashboard</h1>;\n}\n" },
    ],
    comparison: {"items":[{"name":"proxy.ts (Proxy)","summary":"Runs before a route renders and can redirect or rewrite the request.","points":["Configured once with `config.matcher` for many routes","Sees only the request: cookies, headers, URL","Should stay fast and avoid database calls"],"bestFor":"Redirecting signed-out visitors away from whole sections quickly."},{"name":"Page / layout check","summary":"A session check inside the Server Component or data function that reads private data.","points":["Runs next to the data it protects","Can query the database and verify the session fully","Must be repeated wherever private data is read"],"bestFor":"The authoritative check before returning private data."}],"differences":[{"aspect":"When it runs","values":["Before rendering, on every matched request","During rendering of that page or layout"]},{"aspect":"Scope","values":["Many routes at once through the matcher","One page, layout or data function"]},{"aspect":"Data access","values":["Request only; keep it lightweight","Full server access, including the database"]},{"aspect":"Role","values":["Optimistic gate and redirect","Authoritative authorization check"]}]},
    keyPoints: ["`middleware.ts` is deprecated in Next.js 16; the file and function are now `proxy`.", "Always set `config.matcher`, or the proxy also runs for CSS, JS and images.", "The proxy is an optimistic check; verify the session again where data is read.", "Store sessions in `httpOnly`, `secure`, `sameSite` cookies so client scripts cannot read them.", "Only redirect to relative paths from `from` to avoid open redirects."],
  },
  {
    id: "nextjs-server-action-form",
    question: "How do I build a validated form with Server Actions and useActionState in Next.js?",
    category: "Next.js", level: "beginner",
    tags: ["server actions", "forms", "useActionState", "zod", "validation"],
    definition: "A Server Action is an async function marked `\"use server\"` that a `<form>` can call directly. `useActionState` wraps it on the client so the form can show the returned errors and a pending state.",
    answer: "Write an action with the signature `(prevState, formData)`, validate the fields with Zod, and return either field errors or a success message. In a Client Component call `useActionState(action, initialState)` and bind the returned `formAction` to the form.",
    steps: [
      { title: "Install Zod", detail: "Zod turns untrusted form fields into typed data and readable errors.", file: "",
        commands: [{ command: "npm install zod", description: "Adds the Zod validation library." }, { command: "pnpm add zod", description: "Same install with pnpm." }], code: "" },
      { title: "Describe the form's state", detail: "One shared type keeps the action's return value and the form's rendering in step.", file: "/app/contact/state.ts", commands: [], code: "export type ContactState = { message: string; errors: Partial<Record<\"name\" | \"email\", string[]>> };" },
      { title: "Write the Server Action", detail: "With `useActionState` the action receives the previous state first and `FormData` second. Return errors instead of throwing so the form can show them.", file: "/app/contact/actions.ts", commands: [], code: "const parsed = schema.safeParse(Object.fromEntries(formData));\nif (!parsed.success) return { message: \"\", errors: z.flattenError(parsed.error).fieldErrors };" },
      { title: "Bind it in a Client Component", detail: "`useActionState` returns the latest state, the action to put on the form, and a `pending` flag for the button.", file: "/app/contact/contact-form.tsx", commands: [], code: "const [state, formAction, pending] = useActionState(sendMessage, initialState);" },
      { title: "Render it from the page", detail: "The page stays a Server Component and simply renders the form.", file: "/app/contact/page.tsx", commands: [], code: "" },
    ],
    files: [
      { path: "/app/contact/state.ts", note: "Shared shape of the form result.", code: "export type ContactState = {\n  message: string;\n  errors: Partial<Record<\"name\" | \"email\", string[]>>;\n};\n\nexport const initialState: ContactState = { message: \"\", errors: {} };\n" },
      { path: "/app/contact/actions.ts", note: "Validates on the server.", code: "\"use server\";\n\nimport { z } from \"zod\";\nimport type { ContactState } from \"./state\";\n\nconst schema = z.object({\n  name: z.string().trim().min(2, \"Name is too short\"),\n  email: z.email(\"Enter a valid email\"),\n});\n\nexport async function sendMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {\n  const parsed = schema.safeParse(Object.fromEntries(formData));\n  if (!parsed.success) return { message: \"\", errors: z.flattenError(parsed.error).fieldErrors };\n  // Save parsed.data to your database here.\n  return { message: \"Thanks, \" + parsed.data.name + \"!\", errors: {} };\n}\n" },
      { path: "/app/contact/contact-form.tsx", note: "Shows errors and pending state.", code: "\"use client\";\n\nimport { useActionState } from \"react\";\nimport { sendMessage } from \"./actions\";\nimport { initialState } from \"./state\";\n\nexport function ContactForm() {\n  const [state, formAction, pending] = useActionState(sendMessage, initialState);\n  return (\n    <form action={formAction}>\n      <input name=\"name\" placeholder=\"Name\" />\n      {state.errors.name && <p role=\"alert\">{state.errors.name[0]}</p>}\n      <input name=\"email\" placeholder=\"Email\" />\n      {state.errors.email && <p role=\"alert\">{state.errors.email[0]}</p>}\n      <button disabled={pending}>{pending ? \"Sending...\" : \"Send\"}</button>\n      {state.message && <p aria-live=\"polite\">{state.message}</p>}\n    </form>\n  );\n}\n" },
      { path: "/app/contact/page.tsx", note: "Server Component page.", code: "import { ContactForm } from \"./contact-form\";\n\nexport default function ContactPage() {\n  return (\n    <main>\n      <h1>Contact us</h1>\n      <ContactForm />\n    </main>\n  );\n}\n" },
    ],
    comparison: {"items":[{"name":"Server Actions","summary":"Async `\"use server\"` functions a form or component calls directly.","points":["Invoked with POST by React, no URL to design","Work with `<form action>` for progressive enhancement","Pair with `useActionState` for errors and pending state"],"bestFor":"Mutations triggered from your own Next.js UI."},{"name":"Route Handlers","summary":"`route.ts` files that answer HTTP requests at a URL.","points":["Support GET, POST, PUT, PATCH, DELETE and more","Return any Response: JSON, files, streams","Callable by any client, not only React"],"bestFor":"Public APIs, webhooks and clients outside your app."}],"differences":[{"aspect":"HTTP methods","values":["POST only, handled by React","Any method you export"]},{"aspect":"Callers","values":["Your React components and forms","Any HTTP client, including third parties"]},{"aspect":"Form handling","values":["Built in, works before JavaScript loads","You parse the request body yourself"]},{"aspect":"Best for","values":["UI-driven mutations","Integrations, webhooks and external APIs"]}]},
    keyPoints: ["With `useActionState` the action's first argument is the previous state, not `FormData`.", "Return validation errors as data; throwing shows the error boundary instead.", "Server Actions are public endpoints: always validate and authorize inside them.", "`pending` lets you disable the submit button without extra state."],
  },
  {
    id: "react-debounced-search",
    question: "How do I build a debounced search input with a custom React hook?",
    category: "React", level: "beginner",
    tags: ["hooks", "debounce", "useEffect", "search", "fetch", "AbortController"],
    definition: "Debouncing waits until the user stops typing for a set delay before acting, so a search box sends one request instead of one per keystroke.",
    answer: "Write a `useDebounce(value, delay)` hook that sets a timer in `useEffect` and clears it on every change. Feed the debounced value to a fetch effect that aborts the previous request with an `AbortController`.",
    steps: [
      { title: "Create a Vite React app", detail: "A small React + TypeScript app is enough to try the hook.", file: "",
        commands: [{ command: "npm create vite@latest debounce-demo -- --template react-ts", description: "Scaffolds a React + TypeScript project with Vite." }, { command: "cd debounce-demo && npm install && npm run dev", description: "Installs dependencies and starts the dev server." }], code: "" },
      { title: "Write the useDebounce hook", detail: "Each change schedules an update; the cleanup cancels the previous timer, so only the last value survives the delay.", file: "/src/hooks/useDebounce.ts", commands: [], code: "useEffect(() => {\n  const timer = setTimeout(() => setDebounced(value), delay);\n  return () => clearTimeout(timer);\n}, [value, delay]);" },
      { title: "Fetch with cancellation", detail: "Abort the in-flight request when the query changes so a slow old response can never overwrite a newer one.", file: "/src/hooks/useSearch.ts", commands: [], code: "const controller = new AbortController();\nfetch(url, { signal: controller.signal });\nreturn () => controller.abort();" },
      { title: "Build the search component", detail: "The input updates immediately; only the debounced value drives the network.", file: "/src/components/SearchBox.tsx", commands: [], code: "" },
      { title: "Mount it", detail: "Render the component from `App.tsx` and type quickly: the Network tab shows one request per pause.", file: "/src/App.tsx", commands: [], code: "" },
    ],
    files: [
      { path: "/src/hooks/useDebounce.ts", note: "Generic debounce hook.", code: "import { useEffect, useState } from \"react\";\n\nexport function useDebounce<T>(value: T, delay = 300): T {\n  const [debounced, setDebounced] = useState(value);\n  useEffect(() => {\n    const timer = setTimeout(() => setDebounced(value), delay);\n    return () => clearTimeout(timer);\n  }, [value, delay]);\n  return debounced;\n}\n" },
      { path: "/src/hooks/useSearch.ts", note: "Fetches results and cancels stale requests.", code: "import { useEffect, useState } from \"react\";\n\nexport type Result = { id: number; title: string };\n\nexport function useSearch(query: string) {\n  const [results, setResults] = useState<Result[]>([]);\n  const [loading, setLoading] = useState(false);\n  useEffect(() => {\n    if (!query.trim()) { setResults([]); return; }\n    const controller = new AbortController();\n    setLoading(true);\n    fetch(\"https://dummyjson.com/products/search?q=\" + encodeURIComponent(query), { signal: controller.signal })\n      .then(response => response.json())\n      .then(data => setResults(data.products ?? []))\n      .catch(error => { if (error.name !== \"AbortError\") setResults([]); })\n      .finally(() => { if (!controller.signal.aborted) setLoading(false); });\n    return () => controller.abort();\n  }, [query]);\n  return { results, loading };\n}\n" },
      { path: "/src/components/SearchBox.tsx", note: "Input plus results list.", code: "import { useState } from \"react\";\nimport { useDebounce } from \"../hooks/useDebounce\";\nimport { useSearch } from \"../hooks/useSearch\";\n\nexport function SearchBox() {\n  const [text, setText] = useState(\"\");\n  const query = useDebounce(text, 400);\n  const { results, loading } = useSearch(query);\n  return (\n    <section>\n      <input value={text} onChange={event => setText(event.target.value)} placeholder=\"Search products\" />\n      {loading && <p>Searching...</p>}\n      <ul>{results.map(item => <li key={item.id}>{item.title}</li>)}</ul>\n    </section>\n  );\n}\n" },
      { path: "/src/App.tsx", note: "Mounts the search box.", code: "import { SearchBox } from \"./components/SearchBox\";\n\nexport default function App() {\n  return <SearchBox />;\n}\n" },
    ],
    comparison: {"items":[{"name":"Debounce","summary":"Waits until events stop for a set delay, then runs once.","points":["Resets its timer on every new event","Runs after the user pauses","Can delay feedback during continuous input"],"bestFor":"Search boxes and autosave, where only the final value matters."},{"name":"Throttle","summary":"Runs at most once per interval while events keep arriving.","points":["Ignores or queues events inside the interval","Keeps firing at a steady rate during activity","Never waits for the activity to stop"],"bestFor":"Scroll, resize and pointer tracking that need regular updates."}],"differences":[{"aspect":"Fires","values":["Once, after the events stop","Regularly, at most once per interval"]},{"aspect":"During continuous input","values":["Waits","Keeps running at a fixed rate"]},{"aspect":"Typical delay","values":["300-500 ms after the last keystroke","Every 100-200 ms"]},{"aspect":"Classic use","values":["Search-as-you-type","Infinite scroll and resize handlers"]}]},
    keyPoints: ["The cleanup function is what makes debounce work: it cancels the previous timer.", "Debounce the value, not the handler, so the input stays responsive.", "Abort stale fetches to avoid out-of-order results.", "300-500 ms is a typical delay for search boxes."],
  },
  {
    id: "node-express-rest-api",
    question: "How do I create a REST API with Express and request validation?",
    category: "Node.js", level: "beginner",
    tags: ["express", "rest", "api", "crud", "zod", "validation", "router"],
    definition: "A REST API exposes resources over HTTP verbs: GET reads, POST creates, PUT/PATCH updates and DELETE removes. Express is a minimal Node.js framework for routing those requests.",
    answer: "Initialise a Node project, install Express and Zod, define a router with CRUD handlers for one resource, validate request bodies with a Zod schema, and add a final error handler so every failure returns JSON.",
    steps: [
      { title: "Initialise the project", detail: "Create a folder and a package.json that uses ES modules.", file: "/package.json",
        commands: [{ command: "mkdir todo-api && cd todo-api && npm init -y", description: "Creates the project folder and a default package.json." }, { command: "npm pkg set type=module", description: "Enables `import` syntax in .js files." }], code: "" },
      { title: "Install dependencies", detail: "Express handles routing; Zod validates request bodies.", file: "",
        commands: [{ command: "npm install express zod", description: "Installs the runtime dependencies." }], code: "" },
      { title: "Define the validation schema", detail: "A schema is the single source of truth for what a valid todo looks like.", file: "/src/schema.js", commands: [], code: "export const todoSchema = z.object({ title: z.string().min(1), done: z.boolean().default(false) });" },
      { title: "Write the router", detail: "Each route reads or changes the in-memory store and returns the right status code: 201 on create, 404 when missing, 204 on delete.", file: "/src/todos.js", commands: [], code: "" },
      { title: "Wire the app and error handler", detail: "`express.json()` parses bodies; the four-argument handler catches validation errors and returns 400.", file: "/src/server.js", commands: [], code: "" },
      { title: "Run and test it", detail: "Start the server and exercise the endpoints with curl.", file: "",
        commands: [{ command: "node --watch src/server.js", description: "Runs the API and restarts on file changes." }, { command: "curl -X POST localhost:3000/todos -H \"Content-Type: application/json\" -d '{\"title\":\"Learn Express\"}'", description: "Creates a todo; expect a 201 with the new item." }, { command: "curl localhost:3000/todos", description: "Lists every todo." }], code: "" },
    ],
    files: [
      { path: "/package.json", note: "ES modules and dependencies.", code: "{\n  \"name\": \"todo-api\",\n  \"type\": \"module\",\n  \"scripts\": { \"dev\": \"node --watch src/server.js\" },\n  \"dependencies\": { \"express\": \"^5.1.0\", \"zod\": \"^4.0.0\" }\n}\n" },
      { path: "/src/schema.js", note: "Validation rules.", code: "import { z } from \"zod\";\n\nexport const todoSchema = z.object({\n  title: z.string().trim().min(1, \"title is required\"),\n  done: z.boolean().default(false),\n});\n" },
      { path: "/src/todos.js", note: "CRUD routes for /todos.", code: "import { Router } from \"express\";\nimport { randomUUID } from \"node:crypto\";\nimport { todoSchema } from \"./schema.js\";\n\nconst todos = new Map();\nexport const router = Router();\n\nrouter.get(\"/\", (_req, res) => res.json([...todos.values()]));\n\nrouter.get(\"/:id\", (req, res) => {\n  const todo = todos.get(req.params.id);\n  if (!todo) return res.status(404).json({ error: \"not_found\" });\n  res.json(todo);\n});\n\nrouter.post(\"/\", (req, res) => {\n  const todo = { id: randomUUID(), ...todoSchema.parse(req.body) };\n  todos.set(todo.id, todo);\n  res.status(201).json(todo);\n});\n\nrouter.put(\"/:id\", (req, res) => {\n  if (!todos.has(req.params.id)) return res.status(404).json({ error: \"not_found\" });\n  const todo = { id: req.params.id, ...todoSchema.parse(req.body) };\n  todos.set(todo.id, todo);\n  res.json(todo);\n});\n\nrouter.delete(\"/:id\", (req, res) => {\n  todos.delete(req.params.id);\n  res.status(204).end();\n});\n" },
      { path: "/src/server.js", note: "App entry and error handler.", code: "import express from \"express\";\nimport { ZodError } from \"zod\";\nimport { router } from \"./todos.js\";\n\nconst app = express();\napp.use(express.json());\napp.use(\"/todos\", router);\n\napp.use((error, _req, res, _next) => {\n  if (error instanceof ZodError) return res.status(400).json({ error: \"invalid_body\", issues: error.issues });\n  console.error(error);\n  res.status(500).json({ error: \"server_error\" });\n});\n\napp.listen(3000, () => console.log(\"API on http://localhost:3000\"));\n" },
    ],
    comparison: {"items":[{"name":"Express","summary":"Minimal, unopinionated Node.js web framework built around middleware.","points":["Very large middleware ecosystem","You choose validation and logging libraries","Express 5 forwards rejected promises from async handlers to error handlers"],"bestFor":"Teams that want the most familiar API and ecosystem."},{"name":"Fastify","summary":"Node.js web framework focused on low overhead and schemas.","points":["Validates and serializes with JSON Schema","Encapsulated plugin system","Built-in logging with pino"],"bestFor":"High-throughput APIs where schemas and performance matter."}],"differences":[{"aspect":"Validation","values":["Bring your own library, such as Zod","JSON Schema built into each route"]},{"aspect":"Performance","values":["Good; more per-request overhead","Designed for lower overhead and higher throughput"]},{"aspect":"Extending","values":["Global middleware chain","Encapsulated plugins with their own scope"]},{"aspect":"Logging","values":["Add a library such as morgan or pino","pino built in"]}]},
    keyPoints: ["Return the right status codes: 201 created, 204 no content, 400 bad input, 404 missing.", "Validate every request body; never trust client input.", "An error handler must have four parameters for Express to treat it as one.", "Replace the in-memory Map with a database before production."],
  },
  {
    id: "node-postgres-queries",
    question: "How do I connect Node.js to PostgreSQL and run safe parameterized queries?",
    category: "Database", level: "intermediate",
    tags: ["postgres", "postgresql", "pg", "sql", "database", "pool", "sql injection"],
    definition: "`pg` (node-postgres) is the standard PostgreSQL client for Node.js. A connection pool reuses a few open connections, and parameterized queries send values separately from SQL so they cannot inject code.",
    answer: "Run Postgres (Docker is quickest), install `pg`, create one shared `Pool` from `DATABASE_URL`, create a table, and query with `$1, $2` placeholders plus a values array. Use a transaction from `pool.connect()` when several statements must succeed together.",
    steps: [
      { title: "Start PostgreSQL", detail: "A container gives you a disposable database with a known password.", file: "",
        commands: [{ command: "docker run --name pg -e POSTGRES_PASSWORD=secret -p 5432:5432 -d postgres:17", description: "Starts Postgres 17 in the background on port 5432." }], code: "" },
      { title: "Install the driver", detail: "Install `pg` and set the connection string in an env file.", file: "/.env",
        commands: [{ command: "npm install pg", description: "Adds node-postgres." }, { command: "echo DATABASE_URL=postgres://postgres:secret@localhost:5432/postgres > .env", description: "Stores the connection string outside the code." }], code: "" },
      { title: "Create one shared pool", detail: "Create the pool once per process; opening a connection per query is slow and exhausts the server.", file: "/src/db.js", commands: [], code: "export const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });" },
      { title: "Create the schema", detail: "A migration script creates the table idempotently with `IF NOT EXISTS`.", file: "/src/migrate.js",
        commands: [{ command: "node --env-file=.env src/migrate.js", description: "Loads .env and creates the users table." }], code: "" },
      { title: "Query with placeholders", detail: "Pass values in the second argument. Never build SQL by concatenating user input.", file: "/src/users.js", commands: [], code: "await pool.query(\"SELECT * FROM users WHERE email = $1\", [email]);" },
      { title: "Use a transaction", detail: "Check out a client, run BEGIN/COMMIT, ROLLBACK on error and always release the client.", file: "/src/users.js",
        commands: [{ command: "node --env-file=.env src/index.js", description: "Runs the demo that inserts and reads users." }], code: "" },
    ],
    files: [
      { path: "/.env", note: "Local connection string; never commit real credentials.", code: "DATABASE_URL=postgres://postgres:secret@localhost:5432/postgres\n" },
      { path: "/src/db.js", note: "The shared pool.", code: "import pg from \"pg\";\n\nexport const pool = new pg.Pool({\n  connectionString: process.env.DATABASE_URL,\n  max: 10,\n});\n" },
      { path: "/src/migrate.js", note: "Creates the table.", code: "import { pool } from \"./db.js\";\n\nawait pool.query(`\n  CREATE TABLE IF NOT EXISTS users (\n    id SERIAL PRIMARY KEY,\n    email TEXT UNIQUE NOT NULL,\n    name TEXT NOT NULL,\n    created_at TIMESTAMPTZ DEFAULT now()\n  )\n`);\nconsole.log(\"users table ready\");\nawait pool.end();\n" },
      { path: "/src/users.js", note: "Parameterized queries and a transaction.", code: "import { pool } from \"./db.js\";\n\nexport async function findUser(email) {\n  const { rows } = await pool.query(\"SELECT id, email, name FROM users WHERE email = $1\", [email]);\n  return rows[0] ?? null;\n}\n\nexport async function createUsers(users) {\n  const client = await pool.connect();\n  try {\n    await client.query(\"BEGIN\");\n    for (const user of users) {\n      await client.query(\"INSERT INTO users (email, name) VALUES ($1, $2)\", [user.email, user.name]);\n    }\n    await client.query(\"COMMIT\");\n  } catch (error) {\n    await client.query(\"ROLLBACK\");\n    throw error;\n  } finally {\n    client.release();\n  }\n}\n" },
      { path: "/src/index.js", note: "Demo runner.", code: "import { pool } from \"./db.js\";\nimport { createUsers, findUser } from \"./users.js\";\n\nawait createUsers([{ email: \"ada@example.com\", name: \"Ada\" }]);\nconsole.log(await findUser(\"ada@example.com\"));\nawait pool.end();\n" },
    ],
    comparison: {"items":[{"name":"node-postgres (pg)","summary":"A thin PostgreSQL driver: you write SQL, it sends it.","points":["Parameterized queries with $1, $2 placeholders","Connection pooling with `Pool`","No schema or migration tooling of its own"],"bestFor":"Full control over SQL and minimal abstraction."},{"name":"Prisma ORM","summary":"A schema-first ORM with a generated, type-safe client.","points":["Models defined in `schema.prisma`","Generated client with typed queries","Migrations with `prisma migrate`"],"bestFor":"TypeScript apps that want typed queries and managed migrations."}],"differences":[{"aspect":"Query style","values":["Raw SQL strings","Generated client methods"]},{"aspect":"Type safety","values":["You type the result rows yourself","Types generated from the schema"]},{"aspect":"Migrations","values":["Your own SQL files or tool","Built in with `prisma migrate`"]},{"aspect":"Abstraction","values":["Minimal, close to SQL","Higher level; raw SQL still available"]}]},
    keyPoints: ["Use `$1, $2` placeholders with a values array to prevent SQL injection.", "Create one Pool per process and reuse it.", "Always `release()` a checked-out client in `finally`.", "Keep credentials in environment variables, never in source."],
  },
  {
    id: "jest-react-testing",
    question: "How do I unit test a React component with Jest and React Testing Library?",
    category: "Testing", level: "beginner",
    tags: ["jest", "react testing library", "rtl", "unit test", "user-event", "jsdom"],
    definition: "React Testing Library renders a component into a simulated DOM (jsdom) and queries it the way a user would, by role and text. Jest runs the tests and provides assertions.",
    answer: "Install Jest, jsdom, Testing Library and a TypeScript transform, add `jest-dom` matchers in a setup file, then render the component, drive it with `userEvent` and assert on what the user sees using role-based queries.",
    steps: [
      { title: "Install the tools", detail: "Jest runs tests, `ts-jest` compiles TSX, jsdom provides a browser-like DOM.", file: "",
        commands: [{ command: "npm install -D jest ts-jest @types/jest jest-environment-jsdom", description: "Adds Jest with TypeScript and jsdom support." }, { command: "npm install -D @testing-library/react @testing-library/user-event @testing-library/jest-dom", description: "Adds rendering, interaction and DOM matchers." }], code: "" },
      { title: "Configure Jest", detail: "Point Jest at jsdom and load the matcher setup before each test file.", file: "/jest.config.js", commands: [], code: "" },
      { title: "Write the component", detail: "A counter with a label is enough to test state updates and accessibility.", file: "/src/Counter.tsx", commands: [], code: "" },
      { title: "Write the test", detail: "Query by role, click with `userEvent`, then assert on visible text.", file: "/src/Counter.test.tsx", commands: [], code: "await user.click(screen.getByRole(\"button\", { name: /increment/i }));\nexpect(screen.getByText(\"Count: 1\")).toBeInTheDocument();" },
      { title: "Run the tests", detail: "Add a script and run it; use watch mode while developing.", file: "/package.json",
        commands: [{ command: "npm pkg set scripts.test=jest", description: "Adds `npm test`." }, { command: "npm test -- --watch", description: "Re-runs affected tests on save." }], code: "" },
    ],
    files: [
      { path: "/package.json", note: "Test script and dev dependencies.", code: "{\n  \"name\": \"counter\",\n  \"scripts\": { \"test\": \"jest\" },\n  \"devDependencies\": {\n    \"@testing-library/jest-dom\": \"^6.0.0\",\n    \"@testing-library/react\": \"^16.0.0\",\n    \"@testing-library/user-event\": \"^14.0.0\",\n    \"@types/jest\": \"^30.0.0\",\n    \"jest\": \"^30.0.0\",\n    \"jest-environment-jsdom\": \"^30.0.0\",\n    \"ts-jest\": \"^29.0.0\"\n  }\n}\n" },
      { path: "/jest.config.js", note: "Test environment config.", code: "/** @type {import('jest').Config} */\nmodule.exports = {\n  preset: \"ts-jest\",\n  testEnvironment: \"jsdom\",\n  setupFilesAfterEnv: [\"<rootDir>/jest.setup.ts\"],\n};\n" },
      { path: "/jest.setup.ts", note: "Adds toBeInTheDocument and friends.", code: "import \"@testing-library/jest-dom\";\n" },
      { path: "/src/Counter.tsx", note: "Component under test.", code: "import { useState } from \"react\";\n\nexport function Counter({ start = 0 }: { start?: number }) {\n  const [count, setCount] = useState(start);\n  return (\n    <div>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(count + 1)}>Increment</button>\n      <button onClick={() => setCount(start)}>Reset</button>\n    </div>\n  );\n}\n" },
      { path: "/src/Counter.test.tsx", note: "User-centric tests.", code: "import { render, screen } from \"@testing-library/react\";\nimport userEvent from \"@testing-library/user-event\";\nimport { Counter } from \"./Counter\";\n\ntest(\"increments and resets\", async () => {\n  const user = userEvent.setup();\n  render(<Counter start={2} />);\n  await user.click(screen.getByRole(\"button\", { name: /increment/i }));\n  expect(screen.getByText(\"Count: 3\")).toBeInTheDocument();\n  await user.click(screen.getByRole(\"button\", { name: /reset/i }));\n  expect(screen.getByText(\"Count: 2\")).toBeInTheDocument();\n});\n" },
    ],
    comparison: {"items":[{"name":"Jest","summary":"A long-established JavaScript test runner with assertions and mocks built in.","points":["Huge ecosystem and documentation","TypeScript and JSX need a transform such as ts-jest or Babel","Mocks through the `jest` object"],"bestFor":"Existing projects and setups that already standardise on Jest."},{"name":"Vitest","summary":"A Vite-powered test runner with a Jest-compatible API.","points":["Uses your Vite config and plugins","TypeScript and ESM work without extra transforms","Mocks through the `vi` object"],"bestFor":"Vite projects and new TypeScript codebases wanting fast feedback."}],"differences":[{"aspect":"Setup","values":["Needs a transform for TS and JSX","Reuses the Vite pipeline"]},{"aspect":"Mocking API","values":["`jest.fn()`, `jest.mock()`","`vi.fn()`, `vi.mock()`"]},{"aspect":"ESM support","values":["Supported, still more configuration","Native"]},{"aspect":"Watch mode","values":["Re-runs related tests","Fast re-runs driven by Vite's module graph"]}]},
    keyPoints: ["Prefer `getByRole` queries: they test accessibility as well as behaviour.", "Use `userEvent.setup()` and `await` each interaction.", "Assert on what the user sees, not on component state.", "`jest-dom` adds readable matchers like `toBeInTheDocument`."],
  },
  {
    id: "docker-node-app",
    question: "How do I dockerize a Node.js app with a multi-stage Dockerfile and Docker Compose?",
    category: "DevOps", level: "intermediate",
    tags: ["docker", "dockerfile", "compose", "container", "multi-stage", "deployment"],
    definition: "Docker packages an app and its runtime into an image that runs the same everywhere. A multi-stage build installs and builds in one stage and copies only what production needs into a small final stage.",
    answer: "Add a `.dockerignore`, write a two-stage Dockerfile (deps/build, then a slim runtime running as a non-root user), build and run the image, and describe the app plus its database in `compose.yaml` so one command starts everything.",
    steps: [
      { title: "Write a tiny server", detail: "Any Node app works; this one answers health checks on port 3000.", file: "/server.js", commands: [], code: "" },
      { title: "Ignore what the image does not need", detail: "`.dockerignore` keeps `node_modules` and secrets out of the build context, making builds faster and safer.", file: "/.dockerignore", commands: [], code: "" },
      { title: "Write the multi-stage Dockerfile", detail: "Stage one installs production dependencies with `npm ci`; stage two copies them and the source into a slim image and drops root.", file: "/Dockerfile", commands: [], code: "" },
      { title: "Build and run the image", detail: "Tag the image, then publish port 3000 from the container to your machine.", file: "",
        commands: [{ command: "docker build -t node-app .", description: "Builds the image from the Dockerfile in this folder." }, { command: "docker run --rm -p 3000:3000 node-app", description: "Runs it and maps port 3000; --rm deletes the container on exit." }], code: "" },
      { title: "Compose the app with a database", detail: "Compose declares both services, their env vars and startup order in one file.", file: "/compose.yaml",
        commands: [{ command: "docker compose up --build -d", description: "Builds and starts every service in the background." }, { command: "docker compose logs -f app", description: "Follows the app's logs." }, { command: "docker compose down", description: "Stops and removes the containers." }], code: "" },
    ],
    files: [
      { path: "/server.js", note: "Minimal HTTP server.", code: "import http from \"node:http\";\n\nconst port = Number(process.env.PORT ?? 3000);\nhttp.createServer((req, res) => {\n  res.writeHead(200, { \"Content-Type\": \"application/json\" });\n  res.end(JSON.stringify({ ok: true, path: req.url }));\n}).listen(port, () => console.log(\"listening on \" + port));\n" },
      { path: "/package.json", note: "Start script.", code: "{\n  \"name\": \"node-app\",\n  \"type\": \"module\",\n  \"scripts\": { \"start\": \"node server.js\" },\n  \"dependencies\": {}\n}\n" },
      { path: "/.dockerignore", note: "Keeps the build context small.", code: "node_modules\nnpm-debug.log\n.env\n.git\nDockerfile\ncompose.yaml\n" },
      { path: "/Dockerfile", note: "Two stages: deps, then runtime.", code: "FROM node:24-alpine AS deps\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --omit=dev\n\nFROM node:24-alpine AS runtime\nENV NODE_ENV=production\nWORKDIR /app\nCOPY --from=deps /app/node_modules ./node_modules\nCOPY . .\nUSER node\nEXPOSE 3000\nCMD [\"node\", \"server.js\"]\n" },
      { path: "/compose.yaml", note: "App plus Postgres.", code: "services:\n  app:\n    build: .\n    ports:\n      - \"3000:3000\"\n    environment:\n      DATABASE_URL: postgres://postgres:secret@db:5432/postgres\n    depends_on:\n      - db\n  db:\n    image: postgres:17\n    environment:\n      POSTGRES_PASSWORD: secret\n    volumes:\n      - db-data:/var/lib/postgresql/data\nvolumes:\n  db-data:\n" },
    ],
    comparison: {"items":[{"name":"Docker Compose","summary":"Defines and runs a multi-container app on one host from a YAML file.","points":["One `compose.yaml` for all services","`docker compose up` starts everything","Services reach each other by name"],"bestFor":"Local development and small single-server deployments."},{"name":"Kubernetes","summary":"Orchestrates containers across a cluster of machines.","points":["Self-healing: restarts and reschedules failed pods","Horizontal scaling and rolling updates","Services, Ingress and ConfigMaps for networking and config"],"bestFor":"Production workloads that need scaling and high availability."}],"differences":[{"aspect":"Runs on","values":["A single Docker host","A cluster of nodes"]},{"aspect":"Scaling","values":["Manual, `--scale` on one host","Declarative replicas and autoscaling"]},{"aspect":"Failure handling","values":["Restart policies only","Rescheduling across nodes"]},{"aspect":"Complexity","values":["Low; one YAML file","High; many resource types"]}]},
    keyPoints: ["Copy `package*.json` and install before copying source so Docker caches the dependency layer.", "Run as the non-root `node` user in production images.", "`npm ci` needs a lockfile and gives reproducible installs.", "Inside Compose, services reach each other by service name (`db`), not localhost."],
  },
  {
    id: "python-fastapi-crud",
    question: "How do I build a CRUD REST API in Python with FastAPI and Pydantic?",
    category: "Python", level: "beginner",
    tags: ["python", "fastapi", "pydantic", "uvicorn", "rest", "api", "crud"],
    definition: "FastAPI is a Python web framework that uses type hints and Pydantic models to validate requests and generate interactive OpenAPI docs automatically.",
    answer: "Create a virtual environment, install FastAPI with its standard extras, define Pydantic models for input and output, write path operations for create, read, update and delete, and run it with `fastapi dev`. Visit `/docs` to try every endpoint.",
    steps: [
      { title: "Create a virtual environment", detail: "Isolate the project's packages from the system Python.", file: "",
        commands: [{ command: "python -m venv .venv", description: "Creates a virtual environment in .venv." }, { command: "source .venv/bin/activate", description: "Activates it on macOS/Linux (Windows: .venv\\Scripts\\activate)." }], code: "" },
      { title: "Install FastAPI", detail: "The `standard` extra includes the Uvicorn server and the `fastapi` CLI.", file: "/requirements.txt",
        commands: [{ command: "pip install \"fastapi[standard]\"", description: "Installs FastAPI, Uvicorn and the dev CLI." }], code: "" },
      { title: "Define the models", detail: "Separate the input model (no id) from the stored model (with id) so clients cannot set ids.", file: "/app/models.py", commands: [], code: "class BookIn(BaseModel):\n    title: str = Field(min_length=1)\n    author: str" },
      { title: "Write the routes", detail: "Each function's type hints drive validation; `HTTPException` returns clean 404s.", file: "/app/main.py", commands: [], code: "" },
      { title: "Run and explore", detail: "The dev server reloads on save and serves Swagger UI at /docs.", file: "",
        commands: [{ command: "fastapi dev app/main.py", description: "Starts the API with auto-reload on http://127.0.0.1:8000." }, { command: "curl -X POST localhost:8000/books -H \"Content-Type: application/json\" -d '{\"title\":\"Dune\",\"author\":\"Herbert\"}'", description: "Creates a book and returns it with its id." }], code: "" },
    ],
    files: [
      { path: "/app/models.py", note: "Pydantic request/response models.", code: "from pydantic import BaseModel, Field\n\n\nclass BookIn(BaseModel):\n    title: str = Field(min_length=1)\n    author: str = Field(min_length=1)\n\n\nclass Book(BookIn):\n    id: int\n" },
      { path: "/app/main.py", note: "CRUD path operations.", code: "from fastapi import FastAPI, HTTPException, status\n\nfrom app.models import Book, BookIn\n\napp = FastAPI(title=\"Books API\")\nbooks: dict[int, Book] = {}\nnext_id = 1\n\n\n@app.get(\"/books\")\ndef list_books() -> list[Book]:\n    return list(books.values())\n\n\n@app.get(\"/books/{book_id}\")\ndef get_book(book_id: int) -> Book:\n    if book_id not in books:\n        raise HTTPException(status_code=404, detail=\"Book not found\")\n    return books[book_id]\n\n\n@app.post(\"/books\", status_code=status.HTTP_201_CREATED)\ndef create_book(data: BookIn) -> Book:\n    global next_id\n    book = Book(id=next_id, **data.model_dump())\n    books[book.id] = book\n    next_id += 1\n    return book\n\n\n@app.put(\"/books/{book_id}\")\ndef update_book(book_id: int, data: BookIn) -> Book:\n    if book_id not in books:\n        raise HTTPException(status_code=404, detail=\"Book not found\")\n    books[book_id] = Book(id=book_id, **data.model_dump())\n    return books[book_id]\n\n\n@app.delete(\"/books/{book_id}\", status_code=status.HTTP_204_NO_CONTENT)\ndef delete_book(book_id: int) -> None:\n    books.pop(book_id, None)\n" },
      { path: "/app/__init__.py", note: "Makes app a package.", code: "" },
      { path: "/requirements.txt", note: "Dependencies.", code: "fastapi[standard]\n" },
    ],
    comparison: {"items":[{"name":"FastAPI","summary":"An ASGI framework that uses type hints and Pydantic for validation.","points":["Request validation from type hints","Automatic OpenAPI docs at /docs","First-class async endpoints"],"bestFor":"Typed JSON APIs, especially with many concurrent I/O calls."},{"name":"Flask","summary":"A minimal WSGI micro-framework with a large extension ecosystem.","points":["Small core; add extensions as needed","Validation and API docs come from extensions","Server-rendered pages with Jinja templates"],"bestFor":"Small apps, server-rendered sites and teams that want to choose each piece."}],"differences":[{"aspect":"Server interface","values":["ASGI","WSGI"]},{"aspect":"Validation","values":["Built in with Pydantic","Manual or through an extension"]},{"aspect":"API docs","values":["Generated automatically","Through an extension"]},{"aspect":"Async","values":["Native async endpoints","Async views supported, but served over WSGI"]}]},
    keyPoints: ["Type hints are the validation: a wrong type returns a 422 automatically.", "Use separate input and output models so clients cannot set server-owned fields.", "`/docs` gives interactive Swagger UI for free.", "`fastapi dev` is for development; use `fastapi run` in production."],
  },
  {
    id: "express-jwt-auth",
    question: "How do I add JWT authentication with bcrypt password hashing to an Express API?",
    category: "Auth", level: "advanced",
    tags: ["jwt", "jsonwebtoken", "bcrypt", "auth", "login", "express", "middleware", "token"],
    definition: "A JSON Web Token (JWT) is a signed token the server issues after login. The client sends it back in the `Authorization: Bearer` header and the server verifies the signature instead of looking up a session.",
    answer: "Hash passwords with bcrypt on sign-up, compare the hash on login and sign a short-lived JWT with a secret from the environment. Protect routes with middleware that verifies the token and attaches the user to the request.",
    steps: [
      { title: "Install the libraries", detail: "`bcryptjs` hashes passwords; `jsonwebtoken` signs and verifies tokens.", file: "",
        commands: [{ command: "npm install express bcryptjs jsonwebtoken", description: "Adds the web server, password hashing and JWT libraries." }, { command: "node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"", description: "Prints a random secret to use as JWT_SECRET." }], code: "" },
      { title: "Configure the secret", detail: "The signing secret must never be committed; read it from the environment and fail fast when missing.", file: "/.env",
        commands: [{ command: "echo JWT_SECRET=paste-the-generated-secret > .env", description: "Saves the secret to a local env file." }], code: "" },
      { title: "Register and log in", detail: "Hash with a cost factor of 10-12 on register. On login compare and sign a token that expires.", file: "/src/auth.js", commands: [], code: "const token = jwt.sign({ sub: user.id }, secret, { expiresIn: \"15m\" });" },
      { title: "Write the auth middleware", detail: "Read the Bearer token, verify it, and return 401 for a missing or invalid token.", file: "/src/require-auth.js", commands: [], code: "req.user = jwt.verify(token, process.env.JWT_SECRET);" },
      { title: "Protect a route and test", detail: "Mount the middleware on private routes, then call them with and without the token.", file: "/src/server.js",
        commands: [{ command: "node --env-file=.env src/server.js", description: "Starts the API with the secret loaded." }, { command: "curl -X POST localhost:3000/register -H \"Content-Type: application/json\" -d '{\"email\":\"a@b.c\",\"password\":\"secret123\"}'", description: "Registers a user." }, { command: "curl localhost:3000/me -H \"Authorization: Bearer <token>\"", description: "Calls the protected route with the token from /login." }], code: "" },
    ],
    files: [
      { path: "/.env", note: "Signing secret; generate your own and keep it out of git.", code: "JWT_SECRET=paste-the-generated-secret\n" },
      { path: "/src/auth.js", note: "Register and login routes.", code: "import { Router } from \"express\";\nimport bcrypt from \"bcryptjs\";\nimport jwt from \"jsonwebtoken\";\n\nconst users = new Map();\nexport const auth = Router();\n\nauth.post(\"/register\", async (req, res) => {\n  const { email, password } = req.body ?? {};\n  if (!email || !password || password.length < 8) return res.status(400).json({ error: \"invalid_input\" });\n  if (users.has(email)) return res.status(409).json({ error: \"email_taken\" });\n  users.set(email, { id: users.size + 1, email, hash: await bcrypt.hash(password, 12) });\n  res.status(201).json({ ok: true });\n});\n\nauth.post(\"/login\", async (req, res) => {\n  const { email, password } = req.body ?? {};\n  const user = users.get(email);\n  if (!user || !(await bcrypt.compare(password ?? \"\", user.hash))) return res.status(401).json({ error: \"invalid_credentials\" });\n  const token = jwt.sign({ sub: user.id, email }, process.env.JWT_SECRET, { expiresIn: \"15m\" });\n  res.json({ token });\n});\n" },
      { path: "/src/require-auth.js", note: "Verifies the Bearer token.", code: "import jwt from \"jsonwebtoken\";\n\nexport function requireAuth(req, res, next) {\n  const header = req.headers.authorization ?? \"\";\n  const token = header.startsWith(\"Bearer \") ? header.slice(7) : null;\n  if (!token) return res.status(401).json({ error: \"missing_token\" });\n  try {\n    req.user = jwt.verify(token, process.env.JWT_SECRET);\n    next();\n  } catch {\n    res.status(401).json({ error: \"invalid_token\" });\n  }\n}\n" },
      { path: "/src/server.js", note: "Wires public and private routes.", code: "import express from \"express\";\nimport { auth } from \"./auth.js\";\nimport { requireAuth } from \"./require-auth.js\";\n\nif (!process.env.JWT_SECRET) throw new Error(\"JWT_SECRET is not set\");\n\nconst app = express();\napp.use(express.json());\napp.use(auth);\napp.get(\"/me\", requireAuth, (req, res) => res.json({ user: req.user }));\n\napp.listen(3000, () => console.log(\"Auth API on http://localhost:3000\"));\n" },
    ],
    comparison: {"items":[{"name":"JWT access tokens","summary":"Signed tokens the client sends back; the server verifies the signature.","points":["Stateless: no session lookup per request","Hard to revoke before the token expires","Payload is signed, not encrypted"],"bestFor":"APIs used by several clients or services without shared session storage."},{"name":"Server-side sessions","summary":"A random session id in a cookie, with the session data stored on the server.","points":["The cookie holds only an opaque id","Revoking is deleting the stored session","Needs a shared store such as Redis or a database"],"bestFor":"Browser apps where instant logout and revocation matter."}],"differences":[{"aspect":"State","values":["Stateless; claims live in the token","Stateful; data lives in the server store"]},{"aspect":"Revocation","values":["Waits for expiry unless you add a denylist","Immediate: delete the session"]},{"aspect":"Scaling","values":["No shared store needed","Every instance needs the shared store"]},{"aspect":"Typical transport","values":["Authorization: Bearer header","httpOnly cookie"]}]},
    keyPoints: ["Never store plain passwords; bcrypt hashes are salted and deliberately slow.", "Keep access tokens short-lived (minutes) and the secret in the environment.", "Return the same 401 for unknown email and wrong password to avoid leaking accounts.", "JWTs are signed, not encrypted: never put secrets in the payload."],
  },
];

const NO_EXTRAS = { definitionPoints: [], answerPoints: [], features: [], useCases: [] };

/** Every built-in guide with its definition/answer points, core features and use cases. */
export const STEP_GUIDES: LibraryGuide[] = BASE_GUIDES.map(guide => ({ ...guide, ...(GUIDE_EXTRAS[guide.id] ?? NO_EXTRAS) }) satisfies LibraryGuide);

const STOP = new Set(["a", "an", "the", "how", "do", "i", "to", "in", "with", "and", "or", "of", "for", "my", "is", "what", "can", "on", "it", "using", "use", "make", "build", "create", "add", "step", "by", "steps", "js", "app"]);

export function tokens(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9.#+]+/g, " ").split(" ").map(word => word.replace(/^\.+|\.+$/g, "")).filter(word => word.length > 1 && !STOP.has(word));
}

/** How well a guide answers a question: question and tag hits count most. */
export function scoreGuide(guide: LibraryGuide, query: string) {
  const words = tokens(query);
  if (!words.length) return 0;
  const question = guide.question.toLowerCase();
  const tags = guide.tags.join(" ").toLowerCase();
  const body = `${guide.category} ${guide.definition} ${guide.answer}`.toLowerCase();
  return words.reduce((score, word) => score + (question.includes(word) ? 3 : 0) + (tags.includes(word) ? 2 : 0) + (body.includes(word) ? 1 : 0), 0);
}

/** The built-in guide that answers a question, if one plainly does. */
export function bestGuide(query: string, category?: StepCategory, level?: StepLevel): LibraryGuide | null {
  const words = tokens(query);
  let best: { guide: LibraryGuide; score: number } | null = null;
  for (const guide of STEP_GUIDES) {
    if (category && guide.category !== category) continue;
    let score = scoreGuide(guide, query);
    if (level && guide.level === level) score += 1;
    if (!best || score > best.score) best = { guide, score };
  }
  // At least half the meaningful words must land somewhere in the guide's
  // question or tags, or it is a different topic that shares a word.
  return best && best.score >= Math.max(4, words.length * 2) ? best.guide : null;
}
