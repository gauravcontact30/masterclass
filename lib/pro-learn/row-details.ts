import type { AwsHighlight } from "./aws-highlights";

/**
 * Authored key points and a real use for one catalogue row.
 *
 * Kept out of the handbook lists so a fifty-row handbook still reads as a list
 * of rows, and keyed by handbook title and row name so two handbooks can each
 * have their own "ref as a prop" without colliding.
 *
 * Every entry is written for its own row. Nothing here is true of the category
 * as a whole — points that apply to a whole technology live in `essentials/`
 * and are shown in the answer, where one topic is on screen at a time, rather
 * than repeated down a grid of six cards.
 */
type RowDetail = Pick<AwsHighlight, "points" | "useCase">;

export const ROW_DETAILS: Record<string, Record<string, RowDetail>> = {
  "Next.js 16+ — Routing, Rendering & Caching": {
    "Layouts and pages": {
      points: [
        "A folder becomes a URL segment only when it holds a `page` file; a folder without one groups files without adding a path.",
        "A layout keeps its state across navigations inside its subtree, which is why a sidebar's scroll position survives a page change.",
        "Layouts nest from the root down, so the root layout renders on every route and is where `<html>` and `<body>` belong.",
      ],
      useCase: { title: "A shell that does not reload", scenario: "Header, sidebar and their state stay mounted as the reader moves between pages, so only the page area re-renders on navigation." },
    },
    "Dynamic routes": {
      points: [
        "`params` is a promise and must be awaited, which is the Next.js 16 change that breaks copied Next.js 14 code.",
        "A catch-all `[...slug]` matches one or more segments; the optional `[[...slug]]` form also matches the bare parent path.",
        "`generateStaticParams` decides which of those URLs are prerendered at build time instead of on first request.",
      ],
      useCase: { title: "One file for ten thousand product pages", scenario: "Every product shares one route whose id comes from the URL, rather than a file per product or a client-side lookup after load." },
    },
    "Route groups and parallel routes": {
      points: [
        "A folder in parentheses organizes files without contributing a URL segment, which is how two sections can have different root layouts.",
        "A parallel slot renders alongside the page and has its own loading and error states.",
        "A slot with no match for the current URL falls back to its `default` file, and forgetting that file is what makes a slot vanish on refresh.",
      ],
      useCase: { title: "A dashboard with independent panels", scenario: "Feed, notifications and stats each load, fail and refresh on their own, instead of one slow panel holding up the whole view." },
    },
    "Nested layouts": {
      points: [
        "Each layout wraps everything below it, so shared chrome is declared once at the level where it applies.",
        "A layout cannot read the current page's `searchParams` — that belongs to the page, which is the usual reason state is lifted into the URL.",
        "Because layouts persist, an Effect in one runs on mount and not on every navigation beneath it.",
      ],
      useCase: { title: "A settings area with its own navigation", scenario: "Every settings page shares a tab bar that does not re-render or lose focus as the reader moves between tabs." },
    },
    "Intercepting routes": {
      points: [
        "An intercepting route renders another route's content in the current layout while the URL becomes that route's.",
        "A hard refresh on that URL renders the real page, so the content must work both as a modal and as a full page.",
        "The `(..)` markers count route segments, not folder depth, which is the part people get wrong first.",
      ],
      useCase: { title: "A photo that opens as a modal but shares as a page", scenario: "Clicking a thumbnail opens it over the grid; sending that link to a friend opens the full page, with no duplicated component." },
    },
    "Loading and error UI": {
      points: [
        "A `loading` file wraps its segment in a Suspense boundary, so the fallback appears without writing one by hand.",
        "An `error` file must be a Client Component — it receives the error and a `reset` function to retry the segment.",
        "The root error file does not catch errors in the root layout; that needs `global-error`, which renders its own `<html>`.",
      ],
      useCase: { title: "A slow section that does not blank the page", scenario: "The reader sees the shell and a skeleton for the report area, and a failed query offers a retry rather than an empty route." },
    },
    "Server and Client Components": {
      points: [
        "Components are server-rendered by default; `'use client'` marks the boundary where the browser bundle begins.",
        "The directive applies to the module and everything it imports, so one stray `'use client'` high in the tree can pull the subtree into the bundle.",
        "A Server Component can render a Client Component and pass it serializable props, but not the other way around — except as children.",
      ],
      useCase: { title: "Keeping a heavy formatter off the phone", scenario: "Markdown or date-formatting libraries run on the server and ship as HTML, which is usually the largest single saving on a content route." },
    },
    "Streaming with Suspense": {
      points: [
        "The shell is sent as soon as it is ready and slower boundaries arrive after it, on the same response.",
        "Each boundary is independent, so a slow query delays only its own region.",
        "An `await` above every boundary blocks the whole stream — where the await sits decides what the reader sees first.",
      ],
      useCase: { title: "Showing navigation before the data arrives", scenario: "A reader can start reading and clicking while a three-second analytics query finishes, instead of watching a blank tab." },
    },
    "Not-found handling": {
      points: [
        "Calling `notFound()` throws, so nothing after it in the function runs — it is a control-flow exit, not a return value.",
        "The nearest `not-found` file renders, which is how a section can have its own missing-resource page.",
        "It produces a real 404 status, which is what search engines and monitoring need to see.",
      ],
      useCase: { title: "A deleted record that must not look broken", scenario: "An old link to a removed article shows the section's own not-found page and a correct status, rather than an empty template." },
    },
    "Metadata API": {
      points: [
        "Static `metadata` is for values known at build; `generateMetadata` is for values that depend on the request or the record.",
        "Metadata from nested segments merges with its parents, so a page overrides only what it names.",
        "An `opengraph-image` file generates the social image at build or request time, with no design tool in the loop.",
      ],
      useCase: { title: "Link previews that show the actual article", scenario: "A shared URL renders the post's own title, description and image instead of the site-wide default on every link." },
    },
    "Cache Components": {
      points: [
        "`use cache` marks work whose result may be reused, and the surrounding route can still stream live parts around it.",
        "Everything a cached function closes over becomes part of its cache key, which is why passing a whole request object defeats it.",
        "It is opt-in behind its flag: a route without it is rendered per request, as before.",
      ],
      useCase: { title: "A price list read a thousand times a minute", scenario: "The catalogue is computed once and reused while the cart beside it stays per-request, so traffic does not reach the database a thousand times." },
    },
    "Fetch caching": {
      points: [
        "Identical fetches in one render are memoized, so two components asking for the same record cause one request.",
        "Memoization lasts for one render pass only — it is not a cache between requests.",
        "Reading cookies or headers makes a route dynamic, which is the usual reason a page that 'should be static' is not.",
      ],
      useCase: { title: "Two components that need the same user", scenario: "A header and a sidebar both read the signed-in user without either passing it down or the server fetching it twice." },
    },
    "cacheLife and cacheTag": {
      points: [
        "`cacheLife` sets how long a cached result stays fresh and how long it may be served stale while revalidating.",
        "`cacheTag` names what the result depends on, so one write can invalidate every page built from it.",
        "Tags are strings you choose — a scheme like `product:42` is what makes targeted invalidation possible later.",
      ],
      useCase: { title: "Publishing an edit without a full rebuild", scenario: "Editing one product expires exactly the pages that show it, instead of waiting for a timer or redeploying the site." },
    },
    "updateTag and revalidateTag": {
      points: [
        "`updateTag` refreshes the cached entry before the response is sent, so the author sees their own write on the next screen.",
        "`revalidateTag` marks it stale and refreshes in the background, so the current reader may still be served the old copy once.",
        "Both act on tags, not URLs, so what they affect is decided when the data is cached rather than when it is invalidated.",
      ],
      useCase: { title: "Choosing who waits for the refresh", scenario: "An editor saving a post must not see stale text, while a thousand readers of the public page can take the refresh a moment later without blocking on it." },
    },
    "Revalidation and invalidation": {
      points: [
        "`revalidateTag` marks content stale so the next request refreshes it; the current reader may still see the old copy.",
        "`updateTag` refreshes immediately, which is what an author needs after saving their own change.",
        "Invalidating from inside a server function keeps the write and the refresh in one place rather than in a webhook later.",
      ],
      useCase: { title: "Seeing your own edit right away", scenario: "An author saving a post should not have to refresh twice; other readers can pick the change up on their next visit." },
    },
    "Server Functions": {
      points: [
        "A server function is a public endpoint: its arguments arrive over the network, so authorization belongs inside it, not in the component that calls it.",
        "It can be called from a form action or an event handler, and returns serializable data only.",
        "Marking a whole module `'use server'` exports every function in it as an endpoint — which is how one is exposed by accident.",
      ],
      useCase: { title: "Saving a form without an API route", scenario: "The write, its validation and the cache invalidation live in one function instead of a route file, a fetch wrapper and types kept in sync." },
    },
    "Forms and progressive enhancement": {
      points: [
        "A form whose action is a server function submits before the JavaScript bundle loads, and upgrades silently once it does.",
        "The action receives FormData, so field names in the markup are the contract.",
        "Keeping validation in the action rather than in the client means the rule holds even when the request does not come from your form.",
      ],
      useCase: { title: "A sign-up that works on a bad connection", scenario: "On a slow phone the form still posts and responds; the client bundle improves the experience rather than being required for it." },
    },
    "Cookies and sessions": {
      points: [
        "`cookies()` is awaited in Next.js 16 and can only be read in a server context — a Client Component cannot call it.",
        "Setting a cookie is only allowed in a server function or a route handler, not while rendering a page.",
        "Reading cookies opts the route out of static rendering, which is a deliberate trade, not a bug.",
      ],
      useCase: { title: "Keeping someone signed in", scenario: "A session cookie is read on every server render to decide what the page shows, and set only where a response can legally carry it." },
    },
    "CSRF and action security": {
      points: [
        "Every server function is reachable by anyone who can find its id, so identity must be re-checked inside it.",
        "Next.js checks the request origin for actions, but that does not authorize the caller — that is still yours to do.",
        "Validating the shape of the arguments with a schema stops a crafted call reaching the database.",
      ],
      useCase: { title: "A delete button only an owner may press", scenario: "Hiding the button in the UI is not protection; the ownership check has to run in the function that performs the delete." },
    },
    "Proxy": {
      points: [
        "`proxy` is the Next.js 16 convention that replaces the `middleware` file, with the same request-time position.",
        "It runs before routing, so it suits redirects, rewrites and auth gates — not data fetching.",
        "It runs on every matched request, which makes anything slow in it a cost paid site-wide.",
      ],
      useCase: { title: "Sending signed-out readers to sign-in", scenario: "One rule redirects every protected path before a page renders, instead of a check repeated in twenty route files." },
    },
    "Proxy matchers": {
      points: [
        "A matcher limits which paths run the proxy, and omitting one means it runs for assets and images too.",
        "Matchers are evaluated before the function, so an excluded path costs nothing at all.",
        "Static files, `_next` internals and the favicon are the usual exclusions people forget until they see the latency.",
      ],
      useCase: { title: "Not paying auth latency on every image", scenario: "A dashboard's images should not pass through the auth check that its pages need, which a matcher expresses in one line." },
    },
    "Headers, cookies and redirects": {
      points: [
        "`headers()` and `cookies()` are awaited in Next.js 16 and are server-only.",
        "`redirect()` throws, so code after it does not run, and it must not be called inside a try block that swallows the throw.",
        "`permanentRedirect` is a 308 that browsers and crawlers cache — the wrong choice is hard to take back.",
      ],
      useCase: { title: "Routing by locale or role on the server", scenario: "The decision is made before render from the request's own headers, so no flash of the wrong page reaches the browser." },
    },
    "Middleware migration to Proxy": {
      points: [
        "The file is renamed to `proxy` and the exported function to `proxy`; the config and matcher shape carry over.",
        "The Node.js runtime is available, so code that needed the edge runtime's restricted API set no longer does.",
        "Leaving the old file in place means the rule silently stops running, which is the failure this migration causes.",
      ],
      useCase: { title: "Bringing a Next.js 15 app forward", scenario: "An existing auth or locale middleware keeps working after the rename, without rewriting the logic inside it." },
    },
    "Turbopack": {
      points: [
        "It is the default bundler for dev and build in Next.js 16, with a filesystem cache that survives a restart.",
        "Incremental compilation means the second change to a file is far cheaper than the first — cold and warm timings are not comparable.",
        "Some webpack loaders and plugins have no equivalent, which is the usual reason a project cannot move yet.",
      ],
      useCase: { title: "A dev server that keeps up with a large app", scenario: "Edit-to-refresh is what a team pays fifty times a day, and it is where build tooling either saves or wastes an afternoon." },
    },
    "DevTools MCP": {
      points: [
        "It exposes routes, build information and runtime errors to tooling rather than only to the terminal.",
        "It reports which segments are static and which dynamic, which answers 'why is this route not cached' directly.",
        "It is a development aid and is not part of the production server.",
      ],
      useCase: { title: "Finding why a page went dynamic", scenario: "A route that used to prerender now renders per request, and the cause is one call somewhere in its tree." },
    },
    "Environment variables": {
      points: [
        "Only names prefixed `NEXT_PUBLIC_` reach the browser; everything else stays on the server.",
        "Public values are inlined at build time, so changing one needs a rebuild, not a restart.",
        "A secret read in a Client Component is a secret published — the prefix rule is the whole protection.",
      ],
      useCase: { title: "One API key that must never ship", scenario: "The browser needs the project URL while the service key stays server-side, and the prefix is what keeps them apart." },
    },
    "Static and dynamic rendering": {
      points: [
        "A route is prerendered until something request-specific is read — cookies, headers, or `searchParams`.",
        "Dynamic is not slower by nature; it is uncached, which is a different and sometimes correct choice.",
        "The build output lists each route's mode, which is the fastest way to catch a page that changed by accident.",
      ],
      useCase: { title: "A marketing page and a dashboard in one app", scenario: "The landing page is served from cache worldwide while the account page renders per request, from the same codebase." },
    },
    "Images, fonts and metadata": {
      points: [
        "Images are resized and served in modern formats per device, which is usually the largest transfer saving on a page.",
        "Fonts are self-hosted at build time, removing a third-party request and the layout shift that comes with it.",
        "Width and height (or `fill`) reserve space before load, which is what keeps Cumulative Layout Shift near zero.",
      ],
      useCase: { title: "Passing Core Web Vitals on a phone", scenario: "A hero image and a web font are the two things most likely to fail the field measurement that search ranking uses." },
    },
    "next/image": {
      points: [
        "Remote sources must be allow-listed in config, which stops the optimizer being used as an open proxy.",
        "`priority` preloads the image the reader sees first; using it on several images removes the benefit.",
        "`fill` needs a positioned parent, and forgetting that is why an image sometimes collapses to nothing.",
      ],
      useCase: { title: "A product gallery on a slow connection", scenario: "Each thumbnail arrives at the size that device needs rather than a 3MB original scaled down in the browser." },
    },
    "next/font": {
      points: [
        "Fonts are downloaded at build time and served from your own domain, so no request reaches a font CDN.",
        "A fallback is generated with matching metrics, which is what stops text jumping when the real font lands.",
        "Loading a font inside a component instead of at module scope re-triggers the work on every render.",
      ],
      useCase: { title: "Brand type without the layout jump", scenario: "Headings render in the right font immediately and do not reflow the page a moment after it appears." },
    },
    "Bundle analysis": {
      points: [
        "The client bundle only contains what a Client Component imports — tracing an import chain is how a stray dependency is found.",
        "A single `'use client'` near the root can pull a subtree's imports into the browser.",
        "Moving formatting, parsing or date work back to the server usually beats trying to shrink the library doing it.",
      ],
      useCase: { title: "A route that ships 900KB for no reason", scenario: "One icon set or date library imported in a client file accounts for most of it, and the analyzer names the file." },
    },
    "Route Handlers": {
      points: [
        "A handler exports a function per HTTP method and returns a standard Response.",
        "It runs on the server with the app's environment, which is why webhooks belong here rather than in a separate service.",
        "A handler that reads the request body is dynamic by definition and is never prerendered.",
      ],
      useCase: { title: "Receiving a payment webhook", scenario: "The provider needs a plain URL to POST to, with signature verification and database access in the same deployment as the app." },
    },
    "Authentication and authorization": {
      points: [
        "Checks belong at the data boundary: a layout check protects what it renders, not what a server function can be called to do.",
        "Session reading in a layout does not run for server functions, which is the gap most often shipped.",
        "Authorization is per resource, so 'is signed in' is rarely the same question as 'may see this record'.",
      ],
      useCase: { title: "An account page nobody else may open", scenario: "Guarding the page is not enough when the same data is reachable through an action or a handler with a guessed id." },
    },
    "Testing App Router routes": {
      points: [
        "A route handler is a function from Request to Response, so it can be tested without starting a server.",
        "Server functions are ordinary async functions — their authorization checks are the part worth asserting.",
        "End-to-end tests are what cover streaming and navigation, which unit tests of a component cannot observe.",
      ],
      useCase: { title: "Proving the webhook still verifies signatures", scenario: "A refactor that drops a check should fail a test rather than be discovered by an unauthorized POST in production." },
    },
    "Navigation and prefetching": {
      points: [
        "`Link` prefetches routes in view, so the next page is usually already on its way when the reader clicks.",
        "Prefetching fetches the route, not your data cache, so a slow query is still slow on arrival.",
        "Turning prefetch off on a long list of links avoids requesting hundreds of routes nobody opens.",
      ],
      useCase: { title: "A list where every click feels instant", scenario: "The reader scrolls a feed and the article they choose renders immediately because its route arrived while they were reading." },
    },
    "useRouter and useSearchParams": {
      points: [
        "Both are Client Component hooks; a Server Component reads the equivalent from its props instead.",
        "`useSearchParams` makes the component render on the client, so it belongs in a small leaf rather than a page shell.",
        "`router.replace` changes the URL without adding a history entry, which is what a filter should do.",
      ],
      useCase: { title: "Filters that live in the URL", scenario: "Changing a filter updates the address bar so the view can be shared and the back button behaves, without a full navigation." },
    },
  },
  "React 19+ — Components, Actions & Server UI": {
    "Components & JSX": {
      points: [
        "JSX compiles to function calls, so a component is an ordinary function that happens to return an element tree.",
        "Curly braces embed a JavaScript expression, not a statement — which is why a loop becomes `map` and an `if` becomes a ternary.",
        "A component name must start with a capital letter, or JSX emits the literal HTML tag instead of calling your function.",
      ],
      useCase: { title: "One card component, fifty places", scenario: "A product tile appears on search, wishlist and checkout; written as a component, a design change lands once instead of in three diverging copies." },
    },
    "Props and composition": {
      points: [
        "Props are read-only inputs: writing to one mutates the parent's data and produces a render that React cannot reproduce.",
        "`children` is the prop that lets a wrapper hold content it knows nothing about, which is how layout components avoid a prop per slot.",
        "Passing a component as a prop beats adding another boolean flag — three booleans on one component is the signal it should have been composed.",
      ],
      useCase: { title: "A dialog that wraps anything", scenario: "A modal has to hold a form today and a chart tomorrow; taking children keeps it from growing a `type` prop with a switch inside." },
    },
    "Refs and the DOM": {
      points: [
        "Changing `ref.current` does not re-render, which is exactly why it suits values the UI does not display.",
        "The node is null until the element mounts, so DOM work belongs in an Effect or an event handler, never in the render body.",
        "Reading layout from a ref forces the browser to compute style, so measuring in a loop is a common cause of jank.",
      ],
      useCase: { title: "Focusing the first field of a form", scenario: "Opening a dialog should put the cursor in its first input; the browser owns focus, so React needs a handle to the node to ask for it." },
    },
    "State with useState": {
      points: [
        "The setter queues an update — reading the state variable on the next line still gives the previous value.",
        "Pass a function to the setter when the next value depends on the last one, or two updates in the same tick collapse into one.",
        "Passing a function to `useState` itself makes the initial value lazy, so an expensive default is computed once and not on every render.",
      ],
      useCase: { title: "A tab, a toggle, a draft", scenario: "State that belongs to one screen and nothing else — putting it in a global store instead is what makes two screens fight over one value." },
    },
    "Reducers & context": {
      points: [
        "A reducer moves the transition rules out of the handlers, so 'what can happen next' is readable in one function.",
        "A reducer must be pure: the same state and action produce the same next state, which is what makes it testable without a component.",
        "Context re-renders every consumer when its value changes, so a new object literal as the value re-renders them all on every parent render.",
      ],
      useCase: { title: "A multi-step wizard", scenario: "Steps, validation and a back button turn into a tangle of `useState` calls that can reach impossible combinations; a reducer names the legal transitions." },
    },
    "Effects and synchronization": {
      points: [
        "An Effect runs after paint, so anything that must happen before the browser draws belongs in `useLayoutEffect` instead.",
        "The cleanup function is not optional for subscriptions and timers: without it a component that mounts twice leaks the first one.",
        "Work that only derives a value from props or state does not need an Effect — computing it during render is simpler and cannot go stale.",
      ],
      useCase: { title: "A live price that must stop when the panel closes", scenario: "A socket opened on mount keeps pushing updates after navigation unless the teardown runs — the classic memory leak in a dashboard." },
    },
    "useEffectEvent": {
      points: [
        "It separates the values an Effect reacts to from the values it merely reads, which is what a stale-closure bug is really about.",
        "The function it returns is not reactive, so it must not appear in the dependency array.",
        "It can only be called from inside an Effect in the same component — passing it elsewhere is a lint error, not a style preference.",
      ],
      useCase: { title: "An analytics call inside a subscription", scenario: "Logging the current filter when a message arrives should not make the socket reconnect every time the filter changes." },
    },
    "Actions and forms": {
      points: [
        "An action receives the FormData, so the form works before JavaScript loads and keeps working after it does.",
        "Pending, error and result come from the framework, replacing the four `useState` calls a hand-written submit handler needs.",
        "Actions are queued: a double-clicked submit runs in order rather than racing itself.",
      ],
      useCase: { title: "A checkout that survives a flaky connection", scenario: "A submit on a train has to show pending, report failure and not charge twice — the states a hand-rolled handler usually gets wrong." },
    },
    "useOptimistic": {
      points: [
        "The optimistic value exists only while the action is in flight; it is discarded when the real result arrives.",
        "React reverts it automatically on failure, so no rollback code is written by hand.",
        "It is a render-time projection, not state — the server's answer remains the source of truth.",
      ],
      useCase: { title: "A Like that responds instantly", scenario: "Waiting 400ms for a round trip makes a button feel broken; showing the new count immediately and correcting on failure is what feels native." },
    },
    "Form status": {
      points: [
        "It reads the status of the nearest parent form, so a submit button does not need the state passed down to it.",
        "It must be called from a component rendered inside the form — the form's own component cannot read its own status.",
        "It exposes the pending flag, the data being sent and the method, which is enough to disable and label a button correctly.",
      ],
      useCase: { title: "A shared submit button component", scenario: "One button used in twelve forms shows the right spinner without each form threading a `isSubmitting` prop into it." },
    },
    "Suspense and use": {
      points: [
        "`use` reads a promise during render and suspends until it settles, so no `isLoading` flag is written.",
        "The nearest Suspense boundary decides what is shown while it waits, which makes loading a layout decision rather than a per-component one.",
        "Unlike a Hook, `use` may be called inside a condition — the one exception to the usual rule.",
      ],
      useCase: { title: "A page that streams its slow panel last", scenario: "Header and navigation appear immediately while a slow report renders behind its own boundary, instead of the whole route waiting on one query." },
    },
    "Error boundaries": {
      points: [
        "A boundary catches errors thrown while rendering its children, not in event handlers or async callbacks.",
        "Without one, a thrown render error unmounts the whole tree — React's deliberate choice over showing corrupted UI.",
        "A boundary needs a reset path, or the reader is left on an error screen with nothing to do but reload.",
      ],
      useCase: { title: "One broken widget, not a blank page", scenario: "A third-party chart that throws on malformed data should leave the rest of the dashboard usable and offer a retry." },
    },
    "Server Components": {
      points: [
        "They run only on the server and never ship their code to the browser, which is why a heavy formatting library used there costs the client nothing.",
        "Props crossing into a Client Component must be serializable, so a function cannot simply be passed down.",
        "They have no state and no Effects — interactivity begins at the `'use client'` boundary.",
      ],
      useCase: { title: "A content page that stays light on mobile", scenario: "Rendering markdown or a large table on the server ships HTML instead of the parser plus the data, which is most of the bundle on a content-heavy route." },
    },
    "Server Functions": {
      points: [
        "Every server function is a public endpoint: arguments arrive from the network and must be validated and authorized inside it.",
        "It returns serializable data to the caller, so a database row with methods on it cannot be returned as-is.",
        "Calling one from a client component creates an implicit request, which is why an accidental call in a loop becomes a traffic problem.",
      ],
      useCase: { title: "Saving a draft without an API layer", scenario: "The editor calls a function that writes to the database, replacing a hand-written route, a fetch wrapper and the types kept in sync between them." },
    },
    "React Compiler": {
      points: [
        "It memoizes at build time by proving what a component reads, which removes most hand-written `useMemo` and `useCallback`.",
        "It only optimizes code that follows the Rules of React — mutating props or state is what makes it bail out on a component.",
        "Its output is ordinary React, so a component it skipped still works; it is a performance tool, not a requirement.",
      ],
      useCase: { title: "Deleting a file of memo wrappers", scenario: "A mature codebase accumulates memoization nobody can justify; the compiler lets the team remove it without measuring each one by hand." },
    },
    "Transitions": {
      points: [
        "Marking an update as a transition tells React it may be interrupted by a more urgent one, such as a keystroke.",
        "The pending flag belongs to the transition, which is how a filter can show it is working without blocking the input.",
        "Updates inside a transition are still applied — it changes their priority, never whether they happen.",
      ],
      useCase: { title: "A filter over ten thousand rows", scenario: "Typing stays smooth because re-rendering the table is interruptible, instead of every keystroke waiting for the list to finish." },
    },
    "Activity and View Transitions": {
      points: [
        "Activity keeps a hidden subtree's state and Effects available so returning to it does not rebuild it from scratch.",
        "View Transitions hand the browser a before and after so it can animate between them without a library.",
        "Both are opt-in per area of the UI — applying them globally is how an app ends up feeling slower, not faster.",
      ],
      useCase: { title: "Switching tabs without losing scroll", scenario: "Coming back to a tab should restore where the reader was and animate the change, rather than remounting and jumping to the top." },
    },
    "Fragment refs": {
      points: [
        "A Fragment ref reaches the DOM nodes a Fragment rendered, which previously required a wrapper element.",
        "It removes the extra `div` that used to exist only to hold a ref — the one that broke grid and flex layouts.",
        "It is read-only access for observation: the children still belong to the components that rendered them.",
      ],
      useCase: { title: "Observing a list without a wrapper div", scenario: "An intersection observer for infinite scroll needed a container element that changed the layout; the ref now attaches without it." },
    },
    "Conditional rendering": {
      points: [
        "`&&` renders `0` when the left side is the number zero — the reason an empty list sometimes shows a stray 0.",
        "An early return keeps the loading and error paths out of the main body, which is what keeps a component readable.",
        "Returning `null` renders nothing and is different from returning `undefined`, which React treats as a mistake.",
      ],
      useCase: { title: "Empty, loading, error and ready", scenario: "Every data-backed screen has four states, and handling them explicitly is what stops an empty result rendering as a broken layout." },
    },
    "Lists and keys": {
      points: [
        "A key identifies an item across renders; the array index is not one when the list can reorder, filter or grow at the front.",
        "A wrong key is why an input's text follows the wrong row after a sort — React reused the element it thought was the same.",
        "Keys must be unique among siblings only, not globally, and they never reach the component as a prop.",
      ],
      useCase: { title: "A sortable table with inputs in it", scenario: "Sorting a list of editable rows moves the values to the wrong rows when keyed by index — one of the most-reported React bugs." },
    },
    "Controlled inputs": {
      points: [
        "A controlled input renders the value from state, so validation and formatting can happen between keystroke and display.",
        "An input with `value` and no `onChange` is read-only, which React warns about because it is almost always an oversight.",
        "Uncontrolled inputs with `defaultValue` are lighter, and suit a form read once on submit rather than on every keystroke.",
      ],
      useCase: { title: "A card-number field that formats as you type", scenario: "Inserting spaces every four digits and rejecting letters needs the value to pass through state before it is displayed." },
    },
    "useActionState": {
      points: [
        "It returns the last result alongside the action, so a server error message can be rendered without separate state.",
        "The action receives the previous state as its first argument, which makes retry and accumulate patterns natural.",
        "It works with a plain form element, so the page still submits when JavaScript has not loaded.",
      ],
      useCase: { title: "A sign-in form that reports why it failed", scenario: "The server's 'wrong password' has to reach the field without a store, a context or an effect syncing it into state." },
    },
    "useTransition": {
      points: [
        "It gives you the pending flag directly, unlike `startTransition` on its own.",
        "Updates inside its callback must be synchronous — an `await` before `setState` escapes the transition.",
        "It does not make rendering faster; it changes what may be interrupted, which is what makes input feel fast.",
      ],
      useCase: { title: "Switching a heavy tab", scenario: "The tab highlight moves immediately while the expensive panel renders behind it, instead of the click appearing to do nothing for 300ms." },
    },
    "useDeferredValue": {
      points: [
        "It keeps the previous value on screen while a new one renders, which is what avoids a flash of empty results.",
        "It takes a value rather than an update, so it suits props you receive and cannot wrap in a transition.",
        "Comparing the deferred value with the current one is how a component knows it is showing stale output.",
      ],
      useCase: { title: "Search results that lag the input on purpose", scenario: "The text field updates on every keystroke while the expensive result list catches up, showing the last good results meanwhile." },
    },
    "useMemo and useCallback": {
      points: [
        "Both cost memory and comparison work on every render, so an unmeasured memo is usually a net loss.",
        "`useCallback` matters when the identity of a function is a dependency — of a memoized child, or of an Effect.",
        "An empty dependency array with values read inside it is the stale-closure bug these two cause most often.",
      ],
      useCase: { title: "A child that re-renders for no reason", scenario: "A memoized list re-renders on every parent update because its callback prop is a new function each time — the case where stabilizing identity actually pays." },
    },
    "Context as a provider": {
      points: [
        "In React 19 the context object itself is the provider, so `<Context>` replaces `<Context.Provider>`.",
        "Context is not a state manager: it distributes a value, and every consumer re-renders when that value changes identity.",
        "Splitting one context into a value and a dispatch context keeps components that only dispatch from re-rendering.",
      ],
      useCase: { title: "Theme, locale and the signed-in user", scenario: "Values needed at every depth of the tree, where threading props would touch every component in between." },
    },
    "Hydration and mismatch debugging": {
      points: [
        "A mismatch means server and client rendered different HTML — `Date.now()`, `Math.random()` and `localStorage` are the usual causes.",
        "React 19 prints the differing tree rather than a generic warning, which turns a hunt into a read.",
        "Rendering browser-only content after mount, or with `suppressHydrationWarning`, is the deliberate fix — not disabling SSR for the page.",
      ],
      useCase: { title: "A timestamp that breaks hydration", scenario: "'Posted 2 minutes ago' computed during both renders produces different text and discards the server HTML for that subtree." },
    },
    "useId": {
      points: [
        "It produces an identifier that is identical in the server render and the client render, which a counter cannot.",
        "It is for linking elements — label to input, input to its description — not for list keys.",
        "One call can prefix several ids in a component, so a form field does not need three separate calls.",
      ],
      useCase: { title: "A reusable field component", scenario: "The same input rendered three times on a page needs three distinct label associations, and hard-coded ids collide." },
    },
    "ref as a prop": {
      points: [
        "Function components receive `ref` like any other prop in React 19, so `forwardRef` is no longer needed.",
        "Existing `forwardRef` components keep working — this is an addition, not a breaking change.",
        "A ref cleanup function may now be returned from the ref callback, which replaces the null-check on unmount.",
      ],
      useCase: { title: "A design-system input the parent can focus", scenario: "Every wrapped input used to need a forwardRef layer; the prop now passes straight through, one wrapper fewer in the stack trace." },
    },
    "Document metadata": {
      points: [
        "A `<title>` or `<meta>` rendered in a component is hoisted into the document head automatically.",
        "It works in Server and Client Components, so a route and a dialog can each set what they need.",
        "Duplicates are not de-duplicated for you — the last rendered tag wins, which matters for nested layouts.",
      ],
      useCase: { title: "Per-page titles without a head library", scenario: "A product page sets its own title and description from the record it just rendered, rather than through a separate metadata mechanism." },
    },
    "Stylesheets and preloading": {
      points: [
        "A stylesheet rendered by a component is inserted once with a declared precedence, so load order stops depending on import order.",
        "`preload` and `preinit` start a fetch before the element that needs it renders, which removes a round trip on navigation.",
        "React de-duplicates these across components, so two cards asking for the same font request it once.",
      ],
      useCase: { title: "A widget that brings its own CSS", scenario: "A chart used on three routes should load its stylesheet exactly once, at a predictable precedence relative to the app's own." },
    },
  },
  "Cypress — End-to-End Testing & Network Control": {
    "Commands and chaining": {
      points: [
        "Each command yields to the next rather than returning a value to a variable.",
        "The chain is queued and then run, which is why a value read outside it is undefined.",
        "Retryability belongs to the last query in a chain, not to the whole chain.",
      ],
    },
    "Assertions": {
      points: [
        "Assertions describe rendered browser state, so Cypress can retry until it holds.",
        "A retried assertion is what removes the arbitrary wait an async update would need.",
        "An assertion with a side effect is re-run on every retry.",
      ],
    },
    "Interacting with forms": {
      points: [
        "Fields are filled and submitted through the same controls a person operates.",
        "Typing fires the events the application listens for, which setting a value does not.",
        "A disabled or covered control fails the action rather than silently doing nothing.",
      ],
    },
    "Network interception": {
      points: [
        "cy.intercept observes or replaces a request while leaving the contract visible in the test.",
        "Intercepting by route keeps the test readable when the call site moves.",
        "An intercept registered after the request is made never matches it.",
      ],
    },
    "Fixtures and test data": {
      points: [
        "Deterministic data is loaded and state reset so order never decides the result.",
        "A test that depends on a previous test's leftovers fails alone and passes in a suite.",
        "Resetting before rather than after is what survives a crashed run.",
      ],
    },
    "Debugging and retries": {
      points: [
        "Command logs, snapshots and retries show what the page looked like at each step.",
        "Time travel is what turns a failure message into a visible cause.",
        "Retries hide a real race unless the underlying timing is then fixed.",
      ],
    },
    "cy.get and querying": {
      points: [
        "Controls are queried with retryable commands and selectors that survive a restyle.",
        "A selector tied to a styling class breaks on a change that alters nothing functional.",
        "A dedicated test attribute is the selector least likely to move.",
      ],
    },
    "Command queue": {
      points: [
        "Commands are enqueued and executed later, not run where they are written.",
        "A value assigned inside a callback is not readable on the next line.",
        "Mixing synchronous code into the chain runs it before any command does.",
      ],
    },
    "Fixtures": {
      points: [
        "Reusable data is loaded from a file so setup is explicit rather than implied.",
        "A fixture is shared, so editing it changes every test that loads it.",
        "A fixture drifting from the real response makes a green test meaningless.",
      ],
    },
    "Custom commands": {
      points: [
        "Repeated workflows are extracted into typed commands of their own.",
        "Hiding an assertion inside a command removes it from the test that needed it.",
        "A command that logs in through the interface repeats that cost in every test.",
      ],
    },
    "cy.session": {
      points: [
        "An authenticated session is cached and restored between tests.",
        "Restoring a session skips a repeated sign-in without skipping the sign-in test.",
        "The cache key must include whatever makes one session differ from another.",
      ],
    },
    "Aliases": {
      points: [
        "Elements, requests and data are named for use in a later assertion.",
        "An alias to an element re-queries rather than holding a stale node.",
        "An alias defined in one hook is not visible from another spec.",
      ],
    },
    "wait for network": {
      points: [
        "A request is aliased and awaited instead of sleeping for a guessed duration.",
        "Waiting on the request ties the test to the event rather than to the clock.",
        "A fixed sleep is both slower than needed and still occasionally too short.",
      ],
    },
    "Request stubbing": {
      points: [
        "Success, latency and failure are controlled at the HTTP boundary.",
        "Stubbing an error path is how a failure state is tested at all.",
        "A stubbed response that the real server would never send tests nothing.",
      ],
    },
    "Component testing": {
      points: [
        "A component is mounted in a real browser and asserted on directly.",
        "It runs the real styles and layout, which a virtual DOM renderer does not.",
        "Mounting bypasses routing and data loading, so those stay untested here.",
      ],
    },
    "Cross-origin testing": {
      points: [
        "An origin change is handled explicitly with cy.origin.",
        "Code inside the block runs in the other origin and cannot see outer variables.",
        "Crossing origins without it stops the test at the boundary.",
      ],
    },
    "Screenshots and videos": {
      points: [
        "Visual evidence is captured automatically when a run fails.",
        "A recording of the failing run is what makes a CI-only failure diagnosable.",
        "Artifacts accumulate, so retention has to be bounded.",
      ],
    },
    "Flake detection": {
      points: [
        "Retries are read as evidence of a race rather than as a fix for it.",
        "A test that passes only on retry is reporting a real timing or state leak.",
        "Leaving retries on without investigating converts a bug into noise.",
      ],
    },
  },
  "GraphQL — Schema, Servers, Clients & Tooling": {
    "useQuery": {
      points: [
        "It reads on render and returns loading, error and data backed by the normalised cache.",
        "Two components asking for the same entity read one cache entry, not two requests.",
        "A new object passed as variables on every render refetches instead of reusing.",
      ],
    },
    "useLazyQuery": {
      points: [
        "The query is triggered from an event rather than when the component renders.",
        "It returns an execute function, so nothing is requested until something calls it.",
        "Calling it in render is the mistake that turns it back into a normal query.",
      ],
    },
    "useMutation": {
      points: [
        "It returns a trigger plus the request state, with options to update the cache.",
        "Nothing refetches automatically; the cache update or refetch is declared.",
        "A mutation returning the changed entity with its id updates views for free.",
      ],
    },
    "useSubscription": {
      points: [
        "A long-lived stream is wired through whichever link carries the transport.",
        "It needs a link that supports streaming; the HTTP link alone cannot.",
        "Reconnection and missed events between drops are the application's problem.",
      ],
    },
    "useSuspenseQuery": {
      points: [
        "The component suspends instead of rendering a loading branch.",
        "Data is never undefined, so the type has no loading state to handle.",
        "Two suspense queries in one component wait in series unless they are hoisted.",
      ],
    },
    "useBackgroundQuery / useReadQuery": {
      points: [
        "A query starts high in the tree and is read further down without blocking the parent.",
        "Starting early is what removes the waterfall a child-initiated fetch creates.",
        "The parent does not suspend, so only the reader shows a fallback.",
      ],
    },
    "useFragment": {
      points: [
        "A component subscribes to one fragment of cached data rather than a whole result.",
        "It re-renders only when the fields it declared change.",
        "It reads the cache and never issues a request of its own.",
      ],
    },
    "useApolloClient": {
      points: [
        "The client is reached for imperative reads, writes and eviction.",
        "It is for event handlers; nothing it returns re-renders a component.",
        "Writing to the cache by hand must keep the shape the query expects.",
      ],
    },
    "urql useQuery": {
      points: [
        "It reads with a document cache by default, and normalises only with graphcache.",
        "Document caching keys whole results, so one changed entity does not update elsewhere.",
        "Adding graphcache changes invalidation behaviour across the whole application.",
      ],
    },
    "urql useMutation": {
      points: [
        "The write hook mirrors the query hook's result shape.",
        "A shared shape is what lets one renderer handle both.",
        "Without normalisation, affected queries are invalidated rather than patched.",
      ],
    },
    "urql useSubscription": {
      points: [
        "A handler folds each streamed event into the accumulated state.",
        "The handler owns the reduction, so ordering is explicit rather than assumed.",
        "Without a handler only the latest event is visible.",
      ],
    },
    "useLazyLoadQuery": {
      points: [
        "Relay fetches on render, for a screen with no preloaded query.",
        "Fetching at render is a waterfall Relay would otherwise avoid.",
        "It is the fallback, not the pattern Relay is designed around.",
      ],
    },
    "usePreloadedQuery": {
      points: [
        "A query started before the component rendered is read here.",
        "Starting at navigation is what overlaps the fetch with the render.",
        "The reference must be created outside the component that consumes it.",
      ],
    },
    "usePaginationFragment": {
      points: [
        "A connection is paged while the fragment's data stays consistent.",
        "Loaded pages stay rendered as the next one arrives.",
        "It requires the connection to follow the cursor conventions Relay expects.",
      ],
    },
    "Relay useFragment": {
      points: [
        "A component declares exactly the fields it reads and the compiler enforces it.",
        "Reading a field the fragment did not declare is a build error, not a runtime surprise.",
        "Its data requirement travels with it when it is reused elsewhere.",
      ],
    },
    "type": {
      points: [
        "An object type with fields makes up the nodes of the graph.",
        "Fields are the edges, so the type graph is what clients traverse.",
        "A type with no path from a root is unreachable however well it is defined.",
      ],
    },
    "Query": {
      points: [
        "Every read begins at a field on this root type.",
        "Its fields may resolve in parallel, unlike a mutation's.",
        "What it exposes is the entire read surface of the API.",
      ],
    },
    "Mutation": {
      points: [
        "Writes enter here, and top-level fields run one after another.",
        "Serial execution is what makes two writes in one document deterministic.",
        "Nested fields under a mutation resolve in parallel again.",
      ],
    },
    "Subscription": {
      points: [
        "A long-lived stream of events is pushed to the client from this root.",
        "It needs a transport that stays open, unlike a query.",
        "Each subscription is per client, so fan-out is a server concern.",
      ],
    },
    "input": {
      points: [
        "Input object types are deliberately separate from output types.",
        "An output type cannot be used as an argument, which is why inputs are declared.",
        "Inputs have no interfaces or unions, so variants are modelled differently.",
      ],
    },
    "interface": {
      points: [
        "Implementing types must provide the declared fields, giving polymorphism a shared contract.",
        "A client can select the shared fields without knowing the concrete type.",
        "Adding a field to an interface obliges every implementer at once.",
      ],
    },
    "union": {
      points: [
        "A value is one of several object types with no fields in common.",
        "Selecting anything requires an inline fragment naming the type.",
        "Clients need __typename to tell the members apart.",
      ],
    },
    "enum": {
      points: [
        "A closed set of named values is validated by the server.",
        "Validation happens before the resolver runs, so an invalid value never reaches it.",
        "Adding a value can break a client that exhaustively matches the old set.",
      ],
    },
    "scalar": {
      points: [
        "Leaf values carry their own parse and serialise logic when custom.",
        "A custom scalar is where format validation belongs, not in every resolver.",
        "Clients without the scalar's meaning receive it as an opaque value.",
      ],
    },
    "directive": {
      points: [
        "Declarative behaviour attaches to a schema element or a query node.",
        "It expresses cross-cutting concerns without changing the field's type.",
        "A directive the server does not implement changes nothing at execution.",
      ],
    },
    "extend": {
      points: [
        "Fields are added to an existing type, which is how modules compose a schema.",
        "Composition lets one type be assembled from several files.",
        "Extending a type that is never defined fails at composition.",
      ],
    },
    "schema": {
      points: [
        "The root operation types are named when they are not the defaults.",
        "It is only needed where the roots carry other names.",
        "Only the types named here are reachable as entry points.",
      ],
    },
    "Non-null (!)": {
      points: [
        "The field can never be null, and the client's type reflects that.",
        "Adding one is breaking for clients; removing one is not.",
        "A null from the resolver becomes an error that propagates upward.",
      ],
    },
    "List ([T])": {
      points: [
        "A list of a type, where nullability applies to the list and its items separately.",
        "The usual intent is a non-null list of non-null items.",
        "A null item in a non-null item list nulls the whole list.",
      ],
    },
    "Arguments": {
      points: [
        "Typed parameters are validated, with defaults applied, before the resolver runs.",
        "Validation ahead of the resolver keeps that check out of every resolver.",
        "A default is applied when the argument is absent, not when it is null.",
      ],
    },
    "Variables": {
      points: [
        "Placeholders sent beside the document keep the query text static.",
        "A static document is what makes caching and persisting possible.",
        "Interpolating values into the query string instead defeats both.",
      ],
    },
    "Fragments": {
      points: [
        "Named reusable selection sets are the unit colocation and codegen build on.",
        "A component's data requirement travels with the component.",
        "A fragment must be spread on a type that actually has its fields.",
      ],
    },
    "Inline fragments": {
      points: [
        "A selection applies to only one member of an interface or union.",
        "It is the only way to read fields the abstract type does not declare.",
        "Omitting a member means that case returns nothing selectable.",
      ],
    },
    "Aliases": {
      points: [
        "A field is renamed in the response so it can be queried twice with different arguments.",
        "Without one the second selection collides with the first.",
        "The alias is the response key, which is what the client reads.",
      ],
    },
    "__typename": {
      points: [
        "The meta-field names the concrete type of an object.",
        "Cache normalisation and union handling both depend on it.",
        "Clients usually request it automatically, which changes the document sent.",
      ],
    },
    "Introspection": {
      points: [
        "The schema can be queried through the schema itself.",
        "Tooling, explorers and codegen are all built on it.",
        "Leaving it open publishes the whole shape of a private API.",
      ],
    },
    "@deprecated": {
      points: [
        "A field or enum value is marked obsolete with a stated reason.",
        "It warns clients without removing anything they still call.",
        "Deprecation communicates intent; it does not enforce migration.",
      ],
    },
    "@include / @skip": {
      points: [
        "A selection is included conditionally based on a variable.",
        "The document stays static while the response varies.",
        "Different variables produce different response shapes from one query.",
      ],
    },
    "@defer / @stream": {
      points: [
        "Slow fields and long lists are delivered incrementally.",
        "The fast part of a response is not held behind the slow part.",
        "The client and the transport must both support multipart delivery.",
      ],
    },
    "@oneOf": {
      points: [
        "Exactly one field of the input object may be set.",
        "It expresses a tagged union for inputs, which the type system otherwise lacks.",
        "The constraint is validated by the server, not by convention.",
      ],
    },
    "Resolvers": {
      points: [
        "A field's value comes from a function of parent, arguments, context and info.",
        "The default resolver simply reads the property of the same name.",
        "Every field can resolve, which is what makes N+1 so easy to create.",
      ],
    },
    "Context": {
      points: [
        "Per-request state such as the user, loaders and handles is built once per operation.",
        "Sharing it per request is what makes batching within an operation possible.",
        "Context reused across requests leaks one user's data into another's.",
      ],
    },
    "The N+1 problem": {
      points: [
        "A field resolver firing one query per parent is the defining performance failure here.",
        "It appears only once a list is queried, so it hides in development.",
        "The cost scales with result size rather than with query complexity.",
      ],
    },
    "DataLoader": {
      points: [
        "Loads are batched and cached within one request.",
        "Batching turns many parent lookups into a single query.",
        "A loader shared between requests caches one user's data for another.",
      ],
    },
    "Field middleware": {
      points: [
        "Every resolver is wrapped for tracing, authorisation or masking.",
        "One wrapper is what avoids repeating a check in each resolver.",
        "It runs on every field, so its cost multiplies with query size.",
      ],
    },
    "Error handling": {
      points: [
        "Errors arrive in an errors array alongside partial data.",
        "A code in extensions is what clients should branch on, not the message.",
        "A partial success still returns 200, so status alone says nothing.",
      ],
    },
    "Nullability and errors": {
      points: [
        "An error on a non-null field propagates to the nearest nullable parent.",
        "Over-using non-null turns a single failure into a mostly empty response.",
        "A nullable field is what lets one failure stay local.",
      ],
    },
    "Execution order": {
      points: [
        "Query fields may resolve in parallel; top-level mutation fields run in series.",
        "Serial mutations make two writes in one document predictable.",
        "Relying on ordering between query fields is relying on nothing.",
      ],
    },
    "graphql-js": {
      points: [
        "The reference parser, validator and executor every JavaScript server builds on.",
        "Its behaviour is the practical definition of the specification here.",
        "It provides execution only; transport and caching are someone else's.",
      ],
    },
    "@apollo/server": {
      points: [
        "The widely deployed server with plugins, caching, metrics and a landing page.",
        "Its plugin lifecycle is where cross-cutting concerns attach.",
        "Its ecosystem assumptions are heavier than a minimal handler's.",
      ],
    },
    "graphql-yoga": {
      points: [
        "A spec-compliant, batteries-included server that runs on any JavaScript runtime.",
        "Running on web-standard requests is what makes it portable across runtimes.",
        "Its defaults are opinionated, which is the trade for the batteries.",
      ],
    },
    "mercurius": {
      points: [
        "The Fastify adapter, with JIT compilation and subscriptions.",
        "Compiling queries rewards a workload that repeats the same documents.",
        "It is tied to Fastify rather than being framework-neutral.",
      ],
    },
    "graphql-http": {
      points: [
        "A minimal handler that is strict about the HTTP specification and has no framework opinion.",
        "Strictness is what makes it a good conformance baseline.",
        "Everything beyond execution is left for you to add.",
      ],
    },
    "pothos": {
      points: [
        "A code-first builder whose types are inferred rather than generated.",
        "No generation step means the schema types cannot fall out of date.",
        "The schema is a build artifact, so it must be emitted for other tools.",
      ],
    },
    "nexus": {
      points: [
        "Code-first construction with generated types and a plugin system.",
        "Generation is what supplies the types the builder cannot infer.",
        "The generated output has to be regenerated and committed deliberately.",
      ],
    },
    "type-graphql": {
      points: [
        "Schemas are built from decorated TypeScript classes.",
        "One class can describe the type and carry its validation.",
        "It relies on decorators and metadata, which constrains the build setup.",
      ],
    },
    "gqlgen": {
      points: [
        "A schema-first Go server that generates typed resolver stubs.",
        "Regenerating after a schema change surfaces unimplemented resolvers at compile time.",
        "Generated code is committed, so the diff is part of review.",
      ],
    },
    "strawberry-graphql": {
      points: [
        "Python schemas come from dataclass-style annotations and are async throughout.",
        "Annotations mean the type and the schema are declared once.",
        "It expects an async stack end to end.",
      ],
    },
    "graphene": {
      points: [
        "The long-established Python library with Django and SQLAlchemy integrations.",
        "Its integrations map an existing model layer onto a schema quickly.",
        "Its API has shifted across major versions, so examples date badly.",
      ],
    },
    "async-graphql": {
      points: [
        "A fast, fully featured Rust implementation.",
        "Execution cost is low enough to change what is worth resolving per field.",
        "It expects Rust's async ecosystem around it.",
      ],
    },
    "graphql-java": {
      points: [
        "The JVM implementation, with Spring for GraphQL layered above it.",
        "It is the substrate the JVM ecosystem's higher-level tools build on.",
        "Used directly it is deliberately low level.",
      ],
    },
    "hot-chocolate": {
      points: [
        "The .NET server, with filtering, sorting and projections built in.",
        "Projections push selection down into the database query.",
        "Those conveniences expose the data model unless they are constrained.",
      ],
    },
    "@apollo/client": {
      points: [
        "A normalised cache, hooks, optimistic updates and local state in one package.",
        "Normalisation is what makes one mutation result update every view.",
        "It is the largest of the clients, which matters to a bundle.",
      ],
    },
    "urql": {
      points: [
        "A smaller client with document caching by default and Graphcache when normalising.",
        "Document caching is simpler and enough for many applications.",
        "Moving to Graphcache changes invalidation across the application.",
      ],
    },
    "graphql-request": {
      points: [
        "A minimal fetch wrapper for scripts and server-to-server calls.",
        "No cache is the point: each call is one request.",
        "Nothing is deduplicated, so repeated calls repeat the work.",
      ],
    },
    "relay": {
      points: [
        "Compiler-driven, fragment-first fetching with strict schema conventions.",
        "The compiler is what turns colocated fragments into one optimal query.",
        "Its conventions are requirements, not suggestions.",
      ],
    },
    "@tanstack/react-query + codegen": {
      points: [
        "Generic async state with generated typed hooks and no GraphQL-specific cache.",
        "One cache covers GraphQL and everything else the application fetches.",
        "Without normalisation, entity updates are invalidations rather than patches.",
      ],
    },
    "Normalised cache": {
      points: [
        "Entities are stored by id, so one result updates every view showing them.",
        "It is what makes a mutation update a list and a detail view at once.",
        "An entity without a stable id cannot be normalised and is duplicated.",
      ],
    },
    "Optimistic updates": {
      points: [
        "The expected result is written immediately and rolled back on failure.",
        "The interface responds at input speed rather than at network speed.",
        "A rollback that leaves other derived state behind is visible to the user.",
      ],
    },
    "Persisted queries": {
      points: [
        "A hash is sent instead of the document, cutting payload and enabling an allowlist.",
        "An allowlist removes arbitrary queries as a category of risk.",
        "Every client build must be registered before it can run.",
      ],
    },
    "Apollo Federation": {
      points: [
        "Independently deployed subgraphs compose into one supergraph.",
        "Teams own and deploy their subgraph without a shared release.",
        "Composition can fail on changes that each subgraph considers valid.",
      ],
    },
    "@key": {
      points: [
        "The fields identifying an entity across subgraphs are declared.",
        "A shared identity is what lets one type span several services.",
        "A key that is not genuinely unique breaks resolution silently.",
      ],
    },
    "@external / @requires / @provides": {
      points: [
        "Fields owned elsewhere are described, along with what a resolver needs or can supply.",
        "Declaring a dependency lets the planner fetch it before the resolver runs.",
        "@requires adds a fetch, so it is a cost as well as a convenience.",
      ],
    },
    "@shareable": {
      points: [
        "More than one subgraph may resolve the same field.",
        "It allows deliberate overlap that composition would otherwise reject.",
        "Two subgraphs disagreeing on the value is not detected at composition.",
      ],
    },
    "Entity resolution": {
      points: [
        "A reference resolver fetches an entity from its owning subgraph.",
        "It is the hook the gateway calls when following a key.",
        "It receives only the key fields, not the whole parent.",
      ],
    },
    "Apollo Router": {
      points: [
        "The Rust gateway handling query planning, caching and traffic shaping.",
        "Planning is what turns one client query into minimal subgraph fetches.",
        "It is one more deployed component to operate and observe.",
      ],
    },
    "GraphQL Mesh": {
      points: [
        "REST, gRPC and databases are presented as one GraphQL schema.",
        "An existing service is exposed without being rewritten first.",
        "The generated schema reflects the source's shape rather than a designed graph.",
      ],
    },
    "Schema stitching": {
      points: [
        "Schemas merge at the gateway without federation directives.",
        "It is simpler to start with and needs no subgraph cooperation.",
        "Merge rules live at the gateway, so ownership stays centralised.",
      ],
    },
    "graphql-codegen": {
      points: [
        "Types, hooks and SDKs are generated from the schema and your documents.",
        "Generation is what keeps client types honest against the schema.",
        "Output is only as current as the last run against the real schema.",
      ],
    },
    "client-preset": {
      points: [
        "A typed graphql function with fragment masking is the current approach.",
        "One preset replaces the stack of plugins earlier setups assembled.",
        "Masking changes what a component may read, which existing code must follow.",
      ],
    },
    "Fragment masking": {
      points: [
        "A component may read only the fields its own fragment declared.",
        "It is enforced by the types, so an accidental read fails to compile.",
        "Data must be unmasked deliberately where a component genuinely needs it.",
      ],
    },
    "Schema linting": {
      points: [
        "Naming, nullability and deprecation mistakes are caught in review.",
        "Review is the last point before a convention becomes permanent.",
        "Rules have to match the team's conventions or they are noise.",
      ],
    },
    "Schema registry": {
      points: [
        "Schemas are version controlled with composition checks.",
        "A check before publish is what stops a subgraph breaking the supergraph.",
        "It only knows about schemas that are actually published to it.",
      ],
    },
    "Breaking change detection": {
      points: [
        "A proposed schema is compared against the published one and against real traffic.",
        "Traffic data distinguishes a theoretical break from one that affects a client.",
        "A field nothing queried yesterday may still be queried tomorrow.",
      ],
    },
    "Query depth limiting": {
      points: [
        "Deeply nested queries are rejected before execution.",
        "A cyclic graph makes unbounded depth trivially reachable.",
        "Depth alone does not bound a shallow query over a huge list.",
      ],
    },
    "Query complexity analysis": {
      points: [
        "A query is scored by estimated cost and refused over a budget.",
        "Cost accounts for list sizes, which depth alone ignores.",
        "The estimate is only as good as the per-field weights given.",
      ],
    },
    "Operation allowlisting": {
      points: [
        "Only pre-registered documents may run.",
        "It removes arbitrary queries as a risk entirely.",
        "Every client release must be registered or it stops working.",
      ],
    },
    "Field-level authorisation": {
      points: [
        "Permission is checked where the data resolves, not at the HTTP edge.",
        "One request can reach many resources, so an edge check is the wrong place.",
        "A field reachable by two paths must be checked on both.",
      ],
    },
    "Rate limiting": {
      points: [
        "Limits are applied per field or per complexity rather than per request.",
        "One request can do arbitrary work, so counting requests measures nothing.",
        "The counter must be shared across instances to mean anything.",
      ],
    },
    "Response caching": {
      points: [
        "Per-field cache hints combine into one time to live for the response.",
        "The most restrictive hint is what bounds the whole response.",
        "A personalised field makes the entire response uncacheable.",
      ],
    },
    "Automatic persisted queries": {
      points: [
        "A hash-first request falls back to registering the document.",
        "Upload size drops without a build-time registration step.",
        "Unlike an allowlist, it still permits new documents to run.",
      ],
    },
    "Batching": {
      points: [
        "Several operations travel in one HTTP request.",
        "It reduces round trips for a client issuing many small queries.",
        "An unbounded batch is an amplification vector.",
      ],
    },
    "graphql-tools": {
      points: [
        "Schema construction, mocking, stitching and transforms in one toolkit.",
        "Transforms are what let an existing schema be reshaped at a gateway.",
        "It is a library of parts rather than a server.",
      ],
    },
    "Mocked schemas": {
      points: [
        "Resolvers are generated from types so a frontend can build before the backend exists.",
        "The schema is enough of a contract to work against on its own.",
        "Mock data that no real resolver would return hides integration problems.",
      ],
    },
    "MockedProvider": {
      points: [
        "Components are tested against canned results matched to queries.",
        "It exercises the component's real data flow without a server.",
        "A mock that does not match the query exactly yields an error instead.",
      ],
    },
    "graphiql": {
      points: [
        "The in-browser explorer with docs, autocomplete and history.",
        "It is driven by introspection, so it stays current with the schema.",
        "Exposing it publicly exposes the schema with it.",
      ],
    },
    "Apollo Sandbox": {
      points: [
        "A hosted explorer with schema search and saved operation collections.",
        "Collections are what make useful queries shareable across a team.",
        "It reaches your endpoint, so access and CORS have to allow it.",
      ],
    },
    "Tracing": {
      points: [
        "Per-resolver timing is exported, usually through OpenTelemetry.",
        "Resolver-level detail is what identifies the one slow field.",
        "Tracing every field on every request is itself a cost.",
      ],
    },
  },
  "Node.js — Runtime, APIs, Streams & Operations": {
    "Event loop": {
      points: [
        "Timers, I/O callbacks and microtasks run in phases, not in the order they were written.",
        "Microtasks drain fully between phases, so a promise chain can starve I/O.",
        "A CPU-bound function blocks every phase, because there is one thread doing all of it.",
      ],
    },
    "ES modules and imports": {
      points: [
        "The module system is decided by the package type field and the file extension.",
        "Imports are resolved statically, so a specifier cannot be built at runtime.",
        "Top-level await is available here and is not in CommonJS.",
      ],
    },
    "fs and paths": {
      points: [
        "Paths are composed with the path module rather than by joining strings.",
        "Separators and drive roots differ per platform, which string concatenation ignores.",
        "A user-supplied path must be resolved and checked, or it escapes the directory.",
      ],
    },
    "HTTP servers": {
      points: [
        "Requests, responses, headers and status codes are handled explicitly.",
        "The body is a stream, so it does not exist until it is read.",
        "A response that is never ended leaves the client waiting until it times out.",
      ],
    },
    "Streams and backpressure": {
      points: [
        "A write returning false means the buffer hit its `highWaterMark`.",
        "The `'drain'` event is the signal that writing may resume.",
        "Continuing to write regardless is what turns a large input into unbounded memory.",
      ],
    },
    "Process errors and signals": {
      points: [
        "Failures, shutdown signals and exit codes are handled rather than hidden.",
        "An unhandled rejection terminates the process by default in modern Node.",
        "Swallowing an error to keep the process alive leaves it in an unknown state.",
      ],
    },
    "CommonJS and package exports": {
      points: [
        "require and import interoperate, with entry points declared explicitly.",
        "The exports field is what makes internal files genuinely private.",
        "A default export does not cross the two systems the way it appears to.",
      ],
    },
    "npm and dependency management": {
      points: [
        "Scripts, lockfiles and dependency boundaries stay reproducible.",
        "The lockfile is what makes two installs produce the same tree.",
        "A dependency only needed to build belongs in devDependencies, not in the runtime.",
      ],
    },
    "EventEmitter": {
      points: [
        "Events are published and subscribed to, with listener lifetime managed.",
        "A listener never removed is a leak that grows with every subscription.",
        "An error event with no listener throws instead of being ignored.",
      ],
    },
    "Buffers": {
      points: [
        "Bytes are handled directly for files, sockets, encodings and binary protocols.",
        "A Buffer is raw bytes, so an encoding must be named to read it as text.",
        "Slicing shares memory with the original rather than copying it.",
      ],
    },
    "URL and URLSearchParams": {
      points: [
        "URLs are parsed and constructed without concatenating strings.",
        "The parser encodes each component correctly, which manual joining does not.",
        "Parameters can repeat, so reading one key can silently drop the rest.",
      ],
    },
    "File streams": {
      points: [
        "Large files are read and written incrementally with backpressure respected.",
        "Reading a file whole is fine until the file is larger than the memory.",
        "The stream must be closed on error, or the descriptor leaks.",
      ],
    },
    "Transform streams": {
      points: [
        "Data is processed as it flows rather than loaded and then converted.",
        "A transform sits between a source and a sink without materialising either.",
        "An error in the middle of a pipeline must be propagated, not swallowed.",
      ],
    },
    "Readable and writable streams": {
      points: [
        "`pipeline` composes streams and destroys them all if any one fails.",
        "`.pipe()` leaves the destination open when the source errors, which leaks.",
        "That difference is why the documentation steers toward pipeline.",
      ],
    },
    "HTTP fetch": {
      points: [
        "Outbound requests carry timeouts, abort signals and checked responses.",
        "fetch does not reject on a 404 or a 500, so the status must be read.",
        "Without a signal, a hung request holds the caller indefinitely.",
      ],
    },
    "WebSocket servers": {
      points: [
        "Real-time connections are maintained through backpressure and disconnects.",
        "A connection can vanish without a close frame, so heartbeats detect it.",
        "Slow clients need their send buffer bounded or memory grows per socket.",
      ],
    },
    "Worker threads": {
      points: [
        "CPU-bound JavaScript moves off the thread that serves requests.",
        "Each worker has its own heap, so data is copied or shared deliberately.",
        "Spawning one per task costs more than the work for anything small.",
      ],
    },
    "Child processes": {
      points: [
        "External programs run with argument boundaries, streams and exit codes handled.",
        "Passing arguments as an array is what prevents shell injection.",
        "A child whose output is never consumed blocks when its pipe fills.",
      ],
    },
    "Diagnostics and logging": {
      points: [
        "Structured logs, memory, CPU and event-loop behaviour are observable in production.",
        "Event-loop delay is the measurement that reveals blocking work.",
        "Logging to stdout synchronously makes logging itself a bottleneck.",
      ],
    },
    "Graceful shutdown": {
      points: [
        "The process stops accepting work, drains connections and exits cleanly.",
        "Keep-alive connections hold the server open unless they are closed deliberately.",
        "Exiting immediately on a signal drops requests that were mid-flight.",
      ],
    },
  },
  "Nest.js — APIs, Architecture, Security & Testing": {
    "Modules": {
      points: [
        "Controllers and providers are grouped into explicit dependency boundaries.",
        "A provider is only injectable where its module is imported or it is exported.",
        "Circular imports between modules need forwardRef and usually a redesign.",
      ],
    },
    "Controllers and routes": {
      points: [
        "HTTP requests map to typed handlers with transport concerns kept at the edge.",
        "Business logic in a controller cannot be reused by a queue consumer.",
        "Route order matters, so a wildcard declared early shadows what follows.",
      ],
    },
    "Providers and dependency injection": {
      points: [
        "Services are injected through the container rather than constructed in place.",
        "Injection is what lets a test swap a real dependency for a fake.",
        "Scope is singleton by default, so per-request state in a provider is shared.",
      ],
    },
    "Pipes and validation": {
      points: [
        "Pipes run after guards and interceptors, immediately before the handler.",
        "Route parameter pipes are evaluated last, in reverse parameter order.",
        "Validating here is what lets the handler trust its arguments.",
      ],
    },
    "Guards and authentication": {
      points: [
        "A guard decides whether the request may reach the handler.",
        "Global, controller and route guards run in that order.",
        "It runs before pipes, so it sees untransformed input.",
      ],
    },
    "Interceptors and filters": {
      points: [
        "Interceptors wrap the handler on both sides of its execution.",
        "The post-request pass runs route, then controller, then global.",
        "Filters run last and convert a thrown error into a response.",
      ],
    },
    "Dynamic modules": {
      points: [
        "Reusable modules are configured through forRoot, forFeature and async options.",
        "forRoot configures once globally; forFeature configures per consumer.",
        "Async options exist so configuration can come from an injected service.",
      ],
    },
    "ModuleRef and lifecycle": {
      points: [
        "Providers are resolved dynamically and lifecycle hooks used deliberately.",
        "It is the escape hatch when a dependency is only known at runtime.",
        "Resolving a scoped provider returns a new instance each time.",
      ],
    },
    "DTOs and class-transformer": {
      points: [
        "Transport input becomes an explicit object before validation or logic.",
        "A class is needed, not an interface, because the metadata must survive compilation.",
        "Transformation runs before validation, so a bad cast fails as a validation error.",
      ],
    },
    "ValidationPipe": {
      points: [
        "`whitelist: true` removes properties the DTO never declared.",
        "`forbidNonWhitelisted: true` rejects the request instead of silently stripping.",
        "Both are options on the pipe rather than defaults.",
      ],
    },
    "Custom pipes": {
      points: [
        "Route values are converted and precise validation failures reported.",
        "One pipe replaces the same parsing repeated in every handler.",
        "Throwing inside a pipe is how the failure becomes a proper HTTP response.",
      ],
    },
    "JWT authentication": {
      points: [
        "Access tokens are issued and verified with secrets, expiry and claims controlled.",
        "A token cannot be revoked before expiry, so lifetimes must be short.",
        "Claims travel with the token, so they are as stale as the token is.",
      ],
    },
    "Role guards": {
      points: [
        "Role or permission policies are enforced before the handler runs.",
        "Roles are read from metadata, so the rule sits beside the route it protects.",
        "A guard registered globally still needs the route to declare what it requires.",
      ],
    },
    "Passport strategies": {
      points: [
        "Local, JWT and third-party authentication integrate as named strategies.",
        "The strategy name is what links a guard to the mechanism it uses.",
        "A strategy's validate return becomes the request user, so its shape matters.",
      ],
    },
    "Custom decorators": {
      points: [
        "Request data is extracted, or metadata attached, without repeating plumbing.",
        "A parameter decorator is what keeps the handler signature honest.",
        "Metadata decorators do nothing on their own; a guard must read them.",
      ],
    },
    "Serialization": {
      points: [
        "Response payloads are shaped and internal fields hidden.",
        "Excluding a field in the entity is safer than remembering to omit it per route.",
        "The serializer only applies to class instances, not to plain objects.",
      ],
    },
    "OpenAPI documentation": {
      points: [
        "Controllers, DTOs and authentication schemes are described for consumers.",
        "The document is generated from the code, so it cannot drift from the routes.",
        "Types erased at compile time need explicit decorators to appear at all.",
      ],
    },
    "Testing controllers": {
      points: [
        "Handlers are unit tested with mocked providers and asserted precisely.",
        "A testing module builds the same container with substitutes in place.",
        "It exercises the handler, not the pipes and guards around it.",
      ],
    },
    "Testing e2e applications": {
      points: [
        "A bootstrapped application is exercised through real HTTP requests.",
        "Only this path runs the pipes, guards and filters together.",
        "The application must be closed after each suite or handles leak.",
      ],
    },
    "Queues and events": {
      points: [
        "Slow or retryable work moves to queues and services decouple through events.",
        "Returning before the work finishes is what keeps the request fast.",
        "An in-process event emitter is lost on restart; a queue is not.",
      ],
    },
    "Configuration module": {
      points: [
        "Environment configuration is loaded and validated in one place.",
        "Validating at boot turns a missing variable into a startup failure.",
        "Reading process.env directly scatters the contract across the codebase.",
      ],
    },
  },
  "Playwright Automation — Browser Testing & Debugging": {
    "Locators": {
      points: [
        "An element is found by accessible role, label and text rather than by markup.",
        "Querying the way a user perceives the page keeps the test honest about the contract.",
        "A locator is lazy: it resolves when it is used, not when it is declared.",
      ],
    },
    "Auto-waiting": {
      points: [
        "Playwright waits for an element to be actionable before acting on it.",
        "Actionable means attached, visible, stable and able to receive the event.",
        "An arbitrary sleep is both slower than needed and still sometimes too short.",
      ],
    },
    "Assertions": {
      points: [
        "Web-first assertions retry until the expected state is observable.",
        "Retrying is what removes the race between the assertion and the render.",
        "Asserting on a value read once cannot retry, because the value is already fixed.",
      ],
    },
    "Fixtures": {
      points: [
        "Setup and teardown are shared through typed fixtures.",
        "A test declares the fixtures it uses, so its dependencies stay visible.",
        "A fixture is only constructed for tests that ask for it.",
      ],
    },
    "Projects and browsers": {
      points: [
        "The same suite runs across browsers, devices, environments and sign-in states.",
        "A project is a named configuration, which is what makes a matrix declarative.",
        "Projects can depend on each other, which is how setup runs first.",
      ],
    },
    "Tracing and debugging": {
      points: [
        "Trace, screenshot, video and network evidence are captured for a failure.",
        "Evidence collected on the failing run is what makes a CI-only failure diagnosable.",
        "Capturing everything on every run is expensive, so it is usually on-failure.",
      ],
    },
    "Browser contexts": {
      points: [
        "Cookies, storage and permissions are isolated in a fresh context per scenario.",
        "A context is cheap, which is why isolation does not cost a browser launch.",
        "State leaks between tests only when a context is deliberately shared.",
      ],
    },
    "Pages and popups": {
      points: [
        "Tabs, popups and page lifecycle are coordinated without races.",
        "The popup must be awaited before the action that opens it completes.",
        "A page opened and never closed keeps its context alive.",
      ],
    },
    "Web-first assertions": {
      points: [
        "Visible, enabled and attached state are asserted with retrying expectations.",
        "Each has its own timeout, so a slow case need not raise the global one.",
        "Negating an assertion changes what is waited for, not merely the result.",
      ],
    },
    "Role and text locators": {
      points: [
        "Accessible roles, labels and test IDs are preferred over CSS or XPath.",
        "A CSS selector breaks on a restyle that changed nothing a user sees.",
        "If a role locator cannot find it, assistive technology probably cannot either.",
      ],
    },
    "Locator filtering": {
      points: [
        "A repeated component is narrowed by text, descendant state or a related locator.",
        "Filtering composes, so a row is found by what it contains rather than by index.",
        "An index-based match reorders the moment the list does.",
      ],
    },
    "Authentication state": {
      points: [
        "A prepared storage state is reused while tests stay isolated.",
        "Reusing it removes a sign-in from every test without sharing a session.",
        "A stored state expires, so it must be refreshed rather than committed forever.",
      ],
    },
    "Test hooks": {
      points: [
        "beforeEach, afterEach and fixture composition give predictable setup and cleanup.",
        "Hooks run in declaration order, which is what makes nesting predictable.",
        "A failure inside a hook fails the test rather than skipping it silently.",
      ],
    },
    "Parallel workers": {
      points: [
        "Independent tests scale across workers with shared resources controlled.",
        "Each worker is a separate process, so module state is not shared.",
        "Two workers writing the same fixture row is the usual source of flake.",
      ],
    },
    "Retries and sharding": {
      points: [
        "Transient evidence is separated from real failures and suites split across CI jobs.",
        "A test that passes only on retry is reporting a race, not a fixed problem.",
        "Sharding divides by count, so slow tests can land unevenly.",
      ],
    },
    "Network interception": {
      points: [
        "Requests are routed, fulfilled or observed to test loading and failure states.",
        "Fulfilling a route is how an error path is tested without breaking a server.",
        "A route registered after navigation misses the requests already made.",
      ],
    },
    "Downloads and uploads": {
      points: [
        "File chooser and download flows are driven and their results asserted.",
        "The download event must be awaited before the click that triggers it resolves.",
        "A downloaded file lives in a temporary path until it is deliberately saved.",
      ],
    },
    "Visual comparisons": {
      points: [
        "Important regions are locked with controlled screenshots and reviewable diffs.",
        "Masking volatile areas is what stops a clock failing every run.",
        "Baselines are platform-specific, so a local image rarely matches CI.",
      ],
    },
    "Trace viewer": {
      points: [
        "Actions, DOM snapshots, network calls and console output are replayed.",
        "The DOM snapshot at each step is what shows the page as the test saw it.",
        "A trace is only available if tracing was enabled for that run.",
      ],
    },
    "Playwright Test configuration": {
      points: [
        "Projects, reporters, timeouts, web servers and devices are set in one file.",
        "The web server entry is what makes the suite start its own application.",
        "Per-project options override the top level, which is easy to overlook.",
      ],
    },
    "test.beforeEach": {
      points: [
        "Per-test state is arranged with the page fixture already created.",
        "It runs inside the test's own context, so nothing leaks to the next test.",
        "Expensive work here is paid once per test rather than once per file.",
      ],
    },
    "test.afterEach": {
      points: [
        "What the test created is undone, and diagnostics attached from its result.",
        "The test result is available here, so evidence can be attached only on failure.",
        "It still runs when the test failed, which is exactly when cleanup matters.",
      ],
    },
    "test.beforeAll and afterAll": {
      points: [
        "Worker-level setup is shared across the tests in a file.",
        "It outlives the per-test contexts, so state created here is shared.",
        "A page created here belongs to no test and appears in no trace.",
      ],
    },
    "Hook scope in describe blocks": {
      points: [
        "A hook inside describe applies only to that group, in declaration order.",
        "Scoping is what lets one file hold groups with different setup.",
        "An outer hook still runs first, so the two compose rather than replace.",
      ],
    },
    "Automatic fixtures over hooks": {
      points: [
        "An auto fixture carries its own teardown alongside its setup.",
        "Setup travelling with the thing it provides is what stops cleanup drifting apart.",
        "It applies without being requested, which is the cost of the convenience.",
      ],
    },
    "test.step": {
      points: [
        "A phase of a long test is named so the trace reads as steps.",
        "Named steps turn a wall of actions into a readable narrative.",
        "A failing step names the phase, which shortens the diagnosis.",
      ],
    },
    "globalSetup and globalTeardown": {
      points: [
        "Work runs once per test run, such as seeding a database or starting a service.",
        "It runs outside any worker, so it cannot use test fixtures.",
        "State it creates is shared by every worker, which makes it a contention point.",
      ],
    },
    "Authentication in a setup project": {
      points: [
        "Signing in happens once in a setup project and storage state is reused.",
        "A project dependency is what guarantees it runs before the tests that need it.",
        "A per-test sign-in repeats the slowest part of the suite every time.",
      ],
    },
    "test.use for overrides": {
      points: [
        "Options are changed for a file or a describe block.",
        "Declaring the override keeps it visible rather than buried in a hook.",
        "It applies to the whole scope, not to one test inside it.",
      ],
    },
    "test.fail and test.fixme": {
      points: [
        "Expected failures are marked declaratively rather than branched around.",
        "A marked failure that starts passing is reported, which a skip would hide.",
        "fixme does not run the test at all; fail runs it and expects it to fail.",
      ],
    },
  },
  "Next.js 16+ Hooks — App Router Navigation": {
    "usePathname": {
      points: [
        "The current URL's pathname is returned to a Client Component.",
        "Reading the URL from a Server Component is unsupported, so layout state survives navigation.",
        "The component is downloaded once and re-renders from state rather than being refetched.",
      ],
    },
    "useSearchParams": {
      points: [
        "A read-only `URLSearchParams` over the current query string is returned.",
        "Read-only means an update is a navigation, not a mutation of the object.",
        "On a statically prerendered route it needs a Suspense boundary to avoid opting the route out.",
      ],
    },
    "useParams": {
      points: [
        "Dynamic params filled in by the current URL are returned as an object.",
        "It can be given a type parameter, so the returned record is typed rather than cast.",
        "A catch-all segment yields an array where a single dynamic segment yields a string.",
      ],
    },
    "URL hooks and Suspense": {
      points: [
        "useSearchParams is wrapped in Suspense on a statically prerendered route.",
        "Without a boundary the whole route opts out of static rendering.",
        "The boundary confines the dynamic part to the component that actually reads the query.",
      ],
    },
    "useRouter": {
      points: [
        "push, replace, refresh, prefetch, back, forward and bfcacheId are what the hook returns.",
        "The docs recommend `<Link>` unless there is a specific reason to navigate programmatically.",
        "It comes from `next/navigation`; the Pages Router's `next/router` is a different hook.",
      ],
    },
    "router.push": {
      points: [
        "A client-side navigation adds an entry to the browser's history stack.",
        "It takes `scroll` and `transitionTypes`, the latter passed to React's addTransitionType.",
        "The docs warn that an unsanitized URL here is an XSS hole, because `javascript:` URLs execute.",
      ],
    },
    "router.replace": {
      points: [
        "The same navigation happens without adding a history entry.",
        "It is the right call when returning to the previous state would be wrong.",
        "It accepts the same `scroll` and `transitionTypes` options as push.",
      ],
    },
    "router.refresh": {
      points: [
        "The route is re-requested and Server Components re-render.",
        "React state and scroll position survive, because the payload is merged rather than remounted.",
        "It clears the Client Cache only; server-side caching needs revalidatePath or revalidateTag.",
      ],
    },
    "router.prefetch": {
      points: [
        "A route is warmed for a faster client-side transition.",
        "An optional `onInvalidate` callback fires when the prefetched data goes stale.",
        "`<Link>` already prefetches on viewport entry, so this is for navigations without one.",
      ],
    },
    "useLinkStatus": {
      points: [
        "It reports the `pending` state of the `<Link>` it is rendered inside.",
        "It is imported from `next/link`, not from `next/navigation`.",
        "The docs prefer `loading.js` and prefetching, reserving this for dynamic routes without one.",
      ],
    },
    "useSelectedLayoutSegment": {
      points: [
        "The active segment one level below the calling layout is returned.",
        "It returns `null` when there is no segment below, as at the root layout.",
        "For a catch-all route the matched segments come back joined, such as `'a/b/c'`.",
      ],
    },
    "useSelectedLayoutSegments": {
      points: [
        "Every active segment below the calling layout is returned as an array.",
        "It is the hook for breadcrumbs, where one level down is not enough.",
        "Route groups appear in the array even though they contribute no URL segment.",
      ],
    },
    "Segment-aware navigation": {
      points: [
        "Selected segments drive active state instead of comparing full pathnames.",
        "useSelectedLayoutSegment optionally takes a parallelRouteKey to read inside a slot.",
        "Segment-based marking survives route groups, which contribute nothing to the path.",
      ],
    },
    "useReportWebVitals": {
      points: [
        "A callback receives each metric as it is measured.",
        "The metric carries `id`, `name`, `delta`, `value` and `rating`, not just a number.",
        "`id` is unique per page load, which is what lets distributions be built from it.",
      ],
    },
    "useOffline": {
      points: [
        "A boolean reports whether the application is currently offline.",
        "It always returns `false` unless `experimental.useOffline` is enabled in the config.",
        "That flag also turns on automatic retry of blocked navigation, prefetch and Server Action requests.",
      ],
    },
    "useOffline and hydration": {
      points: [
        "`false` means online, rendering on the server, or not yet hydrated.",
        "That shared initial value is what keeps the server and client renders agreeing.",
        "`true` follows a failed network request or the browser's own `offline` event.",
      ],
    },
    "Hooks in Client Components": {
      points: [
        "These hooks require a Client Component and the `use client` directive.",
        "The docs are explicit that a Client Component is not a de-optimization.",
        "Placing the boundary high pulls the whole subtree into the client bundle.",
      ],
    },
    "Hooks and Server Components": {
      points: [
        "A Server Component receives `params` and `searchParams` as props.",
        "Reading the current URL from the server is deliberately unsupported.",
        "That restriction is what allows layout state to persist across navigations.",
      ],
    },
    "Hooks with Server Functions": {
      points: [
        "A Server Function mutates and the router moves the user afterwards.",
        "`redirect` called inside the function removes the need to navigate on the client.",
        "`router.refresh()` is what re-reads server data after a mutation.",
      ],
    },
    "usePathname with rewrites": {
      points: [
        "A rewrite in next.config or the Proxy file can make the pathname mismatch.",
        "The initial value comes from the server and may differ from the browser's pathname.",
        "The docs name this as a hydration mismatch and give an example that mitigates it.",
      ],
    },
    "useSearchParams values": {
      points: [
        "`get` reads one value; repeated keys need `getAll`.",
        "Values arrive already decoded, so decoding again corrupts them.",
        "The object is read-only, so a change means building a new query string.",
      ],
    },
    "useParams with catch-all routes": {
      points: [
        "A catch-all segment returns an array of the matched segments.",
        "An optional catch-all is absent entirely at the bare parent path.",
        "Both shapes must be handled, because the type depends on the matched route.",
      ],
    },
    "useRouter back and forward": {
      points: [
        "`back()` and `forward()` move through the browser's history stack.",
        "Traversing history is safer than guessing a URL to navigate to.",
        "There may be no entry to return to, so a fallback destination is needed.",
      ],
    },
    "useRouter hard navigation safety": {
      points: [
        "The docs state untrusted URLs must not be passed to push or replace.",
        "A `javascript:` URL passed there executes in the context of your page.",
        "Validating against known internal routes is what makes the destination safe.",
      ],
    },
    "useLinkStatus pending UI": {
      points: [
        "A small element inside the `<Link>` reflects the pending state.",
        "The documented case is a shimmer over the clicked link while navigation completes.",
        "It only helps when prefetching is off or the route is dynamic without `loading.js`.",
      ],
    },
    "useSelectedLayoutSegment in tabs": {
      points: [
        "A tab is active when the segment below its layout matches its own.",
        "The segment is the tab's identity, so no path parsing is needed.",
        "At the layout's own URL the hook returns null, which is the no-tab state.",
      ],
    },
    "useSelectedLayoutSegments and route groups": {
      points: [
        "Route-group segments are filtered out when building breadcrumbs.",
        "A group adds no URL segment, so showing it invents a level.",
        "Filtering has to be explicit, because the array still contains them.",
      ],
    },
    "useReportWebVitals analytics": {
      points: [
        "Metric fields are forwarded to an analytics endpoint.",
        "`delta` is what analytics tools expect for cumulative metrics such as CLS.",
        "CLS must be scaled to an integer for tools that reject fractional values.",
      ],
    },
    "useOffline fallback UI": {
      points: [
        "Connectivity-aware UI renders from the boolean, such as a banner or a Suspense fallback.",
        "Requests blocked while offline are retried automatically once the flag is on.",
        "Disabling a submit is what stops a write that would fail anyway.",
      ],
    },
    "Next.js hook migration from Pages Router": {
      points: [
        "`next/router` is replaced by the hooks in `next/navigation`.",
        "`pathname`, `query` and `params` are now three separate hooks rather than one object.",
        "In a project with both directories, usePathname's return type is adjusted automatically.",
      ],
    },
    "Hook composition in layouts": {
      points: [
        "A small Client Component reads the hook and the layout stays a Server Component.",
        "Confining the client boundary is the documented, most performant arrangement.",
        "A hook called in the layout itself makes everything beneath it client-rendered.",
      ],
    },
    "useServerInsertedHTML": {
      points: [
        "A client provider injects collected styles into the server-rendered HTML.",
        "It is how a CSS-in-JS library avoids a flash of unstyled content.",
        "The callback can run more than once, so it must not accumulate state.",
      ],
    },
    "useRouter in event handlers": {
      points: [
        "The hook is called at the top level and the handler calls the returned methods.",
        "Hooks cannot be called conditionally, and a handler is conditional.",
        "The router object is stable, so it is safe to use inside a callback.",
      ],
    },
    "Active links from usePathname": {
      points: [
        "A small client component compares the pathname to mark the current link.",
        "Keeping it small stops the shared layout becoming request-dependent.",
        "Under rewrites the comparison can mismatch, which is the documented hazard.",
      ],
    },
    "Typed useParams": {
      points: [
        "`useParams<{ tag: string; item: string }>()` types the returned record.",
        "Typing at the call site removes a cast that could outlive the route.",
        "Generated route types keep the shape honest when a segment is renamed.",
      ],
    },
    "Search params are read-only": {
      points: [
        "The returned URLSearchParams cannot be mutated.",
        "A change is expressed by building a new query string and navigating.",
        "Mutating the object silently does nothing to the URL.",
      ],
    },
    "Updating the query without a reload": {
      points: [
        "A rebuilt query string is passed to `router.replace`.",
        "replace avoids stacking a history entry for every keystroke.",
        "The `scroll` option prevents the navigation resetting scroll position.",
      ],
    },
    "Segment hooks at the root": {
      points: [
        "At `app/layout.js` on `/`, useSelectedLayoutSegment returns null.",
        "Null is a real state to render, not an error to guard against.",
        "A layout at its own URL also returns null, which tab code must handle.",
      ],
    },
    "useReportWebVitals placement": {
      points: [
        "A dedicated client component near the root mounts it once.",
        "The docs call a separate component the most performant approach.",
        "Mounting it per page multiplies every metric by the number of listeners.",
      ],
    },
    "Pending UI thresholds": {
      points: [
        "The pending indicator is revealed after a short delay.",
        "An indicator that flashes and vanishes reads as a glitch rather than progress.",
        "The docs frame this as subtle, inline feedback rather than a route-level fallback.",
      ],
    },
    "Hooks versus server props": {
      points: [
        "A Server Component awaits `params` and `searchParams` as props.",
        "Both are promises in Next.js 16 and must be awaited.",
        "There is no client hook to reach for, because there is no browser to read.",
      ],
    },
  },
  "Playwright — API, Locators, Fixtures & Tooling": {
    "@playwright/test": {
      points: [
        "The test runner package supplies test, expect, fixtures and the config.",
        "Runner and library ship together, which is why fixtures and assertions align.",
        "Importing expect from elsewhere loses the retrying web-first assertions.",
      ],
    },
    "playwright": {
      points: [
        "The library alone drives browsers without the test runner.",
        "It suits scraping and automation where no test structure is wanted.",
        "Using it for tests means writing fixtures and reporting yourself.",
      ],
    },
    "chromium / firefox / webkit": {
      points: [
        "Three engines are bundled and driven through one API.",
        "WebKit is the closest available proxy for Safari behaviour.",
        "One API does not mean identical behaviour across the three.",
      ],
    },
    "browserType.launch": {
      points: [
        "A browser process starts with options such as headless and slowMo.",
        "Launching is expensive, which is why contexts exist to reuse it.",
        "A launched browser must be closed or the process survives the run.",
      ],
    },
    "browserType.connect": {
      points: [
        "A remote browser is driven over a websocket.",
        "Connecting is how a browser grid or container is shared.",
        "Latency per action rises, which changes how a suite feels.",
      ],
    },
    "browser.newContext": {
      points: [
        "An isolated profile is created with its own cookies and storage.",
        "Isolation per context is what makes parallel tests independent.",
        "A context is cheap; a browser launch is not.",
      ],
    },
    "browser.newPage": {
      points: [
        "A page is opened, creating a context implicitly if needed.",
        "The implicit context is why state can leak when it is reused.",
        "Creating the context explicitly is what gives control over isolation.",
      ],
    },
    "BrowserContext": {
      points: [
        "Cookies, storage, permissions and geolocation are scoped here.",
        "Storage state is loaded and saved at this level, not per page.",
        "Closing it closes every page it owns.",
      ],
    },
    "Page": {
      points: [
        "A single tab is navigated, queried and acted upon.",
        "Most of the API hangs off the page, which is the usual entry point.",
        "A page belongs to a context, so its state is the context's state.",
      ],
    },
    "Frame / FrameLocator": {
      points: [
        "`frameLocator` targets elements inside an iframe and waits for the frame to appear.",
        "It is strict by default and works with web-first assertions.",
        "An ordinary locator cannot cross a frame boundary at all.",
      ],
    },
    "Worker": {
      points: [
        "Web workers and service workers are observed and interacted with.",
        "A service worker can serve requests that route interception must account for.",
        "Workers outlive the page that registered them.",
      ],
    },
    "page.goto": {
      points: [
        "A URL is loaded and the navigation awaited.",
        "The wait condition decides what counts as loaded.",
        "Waiting for full load is slower and often less reliable than waiting for content.",
      ],
    },
    "page.evaluate": {
      points: [
        "JavaScript runs in the page and returns a serialisable value.",
        "Only serialisable data crosses the boundary, so a DOM node cannot come back.",
        "It performs no waiting, so the element must already exist.",
      ],
    },
    "page.exposeFunction": {
      points: [
        "A Node function is callable from inside the page.",
        "It is how page code reports back into the test process.",
        "It stays bound for the page's lifetime, including after navigation.",
      ],
    },
    "page.addInitScript": {
      points: [
        "A script runs before any page script on every navigation.",
        "Running first is what allows a global to be stubbed before use.",
        "It runs on every navigation, so it must be idempotent.",
      ],
    },
    "page.locator": {
      points: [
        "A CSS or XPath selector becomes a lazy, retrying locator.",
        "Laziness is what lets it be declared before the element exists.",
        "A CSS selector breaks on restyling that changed nothing a user sees.",
      ],
    },
    "getByRole": {
      points: [
        "Elements are found by accessible role and name.",
        "It is the closest match to how assistive technology sees the page.",
        "If it cannot find the element, the accessibility tree is probably wrong.",
      ],
    },
    "getByText": {
      points: [
        "An element is matched by its visible text.",
        "Matching visible text keeps the test aligned with what users read.",
        "It matches substrings by default, which can catch more than intended.",
      ],
    },
    "getByLabel": {
      points: [
        "A form control is found through its associated label.",
        "Going through the label is what proves the control is actually labelled.",
        "An unlabelled input is invisible to this locator, which is the point.",
      ],
    },
    "getByPlaceholder": {
      points: [
        "An input is matched by its placeholder text.",
        "It is a fallback where a real label is absent.",
        "Placeholder is not a label, so relying on it hides an accessibility gap.",
      ],
    },
    "getByAltText": {
      points: [
        "An image is found by its alternative text.",
        "It asserts the image has alt text as a side effect of locating it.",
        "Decorative images have empty alt and cannot be found this way.",
      ],
    },
    "getByTitle": {
      points: [
        "An element is matched by its title attribute.",
        "It is useful for icons that carry no visible text.",
        "Title text is not reliably surfaced to users, so it is a weak anchor.",
      ],
    },
    "getByTestId": {
      points: [
        "An element is found by a dedicated test attribute.",
        "A test id is the most stable anchor because nothing else uses it.",
        "It says nothing about whether the element is usable or accessible.",
      ],
    },
    "locator.filter": {
      points: [
        "A locator is narrowed by text or by a locator it must contain.",
        "Filtering by content identifies a row without depending on its position.",
        "It is the documented answer to a strict mode violation on a list.",
      ],
    },
    "locator.and / locator.or": {
      points: [
        "Two locators combine by intersection or alternative.",
        "or is what handles a control whose markup differs between states.",
        "or resolving to two different elements still violates strict mode.",
      ],
    },
    "locator.nth / first / last": {
      points: [
        "One element is selected from several matches by position.",
        "Position is a last resort when nothing distinguishes them by content.",
        "An index reorders the moment the list does.",
      ],
    },
    "Strict mode": {
      points: [
        "A locator resolving to more than one element throws a strict mode violation.",
        "The error lists the matching elements, so the fix is visible in the message.",
        "Frame locators are strict by default too.",
      ],
    },
    "Chaining": {
      points: [
        "Locators compose to scope a search within another element.",
        "Scoping is what makes a locator unique without a brittle selector.",
        "Each link is resolved at use time, not when it was written.",
      ],
    },
    "Auto-waiting": {
      points: [
        "Actions wait for the actionability checks: visible, stable, enabled, editable and receiving events.",
        "The docs state there are no artificial timeouts — waiting replaces them.",
        "`dispatchEvent` performs no actionability checks at all, which is why it bypasses this.",
      ],
    },
    "click / dblclick": {
      points: [
        "A click is dispatched after the element becomes actionable.",
        "It waits for the element to stop moving, which manual clicks do not.",
        "Forcing a click skips those checks and hides a real problem.",
      ],
    },
    "fill": {
      points: [
        "An input's value is set and the input event dispatched.",
        "It clears first, so it replaces rather than appends.",
        "It does not produce per-key events, which some inputs rely on.",
      ],
    },
    "pressSequentially": {
      points: [
        "Text is typed one key at a time with real key events.",
        "Per-key events are what trigger autocomplete and masking logic.",
        "It is far slower than fill, so it is reserved for that need.",
      ],
    },
    "press": {
      points: [
        "A single key or chord is sent to the focused element.",
        "It is how Enter, Escape and shortcuts are exercised.",
        "The element must be focused, which press does not do by itself.",
      ],
    },
    "check / uncheck": {
      points: [
        "The control is set to a known state rather than toggled.",
        "The action performs the actionability checks and then verifies the resulting state.",
        "Clicking instead depends on whatever the state was beforehand.",
      ],
    },
    "selectOption": {
      points: [
        "An option is chosen in a native select by value, label or index.",
        "It targets the native element, not a custom dropdown.",
        "A styled dropdown needs ordinary clicks instead.",
      ],
    },
    "setInputFiles": {
      points: [
        "Files are attached to a file input without a system dialog.",
        "Bypassing the dialog is what makes uploads testable.",
        "A custom uploader that hides the input needs the file chooser event.",
      ],
    },
    "hover": {
      points: [
        "The pointer is moved over an element.",
        "Hover is what reveals menus and tooltips that only appear on it.",
        "Hover state is lost as soon as another action moves the pointer.",
      ],
    },
    "dragTo": {
      points: [
        "One element is dragged onto another.",
        "It issues the pointer sequence a drag implementation expects.",
        "HTML5 drag and drop often needs manual events instead.",
      ],
    },
    "focus / blur": {
      points: [
        "Focus is moved to or away from an element.",
        "Blur is what triggers validation that runs on leaving a field.",
        "Focusing directly skips the tab order a keyboard user would follow.",
      ],
    },
    "scrollIntoViewIfNeeded": {
      points: [
        "An element is scrolled into the viewport.",
        "Actions scroll automatically, so this is for assertions and screenshots.",
        "Virtualised lists may not render the element until it is scrolled.",
      ],
    },
    "page.keyboard / page.mouse": {
      points: [
        "Low-level input is dispatched without a target element.",
        "It is how a drag, a chord or a canvas interaction is composed.",
        "There is no auto-waiting, so readiness must be established first.",
      ],
    },
    "expect(locator).toBeVisible": {
      points: [
        "The assertion retries until it passes or the assertion timeout is reached.",
        "Retrying assertions are async, so the docs require them to be awaited.",
        "On timeout the error reports the last observed value, not just a failure.",
      ],
    },
    "toHaveText / toContainText": {
      points: [
        "`toHaveText` matches the whole text; `toContainText` matches a substring.",
        "Both retry, so they wait for content to finish rendering.",
        "Against several elements they compare an array rather than a concatenation.",
      ],
    },
    "toHaveValue": {
      points: [
        "An input's current value is asserted.",
        "Value is not text content, so the text assertions do not apply.",
        "It reads the live value, not the value attribute.",
      ],
    },
    "toBeEnabled / toBeDisabled": {
      points: [
        "An element's interactive state is asserted.",
        "Disabled state is what a submit button test usually hinges on.",
        "An element styled to look disabled is still enabled.",
      ],
    },
    "toBeChecked": {
      points: [
        "A checkbox or radio state is asserted.",
        "It reads the control's real state rather than a class.",
        "Indeterminate is a third state neither checked nor unchecked.",
      ],
    },
    "toHaveAttribute / toHaveClass": {
      points: [
        "`toHaveClass` matches the full class property; `toContainClass` checks for specific classes.",
        "`toHaveAttribute` asserts a DOM attribute value.",
        "Class assertions couple the test to styling detail rather than behaviour.",
      ],
    },
    "toHaveCount": {
      points: [
        "The exact number of matching elements is asserted, with retries.",
        "Retrying is what lets it wait for a list to finish rendering.",
        "Zero is a valid count, which is how absence of a list is asserted.",
      ],
    },
    "expect(page).toHaveURL": {
      points: [
        "The page's URL is asserted, with retries for navigation.",
        "Retrying is what handles a redirect that has not settled.",
        "It compares the full URL unless a pattern is used.",
      ],
    },
    "expect(page).toHaveTitle": {
      points: [
        "The document title is asserted.",
        "Titles often update after data loads, so retrying matters.",
        "It reads the live title, not the server-rendered one.",
      ],
    },
    "toHaveScreenshot": {
      points: [
        "The rendered appearance is compared against a stored baseline.",
        "Masking volatile regions is what stops a clock failing every run.",
        "Baselines are platform-specific, so local images rarely match CI.",
      ],
    },
    "expect.poll": {
      points: [
        "An arbitrary function is polled until it returns the expected value.",
        "It brings retrying to values the web-first assertions do not cover.",
        "The polled function runs repeatedly, so it must have no side effects.",
      ],
    },
    "expect.soft": {
      points: [
        "A failed assertion records but does not stop the test.",
        "Several failures can be reported from one run.",
        "The test still fails, so a soft assertion is not an ignored one.",
      ],
    },
    "expect.configure": {
      points: [
        "A reusable expect is created with its own timeout or softness.",
        "Configuring once avoids repeating options at every call.",
        "It returns a new expect rather than changing the global one.",
      ],
    },
    "test.use": {
      points: [
        "Options are overridden for a file or a describe block.",
        "Declaring the override keeps it visible rather than buried in a hook.",
        "It applies to the whole scope, not to a single test.",
      ],
    },
    "test.extend": {
      points: [
        "`base.extend` adds test-scoped and worker-scoped fixtures.",
        "The value before `use()` is setup and everything after it is teardown.",
        "A fixture no test requests is never created, so unused cost is zero.",
      ],
    },
    "Worker fixtures": {
      points: [
        "`{ scope: 'worker' }` creates the fixture once per worker process.",
        "Teardown runs when the worker shuts down rather than after each test.",
        "Every test in that worker shares it, so it must not hold per-test state.",
      ],
    },
    "Automatic fixtures": {
      points: [
        "`{ auto: true }` applies a fixture without any test requesting it.",
        "It is how a policy is enforced across an entire suite.",
        "It then runs for every test, including those that gain nothing from it.",
      ],
    },
    "test.beforeEach / afterEach": {
      points: [
        "Setup and teardown run around each test.",
        "They run inside the test's own context, so nothing leaks onward.",
        "Work here is paid once per test, not once per file.",
      ],
    },
    "test.beforeAll / afterAll": {
      points: [
        "Setup and teardown run once per worker for a file.",
        "It suits a cost that genuinely can be shared.",
        "State created here outlives the per-test contexts inside it.",
      ],
    },
    "test.step": {
      points: [
        "A named phase groups actions in the report and the trace.",
        "Steps turn a long test into a readable narrative.",
        "A failing step names the phase, which shortens diagnosis.",
      ],
    },
    "Setup projects": {
      points: [
        "A project declared as a dependency runs before the projects that need it.",
        "It is the documented way to authenticate once for the whole run.",
        "Its failure stops dependent projects rather than letting them run unauthenticated.",
      ],
    },
    "globalSetup / globalTeardown": {
      points: [
        "Code runs once for the entire test run.",
        "It suits seeding a database or starting an external service.",
        "It runs outside any worker, so test fixtures are unavailable.",
      ],
    },
    "storageState": {
      points: [
        "Cookies and origin storage are saved to a file and reused by later contexts.",
        "`test.use({ storageState: { cookies: [], origins: [] } })` resets it for a signed-out test.",
        "The official per-worker pattern keys the file by `test.info().parallelIndex`.",
      ],
    },
    "page.route": {
      points: [
        "Matching requests are intercepted before they leave the browser.",
        "Interception is what makes loading and failure states deterministic.",
        "A route registered after navigation misses requests already sent.",
      ],
    },
    "route.fulfill": {
      points: [
        "A response is supplied without contacting the server.",
        "It is how an error or an empty state is produced on demand.",
        "A fabricated shape that the real API never returns tests nothing.",
      ],
    },
    "route.abort": {
      points: [
        "A request is failed with a chosen error.",
        "Aborting is how offline and blocked-resource behaviour is tested.",
        "Aborting a required asset can break the page rather than the feature.",
      ],
    },
    "route.fetch / continue": {
      points: [
        "A request is forwarded, optionally modified, and its response used.",
        "It allows a real response to be inspected or patched.",
        "Continuing with altered headers can break server-side validation.",
      ],
    },
    "page.routeFromHAR": {
      points: [
        "Recorded traffic replays as the network layer.",
        "A HAR is a realistic fixture captured from a real session.",
        "It goes stale as the API changes, silently testing an old contract.",
      ],
    },
    "waitForResponse / waitForRequest": {
      points: [
        "Execution waits for a specific network event.",
        "Waiting on the event ties the test to the cause rather than the clock.",
        "The wait must be set up before the action that triggers it.",
      ],
    },
    "request fixture": {
      points: [
        "HTTP calls are made outside the browser from the test.",
        "It is how state is arranged without driving the interface.",
        "It does not share the browser's cookies unless configured to.",
      ],
    },
    "APIRequestContext": {
      points: [
        "A reusable API client carries its own base URL and headers.",
        "It is the right tool for API-only tests.",
        "Its storage state is separate from any browser context.",
      ],
    },
    "page.on('console')": {
      points: [
        "Console messages from the page are observed.",
        "Failing on a console error catches problems no assertion looked for.",
        "Third-party scripts produce noise that must be filtered.",
      ],
    },
    "playwright.config.ts": {
      points: [
        "Projects, reporters, timeouts and the web server live in one file.",
        "One file is what makes the run reproducible outside a developer machine.",
        "Per-project options override the top level, which is easy to miss.",
      ],
    },
    "projects": {
      points: [
        "Named configurations run the same tests differently.",
        "Projects are what make browsers, devices and setup declarative.",
        "Dependencies between projects control ordering.",
      ],
    },
    "webServer": {
      points: [
        "The application is started before the suite and stopped after.",
        "It removes the assumption that a server is already running.",
        "Reusing an existing server locally can test a stale build.",
      ],
    },
    "baseURL": {
      points: [
        "Relative paths resolve against a configured origin.",
        "It is what lets the same suite run against any environment.",
        "An absolute URL in a test ignores it entirely.",
      ],
    },
    "testMatch / testIgnore": {
      points: [
        "Which files are collected as tests is controlled.",
        "It separates unit, integration and end-to-end runs in one repository.",
        "An over-broad pattern collects helper files as empty suites.",
      ],
    },
    "fullyParallel": {
      points: [
        "Tests within a file run in parallel as well as across files.",
        "It is the largest single throughput gain available.",
        "Tests sharing mutable data start failing under it.",
      ],
    },
    "workers": {
      points: [
        "The number of parallel worker processes is set.",
        "Matching workers to cores is usually the right starting point.",
        "More workers than the application can serve produces timeouts.",
      ],
    },
    "retries": {
      points: [
        "A failing test is retried a set number of times.",
        "Retries separate transient failures from real ones in the report.",
        "Treating retries as a fix leaves the underlying race in place.",
      ],
    },
    "timeout / expect.timeout": {
      points: [
        "Per-test and per-assertion time limits are configured.",
        "Separate limits let a slow assertion not raise the whole test budget.",
        "Raising the global timeout hides which step is actually slow.",
      ],
    },
    "reporter": {
      points: [
        "Run output is formatted for humans or for CI.",
        "Several reporters can run at once for both audiences.",
        "A reporter that writes files needs its output preserved by CI.",
      ],
    },
    "Blob reports": {
      points: [
        "Shard results are emitted for later merging.",
        "Merging is what produces one report from a sharded run.",
        "Without merging, each shard reports only its own slice.",
      ],
    },
    "trace: 'on-first-retry'": {
      points: [
        "Tracing records only when a test is retried.",
        "It captures evidence exactly when something went wrong.",
        "A test that fails without retries enabled produces no trace.",
      ],
    },
    "Trace Viewer": {
      points: [
        "Actions, snapshots, network and console are replayed from a trace.",
        "The DOM snapshot per step shows the page as the test saw it.",
        "It only exists if tracing was enabled for that run.",
      ],
    },
    "--debug / PWDEBUG": {
      points: [
        "The run pauses with an inspector attached.",
        "Stepping through beats reasoning about a failure from logs.",
        "It disables timeouts, so behaviour differs from a normal run.",
      ],
    },
    "--ui": {
      points: [
        "An interactive mode watches, filters and re-runs tests.",
        "It is the fastest loop while writing tests.",
        "It is a development tool and is not used in CI.",
      ],
    },
    "codegen": {
      points: [
        "Interactions in a browser are recorded as test code.",
        "It is the quickest way to discover the right locators.",
        "Generated code needs assertions and structure added by hand.",
      ],
    },
    "page.pause": {
      points: [
        "Execution stops and hands control to the inspector.",
        "Pausing at a chosen point beats stepping from the beginning.",
        "A pause left in the code hangs the run in CI.",
      ],
    },
    "screenshot / video": {
      points: [
        "Images and recordings are captured during a run.",
        "They are what make a CI-only failure explicable.",
        "Capturing always is expensive, so it is usually on failure.",
      ],
    },
    "--last-failed": {
      points: [
        "Only the tests that failed previously are re-run.",
        "It shortens the loop when fixing a handful of failures.",
        "It depends on the previous run's results being present.",
      ],
    },
    "--repeat-each": {
      points: [
        "Each test runs several times in one invocation.",
        "Repetition is how a suspected flake is confirmed.",
        "A test passing ten times is not proof it cannot fail.",
      ],
    },
    "Component testing": {
      points: [
        "A component mounts in a real browser and is asserted directly.",
        "Real styles and layout apply, unlike a virtual renderer.",
        "It bypasses routing and data loading, which stay untested here.",
      ],
    },
    "Visual comparisons": {
      points: [
        "Rendered output is diffed against approved images.",
        "It catches regressions no functional assertion describes.",
        "Fonts and rendering differ per platform, which produces false diffs.",
      ],
    },
    "Accessibility scanning": {
      points: [
        "Automated accessibility checks run against a page.",
        "It catches a real subset of issues very cheaply.",
        "Most accessibility problems are not machine-detectable.",
      ],
    },
    "Emulation": {
      points: [
        "Viewport, device, locale, timezone and colour scheme are simulated.",
        "Emulation is what tests responsive and localised behaviour.",
        "It emulates the environment, not the device's real performance.",
      ],
    },
    "Permissions": {
      points: [
        "Browser permissions are granted or denied for a context.",
        "Granting up front avoids a dialog the test cannot click.",
        "Permissions are per context, so a new context resets them.",
      ],
    },
    "Clock API": {
      points: [
        "Time is controlled so timers and dates are deterministic.",
        "Controlling time is what makes a timeout testable in milliseconds.",
        "Installing it affects every timer, including the framework's own.",
      ],
    },
    "Sharding": {
      points: [
        "A suite is split across machines by index.",
        "Sharding is how a long suite fits a CI time budget.",
        "Shards divide by count, so slow tests can land unevenly.",
      ],
    },
    "Authentication reuse": {
      points: [
        "Signing in once and reusing the saved state removes the slowest step from every test.",
        "The docs authenticate in a clean context by passing `storageState: undefined`.",
        "Waiting for the final URL matters, because a login can set cookies across redirects.",
      ],
    },
    "Page object model": {
      points: [
        "Locators and actions for a screen are grouped in a class.",
        "It keeps a selector change confined to one file.",
        "Over-abstracting hides what a test actually does.",
      ],
    },
    "Docker image": {
      points: [
        "An official image carries the browsers and their dependencies.",
        "It is what makes local and CI runs match.",
        "The image version must track the library version.",
      ],
    },
    "playwright install": {
      points: [
        "Browser binaries are downloaded separately from the npm package.",
        "Keeping them out of the package is why the install step exists at all.",
        "The `--with-deps` flag also installs the system libraries a CI image lacks.",
      ],
    },
  },
  "Nest.js Packages — Decorators, Providers & Modules": {
    "@nestjs/core": {
      points: [
        "The framework runtime holds the injection container and the request pipeline.",
        "It is what turns decorated classes into a running application.",
        "Everything else is layered on it, so its version anchors the rest.",
      ],
    },
    "@nestjs/common": {
      points: [
        "Decorators, pipes, guards and exceptions that application code uses daily.",
        "Nearly every file imports from here rather than from core.",
        "Its version must match core or decorator metadata disagrees.",
      ],
    },
    "@nestjs/platform-express": {
      points: [
        "Express serves HTTP beneath the framework abstraction.",
        "It is the default, so most middleware examples assume it.",
        "Reaching for the raw request couples code to this platform.",
      ],
    },
    "@nestjs/platform-fastify": {
      points: [
        "Fastify replaces Express as the HTTP layer.",
        "It is faster and stricter, which is the reason to switch.",
        "Express-specific middleware does not carry over.",
      ],
    },
    "@nestjs/config": {
      points: [
        "Environment configuration is loaded, validated and injected.",
        "Validating at boot turns a missing variable into a startup failure.",
        "Reading process.env directly scatters the contract across the codebase.",
      ],
    },
    "@nestjs/swagger": {
      points: [
        "OpenAPI documents are generated from decorators and DTOs.",
        "Generating from code is what stops the document drifting from the routes.",
        "Erased types need explicit decorators to appear at all.",
      ],
    },
    "@nestjs/cli": {
      points: [
        "Projects, modules and providers are scaffolded and built.",
        "Generation enforces the conventions the framework expects.",
        "Generated files still need wiring into the right module.",
      ],
    },
    "@nestjs/mapped-types": {
      points: [
        "New DTOs derive from existing ones by picking or omitting fields.",
        "Deriving keeps validation rules in one place.",
        "A derived type inherits decorators, including ones that no longer apply.",
      ],
    },
    "@nestjs/terminus": {
      points: [
        "Health checks are exposed as a route with pluggable indicators.",
        "A health endpoint is what an orchestrator uses to decide readiness.",
        "A check that touches a dependency makes that dependency part of liveness.",
      ],
    },
    "@nestjs/event-emitter": {
      points: [
        "In-process events decouple a producer from its consumers.",
        "Decoupling keeps unrelated work out of the request path.",
        "Events are lost on restart, unlike a queue.",
      ],
    },
    "@nestjs/schedule": {
      points: [
        "Cron jobs, intervals and timeouts are declared with decorators.",
        "Declaring them keeps scheduling visible beside the code it runs.",
        "Every instance runs the job unless a lock prevents it.",
      ],
    },
    "@nestjs/bullmq": {
      points: [
        "Redis-backed queues run background jobs with retries.",
        "A queue survives restarts, which an in-process event does not.",
        "Redis becomes a hard dependency of the application.",
      ],
    },
    "@nestjs/cache-manager": {
      points: [
        "Responses and values are cached behind a common interface.",
        "One interface is what allows memory and Redis to swap.",
        "A cached response can outlive the permission that allowed it.",
      ],
    },
    "@nestjs/throttler": {
      points: [
        "Request rate limits are applied per route or globally.",
        "Limiting is what blunts brute force and abuse.",
        "An in-memory counter is per instance, not per cluster.",
      ],
    },
    "@Module()": {
      points: [
        "Controllers, providers, imports and exports are declared together.",
        "A provider is injectable only where its module is imported or exported.",
        "The module graph is the real architecture, not the folder layout.",
      ],
    },
    "@Global()": {
      points: [
        "A module's exports become available everywhere without importing.",
        "It removes repetitive imports for genuinely cross-cutting modules.",
        "It also hides dependencies, which is why it is used sparingly.",
      ],
    },
    "Dynamic modules": {
      points: [
        "A module is configured by the code importing it.",
        "Configuration at import is what makes a module reusable.",
        "Registering the same dynamic module twice can duplicate providers.",
      ],
    },
    "ConfigurableModuleBuilder": {
      points: [
        "Boilerplate for sync and async module options is generated.",
        "It produces the register and registerAsync pair consistently.",
        "The generated names are conventional and must be followed.",
      ],
    },
    "forwardRef()": {
      points: [
        "A circular dependency between modules or providers is resolved.",
        "It defers resolution until both sides exist.",
        "A circular dependency is usually a design problem this merely defers.",
      ],
    },
    "ModuleRef": {
      points: [
        "Providers are resolved from the container at runtime.",
        "It is the escape hatch when a dependency is only known then.",
        "Resolving a scoped provider returns a new instance each call.",
      ],
    },
    "Lazy modules": {
      points: [
        "A module loads on first use rather than at boot.",
        "It shortens cold start where a feature is rarely reached.",
        "The first request to that feature pays the load cost.",
      ],
    },
    "@Controller()": {
      points: [
        "A class handles requests under a route prefix.",
        "The prefix is what groups related routes without repeating the path.",
        "Business logic here cannot be reused by a queue consumer.",
      ],
    },
    "@Get / @Post / @Put / @Patch / @Delete": {
      points: [
        "Methods bind to HTTP verbs and sub-paths.",
        "The verb is part of the contract, not decoration.",
        "Route order matters, so a wildcard declared early shadows later routes.",
      ],
    },
    "@All / @Head / @Options": {
      points: [
        "Less common verbs and catch-all handlers are declared.",
        "OPTIONS matters for CORS preflight handling.",
        "@All catches everything, including verbs you meant to reject.",
      ],
    },
    "@Param()": {
      points: [
        "Route parameters are injected into the handler.",
        "Injecting by name keeps the handler independent of the request object.",
        "Every value arrives as a string until a pipe converts it.",
      ],
    },
    "@Query()": {
      points: [
        "Query string values are injected.",
        "A repeated key yields an array, which the DTO must allow for.",
        "Query input is untrusted and needs the same validation as a body.",
      ],
    },
    "@Body()": {
      points: [
        "The parsed request body, or one property of it, is injected.",
        "Binding to a DTO class is what makes validation possible.",
        "Body parsing must be enabled and size-limited.",
      ],
    },
    "@Headers()": {
      points: [
        "Request headers are injected by name or as a whole.",
        "Header names are case-insensitive, which the lookup handles.",
        "Any header a client sends is untrusted input.",
      ],
    },
    "@Req() / @Res()": {
      points: [
        "The underlying platform request and response are injected.",
        "It is the escape hatch for what the framework does not expose.",
        "Using @Res() disables the framework's own response handling.",
      ],
    },
    "@Session()": {
      points: [
        "The session object is injected into the handler.",
        "It requires session middleware to be configured first.",
        "Session state is server-side and must be stored somewhere real.",
      ],
    },
    "@Ip() / @HostParam()": {
      points: [
        "The client address and host sub-domain parameters are injected.",
        "Host parameters are how multi-tenant subdomain routing works.",
        "Behind a proxy the address is the proxy's unless trust is configured.",
      ],
    },
    "@HttpCode()": {
      points: [
        "The success status code for a handler is set.",
        "POST defaults to 201, which is often not what an action returns.",
        "It sets the success code only, not the error codes.",
      ],
    },
    "@Header()": {
      points: [
        "A response header is added declaratively.",
        "Declaring it keeps the header beside the route that needs it.",
        "It applies to the success path, not to thrown exceptions.",
      ],
    },
    "@Redirect()": {
      points: [
        "The handler responds with a redirect.",
        "The target and status can be overridden by the returned value.",
        "A redirect to a user-supplied URL is an open redirect.",
      ],
    },
    "@Render()": {
      points: [
        "A server-side template renders with the returned data.",
        "It requires a view engine to be configured on the application.",
        "It is incompatible with returning JSON from the same handler.",
      ],
    },
    "@Sse()": {
      points: [
        "The handler streams server-sent events from an observable.",
        "It is the simplest push mechanism, needing no extra protocol.",
        "Proxies may buffer the stream unless configured not to.",
      ],
    },
    "RouterModule": {
      points: [
        "Module route prefixes are declared in one hierarchy.",
        "Centralising them is what keeps a large route tree comprehensible.",
        "It duplicates path knowledge that also lives on the controllers.",
      ],
    },
    "Versioning": {
      points: [
        "Multiple API versions are served by URI, header or media type.",
        "Versioning is what lets a breaking change ship without breaking clients.",
        "Every version supported is a version that must be maintained.",
      ],
    },
    "@Injectable()": {
      points: [
        "A class becomes a provider the container can construct.",
        "The decorator is what emits the metadata injection relies on.",
        "A class without it cannot receive constructor dependencies.",
      ],
    },
    "@Inject()": {
      points: [
        "A dependency is injected by token rather than by type.",
        "Tokens are needed for interfaces and values, which have no runtime type.",
        "A mistyped token fails at startup, not at the call site.",
      ],
    },
    "@Optional()": {
      points: [
        "A missing dependency resolves to undefined instead of failing.",
        "It allows a provider to work with or without an optional collaborator.",
        "It turns a wiring mistake into a silent undefined.",
      ],
    },
    "useClass / useValue / useFactory / useExisting": {
      points: [
        "A token is bound to a class, a value, a factory or an alias.",
        "useFactory is what allows a provider built from configuration.",
        "useValue objects are shared, so mutating one affects every consumer.",
      ],
    },
    "Injection scopes": {
      points: [
        "A provider is a singleton, per request, or transient.",
        "Singleton is the default, which is why per-request state leaks.",
        "A request-scoped provider makes everything depending on it request-scoped.",
      ],
    },
    "@INQUIRER": {
      points: [
        "A provider learns which class asked for it.",
        "It is how a logger labels itself with its consumer automatically.",
        "It requires transient scope, so the provider is no longer shared.",
      ],
    },
    "Custom decorators": {
      points: [
        "Parameter and metadata decorators remove repeated plumbing.",
        "A parameter decorator keeps the handler signature honest.",
        "Metadata decorators do nothing until a guard reads them.",
      ],
    },
    "Lifecycle hooks": {
      points: [
        "Modules and providers run code on init and destroy.",
        "onModuleInit is where connections belong, not the constructor.",
        "Shutdown hooks only run if they are explicitly enabled.",
      ],
    },
    "DiscoveryService": {
      points: [
        "Providers and controllers are enumerated at runtime.",
        "It is how a library finds everything carrying its decorator.",
        "Scanning happens once at boot, so late registrations are missed.",
      ],
    },
    "ValidationPipe": {
      points: [
        "`whitelist: true` strips properties that carry no validation decorator.",
        "`forbidNonWhitelisted` turns those extra properties into a rejected request instead.",
        "Without either, unexpected properties reach the handler untouched.",
      ],
    },
    "ParseIntPipe / ParseFloatPipe": {
      points: [
        "A string parameter becomes a number or the request fails.",
        "Failing at the boundary keeps the handler free of parsing.",
        "An empty string and a missing value fail differently.",
      ],
    },
    "ParseBoolPipe": {
      points: [
        "A string becomes a real boolean.",
        "Only recognised spellings convert; anything else is rejected.",
        "Truthiness on the raw string would make the word false true.",
      ],
    },
    "ParseUUIDPipe": {
      points: [
        "A parameter is validated as a UUID of a given version.",
        "Rejecting early stops a malformed id reaching the database.",
        "It validates the shape, not that the record exists.",
      ],
    },
    "ParseEnumPipe": {
      points: [
        "A value is constrained to the members of an enum.",
        "The enum is the allowed set, so the check cannot drift from it.",
        "It compares values, not the enum key names.",
      ],
    },
    "ParseArrayPipe": {
      points: [
        "A delimited value becomes a typed array with each item validated.",
        "It handles the repeated-query-parameter case consistently.",
        "A single value may arrive unwrapped unless the pipe is told to expect an array.",
      ],
    },
    "ParseFilePipe": {
      points: [
        "An uploaded file is validated for size and type.",
        "Validating before writing is what stops a hostile upload landing.",
        "Declared content type is client-supplied and can be wrong.",
      ],
    },
    "DefaultValuePipe": {
      points: [
        "A missing value is replaced with a default before other pipes run.",
        "Ordering matters, because a parse pipe would otherwise fail on undefined.",
        "It only fills undefined, not an empty string.",
      ],
    },
    "class-validator": {
      points: [
        "DTO fields carry validation rules as decorators.",
        "Rules beside the field keep the contract readable.",
        "It needs real classes, because interfaces leave no runtime metadata.",
      ],
    },
    "class-transformer": {
      points: [
        "Plain payloads become class instances and back again.",
        "Instances are what validation and serialization both operate on.",
        "Transformation runs before validation, so a bad cast surfaces as a validation error.",
      ],
    },
    "nestjs-zod": {
      points: [
        "Zod schemas replace decorator-based DTO validation.",
        "One schema gives both the runtime check and the inferred type.",
        "It is a different model from class-validator and mixing them confuses.",
      ],
    },
    "@UseGuards()": {
      points: [
        "Guards run global first, then controller, then route, in binding order.",
        "They run after middleware and before interceptors and pipes.",
        "Returning false yields a generic refusal unless an exception is thrown instead.",
      ],
    },
    "CanActivate": {
      points: [
        "A guard implements a single method returning whether to proceed.",
        "It receives the execution context, so it works beyond HTTP.",
        "Returning false yields a generic refusal unless an exception is thrown.",
      ],
    },
    "@nestjs/passport": {
      points: [
        "Passport strategies integrate as guards and providers.",
        "It brings a large ecosystem of authentication mechanisms.",
        "The strategy's validate return becomes the request user.",
      ],
    },
    "@nestjs/jwt": {
      points: [
        "Tokens are signed and verified through an injectable service.",
        "Configuration lives in one module rather than at each call site.",
        "A token cannot be revoked before expiry, so lifetimes must be short.",
      ],
    },
    "PassportStrategy": {
      points: [
        "A strategy class wraps a Passport strategy with validation.",
        "The class form is what allows dependency injection inside it.",
        "The strategy name is what links a guard to the mechanism.",
      ],
    },
    "Reflector": {
      points: [
        "Metadata set by decorators is read at runtime.",
        "It is how a guard discovers what a route requires.",
        "Reading from the wrong target returns undefined rather than failing.",
      ],
    },
    "@SetMetadata()": {
      points: [
        "Arbitrary metadata is attached to a handler or class.",
        "It is the mechanism a custom guard's rules are declared with.",
        "A raw key is stringly typed, so a wrapper decorator is safer.",
      ],
    },
    "Roles / Permissions pattern": {
      points: [
        "A decorator declares requirements and a guard enforces them.",
        "Separating declaration from enforcement keeps rules beside the route.",
        "The guard must be registered or the decorator does nothing.",
      ],
    },
    "@nestjs/casl": {
      points: [
        "Ability rules express what a subject may do to a resource.",
        "Rules are data, so they can be composed and tested alone.",
        "Defining abilities per request costs on every request.",
      ],
    },
    "@UseInterceptors()": {
      points: [
        "A pre-controller interceptor runs global, then controller, then route.",
        "The post-request pass runs the other way round: route, controller, global.",
        "That wrapping is what lets one interceptor time the whole handler.",
      ],
    },
    "NestInterceptor": {
      points: [
        "Behaviour is added before and after the handler through an observable.",
        "Returning the stream unchanged is what makes it transparent.",
        "Forgetting to return the stream hangs the request.",
      ],
    },
    "ClassSerializerInterceptor": {
      points: [
        "Responses are serialized according to class decorators.",
        "Excluding a field on the entity is safer than omitting it per route.",
        "It only applies to class instances, not to plain objects.",
      ],
    },
    "TimeoutInterceptor": {
      points: [
        "A handler exceeding a duration is aborted.",
        "A bound is what stops one slow dependency exhausting the server.",
        "Aborting the response does not cancel the work already started.",
      ],
    },
    "FileInterceptor / FilesInterceptor": {
      points: [
        "Multipart uploads are parsed into file objects.",
        "Limits are configured here rather than inside the handler.",
        "Without a size limit an upload can exhaust disk or memory.",
      ],
    },
    "@UseFilters()": {
      points: [
        "Exception filters resolve route first, then controller, then global.",
        "They are the last stage before the response is sent.",
        "A filter catches what was thrown, so it cannot alter a successful response.",
      ],
    },
    "ExceptionFilter": {
      points: [
        "Errors are caught and turned into a chosen response shape.",
        "One shape for every error is what clients can actually rely on.",
        "Catching everything can swallow framework errors that should surface.",
      ],
    },
    "HttpException": {
      points: [
        "An HTTP error is thrown with a status and a body.",
        "Throwing is what lets deep code produce a correct response.",
        "A non-HTTP error becomes a 500 unless a filter maps it.",
      ],
    },
    "BaseExceptionFilter": {
      points: [
        "A custom filter extends the built-in behaviour.",
        "Extending keeps the default handling for what it does not cover.",
        "Not delegating upward loses the framework's own error responses.",
      ],
    },
    "NestMiddleware": {
      points: [
        "Middleware is the first stage, running globally bound before module bound.",
        "It runs before guards, so it cannot see a resolved user.",
        "It is the right place only for genuinely transport-level concerns.",
      ],
    },
    "configure(consumer)": {
      points: [
        "Middleware is bound to routes inside a module.",
        "Binding per module is what keeps middleware scoped.",
        "Route matching here is path-based, not decorator-based.",
      ],
    },
    "Functional middleware": {
      points: [
        "A plain function serves as middleware.",
        "It is simpler when no dependency injection is needed.",
        "It cannot receive injected providers.",
      ],
    },
    "Global middleware": {
      points: [
        "Middleware applies to every request from the application instance.",
        "It is registered outside any module, so it cannot inject providers.",
        "It also runs for routes that should never reach it.",
      ],
    },
    "Execution order": {
      points: [
        "Middleware, then guards, then pre-controller interceptors, then pipes, then the handler.",
        "Post-request interceptors and exception filters run in reverse: route, controller, global.",
        "Interceptors run before pipes, so an interceptor cannot see a transformed parameter.",
      ],
    },
    "@nestjs/typeorm": {
      points: [
        "TypeORM entities and repositories integrate with the container.",
        "Repositories are injected rather than constructed.",
        "Synchronize is convenient in development and dangerous in production.",
      ],
    },
    "@nestjs/mongoose": {
      points: [
        "Mongoose schemas and models are provided through modules.",
        "Models are injected by name, which keeps them testable.",
        "Schema changes are not migrations; documents vary in shape.",
      ],
    },
    "@nestjs/sequelize": {
      points: [
        "Sequelize models integrate with the injection container.",
        "Model injection keeps data access out of the constructor.",
        "Its typing is weaker than the alternatives.",
      ],
    },
    "nestjs-prisma": {
      points: [
        "The Prisma client becomes an injectable service.",
        "One client instance is shared rather than created per request.",
        "Its lifecycle must be tied to the module's shutdown hook.",
      ],
    },
    "@Transaction patterns": {
      points: [
        "Dependent writes run atomically inside a transaction.",
        "Every query must use the transaction handle or it runs outside it.",
        "A transaction held across a network call holds locks for that long.",
      ],
    },
    "Repository pattern": {
      points: [
        "Data access sits behind an interface the service depends on.",
        "The interface is what lets a test substitute the store.",
        "An abstraction over one ORM often just renames it.",
      ],
    },
    "@nestjs/microservices": {
      points: [
        "Services communicate over transports other than HTTP.",
        "The same controllers and providers serve message patterns.",
        "Message-based errors do not map onto HTTP status codes.",
      ],
    },
    "ClientProxy": {
      points: [
        "Messages and events are sent to another service.",
        "send expects a reply; emit does not.",
        "The connection must be established before the first send.",
      ],
    },
    "TCP transport": {
      points: [
        "The built-in transport needs no external broker.",
        "It is the simplest way to split a monolith in two.",
        "There is no persistence, so a message to a down service is lost.",
      ],
    },
    "Redis transport": {
      points: [
        "Redis pub/sub carries messages between services.",
        "It is lightweight and usually already present.",
        "Pub/sub does not persist, so a subscriber that is down misses messages.",
      ],
    },
    "NATS transport": {
      points: [
        "NATS carries messages with subject-based routing.",
        "Its request-reply and queue groups map onto the framework's patterns.",
        "Core NATS is at-most-once unless JetStream is used.",
      ],
    },
    "Kafka transport": {
      points: [
        "Kafka carries events as a durable, replayable log.",
        "Replayability is what distinguishes it from a queue.",
        "Consumer groups and offsets are concepts the transport does not hide.",
      ],
    },
    "RabbitMQ transport": {
      points: [
        "AMQP queues carry work with acknowledgements.",
        "Acknowledgement is what makes redelivery possible.",
        "Exchange and routing configuration lives outside the application.",
      ],
    },
    "gRPC transport": {
      points: [
        "Services communicate through protobuf-defined contracts.",
        "The contract is a schema both sides are generated from.",
        "The proto file becomes a build dependency to keep in step.",
      ],
    },
    "Hybrid application": {
      points: [
        "One process serves HTTP and a microservice transport together.",
        "It allows incremental adoption without a second deployment.",
        "Both listeners share a process, so one can starve the other.",
      ],
    },
    "@nestjs/graphql": {
      points: [
        "A GraphQL schema is built code-first or schema-first.",
        "Code-first infers the schema from decorated classes.",
        "Resolvers are providers, so injection works as elsewhere.",
      ],
    },
    "@Resolver / @Query / @Mutation": {
      points: [
        "Root fields are bound to resolver methods.",
        "The resolver class is scoped to the type it resolves.",
        "Mutations run serially at the top level; queries do not.",
      ],
    },
    "@ResolveField()": {
      points: [
        "A field is resolved by its own method.",
        "It is where a relation is fetched lazily.",
        "It is the usual source of the N+1 problem.",
      ],
    },
    "@ObjectType / @InputType / @Field": {
      points: [
        "Schema types are declared from TypeScript classes.",
        "Inputs and outputs are deliberately separate types.",
        "Erased types need explicit field types to appear in the schema.",
      ],
    },
    "@Args() / @Context() / @Parent()": {
      points: [
        "Arguments, request context and the parent object are injected.",
        "Context is where per-request loaders and identity live.",
        "Parent is undefined on a root field, which is easy to forget.",
      ],
    },
    "@nestjs/apollo": {
      points: [
        "Apollo Server drives the GraphQL layer.",
        "Its plugin lifecycle is where cross-cutting concerns attach.",
        "It is the heaviest of the driver options.",
      ],
    },
    "@nestjs/mercurius": {
      points: [
        "Mercurius drives GraphQL on top of Fastify.",
        "It suits an application already committed to Fastify.",
        "It is tied to that platform rather than being neutral.",
      ],
    },
    "@nestjs/websockets": {
      points: [
        "Gateways handle websocket connections with decorators.",
        "The same guards and pipes apply as on HTTP.",
        "Connection state lives per instance, which affects scaling.",
      ],
    },
    "Subscriptions": {
      points: [
        "Clients receive pushed GraphQL updates over a transport.",
        "It is the third operation type alongside query and mutation.",
        "Fan-out across instances needs a shared pub/sub backend.",
      ],
    },
    "@nestjs/testing": {
      points: [
        "A testing module builds the container with substitutes.",
        "It constructs the real graph, which is what makes the test meaningful.",
        "The module must be closed or handles leak between suites.",
      ],
    },
    "overrideProvider()": {
      points: [
        "A provider is replaced with a fake for the test.",
        "Overriding is what isolates the unit under test.",
        "Overriding too much tests the mocks rather than the code.",
      ],
    },
    "createNestApplication()": {
      points: [
        "A full application is bootstrapped for end-to-end tests.",
        "Only this runs pipes, guards, interceptors and filters together.",
        "It is much slower than a unit test, so it is used sparingly.",
      ],
    },
    "Custom decorator testing": {
      points: [
        "A decorator is exercised through a route rather than called directly.",
        "Decorators only have meaning inside the framework's pipeline.",
        "Calling the underlying function directly tests nothing about the binding.",
      ],
    },
    "nest build / nest start": {
      points: [
        "The project compiles and runs through the CLI.",
        "Watch mode is what makes the development loop fast.",
        "The build output layout must match the start script's expectation.",
      ],
    },
    "nest generate": {
      points: [
        "Modules, controllers, services and more are scaffolded.",
        "Generation applies the conventions the framework expects.",
        "It also updates the owning module, which hand-written files do not.",
      ],
    },
  },
  "Node.js Packages — Modules, Libraries & Middleware": {
    "node:fs": {
      points: [
        "Files and directories are read and written, sync, callback or promise.",
        "The promise API is what keeps file work off the callback style.",
        "A synchronous call blocks the event loop for its whole duration.",
      ],
    },
    "node:path": {
      points: [
        "Paths are joined, resolved and parsed per platform.",
        "Separators and drive roots differ, which string concatenation ignores.",
        "resolve produces an absolute path; join merely concatenates segments.",
      ],
    },
    "node:url": {
      points: [
        "URLs are parsed and constructed to the WHATWG standard.",
        "It also converts between file paths and file URLs.",
        "Module metadata gives a URL, not a path, which is a common trip-up.",
      ],
    },
    "node:os": {
      points: [
        "Platform, CPU, memory and network details are reported.",
        "CPU count is the usual basis for sizing a worker pool.",
        "In a container it reports the host, not the container's limits.",
      ],
    },
    "node:util": {
      points: [
        "Promisify, inspect, text encoding and deprecation helpers live here.",
        "promisify adapts a callback API without wrapping it by hand.",
        "inspect is for humans; it is not a serialisation format.",
      ],
    },
    "node:events": {
      points: [
        "The emitter pattern underlies most of the standard library.",
        "Almost every stream and server is an emitter.",
        "An error event with no listener throws rather than being ignored.",
      ],
    },
    "node:stream": {
      points: [
        "Readable, writable, duplex and transform streams process data incrementally.",
        "`pipeline` is preferred over `.pipe()` because it handles errors and cleanup.",
        "After a `.pipe()` error each stream must be closed manually to avoid a leak.",
      ],
    },
    "node:buffer": {
      points: [
        "Raw bytes are represented and converted between encodings.",
        "It is what file, socket and crypto APIs actually exchange.",
        "Slicing shares memory rather than copying it.",
      ],
    },
    "node:process": {
      points: [
        "Arguments, environment, exit and signals are accessed here.",
        "It is the boundary between the program and its operating system.",
        "Mutating the environment at runtime does not reach child processes already started.",
      ],
    },
    "node:console": {
      points: [
        "Formatted output goes to stdout and stderr.",
        "It can be constructed against any stream, not just the defaults.",
        "Writing to a file descriptor can be synchronous and therefore blocking.",
      ],
    },
    "node:timers": {
      points: [
        "Timeouts, intervals and immediates schedule future work.",
        "The promises variant integrates cleanly with async code.",
        "A timer keeps the process alive until it is cleared or unreferenced.",
      ],
    },
    "node:querystring": {
      points: [
        "Legacy query strings are parsed and serialised.",
        "It predates URLSearchParams and behaves differently.",
        "URLSearchParams is the standard replacement for new code.",
      ],
    },
    "node:string_decoder": {
      points: [
        "Byte chunks decode to text without splitting a character.",
        "A multi-byte character can straddle two chunks.",
        "Decoding each chunk independently corrupts exactly those characters.",
      ],
    },
    "node:assert": {
      points: [
        "Invariants are checked and throw when violated.",
        "The strict mode is the one worth using, as it avoids coercion.",
        "It is a debugging aid, not a validation library for user input.",
      ],
    },
    "node:module": {
      points: [
        "The module system is inspected and extended.",
        "It exposes resolution and the ability to create a require.",
        "Hooking it affects the whole process, including dependencies.",
      ],
    },
    "node:v8": {
      points: [
        "Engine statistics, heap snapshots and serialisation are exposed.",
        "A heap snapshot is what a memory leak investigation needs.",
        "Taking one pauses the process and produces a large file.",
      ],
    },
    "node:vm": {
      points: [
        "Code runs in a separate compilation context.",
        "It is useful for evaluating templates and configuration.",
        "It is not a security sandbox, whatever it appears to offer.",
      ],
    },
    "node:async_hooks": {
      points: [
        "Asynchronous resources are tracked across their lifetime.",
        "AsyncLocalStorage is what propagates request context without passing it.",
        "The tracking has a measurable performance cost.",
      ],
    },
    "node:perf_hooks": {
      points: [
        "Timings and performance entries are measured precisely.",
        "Event-loop delay is the measurement that reveals blocking work.",
        "Observers must be disconnected or they accumulate entries.",
      ],
    },
    "node:diagnostics_channel": {
      points: [
        "Named channels publish diagnostic events with near-zero cost when unused.",
        "Publishing costs nothing until something subscribes.",
        "It is a diagnostics mechanism, not an application event bus.",
      ],
    },
    "node:trace_events": {
      points: [
        "Low-level runtime activity is recorded to a trace file.",
        "It shows engine and libuv behaviour no application log can.",
        "The output is large and needs a viewer to be readable.",
      ],
    },
    "node:inspector": {
      points: [
        "The debugging protocol is controlled from within the process.",
        "It is how a profile or heap snapshot is captured programmatically.",
        "Opening it exposes full control of the process.",
      ],
    },
    "node:repl": {
      points: [
        "An interactive evaluation loop is embedded in a program.",
        "It is a quick way to expose a debug console in a service.",
        "Anything reachable from the REPL is reachable by whoever opens it.",
      ],
    },
    "node:readline": {
      points: [
        "Input is consumed line by line from a stream.",
        "It is the basis for prompts and for reading large files by line.",
        "The interface must be closed or the process stays alive.",
      ],
    },
    "node:tty": {
      points: [
        "Terminal characteristics are detected and controlled.",
        "Detecting a terminal is what decides whether colour is appropriate.",
        "Output redirected to a file is not a terminal.",
      ],
    },
    "node:zlib": {
      points: [
        "Data is compressed and decompressed, including as streams.",
        "Streaming compression avoids holding both forms in memory.",
        "Decompressing untrusted input can expand to exhaust memory.",
      ],
    },
    "node:sqlite": {
      points: [
        "An embedded SQL database ships with the runtime.",
        "No dependency and no server is the entire appeal.",
        "It is a single file, so concurrent writers contend.",
      ],
    },
    "node:test": {
      points: [
        "A test runner is built into the runtime.",
        "It removes a dependency for projects with modest needs.",
        "Its ecosystem is far smaller than the established runners.",
      ],
    },
    "stream/promises": {
      points: [
        "`pipeline` awaits a chain of streams and cleans them up on failure.",
        "With `.pipe()`, a Readable error does not close the Writable, which leaks.",
        "Its `end` option defaults to true, and transform streams are always ended.",
      ],
    },
    "stream/web": {
      points: [
        "Web-standard streams interoperate with the Node ones.",
        "Standard streams are what fetch bodies actually are.",
        "The two families need explicit conversion between them.",
      ],
    },
    "Readable.from": {
      points: [
        "An iterable or async iterable becomes a readable stream.",
        "It is the bridge from a generator into the stream world.",
        "The source is consumed lazily, so it must remain valid.",
      ],
    },
    "stream.compose": {
      points: [
        "Several streams combine into a single duplex stream.",
        "Composition is what makes a pipeline reusable as one unit.",
        "Errors surface on the composed stream rather than the parts.",
      ],
    },
    "Backpressure": {
      points: [
        "`write()` returns false once the internal buffer reaches the `highWaterMark`.",
        "Further writes should stop until the `'drain'` event says it is safe to resume.",
        "Ignoring the return value is what makes memory grow without bound.",
      ],
    },
    "Object mode": {
      points: [
        "A stream carries arbitrary objects rather than bytes.",
        "It lets records flow through a transform pipeline.",
        "The high-water mark counts objects, not bytes.",
      ],
    },
    "node:http": {
      points: [
        "HTTP servers and clients are built at the protocol level.",
        "It is the layer every framework here is built upon.",
        "Nothing is handled for you, including body parsing and routing.",
      ],
    },
    "node:https": {
      points: [
        "HTTP over TLS is served and requested.",
        "Certificate and cipher configuration lives here.",
        "Disabling certificate verification silently removes the security.",
      ],
    },
    "node:http2": {
      points: [
        "Multiplexed streams share a single connection.",
        "Multiplexing removes head-of-line blocking between requests.",
        "It requires a different server API than HTTP/1.",
      ],
    },
    "node:net": {
      points: [
        "TCP servers and clients are created directly.",
        "It is the substrate for protocols above TCP.",
        "Message framing is the application's problem, not the socket's.",
      ],
    },
    "node:dgram": {
      points: [
        "UDP datagrams are sent and received.",
        "It suits metrics and discovery where loss is acceptable.",
        "There is no delivery guarantee and no ordering.",
      ],
    },
    "node:dns": {
      points: [
        "Names are resolved through the system or directly.",
        "The resolver choice changes caching and failure behaviour.",
        "The default lookup can block a thread in the pool.",
      ],
    },
    "node:tls": {
      points: [
        "Encrypted sockets are created and configured.",
        "It underlies HTTPS and any other secured protocol.",
        "Certificate chain and hostname checks must both be correct.",
      ],
    },
    "fetch": {
      points: [
        "The standard HTTP client is built into the runtime.",
        "No dependency is needed for ordinary requests.",
        "It does not reject on 404 or 500, so the status must be read.",
      ],
    },
    "WebSocket": {
      points: [
        "A standards-based client is available in the runtime.",
        "It removes a dependency for outbound websocket connections.",
        "Serving websockets still requires a library.",
      ],
    },
    "node:child_process": {
      points: [
        "External programs are spawned and their streams handled.",
        "Passing arguments as an array is what avoids shell injection.",
        "A child whose output is never read blocks when its pipe fills.",
      ],
    },
    "node:worker_threads": {
      points: [
        "JavaScript runs on additional threads with message passing.",
        "It is how CPU-bound work stops blocking the event loop.",
        "Each worker has its own heap, so data is copied or shared explicitly.",
      ],
    },
    "node:cluster": {
      points: [
        "Multiple processes share a listening socket.",
        "It is how a single-threaded runtime uses several cores for I/O.",
        "Nothing is shared between workers except the socket.",
      ],
    },
    "Signals": {
      points: [
        "Operating system signals are observed and handled.",
        "Handling termination is what allows a graceful shutdown.",
        "Some signals cannot be caught, and handling can delay exit indefinitely.",
      ],
    },
    "process.exitCode": {
      points: [
        "The exit status is set without terminating immediately.",
        "Setting it lets pending work finish before the process ends.",
        "Calling exit directly discards buffered output.",
      ],
    },
    "node:crypto": {
      points: [
        "Hashing, signing, encryption and random values are provided.",
        "It is the maintained implementation to prefer over any hand-rolled one.",
        "Choosing the wrong mode or reusing a nonce breaks the guarantee.",
      ],
    },
    "crypto.webcrypto": {
      points: [
        "The standard Web Crypto interface is available.",
        "Standard code then runs in both browser and server.",
        "Its API is promise-based and differs from the Node one.",
      ],
    },
    "timingSafeEqual": {
      points: [
        "Two buffers are compared in constant time.",
        "Constant time is what prevents a timing side channel.",
        "It throws when lengths differ, which itself can leak.",
      ],
    },
    "scrypt / argon2": {
      points: [
        "Passwords are hashed with a deliberately slow function.",
        "Slowness is the defence; a fast hash is the vulnerability.",
        "Parameters must be tuned to the hardware and stored with the hash.",
      ],
    },
    "node:permission": {
      points: [
        "The process restricts its own filesystem and child-process access.",
        "It limits the blast radius of a compromised dependency.",
        "It is coarse and cannot replace running with least privilege.",
      ],
    },
    "express": {
      points: [
        "The long-established minimal web framework.",
        "Its middleware ecosystem is the largest available.",
        "Async errors are not caught automatically without care.",
      ],
    },
    "fastify": {
      points: [
        "A performance-focused framework with schema-based validation.",
        "Schemas drive validation and serialisation together.",
        "Its plugin encapsulation model differs from Express middleware.",
      ],
    },
    "koa": {
      points: [
        "A small framework built on async middleware.",
        "Its context object and downstream-upstream flow are the distinguishing idea.",
        "Almost everything is a separate package.",
      ],
    },
    "hono": {
      points: [
        "A tiny framework built on web standards.",
        "Standards-first is what lets it run on many runtimes.",
        "Node-specific middleware does not apply.",
      ],
    },
    "@nestjs/core": {
      points: [
        "An opinionated framework with dependency injection and modules.",
        "Structure is imposed, which is what suits larger teams.",
        "It sits on Express or Fastify rather than replacing them.",
      ],
    },
    "h3": {
      points: [
        "A minimal, composable HTTP framework.",
        "It is the server layer beneath Nitro and Nuxt.",
        "It is deliberately low level and assembles from utilities.",
      ],
    },
    "elysia": {
      points: [
        "An ergonomic, type-driven framework aimed at Bun.",
        "End-to-end type inference is its main draw.",
        "Its performance claims assume the Bun runtime.",
      ],
    },
    "restify": {
      points: [
        "A framework aimed specifically at REST APIs.",
        "It leans toward operability with built-in throttling and metrics.",
        "Its ecosystem is much smaller than Express's.",
      ],
    },
    "polka": {
      points: [
        "A tiny Express-compatible router.",
        "Compatibility means most Express middleware still works.",
        "It provides routing and little else.",
      ],
    },
    "cors": {
      points: [
        "Cross-origin request headers are configured.",
        "Browsers enforce it, so it is not a server-side access control.",
        "A wildcard origin with credentials is rejected by browsers.",
      ],
    },
    "helmet": {
      points: [
        "Security-related response headers are set.",
        "Sensible defaults are applied without per-header work.",
        "A content security policy still has to be written deliberately.",
      ],
    },
    "body-parser": {
      points: [
        "Request bodies are parsed into objects.",
        "Its functionality is now built into Express itself.",
        "Without a size limit a large body is a denial of service.",
      ],
    },
    "cookie-parser": {
      points: [
        "Cookies are parsed and signed cookies verified.",
        "Signing is what detects a tampered cookie.",
        "Signing is not encryption; the value is still readable.",
      ],
    },
    "express-session": {
      points: [
        "Server-side sessions are kept with a cookie identifier.",
        "The store is what makes sessions survive a restart.",
        "The default memory store is unsuitable for production.",
      ],
    },
    "morgan": {
      points: [
        "HTTP requests are logged in configurable formats.",
        "It is the quickest way to get request visibility.",
        "Its text output is awkward to query compared with structured logs.",
      ],
    },
    "compression": {
      points: [
        "Responses are compressed before being sent.",
        "It reduces transfer size at some CPU cost.",
        "Compressing an already compressed asset wastes both.",
      ],
    },
    "express-rate-limit": {
      points: [
        "Requests per client are limited over a window.",
        "Limiting is what blunts brute force and scraping.",
        "The default memory store is per instance, not per cluster.",
      ],
    },
    "multer": {
      points: [
        "Multipart file uploads are parsed.",
        "Limits and destination are configured rather than assumed.",
        "Writing to disk without validation accepts whatever is sent.",
      ],
    },
    "passport": {
      points: [
        "Authentication strategies plug into a common interface.",
        "One interface covers hundreds of providers.",
        "Strategy quality and maintenance vary widely.",
      ],
    },
    "csurf / csrf-csrf": {
      points: [
        "Cross-site request forgery tokens are issued and verified.",
        "A token is what proves the request came from your own page.",
        "csurf is deprecated, which is why the alternative exists.",
      ],
    },
    "serve-static": {
      points: [
        "Files are served from a directory.",
        "Caching headers are configured here rather than per file.",
        "Serving a directory that contains secrets exposes them.",
      ],
    },
    "http-proxy-middleware": {
      points: [
        "Requests are proxied to another service.",
        "It is the usual way to avoid CORS during development.",
        "An unrestricted proxy can be used to reach internal hosts.",
      ],
    },
    "express-validator": {
      points: [
        "Request fields are validated with chained rules.",
        "Validation sits as middleware before the handler.",
        "Results must be checked explicitly or the rules do nothing.",
      ],
    },
    "connect-timeout": {
      points: [
        "A request exceeding a duration is failed.",
        "A bound is what stops one slow request holding a connection.",
        "The handler still runs unless it checks the timeout itself.",
      ],
    },
    "prisma": {
      points: [
        "A schema generates a typed client for relational data.",
        "The client is generated, so it cannot drift from the schema.",
        "It sits between you and SQL, which sometimes matters.",
      ],
    },
    "drizzle-orm": {
      points: [
        "A SQL-first builder infers types from a TypeScript schema.",
        "The query resembles the SQL that will run.",
        "The relational and core query APIs return different shapes.",
      ],
    },
    "typeorm": {
      points: [
        "Entities are decorated classes with repositories and migrations.",
        "It supports both active record and data mapper styles.",
        "Its behaviour across dialects is less uniform than it appears.",
      ],
    },
    "sequelize": {
      points: [
        "A long-established ORM with models and associations.",
        "Maturity means most problems have a documented answer.",
        "Its TypeScript support is weaker than newer alternatives.",
      ],
    },
    "knex": {
      points: [
        "A query builder without an object mapping layer.",
        "It generates SQL while leaving the data model to you.",
        "Results are untyped unless types are declared separately.",
      ],
    },
    "mongoose": {
      points: [
        "Schemas, models and validation sit over MongoDB.",
        "A schema imposes structure the database does not enforce.",
        "Documents written outside it can violate the schema.",
      ],
    },
    "pg": {
      points: [
        "The PostgreSQL driver with pooling and typed results.",
        "Most higher-level tools are built on it.",
        "Pool size multiplied by instances is what the server sees.",
      ],
    },
    "mysql2": {
      points: [
        "A MySQL driver with promises and prepared statements.",
        "Prepared statements bind parameters rather than interpolating.",
        "Its type conversion differs subtly from the older driver.",
      ],
    },
    "better-sqlite3": {
      points: [
        "A synchronous SQLite binding.",
        "Synchronous access is genuinely faster for an embedded database.",
        "Every call blocks the event loop, so long queries hurt.",
      ],
    },
    "ioredis": {
      points: [
        "A Redis client with cluster and sentinel support.",
        "It handles reconnection and failover for you.",
        "Commands queued while disconnected can pile up unbounded.",
      ],
    },
    "kysely": {
      points: [
        "A type-safe SQL query builder.",
        "Types are inferred from a declared database interface.",
        "The interface must be kept in step with the real schema.",
      ],
    },
    "zod": {
      points: [
        "Runtime schemas infer TypeScript types.",
        "One declaration gives both the check and the type.",
        "Parsing has a cost on very hot paths.",
      ],
    },
    "dotenv": {
      points: [
        "Variables load from a file into the environment.",
        "It is a development convenience, not a secret store.",
        "A committed env file is a leaked credential.",
      ],
    },
    "pino": {
      points: [
        "Structured JSON logging with very low overhead.",
        "Structured output is what makes logs queryable.",
        "Pretty printing is for development and costs significantly.",
      ],
    },
    "winston": {
      points: [
        "Logging with configurable transports and formats.",
        "Multiple destinations are its main strength.",
        "It is heavier than the performance-focused alternatives.",
      ],
    },
    "undici": {
      points: [
        "The HTTP client that backs the runtime's fetch.",
        "Using it directly exposes pooling and connection control.",
        "Its lower-level API is easy to misuse.",
      ],
    },
    "axios": {
      points: [
        "A widely used HTTP client with interceptors.",
        "Interceptors are what centralise auth and retry logic.",
        "It is a dependency for what fetch now does natively.",
      ],
    },
    "got": {
      points: [
        "An HTTP client with retries and hooks built in.",
        "Retry and timeout behaviour is configured declaratively.",
        "It is Node-only, unlike the standard client.",
      ],
    },
    "commander": {
      points: [
        "Command-line interfaces are declared with options and subcommands.",
        "Declaring the interface generates the help text.",
        "Complex nesting becomes hard to follow.",
      ],
    },
    "yargs": {
      points: [
        "Command-line parsing with validation and completion.",
        "It handles rich argument shapes and coercion.",
        "Its fluent API is large and easy to misapply.",
      ],
    },
    "chalk": {
      points: [
        "Terminal output is coloured and styled.",
        "It detects colour support rather than assuming it.",
        "Colour codes in redirected output become noise.",
      ],
    },
    "ora": {
      points: [
        "A terminal spinner shows progress for long work.",
        "It gives feedback where output would otherwise stall.",
        "It assumes a terminal and misbehaves in CI logs.",
      ],
    },
    "inquirer": {
      points: [
        "Interactive prompts collect input on the command line.",
        "It covers lists, confirmations and validated input.",
        "A prompt in a non-interactive environment hangs.",
      ],
    },
    "date-fns": {
      points: [
        "Immutable date utilities are imported individually.",
        "Per-function imports are what keep the bundle small.",
        "Time zone support requires a separate package.",
      ],
    },
    "luxon": {
      points: [
        "Dates and times with first-class time zone support.",
        "Zone handling is what it exists to get right.",
        "Its objects are not interchangeable with native dates.",
      ],
    },
    "uuid": {
      points: [
        "Standard universally unique identifiers are generated.",
        "Version 4 is random; version 7 is time-ordered.",
        "Random identifiers index poorly as a primary key.",
      ],
    },
    "nanoid": {
      points: [
        "Short, URL-safe random identifiers are generated.",
        "Shorter output suits identifiers that appear in URLs.",
        "A shorter length raises collision probability.",
      ],
    },
    "lodash-es": {
      points: [
        "Utility functions ship as ES modules.",
        "Module format is what allows unused functions to be dropped.",
        "Much of it is now native JavaScript.",
      ],
    },
    "bullmq": {
      points: [
        "Redis-backed job queues with retries and scheduling.",
        "Durability is what separates it from an in-process emitter.",
        "Redis becomes a hard dependency and a failure point.",
      ],
    },
    "node-cron": {
      points: [
        "Scheduled tasks run inside the process.",
        "It needs no external scheduler for simple cases.",
        "Every instance runs the job unless a lock prevents it.",
      ],
    },
    "nodemailer": {
      points: [
        "Email is sent through SMTP or a provider.",
        "It is the standard way to send mail from Node.",
        "Deliverability depends on domain configuration, not the library.",
      ],
    },
    "ws": {
      points: [
        "A minimal, fast websocket server and client.",
        "It is the implementation most other libraries build on.",
        "Broadcast, rooms and reconnection are yours to write.",
      ],
    },
    "socket.io": {
      points: [
        "Real-time messaging with rooms, fallback and reconnection.",
        "Reconnection and rooms are what it adds over raw websockets.",
        "It is a protocol of its own, so both ends must use it.",
      ],
    },
    "jsonwebtoken / jose": {
      points: [
        "Tokens are signed and verified.",
        "jose is standards-complete and covers modern algorithms.",
        "Verifying without pinning the algorithm is a known vulnerability.",
      ],
    },
    "sharp": {
      points: [
        "Images are resized and converted at high speed.",
        "It uses a native library, which is the source of the speed.",
        "Native binaries complicate cross-platform deployment.",
      ],
    },
    "archiver": {
      points: [
        "Archives are created as a stream.",
        "Streaming is what allows an archive larger than memory.",
        "The output stream must be finalised or the file is truncated.",
      ],
    },
    "tsx": {
      points: [
        "TypeScript runs directly without a build step.",
        "It makes scripts and development runs immediate.",
        "It transpiles without type checking, so errors still pass.",
      ],
    },
    "pm2": {
      points: [
        "Processes are supervised, clustered and restarted.",
        "It supplies supervision where no orchestrator exists.",
        "Under a container orchestrator it duplicates responsibility.",
      ],
    },
    "nodemon": {
      points: [
        "The process restarts when files change.",
        "It is the simplest development watch loop.",
        "A full restart is slower than an in-process reload.",
      ],
    },
    "@opentelemetry/sdk-node": {
      points: [
        "Traces and metrics are emitted in a vendor-neutral format.",
        "Neutrality is what avoids re-instrumenting per vendor.",
        "Automatic instrumentation adds measurable overhead.",
      ],
    },
    "clinic": {
      points: [
        "Performance problems are diagnosed with guided profiling.",
        "It identifies whether the bottleneck is CPU, I/O or the loop.",
        "It is a diagnostic tool, not something to run in production.",
      ],
    },
    "autocannon": {
      points: [
        "HTTP load is generated for benchmarking.",
        "Measuring under load is what reveals a saturation point.",
        "Benchmarking against a local machine measures the client too.",
      ],
    },
    "supertest": {
      points: [
        "HTTP assertions run against an application instance.",
        "No port needs binding, which keeps tests isolated.",
        "It exercises the app, not the deployment around it.",
      ],
    },
    "nock": {
      points: [
        "Outbound HTTP is intercepted and mocked.",
        "Mocking at the HTTP layer keeps the client code real.",
        "An unmatched request fails in a way that can be confusing.",
      ],
    },
    "msw": {
      points: [
        "Requests are intercepted with handlers shared across environments.",
        "One set of handlers serves both browser and Node tests.",
        "Handlers must be kept in step with the real API.",
      ],
    },
  },
  "Python Packages — Standard Library & Ecosystem": {
    "re": {
      points: [
        "Regular expressions search, split and substitute text.",
        "Compiling once pays off when a pattern is reused.",
        "Catastrophic backtracking can hang on a crafted input.",
      ],
    },
    "string": {
      points: [
        "Constants and a template class support simple substitution.",
        "Template substitution is safer than format for untrusted patterns.",
        "It is far less capable than f-strings for ordinary formatting.",
      ],
    },
    "textwrap": {
      points: [
        "Text is wrapped, filled, indented and dedented.",
        "dedent is what makes a triple-quoted block readable in code.",
        "It counts characters, not display width, so wide glyphs misalign.",
      ],
    },
    "difflib": {
      points: [
        "Sequences are compared and human-readable diffs produced.",
        "Close-match lookup is a cheap spelling suggestion.",
        "Comparison is quadratic, so large inputs are slow.",
      ],
    },
    "unicodedata": {
      points: [
        "Character properties and normalisation forms are exposed.",
        "Normalising is what makes two visually identical strings compare equal.",
        "Comparing unnormalised text fails in ways that are invisible on screen.",
      ],
    },
    "struct": {
      points: [
        "Bytes are packed and unpacked to a declared layout.",
        "It is how a binary protocol or file header is read.",
        "Endianness and alignment must be stated or the platform decides.",
      ],
    },
    "codecs": {
      points: [
        "Text is encoded and decoded between byte representations.",
        "It is the lower layer under file and stream encoding.",
        "An error handler choice silently changes the data on failure.",
      ],
    },
    "dataclasses": {
      points: [
        "A decorator generates init, repr and comparison from fields.",
        "The class declaration becomes the schema.",
        "A mutable default needs a factory rather than a literal.",
      ],
    },
    "enum": {
      points: [
        "Named constants are grouped into a type.",
        "Members are singletons, so identity comparison works.",
        "Adding a member can break exhaustive matching elsewhere.",
      ],
    },
    "typing": {
      points: [
        "Type annotations are expressed for the checker.",
        "Protocols describe a shape without requiring inheritance.",
        "Nothing is enforced at runtime by the annotations themselves.",
      ],
    },
    "collections": {
      points: [
        "Specialised containers cover counting, defaults, ordering and queues.",
        "Counter and defaultdict remove the commonest dictionary boilerplate.",
        "deque appends and pops at both ends in constant time.",
      ],
    },
    "itertools": {
      points: [
        "Iterator building blocks compose lazily.",
        "Nothing is materialised, so infinite sequences are usable.",
        "Consuming an iterator twice yields nothing the second time.",
      ],
    },
    "functools": {
      points: [
        "Caching, partial application and reduction are provided.",
        "lru_cache memoises a pure function in one line.",
        "Caching on a method keeps instances alive indefinitely.",
      ],
    },
    "operator": {
      points: [
        "Operators are available as plain functions.",
        "itemgetter and attrgetter are faster than equivalent lambdas.",
        "It is less readable than a lambda for anything unusual.",
      ],
    },
    "heapq": {
      points: [
        "A list is maintained as a binary heap.",
        "It gives the smallest item in constant time with cheap insertion.",
        "It is a min-heap, so a max-heap needs negated keys.",
      ],
    },
    "bisect": {
      points: [
        "A sorted sequence is searched and maintained.",
        "Binary search is what makes an ordered insert cheap.",
        "The sequence must already be sorted or results are wrong.",
      ],
    },
    "array": {
      points: [
        "A compact sequence of one numeric type is stored.",
        "It uses far less memory than a list of the same numbers.",
        "NumPy is better for anything beyond simple storage.",
      ],
    },
    "copy": {
      points: [
        "Shallow and deep copies of objects are produced.",
        "A shallow copy shares nested objects with the original.",
        "Deep copying is expensive and can follow more than expected.",
      ],
    },
    "graphlib": {
      points: [
        "A dependency graph is sorted topologically.",
        "It is the standard answer for ordering tasks by dependency.",
        "A cycle raises rather than producing a partial order.",
      ],
    },
    "statistics": {
      points: [
        "Mean, median, variance and related measures are computed.",
        "It needs no third-party dependency for basic statistics.",
        "It is far slower than NumPy on large datasets.",
      ],
    },
    "pathlib": {
      points: [
        "Filesystem paths are objects with methods.",
        "The slash operator joins correctly on every platform.",
        "Some older APIs still expect strings.",
      ],
    },
    "os.path": {
      points: [
        "The older string-based path manipulation functions.",
        "Most existing code still uses it, so it must be read.",
        "pathlib is the preferred interface for new code.",
      ],
    },
    "shutil": {
      points: [
        "Files and directory trees are copied, moved and removed.",
        "It provides the high-level operations os lacks.",
        "Recursive removal is unforgiving of a wrong path.",
      ],
    },
    "glob": {
      points: [
        "Paths are matched against shell-style wildcards.",
        "Recursive matching finds files across a tree in one call.",
        "Ordering is not guaranteed, so results need sorting.",
      ],
    },
    "fnmatch": {
      points: [
        "Names are matched against shell-style patterns.",
        "It matches strings rather than touching the filesystem.",
        "Its case sensitivity follows the platform.",
      ],
    },
    "tempfile": {
      points: [
        "Temporary files and directories are created safely.",
        "Safe creation avoids the race a predictable name invites.",
        "Without a context manager the file may not be removed.",
      ],
    },
    "io": {
      points: [
        "Text, binary and in-memory streams share one interface.",
        "In-memory buffers let code that expects a file be tested.",
        "Wrapping a binary stream as text introduces an encoding.",
      ],
    },
    "mmap": {
      points: [
        "A file is mapped into memory and accessed as bytes.",
        "Random access to a huge file avoids reading it whole.",
        "The mapping must be closed or the file stays locked.",
      ],
    },
    "filecmp": {
      points: [
        "Files and directory trees are compared.",
        "A shallow comparison uses metadata and is very fast.",
        "A shallow match is not proof the contents are identical.",
      ],
    },
    "os": {
      points: [
        "Processes, environment and filesystem are reached directly.",
        "It is the portable layer over operating system calls.",
        "Behaviour still differs per platform in places.",
      ],
    },
    "sys": {
      points: [
        "Interpreter state, arguments and streams are accessed.",
        "It is where the module path and exit behaviour live.",
        "Mutating the module path at runtime makes imports unpredictable.",
      ],
    },
    "subprocess": {
      points: [
        "External commands are run with their input and output captured.",
        "Passing arguments as a list is what avoids shell injection.",
        "A filled output pipe deadlocks a process that is not read.",
      ],
    },
    "signal": {
      points: [
        "Operating system signals are handled.",
        "Handling termination is what allows a clean shutdown.",
        "Handlers run between bytecodes, not instantly.",
      ],
    },
    "platform": {
      points: [
        "The running system and interpreter are identified.",
        "It is how platform-specific behaviour is selected.",
        "Branching on it is a smell when a portable API exists.",
      ],
    },
    "getpass": {
      points: [
        "A password is read without echoing it.",
        "Suppressing the echo is the entire purpose.",
        "It fails where there is no real terminal.",
      ],
    },
    "argparse": {
      points: [
        "Command-line arguments are declared, parsed and validated.",
        "Declaring arguments generates the help text.",
        "Complex subcommand trees become hard to follow.",
      ],
    },
    "logging": {
      points: [
        "Messages are emitted through configurable loggers and handlers.",
        "Levels and handlers are what separate noise from signal.",
        "Configuring it from a library imposes choices on the application.",
      ],
    },
    "contextlib": {
      points: [
        "Context managers are created and composed.",
        "A generator becomes a context manager with one decorator.",
        "suppress can hide an error that mattered.",
      ],
    },
    "atexit": {
      points: [
        "Functions run when the interpreter exits normally.",
        "It is the place for final cleanup and flushing.",
        "It does not run on a hard kill or a crash.",
      ],
    },
    "asyncio": {
      points: [
        "A coroutine runs only via `asyncio.run()`, an `await`, or `asyncio.create_task()`.",
        "Calling a coroutine function merely returns a coroutine object and warns if never awaited.",
        "The loop keeps only weak references to tasks, so an unreferenced task can be collected mid-run.",
      ],
    },
    "threading": {
      points: [
        "Threads share memory inside one interpreter process.",
        "I/O-bound work still benefits, because I/O releases the global lock.",
        "`asyncio.to_thread` is the documented way to move a blocking call off the loop.",
      ],
    },
    "multiprocessing": {
      points: [
        "Separate processes each get their own interpreter.",
        "That is how CPU-bound work uses more than one core.",
        "Arguments are pickled, so unpicklable objects cannot cross.",
      ],
    },
    "concurrent.futures": {
      points: [
        "Thread and process pools share one submission interface.",
        "Swapping the executor is what moves work between threads and processes.",
        "An exception surfaces only when the future's result is retrieved.",
      ],
    },
    "queue": {
      points: [
        "Thread-safe queues pass work between threads.",
        "The locking that makes it safe is already handled.",
        "An unbounded queue hides a producer outpacing its consumer.",
      ],
    },
    "selectors": {
      points: [
        "Many sockets are monitored for readiness.",
        "It is the portable layer beneath the event loop.",
        "Writing directly against it is rarely worth the effort now.",
      ],
    },
    "anyio": {
      points: [
        "One API runs on both asyncio and Trio.",
        "Structured concurrency is its organising idea.",
        "Libraries may still assume one backend.",
      ],
    },
    "trio": {
      points: [
        "Structured concurrency organises tasks into nurseries.",
        "A nursery guarantees child tasks are awaited and errors surface.",
        "Much of the ecosystem targets asyncio instead.",
      ],
    },
    "uvloop": {
      points: [
        "A faster event loop replaces the default.",
        "It is a drop-in change with a measurable gain.",
        "It does not run on every platform.",
      ],
    },
    "urllib.request": {
      points: [
        "HTTP requests are made without a dependency.",
        "It is available everywhere the standard library is.",
        "Its API is clumsy compared with the third-party clients.",
      ],
    },
    "http.client": {
      points: [
        "The low-level HTTP protocol client.",
        "It is what higher-level clients are built upon.",
        "Connection reuse and retries are yours to manage.",
      ],
    },
    "http.server": {
      points: [
        "A simple HTTP server for local use.",
        "Serving a directory is a one-line command.",
        "It is explicitly not for production.",
      ],
    },
    "socket": {
      points: [
        "Network sockets are created and used directly.",
        "It is the substrate under every network protocol here.",
        "Message framing is the application's responsibility.",
      ],
    },
    "ssl": {
      points: [
        "Sockets are wrapped in TLS.",
        "Certificate and hostname verification are the security.",
        "Disabling verification silently removes the protection.",
      ],
    },
    "ipaddress": {
      points: [
        "Addresses and networks are parsed and compared.",
        "Containment checks replace error-prone string parsing.",
        "Mixing address families raises rather than comparing.",
      ],
    },
    "email": {
      points: [
        "Messages are constructed and parsed, including attachments.",
        "It handles the encoding rules correspondence actually requires.",
        "Its layered API is notoriously awkward.",
      ],
    },
    "smtplib": {
      points: [
        "Mail is sent over SMTP.",
        "It needs no dependency to deliver a message.",
        "Deliverability depends on domain configuration, not the library.",
      ],
    },
    "requests": {
      points: [
        "A widely used synchronous HTTP client.",
        "Its interface is the reason it became a de facto standard.",
        "It is synchronous, so it blocks an async loop.",
      ],
    },
    "httpx": {
      points: [
        "An HTTP client with sync and async interfaces.",
        "One library covers both styles and HTTP/2.",
        "Its defaults differ from requests in ways that surprise.",
      ],
    },
    "aiohttp": {
      points: [
        "An asynchronous HTTP client and server.",
        "The session is what pools connections and must be reused.",
        "A session per request defeats the pooling entirely.",
      ],
    },
    "websockets": {
      points: [
        "Websocket clients and servers are built on asyncio.",
        "It is a focused, standards-compliant implementation.",
        "Reconnection logic is the application's responsibility.",
      ],
    },
    "json": {
      points: [
        "Data converts between Python objects and JSON.",
        "Only a few types map directly, so dates need a custom encoder.",
        "Loading untrusted JSON is safe; loading untrusted pickle is not.",
      ],
    },
    "csv": {
      points: [
        "Delimited files are read and written with quoting handled.",
        "Splitting on commas by hand breaks on the first quoted field.",
        "DictReader keys rows by header, which survives a column moving.",
      ],
    },
    "pickle": {
      points: [
        "Python objects are serialised to bytes.",
        "It handles arbitrary objects that JSON cannot represent.",
        "Unpickling untrusted data executes arbitrary code.",
      ],
    },
    "sqlite3": {
      points: [
        "An embedded SQL database is available without a server.",
        "It needs no installation, which makes it ideal for local state.",
        "Concurrent writers contend on a single file.",
      ],
    },
    "configparser": {
      points: [
        "INI-style configuration files are read and written.",
        "The format is approachable for non-developers.",
        "Every value is a string until it is converted.",
      ],
    },
    "tomllib": {
      points: [
        "TOML is parsed by the standard library.",
        "It is the format pyproject.toml uses.",
        "It reads only; writing needs a third-party package.",
      ],
    },
    "xml.etree.ElementTree": {
      points: [
        "XML is parsed and generated through an element tree.",
        "It covers ordinary XML without a dependency.",
        "It is vulnerable to hostile XML unless a hardened parser is used.",
      ],
    },
    "base64": {
      points: [
        "Bytes are encoded to text and back.",
        "It is how binary travels through text-only channels.",
        "Encoding is not encryption and hides nothing.",
      ],
    },
    "hashlib": {
      points: [
        "Cryptographic and fast hashes are computed.",
        "It is the maintained implementation to prefer.",
        "A general-purpose hash is the wrong tool for passwords.",
      ],
    },
    "hmac": {
      points: [
        "A keyed hash authenticates a message.",
        "It is what verifies a webhook signature.",
        "Comparison must be constant time to avoid a timing leak.",
      ],
    },
    "secrets": {
      points: [
        "Cryptographically strong random values are generated.",
        "It is the correct source for tokens and keys.",
        "The random module is predictable and unsuitable for this.",
      ],
    },
    "uuid": {
      points: [
        "Universally unique identifiers are generated and parsed.",
        "Version 4 is random; version 7 is time-ordered.",
        "Random identifiers index poorly as a primary key.",
      ],
    },
    "zipfile / tarfile": {
      points: [
        "Archives are created, read and extracted.",
        "Streaming avoids holding the whole archive in memory.",
        "Extracting untrusted archives can write outside the target directory.",
      ],
    },
    "datetime": {
      points: [
        "Dates, times and durations are represented.",
        "A naive datetime has no zone, which is where bugs start.",
        "Arithmetic yields timedelta rather than a number.",
      ],
    },
    "zoneinfo": {
      points: [
        "IANA time zones are available in the standard library.",
        "Real zone data is what makes conversions correct.",
        "On some systems the data package must be installed.",
      ],
    },
    "time": {
      points: [
        "Clocks, sleeping and epoch conversions are provided.",
        "The monotonic clock is the right one for measuring durations.",
        "Wall clock time can jump backwards.",
      ],
    },
    "calendar": {
      points: [
        "Calendar data and month arithmetic are provided.",
        "It answers questions about months and weekdays directly.",
        "It works in dates, not in instants.",
      ],
    },
    "math": {
      points: [
        "Floating-point mathematical functions are provided.",
        "isclose is how floats should actually be compared.",
        "Its functions are scalar, not vectorised.",
      ],
    },
    "decimal": {
      points: [
        "Exact decimal arithmetic with configurable precision.",
        "It is the correct type for money.",
        "It is markedly slower than floating point.",
      ],
    },
    "fractions": {
      points: [
        "Exact rational arithmetic is provided.",
        "No precision is lost the way it is with floats.",
        "Denominators grow, and with them the cost.",
      ],
    },
    "random": {
      points: [
        "Pseudo-random numbers and selections are generated.",
        "Seeding makes a sequence reproducible for tests.",
        "It is predictable and must not be used for secrets.",
      ],
    },
    "unittest": {
      points: [
        "The standard library test framework with class-based tests.",
        "It ships with Python, so it needs no dependency.",
        "Its assertion style is more verbose than pytest's.",
      ],
    },
    "doctest": {
      points: [
        "Examples in docstrings are executed as tests.",
        "It keeps documentation honest by running it.",
        "It is brittle against any change in output formatting.",
      ],
    },
    "pytest": {
      points: [
        "Tests are plain functions using plain assert statements.",
        "Fixtures supply setup by parameter name.",
        "Parametrisation turns one test into a table of cases.",
      ],
    },
    "pytest-asyncio": {
      points: [
        "Asynchronous tests run under pytest.",
        "It supplies the loop the coroutine needs.",
        "The mode must be configured or async tests are skipped silently.",
      ],
    },
    "hypothesis": {
      points: [
        "Inputs are generated to find counterexamples.",
        "It explores cases nobody would have written by hand.",
        "A failure must be minimised to be understandable.",
      ],
    },
    "coverage.py": {
      points: [
        "Executed lines and branches are measured.",
        "Coverage shows what was never run at all.",
        "High coverage is not evidence of good assertions.",
      ],
    },
    "tox / nox": {
      points: [
        "Tests run across environments and interpreter versions.",
        "It catches what only breaks on another version.",
        "Each environment is built and installed, which is slow.",
      ],
    },
    "mypy": {
      points: [
        "Static type checking verifies annotations.",
        "It catches a class of errors before anything runs.",
        "Strictness is configurable, so adoption can be gradual.",
      ],
    },
    "pyright / basedpyright": {
      points: [
        "A fast type checker with strong editor integration.",
        "Its inference is more aggressive than mypy's.",
        "The two disagree, so a codebase should pick one.",
      ],
    },
    "ty": {
      points: [
        "A very fast type checker written in Rust.",
        "Speed makes checking viable on every keystroke.",
        "It is young, so coverage of edge cases is still growing.",
      ],
    },
    "pydantic": {
      points: [
        "Data is validated and coerced from annotated models.",
        "Models are the schema and the runtime check together.",
        "Version two changed behaviour substantially from version one.",
      ],
    },
    "attrs": {
      points: [
        "Classes are generated from declared attributes.",
        "It predates dataclasses and remains more capable.",
        "It overlaps dataclasses, so a project should choose one.",
      ],
    },
    "freezegun": {
      points: [
        "The clock is frozen or moved for tests.",
        "Controlling time is what makes a time-dependent test deterministic.",
        "It patches globally, which can surprise unrelated code.",
      ],
    },
    "factory-boy": {
      points: [
        "Test objects are built from declarative factories.",
        "Factories keep fixture setup readable as models grow.",
        "Overly clever factories hide what a test depends on.",
      ],
    },
    "responses / respx": {
      points: [
        "Outbound HTTP is intercepted in tests.",
        "Mocking at the HTTP layer keeps the client code real.",
        "Each targets a different client library.",
      ],
    },
    "uv": {
      points: [
        "A fast resolver, installer and interpreter manager.",
        "One tool replaces pip, virtualenv and more.",
        "It is young, so some workflows are still settling.",
      ],
    },
    "pip": {
      points: [
        "The standard installer for Python packages.",
        "It is present everywhere, which is its real advantage.",
        "It resolves more slowly than the newer tools.",
      ],
    },
    "venv": {
      points: [
        "An isolated environment is created from the standard library.",
        "Isolation stops two projects fighting over one version.",
        "The environment is disposable and should not be committed.",
      ],
    },
    "poetry": {
      points: [
        "Dependencies, packaging and publishing are managed together.",
        "Its lockfile makes an install reproducible.",
        "It has historically diverged from packaging standards.",
      ],
    },
    "hatch / hatchling": {
      points: [
        "A standards-based project and build backend.",
        "It follows the packaging standards closely.",
        "Its environment management is less established.",
      ],
    },
    "setuptools": {
      points: [
        "The long-established build backend.",
        "Almost every existing package is built with it.",
        "Its legacy configuration styles are still widely encountered.",
      ],
    },
    "build / twine": {
      points: [
        "Distributions are built and uploaded to an index.",
        "Separating build from upload is what allows inspection between.",
        "Credentials must be scoped to the project, not the account.",
      ],
    },
    "ruff": {
      points: [
        "Linting and formatting run in one very fast tool.",
        "It replaces several tools at a fraction of the runtime.",
        "Rule selection matters; the defaults are only a starting point.",
      ],
    },
    "black": {
      points: [
        "Code is formatted to one uncompromising style.",
        "Removing style debate is the entire point.",
        "It reformats whole files, which makes the first commit noisy.",
      ],
    },
    "pre-commit": {
      points: [
        "Checks run automatically before a commit is created.",
        "Catching issues locally is cheaper than catching them in CI.",
        "Hooks can be bypassed, so CI must check the same things.",
      ],
    },
    "pipx": {
      points: [
        "Command-line tools install into isolated environments.",
        "Isolation stops a tool's dependencies polluting a project.",
        "It is for applications, not for libraries.",
      ],
    },
    "fastapi": {
      points: [
        "APIs are built from type annotations with validation and docs.",
        "Annotations produce validation and OpenAPI together.",
        "Its concurrency model requires care with blocking calls.",
      ],
    },
    "django": {
      points: [
        "A batteries-included framework with ORM, admin and auth.",
        "The admin interface alone justifies it for many projects.",
        "Its conventions are pervasive and hard to opt out of.",
      ],
    },
    "flask": {
      points: [
        "A minimal framework that stays out of the way.",
        "Small surface area makes it quick to learn.",
        "Everything beyond routing is an extension you choose.",
      ],
    },
    "starlette": {
      points: [
        "A lightweight ASGI toolkit.",
        "It is the foundation FastAPI is built on.",
        "It is deliberately low level.",
      ],
    },
    "litestar": {
      points: [
        "An ASGI framework with dependency injection built in.",
        "Injection and layered configuration are its distinguishing features.",
        "Its community is smaller than the established alternatives.",
      ],
    },
    "uvicorn": {
      points: [
        "An ASGI server for asynchronous applications.",
        "It is the usual way to run modern Python web apps.",
        "A single worker uses a single core.",
      ],
    },
    "gunicorn": {
      points: [
        "A process manager that supervises worker processes.",
        "It is how multiple cores are used in production.",
        "It needs an ASGI worker class for async frameworks.",
      ],
    },
    "djangorestframework": {
      points: [
        "REST APIs are built on top of Django.",
        "Serializers and viewsets remove most boilerplate.",
        "Its abstractions are deep and can obscure behaviour.",
      ],
    },
    "sqlalchemy": {
      points: [
        "A SQL toolkit and object-relational mapper.",
        "The core and the ORM can be used independently.",
        "Version two changed the idiomatic query style substantially.",
      ],
    },
    "alembic": {
      points: [
        "Database migrations are generated and applied.",
        "Migrations are files, which makes schema change reviewable.",
        "Autogenerated migrations must be read before they are run.",
      ],
    },
    "celery": {
      points: [
        "Distributed task queues run background work.",
        "It is the established choice for Python background jobs.",
        "It needs a broker and adds real operational weight.",
      ],
    },
    "redis-py": {
      points: [
        "The Redis client for Python.",
        "It covers caching, locks and pub/sub in one client.",
        "Connection pooling must be configured for concurrency.",
      ],
    },
    "psycopg": {
      points: [
        "The PostgreSQL adapter for Python.",
        "Version three supports both sync and async.",
        "Server-side cursors are needed for very large result sets.",
      ],
    },
    "jinja2": {
      points: [
        "Templates render text and HTML from context data.",
        "Autoescaping is what prevents injection in HTML output.",
        "Autoescaping is not on by default in every configuration.",
      ],
    },
    "numpy": {
      points: [
        "Arrays hold uniform types and operate element-wise.",
        "Vectorised operations run in compiled code, which is the speed.",
        "A slice is a view, so writing through it changes the original.",
      ],
    },
    "pandas": {
      points: [
        "Tabular data is loaded, reshaped, grouped and aggregated.",
        "The index is what alignment happens on, not row position.",
        "Chained assignment may write to a copy rather than the frame.",
      ],
    },
    "polars": {
      points: [
        "A fast dataframe library with lazy evaluation.",
        "The lazy API optimises a whole query before executing.",
        "Its API differs enough from pandas to need relearning.",
      ],
    },
    "scipy": {
      points: [
        "Scientific algorithms build on NumPy arrays.",
        "It covers optimisation, integration, signal and statistics.",
        "Its surface is large and organised by subpackage.",
      ],
    },
    "matplotlib": {
      points: [
        "Plots are built from figures and axes.",
        "The object-oriented interface scales where the stateful one does not.",
        "Headless rendering needs a non-interactive backend.",
      ],
    },
    "seaborn": {
      points: [
        "Statistical plots are produced with sensible defaults.",
        "It reduces a common chart to a single call.",
        "Customising beyond its defaults means dropping to matplotlib.",
      ],
    },
    "plotly": {
      points: [
        "Interactive charts render in the browser.",
        "Interactivity is what it offers over static plotting.",
        "Its output embeds data, so files grow quickly.",
      ],
    },
    "pyarrow": {
      points: [
        "Columnar data is represented and exchanged in memory.",
        "It is the interchange format between data tools.",
        "It is a heavy dependency for a small task.",
      ],
    },
    "duckdb": {
      points: [
        "An embedded analytical database queries files directly.",
        "It runs SQL over Parquet and CSV without loading them.",
        "It is analytical, not a transactional store.",
      ],
    },
    "openpyxl": {
      points: [
        "Excel workbooks are read and written.",
        "It handles the format most business data actually arrives in.",
        "Large workbooks are slow and memory-hungry.",
      ],
    },
    "jupyter": {
      points: [
        "Code, output and prose live in an executable notebook.",
        "Interleaving is what makes exploration and explanation one artifact.",
        "Cells can run out of order, producing unreproducible state.",
      ],
    },
    "scikit-learn": {
      points: [
        "Classical machine learning with a consistent estimator API.",
        "One fit and predict interface covers every model.",
        "It is not designed for deep learning.",
      ],
    },
    "pytorch": {
      points: [
        "Tensors and neural networks with dynamic graphs.",
        "Dynamic graphs make debugging ordinary Python debugging.",
        "GPU and CUDA versions must match the install.",
      ],
    },
    "tensorflow": {
      points: [
        "A machine learning platform with a large deployment story.",
        "Its serving and mobile tooling are mature.",
        "Its API has changed substantially across major versions.",
      ],
    },
    "transformers": {
      points: [
        "Pretrained models are loaded and fine-tuned.",
        "A shared interface covers thousands of published models.",
        "Model downloads are large and cached on disk.",
      ],
    },
    "anthropic": {
      points: [
        "The official client for Claude models.",
        "Streaming, tools and structured output are supported directly.",
        "Retries and rate limits still need handling by the caller.",
      ],
    },
    "langchain": {
      points: [
        "Components for models, retrievers, tools and agents.",
        "It standardises the wiring between pieces.",
        "Its abstractions are worth understanding before depending on them.",
      ],
    },
    "llama-index": {
      points: [
        "Data is indexed and queried for retrieval-augmented generation.",
        "It focuses on the ingestion and indexing half.",
        "Its defaults hide choices that matter at scale.",
      ],
    },
    "sentence-transformers": {
      points: [
        "Sentence and document embeddings are produced.",
        "It makes semantic similarity available in a few lines.",
        "Embeddings from different models are not comparable.",
      ],
    },
    "onnxruntime": {
      points: [
        "Models run in a portable, optimised format.",
        "One format runs across languages and hardware.",
        "Not every operator converts cleanly.",
      ],
    },
    "playwright": {
      points: [
        "Browsers are automated for testing and scraping.",
        "Auto-waiting removes most timing flakiness.",
        "Browser binaries are installed separately from the package.",
      ],
    },
    "selenium": {
      points: [
        "Browsers are driven through the WebDriver standard.",
        "Its standardisation and language coverage are the strengths.",
        "Waiting is explicit, which is the usual source of flakiness.",
      ],
    },
    "beautifulsoup4": {
      points: [
        "HTML is parsed and navigated forgivingly.",
        "It copes with malformed markup that a strict parser rejects.",
        "Its speed depends on the parser it is given.",
      ],
    },
    "lxml": {
      points: [
        "XML and HTML are parsed quickly with XPath support.",
        "XPath is what makes complex extraction concise.",
        "It is a compiled dependency, which complicates installation.",
      ],
    },
    "scrapy": {
      points: [
        "A framework for large-scale crawling.",
        "Scheduling, throttling and pipelines come built in.",
        "It is heavy for fetching a handful of pages.",
      ],
    },
    "pillow": {
      points: [
        "Images are opened, converted and transformed.",
        "It is the standard image library for Python.",
        "Decoding untrusted images has a history of vulnerabilities.",
      ],
    },
    "rich": {
      points: [
        "Terminal output gains colour, tables and progress bars.",
        "It makes command-line output genuinely readable.",
        "Its markup can interfere with piped output.",
      ],
    },
    "typer": {
      points: [
        "Command-line interfaces are built from type annotations.",
        "Annotations generate parsing and help text together.",
        "It is a layer over click, which shows through at the edges.",
      ],
    },
    "click": {
      points: [
        "Composable command-line interfaces are built with decorators.",
        "Nested commands and groups compose cleanly.",
        "Its decorator stacking becomes dense quickly.",
      ],
    },
    "watchdog": {
      points: [
        "Filesystem changes are observed and acted upon.",
        "It is the basis of most watch-and-reload tools.",
        "Editors produce several events for one logical save.",
      ],
    },
    "paramiko": {
      points: [
        "SSH and SFTP connections are made from Python.",
        "It automates remote operations without shelling out.",
        "Host key handling must be deliberate rather than disabled.",
      ],
    },
    "boto3": {
      points: [
        "AWS services are called from Python.",
        "It covers every service with a consistent interface.",
        "Credential resolution order is a frequent source of confusion.",
      ],
    },
  },
};
