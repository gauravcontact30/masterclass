import { IELTS_TOPICS } from "@/lib/ielts-topics";
import { LINKING, RAW_TABLES, overallBand } from "@/lib/ielts-content";
import { rng, shuffle, type Rand } from "@/lib/board-exams/generated/util";
import type { Paper, PaperQuestion, PaperSet } from "@/lib/board-exams/sample-papers";
import { GRAMMAR, PART3_ANSWERS, READING_SETS } from "./authored";

/*
 * The IELTS dashboard's question bank and papers (2026-11-24). Original practice material, not official IELTS
 * questions: IELTS does not publish its test papers.
 *   Vocabulary (meaning and in context), linking phrases and band-score questions are built from the hub's own data
 *   (lib/ielts-topics.ts, lib/ielts-content.ts), so each answer is the data's own. Band conversions are the
 *   approximate tables the hub already shows, and say so.
 *   Grammar, Reading (True / False / Not Given) and Speaking Part 3 model answers are hand-written (./authored.ts).
 * A paper follows the order of the real test where it can: Reading, then language, Writing Task 2 and Speaking.
 */
export type Skill = "Reading" | "Vocabulary" | "Grammar" | "Linking" | "Band scores" | "Writing" | "Speaking";
type Item = PaperQuestion & { skill: Skill };

const OPTION = ["a", "b", "c", "d"];
const COMMON = new Set(IELTS_TOPICS.filter(t => t.common).map(t => t.topic));
const starsOf = (topic: string) => (COMMON.has(topic) ? 5 : 4) as 4 | 5;

/** Four options with the right one placed by the seeded shuffle; returns the options and the right index. */
function choices(r: Rand, right: string, wrong: string[]): { options: string[]; correct: number } {
  const options = shuffle(r, [right, ...wrong.slice(0, 3)]);
  return { options, correct: options.indexOf(right) };
}
const mcq = (base: Omit<Item, "options" | "correct" | "answer" | "section">, r: Rand, right: string, wrong: string[]): Item => {
  const { options, correct } = choices(r, right, wrong);
  return { ...base, section: "A", options, correct, answer: `(${OPTION[correct]}) ${right}` };
};

/** Every IELTS question, with its answer. */
export function ieltsBank(): Item[] {
  const r = rng(20261124);
  const items: Item[] = [];
  const allWords = IELTS_TOPICS.flatMap(t => t.words.map(w => ({ topic: t.topic, word: w[0], meaning: w[1], example: w[2] })));

  // Vocabulary: what a topic word means (other meanings as distractors), then the word in its example sentence.
  allWords.forEach((w, i) => {
    const others = shuffle(r, allWords.filter(o => o.meaning !== w.meaning)).slice(0, 3).map(o => o.meaning);
    items.push(mcq({ id: `ie-vm${i}`, skill: "Vocabulary", ch: "Vocabulary", q: `What does “${w.word}” mean? (Topic: ${w.topic})`, stars: starsOf(w.topic), marks: 1, steps: [`Example: ${w.example}`] }, r, w.meaning, others));
    const at = w.example.toLowerCase().indexOf(w.word.toLowerCase());
    if (at < 0) return;
    const gapped = `${w.example.slice(0, at)}______${w.example.slice(at + w.word.length)}`;
    const topicWords = allWords.filter(o => o.topic === w.topic && o.word !== w.word).map(o => o.word);
    items.push(mcq({ id: `ie-vg${i}`, skill: "Vocabulary", ch: "Vocabulary", q: `Complete the sentence (Topic: ${w.topic}): ${gapped}`, stars: starsOf(w.topic), marks: 1, steps: [`“${w.word}” means ${w.meaning}.`] }, r, w.word, topicWords));
  });

  // Linking phrases: what each one does.
  const purposes = LINKING.map(l => l.purpose);
  LINKING.forEach((l, i) => l.phrases.forEach((phrase, k) => items.push(mcq({ id: `ie-ln${i}-${k}`, skill: "Linking", ch: "Linking and cohesion", q: `In Writing, what is “${phrase}” used for?`, stars: 4, marks: 1,
    steps: [`Other phrases for ${l.purpose.toLowerCase()}: ${l.phrases.filter(p => p !== phrase).join(" ")}`, "// Use linking words where they help; overusing them can lower your cohesion score."] }, r, l.purpose, shuffle(r, purposes.filter(p => p !== l.purpose))))));

  // Grammar (hand-written).
  GRAMMAR.forEach((g, i) => items.push({ id: `ie-gr${i}`, skill: "Grammar", ch: "Grammar and accuracy", q: `${g.q} (${g.topic})`, stars: /agreement|Articles|Tenses for Task 1/.test(g.topic) ? 5 : 4, marks: 1, section: "A",
    options: g.options, correct: g.correct, steps: [g.why], answer: `(${OPTION[g.correct]}) ${g.options[g.correct]}` }));

  // Reading: True / False / Not Given, with the passage shown above each statement.
  READING_SETS.forEach((set, i) => set.statements.forEach((s, k) => {
    const options = ["True", "False", "Not given"];
    items.push({ id: `ie-rd${i}-${k}`, skill: "Reading", ch: "Reading · True / False / Not Given", q: `“${s.s}” True, False or Not given?`, context: `${set.title}. ${set.passage}`, stars: starsOf(set.topic), marks: 1, section: "A",
      options, correct: options.indexOf(s.answer), steps: [s.why], answer: s.answer });
  }));

  // Band scores from the approximate raw-score tables, and the overall band rule.
  (Object.keys(RAW_TABLES) as (keyof typeof RAW_TABLES)[]).forEach(key => {
    const table = RAW_TABLES[key];
    table.rows.forEach(([min, band], k) => {
      const wrong = shuffle(r, table.rows.filter(([m]) => m !== min).map(([m]) => `${m} out of 40`));
      items.push(mcq({ id: `ie-bs-${key}-${k}`, skill: "Band scores", ch: "Band scores", q: `${table.label}: about how many correct answers out of 40 give band ${band}?`, stars: 3, marks: 1,
        steps: [`About ${min} correct answers give band ${band} on the commonly used conversion table.`, "// Approximate: the exact conversion varies slightly from test to test."] }, r, `${min} out of 40`, wrong));
    });
  });
  const halves = [5, 5.5, 6, 6.5, 7, 7.5, 8];
  for (let i = 0; i < 16; i++) {
    const scores = [0, 1, 2, 3].map(() => halves[Math.floor(r() * halves.length)]);
    const band = overallBand(scores); const mean = scores.reduce((a, b) => a + b, 0) / 4;
    const wrong = [band - 0.5, band + 0.5, band - 1, band + 1].filter(b => b >= 4 && b <= 9 && b !== band).map(String);
    items.push(mcq({ id: `ie-ob${i}`, skill: "Band scores", ch: "Band scores", q: `Listening ${scores[0]}, Reading ${scores[1]}, Writing ${scores[2]}, Speaking ${scores[3]}. What is the overall band?`, stars: 4, marks: 1,
      steps: [`Average: (${scores.join(" + ")}) ÷ 4 = ${mean}.`, "// The average is rounded to the nearest half band; .25 rounds up to .5 and .75 rounds up to the next whole band."] }, r, String(band), shuffle(r, wrong)));
  }

  // Writing Task 2: each topic's question with an idea plan (unscored; the plan is the model answer).
  IELTS_TOPICS.forEach((t, i) => items.push({ id: `ie-wr${i}`, skill: "Writing", ch: "Writing Task 2", q: t.task2, stars: starsOf(t.topic), marks: 0, pill: "Writing Task 2 · 40 min", section: "A",
    steps: [...t.ideas, "// Write at least 250 words in about 40 minutes: an introduction that paraphrases the question, two body paragraphs, a clear conclusion."], answer: "Plan your essay around the points above and give a clear position." }));

  // Speaking Part 3 with model answers (hand-written).
  IELTS_TOPICS.forEach((t, i) => t.part3.forEach((q, k) => { const model = PART3_ANSWERS[q]; if (!model) return;
    items.push({ id: `ie-sp${i}-${k}`, skill: "Speaking", ch: "Speaking Part 3", q, stars: starsOf(t.topic), marks: 0, pill: "Speaking Part 3", section: "A",
      steps: ["// A model answer: give an opinion, a reason and an example, and consider another view."], answer: model }); }));
  return items;
}

/** The parts of one paper, in test order, and how many questions each takes. */
const LAYOUT: { skill: Skill[]; name: string; count: number }[] = [
  { skill: ["Reading"], name: "Reading · True / False / Not Given", count: 5 },
  { skill: ["Vocabulary"], name: "Vocabulary", count: 10 },
  { skill: ["Grammar", "Linking"], name: "Grammar and linking", count: 6 },
  { skill: ["Band scores"], name: "Band scores", count: 2 },
  { skill: ["Writing"], name: "Writing Task 2", count: 1 },
  { skill: ["Speaking"], name: "Speaking Part 3", count: 2 },
];
const LETTERS = "ABCDEF";
export const IELTS_SAMPLE = 6, IELTS_MOCK = 6;
export const IELTS_YEARS: number[] = Array.from({ length: 12 }, (_, i) => 2025 - i);
/** Reading 5 × 1.5, language 18 × 1, Writing Task 2 40 and Speaking 2 × 2 minutes, rounded up to 5. */
const MINUTES = 75;

export function buildIeltsPapers(bank: Item[] = ieltsBank()): PaperSet {
  const r = rng(51);
  // Reading questions stay with their passage: a paper takes one whole passage.
  const passages = shuffle(r, [...new Set(bank.filter(q => q.skill === "Reading").map(q => q.context))]);
  const pools = LAYOUT.map(part => shuffle(r, bank.filter(q => part.skill.includes(q.skill))));
  const sectionNames = Object.fromEntries(LAYOUT.map((part, i) => [LETTERS[i], part.name]));

  const make = (index: number, kind: Paper["kind"], title: string, year?: number, note?: string): Paper => {
    const questions = LAYOUT.flatMap((part, i): PaperQuestion[] => {
      const rows = part.skill[0] === "Reading"
        ? bank.filter(q => q.context === passages[index % passages.length])
        : Array.from({ length: Math.min(part.count, pools[i].length) }, (_, k) => pools[i][(index * part.count + k) % pools[i].length]);
      return rows.map(q => ({ ...q, section: LETTERS[i] }));
    });
    return { id: `ielts-${kind}-${year ?? index}`, kind, title, year, questions, marks: questions.filter(q => q.marks > 0).length, minutes: MINUTES, sectionNames, note };
  };
  const sample = Array.from({ length: IELTS_SAMPLE }, (_, i) => make(i, "sample", `IELTS Sample Paper ${i + 1}`));
  const mock = Array.from({ length: IELTS_MOCK }, (_, i) => make(IELTS_SAMPLE + i, "mock", `IELTS Mock Test ${i + 1}`));
  const years = IELTS_YEARS.map((year, i) => make(IELTS_SAMPLE + IELTS_MOCK + i, "year", `IELTS ${year} practice set`, year,
    `IELTS does not publish its past test papers, so no website can offer the real ${year} papers. This is a practice set written by us in the current test format, with the themes candidates commonly report.`));
  const asked = [...bank].sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0));
  const unique = new Set([...sample, ...mock, ...years].flatMap(p => p.questions.map(q => q.id))).size;
  return { sample, mock, years, asked, unique };
}
