/**
 * Import the NDA/CDS/AFCAT synonym-and-antonym word lists into the English
 * vocabulary handbook.
 *
 * Sources (words, synonyms and antonyms):
 *   - https://ssbcrackexams.com/400-most-important-antonyms-and-synonyms-for-nda-cds-afcat-exam
 *   - https://www.trishuldefenceacademy.in/blog/top-20-synonym-and-antonyms-which-are-expected-to-ask-in-nda-cds-afcat-examination
 *
 * The lists give a word plus one or two synonyms and antonyms. The definition,
 * the example sentence, the respelling and the extra synonyms and antonyms that
 * take every card to the three-and-three floor are hand-authored alongside them
 * (`authored-*.txt`, pipe-delimited).
 *
 * Rows land in the hand-written region of the data file, above the markers that
 * `build-english-vocabulary.mjs` owns, so a later hitbullseye rebuild treats
 * them as curated and leaves them alone. A word already in the file is skipped
 * rather than duplicated — its synonyms and antonyms are already curated.
 *
 *   node scripts/import-exam-synonym-lists.mjs <scratch-dir>
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2];
if (!dir) throw new Error("usage: import-exam-synonym-lists.mjs <scratch-dir>");

const TARGET = "lib/pro-learn/english-exam-vocabulary.ts";
/** The first line of the region `build-english-vocabulary.mjs` rewrites. */
const MARKER = "  // ---- imported from the hitbullseye word lists ----";

/** Enough of a word to recognise it through its usual inflections. */
const stem = word => word.toLowerCase().slice(0, Math.max(4, word.length - 3));

const source = readFileSync(TARGET, "utf8");
const present = new Set([...source.matchAll(/^ {4}\["([a-z-]+)",/gm)].map(match => match[1]));

const entries = [];
const skipped = [];
const seen = new Set();
for (const file of readdirSync(dir).filter(name => /^authored-\d+\.txt$/.test(name)).sort()) {
  for (const [index, line] of readFileSync(join(dir, file), "utf8").split("\n").entries()) {
    if (!line.trim()) continue;
    const parts = line.split("|");
    if (parts.length !== 7) throw new Error(`${file}:${index + 1} has ${parts.length} fields, expected 7`);
    const [word, pronunciation, category, meaning, sentence, syn, ant] = parts.map(part => part.trim());
    const synonyms = syn.split(";").map(part => part.trim()).filter(Boolean);
    const antonyms = ant.split(";").map(part => part.trim()).filter(Boolean);
    const why =
      seen.has(word) ? "repeated in the authored files"
      : present.has(word) ? "already in the handbook"
      : synonyms.length < 3 ? "fewer than three synonyms"
      : antonyms.length < 3 ? "fewer than three antonyms"
      : synonyms.some(other => antonyms.includes(other)) ? "a word appears as both synonym and antonym"
      : meaning.length <= 20 ? "definition too thin"
      // The card quotes the sentence under the word, so the sentence has to use
      // it — an inflection counts, since "promulgation" still teaches "promulgate".
      : !sentence.toLowerCase().includes(stem(word)) ? "example sentence does not use the word"
      // Exactly one syllable is capitalised, and that is what marks the stress.
      : pronunciation.split("-").filter(part => part === part.toUpperCase()).length !== 1
        ? "respelling does not mark exactly one stressed syllable"
      : null;
    if (why) { skipped.push(`${word}: ${why}`); continue; }
    seen.add(word);
    entries.push({ word, pronunciation, category, meaning, sentence, synonyms, antonyms });
  }
}

entries.sort((a, b) => a.category.localeCompare(b.category) || a.word.localeCompare(b.word));

const byCategory = new Map();
for (const entry of entries) {
  if (!byCategory.has(entry.category)) byCategory.set(entry.category, []);
  byCategory.get(entry.category).push(entry);
}

const quote = text => JSON.stringify(text);
const list = words => `[${words.map(quote).join(", ")}]`;

const rows = `${[...byCategory].map(([category, group]) =>
  `  ...group(${quote(category)}, [\n${group.map(row =>
    `    [${quote(row.word)}, ${quote(row.meaning)}, ${quote(row.sentence)}, ${list(row.synonyms)}, ${list(row.antonyms)}],`
  ).join("\n")}\n  ]),`).join("\n")}\n`;

const respellings = `${entries
  .map(row => `  ${/^[a-z]+$/.test(row.word) ? row.word : quote(row.word)}: ${quote(row.pronunciation)},`)
  .join("\n")}\n`;

/** Insert just above the marked region, which a later rebuild owns. */
function insertAbove(text, addition, searchFrom) {
  const at = text.indexOf(MARKER, searchFrom);
  if (at < 0) throw new Error(`could not find the import marker in ${TARGET}`);
  return text.slice(0, at) + addition + text.slice(at);
}

// The respelling table comes first in the file, so it is inserted last: doing it
// the other way round would shift the offset the second insertion searches from.
let updated = insertAbove(source, rows, source.indexOf("ENGLISH_EXAM_VOCABULARY"));
updated = insertAbove(updated, respellings, 0);
writeFileSync(TARGET, updated, "utf8");

console.log(`imported ${entries.length} words across ${byCategory.size} categories; skipped ${skipped.length}`);
for (const line of skipped) console.log(`  - ${line}`);
