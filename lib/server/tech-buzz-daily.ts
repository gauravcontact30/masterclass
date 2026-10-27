import "server-only";
import { generateText, gateway, Output } from "ai";
import { z } from "zod";
import { learningScenePrompt } from "@/lib/learning-image";
import { DAILY_TAG, DAILY_TRACKS, dailyDateTag, dailyTrackTag, istDate, type DailyTrack } from "@/lib/tech-buzz-sections";
import type { TechBuzzArticle } from "@/lib/tech-buzz-data";
import { providerConfigured, providerModel } from "./ai-providers";
import { paint, store } from "./learning-study-pack";
import { createTechBuzzArticle, dailyEditionSlugs, expireTechBuzzCache } from "./tech-buzz-storage";

/*
 * The daily Tech Buzz edition: at 5:00 AM IST (vercel.json → /api/cron/tech-buzz-daily) one new story per track in
 * DAILY_TRACKS, written through the Vercel AI Gateway with a painted thumbnail and an in-article image, stored in
 * tech_buzz_articles and tagged so the page lands it in "Today's 5 at 5" and in its technology section.
 * Re-running the same day only fills the tracks that are missing.
 */

const SYSTEM = [
  "You are the senior editor of MCB - Tech Buzz, the engineering blog of MasterClass Buddy, read by Indian software engineers preparing for better roles.",
  "Write one original, highly engaging, technically accurate blog post. Open with a hook from a real production situation, then teach: concrete steps, trade-offs, numbers, a complete, runnable multi-file code example where it helps (every file needed to run it), and pitfalls.",
  "Use current versions (Next.js 16+, React 19+, current LangChain/LangGraph APIs, current AWS service names). Never invent APIs; if unsure, describe the idea instead of naming a function.",
  "Plain prose, no markdown symbols, no emojis, no citations or source lists, never mention other blog platforms or publications.",
].join("\n");

const schema = z.object({
  title: z.string().describe("A specific, curiosity-driven headline, at most 90 characters."),
  subtitle: z.string().describe("One sentence promising what the reader will be able to do, at most 180 characters."),
  summaryBullets: z.array(z.string()).describe("Exactly 3 key takeaways, each under 120 characters."),
  tags: z.array(z.string()).describe("4-6 short topic tags, e.g. 'LangGraph', 'Checkpointing'."),
  techStack: z.array(z.string()).describe("3-6 technologies used in the post."),
  readTimeMinutes: z.number().int().describe("Honest reading time in minutes, 5-12."),
  founderTakeaway: z.string().describe("A closing 2-3 sentence takeaway for the reader's next interview or project."),
  coverScene: z.string().describe("A concrete scene for the thumbnail picture: objects and actions only, no text."),
  inlineScene: z.string().describe("A different concrete scene for the in-article diagram-like picture, objects and actions only, no text."),
  sections: z.array(z.object({
    heading: z.string(),
    paragraphs: z.array(z.string()).describe("2-4 paragraphs of 2-5 sentences."),
    bulletPoints: z.array(z.string()).nullable().describe("Optional 3-5 short points, or null."),
    code: z.object({ files: z.array(z.object({ filename: z.string().describe("A real path, e.g. src/app/page.tsx or package.json"), language: z.string(), code: z.string().describe("Complete file contents, at most 60 lines: real imports, no placeholders or '...'.") })).min(1).max(4) })
      .describe("A complete, end-to-end runnable example: every file a reader needs to run it (for example package.json, the entry file and one module), shown as editor tabs.").nullable(),
    callout: z.object({ type: z.enum(["tip", "insight", "warning"]), text: z.string() }).nullable(),
  })).describe("5-6 sections; at least one has code when the topic is about code or configuration."),
});

const slugify = (text: string) => text.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-");
const dayNumber = (date: string) => Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);

async function writeStory(track: DailyTrack, date: string): Promise<TechBuzzArticle> {
  const angle = track.angles[dayNumber(date) % track.angles.length];
  const { output } = await generateText({
    model: gateway(providerModel("gateway")),
    system: SYSTEM,
    prompt: `Track: ${track.label}.\nToday's angle: ${angle}.\nDate: ${date}.\nWrite today's post for this track.`,
    output: Output.object({ schema }),
    maxRetries: 2,
    abortSignal: AbortSignal.timeout(150_000),
  });
  const slug = `${track.id}-${date}-${slugify(output.title)}`.slice(0, 99).replace(/-+$/, "");
  // Thumbnail and blog image are painted together; a failed picture keeps the story (the page shows the technology logo).
  const [cover, inline] = await Promise.allSettled([output.coverScene, output.inlineScene].map(async (scene, i) =>
    store(`tech-buzz/daily/${date}/${track.id}-${i === 0 ? "cover" : "inline"}.webp`, await paint(learningScenePrompt({ subject: `${track.short}: ${output.title}`, scene })))));
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
    tags: [...output.tags.slice(0, 6), DAILY_TAG, dailyDateTag(date), dailyTrackTag(track.id)],
    rankingScore: 95,
    source: { name: "MasterClass Buddy", domain: "masterclass", trustScore: "" },
    summaryBullets: output.summaryBullets.slice(0, 3),
    reactions: { heart: 0, unicorn: 0, rocket: 0, mindblown: 0 },
    commentsCount: 0,
    comments: [],
    techStack: output.techStack.slice(0, 6),
    membershipTier: "Free Preview",
    founderTakeaway: output.founderTakeaway,
    publishedAt: new Date().toISOString(),
    contentSections: output.sections.slice(0, 6).map((section, i) => ({
      heading: section.heading,
      paragraphs: section.paragraphs,
      ...(section.bulletPoints?.length ? { bulletPoints: section.bulletPoints } : {}),
      ...(section.code?.files.length ? { codeSnippet: { language: section.code.files[0].language, filename: section.code.files[0].filename, code: section.code.files[0].code, files: section.code.files } } : {}),
      ...(section.callout ? { callout: section.callout } : {}),
      // The blog image opens the second section, after the hook.
      ...(i === 1 && inlineUrl ? { image: { src: inlineUrl, alt: `Illustration: ${output.title}` } } : {}),
    })),
  });
}

export type DailyRun = { date: string; written: string[]; skipped: string[]; failed: { track: string; error: string }[] };

/** Writes today's (IST) missing daily stories, all five tracks at once so the run fits the function's time limit. */
export async function generateTechBuzzDaily(date = istDate()): Promise<DailyRun> {
  if (!providerConfigured("gateway")) throw new Error("ai_gateway_not_configured");
  const existing = await dailyEditionSlugs(date);
  const todo = DAILY_TRACKS.filter(track => !existing.some(slug => slug.startsWith(`${track.id}-${date}`)));
  const results = await Promise.allSettled(todo.map(track => writeStory(track, date)));
  const run: DailyRun = { date, written: [], skipped: DAILY_TRACKS.filter(track => !todo.includes(track)).map(track => track.id), failed: [] };
  results.forEach((result, i) => {
    if (result.status === "fulfilled") run.written.push(result.value.slug);
    else run.failed.push({ track: todo[i].id, error: String(result.reason).slice(0, 200) });
  });
  if (run.written.length) expireTechBuzzCache();
  return run;
}
