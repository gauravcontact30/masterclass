import { bankIds, hasInterviewBank, INTERVIEW_TECHS, loadInterviewBank } from "@/lib/interview-bank";
import { arrangeOptions } from "@/lib/interview-questions";

const BANKS = INTERVIEW_TECHS.flatMap(bankIds);

test("covers all 31 technologies, each with a question file (one per tab for tabbed ones)", () => {
  expect(INTERVIEW_TECHS).toHaveLength(31);
  expect(new Set(INTERVIEW_TECHS.map(tech => tech.id)).size).toBe(31);
  for (const id of BANKS) expect(hasInterviewBank(id)).toBe(true);
});

test("Key TanStack libraries has a tab per library", () => {
  const tanstack = INTERVIEW_TECHS.find(tech => tech.id === "tanstack-libraries")!;
  expect(tanstack.tabs?.map(tab => tab.title)).toEqual(["TanStack Query", "TanStack Router", "TanStack Start", "TanStack Table", "TanStack Form", "TanStack DB & AI"]);
});

test.each(BANKS.map(id => [id] as const))("%s has 30+ subjective and 30+ well-formed objective questions", async id => {
  const set = await loadInterviewBank(id);
  expect(set.subjective.length).toBeGreaterThanOrEqual(30);
  expect(set.objective.length).toBeGreaterThanOrEqual(30);
  const questions = [...set.subjective, ...set.objective].map(q => q.question + (q.code ?? ""));
  expect(new Set(questions).size).toBe(questions.length);
  for (const q of [...set.subjective, ...set.objective]) {
    expect([1, 2, 3, 4, 5]).toContain(q.stars);
    expect(q.question).toMatch(/[?.…]$/);
    // Backticks mark inline code, so they must come in pairs.
    for (const text of [q.question, "why" in q ? q.why : q.answer]) expect(text.split("`").length % 2).toBe(1);
  }
  for (const q of set.subjective) expect(q.answer.length).toBeGreaterThan(60);
  for (const q of set.objective) {
    expect(new Set(q.options).size).toBe(4);
    expect(q.why.length).toBeGreaterThan(10);
    const { options, answer } = arrangeOptions(q);
    expect(options[answer]).toBe(q.options[q.answer]);
  }
});

test("an unknown technology is refused", async () => {
  await expect(loadInterviewBank("cobol")).rejects.toThrow(/No interview questions/);
});
