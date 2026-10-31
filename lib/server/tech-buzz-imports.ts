import "server-only";
import { generateText, gateway, Output } from "ai";
import { z } from "zod";
import { DAILY_TRACKS, importTag } from "@/lib/tech-buzz-sections";
import { MIN_PUBLISHED_STARS } from "@/lib/tech-buzz-reviews";
import { providerModel } from "./ai-providers";
import { db } from "./db";
import { writeInspiredStory, type Inspiration } from "./tech-buzz-daily";

/*
 * Community imports (user request 2026-10-31): Tech Buzz stories written from well-rated posts on dev.to, Medium,
 * daily.dev and Indie Hackers.
 *
 * 1. Candidates come from each platform's public interface: the dev.to API, Medium's tag RSS feeds, daily.dev's public
 *    GraphQL feed (its own TL;DR of each post) and, because indiehackers.com answers bots with a Cloudflare challenge,
 *    Perplexity search restricted to indiehackers.com.
 * 2. A senior full-stack review rates each post 1-5 in half stars; only posts above 2.5 that fit a Tech Buzz track go on.
 * 3. The post is a brief, not text to reuse: the daily edition's writer researches the topic from official documentation
 *    and writes a fresh, deeper lesson with its own painted thumbnail, and the editor's score becomes its star review,
 *    which must also be above 2.5. The post is credited on the story as plain text (title, author, platform), never linked.
 * Each story is tagged import:<platform>:<post id>, so a post is never imported twice.
 */

export type ImportPlatform = "devto" | "medium" | "dailydev" | "indiehackers";
export const IMPORT_PLATFORMS: ImportPlatform[] = ["devto", "medium", "dailydev", "indiehackers"];

type Candidate = { platform: ImportPlatform; id: string; title: string; author: string; tags: string[]; load: () => Promise<string> };

const PLATFORM_INFO: Record<ImportPlatform, { name: string; key: Inspiration["platformKey"] }> = {
  devto: { name: "dev.to", key: "dev-to" },
  medium: { name: "Medium", key: "medium" },
  dailydev: { name: "daily.dev", key: "daily-dev" },
  indiehackers: { name: "Indie Hackers", key: "indiehackers" },
};

const UA = { "User-Agent": "MasterClassBuddy-TechBuzz/1.0 (+https://www.masterclassbuddy.com)" };
const BRIEF_CHARS = 9000;

async function getJson<T>(url: string, init?: RequestInit, timeoutMs = 25_000): Promise<T> {
  const response = await fetch(url, { ...init, headers: { ...UA, ...init?.headers }, signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error(`${new URL(url).hostname} ${response.status}`);
  return response.json() as Promise<T>;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " ", "#39": "'" };
/** HTML to readable text: code blocks and paragraphs keep their line breaks. */
const htmlText = (html: string) => html
  .replace(/<(script|style|figure)[\s\S]*?<\/\1>/gi, " ")
  .replace(/<\/(p|h[1-6]|li|pre|blockquote)>|<br\s*\/?>/gi, "\n")
  .replace(/<[^>]+>/g, "")
  .replace(/&(#?\w+);/g, (match, name: string) => ENTITIES[name] ?? (name.startsWith("#") ? String.fromCharCode(Number(name.slice(1))) : match))
  .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n\n").trim();

/* ── Candidates ─────────────────────────────────────────────────────────────────────────────────────────────────── */

const DEVTO_TAGS = ["langchain", "llm", "mcp", "rag", "agents", "n8n", "nextjs", "react", "kubernetes", "docker", "aws", "systemdesign", "architecture", "devops"];
type DevtoArticle = { id: number; title: string; user: { name: string }; tag_list: string[]; positive_reactions_count: number; reading_time_minutes: number };

/** The month's most-reacted dev.to posts on the tracks' tags; bodies are loaded only for posts that get reviewed. */
async function devto(): Promise<Candidate[]> {
  const lists = await Promise.all(DEVTO_TAGS.map(tag => getJson<DevtoArticle[]>(`https://dev.to/api/articles?tag=${tag}&top=30&per_page=8`).catch(() => [])));
  const seen = new Set<number>();
  return lists.flat().filter(post => post.positive_reactions_count >= 15 && post.reading_time_minutes >= 4 && !seen.has(post.id) && seen.add(post.id))
    .sort((a, b) => b.positive_reactions_count - a.positive_reactions_count)
    .map(post => ({
      platform: "devto", id: String(post.id), title: post.title, author: post.user.name, tags: post.tag_list,
      load: async () => (await getJson<{ body_markdown: string }>(`https://dev.to/api/articles/${post.id}`)).body_markdown,
    }));
}

const MEDIUM_TAGS = ["nextjs", "react", "langchain", "ai-agents", "kubernetes", "aws", "system-design-interview", "software-architecture", "docker"];
const cdata = (xml: string, tag: string) => xml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`))?.[1]?.trim() ?? "";

const feedText = async (url: string) => {
  const response = await fetch(url, { headers: UA, signal: AbortSignal.timeout(25_000) }).catch(() => null);
  return response?.ok ? response.text() : "";
};
/** The author's or publication's own feed: medium.com/feed/@author, medium.com/feed/<publication> or <custom domain>/feed. */
const authorFeed = (link: string) => {
  try {
    const url = new URL(link);
    return url.hostname === "medium.com" ? `https://medium.com/feed/${url.pathname.split("/")[1]}` : `${url.origin}/feed`;
  } catch { return ""; }
};

/**
 * Latest posts from Medium's tag feeds. Tag feeds carry only a snippet; the author's own feed carries the whole post
 * when it is free, so member-only posts (snippet only there too) are skipped when loaded.
 */
async function medium(): Promise<Candidate[]> {
  const feeds = await Promise.all(MEDIUM_TAGS.map(tag => feedText(`https://medium.com/feed/tag/${tag}`)));
  const seen = new Set<string>();
  return feeds.flatMap(xml => xml.split("<item>").slice(1)).flatMap(item => {
    const guid = cdata(item, "guid");
    const id = guid.split("/").at(-1) ?? "";
    const feed = authorFeed(cdata(item, "link"));
    if (!id || !feed || seen.has(id)) return [];
    seen.add(id);
    const tags = [...item.matchAll(/<category>(?:<!\[CDATA\[)?([^<\]]+)/g)].map(match => match[1]);
    return [{
      platform: "medium" as const, id, title: htmlText(cdata(item, "title")), author: cdata(item, "dc:creator"), tags,
      load: async () => {
        const own = (await feedText(feed)).split("<item>").find(entry => cdata(entry, "guid") === guid);
        const text = htmlText(own ? cdata(own, "content:encoded") : "");
        if (text.length < 2500) throw new Error("member-only or too short to rewrite");
        return text;
      },
    }];
  });
}

type DailyDevPost = { id: string; title: string; summary: string | null; numUpvotes: number; permalink: string; tags: string[]; author: { name: string } | null; source: { name: string } };
const DAILYDEV_TAGS = /^(ai|llm|ai-agents|agents|langchain|rag|mcp|machine-learning|nextjs|react|typescript|javascript|webdev|frontend|backend|nodejs|architecture|system-design|distributed-systems|microservices|kubernetes|docker|aws|devops|cloud|n8n|automation|databases|postgresql|redis)$/;

/** The post daily.dev points to, as text; daily.dev's own summary when the page cannot be read. */
async function dailydevText(post: DailyDevPost) {
  const summary = `${post.title}\n\n${post.summary}\n\nTags: ${post.tags.join(", ")}`;
  const response = await fetch(post.permalink, { headers: UA, redirect: "follow", signal: AbortSignal.timeout(25_000) }).catch(() => null);
  if (!response?.ok || !response.headers.get("content-type")?.includes("html")) return summary;
  const html = await response.text();
  const text = htmlText(html.match(/<article[\s\S]*?<\/article>/i)?.[0] ?? html.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? "");
  return text.length >= 1500 ? `${summary}\n\nFull post:\n${text}` : summary;
}

/** daily.dev's most upvoted posts of the last 30 days on the tracks' topics; the brief is the post it links to. */
async function dailydev(): Promise<Candidate[]> {
  const query = "{ mostUpvotedFeed(first: 80, period: 30) { edges { node { id title summary numUpvotes permalink tags author { name } source { name } } } } }";
  const body = await getJson<{ data?: { mostUpvotedFeed: { edges: { node: DailyDevPost }[] } } }>("https://api.daily.dev/graphql", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }),
  });
  return (body.data?.mostUpvotedFeed.edges ?? []).map(edge => edge.node)
    .filter(post => post.summary && post.numUpvotes >= 30 && post.tags.some(tag => DAILYDEV_TAGS.test(tag)))
    .map(post => ({ platform: "dailydev", id: post.id, title: post.title, author: post.author?.name ?? post.source.name, tags: post.tags, load: () => dailydevText(post) }));
}

const ihSchema = { type: "object", properties: { posts: { type: "array", items: { type: "object", required: ["title", "author", "url", "keyPoints"], properties: {
  title: { type: "string" }, author: { type: "string" }, url: { type: "string" },
  keyPoints: { type: "string", description: "200-300 words: the problem, what the author built and how, the stack, numbers and lessons." },
} } } }, required: ["posts"] };

/** Recent technical Indie Hackers posts found by Perplexity search restricted to indiehackers.com. */
async function indiehackers(): Promise<Candidate[]> {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key || key.includes("xxx")) return [];
  const prompt = "Find 8 recent, well-received Indie Hackers posts in which a founder explains how they technically built or scaled their product: AI agents, LLM features, Next.js or React apps, AWS, Docker or Kubernetes, system design, or workflow automation such as n8n. Skip pure marketing, revenue milestones without technical detail, and questions. For each post give its exact title, its author's display name, its indiehackers.com URL and its key points.";
  const body = await getJson<{ choices?: { message?: { content?: string } }[] }>("https://api.perplexity.ai/chat/completions", {
    method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "sonar-pro", messages: [{ role: "user", content: prompt }], search_domain_filter: ["indiehackers.com"], search_recency_filter: "month",
      response_format: { type: "json_schema", json_schema: { schema: ihSchema } }, max_tokens: 4000 }),
  }, 120_000);
  const parsed = z.object({ posts: z.array(z.object({ title: z.string(), author: z.string(), url: z.string(), keyPoints: z.string() })) })
    .safeParse(JSON.parse(body.choices?.[0]?.message?.content ?? "{}"));
  return (parsed.success ? parsed.data.posts : []).flatMap(post => {
    let url: URL;
    try { url = new URL(post.url); } catch { return []; }
    const id = url.pathname.split("/").filter(Boolean).at(-1);
    if (!/(^|\.)indiehackers\.com$/.test(url.hostname) || !id) return [];
    return [{ platform: "indiehackers" as const, id, title: post.title, author: post.author, tags: [], load: async () => `${post.title}\n\n${post.keyPoints}` }];
  });
}

const FETCHERS: Record<ImportPlatform, () => Promise<Candidate[]>> = { devto, medium, dailydev, indiehackers };

/* ── Review and writing ─────────────────────────────────────────────────────────────────────────────────────────── */

const TRACK_IDS = DAILY_TRACKS.map(track => track.id) as [string, ...string[]];
const rateSchema = z.object({
  stars: z.number().describe("1-5 in half stars."),
  verdict: z.string().describe("One sentence on the post's strengths and gaps, under 160 characters."),
  track: z.enum([...TRACK_IDS, "none"]).describe("The learning track the post's topic belongs to, or none."),
  angle: z.string().describe("One sentence: the lesson a deeper, clearer rewrite of this post should teach a working engineer."),
});
export type SourceReview = z.infer<typeof rateSchema>;

async function rate(candidate: Candidate, text: string): Promise<SourceReview> {
  const { output } = await generateText({
    model: gateway(providerModel("gateway")),
    system: [
      "You are a senior full-stack engineer choosing community posts for an engineering learning blog.",
      "Rate the post 1 to 5 in half stars for technical accuracy, depth, whether its code and versions are current, and how much a working developer takes away.",
      "Marketing, link roundups, listicles without substance, career advice, product announcements and opinion without engineering detail score at most 2.5.",
      `Tracks: ${DAILY_TRACKS.map(track => `${track.id} (${track.label})`).join("; ")}. Choose none when the topic fits no track.`,
    ].join("\n"),
    prompt: `Title: ${candidate.title}\nTags: ${candidate.tags.join(", ")}\n\n${text.slice(0, BRIEF_CHARS)}`,
    output: Output.object({ schema: rateSchema }), maxRetries: 1, abortSignal: AbortSignal.timeout(90_000),
  });
  return { ...output, stars: Math.max(1, Math.min(5, Math.round(output.stars * 2) / 2)) };
}

/** Import tags already stored, so a post is never written twice. */
async function alreadyImported(tags: string[]): Promise<Set<string>> {
  if (!tags.length) return new Set();
  const result = await db().from("tech_buzz_articles").select("tags").overlaps("tags", tags);
  if (result.error) throw new Error(`Import lookup failed: ${result.error.code}`);
  return new Set((result.data ?? []).flatMap(row => row.tags as string[]).filter(tag => tags.includes(tag)));
}

export type ImportLog = { platform: ImportPlatform; title: string; stars?: number; track?: string; result: string };
export type ImportOptions = { platforms?: ImportPlatform[]; perPlatform?: number; maxReviewed?: number; dryRun?: boolean; log?: (entry: ImportLog) => void };

/**
 * Writes up to perPlatform new stories per platform from its best posts above 2.5 stars, reviewing at most
 * maxReviewed candidates per platform. dryRun reviews and reports without writing. Run from a script: each story
 * takes several minutes of research, writing, review and painting.
 */
export async function importTechBuzzStories({ platforms = IMPORT_PLATFORMS, perPlatform = 3, maxReviewed = 10, dryRun = false, log = () => undefined }: ImportOptions = {}) {
  const written: string[] = [];
  for (const platform of platforms) {
    const candidates = await FETCHERS[platform]().catch(error => { log({ platform, title: "(feed)", result: `fetch failed: ${String(error).slice(0, 120)}` }); return []; });
    const done = await alreadyImported(candidates.map(candidate => importTag(platform, candidate.id)));
    let accepted = 0;
    for (const candidate of candidates.filter(candidate => !done.has(importTag(platform, candidate.id))).slice(0, maxReviewed)) {
      if (accepted >= perPlatform) break;
      try {
        const text = await candidate.load();
        const verdict = await rate(candidate, text);
        const track = DAILY_TRACKS.find(item => item.id === verdict.track);
        const entry = { platform, title: candidate.title, stars: verdict.stars, track: verdict.track };
        if (verdict.stars <= MIN_PUBLISHED_STARS || !track) { log({ ...entry, result: `skipped: ${verdict.verdict}` }); continue; }
        if (dryRun) { accepted++; log({ ...entry, result: `would write: ${verdict.angle}` }); continue; }
        const info = PLATFORM_INFO[platform];
        const inspiration: Inspiration = {
          brief: `Title: ${candidate.title}\n\n${text.slice(0, BRIEF_CHARS)}`, tag: importTag(platform, candidate.id), platformKey: info.key,
          credit: { title: candidate.title.slice(0, 200), author: candidate.author.slice(0, 80) || info.name, platform: info.name },
        };
        // The story's star review is its editor score in half stars, so it must round to more than 2.5.
        const story = await writeInspiredStory(track, verdict.angle, inspiration, MIN_PUBLISHED_STARS + 0.25);
        accepted++;
        written.push(story.slug);
        log({ ...entry, result: `written: ${story.slug} (${story.source.review?.stars ?? "?"} stars)` });
      } catch (error) {
        log({ platform, title: candidate.title, result: `failed: ${String(error).slice(0, 160)}` });
      }
    }
  }
  return written;
}
