/** Generate complete Hindi dictionaries from the actual published learning packs. Resumable; no credentials in output. */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import ts from "typescript";
import { BOARDS, CLASSES, SUBJECTS, loadPack, loadQuick as boardQuick } from "../lib/board-exams/boards";
import { EXAMS, loadExam, loadQuick as examQuick } from "../lib/competitive-exams/exams";
import { en } from "../lib/i18n";
import { ieltsGuidance } from "../lib/ielts-guidance";
const dir = "lib/locales/hi";
const fields = new Set(["ch", "q", "a", "steps", "hint", "options", "why", "title", "lines", "subject", "name", "full", "tagline", "short", "paper", "sections", "label", "covers", "pattern", "written", "group", "topic"]);
const strings = new Set<string>();
/** Strings seen only inside English-language items: the exercise itself is English, so it must stay English. */
const englishOnly = new Set<string>();
const translatable = new Set<string>();
/** Which dictionary shard each string ships in: "common" (catalogues and component copy), "board-<class>-<subject>" or "exam-<id>". */
const shards = new Map<string, Set<string>>();
const place = (text: string, shard: string) => { let set = shards.get(shard); if (!set) shards.set(shard, set = new Set()); set.add(text); };
const ENTITIES: Record<string, string> = { amp: "&", apos: "'", quot: '"', lt: "<", gt: ">", nbsp: " ", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", middot: "·", hellip: "…", ndash: "–", mdash: "—" };
const decodeEntities = (text: string) => text.replace(/&(#\d+|[a-z]+);/g, (whole, name: string) => name.startsWith("#") ? String.fromCodePoint(Number(name.slice(1))) : ENTITIES[name] ?? whole);
const isEnglishSubject =(subject: unknown) => typeof subject === "string" && /English/.test(subject);
function collect(value: unknown, field = "", english = false, shard = "common") {
  if (typeof value === "string") { if (fields.has(field) && /[a-zA-Z]{2}/.test(value)) { strings.add(value); place(value, shard); (english ? englishOnly : translatable).add(value); } }
  else if (Array.isArray(value)) value.forEach(item => collect(item, field, english, shard));
  else if (value && typeof value === "object") { const inEnglish = english || isEnglishSubject((value as { subject?: unknown }).subject); Object.entries(value).forEach(([key, item]) => collect(item, key, inEnglish, shard)); }
}
async function main() {
  collect(BOARDS); collect(CLASSES); collect(SUBJECTS); collect(EXAMS);
  for (const cls of CLASSES) for (const subject of SUBJECTS) { const english = subject.id === "english", shard = `board-${cls.id}-${subject.id}`; collect(await loadPack(cls.id, subject.id), "", english, shard); collect(await boardQuick(cls.id, subject.id), "", english, shard); }
  for (const exam of EXAMS) { const shard = `exam-${exam.id}`; collect(await loadExam(exam.id), "", false, shard); collect(await examQuick(exam.id), "", false, shard); }
  // IELTS: only the guidance (tips, explanations, meanings, plan); the English test material itself stays English.
  for (const text of ieltsGuidance()) { strings.add(text); place(text, "ielts"); translatable.add(text); }
  Object.values(en).forEach(value => { strings.add(value); place(value, "common"); });
  for (const filename of ["components/board-exams.tsx", "components/competitive-exams.tsx", "components/quick-qa.tsx", "components/exams-shell.tsx", "components/landing-exams.tsx"]) {
    const source = ts.createSourceFile(filename, await readFile(filename, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = (node: ts.Node) => {
      if (ts.isJsxText(node) || ts.isStringLiteral(node)) {
        // JSX text keeps its HTML entities in the source ("board&apos;s"); React renders the decoded text, which is what ExamContent looks up.
        const raw = node.text.trim(), text = ts.isJsxText(node) ? decodeEntities(raw) : raw;
        // Image `sizes` lists and file extensions are attributes and fragments, not learning text.
        const markup = /\d(?:px|vw|vh|rem)\b/.test(text) || /^\.\w+\.?$/.test(text);
        if (!markup && /[A-Za-z]{2}/.test(text) && (text.includes(" ") || /^[A-Z][a-z]+$/.test(text)) && !text.includes("@/") && !text.includes("./") && !text.includes("className")) { strings.add(text); place(text, "common"); }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  const all = [...strings].sort();
  await mkdir("lib/locales", { recursive: true });
  const translated: Record<string, string> = {};
  for (const shard of shards.keys()) try { Object.assign(translated, JSON.parse(await readFile(`${dir}/${shard}.json`, "utf8"))); } catch {}
  let noProse: string[] = [];
  try { noProse = JSON.parse(await readFile(`${dir}/skip.json`, "utf8")); } catch {}
  // Deliberately English: English-language exercises, and strings that are only formulas or numbers once math is set aside.
  const keep = all.filter(text => englishOnly.has(text) && !translatable.has(text));
  const english = new Set([...keep, ...noProse]);
  const isProse = (text: string) => /(?<![A-Za-z])(?:[a-z]{3,}|[A-Z][a-z]{2,})(?![A-Za-z])/.test(text);
  const pending = all.filter(text => !translated[text] && !english.has(text) && isProse(text));
  console.log(JSON.stringify({ total: all.length, translated: all.filter(text => translated[text]).length, keptEnglish: all.length - pending.length - all.filter(text => translated[text]).length, pending: pending.length }));
  if (process.argv.includes("--check")) { if (pending.length) { console.log(pending.slice(0, 20).join(String.fromCharCode(10))); process.exitCode = 1; } return; }
  await mkdir(".local-tools", { recursive: true });
  await writeFile(".local-tools/hindi-input.json", JSON.stringify({ strings: all, ui: Object.values(en), keep, shards: Object.fromEntries([...shards].map(([name, set]) => [name, [...set].sort()])), sourceHash: createHash("sha256").update(JSON.stringify(all)).digest("hex") }, null, 2));
  console.log("Exported local translation input. Run scripts/translate-hindi-local.py (IndicTrans2, offline); no lesson text is sent over the network.");
}
main().catch(error => { console.error(error instanceof Error ? error.message : "translation_failed"); process.exitCode = 1; });
