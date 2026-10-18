import { TECH_PROJECTS } from "../lib/tech-doc-projects";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import ts from "typescript";

async function main() {
  const root = await mkdtemp(join(tmpdir(), "masterclass-projects-"));
  for (const [id, project] of Object.entries(TECH_PROJECTS)) {
    for (const file of project.files) {
      const path = join(root, id, file.name);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, file.code);
    }
  }
  const run = (id: string, executable: string, args: string[]) => execFileSync(executable, args, { cwd: join(root, id), encoding: "utf8", timeout: 60000, windowsHide: true });
  console.log(run("node", process.execPath, ["--test", "app.test.mjs"]));
  for (const id of ["dsa", "oops"]) {
    console.log(run(id, "python", ["-m", "unittest", "-v"]));
    console.log(run(id, "python", ["main.py"]));
  }
  // Compile the actual authored project with the repository's TypeScript compiler.
  console.log(run("typescript", process.execPath, [resolve("node_modules/typescript/bin/tsc"), "-p", "tsconfig.json", "--typeRoots", resolve("node_modules/@types")]));
  console.log(run("typescript", process.execPath, ["dist/order.test.js"]));
  for (const id of ["openrouter", "ai-gateway"]) {
    const { ask } = await import(pathToFileURL(join(root, id, "client.mjs")).href);
    const fetchOriginal = globalThis.fetch;
    const key = id === "openrouter" ? "OPENROUTER_API_KEY" : "AI_GATEWAY_API_KEY";
    const previousKey = process.env[key], previousModel = process.env.AI_MODEL;
    try {
      process.env[key] = "test-key"; process.env.AI_MODEL = "test-model";
      globalThis.fetch = async (_url, options) => {
        assert.equal(JSON.parse(String(options?.body)).model, "test-model");
        return Response.json({ choices: [{ message: { content: "Idempotency avoids duplicate effects." } }] });
      };
      assert.match(await ask("Explain"), /Idempotency/);
      globalThis.fetch = async () => new Response(null, { status: 429 });
      await assert.rejects(ask("Explain"), /HTTP 429/);
      delete process.env[key];
      await assert.rejects(ask("Explain"), /Set the API key/);
    } finally {
      globalThis.fetch = fetchOriginal;
      if (previousKey === undefined) delete process.env[key]; else process.env[key] = previousKey;
      if (previousModel === undefined) delete process.env.AI_MODEL; else process.env.AI_MODEL = previousModel;
    }
  }
  const db = new PGlite();
  try {
    await db.exec(TECH_PROJECTS.postgresql.files[0].code);
    await db.exec(TECH_PROJECTS.postgresql.files[1].code);
    await db.exec(TECH_PROJECTS.postgresql.files[1].code);
    assert.equal((await db.query<{ quantity: number }>("select quantity from inventory")).rows[0].quantity, 0);
    assert.equal((await db.query<{ count: number }>("select count(*)::int as count from reservations")).rows[0].count, 1);
  } finally { await db.close(); }
  // Syntax-check source that requires framework runtimes or a Salesforce org.
  for (const id of ["react", "angular", "salesforce"]) {
    for (const file of TECH_PROJECTS[id].files.filter(file => /\.(jsx|ts|js)$/.test(file.name))) {
      const result = ts.transpileModule(file.code, { fileName: file.name, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React, experimentalDecorators: true }, reportDiagnostics: true });
      assert.equal(result.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error).length, 0, `${id}/${file.name}`);
    }
  }
  console.log("PASS: Node integration, Python tests, TypeScript compile/tests, PostgreSQL reservation, mocked AI clients, framework source syntax.");
  console.log("External deployments (Salesforce, Docker, paid AI) were not executed.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
