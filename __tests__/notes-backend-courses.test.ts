/** @jest-environment node */
import { curriculumSchema } from "@/lib/domain";
import { DEFAULT_GUIDES } from "@/lib/generation/default-library";
import { getStudyNote, NOTES_SUMMARIES, NOTES_TECHNOLOGIES } from "@/lib/server/notes-study-catalog";
import { BUILTIN_NOTES_TOPICS } from "@/lib/notes-catalog";
import { seedRows } from "@/lib/server/default-library";
import { NODE_LESSON_SEEDS } from "@/lib/generation/guides/node";
import { GRAPHQL_LESSON_SEEDS } from "@/lib/generation/guides/graphql";
import { NESTJS_LESSON_SEEDS } from "@/lib/generation/guides/nestjs";

test.each([
  ["node", "Node.js"], ["graphql", "GraphQL"], ["nestjs", "Nest JS"],
])("%s is available as a complete library file and notes modal course", (id, title) => {
  const guide = DEFAULT_GUIDES.find(item => item.id === id)!;
  expect(guide).toBeDefined();
  const parsed = curriculumSchema.safeParse(guide.curriculum);
  expect(parsed.success ? [] : parsed.error.issues).toEqual([]);
  expect(guide.curriculum.title).toBe(title);
  const expectedCounts: Record<string, number> = { node: NODE_LESSON_SEEDS.length, graphql: GRAPHQL_LESSON_SEEDS.length, nestjs: NESTJS_LESSON_SEEDS.length };
  expect(guide.curriculum.lessons).toHaveLength(expectedCounts[id]);
  const course = getStudyNote(`${id}-course`)!;
  expect(course.title).toBe(title);
  expect(course.learnInApp).toBe(true);
  expect(course.contents).toHaveLength(guide.curriculum.lessons.length);
  expect(NOTES_TECHNOLOGIES.filter(item => item.id === id)).toHaveLength(1);
  expect(NOTES_SUMMARIES.find(item => item.id === course.id)?.learnInApp).toBe(true);
  for (const [index, chapter] of course.contents!.entries()) {
    const note = getStudyNote(chapter.id)!;
    expect(note.technology).toBe(id);
    expect(note.title).toBe(guide.curriculum.lessons[index].title);
    expect(note.sections.some(section => section.code)).toBe(true);
    expect(note.interview.length).toBeGreaterThan(0);
    const question = note.questions[0];
    expect(new Set(question.options).size).toBe(4);
    expect(question.options[question.correct]).toBe(question.shortAnswer);
  }
  const row = seedRows("test-user", [guide])[0];
  expect(row.title).toBe(title);
  expect(row.status).toBe("ready");
  expect(row.page_titles).toEqual(course.contents!.map(chapter => chapter.title));
});

test("NestJS has a built-in topic and backend course IDs are unique", () => {
  expect(BUILTIN_NOTES_TOPICS.find(topic => topic.id === "nestjs-full")?.technology_id).toBe("nestjs");
  expect(new Set(NOTES_SUMMARIES.map(note => note.id)).size).toBe(NOTES_SUMMARIES.length);
});
