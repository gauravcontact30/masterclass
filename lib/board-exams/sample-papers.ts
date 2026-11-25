import type { Ranked } from "./importance";
import type { BoardId, ClassId, Stars, SubjectId } from "./types";
import { rng, shuffle } from "./generated/util";

/*
 * Sample papers, mock tests and year-wise practice papers for the Board Exams dashboard (2026-11-24).
 *
 * Every paper is drawn from the board's own question set for the class and subject (hand-written questions plus the
 * computed banks, all with answers), laid out like a board paper worth the board's full marks: objective questions
 * first, then short and long answers in sections by marks (see blueprint()). The draw is seeded by board, class and subject, so a paper is the same on every visit.
 *
 * Year-wise papers are practice papers set in the style of that year's examination. They are not the board's own
 * question papers, which belong to the board; the page links to the board's archive for those.
 */
export type PaperQuestion = {
  /** Star rating; official papers have none. */
  id: string; ch: string; q: string; stars?: Stars; marks: number;
  /** "A", "B" or "C" in our papers; whatever the board printed in an official one. */
  section: string;
  /** The board's own question number (official papers); our papers number questions in order. */
  no?: string;
  /** Who wrote the answer of an official question: the board's marking scheme, or us. */
  answerBy?: "board" | "ours";
  figure?: { src: string; alt: string };
  /** A passage the question is about (IELTS Reading), shown above it. */
  context?: string;
  /** What the marks box says instead of marks, for unscored questions ("Writing Task 2 · 40 min"). */
  pill?: string;
  /** Marks taken off for a wrong answer (negative marking), when the exam has it. */
  negative?: number;
  /** Objective questions: the four options and the right one. */
  options?: string[]; correct?: number;
  /** Worked solution, one line per step ("// " starts an explanation line). */
  steps: string[]; answer: string; hint?: string;
};
export type PaperKind = "sample" | "mock" | "year";
export type Paper = { id: string; kind: PaperKind; title: string; year?: number; questions: PaperQuestion[]; marks: number; minutes: number;
  /** Set when this is the board's own paper (lib/board-exams/official-papers). */
  official?: { paper: string; set?: string; source: { label: string; url?: string; file?: string; entered: string } };
  /** What each section letter holds, e.g. { A: "Objective · 1 mark each" }. */
  sectionNames?: Record<string, string>;
  /** A line about this paper shown above it (year papers: how they relate to that year). */
  note?: string };
export type PaperSet = { sample: Paper[]; mock: Paper[]; years: Paper[]; asked: PaperQuestion[]; unique: number };

export const SAMPLE_COUNT = 6;
export const MOCK_COUNT = 6;
/** The 20 examination years, newest first. */
export const PAPER_YEARS: number[] = Array.from({ length: 20 }, (_, i) => 2025 - i);

const LETTERS = ["a", "b", "c", "d", "e"];
const SEED: Record<BoardId, number> = { up: 11, cbse: 23, icse: 37 };
const hash = (text: string) => [...text].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

/** One ranked question in the paper's shape. */
export function toPaperQuestion(row: Ranked, section: "A" | "B" | "C"): PaperQuestion {
  if (row.type === "objective") {
    const { mcq } = row;
    return { id: mcq.id, ch: mcq.ch, q: mcq.q, stars: row.stars, marks: 1, section, options: mcq.options, correct: mcq.correct,
      steps: mcq.why ? [mcq.why] : [], answer: `(${LETTERS[mcq.correct]}) ${mcq.options[mcq.correct]}` };
  }
  const { item } = row;
  return { id: item.id, ch: item.ch, q: item.q, stars: row.stars, marks: item.marks, section, steps: item.steps ?? [], answer: item.a, hint: item.hint };
}

/** `count` rows from `pool`, starting at `start` and wrapping round; no row twice in one take. */
const take = <T,>(pool: T[], start: number, count: number): T[] => {
  if (!pool.length) return [];
  const n = Math.min(count, pool.length);
  return Array.from({ length: n }, (_, i) => pool[(start + i) % pool.length]);
};

type Written = Extract<Ranked, { type: "subjective" }>;
/** A paper's groups, by marks: objective, then written 1–2, 3, 4 and 5+ marks. Letters are given in order to the groups a paper has. */
const GROUPS = [
  { id: "obj", name: "Objective · 1 mark each" }, { id: "w2", name: "Short answer · 1–2 marks" }, { id: "w3", name: "Short answer · 3 marks" },
  { id: "w4", name: "Long answer · 4 marks" }, { id: "w5", name: "Long answer · 5 marks and more" },
] as const;
type GroupId = (typeof GROUPS)[number]["id"];
const LETTERS_UP = "ABCDE";

/**
 * How many questions of each group make a paper worth exactly `target` marks: about a quarter objective, then a
 * spread of short and long answers like a board blueprint. Groups a subject has few of (long answers mostly) give
 * up their share to 3-mark questions, so the same few long questions are not in every paper.
 */
export function blueprint(target: number, sizes: Record<GroupId, number>): Record<GroupId, number> {
  const obj = Math.min(sizes.obj, Math.round(target * 0.25));
  const rest = target - obj;
  const k5 = Math.min(Math.round((rest * 0.3) / 5), Math.floor(sizes.w5 / 3));
  const k4 = Math.min(Math.round((rest * 0.2) / 4), Math.floor(sizes.w4 / 3));
  let k2 = Math.min(Math.round((rest * 0.18) / 2), sizes.w2);
  let left = rest - 5 * k5 - 4 * k4 - 2 * k2;
  const k3 = Math.min(Math.floor(left / 3), sizes.w3);
  left -= 3 * k3;
  const more2 = Math.min(Math.floor(left / 2), sizes.w2 - k2); k2 += more2; left -= 2 * more2;
  // Whatever is still short is made up with objective questions, of which every subject has hundreds.
  return { obj: Math.min(sizes.obj, obj + left), w2: k2, w3: k3, w4: k4, w5: k5 };
}

/**
 * Every paper of a board, class and subject. `ranked` is every question of the board with its star rating
 * (rankAll in lib/board-exams/importance). Each paper is worth `targetMarks` (the board's own paper total) and
 * `minutesFor` turns that into its time.
 */
export function buildPapers(ranked: Ranked[], board: BoardId, cls: ClassId, subject: SubjectId, minutesFor: (marks: number) => number, boardShort: string, targetMarks = 80, mostAsked: Ranked[] = ranked): PaperSet {
  const r = rng(SEED[board] * 1000 + hash(`${cls}-${subject}`));
  const written = ranked.filter((row): row is Written => row.type === "subjective");
  const pools: Record<GroupId, Ranked[]> = {
    obj: shuffle(r, ranked.filter(row => row.type === "objective")),
    w2: shuffle(r, written.filter(row => row.item.marks <= 2)),
    w3: shuffle(r, written.filter(row => row.item.marks === 3)),
    w4: shuffle(r, written.filter(row => row.item.marks === 4)),
    w5: shuffle(r, written.filter(row => row.item.marks >= 5)),
  };
  const plan = blueprint(targetMarks, { obj: pools.obj.length, w2: pools.w2.length, w3: pools.w3.length, w4: pools.w4.length, w5: pools.w5.length });
  const present = GROUPS.filter(g => plan[g.id] > 0);
  const letter = Object.fromEntries(present.map((g, i) => [g.id, LETTERS_UP[i]])) as Record<GroupId, string>;
  const sectionNames = Object.fromEntries(present.map(g => [letter[g.id], g.name]));

  const make = (index: number, kind: PaperKind, title: string, year?: number): Paper => {
    // Consecutive slices per group, so papers use different questions for as long as each group lasts.
    const pick = (g: GroupId, count: number) => take(pools[g], index * (g === "obj" ? plan.obj + 4 : plan[g]), count).map(row => ({ ...toPaperQuestion(row, "A"), section: letter[g] }));
    const writtenPart = present.filter(g => g.id !== "obj").flatMap(g => pick(g.id, plan[g.id]));
    // The objective part makes up the exact total, whatever mix of 1- and 2-mark or 5- and 6-mark questions was drawn.
    while (writtenPart.reduce((sum, q) => sum + q.marks, 0) > targetMarks - 1 && writtenPart.length) writtenPart.pop();
    const objCount = Math.min(pools.obj.length, targetMarks - writtenPart.reduce((sum, q) => sum + q.marks, 0));
    const questions = [...pick("obj", objCount), ...writtenPart];
    const marks = questions.reduce((sum, q) => sum + q.marks, 0);
    return { id: `${board}-${cls}-${subject}-${kind}-${year ?? index}`, kind, title, year, questions, marks, minutes: minutesFor(marks), sectionNames };
  };
  const sample = Array.from({ length: SAMPLE_COUNT }, (_, i) => make(i, "sample", `${boardShort} Sample Paper ${i + 1}`));
  const mock = Array.from({ length: MOCK_COUNT }, (_, i) => make(SAMPLE_COUNT + i, "mock", `${boardShort} Mock Test ${i + 1}`));
  const years = PAPER_YEARS.map((year, i) => make(SAMPLE_COUNT + MOCK_COUNT + i, "year", `${boardShort} ${year} practice paper`, year));
  // Most asked: the Most Important list (the head of `ranked`), highest rated first.
  const asked = mostAsked.map(row => toPaperQuestion(row, row.type === "objective" ? "A" : row.item.marks >= 4 ? "C" : "B"));
  const unique = new Set([...sample, ...mock, ...years].flatMap(p => p.questions.map(q => q.id))).size;
  return { sample, mock, years, asked, unique };
}
