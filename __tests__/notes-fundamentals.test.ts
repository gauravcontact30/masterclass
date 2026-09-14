/** @jest-environment node */
import { curriculumSchema, lessonSchema, objectiveQuestionSchema } from "@/lib/domain";
import { FUNDAMENTAL_STUDY_NOTES, FUNDAMENTAL_LESSONS, NEXTJS16_STUDY_NOTES } from "@/lib/notes-fundamentals-catalog";
import { NEXT_HOOK_NOTES, REACT_HOOK_NOTES } from "@/lib/notes-hooks";
import { PYTHON_FUNDAMENTALS, PYTHON_STUDY_NOTES, PYTHON_LESSONS } from "@/lib/notes-python-fundamentals";
import pythonGuide, { PYTHON_CORE_LESSON_COUNT } from "@/lib/generation/guides/python";
import { CLAUDE_FUNDAMENTALS } from "@/lib/notes-claude-fundamentals";
import { AI_FUNDAMENTALS } from "@/lib/notes-ai-fundamentals";
import { AI_CONCEPTS } from "@/lib/notes-ai-concepts";
import guide, { LLM_CORE_LESSON_COUNT } from "@/lib/generation/guides/llm-engineering";
import { DEFAULT_GUIDES, NEXTJS_16_CORE_LESSON_COUNT } from "@/lib/generation/default-library";
import { getStudyNote, NOTES_SUMMARIES } from "@/lib/server/notes-study-catalog";

test("all 118 requested lessons have unique stable IDs and complete valid study content", () => {
  expect(CLAUDE_FUNDAMENTALS).toHaveLength(20);
  expect(AI_FUNDAMENTALS).toHaveLength(78);
  expect(AI_CONCEPTS).toHaveLength(20);
  expect(new Set(FUNDAMENTAL_STUDY_NOTES.map(note => note.id)).size).toBe(118);
  for (const seed of [...CLAUDE_FUNDAMENTALS, ...AI_FUNDAMENTALS, ...AI_CONCEPTS]) {
    expect(seed.sources.length).toBeGreaterThan(0);
    expect(seed.sources.every(url => new URL(url).protocol === "https:")).toBe(true);
  }
  for (const [index, note] of FUNDAMENTAL_STUDY_NOTES.entries()) {
    expect(lessonSchema.safeParse(FUNDAMENTAL_LESSONS[index]).success).toBe(true);
    expect(objectiveQuestionSchema.safeParse(note.questions[0]).success).toBe(true);
    expect(note.questions[0].options[note.questions[0].correct]).toBe(note.questions[0].shortAnswer);
    expect(note.questions[0].options).toHaveLength(new Set(note.questions[0].options).size);
    expect(note.vocabulary.length).toBeGreaterThan(0);
    expect(note.sections[0].code).toBeTruthy();
    expect(getStudyNote(note.id)?.title).toBe(note.title);
  }
});

test("framework courses include every requested topic and retain valid library curricula", () => {
  expect(NEXTJS16_STUDY_NOTES).toHaveLength(29);
  expect(NEXT_HOOK_NOTES).toHaveLength(9);
  expect(REACT_HOOK_NOTES).toHaveLength(20);
  const reactHooks = "use useActionState useFormStatus useOptimistic useState useReducer useContext useRef useEffect useLayoutEffect useInsertionEffect useMemo useCallback useTransition useDeferredValue useId useSyncExternalStore useEffectEvent useImperativeHandle useDebugValue".split(" ");
  expect(REACT_HOOK_NOTES.map(note => note.title).sort()).toEqual(reactHooks.sort());
  for (const [id, guideId, count] of [["complete-nextjs-16-path", "nextjs-16", NEXTJS_16_CORE_LESSON_COUNT + 29], ["nextjs-16-hooks-course", "nextjs-16-hooks", 35], ["react-19-hooks-course", "react-19-hooks", 26]] as const) {
    const note = getStudyNote(id)!;
    const seeded = DEFAULT_GUIDES.find(item => item.id === guideId)!;
    expect(note.contents).toHaveLength(count);
    expect(seeded.curriculum.lessons).toHaveLength(count);
    expect(note.learnInApp).toBe(true);
    const parsed = curriculumSchema.safeParse(seeded.curriculum);
    expect(parsed.success ? [] : parsed.error.issues).toEqual([]);
    for (const chapter of note.contents!) expect(getStudyNote(chapter.id)).toBeDefined();
  }
  expect(new Set(NOTES_SUMMARIES.map(note => note.id)).size).toBe(NOTES_SUMMARIES.length);
  for (const note of [...NEXTJS16_STUDY_NOTES, ...NEXT_HOOK_NOTES, ...REACT_HOOK_NOTES]) {
    expect(objectiveQuestionSchema.safeParse(note.questions[0]).success).toBe(true);
    expect(note.questions[0].options[note.questions[0].correct]).toBe(note.questions[0].shortAnswer);
    expect(getStudyNote(note.id)).toBeDefined();
  }
});

test("the Python path preserves the original lessons and includes the expanded course in notes and library", () => {
  expect(PYTHON_FUNDAMENTALS.length).toBeGreaterThanOrEqual(40);
  expect(pythonGuide.curriculum.lessons.slice(PYTHON_CORE_LESSON_COUNT)).toEqual(PYTHON_LESSONS);
  const course = getStudyNote("python-314-path")!;
  expect(course.title).toBe("Python: from first steps to Python 3.14");
  expect(course.contents).toHaveLength(PYTHON_CORE_LESSON_COUNT + PYTHON_FUNDAMENTALS.length);
  const seeded = DEFAULT_GUIDES.find(item => item.id === "python")!;
  const parsed = curriculumSchema.safeParse(seeded.curriculum);
  expect(parsed.success ? [] : parsed.error.issues).toEqual([]);
  expect(seeded.version).toBeGreaterThan(2);
  for (const note of PYTHON_STUDY_NOTES) {
    expect(course.contents!.some(item => item.id === note.id)).toBe(true);
    expect(getStudyNote(note.id)).toBeDefined();
    expect(objectiveQuestionSchema.safeParse(note.questions[0]).success).toBe(true);
    expect(note.questions[0].options[note.questions[0].correct]).toBe(note.questions[0].shortAnswer);
  }
  expect(PYTHON_STUDY_NOTES.filter(note => note.category === "Python 3.14")).toHaveLength(6);
});

test("the existing guide retains its core order, appends all lessons and validates after enrichment", () => {
  expect(guide.version).toBe(2);
  expect(guide.curriculum.lessons[0].title).toBe("How LLMs work: tokens, context and generation");
  expect(guide.curriculum.lessons.slice(LLM_CORE_LESSON_COUNT)).toEqual(FUNDAMENTAL_LESSONS);
  const seeded = DEFAULT_GUIDES.find(item => item.id === "llm-context-loop-memory")!;
  const result = curriculumSchema.safeParse(seeded.curriculum);
  expect(result.success ? [] : result.error.issues).toEqual([]);
  expect(seeded.version).toBeGreaterThan(2);
});

test("the combined card indexes every new lesson and the original engineering chapters without duplicate cards", () => {
  const combined = getStudyNote("claude-ai-concepts")!;
  expect(combined.title).toBe("Claude & AI Concepts");
  expect(combined.readerTitle).toBe("LLMs, MCP, Context, Loop Engineering and Memory");
  expect(combined.contents).toHaveLength(118 + LLM_CORE_LESSON_COUNT);
  expect(new Set(combined.contents!.map(item => item.id)).size).toBe(combined.contents!.length);
  for (const item of combined.contents!) expect(getStudyNote(item.id)).toBeDefined();
  expect(NOTES_SUMMARIES.filter(note => note.title === "Artifacts")).toHaveLength(1);
  expect(NOTES_SUMMARIES.find(note => note.id === combined.id)?.searchText).toContain("distillation");
});
