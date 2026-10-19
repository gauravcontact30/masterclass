/** @jest-environment node */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : /\.[cm]?[jt]sx?$/.test(path) ? [path] : [];
  });
}

test("client and server directives precede imports and other code", () => {
  const misplaced: string[] = [];
  for (const directory of ["app", "components", "lib"]) {
    for (const path of sourceFiles(join(process.cwd(), directory))) {
      const source = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true);
      let hasCode = false;
      for (const statement of source.statements) {
        if (ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression)) {
          if (hasCode && ["use client", "use server"].includes(statement.expression.text)) {
            misplaced.push(`${relative(process.cwd(), path)}: ${statement.expression.text}`);
          }
        } else hasCode = true;
      }
    }
  }
  expect(misplaced).toEqual([]);
});
