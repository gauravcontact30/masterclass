import type { LearningModule } from "./module";

export const NEXTJS_MODULE: LearningModule = {
  technology: "Next.js 16",
  definition: "Next.js is a React framework for building full-stack web applications: you use React Components to build the interface, and Next.js adds routing, rendering, data fetching, caching and optimizations on top, with its tooling configured for you.",
  overview: "Next.js 16 makes caching explicit and opt-in through Cache Components: pages are prerendered into a static shell, `\"use cache\"` marks the work that may be reused, and everything else streams at request time inside Suspense. Turbopack is the default bundler, `proxy.ts` replaces `middleware.ts`, React 19.2 features ship in the App Router, and `updateTag` and `refresh` complete the mutation story.",
  architecture: [
    { title: "Architecture: the App Router and React Server Components", detail: "Folders under `app/` define URL segments; `page.tsx`, `layout.tsx`, `loading.tsx` and `error.tsx` are conventions that compose nested layouts, Suspense and error boundaries. Components are Server Components by default and run only on the server, so they can read databases and secrets directly and ship no JavaScript; `\"use client\"` marks the boundary where interactive components and their imports join the client bundle." },
    { title: "Under the hood: Cache Components and streaming", detail: "With `cacheComponents: true`, Next.js prerenders each route at build time. Synchronous work and functions marked `\"use cache\"` become part of the static shell; their cache key is derived from their arguments and closed-over values, and `cacheLife` and `cacheTag` control lifetime and invalidation. Runtime data (cookies, headers, `params`, `searchParams`, uncached fetches) must sit inside `<Suspense>`, so the shell is sent immediately and those holes stream in over the same response." },
    { title: "Core building blocks: Server Functions, invalidation and proxy", detail: "Server Functions (`\"use server\"`) handle mutations from forms and events; each is a public POST endpoint, so it must validate input and authorize the caller. After a write, `updateTag` gives read-your-own-writes inside Server Actions, `revalidateTag(tag, \"max\")` marks content stale with stale-while-revalidate, and `refresh()` re-renders uncached data. `proxy.ts` runs before routing for redirects, rewrites and coarse auth checks." },
  ],
  code: [
    { path: "next.config.ts", code: `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,   // opt-in caching with "use cache" + streaming by default
};

export default nextConfig;` },
    { path: "app/products/[id]/page.tsx", note: "A cached product with a live stock count", code: `import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";

async function getProduct(id: string) {
  "use cache";                        // cached; the key includes the id argument
  cacheLife("hours");
  cacheTag(\`product-\${id}\`);          // lets a mutation invalidate exactly this entry
  const res = await fetch(\`https://api.example.com/products/\${id}\`);
  return (await res.json()) as { name: string; price: number };
}

async function Product({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;        // params are runtime data
  const product = await getProduct(id);
  return <h1>{product.name} · \${product.price}</h1>;
}

async function Stock({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(\`https://api.example.com/stock/\${id}\`); // uncached: streams per request
  const { count } = await res.json();
  return <p>{count} in stock</p>;
}

export default function Page({ params }: PageProps<"/products/[id]">) {
  return (
    <main>
      <Suspense fallback={<p>Loading product…</p>}><Product params={params} /></Suspense>
      <Suspense fallback={<p>Checking stock…</p>}><Stock params={params} /></Suspense>
    </main>
  );
}` },
    { path: "app/products/actions.ts", note: "A mutation with read-your-own-writes", code: `"use server";
import { updateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function updatePrice(id: string, price: number) {
  const session = await auth();                       // every Server Function is a public endpoint
  if (!session?.user.isAdmin) throw new Error("Forbidden");
  if (!Number.isFinite(price) || price <= 0) throw new Error("Invalid price");

  await db.product.update({ where: { id }, data: { price } });
  updateTag(\`product-\${id}\`);                        // the admin sees the new price immediately
}` },
    { path: "proxy.ts", note: "Replaces middleware.ts in Next.js 16", code: `import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  if (!request.cookies.has("session")) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
}

export const config = { matcher: ["/dashboard/:path*"] };` },
  ],
  problem: { title: "Choosing between fast static pages and fresh dynamic data", scenario: "Building a React app from scratch means assembling routing, server rendering, bundling, code splitting, image and font optimization and an API layer yourself, then deciding page by page whether it is static (fast but stale) or dynamic (fresh but slow). Earlier Next.js versions cached implicitly, which surprised teams with stale data. Next.js 16 provides the full stack with zero configuration and, through Cache Components, lets one route mix a cached static shell with streamed personal or live data, with caching only where the code says `\"use cache\"`." },
  useCases: [
    { title: "E-commerce product and category pages", scenario: "Product details and category listings are cached with `\"use cache\"` and tagged per product, so they load from the static shell, while price, stock and the signed-in user's cart stream in through Suspense. An admin price change calls `updateTag` so the new price appears at once." },
    { title: "SaaS dashboards with authenticated data", scenario: "`proxy.ts` redirects signed-out users early, layouts render the navigation shell, and per-user panels read cookies inside Suspense boundaries. Server Functions handle settings forms with validation and authorization, and `refresh()` updates uncached widgets after a change." },
    { title: "Content and marketing sites at scale", scenario: "A publisher prerenders thousands of articles, caches CMS queries with `cacheLife(\"days\")`, and a CMS webhook calls a Route Handler that runs `revalidateTag(\"articles\", \"max\")`, so readers keep getting fast stale pages while fresh content regenerates in the background." },
  ],
  subjective: [
    { rating: "Critical for Senior Roles", question: "Explain the Cache Components model in Next.js 16. How does it differ from the caching behaviour of earlier App Router versions?", answer: "Earlier versions cached `fetch` results and whole routes implicitly, and you opted out with flags such as `dynamic = \"force-dynamic\"` or `cache: \"no-store\"`, which made staleness hard to reason about. With Cache Components, nothing is cached unless you say so: `\"use cache\"` on a function, component or file marks reusable work, its key is computed from its arguments and closure, and `cacheLife` sets stale, revalidate and expire times while `cacheTag` enables targeted invalidation. At build time Next.js prerenders a static shell from synchronous and cached work; runtime data must be read inside Suspense, so those parts stream per request. The result is one model in which a single route can be partly static and partly dynamic, replacing the old per-route static-or-dynamic choice." },
    { rating: "High / Common", question: "When do you use `updateTag`, `revalidateTag(tag, \"max\")`, `revalidateTag(tag, { expire: 0 })` and `refresh()`?", answer: "`updateTag` is for Server Actions where the user must immediately see their own write: it expires the tag and the next read waits for fresh data. `revalidateTag(tag, \"max\")` marks tagged data stale with stale-while-revalidate semantics, ideal for content where a short delay is fine, and it works in Server Actions and Route Handlers such as webhooks. `revalidateTag(tag, { expire: 0 })` is for callers outside Server Actions, like a webhook, that need the data gone immediately. `refresh()` re-renders the current page's uncached data from a Server Action without touching cached entries. The single-argument `revalidateTag(tag)` is deprecated." },
    { rating: "Common in full-stack interviews", question: "How do you decide where the Server/Client Component boundary goes, and what security responsibilities come with Server Functions?", answer: "Keep components on the server by default and push `\"use client\"` down to the smallest interactive leaves, such as a button, form control or chart, so data fetching and heavy dependencies stay off the client bundle. Props crossing the boundary must be serializable, and a Server Component can be passed into a Client Component as `children`. Every Server Function compiles to a public HTTP endpoint that anyone can call with any arguments, so each one must authenticate the user, authorize the specific action, validate its input with a schema, and avoid returning more data than the client needs. `proxy.ts` is only a first, coarse check, not a substitute for authorization next to the data." },
  ],
  objective: [
    { question: "In Next.js 16, which file replaces `middleware.ts` for request-time redirects and rewrites?", options: ["`interceptor.ts`", "`proxy.ts`", "`route.ts`", "`instrumentation.ts`"], answer: 1, explanation: "Next.js 16 renamed the middleware convention to `proxy.ts` with an exported `proxy` function. `route.ts` defines Route Handlers, `instrumentation.ts` sets up observability, and `interceptor.ts` is not a Next.js convention." },
    { question: "A Server Action updates a user's profile and the user must see the change on the next render. Which API fits best?", options: ["`revalidateTag(\"profile\", \"max\")`", "`updateTag(\"profile\")`", "`revalidatePath` from the client", "Setting `export const dynamic = \"force-dynamic\"`"], answer: 1, explanation: "`updateTag` provides read-your-own-writes inside Server Actions by expiring the tag so the next request fetches fresh data. `revalidateTag` with `\"max\"` may serve stale content first, `revalidatePath` cannot be called from the client, and route segment flags do not invalidate cached entries." },
    { question: "With `cacheComponents` enabled, a component reads `cookies()`. What does Next.js require?", options: ["Nothing; cookies are cached automatically", "The component must be inside a `<Suspense>` boundary (or the read moved there) so it can stream at request time", "The component must be a Client Component", "The route must export `revalidate = 0`"], answer: 1, explanation: "`cookies()` is runtime data, so it cannot be part of the prerendered static shell; without a Suspense boundary the dev overlay reports a blocking route. Cookies are never cached automatically, Client Components cannot call `cookies()`, and `revalidate` exports do not satisfy the Cache Components model." },
  ],
  keyPoints: [
    "Cache Components: nothing is cached unless the code says `\"use cache\"`.",
    "Runtime data such as cookies, headers and params must be read inside Suspense.",
    "Every Server Function is a public endpoint: authenticate, authorize, validate.",
    "`proxy.ts` replaces `middleware.ts`; Turbopack is the default bundler.",
  ],
  sources: [
    { title: "Next.js documentation", url: "https://nextjs.org/docs" },
    { title: "Caching with Cache Components", url: "https://nextjs.org/docs/app/getting-started/caching" },
    { title: "updateTag", url: "https://nextjs.org/docs/app/api-reference/functions/updateTag" },
    { title: "Proxy", url: "https://nextjs.org/docs/app/getting-started/proxy" },
  ],
};
