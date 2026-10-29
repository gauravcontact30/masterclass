import "server-only";
import { generateText, gateway, Output } from "ai";
import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import { z } from "zod";
import { db } from "./db";
import { HttpError } from "./http";
import { providerConfigured, providerModel } from "./ai-providers";
import { courseSource } from "./course-sources";
import { trackById } from "@/lib/pro-learn/tracks";
import { generatedCourseMeta } from "@/lib/deep-courses/catalog";
import { PLANNED_OUTLINES } from "@/lib/deep-courses/planned-outlines";
import type { CourseTopic, DeepCourse } from "@/lib/deep-courses/types";

/*
 * In-depth courses for every platform technology beyond the six hand-written ones (migration 0044). The first visit
 * to a course writes its outline; the first visit to a topic writes the topic: description, usage, step-by-step
 * explanation, syntax, a worked example with its output, simple/moderate/complex examples, assignments with
 * answers, alternate ways, a multi-file example, tips and subjective/objective questions. Each piece is researched
 * from the technology's official documentation (Perplexity, domain-restricted), written through the AI Gateway and
 * scored by an editor pass; below 4/5 it is rewritten once, and still below 4 it is not stored. A row's
 * 'generating' status is the lock that stops two visitors paying for the same work.
 */

const MIN_SCORE = 4;
const STALE_MS = 8 * 60_000;
// The model's default thinking made a topic overrun its 170 s write ("AbortError: Delay was aborted"), so writing
// thinks "medium". On a visit a topic must finish inside the route; the pre-generation script
// (scripts/pregenerate-courses.ts) has no route limit and gives each step all the time it needs.
export type Budget = { writeMs: number; reviewMs: number; rewriteWithinMs: number };
const ROUTE_BUDGET: Budget = { writeMs: 170_000, reviewMs: 60_000, rewriteWithinMs: 90_000 };
export const SCRIPT_BUDGET: Budget = { writeMs: 600_000, reviewMs: 180_000, rewriteWithinMs: Infinity };
const model = () => gateway(providerModel("gateway"));

type Research = { notes: string; sources: { title: string; site: string }[] };

let busy = 0;
const queue: (() => void)[] = [];
async function slot<T>(task: () => Promise<T>): Promise<T> {
  // Perplexity refuses more than about three concurrent sonar calls.
  if (busy >= 3) await new Promise<void>(resolve => queue.push(resolve));
  busy++;
  try { return await task(); } finally { busy--; queue.shift()?.(); }
}

const hostOf = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } };

/** Dense notes from the official documentation only; empty when Perplexity is not configured or fails. */
async function research(question: string, sites: string[]): Promise<Research> {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key || key.includes("xxx") || !sites.length) return { notes: "", sources: [] };
  try {
    return await slot(async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        const response = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "sonar-pro", messages: [{ role: "user", content: question }], search_domain_filter: sites.slice(0, 20), max_tokens: 3000 }),
          signal: AbortSignal.timeout(45_000),
        });
        if (response.status === 429 || response.status >= 500) { await new Promise(done => setTimeout(done, 2000 * 2 ** attempt)); continue; }
        if (!response.ok) throw new Error(`perplexity ${response.status}`);
        const body = await response.json() as { choices?: { message?: { content?: string } }[]; search_results?: { title?: string; url?: string }[]; citations?: string[] };
        const pages = body.search_results?.length ? body.search_results : (body.citations ?? []).map(url => ({ url, title: "" }));
        const seen = new Set<string>();
        const sources = pages.flatMap(({ url = "", title = "" }) => {
          const site = hostOf(url);
          if (!site || !sites.some(allowed => site === allowed.replace(/^www\./, "") || site.endsWith(`.${allowed}`)) || seen.has(url)) return [];
          seen.add(url);
          return [{ title: (title || site).slice(0, 120), site }];
        }).slice(0, 6);
        return { notes: (body.choices?.[0]?.message?.content ?? "").replace(/\[\d+\]/g, "").slice(0, 12_000), sources };
      }
      return { notes: "", sources: [] };
    });
  } catch (error) {
    console.error(JSON.stringify({ event: "course_research_failed", message: String(error).slice(0, 200) }));
    return { notes: "", sources: [] };
  }
}

const SYSTEM = [
  "You are the lead author of MasterClass Buddy's in-depth courses, read by Indian students and working engineers preparing for interviews, university exams and real projects.",
  "Teach like the best course on the subject: precise, current, practical, with complete runnable code and honest trade-offs.",
  "Official documentation notes, when given, are the source of truth: follow their API names, versions, defaults and recommended steps; never invent APIs.",
  "Plain prose without markdown symbols in prose fields. No emojis. Never mention other learning platforms or include URLs.",
].join("\n");

const kebab = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80);
const outlineSchema = z.object({
  intro: z.array(z.string()).describe("2-3 paragraphs: what the technology is, who uses it and what this course covers."),
  topics: z.array(z.object({
    id: kebab.describe("Unique kebab-case id, e.g. 'state-and-hooks'."),
    title: z.string().describe("Specific topic title, at most 90 characters."),
    module: z.string().describe("Module heading; 3-5 modules in learning order, the first called 'Foundations'."),
    level: z.enum(["Beginner", "Intermediate", "Advanced"]),
    minutes: z.number().int().describe("Honest study time, 12-25."),
    summary: z.string().describe("One sentence on what the learner will be able to do."),
  })).describe("12-15 topics from first principles to advanced production use, grouped by module in order."),
});

const example = z.object({
  title: z.string().describe("What this example does."),
  file: z.string().describe("A real file name, e.g. main.py, App.tsx, deployment.yaml."),
  code: z.string().describe("Complete, runnable code, at most 60 lines, real imports, no placeholders."),
  output: z.string().describe("Exactly what running it prints or produces. If it produces no console output, describe the visible result in one or two lines."),
  explain: z.string().describe("Two or three sentences on how it works."),
});
const topicSchema = z.object({
  essentials: z.object({
    core: z.string().describe("The one idea the whole topic rests on, in one or two plain sentences (at most 45 words)."),
    answer: z.string().describe("The precise answer an interviewer or examiner expects to 'Explain <topic>': definition, how it works, when to use it; 3-4 sentences, no filler."),
    keyPoints: z.array(z.string()).describe("5-7 facts a learner must remember (defaults, rules, complexities, traps), each one sentence, most important first."),
  }),
  description: z.array(z.string()).describe("3-4 paragraphs: what it is, how it works underneath, and why it matters. Every sentence teaches something; no restating the title, no filler."),
  usage: z.array(z.string()).describe("4-6 concrete situations where this is used."),
  files: z.array(z.object({ path: z.string(), code: z.string().describe("Complete file, at most 60 lines.") })).describe("2-3 files of one small real-world example project, shown as editor tabs."),
  tips: z.array(z.string()).describe("4-6 best practices or pitfalls."),
  subjective: z.array(z.object({ q: z.string(), a: z.string().describe("A model interview/exam answer, 3-6 sentences.") })).describe("4-6 interview and exam questions."),
  objective: z.array(z.object({ q: z.string(), options: z.array(z.string()).describe("Exactly four options."), answer: z.number().int().describe("Index 0-3 of the correct option."), explain: z.string() })).describe("5-7 multiple-choice questions."),
  lab: z.object({
    steps: z.array(z.string()).describe("5-8 steps explaining the topic step by step, each one or two sentences."),
    syntax: z.object({ file: z.string(), code: z.string().describe("The general syntax or API shape, annotated with short comments."), notes: z.array(z.string()).describe("3-5 notes on the syntax.") }),
    example: example.describe("The main worked example of the topic."),
    simple: example.describe("A simple example for beginners."),
    moderate: example.describe("A moderate, realistic example."),
    complex: example.describe("A complex, production-style example."),
    assignments: z.array(z.object({ q: z.string(), a: z.string().describe("The model answer, explained."), code: z.string().nullable().describe("Solution code, or null.") })).describe("3-5 assignment questions with answers."),
    alternates: z.array(z.object({ title: z.string(), why: z.string().describe("When and why to choose this way."), file: z.string(), code: z.string() })).describe("2-3 other ways to achieve the same result as the main example."),
  }),
});
type TopicDraft = z.infer<typeof topicSchema>;

const reviewSchema = z.object({
  accuracy: z.number().describe("1-5: agrees with the official notes and current APIs; outputs match the code."),
  teaching: z.number().describe("1-5: a learner can follow it and do the work afterwards."),
  completeness: z.number().describe("1-5: every part is present and substantial."),
  score: z.number().describe("Overall 1-5, one decimal; 4 or above means publishable."),
  issues: z.array(z.string()).describe("Specific fixes, most important first."),
});

type OutlineTopic = z.infer<typeof outlineSchema>["topics"][number];
type CourseRow = { track_id: string; status: string; intro: string[]; topics: OutlineTopic[]; sources: Research["sources"]; started_at: string };
type TopicRow = { topic_id: string; status: string; content: TopicDraft | null; started_at: string };

const missingTable = (error: { code?: string; message: string }) => error.code === "42P01" || error.code === "PGRST205" || /could not find the table|does not exist/i.test(error.message);
const check = <T,>(result: { data: T; error: { code?: string; message: string } | null }) => {
  if (result.error) throw missingTable(result.error) ? new HttpError(503, "migration_required") : new Error(result.error.message);
  return result.data;
};
const stale = (row: { status: string; started_at: string }) => row.status === "failed" || (row.status === "generating" && Date.now() - Date.parse(row.started_at) > STALE_MS);

export type GenerationState = "ready" | "generating" | "failed" | "missing";

/** A planned outline (lib/deep-courses/planned-outlines.ts) replaces a ready course's stored intro and topics. */
const withPlan = <T extends Pick<CourseRow, "track_id" | "status" | "topics"> & { intro?: string[] }>(row: T): T => {
  const plan = PLANNED_OUTLINES[row.track_id];
  return plan && row.status === "ready" ? { ...row, topics: plan.topics, ...(row.intro ? { intro: plan.intro } : {}) } : row;
};

async function courseRow(trackId: string) {
  const row = check(await db().from("generated_courses").select("track_id,status,intro,topics,sources,started_at").eq("track_id", trackId).maybeSingle()) as CourseRow | null;
  return row && withPlan(row);
}

/** The stored course with every written topic, or null before its outline exists. */
export async function readGeneratedCourse(trackId: string) {
  const course = await courseRow(trackId);
  if (!course) return null;
  const topics = check(await db().from("generated_course_topics").select("topic_id,status,content,started_at").eq("track_id", trackId)) as TopicRow[];
  return { course, topics: new Map(topics.map(row => [row.topic_id, row])) };
}

/** A generated course in the shape the course pages render; topics not written yet are `pending`. */
export async function loadGeneratedCourse(trackId: string): Promise<{ course: DeepCourse; state: GenerationState } | null> {
  const meta = generatedCourseMeta(trackId);
  if (!meta) return null;
  const stored = await readGeneratedCourse(trackId);
  if (!stored || stored.course.status !== "ready") {
    return { course: { ...meta, intro: [], topics: [] }, state: !stored ? "missing" : stale(stored.course) ? "failed" : "generating" };
  }
  const topics: CourseTopic[] = stored.course.topics.map(outline => {
    const row = stored.topics.get(outline.id);
    const content = row?.status === "ready" ? row.content : null;
    if (!content) return { ...outline, description: [], usage: [], files: [], tips: [], subjective: [], objective: [], pending: true };
    return {
      // Topics written before essentials existed have none; the page then starts at the Description.
      ...outline, ...(content.essentials ? { essentials: content.essentials } : {}), description: content.description, usage: content.usage, files: content.files, tips: content.tips, subjective: content.subjective,
      objective: content.objective.filter(item => item.options.length === 4).map(item => ({ q: item.q, options: item.options as [string, string, string, string], answer: Math.max(0, Math.min(3, item.answer)) as 0 | 1 | 2 | 3, explain: item.explain })),
      lab: { ...content.lab, assignments: content.lab.assignments.map(item => ({ q: item.q, a: item.a, ...(item.code ? { code: item.code } : {}) })) },
    };
  });
  return { course: { ...meta, intro: stored.course.intro, topics, sources: stored.course.sources }, state: "ready" };
}

/** Cache tag of one generated course; writing its outline or a topic expires it so readers see the new part at once. */
const courseTag = (trackId: string) => `course:${trackId}`;
const expireCourse = (trackId: string) => { try { revalidateTag(courseTag(trackId), { expire: 0 }); } catch { /* outside a request (scripts) */ } };

/**
 * loadGeneratedCourse through the cache: a complete course is served from cache for days (it only changes when it is
 * re-generated); a course still being written is re-read within minutes, so pre-generated parts appear without a visit
 * having to write them.
 */
export async function cachedGeneratedCourse(trackId: string) {
  "use cache";
  cacheTag(courseTag(trackId));
  const loaded = await loadGeneratedCourse(trackId);
  if (loaded?.state === "ready" && !loaded.course.topics.some(topic => topic.pending)) cacheLife("days");
  else cacheLife("minutes");
  return loaded;
}

function ensureConfigured() {
  if (!providerConfigured("gateway")) throw new HttpError(503, "ai_not_configured");
}

/** Writes a course's outline unless it exists or another visitor is writing it. */
export async function generateOutline(trackId: string, budget: Budget = { ...ROUTE_BUDGET, writeMs: 120_000 }): Promise<GenerationState> {
  const track = trackById(trackId);
  if (!track || !generatedCourseMeta(trackId)) throw new HttpError(404, "not_found");
  ensureConfigured();
  const existing = await courseRow(trackId);
  if (existing?.status === "ready") return "ready";
  if (existing && !stale(existing)) return "generating";
  const claimed = existing
    ? check(await db().from("generated_courses").update({ status: "generating", started_at: new Date().toISOString(), error: null }).eq("track_id", trackId).eq("started_at", existing.started_at).select("track_id")) as unknown[]
    : check(await db().from("generated_courses").upsert({ track_id: trackId, status: "generating" }, { onConflict: "track_id", ignoreDuplicates: true }).select("track_id")) as unknown[];
  if (!claimed.length) return "generating";

  try {
    // A planned course needs no AI outline: store the plan so the row is ready (courseRow keeps it current).
    const plan = PLANNED_OUTLINES[trackId];
    if (plan) {
      check(await db().from("generated_courses").update({ status: "ready", intro: plan.intro, topics: plan.topics, sources: [], updated_at: new Date().toISOString() }).eq("track_id", trackId));
      expireCourse(trackId);
      return "ready";
    }
    const source = courseSource(trackId);
    const notes = await research([
      `Technology: ${track.name}. ${track.focus}`,
      "Using only the official documentation, list the complete learning path for this technology as it is today: the current version, the core concepts in the order the documentation teaches them, the most important APIs or commands, and the advanced and production topics. Plain numbered notes.",
    ].join("\n"), source.sites);
    const { output } = await generateText({
      model: model(), system: SYSTEM, reasoning: "medium", output: Output.object({ schema: outlineSchema }), maxRetries: 2, abortSignal: AbortSignal.timeout(budget.writeMs),
      prompt: [
        `Course: ${track.name} — in depth, topic by topic.`, `Focus: ${track.focus}.`, `Existing syllabus to cover at least: ${track.syllabus.join("; ")}.`,
        notes.notes ? `Official documentation notes (source of truth):\n${notes.notes}` : "No documentation notes are available: stay with what you are certain of.",
        "Write the course outline.",
      ].join("\n\n"),
    });
    const seen = new Set<string>();
    const topics = output.topics.filter(topic => !seen.has(topic.id) && seen.add(topic.id)).slice(0, 16)
      .map(topic => ({ ...topic, title: topic.title.slice(0, 120), minutes: Math.max(8, Math.min(40, topic.minutes)) }));
    if (topics.length < 6) throw new Error("outline_too_short");
    check(await db().from("generated_courses").update({ status: "ready", intro: output.intro.slice(0, 4), topics, sources: notes.sources, updated_at: new Date().toISOString() }).eq("track_id", trackId));
    expireCourse(trackId);
    return "ready";
  } catch (error) {
    await db().from("generated_courses").update({ status: "failed", error: String(error).slice(0, 500) }).eq("track_id", trackId);
    console.error(JSON.stringify({ event: "course_outline_failed", trackId, message: String(error).slice(0, 300) }));
    throw new HttpError(502, "generation_failed");
  }
}

async function review(draft: TopicDraft, notes: string, timeoutMs: number) {
  const { output } = await generateText({
    model: model(), output: Output.object({ schema: reviewSchema }), maxRetries: 1, abortSignal: AbortSignal.timeout(timeoutMs),
    system: "You are the strict technical editor of an engineering course. Score honestly against the rubric; a 4 means you would put your name on it.",
    prompt: `${notes ? `Official documentation notes:\n${notes}\n\n` : ""}Lesson (JSON):\n${JSON.stringify(draft).slice(0, 60_000)}`,
  });
  return { ...output, score: Math.max(1, Math.min(5, output.score, output.accuracy + 1)) };
}

/** Writes one topic unless it exists or another visitor is writing it. */
export async function generateTopic(trackId: string, topicId: string, budget: Budget = ROUTE_BUDGET): Promise<GenerationState> {
  const track = trackById(trackId);
  const course = await courseRow(trackId);
  const outline = course?.status === "ready" ? course.topics.find(topic => topic.id === topicId) : undefined;
  if (!track || !course || !outline) throw new HttpError(404, "not_found");
  ensureConfigured();
  const existing = check(await db().from("generated_course_topics").select("topic_id,status,content,started_at").eq("track_id", trackId).eq("topic_id", topicId).maybeSingle()) as TopicRow | null;
  if (existing?.status === "ready") return "ready";
  if (existing && !stale(existing)) return "generating";
  const claimed = existing
    ? check(await db().from("generated_course_topics").update({ status: "generating", started_at: new Date().toISOString(), error: null }).eq("track_id", trackId).eq("topic_id", topicId).eq("started_at", existing.started_at).select("topic_id")) as unknown[]
    : check(await db().from("generated_course_topics").upsert({ track_id: trackId, topic_id: topicId, status: "generating" }, { onConflict: "track_id,topic_id", ignoreDuplicates: true }).select("topic_id")) as unknown[];
  if (!claimed.length) return "generating";

  const started = Date.now();
  try {
    const source = courseSource(trackId);
    const notes = await research([
      `Topic: ${outline.title} (${track.name}).`,
      "Using only the official documentation, write dense research notes for an author writing the definitive lesson on this topic:",
      "1. Current version and the exact API, syntax, CLI or configuration names involved.",
      "2. How it works, and the officially recommended steps in order.",
      "3. Defaults, limits and options that matter in practice.",
      "4. Best practices and common pitfalls the documentation warns about.",
      "5. Minimal working examples in the documentation's own style.",
    ].join("\n"), source.sites);
    const write = (fixes: string[]) => generateText({
      model: model(), system: SYSTEM, reasoning: "medium", output: Output.object({ schema: topicSchema }), maxRetries: 1, abortSignal: AbortSignal.timeout(budget.writeMs),
      prompt: [
        `Course: ${track.name}. Module: ${outline.module}. Topic: ${outline.title} (${outline.level}).`,
        `Learning goal: ${outline.summary}`,
        `Write code examples in ${source.language}; name files like ${source.file}. Every example must be complete and its output must be exactly what it produces.`,
        `Other topics in this course (do not cover them here): ${course.topics.filter(topic => topic.id !== topicId).map(topic => topic.title).join("; ")}.`,
        notes.notes ? `Official documentation notes (source of truth):\n${notes.notes}` : "No documentation notes are available: stay with APIs you are certain of.",
        fixes.length ? `The editor sent your previous draft back. Fix all of these:\n${fixes.map((fix, i) => `${i + 1}. ${fix}`).join("\n")}` : "",
        "Write the complete lesson.",
      ].filter(Boolean).join("\n\n"),
    }).then(result => result.output);
    let draft = await write([]);
    let verdict = await review(draft, notes.notes, budget.reviewMs);
    if (verdict.score < MIN_SCORE && Date.now() - started < budget.rewriteWithinMs) {
      draft = await write(verdict.issues.slice(0, 8));
      verdict = await review(draft, notes.notes, budget.reviewMs);
    }
    if (verdict.score < MIN_SCORE) throw new Error(`below_quality_bar ${verdict.score.toFixed(1)}: ${verdict.issues.slice(0, 2).join("; ")}`);
    check(await db().from("generated_course_topics").update({ status: "ready", content: draft, editor_score: Math.round(verdict.score * 10) / 10, sources: notes.sources, updated_at: new Date().toISOString() }).eq("track_id", trackId).eq("topic_id", topicId));
    expireCourse(trackId);
    return "ready";
  } catch (error) {
    await db().from("generated_course_topics").update({ status: "failed", error: String(error).slice(0, 500) }).eq("track_id", trackId).eq("topic_id", topicId);
    console.error(JSON.stringify({ event: "course_topic_failed", trackId, topicId, message: String(error).slice(0, 300) }));
    throw new HttpError(502, "generation_failed");
  }
}

/** Topic ids and status of every generated course, for the catalogue's progress bars and badges. */
export async function generatedCatalog(): Promise<Record<string, { status: string; topicIds: string[] }>> {
  const result = await db().from("generated_courses").select("track_id,status,topics");
  if (result.error) return {};
  return Object.fromEntries((result.data as Pick<CourseRow, "track_id" | "status" | "topics">[]).map(withPlan).map(row => [row.track_id, { status: row.status, topicIds: row.status === "ready" ? row.topics.map(topic => topic.id) : [] }]));
}
