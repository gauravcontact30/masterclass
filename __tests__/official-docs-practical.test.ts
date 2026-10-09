/** @jest-environment node */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import ts from "typescript";
import { PRACTICAL_SIMPLE, PRACTICAL_MEDIUM } from "@/lib/official-docs-practical";
import { COMPLEX_DOCS_PROJECTS } from "@/lib/official-docs-complex";
import type { AnswerFile } from "@/lib/pro-learn/types";

function runFiles(files: AnswerFile[], entry: string) {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), "docs-practical-"));
  try {
    for (const file of files) {
      const target = path.join(folder, file.path);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, file.code);
    }
    const result = spawnSync(process.execPath, [entry], { cwd: folder, encoding: "utf8", timeout: 10000 });
    expect({ error: result.error?.message, stderr: result.stderr, status: result.status }).toEqual({ error: undefined, stderr: "", status: 0 });
    return result.stdout;
  } finally {
    fs.rmSync(folder, { recursive: true, force: true });
  }
}

test.each(["javascript-info", "javascript-features", "javascript-puzzles", "nodejs", "system-design"])("%s Simple solution passes its actual boundary assertions", id => {
  expect(runFiles(PRACTICAL_SIMPLE[id].files, "solution.mjs").trim()).not.toBe("");
});

test.each(["react", "react-hooks", "nextjs", "nextjs-hooks"])("%s Complex inventory enforces stock and restore boundaries", id => {
  const project = COMPLEX_DOCS_PROJECTS[id];
  const entry = project.files.find(file => file.path.endsWith("inventory.test.mjs"))!;
  expect(runFiles(project.files, entry.path)).toContain("Inventory boundary and immutability checks passed.");
});

test.each(["javascript-info", "javascript-features"])("%s Complex acceptance runner executes the supplied program twice", id => {
  expect(runFiles(COMPLEX_DOCS_PROJECTS[id].files, "acceptance/verify.mjs")).toContain("Acceptance run 2 passed");
});

test("new Simple and Medium codebases have parsable source and complete relative imports", () => {
  for (const [id, project] of Object.entries({ ...PRACTICAL_SIMPLE, ...Object.fromEntries(Object.entries(PRACTICAL_MEDIUM).map(([id, value]) => [id + "-medium", value])) })) {
    expect(project.commands.length).toBeGreaterThan(0);
    for (const file of project.files) {
      if (!/\.(mjs|jsx?|tsx?)$/.test(file.path)) continue;
      const output = ts.transpileModule(file.code, { fileName: file.path.endsWith('.js') && file.code.includes('<') ? file.path + 'x' : file.path, reportDiagnostics: true, compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
      expect({ id, path: file.path, diagnostics: output.diagnostics?.filter(item => item.category === ts.DiagnosticCategory.Error) }).toEqual({ id, path: file.path, diagnostics: [] });
      for (const match of file.code.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
        const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file.path), match[1]));
        expect(project.files.map(file => file.path)).toContain(resolved);
      }
    }
  }
});
