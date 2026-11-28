import { STREAM_VIDEOS, type StreamVideoId } from "./streams-videos";
import { LESSON_TITLES } from "./streams-titles";
import { EXAM_PLAYLISTS, type ExamPlaylistId } from "./streams-exams";
import { EXAM_VIDEO } from "./streams-exam-videos";
import { EXTRA_TOPIC_CHAPTERS, TECH_TOPIC_PLAYLISTS, type TopicPlaylistId } from "./streams-topics";
import { TOPIC_VIDEO } from "./streams-topic-videos";

/*
 * Streams (2026-11-26): course-wise video study for Next.js 16+, React 19+, LangChain, LangGraph, LangSmith, Langflow,
 * LangServe, n8n, AWS and System Design, on the landing page (components/landing-streams.tsx: every course, its first
 * lessons as samples) and in the Learning Dashboard (/learning/streams, components/streams-dashboard.tsx: every lesson).
 *
 * Every video is public on its publisher's own channel (Vercel, React Conf, LangChain, Langflow, n8n, Amazon Web Services
 * and AWS Events, ByteByteGo) and is embedded with YouTube's player (youtube-nocookie, created only when a learner presses
 * play). We do not host, copy or own them. Metadata, including each video's measured top resolution, is generated in
 * lib/streams-videos.ts; only 1080p and above are used. Course grouping, summaries and study notes are ours, written from
 * each video's title and official description.
 */
export type StreamTech = "nextjs" | "react" | "langchain" | "langgraph" | "langsmith" | "langflow" | "langserve" | "n8n" | "aws" | "sysdesign" | TopicPlaylistId | ExamPlaylistId;
export type StreamLevel = "Beginner" | "Intermediate" | "Advanced" | "All levels";
/** A lesson: its video and our study notes; `title` is set where the title is not in lib/streams-titles.ts (exam topics). */
export type StreamLesson = { id: StreamVideoId; points: readonly string[]; title?: string };
export type StreamCourse = { id: string; tech: StreamTech; title: string; summary: string; level: StreamLevel; note?: string; lessons: StreamLesson[] };
/** Streams' categories: technology and IELTS playlists for everyone; Board and government exams only where exam content is offered. */
export type StreamGroup = "tech" | "board" | "exams" | "ielts";
export const STREAM_GROUPS: { id: StreamGroup; name: string; hi: string }[] = [
  { id: "tech", name: "Tech", hi: "टेक" }, { id: "board", name: "Board Exams", hi: "बोर्ड परीक्षा" }, { id: "exams", name: "Government Exams", hi: "सरकारी परीक्षा" }, { id: "ielts", name: "IELTS", hi: "IELTS" },
];
/** Categories a visitor may see: exam categories only with India access (components/audience-provider.tsx). */
export const visibleGroups = (india: boolean): StreamGroup[] => india ? ["tech", "board", "exams", "ielts"] : ["tech", "ielts"];
export type StreamTechInfo = { id: StreamTech; group: StreamGroup; name: string; playlist: string; tagline: string; color: string; status?: string };

export const STREAM_TECHS: StreamTechInfo[] = [
  { id: "nextjs", group: "tech", playlist: "Next.js 16+: zero to production", name: "Next.js 16+", color: "#111111", tagline: "Cache Components, the App Router, Turbopack and AI apps." },
  { id: "react", group: "tech", playlist: "React 19+: the modern React", name: "React 19+", color: "#087ea4", tagline: "React 19 and 19.2, the React Compiler, Server Components, Async React and React Native." },
  { id: "langchain", group: "tech", playlist: "LangChain: build your first agents", name: "LangChain", color: "#1c7c6c", tagline: "LangChain 1.0, tools and MCP, memory, context engineering and Deep Agents." },
  { id: "langgraph", group: "tech", playlist: "LangGraph: stateful agent graphs", name: "LangGraph", color: "#2f6fb0", tagline: "Stateful agents as graphs: persistence, sub-graphs, human-in-the-loop and multi-agent systems." },
  { id: "langsmith", group: "tech", playlist: "LangSmith: trace, evaluate, ship", name: "LangSmith", color: "#c96442", tagline: "Tracing, evaluation, monitoring and deployment for agents." },
  { id: "langflow", group: "tech", playlist: "Langflow: visual AI agents", name: "Langflow", color: "#7a5ea8", tagline: "Visual, low-code agents and RAG: flows, MCP, memory and deployment." },
  { id: "langserve", group: "tech", playlist: "LangServe: legacy APIs and migration", name: "LangServe", color: "#b7791f",
    tagline: "Serving chains as REST APIs, and how to move off it.",
    status: "LangServe has been deprecated since 18 November 2024. LangChain recommends LangGraph Platform (now LangSmith Agent Server) for new projects; this track covers the legacy API and the migration." },
  { id: "n8n", group: "tech", playlist: "n8n: automation to AI agents", name: "n8n", color: "#d6345c", tagline: "Workflow automation from first workflow to advanced builds, then AI agents, MCP and self-hosting." },
  { id: "aws", group: "tech", playlist: "AWS: cloud from the ground up", name: "AWS", color: "#c2620a", tagline: "Cloud foundations, serverless, databases, Kubernetes and AI agents on AWS." },
  { id: "sysdesign", group: "tech", playlist: "System Design: concepts to interviews", name: "System Design", color: "#4a5bd4", tagline: "Scaling, networking, data, APIs, distributed systems and interview case studies." },
  ...TECH_TOPIC_PLAYLISTS.map(({ id, group, name, playlist, tagline, color }) => ({ id, group, name, playlist, tagline, color })),
  ...EXAM_PLAYLISTS.map(({ id, group, name, playlist, tagline, color }) => ({ id, group, name, playlist, tagline, color })),
];

const OLDER = (version: string) => `Recorded for ${version}. The concepts carry into Next.js 16; check the current docs for API changes.`;
const RENAMED = "Some product names have changed since recording: LangGraph Platform is now LangSmith Deployment / Agent Server, and LangGraph Studio is now LangSmith Studio.";

export const STREAM_COURSES: StreamCourse[] = [
  /* ---------- Next.js 16+ ---------- */
  { id: "nextjs-16", tech: "nextjs", level: "All levels", title: "What's new in Next.js 16",
    summary: "The Next.js 16 launch and how to move an existing app onto it: Turbopack by default, Cache Components and the migration path.",
    lessons: [
      { id: "mcbwztC8SRMcR", points: ["Turbopack for development and its filesystem caching", "Instant navigations and Cache Components", "Deployment Adapters and what ships in Next.js 16"] },
      { id: "mcb6_I70oeG4i", points: ["A guided tour of Next.js 16", "Planning the upgrade of an existing App Router project", "Questions developers ask when they migrate"] },
      { id: "mcbn8KM3s4YKN", points: ["Migrating a real project to Next.js 16, step by step", "Where the \"use cache\" directive fits", "Checking the result after the upgrade"] },
    ] },
  { id: "nextjs-app-router", tech: "nextjs", level: "Beginner", title: "App Router foundations", note: OLDER("Next.js 13 and 14"),
    summary: "Layouts, dynamic routes, data fetching, loading UI, the earlier caching model and the mistakes most teams make when they adopt the App Router.",
    lessons: [
      { id: "mcb16oC98qp2N", points: ["Why the App Router exists", "What became stable for production", "Where to read next"] },
      { id: "mcbziqut8pwCW", points: ["Routing, layouts and dynamic route segments", "Fetching data in Server Components", "Caching and metadata (caching defaults changed in later versions)"] },
      { id: "mcbYHGfWYQaWC", points: ["The loading.js file convention", "Meaningful loading UI with React Suspense", "A three-minute demo"] },
      { id: "mcbYdrT03hcL1", points: ["Ten mistakes seen across thousands of App Router projects", "Why each one happens", "How to fix it and the mental model behind the fix"] },
      { id: "mcbm8vJn4DPW3", points: ["Fetching, caching and revalidating data in the App Router", "Static and dynamic fetch(), and unstable_cache()", "The caching model that Cache Components later replaced"] },
    ] },
  { id: "nextjs-rsc", tech: "nextjs", level: "Intermediate", title: "React Server Components, with the Next.js team", note: OLDER("Next.js 14 and 15"),
    summary: "What Server Components are, how they work with server rendering, and the Next.js team on caching, dynamic IO and React 19.",
    lessons: [
      { id: "mcb3_f7vcVOtV", points: ["How Server Components bring React closer to one model for UI", "Where Next.js fits in React's direction", "Patterns that follow from it"] },
      { id: "mcbUadi-9h5BH", points: ["Server Components one layer under the hood", "How RSC and SSR work together", "Soft navigation and async components on the client"] },
      { id: "mcbr60LG4kMRn", points: ["The Next.js team answers questions on caching and dynamic IO", "How to choose between the two approaches", "Turbopack and React 19"] },
    ] },
  { id: "nextjs-caching", tech: "nextjs", level: "Intermediate", title: "Cache Components, \"use cache\" and Partial Prerendering",
    summary: "How modern Next.js decides what is static and what streams per request, and how Partial Prerendering turns that into fast pages.",
    lessons: [
      { id: "mcbCQiiCg_7nh", points: ["Composing Server and Client Components in the App Router", "Modern routing and caching techniques for real projects", "Architecture choices that keep a large app maintainable"] },
      { id: "mcbcVzboHE7kA", points: ["How Partial Prerendering improves TTFB, FCP and LCP", "Two live demos and a migration walkthrough", "Measured results before and after"] },
      { id: "mcbzHtCqVkQC5", points: ["What streaming is and why it matters", "Its effect on user experience and Core Web Vitals", "How it leads to Partial Prerendering"] },
      { id: "mcbU4dbB_S0aT", points: ["Debugging real data-loading scenarios", "What PPR changes about Next.js performance", "A hands-on workshop you can follow along with"] },
    ] },
  { id: "nextjs-turbopack", tech: "nextjs", level: "Intermediate", title: "Turbopack, Bun and developer speed",
    summary: "The Rust-based bundler that is now the Next.js default, how it makes every build incremental, and running Next.js on Bun.",
    lessons: [
      { id: "mcbUG_yL2qhXN", points: ["How Turbopack came to be as the successor to Webpack", "Its incremental architecture", "Recorded at its 2022 introduction"] },
      { id: "mcbFhUSIaS946", points: ["How the team makes every build incremental", "Where Turbopack stands today", "What it means for large codebases"] },
      { id: "mcbpcS0IW0nCe", points: ["Running Next.js with the Bun runtime", "Bun's built-in tooling and native APIs", "Effects on productivity and performance"] },
    ] },
  { id: "nextjs-ai", tech: "nextjs", level: "Intermediate", title: "AI apps and agents with Next.js and the AI SDK",
    summary: "Chatbots and agents in a Next.js app with the Vercel AI SDK: multi-step tool use, a full agent workshop and production agent design.",
    lessons: [
      { id: "mcbB0d-LYDWMT", points: ["An open-source AI chatbot template", "Wiring a model provider through the AI SDK", "Cloning and deploying it in minutes"] },
      { id: "mcbyl7FKLOZTC", points: ["Multi-step (agentic) generation", "Letting the model call tools across several steps", "Where to read the multi-step docs"] },
      { id: "mcbnweCb4li4F", points: ["The basics of building agents with the AI SDK", "A full workshop with instructions to follow", "Hands-on, step by step"] },
      { id: "mcbQL-lW4qOX1", points: ["Secure, production-grade agents for real workflows", "The AI SDK, AI Gateway and Fluid compute", "What actually works in production"] },
    ] },
  { id: "nextjs-deploy", tech: "nextjs", level: "Beginner", title: "Deploy and scale on Vercel",
    summary: "Shipping a Next.js app, serving many customers from one codebase, and two companies that rebuilt on Next.js.",
    lessons: [
      { id: "mcbtTEWPdMscB", points: ["Deploying from a template", "Deploying by pushing to GitHub", "Deploying with the Vercel CLI"] },
      { id: "mcbojobq9dluP", points: ["What a multi-tenant SaaS app is", "Serving many customers from one codebase", "How Next.js and Vercel support it"] },
      { id: "mcbHXJJL8Wapa", points: ["A 2026 tour of the Vercel platform", "AI features and agent-driven development", "Designer and developer collaboration"] },
      { id: "mcbUuP98v77nK", points: ["How the Nordics' largest electronics retailer rebuilt on Next.js", "Time to market cut from seven weeks to one day", "Composable commerce on Vercel"] },
      { id: "mcbnzcG5OY-Eq", points: ["A fintech's migration to Next.js", "Gains in performance and iteration speed", "Turbopack and PPR at scale"] },
    ] },

  /* ---------- LangChain ---------- */
  { id: "langchain-fundamentals", tech: "langchain", level: "Beginner", title: "LangChain 1.0 fundamentals",
    summary: "What LangChain is, where it sits beside LangGraph and Deep Agents, and the thinking behind the 1.0 releases.",
    lessons: [
      { id: "mcb9dQsa4hLhp", points: ["Why models on their own are isolated from data and tools", "What the LangChain framework connects them to", "A two-minute explainer"] },
      { id: "mcbnw6D6_YaaR", points: ["LangGraph: the durable runtime of nodes and edges", "LangChain: the tool-calling agent built on top of it", "Deep Agents: when to reach for each one"] },
      { id: "mcbWaesDx9YKK", points: ["The LangChain and LangGraph 1.0 releases", "The move to production-ready agent frameworks", "A technical discussion with the core team"] },
      { id: "mcb4RdDtNZjeT", points: ["A map of the learning path", "Self-paced courses from building to monitoring agents", "Where to start for free"] },
    ] },
  { id: "langchain-tools", tech: "langchain", level: "Beginner", title: "Tools and the Model Context Protocol",
    summary: "The two ways agents reach the outside world: tool calling through LangChain's common interface, and MCP servers.",
    lessons: [
      { id: "mcbnHJXy1-4BB", points: ["How LLMs call tools", "Using databases, files and APIs from a model", "LangChain's common interface across providers"] },
      { id: "mcbocPNuPlXR9", points: ["What the Model Context Protocol is", "Why it is called the USB-C port for AI apps", "Connecting models to files, databases, APIs and tools"] },
    ] },
  { id: "langchain-memory", tech: "langchain", level: "Intermediate", title: "Memory and context engineering",
    summary: "Agents that remember users across conversations, and filling the context window with the right information at each step.",
    lessons: [
      { id: "mcbic86rawjAo", points: ["How LangChain thinks about memory for agents", "Concepts that apply with or without LangGraph", "A high-level conceptual walkthrough"] },
      { id: "mcbhqAZ2x14JC", points: ["Semantic memory with LangMem", "Recalling facts and user context across conversations", "Separate memories for different users"] },
      { id: "mcb409fukZk6c", points: ["What context rot is", "Offloading large tool results and long messages", "The techniques the Deep Agents harness ships with"] },
      { id: "mcbmmy5v7ajie", points: ["What context engineering is", "Four strategies: write, select, compress, isolate", "Examples of each in agents"] },
    ] },
  { id: "langchain-deep-agents", tech: "langchain", level: "Advanced", title: "Deep Agents",
    summary: "Agents for long, open-ended tasks: planning, a filesystem, sub-agents and detailed prompts, then building, extending and deploying one.",
    lessons: [
      { id: "mcbh2Xsu4Krtz", points: ["What makes an agent \"deep\"", "Planning, filesystem, sub-agents and detailed prompts", "The deepagents package"] },
      { id: "mcbVhG-KqjJEe", points: ["Building a research agent with deepagents", "Planning before execution", "Delegating to isolated sub-agents"] },
      { id: "mcb0YZsPxamk_", points: ["What is under the hood of deepagents", "The planning tool and virtual filesystem", "Built-in sub-agent support"] },
      { id: "mcbpplIZvKxFQ", points: ["The model-plus-harness view of Deep Agents", "How they relate to LangChain and LangGraph", "What changes when a deep agent goes to production"] },
      { id: "mcbQzwwUSjxFK", points: ["Middleware for Managed Deep Agents", "Policy enforcement, fault tolerance and rate limits", "Adding the prebuilt PII middleware"] },
    ] },

  /* ---------- LangGraph ---------- */
  { id: "langgraph-essentials", tech: "langgraph", level: "Beginner", title: "LangGraph essentials", note: RENAMED,
    summary: "The low-level orchestration framework for agents: workflows versus agents, the Functional API and persistence.",
    lessons: [
      { id: "mcbgMYAJpXnYm", points: ["The LangGraph Essentials course in under an hour", "Python or TypeScript", "LangGraph as low-level orchestration for agents"] },
      { id: "mcbZIUEv1FMsI", points: ["The difference between workflows and agents", "Every pattern from Anthropic's \"Building Effective Agents\"", "Each one implemented in LangGraph"] },
      { id: "mcbyzu48hMj3d", points: ["The Functional API", "Turning an existing Python agent into a LangGraph agent with decorators", "What LangGraph adds with minimal code changes"] },
      { id: "mcblI69iM6noh", points: ["Adding persistence to a LangGraph agent", "Checkpoints as the basis of memory", "A notebook to follow along with"] },
    ] },
  { id: "langgraph-control", tech: "langgraph", level: "Intermediate", title: "Controlling agents: structured output, sub-graphs and interrupts",
    summary: "Making agents predictable: returning structured data, splitting state into sub-graphs and pausing for a human.",
    lessons: [
      { id: "mcbkQW1qE4RNm", points: ["Getting a LangGraph agent to return structured output", "The two methods in common use", "When to choose each"] },
      { id: "mcbInA5ENfI8W", points: ["Sub-graphs as a design principle", "Separate state for different parts of a graph", "Multi-agent teams that track their own state"] },
      { id: "mcbwpCk-5jNHi", points: ["Why agents need a human in the loop", "LangGraph's interrupt method", "Resuming after human input"] },
    ] },
  { id: "langgraph-multi-agent", tech: "langgraph", level: "Advanced", title: "Multi-agent systems",
    summary: "Agents as nodes: collaborative workflows, supervisor hierarchies, swarms and how handoffs move control between agents.",
    lessons: [
      { id: "mcbsj4z0EZ2k4", points: ["Agents as nodes, communication as edges", "Three multi-agent workflow examples", "Python and JavaScript code"] },
      { id: "mcbfYDuYgozyW", points: ["LangGraph Supervisor for hierarchical systems", "A supervisor orchestrating specialised agents", "Tool-based handoffs between them"] },
      { id: "mcb7zJNCKU5JH", points: ["The swarm architecture for multi-agent systems", "Agents that hand requests to each other", "Swarm versus supervisor"] },
      { id: "mcbwlv-3Mgknx", points: ["How handoffs work inside LangGraph Swarm", "Specialised agents passing control and context", "How agents learn about each other"] },
    ] },
  { id: "langgraph-planning-memory", tech: "langgraph", level: "Advanced", title: "Planning agents and long-term memory",
    summary: "Plan-and-execute agents that improve on ReAct, and a template for agents that remember across sessions.",
    lessons: [
      { id: "mcbcOzxyobxcG", points: ["Three plan-and-execute agents in LangGraph", "What they promise over ReAct-style agents", "Trade-offs between the designs"] },
      { id: "mcb-S_kDyYa2P", points: ["LangGraph's long-term memory", "A ReAct agent with a tool to save memories", "Starting from the template"] },
    ] },
  { id: "langgraph-projects", tech: "langgraph", level: "Intermediate", title: "Build real agents with LangGraph", note: RENAMED,
    summary: "End-to-end builds: a customer support assistant, a stockbroker agent in LangGraph.js with Next.js, and agents running in production at scale.",
    lessons: [
      { id: "mcbWLqMvPIJj3", points: ["A travel customer-support assistant built step by step", "Tools and many user journeys in one bot", "Techniques reusable for any support agent"] },
      { id: "mcbV7r5GOgOqp", points: ["A stockbroker agent in LangGraph.js", "Human approval before purchases", "Deployed with LangGraph Cloud and Next.js"] },
      { id: "mcbgtW_debxBt", points: ["How a large developer-platform team built agents", "21,000 developer hours saved", "Lessons from running LangGraph at scale"] },
    ] },

  /* ---------- LangSmith ---------- */
  { id: "langsmith-overview", tech: "langsmith", level: "Beginner", title: "LangSmith in brief",
    summary: "What LangSmith is for across the agent development lifecycle: build, test, deploy and monitor.",
    lessons: [
      { id: "mcbNN37Uc7fBf", points: ["The new LangSmith platform", "Running, improving and governing agents", "What it brings together in one place"] },
      { id: "mcbao7wnR095g", points: ["What LangSmith is", "Why agents are a black box without it", "Runs, traces and threads"] },
      { id: "mcb_DTIIE3U3m", points: ["The agent development lifecycle: build, test, deploy, monitor", "How the LangSmith products fit together", "A 90-second overview"] },
      { id: "mcbtZPbJRrKPq", points: ["The LangSmith Essentials course", "Testing, deploying, monitoring and improving an agent", "All in under 60 minutes"] },
    ] },
  { id: "langsmith-intro-series", tech: "langsmith", level: "Beginner", title: "Introduction to LangSmith (4K series)",
    summary: "One agent, the LangSlice pizza assistant, taken from tracing to experiments, human labels and Insights.",
    lessons: [
      { id: "mcbZuICOGwJKd", points: ["Turning on tracing for an agent", "Reading recorded customer conversations as traces", "Finding a bug the output never shows"] },
      { id: "mcbXSrqyNqxSr", points: ["What an experiment is", "Running a baseline over a dataset with the SDK", "Reading the evaluator's comments"] },
      { id: "mcbFUU5VglDpY", points: ["Why an unchecked LLM judge can be wrong at scale", "Labelling threads by hand in an annotation queue", "Comparing human labels with the evaluator"] },
      { id: "mcbq71PIB1zrx", points: ["Evaluators versus Insights", "Finding categories you did not know to look for", "An Insights report on real traces"] },
    ] },
  { id: "langsmith-evaluation", tech: "langsmith", level: "Intermediate", title: "Evaluating agents in depth",
    summary: "Evaluation from every angle: the UI, agent trajectories, whole conversations, pytest, multimodal data and LLM judges.",
    lessons: [
      { id: "mcbyZmDP2isn-", points: ["Running an evaluation from the LangSmith UI", "Letting product and domain experts lead evaluation", "No code required"] },
      { id: "mcbwmfurgnI9D", points: ["Why agents need evaluation in production", "Judging the final output and the trajectory", "Evaluating a customer support agent"] },
      { id: "mcbcBpoLrWm7h", points: ["Multi-turn evaluations", "Did the agent meet the user's goal across a whole conversation?", "Starting from your top usage patterns"] },
      { id: "mcb8KqNancjV0", points: ["Running LLM evals with pytest", "Evals as a familiar testing interface", "Keeping quality stable as you change the app"] },
      { id: "mcbwoceDYN0WJ", points: ["Images, PDFs and audio in the playground and datasets", "Evaluating a receipt-extracting agent", "Multimodal experiments"] },
      { id: "mcb0LA130b6TX", points: ["Testing a third-party model as an eval judge", "Frozen traces from a Deep Agents weather agent", "What the experiment showed"] },
    ] },
  { id: "langsmith-observability", tech: "langsmith", level: "Intermediate", title: "Observability, monitoring and online evaluation",
    summary: "What happens after launch: tracing in production, monitoring and automations, guardrails and feedback review.",
    lessons: [
      { id: "mcbgHxaVhBW3H", points: ["Setting up tracing", "Reading a trace", "Part 1 of the Getting Started series"] },
      { id: "mcbuCaKNEw8CQ", points: ["Why agent observability differs from software observability", "Why evaluating open-ended agents is different", "A simple breakdown of both"] },
      { id: "mcbj-i0zGCOb-", points: ["Monitoring an app after launch", "How people are actually using it", "Automations that act on what you see"] },
      { id: "mcbhJbhsu9AIN", points: ["Online evaluation as guardrails", "Scoring live traffic as it arrives", "Part 21 of the evaluations series"] },
      { id: "mcbL2z_-w_2cN", points: ["Filtering traces by feedback", "Sending them to an annotation queue automatically", "Turning good traces into few-shot examples"] },
    ] },
  { id: "langsmith-studio", tech: "langsmith", level: "Intermediate", title: "Studio, prompts and Agent Server", note: RENAMED,
    summary: "Debugging agents visually, editing prompts in place, and deploying agents built with other frameworks.",
    lessons: [
      { id: "mcb7ngYBWfq93", points: ["LangSmith Studio for building and debugging agents", "Testing runs visually", "What changed in v2"] },
      { id: "mcbqZ2E5JusTA", points: ["Viewing and editing node prompts inside Studio", "Which nodes use which assistant fields", "Tagging your configuration"] },
      { id: "mcbUeh-t9OWQF", points: ["Deploying Google ADK agents to LangSmith Agent Server", "Creating and configuring the agent", "A short walkthrough from the Agent Server team"] },
    ] },
  { id: "langsmith-new", tech: "langsmith", level: "All levels", title: "What's new: Fleet, Agent Builder, Insights Agent and Engine",
    summary: "LangSmith's newest products for building agents from natural language and improving them from their traces.",
    lessons: [
      { id: "mcbiAq8WDxEL1", points: ["Building agents with natural language in Fleet", "Sharing and controlling who can edit or run them", "Agent identity, approvals and audit"] },
      { id: "mcboV2CNrssEB", points: ["Text-to-agent in Agent Builder", "Follow-up questions instead of prompt engineering", "An agent generated from a plain description"] },
      { id: "mcbUT67W6EUOr", points: ["Why traces hold signal no one can read by hand", "The Insights Agent", "Learning how users actually engage"] },
      { id: "mcbahnVY0pEXK", points: ["The question traces leave unanswered: how to improve the agent", "LangSmith Engine", "Replacing the manual trace review loop"] },
    ] },

  /* ---------- Langflow ---------- */
  { id: "langflow-quickstart", tech: "langflow", level: "Beginner", title: "Langflow quickstart",
    summary: "The visual builder that turns every flow into an API: your first agent, multi-agent templates and a deep dive into Langflow 1.0.",
    lessons: [
      { id: "mcbQLb4pFF0Wu", points: ["What Langflow is", "Visual authoring plus a built-in API server", "Every agent becomes an endpoint"] },
      { id: "mcbrSXA4lg19C", points: ["Your first agent in Langflow", "Tools, memory and a model in one flow", "Made for beginners"] },
      { id: "mcb_2ZuQ_p7Bk", points: ["Sequential and hierarchical agents", "Multi-agent workflows from templates", "Several example setups"] },
      { id: "mcbua_2P5-N2Z", points: ["A livestream deep dive into Langflow 1.0", "RAG and multi-agent pipelines", "Building LangChain-based apps visually"] },
    ] },
  { id: "langflow-rag", tech: "langflow", level: "Intermediate", title: "RAG and documents in Langflow",
    summary: "Chatting with documents, agentic RAG, custom chunking components and multimodal input.",
    lessons: [
      { id: "mcbMJofzuNYne", points: ["Uploading a file and asking questions about it", "Building the flow in the UI", "Calling it from code"] },
      { id: "mcbg6RoTlKqHW", points: ["What agentic RAG is", "Using a RAG pipeline as a tool", "RAG inside multi-agent pipelines"] },
      { id: "mcbBHuQw_GclS", points: ["The parts of a Langflow component", "Writing a custom component", "Better chunking for agentic RAG"] },
      { id: "mcbfWrnqwDCra", points: ["Uploading images into Langflow", "Passing them to agents and LLMs", "Multimodal agent workflows"] },
    ] },
  { id: "langflow-mcp", tech: "langflow", level: "Intermediate", title: "Langflow and MCP",
    summary: "Langflow on both sides of the Model Context Protocol: using MCP tools, publishing flows as MCP servers, OAuth and a full agent.",
    lessons: [
      { id: "mcb6KXyk93Q4k", points: ["What MCP is", "Langflow as an MCP client", "Simpler tool setup for agents"] },
      { id: "mcb_AMrnu5yXZ", points: ["Turning Langflow into an MCP server", "Making flows available to any application", "Standardising tool integration"] },
      { id: "mcbWgOiHUE6zq", points: ["Langflow as both MCP client and server", "Expanding the tools available to agents", "Sharing your flows as tools"] },
      { id: "mcb_I80JBjp05", points: ["OAuth for MCP servers in Langflow 1.6", "Setting it up with GitHub", "The same steps for any OAuth provider"] },
      { id: "mcbXOFlgAf3Ci", points: ["An inbox-zero agent in Langflow 1.4", "Project-level flows over MCP", "Connecting Gmail, Calendar and Claude Desktop"] },
    ] },
  { id: "langflow-agents", tech: "langflow", level: "Advanced", title: "Memory and real-world agents",
    summary: "Persistent agent memory with Memory Bases, a data-backed flight agent, and Langflow sub-agents for Claude Code.",
    lessons: [
      { id: "mcbpFvubw7dpg", points: ["Memory Bases in Langflow 1.10", "Conversation history ingested into a vector store", "Persistent memory across conversations"] },
      { id: "mcbcW27lPbGmo", points: ["A flight-information agent", "Searching JSON collections and tables in Astra DB", "Real-time answers through agent tools"] },
      { id: "mcbeXNTHYYkAB", points: ["Langflow as an MCP server for Claude Code", "Agents in parallel and in chains", "Practical sub-agent examples"] },
    ] },
  { id: "langflow-deploy", tech: "langflow", level: "Intermediate", title: "Deploy and integrate Langflow",
    summary: "Running Langflow anywhere: Docker, cloud hosts, webhooks, a Streamlit front end and local models with Ollama.",
    lessons: [
      { id: "mcbYn2z79D1vt", points: ["Deploying Langflow with Docker", "Using the repository's Docker example", "Up and running in a few commands"] },
      { id: "mcbPTHhDEzDB0", points: ["Hosting Langflow on the internet", "FlightControl, Fly.io, Render, Hetzner and more", "Exposing flows via API and MCP"] },
      { id: "mcbUD7MoNe1ud", points: ["Setting up a webhook in Langflow", "Triggering flows from other systems", "A step-by-step tutorial"] },
      { id: "mcbHCQnsstsIv", points: ["A Streamlit front end for a Langflow flow", "From idea to deployed MVP", "A few lines of Python"] },
      { id: "mcbY_sfCfHwSK", points: ["Running open-source models locally with Ollama", "Connecting Ollama to Langflow", "Local inference with Llama 3"] },
    ] },

  /* ---------- LangServe (deprecated) ---------- */
  { id: "langserve-legacy", tech: "langserve", level: "Intermediate", title: "LangServe essentials (legacy)", note: "LangServe is deprecated (18 November 2024). Learn it to maintain existing apps; start new projects on LangSmith Agent Server.",
    summary: "How LangServe exposed chains as APIs with a playground, shown through its chat playground and a hosted web RAG chatbot.",
    lessons: [
      { id: "mcbHgfDHu5kUj", points: ["LangServe's chat-focused playground", "Streaming and editing message history", "Sharing runs and traces through LangSmith"] },
      { id: "mcb84Wu9ixjVV", points: ["A web RAG chatbot built from scratch", "LangChain with the Exa search API", "Traced in LangSmith and served with hosted LangServe"] },
    ] },
  { id: "langserve-migrate", tech: "langserve", level: "Intermediate", title: "Migrating from LangServe to LangSmith Agent Server",
    summary: "Where LangServe users go now: deployments with persistence and queues, Agent Server and the deploy CLI.",
    lessons: [
      { id: "mcbehVnbbagWs", points: ["Why an in-memory dev server breaks with real traffic", "Checkpoints in Postgres and runs on a queue", "Runs that survive a dropped connection"] },
      { id: "mcbI7xs25d-Ce", points: ["LangSmith Agent Server (formerly LangGraph Platform)", "Deploying a production-ready agent in minutes", "What the server provides"] },
      { id: "mcb9f_l31u8dq", points: ["Scaffolding an agent with langgraph new", "Testing locally with langgraph dev", "Shipping with langgraph deploy"] },
    ] },

  /* ---------- React 19+ (React Conf) ---------- */
  { id: "react-19", tech: "react", level: "All levels", title: "What's new in React 19",
    summary: "React 19's new primitives: Actions, use(), form state, document metadata and the roadmap that led to them.",
    lessons: [
      { id: "mcbYlFq5EIKG1", points: ["A visual tour of React 19's new features", "Actions, useActionState, useOptimistic and use()", "What changes for everyday components"] },
      { id: "mcbZtUF5ZefdI", points: ["Building a UI step by step with React's newest primitives", "Why each new API exists", "A clear mental model for the React 19 era"] },
      { id: "mcbakbRqkjazF", points: ["The big picture of React 19", "React 19 and the React Compiler announced", "Where the React team is heading"] },
      { id: "mcbrYPoZDi70n", points: ["How React 19 coordinates the HTML document", "Metadata, stylesheets and scripts rendered from components", "Preloading resources for faster pages"] },
    ] },
  { id: "react-compiler", tech: "react", level: "Intermediate", title: "The React Compiler", note: "Recorded in 2024 for the beta. React Compiler 1.0 shipped in October 2025; check react.dev for current setup.",
    summary: "Automatic memoisation: why useMemo, useCallback and memo become unnecessary, and how the compiler works inside.",
    lessons: [
      { id: "mcbqE56kbWndi", points: ["Why manual memoisation is error-prone", "What the compiler memoises for you", "Adopting it in an existing app"] },
      { id: "mcbjel-0q4mU3", points: ["Inside the compiler's pipeline", "How it understands the Rules of React", "What it can and cannot optimise"] },
    ] },
  { id: "react-server", tech: "react", level: "Advanced", title: "Server Components, streaming and Suspense",
    summary: "React across two computers: Server Components, server functions, universal RSC with Expo Router and streaming server rendering.",
    lessons: [
      { id: "mcbUP-lTPw7Qi", points: ["What problem Server Components solve", "Moving data fetching to the server", "Where the client boundary goes"] },
      { id: "mcbdx4PjYvCtL", points: ["One program running on server and client", "Why the \"use client\" and \"use server\" directives exist", "How the pieces fit together"] },
      { id: "mcbnGjbxDT3fS", points: ["Server Components for native and web", "Data fetching and server-driven UI in Expo Router", "A first look at universal RSC"] },
      { id: "mcbS-bAvWskSk", points: ["Streaming HTML with Suspense", "Selective hydration", "The React 18 foundation that Server Components build on"] },
    ] },
  { id: "react-async", tech: "react", level: "Intermediate", title: "React 19.2: Async React, View Transitions and Activity",
    summary: "The React 19.2 releases: an overview, async patterns with transitions and Suspense, View Transitions, <Activity> and designing page transitions.",
    lessons: [
      { id: "mcbClUOUo86JS", points: ["An overview of React in 2025", "React 19.2, the React Compiler 1.0 and the React Foundation", "What is coming next"] },
      { id: "mcbNrii-4xEcA", points: ["Async React: transitions, actions and Suspense together", "Handling pending states without spinners everywhere", "The demo app from the Async React Working Group"] },
      { id: "mcbbLBy7U2Df_", points: ["The <ViewTransition> component", "Pre-rendering hidden UI with <Activity>", "Keeping state when you navigate away and back"] },
      { id: "mcbNrQivNBAVV", points: ["Designing page transitions that help users", "Motion that explains navigation", "Building them with View Transitions in Next.js"] },
    ] },
  { id: "react-future", tech: "react", level: "Intermediate", title: "React frameworks and AI",
    summary: "Where React frameworks are heading, how AI is changing React work, and exposing a React component to AI agents through MCP.",
    lessons: [
      { id: "mcbPLzSwIdKMH", points: ["Comparing today's React frameworks", "What a future framework needs", "Choosing one for a new project"] },
      { id: "mcb-IpTVYxAfs", points: ["How AI changes building with React", "Lessons from React Native, Prettier and Excalidraw", "Where React fits for AI-generated UI"] },
      { id: "mcbrc_hDVj7hI", points: ["Building an MCP server for a React component", "Letting AI agents drive a data grid", "Design choices for agent-friendly components"] },
    ] },
  { id: "react-native", tech: "react", level: "All levels", title: "React Native",
    summary: "React Native in 2024 and 2025, the new list architecture, the business case for React Native apps and the team's view.",
    lessons: [
      { id: "mcbjR0PmdqqMl", points: ["React Native in 2025", "The New Architecture and what it unlocks", "Recent releases and the roadmap"] },
      { id: "mcbDnuDNQQOy7", points: ["React and React Native in 2024", "What the React and React Native teams shipped", "Cross-platform React today"] },
      { id: "mcbjmtgd4mKVT", points: ["Rethinking how lists work in React Native", "Performance for long, complex lists", "The new list primitives"] },
      { id: "mcbCDO2dAxHZY", points: ["The business side of React Native apps", "Monetisation patterns that work", "What successful apps have in common"] },
      { id: "mcbNaLjM83udR", points: ["How React Native is built", "How they decide what to build", "Advice for React Native developers"] },
    ] },

  /* ---------- n8n ---------- */
  { id: "n8n-beginner", tech: "n8n", level: "Beginner", title: "n8n foundations", note: "Recorded in June 2024. The editor looks a little different today; the concepts are the same.",
    summary: "A nine-step introduction: automation, APIs and webhooks, nodes, data, core workflow concepts, error handling, debugging and collaboration.",
    lessons: [
      { id: "mcbb97Eqc1n6D", points: ["What workflow automation is", "Starting with n8n Cloud or npm", "A first workflow"] },
      { id: "mcbyizCtrprsE", points: ["How APIs work", "Receiving events with webhooks", "Calling APIs from n8n"] },
      { id: "mcbldwvvl6m9R", points: ["Trigger nodes and action nodes", "App nodes versus core nodes", "Configuring a node"] },
      { id: "mcbBsjLylV9Yd", points: ["How n8n represents data as items", "Expressions and mapping fields", "Processing many items at once"] },
      { id: "mcbrs_iyPbcKw", points: ["Branching with IF and Switch", "Merging and looping", "Planning a workflow before building it"] },
      { id: "mcb3eK4sz9ljn", points: ["The core nodes you will use most", "HTTP Request, Code and Set", "Picking the right node for a job"] },
      { id: "mcbMYI5parJgC", points: ["Why workflows fail", "Retries and continue-on-fail", "Error workflows that alert you"] },
      { id: "mcbjVCdunm4NF", points: ["Reading the execution log", "Re-running with past data", "Finding the node that broke"] },
      { id: "mcbIIQ90fWn68", points: ["Sharing workflows and credentials", "Working as a team in n8n", "Templates and the community"] },
    ] },
  { id: "n8n-advanced", tech: "n8n", level: "Advanced", title: "Advanced n8n workflows", note: "Recorded in June 2024.",
    summary: "Eight steps further: complex data flows, technical nodes, pinned data, sub-workflows, error workflows, a full build, files and enterprise features.",
    lessons: [
      { id: "mcbhpn9IEBCD-", points: ["Splitting, aggregating and merging data", "Working with nested JSON", "Keeping complex flows readable"] },
      { id: "mcbTVlRL-2Ykx", points: ["The Code node and expressions in depth", "HTTP Request options", "Other advanced technical nodes"] },
      { id: "mcbdnX9pPZzEP", points: ["Pinning output data while you build", "Editing pinned data to test edge cases", "Saving API calls during development"] },
      { id: "mcbayc5hOn4KC", points: ["Calling one workflow from another", "Passing data in and out", "Reusable building blocks"] },
      { id: "mcb83mymPEYs3", points: ["Dedicated error workflows", "Capturing what failed and why", "Notifying the team"] },
      { id: "mcbLnoDMfLvCb", points: ["Building a complete workflow end to end", "Applying the course's techniques together", "Testing before going live"] },
      { id: "mcbj7yp4ufBSS", points: ["Reading and writing binary files", "Converting between file formats", "Moving files between services"] },
      { id: "mcbrQlMm9SGkz", points: ["Source control and environments", "SSO, roles and audit logs", "Running n8n in a company"] },
    ] },
  { id: "n8n-agents", tech: "n8n", level: "Intermediate", title: "AI agents in n8n",
    summary: "Building AI agents in n8n: a first agent, agents versus AI workflows, chat triggers and memory, a Telegram agent and evaluations.",
    lessons: [
      { id: "mcbcF2EHziyO5", points: ["What an AI agent in n8n is", "The agent you will build", "How the pieces fit together"] },
      { id: "mcbG8tvfkctbp", points: ["n8n's new standalone Agents", "When an agent beats a workflow with AI, and when it doesn't", "Enabling agents on self-hosted instances"] },
      { id: "mcbPj43zjuGhU", points: ["The Chat Trigger", "Giving an agent memory", "System and user messages explained"] },
      { id: "mcbF62mf7UPnL", points: ["A Telegram agent built from scratch", "Connecting tools to the agent", "Testing it end to end"] },
      { id: "mcbiLSBhJlrYm", points: ["A personal-assistant agent built live", "Existing workflows used as tools", "How agents left the workflow canvas"] },
      { id: "mcb0LbQ-ZL7zJ", points: ["Why AI workflows need evaluations", "Building evaluation datasets in n8n", "Making agent output more reliable"] },
    ] },
  { id: "n8n-mcp", tech: "n8n", level: "Intermediate", title: "MCP, self-hosting and data tables",
    summary: "Running n8n yourself, connecting it to AI tools with the Model Context Protocol, building workflows with agents and storing data natively.",
    lessons: [
      { id: "mcbg9urCPRCPY", points: ["Self-hosting n8n locally with one command", "Setting up the AI assistant", "What changed from Docker Compose setups"] },
      { id: "mcbWnZmxAC7-5", points: ["What MCP is and why it matters", "The MCP Server Trigger", "The MCP client tool for agents"] },
      { id: "mcbryCzbYYfs-", points: ["Instance-level MCP in one click", "Letting external AI tools run and search workflows", "Which apps can connect"] },
      { id: "mcbOKmgPD5TWh", points: ["Creating and editing workflows through MCP", "Prompting an agent to build automations", "Reviewing what it built"] },
      { id: "mcb5sBaHrD75r", points: ["A Slack review bot built live with Claude Code", "The official n8n MCP and n8n Skills", "Building by describing, not dragging"] },
      { id: "mcbq4p-AguyN6", points: ["Data tables inside n8n", "Replacing Google Sheets or Airtable for workflow data", "Reading and writing rows from nodes"] },
    ] },

  /* ---------- AWS ---------- */
  { id: "aws-foundations", tech: "aws", level: "Beginner", title: "AWS foundations: IAM, networking, EC2 and S3",
    summary: "The four building blocks every AWS workload uses: identity and access, networking, compute and object storage.",
    lessons: [
      { id: "mcblngP-1Xnal", points: ["IAM from first principles", "Principals, policies and how a request is evaluated", "Least privilege in practice"] },
      { id: "mcbqJwgkt9LKA", points: ["VPCs, subnets and route tables", "Connecting, securing and scaling networks", "Choosing between connectivity options"] },
      { id: "mcbSI2lZZuRay", points: ["How EC2 instances work", "Instance families and sizing", "Lesser-known EC2 capabilities"] },
      { id: "mcbyhXVYab2io", points: ["How Amazon S3 is built", "Durability, consistency and performance", "Designing for S3 at scale"] },
    ] },
  { id: "aws-architecture", tech: "aws", level: "Intermediate", title: "Architecture best practices and cost",
    summary: "Turning ideas into sound cloud architectures with the Well-Architected Framework, then keeping the bill under control.",
    lessons: [
      { id: "mcbocediYa1Ak", points: ["Cloud architecture best practices", "From an idea to a production design", "Common trade-offs and how to make them"] },
      { id: "mcbGGb4bmMm8U", points: ["The six pillars of the Well-Architected Framework", "Running a Well-Architected review", "Acting on what you find"] },
      { id: "mcbejz121QdHC", points: ["What's new in AWS cost optimisation", "Finding and fixing waste", "Tools for tracking spend"] },
    ] },
  { id: "aws-serverless", tech: "aws", level: "Intermediate", title: "Serverless with AWS Lambda",
    summary: "Lambda from what's new to how events flow through it: best practices, large-scale patterns and the new durable functions.",
    lessons: [
      { id: "mcbuJVA2jihX7", points: ["The latest AWS Lambda launches", "What they mean for existing functions", "A quick update"] },
      { id: "mcbPp9iAWWSnr", points: ["Where AWS Serverless is heading", "Lambda, Step Functions and EventBridge together", "Real-world examples"] },
      { id: "mcb6VeGVvlK-w", points: ["Best practices for serverless developers", "Performance, cost and observability", "Structuring function code"] },
      { id: "mcb16NALiV6iU", points: ["Patterns for large-scale Lambda applications", "Concurrency and throttling", "Event-driven designs that scale"] },
      { id: "mcbOqZn4kxSZm", points: ["Lambda durable functions", "Long-running, stateful workflows in Lambda", "When to use them over Step Functions"] },
      { id: "mcbHOZO8jgTFF", points: ["How an event reaches a Lambda function", "Polling, queues and invocation models", "Retries and failure handling"] },
    ] },
  { id: "aws-data", tech: "aws", level: "Advanced", title: "Databases on AWS: DynamoDB, Aurora and ElastiCache",
    summary: "DynamoDB data modelling from core concepts to advanced patterns and internals, then Aurora, Aurora DSQL and ElastiCache Serverless.",
    lessons: [
      { id: "mcb7iWs5Ro0T9", points: ["DynamoDB data modelling core concepts", "Partition keys, sort keys and access patterns", "Single-table design basics"] },
      { id: "mcb9YxjWfmZcB", points: ["Advanced DynamoDB data modelling", "Secondary indexes and denormalisation", "Patterns for complex access"] },
      { id: "mcbONwcJlUNj6", points: ["How DynamoDB works inside", "Partitions, replication and consistency", "What that means for your tables"] },
      { id: "mcbUZSSbmy6C5", points: ["Amazon Aurora's architecture", "Storage that separates from compute", "Recent Aurora innovations"] },
      { id: "mcbs9YYgqGph4", points: ["Aurora DSQL, a distributed SQL database", "Its architecture for active-active writes", "When to choose it"] },
      { id: "mcbprTtjvk8Hx", points: ["ElastiCache Serverless", "Caching for high performance", "Sizing and cost behaviour"] },
    ] },
  { id: "aws-agents", tech: "aws", level: "Intermediate", title: "AI agents with Amazon Bedrock AgentCore",
    summary: "Deploying and operating AI agents on AWS with AgentCore: runtime, gateway for tools, memory, identity and agents built with Kiro and MCP.",
    lessons: [
      { id: "mcbc1PjR2LOcI", points: ["What Amazon Bedrock AgentCore is", "Deploying and operating agents in minutes", "Works with any framework and model"] },
      { id: "mcbKA01F2INfk", points: ["Building agents with Kiro, MCP and AgentCore", "From prototype to deployed agent", "A hands-on developer session"] },
      { id: "mcb1e4kvhLU4q", points: ["Architecting scalable, secure agentic AI", "AgentCore's services and how they fit", "Production design patterns"] },
      { id: "mcbsVQODBYrOz", points: ["AgentCore Memory", "Short-term and long-term memory for agents", "Making agents remember users"] },
      { id: "mcb-KIFx1rN77", points: ["AgentCore Identity", "Securing agent access to tools and data", "Delegated access on a user's behalf"] },
      { id: "mcb4yoK5l70ES", points: ["AgentCore Gateway", "Turning APIs into tools agents can use", "Scaling tool access across agents"] },
    ] },
  { id: "aws-kubernetes", tech: "aws", level: "Advanced", title: "Kubernetes on Amazon EKS",
    summary: "Running Kubernetes on AWS: where EKS is heading, EKS Capabilities, its internal architecture for scale, and networking and observability.",
    lessons: [
      { id: "mcbqekDZXelmK", points: ["The future of Kubernetes on AWS", "Recent EKS launches", "Real-world examples"] },
      { id: "mcbldiUtKuwJ2", points: ["Amazon EKS Capabilities", "Managed building blocks for platforms", "Simplifying day-two operations"] },
      { id: "mcb0QEqFAI1JG", points: ["How EKS is architected for scale", "Control plane performance", "Running very large clusters"] },
      { id: "mcbDbjIgEK_QQ", points: ["Networking strategies for Kubernetes", "Pod networking and service traffic", "Observability for clusters"] },
    ] },
  { id: "aws-keynotes", tech: "aws", level: "All levels", title: "The big picture: AWS in 2026",
    summary: "Where AWS is heading: the year's launches, agentic AI on AWS and lessons on building software.",
    lessons: [
      { id: "mcbimHVX7mLo7", points: ["The year's major AWS launches", "Infrastructure, AI and agents", "What changed this year"] },
      { id: "mcbeztHlk2qw9", points: ["Agentic AI on AWS", "Agentic AI on AWS", "Bedrock, AgentCore and related launches"] },
      { id: "mcbHRCP2Oh0FC", points: ["Building and running systems well", "Lessons on building and running systems", "Advice for developers in the AI era"] },
    ] },

  /* ---------- System Design (ByteByteGo) ---------- */
  { id: "sd-foundations", tech: "sysdesign", level: "Beginner", title: "System design foundations",
    summary: "The core concepts and a repeatable method: scalability, vertical and horizontal scaling, CAP, trade-offs and back-of-the-envelope estimates.",
    lessons: [
      { id: "mcbtbeQ6-YxOL", points: ["A step-by-step framework for system design", "Clarifying requirements first", "From high-level design to deep dives"] },
      { id: "mcb8Vpe2QOsK1", points: ["Eight concepts behind most designs", "Where each one shows up", "A map for the rest of the course"] },
      { id: "mcbrErdFID1s3", points: ["What scalability really means", "Stateless services and partitioning", "Finding bottlenecks"] },
      { id: "mcb-gzBl717bf", points: ["Vertical versus horizontal scaling", "Costs and limits of each", "When to switch"] },
      { id: "mcbeDeExcJGKE", points: ["Consistency, availability and partition tolerance", "Why you can only guarantee two in a partition", "How real databases choose"] },
      { id: "mcbZVuhV5mpgV", points: ["The trade-offs behind design decisions", "Latency, consistency, cost and complexity", "Explaining choices clearly"] },
      { id: "mcbZHv4XWqQKP", points: ["Back-of-the-envelope estimation", "Traffic, storage and bandwidth maths", "Numbers worth remembering"] },
    ] },
  { id: "sd-traffic", tech: "sysdesign", level: "Beginner", title: "Networking and traffic",
    summary: "How requests reach your servers: DNS, CDNs, proxies, load balancers and their algorithms, and API gateways.",
    lessons: [
      { id: "mcb0ON5GlwiIv", points: ["How DNS resolves a name", "Resolvers, root and authoritative servers", "Caching and TTLs"] },
      { id: "mcbSJyt62Xkxy", points: ["What a CDN is", "Edge caching and origin servers", "Speed and resilience benefits"] },
      { id: "mcb6ntObb7idA", points: ["Forward proxies versus reverse proxies", "Real-world uses of each", "Security and caching roles"] },
      { id: "mcbK4yt8118UQ", points: ["What a load balancer really does", "Layer 4 versus layer 7", "Health checks and failover"] },
      { id: "mcbaT8iCgq8eS", points: ["Round robin, least connections and more", "Weighted and hash-based algorithms", "Choosing one for your traffic"] },
      { id: "mcbK7TOKzjckk", points: ["What an API gateway is", "Routing, auth and rate limiting", "Gateways in microservices"] },
      { id: "mcbMmpCXuoqCZ", points: ["Reverse proxy, API gateway and load balancer compared", "Where their jobs overlap", "Using them together"] },
    ] },
  { id: "sd-data", tech: "sysdesign", level: "Intermediate", title: "Databases and caching",
    summary: "Choosing and scaling databases, consistent hashing, cache systems and their pitfalls, Redis and key-value stores.",
    lessons: [
      { id: "mcb0I-EMq5Qrz", points: ["Relational, document, key-value and more", "Matching a database to the workload", "Questions to ask before choosing"] },
      { id: "mcbf_w-r-40XP", points: ["Indexing, replication and sharding", "Read replicas and caching layers", "Seven ways to scale a database"] },
      { id: "mcbwVhM_FGvpy", points: ["Consistent hashing", "Adding and removing servers with little reshuffling", "Virtual nodes"] },
      { id: "mcbl_QYswvPuc", points: ["Caches from the CPU to the CDN", "Where caching happens in a request", "Cache strategies"] },
      { id: "mcbg1XPQx_ISF", points: ["Cache stampede, penetration and avalanche", "Why they happen", "How to prevent them"] },
      { id: "mcbhlyxYp35YD", points: ["What Redis really is", "Data structures and in-memory speed", "Why it is so popular"] },
      { id: "mcbANOeF7Mdeu", points: ["How key-value stores work", "Redis, DynamoDB and Memcached compared", "Partitioning and replication"] },
    ] },
  { id: "sd-apis", tech: "sysdesign", level: "Intermediate", title: "API design",
    summary: "API styles and protocols (REST, GraphQL, gRPC), good API design, pagination, and session versus token authentication.",
    lessons: [
      { id: "mcbVMmnSf1FEG", points: ["SOAP, REST, GraphQL, gRPC, WebSocket and webhooks", "What each style is good at", "Choosing between them"] },
      { id: "mcbWy7mt-t1xA", points: ["What a REST API is", "Resources, HTTP methods and status codes", "Examples of good REST design"] },
      { id: "mcbh8m1xbZGC6", points: ["What GraphQL is", "REST versus GraphQL", "When GraphQL is worth it"] },
      { id: "mcbQzpc6NsRnW", points: ["Remote procedure calls", "How gRPC uses HTTP/2 and Protocol Buffers", "Where gRPC fits best"] },
      { id: "mcb1NmRY_Xwuz", points: ["Seven tips for API design", "Naming, versioning and idempotency", "Mistakes that make APIs hard to use"] },
      { id: "mcbMQFrgSewdh", points: ["Offset versus cursor pagination", "Paging through billions of items", "Consistency while data changes"] },
      { id: "mcbKTHJlU420M", points: ["Server sessions versus JWTs", "Revocation and scaling trade-offs", "Which to use when"] },
    ] },
  { id: "sd-distributed", tech: "sysdesign", level: "Advanced", title: "Microservices, messaging and Kafka",
    summary: "Architecture and distributed-system patterns, microservices and when not to use them, and event streaming with Kafka.",
    lessons: [
      { id: "mcb1xKNQTgtJO", points: ["What microservices really are", "Benefits and operational costs", "When not to use them"] },
      { id: "mcb-fr4gpxw0o", points: ["Layered, event-driven, microkernel and more", "The five most-used architecture patterns", "Trade-offs of each"] },
      { id: "mcbJgsNxqgc71", points: ["Seven distributed-system patterns", "Circuit breakers, CQRS, sagas and more", "Problems each pattern solves"] },
      { id: "mcbylFj8b_9VF", points: ["Kafka topics, partitions and brokers", "Producers, consumers and consumer groups", "Kafka's core guarantees"] },
      { id: "mcbQ5e7ok6CFq", points: ["Why Kafka is fast", "Sequential I/O and zero-copy", "Batching and compression"] },
      { id: "mcbu0EyJiLOPD", points: ["Kafka, RabbitMQ and Pulsar compared", "Message queues versus event streams", "Choosing messaging middleware"] },
    ] },
  { id: "sd-interview", tech: "sysdesign", level: "Advanced", title: "Design interviews and case studies",
    summary: "How to approach a system design interview, then classic designs: a URL shortener, a rate limiter, a chat system, a video platform and a location service.",
    lessons: [
      { id: "mcbX2p-iiLigw", points: ["How to approach any system design interview", "Managing the time", "What interviewers look for"] },
      { id: "mcb3d2hm3J5lC", points: ["Designing a URL shortener", "ID generation and encoding", "Redirects at scale"] },
      { id: "mcbJMnLWXjoWZ", points: ["Designing a rate limiter", "Token bucket and leaky bucket", "Rate limiting across many servers"] },
      { id: "mcbAQ7Epepepn", points: ["Designing a chat system like WhatsApp or Slack", "WebSockets, presence and message storage", "Delivering messages reliably"] },
      { id: "mcbBBBDoqPso9", points: ["Designing a video-sharing platform", "Upload, transcoding and storage", "Streaming video through CDNs"] },
      { id: "mcbluK54IxE1G", points: ["Designing a location-based service like Yelp", "Geohashes and quadtrees", "Searching nearby places fast"] },
    ] },
];

/* Topic-led chapters: Board, government-exam and IELTS (lib/streams-exams.ts), the newer tech playlists and further System
   Design chapters (lib/streams-topics.ts), each topic with its generated video (lib/streams-exam-videos.ts,
   lib/streams-topic-videos.ts); a topic without a video of 1080p or more is left out. */
const topicVideo = (key: string) => EXAM_VIDEO[key] ?? TOPIC_VIDEO[key];
type TopicChapter = { title: string; level: StreamLevel; summary: string; topics: readonly (readonly [string, readonly string[]])[] };
const topicCourses = (tech: string, chapters: readonly TopicChapter[], firstChapter = 1, idPrefix = tech) => { let topic = 0; return chapters.map((chapter, c) => ({
  id: `${idPrefix}-${c + firstChapter}`, tech: tech as StreamTech, title: chapter.title, summary: chapter.summary, level: chapter.level,
  lessons: chapter.topics.flatMap(([title, points]) => { const id = topicVideo(`${tech}#${topic++}`); return id ? [{ id, title, points }] : []; }),
})).filter(course => course.lessons.length > 0); };
STREAM_COURSES.push(...[...EXAM_PLAYLISTS, ...TECH_TOPIC_PLAYLISTS].flatMap(p => topicCourses(p.id, p.chapters)), 
  ...Object.entries(EXTRA_TOPIC_CHAPTERS).flatMap(([tech, chapters]) => topicCourses(tech, chapters, 1, tech === "sysdesign" ? "sd-topics" : `${tech}-topics`)));

/* ---------- Playlists: one step-by-step playlist per technology ---------- */
export const video = (id: StreamVideoId) => STREAM_VIDEOS[id];
/** What learners see as a lesson's name (lib/streams-titles.ts), never the source video's own title. */
export const lessonTitle = (id: StreamVideoId) => findStep(id)?.title ?? LESSON_TITLES[id] ?? "";
export const techInfo = (tech: StreamTech) => STREAM_TECHS.find(t => t.id === tech)!;
/** A technology's chapters (its courses), in playlist order. */
export const coursesFor = (tech: StreamTech | "all") => tech === "all" ? STREAM_COURSES : STREAM_COURSES.filter(course => course.tech === tech);
/** "Next.js 16+, React 19+, … and System Design", for copy that lists technologies. */
export const techNames = (and = "and", techs: StreamTech[] = STREAM_TECHS.map(t => t.id)) => { const n = techs.map(t => techInfo(t).name); return n.length < 2 ? n.join("") : `${n.slice(0, -1).join(", ")} ${and} ${n.at(-1)}`; };

/** One lesson in a playlist: numbered from 1 across the whole playlist, inside its chapter. */
export type StreamStep = { id: StreamVideoId; step: number; title: string; points: readonly string[]; seconds: number; tech: StreamTech; chapter: StreamCourse; chapterNo: number; level: StreamLevel };
export type StreamPlaylist = { tech: StreamTech; info: StreamTechInfo; chapters: StreamCourse[]; steps: StreamStep[]; seconds: number };
const PLAYLISTS = new Map<StreamTech, StreamPlaylist>(STREAM_TECHS.map(info => {
  const chapters = coursesFor(info.id); let step = 0;
  const steps = chapters.flatMap((chapter, c) => chapter.lessons.map(lesson => ({ id: lesson.id, step: ++step, title: lesson.title ?? LESSON_TITLES[lesson.id]!, points: lesson.points, seconds: STREAM_VIDEOS[lesson.id].seconds, tech: info.id, chapter, chapterNo: c + 1, level: chapter.level })));
  return [info.id, { tech: info.id, info, chapters, steps, seconds: steps.reduce((sum, s) => sum + s.seconds, 0) }];
}));
const STEPS = new Map([...PLAYLISTS.values()].flatMap(p => p.steps.map(s => [s.id as string, s] as const)));
export const playlist = (tech: StreamTech) => PLAYLISTS.get(tech)!;
export const PLAYLISTS_IN_ORDER = STREAM_TECHS.map(t => playlist(t.id));
export const findStep = (id: string | undefined) => id ? STEPS.get(id) : undefined;
/** Categories a visitor may see that have at least one playlist with steps. */
export const activeGroups = (india: boolean): StreamGroup[] => visibleGroups(india).filter(g => techsIn([g]).length > 0);
/** The playlists in these categories that have steps, in order. */
export const techsIn = (groups: StreamGroup[]) => STREAM_TECHS.filter(t => groups.includes(t.group) && playlist(t.id).steps.length > 0).map(t => t.id);
export const isTech = (value: unknown): value is StreamTech => typeof value === "string" && PLAYLISTS.has(value as StreamTech);

/** The first step of every course is free to watch; the rest need a membership (enforced by /api/streams/play,
 *  lib/server/streams-access.ts). The landing page previews the first SAMPLE_STEPS steps of a course. */
/** When the playlists' content last changed (steps, chapters or playlists added): /streams' lastmod in the sitemap. Bump it with each content release. */
export const STREAMS_UPDATED = "2026-11-28";
export const FREE_STEPS = 1;
export const isFree = (step: StreamStep) => step.step <= FREE_STEPS;
/** The landing page shows three playlists, each with its first steps as a preview; everything else is on /streams.
 *  With exam content: a Board subject, a government exam and Next.js; without it: Next.js, React and IELTS. */
export const LANDING_TECHS: StreamTech[] = ["nextjs", "react", "ielts"];
export const LANDING_TECHS_INDIA: StreamTech[] = ["board10-maths", "bankpo", "nextjs"];
export const landingTechs = (india: boolean) => { const visible = techsIn(visibleGroups(india)); const picks = (india ? LANDING_TECHS_INDIA : LANDING_TECHS).filter(t => visible.includes(t)); return picks.length ? picks : visible.slice(0, 3); };
export const SAMPLE_STEPS = 3;
export const isSample = (step: StreamStep) => step.step <= SAMPLE_STEPS;

/** Labels for the measured quality: 4K Ultra HD, QHD (1440p) or Full HD (1080p). */
export const QUALITY_NAME = { "4K": "4K UHD", "1440p": "QHD 1440p", "1080p": "Full HD" } as const;
/** The quality a video can play at, from its measured top stream: 4K UHD, QHD (1440p) or Full HD (1080p). */
export type StreamQuality = "4K" | "1440p" | "1080p";
export const quality = (id: StreamVideoId): StreamQuality => { const h = STREAM_VIDEOS[id].maxHeight; return h >= 2160 ? "4K" : h >= 1440 ? "1440p" : "1080p"; };
/** A playlist's best quality: 4K if any step is 4K, and so on. */
export const playlistQuality = (tech: StreamTech): StreamQuality => { const q = playlist(tech).steps.map(s => quality(s.id)); return q.includes("4K") ? "4K" : q.includes("1440p") ? "1440p" : "1080p"; };

/** "44:32", "1:05:56" for a lesson; "2 h 15 min" / "38 min" for a playlist. */
export function clockTime(seconds: number) {
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}
export function courseTime(seconds: number) {
  const minutes = Math.round(seconds / 60), h = Math.floor(minutes / 60), m = minutes % 60;
  return h ? `${h} h${m ? ` ${m} min` : ""}` : `${m} min`;
}
export const streamTotals = (techs: StreamTech[] = STREAM_TECHS.map(t => t.id)) => {
  const lists = techs.map(playlist), steps = lists.flatMap(p => p.steps);
  return { playlists: lists.length, chapters: lists.reduce((n, p) => n + p.chapters.length, 0), lessons: steps.length, seconds: steps.reduce((n, s) => n + s.seconds, 0), uhd: steps.filter(s => quality(s.id) === "4K").length };
};

/* ---------- Search and icon filters over a playlist's steps (landing section and dashboard) ---------- */
export type LengthFilter = "any" | "short" | "medium" | "long";
export type QualityFilter = "any" | "4K" | "1440p";
export type StreamFilters = { level: StreamLevel | "any"; length: LengthFilter; quality: QualityFilter; samples: boolean };
export const NO_FILTERS: StreamFilters = { level: "any", length: "any", quality: "any", samples: false };
const LENGTH: Record<Exclude<LengthFilter, "any">, (seconds: number) => boolean> = { short: s => s < 10 * 60, medium: s => s >= 10 * 60 && s < 30 * 60, long: s => s >= 30 * 60 };
const stepText = (s: StreamStep) => `${s.title} ${s.chapter.title} ${s.points.join(" ")} ${techInfo(s.tech).name}`.toLowerCase();
const TEXT = new Map([...STEPS.values()].map(s => [s.id as string, stepText(s)]));
const termsOf = (query: string) => query.trim().toLowerCase().split(/\s+/).filter(Boolean);
export function filterSteps(steps: StreamStep[], query: string, filters: StreamFilters) {
  const terms = termsOf(query);
  return steps.filter(s => (filters.level === "any" || s.level === filters.level)
    && (filters.length === "any" || LENGTH[filters.length](s.seconds))
    && (filters.quality === "any" || (filters.quality === "4K" ? quality(s.id) === "4K" : quality(s.id) !== "1080p"))
    && (!filters.samples || isSample(s))
    && (!terms.length || terms.every(term => TEXT.get(s.id)!.includes(term))));
}

/** Search suggestions across the given technologies: playlists, chapters, steps and study-note topics, best first. */
export type Suggestion = { kind: "playlist" | "chapter" | "lesson" | "topic"; label: string; detail: string; tech: StreamTech; lesson?: StreamVideoId };
export function suggest(query: string, techs: StreamTech[], limit = 8): Suggestion[] {
  const terms = termsOf(query);
  if (!terms.length) return [];
  const hit = (text: string) => terms.every(term => text.toLowerCase().includes(term));
  const starts = (text: string) => text.toLowerCase().startsWith(terms[0]) ? 0 : 1;
  const out: (Suggestion & { rank: number })[] = [];
  for (const tech of techs) {
    const p = playlist(tech);
    if (hit(`${p.info.name} ${p.info.playlist}`)) out.push({ kind: "playlist", label: p.info.playlist, detail: `${p.steps.length} steps · ${courseTime(p.seconds)}`, tech, rank: starts(p.info.name) });
    for (const c of p.chapters) if (hit(c.title)) out.push({ kind: "chapter", label: c.title, detail: `${p.info.name} · ${c.lessons.length} steps`, tech, lesson: c.lessons[0].id, rank: 2 + starts(c.title) });
    for (const s of p.steps) {
      if (hit(s.title)) out.push({ kind: "lesson", label: s.title, detail: `${p.info.name} · Step ${s.step} · ${clockTime(s.seconds)}`, tech, lesson: s.id, rank: 4 + starts(s.title) });
      else { const point = s.points.find(hit); if (point) out.push({ kind: "topic", label: point, detail: `${p.info.name} · Step ${s.step}: ${s.title}`, tech, lesson: s.id, rank: 6 + starts(point) }); }
    }
  }
  const seen = new Set<string>();
  return out.sort((a, b) => a.rank - b.rank).filter(s => { const key = `${s.kind}:${s.label}`; if (seen.has(key)) return false; seen.add(key); return true; }).slice(0, limit).map(({ rank: _rank, ...s }) => s);
}

/** A playlist, or one of its steps, in the Learning Dashboard. */
export const streamsHref = (tech?: StreamTech, lesson?: string) => `/learning/streams${tech ? `?tech=${tech}${lesson ? `&lesson=${lesson}` : ""}` : ""}`;
