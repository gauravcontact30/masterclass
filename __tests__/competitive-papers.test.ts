import { buildExamPapers, COMPETITIVE_YEARS, PAPER_QUESTIONS } from "@/lib/competitive-exams/papers";
import type { Pack } from "@/lib/competitive-exams/types";

// Test-only questions: 420 objective over three subjects, a few noted as asked in 2019, and some written ones.
const SUBJECTS = ["Reasoning", "Quantitative Aptitude", "English"];
const pack: Pack = {
  objective: Array.from({ length: 420 }, (_, i) => ({ id: `o${i}`, subject: SUBJECTS[i % 3], stars: (3 + (i % 3)) as 3 | 4 | 5, asked: i < 4 ? "SSC CGL 2019" : "SSC CGL (recurring)",
    q: `Question ${i}`, options: ["w", "x", "y", "z"], correct: i % 4, why: `Because ${i}` })),
  subjective: Array.from({ length: 30 }, (_, i) => ({ id: `s${i}`, subject: "Essay", stars: 5 as const, asked: "SSC CGL Tier 2", q: `Write about ${i}`, a: [`Point ${i}`] })),
};
const set = buildExamPapers(pack, "ssc", "SSC Exams");

test("6 sample, 6 mock and 12 year papers of 50 distinct questions, marked +2 / −0.5 like SSC CGL, in sections by subject", () => {
  expect(set.sample).toHaveLength(6); expect(set.mock).toHaveLength(6);
  expect(set.years.map(p => p.year)).toEqual(COMPETITIVE_YEARS);
  expect(COMPETITIVE_YEARS[0]).toBe(2025); expect(COMPETITIVE_YEARS.at(-1)).toBe(2014);
  for (const p of [...set.sample, ...set.mock, ...set.years]) {
    expect(new Set(p.questions.map(q => q.id)).size).toBe(PAPER_QUESTIONS);
    expect(p.questions.every(q => q.marks === 2 && q.negative === 0.5 && q.answer.startsWith("("))).toBe(true);
    expect(p.marks).toBe(100);
    // Every section letter is named after its subject.
    for (const q of p.questions) expect(p.sectionNames?.[q.section]).toBe(q.ch);
  }
  expect(set.unique).toBeGreaterThanOrEqual(400);
});

test("a year paper puts the questions noted for that year first and says how many there are; other years say none", () => {
  const y2019 = set.years.find(p => p.year === 2019)!;
  expect(y2019.questions.filter(q => ["o0", "o1", "o2", "o3"].includes(q.id))).toHaveLength(4);
  expect(y2019.note).toMatch(/4 of its 50 questions are noted as asked in 2019/);
  expect(y2019.note).toMatch(/not the 2019 question paper itself/);
  expect(set.years.find(p => p.year === 2024)!.note).toMatch(/None of our questions is noted as asked in 2024/);
});

test("most asked holds objective and written questions, highest rated first, written ones unscored", () => {
  expect(set.asked).toHaveLength(450);
  expect(set.asked.map(q => q.stars ?? 0)).toEqual([...set.asked.map(q => q.stars ?? 0)].sort((a, b) => b - a));
  expect(set.asked.find(q => q.id === "s0")).toMatchObject({ marks: 0, answer: "Point 0" });
});
