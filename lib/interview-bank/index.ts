import type { QuestionSet } from "@/lib/interview-questions";

/**
 * The landing page's interview carousel (components/landing-interview.tsx): one slide per technology, each with
 * its most-asked subjective and objective questions. This file holds only the slide list; each technology's
 * questions live in ./banks/<id>.ts and load as their own chunk when its slide comes into view.
 * Pictures: `npm run images:interview` paints them into the topics folder under ["interview", id].
 */
export type InterviewTech = { id: string; title: string; tagline: string; kind: InterviewKind; tabs?: InterviewTab[] };
/** A technology split into tabs (Key TanStack libraries) keeps one question bank per tab, loaded as `<tech>/<tab>`. */
export type InterviewTab = { id: string; title: string; tagline: string };
/** Picks the slide's placeholder icon while its picture is missing. */
export type InterviewKind = "ai" | "frontend" | "backend" | "testing" | "state" | "language" | "cloud" | "tooling" | "design" | "data";

export const INTERVIEW_TECHS: InterviewTech[] = [
  { id: "langchain", title: "LangChain", tagline: "Models, prompts, tools, retrieval and agents with create_agent.", kind: "ai" },
  { id: "langgraph", title: "LangGraph", tagline: "Stateful graphs, checkpointers, interrupts and multi-agent systems.", kind: "ai" },
  { id: "langflow", title: "LangFlow", tagline: "Visual flows, components, the Playground and serving flows as APIs.", kind: "ai" },
  { id: "langsmith", title: "LangSmith", tagline: "Tracing, datasets, evaluators, experiments and monitoring.", kind: "ai" },
  { id: "nextjs", title: "Next.js 16+", tagline: "App Router, Server Components, Cache Components, proxy.ts and Turbopack.", kind: "frontend" },
  { id: "react", title: "React 19+", tagline: "Actions, use(), useOptimistic, Server Components and the React Compiler.", kind: "frontend" },
  { id: "system-design", title: "System Design", tagline: "Scaling, caching, databases, queues, consistency and classic designs.", kind: "design" },
  { id: "redis", title: "Redis", tagline: "Data structures, caching, persistence, Pub/Sub, Streams and clustering.", kind: "data" },
  { id: "playwright", title: "Playwright", tagline: "Locators, auto-waiting, fixtures, tracing and cross-browser runs.", kind: "testing" },
  { id: "python", title: "Python", tagline: "Data model, generators, decorators, async, typing and the GIL.", kind: "language" },
  { id: "agentic-ai", title: "Agentic AI", tagline: "Agents, tools, planning, memory, guardrails and evaluation.", kind: "ai" },
  { id: "agentic-terms", title: "Agentic AI terms", tagline: "The most popular terms and topics: MCP, RAG, ReAct, A2A and more.", kind: "ai" },
  { id: "aws", title: "AWS services", tagline: "EC2, S3, Lambda, IAM, VPC, DynamoDB, RDS, SQS and the rest of the core.", kind: "cloud" },
  { id: "git", title: "Git commands", tagline: "Branching, merging, rebasing, undoing and recovering work.", kind: "tooling" },
  { id: "github-actions", title: "GitHub Actions", tagline: "Workflows, jobs, runners, secrets, caching, matrices and OIDC.", kind: "tooling" },
  { id: "javascript", title: "JavaScript", tagline: "Closures, this, the event loop, promises, prototypes and modules.", kind: "language" },
  { id: "typescript", title: "TypeScript", tagline: "Types vs. interfaces, generics, narrowing, utility and mapped types.", kind: "language" },
  { id: "js-puzzles", title: "JavaScript puzzles", tagline: "“What does this print?”: hoisting, coercion, closures and the event loop.", kind: "language" },
  { id: "nestjs", title: "NestJS", tagline: "Modules, providers, DI, guards, pipes, interceptors and microservices.", kind: "backend" },
  { id: "jest", title: "Jest", tagline: "Matchers, mocks, spies, timers, snapshots and coverage.", kind: "testing" },
  { id: "rtl", title: "React Testing Library", tagline: "Queries by role, user-event, async utilities and testing behaviour.", kind: "testing" },
  { id: "tanstack", title: "TanStack", tagline: "The headless, type-safe, framework-agnostic library family.", kind: "frontend" },
  { id: "zustand", title: "Zustand", tagline: "Stores, selectors, middleware, persistence and slices.", kind: "state" },
  { id: "redux", title: "Redux", tagline: "Single store, actions, reducers, middleware and immutability.", kind: "state" },
  { id: "redux-toolkit", title: "Redux Toolkit", tagline: "configureStore, createSlice, Immer, thunks and RTK Query.", kind: "state" },
  { id: "vitest", title: "Vitest", tagline: "Vite-powered tests: vi mocks, watch mode, browser mode and coverage.", kind: "testing" },
  { id: "cypress", title: "Cypress", tagline: "Commands, retry-ability, cy.intercept, fixtures and component tests.", kind: "testing" },
  { id: "graphql", title: "GraphQL", tagline: "Schemas, resolvers, N+1 and DataLoader, caching, federation and security.", kind: "data" },
  { id: "nodejs", title: "Node.js", tagline: "Event loop, streams, worker threads, modules and production practice.", kind: "backend" },
  { id: "express", title: "Express", tagline: "Middleware, routing, error handling, security and Express 5.", kind: "backend" },
  { id: "tanstack-libraries", title: "Key TanStack libraries", tagline: "Query, Router, Start, Table, Form, DB and AI.", kind: "frontend", tabs: [
    { id: "query", title: "TanStack Query", tagline: "Server-state caching, mutations, invalidation, infinite queries and SSR." },
    { id: "router", title: "TanStack Router", tagline: "Type-safe routes, search params as state, loaders and preloading." },
    { id: "start", title: "TanStack Start", tagline: "Full-stack React on Router and Vite: server functions, SSR and middleware." },
    { id: "table", title: "TanStack Table", tagline: "Headless tables: row models, sorting, filtering, pagination and selection." },
    { id: "form", title: "TanStack Form", tagline: "Type-safe forms, validators, Standard Schema, array fields and subscriptions." },
    { id: "db-ai", title: "TanStack DB & AI", tagline: "Reactive collections and live queries, plus provider-agnostic AI tooling." },
  ] },
];

/** Each technology's questions as its own chunk. */
const LOADERS: Record<string, () => Promise<{ default: QuestionSet }>> = {
  langchain: () => import("./banks/langchain"),
  langgraph: () => import("./banks/langgraph"),
  langflow: () => import("./banks/langflow"),
  langsmith: () => import("./banks/langsmith"),
  nextjs: () => import("./banks/nextjs"),
  react: () => import("./banks/react"),
  "system-design": () => import("./banks/system-design"),
  redis: () => import("./banks/redis"),
  playwright: () => import("./banks/playwright"),
  python: () => import("./banks/python"),
  "agentic-ai": () => import("./banks/agentic-ai"),
  "agentic-terms": () => import("./banks/agentic-terms"),
  aws: () => import("./banks/aws"),
  git: () => import("./banks/git"),
  "github-actions": () => import("./banks/github-actions"),
  javascript: () => import("./banks/javascript"),
  typescript: () => import("./banks/typescript"),
  "js-puzzles": () => import("./banks/js-puzzles"),
  nestjs: () => import("./banks/nestjs"),
  jest: () => import("./banks/jest"),
  rtl: () => import("./banks/rtl"),
  tanstack: () => import("./banks/tanstack"),
  zustand: () => import("./banks/zustand"),
  redux: () => import("./banks/redux"),
  "redux-toolkit": () => import("./banks/redux-toolkit"),
  vitest: () => import("./banks/vitest"),
  cypress: () => import("./banks/cypress"),
  graphql: () => import("./banks/graphql"),
  nodejs: () => import("./banks/nodejs"),
  express: () => import("./banks/express"),
  "tanstack-libraries/query": () => import("./banks/tanstack/query"),
  "tanstack-libraries/router": () => import("./banks/tanstack/router"),
  "tanstack-libraries/start": () => import("./banks/tanstack/start"),
  "tanstack-libraries/table": () => import("./banks/tanstack/table"),
  "tanstack-libraries/form": () => import("./banks/tanstack/form"),
  "tanstack-libraries/db-ai": () => import("./banks/tanstack/db-ai"),
};

export const hasInterviewBank = (id: string) => id in LOADERS;
/** The bank ids behind a technology: one per tab, or the technology's own. */
export const bankIds = (tech: InterviewTech) => tech.tabs ? tech.tabs.map(tab => `${tech.id}/${tab.id}`) : [tech.id];

export async function loadInterviewBank(id: string): Promise<QuestionSet> {
  const load = LOADERS[id];
  if (!load) throw new Error(`No interview questions for "${id}"`);
  return (await load()).default;
}
