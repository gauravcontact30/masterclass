import type { ExamId } from "./exams";
import { marksFor } from "./marking";
import type { Objective, Pack, Subjective } from "./types";
import { rng, shuffle } from "@/lib/board-exams/generated/util";
import type { Paper, PaperQuestion, PaperSet } from "@/lib/board-exams/sample-papers";

/*
 * Sample papers, mock tests and year-wise practice papers for the Competitive Exams dashboard (2026-11-24).
 *
 * A paper is 50 of the exam's objective questions, in sections by subject, marked with the exam's own scheme
 * (marks for a right answer and the negative mark for a wrong one, lib/competitive-exams/marking.ts) and timed at
 * the exam's own pace. Year papers are practice papers: questions whose "asked" note names that year come first,
 * and the page says how many there are. They are not the exam's own question paper.
 */
export const PAPER_QUESTIONS = 50;
export const SAMPLE_PAPERS = 6, MOCK_PAPERS = 6;
/** The last 12 examination years, newest first. */
export const COMPETITIVE_YEARS: number[] = Array.from({ length: 12 }, (_, i) => 2025 - i);

/** Minutes per question in each exam's main objective paper, from its pattern (lib/competitive-exams/exams.ts). */
const PACE: Record<ExamId, number> = {
  nda: 1.1, defence: 1.2, banks: 0.6, railways: 0.9, tet: 1, isro: 1.1, upsc: 1.2, ssc: 0.6, "state-psc": 0.8, jee: 2.4, neet: 1, gate: 2.8,
  cat: 1.8, clat: 1, cuet: 1, "ugc-net": 1.2, police: 1, cbi: 0.6, "income-tax": 0.6, ib: 0.6, insurance: 0.6, epfo: 0.6, "coast-guard": 0.75,
};
const LETTERS = "ABCDEFGHIJKLMNOP";
const OPTION = ["a", "b", "c", "d", "e"];
const hash = (text: string) => [...text].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);
const round2 = (n: number) => Math.round(n * 100) / 100;

/** One objective question in the paper shape, with the exam's marks and where it was asked. */
export function objectiveQuestion(o: Objective, exam: ExamId): PaperQuestion {
  const { correct, wrong } = marksFor(exam, o.subject);
  return { id: o.id, ch: o.subject, q: o.q, stars: o.stars, marks: round2(correct), negative: wrong ? round2(wrong) : undefined, section: "A",
    options: o.options, correct: o.correct, steps: [o.why, ...(o.asked ? [`// Asked: ${o.asked}`] : [])], answer: `(${OPTION[o.correct]}) ${o.options[o.correct]}` };
}
/** A written, short or one-line question with its model answer. Not scored, so it carries no marks. */
export function writtenQuestion(s: Subjective): PaperQuestion {
  return { id: s.id, ch: s.subject, q: s.q, stars: s.stars, marks: 0, section: "W", steps: s.a.length > 1 ? [...s.a, ...(s.asked ? [`// Asked: ${s.asked}`] : [])] : s.asked ? [`// Asked: ${s.asked}`] : [],
    answer: s.a.length > 1 ? "See the points above." : s.a[0] ?? "" };
}

export function buildExamPapers(pack: Pack, exam: ExamId, examName: string): PaperSet {
  const r = rng(hash(`competitive-${exam}`));
  const pool = shuffle(r, pack.objective);
  const minutes = Math.max(15, Math.ceil((PAPER_QUESTIONS * PACE[exam]) / 5) * 5);

  // Sections by subject, in the order the subjects first appear in the exam's own pack.
  const subjectOrder = [...new Set(pack.objective.map(o => o.subject))];
  const make = (rows: Objective[], kind: Paper["kind"], title: string, year?: number, note?: string): Paper => {
    const sorted = [...rows].sort((a, b) => subjectOrder.indexOf(a.subject) - subjectOrder.indexOf(b.subject));
    const subjects = [...new Set(sorted.map(o => o.subject))];
    const letter = new Map(subjects.map((s, i) => [s, LETTERS[i] ?? "Z"]));
    const questions = sorted.map(o => ({ ...objectiveQuestion(o, exam), section: letter.get(o.subject)! }));
    return { id: `${exam}-${kind}-${year ?? title}`, kind, title, year, questions, marks: round2(questions.reduce((sum, q) => sum + q.marks, 0)), minutes,
      sectionNames: Object.fromEntries(subjects.map(s => [letter.get(s)!, s])), note };
  };
  const slice = (index: number) => Array.from({ length: Math.min(PAPER_QUESTIONS, pool.length) }, (_, i) => pool[(index * PAPER_QUESTIONS + i) % pool.length]);

  const sample = Array.from({ length: SAMPLE_PAPERS }, (_, i) => make(slice(i), "sample", `${examName} Sample Paper ${i + 1}`));
  const mock = Array.from({ length: MOCK_PAPERS }, (_, i) => make(slice(SAMPLE_PAPERS + i), "mock", `${examName} Mock Test ${i + 1}`));
  const years = COMPETITIVE_YEARS.map((year, i) => {
    // Questions noted as asked in this year first, then the paper's usual share of the rest.
    const tagged = pool.filter(o => o.asked.includes(String(year))).slice(0, PAPER_QUESTIONS);
    const ids = new Set(tagged.map(o => o.id));
    const rest = slice(SAMPLE_PAPERS + MOCK_PAPERS + i).filter(o => !ids.has(o.id)).slice(0, PAPER_QUESTIONS - tagged.length);
    const note = tagged.length
      ? `A practice paper for ${year}, written by us with full answers. ${tagged.length} of its ${tagged.length + rest.length} questions are noted as asked in ${year} (from released and memory-based papers, as best recalled); the rest are questions of the same kind. It is not the ${year} question paper itself.`
      : `A practice paper for ${year}, written by us with full answers, in the exam's pattern and marking. None of our questions is noted as asked in ${year}, so it is not a copy of the ${year} question paper.`;
    return make([...tagged, ...rest], "year", `${examName} ${year} practice paper`, year, note);
  });
  // Most asked: every question, objective and written, highest rated first.
  const asked = [...pack.objective.map(o => objectiveQuestion(o, exam)), ...pack.subjective.map(writtenQuestion)].sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0));
  const unique = new Set([...sample, ...mock, ...years].flatMap(p => p.questions.map(q => q.id))).size;
  return { sample, mock, years, asked, unique };
}
