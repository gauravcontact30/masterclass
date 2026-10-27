import "server-only";
import { generateText, gateway, Output } from "ai";
import { z } from "zod";
import { learningScenePrompt } from "@/lib/learning-image";
import { favouriteTag, type FavouriteTopic } from "@/lib/tech-buzz-favourites";
import { DAILY_TAG, DAILY_TRACKS, dailyDateTag, dailyTrackTag, isInternalTag, istDate, type DailyTrack } from "@/lib/tech-buzz-sections";
import type { TechBuzzArticle } from "@/lib/tech-buzz-data";
import { providerConfigured, providerModel } from "./ai-providers";
import { paint, store } from "./learning-study-pack";
import { createTechBuzzArticle, dailyEditionSlugs, expireTechBuzzCache, getTechBuzzArticleBySlug, updateTechBuzzContent } from "./tech-buzz-storage";

/*
 * The daily Tech Buzz edition: at 5:00 AM IST (vercel.json → /api/cron/tech-buzz-daily) one new story per track in
 * DAILY_TRACKS, written through the Vercel AI Gateway with a painted thumbnail and an in-article image, stored in
 * tech_buzz_articles and tagged so the page lands it in "Today's 5 at 5" and in its technology section.
 * Re-running the same day only fills the tracks that are missing.
 *
 * Each story is 1) researched from the track's official documentation (Perplexity, restricted to track.officialSites),
 * 2) written from those notes with numbered steps and bullet points as their own fields, and 3) scored by an editor
 * pass. Below 4 out of 5 it is rewritten once with the editor's notes; still below 4, it is not published until the
 * route is run again for that day. The official pages are kept as plain-text attribution, never links.
 */

const SYSTEM = [
  "You are the senior editor of MCB - Tech Buzz, the engineering blog of MasterClass Buddy, read by Indian software engineers preparing for better roles.",
  "Write one original, highly engaging, technically accurate blog post. Open with a hook from a real production situation, then teach: concrete steps, trade-offs, numbers, a complete, runnable multi-file code example where it helps (every file needed to run it), and pitfalls.",
  "Use current versions (Next.js 16+, React 19+, current LangChain/LangGraph APIs, current AWS service names). Never invent APIs; if unsure, describe the idea instead of naming a function.",
  "Teach like the best course on the topic: every section leaves the reader able to do something. Put procedures in `steps` (numbered, one action each) and checklists, options or pitfalls in `bulletPoints`; paragraphs explain why and never contain lists or inline numbering.",
  "When official documentation notes are given, they are the source of truth: follow their API names, versions, defaults and recommended order of steps, and do not state anything they contradict.",
  "Plain prose, no markdown symbols, no emojis, no citations or source lists, never mention other blog platforms or publications.",
].join("\n");

const MIN_SCORE = 4;
// Research, writing, review and one rewrite must leave time for the pictures inside the route's 300 s.
const REWRITE_BEFORE_MS = 170_000;
// Pictures must be stored by this point of the run, or the story is saved with the technology logo instead: a story
// lost to the 300 s limit costs a full rewrite on the next run, a missing picture costs nothing.
const SAVE_BY_MS = 280_000;

const schema = z.object({
  title: z.string().describe("A specific, curiosity-driven headline, at most 90 characters."),
  subtitle: z.string().describe("One sentence promising what the reader will be able to do, at most 180 characters."),
  summaryBullets: z.array(z.string()).describe("4-5 key takeaways a learner should remember, each one complete sentence under 120 characters."),
  tags: z.array(z.string()).describe("4-6 short topic tags, e.g. 'LangGraph', 'Checkpointing'."),
  techStack: z.array(z.string()).describe("3-6 technologies used in the post."),
  readTimeMinutes: z.number().int().describe("Honest reading time in minutes, 5-12."),
  founderTakeaway: z.string().describe("A closing 2-3 sentence takeaway for the reader's next interview or project."),
  coverScene: z.string().describe("A concrete scene for the thumbnail picture: objects and actions only, no text."),
  inlineScene: z.string().describe("A different concrete scene for the in-article diagram-like picture, objects and actions only, no text."),
  sections: z.array(z.object({
    heading: z.string(),
    paragraphs: z.array(z.string()).describe("2-4 paragraphs of 2-5 sentences, explanation only: no lists, no '1.' numbering, no '-' bullets."),
    steps: z.array(z.string()).nullable().describe("3-7 numbered steps to do this, each one imperative sentence without its number, or null when the section is not a procedure."),
    bulletPoints: z.array(z.string()).nullable().describe("3-6 short, parallel points (best practices, pitfalls, options, checks) without bullet symbols, or null."),
    code: z.object({ files: z.array(z.object({ filename: z.string().describe("A real path, e.g. src/app/page.tsx or package.json"), language: z.string(), code: z.string().describe("Complete file contents, at most 60 lines: real imports, no placeholders or '...'.") })).min(1).max(4) })
      .describe("A complete, end-to-end runnable example: every file a reader needs to run it (for example package.json, the entry file and one module), shown as editor tabs.").nullable(),
    callout: z.object({ type: z.enum(["tip", "insight", "warning"]), text: z.string() }).nullable(),
  })).describe("5-6 sections; at least one has code when the topic is about code or configuration; at least two have steps or bulletPoints."),
});
type Draft = z.infer<typeof schema>;

const reviewSchema = z.object({
  accuracy: z.number().describe("1-5: agrees with the official notes and current APIs, nothing invented."),
  learningValue: z.number().describe("1-5: a working engineer learns something concrete and usable."),
  structure: z.number().describe("1-5: clear sections; procedures as numbered steps, checklists as bullets, no lists hidden in paragraphs."),
  code: z.number().describe("1-5: examples complete and runnable as shown (5 if the story rightly has no code)."),
  score: z.number().describe("Overall 1-5, one decimal. 4 or above means ready to publish."),
  issues: z.array(z.string()).describe("Specific fixes needed to reach 5, most important first; empty if none."),
});

type Research = { notes: string; sources: { title: string; site: string }[] };

let perplexityBusy = 0;
const perplexityQueue: (() => void)[] = [];
// Perplexity refuses more than ~3 concurrent sonar calls with 429, so the five tracks take turns three at a time.
async function withPerplexitySlot<T>(task: () => Promise<T>): Promise<T> {
  if (perplexityBusy >= 3) await new Promise<void>(resolve => perplexityQueue.push(resolve));
  perplexityBusy++;
  try { return await task(); } finally { perplexityBusy--; perplexityQueue.shift()?.(); }
}

const hostOf = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } };
const onSite = (host: string, sites: string[]) => sites.some(site => host === site || host.endsWith(`.${site}`));
const pageTitle = (title: string, url: string, host: string) =>
  (title || new URL(url).pathname.split("/").filter(Boolean).at(-1)?.replace(/[-_]/g, " ") || host).replace(/\s+[|·–-]\s+[^|·–-]+$/, "").slice(0, 120);

/** Notes from the track's official documentation for today's angle; empty when Perplexity is not configured or fails. */
async function research(track: DailyTrack, angle: string): Promise<Research> {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key || key.includes("xxx")) return { notes: "", sources: [] };
  const prompt = [
    `Topic: ${angle} (${track.label}).`,
    "Using only the official documentation, write dense research notes for a senior engineer writing a tutorial on this topic:",
    "1. Current versions and the exact API, CLI or service names involved.",
    "2. The officially recommended steps, in order.",
    "3. Defaults, limits and configuration options that matter in production.",
    "4. Best practices and common pitfalls the documentation warns about.",
    "5. One minimal working example in the documentation's own style.",
    "Plain text, numbered and bulleted notes, no opinions, nothing the documentation does not say.",
  ].join("\n");
  try {
    return await withPerplexitySlot(async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        const response = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "sonar-pro", messages: [{ role: "user", content: prompt }], search_domain_filter: track.officialSites.slice(0, 20), max_tokens: 3000 }),
          signal: AbortSignal.timeout(45_000),
        });
        if (response.status === 429 || response.status >= 500) { await new Promise(done => setTimeout(done, 2000 * 2 ** attempt)); continue; }
        if (!response.ok) throw new Error(`perplexity ${response.status}`);
        const body = await response.json() as { choices?: { message?: { content?: string } }[]; citations?: string[]; search_results?: { title?: string; url?: string }[] };
        const pages = body.search_results?.length ? body.search_results : (body.citations ?? []).map(url => ({ url, title: "" }));
        const seen = new Set<string>();
        const sources = pages.flatMap(({ url = "", title = "" }) => {
          const host = hostOf(url);
          if (!host || !onSite(host, track.officialSites) || seen.has(url)) return [];
          seen.add(url);
          return [{ title: pageTitle(title, url, host), site: host }];
        }).slice(0, 5);
        return { notes: (body.choices?.[0]?.message?.content ?? "").replace(/\[\d+\]/g, "").slice(0, 12_000), sources };
      }
      return { notes: "", sources: [] };
    });
  } catch (error) {
    console.error("tech_buzz_research_failed", track.id, String(error).slice(0, 200));
    return { notes: "", sources: [] };
  }
}

async function draft(track: DailyTrack, angle: string, date: string, notes: string, fixes: string[], timeoutMs: number, current?: string): Promise<Draft> {
  const prompt = [
    `Track: ${track.label}.`, `Today's angle: ${angle}.`, `Date: ${date}.`,
    current ? `This is a rewrite of a published story. Keep its topic and its headline's promise, correct anything the notes contradict, and make it the best lesson on the subject:
${current}` : "",
    notes ? `Official documentation notes (source of truth):\n${notes}` : "No documentation notes are available today: stay with APIs you are certain of.",
    fixes.length ? `Your previous draft was sent back by the editor. Fix all of these:\n${fixes.map((fix, i) => `${i + 1}. ${fix}`).join("\n")}` : "",
    "Write today's post for this track.",
  ].filter(Boolean).join("\n\n");
  const { output } = await generateText({
    model: gateway(providerModel("gateway")), system: SYSTEM, prompt,
    output: Output.object({ schema }), maxRetries: 2, abortSignal: AbortSignal.timeout(timeoutMs),
  });
  return output;
}

/** The editor pass. An inaccurate story cannot score more than one point above its accuracy. */
async function review(story: Draft, notes: string) {
  const { output } = await generateText({
    model: gateway(providerModel("gateway")),
    system: "You are the strict technical editor of an engineering learning blog. Score the draft honestly against the rubric; a 4 means you would put your name on it.",
    prompt: `${notes ? `Official documentation notes:\n${notes}\n\n` : ""}Draft (JSON):\n${JSON.stringify(story)}`,
    output: Output.object({ schema: reviewSchema }), maxRetries: 1, abortSignal: AbortSignal.timeout(60_000),
  });
  return { ...output, score: Math.max(1, Math.min(5, output.score, output.accuracy + 1)) };
}

const slugify = (text: string) => text.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-");
const dayNumber = (date: string) => Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);

type StoryOptions = { angle?: string; tags?: string[]; daily?: boolean; budget?: { draftMs: number; rewriteBeforeMs: number } };

async function writeStory(track: DailyTrack, date: string, runStarted = Date.now(), { angle: ownAngle, tags = [], daily = true, budget }: StoryOptions = {}): Promise<TechBuzzArticle> {
  const angle = ownAngle ?? track.angles[dayNumber(date) % track.angles.length];
  const { output, verdict, sources } = await researchedDraft(track, angle, date, undefined, budget);
  const slug = `${track.id}-${date}-${slugify(output.title)}`.slice(0, 99).replace(/-+$/, "");
  // Thumbnail and blog image are painted together; a failed picture keeps the story (the page shows the technology logo).
  const paintMs = SAVE_BY_MS - (Date.now() - runStarted);
  const [cover, inline] = await Promise.allSettled([output.coverScene, output.inlineScene].map(async (scene, i) => {
    if (paintMs < 20_000) throw new Error("no_time_to_paint");
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("paint_timeout")), paintMs); });
    try {
      const picture = await Promise.race([paint(learningScenePrompt({ subject: `${track.short}: ${output.title}`, scene })), timeout]);
      return await Promise.race([store(`tech-buzz/daily/${date}/${track.id}-${i === 0 ? "cover" : "inline"}.webp`, picture), timeout]);
    } finally { clearTimeout(timer); }
  }));
  const coverUrl = cover.status === "fulfilled" ? cover.value : `/images/tech/${track.techId}.png`;
  const inlineUrl = inline.status === "fulfilled" ? inline.value : null;
  return createTechBuzzArticle({
    slug,
    title: output.title.slice(0, 250),
    subtitle: output.subtitle.slice(0, 500),
    category: track.category,
    technology: track.technology,
    techId: track.techId,
    techBadgeColor: track.color,
    readTimeMinutes: Math.min(15, Math.max(4, output.readTimeMinutes)),
    featured: true,
    likes: 0, dislikes: 0, upvotes: 0, claps: 0,
    // Not rated yet: the page shows "New" until readers rate it.
    rating: { average: 5, count: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
    author: { name: "MCB Editorial", role: "Tech Buzz Daily Desk", avatar: "/images/brand/mcb-avatar.svg", handle: "@mcb", verified: true },
    coverImage: coverUrl,
    tags: [...output.tags.slice(0, 6), ...(daily ? [DAILY_TAG, dailyDateTag(date), dailyTrackTag(track.id)] : []), ...tags],
    rankingScore: 95,
    source: { name: "MasterClass Buddy", domain: "masterclass", trustScore: "", editorScore: Math.round(verdict.score * 10) / 10, ...(sources.length ? { basedOn: sources } : {}) },
    summaryBullets: output.summaryBullets.slice(0, 5),
    reactions: { heart: 0, unicorn: 0, rocket: 0, mindblown: 0 },
    commentsCount: 0,
    comments: [],
    techStack: output.techStack.slice(0, 6),
    membershipTier: "Free Preview",
    founderTakeaway: output.founderTakeaway,
    publishedAt: new Date().toISOString(),
    // The blog image opens the second section, after the hook.
    contentSections: sectionsOf(output, [undefined, inlineUrl ? { src: inlineUrl, alt: `Illustration: ${output.title}` } : undefined]),
  });
}

/** The steps writeStory and refineTechBuzzStory share: research, draft, review, one rewrite below the bar. */
async function researchedDraft(track: DailyTrack, angle: string, date: string, current?: string, { draftMs = 150_000, rewriteBeforeMs = REWRITE_BEFORE_MS } = {}) {
  const started = Date.now();
  const { notes, sources } = await research(track, angle);
  let output = await draft(track, angle, date, notes, [], draftMs, current);
  let verdict = await review(output, notes);
  if (verdict.score < MIN_SCORE && Date.now() - started < rewriteBeforeMs) {
    output = await draft(track, angle, date, notes, verdict.issues.slice(0, 8), Math.max(60_000, Math.min(draftMs, rewriteBeforeMs + 80_000 - (Date.now() - started))), current);
    verdict = await review(output, notes);
  }
  if (verdict.score < MIN_SCORE) throw new Error(`below_quality_bar ${verdict.score.toFixed(1)}: ${verdict.issues.slice(0, 2).join("; ")}`);
  return { output, verdict, sources };
}

const sectionsOf = (output: Draft, images: ({ src: string; alt: string } | undefined)[]): TechBuzzArticle["contentSections"] =>
  output.sections.slice(0, 6).map((section, i) => ({
    heading: section.heading,
    paragraphs: section.paragraphs,
    ...(section.steps?.length ? { steps: section.steps } : {}),
    ...(section.bulletPoints?.length ? { bulletPoints: section.bulletPoints } : {}),
    ...(section.code?.files.length ? { codeSnippet: { language: section.code.files[0].language, filename: section.code.files[0].filename, code: section.code.files[0].code, files: section.code.files } } : {}),
    ...(section.callout ? { callout: section.callout } : {}),
    ...(images[i] ? { image: images[i] } : {}),
  }));

/** The daily track a story belongs to: its daily-track tag, else the track covering its technology. */
const trackOf = (story: TechBuzzArticle) =>
  DAILY_TRACKS.find(track => story.tags.includes(dailyTrackTag(track.id))) ?? DAILY_TRACKS.find(track => story.techId && track.techIds.includes(story.techId));

/**
 * Rewrites one stored story through the same research and review as the daily edition, keeping its slug, title,
 * pictures, counters and ratings. Throws when the story has no matching track or the rewrite stays below 4/5.
 */
export async function refineTechBuzzStory(slug: string, { dryRun = false } = {}) {
  const story = await getTechBuzzArticleBySlug(slug);
  if (!story) throw new Error("not_found");
  const track = trackOf(story);
  if (!track) throw new Error("no_track");
  const current = JSON.stringify({ title: story.title, subtitle: story.subtitle, tags: story.tags.filter(tag => !isInternalTag(tag)), sections: story.contentSections.map(({ image, ...section }) => { void image; return section; }) }).slice(0, 20_000);
  const { output, verdict, sources } = await researchedDraft(track, `${story.title}: ${story.subtitle}`, istDate(), current,
    // Run from a script, not the cron route: no 300 s limit.
    { draftMs: 420_000, rewriteBeforeMs: Infinity });
  const content = {
    subtitle: output.subtitle.slice(0, 500),
    summaryBullets: output.summaryBullets.slice(0, 5),
    founderTakeaway: output.founderTakeaway,
    techStack: output.techStack.slice(0, 6),
    readTimeMinutes: Math.min(15, Math.max(4, output.readTimeMinutes)),
    source: { ...story.source, editorScore: Math.round(verdict.score * 10) / 10, ...(sources.length ? { basedOn: sources } : {}) },
    // Pictures stay where they were: section i keeps the image it had.
    contentSections: sectionsOf(output, story.contentSections.map(section => section.image)),
  };
  if (!dryRun) await updateTechBuzzContent(slug, content);
  return { slug, score: verdict.score, sources: sources.length, sections: content.contentSections.length, issues: verdict.issues };
}

/**
 * Writes the researched, editor-reviewed story for one "Community favourites" topic (lib/tech-buzz-favourites.ts),
 * tagged `fav:<id>` and kept out of the daily edition. Run from scripts/write-favourite-stories.ts, so it has no
 * 300 s route limit.
 */
export async function writeFavouriteStory(topic: FavouriteTopic, date = istDate()) {
  const track: DailyTrack = {
    id: topic.id, label: topic.label, short: topic.label, techIds: [topic.techId], angles: [topic.angle],
    category: topic.category, technology: topic.technology, techId: topic.techId, color: topic.color, officialSites: topic.officialSites,
  };
  // No route limit here: a run start ten minutes ahead leaves the pictures all the time they need.
  const story = await writeStory(track, date, Date.now() + 10 * 60_000, {
    angle: topic.angle, tags: [favouriteTag(topic.id)], daily: false, budget: { draftMs: 420_000, rewriteBeforeMs: Infinity },
  });
  expireTechBuzzCache();
  return story;
}

export type DailyRun = { date: string; written: string[]; skipped: string[]; failed: { track: string; error: string }[] };

/** Writes today's (IST) missing daily stories, all five tracks at once so the run fits the function's time limit. */
export async function generateTechBuzzDaily(date = istDate()): Promise<DailyRun> {
  if (!providerConfigured("gateway")) throw new Error("ai_gateway_not_configured");
  const existing = await dailyEditionSlugs(date);
  const todo = DAILY_TRACKS.filter(track => !existing.some(slug => slug.startsWith(`${track.id}-${date}`)));
  const started = Date.now();
  const results = await Promise.allSettled(todo.map(track => writeStory(track, date, started)));
  const run: DailyRun = { date, written: [], skipped: DAILY_TRACKS.filter(track => !todo.includes(track)).map(track => track.id), failed: [] };
  results.forEach((result, i) => {
    if (result.status === "fulfilled") run.written.push(result.value.slug);
    else run.failed.push({ track: todo[i].id, error: String(result.reason).slice(0, 200) });
  });
  if (run.written.length) expireTechBuzzCache();
  return run;
}
