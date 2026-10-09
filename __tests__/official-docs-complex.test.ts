/** @jest-environment node */
import ts from "typescript";
import path from "node:path";
import { COMPLEX_DOCS_PROJECTS } from "@/lib/official-docs-complex";
import { OFFICIAL_DOCS } from "@/lib/official-docs-data";

test("every topic has a complete Complex codebase and executable verification", () => {
  expect(Object.keys(COMPLEX_DOCS_PROJECTS).sort()).toEqual(OFFICIAL_DOCS.map(doc => doc.id).sort());
  for (const [id, project] of Object.entries(COMPLEX_DOCS_PROJECTS)) {
    const paths = project.files.map(file => file.path);
    expect({ id, unique: new Set(paths).size }).toEqual({ id, unique: paths.length });
    expect(paths).toContain("README.md");
    expect(paths.some(path => /test|acceptance/.test(path))).toBe(true);
    expect(project.commands.length).toBeGreaterThan(1);
    expect(project.verify.length).toBeGreaterThan(1);
    for (const file of project.files) {
      expect(file.code.trim()).not.toBe("");
      if (file.path.endsWith(".json")) expect(() => JSON.parse(file.code)).not.toThrow();
      if (!/\.(mjs|cjs|jsx?|tsx?)$/.test(file.path)) continue;
      const output = ts.transpileModule(file.code, { fileName: file.path.endsWith('.js') && file.code.includes('<') ? file.path + 'x' : file.path, reportDiagnostics: true, compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.NodeNext, experimentalDecorators: true, emitDecoratorMetadata: true } });
      expect({ id, file: file.path, errors: output.diagnostics?.filter(item => item.category === ts.DiagnosticCategory.Error) }).toEqual({ id, file: file.path, errors: [] });
      for (const match of file.code.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
        const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file.path), match[1]));
        expect({ id, import: resolved, found: [resolved, resolved.replace(/\.js$/, ".ts"), ...[".ts", ".tsx", ".js", ".jsx"].map(extension => resolved + extension)].some(candidate => paths.includes(candidate)) }).toEqual({ id, import: resolved, found: true });
      }
    }
  }
});
