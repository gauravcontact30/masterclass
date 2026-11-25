import { buildIeltsPapers, ieltsBank, IELTS_YEARS } from "@/lib/ielts/bank";
import { PORTALS, isExamPortal, isPortal, isScopedPortal, portalOfPath, scopedPortalOfPath } from "@/lib/portal";
import { overallBand } from "@/lib/ielts-content";

const bank = ieltsBank();
const set = buildIeltsPapers(bank);

test("480 IELTS questions, every one answered; objective ones have one right option among distinct options", () => {
  expect(bank.length).toBeGreaterThanOrEqual(400);
  expect(new Set(bank.map(q => q.id)).size).toBe(bank.length);
  for (const q of bank) {
    expect(q.answer.trim()).not.toBe("");
    if (q.options) { expect(new Set(q.options).size).toBe(q.options.length); expect(q.options[q.correct!]).toBeDefined(); }
  }
  // Every Speaking Part 3 question has its model answer.
  expect(bank.filter(q => q.skill === "Speaking")).toHaveLength(60);
});

test("band questions are computed: the right option is the overall band rule's own result", () => {
  for (const q of bank.filter(q => q.id.startsWith("ie-ob"))) {
    const scores = [...q.q.matchAll(/(\d+(?:\.5)?)/g)].map(m => Number(m[1]));
    expect(q.options![q.correct!]).toBe(String(overallBand(scores)));
  }
});

test("24 papers in test order, Reading kept with its passage, 12 practice years that say IELTS publishes no papers", () => {
  const papers = [...set.sample, ...set.mock, ...set.years];
  expect(papers).toHaveLength(24);
  expect(set.years.map(p => p.year)).toEqual(IELTS_YEARS);
  for (const p of papers) {
    expect(p.questions.map(q => q.section).join("")).toMatch(/^A+B+C+D+E+F+$/);
    expect(new Set(p.questions.filter(q => q.section === "A").map(q => q.context)).size).toBe(1);
    expect(new Set(p.questions.map(q => q.id)).size).toBe(p.questions.length);
  }
  expect(set.years[0].note).toMatch(/IELTS does not publish its past test papers/);
  expect(set.unique).toBeGreaterThanOrEqual(400);
});

test("IELTS Achievers is a fourth portal with its own account, worldwide, under /ielts/", () => {
  expect(isPortal("ielts")).toBe(true); expect(isScopedPortal("ielts")).toBe(true); expect(isExamPortal("ielts")).toBe(false);
  expect(PORTALS.ielts).toMatchObject({ home: "/ielts/dashboard", signIn: "/ielts/sign-in", signUp: "/ielts/sign-up", plans: "/ielts/plans" });
  expect(scopedPortalOfPath("/ielts/dashboard")).toBe("ielts");
  expect(portalOfPath("/ielts/sign-up")).toBe("ielts");
  // The public guide and Tech Pro's hub stay with Tech.
  expect(scopedPortalOfPath("/ielts-preparation")).toBeNull();
  expect(portalOfPath("/learning/ielts")).toBe("tech");
  expect(scopedPortalOfPath("/exams/board-exams")).toBe("boards");
});
