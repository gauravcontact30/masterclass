import type { TechBuzzArticle } from "./tech-buzz-data";

/*
 * "Write": members write and publish their own Tech Buzz stories (app/(tech-buzz)/tech-buzz/write). Shared by the
 * editor (components/tech-buzz-write.tsx) and the server (lib/server/tech-buzz-ink.ts), so both agree on the shape
 * of a story and the technologies it can be filed under.
 */

export type InkSection = TechBuzzArticle["contentSections"][number];

/** A story as the editor sends it; `id` is set once the first save has created its row. */
export type InkStory = {
  id?: string;
  title: string;
  subtitle: string;
  technology: string;
  tags: string[];
  coverImage?: string;
  summaryBullets: string[];
  founderTakeaway: string;
  sections: InkSection[];
};

export type InkStatus = "draft" | "published";
export type InkListItem = { id: string; slug: string; title: string; status: InkStatus; updatedAt: string; publishedAt: string };

/**
 * What a story can be filed under. Each label resolves back to its technology (lib/tech-buzz-public.ts techIdOf), so
 * the story gets the real logo and lands in its technology section on /tech-buzz.
 */
export const WRITE_TECHNOLOGIES: { id: string; label: string; category: string; color: string }[] = [
  { id: "agentic-ai", label: "Agentic AI", category: "Agentic AI", color: "#7c3aed" },
  { id: "langchain", label: "LangChain", category: "Agentic AI", color: "#1c3c3c" },
  { id: "langgraph", label: "LangGraph", category: "Agentic AI", color: "#1c3c3c" },
  { id: "langsmith", label: "LangSmith", category: "Agentic AI", color: "#1c3c3c" },
  { id: "langflow", label: "LangFlow", category: "Agentic AI", color: "#7c3aed" },
  { id: "claude", label: "Claude Code", category: "Agentic AI", color: "#c2410c" },
  { id: "openai", label: "OpenAI", category: "Agentic AI", color: "#10a37f" },
  { id: "google", label: "Google AI", category: "Agentic AI", color: "#4285f4" },
  { id: "microsoft", label: "Microsoft AI", category: "Agentic AI", color: "#0078d4" },
  { id: "n8n", label: "n8n", category: "Workflow Automation", color: "#ea4b71" },
  { id: "system-design", label: "System Design", category: "System Design", color: "#0f766e" },
  { id: "aws", label: "AWS Cloud", category: "Cloud & DevOps", color: "#d97706" },
  { id: "docker", label: "Docker", category: "Cloud & DevOps", color: "#2496ed" },
  { id: "kubernetes", label: "Kubernetes", category: "Cloud & DevOps", color: "#326ce5" },
  { id: "nextjs", label: "Next.js 16+", category: "Frontend", color: "#111827" },
  { id: "react", label: "React 19+", category: "Frontend", color: "#0ea5e9" },
  { id: "typescript", label: "TypeScript", category: "Frontend", color: "#3178c6" },
  { id: "python", label: "Python", category: "Backend & Data", color: "#3776ab" },
  { id: "rust", label: "Rust", category: "Backend & Data", color: "#b7410e" },
  { id: "postgresql", label: "PostgreSQL 17", category: "Backend & Data", color: "#336791" },
  { id: "redis", label: "Redis", category: "Backend & Data", color: "#dc382d" },
  { id: "graphql", label: "GraphQL", category: "Backend & Data", color: "#e10098" },
  { id: "playwright", label: "Playwright", category: "Testing & Quality", color: "#2ead33" },
  { id: "vitest", label: "Vitest", category: "Testing & Quality", color: "#16a34a" },
];

export const writeTechnology = (id: string) => WRITE_TECHNOLOGIES.find(tech => tech.id === id);

/** Story images must live in this app's Supabase Storage (uploaded through Write) or ship with the site. */
export const isInkImage = (src: string) => /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//.test(src) || /^\/images\/[\w./-]+$/.test(src);

export const INK_LIMITS = { title: 120, subtitle: 300, sections: 20, paragraph: 4000, listItems: 12, codeFiles: 4, code: 8000, tags: 6, minPublishWords: 120 } as const;

/** Words across a story's text, for the read time and the publish check. */
export function inkWords(story: Pick<InkStory, "title" | "subtitle" | "sections">) {
  const text = [story.title, story.subtitle, ...story.sections.flatMap(section => [section.heading, ...section.paragraphs, ...(section.steps ?? []), ...(section.bulletPoints ?? []), section.callout?.text ?? "", section.quote?.text ?? ""])].join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}
