import type { BoardId, ClassId, PackSubject } from "../types";

/*
 * A board's own previous-year question paper, entered exactly as printed (2026-11-24). One JSON file per paper in
 * lib/board-exams/official-papers/data, added only through scripts/import-board-paper.mts, which checks it first.
 * Nothing here is generated: questions are copied from the paper named in `source`.
 */
export type AnswerBy =
  /** Follows the board's own published marking scheme or answer key for this paper. */
  | "board"
  /** Written by our teachers: the board published no answers for this paper. */
  | "ours";

export type OfficialQuestion = {
  /** The paper's own number, e.g. "1", "23(a)" or "31 OR". */
  no: string;
  /** The paper's section letter or name, e.g. "A", or "" when the paper has none. */
  section: string;
  marks: number;
  /** The question exactly as printed. Line breaks are kept. */
  q: string;
  /** Objective questions: the options exactly as printed, without their (a)–(d) letters, and the right one. */
  options?: string[];
  correct?: number;
  /** A figure printed with the question: a file under /public and its description. */
  figure?: { src: string; alt: string };
  /** The worked answer, one line per step ("// " starts an explanation line), then the final answer. */
  steps?: string[];
  answer: string;
  answerBy: AnswerBy;
  /** Chapter, when known, so the chapter filter and search work. */
  ch?: string;
};

export type OfficialPaper = {
  board: BoardId;
  cls: ClassId;
  /** Subjects this paper serves on the dashboard (a Class 10 Science paper serves physics and chemistry). */
  subjects: PackSubject[];
  year: number;
  /** The paper's printed title, e.g. "Mathematics (Standard) 041". */
  paper: string;
  /** The set or series printed on the paper, e.g. "Set 1 · 30/1/1", when there is one. */
  set?: string;
  marks: number;
  minutes: number;
  /** Where the paper came from: the board's page or the file supplied to us, and the date it was entered. */
  source: { label: string; url?: string; file?: string; entered: string };
  questions: OfficialQuestion[];
};
