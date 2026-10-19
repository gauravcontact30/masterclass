import { fireEvent, render, screen } from "@testing-library/react";
import { TECHNOLOGY_HANDBOOKS } from "@/lib/pro-learn/technology-handbooks";
import { LEARNING_MODULES, LEARNING_MODULE_CATEGORY } from "@/lib/pro-learn/learning-modules";
import { dedupeAnswer } from "@/lib/pro-learn/dedupe-answer";
import { prepareSearchTopics } from "@/lib/server/prepared-catalog";

// Generated official-card enrichment is covered by the official-content suites.
jest.mock("@/lib/server/official-content", () => ({ officialSearchCard: jest.fn() }));
import { SearchSectionIcon } from "@/components/search-section-icon";
import { LANGFLOW_ENTRIES } from "@/lib/api-docs-langflow";
import { ObjectiveQuestions } from "@/components/api-interview-practice";

/**
 * The nine technologies the Search page was asked to open on a full learning
 * module: definition, technical summary, code, the problem it solves, three use
 * cases, three rated interview questions and three multiple-choice questions.
 */
const titles = Object.keys(LEARNING_MODULES);
const byTitle = new Map(TECHNOLOGY_HANDBOOKS.map(handbook => [handbook.title, handbook]));

test("all nine requested technologies have a module", () => {
  expect(titles).toHaveLength(9);
  for (const name of ["LangChain", "LangGraph", "LangSmith", "LangFlow", "Next.js 16", "Redis", "Upstash", "Playwright", "Vitest"])
    expect(Object.values(LEARNING_MODULES).map(module => module.technology)).toContain(name);
});

test.each(titles)("the %s tab opens on its learning module", title => {
  const handbook = byTitle.get(title);
  expect(handbook).toBeDefined();
  expect(handbook!.topics[0].category).toBe(LEARNING_MODULE_CATEGORY);
  expect(handbook!.categories[0]).toEqual({ name: LEARNING_MODULE_CATEGORY, count: 1 });
  expect(handbook!.topics.filter(topic => topic.category === LEARNING_MODULE_CATEGORY)).toHaveLength(1);
});

test.each(titles)("the %s module keeps every section after the server prepares it", title => {
  const handbook = byTitle.get(title)!;
  const [row] = prepareSearchTopics(handbook.topics.slice(0, 1), title, handbook.sources);
  const prepared = row.prepared!;
  // The modal prints the answer after removing repeated ideas, so check what survives that.
  const answer = dedupeAnswer(prepared.answer);
  expect(answer.definition.length).toBeGreaterThan(40);
  expect(answer.summary.length).toBeGreaterThan(80);
  expect(answer.steps.length).toBeGreaterThanOrEqual(3);
  expect(answer.files.length).toBeGreaterThanOrEqual(1);
  expect(answer.files.every(file => file.code.trim().length > 50)).toBe(true);
  // The core problem plus three real-life use cases.
  expect(answer.useCases).toHaveLength(4);
  expect(answer.subjects).toHaveLength(3);
  for (const subject of answer.subjects) expect(subject.details[0]).toMatch(/^Interview ask rating: /);
  expect(prepared.objective).toHaveLength(3);
  for (const question of prepared.objective!) {
    expect(question.options).toHaveLength(4);
    expect(new Set(question.options).size).toBe(4);
    expect(question.answer).toBeGreaterThanOrEqual(0);
    expect(question.answer).toBeLessThanOrEqual(3);
    expect(question.explanation.length).toBeGreaterThan(40);
  }
  for (const source of prepared.sources ?? []) expect(() => new URL(source.url)).not.toThrow();
});

test("LangFlow is a full handbook with its own tab mark", () => {
  const handbook = byTitle.get("LangFlow")!;
  expect(handbook.topics.length).toBeGreaterThanOrEqual(100);
  expect(handbook.categories.length).toBeGreaterThanOrEqual(12);
  const { container } = render(<SearchSectionIcon title="LangFlow" />);
  expect(container.querySelector("svg")).not.toHaveClass("lucide-layers");
});

test("choosing an option reveals whether it was right and why", () => {
  const [question] = LEARNING_MODULES.LangGraph.objective;
  render(<ObjectiveQuestions questions={[question]} heading={false} />);
  fireEvent.click(screen.getByRole("radio", { name: question.options[question.answer] }));
  expect(screen.getByRole("status")).toHaveTextContent("Correct.");
  expect(screen.getByRole("status")).toHaveTextContent(question.explanation);
});

test("every LangFlow lesson teaches with points, a use case and an interview question", () => {
  const lessons = byTitle.get("LangFlow")!.topics.filter(topic => topic.category !== LEARNING_MODULE_CATEGORY && !topic.category.startsWith("API docs"));
  expect(lessons.length).toBeGreaterThanOrEqual(30);
  for (const lesson of lessons) {
    expect(lesson.points).toHaveLength(3);
    expect(lesson.useCase?.scenario.length).toBeGreaterThan(40);
    expect(lesson.interview?.[0].answer.length).toBeGreaterThan(80);
  }
});

test("the LangFlow API reference is in the tab, with every entry from the API Docs page", () => {
  const handbook = byTitle.get("LangFlow")!;
  const reference = handbook.topics.filter(topic => topic.category.startsWith("API docs"));
  expect(reference.length).toBe(LANGFLOW_ENTRIES.length);
  expect(new Set(reference.map(topic => topic.category))).toEqual(new Set(["API docs: Concepts", "API docs: CLI & LFX", "API docs: REST API", "API docs: Components", "API docs: Python & TypeScript", "API docs: Configuration"]));
  const run = prepareSearchTopics(reference, "LangFlow", handbook.sources).find(topic => topic.name === "POST /api/v1/run/{flow_id}")!;
  expect(run.prepared!.answer.steps.map(step => step.title)).toEqual(["Signature", "Parameters"]);
  expect(run.prepared!.answer.files[0].code).toContain("/api/v1/run/");
  expect(run.prepared!.sources![0].url).toMatch(/^https:\/\/docs\.langflow\.org\//);
});

test("no two LangFlow rows share a name", () => {
  const names = byTitle.get("LangFlow")!.topics.map(topic => topic.name);
  expect(new Set(names).size).toBe(names.length);
});
