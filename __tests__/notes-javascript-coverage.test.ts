/** @jest-environment node */
import { lessonSchema } from "@/lib/domain";
import { DEFAULT_GUIDES } from "@/lib/generation/default-library";
import { JAVASCRIPT_FUNDAMENTAL_LESSONS, JAVASCRIPT_TOPICS } from "@/lib/generation/guides/javascript-fundamentals";
import { snippetFiles } from "@/lib/learning-content";
import { getStudyNote, NOTES_SUMMARIES } from "@/lib/server/notes-study-catalog";
import { dueGuides } from "@/lib/server/default-library";

const guide = DEFAULT_GUIDES.find(item => item.id === "es2026")!;
const course = getStudyNote("javascript-es2026-course")!;

test("JavaScript ES2026 card exposes every saved-guide lesson with grouped contents", () => {
  expect(guide.curriculum.title).toBe("JavaScript ES2026");
  expect(course.title).toBe("JavaScript ES2026");
  expect(course.readerTitle).toBe("JavaScript ES2026");
  expect(NOTES_SUMMARIES.filter(note => note.title === course.title && note.learnInApp)).toHaveLength(1);
  expect(course.contents).toHaveLength(guide.curriculum.lessons.length);
  for (const [index, chapter] of course.contents!.entries()) {
    expect(chapter.id).toBe(`es2026-lesson-${index}`);
    expect(getStudyNote(chapter.id)?.title).toBe(guide.curriculum.lessons[index].title);
  }
  expect(new Set(course.contents!.map(chapter => chapter.category))).toEqual(new Set([
    "ES2026 & Upcoming Features", "Modern ECMAScript Features", "Core & Advanced Concepts",
    "Asynchronous JavaScript", "Object-Oriented & Functional Programming", "DOM & Browser APIs", "Modules & Ecosystem",
  ]));
});

test.each([
  "union", "intersection", "difference", "symmetricDifference", "Object.groupBy", "Map.groupBy",
  "toReversed", "toSorted", "toSpliced", ".with(", "symbols", "top-level await", "||=", "&&=", "??=",
  "1_000_000", "Promise.any", "Promise.allSettled", "??", "?.", "BigInt", "import(", "replaceAll",
  "closures", "lexical scope", "event loop", "macrotasks", "microtasks", "prototype chain", "execution context",
  "call stack", "hoisting", "implicit", "explicit", "default", "arrow", "use strict", "garbage collection",
  "WeakMap", "WeakSet", "chaining", "error handling", "async / await", "generators", "iterators", "event emitters",
  "AbortController", "private fields", "static blocks", "getters", "setters", "inheritance", "mixins",
  "pure functions", "immutability", "map", "filter", "reduce", "currying", "composition", "structuredClone",
  "Shadow DOM", "Web Components", "bubbling", "capturing", "delegation", "IntersectionObserver", "MutationObserver",
  "localStorage", "sessionStorage", "IndexedDB", "cookies", "Web Workers", "Service Workers", "fetch", "streams",
  "ES Modules", "CommonJS", "require", "module.exports", "tree shaking", "JSON modules", "import attributes",
])("the requested topic %s has authored coverage", term => {
  const text = JAVASCRIPT_TOPICS.map(topic => [topic.title, ...topic.points, topic.code].join(" ")).join(" ").toLowerCase();
  expect(text).toContain(term.toLowerCase());
});

test("new lessons fit the reader schema and retain JavaScript and JSON file boundaries", () => {
  for (const lesson of JAVASCRIPT_FUNDAMENTAL_LESSONS) {
    expect(lessonSchema.safeParse(lesson).success).toBe(true);
    const files = snippetFiles(lesson.code, "javascript", lesson.title);
    expect(files.length).toBeGreaterThan(0);
    expect(files.every(file => ["javascript", "json"].includes(file.language))).toBe(true);
  }
  const modules = JAVASCRIPT_FUNDAMENTAL_LESSONS.find(lesson => lesson.title.startsWith("ES Modules"))!;
  expect(snippetFiles(modules.code, "javascript", modules.title).map(file => file.path)).toEqual([
    "math.mjs", "main.mjs", "math.cjs", "main.cjs",
  ]);
});

test("existing files refresh and the course card indexes advanced subjects", () => {
  expect(dueGuides(new Map([["es2026", 2]])).some(item => item.id === "es2026")).toBe(true);
  const summary = NOTES_SUMMARIES.find(note => note.id === course.id)!;
  for (const term of ["closures", "abortcontroller", "indexeddb", "import attributes", "symmetricdifference"]) {
    expect(summary.searchText).toContain(term);
  }
});
