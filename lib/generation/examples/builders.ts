import type { ApiReference, CodeExample, ExampleFile } from "@/lib/domain";
import { fileLanguage } from "@/lib/learning-content";

/**
 * Shared constructors for the hand-authored, complete code examples.
 *
 * Every example is a small project rather than a snippet: each file carries
 * its project-relative path, the reader sees that path above the code, and the
 * first line of every file repeats it as a comment so a copied file can still
 * be placed correctly. `topic-projects.ts` and the per-lesson example modules
 * in this directory all build their projects through these helpers.
 */

/** One project file. `path` is project-relative and doubles as the code fence's heading. */
export const file = (path: string, code: string, description: string): ExampleFile =>
  ({ path, code: code.trim(), description, language: fileLanguage(path) });

/** A JSON file written from a value, so the shape is checked by TypeScript rather than by eye. */
export const json = (path: string, value: object, description: string) =>
  file(path, JSON.stringify(value, null, 2), description);

export const api = (name: string, signature: string, returns: string, params: ApiReference["params"] = [], kind = "function"): ApiReference =>
  ({ name, signature, returns, params, kind });

export const param = (name: string, type: string, description: string) => ({ name, type, description });

export const project = (kind: CodeExample["kind"], title: string, description: string, files: ExampleFile[], setup: string[], expectedOutput: string, apiReference: ApiReference[] = []): CodeExample =>
  ({ kind, title, description, files, setup, expectedOutput, apiReference, completeness: "project" });

export const nodePackage = (scripts: Record<string, string> = { start: "node src/main.mjs", test: "node --test" }, devDependencies: Record<string, string> = {}, dependencies: Record<string, string> = {}) =>
  json("package.json", { private: true, type: "module", scripts, engines: { node: ">=22.12" }, dependencies, devDependencies }, "Scripts, runtime requirements and every external dependency.");

export const readme = (title: string, text: string) =>
  file("README.md", `# ${title}\n\n${text}\n\nCopy the files into a new project directory, preserving their paths. Run commands from that directory.`, "Project purpose and execution context.");

/**
 * The pair every service lesson ships: a small `concept` project that isolates
 * one mechanism, and a larger `application` project that puts it to work.
 * `lessonSchema.codeExamples` requires exactly these two kinds.
 */
export const pair = (simple: CodeExample, hard: CodeExample): [CodeExample, CodeExample] => [simple, hard];
