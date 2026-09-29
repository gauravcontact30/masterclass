/** @jest-environment node */
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { spawnSync } from "node:child_process";
import ts from "typescript";
import { OFFICIAL_DOCS } from "@/lib/official-docs-data";
import { DOCS_PROJECTS } from "@/lib/official-docs-projects";

test("every technology has a complete project, runbook, and resolvable local imports", () => {
  expect(Object.keys(DOCS_PROJECTS).sort()).toEqual(OFFICIAL_DOCS.map(doc => doc.id).sort());
  for (const [id, project] of Object.entries(DOCS_PROJECTS)) {
    const paths = project.files.map(file => file.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).toContain("README.md");
    expect(project.files.length).toBeGreaterThanOrEqual(4);
    expect(project.commands.length).toBeGreaterThan(0);
    expect(project.verify.length).toBeGreaterThan(0);
    for (const file of project.files) {
      expect(file.code.trim().length).toBeGreaterThan(0);
      if (/\.(?:js|jsx|ts|tsx)$/.test(file.path)) {
        for (const match of file.code.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)) {
          const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file.path), match[1]));
          const candidates = [resolved, resolved.replace(/\.js$/, ".ts"), ...[".ts", ".tsx", ".js", ".jsx"].map(extension => resolved + extension)];
          expect({ project: id, import: resolved, found: candidates.some(candidate => paths.includes(candidate)) }).toEqual({ project: id, import: resolved, found: true });
        }
        const output = ts.transpileModule(file.code, { fileName: file.path.endsWith(".js") && file.code.includes("<") ? file.path + "x" : file.path, reportDiagnostics: true, compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, allowJs: true } });
        expect(output.diagnostics?.filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error)).toEqual([]);
      }
      if (file.path === "package.json") {
        const manifest = JSON.parse(file.code);
        expect(Object.keys(manifest.scripts).length).toBeGreaterThan(0);
      }
    }
  }
});

test.each(["javascript-features", "javascript-puzzles", "webhook"])("the %s project's executable assertions pass", (id) => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), "docs-project-test-"));
  try {
    for (const file of DOCS_PROJECTS[id].files) {
      const target = path.join(folder, file.path);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, file.code);
    }
    if (id !== "webhook") {
      const result = spawnSync(process.execPath, ["src/main.js"], { cwd: folder, encoding: "utf8" });
      expect(result.status).toBe(0);
      if (id === "javascript-features") expect(result.stdout.trim()).toBe("35");
      else expect(result.stdout).toContain('eventLoopPuzzle ["sync","end","microtask","timer"]');
    }
    const tests = spawnSync(process.execPath, ["--test"], { cwd: folder, encoding: "utf8" });
    expect(tests.status).toBe(0);
  } finally {
    fs.rmSync(folder, { recursive: true, force: true });
  }
});
