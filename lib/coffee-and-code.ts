import { learningImageUrl } from "./learning-image";

/*
 * Coffee & Code: short, practical engineering articles in the Learning Dashboard. Each post is a list of typed
 * blocks (paragraphs, headings, code, questions and answers, images, callouts, lists, quotes), so a card can show
 * a preview and the article page can render every kind of block. Super Admin edits and removals apply through
 * content overrides (keys "blog:<slug>", fields named after the block, e.g. "blocks.3.text").
 *
 * Zod-free and server-safe; the article bodies are static, so the dashboard ships only the posts it renders.
 */
export type BlogTone = "mint" | "sky" | "butter" | "rose" | "lavender" | "peach" | "sage" | "sand";
export type BlogLanguage = "typescript" | "tsx" | "javascript" | "python" | "bash" | "json";
export type BlogBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "code"; language: BlogLanguage; code: string; caption?: string }
  | { kind: "qa"; question: string; answer: string }
  | { kind: "image"; src: string | null; alt: string; caption: string }
  | { kind: "callout"; tone: "tip" | "warning" | "note"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "quote"; text: string; cite?: string };
export type BlogPost = {
  slug: string; title: string; dek: string; topic: string; techId: string; tone: BlogTone;
  author: string; published: string; minutes: number; tags: string[]; blocks: BlogBlock[];
};

const cover = (techId: string) => learningImageUrl("topics", ["interview", techId]);

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "useeffect-is-not-a-lifecycle", title: "useEffect is not a lifecycle method", topic: "React", techId: "react", tone: "sky",
    dek: "Most bugs with useEffect come from using it to compute values. Effects are for syncing with things outside React.",
    author: "MasterClass team", published: "2026-10-14", minutes: 6, tags: ["React", "Hooks", "Performance"],
    blocks: [
      { kind: "paragraph", text: "If you came to React from class components, it is tempting to read useEffect as componentDidMount plus componentDidUpdate. That mental model leads to extra renders, flickering values and effects that fight each other." },
      { kind: "heading", text: "Derived values do not need an effect" },
      { kind: "paragraph", text: "When a value can be calculated from props or state, calculate it during render. Storing it in state and syncing it with an effect renders twice and can show a stale value in between." },
      { kind: "code", language: "tsx", caption: "Before: an effect copies derived data into state.", code: "function Cart({ items }: { items: Item[] }) {\n  const [total, setTotal] = useState(0);\n  useEffect(() => {\n    setTotal(items.reduce((sum, item) => sum + item.price, 0));\n  }, [items]);\n  return <p>Total: ₹{total}</p>;\n}" },
      { kind: "code", language: "tsx", caption: "After: compute it while rendering. One render, never stale.", code: "function Cart({ items }: { items: Item[] }) {\n  const total = items.reduce((sum, item) => sum + item.price, 0);\n  return <p>Total: ₹{total}</p>;\n}" },
      { kind: "callout", tone: "tip", text: "If the calculation is genuinely expensive, wrap it in useMemo. With the React Compiler enabled, even that is usually unnecessary." },
      { kind: "heading", text: "What effects are for" },
      { kind: "list", items: ["Subscribing to a browser API such as resize or online events", "Connecting to a WebSocket or a third-party widget", "Sending analytics after something appeared on screen"] },
      { kind: "qa", question: "Should I fetch data in useEffect?", answer: "You can, but you then handle race conditions, caching and loading states yourself. In Next.js, fetch in a Server Component; in a client app, use a data library such as TanStack Query." },
      { kind: "qa", question: "Why does my effect run twice in development?", answer: "React Strict Mode mounts, unmounts and remounts components in development to check that every effect cleans up after itself. If the double run causes a bug, the cleanup function is missing." },
      { kind: "image", src: cover("react"), alt: "Illustration of React components exchanging data", caption: "Render computes what to show; effects only reach outside React." },
    ],
  },
  {
    slug: "server-and-client-components", title: "Where to put 'use client' in a Next.js app", topic: "Next.js", techId: "nextjs", tone: "mint",
    dek: "Every component is a Server Component until you opt out. Put the boundary as low in the tree as you can.",
    author: "MasterClass team", published: "2026-10-12", minutes: 7, tags: ["Next.js", "React", "Architecture"],
    blocks: [
      { kind: "paragraph", text: "In the App Router, components render on the server by default. They can read databases and secrets directly and send no JavaScript to the browser. A 'use client' directive marks the point where code starts shipping to the browser." },
      { kind: "heading", text: "Keep the interactive part small" },
      { kind: "paragraph", text: "A common mistake is adding 'use client' to a whole page because one button needs onClick. Everything that page imports then becomes client code. Move the button into its own file instead." },
      { kind: "code", language: "tsx", caption: "app/products/[id]/page.tsx stays a Server Component.", code: "import { AddToCart } from \"./add-to-cart\";\nimport { getProduct } from \"@/lib/products\";\n\nexport default async function Page({ params }: { params: Promise<{ id: string }> }) {\n  const { id } = await params;\n  const product = await getProduct(id);\n  return <article>\n    <h1>{product.name}</h1>\n    <p>{product.description}</p>\n    <AddToCart id={product.id} />\n  </article>;\n}" },
      { kind: "code", language: "tsx", caption: "add-to-cart.tsx is the only client code on the page.", code: "\"use client\";\nimport { useState } from \"react\";\n\nexport function AddToCart({ id }: { id: string }) {\n  const [added, setAdded] = useState(false);\n  return <button onClick={() => setAdded(true)} disabled={added}>\n    {added ? \"Added\" : \"Add to cart\"}\n  </button>;\n}" },
      { kind: "callout", tone: "warning", text: "Props passed from a Server Component to a Client Component must be serializable: plain data, not functions or class instances." },
      { kind: "qa", question: "Can a Client Component render a Server Component?", answer: "Not by importing it, but it can receive one as children. The server renders it and passes the result through the client component." },
      { kind: "qa", question: "Does 'use client' mean the component skips server rendering?", answer: "No. Client Components are still rendered to HTML on the server for the first load; the directive means their code is also sent to the browser to hydrate." },
      { kind: "image", src: cover("nextjs"), alt: "Illustration of a Next.js page split between server and browser", caption: "The server does the data work; the browser only gets what must be interactive." },
    ],
  },
  {
    slug: "closures-in-five-minutes", title: "JavaScript closures in five minutes", topic: "JavaScript", techId: "javascript", tone: "butter",
    dek: "A closure is a function that remembers the variables from where it was created. Here is why that matters.",
    author: "MasterClass team", published: "2026-10-10", minutes: 5, tags: ["JavaScript", "Fundamentals", "Interview"],
    blocks: [
      { kind: "paragraph", text: "Every function in JavaScript keeps a reference to the scope it was defined in. When the outer function returns, its variables stay alive for as long as an inner function still needs them. That is a closure." },
      { kind: "code", language: "javascript", caption: "Each counter keeps its own private count.", code: "function createCounter() {\n  let count = 0;\n  return () => {\n    count += 1;\n    return count;\n  };\n}\n\nconst a = createCounter();\nconst b = createCounter();\na(); // 1\na(); // 2\nb(); // 1" },
      { kind: "heading", text: "The classic loop question" },
      { kind: "code", language: "javascript", caption: "var shares one binding across the loop; let creates a new one per iteration.", code: "for (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i)); // 3, 3, 3\n}\n\nfor (let j = 0; j < 3; j++) {\n  setTimeout(() => console.log(j)); // 0, 1, 2\n}" },
      { kind: "qa", question: "Why does the var loop print 3 three times?", answer: "var is function-scoped, so all three callbacks close over the same i. By the time they run, the loop has finished and i is 3. let gives each iteration its own binding." },
      { kind: "qa", question: "Where do closures show up in real code?", answer: "Event handlers, React hooks (a stale value in useEffect is a closure over an old render), memoization helpers, and module patterns that keep state private." },
      { kind: "callout", tone: "note", text: "A closure keeps the whole variable alive, not a copy of its value. Change the variable later and the function sees the new value." },
      { kind: "image", src: cover("javascript"), alt: "Illustration of nested JavaScript scopes", caption: "Inner functions carry their surrounding scope with them." },
    ],
  },
  {
    slug: "python-async-without-confusion", title: "Python async and await without the confusion", topic: "Python", techId: "python", tone: "lavender",
    dek: "async code is fast only when tasks wait at the same time. asyncio.gather is how you make that happen.",
    author: "MasterClass team", published: "2026-10-08", minutes: 6, tags: ["Python", "asyncio", "Performance"],
    blocks: [
      { kind: "paragraph", text: "Marking a function async does not make it faster. It lets the event loop run something else while that function waits on the network or disk. The speed-up comes from waiting on several things at once." },
      { kind: "code", language: "python", caption: "Sequential: about three seconds in total.", code: "import asyncio\n\nasync def fetch(name: str, seconds: float) -> str:\n    await asyncio.sleep(seconds)  # stands in for a network call\n    return name\n\nasync def main() -> None:\n    for name in (\"users\", \"orders\", \"stock\"):\n        print(await fetch(name, 1))\n\nasyncio.run(main())" },
      { kind: "code", language: "python", caption: "Concurrent: about one second, because the waits overlap.", code: "async def main() -> None:\n    results = await asyncio.gather(\n        fetch(\"users\", 1),\n        fetch(\"orders\", 1),\n        fetch(\"stock\", 1),\n    )\n    print(results)  # ['users', 'orders', 'stock']\n\nasyncio.run(main())" },
      { kind: "callout", tone: "warning", text: "Calling a blocking function such as time.sleep or a synchronous HTTP client inside async code freezes the whole event loop. Use the async version, or asyncio.to_thread." },
      { kind: "qa", question: "When should I use threads or processes instead?", answer: "Use asyncio for many slow I/O waits, threads for blocking libraries you cannot change, and processes (multiprocessing) for CPU-heavy work, which async does not speed up." },
      { kind: "qa", question: "What does gather do if one task fails?", answer: "By default the first exception is raised from gather and the other tasks keep running. Pass return_exceptions=True to get exceptions back as results instead." },
      { kind: "image", src: cover("python"), alt: "Illustration of Python tasks running on an event loop", caption: "One event loop, many waits in flight." },
    ],
  },
  {
    slug: "rebase-or-merge", title: "Git rebase or merge? A rule you can remember", topic: "Git", techId: "git", tone: "peach",
    dek: "Rebase your own unshared work to keep history clean; merge shared branches so nobody's history is rewritten.",
    author: "MasterClass team", published: "2026-10-06", minutes: 5, tags: ["Git", "Workflow", "Teamwork"],
    blocks: [
      { kind: "paragraph", text: "Both commands bring changes from one branch into another. Merge records that two histories joined. Rebase replays your commits on top of the other branch, as if you had started from there." },
      { kind: "code", language: "bash", caption: "Update a feature branch that only you work on.", code: "git switch feature/login\ngit fetch origin\ngit rebase origin/main\n# fix any conflicts, then\ngit push --force-with-lease" },
      { kind: "code", language: "bash", caption: "Bring a shared branch up to date without rewriting it.", code: "git switch release/2.4\ngit merge origin/main" },
      { kind: "callout", tone: "warning", text: "Never rebase commits that teammates have already pulled. Rebasing rewrites commit ids, and their copies will no longer match yours." },
      { kind: "qa", question: "Why --force-with-lease instead of --force?", answer: "It refuses to overwrite the remote branch if someone else pushed to it since your last fetch, so you cannot silently delete their work." },
      { kind: "qa", question: "What does interactive rebase add?", answer: "git rebase -i lets you squash, reorder, reword or drop commits before you open a pull request, so reviewers see a tidy story." },
      { kind: "list", items: ["Your own branch, not pushed or not shared: rebase", "A branch others build on: merge", "Cleaning up before review: interactive rebase"] },
      { kind: "image", src: cover("git"), alt: "Illustration of Git branches being combined", caption: "Same changes, two different histories." },
    ],
  },
  {
    slug: "typescript-narrowing", title: "Let TypeScript prove it: narrowing in practice", topic: "TypeScript", techId: "typescript", tone: "rose",
    dek: "Instead of casting with 'as', write checks the compiler understands. Then the types follow your logic.",
    author: "MasterClass team", published: "2026-10-04", minutes: 6, tags: ["TypeScript", "Types", "Safety"],
    blocks: [
      { kind: "paragraph", text: "Narrowing is how TypeScript turns a wide type into a precise one inside an if block. typeof, in, instanceof and equality checks all narrow. A cast with 'as' does not check anything; it only silences the compiler." },
      { kind: "heading", text: "Discriminated unions" },
      { kind: "code", language: "typescript", caption: "A shared 'status' field tells TypeScript which shape it has.", code: "type Result =\n  | { status: \"ok\"; data: string[] }\n  | { status: \"error\"; message: string };\n\nfunction render(result: Result) {\n  if (result.status === \"ok\") {\n    return result.data.join(\", \"); // data exists here\n  }\n  return `Failed: ${result.message}`; // message exists here\n}" },
      { kind: "heading", text: "Make missing cases a compile error" },
      { kind: "code", language: "typescript", caption: "Add a new status and this function stops compiling until you handle it.", code: "function label(result: Result): string {\n  switch (result.status) {\n    case \"ok\": return \"Loaded\";\n    case \"error\": return \"Failed\";\n    default: {\n      const unreachable: never = result;\n      return unreachable;\n    }\n  }\n}" },
      { kind: "qa", question: "When is 'as' acceptable?", answer: "When you know more than the compiler can, for example right after validating data with a schema library. Even then, a type guard function is safer because it does the check." },
      { kind: "qa", question: "What is a type guard?", answer: "A function whose return type is 'value is T'. When it returns true, TypeScript narrows the argument to T in the calling code." },
      { kind: "callout", tone: "tip", text: "Validate external data (API responses, form input) at the boundary with a schema, then let narrowing carry the types through the rest of the code." },
      { kind: "image", src: cover("typescript"), alt: "Illustration of types being checked", caption: "Checks the compiler can follow beat casts it has to trust." },
    ],
  },
  {
    slug: "rate-limiter-token-bucket", title: "Design a rate limiter with a token bucket", topic: "System design", techId: "system-design", tone: "sage",
    dek: "A classic interview question with a small, real implementation: refill tokens over time, spend one per request.",
    author: "MasterClass team", published: "2026-10-02", minutes: 8, tags: ["System design", "Interview", "APIs"],
    blocks: [
      { kind: "paragraph", text: "A rate limiter protects an API from bursts and abuse. The token bucket is popular because it allows short bursts while holding a steady average rate." },
      { kind: "list", items: ["Each client has a bucket with a maximum number of tokens", "Tokens refill at a fixed rate", "A request spends one token, or is rejected with HTTP 429 when the bucket is empty"] },
      { kind: "code", language: "typescript", caption: "An in-memory bucket per client. Fine for one server; see below for many.", code: "type Bucket = { tokens: number; updated: number };\nconst buckets = new Map<string, Bucket>();\n\nexport function allow(client: string, capacity = 10, perSecond = 2): boolean {\n  const now = Date.now();\n  const bucket = buckets.get(client) ?? { tokens: capacity, updated: now };\n  const refill = ((now - bucket.updated) / 1000) * perSecond;\n  bucket.tokens = Math.min(capacity, bucket.tokens + refill);\n  bucket.updated = now;\n  if (bucket.tokens < 1) { buckets.set(client, bucket); return false; }\n  bucket.tokens -= 1;\n  buckets.set(client, bucket);\n  return true;\n}" },
      { kind: "heading", text: "Scaling past one server" },
      { kind: "paragraph", text: "With several servers, each would keep its own buckets and a client could multiply its limit. Store the bucket in a shared store such as Redis, and update it atomically with a Lua script or a database function so two requests cannot spend the same token." },
      { kind: "qa", question: "Token bucket or fixed window?", answer: "A fixed window (100 requests per minute) is simpler but allows a double burst at the window edge. The token bucket smooths that out at the cost of storing a timestamp per client." },
      { kind: "qa", question: "What should the client see when limited?", answer: "HTTP 429 Too Many Requests with a Retry-After header, so well-behaved clients know when to try again." },
      { kind: "callout", tone: "note", text: "Key the bucket by what you want to limit: an API key, a signed-in user id, or an IP address for anonymous traffic." },
      { kind: "image", src: cover("system-design"), alt: "Illustration of requests flowing through a rate limiter", caption: "Bursts are absorbed; the average rate holds." },
    ],
  },
  {
    slug: "redis-cache-aside", title: "Caching with Redis: the cache-aside pattern", topic: "Redis", techId: "redis", tone: "sand",
    dek: "Read from the cache first, fall back to the database, then store the result with an expiry. Simple, and it scales.",
    author: "MasterClass team", published: "2026-09-30", minutes: 6, tags: ["Redis", "Caching", "Backend"],
    blocks: [
      { kind: "paragraph", text: "Cache-aside (also called lazy loading) keeps the application in charge: the cache only holds what was actually requested, and an expiry stops it from serving old data forever." },
      { kind: "code", language: "typescript", caption: "node-redis v4: get, fall back, then set with an expiry in seconds.", code: "import { createClient } from \"redis\";\n\nconst redis = await createClient({ url: process.env.REDIS_URL }).connect();\n\nexport async function getProduct(id: string) {\n  const key = `product:${id}`;\n  const cached = await redis.get(key);\n  if (cached) return JSON.parse(cached);\n\n  const product = await db.product.findUnique({ where: { id } });\n  if (product) await redis.set(key, JSON.stringify(product), { EX: 300 });\n  return product;\n}" },
      { kind: "heading", text: "Keep the cache honest" },
      { kind: "paragraph", text: "When a product changes, delete its key. The next read reloads fresh data. Deleting is safer than writing the new value, because two concurrent updates cannot leave the older one in the cache." },
      { kind: "code", language: "typescript", caption: "Invalidate after a successful write.", code: "export async function updateProduct(id: string, changes: Partial<Product>) {\n  const product = await db.product.update({ where: { id }, data: changes });\n  await redis.del(`product:${id}`);\n  return product;\n}" },
      { kind: "qa", question: "What is a cache stampede?", answer: "When a popular key expires, many requests miss at once and all hit the database. Add a little random jitter to expiry times, or let one request rebuild the value while others wait briefly." },
      { kind: "qa", question: "What should not be cached?", answer: "Data that must be exact at every read, such as account balances, and anything personal unless the key includes the user and the expiry is short." },
      { kind: "callout", tone: "tip", text: "Always set an expiry. A cache without one slowly turns into a second, out-of-date database." },
      { kind: "image", src: cover("redis"), alt: "Illustration of an application reading from a cache before the database", caption: "Hit the cache first; fall back to the source of truth." },
    ],
  },
];

export const BLOG_TOPICS = [...new Set(BLOG_POSTS.map(post => post.topic))];
export const blogPost = (slug: string) => BLOG_POSTS.find(post => post.slug === slug) ?? null;
/** The first paragraph, for a card's preview. */
export const blogPreview = (post: BlogPost) => post.blocks.find((block): block is Extract<BlogBlock, { kind: "paragraph" }> => block.kind === "paragraph")?.text ?? post.dek;

/** What the landing page teases: card fields only, never the article bodies. */
export type BlogTeaser = Pick<BlogPost, "slug" | "title" | "dek" | "topic" | "tone" | "minutes">;
export const blogTeasers = (count = 3): BlogTeaser[] => [...BLOG_POSTS].sort((a, b) => b.published.localeCompare(a.published)).slice(0, count)
  .map(({ slug, title, dek, topic, tone, minutes }) => ({ slug, title, dek, topic, tone, minutes }));
