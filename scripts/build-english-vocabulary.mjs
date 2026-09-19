/**
 * Assemble the English vocabulary handbook from two halves.
 *
 * The word, its meaning and its example sentence are scraped from the
 * hitbullseye word lists (`corpus.json`); the pronunciation, the synonyms, the
 * antonyms, the category and a fuller definition are hand-authored
 * (`authored-*.txt`, pipe-delimited).
 *
 * Keeping the two apart is deliberate: re-running the scrape must never silently
 * drop hand-authored work, and a word that has not been authored yet is simply
 * absent rather than half-built. A word only ships when both halves exist and it
 * clears the quality gate — three synonyms, three antonyms, a real definition,
 * a sentence that uses the word and a respelling that marks one stressed
 * syllable. Rejections are printed rather than silently dropped.
 *
 * The curated words at the top of the data file are hand-written and are never
 * touched. Imported rows live between two marker comments, so a rebuild replaces
 * only what a previous rebuild wrote.
 *
 *   node scripts/build-english-vocabulary.mjs <scratch-dir>
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2];
if (!dir) throw new Error("usage: build-english-vocabulary.mjs <scratch-dir>");

const TARGET = "lib/pro-learn/english-exam-vocabulary.ts";
const START = "  // ---- imported from the hitbullseye word lists ----";
const END = "  // ---- end imported ----";

const corpus = JSON.parse(readFileSync(join(dir, "corpus.json"), "utf8"));
const scraped = new Map([...corpus.advanced, ...corpus.basic].map(row => [row.word, row]));

const authored = new Map();
for (const file of readdirSync(dir).filter(name => /^authored-\d+\.txt$/.test(name)).sort()) {
  for (const [index, line] of readFileSync(join(dir, file), "utf8").split("\n").entries()) {
    if (!line.trim()) continue;
    const parts = line.split("|");
    if (parts.length !== 6) throw new Error(`${file}:${index + 1} has ${parts.length} fields, expected 6`);
    const [word, pronunciation, category, meaning, synonyms, antonyms] = parts.map(part => part.trim());
    if (authored.has(word)) throw new Error(`${file}:${index + 1} repeats "${word}"`);
    authored.set(word, {
      word, pronunciation, category, meaning,
      synonyms: synonyms.split(";").map(part => part.trim()).filter(Boolean),
      antonyms: antonyms.split(";").map(part => part.trim()).filter(Boolean),
    });
  }
}

/** Enough of a word to recognise it through its usual inflections. */
const stem = word => word.toLowerCase().slice(0, Math.max(4, word.length - 3));

// Only the hand-written region counts as curated: rows a previous run imported
// live inside the markers, and treating those as curated would make the build
// erase its own output on the second run.
const existing = readFileSync(TARGET, "utf8");
const handWritten = existing.includes(START) ? existing.slice(0, existing.indexOf(START)) : existing;
const curated = new Set([...handWritten.matchAll(/^\s{4}\["([a-z-]+)",/gm)].map(match => match[1]));

const rejected = [];
const entries = [];
for (const entry of authored.values()) {
  const source = scraped.get(entry.word);
  const why =
    !source ? "not in the scraped corpus"
    : curated.has(entry.word) ? "already curated by hand"
    : entry.synonyms.length < 3 ? "fewer than three synonyms"
    : entry.antonyms.length < 3 ? "fewer than three antonyms"
    : entry.synonyms.some(word => entry.antonyms.includes(word)) ? "a word appears as both synonym and antonym"
    : entry.meaning.length <= 20 ? "definition too thin"
    // The card quotes the sentence under the word, so the sentence has to use
    // it — an inflection counts, since "promulgation" still teaches "promulgate".
    : !source.sentence.toLowerCase().includes(stem(entry.word)) ? "example sentence does not use the word"
    // Exactly one syllable is capitalised, and that is what marks the stress.
    : entry.pronunciation.split("-").filter(part => part === part.toUpperCase()).length !== 1
      ? "respelling does not mark exactly one stressed syllable"
    : null;
  if (why) { rejected.push(`${entry.word}: ${why}`); continue; }
  entries.push({ ...entry, sentence: source.sentence });
}

entries.sort((a, b) => a.category.localeCompare(b.category) || a.word.localeCompare(b.word));

const byCategory = new Map();
for (const entry of entries) {
  if (!byCategory.has(entry.category)) byCategory.set(entry.category, []);
  byCategory.get(entry.category).push(entry);
}

const quote = text => JSON.stringify(text);
const list = words => `[${words.map(quote).join(", ")}]`;

const rows = [...byCategory].map(([category, group]) =>
  `  ...group(${quote(category)}, [\n${group.map(row =>
    `    [${quote(row.word)}, ${quote(row.meaning)}, ${quote(row.sentence)}, ${list(row.synonyms)}, ${list(row.antonyms)}],`
  ).join("\n")}\n  ]),`).join("\n");

const respellings = entries
  .map(row => `  ${/^[a-z]+$/.test(row.word) ? row.word : quote(row.word)}: ${quote(row.pronunciation)},`)
  .join("\n");

/**
 * Replace the marked block, or insert one just before `closing` the first time.
 * `closing` is matched from the end of the region we are writing into, so the
 * respelling table and the row list each land in their own place.
 */
function place(text, addition, closing, searchFrom) {
  const from = text.indexOf(START, searchFrom);
  const to = from < 0 ? -1 : text.indexOf(END, from);
  if (from >= 0 && to >= 0) return text.slice(0, from) + addition + text.slice(to);
  const at = text.indexOf(closing, searchFrom);
  if (at < 0) throw new Error(`could not find ${JSON.stringify(closing)} in ${TARGET}`);
  return text.slice(0, at + 1) + addition + text.slice(at + 1);
}

let source = readFileSync(TARGET, "utf8");
// The respelling table closes first, so its insertion point is found first.
source = place(source, `${START}\n${respellings}\n${END}\n`, "\n};\n", 0);
source = place(source, `${START}\n${rows}\n${END}\n`, "\n];\n", source.indexOf("ENGLISH_EXAM_VOCABULARY"));
writeFileSync(TARGET, source, "utf8");

console.log(`kept ${entries.length} imported words across ${byCategory.size} categories; rejected ${rejected.length}`);
for (const line of rejected) console.log(`  - ${line}`);
