import "server-only";
import { after } from "next/server";
import { cacheGet, cacheSet } from "@/lib/redis";
import { NEWS_COVER_SCENES, NEWS_COVER_STYLE } from "@/lib/news-covers";
import {
  siAccenture, siAirbnb, siAnthropic, siApple, siAtlassian, siCisco, siClaude, siCloudflare, siDatabricks, siDeepmind, siGithub, siGoldmansachs,
  siGoogle, siGooglegemini, siHuggingface, siInfosys, siIntel, siLangchain, siMeta, siMistralai, siN8n, siNetflix, siNextdotjs, siNvidia, siPaypal,
  siPaytm, siPerplexity, siPhonepe, siRazorpay, siReact, siSamsung, siShopify, siSnowflake, siSpacex, siSpotify, siStripe, siSwiggy, siTata, siTesla,
  siUber, siVercel, siWipro, siX, siZoho, siZomato, type SimpleIcon,
} from "simple-icons";
import { NEWS_EXTRA, NEWS_PER_SLIDE, NEWS_SLIDES, QUESTIONS_PER_SLIDE, type InterviewAsk, type LandingNews, type NewsLogo, type NewsSlideData, type NewsSlideId, type NewsStory } from "@/lib/landing-news";
import { DEFAULT_LANDING_NEWS } from "@/lib/landing-news-fallback";

/*
 * Fills the landing page's "Fresh in tech" slides with this week's stories, searched live by Perplexity (sonar).
 * Every story must link to a page Perplexity actually searched: an item whose URL is not among the search results
 * is dropped rather than shown with a link that may not exist.
 * The finished set is kept in Redis, shared by every server instance and surviving deploys and restarts, so a visitor
 * never waits for the searches. The set is rebuilt every 21 days by app/api/cron/news-refresh (refreshNews), which also
 * paints each slide a new cover from its lead story; a slide whose new search comes back empty keeps its previous
 * stories and cover.
 */
const ENDPOINT = "https://api.perplexity.ai/chat/completions";
// One search with the learning notes takes ~10 s, several at once take longer.
const TIMEOUT_MS = 50_000;

/** Companies a story or interview report may name. A simple-icons mark where one exists, else a monogram. */
const BRANDS: Record<string, SimpleIcon | { hex: string }> = {
  Anthropic: siAnthropic, Claude: siClaude, OpenAI: { hex: "000000" }, Google: siGoogle, "Google DeepMind": siDeepmind, Gemini: siGooglegemini,
  Microsoft: { hex: "5E5E5E" }, Amazon: { hex: "FF9900" }, AWS: { hex: "FF9900" }, Meta: siMeta, Apple: siApple, Nvidia: siNvidia, Tesla: siTesla,
  SpaceX: siSpacex, xAI: siX, X: siX, LangChain: siLangchain, n8n: siN8n, Vercel: siVercel, "Next.js": siNextdotjs, React: siReact, Netflix: siNetflix,
  Uber: siUber, Airbnb: siAirbnb, Stripe: siStripe, Shopify: siShopify, Spotify: siSpotify, Cloudflare: siCloudflare, Databricks: siDatabricks,
  Snowflake: siSnowflake, GitHub: siGithub, "Hugging Face": siHuggingface, "Mistral AI": siMistralai, Perplexity: siPerplexity, Samsung: siSamsung,
  Intel: siIntel, Cisco: siCisco, Atlassian: siAtlassian, PayPal: siPaypal, "Goldman Sachs": siGoldmansachs, Flipkart: { hex: "2874F0" },
  Swiggy: siSwiggy, Zomato: siZomato, Paytm: siPaytm, PhonePe: siPhonepe, Razorpay: siRazorpay, Zoho: siZoho, Infosys: siInfosys, TCS: siTata,
  Wipro: siWipro, Accenture: siAccenture, LinkedIn: { hex: "0A66C2" }, Salesforce: { hex: "00A1E0" }, Oracle: { hex: "C74634" }, IBM: { hex: "1F70C1" },
  Adobe: { hex: "FA0F00" }, Walmart: { hex: "0071CE" }, "JPMorgan Chase": { hex: "005EB8" },
};
const BRAND_NAMES = Object.keys(BRANDS);
const ALIASES: Record<string, string> = { "amazon web services": "AWS", "google ai": "Google", "deepmind": "Google DeepMind", "tata consultancy services": "TCS", "jp morgan": "JPMorgan Chase", "jpmorgan": "JPMorgan Chase", "facebook": "Meta", "grok": "xAI", "openai inc": "OpenAI" };

export function brandLogo(name: string | null | undefined): NewsLogo | null {
  const clean = name?.trim();
  if (!clean || /^(other|none|unknown|n\/a)$/i.test(clean)) return null;
  const key = BRAND_NAMES.find(brand => brand.toLowerCase() === clean.toLowerCase()) ?? ALIASES[clean.toLowerCase()];
  if (!key) return { name: clean.slice(0, 40), hex: "73726C", path: null };
  const brand = BRANDS[key];
  return { name: key, hex: brand.hex, path: "path" in brand ? brand.path : null };
}

/** What each slide asks for. The questions slides ask for interview reports instead of news. */
const BRIEFS: Record<NewsSlideId, string> = {
  "ai-labs": "AI developer news from Anthropic (Claude, Claude Code), OpenAI, Google (Gemini, Google AI) and Microsoft (Copilot, Azure AI): model and tool launches, API changes and developer features. Cover at least three of these companies.",
  agentic: "Agentic AI: AI agents, the Model Context Protocol, LangChain, LangGraph, LangSmith and n8n releases, and agent frameworks or patterns that developers can use.",
  "system-design": "Software system design and architecture: engineering blog posts on scaling, databases, caching, distributed systems, notable outages and postmortems from well-known companies.",
  frontend: "Frontend web development: Next.js 16 releases and features, React 19 and later, Zustand, and TanStack (Query, Router, Start, Table) releases.",
  aws: "Amazon Web Services announcements for popular services such as Lambda, S3, EC2, DynamoDB, ECS, EKS, Bedrock, SageMaker, CloudFront and RDS.",
  musk: "Elon Musk's AI and space ventures: xAI and Grok, Tesla's AI and autonomy work, Optimus, SpaceX launches, Starship and Starlink.",
  "amazon-ai": "Amazon and artificial intelligence: Alexa+, Amazon Nova models, Amazon Bedrock, Rufus, Amazon's AI chips (Trainium) and its AI partnerships.",
  "questions-tech": "core software engineering topics: JavaScript, React, Node.js, system design, SQL and data structures",
  "questions-agentic": "agentic AI and LLM engineering: AI agents, RAG, tool calling, MCP, LangChain/LangGraph, evaluation and guardrails",
  trending: "The biggest technology stories of the last three weeks across AI, AWS, Google, Microsoft, Amazon, OpenAI, Anthropic, Meta, Nvidia and Apple.",
};

type SearchResult = { url: string; date?: string | null; title?: string };
type Reply = { content: string; results: SearchResult[] };

/*
 * Perplexity allows only a few requests at once on this account (a burst of ten gets 429 for most), and Study Buddy
 * shares that allowance. So the news searches queue two at a time, and a rate-limited one waits and tries again.
 */
const IN_FLIGHT = 2, RATE_RETRIES = 4;
let running = 0;
const waiting: (() => void)[] = [];
async function queued<T>(task: () => Promise<T>): Promise<T> {
  if (running >= IN_FLIGHT) await new Promise<void>(resolve => waiting.push(resolve));
  running++;
  try { return await task(); } finally { running--; waiting.shift()?.(); }
}
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function ask(system: string, prompt: string, schema: object, recency: "day" | "week" | "month" | "year"): Promise<Reply | null> {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) return null;
  for (let attempt = 0; ; attempt++) {
    const reply = await queued(() => request(key, system, prompt, schema, recency));
    if (reply !== "rate-limited") return reply;
    if (attempt >= RATE_RETRIES) throw new Error("Perplexity 429 after retries");
    await pause(1500 * 2 ** attempt);
  }
}

async function request(key: string, system: string, prompt: string, schema: object, recency: string): Promise<Reply | "rate-limited"> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "sonar", search_recency_filter: recency, temperature: 0.1,
      messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
      response_format: { type: "json_schema", json_schema: { schema } },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (response.status === 429) return "rate-limited";
  if (!response.ok) throw new Error(`Perplexity ${response.status}`);
  const body = await response.json() as { choices?: { message?: { content?: string } }[]; search_results?: SearchResult[]; citations?: string[] };
  const results = body.search_results ?? (body.citations ?? []).map(url => ({ url }));
  return { content: body.choices?.[0]?.message?.content ?? "", results };
}

/** Host and path without "www.", query, hash or trailing slash, so the same page matches however it is written. */
export function pageKey(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) return null;
    return `${parsed.hostname.replace(/^www\./, "")}${parsed.pathname.replace(/\/+$/, "")}`.toLowerCase();
  } catch { return null; }
}
/** A site's front page or its news/blog listing, not an article: the story would not be on it for long. */
export const isIndexPage = (key: string) => { const last = key.split("/").slice(1).at(-1) ?? ""; return !last || /^(news|blog|blogs|updates|press|newsroom|articles|latest|ai|technology|tech)$/.test(last); };
const hostOf = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } };
const clip = (text: unknown, max: number) => { const value = String(text ?? "").replace(/\s*\[\d+\]/g, "").replace(/\s+/g, " ").trim(); return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value; };
const isoDay = (text: unknown) => { const match = /^\d{4}-\d{2}-\d{2}/.exec(String(text ?? "")); return match && !Number.isNaN(Date.parse(match[0])) ? match[0] : null; };
function parse<T>(content: string): T | null {
  try { return JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, "")) as T; } catch { return null; }
}

const SYSTEM = "You are the news editor of a learning site for software engineers. Use only facts from your search results; never invent stories, dates, companies or links. Every URL must be copied exactly from a search result.";
const STORY_SCHEMA = { type: "object", properties: { items: { type: "array", items: { type: "object", properties: {
  title: { type: "string" }, summary: { type: "string" }, source: { type: "string" }, url: { type: "string" }, date: { type: "string" }, company: { type: "string" },
  points: { type: "array", items: { type: "string" } }, why: { type: "string" },
  concept: { type: "object", properties: { term: { type: "string" }, explain: { type: "string" } }, required: ["term", "explain"] },
}, required: ["title", "summary", "source", "url", "date", "company", "points", "why", "concept"] } } }, required: ["items"] };
type RawStory = { title?: string; summary?: string; source?: string; url?: string; date?: string; company?: string; points?: string[]; why?: string; concept?: { term?: string; explain?: string } };

/** Keeps only stories that link to a searched page, are recent enough and are not the same event twice. */
export function verifiedStories(items: RawStory[], results: SearchResult[], now: number, maxAgeDays: number): NewsStory[] {
  const searched = new Map(results.map(result => [pageKey(result.url), result] as const).filter(([key]) => key));
  const seen = new Set<string>(), titles = new Set<string>();
  const stories: NewsStory[] = [];
  for (const item of items) {
    const key = item.url ? pageKey(item.url) : null;
    const result = key ? searched.get(key) : undefined;
    if (!key || !result || seen.has(key) || isIndexPage(key)) continue;
    const date = isoDay(result.date) ?? isoDay(item.date);
    if (!date || now - Date.parse(date) > maxAgeDays * 86_400_000 || Date.parse(date) - now > 86_400_000) continue;
    const title = clip(item.title, 110), summary = clip(item.summary, 260);
    const gist = title.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").filter(word => word.length > 3).slice(0, 5).join(" ");
    if (!title || !summary || titles.has(gist)) continue;
    seen.add(key); titles.add(gist);
    const term = clip(item.concept?.term, 48), explain = clip(item.concept?.explain, 200);
    stories.push({
      title, summary, source: clip(item.source, 40) || hostOf(result.url), url: result.url, date, logo: brandLogo(item.company),
      points: (Array.isArray(item.points) ? item.points : []).map(point => clip(point, 140)).filter(Boolean).slice(0, 3),
      why: clip(item.why, 220) || null, concept: term && explain ? { term, explain } : null,
    });
  }
  return stories.sort((a, b) => b.date.localeCompare(a.date));
}

async function storiesFor(id: NewsSlideId, now: number): Promise<NewsStory[]> {
  // The first NEWS_PER_SLIDE are the slide's cards; the rest are listed under its cover as "More headlines".
  const prompt = (days: number) => `Find the ${NEWS_PER_SLIDE + NEWS_EXTRA + 2} most important, distinct news stories published in the last ${days} days about: ${BRIEFS[id]}
Today is ${new Date(now).toISOString().slice(0, 10)}. No two stories about the same event. For each give: title (a plain headline, at most 90 characters), summary (two short sentences, at most 220 characters: what happened and why it matters to developers), source (the publisher's name), url (copied exactly from your search results), date (publication date, YYYY-MM-DD), company (the main organisation, preferably one of: ${BRAND_NAMES.join(", ")}; otherwise its name, or "other"),
points (three short key facts from the article, each at most 110 characters), why (one sentence, at most 180 characters, on why it matters to software engineers and learners) and concept (one technical term from the story a learner should know: term at most 40 characters, explain is a plain one-sentence explanation of at most 180 characters).`;
  // One refresh every 21 days covers those three weeks; a thin window widens to the month.
  const tries: [number, "day" | "week" | "month"][] = [[21, "month"], [30, "month"]];
  let best: NewsStory[] = [];
  for (const [days, recency] of tries) {
    const reply = await ask(SYSTEM, prompt(days), STORY_SCHEMA, recency);
    if (!reply) return [];
    const stories = verifiedStories(parse<{ items: RawStory[] }>(reply.content)?.items ?? [], reply.results, now, days + 2);
    if (stories.length > best.length) best = stories;
    // The wider search only runs when the week was too thin to fill the slide at all.
    if (best.length >= 2) break;
  }
  return best.slice(0, NEWS_PER_SLIDE + NEWS_EXTRA);
}

const QUESTION_SCHEMA = { type: "object", properties: { items: { type: "array", items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" }, rating: { type: "integer" }, companies: { type: "array", items: { type: "string" } }, source: { type: "string" }, url: { type: "string" } }, required: ["question", "answer", "rating", "companies", "source", "url"] } } }, required: ["items"] };
type RawQuestion = { question?: string; answer?: string; rating?: number; companies?: string[]; source?: string; url?: string };

/** Companies are shown only when the report they came from is one of the searched pages. */
export function verifiedQuestions(items: RawQuestion[], results: SearchResult[]): InterviewAsk[] {
  const searched = new Map(results.map(result => [pageKey(result.url), result.url] as const).filter(([key]) => key));
  const seen = new Set<string>();
  const out: InterviewAsk[] = [];
  for (const item of items) {
    const question = clip(item.question, 160), answer = clip(item.answer, 280);
    const gist = question.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!question || !answer || seen.has(gist)) continue;
    seen.add(gist);
    const url = item.url ? searched.get(pageKey(item.url) ?? "") ?? null : null;
    const companies = url ? [...new Map((item.companies ?? []).map(brandLogo).filter((logo): logo is NewsLogo => Boolean(logo)).map(logo => [logo.name, logo])).values()].slice(0, 3) : [];
    out.push({ question, answer, rating: Math.min(5, Math.max(1, Math.round(Number(item.rating) || 3))), companies, url, source: url ? clip(item.source, 40) || hostOf(url) : null });
  }
  return out.sort((a, b) => b.rating - a.rating).slice(0, QUESTIONS_PER_SLIDE + NEWS_EXTRA);
}

async function questionsFor(id: NewsSlideId): Promise<InterviewAsk[]> {
  const prompt = `Find the ${QUESTIONS_PER_SLIDE + NEWS_EXTRA + 2} interview questions about ${BRIEFS[id]} that candidates most often report being asked in recent technical interviews (2025 or 2026) at well-known companies, from interview reports such as Glassdoor, LeetCode Discuss, Blind, GeeksforGeeks interview experiences or engineering blogs.
For each give: question; answer (a correct answer in at most two short sentences, at most 240 characters); rating (1 to 5, how often candidates report it, 5 = very common); companies (one to three companies the source says asked it, preferably named as in: ${BRAND_NAMES.join(", ")}; an empty list if the source names none); source (the site's name) and url (copied exactly from your search results).`;
  const reply = await ask(SYSTEM, prompt, QUESTION_SCHEMA, "year");
  return reply ? verifiedQuestions(parse<{ items: RawQuestion[] }>(reply.content)?.items ?? [], reply.results) : [];
}

/** One slide, searched now: a timeout or a thin answer gets one more try before the slide is marked not fresh. */
async function searchSlide(id: NewsSlideId): Promise<NewsSlideData> {
  const kind = NEWS_SLIDES.find(slide => slide.id === id)!.kind;
  const now = Date.now();
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const slide: NewsSlideData = kind === "news" ? { id, kind, fresh: true, stories: await storiesFor(id, now) } : { id, kind, fresh: true, questions: await questionsFor(id) };
      if (slide.kind === "news" ? slide.stories.length >= 2 : slide.questions.length >= 3) return slide;
    } catch (error) {
      console.warn(`landing news "${id}" attempt ${attempt} failed: ${String(error).slice(0, 200)}`);
    }
  }
  const fallback = DEFAULT_LANDING_NEWS.slides.find(s => s.id === id);
  if (fallback) return fallback;
  return kind === "news" ? { id, kind, fresh: false, stories: [] } : { id, kind, fresh: false, questions: [] };
}

const STORE_KEY = "landing:news:v2";
/** How long a set counts as fresh (the refresh cycle), and how long Redis keeps one at all. */
export const NEWS_REFRESH_DAYS = 21;
const FRESH_MS = NEWS_REFRESH_DAYS * 86_400_000, KEEP_SECONDS = 45 * 86_400;
type StoredNews = LandingNews & { builtAt: number };
let building: Promise<StoredNews> | null = null;

/** Searches every slide (two at a time, through the queue above) and stores the set; empty slides keep their old stories. */
function rebuild(previous: StoredNews | null): Promise<StoredNews> {
  building ??= (async () => {
    const searched = await Promise.all(NEWS_SLIDES.map(slide => searchSlide(slide.id)));
    // A new search starts without a cover (refreshNews paints one); an empty one keeps the old stories and cover.
    const slides = searched.map(slide => slide.fresh ? { ...slide, cover: null } : previous?.slides.find(old => old.id === slide.id) ?? slide);
    const fresh = searched.some(slide => slide.fresh);
    const set: StoredNews = { slides, updatedAt: fresh ? new Date().toISOString() : previous?.updatedAt ?? null, builtAt: fresh ? Date.now() : previous?.builtAt ?? 0 };
    if (fresh) await cacheSet(STORE_KEY, set, KEEP_SECONDS);
    return set;
  })().finally(() => { building = null; });
  return building;
}

/** Every slide of the carousel: the stored set at once (refreshed in the background when stale), or a first build. */
export async function landingNews(): Promise<LandingNews> {
  const stored = await cacheGet<StoredNews>(STORE_KEY);
  const shown = ({ slides, updatedAt }: StoredNews): LandingNews => ({ slides, updatedAt });
  if (!stored?.slides?.length) return shown(await rebuild(null));
  // The cron refreshes on schedule; this only catches a set the cron missed by more than a day, or empty slides.
  if (Date.now() - stored.builtAt > FRESH_MS + 86_400_000 || stored.slides.some(slide => !slide.fresh)) after(() => rebuild(stored).then(() => undefined));
  return shown(stored);
}

/** A cover for one slide: its standing scene, steered toward the lead story (shown with objects, never words). */
function coverPrompt(slide: NewsSlideData) {
  const lead = slide.kind === "news" ? slide.stories[0] : null;
  const ask = slide.kind === "questions" ? slide.questions[0] : null;
  const hint = lead ? `Also hint at this period's lead story, "${lead.title}" (${lead.summary}), through objects and actions only.`
    : ask ? `Also hint at the most-asked question, "${ask.question}", through objects and actions only.` : "";
  return `${NEWS_COVER_SCENES[slide.id] ?? ""} ${hint} ${NEWS_COVER_STYLE}`;
}

/**
 * The 21-day refresh (app/api/cron/news-refresh): rebuilds the stories when the set is due (or `force`), then paints a
 * new cover for every slide that has none yet, within `budgetMs` so the function never runs out of time; covers it
 * does not reach are painted on the next run. Returns what it did.
 */
export async function refreshNews({ force = false, budgetMs = 200_000 }: { force?: boolean; budgetMs?: number } = {}) {
  const started = Date.now();
  let set = await cacheGet<StoredNews>(STORE_KEY);
  // The check runs weekly (Monday 00:00 IST), so a set built a few minutes after one run is due at the third run on.
  const due = force || !set?.slides?.length || Date.now() - set.builtAt > FRESH_MS - 3_600_000;
  if (due) set = await rebuild(set);
  if (!set?.slides?.length) return { rebuilt: due, covers: 0, pending: 0 };
  const missing = set.slides.filter(slide => slide.fresh && !slide.cover);
  // Loaded here, not at the top: the AI SDK and image tools are only needed on the refresh run.
  const { paint, store } = await import("./learning-study-pack");
  let covers = 0;
  // Three at a time, started 13 s apart: the gateway allows five pictures a minute on this team.
  const queue = [...missing];
  await Promise.all([0, 1, 2].map(async lane => {
    await new Promise(resolve => setTimeout(resolve, lane * 13_000));
    for (let slide = queue.shift(); slide; slide = queue.shift()) {
      if (Date.now() - started > budgetMs) return;
      try {
        const webp = await paint(coverPrompt(slide));
        slide.cover = await store(`news/${set!.builtAt}/${slide.id}.webp`, webp);
        covers++;
      } catch (error) { console.warn(`news cover "${slide.id}" failed: ${String(error).slice(0, 200)}`); }
    }
  }));
  if (covers) await cacheSet(STORE_KEY, set, KEEP_SECONDS);
  return { rebuilt: due, covers, pending: set.slides.filter(slide => slide.fresh && !slide.cover).length };
}
