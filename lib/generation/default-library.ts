import { Curriculum, DOCUMENT_FORMAT, GenerationRequest } from "@/lib/domain";
import { NEXTJS_16_INTERVIEW, REACT_19_INTERVIEW, withInterview } from "./interview-questions";
import { REACT_19_GUIDE } from "./react-19-guide";
import { TECHNOLOGY_GUIDES } from "./guides";
import { TOPIC_PROJECTS } from "./topic-projects";
import { enrichLearningNotes } from "@/lib/learning-content";
import { expandGuide, GUIDE_EXPANSIONS } from "./guide-expansions";
import { NEXTJS_HOOKS_CORE } from "./guides/nextjs-hooks";
import { NEXTJS16_LESSONS } from "@/lib/notes-fundamentals-catalog";
import { NEXTJS_16_ADDITIONS } from "./guides/nextjs-16-additions";
import { REACT_19_ADDITIONS } from "./guides/react-19-additions";
import { REACT_HOOKS_CORE } from "./guides/react-hooks";

/** Appends standalone lessons to a curriculum, budgeting 30 minutes each. */
function withLessons(curriculum: Curriculum, lessons: Curriculum["lessons"]): Curriculum {
  return { ...curriculum, minutes: curriculum.minutes + lessons.length * 30, lessons: [...curriculum.lessons, ...lessons] };
}

function withHooks(curriculum: Curriculum, hooks: Curriculum): Curriculum {
  return {
    ...curriculum,
    minutes: curriculum.minutes + hooks.minutes,
    lessons: [...curriculum.lessons, ...hooks.lessons],
    sources: [...new Map([...(curriculum.sources ?? []), ...(hooks.sources ?? [])].map(source => [source.url, source])).values()],
  };
}

/**
 * The "Complete Next.js 16 path" guide that every library is seeded with (see
 * lib/server/default-library.ts), alongside the React 19 guide in
 * react-19-guide.ts and the technology notes in ./guides; DEFAULT_GUIDES below
 * lists them all. Unlike the rest of the catalogue this deck
 * is hand-authored rather than model-generated, so it can carry the richer
 * per-lesson sections the AI prompt never fills: an original code-drawn
 * figure, tone-coloured key points, a real-world use case, a vocabulary
 * builder, and a full API/syntax reference.
 *
 * Every fact here is grounded in the Next.js 16 documentation that ships
 * inside the installed package (node_modules/next/dist/docs), which is the
 * same material published on nextjs.org for this exact version — including
 * the 16.0 rename of Middleware to Proxy. Explanations are written from
 * scratch for this course rather than copied from those pages.
 */

const RETRIEVED_AT = "2026-09-10T00:00:00.000Z";

export const NEXTJS_16_GUIDE: Curriculum = {
  title: "Complete Next.js 16 path",
  minutes: 330,
  objectives: [
    "Build routes, layouts and dynamic segments with the App Router's file-system conventions.",
    "Decide what belongs in a Server Component and what needs the client, and compose the two safely.",
    "Fetch, stream, cache and revalidate data with Cache Components and the use cache directive.",
    "Mutate data with Server Actions, and guard every action as an untrusted public endpoint.",
    "Optimise images, fonts and metadata, and serve JSON from Route Handlers.",
    "Read and change the URL from Client Components with every Next.js hook, from usePathname and useRouter to useLinkStatus and useOffline.",
  ],
  prerequisites: [
    "Comfortable with modern JavaScript: modules, promises and async/await.",
    "Basic React: components, props, state and JSX.",
    "Node.js and a package manager installed locally.",
  ],
  lessons: [
    {
      title: "Routing with the App Router",
      diagram: {
        kind: "tree",
        caption: "Folders become URL segments and files become the UI for a segment. Here app/blog/[slug]/page.tsx serves /blog/hello-world, wrapped first by the blog layout and then by the required root layout.",
        items: [
          { label: "app/", detail: "the routing root" },
          { label: "layout.tsx", detail: "root layout, required, renders html and body", depth: 1 },
          { label: "page.tsx", detail: "UI for /", depth: 1 },
          { label: "blog/", depth: 1 },
          { label: "layout.tsx", detail: "wraps every route under /blog", depth: 2 },
          { label: "page.tsx", detail: "UI for /blog", depth: 2 },
          { label: "[slug]/", detail: "dynamic segment", depth: 2 },
          { label: "page.tsx", detail: "UI for /blog/hello-world", depth: 3 },
        ],
      },
      explanation: "- Next.js routes come from the file system, not a route table\n- A folder defines a URL segment; a page file makes that segment publicly reachable\n- A layout wraps its segment and everything nested below it\n- The root layout is required and must render the html and body tags\n- Square brackets around a folder name create a dynamic segment",
      keyPoints: [
        { tone: "key", text: "Folders map to URL segments; page and layout files map to UI." },
        { tone: "key", text: "Layouts preserve state and stay interactive across navigations; they do not re-render." },
        { tone: "warning", text: "In Next.js 16 params and searchParams are Promises. You must await them." },
        { tone: "tip", text: "PageProps and LayoutProps are generated globally, so route params are typed without an import." },
        { tone: "warning", text: "Reading searchParams opts the page into dynamic rendering, because it needs the request." },
      ],
      example: "- Add app/blog/page.tsx and /blog starts serving that component\n- Nest app/blog/[slug]/page.tsx and one file serves every post URL\n- Add app/blog/layout.tsx to give only the blog section a shared shell\n- Link between them with the Link component from next/link",
      useCase: {
        scenario: "A documentation site needs a shared sidebar across every /docs page, its own header on /docs, and a separate page per article without hand-writing hundreds of routes.",
        example: "Put the sidebar in app/docs/layout.tsx, the index in app/docs/page.tsx, and the article view in app/docs/[slug]/page.tsx. The slug arrives as a route param, and one component renders every article.",
        usage: "The sidebar keeps its scroll position and open sections as readers move between articles, because a layout is not re-rendered on navigation within its subtree.",
      },
      code: "// app/blog/[slug]/page.tsx\nexport default async function Page(props: PageProps<'/blog/[slug]'>) {\n  const { slug } = await props.params\n  const post = await getPost(slug)\n\n  return (\n    <article>\n      <h1>{post.title}</h1>\n      <p>{post.content}</p>\n    </article>\n  )\n}\n\n// app/blog/layout.tsx — wraps /blog and everything under it\nexport default function BlogLayout({\n  children,\n}: {\n  children: React.ReactNode\n}) {\n  return <section className=\"prose\">{children}</section>\n}",
      apiReference: [
        {
          name: "PageProps",
          kind: "type helper",
          signature: "PageProps<'/route/[param]'> = {\n  params: Promise<{ param: string }>\n  searchParams: Promise<{ [key: string]: string | string[] | undefined }>\n}",
          params: [
            { name: "params", type: "Promise<object>", description: "Dynamic route segments for this route. Resolves to {} for a static route." },
            { name: "searchParams", type: "Promise<object>", description: "URL query parameters. Reading them opts the page into dynamic rendering." },
          ],
          returns: "The props object a page component receives, typed from the literal route path.",
          notes: "Globally available; no import needed. Generated by next dev, next build or next typegen.",
        },
      ],
      exercise: "- Create app/shop/page.tsx and confirm /shop renders\n- Add app/shop/[id]/page.tsx and await params to read the id\n- Add app/shop/layout.tsx with a heading, and watch it persist across navigations",
      checkpoint: "- Which file makes a folder publicly reachable as a URL?\n- Why must you await params before reading a dynamic segment?\n- What happens to layout state when you navigate between two of its child pages?",
      mistake: "- Do not destructure params synchronously; it is a Promise in Next.js 16\n- Do not omit html and body from the root layout, it is required to render them\n- Do not create a route.ts and a page.tsx at the same segment; they conflict",
      vocabulary: [
        { word: "segment", meaning: "One slash-separated part of a URL path that a folder in the app directory maps to.", example: "The /blog/hello route has two segments below the root: blog and hello.", synonyms: ["path part", "route piece", "URL part", "path slice", "route token"], antonyms: ["full URL", "origin", "whole path", "query string", "hash"] },
        { word: "nested", meaning: "Placed inside something else, so the outer thing wraps and contains the inner one.", example: "A nested layout wraps every page below its own folder.", synonyms: ["contained", "embedded", "wrapped", "inner", "enclosed"], antonyms: ["flat", "top-level", "sibling", "unwrapped", "root-level"] },
        { word: "dynamic", meaning: "Decided at request time from data or the URL rather than fixed when the app is built.", example: "A dynamic segment turns one file into a route for thousands of blog posts.", synonyms: ["variable", "runtime", "computed", "request-time", "data-driven"], antonyms: ["static", "fixed", "prebuilt", "constant", "hardcoded"] },
        { word: "convention", meaning: "An agreed naming rule the framework recognises, so configuration is not needed.", example: "Naming the file page.tsx is a convention that makes the segment routable.", synonyms: ["rule", "standard", "agreed pattern", "naming rule", "default behaviour"], antonyms: ["configuration", "exception", "custom setting", "override", "explicit config"] },
        { word: "hierarchy", meaning: "An arrangement in levels where each level sits under the one above it.", example: "The folder hierarchy decides which layouts wrap which pages.", synonyms: ["ordering", "tree", "nesting", "levels", "parent-child chain"], antonyms: ["flatness", "disorder", "flat list", "single level", "unordered set"] },
        { word: "persist", meaning: "To continue existing across a change instead of being discarded and rebuilt.", example: "Sidebar scroll position persists because layouts are not re-rendered on navigation.", synonyms: ["endure", "remain", "survive", "carry over", "retain"], antonyms: ["reset", "discard", "expire", "clear", "vanish"] },
      ],
    },
    {
      title: "Server and Client Components",
      diagram: {
        kind: "split",
        caption: "Both kinds of component are React components; the difference is where they run and what they may use. Server Components render to an RSC payload on the server, then Client Components hydrate in the browser to add interactivity.",
        headings: ["Server Component (default)", "Client Component ('use client')"],
        items: [
          { label: "Fetch from a database or API", detail: "Credentials never reach the browser", group: 0 },
          { label: "Read secrets and API keys", detail: "Kept out of the client bundle", group: 0 },
          { label: "Ship less JavaScript", detail: "Improves First Contentful Paint", group: 0 },
          { label: "State and event handlers", detail: "useState, onClick, onChange", group: 1 },
          { label: "Lifecycle and custom hooks", detail: "useEffect and hooks built on it", group: 1 },
          { label: "Browser-only APIs", detail: "window, localStorage, geolocation", group: 1 },
        ],
      },
      explanation: "- Layouts and pages are Server Components unless you opt out\n- Add the use client directive at the top of a file to make it a Client Component\n- That directive marks a boundary: every import below it joins the client bundle\n- Server Components render to an RSC payload, which React uses to build the DOM\n- Hydration is React attaching event handlers to the already-delivered HTML",
      keyPoints: [
        { tone: "key", text: "Server is the default. Reach for the client only when you need interactivity or browser APIs." },
        { tone: "key", text: "use client marks a boundary, not a single component. Everything it imports ships to the browser." },
        { tone: "tip", text: "Push use client to the leaves. A search box can be a Client Component inside a server layout." },
        { tone: "tip", text: "A Server Component passed as children to a Client Component still renders on the server." },
        { tone: "warning", text: "React context is unavailable in Server Components; wrap providers in a Client Component." },
        { tone: "warning", text: "Props crossing the boundary must be serialisable by React." },
      ],
      example: "- A page fetches a post on the server and renders its title as static HTML\n- It passes the like count to a LikeButton marked use client\n- Only the button's JavaScript is shipped, not the data-fetching code\n- The reader sees text immediately, then the button becomes clickable",
      useCase: {
        scenario: "A product page shows a description, price and reviews that never change per click, plus an add-to-cart button that must respond instantly.",
        example: "The page stays a Server Component and queries the product database directly. Only AddToCart carries 'use client' and holds the quantity in useState.",
        usage: "The catalogue query, its credentials and its SDK stay on the server, so the browser downloads a few kilobytes for the button instead of the whole data layer.",
      },
      code: "// app/[id]/page.tsx — Server Component (no directive needed)\nimport LikeButton from '@/app/ui/like-button'\nimport { getPost } from '@/lib/data'\n\nexport default async function Page({\n  params,\n}: {\n  params: Promise<{ id: string }>\n}) {\n  const { id } = await params\n  const post = await getPost(id)\n\n  return (\n    <main>\n      <h1>{post.title}</h1>\n      <LikeButton likes={post.likes} />\n    </main>\n  )\n}\n\n// app/ui/like-button.tsx — Client Component\n'use client'\n\nimport { useState } from 'react'\n\nexport default function LikeButton({ likes }: { likes: number }) {\n  const [count, setCount] = useState(likes)\n  return <button onClick={() => setCount(count + 1)}>{count}</button>\n}",
      apiReference: [
        {
          name: "'use client'",
          kind: "directive",
          signature: "'use client'\n// must be the first statement in the file, above every import",
          params: [
            { name: "placement", type: "file top", description: "Applies to the whole module and to everything that module imports." },
          ],
          returns: "Nothing. It marks the boundary between the server and client module graphs.",
          notes: "Does not apply to Server Components passed in as children or other props; those are rendered on the server and passed through as output.",
        },
        {
          name: "server-only",
          kind: "package",
          signature: "import 'server-only'\n// at the top of a module that must never reach the browser",
          params: [
            { name: "side effect import", type: "import statement", description: "Turns accidental client usage of this module into a build-time error." },
          ],
          returns: "Nothing at runtime; the protection is enforced at build time.",
          notes: "Installing it is optional in Next.js, which handles the import internally. A matching client-only package exists for browser-only modules.",
        },
      ],
      exercise: "- Take a page that uses useState and move the stateful part into its own file\n- Add use client only to that file and keep the page a Server Component\n- Check the network tab and compare the JavaScript shipped before and after",
      checkpoint: "- Where does the use client directive have to appear in a file?\n- Why can a Server Component be passed as children to a Client Component?\n- What does hydration actually attach to the delivered HTML?",
      mistake: "- Do not put use client at the top of a shared layout to fix one button\n- Do not pass non-serialisable values such as functions or class instances as props across the boundary\n- Do not assume an unprefixed environment variable is available in the browser; only NEXT_PUBLIC_ ones are",
      vocabulary: [
        { word: "hydration", meaning: "React attaching event handlers to server-rendered HTML so a static page becomes interactive.", example: "Until hydration finishes, the markup is visible but the button does nothing.", synonyms: ["activation", "wiring up", "attaching behaviour", "client takeover", "interactivity setup"], antonyms: ["dehydration", "static render", "server-only render", "inert markup", "plain HTML"] },
        { word: "serialisable", meaning: "Able to be converted into a format that can be sent over the network and rebuilt on the other side.", example: "A function is not serialisable, so it cannot be passed as a prop to a Client Component.", synonyms: ["transferable", "encodable", "JSON-safe", "sendable", "portable"], antonyms: ["opaque", "untransferable", "function value", "live handle", "process-bound"] },
        { word: "boundary", meaning: "The dividing line where one execution environment ends and another begins.", example: "The use client directive declares the boundary between the server and client trees.", synonyms: ["border", "demarcation", "dividing line", "edge", "seam"], antonyms: ["overlap", "continuum", "shared scope", "seamless whole", "single environment"] },
        { word: "payload", meaning: "The actual data carried by a message, as opposed to its headers or wrapper.", example: "The RSC payload holds the rendered server output plus placeholders for client components.", synonyms: ["content", "cargo", "body", "data", "message content", "transmitted value"], antonyms: ["envelope", "metadata", "header", "wrapper", "transport frame", "protocol overhead"] },
        { word: "bundle", meaning: "The compiled file of JavaScript a browser downloads to run part of an application.", example: "Marking a large module use client pulls all of its imports into the client bundle.", synonyms: ["build artifact", "chunk", "compiled output", "asset", "package"], antonyms: ["source file", "module", "raw source", "untranspiled file", "individual module"] },
        { word: "compose", meaning: "To build something larger by fitting smaller independent pieces together.", example: "You compose an interactive page from server-rendered content and small client islands.", synonyms: ["assemble", "combine", "put together", "layer", "nest"], antonyms: ["decompose", "separate", "split apart", "flatten", "inline everything"] },
      ],
    },
    {
      title: "Fetching data and streaming",
      diagram: {
        kind: "flow",
        caption: "A request renders the shell straight away and streams slower pieces in behind their Suspense fallbacks, so readers see something useful before every query has finished.",
        items: [
          { label: "Request arrives", detail: "The route's component tree begins rendering on the server" },
          { label: "Shell renders immediately", detail: "Header, nav and any content that needs no awaited data" },
          { label: "Suspense fallback ships", detail: "A skeleton stands in for the slow subtree" },
          { label: "Data resolves on the server", detail: "fetch, an ORM query, or any async I/O" },
          { label: "Real UI streams in", detail: "React swaps the fallback for the finished markup" },
        ],
      },
      explanation: "- A Server Component can be an async function and await data directly\n- Any async I/O works: the fetch API, an ORM, or a database client\n- Identical fetch requests in one render pass are memoised, so you can fetch where you need the data\n- fetch is not cached by default and will block the page until it resolves\n- Wrap slow subtrees in Suspense so the rest of the page can be sent first",
      keyPoints: [
        { tone: "key", text: "Server Components can await data directly; there is no useEffect-and-loading dance." },
        { tone: "key", text: "fetch requests are not cached by default in Next.js 16 and block rendering until they finish." },
        { tone: "tip", text: "Start requests together and await Promise.all so independent queries run in parallel." },
        { tone: "tip", text: "React.cache memoises a function for one request, so several components share a single query." },
        { tone: "warning", text: "Awaiting in a layout blocks navigation; await deeper in the tree, inside a boundary." },
        { tone: "warning", text: "Promise.all rejects if any request fails. Use Promise.allSettled when partial data is acceptable." },
      ],
      example: "- A blog page awaits getPosts and renders the list\n- The sidebar's slow recommendation query is wrapped in Suspense\n- Readers get the posts immediately and the recommendations a moment later\n- Nothing about the loading state has to be written by hand in the client",
      useCase: {
        scenario: "A dashboard shows account details that load in 50ms and an analytics roll-up that takes two seconds. Blocking on the slow query would leave the screen blank.",
        example: "Render the account panel directly in the page and wrap the analytics panel in Suspense with a skeleton fallback, so the two are no longer coupled.",
        usage: "Perceived load time drops to the speed of the fastest query, and the slow panel fills in without a client-side spinner or a second round trip.",
      },
      code: "import { Suspense } from 'react'\n\nexport default function Page() {\n  return (\n    <>\n      <h1>Dashboard</h1>\n      <Suspense fallback={<AnalyticsSkeleton />}>\n        <Analytics />\n      </Suspense>\n    </>\n  )\n}\n\nasync function Analytics() {\n  // Start both requests, then await together: they run in parallel\n  const visitsPromise = getVisits()\n  const salesPromise = getSales()\n  const [visits, sales] = await Promise.all([visitsPromise, salesPromise])\n\n  return <Chart visits={visits} sales={sales} />\n}",
      apiReference: [
        {
          name: "cache",
          kind: "function (react)",
          signature: "import { cache } from 'react'\nconst getUser = cache(async (id: string) => Promise<User>)",
          params: [
            { name: "fn", type: "(...args) => Promise<T>", description: "The data-fetching function to memoise for the duration of one request." },
          ],
          returns: "A wrapped function that returns the same result for the same arguments within a single request.",
          notes: "Scoped to the current request only. Each request gets its own memoisation scope with no sharing between requests.",
        },
        {
          name: "Suspense",
          kind: "component (react)",
          signature: "<Suspense fallback={<Skeleton />}>\n  <SlowComponent />\n</Suspense>",
          params: [
            { name: "fallback", type: "ReactNode", description: "UI shipped in the static shell and shown while the subtree's async work runs." },
            { name: "children", type: "ReactNode", description: "The subtree whose async work may suspend rendering." },
          ],
          returns: "The children once resolved; the fallback until then.",
          notes: "A boundary does not by itself make a component dynamic. Purely synchronous work still completes during prerendering.",
        },
      ],
      exercise: "- Fetch two independent resources in one component with two awaits in sequence\n- Rewrite them to start together and await with Promise.all\n- Wrap the slower of the two in its own Suspense boundary and compare first paint",
      checkpoint: "- Why does awaiting one request after another make a page slower than it needs to be?\n- What does a Suspense fallback contribute to the static shell?\n- How long does a React.cache memoised result live?",
      mistake: "- Do not assume fetch results are cached; in Next.js 16 they are not by default\n- Do not await slow data at the top of a layout, it blocks the whole navigation\n- Do not reach for useEffect data fetching when the component can simply be async on the server",
      vocabulary: [
        { word: "streaming", meaning: "Sending a response in pieces as they become ready instead of waiting for all of it.", example: "Streaming lets the header appear while the report is still being queried.", synonyms: ["progressive delivery", "chunking", "incremental delivery", "piecewise sending", "flushing early"], antonyms: ["buffering", "blocking", "all-at-once response", "full buffering", "wait-then-send"] },
        { word: "memoise", meaning: "To remember the result of a call so an identical call can reuse it instead of recomputing.", example: "React.cache memoises the query so three components trigger one database round trip.", synonyms: ["cache", "remember", "cache a result", "reuse", "store the answer"], antonyms: ["recompute", "refetch", "recalculate", "re-derive", "recompute each time"] },
        { word: "concurrent", meaning: "Making progress on several tasks over the same period rather than strictly one after another.", example: "Promise.all makes the two queries concurrent, so the slower one sets the total time.", synonyms: ["parallel", "simultaneous", "interleaved", "overlapping", "multi-tasked"], antonyms: ["sequential", "serial", "blocking", "one at a time", "strictly ordered"] },
        { word: "fallback", meaning: "A stand-in shown while the real content is unavailable.", example: "The skeleton is the fallback the reader sees until the chart data arrives.", synonyms: ["placeholder", "stand-in", "skeleton", "placeholder view", "loading state"], antonyms: ["final content", "resolved view", "real content", "settled UI", "loaded result"] },
        { word: "latency", meaning: "The delay between making a request and receiving the response.", example: "Streaming hides latency by showing the shell before the slow query returns.", synonyms: ["delay", "lag", "round-trip time", "wait", "response delay"], antonyms: ["immediacy", "responsiveness", "instant response", "low delay", "snappiness"] },
        { word: "granular", meaning: "Broken into small parts, allowing precise control over each one.", example: "Suspense gives granular control over which section streams and which ships instantly.", synonyms: ["fine-grained", "detailed", "per-item", "precise", "narrow-scoped"], antonyms: ["coarse", "monolithic", "all-or-nothing", "broad", "whole-page"] },
      ],
    },
    {
      title: "Caching with Cache Components",
      diagram: {
        kind: "split",
        caption: "With Cache Components enabled, each part of a route is handled according to the APIs it uses. Cached and predictable work joins the static shell; request-dependent work streams in behind a boundary.",
        headings: ["Joins the static shell", "Streams at request time"],
        items: [
          { label: "use cache with a cacheLife", detail: "Result is stored and prerendered", group: 0 },
          { label: "Module imports and pure computation", detail: "Same output every run", group: 0 },
          { label: "Suspense fallback UI", detail: "Ships instantly as a placeholder", group: 0 },
          { label: "cookies(), headers(), searchParams", detail: "Need the incoming request", group: 1 },
          { label: "Uncached fetches and queries", detail: "Fresh data on every request", group: 1 },
          { label: "Math.random(), Date.now()", detail: "Use connection() or cache the value", group: 1 },
        ],
      },
      explanation: "- Cache Components is switched on with cacheComponents: true in next.config.ts\n- The use cache directive caches the return value of an async function or component\n- Pair every cache directive with a cacheLife profile, or the implicit default applies\n- Arguments and captured values become part of the cache key\n- The result is a static shell that a CDN can serve, with dynamic parts streamed in: Partial Prerendering",
      keyPoints: [
        { tone: "key", text: "use cache works at two levels: a data function, or a whole component or page." },
        { tone: "key", text: "Everything a cached function closes over becomes part of its cache key." },
        { tone: "tip", text: "Extract a runtime value such as a session id and pass it as an argument to a cached function." },
        { tone: "tip", text: "cacheTag lets you invalidate a group of entries later by name instead of by URL." },
        { tone: "warning", text: "Do not use use cache for data that must be fresh per request; use Suspense instead." },
        { tone: "warning", text: "Cache entries are scoped to one deployment; a new build starts with an empty cache." },
      ],
      example: "- getUsers() caches a database query for an hour with cacheLife('hours')\n- A blog list component caches its rendered output and joins the static shell\n- A preferences panel reads cookies and streams in behind a Suspense fallback\n- One page therefore mixes static, cached and per-request content",
      useCase: {
        scenario: "A storefront's category page shows a product grid that changes a few times a day and a basket summary that is different for every visitor.",
        example: "Mark the grid component with use cache and cacheLife('hours'), tag it with cacheTag('products'), and wrap the basket in Suspense so it streams per request.",
        usage: "The grid is prerendered and served from a CDN for everyone, while the basket renders per visitor. Publishing a product calls updateTag('products') to refresh only the grid.",
      },
      code: "// next.config.ts\nimport type { NextConfig } from 'next'\nconst nextConfig: NextConfig = { cacheComponents: true }\nexport default nextConfig\n\n// app/products/page.tsx\nimport { Suspense } from 'react'\nimport { cacheLife, cacheTag } from 'next/cache'\n\nasync function ProductGrid() {\n  'use cache'\n  cacheLife('hours')\n  cacheTag('products')\n\n  const products = await db.query('SELECT * FROM products')\n  return <Grid items={products} />\n}\n\nexport default function Page() {\n  return (\n    <>\n      <ProductGrid />\n      <Suspense fallback={<BasketSkeleton />}>\n        <Basket />\n      </Suspense>\n    </>\n  )\n}",
      apiReference: [
        {
          name: "'use cache'",
          kind: "directive",
          signature: "async function getData() {\n  'use cache'\n  cacheLife('hours')\n  return db.query('...')\n}",
          params: [
            { name: "placement", type: "function body or file top", description: "At the top of an async function or component body, or at the top of a file to cache all its exports." },
          ],
          returns: "The function's value, serialised into an RSC payload and reused until its lifetime expires.",
          notes: "Arguments and values captured from parent scopes form the cache key, so different inputs produce separate entries.",
        },
        {
          name: "cacheLife",
          kind: "function (next/cache)",
          signature: "import { cacheLife } from 'next/cache'\ncacheLife('hours')",
          params: [
            { name: "profile", type: "string | object", description: "A named profile such as 'hours', or an object setting stale, revalidate and expire." },
          ],
          returns: "Nothing. It assigns a lifetime to the surrounding cached function.",
          notes: "Recommended alongside every use cache directive. Without one the implicit default profile applies.",
        },
      ],
      exercise: "- Enable cacheComponents in next.config.ts\n- Add use cache and cacheLife('hours') to a data function and reload twice\n- Add a component that reads cookies() and watch the build ask you to wrap it in Suspense",
      checkpoint: "- What becomes part of a cached function's key besides its arguments?\n- Why does a component reading cookies() need a Suspense boundary?\n- What happens to cache entries when you deploy a new build?",
      mistake: "- Do not cache a function whose output must differ per request\n- Do not call use cache directly inside a Route Handler body; extract a helper function\n- Do not rely on in-memory cached values surviving between serverless requests without use cache: remote",
      vocabulary: [
        { word: "revalidate", meaning: "To refresh a cached entry so later reads see updated data.", example: "Publishing a post calls updateTag so the cached list is revalidated at once.", synonyms: ["refresh", "invalidate", "re-fetch", "renew", "update the cache"], antonyms: ["retain", "freeze", "serve stale", "keep cached", "never refresh"] },
        { word: "prerender", meaning: "To render output ahead of any request, usually at build time, and store the result.", example: "Cached and static parts of the route are prerendered into the shell.", synonyms: ["pre-generate", "build ahead", "render at build", "generate ahead", "bake"], antonyms: ["render on demand", "defer", "render per request", "compute live", "lazy render"] },
        { word: "stale", meaning: "Still usable but no longer guaranteed to reflect the newest data.", example: "With stale-while-revalidate the reader gets the stale copy while a fresh one is fetched.", synonyms: ["outdated", "aged", "out of date", "old copy", "expired"], antonyms: ["fresh", "current", "up to date", "live", "revalidated"] },
        { word: "ephemeral", meaning: "Short-lived, not guaranteed to survive beyond the moment it was created.", example: "The default in-memory store is ephemeral on serverless infrastructure.", synonyms: ["transient", "temporary", "short-lived", "throwaway", "session-scoped"], antonyms: ["durable", "persistent", "long-lived", "stored", "permanent"] },
        { word: "invalidate", meaning: "To mark cached data as no longer valid so it is not served again unchanged.", example: "revalidatePath invalidates every cached entry for one URL.", synonyms: ["expire", "void", "bust", "purge", "mark stale"], antonyms: ["validate", "preserve", "keep valid", "retain", "serve as-is"] },
        { word: "durable", meaning: "Surviving restarts and instances rather than living only in one process's memory.", example: "use cache: remote moves an entry into a durable store shared across instances.", synonyms: ["persistent", "lasting", "stored", "restart-safe", "long-lived"], antonyms: ["ephemeral", "volatile", "in-memory only", "temporary", "process-bound"] },
      ],
    },
    {
      title: "Mutating data with Server Actions",
      diagram: {
        kind: "flow",
        caption: "One POST carries the whole mutation: the action runs, the cache is invalidated, the route re-renders, and the response returns both the action's value and fresh UI. No follow-up fetch is needed.",
        items: [
          { label: "Form submits", detail: "action={createPost} posts to the server" },
          { label: "Action runs on the server", detail: "Authenticate, authorise, validate, then write" },
          { label: "Cache is invalidated", detail: "revalidatePath, updateTag or refresh" },
          { label: "Route re-renders server-side", detail: "In the same request, not a second one" },
          { label: "One response, two payloads", detail: "The return value and a fresh RSC payload" },
        ],
      },
      explanation: "- A Server Function is an async function that runs on the server and can be called from the client\n- The use server directive marks one function, or every export of a file\n- Used with a form action or a button formAction, it is called a Server Action\n- Actions always run as POST requests, and the client dispatches them one at a time\n- After a mutation you decide how the cache and the current route should update",
      keyPoints: [
        { tone: "warning", text: "An action is a public POST endpoint. Authenticate and authorise inside every one of them." },
        { tone: "key", text: "One roundtrip returns both the action's value and a freshly rendered route." },
        { tone: "key", text: "Server Components support progressive enhancement: forms work before JavaScript loads." },
        { tone: "tip", text: "useActionState gives you a pending flag for loading states without extra state management." },
        { tone: "warning", text: "redirect throws a control-flow exception, so revalidate before you call it." },
        { tone: "tip", text: "Take an id from the client, then re-read the record by ownership from the session." },
      ],
      example: "- A form posts a title straight to createPost with no fetch call\n- The action checks the session, writes the row, then calls revalidatePath('/posts')\n- The same response carries the updated list, already rendered\n- Without JavaScript the form still submits and the page still updates",
      useCase: {
        scenario: "A team wiki needs an edit form that saves a page, shows a saving state, refreshes the article list and returns the reader to the article.",
        example: "updatePage carries 'use server', verifies the session and the user's ownership, writes the row, calls revalidatePath('/wiki'), then redirect(`/wiki/${slug}`).",
        usage: "The button shows a spinner from useActionState's pending flag, and the wiki index is already up to date when the reader lands back on the article.",
      },
      code: "// app/posts/actions.ts\n'use server'\n\nimport { revalidatePath } from 'next/cache'\nimport { redirect } from 'next/navigation'\nimport { auth } from '@/lib/auth'\n\nexport async function createPost(formData: FormData) {\n  const session = await auth()\n  if (!session?.user) throw new Error('Unauthorized')\n\n  const title = String(formData.get('title'))\n  await db.post.create({ data: { title, authorId: session.user.id } })\n\n  revalidatePath('/posts') // before redirect: redirect throws\n  redirect('/posts')\n}\n\n// app/posts/form.tsx\nimport { createPost } from './actions'\n\nexport function Form() {\n  return (\n    <form action={createPost}>\n      <input name=\"title\" />\n      <button type=\"submit\">Create</button>\n    </form>\n  )\n}",
      apiReference: [
        {
          name: "'use server'",
          kind: "directive",
          signature: "'use server'\nexport async function createPost(formData: FormData): Promise<void>",
          params: [
            { name: "placement", type: "function body or file top", description: "Marks one async function, or every export of the file, as a Server Function." },
          ],
          returns: "Nothing itself; the marked function returns a serialisable value to the caller.",
          notes: "Action ids are encrypted at build time and unused actions are stripped from client bundles, but the endpoint is still publicly reachable.",
        },
        {
          name: "revalidatePath",
          kind: "function (next/cache)",
          signature: "import { revalidatePath } from 'next/cache'\nrevalidatePath('/posts')",
          params: [
            { name: "path", type: "string", description: "The URL path whose cached data should be invalidated." },
          ],
          returns: "Nothing. It does not throw, so the action can still return a value.",
          notes: "Triggers a server-side re-render included in the same action response. Use updateTag for read-your-own-writes by tag, or refresh to refetch without invalidating.",
        },
      ],
      exercise: "- Write an action that creates a record and calls revalidatePath\n- Add useActionState in a client button and render its pending flag\n- Remove the session check and note that the endpoint is still reachable by POST",
      checkpoint: "- Why is render-time gating not a security boundary for an action?\n- Why must revalidation come before redirect?\n- What two things does a single action response carry back?",
      mistake: "- Do not trust a whole object from the client; take an id and re-read by ownership\n- Do not parallelise actions with Promise.all; the client dispatches them one at a time\n- Do not place code after redirect and expect it to run",
      vocabulary: [
        { word: "mutation", meaning: "An operation that changes stored data rather than only reading it.", example: "Creating, editing and deleting a post are all mutations.", synonyms: ["write", "change", "update", "state change", "side effect"], antonyms: ["query", "read", "lookup", "fetch", "pure read"] },
        { word: "idempotent", meaning: "Producing the same end state no matter how many times the same call is repeated.", example: "A delete by id is idempotent; a blind counter increment is not.", synonyms: ["repeatable", "stable", "safely retryable", "convergent", "once-effective"], antonyms: ["cumulative", "side-effecting", "duplicating", "accumulating", "unsafe to retry"] },
        { word: "authorise", meaning: "To confirm that an identified user is permitted to perform this particular operation.", example: "Authenticate tells you who is calling; you still have to authorise the delete.", synonyms: ["permit", "sanction", "allow", "grant access", "approve"], antonyms: ["forbid", "deny", "reject", "block", "revoke"] },
        { word: "progressive enhancement", meaning: "Building so the basic function works first, with richer behaviour layered on when available.", example: "Progressive enhancement means the form submits even before JavaScript has loaded.", synonyms: ["graceful layering", "baseline-first", "works without JS", "layered capability", "resilient default"], antonyms: ["graceful degradation", "JS-only", "client-only app", "hard JS dependency", "all-or-nothing UI"] },
        { word: "dispatch", meaning: "To send an operation off to be executed, often through a queue or transition.", example: "The client dispatches actions one at a time to keep the re-rendered tree consistent.", synonyms: ["send", "invoke", "trigger", "fire", "hand off"], antonyms: ["receive", "handle", "process", "consume", "execute inline"] },
        { word: "roundtrip", meaning: "One complete journey from client to server and back again.", example: "The mutation, the invalidation and the re-render all finish in a single roundtrip.", synonyms: ["request cycle", "exchange", "network hop", "client-server cycle", "request and reply"], antonyms: ["local call", "offline op", "in-memory call", "cached read", "local computation"] },
      ],
    },
    {
      title: "Proxy: running code before a request completes",
      diagram: {
        kind: "flow",
        caption: "Proxy is the Next.js 16 name for what earlier versions called Middleware; the behaviour is unchanged. It sits in front of matching routes and may rewrite, redirect, adjust headers, or answer directly.",
        items: [
          { label: "Request arrives", detail: "Browser asks for /about/team" },
          { label: "matcher is tested", detail: "config.matcher decides whether proxy runs at all" },
          { label: "proxy() executes", detail: "Reads the NextRequest: cookies, headers, URL" },
          { label: "A response is chosen", detail: "next(), redirect(), rewrite(), or a direct reply" },
          { label: "Route renders or is skipped", detail: "Only reached when the proxy passes the request on" },
        ],
      },
      explanation: "- Starting with Next.js 16, Middleware is called Proxy; the functionality is the same\n- Create one proxy.ts at the project root, beside app or pages\n- Export the function as proxy, or as the default export\n- Export a config object with a matcher to limit which paths it runs on\n- Proxy is for fast checks, not for slow data fetching or full session management",
      keyPoints: [
        { tone: "warning", text: "Renamed in Next.js 16: the file is proxy.ts, not middleware.ts. Behaviour is unchanged." },
        { tone: "key", text: "Only one proxy file is supported per project; split logic into modules and import them." },
        { tone: "tip", text: "For a plain static redirect, prefer the redirects config in next.config.ts." },
        { tone: "warning", text: "Do not use it as your authorisation layer; it suits optimistic checks only." },
        { tone: "warning", text: "fetch cache options have no effect inside Proxy." },
      ],
      example: "- A proxy reads a locale cookie and rewrites / to /en or /fr\n- An experiment flag rewrites a share of traffic to a variant page\n- A missing session cookie triggers an early redirect to /sign-in\n- A matcher keeps all of this off static asset requests",
      useCase: {
        scenario: "A marketing site runs an A/B test on its pricing page and wants half of new visitors on a variant, without shipping both variants to every browser.",
        example: "proxy.ts reads or assigns a bucket cookie and rewrites /pricing to /pricing-b for bucket B, with matcher: '/pricing'.",
        usage: "The URL the visitor sees never changes, the variant is chosen before rendering, and no client-side flash of the wrong version occurs.",
      },
      code: "// proxy.ts — project root, beside app/\nimport { NextResponse } from 'next/server'\nimport type { NextRequest } from 'next/server'\n\nexport function proxy(request: NextRequest) {\n  const bucket = request.cookies.get('bucket')?.value\n\n  if (bucket === 'b') {\n    return NextResponse.rewrite(new URL('/pricing-b', request.url))\n  }\n\n  return NextResponse.next()\n}\n\nexport const config = {\n  matcher: '/pricing',\n}",
      apiReference: [
        {
          name: "proxy",
          kind: "file convention",
          signature: "// proxy.ts\nexport function proxy(request: NextRequest): Response | Promise<Response>\nexport const config = { matcher: string | string[] }",
          params: [
            { name: "request", type: "NextRequest", description: "The incoming request, with helpers for cookies, headers, geo and the parsed URL." },
            { name: "config.matcher", type: "string | string[]", description: "Path patterns deciding where the proxy runs, such as '/about/:path*'." },
          ],
          returns: "A Response: NextResponse.next(), .redirect(url), .rewrite(url), or a direct reply.",
          notes: "May be a default export instead of a named proxy export. Mark it async if you await inside. One file per project.",
        },
      ],
      exercise: "- Add proxy.ts that redirects /old to /new and confirm it runs\n- Narrow it with a matcher so it never runs for /api routes\n- Read a cookie and rewrite instead of redirecting, then compare the address bar",
      checkpoint: "- What is Proxy called in versions before Next.js 16?\n- What is the difference in the address bar between a rewrite and a redirect?\n- Why is Proxy a poor place for a full authorisation check?",
      mistake: "- Do not create middleware.ts in Next.js 16 and expect it to run; the convention is proxy.ts\n- Do not put slow data fetching in a proxy; it delays every matched request\n- Do not add several proxy files; only one per project is supported",
      vocabulary: [
        { word: "intercept", meaning: "To catch something in transit and act on it before it reaches its destination.", example: "The proxy intercepts the request before the route renders.", synonyms: ["catch", "waylay", "hook", "capture", "gate"], antonyms: ["forward", "ignore", "let through", "pass untouched", "bypass"] },
        { word: "rewrite", meaning: "To serve a different path internally while the visible URL stays the same.", example: "A rewrite maps /pricing to /pricing-b without changing the address bar.", synonyms: ["remap", "alias", "internal remap", "path substitution", "transparent proxy", "path mapping"], antonyms: ["redirect", "pass through", "404", "visible navigation", "location change", "client navigation"] },
        { word: "matcher", meaning: "A pattern deciding which paths a piece of logic should apply to.", example: "The matcher keeps the proxy from running on image requests.", synonyms: ["filter", "selector", "path pattern", "route filter", "predicate"], antonyms: ["catch-all", "wildcard", "apply-to-all", "unfiltered", "global rule"] },
        { word: "optimistic", meaning: "Assuming the likely case to stay fast, with a real check performed later.", example: "An optimistic cookie check redirects early, but the action still verifies the session.", synonyms: ["provisional", "assumed", "assumed success", "ahead of confirmation", "predicted"], antonyms: ["authoritative", "verified", "pessimistic", "confirmed", "server-truth"] },
        { word: "traverse", meaning: "To pass through or across something in an ordered way.", example: "Every matched request traverses the proxy before it reaches a route.", synonyms: ["pass through", "cross", "walk", "descend", "iterate through"], antonyms: ["bypass", "skip", "jump directly", "short-circuit", "ignore"] },
        { word: "deprecate", meaning: "To mark an existing name or feature as discouraged in favour of a replacement.", example: "Next.js 16 deprecated the middleware name in favour of proxy.", synonyms: ["retire", "supersede", "phase out", "mark obsolete", "sunset"], antonyms: ["introduce", "endorse", "adopt", "promote", "keep supported"] },
      ],
    },
    {
      title: "Route Handlers for APIs",
      diagram: {
        kind: "tree",
        caption: "A route file owns every HTTP verb for its segment. It can sit anywhere under app, but never beside a page file in the same segment, because both would claim the same URL.",
        items: [
          { label: "app/", detail: "" },
          { label: "page.tsx", detail: "the UI at /", depth: 1 },
          { label: "api/", depth: 1 },
          { label: "route.ts", detail: "GET, POST … at /api", depth: 2 },
          { label: "users/", depth: 2 },
          { label: "[id]/", depth: 3 },
          { label: "route.ts", detail: "handlers at /api/users/:id", depth: 4 },
        ],
      },
      explanation: "- A route.ts file inside app creates a request handler using the Web Request and Response APIs\n- Export one async function per HTTP method: GET, POST, PUT, PATCH, DELETE, HEAD or OPTIONS\n- An unsupported method returns 405 Method Not Allowed automatically\n- Route Handlers are not cached by default; GET can opt in\n- A route file cannot sit at the same segment as a page file",
      keyPoints: [
        { tone: "key", text: "One route file owns every HTTP verb for its segment." },
        { tone: "warning", text: "route.ts and page.tsx cannot share a segment; that is a build conflict." },
        { tone: "tip", text: "NextRequest and NextResponse extend the Web APIs with cookie and URL helpers." },
        { tone: "key", text: "Handlers are uncached by default; only GET can opt into caching." },
        { tone: "tip", text: "RouteContext types the params argument from the literal route path." },
        { tone: "warning", text: "use cache cannot sit directly in a handler body; extract it into a helper." },
      ],
      example: "- app/api/items/route.ts exports GET and returns Response.json\n- Adding POST to the same file handles form submissions to the same URL\n- app/api/users/[id]/route.ts reads the id from the typed context\n- A request with PATCH to a file that exports only GET gets a 405",
      useCase: {
        scenario: "A mobile client and a third-party integration both need JSON access to the same order data the web app renders through Server Components.",
        example: "Add app/api/orders/[id]/route.ts exporting GET, authenticate from headers, read the order by ownership, and return Response.json(order).",
        usage: "The web app keeps rendering orders directly on the server with no API hop, while external callers get a stable JSON endpoint with its own auth and shape.",
      },
      code: "// app/api/users/[id]/route.ts\nimport type { NextRequest } from 'next/server'\n\nexport async function GET(\n  _req: NextRequest,\n  ctx: RouteContext<'/api/users/[id]'>\n) {\n  const { id } = await ctx.params\n  const user = await getUser(id)\n\n  if (!user) {\n    return Response.json({ error: 'not_found' }, { status: 404 })\n  }\n\n  return Response.json(user)\n}\n\nexport async function DELETE(\n  _req: NextRequest,\n  ctx: RouteContext<'/api/users/[id]'>\n) {\n  const { id } = await ctx.params\n  await deleteUser(id)\n  return new Response(null, { status: 204 })\n}",
      apiReference: [
        {
          name: "route",
          kind: "file convention",
          signature: "// app/api/items/route.ts\nexport async function GET(request: Request, context): Promise<Response>\nexport async function POST(request: Request, context): Promise<Response>",
          params: [
            { name: "request", type: "Request | NextRequest", description: "The incoming request. NextRequest adds cookie and parsed-URL helpers." },
            { name: "context", type: "RouteContext<'/path'>", description: "Route context whose params property is a Promise of the dynamic segments." },
          ],
          returns: "A Response, typically built with Response.json(data, init) or new Response(body, init).",
          notes: "Supported verbs: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS. Anything else returns 405. Add export const dynamic = 'force-static' to cache a GET.",
        },
      ],
      exercise: "- Create app/api/health/route.ts returning Response.json({ ok: true })\n- Add a POST export to the same file and call both from the browser console\n- Add a [id] segment and read it from the typed RouteContext",
      checkpoint: "- What status does Next.js return for a verb the route file does not export?\n- Why can a route file not live beside a page file in one segment?\n- How do you opt a GET handler into caching?",
      mistake: "- Do not build an internal API route just so a Server Component can fetch it; query directly instead\n- Do not assume a GET handler is cached; you must opt in\n- Do not read ctx.params synchronously; it is a Promise",
      vocabulary: [
        { word: "endpoint", meaning: "A single addressable URL that accepts requests and returns a response.", example: "The orders endpoint answers GET and DELETE at the same URL.", synonyms: ["route", "URI", "API route", "handler path", "address", "service address"], antonyms: ["client", "consumer", "caller", "frontend", "requester", "browser"] },
        { word: "verb", meaning: "The HTTP method that states what kind of operation a request intends.", example: "Each exported verb in a route file handles one method.", synonyms: ["method", "operation", "HTTP method", "action word", "request kind"], antonyms: ["payload", "resource", "URL", "body", "header"] },
        { word: "handler", meaning: "The function that receives an event or request and produces the response to it.", example: "The GET handler reads the id and returns JSON.", synonyms: ["callback", "responder", "route function", "listener", "processor"], antonyms: ["caller", "emitter", "dispatcher", "sender", "trigger"] },
        { word: "payload", meaning: "The body of data sent with a request or returned in a response.", example: "The POST payload arrives as JSON and is validated before use.", synonyms: ["body", "content", "data", "message content", "transmitted value"], antonyms: ["header", "envelope", "wrapper", "transport frame", "protocol overhead"] },
        { word: "conflict", meaning: "A state where two definitions claim the same thing and cannot both apply.", example: "A page and a route file in one segment is a conflict the build rejects.", synonyms: ["clash", "collision", "ambiguity", "duplicate claim", "contradiction"], antonyms: ["agreement", "compatibility", "single owner", "uniqueness", "clear precedence"] },
        { word: "expose", meaning: "To make something reachable from outside the system that owns it.", example: "A route handler exposes order data to clients that cannot render on the server.", synonyms: ["publish", "surface", "make public", "offer", "reveal", "open up"], antonyms: ["hide", "encapsulate", "keep private", "seal", "restrict", "seal off"] },
      ],
    },
    {
      title: "Images, fonts and metadata",
      diagram: {
        kind: "flow",
        caption: "Three optimisations that mostly cost one import each: sized and lazily loaded images, self-hosted fonts with no external request, and head tags generated from an exported object or function.",
        items: [
          { label: "next/image", detail: "Right-sized modern formats, no layout shift" },
          { label: "next/font", detail: "Self-hosted at build time, no request to Google" },
          { label: "metadata export", detail: "Static title, description and Open Graph tags" },
          { label: "generateMetadata", detail: "Same tags, but derived from fetched data" },
          { label: "File conventions", detail: "favicon.ico, opengraph-image, robots.txt, sitemap.xml" },
        ],
      },
      explanation: "- The Image component extends the img element with sizing, modern formats and lazy loading\n- A statically imported image supplies its own width, height and blur placeholder\n- Remote images need width and height, plus a remotePatterns entry in the config\n- next/font self-hosts any Google or local font, removing the external request\n- Metadata comes from a static metadata export, a generateMetadata function, or special files",
      keyPoints: [
        { tone: "key", text: "Static imports give next/image intrinsic dimensions, which prevents layout shift." },
        { tone: "warning", text: "Remote images must be allow-listed in images.remotePatterns, and be as specific as possible." },
        { tone: "tip", text: "Self-hosted fonts remove a third-party request, which helps both privacy and load time." },
        { tone: "key", text: "metadata and generateMetadata are supported only in Server Components." },
        { tone: "tip", text: "Wrap a shared fetch in React.cache so metadata and the page share one request." },
        { tone: "warning", text: "ImageResponse supports flexbox and a CSS subset; grid layouts will not work." },
      ],
      example: "- A hero image imported from disk renders with no width or height props\n- A Geist font applied in the root layout styles the whole app from one import\n- A blog post exports generateMetadata to set its title from the fetched post\n- opengraph-image.tsx renders a per-post share card with ImageResponse",
      useCase: {
        scenario: "Articles on a news site shift as images load, share previews all show the same generic card, and a webfont request to a third party blocks first paint.",
        example: "Switch to next/image with static imports, load the display font through next/font/google in the root layout, and add opengraph-image.tsx under the article route.",
        usage: "Cumulative Layout Shift drops because dimensions are known ahead of time, the font is served from the site's own domain, and every article gets its own share card.",
      },
      code: "// app/layout.tsx\nimport { Geist } from 'next/font/google'\n\nconst geist = Geist({ subsets: ['latin'] })\n\nexport default function RootLayout({\n  children,\n}: {\n  children: React.ReactNode\n}) {\n  return (\n    <html lang=\"en\" className={geist.className}>\n      <body>{children}</body>\n    </html>\n  )\n}\n\n// app/blog/[slug]/page.tsx\nimport type { Metadata } from 'next'\nimport Image from 'next/image'\nimport cover from './cover.png'\n\nexport async function generateMetadata({\n  params,\n}: {\n  params: Promise<{ slug: string }>\n}): Promise<Metadata> {\n  const post = await getPost((await params).slug)\n  return { title: post.title, description: post.summary }\n}\n\nexport default function Page() {\n  // width, height and blurDataURL come from the static import\n  return <Image src={cover} alt=\"\" placeholder=\"blur\" />\n}",
      apiReference: [
        {
          name: "Image",
          kind: "component (next/image)",
          signature: "import Image from 'next/image'\n<Image src={src} alt=\"\" width={500} height={500} sizes=\"...\" placeholder=\"blur\" />",
          params: [
            { name: "src", type: "string | StaticImport", description: "A local path, a static import, or a remote URL allowed by images.remotePatterns." },
            { name: "alt", type: "string", description: "Required alternative text; use an empty string for decorative images." },
            { name: "width / height", type: "number", description: "Required for remote images; supplied automatically by a static import." },
            { name: "fill", type: "boolean", description: "Makes the image fill its positioned parent instead of taking fixed dimensions." },
          ],
          returns: "An img element with responsive srcset, lazy loading and layout-shift protection.",
          notes: "Local images with a query string need an images.localPatterns entry with a matching search value in Next.js 16.",
        },
        {
          name: "generateMetadata",
          kind: "function export",
          signature: "export async function generateMetadata(\n  { params, searchParams }: Props,\n  parent: ResolvingMetadata\n): Promise<Metadata>",
          params: [
            { name: "params", type: "Promise<object>", description: "Dynamic route segments for the current route." },
            { name: "parent", type: "ResolvingMetadata", description: "Metadata resolved from parent segments, so you can extend rather than replace it." },
          ],
          returns: "A Metadata object that Next.js turns into head tags.",
          notes: "Server Components only. For dynamically rendered pages, metadata is streamed and injected once resolved, except for bots that need it in the head.",
        },
      ],
      exercise: "- Replace an img tag with next/image using a static import and remove the size props\n- Load a Google font through next/font in the root layout and delete the link tag\n- Add generateMetadata to a dynamic route and check the title in the browser tab",
      checkpoint: "- Why does a static import prevent layout shift?\n- What has to change in the config before a remote image will load?\n- When would you choose generateMetadata over the static metadata object?",
      mistake: "- Do not use a remote image without a remotePatterns entry; the request is rejected\n- Do not export metadata from a Client Component; it is only read in Server Components\n- Do not fetch the same data twice for the page and its metadata; memoise it with React.cache",
      vocabulary: [
        { word: "intrinsic", meaning: "Belonging to the thing itself rather than supplied from outside.", example: "A static import exposes the file's intrinsic width and height.", synonyms: ["inherent", "built-in", "native", "innate", "self-contained"], antonyms: ["extrinsic", "assigned", "injected", "configured", "external"] },
        { word: "layout shift", meaning: "Content jumping position after it has already been painted, usually as assets load late.", example: "Declaring dimensions removes the layout shift when the hero image arrives.", synonyms: ["reflow", "content jump", "page movement", "unexpected movement", "post-paint jump"], antonyms: ["visual stability", "fixed layout", "reserved space", "stable layout", "no movement", "predictable layout"] },
        { word: "self-host", meaning: "To serve an asset from your own domain instead of requesting it from a third party.", example: "next/font self-hosts the font files, so the browser never contacts Google.", synonyms: ["serve locally", "in-house", "own the asset", "first-party serving", "local copy"], antonyms: ["hotlink", "outsource", "third-party CDN", "remote dependency", "external fetch"] },
        { word: "allow-list", meaning: "An explicit set of permitted values, where anything not listed is rejected.", example: "remotePatterns is an allow-list of hosts the optimiser will fetch from.", synonyms: ["whitelist", "permit list", "permitted set", "approved list", "safe list"], antonyms: ["block-list", "open access", "deny-list", "blanket permission", "no restriction"] },
        { word: "viewport", meaning: "The visible area of a page in the browser window on the current device.", example: "Lazy loading defers an image until it approaches the viewport.", synonyms: ["visible area", "window", "visible region", "screen area", "browser window"], antonyms: ["offscreen", "document", "full document", "below the fold", "hidden region"] },
        { word: "canonical", meaning: "The single official version of something, used when several variants exist.", example: "Metadata can declare a canonical URL so duplicates are not indexed separately.", synonyms: ["authoritative", "definitive", "preferred version", "official form", "single source"], antonyms: ["duplicate", "variant", "alias", "near-duplicate", "alternate URL"] },
      ],
    },
    {
      title: "Next.js hooks: reading the URL",
      diagram: {
        kind: "split",
        caption: "Three Client Component hooks from next/navigation each read one part of the current URL. For /shop/shoes?sort=price in app/shop/[tag]/page.tsx, each hook returns a different slice.",
        headings: ["Hook", "Returns for /shop/shoes?sort=price"],
        items: [
          { label: "usePathname()", detail: "The path without the query string", group: 0 },
          { label: "useSearchParams()", detail: "A read-only URLSearchParams", group: 0 },
          { label: "useParams()", detail: "The filled-in dynamic segments", group: 0 },
          { label: "'/shop/shoes'", detail: "Also '/' for the home page", group: 1 },
          { label: "searchParams.get('sort') === 'price'", detail: "get, getAll, has, toString and more", group: 1 },
          { label: "{ tag: 'shoes' }", detail: "Catch-all segments give string arrays", group: 1 },
        ],
      },
      explanation: "- usePathname, useSearchParams and useParams are Client Component hooks imported from next/navigation\n- usePathname returns the current path as a string, without the query string\n- useSearchParams returns a read-only URLSearchParams for the query string\n- useParams returns an object of the route's filled-in dynamic segments, or {} when there are none\n- Server Components cannot read the current URL this way; pages use their params and searchParams props instead\n- On prerendered routes, wrap components that read search params in Suspense so the rest of the page stays static",
      keyPoints: [
        { tone: "key", text: "All three hooks come from next/navigation and only work in files marked 'use client'." },
        { tone: "key", text: "usePathname('/dashboard?v=2') returns '/dashboard'; the query string is never included." },
        { tone: "tip", text: "In a Server Component page, read the searchParams prop and pass values down instead of using the hook." },
        { tone: "tip", text: "useParams<{ tag: string }>() types the result; catch-all segments come back as string arrays." },
        { tone: "warning", text: "A prerendered page that calls useSearchParams outside a Suspense boundary fails the production build." },
        { tone: "warning", text: "With cacheComponents, these hooks can suspend on dynamic params not covered by generateStaticParams." },
      ],
      example: "- A sidebar calls usePathname to highlight the link for the current page\n- A search bar reads searchParams.get('q') to pre-fill its input\n- A product view reads { tag, item } from useParams to show breadcrumbs\n- An Effect keyed on pathname and searchParams logs every navigation",
      useCase: {
        scenario: "A store's filter sidebar must reflect the URL, so shared links such as /shop/shoes?sort=price&size=9 open with the same filters already selected.",
        example: "The sidebar is a Client Component that reads tag from useParams and sort and size from useSearchParams, and marks the matching options as checked. It is wrapped in Suspense in the page.",
        usage: "The URL stays the single source of truth for filters, so links, refreshes and the back button all restore the same view without extra client state.",
      },
      code: "// app/shop/[tag]/filters.tsx\n'use client'\n\nimport { useParams, usePathname, useSearchParams } from 'next/navigation'\n\nexport function Filters() {\n  const pathname = usePathname()                     // '/shop/shoes'\n  const params = useParams<{ tag: string }>()          // { tag: 'shoes' }\n  const searchParams = useSearchParams()\n  const sort = searchParams.get('sort') ?? 'popular'   // 'price'\n\n  return (\n    <p>\n      {params.tag} sorted by {sort} on {pathname}\n    </p>\n  )\n}\n\n// app/shop/[tag]/page.tsx\nimport { Suspense } from 'react'\nimport { Filters } from './filters'\n\nexport default function Page() {\n  return (\n    <Suspense fallback={<p>Loading filters...</p>}>\n      <Filters />\n    </Suspense>\n  )\n}",
      apiReference: [
        {
          name: "usePathname",
          kind: "hook (next/navigation)",
          signature: "'use client'\nimport { usePathname } from 'next/navigation'\n\nconst pathname: string = usePathname()",
          params: [],
          returns: "The current URL's pathname as a string, for example '/blog/hello-world'. The query string is excluded.",
          notes: "Takes no parameters. Not supported in Server Components, by design, so layouts can keep their state across navigations.",
        },
        {
          name: "useSearchParams",
          kind: "hook (next/navigation)",
          signature: "'use client'\nimport { useSearchParams } from 'next/navigation'\n\nconst searchParams = useSearchParams()\nsearchParams.get('q')",
          params: [
            { name: "get(name)", type: "string | null", description: "The first value for the parameter; '' for ?a= and null when it is absent." },
            { name: "getAll(name)", type: "string[]", description: "Every value for a repeated parameter such as ?a=1&a=2." },
            { name: "has(name)", type: "boolean", description: "Whether the parameter exists in the query string." },
          ],
          returns: "A read-only URLSearchParams for the current query string.",
          notes: "Takes no parameters. On prerendered routes, it client-renders up to the nearest Suspense boundary, so wrap its component in Suspense.",
        },
        {
          name: "useParams",
          kind: "hook (next/navigation)",
          signature: "'use client'\nimport { useParams } from 'next/navigation'\n\nconst params = useParams<{ tag: string; item: string }>()",
          params: [
            { name: "T (type argument)", type: "Record<string, string | string[]>", description: "Optional TypeScript shape of the route's dynamic segments." },
          ],
          returns: "An object whose keys are the active dynamic segment names and whose values are strings, or string arrays for catch-all segments.",
          notes: "Returns {} for a route without dynamic segments. With cacheComponents it may need a Suspense boundary for params unknown at build time.",
        },
      ],
      exercise: "- Build a NavLink that bolds itself when usePathname matches its href\n- Read ?q= with useSearchParams to pre-fill a search box, wrapped in Suspense\n- Log useParams() on a [...slug] route and note that the value is an array",
      checkpoint: "- What does usePathname return for /dashboard?v=2?\n- Why must a component using useSearchParams on a prerendered page sit inside Suspense?\n- What does useParams return on a route with no dynamic segments?",
      mistake: "- Do not call these hooks in a Server Component; read the page's params and searchParams props instead\n- Do not forget the Suspense boundary around useSearchParams on static routes\n- Do not mutate the object from useSearchParams; build a new URLSearchParams and navigate",
      vocabulary: [
        { word: "pathname", meaning: "The part of a URL after the domain and before any query string or hash.", example: "For /blog/post?id=3, the pathname is /blog/post.", synonyms: ["path", "route", "URL path", "route segment chain", "location path"], antonyms: ["query string", "origin", "hash", "host", "search string"] },
        { word: "query string", meaning: "The part of a URL after the question mark, holding key-value parameters.", example: "?sort=price&size=9 is a query string with two parameters.", synonyms: ["search params", "URL parameters", "search parameters", "URL query", "?key=value pairs"], antonyms: ["pathname", "fragment", "path segment", "hash fragment", "request body"] },
        { word: "read-only", meaning: "Able to be read but not changed.", example: "The searchParams object is read-only, so you build a new one to change the URL.", synonyms: ["immutable", "view-only", "non-writable", "frozen", "look but not touch", "locked"], antonyms: ["writable", "editable", "mutable", "read-write", "mutable state", "editable field"] },
        { word: "source of truth", meaning: "The one place whose value everything else is derived from and trusts.", example: "Making the URL the source of truth keeps shared links and filters in sync.", synonyms: ["authority", "master copy", "canonical store", "system of record", "single origin"], antonyms: ["copy", "cache", "derived value", "duplicate", "stale mirror"] },
        { word: "prerendered", meaning: "Rendered ahead of time, before any user requests the page.", example: "A prerendered page cannot know the visitor's query string at build time.", synonyms: ["pre-generated", "static", "built ahead", "statically generated", "baked"], antonyms: ["on-demand", "dynamic", "rendered per request", "computed live", "streamed"] },
        { word: "segment", meaning: "One slash-separated part of a URL path, matched by one folder in the app directory.", example: "In /shop/shoes, shoes fills the [tag] segment.", synonyms: ["path part", "section", "URL part", "path slice", "route token"], antonyms: ["whole path", "full URL", "query string", "hash"] },
      ],
    },
    {
      title: "Next.js hooks: navigating with useRouter and useLinkStatus",
      diagram: {
        kind: "flow",
        caption: "Link covers most navigation. useRouter handles navigation from code, such as after a successful form, and useLinkStatus lets a child of a Link show inline feedback while a slow navigation is pending.",
        items: [
          { label: "User clicks a Link or code calls router.push", detail: "Both perform a client-side navigation" },
          { label: "useLinkStatus().pending becomes true", detail: "Only for descendants of the clicked Link" },
          { label: "Next.js fetches the RSC payload", detail: "Skipped if the route was already prefetched" },
          { label: "History updates and the route renders", detail: "pending returns to false" },
          { label: "router.refresh() when data changes", detail: "Re-fetches Server Components, keeps client state" },
        ],
      },
      explanation: "- useRouter from next/navigation changes routes from inside Client Components\n- Prefer the Link component for ordinary navigation; use the router when navigation happens in code\n- router.push adds a history entry, router.replace does not, and both accept { scroll: false }\n- router.refresh re-renders Server Components with fresh data while keeping client state and scroll position\n- useLinkStatus, from next/link, returns { pending } for the nearest parent Link while its navigation is in flight\n- In the App Router, pathname and query moved out of the router into usePathname and useSearchParams",
      keyPoints: [
        { tone: "key", text: "Import useRouter from next/navigation in the App Router, never from next/router." },
        { tone: "key", text: "push adds a history entry; replace swaps the current one; refresh re-fetches Server Components." },
        { tone: "tip", text: "Pass { scroll: false } to push or replace to keep the scroll position." },
        { tone: "tip", text: "Render a fixed-size hint and toggle its opacity from useLinkStatus to avoid layout shift." },
        { tone: "warning", text: "Never pass untrusted URLs to router.push or replace; javascript: URLs would execute in your page." },
        { tone: "warning", text: "router.refresh clears the client cache for the route but does not invalidate server-side caches." },
      ],
      example: "- A checkout button calls router.push('/thanks') after the payment succeeds\n- A logout handler calls router.replace('/sign-in') so Back does not return to the account page\n- A comment form calls router.refresh() after saving to re-render the server list\n- A menu shows a small shimmer beside a link while useLinkStatus reports pending",
      useCase: {
        scenario: "A shop's category menu links to dynamic pages with prefetch disabled to save bandwidth, and on slow networks users clicked twice because nothing seemed to happen.",
        example: "Inside each Link, render a small LoadingIndicator component that reads useLinkStatus and fades in a spinner while pending is true.",
        usage: "Users get instant confirmation that their click registered, while the team works on the root cause with prefetching or a loading.tsx fallback for the slow route.",
      },
      code: "// app/components/menu.tsx\n'use client'\n\nimport Link, { useLinkStatus } from 'next/link'\nimport { useRouter } from 'next/navigation'\n\nfunction Hint() {\n  const { pending } = useLinkStatus()\n  return <span aria-hidden className={pending ? 'hint on' : 'hint'} />\n}\n\nexport function Menu() {\n  const router = useRouter()\n\n  async function logout() {\n    await fetch('/api/logout', { method: 'POST' })\n    router.replace('/sign-in') // Back will not return here\n  }\n\n  return (\n    <nav>\n      <Link href=\"/orders\" prefetch={false}>\n        Orders <Hint />\n      </Link>\n      <button onClick={() => router.push('/cart', { scroll: false })}>\n        Cart\n      </button>\n      <button onClick={() => router.refresh()}>Refresh data</button>\n      <button onClick={logout}>Log out</button>\n    </nav>\n  )\n}",
      apiReference: [
        {
          name: "useRouter",
          kind: "hook (next/navigation)",
          signature: "const router = useRouter()\nrouter.push(href, { scroll?, transitionTypes? })\nrouter.replace(href, { scroll?, transitionTypes? })\nrouter.refresh()\nrouter.prefetch(href, { onInvalidate? })\nrouter.back()\nrouter.forward()",
          params: [
            { name: "href", type: "string", description: "The route to navigate to or prefetch. Never pass unsanitised user input." },
            { name: "scroll", type: "boolean", description: "Set false to keep the scroll position instead of scrolling to the top." },
            { name: "transitionTypes", type: "string[]", description: "Passed to React's addTransitionType inside the navigation Transition." },
            { name: "onInvalidate", type: "() => void", description: "Called at most once when prefetched data becomes stale." },
          ],
          returns: "A router object with push, replace, refresh, prefetch, back, forward and the bfcacheId string.",
          notes: "Client Components only. bfcacheId changes on fresh push or replace navigations; use it as a key only as a last resort to reset state.",
        },
        {
          name: "useLinkStatus",
          kind: "hook (next/link)",
          signature: "'use client'\nimport { useLinkStatus } from 'next/link'\n\nconst { pending } = useLinkStatus()",
          params: [
            { name: "pending", type: "boolean", description: "True before the browser history updates for the parent Link's navigation, false after." },
          ],
          returns: "An object with a single pending property. The hook takes no parameters.",
          notes: "Must be used in a descendant of a Link. Most useful with prefetch={false}. Skipped for prefetched routes; only the last clicked link shows pending.",
        },
      ],
      exercise: "- Redirect to a thank-you page with router.push after a form succeeds\n- Replace push with replace and compare what the Back button does\n- Add a Hint component with useLinkStatus inside a Link with prefetch={false}",
      checkpoint: "- When should you use useRouter instead of Link?\n- What is the difference between router.push and router.replace?\n- Why is useLinkStatus usually unnecessary on prefetched routes?",
      mistake: "- Do not import useRouter from next/router in the App Router\n- Do not pass user-controlled strings to router.push without validating them\n- Do not expect router.refresh to invalidate server-side cached data; use revalidatePath or updateTag",
      vocabulary: [
        { word: "programmatic", meaning: "Carried out by code rather than by a direct user action such as clicking a link.", example: "A programmatic navigation runs router.push after the payment succeeds.", synonyms: ["code-driven", "automated", "scripted", "imperative", "API-driven"], antonyms: ["manual", "declarative", "user-initiated", "link click", "form submit"] },
        { word: "prefetch", meaning: "To download something before it is requested, so it is ready when needed.", example: "Links prefetch routes as they scroll into view, making clicks feel instant.", synonyms: ["preload", "warm up", "fetch ahead", "pre-request", "prime the cache"], antonyms: ["lazy-load", "fetch on demand", "fetch on click", "on-demand load", "defer"] },
        { word: "history stack", meaning: "The browser's list of visited entries that the Back and Forward buttons move through.", example: "router.replace swaps the top of the history stack instead of adding to it.", synonyms: ["session history", "navigation stack", "back/forward list", "browser history", "visited entries"], antonyms: ["blank slate", "fresh session", "single entry", "replaced state", "cleared history"] },
        { word: "sanitise", meaning: "To clean input by removing or rejecting anything unsafe before using it.", example: "Sanitise a redirect target so a javascript: URL can never reach router.push.", synonyms: ["cleanse", "validate", "scrub", "escape", "strip unsafe input"], antonyms: ["trust blindly", "taint", "pass raw", "trust input", "inject directly"] },
        { word: "shimmer", meaning: "A soft, moving highlight used as a subtle loading indicator.", example: "A shimmer beside the link shows the click registered.", synonyms: ["glint", "pulse", "skeleton animation", "loading sheen", "placeholder motion"], antonyms: ["stillness", "static", "hard spinner", "blank space", "no indicator"] },
        { word: "stale", meaning: "No longer fresh; out of date compared with the latest data.", example: "onInvalidate tells you when prefetched route data has gone stale.", synonyms: ["outdated", "old", "out of date", "old copy", "expired"], antonyms: ["fresh", "current", "up to date", "live", "revalidated"] },
      ],
    },
    {
      title: "Next.js hooks: layout segments, web vitals and offline status",
      diagram: {
        kind: "tree",
        caption: "Every Client Component hook Next.js 16 provides, by package. Layout-segment hooks power tabs and breadcrumbs, useReportWebVitals sends real-user performance data, and the experimental useOffline tracks connectivity.",
        items: [
          { label: "next/navigation" },
          { label: "usePathname, useSearchParams, useParams", detail: "read the current URL", depth: 1 },
          { label: "useRouter", detail: "navigate from code", depth: 1 },
          { label: "useSelectedLayoutSegment(s)", detail: "active child segments below a layout", depth: 1 },
          { label: "next/link" },
          { label: "useLinkStatus", detail: "pending state of a parent Link", depth: 1 },
          { label: "next/web-vitals" },
          { label: "useReportWebVitals", detail: "TTFB, FCP, LCP, CLS, INP and more", depth: 1 },
          { label: "next/offline (experimental)" },
          { label: "useOffline", detail: "true while the app has no connection", depth: 1 },
        ],
      },
      explanation: "- useSelectedLayoutSegment returns the active segment one level below the layout that renders the component\n- useSelectedLayoutSegments returns every active segment below that layout, which suits breadcrumbs\n- Both accept an optional parallelRouteKey to read a parallel route slot instead of children\n- useReportWebVitals calls your callback with each Core Web Vitals metric measured on the page\n- useOffline, from next/offline, returns true while the app is offline once experimental.useOffline is enabled\n- Keep each hook in a small Client Component so the client boundary stays narrow",
      keyPoints: [
        { tone: "key", text: "useSelectedLayoutSegment returns one segment or null; useSelectedLayoutSegments returns an array." },
        { tone: "key", text: "useReportWebVitals receives metrics such as LCP, CLS and INP with a name, value, rating and id." },
        { tone: "tip", text: "Filter route groups such as (marketing) out of useSelectedLayoutSegments before showing breadcrumbs." },
        { tone: "tip", text: "Keep the useReportWebVitals callback stable, defined outside the component, to avoid duplicate reports." },
        { tone: "warning", text: "useOffline always returns false unless experimental.useOffline is set in next.config." },
        { tone: "warning", text: "For catch-all routes, the matched segments come back as one joined string, such as 'a/b/c'." },
      ],
      example: "- A dashboard layout highlights the Settings tab when useSelectedLayoutSegment returns 'settings'\n- A docs layout builds breadcrumbs from useSelectedLayoutSegments\n- A WebVitals component in the root layout beacons each metric to an analytics endpoint\n- An OfflineBanner in the root layout appears whenever useOffline returns true",
      useCase: {
        scenario: "A field-sales PWA is used on patchy mobile networks. Reps need to know when they are offline, the team wants real-user performance data, and the dashboard tabs must show the active section.",
        example: "Enable experimental.useOffline and render an OfflineBanner in the root layout, add a WebVitals component that beacons metrics, and build the tab bar with useSelectedLayoutSegment.",
        usage: "Reps see a clear offline banner while Next.js retries blocked requests on reconnect, the team tracks LCP and INP from real devices, and the tabs always match the URL.",
      },
      code: "// app/dashboard/tabs.tsx\n'use client'\nimport Link from 'next/link'\nimport { useSelectedLayoutSegment } from 'next/navigation'\n\nexport function Tabs() {\n  const active = useSelectedLayoutSegment() // 'settings' on /dashboard/settings\n  return ['overview', 'settings'].map(tab => (\n    <Link key={tab} href={`/dashboard/${tab}`}\n      aria-current={active === tab ? 'page' : undefined}>\n      {tab}\n    </Link>\n  ))\n}\n\n// app/web-vitals.tsx\n'use client'\nimport { useReportWebVitals } from 'next/web-vitals'\n\nconst report = (metric: { name: string; value: number }) =>\n  navigator.sendBeacon('/api/vitals', JSON.stringify(metric))\n\nexport function WebVitals() {\n  useReportWebVitals(report)\n  return null\n}\n\n// app/offline-banner.tsx (needs experimental.useOffline)\n'use client'\nimport { useOffline } from 'next/offline'\n\nexport function OfflineBanner() {\n  return useOffline() ? <p role=\"status\">You are offline.</p> : null\n}",
      apiReference: [
        {
          name: "useSelectedLayoutSegment",
          kind: "hook (next/navigation)",
          signature: "const segment: string | null =\n  useSelectedLayoutSegment(parallelRouteKey?)",
          params: [
            { name: "parallelRouteKey", type: "string", description: "Optional name of a parallel route slot to read instead of children." },
          ],
          returns: "The active segment one level below the calling layout as a string, or null when there is none.",
          notes: "Client Components only, usually imported into a layout. Catch-all matches come back joined, for example 'a/b/c'.",
        },
        {
          name: "useSelectedLayoutSegments",
          kind: "hook (next/navigation)",
          signature: "const segments: string[] =\n  useSelectedLayoutSegments(parallelRouteKey?)",
          params: [
            { name: "parallelRouteKey", type: "string", description: "Optional name of a parallel route slot to read instead of children." },
          ],
          returns: "An array of every active segment below the calling layout, or an empty array when there are none.",
          notes: "Includes route groups such as (shop); filter them out for breadcrumbs. May need Suspense with cacheComponents for unknown dynamic params.",
        },
        {
          name: "useReportWebVitals",
          kind: "hook (next/web-vitals)",
          signature: "'use client'\nimport { useReportWebVitals } from 'next/web-vitals'\n\nuseReportWebVitals(metric => { ... })",
          params: [
            { name: "metric.name", type: "string", description: "TTFB, FCP, LCP, FID, CLS, INP, or a custom Next.js-hydration or Next.js-render metric." },
            { name: "metric.value / delta", type: "number", description: "The measured value and its change since the last report, usually in milliseconds." },
            { name: "metric.rating", type: "'good' | 'needs-improvement' | 'poor'", description: "A qualitative rating of the value against the metric's thresholds." },
            { name: "metric.id", type: "string", description: "Unique to the metric for this page load; useful for building distributions." },
          ],
          returns: "Nothing. Your callback is called with each metric as it becomes available.",
          notes: "Keep the callback's identity stable to avoid duplicate reports, and confine it to a small client component imported by the root layout.",
        },
        {
          name: "useOffline",
          kind: "hook (next/offline, experimental)",
          signature: "// next.config: { experimental: { useOffline: true } }\n'use client'\nimport { useOffline } from 'next/offline'\n\nconst isOffline: boolean = useOffline()",
          params: [],
          returns: "true when a network request has failed or the browser fired an offline event; false when online, on the server, and before hydration.",
          notes: "Experimental, introduced in Next.js 16. The flag also retries blocked navigations, prefetches and Server Actions once the connection returns.",
        },
      ],
      exercise: "- Build dashboard tabs that style the active tab using useSelectedLayoutSegment\n- Build breadcrumbs from useSelectedLayoutSegments and filter out route groups\n- Log every web vitals metric to the console, then enable useOffline and toggle offline in DevTools",
      checkpoint: "- What does useSelectedLayoutSegment return in app/dashboard/layout.tsx for /dashboard?\n- Why should the useReportWebVitals callback have a stable identity?\n- What does useOffline return when the experimental flag is not enabled?",
      mistake: "- Do not call layout-segment hooks from a Server Component layout; import a client component instead\n- Do not pass an inline arrow to useReportWebVitals that is recreated every render\n- Do not rely on useOffline in production without the experimental flag in next.config",
      vocabulary: [
        { word: "breadcrumb", meaning: "A trail of links showing where the current page sits in the site's hierarchy.", example: "Docs > Guides > Caching is a breadcrumb built from the active segments.", synonyms: ["trail", "path indicator", "location trail", "hierarchy path", "wayfinding links"], antonyms: ["dead end", "orphan page", "isolated page", "no context", "flat navigation"] },
        { word: "telemetry", meaning: "Automatically collected measurements sent from a running system to a remote service.", example: "Web vitals telemetry shows how fast the site feels on real phones.", synonyms: ["monitoring data", "metrics", "instrumentation data", "signals", "observability data"], antonyms: ["guesswork", "anecdote", "assumption", "user report", "blind operation"] },
        { word: "connectivity", meaning: "The state of being connected to a network.", example: "useOffline lets the UI react to lost connectivity.", synonyms: ["connection", "network access", "online status", "reachability", "network link"], antonyms: ["disconnection", "isolation", "offline state", "no signal", "unreachable"] },
        { word: "experimental", meaning: "Available for testing but not yet stable; it may change or be removed.", example: "useOffline is experimental, so it sits behind a config flag.", synonyms: ["unstable", "preview", "opt-in", "unreleased", "subject to change"], antonyms: ["stable", "established", "generally available", "supported", "frozen API"] },
        { word: "beacon", meaning: "To send a small, fire-and-forget message, often as a page is closing.", example: "navigator.sendBeacon posts each metric without delaying navigation.", synonyms: ["ping", "signal", "one-way send", "unload-safe post", "background report"], antonyms: ["poll", "request-response", "awaited request", "blocking call", "two-way exchange"] },
        { word: "threshold", meaning: "A boundary value at which a measurement changes category.", example: "An LCP above the threshold is rated needs-improvement.", synonyms: ["cut-off", "limit", "trigger point", "boundary value", "tolerance"], antonyms: ["midpoint", "range", "continuous scale", "no limit", "unbounded range"] },
      ],
    },
  ],
  project: "Build a small publication with the App Router. Give it a root layout with a self-hosted font, a /articles index that caches its list with use cache and cacheLife('hours'), and an /articles/[slug] page whose generateMetadata sets the title from the fetched article. Add a Server Action that saves a comment, authorises the session inside the action, calls revalidatePath, and shows a pending state through useActionState. Expose the same articles as JSON from app/api/articles/route.ts, and add a proxy.ts that redirects logged-out visitors away from /drafts. Confirm the article page still streams its comments behind a Suspense boundary, highlight the active section with useSelectedLayoutSegment, and keep the search query in the URL with useSearchParams.",
  summary: "Routes come from folders and files, and layouts wrap everything below them. Components run on the server unless you mark a boundary with use client. Data is awaited directly on the server, cached deliberately with use cache and a cacheLife, and streamed behind Suspense when it must be fresh. Mutations run through Server Actions, which are public POST endpoints and must authorise every call. Proxy replaces Middleware in Next.js 16 for work that happens before a route renders. Route Handlers serve JSON, and next/image, next/font and the metadata APIs cover the loading and sharing details.",
  glossary: [
    { term: "App Router", definition: "The routing system built on the app directory, where folders are URL segments and files such as page and layout provide the UI." },
    { term: "Server Component", definition: "A component that renders on the server, can fetch data directly, and ships no JavaScript to the browser. This is the default." },
    { term: "Client Component", definition: "A component in a file marked 'use client', which runs in the browser and may use state, effects and browser APIs." },
    { term: "RSC payload", definition: "The compact serialised form of a rendered Server Component tree that React uses on the client to update the DOM." },
    { term: "Partial Prerendering", definition: "Serving a prerendered static shell immediately while request-dependent parts stream in behind their Suspense fallbacks." },
    { term: "Server Action", definition: "An async server function invoked through a form action or transition, used for mutations, reachable as a POST endpoint." },
    { term: "Proxy", definition: "The Next.js 16 name for Middleware: a single proxy.ts that runs before a matched request completes." },
    { term: "Route Handler", definition: "A route.ts file exporting functions named after HTTP methods, built on the Web Request and Response APIs." },
    { term: "Cache Components", definition: "The caching model enabled with cacheComponents: true, where 'use cache' and cacheLife give results an explicit lifetime." },
    { term: "Static shell", definition: "The prerendered HTML and RSC payload for a route, servable from a CDN before any per-request work runs." },
  ],
  sources: [
    { url: "https://nextjs.org/docs/app/getting-started/layouts-and-pages", title: "Layouts and Pages", retrievedAt: RETRIEVED_AT },
    { url: "https://nextjs.org/docs/app/getting-started/server-and-client-components", title: "Server and Client Components", retrievedAt: RETRIEVED_AT },
    { url: "https://nextjs.org/docs/app/getting-started/fetching-data", title: "Fetching Data", retrievedAt: RETRIEVED_AT },
    { url: "https://nextjs.org/docs/app/getting-started/caching", title: "Caching", retrievedAt: RETRIEVED_AT },
    { url: "https://nextjs.org/docs/app/guides/server-actions", title: "Server Actions and Mutations", retrievedAt: RETRIEVED_AT },
    { url: "https://nextjs.org/docs/app/getting-started/proxy", title: "Proxy", retrievedAt: RETRIEVED_AT },
    { url: "https://nextjs.org/docs/app/getting-started/route-handlers", title: "Route Handlers", retrievedAt: RETRIEVED_AT },
    { url: "https://nextjs.org/docs/app/getting-started/metadata-and-og-images", title: "Metadata and OG images", retrievedAt: RETRIEVED_AT },
    { url: "https://nextjs.org/docs/app/api-reference/functions/use-search-params", title: "useSearchParams", retrievedAt: RETRIEVED_AT },
    { url: "https://nextjs.org/docs/app/api-reference/functions/use-router", title: "useRouter", retrievedAt: RETRIEVED_AT },
    { url: "https://nextjs.org/docs/app/api-reference/functions/use-link-status", title: "useLinkStatus", retrievedAt: RETRIEVED_AT },
    { url: "https://nextjs.org/docs/app/api-reference/functions/use-selected-layout-segments", title: "useSelectedLayoutSegments", retrievedAt: RETRIEVED_AT },
  ],
};

/**
 * A hand-authored notes guide that every library is seeded with (see
 * lib/server/default-library.ts). Bump `version` whenever a guide's content
 * changes: existing libraries then have their seeded copy refreshed in place.
 */
export type DefaultGuide = {
  id: string;
  version: number;
  curriculum: Curriculum;
  request: Omit<GenerationRequest, "format">;
};

const guide = (id: string, curriculum: Curriculum, technologyId: string, topicId: string, level: GenerationRequest["level"] = "intermediate", version = 1): DefaultGuide =>
  ({ id, version: version + (GUIDE_EXPANSIONS[id] ? 2 : 1), curriculum: enrichLearningNotes(expandGuide(id, { ...curriculum, codeExamples: TOPIC_PROJECTS[id] }), "en"), request: { technologyId, topicId, language: "en", level } });

/**
 * Every seeded guide, in the order the library lists them (first = top).
 * The technology notes come first, then the two complete framework paths.
 */
const nextjsPathCore = expandGuide("nextjs-16", withLessons(withHooks(withInterview(NEXTJS_16_GUIDE, NEXTJS_16_INTERVIEW), NEXTJS_HOOKS_CORE), NEXTJS_16_ADDITIONS));
export const NEXTJS_16_CORE_LESSON_COUNT = nextjsPathCore.lessons.length;
export const DEFAULT_GUIDES: DefaultGuide[] = [
  ...TECHNOLOGY_GUIDES.map(item => guide(item.id, item.curriculum, item.technologyId, item.topicId, item.level, item.version)),
  guide("nextjs-16", { ...nextjsPathCore, minutes: nextjsPathCore.minutes + NEXTJS16_LESSONS.length * 5, lessons: [...nextjsPathCore.lessons, ...NEXTJS16_LESSONS] }, "nextjs", "nextjs-full", "intermediate", 4),
  guide("react-19", withLessons(withHooks(withInterview(REACT_19_GUIDE, REACT_19_INTERVIEW), REACT_HOOKS_CORE), REACT_19_ADDITIONS), "react", "react-full", "intermediate", 2),
];

export function defaultLibraryRequest(item: DefaultGuide): GenerationRequest {
  return { ...item.request, format: DOCUMENT_FORMAT };
}
