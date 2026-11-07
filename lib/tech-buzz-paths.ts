/**
 * The learning paths on /tech-buzz (user request 2026-11-07): handpicked stories rated 4.5 stars and above, sorted by what
 * a reader is preparing for. A story's purposes come from its own `purpose:` tag (set when it is written from a community
 * post, lib/server/tech-buzz-imports.ts) and, for earlier stories without one, from what the story is about.
 * Client-safe: no review table and no server imports.
 */

/** Only stories with at least this review score appear in the learning paths, and the import writes nothing lower. */
export const PICK_STARS = 4.5;

export type PathId = "interview" | "exam" | "learn";

export type LearningPath = {
  id: PathId;
  label: string;
  short: string;
  /** Who it is for and what the stories do for them. */
  blurb: string;
  /** What a reader practises with these stories. */
  focus: string[];
  color: string;
  tint: string;
  /** What a story is about when it has no explicit purpose tag. */
  topic: RegExp;
};

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: "interview", label: "Interview prep for big tech", short: "Big-tech interviews",
    blurb: "Real incidents and designs that FAANG-style loops ask about: how it broke, the trade-offs, and the answer a senior engineer gives.",
    focus: ["System design rounds", "Scaling & caching", "Concurrency & queues", "Debugging stories"],
    color: "#7c3aed", tint: "#f3effe",
    topic: /interview|system design|fan-?out|outbox|idempoten|saga|kafka|rate.?limit|consisten|shard|replica|load.?balanc|cach(e|ing)|concurren|distributed|event-driven|queue|throughput|p99|scal(e|ing|able)|billion|redirect|dual-?write|transcod|data structure|algorithm|\bdsa\b/i,
  },
  {
    id: "exam", label: "Exam & certification prep", short: "Exams & certifications",
    blurb: "Cloud, DevOps and platform topics that certification exams and campus tests keep returning to, taught through a working example.",
    focus: ["AWS & cloud services", "Kubernetes & Docker", "CI/CD & deployments", "Cost & security basics"],
    color: "#d97706", tint: "#fdf3e3",
    topic: /\baws\b|amazon|bedrock|sagemaker|lambda|dynamodb|\bcdk\b|cloudformation|iam\b|azure|google cloud|\bgcp\b|kubernetes|\bk8s\b|docker|helm|container|devops|ci\/cd|blue\/green|rollback|autoscal|\bhpa\b|probe|certif|terraform|rightsiz|savings plan|graviton|distroless/i,
  },
  {
    id: "learn", label: "Learn it properly", short: "Deep learning",
    blurb: "Mental models for the tools developers use every day: Next.js, React, agents, RAG, MCP and testing. Read in order or dip into one topic.",
    focus: ["Next.js 16 & React 19", "Agents, RAG & MCP", "Core Web Vitals", "Testing & tooling"],
    color: "#2563eb", tint: "#e9f0fd",
    topic: /next\.?js|react|cache components|use cache|server components|core web vitals|\blcp\b|\binp\b|agent|\brag\b|\bmcp\b|langgraph|langchain|n8n|claude code|typescript|playwright|vitest|testing|graphql|postgres|explained|mental model|fundamentals|essentials|best practices/i,
  },
];

export const purposeTag = (id: PathId) => `purpose:${id}`;
export const isPathId = (value: string): value is PathId => LEARNING_PATHS.some(path => path.id === value);

/** The paths a story serves: its explicit `purpose:` tags when it has any, otherwise what its text is about. */
export function pathsOf(story: { title: string; subtitle?: string; technology: string; category: string; tags: string[] }): PathId[] {
  const explicit = story.tags.filter(tag => tag.startsWith("purpose:")).map(tag => tag.slice(8)).filter(isPathId);
  if (explicit.length) return explicit;
  const text = `${story.title} ${story.subtitle ?? ""} ${story.technology} ${story.category} ${story.tags.join(" ")}`;
  return LEARNING_PATHS.filter(path => path.topic.test(text)).map(path => path.id);
}
