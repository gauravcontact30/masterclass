/** @jest-environment node */
import { curriculumSchema, objectiveQuestionSchema } from "@/lib/domain";
import { DEFAULT_GUIDES } from "@/lib/generation/default-library";
import { NOTES_SUMMARIES, NOTES_TECHNOLOGIES, getStudyNote } from "@/lib/server/notes-study-catalog";
import { ZUSTAND_FUNDAMENTALS, ZUSTAND_STUDY_NOTES } from "@/lib/notes-zustand-fundamentals";
import { TANSTACK_FUNDAMENTALS, TANSTACK_STUDY_NOTES } from "@/lib/notes-tanstack-fundamentals";
import { ZUSTAND_CORE_LESSON_COUNT } from "@/lib/generation/guides/zustand";
import { TANSTACK_CORE_LESSON_COUNT } from "@/lib/generation/guides/tanstack-start";

test.each([
  ["zustand-5-course", "Zustand 5", "zustand", ZUSTAND_STUDY_NOTES, ZUSTAND_CORE_LESSON_COUNT, 25],
  ["tanstack-course", "TanStack", "tanstack-start", TANSTACK_STUDY_NOTES, TANSTACK_CORE_LESSON_COUNT, 75],
] as const)("%s includes its complete valid curriculum and preserves core lesson positions", (id, title, guideId, notes, coreCount, count) => {
  const course = getStudyNote(id)!;
  const guide = DEFAULT_GUIDES.find(item => item.id === guideId)!;
  expect(notes).toHaveLength(count);
  expect(course.title).toBe(title);
  expect(course.learnInApp).toBe(true);
  expect(course.contents).toHaveLength(coreCount + count);
  expect(guide.curriculum.title).toBe(title);
  expect(guide.curriculum.lessons.slice(coreCount).map(item => item.title)).toEqual(notes.map(item => item.title));
  expect(guide.version).toBeGreaterThan(3);
  const parsed = curriculumSchema.safeParse(guide.curriculum);
  expect(parsed.success ? [] : parsed.error.issues).toEqual([]);
  for (let index = 0; index < coreCount; index++) {
    const chapterId = `${guideId}-lesson-${index}`;
    expect(course.contents!.some(chapter => chapter.id === chapterId)).toBe(true);
    expect(getStudyNote(chapterId)?.title).toBe(guide.curriculum.lessons[index].title);
  }
  for (const note of notes) {
    expect(course.contents!.some(item => item.id === note.id)).toBe(true);
    expect(getStudyNote(note.id)).toEqual(note);
    expect(note.sections[0].code).toBeTruthy();
    expect(note.points).toHaveLength(3);
    expect(note.examples[0].points[0]).toBeTruthy();
    expect(note.vocabulary.length).toBeGreaterThan(0);
    const question = note.questions[0];
    expect(objectiveQuestionSchema.safeParse(question).success).toBe(true);
    expect(new Set(question.options).size).toBe(4);
    expect(question.options[question.correct]).toBe(question.shortAnswer);
  }
});

test("course search indexes the requested subjects and preserves internal source metadata", () => {
  expect(new Set(NOTES_SUMMARIES.map(note => note.id)).size).toBe(NOTES_SUMMARIES.length);
  const zustand = NOTES_SUMMARIES.find(note => note.id === "zustand-5-course")!;
  const tanstack = NOTES_SUMMARIES.find(note => note.id === "tanstack-course")!;
  for (const term of ["persist", "devtools", "subscribewithselector", "immer", "slices", "typescript", "hydration", "jest"]) expect(zustand.searchText).toContain(term);
  for (const term of ["query", "table", "router", "start", "form", "virtual", "ranger", "store", "logarithmic", "valibot", "angular", "garbage"]) expect(tanstack.searchText).toContain(term);
  for (const seed of [...ZUSTAND_FUNDAMENTALS, ...TANSTACK_FUNDAMENTALS]) {
    expect(seed.sources.length).toBeGreaterThan(0);
    expect(seed.sources.every(url => new URL(url).protocol === "https:")).toBe(true);
  }
  expect(NOTES_TECHNOLOGIES.find(item => item.id === "tanstack-start")?.title).toBe("TanStack");
});
