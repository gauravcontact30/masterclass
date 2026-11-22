/*
 * Board Exams (Learning Dashboard): the shapes shared by the page and by the eight subject packs
 * (class 10 and class 12 × Math, Physics, Chemistry, English). Packs are hand-authored and load as their own
 * chunks; nothing here is generated on a visit.
 */
export type BoardId = "up" | "cbse" | "icse";
export type ClassId = "10" | "12";
/** A hand-authored subject pack (one file per class). Chemistry is one pack, shown as two subjects below. */
export type PackSubject = "math" | "physics" | "chemistry" | "english";
/** A subject as the page shows it: Chemistry is split into Organic and Inorganic (with Physical) Chemistry. */
export type SubjectId = "math" | "physics" | "organic" | "inorganic" | "english";
export type Kind = "bank" | "important" | "solved" | "unsolved";
export type Stars = 3 | 4 | 5;

export type Item = {
  id: string; kind: Kind; ch: string; q: string;
  /** The answer in a line or two; for worked questions, the final result. */
  a: string;
  /** Worked solution, one line per step. A line starting with "// " is the explanation of the step under it. */
  steps?: string[];
  /** Editorial rating of how regularly this question type recurs in board papers (2001 to 2025). Not an official count. */
  stars?: Stars;
  marks: number;
  hint?: string;
  /** Boards the question suits, as letters (u = UP Board, c = CBSE, i = ICSE/ISC). Absent: all three. */
  b?: string;
};
export type Mcq = { id: string; ch: string; q: string; options: string[]; correct: number; why: string; b?: string };
export type Sheet = { title: string; lines: string[] };
export type Pack = { items: Item[]; mcqs: Mcq[]; sheets: Sheet[] };

type Draft<T> = Omit<T, "id">;
export const bank = (ch: string, q: string, a: string, marks = 2, b?: string): Draft<Item> => ({ kind: "bank", ch, q, a, marks, b });
export const imp = (ch: string, stars: Stars, q: string, a: string, steps: string[], marks = 5, b?: string): Draft<Item> => ({ kind: "important", ch, q, a, steps, stars, marks, b });
export const solved = (ch: string, q: string, a: string, steps: string[], marks = 4, b?: string): Draft<Item> => ({ kind: "solved", ch, q, a, steps, marks, b });
export const unsolved = (ch: string, q: string, a: string, hint: string, marks = 3, b?: string): Draft<Item> => ({ kind: "unsolved", ch, q, a, hint, marks, b });
export const mcq = (ch: string, q: string, options: string[], correct: number, why: string, b?: string): Draft<Mcq> => ({ ch, q, options, correct, why, b });
export const pack = (prefix: string, items: Draft<Item>[], mcqs: Draft<Mcq>[], sheets: Sheet[]): Pack => ({
  items: items.map((item, index) => ({ ...item, id: `${prefix}-q${index + 1}` })),
  mcqs: mcqs.map((item, index) => ({ ...item, id: `${prefix}-m${index + 1}` })),
  sheets,
});

const LETTER: Record<BoardId, string> = { up: "u", cbse: "c", icse: "i" };
export const forBoard = <T extends { b?: string }>(rows: T[], board: BoardId) => rows.filter(row => !row.b || row.b.includes(LETTER[board]));
