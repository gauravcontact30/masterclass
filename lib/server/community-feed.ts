import "server-only";
import { cacheLife, cacheTag } from "next/cache";

/**
 * "Fresh from the community" on /tech-buzz: the latest headlines from dev.to (public API) and Medium (tag RSS feeds)
 * for the technologies the site teaches. Only the headline, a short excerpt, the author and tags are kept, credited to
 * the source in plain text: no images, no full text and no outbound links (site rule since 2026-10-23). Best effort:
 * a source that is down or blocks the request simply contributes nothing.
 */
export type CommunityPost = {
  id: string; source: "dev.to" | "Medium"; title: string; excerpt: string; author: string; tags: string[];
  technology: string; readingMinutes?: number; reactions?: number; publishedAt: string;
};

const TOPICS: { label: string; devto: string; medium: string }[] = [
  { label: "React", devto: "react", medium: "react" },
  { label: "Next.js", devto: "nextjs", medium: "nextjs" },
  { label: "TypeScript", devto: "typescript", medium: "typescript" },
  { label: "JavaScript", devto: "javascript", medium: "javascript" },
  { label: "Node.js", devto: "node", medium: "nodejs" },
  { label: "Python", devto: "python", medium: "python" },
  { label: "AI agents", devto: "ai", medium: "ai-agents" },
  { label: "LangChain", devto: "langchain", medium: "langchain" },
  { label: "Docker", devto: "docker", medium: "docker" },
  { label: "AWS", devto: "aws", medium: "aws" },
  { label: "Testing", devto: "testing", medium: "software-testing" },
  { label: "System design", devto: "systemdesign", medium: "system-design-interview" },
];
const PER_TOPIC = 4, LIMIT = 36, TIMEOUT = 5000;
const HEADERS = { "User-Agent": "MasterClassBuddy-TechBuzz/1.0 (headline digest)", Accept: "application/json, application/rss+xml, text/xml" };

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'", nbsp: " " };
const decode = (text: string) => text.replace(/&(#x?[0-9a-f]+|\w+);/gi, (match, name: string) => {
  if (name[0] === "#") { const code = name[1].toLowerCase() === "x" ? parseInt(name.slice(2), 16) : Number(name.slice(1)); return Number.isFinite(code) ? String.fromCodePoint(code) : match; }
  return ENTITIES[name.toLowerCase()] ?? match;
});
const plain = (html: string) => decode(html.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<(script|style|figure|pre)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
/** A short excerpt: at most 200 characters, cut at a word. */
const excerpt = (text: string) => (text.length <= 200 ? text : `${text.slice(0, text.lastIndexOf(" ", 197))}…`);

async function devTo(topic: (typeof TOPICS)[number]): Promise<CommunityPost[]> {
  const res = await fetch(`https://dev.to/api/articles?tag=${topic.devto}&top=7&per_page=${PER_TOPIC}`, { headers: HEADERS, signal: AbortSignal.timeout(TIMEOUT) });
  if (!res.ok) return [];
  const rows = await res.json() as { id: number; title: string; description?: string; tag_list?: string[]; reading_time_minutes?: number; public_reactions_count?: number; published_at: string; user?: { name?: string } }[];
  return rows.filter(row => row.title && row.description).map(row => ({
    id: `devto-${row.id}`, source: "dev.to", title: plain(row.title), excerpt: excerpt(plain(row.description!)), author: row.user?.name ?? "dev.to author",
    tags: (row.tag_list ?? []).slice(0, 4), technology: topic.label, readingMinutes: row.reading_time_minutes, reactions: row.public_reactions_count, publishedAt: row.published_at,
  }));
}

async function medium(topic: (typeof TOPICS)[number]): Promise<CommunityPost[]> {
  const res = await fetch(`https://medium.com/feed/tag/${topic.medium}`, { headers: HEADERS, signal: AbortSignal.timeout(TIMEOUT) });
  if (!res.ok) return [];
  const xml = await res.text();
  const field = (item: string, tag: string) => item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"))?.[1] ?? "";
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, PER_TOPIC).flatMap(([, item]) => {
    const title = plain(field(item, "title"));
    const body = plain(field(item, "content:encoded") || field(item, "description"));
    if (!title || body.length < 40) return [];
    const guid = plain(field(item, "guid"));
    return [{
      id: `medium-${guid.split("/").pop() || title}`, source: "Medium" as const, title, excerpt: excerpt(body), author: plain(field(item, "dc:creator")) || "Medium writer",
      tags: [...item.matchAll(/<category>([\s\S]*?)<\/category>/gi)].map(([, tag]) => plain(tag)).slice(0, 4), technology: topic.label,
      publishedAt: new Date(plain(field(item, "pubDate")) || Date.now()).toISOString(),
    }];
  });
}

export async function communityPosts(): Promise<CommunityPost[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("tech-buzz-community");
  const results = await Promise.allSettled(TOPICS.flatMap(topic => [devTo(topic), medium(topic)]));
  const seen = new Set<string>();
  return results.flatMap(result => (result.status === "fulfilled" ? result.value : []))
    .filter(post => { const key = post.title.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; })
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, LIMIT);
}
