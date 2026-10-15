import { TECHNOLOGY_HANDBOOKS } from "@/lib/pro-learn/technology-handbooks";
import { API_PACKAGES } from "@/lib/api-docs";
import { API_DETAILS } from "@/lib/api-docs-details";
import { TAB_API_PACKAGES, withApiReference } from "@/lib/server/handbook-api-reference";
import { prepareHandbooks } from "@/lib/server/prepared-catalog";

const byTitle = new Map(TECHNOLOGY_HANDBOOKS.map(handbook => [handbook.title, handbook]));

test("every mapped tab and package exists", () => {
  for (const [title, packages] of Object.entries(TAB_API_PACKAGES)) {
    expect(byTitle.has(title)).toBe(true);
    for (const id of packages) expect(API_PACKAGES.some(pkg => pkg.id === id)).toBe(true);
  }
});

test("a tab gains its package's curated API reference, after its own rows and without repeating a name", () => {
  const [langchain] = withApiReference([byTitle.get("LangChain")!]);
  const own = byTitle.get("LangChain")!.topics.length;
  const added = langchain.topics.slice(own);
  expect(added.length).toBeGreaterThan(0);
  expect(added.every(topic => topic.category.startsWith("API docs: "))).toBe(true);
  expect(added.every(topic => API_DETAILS[`langchain:${topic.name}`])).toBe(true);
  const names = langchain.topics.map(topic => topic.name.toLowerCase());
  expect(new Set(names).size).toBe(names.length);
  // The categories, and so the tab's count pill, include the new rows.
  expect(langchain.categories.reduce((sum, category) => sum + category.count, 0)).toBe(langchain.topics.length);
});

test("an added row opens the reference the API Docs page shows", () => {
  const [langgraph] = prepareHandbooks(withApiReference([byTitle.get("LangGraph")!]));
  const row = langgraph.topics.find(topic => topic.category.startsWith("API docs: "))!;
  const detail = API_DETAILS[`langgraph:${row.name}`];
  expect(row.prepared!.answer.definition).toBe(detail.description);
  expect(row.prepared!.answer.keyPoints).toEqual(detail.notes);
  expect(row.prepared!.sources![0].url).toBe(detail.source);
});

test("a tab with no authored reference is left as it was", () => {
  const vitest = byTitle.get("Vitest — Fast Unit Testing & Mocks")!;
  const [same] = withApiReference([vitest]);
  expect(same.topics.filter(topic => topic.category.startsWith("API docs: ")).every(topic => topic.prepared)).toBe(true);
});
