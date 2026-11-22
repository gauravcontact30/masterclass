import type { QuickItem } from "../quick-qa";
import { forBoard, type BoardId, type ClassId, type Item, type Mcq, type Pack, type PackSubject, type SubjectId } from "./types";
import type { Generated } from "./generated/util";
import { extraFor } from "./extra";

/* The three boards, their two public examinations, and the theory-paper pattern each subject is usually set in. */
export type Pattern = { marks: number; minutes: number; paper: string; sections: string };
export type Board = { id: BoardId; code: string; name: string; full: string; tagline: string; exams: Record<ClassId, { short: string; name: string }>; patterns: Record<ClassId, Record<PackSubject, Pattern>> };

export const CLASSES: { id: ClassId; label: string }[] = [{ id: "10", label: "High School · Class 10" }, { id: "12", label: "Intermediate · Class 12" }];
export const SUBJECTS: { id: SubjectId; name: string; code: string }[] = [
  { id: "math", name: "Math", code: "∑" }, { id: "physics", name: "Physics", code: "Φ" }, { id: "organic", name: "Organic Chemistry", code: "⌬" },
  { id: "inorganic", name: "Inorganic Chemistry", code: "⚗" }, { id: "english", name: "English", code: "Aa" },
];
/** The hand-authored pack a subject reads from. */
export const packOf = (subject: SubjectId): PackSubject => subject === "organic" || subject === "inorganic" ? "chemistry" : subject;
/** A board's paper pattern for a subject (both chemistry subjects sit in the Chemistry paper). */
export const patternOf = (board: Board, cls: ClassId, subject: SubjectId) => board.patterns[cls][packOf(subject)];
/** Organic chapters of the chemistry packs; every other chemistry chapter (inorganic and physical) is Inorganic. */
const ORGANIC = /carbon|alcohol|aldehyde|ketone|carboxylic|amine|biomolecule|haloalkane|haloarene|hydrocarbon|organic|polymer/i;
const sideOf = (chapter: string): "organic" | "inorganic" => ORGANIC.test(chapter) ? "organic" : "inorganic";

const p = (marks: number, minutes: number, paper: string, sections: string): Pattern => ({ marks, minutes, paper, sections });

export const BOARDS: Board[] = [
  {
    id: "up", code: "UP", name: "UP Board", full: "Uttar Pradesh Madhyamik Shiksha Parishad", tagline: "High School and Intermediate, on the NCERT syllabus",
    exams: { "10": { short: "High School", name: "High School Examination (Class 10)" }, "12": { short: "Intermediate", name: "Intermediate Examination (Class 12)" } },
    patterns: {
      "10": {
        math: p(70, 195, "Mathematics", "Part A: 20 one-mark multiple-choice questions on the OMR sheet · Part B: 50 marks of descriptive questions"),
        physics: p(70, 195, "Science (Physics portion)", "Part A: 20 one-mark multiple-choice questions · Part B: descriptive questions across Physics, Chemistry and Biology"),
        chemistry: p(70, 195, "Science (Chemistry portion)", "Part A: 20 one-mark multiple-choice questions · Part B: descriptive questions across Physics, Chemistry and Biology"),
        english: p(70, 195, "English", "Part A: 20 one-mark multiple-choice questions · Part B: reading, writing, grammar and literature"),
      },
      "12": {
        math: p(100, 195, "Mathematics", "Multiple-choice, very short, short and long answer questions with internal choice"),
        physics: p(70, 195, "Physics", "Multiple-choice, very short, short and long answer questions; numericals and derivations"),
        chemistry: p(70, 195, "Chemistry", "Multiple-choice, very short, short and long answer questions; reactions and numericals"),
        english: p(100, 195, "English", "Reading, writing, grammar and literature (prose, poetry and supplementary reader)"),
      },
    },
  },
  {
    id: "cbse", code: "CBSE", name: "CBSE", full: "Central Board of Secondary Education", tagline: "Class 10 and Class 12, with competency and case-based questions",
    exams: { "10": { short: "Class 10", name: "Secondary School Examination (Class 10)" }, "12": { short: "Class 12", name: "Senior School Certificate Examination (Class 12)" } },
    patterns: {
      "10": {
        math: p(80, 180, "Mathematics (Standard)", "Section A: MCQs and assertion-reason · B: 2 marks · C: 3 marks · D: 5 marks · E: case-based, 4 marks"),
        physics: p(80, 180, "Science (Physics portion)", "Section A: MCQs · B: 2 marks · C: 3 marks · D: 5 marks · E: case-based; Physics carries about a third of the paper"),
        chemistry: p(80, 180, "Science (Chemistry portion)", "Section A: MCQs · B: 2 marks · C: 3 marks · D: 5 marks · E: case-based; Chemistry carries about a third of the paper"),
        english: p(80, 180, "English Language and Literature", "Section A: Reading · B: Writing and Grammar · C: Literature"),
      },
      "12": {
        math: p(80, 180, "Mathematics", "Section A: MCQs and assertion-reason · B: 2 marks · C: 3 marks · D: 5 marks · E: case-based, 4 marks"),
        physics: p(70, 180, "Physics", "Section A: MCQs · B: 2 marks · C: 3 marks · D: case-based, 4 marks · E: long answer, 5 marks"),
        chemistry: p(70, 180, "Chemistry", "Section A: MCQs · B: 2 marks · C: 3 marks · D: case-based, 4 marks · E: long answer, 5 marks"),
        english: p(80, 180, "English Core", "Section A: Reading · B: Creative Writing · C: Literature"),
      },
    },
  },
  {
    id: "icse", code: "ICSE", name: "ICSE / ISC", full: "Council for the Indian School Certificate Examinations", tagline: "ICSE for Class 10 and ISC for Class 12, with separate science papers",
    exams: { "10": { short: "ICSE", name: "ICSE Examination (Class 10)" }, "12": { short: "ISC", name: "ISC Examination (Class 12)" } },
    patterns: {
      "10": {
        math: p(80, 150, "Mathematics", "Section A: 40 marks, compulsory · Section B: 40 marks, attempt any four questions"),
        physics: p(80, 120, "Physics (Science Paper 1)", "Section A: 40 marks, compulsory · Section B: 40 marks, attempt any four questions"),
        chemistry: p(80, 120, "Chemistry (Science Paper 2)", "Section A: 40 marks, compulsory · Section B: 40 marks, attempt any four questions"),
        english: p(80, 120, "English Language (Paper 1)", "Composition · letter · notice and e-mail · comprehension · grammar"),
      },
      "12": {
        math: p(80, 180, "Mathematics", "Section A: compulsory · Section B or Section C: choose one"),
        physics: p(70, 180, "Physics (Paper 1, Theory)", "Section A: objective · B: short answer · C: long answer · D: case or detailed answer"),
        chemistry: p(70, 180, "Chemistry (Paper 1, Theory)", "Section A: objective · B: short answer · C: long answer · D: case or detailed answer"),
        english: p(80, 180, "English Language (Paper 1)", "Composition · directed writing · proposal · grammar · comprehension"),
      },
    },
  },
];

const HAND: Record<`${ClassId}-${PackSubject}`, () => Promise<{ default: Pack }>> = {
  "10-math": () => import("./x-math"), "10-physics": () => import("./x-physics"), "10-chemistry": () => import("./x-chemistry"), "10-english": () => import("./x-english"),
  "12-math": () => import("./xii-math"), "12-physics": () => import("./xii-physics"), "12-chemistry": () => import("./xii-chemistry"), "12-english": () => import("./xii-english"),
};
/* The generated practice banks (lib/board-exams/generated): computed questions that bring every subject past 500 objective and 500 subjective questions. */
const GENERATED: Record<SubjectId, () => Promise<(cls: ClassId) => Generated>> = {
  math: () => import("./generated/math").then(m => m.generateMath), physics: () => import("./generated/physics").then(m => m.generatePhysics),
  organic: () => import("./generated/organic").then(m => m.generateOrganic), inorganic: () => import("./generated/inorganic").then(m => m.generateInorganic),
  english: () => import("./generated/english").then(m => m.generateEnglish),
};
const IMPORTANT: Record<ClassId, () => Promise<Record<PackSubject, Omit<Item, "id">[]>>> = {
  "10": () => import("./important/x").then(m => m.IMPORTANT_X), "12": () => import("./important/xii").then(m => m.IMPORTANT_XII),
};
const SHEET_SIDE: Record<string, "organic" | "inorganic"> = { "carbon.equations": "organic", "organic.reactions": "organic" };

/** A subject's material for one class: the hand-authored pack (filtered to its side for chemistry) followed by the generated bank. */
export const loadPack = async (cls: ClassId, subject: SubjectId): Promise<Pack> => {
  const [hand, generate, generateMore, important] = await Promise.all([HAND[`${cls}-${packOf(subject)}`]().then(m => m.default), GENERATED[subject](), import("./generated/more").then(m => m.generateMore), IMPORTANT[cls]()]);
  // The hand-written most-important theory questions (lib/board-exams/important), with ids of their own.
  const theory: Item[] = important[packOf(subject)].map((item, index) => ({ ...item, id: `${cls}-${packOf(subject)}-imp${index + 1}` }));
  const generated = generate(cls); const more = generateMore(cls, subject); const extra = extraFor(cls, packOf(subject));
  const side = packOf(subject) === "chemistry" ? subject : null;
  const keep = <T extends { ch: string }>(rows: T[]) => side ? rows.filter(row => sideOf(row.ch) === side) : rows;
  return {
    items: [...keep(theory), ...keep(hand.items), ...keep(extra.items), ...generated.items, ...more.items],
    mcqs: [...keep(hand.mcqs), ...keep(extra.mcqs), ...generated.mcqs, ...more.mcqs],
    sheets: side ? hand.sheets.filter(sheet => (SHEET_SIDE[sheet.title] ?? "inorganic") === side) : hand.sheets,
  };
};

export type Test = { id: string; title: string; mcqs: Mcq[]; short: Item[]; long: Item[]; marks: number; minutes: number };
const take = <T,>(rows: T[], start: number, count: number): T[] => rows.length ? Array.from({ length: Math.min(count, rows.length) }, (_, index) => rows[(start + index) % rows.length]) : [];

/**
 * A board's test series for one subject: three mini mocks drawn from that board's questions only, each with a
 * multiple-choice part and two written parts, timed in proportion to the board's own paper.
 */
export function buildTests(source: Pack, board: Board, cls: ClassId, subject: SubjectId): Test[] {
  const offset = BOARDS.indexOf(board);
  const mcqs = forBoard(source.mcqs, board.id); const items = forBoard(source.items, board.id);
  const shorts = items.filter(item => item.kind === "bank" || item.kind === "unsolved"); const longs = items.filter(item => item.kind === "important" || item.kind === "solved");
  const pattern = patternOf(board, cls, subject);
  return [0, 1, 2].map(n => {
    const m = take(mcqs, offset + n * 3, 5); const s = take(shorts, offset + n * 3, 3); const l = take(longs, offset * 2 + n * 3, 3);
    const marks = m.length + [...s, ...l].reduce((sum, item) => sum + item.marks, 0);
    return { id: `${board.id}-${cls}-${subject}-t${n + 1}`, title: `${board.exams[cls].short} ${SUBJECTS.find(x => x.id === subject)!.name} · Test ${n + 1}`, mcqs: m, short: s, long: l, marks, minutes: Math.max(15, Math.round(marks * pattern.minutes / pattern.marks / 5) * 5) };
  });
}

/* The Quick Q&A set of each class and subject: 200+ one-line questions with short answers, in lib/board-exams/quick. */
const QUICK: Record<`${ClassId}-${PackSubject}`, () => Promise<{ default: QuickItem[] }>> = {
  "10-math": () => import("./quick/x-math"), "10-physics": () => import("./quick/x-physics"), "10-chemistry": () => import("./quick/x-chemistry"), "10-english": () => import("./quick/x-english"),
  "12-math": () => import("./quick/xii-math"), "12-physics": () => import("./quick/xii-physics"), "12-chemistry": () => import("./quick/xii-chemistry"), "12-english": () => import("./quick/xii-english"),
};
export const loadQuick = async (cls: ClassId, subject: SubjectId): Promise<QuickItem[]> => {
  const items = (await QUICK[`${cls}-${packOf(subject)}`]()).default;
  return packOf(subject) === "chemistry" ? items.filter(item => sideOf(item.topic) === subject) : items;
};
