import type { ShowcaseSlide, Written } from "./types";

/*
 * Tech showcase: six of the most asked interview technologies. Each has a carousel slide, three star-rated most-asked
 * interview questions and a five-question mock interview paper, all with model answers.
 */
export type Level = "Junior" | "Mid" | "Senior";
export type TechTrack = ShowcaseSlide & {
  href: string;
  /** A mock interview paper: every question with its model answer, one point per line. */
  paper: { minutes: number; questions: { q: string; level: Level; points: string[] }[] };
  answers: (Written & { level: Level })[];
};

export const TECH_TRACKS: TechTrack[] = [
  {
    id: "agentic-ai", image: "/images/landing/lessons/agentic-ai.webp", alt: "Illustration of an AI agent planning steps and calling tools",
    kicker: "Agentic AI", title: "Agents, tools, memory and guardrails", text: "The questions product teams ask when they hire for AI agents: how an agent loops, remembers, calls tools and stays safe.",
    facts: ["Most asked in 2026", "Mid to Senior"], href: "/interview-questions",
    paper: { minutes: 45, questions: [
      { q: "What is tool calling, and how does the model decide which tool to use?", level: "Junior", points: ["You describe each tool to the model: its name, what it does and a JSON schema for its arguments.", "When a tool fits, the model replies with a structured tool call instead of text; your code runs it and sends the result back.", "It chooses only from those descriptions, so clear names and descriptions matter more than anything else."] },
      { q: "RAG or fine-tuning: when would you choose each for a support assistant?", level: "Mid", points: ["RAG when the knowledge changes or must be cited: help articles, policies, ticket history.", "Fine-tuning to change behaviour: tone, format or a narrow task the base model does poorly.", "Often both: fine-tune for voice, retrieve for facts. Start with RAG; it is cheaper to update."] },
      { q: "A single agent or a supervisor with sub-agents: what are the trade-offs?", level: "Mid", points: ["A single agent is simpler, cheaper and easier to debug, and works well with a handful of tools.", "A supervisor routes work to specialised sub-agents, each with its own prompt and tools, so it scales to many domains.", "The cost is extra latency, tokens and hand-off failures, so add agents only when one is overloaded."] },
      { q: "How do you stop prompt injection coming from a retrieved web page?", level: "Senior", points: ["Treat retrieved text as data, never as instructions, and mark it clearly as untrusted in the prompt.", "Limit which tools are available while untrusted content is in context, and require approval for sensitive actions.", "Block exfiltration paths, such as fetching arbitrary URLs, and test with known injection strings."] },
      { q: "Design an agent that books travel: its tools, its plan and how it recovers from failures.", level: "Senior", points: ["Tools: search flights and hotels, read the calendar, hold a booking, pay (with approval) and notify.", "Plan: collect constraints, search, propose two or three options, confirm with the user, then book.", "Recovery: retries with backoff, idempotency keys so a retry never books twice, saved state, and a hand-off to a human."] },
    ] },
    answers: [
      { q: "Explain the ReAct pattern.", stars: 5, level: "Mid", tag: "Reasoning", points: [
        "ReAct interleaves Reasoning and Acting: the model writes a short thought, takes an action (a tool call), reads the observation, and repeats.",
        "Grounding each step in a real tool result cuts hallucination compared with reasoning alone.",
        "The cost is more model calls and tokens, so cap the steps and stop as soon as the goal is met.",
      ] },
      { q: "How do short-term and long-term memory differ in an agent?", stars: 4, level: "Mid", tag: "Memory", points: [
        "Short-term memory is the working state of one task or conversation, held in the context window and trimmed or summarised as it grows.",
        "Long-term memory persists across sessions in a store (a vector database or key-value store) and is retrieved by relevance when needed.",
        "Decide what is worth remembering: facts about the user and outcomes, not every raw message.",
      ] },
      { q: "How would you keep an agent safe when its tools can take real actions?", stars: 4, level: "Senior", tag: "Guardrails", points: [
        "Give it the fewest tools and the narrowest permissions the task needs (least privilege).",
        "Validate tool inputs, and pause for human approval before anything irreversible: payments, emails, deletes.",
        "Log every step for audit, and cap steps, time and spend so a confused agent cannot run away.",
      ] },
    ],
  },
  {
    id: "nextjs", image: "/images/landing/lessons/nextjs.webp", alt: "Illustration of a Next.js application with server and client components",
    kicker: "Next.js 16+", title: "App Router, caching and Server Functions", text: "Server and Client Components, Cache Components, proxy.ts and streaming: what React and full-stack interviews now expect.",
    facts: ["Frontend & full stack", "Junior to Senior"], href: "/interview-questions",
    paper: { minutes: 40, questions: [
      { q: "Explain the App Router files: page, layout, loading, error and not-found.", level: "Junior", points: ["page makes a route public and renders its UI; layout wraps child routes and persists across navigation.", "loading is the Suspense fallback shown while the segment loads; error is a client error boundary with a reset.", "not-found renders when notFound() is called or no route matches."] },
      { q: "Why are params and searchParams Promises now, and how do you read them?", level: "Junior", points: ["So rendering can start before request-specific data is known, and only the parts that need it wait.", "In a Server Component: const { slug } = await params.", "In a Client Component, unwrap the Promise with React's use()."] },
      { q: "When would you use a Route Handler instead of a Server Action?", level: "Mid", points: ["A Route Handler (route.ts) is a real HTTP endpoint: webhooks, third-party or mobile clients, custom responses.", "A Server Action is for mutations from your own UI: forms and buttons, with progressive enhancement.", "Rule of thumb: other systems call Route Handlers; your components call Server Actions."] },
      { q: "How do streaming and Suspense change what the user sees first?", level: "Mid", points: ["The server sends the page shell at once and streams each Suspense boundary as its data resolves.", "Users see the layout and fallbacks immediately instead of a blank screen.", "Slow data no longer blocks fast data; loading.js wraps a whole segment in Suspense for you."] },
      { q: "What changed in Next.js 16: proxy.ts, Turbopack by default and Cache Components?", level: "Senior", points: ["Middleware is now called Proxy and lives in proxy.ts; what it can do is unchanged.", "Turbopack is the default bundler for next dev and next build.", "Cache Components make caching explicit: \"use cache\" with cacheLife and cacheTag instead of implicit caching."] },
    ] },
    answers: [
      { q: "Server Components or Client Components: how do you choose?", stars: 5, level: "Junior", tag: "Rendering", points: [
        "Components are Server Components by default: they render on the server, can be async and read data directly, and ship no JavaScript.",
        "Add \"use client\" only where you need state, effects, event handlers or browser APIs.",
        "Props passed from server to client must be serialisable, so keep client islands small and pass data down.",
      ] },
      { q: "What must you always do inside a Server Action?", stars: 4, level: "Mid", tag: "Security", points: [
        "A \"use server\" function is reachable by a POST request, so treat it like a public API endpoint.",
        "Check the session and that this user may do this action, then validate the input (for example with zod).",
        "After the mutation, refresh the cache with updateTag or revalidateTag so the UI shows fresh data.",
      ] },
      { q: "How do Cache Components and Suspense build a page?", stars: 4, level: "Senior", tag: "Caching", points: [
        "With cacheComponents enabled, nothing is cached implicitly: \"use cache\" with cacheLife opts a component or function in.",
        "Cached and static parts are prerendered into a static shell that is sent at once.",
        "Request-time parts (cookies, headers, uncached data) sit inside Suspense and stream in after the shell.",
      ] },
    ],
  },
  {
    id: "aws", image: "/images/landing/lessons/aws.webp", alt: "Illustration of AWS cloud services connected in an architecture",
    kicker: "AWS", title: "EC2, S3, Lambda, IAM, VPC and DynamoDB", text: "The most used AWS services and the architecture questions cloud and DevOps interviews return to every year.",
    facts: ["Cloud & DevOps", "Junior to Senior"], href: "/interview-questions",
    paper: { minutes: 45, questions: [
      { q: "IAM user, group, role and policy: what is each for?", level: "Junior", points: ["User: an identity for a person or app, with long-term credentials. Group: users that share policies.", "Role: an identity assumed temporarily by a service, user or another account, with short-lived credentials.", "Policy: a JSON document that allows or denies actions on resources; attach it to users, groups or roles."] },
      { q: "SQS standard or FIFO queue: what is the difference?", level: "Junior", points: ["Standard: almost unlimited throughput, at-least-once delivery and best-effort ordering.", "FIFO: strict order within a message group and exactly-once processing, with lower throughput limits.", "Use FIFO when order matters (payments, state changes); otherwise standard, with idempotent consumers."] },
      { q: "How does CloudFront speed up a site and protect its origin?", level: "Mid", points: ["It caches content at edge locations near users, cutting latency and load on the origin.", "It terminates TLS at the edge and includes AWS Shield Standard; add AWS WAF for request filtering.", "Origin Access Control keeps an S3 bucket private so only CloudFront can read it."] },
      { q: "How do an Auto Scaling group and a load balancer use health checks?", level: "Mid", points: ["The load balancer checks each target and stops sending traffic to unhealthy instances.", "With ELB health checks turned on, the Auto Scaling group also replaces those instances.", "Scaling policies add or remove instances on metrics; a grace period lets new instances boot first."] },
      { q: "Design a highly available web app across two Availability Zones.", level: "Senior", points: ["An Application Load Balancer across public subnets in both AZs, with an Auto Scaling group spread over private subnets.", "RDS Multi-AZ (a standby with automatic failover) or DynamoDB for data; a NAT Gateway in each AZ.", "Static files on S3 behind CloudFront, and Route 53 health checks for DNS failover."] },
    ] },
    answers: [
      { q: "Explain public and private subnets in a VPC.", stars: 5, level: "Mid", tag: "Networking", points: [
        "A public subnet has a route to an Internet Gateway; put load balancers and bastion hosts there.",
        "A private subnet has no direct route in; app servers and databases live there.",
        "Private instances reach the internet outbound through a NAT Gateway in a public subnet. Security groups are stateful, network ACLs are stateless.",
      ] },
      { q: "Which S3 storage class would you choose, and how do you move data between them?", stars: 4, level: "Junior", tag: "Storage", points: [
        "Standard for frequently read data; Standard-IA or One Zone-IA for data read rarely but needed quickly.",
        "Intelligent-Tiering when access patterns are unknown; Glacier classes for archives, down to Deep Archive.",
        "Lifecycle rules move objects to cheaper classes as they age, or expire them.",
      ] },
      { q: "DynamoDB or RDS: how do you decide?", stars: 4, level: "Mid", tag: "Databases", points: [
        "DynamoDB is a serverless key-value and document store with single-digit millisecond reads at any scale.",
        "You design it around known access patterns, with partition and sort keys and secondary indexes.",
        "RDS is relational: SQL joins, transactions and flexible queries, scaled with bigger instances and read replicas.",
      ] },
    ],
  },
  {
    id: "langchain", image: "/images/landing/lessons/langchain.webp", alt: "Illustration of LangChain components linked into a chain",
    kicker: "LangChain", title: "Chains, retrieval and agents", text: "LCEL, retrieval-augmented generation and when to move to LangGraph: the core of every LLM engineering round.",
    facts: ["LLM engineering", "Junior to Senior"], href: "/interview-questions",
    paper: { minutes: 40, questions: [
      { q: "What is a retriever, and how is it different from a vector store?", level: "Junior", points: ["A vector store holds embeddings and runs similarity search.", "A retriever is an interface: given a query, it returns relevant documents.", "A retriever can wrap a vector store, keyword search (BM25), web search or an ensemble of them."] },
      { q: "How do you make a model return structured output that matches a schema?", level: "Junior", points: ["Call withStructuredOutput (with_structured_output in Python) with a Zod, Pydantic or JSON schema.", "It uses the model's tool calling or JSON mode under the hood.", "Validate the result anyway, and retry or fall back when parsing fails."] },
      { q: "How do you choose chunk size and overlap for a text splitter?", level: "Mid", points: ["A chunk should hold one self-contained idea that can answer a question on its own.", "Split on structure first (headings, paragraphs); a common start is 500 to 1,000 tokens with 10 to 20% overlap.", "Measure retrieval quality on real questions and tune from there."] },
      { q: "How do you trace and debug a chain with LangSmith?", level: "Mid", points: ["Set LANGSMITH_TRACING=true and your API key; every run is then traced.", "Each step shows its inputs, outputs, latency and tokens, so you can find the step that went wrong.", "Save failing runs to a dataset and evaluate fixes against it."] },
      { q: "What would you store as memory in a chat app, and where?", level: "Senior", points: ["Short-term: the recent messages of each thread, trimmed or summarised, saved by thread id.", "Long-term: facts and preferences about the user, in a store shared across threads and retrieved when relevant.", "Never store secrets, and let users see and delete what is remembered."] },
    ] },
    answers: [
      { q: "Walk through a RAG pipeline in LangChain.", stars: 5, level: "Mid", tag: "RAG", points: [
        "Load the documents, split them into chunks, embed each chunk and store it in a vector store.",
        "At question time a retriever fetches the most relevant chunks and they are placed in the prompt.",
        "The model answers from that context; evaluate retrieval and answer quality separately.",
      ] },
      { q: "What is LCEL, and what does a Runnable give you?", stars: 4, level: "Mid", tag: "LCEL", points: [
        "The LangChain Expression Language composes steps with a pipe: prompt | model | parser.",
        "Every Runnable has the same interface: invoke, batch and stream, each with an async form.",
        "So a composed chain streams and runs in parallel without extra code.",
      ] },
      { q: "When would you use LangGraph instead of a plain chain?", stars: 4, level: "Senior", tag: "Agents", points: [
        "A chain is a straight line; LangGraph models a graph with state, branches and loops.",
        "It adds checkpoints, so a run can pause for human approval and resume, and durable execution.",
        "LangChain's agents run on the LangGraph runtime, so you can start simple and drop down when you need control.",
      ] },
    ],
  },
  {
    id: "system-design", image: "/images/landing/lessons/system-design.webp", alt: "Illustration of a system design diagram with services, caches and databases",
    kicker: "System Design", title: "Scale, caching and trade-offs", text: "Design rounds for mid and senior roles: requirements first, then storage, caching, scaling and the trade-offs you chose.",
    facts: ["Mid & Senior rounds", "Whiteboard ready"], href: "/interview-questions",
    paper: { minutes: 60, questions: [
      { q: "Horizontal or vertical scaling, and how does a load balancer spread requests?", level: "Junior", points: ["Vertical: a bigger machine. Simple, but it has a ceiling and is a single point of failure.", "Horizontal: more machines. It needs stateless services but grows much further.", "Load balancers use round robin, least connections or hashing, and skip servers that fail health checks."] },
      { q: "SQL or NoSQL for a new product: how do you choose?", level: "Mid", points: ["SQL for relational data, joins, transactions and queries you cannot predict yet.", "NoSQL for huge scale with simple, known access patterns, flexible schemas or very high write rates.", "Many systems use both: SQL for the core, NoSQL for feeds, sessions or events."] },
      { q: "What does the CAP theorem mean in practice?", level: "Mid", points: ["During a network partition you must choose consistency (refuse some requests) or availability (serve possibly stale data).", "Without a partition the trade-off is latency against consistency (PACELC).", "A bank balance chooses consistency; a like count chooses availability."] },
      { q: "Design a news feed for millions of users.", level: "Senior", points: ["Fan-out on write: push each post into followers' feed caches, so reading is fast.", "For accounts with millions of followers, fan out on read instead: a hybrid model.", "Keep feeds in Redis, rank them in a separate service, page with cursors and serve media from a CDN."] },
      { q: "Design a chat service: delivery, ordering and online presence.", level: "Senior", points: ["Clients hold WebSocket connections to gateway servers; messages are stored with a sequence number per conversation.", "Acknowledgements track sent, delivered and read; offline users get queued messages and push notifications.", "Presence comes from heartbeats stored with a short expiry in Redis."] },
    ] },
    answers: [
      { q: "Design a URL shortener.", stars: 5, level: "Mid", tag: "Classic design", points: [
        "Two APIs: create a short link, and redirect from it. Reads far outnumber writes.",
        "Generate a unique ID (a counter encoded in base62, or a hash with collision checks) and store code → URL in a key-value store.",
        "Cache hot links and add read replicas; use a 302 redirect if you need click analytics, 301 if not.",
      ] },
      { q: "Compare caching strategies.", stars: 4, level: "Mid", tag: "Caching", points: [
        "Cache-aside: the app reads the cache, falls back to the database and fills the cache. The most common choice.",
        "Write-through writes cache and database together; write-back writes the cache first and flushes later, faster but riskier.",
        "Set TTLs and an eviction policy such as LRU, and guard against a stampede when a hot key expires.",
      ] },
      { q: "Design a rate limiter for an API.", stars: 4, level: "Senior", tag: "Reliability", points: [
        "Pick an algorithm: token bucket allows short bursts; a sliding window gives smoother limits.",
        "Keep counters per user or API key in Redis with atomic operations so every server agrees.",
        "Reject with HTTP 429 and a Retry-After header, and decide whether to fail open or closed if Redis is down.",
      ] },
    ],
  },
  {
    id: "n8n", image: "/images/landing/lessons/n8n.webp", alt: "Illustration of an n8n automation workflow with connected nodes",
    kicker: "Automation · n8n", title: "Workflows, webhooks and AI agents", text: "Triggers, data between nodes, error workflows and the AI Agent node: what automation engineer roles test.",
    facts: ["Automation roles", "Junior to Mid"], href: "/interview-questions",
    paper: { minutes: 30, questions: [
      { q: "What is the difference between a Webhook node's test URL and production URL?", level: "Junior", points: ["The test URL works only while the editor is listening for a test event, and shows the data in the editor.", "The production URL works once the workflow is active; its runs appear in the executions list.", "Give external services the production URL."] },
      { q: "How do expressions read data from earlier nodes?", level: "Junior", points: ["Expressions are JavaScript inside {{ }}.", "$json is the current item; $('Node name').item.json.field reads the matching item from an earlier node.", "Helpers such as $input and $now cover the rest."] },
      { q: "When do you need Loop Over Items (Split in Batches)?", level: "Mid", points: ["Most nodes already run once for every item, so you often do not need it.", "Use it to work in batches: to respect rate limits or pause between groups.", "Also when a step must finish for one item before the next starts."] },
      { q: "How are credentials stored and shared safely?", level: "Mid", points: ["Credentials are encrypted in n8n's database with the instance's encryption key.", "Nodes reference credentials by id, so secrets never appear in workflow JSON.", "Share credentials with users or projects instead of copying secrets, and keep the encryption key backed up."] },
      { q: "Self-hosted n8n or n8n Cloud: what are the trade-offs?", level: "Mid", points: ["Self-hosted: full control, data stays on your servers, custom nodes; you run updates, backups and scaling.", "Queue mode with Redis and workers scales a self-hosted instance.", "Cloud: managed and quick to start, with plans that limit executions."] },
    ] },
    answers: [
      { q: "How does data flow through an n8n workflow?", stars: 4, level: "Junior", tag: "Basics", points: [
        "Every workflow starts with a trigger: a webhook, a schedule or an event in an app.",
        "Data moves between nodes as a list of items, each a JSON object, and most nodes run once per item.",
        "Expressions such as {{ $json.email }} read fields from the current item or from earlier nodes.",
      ] },
      { q: "How do you handle errors in production workflows?", stars: 4, level: "Mid", tag: "Reliability", points: [
        "Turn on Retry On Fail for flaky calls, and use a node's error output to branch on failure.",
        "Set an Error Workflow that starts with the Error Trigger and alerts the team.",
        "Make steps idempotent so a retry never charges or emails twice.",
      ] },
      { q: "What does the AI Agent node do?", stars: 5, level: "Mid", tag: "AI", points: [
        "It connects a chat model, memory and tools, and lets the model decide which tool to call.",
        "Tools can be app nodes, HTTP requests or other n8n workflows.",
        "Typical uses: support bots, ticket triage and research assistants that act inside your apps.",
      ] },
    ],
  },
];
