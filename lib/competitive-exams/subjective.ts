import type { QuickItem } from "../quick-qa";
import type { Objective, Stars, Subjective } from "./types";

/*
 * An exam's subjective set, at least SUBJECTIVE_MINIMUM questions:
 *   1. the hand-authored descriptive and interview questions, with model answers;
 *   2. the exam's Quick Q&A facts as one-line questions (they are core facts, rated four stars);
 *   3. short-answer forms of the exam's objective questions that make sense without their options (a question such
 *      as "Which of the following…" is skipped), answered with the correct option and its explanation.
 * A question already present is not added twice.
 */
export const SUBJECTIVE_MINIMUM = 400;
/** Questions that cannot be answered without seeing the options. */
const NEEDS_OPTIONS = /which of the following|which one|following|statement|correct\b|incorrect|not\b|odd one|all of the above|none of|choose|select|match|assertion|identify|given below|these/i;
const normal = (q: string) => q.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
/** Turns an objective stem into a question ("The capital of X is" → "The capital of X is …?"). */
const asQuestion = (q: string) => (/[?.]$/.test(q.trim()) ? q.trim() : `${q.trim()} …?`);

export function buildSubjective(examName: string, authored: Subjective[], quickItems: QuickItem[], objective: Objective[]): Subjective[] {
  const seen = new Set<string>(); const out: Subjective[] = [];
  const add = (row: Subjective) => { const key = normal(row.q); if (seen.has(key)) return; seen.add(key); out.push(row); };
  for (const row of authored) add({ ...row, form: row.form ?? "descriptive" });
  for (const item of quickItems) add({ id: `${item.id}-s`, subject: item.topic, stars: 4 as Stars, asked: `${examName} (short-answer revision fact)`, q: item.q, a: [item.a], form: "oneLine" });
  for (const item of objective) {
    if (NEEDS_OPTIONS.test(item.q)) continue;
    add({ id: `${item.id}-s`, subject: item.subject, stars: item.stars, asked: item.asked, q: asQuestion(item.q), a: [`Answer: ${item.options[item.correct]}.`, item.why], form: "short" });
  }
  return out;
}
