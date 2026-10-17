import { WORKFLOWS } from "@/lib/landing-workflows";
import { arrangeOptions, byStars, WORKFLOW_PREP } from "@/lib/workflow-prep";
import { hasMoreQuestions, loadMoreQuestions } from "@/lib/workflow-prep/questions";

test("every blueprint has its full detail and interview questions, and nothing else does", () => {
  expect(Object.keys(WORKFLOW_PREP).sort()).toEqual(WORKFLOWS.map(w => w.id).sort());
});

test("every category has at least four blueprints", () => {
  const counts = new Map<string, number>();
  for (const w of WORKFLOWS) counts.set(w.group, (counts.get(w.group) ?? 0) + 1);
  for (const count of counts.values()) expect(count).toBeGreaterThanOrEqual(4);
});

test.each(Object.entries(WORKFLOW_PREP))("%s has a complete brief and well-formed questions", (_, prep) => {
  expect(prep.stack.length).toBeGreaterThanOrEqual(3);
  for (const list of [prep.decisions, prep.pitfalls, prep.metrics]) expect(list.length).toBeGreaterThanOrEqual(3);
  expect(prep.subjective).toHaveLength(3);
  expect(prep.objective).toHaveLength(3);
  for (const q of [...prep.subjective, ...prep.objective]) {
    expect(q.stars).toBeGreaterThanOrEqual(1); expect(q.stars).toBeLessThanOrEqual(5);
    // A question, an instruction ("Design a …") or a stem the options complete ("The agent should…").
    expect(q.question).toMatch(/[?.…]$/);
  }
  for (const q of prep.subjective) expect(q.answer.length).toBeGreaterThan(80);
  for (const q of prep.objective) {
    expect(new Set(q.options).size).toBe(4);
    expect(q.why.length).toBeGreaterThan(20);
  }
});

test("arranging the options keeps the right answer and spreads it across A–D", () => {
  const all = Object.values(WORKFLOW_PREP).flatMap(prep => prep.objective);
  const positions = [0, 0, 0, 0];
  for (const q of all) {
    const { options, answer } = arrangeOptions(q);
    expect(options[answer]).toBe(q.options[q.answer]);
    expect([...options].sort()).toEqual([...q.options].sort());
    positions[answer]++;
  }
  for (const count of positions) expect(count / all.length).toBeGreaterThan(.12);
});

test("questions are ordered by how often they are asked", () => {
  expect(byStars([{ stars: 3 }, { stars: 5 }, { stars: 4 }]).map(q => q.stars)).toEqual([5, 4, 3]);
});

test.each(Object.entries(WORKFLOW_PREP))("%s has 30+ subjective and 30+ objective questions with its extra file", async (id, prep) => {
  expect(hasMoreQuestions(id)).toBe(true);
  const more = await loadMoreQuestions(id);
  const subjective = [...prep.subjective, ...more.subjective]; const objective = [...prep.objective, ...more.objective];
  expect(subjective.length).toBeGreaterThanOrEqual(31);
  expect(objective.length).toBeGreaterThanOrEqual(31);
  const questions = [...subjective, ...objective].map(q => q.question + (q.code ?? ""));
  expect(new Set(questions).size).toBe(questions.length);
  for (const q of [...more.subjective, ...more.objective]) expect(q.question).toMatch(/[?.…]$/);
  for (const q of more.subjective) expect(q.answer.length).toBeGreaterThan(80);
  for (const q of more.objective) { expect(new Set(q.options).size).toBe(4); expect(q.why.length).toBeGreaterThan(20); }
});
