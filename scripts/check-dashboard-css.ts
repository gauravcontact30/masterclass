/**
 * Guards the globals.css split: app/dashboard.css is loaded only by the Learning Dashboard and Super Admin
 * (app/(learning)/learning/layout.tsx, re-exported by app/(admin)/super-admin/layout.tsx), so a class styled only there
 * renders unstyled on any other page. This follows every import (static, dynamic, re-export) from each route group's
 * pages and layouts and fails when a class in dashboard.css is used by a file that a public page reaches, or by a file
 * no page reaches at all (it cannot be proven dashboard-only). Fix a failure by moving that rule back to globals.css.
 * Run: npx tsx scripts/check-dashboard-css.ts
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, sep } from "node:path";

const DASHBOARD_GROUPS = new Set(["(learning)", "(admin)"]);
const slash = (path: string) => path.split(sep).join("/");

function sourceFiles(dir: string, out: string[] = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = slash(join(dir, entry.name));
    if (entry.isDirectory()) { if (!/node_modules|\.next|\.cache/.test(path)) sourceFiles(path, out); }
    else if (/\.(tsx?|jsx?|mjs)$/.test(entry.name) && !/\.(test|spec)\./.test(entry.name)) out.push(path);
  }
  return out;
}

function resolve(from: string, spec: string) {
  const base = spec.startsWith("@/") ? spec.slice(2) : spec.startsWith(".") ? slash(join(dirname(from), spec)) : null;
  if (!base) return null;
  for (const candidate of [base, `${base}.tsx`, `${base}.ts`, `${base}.js`, `${base}/index.tsx`, `${base}/index.ts`]) {
    if (existsSync(candidate) && statSync(candidate).isFile() && /\.(tsx?|jsx?)$/.test(candidate)) return candidate;
  }
  return null;
}

const text = new Map<string, string>();
const read = (file: string) => text.get(file) ?? text.set(file, readFileSync(file, "utf8")).get(file)!;
const IMPORT = /(?:import|export)[^"'`;]*?from\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)|^import\s+["']([^"']+)["']/gm;
const deps = new Map<string, string[]>();
function importsOf(file: string) {
  if (!deps.has(file)) deps.set(file, [...read(file).matchAll(IMPORT)].map(m => resolve(file, m[1] ?? m[2] ?? m[3])).filter((f): f is string => !!f));
  return deps.get(file)!;
}
function reach(entries: string[]) {
  const seen = new Set<string>(), stack = [...entries];
  while (stack.length) { const file = stack.pop()!; if (seen.has(file)) continue; seen.add(file); stack.push(...importsOf(file)); }
  return seen;
}

// Route groups and the top-level app files every page shares.
const ENTRY = /^(page|layout|template|loading|error|not-found|default|global-error)\.tsx$/;
const groups = new Map<string, string[]>([["(root)", readdirSync("app").filter(name => ENTRY.test(name)).map(name => `app/${name}`)]]);
for (const name of readdirSync("app")) {
  const dir = `app/${name}`;
  if (statSync(dir).isDirectory() && name !== "api") groups.set(name, sourceFiles(dir).filter(file => ENTRY.test(file.split("/").pop()!)));
}
const dashboardOnly = new Set<string>(), publicFiles = new Set<string>();
for (const [group, entries] of groups) for (const file of reach(entries)) (DASHBOARD_GROUPS.has(group) ? dashboardOnly : publicFiles).add(file);
for (const file of publicFiles) dashboardOnly.delete(file);

// Files outside the dashboards that mention a class: a public page could render it there.
const files = ["app", "components", "lib", "hooks"].filter(existsSync).flatMap(dir => sourceFiles(dir)).filter(file => !dashboardOnly.has(file));
const outside = new Map<string, string[]>();
const usersOf = (name: string) => {
  if (!outside.has(name)) {
    const used = new RegExp(`(^|[^\\w-])${name.replace(/-/g, "\\-")}(?![\\w-])`);
    outside.set(name, files.filter(file => used.test(read(file))));
  }
  return outside.get(name)!;
};

// A selector can match outside the dashboards only if every class it requires (those outside :not()) can appear there.
const css = readFileSync("app/dashboard.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const selectors = [...css.matchAll(/([^{}@]+)\{[^{}]*\}/g)].flatMap(m => m[1].split(/,(?![^(]*\))/)).map(s => s.trim()).filter(Boolean);
const problems: string[] = [];
for (const selector of new Set(selectors)) {
  const required = [...new Set([...selector.replace(/:not\([^)]*\)/g, "").matchAll(/\.([a-zA-Z_][\w-]*)/g)].map(m => m[1]))];
  if (!required.length || !required.every(name => usersOf(name).length)) continue;
  const where = [...new Set(required.flatMap(usersOf))].map(file => `${file}${publicFiles.has(file) ? "" : " (not reached by any page)"}`);
  problems.push(`${selector}  ←  ${where.join(", ")}`);
}
if (problems.length) {
  console.error(`dashboard.css: ${problems.length} rule(s) could match outside the dashboards. Move them back to app/globals.css:\n  ${problems.join("\n  ")}`);
  process.exitCode = 1;
} else console.log(`dashboard.css: all ${new Set(selectors).size} selectors need a class only the dashboards render (${dashboardOnly.size} dashboard files).`);
