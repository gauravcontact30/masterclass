import type { BoardId, ClassId, PackSubject } from "../types";
import type { Paper, PaperQuestion } from "../sample-papers";
import { OFFICIAL_PAPERS } from "./manifest";
import type { OfficialPaper } from "./types";

export type { OfficialPaper, OfficialQuestion, AnswerBy } from "./types";

const BOARDS: BoardId[] = ["up", "cbse", "icse"];
const CLASSES: ClassId[] = ["10", "12"];
const SUBJECTS: PackSubject[] = ["math", "physics", "chemistry", "english"];
export const FIRST_YEAR = 2006, LAST_YEAR = 2025;

export const paperKey = (board: BoardId, cls: ClassId, subject: PackSubject, year: number) => `${board}-${cls}-${subject}-${year}`;

/** Years with an official paper for this board, class and subject, newest first. */
export function officialYears(board: BoardId, cls: ClassId, subject: PackSubject, manifest: Record<string, unknown> = OFFICIAL_PAPERS): number[] {
  const prefix = `${board}-${cls}-${subject}-`;
  return Object.keys(manifest).filter(key => key.startsWith(prefix)).map(key => Number(key.slice(prefix.length))).sort((a, b) => b - a);
}

/**
 * Everything wrong with a paper, as plain sentences; empty when it can go in. The import script refuses a paper
 * with any problem, so the page never shows a question without its answer or with an option out of range.
 */
export function checkPaper(paper: OfficialPaper): string[] {
  const errors: string[] = [];
  if (!BOARDS.includes(paper.board)) errors.push(`board must be one of ${BOARDS.join(", ")}`);
  if (!CLASSES.includes(paper.cls)) errors.push(`cls must be "10" or "12"`);
  if (!paper.subjects?.length || paper.subjects.some(s => !SUBJECTS.includes(s))) errors.push(`subjects must list one or more of ${SUBJECTS.join(", ")}`);
  if (!Number.isInteger(paper.year) || paper.year < FIRST_YEAR || paper.year > LAST_YEAR) errors.push(`year must be ${FIRST_YEAR}–${LAST_YEAR}`);
  if (!paper.paper?.trim()) errors.push("paper (the printed title) is missing");
  if (!(paper.marks > 0)) errors.push("marks must be above 0");
  if (!(paper.minutes > 0)) errors.push("minutes must be above 0");
  if (!paper.source?.label?.trim() || !(paper.source.url || paper.source.file)) errors.push("source needs a label and a url or file");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paper.source?.entered ?? "")) errors.push("source.entered must be a date, YYYY-MM-DD");
  if (!paper.questions?.length) errors.push("questions is empty");
  const seen = new Set<string>();
  (paper.questions ?? []).forEach((q, i) => {
    const at = `question ${i + 1} (${q.no || "no number"})`;
    if (!q.no?.trim()) errors.push(`${at}: no is missing`);
    else if (seen.has(`${q.section}|${q.no}`)) errors.push(`${at}: number repeated in section "${q.section}"`);
    seen.add(`${q.section}|${q.no}`);
    if (!q.q?.trim()) errors.push(`${at}: question text is missing`);
    if (!(q.marks > 0)) errors.push(`${at}: marks must be above 0`);
    if (!q.answer?.trim()) errors.push(`${at}: answer is missing`);
    if (q.answerBy !== "board" && q.answerBy !== "ours") errors.push(`${at}: answerBy must be "board" or "ours"`);
    if (q.options) {
      if (q.options.length < 2 || q.options.some(o => !o.trim())) errors.push(`${at}: options must be two or more, none empty`);
      if (!Number.isInteger(q.correct) || q.correct! < 0 || q.correct! >= q.options.length) errors.push(`${at}: correct must point at one of the options`);
    } else if (q.correct !== undefined) errors.push(`${at}: correct given without options`);
    if (q.figure && (!q.figure.src.startsWith("/") || !q.figure.alt?.trim())) errors.push(`${at}: figure needs a /public path and alt text`);
  });
  // The template's "<…>" placeholders (scripts/board-paper-template.json) must all be replaced.
  const placeholder = (value: unknown): boolean => typeof value === "string" ? /^<[^<>]*>$/.test(value.trim()) : Array.isArray(value) ? value.some(placeholder) : value && typeof value === "object" ? Object.values(value).some(placeholder) : false;
  if (placeholder(paper)) errors.push("a <placeholder> from the template is still in the file");
  const total = (paper.questions ?? []).filter(q => !/\bOR\b/.test(q.no)).reduce((sum, q) => sum + (q.marks || 0), 0);
  // Internal choices ("OR" questions) are left out of the total; a paper whose questions overshoot its marks is a typo.
  if (paper.marks > 0 && total > paper.marks) errors.push(`questions add up to ${total} marks, more than the paper's ${paper.marks}`);
  return errors;
}

const LETTERS = ["a", "b", "c", "d", "e", "f"];
/** An official paper in the dashboard's paper shape. */
export function toPaper(paper: OfficialPaper, title: string): Paper {
  const questions: PaperQuestion[] = paper.questions.map((q, i) => ({
    id: `${paper.board}-${paper.cls}-${paper.year}-o${i + 1}`, no: q.no, ch: q.ch ?? paper.paper, q: q.q, marks: q.marks, section: q.section,
    options: q.options, correct: q.correct, figure: q.figure, steps: q.steps ?? [], answerBy: q.answerBy,
    answer: q.options && q.correct !== undefined && !/^\([a-f]\)/.test(q.answer) ? `(${LETTERS[q.correct]}) ${q.answer}` : q.answer,
  }));
  return { id: `${paper.board}-${paper.cls}-official-${paper.year}`, kind: "year", title, year: paper.year, questions, marks: paper.marks, minutes: paper.minutes,
    official: { paper: paper.paper, set: paper.set, source: paper.source } };
}

/** The official paper of a year, or null when we have none. */
export async function loadOfficial(board: BoardId, cls: ClassId, subject: PackSubject, year: number): Promise<OfficialPaper | null> {
  const load = OFFICIAL_PAPERS[paperKey(board, cls, subject, year)];
  return load ? load() : null;
}
