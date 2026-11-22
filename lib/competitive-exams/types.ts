/*
 * Competitive Exams (Learning Dashboard): the shapes shared by the page and by the exam packs.
 * Packs are hand-authored, one file per exam family, and load as their own chunks; nothing is generated on a visit.
 */
export type Stars = 3 | 4 | 5;
type Tagged = {
  id: string; subject: string; q: string;
  /** Editorial rating of how regularly this question, or a close variant, recurs. Not an official count. */
  stars: Stars;
  /** Exam and year(s) in which the question or a close variant was asked, as best recalled from released and memory-based papers. */
  asked: string;
};
export type Objective = Tagged & { options: string[]; correct: number; why: string };
/** A descriptive, short-answer or interview question with its model answer, one point per line. */
export type Subjective = Tagged & { a: string[];
  /** descriptive: written or interview answer; short: a short-answer form of an objective question; oneLine: a quick fact. Absent: descriptive. */
  form?: "descriptive" | "short" | "oneLine" };
export type Pack = { objective: Objective[]; subjective: Subjective[] };

type Draft<T> = Omit<T, "id">;
export const obj = (subject: string, stars: Stars, asked: string, q: string, options: string[], correct: number, why: string): Draft<Objective> => ({ subject, stars, asked, q, options, correct, why });
export const sub = (subject: string, stars: Stars, asked: string, q: string, a: string[]): Draft<Subjective> => ({ subject, stars, asked, q, a });
export const pack = (prefix: string, objective: Draft<Objective>[], subjective: Draft<Subjective>[]): Pack => ({
  objective: objective.map((item, index) => ({ ...item, id: `${prefix}-o${index + 1}` })),
  subjective: subjective.map((item, index) => ({ ...item, id: `${prefix}-s${index + 1}` })),
});
