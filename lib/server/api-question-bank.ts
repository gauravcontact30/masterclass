import "server-only";
import type { ApiEntry, ApiPackage } from "@/lib/api-docs";
import { API_DETAILS, type ApiDetail } from "@/lib/api-docs-details";
import type { ObjectiveQuestion, SubjectiveQuestion } from "@/lib/api-learning-schema";
import { officialApiCard } from "./official-content";

/**
 * A package's interview practice, built only from its stored pages: the interview questions they were written with, and
 * questions asked about their verified facts (what it does, key points, use cases, gotchas, return value). A wrong option
 * is always a fact from a different identifier of the same package, so nothing here is invented or generated on open.
 */
export const QUESTIONS_PER_SECTION = 60;

type Fact = { name: string; summary: string; explanation: string; returns: string; keyPoints: string[]; gotchas: string[]; useCases: string[]; authored: { question: string; answer: string; followUp?: string }[]; objective: ObjectiveQuestion[] };
type Practice = { name: string; subjective: SubjectiveQuestion[]; objective: ObjectiveQuestion[] };

const firstSentence = (text: string) => text.replace(/\s+/g, " ").trim().match(/^.+?[.!?](?=\s|$)/)?.[0] ?? text.trim();
const hash = (text: string) => { let h = 0x811c9dc5; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h >>> 0; };
const shortName = (name: string) => name.replace(/\(\)$/, "").split(".").at(-1) ?? name;

function factOf(pkg: ApiPackage, entry: ApiEntry): Fact | null {
  const curated = API_DETAILS[`${pkg.id}:${entry.name}`] as (ApiDetail & { subjective?: Fact["authored"]; objective?: ObjectiveQuestion[] }) | undefined;
  if (curated) return { name: entry.name, summary: curated.description, explanation: "", returns: curated.returns, keyPoints: curated.notes, gotchas: [], useCases: curated.useCases, authored: curated.subjective ?? [], objective: curated.objective ?? [] };
  const card = officialApiCard(pkg.id, entry.name);
  if (!card) return null;
  return { name: entry.name, summary: card.summary, explanation: card.explanation, returns: card.returns, keyPoints: card.keyPoints, gotchas: card.gotchas, useCases: card.useCases.map(item => item.scenario || item.title), authored: card.interview, objective: [] };
}

function subjectiveOf(fact: Fact): SubjectiveQuestion[] {
  const { name } = fact;
  const returns = fact.returns ? `What does it return? ${fact.returns}` : "";
  const named = (question: string) => question.toLowerCase().includes(shortName(name).toLowerCase()) ? question : `${name}: ${question}`;
  return [
    ...fact.authored.map(item => ({ question: named(item.question), answer: item.answer, followUp: item.followUp ?? "" })),
    { question: `What does ${name} do, in your own words?`, answer: [fact.summary, fact.explanation].filter(Boolean).join(" "), followUp: returns },
    ...(fact.useCases.length ? [{ question: `When would you reach for ${name}?`, answer: fact.useCases.join(" "), followUp: "" }] : []),
    ...(fact.keyPoints.length > 1 ? [{ question: `What are the key things to remember about ${name}?`, answer: fact.keyPoints.join(" "), followUp: "" }] : []),
    ...(fact.gotchas.length ? [{ question: `What mistakes do people make with ${name}?`, answer: fact.gotchas.join(" "), followUp: "" }] : []),
  ].filter(item => item.answer.length >= 10);
}

/** An option must not give itself away: "`polars.Series` creates a column" reads "It creates a column". */
function masked(text: string, name: string) {
  const short = shortName(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Only where it is used as an identifier: in backticks, after a dot, or opening the sentence. "calendar month" stays.
  const asCode = new RegExp(`\`[\\w.]*${short}(?:\\(\\))?\`|^(?:[\\w]+\\.)*${short}(?:\\(\\))?(?![\\w.])|\\b\\w+\\.${short}(?:\\(\\))?(?![\\w.])`, "g");
  return text.replace(asCode, (_, at: number) => at === 0 ? "It" : "it");
}

/** Three wrong options from other identifiers: stable per question, never mentioning this identifier or repeating an option. */
function distractors(fact: Fact, correct: string, pool: { from: string; text: string }[]) {
  const name = shortName(fact.name).toLowerCase();
  const candidates = pool.filter(item => item.from !== fact.name && item.text !== correct && !item.text.toLowerCase().includes(name));
  if (candidates.length < 3) return null;
  const chosen: string[] = [];
  for (let at = hash(fact.name + correct), seen = 0; seen < candidates.length && chosen.length < 3; at++, seen++) {
    const text = candidates[(Math.imul(at, 2654435761) >>> 0) % candidates.length].text;
    if (!chosen.includes(text)) chosen.push(text);
  }
  return chosen.length === 3 ? chosen : null;
}

function objectiveFrom(fact: Fact, question: string, correct: string, explanation: string, pool: { from: string; text: string }[]): ObjectiveQuestion | null {
  const shown = masked(correct, fact.name);
  const wrong = shown && distractors(fact, shown, pool);
  if (!wrong) return null;
  const answer = hash(question) % 4;
  const options = [...wrong]; options.splice(answer, 0, shown);
  return { question, options, answer, explanation };
}

function buildPackage(pkg: ApiPackage): Practice[] {
  const facts = pkg.entries.map(entry => factOf(pkg, entry)).filter((fact): fact is Fact => !!fact);
  const pools = {
    summary: facts.map(fact => ({ from: fact.name, text: masked(firstSentence(fact.summary), fact.name) })),
    returns: facts.filter(fact => fact.returns && fact.returns.length <= 160).map(fact => ({ from: fact.name, text: fact.returns })),
    useCases: facts.flatMap(fact => fact.useCases.map(text => ({ from: fact.name, text: masked(text.split(" — ").at(-1) ?? text, fact.name) }))),
    keyPoints: facts.flatMap(fact => fact.keyPoints.map(text => ({ from: fact.name, text: masked(text, fact.name) }))),
  };
  return facts.map(fact => ({
    name: fact.name,
    subjective: subjectiveOf(fact),
    objective: [
      ...fact.objective,
      objectiveFrom(fact, `Which statement describes ${fact.name}?`, firstSentence(fact.summary), fact.explanation || fact.summary, pools.summary),
      fact.useCases[0] ? objectiveFrom(fact, `Which is a typical use of ${fact.name}?`, fact.useCases[0].split(" — ").at(-1) ?? fact.useCases[0], fact.useCases.join(" "), pools.useCases) : null,
      fact.keyPoints[0] ? objectiveFrom(fact, `Which point comes from the ${fact.name} reference?`, fact.keyPoints[0], fact.keyPoints.join(" "), pools.keyPoints) : null,
      fact.returns && fact.returns.length <= 160 ? objectiveFrom(fact, `What does ${fact.name} return?`, fact.returns, fact.summary, pools.returns) : null,
      fact.keyPoints[1] ? objectiveFrom(fact, `Which statement is true of ${fact.name}?`, fact.keyPoints[1], fact.keyPoints.join(" "), pools.keyPoints) : null,
    ].filter((item): item is ObjectiveQuestion => !!item),
  }));
}

const built = new Map<string, Practice[]>();

/** This identifier's questions first, then one at a time from each of the others, so early pages stay varied. */
function take<T extends { question: string }>(practice: Practice[], name: string, pick: (item: Practice) => T[], limit: number) {
  const at = Math.max(0, practice.findIndex(item => item.name === name));
  const order = [...practice.slice(at), ...practice.slice(0, at)];
  const seen = new Set<string>(), result: T[] = [];
  const add = (item: T) => { const key = item.question.toLowerCase(); if (seen.has(key) || result.length >= limit) return; seen.add(key); result.push(item); };
  if (order[0]) pick(order[0]).forEach(add);
  const longest = Math.max(0, ...order.map(item => pick(item).length));
  for (let round = 0; round < longest && result.length < limit; round++) for (const item of order.slice(1)) { const next = pick(item)[round]; if (next) add(next); }
  return result;
}

export function apiQuestionBank(pkg: ApiPackage, entry: ApiEntry, limit = QUESTIONS_PER_SECTION) {
  let practice = built.get(pkg.id);
  if (!practice) { practice = buildPackage(pkg); built.set(pkg.id, practice); }
  return { subjective: take(practice, entry.name, item => item.subjective, limit), objective: take(practice, entry.name, item => item.objective, limit) };
}
