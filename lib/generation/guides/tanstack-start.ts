import type { TechnologyGuide } from "./index";
import { source } from "./shared";
import { TANSTACK_LESSONS, TANSTACK_FUNDAMENTALS } from "@/lib/notes-tanstack-fundamentals";
import { expandGuide } from "../guide-expansions";

/**
 * TanStack Start for React, grounded in the official Start and Router guides.
 * The expanded curriculum also covers the wider TanStack ecosystem.
 */
const guide: TechnologyGuide = {
  id: "tanstack-start",
  technologyId: "tanstack-start",
  topicId: "tanstack-start",
  level: "intermediate",
  curriculum: {
    title: "TanStack Start: full-stack React with TanStack Router",
    minutes: 180,
    objectives: [
      "Explain what TanStack Start is, how it relates to TanStack Router and Vite, and how it compares with Next.js.",
      "Build type-safe file-based routes with dynamic params, layouts and validated search params.",
      "Load data with isomorphic loaders and understand where loader code runs.",
      "Write server functions with createServerFn, validators and middleware.",
      "Expose HTTP endpoints with server routes and add request middleware.",
      "Choose SSR, selective SSR, prerendering or SPA mode, and deploy.",
    ],
    prerequisites: [
      "React Hooks and TypeScript.",
      "HTTP basics and async/await.",
      "Node.js for local development.",
    ],
    lessons: [
      {
        title: "What TanStack Start is",
        diagram: {
          kind: "tree",
          caption: "TanStack Start adds a server to TanStack Router: full-document SSR, streaming, server functions, server routes and middleware, built with Vite (or Rsbuild).",
          items: [
            { label: "TanStack Start", detail: "the full-stack framework" },
            { label: "TanStack Router", detail: "type-safe routing, loaders, search params", depth: 1 },
            { label: "Server functions", detail: "createServerFn: typed RPC to the server", depth: 1 },
            { label: "Server routes + middleware", detail: "HTTP handlers and request pipeline", depth: 1 },
            { label: "SSR, streaming, prerendering", detail: "per-route control", depth: 1 },
            { label: "Vite plugin", detail: "tanstackStart() in vite.config.ts", depth: 1 },
            { label: "Deploy anywhere", detail: "Node, Netlify, Vercel, Cloudflare and more", depth: 1 },
          ],
        },
        explanation: "- TanStack Start is a full-stack React framework powered by TanStack Router\n- It adds full-document SSR, streaming, server functions, server routes and middleware\n- It builds with Vite (or Rsbuild) through the tanstackStart() plugin\n- Pin compatible framework, adapter and build-tool versions for the deployment target\n- Scaffold a project with npx @tanstack/cli@latest create",
        keyPoints: [
          { tone: "key", text: "Loaders run on both server and client ('isomorphic'); server-only work belongs in server functions." },
          { tone: "tip", text: "Everything is inferred end to end: route params, search params, loader data and server function inputs are typed." },
          { tone: "warning", text: "SSR plus hydration is the core rendering model; review optional feature support for the installed release." },
        ],
        example: "- npx @tanstack/cli@latest create scaffolds a project with your chosen add-ons\n- src/routes/about.tsx becomes the /about route\n- createServerFn().handler(() => new Date().toISOString()) runs only on the server\n- tanstackStart() comes before viteReact() in the Vite plugin list",
        code: "// vite.config.ts\nimport { defineConfig } from 'vite';\nimport { tanstackStart } from '@tanstack/react-start/plugin/vite';\nimport viteReact from '@vitejs/plugin-react';\n\nexport default defineConfig({\n  server: { port: 3000 },\n  resolve: { tsconfigPaths: true },\n  plugins: [\n    tanstackStart(),\n    viteReact(),        // must come after the Start plugin\n  ],\n});\n\n// src/router.tsx\nimport { createRouter } from '@tanstack/react-router';\nimport { routeTree } from './routeTree.gen';   // generated from src/routes\n\nexport function getRouter() {\n  return createRouter({ routeTree, scrollRestoration: true });\n}\n\n// Project layout\n// src/\n//   routes/__root.tsx   the document shell\n//   routes/index.tsx    /\n//   routes/posts/$postId.tsx   /posts/:postId\n//   router.tsx\n//   routeTree.gen.ts    generated, do not edit",
        exercise: "- Scaffold a TanStack Start app and run it\n- Find routeTree.gen.ts and see how it changes when you add a route file\n- List three differences you expect between Start and Next.js before continuing",
        checkpoint: "- What does TanStack Start add on top of TanStack Router?\n- Which build tools can it use?\n- Where do loaders run?",
        mistake: "- Do not edit routeTree.gen.ts by hand\n- Do not put the React Vite plugin before tanstackStart()\n- Do not read secrets in loaders; they also run in the browser",
        interview: [
          {
            question: "How does TanStack Start compare with Next.js?",
            definition: "Both are full-stack React frameworks with SSR and server-side code; they differ in routing model, data loading and defaults.",
            answer: "TanStack Start builds on TanStack Router, so routes, params, search params and loader data are fully type-inferred, and loaders are isomorphic, running on the server first and on the client for later navigations. Server work happens in explicit server functions (createServerFn) called like typed RPC. Next.js centres on React Server Components by default with its App Router conventions. Start uses Vite and deploys to many hosts through its plugin.",
            similar: [
              { question: "What is an isomorphic loader?", answer: "A loader that runs on the server for the initial request and in the browser for subsequent client-side navigations." },
            ],
          },
        ],
      },
      {
        title: "File-based routing, params and search params",
        diagram: {
          kind: "tree",
          caption: "Files in src/routes become routes. Naming conventions add dynamic params, layouts and the root document.",
          items: [
            { label: "src/routes/" },
            { label: "__root.tsx", detail: "the root route: <html>, <HeadContent />, <Scripts />", depth: 1 },
            { label: "index.tsx", detail: "/", depth: 1 },
            { label: "posts.tsx", detail: "/posts layout, renders <Outlet />", depth: 1 },
            { label: "posts/index.tsx", detail: "/posts", depth: 1 },
            { label: "posts/$postId.tsx", detail: "/posts/:postId (dynamic)", depth: 1 },
            { label: "_auth.tsx", detail: "pathless layout (no URL segment)", depth: 1 },
            { label: "_auth/dashboard.tsx", detail: "/dashboard, wrapped by _auth", depth: 2 },
          ],
        },
        explanation: "- createFileRoute('/posts/$postId') defines a route; the path string is checked against the file\n- $postId is a dynamic segment read with Route.useParams()\n- A parent route renders <Outlet /> where child routes appear; underscore-prefixed files are pathless layouts\n- validateSearch validates and types search params, read with Route.useSearch()\n- <Link to=\"/posts/$postId\" params={{ postId }}> is type-checked: wrong paths or params fail to compile",
        keyPoints: [
          { tone: "key", text: "Search params are first-class, typed state: validate them with a schema instead of parsing strings by hand." },
          { tone: "tip", text: "Navigate with navigate({ search: prev => ({ ...prev, page: 2 }) }) to update one search param." },
          { tone: "warning", text: "The route path string must match the file location; the generator keeps them in sync — do not rename one without the other." },
        ],
        example: "- src/routes/posts/$postId.tsx with createFileRoute('/posts/$postId')\n- const { postId } = Route.useParams()\n- validateSearch: z.object({ page: z.number().catch(1) }) makes ?page= a typed number\n- <Link to=\"/posts\" search={{ page: 2 }}>Next page</Link>",
        code: "// src/routes/__root.tsx\nimport { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';\n\nexport const Route = createRootRoute({\n  head: () => ({\n    meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }, { title: 'My Start App' }],\n  }),\n  component: () => (\n    <html lang=\"en\">\n      <head><HeadContent /></head>\n      <body>\n        <Outlet />\n        <Scripts />\n      </body>\n    </html>\n  ),\n});\n\n// src/routes/posts/index.tsx\nimport { createFileRoute, Link } from '@tanstack/react-router';\nimport { z } from 'zod';\n\nexport const Route = createFileRoute('/posts/')({\n  validateSearch: z.object({ page: z.number().int().min(1).catch(1) }),\n  component: PostsPage,\n});\n\nfunction PostsPage() {\n  const { page } = Route.useSearch();          // typed: number\n  return (\n    <>\n      <h1>Posts, page {page}</h1>\n      <Link to=\"/posts/$postId\" params={{ postId: '42' }}>Read post 42</Link>\n      <Link to=\"/posts\" search={(prev) => ({ ...prev, page: page + 1 })}>Next</Link>\n    </>\n  );\n}",
        apiReference: [
          {
            name: "createFileRoute",
            kind: "function (@tanstack/react-router)",
            signature: "export const Route = createFileRoute('/path/$param')({ component, loader?, beforeLoad?, validateSearch?, ssr?, head?, server? })",
            params: [
              { name: "validateSearch", type: "schema | (search) => T", description: "Parses and types the URL search params." },
              { name: "loader", type: "(ctx) => data", description: "Loads data before the route renders." },
              { name: "beforeLoad", type: "(ctx) => context", description: "Runs first: auth checks, redirects, context." },
            ],
            returns: "A Route with typed hooks: useParams, useSearch, useLoaderData, useRouteContext.",
          },
        ],
        exercise: "- Add /posts/$postId and read the param\n- Validate ?page= and ?sort= with a schema and build a paginated list\n- Create a pathless _auth layout that wraps two routes",
        checkpoint: "- How is a dynamic segment named in a file?\n- What does validateSearch give you?\n- What is a pathless layout?",
        mistake: "- Do not parse search params manually in components\n- Do not forget <Outlet /> in layout routes\n- Do not hardcode URLs; use typed Link and navigate",
      },
      {
        title: "Loaders and data fetching",
        diagram: {
          kind: "flow",
          caption: "Where a loader runs: on the server for the first request, then in the browser for client-side navigations. That is why it must be safe in both places.",
          items: [
            { label: "First request (SSR)", detail: "beforeLoad + loader run on the server" },
            { label: "HTML streams to the browser", detail: "loader data is serialised with it" },
            { label: "Hydration", detail: "the client reuses the data, no refetch" },
            { label: "Client navigation", detail: "the next route's loader runs in the browser" },
            { label: "Server-only needs", detail: "call a server function from the loader" },
          ],
        },
        explanation: "- A loader returns data for a route; components read it with Route.useLoaderData()\n- Loaders run on the server for the initial request and on the client for later navigations\n- Code in a loader must therefore be safe in the browser: no secrets, no direct database access\n- Call a server function from the loader to do server-only work\n- Pending, error and not-found states are handled with pendingComponent, errorComponent and notFound()",
        keyPoints: [
          { tone: "key", text: "Pattern: loader: () => getPosts(), where getPosts is a createServerFn — isomorphic call, server-only execution." },
          { tone: "tip", text: "Pair loaders with TanStack Query to cache, refetch and share data across routes." },
          { tone: "warning", text: "process.env.SECRET inside a loader is exposed to the client bundle." },
        ],
        example: "- loader: ({ params }) => getPost({ data: params.postId })\n- const post = Route.useLoaderData()\n- if (!post) throw notFound() renders the route's notFoundComponent\n- pendingComponent: () => <Spinner /> shows while a slow loader runs",
        code: "// src/routes/posts/$postId.tsx\nimport { createFileRoute, notFound } from '@tanstack/react-router';\nimport { createServerFn } from '@tanstack/react-start';\n\nconst getPost = createServerFn({ method: 'GET' })\n  .inputValidator((postId: string) => postId)\n  .handler(async ({ data: postId }) => {\n    // Server only: safe to use secrets and the database here\n    const post = await db.post.findUnique({ where: { id: postId } });\n    return post ?? null;\n  });\n\nexport const Route = createFileRoute('/posts/$postId')({\n  loader: async ({ params }) => {\n    const post = await getPost({ data: params.postId });  // isomorphic call\n    if (!post) throw notFound();\n    return post;\n  },\n  pendingComponent: () => <p>Loading post…</p>,\n  notFoundComponent: () => <p>That post does not exist.</p>,\n  component: PostPage,\n});\n\nfunction PostPage() {\n  const post = Route.useLoaderData();\n  return <article><h1>{post.title}</h1><p>{post.body}</p></article>;\n}",
        exercise: "- Load a list in a loader through a server function and render it\n- Throw notFound() for a missing record and render a custom message\n- Add a pendingComponent and simulate a slow request",
        checkpoint: "- Why is a loader called isomorphic?\n- How do you run server-only code from a loader?\n- How does a component read loader data?",
        mistake: "- Do not access the database or secrets directly in a loader\n- Do not fetch the same data again in the component after the loader loaded it\n- Do not ignore not-found and error states",
      },
      {
        title: "Server functions with createServerFn",
        diagram: {
          kind: "flow",
          caption: "A server function is a typed RPC: you call it like a normal async function anywhere, and the framework turns the call into a request to the server, runs validation and middleware, then the handler.",
          items: [
            { label: "Call: await createPost({ data: { title } })", detail: "from a loader, component or event" },
            { label: "Network request (client) or direct call (server)", detail: "handled for you" },
            { label: ".middleware([...])", detail: "auth, logging, context" },
            { label: ".inputValidator(schema)", detail: "reject bad input, type data" },
            { label: ".handler(({ data, context }) => ...)", detail: "server-only code" },
          ],
        },
        explanation: "- createServerFn({ method: 'GET' | 'POST' }) defines a function whose handler runs only on the server\n- .inputValidator() validates and types the input; pass a schema such as Zod\n- .middleware() attaches request context such as the signed-in user\n- Call it with await fn({ data }) from loaders, components or event handlers; useServerFn wraps it for components\n- createServerOnlyFn marks utilities that must never run on the client, and throws if they do",
        keyPoints: [
          { tone: "key", text: "Every server function is a public endpoint: validate input and check authorisation inside it." },
          { tone: "tip", text: "Throw redirect({ to: '/dashboard' }) from a server function to navigate after success." },
          { tone: "tip", text: "Use GET for reads (cacheable) and POST for writes." },
        ],
        example: "- const createPost = createServerFn({ method: 'POST' }).inputValidator(PostSchema).handler(...)\n- await createPost({ data: { title: 'Hello' } })\n- const getEnv = createServerOnlyFn(() => process.env.DATABASE_URL)\n- const create = useServerFn(createPost) inside a component",
        code: "import { createServerFn, useServerFn } from '@tanstack/react-start';\nimport { redirect } from '@tanstack/react-router';\nimport { z } from 'zod';\nimport { authMiddleware } from './middleware';\n\nconst PostInput = z.object({\n  title: z.string().trim().min(3).max(120),\n  body: z.string().max(10_000),\n});\n\nexport const createPost = createServerFn({ method: 'POST' })\n  .middleware([authMiddleware])           // adds context.user\n  .inputValidator(PostInput)                   // data is typed and validated\n  .handler(async ({ data, context }) => {\n    const post = await db.post.create({ data: { ...data, authorId: context.user.id } });\n    throw redirect({ to: '/posts/$postId', params: { postId: post.id } });\n  });\n\nexport function NewPostForm() {\n  const create = useServerFn(createPost);\n  return (\n    <form\n      onSubmit={async (event) => {\n        event.preventDefault();\n        const form = new FormData(event.currentTarget);\n        await create({ data: { title: String(form.get('title')), body: String(form.get('body')) } });\n      }}\n    >\n      <input name=\"title\" required />\n      <textarea name=\"body\" />\n      <button>Publish</button>\n    </form>\n  );\n}",
        apiReference: [
          {
            name: "createServerFn",
            kind: "function (@tanstack/react-start)",
            signature: "createServerFn({ method?: 'GET' | 'POST' }).middleware([...]).inputValidator(schema | fn).handler(async ({ data, context }) => result)",
            params: [
              { name: "method", type: "'GET' | 'POST'", description: "HTTP method used when called from the client." },
              { name: "validator", type: "schema | (input) => data", description: "Validates and types the data argument." },
              { name: "middleware", type: "Middleware[]", description: "Runs before the handler; can add typed context." },
            ],
            returns: "An async function called as fn({ data }), returning the handler's result with full types.",
          },
        ],
        exercise: "- Write a createTodo server function with Zod validation\n- Add auth middleware that rejects anonymous calls\n- Redirect to the new item after creating it",
        checkpoint: "- Where does a server function's handler run?\n- Why validate server function input?\n- What does createServerOnlyFn prevent?",
        mistake: "- Do not trust input just because your own UI sends it\n- Do not return database objects containing secrets to the client\n- Do not use GET server functions for writes",
        interview: [
          {
            question: "What is a server function in TanStack Start and how is it secured?",
            definition: "A function created with createServerFn whose handler runs only on the server but can be called from anywhere like a normal async function.",
            answer: "The framework turns client calls into HTTP requests to an endpoint and runs the handler on the server, keeping secrets and database access server-side. Because anyone can call that endpoint, validate input with .inputValidator(), enforce authentication and authorisation in the handler or in middleware, return only safe data, and use POST for mutations.",
            similar: [
              { question: "How do you share logic like auth across server functions?", answer: "Create middleware with createMiddleware and attach it with .middleware([authMiddleware])." },
            ],
          },
        ],
      },
      {
        title: "Server routes and middleware",
        diagram: {
          kind: "flow",
          caption: "The request pipeline: global request middleware runs for every request, route-level middleware for one route's handlers, then the matching HTTP method handler.",
          items: [
            { label: "Incoming request", detail: "SSR page, server route or server function" },
            { label: "Global request middleware", detail: "src/start.ts: createStart({ requestMiddleware })" },
            { label: "Route middleware", detail: "server: { middleware: [...] }" },
            { label: "Handler: GET / POST / PUT / DELETE", detail: "returns a Web Response" },
          ],
        },
        explanation: "- Server routes are HTTP endpoints defined in route files with a server.handlers object\n- Handlers receive the Web Request and return a Web Response, like other modern runtimes\n- A route can have both server handlers and a page component\n- createMiddleware().server(({ next, request }) => ...) builds reusable middleware\n- Register global request middleware in src/start.ts with createStart",
        keyPoints: [
          { tone: "key", text: "Server routes are for public APIs, webhooks and file responses; server functions are for your own UI's RPC calls." },
          { tone: "tip", text: "Return Response.json(data) for JSON APIs and set status codes explicitly." },
          { tone: "warning", text: "Verify webhook signatures in server routes before trusting the payload." },
        ],
        example: "- server: { handlers: { GET: () => Response.json({ ok: true }) } } in src/routes/api/health.ts\n- A POST handler receives a Stripe webhook and verifies its signature\n- A logging middleware records method, path and duration for every request\n- An auth middleware attached to /api/admin/* routes rejects non-admins",
        code: "// src/routes/api/health.ts\nimport { createFileRoute } from '@tanstack/react-router';\n\nexport const Route = createFileRoute('/api/health')({\n  server: {\n    handlers: {\n      GET: async () => Response.json({ status: 'ok', time: new Date().toISOString() }),\n    },\n  },\n});\n\n// src/middleware.ts\nimport { createMiddleware } from '@tanstack/react-start';\n\nexport const loggingMiddleware = createMiddleware().server(async ({ next, request }) => {\n  const start = Date.now();\n  const result = await next();\n  console.log(request.method, new URL(request.url).pathname, `${Date.now() - start}ms`);\n  return result;\n});\n\n// src/start.ts — global middleware for every request\nimport { createStart } from '@tanstack/react-start';\nimport { loggingMiddleware } from './middleware';\n\nexport const startInstance = createStart(() => ({\n  requestMiddleware: [loggingMiddleware],\n}));\n\n// Route-level: server: { middleware: [authMiddleware], handlers: { POST: ... } }",
        apiReference: [
          {
            name: "Route server handlers",
            kind: "route option",
            signature: "createFileRoute('/path')({ server: { middleware?: [...], handlers: { GET, POST, PUT, PATCH, DELETE: ({ request, params }) => Response } } })",
            params: [
              { name: "request", type: "Request", description: "The standard Web Request." },
              { name: "params", type: "object", description: "Typed dynamic params of the route." },
            ],
            returns: "A Response (or Promise of one) sent to the client.",
          },
          {
            name: "createMiddleware",
            kind: "function (@tanstack/react-start)",
            signature: "createMiddleware().server(async ({ next, request, context }) => next({ context: {...} }))",
            params: [{ name: "next", type: "(opts?) => Promise<result>", description: "Continues the chain; pass context to downstream handlers." }],
            returns: "Middleware usable globally, on server routes and on server functions.",
          },
        ],
        exercise: "- Add a /api/health server route\n- Write a timing middleware and register it globally\n- Protect a POST server route with auth middleware",
        checkpoint: "- When would you choose a server route over a server function?\n- What do handlers receive and return?\n- Where is global middleware registered?",
        mistake: "- Do not expose internal APIs as server routes when a server function would do\n- Do not skip webhook signature checks\n- Do not forget to call next() in middleware",
      },
      {
        title: "Rendering modes and deployment",
        diagram: {
          kind: "split",
          caption: "TanStack Start lets each route choose how it renders, and the whole app choose where it deploys.",
          headings: ["Per-route rendering", "Build and deploy"],
          items: [
            { label: "Full SSR (default)", detail: "server renders HTML, streams it", group: 0 },
            { label: "ssr: 'data-only'", detail: "loaders on the server, component on the client", group: 0 },
            { label: "ssr: false", detail: "client-only route, e.g. a dashboard", group: 0 },
            { label: "ssr: ({ params, search }) => ...", detail: "decide per request", group: 0 },
            { label: "prerender: { routes, crawlLinks }", detail: "static HTML at build time", group: 1 },
            { label: "SPA mode", detail: "static shell, no server rendering", group: 1 },
            { label: "Hosts", detail: "Node, Netlify, Vercel, Cloudflare and more", group: 1 },
          ],
        },
        explanation: "- By default every route is server-rendered and streamed, then hydrated in the browser\n- Selective SSR sets ssr: 'data-only' or ssr: false per route, or a function deciding per request\n- Prerendering generates static HTML for chosen routes at build time; crawlLinks follows links to find more\n- SPA mode ships a static shell for apps that need no server rendering\n- The same app deploys to many hosts through the build output and host adapters",
        keyPoints: [
          { tone: "key", text: "Use ssr: false for authenticated, SEO-irrelevant pages that depend on browser-only APIs." },
          { tone: "tip", text: "Prerender marketing and docs pages; keep dynamic, personalised routes server-rendered." },
          { tone: "warning", text: "Hydration errors appear when server and client render different HTML (dates, random values, window checks); move such code into effects or client-only routes." },
        ],
        example: "- export const Route = createFileRoute('/dashboard')({ ssr: false, component: Dashboard })\n- ssr: 'data-only' for a heavy chart that needs server data but renders in the browser\n- tanstackStart({ prerender: { routes: ['/blog', '/blog/posts/*'], crawlLinks: true } })\n- npm run build produces server and client bundles for your host",
        code: "// src/routes/dashboard.tsx — client-only (no SEO needed)\nimport { createFileRoute } from '@tanstack/react-router';\n\nexport const Route = createFileRoute('/dashboard')({\n  ssr: false,\n  component: DashboardPage,\n});\n\n// src/routes/reports/$reportId.tsx — data on the server, heavy chart on the client\nexport const Route = createFileRoute('/reports/$reportId')({\n  ssr: 'data-only',\n  loader: ({ params }) => getReport({ data: params.reportId }),\n  component: ReportChart,\n});\n\n// vite.config.ts — prerender static pages at build time\nimport { defineConfig } from 'vite';\nimport { tanstackStart } from '@tanstack/react-start/plugin/vite';\nimport viteReact from '@vitejs/plugin-react';\n\nexport default defineConfig({\n  plugins: [\n    tanstackStart({\n      prerender: { routes: ['/', '/blog', '/blog/posts/*'], crawlLinks: true },\n    }),\n    viteReact(),\n  ],\n});",
        apiReference: [
          {
            name: "Route ssr option",
            kind: "route option",
            signature: "ssr: true | false | 'data-only' | (({ params, search }) => boolean | 'data-only' | undefined)",
            params: [
              { name: "true", type: "default", description: "Run loaders and render the component on the server." },
              { name: "'data-only'", type: "string", description: "Run beforeLoad and loader on the server; render the component on the client." },
              { name: "false", type: "boolean", description: "Render entirely on the client." },
            ],
            returns: "How the route behaves on the initial request; client navigations always run in the browser.",
          },
        ],
        exercise: "- Make a dashboard route client-only with ssr: false\n- Prerender your home and blog routes and inspect the generated HTML\n- Deploy the app to one host and note which parts run where",
        checkpoint: "- What does ssr: 'data-only' do?\n- When is prerendering a good fit?\n- What typically causes hydration errors?",
        mistake: "- Do not disable SSR for pages that need SEO\n- Do not prerender personalised pages\n- Do not read window or localStorage during server rendering",
      },
    ],
    project: "Build a 'Dev blog' with TanStack Start: file-based routes for home, a paginated /posts list with validated ?page= and ?tag= search params, and /posts/$postId; loaders that call GET server functions; an authenticated /dashboard (ssr: false) with a createPost POST server function using Zod validation and auth middleware; a /api/health server route and a /api/webhooks/comments route; global logging middleware; prerendered home and blog pages; and deployment to a host of your choice.",
    summary: "- TanStack Start is a full-stack React framework on TanStack Router and Vite\n- Routes live in src/routes with $params, pathless _layouts and typed, validated search params\n- Loaders are isomorphic; do server-only work in createServerFn server functions\n- Server functions validate with .inputValidator(), share logic with .middleware(), and are public endpoints\n- Server routes return Web Responses; createMiddleware and createStart build the request pipeline\n- Choose full SSR, data-only, client-only or prerendering per route, and deploy to many hosts",
    glossary: [
      { term: "TanStack Router", definition: "A fully type-safe React router with loaders and search-param state, the foundation of Start." },
      { term: "File-based routing", definition: "Deriving routes from files in src/routes." },
      { term: "Isomorphic loader", definition: "A loader that runs on the server for the first request and in the browser afterwards." },
      { term: "Search params", definition: "URL query parameters treated as validated, typed state in TanStack Router." },
      { term: "Server function", definition: "A createServerFn function whose handler runs on the server and is called like typed RPC." },
      { term: "Server route", definition: "A route file exposing HTTP method handlers that return Web Responses." },
      { term: "Middleware", definition: "Functions created with createMiddleware that run before handlers and can add context." },
      { term: "Selective SSR", definition: "Per-route control of server rendering with the ssr option." },
      { term: "Prerendering", definition: "Generating static HTML for routes at build time." },
      { term: "Hydration", definition: "React attaching behaviour to server-rendered HTML in the browser." },
    ],
    sources: [
      source("https://tanstack.com/start/latest/docs/framework/react/overview", "TanStack Start overview"),
      source("https://tanstack.com/start/latest/docs/framework/react/getting-started", "Getting started"),
      source("https://tanstack.com/start/latest/docs/framework/react/guide/routing", "Routing"),
      source("https://tanstack.com/start/latest/docs/framework/react/guide/execution-model", "Execution model"),
      source("https://tanstack.com/start/latest/docs/framework/react/guide/server-functions", "Server functions"),
      source("https://tanstack.com/start/latest/docs/framework/react/guide/server-routes", "Server routes"),
      source("https://tanstack.com/start/latest/docs/framework/react/guide/middleware", "Middleware"),
      source("https://tanstack.com/start/latest/docs/framework/react/guide/selective-ssr", "Selective SSR"),
      source("https://tanstack.com/start/latest/docs/framework/react/start-vs-nextjs", "TanStack Start vs Next.js"),
      source("https://tanstack.com/router/latest/docs/framework/react/guide/search-params", "Router: search params"),
    ],
  },
};

const core = expandGuide(guide.id, guide.curriculum);
export const TANSTACK_CORE_LESSON_COUNT = core.lessons.length;
export default { ...guide, version: 3, curriculum: { ...core, title: "TanStack", minutes: core.minutes + TANSTACK_LESSONS.length * 5, objectives: [...core.objectives, "Explore Frameworks, Data & State, UI & UX, Performance and Tooling across all 19 requested libraries."], summary: "Explore TanStack by category: Start and Router; Query, DB, AI and Store; Table, Charts, Form, Hotkeys, Markdown, Highlight and Ranger; Virtual and Pacer; Intent, Devtools, Config and CLI. Apply each library with deliberate state ownership, validated inputs and integration checks.", lessons: [...core.lessons, ...TANSTACK_LESSONS], sources: [...new Map([...(core.sources ?? []), ...TANSTACK_FUNDAMENTALS.flatMap(seed => seed.sources.map(url => ({ title: seed.title, url, retrievedAt: "2026-09-13T00:00:00.000Z" })))].map(item => [item.url, item])).values()] } } satisfies TechnologyGuide;
