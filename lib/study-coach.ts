import { z } from "zod";
import preview from "./catalog-preview.json";
import { technologyHref } from "./learning-path";

/*
 * The dashboard's "What next" coach: what a learner has generated and finished goes in, three next steps and a short
 * quiz on the topics they are working on come out. Only titles, technology ids and counts reach the model, never
 * email, name or notes. Without a model, ruleCoach() gives next steps from the same signals and no quiz.
 *
 * Server and tests only (zod); the dashboard card imports the types with `import type`.
 */
export type CoachSignals = {
  goal: string | null;
  documents: { title: string; technologyId: string; level: string | null; completed: boolean; page: number | null }[];
};
export type CoachStep = { title: string; why: string; href: string; technology: string | null };
export type CoachQuestion = { question: string; options: string[]; answer: number; explanation: string };
export type Coach = { greeting: string; next: CoachStep[]; quiz: CoachQuestion[]; source: "ai" | "rules"; model?: string; generatedAt: string };

export const coachReplySchema = z.object({
  greeting: z.string().trim().min(1).max(300),
  next: z.array(z.object({
    title: z.string().trim().min(1).max(120),
    why: z.string().trim().min(1).max(240),
    technologyId: z.string().trim().max(40).nullable().optional(),
  })).min(1).max(3),
  quiz: z.array(z.object({
    question: z.string().trim().min(1).max(300),
    options: z.array(z.string().trim().min(1).max(160)).length(4),
    answer: z.number().int().min(0).max(3),
    explanation: z.string().trim().min(1).max(300),
  })).max(5),
});

const TITLES = new Map(preview.technologies.map(t => [t.id, t.title]));
const known = (id: string | null | undefined) => (id && TITLES.has(id) ? id : null);
const step = (title: string, why: string, technologyId: string | null): CoachStep =>
  ({ title, why, technology: technologyId ? TITLES.get(technologyId) ?? null : null, href: technologyId ? technologyHref(technologyId) : "/dashboard/notes" });

/** The signals the model sees: per-technology counts, the unfinished titles, and the goal. */
export function coachSummary(signals: CoachSignals) {
  const byTech = new Map<string, { studied: number; finished: number }>();
  for (const doc of signals.documents) {
    const entry = byTech.get(doc.technologyId) ?? { studied: 0, finished: 0 };
    entry.studied++; if (doc.completed) entry.finished++;
    byTech.set(doc.technologyId, entry);
  }
  return {
    goal: signals.goal,
    technologies: [...byTech].map(([id, c]) => ({ id, title: TITLES.get(id) ?? id, ...c })).sort((a, b) => b.studied - a.studied).slice(0, 12),
    unfinished: signals.documents.filter(d => !d.completed).slice(0, 8).map(d => ({ title: d.title, technologyId: d.technologyId, level: d.level })),
    finishedCount: signals.documents.filter(d => d.completed).length,
  };
}

export function parseCoach(text: string): Omit<Coach, "source" | "model" | "generatedAt"> | null {
  const start = text.indexOf("{"), end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let parsed;
  try { parsed = coachReplySchema.safeParse(JSON.parse(text.slice(start, end + 1))); } catch { return null; }
  if (!parsed.success) return null;
  return {
    greeting: parsed.data.greeting,
    next: parsed.data.next.map(item => step(item.title, item.why, known(item.technologyId))),
    // An option list with duplicates cannot be answered fairly.
    quiz: parsed.data.quiz.filter(q => new Set(q.options.map(o => o.toLowerCase())).size === 4),
  };
}

/** Next steps from fixed rules: finish what is open, then go deeper in the most-studied technology. */
export function ruleCoach(signals: CoachSignals, hi = false): Omit<Coach, "source" | "model" | "generatedAt"> {
  const s = coachSummary(signals);
  const next: CoachStep[] = [];
  for (const doc of s.unfinished.slice(0, 2)) next.push(step(hi ? `पूरा कीजिए: ${doc.title}` : `Finish “${doc.title}”`, hi ? "आप इसे शुरू कर चुके हैं; पूरा करने से अगला विषय आसान होगा।" : "You have started it; finishing it makes the next topic easier.", known(doc.technologyId)));
  const top = s.technologies[0];
  if (top && next.length < 3) next.push(step(hi ? `${top.title} में अगला स्तर` : `Go one level deeper in ${top.title}`, hi ? `आपने ${top.title} के ${top.studied} पाठ पढ़े हैं।` : `You have studied ${top.studied} ${top.title} lesson${top.studied === 1 ? "" : "s"}; the interview questions are a good next check.`, known(top.id)));
  if (next.length < 3) next.push(step(hi ? "नोट्स से शुरू कीजिए" : "Start with the notes", hi ? "किसी भी तकनीक के नोट्स खोलें और छोटा क्विज़ दें।" : "Open any technology's notes and take its short quiz.", null));
  const greeting = signals.documents.length
    ? (hi ? `आपने ${signals.documents.length} पाठ बनाए हैं और ${s.finishedCount} पूरे किए हैं। आज के लिए ये तीन कदम:` : `You have ${signals.documents.length} lesson${signals.documents.length === 1 ? "" : "s"} and finished ${s.finishedCount}. Three steps for today:`)
    : (hi ? "स्वागत है! शुरू करने के लिए ये कदम:" : "Welcome! Here is where to start:");
  return { greeting, next: next.slice(0, 3), quiz: [] };
}
