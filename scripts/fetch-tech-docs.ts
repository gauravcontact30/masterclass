/**
 * Refresh the Technology docs snapshot from the official websites: `npm run docs:tech`.
 * Writes lib/generated/tech-docs-official.json (committed), the fallback the site serves when a live refresh fails.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fetchOfficialTechDocs, type OfficialTechDocs } from "../lib/tech-docs-official";

const OUT = "lib/generated/tech-docs-official.json";
async function main() {
const previous: OfficialTechDocs | null = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : null;
const result = await fetchOfficialTechDocs(previous);
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(result, null, 2)}\n`);
const pages = Object.values(result.pages);
for (const p of pages) console.log(`${p.ok ? "ok  " : "FAIL"} ${String(p.status).padEnd(3)} ${p.url}\n       ${p.title} · ${p.sections.length} sections`);
console.log(`\n${pages.filter(p => p.ok).length}/${pages.length} pages · versions: ${Object.entries(result.versions).map(([id, v]) => `${id} ${v.version}`).join(", ")}`);
}
void main();
