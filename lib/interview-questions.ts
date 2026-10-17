/**
 * Interview questions shared by the Workflow blueprints (lib/workflow-prep) and the landing page's interview
 * carousel (lib/interview-bank). Text may hold `inline code` in backticks; `code` is a block shown above the
 * answer, for puzzles and "what does this print?" questions.
 */

/** How often interviewers ask it: 5 is asked almost every time the topic comes up, 1 is a rare deep cut. */
export type Stars = 1 | 2 | 3 | 4 | 5;
/**
 * An open question with a model answer, the kind you talk through. On both question kinds, `source` names where the
 * facts were checked and is shown under the answer, e.g. "Sourced from Docs by LangChain (MCP)".
 */
export type SubjectiveQuestion = { stars: Stars; question: string; answer: string; code?: string; source?: string };
/** A multiple-choice question: four options, the index of the right one and why it is right. */
export type ObjectiveQuestion = { stars: Stars; question: string; options: [string, string, string, string]; answer: 0 | 1 | 2 | 3; why: string; code?: string; source?: string };
export type QuestionSet = { subjective: SubjectiveQuestion[]; objective: ObjectiveQuestion[] };

export const s = (stars: Stars, question: string, answer: string, code?: string): SubjectiveQuestion => ({ stars, question, answer, ...(code ? { code } : {}) });
export const o = (stars: Stars, question: string, options: [string, string, string, string], answer: 0 | 1 | 2 | 3, why: string, code?: string): ObjectiveQuestion => ({ stars, question, options, answer, why, ...(code ? { code } : {}) });

/** FNV-1a: a stable number per question, so its option order is the same on every render. */
function hash(text: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

/**
 * The options in display order. They are authored with the right answer wherever it reads best, which tends
 * to be second; rotating them by a per-question amount spreads the right answer across A–D, so the position
 * gives nothing away.
 */
export function arrangeOptions(question: ObjectiveQuestion): { options: string[]; answer: number } {
  const turn = hash(question.question) % 4;
  return { options: question.options.map((_, i) => question.options[(i + turn) % 4]), answer: (question.answer - turn + 4) % 4 };
}

/** Questions most often asked come first; ties keep their authored order. */
export const byStars = <T extends { stars: number }>(questions: T[]) => [...questions].sort((a, b) => b.stars - a.stars);
