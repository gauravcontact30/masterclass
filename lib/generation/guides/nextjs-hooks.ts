import type { TechnologyGuide } from "./index";
import { source } from "./shared";
import { NEXT_HOOK_LESSONS } from "@/lib/notes-hooks";

/**
 * Every Next.js 16 App Router hook, grounded in the version-matched docs that
 * ship with the installed package (node_modules/next/dist/docs), which mirror
 * nextjs.org/docs for this release.
 */
const guide: TechnologyGuide = {
  id: "nextjs-16-hooks",
  technologyId: "nextjs",
  topicId: "nextjs-hooks",
  level: "intermediate",
  curriculum: {
    title: "Next.js 16+ Hooks",
    minutes: 160,
    objectives: [
      "Know which Next.js hooks exist, where they are imported from, and why they need Client Components.",
      "Read the URL with usePathname, useSearchParams and useParams, and update search params safely.",
      "Navigate programmatically with useRouter and give link feedback with useLinkStatus.",
      "Build active navigation and breadcrumbs with useSelectedLayoutSegment(s).",
      "Measure real users with useReportWebVitals and handle connectivity with useOffline.",
      "Combine Next.js Server Functions with React's useActionState, useFormStatus and useOptimistic.",
    ],
    prerequisites: [
      "React Hooks basics (see the React 19+ Hooks guide).",
      "Next.js App Router: layouts, pages and Server vs Client Components.",
      "Next.js 16 or later.",
    ],
    lessons: [
      {
        title: "The Next.js hook map",
        diagram: {
          kind: "tree",
          caption: "Next.js hooks live in three entry points. All of them run in Client Components; Server Components read the same information from props instead.",
          items: [
            { label: "next/navigation" },
            { label: "usePathname, useSearchParams, useParams", detail: "read the URL", depth: 1 },
            { label: "useRouter", detail: "navigate, refresh, prefetch", depth: 1 },
            { label: "useSelectedLayoutSegment(s)", detail: "active child segments", depth: 1 },
            { label: "next/link" },
            { label: "useLinkStatus", detail: "pending state of a <Link>", depth: 1 },
            { label: "next/web-vitals" },
            { label: "useReportWebVitals", detail: "LCP, CLS, INP, TTFB, FCP", depth: 1 },
            { label: "next/offline" },
            { label: "useOffline", detail: "experimental connectivity state", depth: 1 },
          ],
        },
        explanation: "- Hooks only run in Client Components: add 'use client' at the top of the file\n- In Server Components, read params and searchParams from page props (they are Promises in Next.js 16)\n- Import App Router hooks from next/navigation, never from next/router (Pages Router)\n- Keep client boundaries small: put the hook in a leaf component, not the whole layout\n- With cacheComponents enabled, URL hooks may need a Suspense boundary on dynamic routes",
        keyPoints: [
          { tone: "key", title: "Server reads props; client uses hooks", text: "Server Components receive route data as props (await props.params and await props.searchParams in Next.js 16). Client Components read the same data with hooks from next/navigation.", example: "const { slug } = await props.params  // server" },
          { tone: "tip", title: "Keep client boundaries at the leaves", text: "Put a hook in the smallest component that needs it and render that component from the server tree. Client Components still render to HTML on first load; they are not a de-optimisation.", example: "<ShareButton />  // 'use client', inside a server page" },
          { tone: "warning", title: "App Router hooks come from next/navigation", text: "useRouter from next/router belongs to the Pages Router and does not work in app/. Import useRouter, usePathname, useSearchParams and useParams from next/navigation.", example: "import { useRouter } from 'next/navigation'" },
        ],
        example: "- A search box reads ?q= with useSearchParams in a tiny client component\n- A page reads the same value on the server via await props.searchParams\n- A sidebar highlights the active link with usePathname\n- Web vitals are reported from a small <WebVitals /> client component in the root layout",
        code: "// app/blog/[slug]/page.tsx — Server Component: props, no hooks\nexport default async function Page(props: PageProps<'/blog/[slug]'>) {\n  const { slug } = await props.params;\n  const { tab } = await props.searchParams;\n  return <Article slug={slug} tab={typeof tab === 'string' ? tab : 'overview'} />;\n}\n\n// app/blog/[slug]/share-button.tsx — Client Component: hooks\n'use client';\n\nimport { useParams, usePathname } from 'next/navigation';\n\nexport function ShareButton() {\n  const { slug } = useParams<{ slug: string }>();\n  const pathname = usePathname();\n  return (\n    <button onClick={() => navigator.clipboard.writeText(location.origin + pathname)}>\n      Share “{slug}”\n    </button>\n  );\n}",
        exercise: "- List every hook in this lesson with its import path from memory\n- Convert a page that uses useSearchParams at the top into a server page plus a small client component\n- Explain why a layout cannot read the current pathname on the server",
        checkpoint: "- Why do Next.js hooks require Client Components?\n- How does a Server Component get the route params?\n- Which package do App Router hooks come from?",
        mistake: "- Do not import useRouter from next/router in the App Router\n- Do not mark a whole layout 'use client' just to use one hook\n- Do not forget that params and searchParams are Promises in Next.js 16 server code",
      },
      {
        title: "Reading the URL: usePathname, useSearchParams, useParams",
        diagram: {
          kind: "split",
          caption: "Three hooks read three parts of the same URL, e.g. /shop/shoes/nike-air?sort=price for the route app/shop/[tag]/[item]/page.tsx.",
          headings: ["Hook", "Returns for the example URL"],
          items: [
            { label: "usePathname()", group: 0 },
            { label: "useSearchParams()", group: 0 },
            { label: "useParams()", group: 0 },
            { label: "'/shop/shoes/nike-air'", detail: "no query string", group: 1 },
            { label: "ReadonlyURLSearchParams", detail: ".get('sort') -> 'price'", group: 1 },
            { label: "{ tag: 'shoes', item: 'nike-air' }", detail: "catch-all params are arrays", group: 1 },
          ],
        },
        explanation: "- usePathname returns the path without the query string\n- useSearchParams returns a read-only URLSearchParams: use get, getAll, has, toString\n- useParams returns the dynamic segments of the current route as an object\n- To change search params, copy them into a new URLSearchParams and navigate with router.push or router.replace\n- On prerendered routes, wrap components using useSearchParams in <Suspense> so the rest of the page can be static",
        keyPoints: [
          { tone: "key", title: "Three hooks, three parts of the URL", text: "usePathname returns the path without the query, useSearchParams a read-only URLSearchParams, and useParams the route's dynamic segments, with catch-all segments as arrays.", example: "useParams()  // { tag: 'shoes', item: 'nike-air' }" },
          { tone: "tip", title: "Copy search params before editing", text: "Create a mutable copy with new URLSearchParams(searchParams.toString()), change it, then navigate with router.replace so filter changes do not flood the history stack.", example: "router.replace(`${pathname}?${params}`, { scroll: false })" },
          { tone: "warning", title: "Wrap useSearchParams in Suspense", text: "On prerendered routes, a component reading search params without a Suspense boundary pushes client rendering up to the nearest boundary. Wrap it so the rest of the page stays static.", example: "<Suspense fallback={<Filters />}><SortSelect /></Suspense>" },
        ],
        example: "- /dashboard?search=my-project: searchParams.get('search') is 'my-project'\n- /dashboard?a=1&a=2: get('a') is '1', getAll('a') is ['1', '2']\n- app/shop/[...slug]/page.js at /shop/1/2: useParams() is { slug: ['1', '2'] }\n- A route with no dynamic segments: useParams() is {}",
        code: "'use client';\n\nimport { usePathname, useRouter, useSearchParams } from 'next/navigation';\nimport { useCallback } from 'react';\n\nexport function SortSelect() {\n  const router = useRouter();\n  const pathname = usePathname();\n  const searchParams = useSearchParams();\n\n  const setQuery = useCallback(\n    (name: string, value: string) => {\n      const params = new URLSearchParams(searchParams.toString()); // editable copy\n      params.set(name, value);\n      router.replace(`${pathname}?${params.toString()}`, { scroll: false });\n    },\n    [pathname, router, searchParams],\n  );\n\n  return (\n    <select value={searchParams.get('sort') ?? 'relevance'} onChange={e => setQuery('sort', e.target.value)}>\n      <option value=\"relevance\">Relevance</option>\n      <option value=\"price\">Price</option>\n    </select>\n  );\n}\n\n// app/shop/page.tsx\n// <Suspense fallback={<p>Loading filters…</p>}><SortSelect /></Suspense>",
        apiReference: [
          {
            name: "useSearchParams",
            kind: "hook (next/navigation)",
            signature: "const searchParams: ReadonlyURLSearchParams = useSearchParams()",
            params: [],
            returns: "Read-only URLSearchParams: get, getAll, has, keys, values, entries, forEach, toString.",
            notes: "Not supported in Server Components; use the page's searchParams prop there.",
          },
          {
            name: "useParams",
            kind: "hook (next/navigation)",
            signature: "const params = useParams<{ tag: string; item: string }>()",
            params: [],
            returns: "An object of the current route's dynamic params; values are strings or string arrays (catch-all).",
          },
        ],
        exercise: "- Build a search box that keeps ?q= in sync with the input using router.replace\n- Show a product page's [id] with useParams in a client breadcrumb\n- Wrap a useSearchParams component in Suspense and compare the build output",
        checkpoint: "- How do you update one search param without losing the others?\n- What does useParams return for a catch-all route?\n- Why wrap useSearchParams in Suspense on prerendered routes?",
        mistake: "- Do not try to mutate the object useSearchParams returns\n- Do not push a history entry on every keystroke\n- Do not pass untrusted strings straight into router.push",
        interview: [
          {
            question: "How do you read and update query parameters in the Next.js App Router?",
            definition: "Client Components read them with useSearchParams; they update them by navigating to a URL with new parameters.",
            answer: "useSearchParams returns a read-only URLSearchParams. Create a mutable copy with new URLSearchParams(searchParams.toString()), set or delete keys, and call router.push or router.replace with the new query string (often with scroll: false). In Server Components read the page's searchParams prop, which is a Promise in Next.js 16. Wrap client readers in Suspense on prerendered routes.",
            similar: [
              { question: "Can a layout receive searchParams?", answer: "No. Layouts are shared across navigations; only pages receive searchParams." },
            ],
          },
        ],
      },
      {
        title: "Navigating: useRouter and useLinkStatus",
        diagram: {
          kind: "flow",
          caption: "Prefer <Link> for navigation; reach for useRouter when navigation follows logic, such as after a form succeeds. useLinkStatus gives inline feedback while a <Link> is pending.",
          items: [
            { label: "<Link href> in view", detail: "prefetched automatically in production" },
            { label: "User clicks", detail: "client-side navigation starts" },
            { label: "useLinkStatus().pending = true", detail: "only if the route was not prefetched" },
            { label: "History updates", detail: "pending becomes false" },
            { label: "router.refresh()", detail: "re-render Server Components with fresh data" },
          ],
        },
        explanation: "- router.push(href, { scroll, transitionTypes }) navigates and adds a history entry\n- router.replace navigates without a new history entry\n- router.refresh re-requests the current route and merges new Server Component output, keeping client state\n- router.prefetch(href, { onInvalidate }) warms a route; back and forward walk history\n- useLinkStatus, imported from next/link, returns { pending } inside a <Link> descendant",
        keyPoints: [
          { tone: "key", title: "Prefer Link; use useRouter for logic", text: "<Link> prefetches routes as they enter the viewport and is the default for navigation. Use router.push or replace when navigation follows logic, such as after a successful save.", example: "router.push(`/orders/${id}`)" },
          { tone: "tip", title: "Reset or preserve state with bfcacheId", text: "Next.js 16's router.bfcacheId changes on fresh navigations but not on back/forward. Keying a form on it resets the form on new visits while restoring it when the user goes back.", example: "<form key={router.bfcacheId}>" },
          { tone: "warning", title: "Never push untrusted URLs", text: "Passing user-controlled strings to router.push or replace can enable cross-site scripting through javascript: URLs. Validate or build URLs from known routes.", example: "router.push(safeRoutes[choice])" },
        ],
        example: "- After saving, router.push('/orders') moves to the orders page\n- router.refresh() shows new data after a mutation without losing scroll or input state\n- router.push('/dashboard', { scroll: false }) keeps the scroll position\n- <Link href=\"/dashboard\" prefetch={false}>Dashboard <Hint /></Link> where Hint reads useLinkStatus",
        code: "'use client';\n\nimport Link, { useLinkStatus } from 'next/link';\nimport { useRouter } from 'next/navigation';\n\nfunction Hint() {\n  const { pending } = useLinkStatus();   // must be inside a <Link>\n  return <span aria-hidden className={`link-hint ${pending ? 'is-pending' : ''}`} />;\n}\n\nexport function Nav() {\n  return (\n    <Link href=\"/reports\" prefetch={false}>\n      Reports <Hint />\n    </Link>\n  );\n}\n\nexport function NewOrderButton({ createOrder }: { createOrder: () => Promise<string> }) {\n  const router = useRouter();\n  return (\n    <button\n      onClick={async () => {\n        const id = await createOrder();\n        router.push(`/orders/${id}`);   // navigate after logic\n        router.refresh();               // refresh server data in the layout\n      }}\n    >\n      New order\n    </button>\n  );\n}",
        apiReference: [
          {
            name: "useRouter",
            kind: "hook (next/navigation)",
            signature: "const router = useRouter()\nrouter.push(href, { scroll?, transitionTypes? })\nrouter.replace(href, options?)\nrouter.refresh()\nrouter.prefetch(href, { onInvalidate? })\nrouter.back() / router.forward()",
            params: [
              { name: "scroll", type: "boolean", description: "false keeps the scroll position (default scrolls to top)." },
              { name: "transitionTypes", type: "string[]", description: "Labels for React view transitions on this navigation." },
            ],
            returns: "A router object; also exposes bfcacheId for resetting state on fresh navigations.",
          },
          {
            name: "useLinkStatus",
            kind: "hook (next/link)",
            signature: "const { pending } = useLinkStatus()",
            params: [],
            returns: "{ pending: boolean }: true before history updates, false after. Must be called inside a <Link> descendant.",
          },
        ],
        exercise: "- Redirect to a detail page after a successful create with router.push\n- Add a subtle pending hint to a nav link with useLinkStatus\n- Use router.refresh after a mutation and observe client state being preserved",
        checkpoint: "- When should you use useRouter instead of <Link>?\n- What does router.refresh do to client state?\n- Why might useLinkStatus never show pending?",
        mistake: "- Do not use router.push for ordinary links\n- Do not render inline indicators that shift layout; toggle opacity on a fixed-size element\n- Do not expect useLinkStatus to work outside a <Link>",
      },
      {
        title: "Layout segments: useSelectedLayoutSegment(s)",
        diagram: {
          kind: "split",
          caption: "Called from a layout's client component, these hooks report which child segments are active below that layout: one level, or all levels.",
          headings: ["Layout and URL", "Result"],
          items: [
            { label: "app/layout.js at /dashboard/settings", group: 0 },
            { label: "app/dashboard/layout.js at /dashboard/settings", group: 0 },
            { label: "app/layout.js at /blog/a/b/c (catch-all)", group: 0 },
            { label: "segments: ['dashboard', 'settings']", detail: "segment: 'dashboard'", group: 1 },
            { label: "segments: ['settings']", detail: "segment: 'settings'", group: 1 },
            { label: "segments: ['blog', 'a/b/c']", detail: "catch-all joined", group: 1 },
          ],
        },
        explanation: "- useSelectedLayoutSegment returns the active segment one level below the layout (or null)\n- useSelectedLayoutSegments returns every active segment below the layout as an array\n- They are ideal for active tabs and breadcrumbs rendered by a parent layout\n- Pass a parallelRouteKey to read the active segment inside a parallel route slot\n- Returned segments include route groups like (marketing); filter them out for display",
        keyPoints: [
          { tone: "key", title: "Segments power tabs and breadcrumbs", text: "useSelectedLayoutSegment returns the active child segment one level below the calling layout, and useSelectedLayoutSegments returns every active segment below it.", example: "aria-current={active === 'profile' ? 'page' : undefined}" },
          { tone: "tip", title: "Filter out route groups", text: "Route groups such as (shop) appear in the returned segments even though they are not in the URL. Filter them before showing breadcrumbs to users.", example: "segments.filter(s => !s.startsWith('('))" },
          { tone: "warning", title: "Layouts are Server Components", text: "These hooks need a Client Component, so create a small tabs or breadcrumbs component and render it from the layout rather than marking the whole layout 'use client'.", example: "<SettingsTabs />  // 'use client'" },
        ],
        example: "- A settings layout highlights the 'profile' tab when useSelectedLayoutSegment() === 'profile'\n- Breadcrumbs map useSelectedLayoutSegments() into links\n- useSelectedLayoutSegment('auth') reads the active page in an @auth slot\n- At the layout's own page the hook returns null",
        code: "// app/settings/layout.tsx (Server Component)\nimport { SettingsTabs } from './tabs';\n\nexport default function SettingsLayout({ children }: LayoutProps<'/settings'>) {\n  return (\n    <section>\n      <SettingsTabs />\n      {children}\n    </section>\n  );\n}\n\n// app/settings/tabs.tsx (Client Component)\n'use client';\n\nimport Link from 'next/link';\nimport { useSelectedLayoutSegment, useSelectedLayoutSegments } from 'next/navigation';\n\nconst tabs = [\n  { segment: null, label: 'Overview', href: '/settings' },\n  { segment: 'profile', label: 'Profile', href: '/settings/profile' },\n  { segment: 'billing', label: 'Billing', href: '/settings/billing' },\n];\n\nexport function SettingsTabs() {\n  const active = useSelectedLayoutSegment();\n  const trail = useSelectedLayoutSegments().filter(s => !s.startsWith('('));\n  return (\n    <nav aria-label={`Settings ${trail.join(' / ')}`}>\n      {tabs.map(tab => (\n        <Link key={tab.href} href={tab.href} aria-current={active === tab.segment ? 'page' : undefined}>\n          {tab.label}\n        </Link>\n      ))}\n    </nav>\n  );\n}",
        apiReference: [
          {
            name: "useSelectedLayoutSegment",
            kind: "hook (next/navigation)",
            signature: "const segment: string | null = useSelectedLayoutSegment(parallelRouteKey?)",
            params: [{ name: "parallelRouteKey", type: "string", description: "Read the active segment inside a named parallel route slot." }],
            returns: "The active child segment one level down, or null at the layout's own page.",
          },
          {
            name: "useSelectedLayoutSegments",
            kind: "hook (next/navigation)",
            signature: "const segments: string[] = useSelectedLayoutSegments(parallelRouteKey?)",
            params: [],
            returns: "All active segments below the calling layout; catch-all segments are joined into one string.",
          },
        ],
        exercise: "- Build tabs for a /settings section that highlight the active child page\n- Render breadcrumbs from useSelectedLayoutSegments, skipping route groups\n- Read the active page of a parallel route slot",
        checkpoint: "- What does useSelectedLayoutSegment return at the layout's own page?\n- How are catch-all segments returned?\n- Why must these hooks live in a client component?",
        mistake: "- Do not compare usePathname strings for tabs when a segment hook is simpler\n- Do not show route group names like (shop) to users\n- Do not forget Suspense for dynamic routes with cacheComponents",
      },
      {
        title: "useReportWebVitals and useOffline",
        diagram: {
          kind: "flow",
          caption: "Real-user monitoring and resilience: report every Core Web Vital to analytics, and let an experimental flag retry blocked requests when the network drops.",
          items: [
            { label: "<WebVitals /> in the root layout", detail: "a tiny client component" },
            { label: "useReportWebVitals(callback)", detail: "metrics: TTFB, FCP, LCP, CLS, INP" },
            { label: "navigator.sendBeacon(url, body)", detail: "survives page unload" },
            { label: "experimental.useOffline: true", detail: "detects connectivity, retries requests" },
            { label: "useOffline() -> boolean", detail: "render an offline banner" },
          ],
        },
        explanation: "- useReportWebVitals (next/web-vitals) calls your function with each metric: name, value, rating, delta, id\n- Keep the callback reference stable so metrics are not reported twice\n- Put it in its own client component so the root layout stays a Server Component\n- useOffline (next/offline) returns true while the app is offline\n- useOffline needs experimental.useOffline in next.config; without it the hook always returns false",
        keyPoints: [
          { tone: "key", title: "Measure real users with web vitals", text: "useReportWebVitals passes every metric (LCP, CLS, INP, TTFB, FCP) with a value and a rating of good, needs-improvement or poor, ready to send to analytics.", example: "if (metric.rating === 'poor') report(metric)" },
          { tone: "tip", title: "Send metrics with sendBeacon", text: "navigator.sendBeacon survives page unload, so metrics reach your endpoint even as the user leaves. Fall back to fetch with keepalive, and keep the callback reference stable.", example: "navigator.sendBeacon('/api/vitals', body)" },
          { tone: "warning", title: "useOffline needs an experimental flag", text: "Without experimental.useOffline in next.config, the hook always returns false. It also starts false on the server and before hydration, so treat it as a progressive enhancement.", example: "experimental: { useOffline: true }" },
        ],
        example: "- metric.name === 'LCP' && metric.rating === 'poor' flags a slow page\n- sendBeacon('/api/vitals', JSON.stringify(metric)) posts to your analytics endpoint\n- if (useOffline()) show 'You are offline. Some content may be unavailable.'\n- module.exports = { experimental: { useOffline: true } }",
        code: "// app/web-vitals.tsx\n'use client';\n\nimport { useReportWebVitals } from 'next/web-vitals';\n\ntype Report = Parameters<typeof useReportWebVitals>[0];\n\nconst report: Report = metric => {        // stable reference: defined once\n  const body = JSON.stringify({ name: metric.name, value: metric.value, rating: metric.rating, id: metric.id });\n  if (!navigator.sendBeacon?.('/api/vitals', body)) {\n    fetch('/api/vitals', { body, method: 'POST', keepalive: true });\n  }\n};\n\nexport function WebVitals() {\n  useReportWebVitals(report);\n  return null;\n}\n\n// app/offline-banner.tsx\n'use client';\n\nimport { useOffline } from 'next/offline';\n\nexport function OfflineBanner() {\n  const isOffline = useOffline();\n  if (!isOffline) return null;\n  return <div role=\"status\">You are offline. Some content may be unavailable.</div>;\n}\n\n// next.config.ts\n// export default { experimental: { useOffline: true } };",
        apiReference: [
          {
            name: "useReportWebVitals",
            kind: "hook (next/web-vitals)",
            signature: "useReportWebVitals((metric: { id, name, value, delta, rating, entries, navigationType }) => void)",
            params: [{ name: "callback", type: "function", description: "Called with each metric; keep its reference stable." }],
            returns: "undefined",
          },
          {
            name: "useOffline",
            kind: "hook (next/offline, experimental)",
            signature: "const isOffline: boolean = useOffline()",
            params: [],
            returns: "true when a request failed or the browser fired an offline event; false online, on the server and before hydration.",
            notes: "Requires experimental.useOffline: true, which also retries blocked navigation, prefetch and Server Action requests.",
          },
        ],
        exercise: "- Report web vitals to the console, then to an API route\n- Build an offline banner and test it with the browser's offline mode\n- Chart LCP ratings from a day of collected metrics",
        checkpoint: "- Why keep the web-vitals callback reference stable?\n- What happens if useOffline is used without the config flag?\n- Why put these hooks in separate small components?",
        mistake: "- Do not define the report callback inline in a component that re-renders\n- Do not rely on useOffline in production without testing the experimental flag\n- Do not send metrics with fetch alone; it may be cancelled on unload",
      },
      {
        title: "React hooks with Next.js Server Functions",
        diagram: {
          kind: "flow",
          caption: "Forms in the App Router: a Server Function handles the mutation on the server, and React 19 hooks give the client pending, optimistic and result states.",
          items: [
            { label: "'use server' function", detail: "validates input, writes data, revalidates" },
            { label: "useActionState(action, initialState)", detail: "wraps it for the form" },
            { label: "<form action={formAction}>", detail: "works before JavaScript loads" },
            { label: "useFormStatus in the submit button", detail: "pending UI" },
            { label: "State returns to the client", detail: "errors or success message" },
          ],
        },
        explanation: "- A Server Function (marked 'use server') runs on the server and can be passed to a form's action\n- useActionState wraps it to receive (previousState, formData) and return the next state\n- useFormStatus lets a nested submit button show a pending state\n- useOptimistic shows the expected result immediately while the Server Function runs\n- Revalidate or refresh after the mutation so Server Components show the new data",
        keyPoints: [
          { tone: "key", title: "Server Functions are public endpoints", text: "Anyone can call a function marked 'use server'. Authenticate, authorise and validate input inside it every time, exactly as you would for an API route.", example: "const user = await requireUser()" },
          { tone: "tip", title: "Pair actions with React form hooks", text: "useActionState wraps a Server Function for a form and returns its latest result, useFormStatus shows pending state in the submit button, and useOptimistic shows the expected outcome immediately.", example: "const [state, formAction] = useActionState(updateName, { error: null })" },
          { tone: "warning", title: "Revalidate after writing", text: "A mutation does not refresh cached server output by itself. Call revalidatePath or revalidateTag after writing so Server Components show the new data.", example: "revalidatePath('/profile')" },
        ],
        example: "- export async function updateName(prev, formData) { 'use server'; ... }\n- const [state, formAction, isPending] = useActionState(updateName, { error: null })\n- <SubmitButton /> reads useFormStatus().pending\n- revalidatePath('/profile') refreshes the page's server data after saving",
        code: "// app/profile/actions.ts\n'use server';\n\nimport { revalidatePath } from 'next/cache';\nimport { z } from 'zod';\n\nconst Name = z.string().trim().min(2).max(60);\n\nexport async function updateName(_prev: { error: string | null }, formData: FormData) {\n  const user = await requireUser();                 // authenticate every call\n  const parsed = Name.safeParse(formData.get('name'));\n  if (!parsed.success) return { error: 'Name must be 2–60 characters.' };\n  await db.user.update({ where: { id: user.id }, data: { name: parsed.data } });\n  revalidatePath('/profile');\n  return { error: null };\n}\n\n// app/profile/name-form.tsx\n'use client';\n\nimport { useActionState } from 'react';\nimport { useFormStatus } from 'react-dom';\nimport { updateName } from './actions';\n\nfunction SubmitButton() {\n  const { pending } = useFormStatus();\n  return <button disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>;\n}\n\nexport function NameForm({ current }: { current: string }) {\n  const [state, formAction] = useActionState(updateName, { error: null });\n  return (\n    <form action={formAction}>\n      <label>Name <input name=\"name\" defaultValue={current} /></label>\n      <SubmitButton />\n      {state.error && <p role=\"alert\">{state.error}</p>}\n    </form>\n  );\n}",
        exercise: "- Build a profile form with a Server Function and useActionState\n- Add server-side validation that returns field errors\n- Make a like button optimistic with useOptimistic",
        checkpoint: "- Why is a Server Function a public endpoint?\n- What arguments does the wrapped action receive?\n- How does the page show fresh data after the mutation?",
        mistake: "- Do not trust the client: validate inside the Server Function\n- Do not return class instances or functions from the action\n- Do not forget to revalidate after writing data",
        interview: [
          {
            question: "Which Next.js hooks work in Server Components?",
            definition: "None: Next.js hooks such as useRouter and usePathname are Client Component hooks.",
            answer: "Server Components cannot use hooks at all. They receive route information through props instead: await props.params for dynamic segments and await props.searchParams for the query string in Next.js 16. For interactivity, create a small Client Component ('use client') that calls usePathname, useSearchParams, useParams, useRouter or the others, and render it from the server tree.",
            similar: [
              { question: "What does router.refresh() do?", answer: "It re-requests the current route from the server and merges the new Server Component output without losing client state." },
              { question: "When does useLinkStatus report pending?", answer: "Between clicking a <Link> and the history update, typically when the route was not prefetched." },
            ],
          },
        ],
      },
    ],
    project: "Build a 'Course catalogue' in Next.js 16: a server page reading await searchParams for filters, a client SortSelect updating the URL with useSearchParams and router.replace inside Suspense, category tabs in a layout driven by useSelectedLayoutSegment, breadcrumbs from useSelectedLayoutSegments, nav links with useLinkStatus hints, an enrol form powered by a Server Function with useActionState and useFormStatus, a WebVitals reporter, and an offline banner behind experimental.useOffline.",
    summary: "- Next.js hooks run only in Client Components; Server Components use params and searchParams props\n- usePathname, useSearchParams and useParams read the URL; copy search params before editing\n- useRouter pushes, replaces, refreshes and prefetches; prefer <Link>; useLinkStatus shows pending links\n- useSelectedLayoutSegment(s) power active tabs and breadcrumbs from layouts\n- useReportWebVitals measures real users; useOffline (experimental) handles connectivity\n- Server Functions pair with useActionState, useFormStatus and useOptimistic for forms",
    glossary: [
      { term: "Client Component", definition: "A component in a 'use client' module that can use state, effects and hooks in the browser." },
      { term: "Server Component", definition: "The App Router default: renders on the server and receives route data through props." },
      { term: "Search params", definition: "The URL query string, read with useSearchParams on the client or the searchParams prop on the server." },
      { term: "Dynamic segment", definition: "A route folder in square brackets, like [slug], whose value comes from the URL." },
      { term: "Layout segment", definition: "A route segment below a layout, reported by useSelectedLayoutSegment(s)." },
      { term: "Prefetching", definition: "Loading a route's data in the background before the user navigates to it." },
      { term: "Core Web Vitals", definition: "User-experience metrics such as LCP, CLS and INP reported by useReportWebVitals." },
      { term: "Server Function", definition: "An async function marked 'use server' that the client can call, e.g. as a form action." },
      { term: "Cache Components", definition: "Next.js 16's caching model; URL hooks may need Suspense on dynamic routes when it is enabled." },
    ],
    sources: [
      source("https://nextjs.org/docs/app/api-reference/functions/use-pathname", "usePathname"),
      source("https://nextjs.org/docs/app/api-reference/functions/use-search-params", "useSearchParams"),
      source("https://nextjs.org/docs/app/api-reference/functions/use-params", "useParams"),
      source("https://nextjs.org/docs/app/api-reference/functions/use-router", "useRouter"),
      source("https://nextjs.org/docs/app/api-reference/functions/use-link-status", "useLinkStatus"),
      source("https://nextjs.org/docs/app/api-reference/functions/use-selected-layout-segment", "useSelectedLayoutSegment"),
      source("https://nextjs.org/docs/app/api-reference/functions/use-selected-layout-segments", "useSelectedLayoutSegments"),
      source("https://nextjs.org/docs/app/api-reference/functions/use-report-web-vitals", "useReportWebVitals"),
      source("https://nextjs.org/docs/app/api-reference/functions/use-offline", "useOffline"),
      source("https://nextjs.org/docs/app/getting-started/updating-data", "Updating Data (Server Functions)"),
    ],
  },
};

export const NEXTJS_HOOKS_CORE = guide.curriculum;
export default { ...guide, version: 2, curriculum: { ...guide.curriculum, title: "Next.js 16 Hooks", minutes: guide.curriculum.minutes + NEXT_HOOK_LESSONS.length * 5, lessons: [...guide.curriculum.lessons, ...NEXT_HOOK_LESSONS] } } satisfies TechnologyGuide;
