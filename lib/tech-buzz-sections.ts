/**
 * How /tech-buzz is divided: the five tracks of the daily 5:00 AM (IST) edition, and the technology groups every
 * story lands in. Shared by the page (components/tech-buzz-showcase.tsx) and the daily writer
 * (lib/server/tech-buzz-daily.ts), so a generated story always lands in the group it was written for.
 */

/** Tags that mark a daily-edition story; they are internal and never shown as chips. */
export const DAILY_TAG = "mcb-daily";
export const dailyDateTag = (date: string) => `daily:${date}`;
export const dailyTrackTag = (track: string) => `daily-track:${track}`;
export const isInternalTag = (tag: string) => tag === DAILY_TAG || tag.startsWith("daily:") || tag.startsWith("daily-track:") || tag.startsWith("fav:");

export type DailyTrack = {
  id: string;
  label: string;
  short: string;
  /** Stories on these Learning Dashboard technologies stand in for the track until its first daily story exists. */
  techIds: string[];
  /** What the writer covers, in rotation, one angle per day. */
  angles: string[];
  /** The story's own category, technology label and Learning Dashboard technology. */
  category: string;
  technology: string;
  techId: string;
  color: string;
  /** The official documentation the daily story is researched from (at most 20 domains, Perplexity's limit). */
  officialSites: string[];
};

export const DAILY_TRACKS: DailyTrack[] = [
  {
    id: "agentic-ai", label: "Agentic AI with LangChain, LangGraph, LangSmith & LangFlow", short: "Agentic AI",
    techIds: ["agentic-ai", "langchain", "langgraph", "langsmith", "langflow"],
    angles: [
      "a LangGraph agent with human-in-the-loop approval and durable checkpoints",
      "tracing and evaluating a LangChain agent with LangSmith datasets and online evals",
      "prototyping a retrieval agent visually in LangFlow and shipping it as an API",
      "multi-agent supervisor patterns in LangGraph with tool calling and memory",
      "guardrails, retries and cost control for production LangChain agents",
      "agentic RAG with query planning, re-ranking and self-correction",
      "streaming agent steps to a web UI and measuring them in LangSmith",
    ],
    category: "Agentic AI", technology: "Agentic AI & LangChain", techId: "agentic-ai", color: "#7c3aed",
    officialSites: ["docs.langchain.com", "reference.langchain.com", "langchain-ai.github.io", "docs.smith.langchain.com", "docs.langflow.org"],
  },
  {
    id: "system-design", label: "System Design Workflows", short: "System Design",
    techIds: ["system-design"],
    angles: [
      "designing a URL shortener that serves a billion redirects a day",
      "an event-driven order pipeline with Kafka, idempotency and the outbox pattern",
      "a real-time chat system: WebSockets, fan-out and message ordering",
      "rate limiting at the edge: token bucket, sliding window and distributed counters",
      "a payments workflow with sagas, retries and exactly-once side effects",
      "a news feed: fan-out on write vs read, ranking and caching",
      "designing a video upload and transcoding pipeline",
    ],
    category: "System Design", technology: "System Design", techId: "system-design", color: "#0f766e",
    officialSites: ["aws.amazon.com", "docs.aws.amazon.com", "learn.microsoft.com", "cloud.google.com", "kafka.apache.org", "redis.io", "postgresql.org"],
  },
  {
    id: "aws", label: "AWS, DevOps & AI-powered AWS services", short: "AWS & DevOps",
    techIds: ["aws"],
    angles: [
      "building a generative AI app on Amazon Bedrock with Knowledge Bases and Guardrails",
      "a serverless API with Lambda, API Gateway and DynamoDB, deployed by CDK",
      "CI/CD on AWS: CodePipeline, blue/green deploys and automatic rollback",
      "Amazon SageMaker for training, hosting and monitoring a model",
      "observability with CloudWatch, X-Ray and OpenTelemetry",
      "Amazon Q Developer and AI-assisted operations on AWS",
      "cost optimisation: Graviton, Savings Plans, S3 tiers and right-sizing",
    ],
    category: "Cloud & DevOps", technology: "AWS & DevOps", techId: "aws", color: "#d97706",
    officialSites: ["docs.aws.amazon.com", "aws.amazon.com"],
  },
  {
    id: "kubernetes", label: "Kubernetes & Docker", short: "Kubernetes & Docker",
    techIds: ["kubernetes", "docker"],
    angles: [
      "slim, secure Docker images with multi-stage builds and distroless bases",
      "Kubernetes autoscaling: HPA, VPA and KEDA on real traffic",
      "zero-downtime deploys with readiness probes, PodDisruptionBudgets and rollouts",
      "GitOps with Argo CD: drift detection and progressive delivery",
      "Kubernetes networking: Services, Ingress, Gateway API and network policies",
      "running stateful workloads on Kubernetes with operators",
      "Docker Compose to Kubernetes: what changes and why",
    ],
    category: "Cloud & DevOps", technology: "Kubernetes & Docker", techId: "kubernetes", color: "#2563eb",
    officialSites: ["kubernetes.io", "docs.docker.com", "helm.sh"],
  },
  {
    id: "nextjs", label: "Next.js 16+ & React 19+", short: "Next.js & React",
    techIds: ["nextjs", "react"],
    angles: [
      "Cache Components in Next.js 16: use cache, cacheLife and Partial Prerendering",
      "React 19 Actions, useActionState and useOptimistic for forms",
      "Server Components and the client boundary: what ships to the browser",
      "Next.js 16 proxy, routing and instant navigations",
      "the React Compiler: automatic memoisation in practice",
      "streaming with Suspense and the use() hook",
      "measuring and fixing Core Web Vitals in a Next.js 16 app",
    ],
    category: "Frontend", technology: "Next.js 16 & React 19", techId: "nextjs", color: "#111827",
    officialSites: ["nextjs.org", "react.dev"],
  },
];

export type TechGroup = { id: string; label: string; blurb: string; techIds: string[]; categories: RegExp; color: string; tint: string };

/** The technology sections of the page, in order; a story lands in the first group that matches it. */
export const TECH_GROUPS: TechGroup[] = [
  { id: "agentic", label: "Agentic AI & LLM Apps", blurb: "LangChain, LangGraph, LangSmith, LangFlow, RAG and agents in production.", techIds: ["agentic-ai", "langchain", "langgraph", "langsmith", "langflow", "claude", "openai", "google", "microsoft"], categories: /agentic|\bai\b|llm|rag/i, color: "#7c3aed", tint: "#f3effe" },
  { id: "automation", label: "Workflow Automation (n8n)", blurb: "n8n workflows, triggers, AI nodes and self-hosting.", techIds: ["n8n"], categories: /automation|n8n/i, color: "#ea4b71", tint: "#fdeef2" },
  { id: "system-design", label: "System Design & Architecture", blurb: "Scalable systems, event streams, caching and real-world blueprints.", techIds: ["system-design"], categories: /system|architecture|design/i, color: "#0f766e", tint: "#e6f4f1" },
  { id: "cloud", label: "Cloud, DevOps & Containers", blurb: "AWS, Docker, Kubernetes, CI/CD and platform engineering.", techIds: ["aws", "docker", "kubernetes"], categories: /cloud|devops|platform|infra/i, color: "#d97706", tint: "#fdf3e3" },
  { id: "frontend", label: "Frontend: Next.js & React", blurb: "Next.js 16+, React 19+, TypeScript and the modern web.", techIds: ["nextjs", "react", "typescript", "javascript", "angular", "vue", "zustand", "tanstack"], categories: /frontend|web|react|next/i, color: "#1f2937", tint: "#eef0f3" },
  { id: "backend", label: "Backend, Data & Languages", blurb: "Python, Node.js, Rust, PostgreSQL, Redis and GraphQL.", techIds: ["python", "nodejs", "rust", "go", "postgresql", "redis", "graphql", "supabase", "fastapi", "django", "nestjs", "express"], categories: /backend|data|database|language/i, color: "#2563eb", tint: "#e9f0fd" },
  { id: "quality", label: "Testing & Quality", blurb: "Playwright, Vitest and shipping with confidence.", techIds: ["playwright", "vitest"], categories: /test|quality/i, color: "#16a34a", tint: "#e8f6ec" },
];
export const OTHER_GROUP: TechGroup = { id: "more", label: "More Technology", blurb: "Everything else worth reading this week.", techIds: [], categories: /$^/, color: "#6b6a64", tint: "#f0eee6" };

export function techGroupOf(story: { techId?: string; category: string }): TechGroup {
  const techId = story.techId;
  return (techId ? TECH_GROUPS.find(group => group.techIds.includes(techId)) : undefined)
    ?? TECH_GROUPS.find(group => group.categories.test(story.category))
    ?? OTHER_GROUP;
}

/** The IST calendar date (YYYY-MM-DD) for a moment. */
export const istDate = (now = Date.now()) => new Date(now + 5.5 * 3600_000).toISOString().slice(0, 10);

/**
 * The named parts of /tech-buzz and its stories, set as data-track-topic so the visit tracker can say which part a
 * click came from (components/visit-tracker.tsx); the Super Admin "Tech-Buzz - Blogs" page reports them in this order.
 */
export const TECH_BUZZ_TRACKED = {
  daily: "Today's 5 at 5", fresh: "Fresh & Latest", stars: "Star Rated", favourites: "Community favourites", n8n: "n8n Workflow Blogs",
  technologies: "Technology sections", tracks: "Popular tracks", roadmaps: "Learning roadmaps", topics: "Topics sidebar", featured: "Featured story",
  categories: "Explore categories", feed: "Story feed", highlights: "Highlights sidebar",
  storyNav: "Story top bar", storyHeader: "Story header", storyBody: "Story body", paywall: "Member paywall", discussion: "Discussion", more: "More stories",
} as const;
