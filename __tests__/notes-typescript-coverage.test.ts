/** @jest-environment node */
import { DEFAULT_GUIDES } from "@/lib/generation/default-library";
import { TYPESCRIPT_TOPICS } from "@/lib/generation/guides/typescript-fundamentals";
import { getStudyNote, NOTES_SUMMARIES } from "@/lib/server/notes-study-catalog";
import { dueGuides } from "@/lib/server/default-library";

const guide = DEFAULT_GUIDES.find(item => item.id === "typescript-7")!;
const course = getStudyNote("typescript-7-course")!;

test("TypeScript 7 has one dedicated course with every saved-guide lesson reachable", () => {
  expect(guide.curriculum.title).toBe("TypeScript 7");
  expect(course.title).toBe("TypeScript 7");
  expect(course.readerTitle).toBe("TypeScript 7");
  expect(NOTES_SUMMARIES.filter(note => note.title === "TypeScript 7" && note.learnInApp)).toHaveLength(1);
  expect(course.contents).toHaveLength(guide.curriculum.lessons.length);
  for (const [index, chapter] of course.contents!.entries()) {
    expect(chapter.id).toBe(`typescript-7-lesson-${index}`);
    expect(getStudyNote(chapter.id)?.title).toBe(guide.curriculum.lessons[index].title);
  }
  expect(new Set(course.contents!.map(chapter => chapter.category))).toEqual(new Set([
    "TypeScript 7 & Tooling", "Core Types & System", "Type Composition & Modification",
    "Type Narrowing & Guards", "Functions & Classes", "Generics", "Advanced Type Manipulation",
    "Utility Types", "Modules, Decorators & Compiler Safety",
  ]));
});

test.each([
  "annotations", "inference", "symbol", "bigint", "unknown", "never", "void", "arrays",
  "named tuples", "variadic tuple", "numeric", "const enum", "literal types", "intersection",
  "declaration merging", "non-null assertion", "satisfies", "type guards", "instanceof",
  "optional", "default", "rest parameters", "overloads", "parameter properties", "protected",
  "override", "abstract", "this parameter", "generic functions", "generic constraints",
  "default generic parameters", "keyof", "indexed access", "typeof", "conditional types",
  "infer", "mapped types", "key remapping", "template literal", "Partial<T>", "Required<T>",
  "Readonly<T>", "Record<K, T>", "Pick<T, K>", "Omit<T, K>", "Exclude<T, U>", "Extract<T, U>",
  "NonNullable<T>", "Parameters<T>", "ConstructorParameters<T>", "ReturnType<T>", "InstanceType<T>",
  "Awaited<T>", "decorators", "modules", "strictNullChecks", "noImplicitAny",
])("the requested topic %s is taught in the expanded guide", term => {
  const content = TYPESCRIPT_TOPICS.map(topic => [topic.title, ...topic.points, topic.code].join(" ")).join(" ").toLowerCase();
  expect(content).toContain(term.toLowerCase());
});

test("previously seeded TypeScript files refresh and advanced topics are searchable", () => {
  expect(dueGuides(new Map([["typescript-7", 2]])).some(item => item.id === "typescript-7")).toBe(true);
  const summary = NOTES_SUMMARIES.find(note => note.id === course.id)!;
  for (const term of ["satisfies", "variadic", "constructorparameters<t>", "decorators"]) {
    expect(summary.searchText).toContain(term);
  }
});
