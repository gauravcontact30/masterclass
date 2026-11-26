import { rng, shuffle, type Rand } from "@/lib/board-exams/generated/util";
import type { Paper, PaperQuestion, PaperSet } from "@/lib/board-exams/sample-papers";
import { chartAlt, chartImage, chartKind, formImage, TASK1_CHARTS, type DiagramQuestion, type Task1Chart } from "./charts";
import { ACADEMIC_WORDS, COLLOCATIONS, CUE_CARDS, ERRORS, GT_LETTERS, HEADINGS_PASSAGES, IDIOMS, LISTENING_DRILLS, PARAPHRASES, PHRASAL_VERBS, SPELLING, SYNONYMS, TASK2_ESSAYS, type Entry } from "./library";

/*
 * IELTS Practice Tests (IELTS dashboard, "Practice Tests" tab), 2026-11-26: a second question bank of objective
 * and subjective questions with answers, separate from the Sample Papers bank (lib/ielts/bank.ts), and the papers
 * built from it. Original practice material in the IELTS style, not official IELTS questions.
 *   Objective: Listening note completion (transcript + form picture), Reading matching headings, Task 1 data
 *   questions computed from each chart's own numbers (picture attached), vocabulary, idioms, phrasal verbs,
 *   collocations, synonyms and spelling.
 *   Subjective (model answer behind "Show answer"): Writing Task 1 with the chart, Task 2 essays, General Training
 *   letters, Speaking Part 2 cue cards, paraphrasing and error correction.
 */
export type PracticeSkill = "Listening" | "Reading" | "Task 1 data" | "Writing Task 1" | "Vocabulary" | "Accuracy" | "Writing" | "Speaking";
export type PracticeItem = PaperQuestion & { skill: PracticeSkill; group?: string };

const OPTION = ["a", "b", "c", "d"];
function mcq(r: Rand, base: Omit<PracticeItem, "options" | "correct" | "answer" | "section">, right: string, wrong: string[]): PracticeItem {
  const options = shuffle(r, [right, ...[...new Set(wrong.filter(w => w !== right))].slice(0, 3)]);
  const correct = options.indexOf(right);
  return { ...base, section: "A", options, correct, answer: `(${OPTION[correct]}) ${right}` };
}
const words = (text: string) => text.trim().split(/\s+/).length;
const fmt = (n: number) => Number.isInteger(n) ? String(n) : n.toFixed(1);
/** A signed change, with a true minus sign so the right option and its distractors read alike. */
const signed = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${fmt(Math.abs(n))}`;
/** Numeric distractors near the right value, distinct from it and from each other. */
function near(r: Rand, right: number, unit = "") {
  const step = Math.max(1, Math.round(Math.abs(right) / 6));
  const pool = shuffle(r, [right + step, right - step, right + 2 * step, right - 2 * step, right * 2, Math.round(right / 2)].filter(v => v !== right && v > 0));
  return [...new Set(pool)].slice(0, 3).map(v => `${fmt(v)}${unit}`);
}

/** Objective questions computed from a chart's data; each carries the chart picture. */
function chartQuestions(r: Rand, c: Task1Chart): PracticeItem[] {
  const figure = { src: chartImage(c), alt: chartAlt(c) };
  const base = (k: number, q: string, why: string) => ({ id: `ip-c-${c.id}-${k}`, skill: "Task 1 data" as const, group: c.id, ch: `Task 1 · ${chartKind(c)}`, q, stars: 5 as const, marks: 1, figure, steps: [why] });
  const out: PracticeItem[] = [];
  const top = (rows: { name: string; v: number }[]) => rows.reduce((a, b) => b.v > a.v ? b : a);
  const low = (rows: { name: string; v: number }[]) => rows.reduce((a, b) => b.v < a.v ? b : a);
  if (c.kind === "line") {
    const first = c.series.map(s => ({ name: s.name, v: s.values[0] })), last = c.series.map(s => ({ name: s.name, v: s.values.at(-1)! }));
    const names = c.series.map(s => s.name);
    out.push(mcq(r, base(0, `Which had the highest figure in ${c.x[0]}?`, `${c.x[0]}: ${first.map(f => `${f.name} ${f.v}`).join(", ")}.`), top(first).name, names));
    out.push(mcq(r, base(1, `Which had the highest figure in ${c.x.at(-1)}?`, `${c.x.at(-1)}: ${last.map(f => `${f.name} ${f.v}`).join(", ")}.`), top(last).name, names));
    const change = c.series.map(s => ({ name: s.name, v: s.values.at(-1)! - s.values[0] })), big = top(change);
    out.push(mcq(r, base(2, `By how much did ${big.name} change between ${c.x[0]} and ${c.x.at(-1)}? (${c.unit})`, `${big.name}: ${c.series.find(s => s.name === big.name)!.values.at(-1)} − ${c.series.find(s => s.name === big.name)!.values[0]} = ${signed(big.v)}.`), signed(big.v), near(r, Math.abs(big.v)).map(v => `${big.v > 0 ? "+" : "−"}${v}`)));
  } else if (c.kind === "bar") {
    const [a, b] = c.series;
    const rowsA = c.x.map((name, i) => ({ name, v: a.values[i] }));
    out.push(mcq(r, base(0, `For ${a.name}, which category has the highest figure?`, rowsA.map(x => `${x.name} ${x.v}`).join(", ") + "."), top(rowsA).name, c.x));
    const gap = c.x.map((name, i) => ({ name, v: Math.abs(a.values[i] - b.values[i]) }));
    out.push(mcq(r, base(1, `In which category is the difference between ${a.name} and ${b.name} the largest?`, gap.map(x => `${x.name} ${x.v}`).join(", ") + "."), top(gap).name, c.x));
    const pick = Math.floor(r() * c.x.length);
    out.push(mcq(r, base(2, `What is the figure for ${b.name}, ${c.x[pick]}? (${c.unit})`, `Read the ${b.name} bar for ${c.x[pick]}: ${b.values[pick]}.`), String(b.values[pick]), near(r, b.values[pick])));
  } else if (c.kind === "pie") {
    const lastPie = c.pies.at(-1)!, firstPie = c.pies[0], names = firstPie.slices.map(s => s.name);
    out.push(mcq(r, base(0, `Which category had the largest share in ${lastPie.label}?`, lastPie.slices.map(s => `${s.name} ${s.value}%`).join(", ") + "."), top(lastPie.slices.map(s => ({ name: s.name, v: s.value }))).name, names));
    const rise = firstPie.slices.map(s => ({ name: s.name, v: lastPie.slices.find(x => x.name === s.name)!.value - s.value }));
    out.push(mcq(r, base(1, `Which category's share increased the most between ${firstPie.label} and ${lastPie.label}?`, rise.map(x => `${x.name} ${signed(x.v)}`).join(", ") + " percentage points."), top(rise).name, names));
    const fall = low(rise);
    out.push(mcq(r, base(2, `By how many percentage points did ${fall.name} change between ${firstPie.label} and ${lastPie.label}?`, `${lastPie.slices.find(s => s.name === fall.name)!.value}% − ${firstPie.slices.find(s => s.name === fall.name)!.value}% = ${signed(fall.v)}.`), signed(fall.v), near(r, Math.abs(fall.v)).map(v => `${fall.v < 0 ? "−" : "+"}${v}`)));
  } else if (c.kind === "table") {
    const col = (i: number) => c.rows.map(row => ({ name: row.name, v: row.values[i] }));
    const names = c.rows.map(row => row.name);
    out.push(mcq(r, base(0, `In which city does the journey by ${c.columns[0].toLowerCase()} take longest?`, col(0).map(x => `${x.name} ${x.v}`).join(", ") + "."), top(col(0)).name, names));
    const row = c.rows[1], fastest = low(c.columns.map((name, i) => ({ name, v: row.values[i] })));
    out.push(mcq(r, base(1, `In ${row.name}, which is the quickest way to travel?`, c.columns.map((n, i) => `${n} ${row.values[i]}`).join(", ") + "."), fastest.name, c.columns));
    const last = c.columns.length - 1;
    out.push(mcq(r, base(2, `In which city is the journey by ${c.columns[last].toLowerCase()} shortest?`, col(last).map(x => `${x.name} ${x.v}`).join(", ") + "."), low(col(last)).name, names));
  } else {
    c.questions.forEach((d: DiagramQuestion, k) => out.push(mcq(r, base(k, d.q, d.why), d.right, d.wrong)));
  }
  return out;
}

/** Every Practice Tests question, with its answer. */
export function ieltsPracticeBank(): PracticeItem[] {
  const r = rng(20261126);
  const items: PracticeItem[] = [];

  // Listening: a transcript with its form picture, two gaps each.
  LISTENING_DRILLS.forEach(d => d.questions.forEach((q, k) => items.push(mcq(r, {
    id: `ip-l-${d.id}-${k}`, skill: "Listening", group: d.id, ch: `Listening · ${d.title}`, q: q.q, stars: 5, marks: 1,
    context: d.transcript, contextLabel: "Transcript (read it as if you heard it once)", figure: { src: formImage(d.form), alt: `${d.form.title}: ${d.form.rows.map(([l, v]) => `${l} ${v}`).join("; ")}` }, steps: [q.why],
  }, q.right, q.wrong))));

  // Reading: matching headings, one question per paragraph, the passage shown above.
  HEADINGS_PASSAGES.forEach(p => {
    const passage = `${p.title}\n\n${p.paragraphs.map((text, i) => `${"ABCD"[i]}  ${text}`).join("\n\n")}\n\nList of headings: ${p.headings.map((h, i) => `${["i", "ii", "iii", "iv", "v", "vi"][i]}. ${h}`).join("; ")}`;
    p.paragraphs.forEach((_, i) => items.push(mcq(r, {
      id: `ip-h-${p.id}-${i}`, skill: "Reading", group: p.id, ch: "Reading · Matching headings", q: `Choose the correct heading for paragraph ${"ABCD"[i]}.`, stars: 5, marks: 1,
      context: passage, contextLabel: "Passage", steps: [`Paragraph ${"ABCD"[i]}'s main idea: “${p.headings[i]}”. A heading sums up the whole paragraph, not one detail in it.`],
    }, p.headings[i], shuffle(r, p.headings.filter((_, k) => k !== i)))));
  });

  // Task 1: data questions, then the writing task with its model answer.
  TASK1_CHARTS.forEach(c => {
    items.push(...chartQuestions(r, c));
    items.push({ id: `ip-w1-${c.id}`, skill: "Writing Task 1", group: c.id, ch: `Writing Task 1 · ${chartKind(c)}`, q: c.task, stars: 5, marks: 0, pill: "Writing Task 1 · 20 min", section: "A",
      figure: { src: chartImage(c), alt: chartAlt(c) },
      steps: ["// Structure: introduction (paraphrase the task), overview (two main trends, no numbers), two detail paragraphs with figures.", `// Model answer: ${words(c.model)} words.`], answer: c.model });
  });

  // Vocabulary: meaning of each academic word, idiom and phrasal verb (other meanings as distractors).
  const meaningSet = (list: Entry[], kind: string, prefix: string, stars: 4 | 5) => list.forEach((e, i) => {
    const others = shuffle(r, list.filter(o => o.meaning !== e.meaning)).slice(0, 3).map(o => o.meaning);
    items.push(mcq(r, { id: `ip-${prefix}${i}`, skill: "Vocabulary", ch: kind, q: `What does “${e.term}” mean?`, stars, marks: 1, steps: [`Example: ${e.example}`, ...(e.note ? [`// ${e.note}`] : [])] }, e.meaning, others));
  });
  meaningSet(ACADEMIC_WORDS, "Vocabulary · Academic words", "aw", 5);
  meaningSet(IDIOMS, "Vocabulary · Idioms (Speaking)", "id", 4);
  meaningSet(PHRASAL_VERBS, "Vocabulary · Phrasal verbs", "pv", 4);
  COLLOCATIONS.forEach((c, i) => items.push(mcq(r, { id: `ip-co${i}`, skill: "Vocabulary", ch: "Vocabulary · Collocations", q: `Complete the collocation: ${c.blank}`, stars: 5, marks: 1, steps: [`“${c.phrase}” means ${c.meaning}.`] }, c.right, c.wrong)));
  SYNONYMS.forEach(([word, syn], i) => {
    const others = shuffle(r, SYNONYMS.filter(([w]) => w !== word)).slice(0, 3).map(([, s]) => s);
    items.push(mcq(r, { id: `ip-sy${i}`, skill: "Vocabulary", ch: "Vocabulary · Synonyms for paraphrasing", q: `Which word is closest in meaning to “${word}”?`, stars: 5, marks: 1, steps: [`“${word}” → “${syn}”: use synonyms to paraphrase the question in your introduction.`] }, syn, others));
  });

  // Accuracy: spelling (objective), error correction and paraphrasing (written).
  SPELLING.forEach(([right, wrong], i) => items.push(mcq(r, { id: `ip-sp${i}`, skill: "Accuracy", ch: "Spelling", q: "Which spelling is correct?", stars: 5, marks: 1, steps: ["// A misspelled answer scores zero in Listening and Reading."] }, right, wrong)));
  ERRORS.forEach(([wrong, right, why], i) => items.push({ id: `ip-er${i}`, skill: "Accuracy", ch: "Grammar · Error correction", q: `Find and correct the error: “${wrong}”`, stars: 4, marks: 0, pill: "Written · correct it", section: "A", steps: [why], answer: right }));
  PARAPHRASES.forEach(([original, para, technique], i) => items.push({ id: `ip-pa${i}`, skill: "Accuracy", ch: "Paraphrasing", q: `Paraphrase this sentence without changing its meaning: “${original}”`, stars: 5, marks: 0, pill: "Written · paraphrase", section: "A", steps: [`// Technique: ${technique}.`, "// Other correct paraphrases are possible."], answer: para }));

  // Writing Task 2 and General Training Task 1 with model answers; Speaking Part 2 with model answers.
  TASK2_ESSAYS.forEach(e => items.push({ id: `ip-w2-${e.id}`, skill: "Writing", ch: `Writing Task 2 · ${e.type}`, q: `${e.question} Write at least 250 words.`, stars: 5, marks: 0, pill: "Writing Task 2 · 40 min", section: "A",
    steps: [...e.notes, `// Model answer: ${words(e.answer)} words.`], answer: e.answer }));
  GT_LETTERS.forEach(l => items.push({ id: `ip-gt-${l.id}`, skill: "Writing", ch: `General Training Task 1 · ${l.tone} letter`, q: `${l.prompt} In your letter: ${l.bullets.join("; ")}. Write at least 150 words.`, stars: 4, marks: 0, pill: "GT Task 1 · 20 min", section: "A",
    steps: [`// Tone: ${l.tone.toLowerCase()}. ${l.tone === "Formal" ? "Dear Sir or Madam … Yours faithfully" : l.tone === "Semi-formal" ? "Dear Mr/Ms + surname … Yours sincerely" : "Dear + first name … Best wishes / Love"}.`, "// Cover every bullet point in its own paragraph.", `// Model answer: ${words(l.answer)} words.`], answer: l.answer }));
  CUE_CARDS.forEach(c => items.push({ id: `ip-s2-${c.id}`, skill: "Speaking", ch: "Speaking Part 2 · Cue card", q: `${c.title} You should say: ${c.points.join("; ")}.`, stars: 5, marks: 0, pill: "Speaking Part 2 · 2 min", section: "A",
    steps: ["// One minute to prepare, then speak for up to two minutes. Cover each point and add a personal reason or feeling."], answer: c.answer }));
  return items;
}

/** One practice test, in test order. `group` parts take one whole group (a transcript, a passage, a chart). */
const LAYOUT: { name: string; pick: { skill: PracticeSkill[]; count: number; ch?: RegExp; notCh?: RegExp }[]; group?: true }[] = [
  { name: "Listening · note completion", pick: [{ skill: ["Listening"], count: 2 }], group: true },
  { name: "Reading · matching headings", pick: [{ skill: ["Reading"], count: 4 }], group: true },
  { name: "Task 1 · data and writing", pick: [{ skill: ["Task 1 data", "Writing Task 1"], count: 4 }], group: true },
  { name: "Vocabulary, idioms and collocations", pick: [{ skill: ["Vocabulary"], count: 8 }] },
  { name: "Accuracy · spelling, grammar, paraphrase", pick: [{ skill: ["Accuracy"], ch: /^Spelling/, count: 2 }, { skill: ["Accuracy"], ch: /Error/, count: 1 }, { skill: ["Accuracy"], ch: /Paraphras/, count: 1 }] },
  { name: "Writing Task 2 or letter · Speaking Part 2", pick: [{ skill: ["Writing"], count: 1 }, { skill: ["Speaking"], count: 1 }] },
];
const LETTERS = "ABCDEF";
export const PRACTICE_SAMPLE = 10, PRACTICE_MOCK = 5;
/** Listening 4, Reading 6, Task 1 data 3 + writing 20, language 12, accuracy 8, Task 2 40 and Speaking 2 minutes, rounded up. */
const MINUTES = 95;

export function buildIeltsPracticeTests(bank: PracticeItem[] = ieltsPracticeBank()): PaperSet {
  const r = rng(126);
  const groupsOf = (skills: PracticeSkill[]) => shuffle(r, [...new Set(bank.filter(q => skills.includes(q.skill)).map(q => q.group!))]);
  const sectionNames = Object.fromEntries(LAYOUT.map((part, i) => [LETTERS[i], part.name]));
  const groups = LAYOUT.map(part => part.group ? groupsOf(part.pick[0].skill) : []);
  const pools = LAYOUT.map(part => part.pick.map(p => shuffle(r, bank.filter(q => p.skill.includes(q.skill) && (!p.ch || p.ch.test(q.ch))))));

  const make = (index: number, kind: Paper["kind"], title: string): Paper => {
    const questions = LAYOUT.flatMap((part, i): PaperQuestion[] => {
      const rows = part.group
        ? bank.filter(q => part.pick[0].skill.includes(q.skill) && q.group === groups[i][index % groups[i].length])
        : part.pick.flatMap((p, k) => Array.from({ length: Math.min(p.count, pools[i][k].length) }, (_, n) => pools[i][k][(index * p.count + n) % pools[i][k].length]));
      return rows.map(q => ({ ...q, section: LETTERS[i] }));
    });
    return { id: `ielts-practice-${kind}-${index}`, kind, title, questions, marks: questions.filter(q => q.marks > 0).reduce((s, q) => s + q.marks, 0), minutes: MINUTES, sectionNames };
  };
  const sample = Array.from({ length: PRACTICE_SAMPLE }, (_, i) => make(i, "sample", `IELTS Practice Test ${i + 1}`));
  const mock = Array.from({ length: PRACTICE_MOCK }, (_, i) => make(PRACTICE_SAMPLE + i, "mock", `IELTS Timed Practice Test ${i + 1}`));
  const asked = [...bank].sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0));
  const unique = new Set([...sample, ...mock].flatMap(p => p.questions.map(q => q.id))).size;
  return { sample, mock, years: [], asked, unique };
}
