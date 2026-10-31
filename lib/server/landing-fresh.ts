import "server-only";
import { generateText, gateway, Output } from "ai";
import { z } from "zod";
import { cacheGet, cacheSet } from "@/lib/redis";
import { pickDaily, takeDaily } from "@/lib/daily-rotation";
import { INTERVIEW_TECHS } from "@/lib/interview-bank";
import { COMPARISONS } from "@/lib/comparisons";
import { LANDING_TECH_DOC_IDS, TECH_DOCS } from "@/lib/tech-docs";
import { learningScenePrompt } from "@/lib/learning-image";
import type { LandingFresh } from "@/lib/landing-fresh-types";
import { providerModel } from "./ai-providers";
import { paint, store } from "./learning-study-pack";
import { weekStartDate } from "@/lib/ist-week";

/*
 * The landing page's weekly AI-written additions, made every Monday at 00:00 IST by app/api/cron/landing-daily
 * through the Vercel AI Gateway (weekly since 2026-10-31; daily before): twelve "Or try" goals named by technology,
 * an interview question of the week for the technology the Interview prep preview leads with, a difference of the
 * week for the featured Tech Topics comparison, and a docs tip for the featured Technology docs platform, the last
 * three each with a painted picture. Kept in Redis by India week (`day` below is the week number, lib/ist-week.ts);
 * the landing page reads this week's set (or last week's while this week's is being written) and falls back to its
 * built-in content when there is none.
 */
const KEY = (week: number) => `landing:fresh:week:${week}`;
const HISTORY = "landing:fresh:history";
// This week's set and last week's fallback.
const KEEP_SECONDS = 15 * 86_400;
const dayLabel = weekStartDate;

/** What each section leads with on `day`, the same picks the landing page makes (lib/daily-rotation.ts). */
export function freshTopics(day: number) {
  return {
    tech: takeDaily(INTERVIEW_TECHS, day, 3)[0],
    comparison: pickDaily(COMPARISONS, day),
    doc: pickDaily(TECH_DOCS.filter(doc => (LANDING_TECH_DOC_IDS as readonly string[]).includes(doc.id)), day),
  };
}

const schema = z.object({
  goals: z.array(z.object({
    tech: z.string().describe("The technology name, 1-3 words, e.g. 'LangGraph' or 'AWS Lambda'."),
    hiTech: z.string().describe("The same name for Hindi readers (keep brand names in Latin script)."),
    goal: z.string().describe("A learner goal starting with a verb, e.g. 'build a RAG chatbot with LangGraph'."),
    hiGoal: z.string().describe("The goal in Hindi."),
  })).describe("Exactly 12 goals, each a different technology, mixing frontend, backend, cloud, AI agents, data, testing and DevOps."),
  interview: z.object({
    question: z.string(), answer: z.string().describe("A to-the-point model answer, 3-5 sentences."),
    objective: z.object({ question: z.string(), options: z.array(z.string()).describe("Exactly 4 options."), answer: z.number().int().describe("Index 0-3 of the correct option."), why: z.string() }),
    scene: z.string().describe("A concrete scene for a picture about this question, objects and actions only, no text."),
  }),
  difference: z.object({
    title: z.string().describe("A sharp one-line difference to remember, e.g. 'LangGraph controls the loop; LangChain gives the parts'."),
    answer: z.string().describe("2-3 sentences explaining the key difference."),
    points: z.array(z.string()).describe("Exactly 3 short decision rules: when to pick which."),
    scene: z.string().describe("A concrete scene contrasting the technologies, objects and actions only, no text."),
  }),
  doc: z.object({
    title: z.string().describe("A practical tip title for the platform's current version."),
    summary: z.string().describe("2 sentences."),
    steps: z.array(z.string()).describe("3-5 short steps."),
    code: z.object({ language: z.string(), code: z.string().describe("At most 12 lines, correct for the current version.") }).nullable(),
    scene: z.string().describe("A concrete scene for the tip, objects and actions only, no text."),
  }),
});

/** Writes `day`'s set (unless it exists and `force` is off), paints its three pictures and stores it. */
export async function generateLandingFresh(day: number, force = false): Promise<LandingFresh> {
  const existing = await cacheGet<LandingFresh>(KEY(day));
  if (existing && !force) return existing;
  const { tech, comparison, doc } = freshTopics(day);
  const history = (await cacheGet<string[]>(HISTORY)) ?? [];
  const { output } = await generateText({
    model: gateway(providerModel("gateway")),
    system: "You write daily learning snippets for MasterClass Buddy, an Indian e-learning platform for developers preparing for jobs and interviews. Be accurate and current as of 2026; never invent APIs or version numbers. Plain, clear English.",
    prompt: [
      `This week starts on ${dayLabel(day)}.`,
      `1. Goals for the "Or try" buttons of a learning-route planner: 12 goals, each a different technology.`,
      `2. An interview question of the week about ${tech.title} (${tech.tagline}): one subjective question with a model answer, and one multiple-choice question.`,
      `3. A difference of the week for "${comparison.question}" (${comparison.techs.map(item => `${item.name}: ${item.definition}`).join("; ")}).`,
      `4. A docs tip of the week for ${doc.name} ${doc.version} (${doc.release}). Official docs: ${doc.docs}.`,
      history.length ? `Do not repeat any of these recent items: ${history.slice(0, 60).join(" | ")}` : "",
    ].filter(Boolean).join("\n"),
    output: Output.object({ schema }),
    maxRetries: 2,
    abortSignal: AbortSignal.timeout(120_000),
  });
  // Three pictures side by side; one that fails leaves its card with the section's icon instead.
  const folder = `weekly/${dayLabel(day)}`;
  const picture = (name: string, subject: string, scene: string) => paint(learningScenePrompt({ subject, scene }))
    .then(webp => store(`${folder}/${name}-${Date.now()}.webp`, webp))
    .catch(error => { console.warn(`landing fresh picture "${name}" failed: ${String(error).slice(0, 200)}`); return null; });
  const [interviewImage, differenceImage, docImage] = await Promise.all([
    picture("interview", tech.title, output.interview.scene),
    picture("difference", comparison.question, output.difference.scene),
    picture("doc", `${doc.name} ${doc.version}`, output.doc.scene),
  ]);
  const options = output.interview.objective.options.slice(0, 4);
  const fresh: LandingFresh = {
    day: dayLabel(day), generatedAt: new Date().toISOString(),
    goals: output.goals.filter(goal => goal.tech && goal.goal).slice(0, 12),
    interview: options.length === 4 ? {
      day: dayLabel(day), techId: tech.id, tech: tech.title, question: output.interview.question, answer: output.interview.answer,
      objective: { question: output.interview.objective.question, options, answer: Math.min(3, Math.max(0, output.interview.objective.answer)), why: output.interview.objective.why },
      image: interviewImage,
    } : null,
    difference: { day: dayLabel(day), comparisonId: comparison.id, title: output.difference.title, answer: output.difference.answer, points: output.difference.points.slice(0, 3), image: differenceImage },
    doc: { day: dayLabel(day), docId: doc.id, doc: `${doc.name} ${doc.version}`, title: output.doc.title, summary: output.doc.summary, steps: output.doc.steps.slice(0, 5), code: output.doc.code, image: docImage },
  };
  await cacheSet(KEY(day), fresh, KEEP_SECONDS);
  await cacheSet(HISTORY, [output.interview.question, output.difference.title, output.doc.title, ...history].slice(0, 90), 60 * 86_400);
  return fresh;
}

/** This week's set for the landing page, or last week's while this week's is still being written; null when there is none. */
export async function landingFresh(day: number): Promise<LandingFresh | null> {
  try {
    return (await cacheGet<LandingFresh>(KEY(day))) ?? (await cacheGet<LandingFresh>(KEY(day - 1)));
  } catch { return null; }
}
