/** @jest-environment node */
import { parsePath, pathRequestSchema, rulePath, stageSpans } from "@/lib/learning-path";
import { coachSummary, parseCoach, ruleCoach, type CoachSignals } from "@/lib/study-coach";
import { parseAdminAnswer } from "@/lib/admin-ask";

const input = pathRequestSchema.parse({ goal: "Become a backend developer with Node", weeks: 4 });

describe("learning path", () => {
  test("three stages always cover the chosen weeks, earlier stages taking the extra week", () => {
    expect(stageSpans(4)).toEqual([[1, 2], [3, 3], [4, 4]]);
    expect(stageSpans(8)).toEqual([[1, 3], [4, 6], [7, 8]]);
    expect(stageSpans(12)).toEqual([[1, 4], [5, 8], [9, 12]]);
    expect(pathRequestSchema.safeParse({ goal: "learn react", weeks: 2 }).success).toBe(false);
  });
  test("keeps exactly three stages, only catalog technologies, each linked to its notes", () => {
    const reply = JSON.stringify({ summary: "Three stages.", stages: [
      { focus: "Basics", technologyIds: ["javascript", "made-up-tech"], tasks: ["Read"], outcome: "Know JS" },
      { focus: "Server", technologyIds: ["node", "node"], tasks: ["Build"], outcome: "An API" },
      { focus: "Data", technologyIds: ["supabase"], tasks: ["Store"], outcome: "Persist" },
      { focus: "A fourth stage nobody asked for", technologyIds: ["redis"], tasks: ["x"], outcome: "y" },
    ] });
    const path = parsePath(`Here you go: ${reply}`, input)!;
    expect(path.stages).toHaveLength(3);
    expect(path.stages.map(s => [s.from, s.to])).toEqual([[1, 2], [3, 3], [4, 4]]);
    expect(path.stages[0].technologies.map(t => t.id)).toEqual(["javascript"]);
    expect(path.stages[1].technologies).toEqual([{ id: "node", title: "Node.js", href: "/learning/notes?technology=node" }]);
  });
  test("rejects fewer than three stages, a reply linking to nothing in the catalog, or prose", () => {
    const two = JSON.stringify({ summary: "x", stages: [1, 2].map(() => ({ focus: "a", technologyIds: ["node"], tasks: ["t"], outcome: "o" })) });
    expect(parsePath(two, input)).toBeNull();
    expect(parsePath(JSON.stringify({ summary: "x", stages: [1, 2, 3].map(() => ({ focus: "a", technologyIds: ["nope"], tasks: ["t"], outcome: "o" })) }), input)).toBeNull();
    expect(parsePath("Sorry, I cannot help.", input)).toBeNull();
  });
  test("the rule-based plan matches the goal, has three stages and reads cleanly", () => {
    const path = rulePath(pathRequestSchema.parse({ goal: "build AI agents", weeks: 6 }));
    expect(path.stages).toHaveLength(3);
    expect(path.stages[0].technologies[0].id).toBe("python");
    expect(path.stages.every(s => s.technologies.length > 0)).toBe(true);
    const copy = JSON.stringify(path);
    expect(copy).not.toMatch(/ \+ |practise/);
    expect(rulePath(pathRequestSchema.parse({ goal: "something vague", weeks: 4 })).stages[0].technologies[0].id).toBe("javascript");
  });
});

describe("study coach", () => {
  const signals: CoachSignals = { goal: "React job", documents: [
    { title: "Hooks", technologyId: "react", level: "beginner", completed: false, page: 2 },
    { title: "JSX", technologyId: "react", level: "beginner", completed: true, page: 5 },
  ] };
  test("summarises counts and unfinished titles without personal data", () => {
    const s = coachSummary(signals);
    expect(s.technologies).toEqual([{ id: "react", title: "React 19+", studied: 2, finished: 1 }]);
    expect(s.unfinished).toEqual([{ title: "Hooks", technologyId: "react", level: "beginner" }]);
  });
  test("drops quiz questions with duplicate options and unknown technology ids", () => {
    const coach = parseCoach(JSON.stringify({ greeting: "Nice work.", next: [{ title: "Finish Hooks", why: "Started", technologyId: "fake" }], quiz: [
      { question: "Q1", options: ["a", "b", "c", "d"], answer: 1, explanation: "e" },
      { question: "Q2", options: ["a", "A", "c", "d"], answer: 0, explanation: "e" },
    ] }))!;
    expect(coach.next[0]).toMatchObject({ technology: null, href: "/learning/notes" });
    expect(coach.quiz.map(q => q.question)).toEqual(["Q1"]);
  });
  test("rule coach finishes open lessons first and always gives steps", () => {
    expect(ruleCoach(signals).next[0].title).toContain("Hooks");
    expect(ruleCoach({ goal: null, documents: [] }).next).toHaveLength(1);
  });
});

test("admin answers must match the contract", () => {
  expect(parseAdminAnswer(JSON.stringify({ answer: "Delhi led with 60 views.", figures: [{ label: "Delhi", value: "60" }], answerable: true, followUps: [] }))).toMatchObject({ answerable: true });
  expect(parseAdminAnswer(JSON.stringify({ answer: "x" }))).toBeNull();
});
