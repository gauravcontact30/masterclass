import type { LearningModule } from "./module";

export const UPSTASH_MODULE: LearningModule = {
  technology: "Upstash",
  definition: "Upstash is a serverless data platform that provides Redis, vector, search, messaging (QStash) and durable workflow services over HTTP, with pay-per-request pricing and no servers to manage.",
  overview: "Serverless and edge functions are short-lived and massively parallel, which breaks the connection-pooled TCP model that classic databases expect. Upstash is designed for that runtime: its SDKs talk to Redis over HTTP, so every invocation can connect instantly, pricing follows requests rather than provisioned instances, and QStash and Workflow add reliable background work to platforms that have no long-running processes.",
  architecture: [
    { title: "Architecture: Redis behind an HTTP API", detail: "Upstash Redis is Redis-protocol compatible and also exposes a REST API. The `@upstash/redis` SDK sends each command as an HTTPS request using `fetch`, so it works in Node.js, edge runtimes, Cloudflare Workers and any other fetch-capable runtime without connection pools. Global databases add read replicas in several regions close to users, with writes going to a primary region. Commands can be pipelined, and the SDK can auto-pipeline commands issued together." },
    { title: "Under the hood: QStash and Workflow", detail: "QStash is an HTTP message queue and scheduler: you publish a message with a destination URL, and QStash delivers it with retries, delays, cron schedules, deduplication and callbacks, signing each request so the receiver can verify it. Delivery is at-least-once, so handlers must be idempotent. Upstash Workflow builds durable functions on QStash: each `context.run` step runs as its own HTTP invocation and its result is persisted, so a long process survives timeouts and failures and resumes at the failed step." },
    { title: "Core building blocks: rate limiting, vector and search", detail: "`@upstash/ratelimit` implements fixed-window, sliding-window and token-bucket algorithms with Lua scripts on Upstash Redis, plus an in-memory ephemeral cache that blocks known-abusive identifiers without a network call, and optional analytics. Upstash Vector stores embeddings for similarity search with metadata filtering, and Upstash Search adds hosted full-text and semantic search, both reachable through the same HTTP-first SDK style." },
  ],
  code: [
    { path: "lib/upstash.ts", code: `import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from the environment.
export const redis = Redis.fromEnv();

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),   // 10 requests per rolling 10 seconds
  prefix: "ratelimit:summarize",
  analytics: true,
});` },
    { path: "app/api/summarize/route.ts", note: "Rate-limited, cached endpoint in a Next.js Route Handler", code: `import { after } from "next/server";
import { ratelimit, redis } from "@/lib/upstash";
import { summarize } from "@/lib/ai";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const { success, limit, remaining, reset, pending } = await ratelimit.limit(ip);
  after(() => pending);                     // flush analytics after the response is sent

  if (!success) {
    return Response.json({ error: "Too many requests" }, {
      status: 429,
      headers: {
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
        "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
      },
    });
  }

  const { documentId, text } = await request.json();
  const key = \`summary:\${documentId}\`;
  const cached = await redis.get<string>(key);   // values are JSON-decoded automatically
  if (cached) return Response.json({ summary: cached, cached: true });

  const summary = await summarize(text);
  await redis.set(key, summary, { ex: 60 * 60 * 24 });
  return Response.json({ summary, cached: false });
}` },
    { path: "app/api/reports/route.ts", note: "Hand slow work to QStash instead of blocking the request", code: `import { Client } from "@upstash/qstash";

const qstash = new Client({ token: process.env.QSTASH_TOKEN! });

export async function POST(request: Request) {
  const { userId } = await request.json();
  // QStash calls the worker URL with retries; the worker must verify the signature
  // and be idempotent, because delivery is at-least-once.
  await qstash.publishJSON({
    url: \`\${process.env.APP_URL}/api/jobs/build-report\`,
    body: { userId },
    retries: 3,
  });
  return Response.json({ queued: true }, { status: 202 });
}` },
  ],
  problem: { title: "Stateful infrastructure that does not fit serverless", scenario: "Serverless functions spin up by the thousand and die within seconds; opening a TCP connection to a self-hosted Redis from each one exhausts connection limits, cold-start latency grows, and an always-on cluster is paid for even at zero traffic. There is also nowhere to run retries, delays or cron jobs. Upstash replaces the connection with a stateless HTTP request, bills per request with scale to zero, and moves background delivery and durable multi-step execution into managed services the function simply calls." },
  useCases: [
    { title: "API rate limiting on serverless and edge", scenario: "A public AI endpoint on Vercel limits each API key with a sliding window in `@upstash/ratelimit`; all function instances share the same counters in Upstash Redis, abusive keys are blocked from the ephemeral cache without a network round trip, and limit headers tell clients when to retry." },
    { title: "Background jobs and schedules without a worker fleet", scenario: "A SaaS app publishes webhook fan-out, email digests and nightly report builds to QStash. QStash retries failed deliveries with backoff, runs cron schedules, deduplicates repeated messages and sends permanently failed messages to a dead-letter queue for inspection." },
    { title: "Durable AI pipelines with Workflow", scenario: "A document-processing pipeline extracts text, calls an LLM, waits for a human approval event and then emails the result. Built with Upstash Workflow, each step's result is persisted, so a model timeout retries only that step and the workflow can wait days for the approval without a running server." },
  ],
  subjective: [
    { rating: "High / Common", question: "Why does Upstash expose Redis over HTTP, and what are the trade-offs compared with a TCP Redis connection?", answer: "Serverless and edge runtimes are short-lived and highly concurrent, and some cannot open raw TCP sockets at all. A pooled TCP connection per function instance exhausts server connection limits and adds connection setup to cold starts. HTTP is stateless, works anywhere `fetch` works, and lets the platform scale clients without connection management. The trade-offs: each command carries HTTP overhead, so per-command latency is higher than a warm TCP connection in the same data centre, and blocking or long-lived commands such as Pub/Sub subscriptions do not fit request-response. Mitigate with pipelining or auto-pipelining, `MGET` and similar batch commands, colocating the database region with the functions, and read replicas in global databases." },
    { rating: "Critical for Senior Roles", question: "QStash guarantees at-least-once delivery. How do you build a correct and secure consumer?", answer: "First verify every request: QStash signs deliveries, and the receiver checks the `Upstash-Signature` header with the current and next signing keys (the SDK's `Receiver` or the framework helper does this) before trusting the body; otherwise anyone could call the endpoint. Second, make the handler idempotent, because retries and duplicate deliveries happen: key work on a message or business ID, record completion (for example `SET done:<id> 1 NX` in Redis or a unique database constraint) and return success for duplicates. Return 2xx only after the work is durably done, so failures are retried; return errors for transient failures and rely on retries with backoff. Route permanently failing messages to the dead-letter queue and alert on it, and use deduplication IDs on publish when the producer may send twice." },
    { rating: "Common in system-design rounds", question: "Compare fixed-window, sliding-window and token-bucket rate limiting, and explain how you would rate-limit across regions.", answer: "Fixed window counts requests per clock window; it is cheapest but allows up to twice the limit around a window boundary. Sliding window weights the previous window's count to approximate a rolling window, smoothing that burst at slightly higher cost. Token bucket refills tokens at a steady rate up to a capacity, allowing controlled bursts while enforcing an average rate, which suits APIs with bursty clients. Across regions, a single-region database adds latency for distant users; Upstash's multi-region rate limiter keeps local state per region and synchronizes asynchronously, trading strict accuracy for low latency. Choose the identifier carefully (API key or user ID beats IP behind shared NATs) and add an ephemeral cache to shed repeat abusers cheaply." },
  ],
  objective: [
    { question: "Why does `@upstash/redis` work in edge runtimes where a classic Redis client does not?", options: ["It keeps a persistent TCP pool in a global variable", "It sends each command as an HTTP request with `fetch`, needing no long-lived socket", "It caches all data in the browser", "It compiles Redis to WebAssembly inside the function"], answer: 1, explanation: "The SDK is a thin HTTP client over Upstash's REST API, so it runs anywhere `fetch` is available. Edge runtimes cannot hold raw TCP pools, the data is not cached in the browser, and Redis is not embedded in the function." },
    { question: "What delivery guarantee does QStash provide, and what does it imply for your handler?", options: ["Exactly-once; no special handling is needed", "At-most-once; failures are dropped silently", "At-least-once; handlers must be idempotent and verify signatures", "Best-effort with no retries"], answer: 2, explanation: "QStash retries until it gets a successful response, so a message can arrive more than once; idempotent handlers make duplicates harmless and signature verification blocks forged calls. It is not exactly-once, and failed deliveries are retried and dead-lettered rather than dropped." },
    { question: "Which rate-limiting algorithm in `@upstash/ratelimit` is designed to allow short bursts while enforcing a steady average rate?", options: ["Fixed window", "Sliding window", "Token bucket", "Round robin"], answer: 2, explanation: "A token bucket lets a client spend saved-up tokens in a burst while refills enforce the long-term rate. Fixed and sliding windows cap counts per window rather than modelling burst capacity, and round robin is a load-balancing strategy, not a rate limiter." },
  ],
  keyPoints: [
    "HTTP-based Redis fits serverless: no connection pools, works on the edge.",
    "QStash is at-least-once: verify signatures and make handlers idempotent.",
    "Workflow persists each step, so a failure retries only that step.",
    "Pick the rate-limit algorithm and identifier for the traffic you expect.",
  ],
  sources: [
    { title: "Upstash documentation", url: "https://upstash.com/docs" },
    { title: "Upstash Redis", url: "https://upstash.com/docs/redis/overall/getstarted" },
    { title: "Ratelimit", url: "https://upstash.com/docs/redis/sdks/ratelimit-ts/overview" },
    { title: "QStash", url: "https://upstash.com/docs/qstash/overall/getstarted" },
  ],
};
