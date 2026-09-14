/** @jest-environment node */
import { DEFAULT_GUIDES } from "@/lib/generation/default-library";
import { GRAPHQL_CORE_LESSON_COUNT, GRAPHQL_LESSON_SEEDS } from "@/lib/generation/guides/graphql";
import { getStudyNote, NOTES_SUMMARIES } from "@/lib/server/notes-study-catalog";
import { dueGuides } from "@/lib/server/default-library";

const guide = DEFAULT_GUIDES.find(item => item.id === "graphql")!;
const course = getStudyNote("graphql-course")!;
const text = guide.curriculum.lessons.map(lesson => [lesson.title, lesson.explanation, lesson.code].join(" ")).join(" ").toLowerCase();

test.each([
  "schema definition language", "sdl", "scalar", "object", "enum", "interface", "union", "input", "queries", "mutations", "subscriptions",
  "fields and arguments", "resolvers", "nodes", "edges", "single endpoint", "over-fetching", "under-fetching", "operation names", "variables", "aliases",
  "named and inline fragments", "@include", "@skip", "@deprecated", "parsing", "validation", "execution", "root operation types",
  "int", "float", "string", "boolean", "id", "custom scalars", "non-null", "list", "abstract types", "introspection", "__schema", "__type",
  "n+1", "dataloader", "schema stitching", "apollo federation", "subgraphs", "supergraph", "node interface", "offset", "cursor", "relay",
  "error handling", "partial results", "client", "gateway", "network", "batching", "@defer", "@stream", "depth limiting", "complexity analysis",
  "rate limiting", "token bucket", "persisted queries", "allowlisting", "authentication", "authorization",
])("GraphQL curriculum teaches %s", topic => expect(text).toContain(topic));

test("one GraphQL course contains every categorized lesson and refreshes existing files", () => {
  expect(course.title).toBe("GraphQL");
  expect(course.learnInApp).toBe(true);
  expect(NOTES_SUMMARIES.filter(note => note.technology === "graphql" && note.learnInApp)).toHaveLength(1);
  expect(course.contents).toHaveLength(GRAPHQL_LESSON_SEEDS.length);
  expect([...new Set(course.contents!.map(chapter => chapter.category))]).toEqual([
    "Getting started", "Core Concepts", "Operations & Execution", "Schema & Type System", "Advanced Architecture & Patterns", "Security & Optimization",
  ]);
  for (const [index, chapter] of course.contents!.entries()) {
    expect(chapter.id).toBe(`graphql-lesson-${index}`);
    expect(getStudyNote(chapter.id)?.title).toBe(GRAPHQL_LESSON_SEEDS[index].title);
  }
  expect(GRAPHQL_CORE_LESSON_COUNT).toBe(12);
  expect(new Set(GRAPHQL_LESSON_SEEDS.map(seed => seed.id)).size).toBe(GRAPHQL_LESSON_SEEDS.length);
  expect(guide.version).toBeGreaterThan(2);
  expect(dueGuides(new Map([["graphql", 2]])).some(item => item.id === "graphql")).toBe(true);
});

test("advanced subjects are searchable and compatibility distinctions are explicit", () => {
  const summary = NOTES_SUMMARIES.find(note => note.id === "graphql-course")!;
  for (const term of ["sdl", "__schema", "stitching", "federation", "@defer", "@stream", "token", "allowlisting"]) expect(summary.searchText).toContain(term);
  const incremental = GRAPHQL_LESSON_SEEDS.find(seed => seed.id === "incremental")!;
  expect(incremental.facts).toContain("experimental");
  expect(incremental.workflow).toContain("not portable to every server");
  const persisted = GRAPHQL_LESSON_SEEDS.find(seed => seed.id === "persisted-operations")!;
  expect(persisted.facts).toContain("not a strict query allowlist");
});
