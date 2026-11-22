import type { ExamId } from "./exams";

/*
 * How each exam marks one objective question, from the latest notification we know of for its main paper. Shown on
 * every objective question as "+2 · −0.5". Schemes change between notifications, so the page asks learners to
 * confirm them with the current official notification.
 *   basis     the paper the scheme is taken from
 *   correct   marks for a correct answer (a function when it differs by subject, as in NDA)
 *   wrong     marks deducted for a wrong answer (0: no negative marking)
 */
export type Marking = { basis: string; correct: number | ((subject: string) => number); wrong: number | ((subject: string) => number) };

const NDA_MATHS = /math|quant|algebra|trigonometry|calculus|geometry|statistics|arithmetic/i;
export const MARKING: Record<ExamId, Marking> = {
  nda: { basis: "NDA & NA: Mathematics 2.5 marks, GAT 4 marks, one-third negative", correct: s => (NDA_MATHS.test(s) ? 2.5 : 4), wrong: s => (NDA_MATHS.test(s) ? 0.83 : 1.33) },
  defence: { basis: "AFCAT: +3 for a correct answer, −1 for a wrong one", correct: 3, wrong: 1 },
  banks: { basis: "IBPS PO / SBI PO Prelims: 1 mark, one-quarter negative", correct: 1, wrong: 0.25 },
  railways: { basis: "RRB NTPC CBT-1: 1 mark, one-third negative", correct: 1, wrong: 0.33 },
  tet: { basis: "CTET: 1 mark per question, no negative marking", correct: 1, wrong: 0 },
  isro: { basis: "ISRO Scientist/Engineer: +3 for a correct answer, −1 for a wrong one", correct: 3, wrong: 1 },
  upsc: { basis: "UPSC Prelims GS Paper 1: 2 marks, one-third negative", correct: 2, wrong: 0.66 },
  ssc: { basis: "SSC CGL Tier 1: 2 marks, −0.50 for a wrong answer", correct: 2, wrong: 0.5 },
  "state-psc": { basis: "UPPSC Prelims GS: 150 questions for 200 marks, one-third negative", correct: 1.33, wrong: 0.44 },
  jee: { basis: "JEE Main: +4 for a correct answer, −1 for a wrong one", correct: 4, wrong: 1 },
  neet: { basis: "NEET UG: +4 for a correct answer, −1 for a wrong one", correct: 4, wrong: 1 },
  gate: { basis: "GATE: 1- and 2-mark MCQs, one-third negative (shown for a 2-mark question)", correct: 2, wrong: 0.67 },
  cat: { basis: "CAT: +3 for a correct answer, −1 for a wrong MCQ", correct: 3, wrong: 1 },
  clat: { basis: "CLAT UG: 1 mark, −0.25 for a wrong answer", correct: 1, wrong: 0.25 },
  cuet: { basis: "CUET UG: +5 for a correct answer, −1 for a wrong one", correct: 5, wrong: 1 },
  "ugc-net": { basis: "UGC NET: 2 marks per question, no negative marking", correct: 2, wrong: 0 },
  police: { basis: "SSC CPO Paper 1: 1 mark, −0.25 for a wrong answer", correct: 1, wrong: 0.25 },
  cbi: { basis: "SSC CGL Tier 1 (CBI Sub-Inspector): 2 marks, −0.50 for a wrong answer", correct: 2, wrong: 0.5 },
  "income-tax": { basis: "SSC CGL Tier 1 (Income Tax Inspector): 2 marks, −0.50 for a wrong answer", correct: 2, wrong: 0.5 },
  ib: { basis: "IB ACIO Tier 1: 1 mark, −0.25 for a wrong answer", correct: 1, wrong: 0.25 },
  insurance: { basis: "LIC AAO Prelims: 70 marks for 100 questions, one-quarter negative", correct: 0.7, wrong: 0.18 },
  epfo: { basis: "EPFO SSA Prelims: 1 mark, −0.25 for a wrong answer", correct: 1, wrong: 0.25 },
  "coast-guard": { basis: "Coast Guard Navik CGEPT: 1 mark per question, no negative marking", correct: 1, wrong: 0 },
};
const value = (v: Marking["correct"], subject: string) => (typeof v === "function" ? v(subject) : v);
/** "+2 · −0.5" for one question of an exam ("+1 · no negative" when nothing is deducted). */
export function marksFor(exam: ExamId, subject: string): { correct: number; wrong: number; label: string } {
  const scheme = MARKING[exam]; const correct = value(scheme.correct, subject); const wrong = value(scheme.wrong, subject);
  return { correct, wrong, label: `+${correct} · ${wrong ? `−${wrong}` : "no negative"}` };
}
