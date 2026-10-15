import type { ObjectiveQuestion } from "@/lib/api-learning-schema";
import type { SearchAnswer } from "./types";

export type PreparedExplanation = {
  walkthrough?: "git";
  answer: SearchAnswer;
  focus: string;
  kind: "exam" | "interview";
  sources?: { title: string; url: string }[];
  /** Multiple-choice practice, answered in place: authored learning modules carry three. */
  objective?: ObjectiveQuestion[];
};

export function emptyAnswer(title: string, summary: string): SearchAnswer {
  return { headline: title, definition: summary, summary: "", steps: [], alternatives: [], useCases: [], industries: [], subjects: [],
    formulas: [], worked: [], files: [], keyPoints: [], caveats: [], followUps: [], diagrams: [] };
}

export function conciseFocus(summary: string, limit = 150) {
  const text = summary.replace(/^.*? · /, "").replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

/**
 * The answer a catalogue row starts from before anything authored is added.
 *
 * Each sentence of the summary is said exactly once: the first is the
 * definition and the rest are the paragraph under it. Nothing is invented to
 * fill a section — a step, key point or question that only restates the
 * summary, or that would read the same under any topic, teaches nothing and is
 * left for the authored points, notes and examples to supply.
 */
export function summaryExplanation(name: string, summary: string, category: string): PreparedExplanation {
  void category;
  const facts = [...new Set(summary.split(/(?<=[.;])\s+|\s+—\s+/).map(item => item.trim()).filter(Boolean))];
  const answer = emptyAnswer(name, facts[0] ?? summary);
  answer.summary = facts.slice(1).join(" ");
  return { answer, focus: conciseFocus(summary), kind: "interview" };
}
