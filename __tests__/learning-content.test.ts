/** @jest-environment node */
import path from "node:path";
import { codeExampleSchema, curriculumSchema } from "@/lib/domain";
import { DEFAULT_GUIDES } from "@/lib/generation/default-library";
import { enrichLearningNotes, snippetFiles } from "@/lib/learning-content";
import { curriculumNotes } from "@/lib/notes";

// Not every seeded guide ships runnable projects; those that do must ship complete ones.
const WITH_PROJECTS = DEFAULT_GUIDES.filter(guide => guide.curriculum.codeExamples?.length);

test.each(DEFAULT_GUIDES.map(guide => [guide.id, guide] as const))("%s is a valid curriculum", (_id, guide) => {
  expect(() => curriculumSchema.parse(guide.curriculum)).not.toThrow();
});

test("the framework and testing guides ship projects", () => {
  expect(WITH_PROJECTS.map(guide => guide.id)).toEqual(expect.arrayContaining(["nextjs-16", "react-19", "python", "jest", "vitest", "playwright"]));
});

test.each(WITH_PROJECTS.map(guide => [guide.id, guide] as const))("%s has complete concept and application projects", (_id, guide) => {
  const examples = guide.curriculum.codeExamples!;
  expect(examples.map(example => example.kind)).toEqual(["concept", "application"]);
  for (const example of examples) {
    expect(example.completeness).toBe("project");
    expect(example.files.length).toBeGreaterThanOrEqual(2);
    expect(example.setup.length).toBeGreaterThan(0);
    expect(example.expectedOutput).not.toBe("");
    expect(example.apiReference?.length).toBeGreaterThan(0);
    const paths = new Set(example.files.map(file => file.path));
    for (const file of example.files.filter(file => /\.(?:tsx?|jsx?|mjs|cjs)$/.test(file.path))) {
      const imports = [...file.code.matchAll(/(?:from\s+|import\s*|require\s*\()(['"])(\.[^'"]+)\1/g)].map(match => match[2]);
      for (const dependency of imports) {
        const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file.path), dependency));
        if (resolved.endsWith("routeTree.gen")) continue; // documented generator output
        const candidates = [resolved, ...[".ts", ".tsx", ".js", ".mjs", ".cjs"].map(extension => resolved + extension), resolved.replace(/\.js$/, ".ts")];
        expect({ importer: file.path, dependency, resolved: candidates.some(candidate => paths.has(candidate)) }).toEqual({ importer: file.path, dependency, resolved: true });
      }
    }
  }
});

test("enrichment retains unique authored cards and is idempotent", () => {
  const deck = DEFAULT_GUIDES[0].curriculum;
  const result = enrichLearningNotes(deck, "en");
  expect(enrichLearningNotes(result, "en")).toEqual(result);
  for (const point of result.lessons[0].keyPoints ?? []) expect(deck.lessons[0].keyPoints).toContainEqual(point);
});

test("copy/download exports every project file and its API contract", () => {
  const deck = WITH_PROJECTS[0].curriculum;
  const notes = curriculumNotes(deck, deck.title, "en");
  for (const example of deck.codeExamples!) {
    for (const file of example.files) { expect(notes).toContain(`project/${file.path}`); expect(notes).toContain(file.code); }
    expect(notes).toContain(example.expectedOutput);
    expect(notes).toContain(example.apiReference![0].signature);
  }
});

test("legacy file markers retain nested paths and their code", () => {
  const files = snippetFiles("// app/blog/[slug]/page.tsx\nexport default function Page() {}\n// lib/posts.ts — data\nexport const posts = [];", "nextjs", "Example");
  expect(files.map(file => file.path)).toEqual(["app/blog/[slug]/page.tsx", "lib/posts.ts"]);
  expect(files[1].code).toBe("export const posts = [];");
});

test("project paths cannot traverse out of the project or overwrite one another", () => {
  const example = WITH_PROJECTS[0].curriculum.codeExamples![0];
  expect(codeExampleSchema.safeParse({ ...example, files: [{ ...example.files[0], path: "../secret.py" }] }).success).toBe(false);
  expect(codeExampleSchema.safeParse({ ...example, files: [example.files[0], example.files[0]] }).success).toBe(false);
});
