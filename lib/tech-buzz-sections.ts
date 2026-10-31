/**
 * How /tech-buzz is divided: the five tracks of the daily 5:00 AM (IST) edition, and the technology groups every
 * story lands in. Shared by the page (components/tech-buzz-showcase.tsx) and the daily writer
 * (lib/server/tech-buzz-daily.ts), so a generated story always lands in the group it was written for.
 */

/** Tags that mark a daily-edition story; they are internal and never shown as chips. */
export const DAILY_TAG = "mcb-daily";
export const dailyDateTag = (date: string) => `daily:${date}`;
export const dailyTrackTag = (track: string) => `daily-track:${track}`;
/** Marks the community post an imported story was written from (lib/server/tech-buzz-imports.ts), so it is never imported twice. */
export const importTag = (platform: string, id: string) => `import:${platform}:${id}`;
export const isInternalTag = (tag: string) => tag === DAILY_TAG || tag.startsWith("daily:") || tag.startsWith("daily-track:") || tag.startsWith("fav:") || tag.startsWith("import:");

export type DailyTrack = {
  id: string;
  label: string;
  short: string;
  /** Stories on these Learning Dashboard technologies stand in for the track until its first daily story exists. */
  techIds: string[];
  /** The technology logos shown beside the track's name. */
  logoIds: string[];
  /** What the writer covers, in rotation, one angle per day. */
  angles: string[];
  /** The story's own category, technology label and Learning Dashboard technology. */
  category: string;
  technology: string;
  techId: string;
  color: string;
  /** The official documentation the daily story is researched from (at most 20 domains, Perplexity's limit). */
  officialSites: string[];
  /** Extra instructions for the track's writer: the shape every story of the track takes. */
  brief?: string;
};

export const DAILY_TRACKS: DailyTrack[] = [
  {
    id: "agentic-ai", label: "Agentic AI - LangChain, LangGraph, LangSmith, LangFlow and n8n", short: "Agentic AI - LangChain, LangGraph, LangSmith, LangFlow and n8n",
    techIds: ["agentic-ai", "langchain", "langgraph", "langsmith", "langflow", "n8n"],
    logoIds: ["langchain", "langgraph", "langsmith", "langflow", "n8n"],
    // Each angle is a real-life problem solved end to end by one agentic workflow across the whole stack.
    angles: [
      "a customer-support triage agent: n8n receives the ticket, a LangGraph agent classifies it and drafts the reply, a human approves risky answers, LangSmith traces every run",
      "an invoice and expense processing workflow: n8n watches the mailbox, a LangChain extraction chain reads the PDF, a LangGraph agent validates and posts it, LangSmith evaluates accuracy",
      "a recruiting assistant: a LangFlow prototype for resume screening, a LangGraph agent that shortlists and schedules interviews, n8n for calendar and email, LangSmith datasets for fairness checks",
      "an on-call incident responder: n8n turns alerts into runs, a LangGraph agent queries logs and runbooks and proposes a fix that waits for human approval, LangSmith tracks latency and cost",
      "a sales lead research agent: n8n pulls new CRM leads, a LangChain tool-calling agent researches each company, LangGraph writes and scores the outreach, LangSmith compares prompt versions",
      "an internal knowledge assistant: agentic RAG over company docs with LangChain retrievers, LangGraph query planning and self-correction, a LangFlow playground for admins, n8n keeping the index fresh",
      "an e-commerce returns and refunds agent: a LangGraph state machine with checkpoints, n8n connectors to the store and payments, guardrails for refunds above a limit, LangSmith online evaluations",
      "a multi-agent content pipeline: a LangGraph supervisor with researcher, writer and reviewer agents, n8n for scheduling and publishing, LangSmith comparing model versions",
      "a pull request review assistant: n8n listens to repository webhooks, a LangGraph agent reviews diffs with tools and posts comments, LangSmith measures review quality",
      "a personal finance and bill reminder agent: n8n schedules and reads statements, a LangChain agent categorises spending, LangGraph memory keeps preferences, LangSmith monitors failures",
      "a clinic appointment and follow-up assistant: a LangGraph conversation flow with human hand-off, n8n for SMS and calendar, strict guardrails on medical advice, LangSmith auditing every answer",
      "a data analyst agent: natural language to SQL with LangChain tools, LangGraph retries on failing queries, a LangFlow demo for business users, n8n emailing the weekly report",
      "a travel planning agent: LangGraph parallel tool calls for flights, hotels and weather, n8n booking webhooks, human confirmation before payment, LangSmith tracing cost per plan",
      "a contract compliance checker: LangChain structured output over contracts, a LangGraph reviewer loop, n8n routing flagged clauses to legal, LangSmith regression datasets",
    ],
    category: "Agentic AI", technology: "Agentic AI - LangChain, LangGraph, LangSmith, LangFlow and n8n", techId: "agentic-ai", color: "#7c3aed",
    officialSites: ["docs.langchain.com", "reference.langchain.com", "langchain-ai.github.io", "docs.smith.langchain.com", "docs.langflow.org", "docs.n8n.io"],
    brief: [
      "Every story solves one real-life problem end to end with an agentic workflow built on LangChain, LangGraph, LangSmith, LangFlow and n8n, each used for what it does best.",
      "Use these sections, in this order:",
      "1. 'Description': the real-life problem, who has it, what it costs today, and what the finished agent does.",
      "2. 'Topic summary': the agentic concepts the story teaches (for example tool calling, state, checkpoints, human-in-the-loop, memory, evaluation) and where each tool fits, as bulletPoints.",
      "3. 'The workflow': the flow from trigger to result as numbered steps, naming which of LangChain, LangGraph, LangSmith, LangFlow or n8n handles each step.",
      "4. 'Building the agent': the LangChain and LangGraph code, with a complete runnable multi-file example.",
      "5. 'Automating and observing it': the n8n workflow that triggers and connects the agent, the LangFlow prototype, and LangSmith tracing and evaluation, as steps or bulletPoints.",
      "6. 'Solving the real problem': results, edge cases, guardrails, cost and what to watch in production, as bulletPoints.",
      "Never repeat a problem or workflow from an earlier day: each story teaches something new.",
    ].join("\n"),
  },
  {
    id: "system-design", label: "System Design Workflows", short: "System Design",
    techIds: ["system-design"], logoIds: ["system-design"],
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
    techIds: ["aws"], logoIds: ["aws"],
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
    techIds: ["kubernetes", "docker"], logoIds: ["kubernetes", "docker"],
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
    techIds: ["nextjs", "react"], logoIds: ["nextjs", "react"],
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

/** The technology logos shown beside a daily track's name. */
export function dailyTrackTechIds(idOrShort: string): string[] {
  return DAILY_TRACKS.find(t => t.id === idOrShort || t.short === idOrShort)?.logoIds ?? [];
}

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
  daily: "This week's 5", fresh: "Fresh & Latest", stars: "Star Rated", favourites: "Community favourites", n8n: "n8n Workflow Blogs",
  technologies: "Technology sections", tracks: "Popular tracks", roadmaps: "Learning roadmaps", topics: "Topics sidebar", featured: "Featured story",
  categories: "Explore categories", feed: "Story feed", highlights: "Highlights sidebar",
  storyNav: "Story top bar", storyHeader: "Story header", storyBody: "Story body", paywall: "Member paywall", discussion: "Discussion", more: "More stories",
} as const;
