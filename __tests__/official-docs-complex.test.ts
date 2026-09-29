/** @jest-environment node */
import ts from "typescript";
import path from "node:path";
import { COMPLEX_DOCS_PROJECTS } from "@/lib/official-docs-complex";

test("all ten complex projects contain implementation, configuration, tests, and runbooks", () => {
  expect(Object.keys(COMPLEX_DOCS_PROJECTS).sort()).toEqual(["nodejs", "nestjs", "aws", "cicd", "typescript", "javascript-puzzles", "langchain", "langgraph", "langsmith", "agentic-ai"].sort());
  for (const [id, project] of Object.entries(COMPLEX_DOCS_PROJECTS)) {
    const paths = project.files.map(file => file.path);
    expect({ id, unique: new Set(paths).size }).toEqual({ id, unique: paths.length });
    expect(paths).toContain("README.md");
    expect(paths.some(path => /test/.test(path))).toBe(true);
    expect(project.commands.length).toBeGreaterThan(1);
    expect(project.verify.length).toBeGreaterThan(1);
    for (const file of project.files) {
      expect(file.code.trim()).not.toBe("");
      if (file.path.endsWith(".json")) expect(() => JSON.parse(file.code)).not.toThrow();
      if (!/\.(js|ts)$/.test(file.path)) continue;
      const output = ts.transpileModule(file.code, { fileName: file.path, reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.NodeNext, experimentalDecorators: true, emitDecoratorMetadata: true } });
      expect({ id, file: file.path, errors: output.diagnostics?.filter(item => item.category === ts.DiagnosticCategory.Error) }).toEqual({ id, file: file.path, errors: [] });
      for (const match of file.code.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
        const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file.path), match[1]));
        expect(paths.includes(resolved) || paths.includes(resolved.replace(/\.js$/, ".ts"))).toBe(true);
      }
    }
  }
});
