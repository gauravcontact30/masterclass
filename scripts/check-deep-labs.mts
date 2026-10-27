/**
 * Runs every Java lab example of the in-depth courses with the local JDK (single-file source launch) and compares
 * what it prints with the output the page shows. Examples that need a newer JDK than the local one, a database, a
 * server or a framework on the classpath are reported as skipped, not failed.
 *
 *   npm run deep-courses:check-labs                 # every course
 *   npm run deep-courses:check-labs -- core-java    # one course
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const only = process.argv[2];
const courses = ["core-java", "advanced-java", "spring-boot", "dsa", "java-basic-to-advanced"].filter(id => !only || id === only);
const NEEDS_LIBRARY = /^import\s+(org\.springframework|jakarta\.|javax\.servlet|org\.hibernate|org\.junit|org\.mockito|org\.assertj|com\.zaxxer|org\.slf4j|io\.jsonwebtoken|org\.openjdk\.jmh)/m;
const NEWER_JDK = /(is not supported in -source|are not supported in -source|preview feature|records are|sealed|text blocks|switch rules|pattern matching|instanceof pattern|unnamed|cannot find symbol[\s\S]*(record|Thread\.ofVirtual|toList\(\)|getFirst|reversed))/i;

let pass = 0, fail = 0, skip = 0;
for (const id of courses) {
  const { LABS } = await import(pathToFileURL(resolve(root, `lib/deep-courses/labs/${id}.ts`)).href);
  for (const [topic, lab] of Object.entries(LABS as Record<string, { example: Ex; simple: Ex; moderate: Ex; complex: Ex }>)) {
    for (const level of ["example", "simple", "moderate", "complex"] as const) {
      const example = lab[level];
      const label = `${id}/${topic}/${level}`;
      if (!example.file.endsWith(".java")) { skip++; continue; }
      if (NEEDS_LIBRARY.test(example.code) || /jdbc:|DriverManager|DataSource/.test(example.code)) { skip++; console.log(`SKIP ${label} (needs a library)`); continue; }
      const dir = mkdtempSync(join(tmpdir(), "lab-"));
      try {
        writeFileSync(join(dir, example.file), example.code);
        const out = execFileSync("java", [example.file], { cwd: dir, timeout: 20_000, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
        if (out.replace(/\r\n/g, "\n").trimEnd() === example.output.trimEnd()) pass++;
        else { fail++; console.log(`FAIL ${label}\n--- expected\n${example.output}\n--- actual\n${out.trimEnd()}\n`); }
      } catch (error) {
        const stderr = String((error as { stderr?: string }).stderr ?? error);
        if (NEWER_JDK.test(stderr)) { skip++; console.log(`SKIP ${label} (needs a newer JDK)`); }
        else { fail++; console.log(`FAIL ${label} (did not run)\n${stderr.slice(0, 800)}\n`); }
      } finally { rmSync(dir, { recursive: true, force: true }); }
    }
  }
}
console.log(`\n${pass} passed, ${fail} failed, ${skip} skipped`);
process.exitCode = fail ? 1 : 0;

type Ex = { file: string; code: string; output: string };
