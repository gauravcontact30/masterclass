import { TECHNOLOGY_HANDBOOKS } from "@/lib/pro-learn/technology-handbooks";
import type { LandingSearchIndex } from "@/lib/landing-search-types";

/*
 * The landing page's "Technology docs" search (components/landing-search-docs.tsx): every topic of the dashboard Search
 * page's technology handbooks, as [name, category index, handbook index]. It reads only bundled data, so
 * Next prerenders it at build time (Cache Components) and the CDN serves one static file. The landing page fetches it
 * only when the section comes near the screen, so it costs the first load nothing. The English vocabulary handbook is
 * left out: it is a word list, not technology documentation.
 */
const LOGOS: [RegExp, string][] = [
  [/^git\b/i, "git"], [/next\.js/i, "nextjs"], [/react/i, "react"], [/typescript/i, "typescript"], [/javascript/i, "javascript"],
  [/playwright/i, "playwright"], [/vitest/i, "vitest"], [/nest\.js/i, "nestjs"], [/node\.js/i, "nodejs"], [/python|uv package/i, "python"],
  [/graphql/i, "graphql"], [/langchain/i, "langchain"], [/langgraph/i, "langgraph"], [/langsmith/i, "langsmith"], [/langflow/i, "langflow"],
  [/n8n/i, "n8n"], [/docker/i, "docker"], [/kubernetes/i, "kubernetes"], [/aws/i, "aws"], [/agentic/i, "agentic-ai"], [/redis|upstash/i, "redis"],
  [/zustand/i, "zustand"], [/tanstack/i, "tanstack"], [/system design/i, "system-design"], [/neon|prisma|drizzle/i, "postgresql"],
];
const short = (title: string) => title.split(/\s+[—–-]\s+/)[0].trim();

export async function GET() {
  const books = TECHNOLOGY_HANDBOOKS.filter(book => !/vocabulary|corporate & speaking/i.test(book.title));
  // Categories repeat across thousands of rows, so each is sent once and rows refer to it by position.
  const categories: string[] = [], seen = new Map<string, number>();
  const categoryOf = (name: string) => seen.get(name) ?? (seen.set(name, categories.push(name) - 1), categories.length - 1);
  const index: LandingSearchIndex = {
    handbooks: books.map(book => ({ title: short(book.title), logo: LOGOS.find(([pattern]) => pattern.test(book.title))?.[1] ?? null, topics: book.topics.length })),
    categories,
    topics: books.flatMap((book, h) => book.topics.map(topic => [topic.name, categoryOf(topic.category), h] as [string, number, number])),
  };
  return Response.json(index, { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" } });
}
