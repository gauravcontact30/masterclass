import { FACTS, FORMAT, LINKING, LISTENING, LISTENING_TIPS, MISTAKES, OFFICIAL_LINKS, RAW_TABLES, READING, READING_TIPS, SKILLS, SPEAKING_CRITERIA,
  SPEAKING_PART1, STRATEGIES, STUDY_PLAN, TEST_DAY, TOPIC_VOCAB, WRITING, WRITING_CRITERIA } from "./ielts-content";
import { IELTS_TOPICS } from "./ielts-topics";

/**
 * The IELTS text a Hindi reader sees in Hindi: format notes, tips, strategies, explanations, criteria, word meanings,
 * essay ideas, the study plan and the test-day checklist. IELTS is an English test, so passages, questions, prompts,
 * transcripts, model phrases and the vocabulary words themselves stay English and are not listed here.
 * scripts/translate-exams-hindi.ts ships these in the "ielts" Hindi shard; __tests__/ielts-hindi.test.tsx checks coverage.
 */
export function ieltsGuidance(): string[] {
  const out: string[] = [];
  for (const skill of SKILLS) { const f = FORMAT[skill]; out.push(f.minutes, f.parts, f.questions, f.tests, f.diff); }
  for (const fact of FACTS) out.push(fact.label);
  for (const exercise of LISTENING) out.push(exercise.title, exercise.context, exercise.tip);
  out.push(...LISTENING_TIPS, ...READING_TIPS, ...TEST_DAY);
  for (const set of Object.values(READING)) {
    out.push(set.source);
    // An explanation that is only a quotation from the passage stays in the passage's language.
    for (const why of [...set.tfng.map(item => item.why), set.completion.why]) if (!/^["“]/.test(why)) out.push(why);
  }
  for (const type of Object.values(WRITING)) for (const task of Object.values(type)) out.push(...task.plan);
  for (const item of [...WRITING_CRITERIA, ...SPEAKING_CRITERIA]) out.push(item.name, item.note);
  for (const part of SPEAKING_PART1) out.push(part.topic);
  for (const table of Object.values(RAW_TABLES)) out.push(table.label);
  for (const rows of Object.values(STRATEGIES)) for (const row of rows) out.push(row.type, row.how);
  for (const group of TOPIC_VOCAB) { out.push(group.topic); for (const word of group.words) out.push(word.meaning); }
  for (const group of LINKING) out.push(group.purpose);
  for (const item of MISTAKES) out.push(item.mistake, item.fix);
  for (const week of STUDY_PLAN) out.push(week.week, week.focus, ...week.tasks);
  for (const link of OFFICIAL_LINKS) out.push(link.label);
  for (const topic of IELTS_TOPICS) { for (const [, meaning] of topic.words) out.push(meaning); out.push(...topic.ideas); }
  return [...new Set(out)];
}
