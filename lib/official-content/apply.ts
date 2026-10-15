/**
 * Folding a verified official card into the content each page already shows.
 *
 * API Docs: the card replaces the catalogue summary as the reference page's
 * base, and its official URL becomes the page's source. Search: the card adds to
 * the prepared answer rather than replacing it, because hand-written points and
 * walkthroughs on a row (Git's, for one) are still the best thing on it. Either
 * way the same idea is said once: a line whose words were already said by an
 * earlier one (lib/pro-learn/dedupe-answer) is left out. Neither function
 * mutates its input: prepared answers are cached and shared.
 */
import type { ApiDetail } from "@/lib/api-docs-details";
import type { CodeLanguage } from "@/lib/code-highlight";
import { dedupeAnswer, sameIdea } from "@/lib/pro-learn/dedupe-answer";
import type { PreparedExplanation } from "@/lib/pro-learn/prepared-explanation";
import type { OfficialCard } from "./card";

const LANGUAGES = new Set<CodeLanguage>(["typescript", "tsx", "javascript", "jsx", "python", "json", "yaml", "bash", "css", "html", "markdown", "text", "hcl", "dockerfile"]);
const STEP_CODE_LIMIT = 1400;
const ALIASES: Record<string, CodeLanguage> = { ts: "typescript", js: "javascript", py: "python", sh: "bash", shell: "bash", yml: "yaml", terraform: "hcl", md: "markdown" };

export function codeLanguage(language: string, fallback: CodeLanguage): CodeLanguage {
  const key = language.trim().toLowerCase();
  if (LANGUAGES.has(key as CodeLanguage)) return key as CodeLanguage;
  return ALIASES[key] ?? fallback;
}

/** Keeps the first of any items that state the same idea. */
const distinct = <T,>(items: T[], text: (item: T) => string = String) => {
  const kept: T[] = [];
  for (const item of items) if (text(item).trim() && !kept.some(other => sameIdea(text(other), text(item)))) kept.push(item);
  return kept;
};
const byUrl = <T extends { url: string }>(items: T[]) => items.filter((item, index) => items.findIndex(other => other.url === item.url) === index);

export function officialApiDetail(card: OfficialCard, base: ApiDetail): ApiDetail & { descriptionLong: string; since: string; subjective?: OfficialCard["interview"] } {
  const description = card.summary || base.description;
  return {
    packageName: base.packageName,
    description,
    // The long description repeats the summary often enough to check.
    descriptionLong: sameIdea(card.explanation, description) ? "" : card.explanation,
    since: card.since,
    signature: card.syntax || base.signature,
    parameters: card.parameters.length ? card.parameters : base.parameters,
    returns: card.returns || base.returns,
    notes: distinct([...card.keyPoints, ...card.gotchas]).filter(note => !sameIdea(note, description)),
    useCases: distinct(card.useCases.map(useCase => useCase.scenario ? `${useCase.title} — ${useCase.scenario}` : useCase.title)),
    code: card.example.code || base.code,
    language: card.example.code ? codeLanguage(card.example.language, base.language) : base.language,
    source: card.sourceUrl,
    related: distinct([...card.related, ...base.related], name => name.toLowerCase()),
    ...(card.interview.length ? { subjective: distinct(card.interview, item => item.question) } : {}),
  };
}

export function withOfficialCard(prepared: PreparedExplanation, card: OfficialCard): PreparedExplanation {
  const answer = prepared.answer;
  const steps = [...answer.steps];
  // A guided walkthrough's steps are its script, so official context goes after them.
  if (card.explanation) steps[prepared.walkthrough ? "push" : "unshift"]({ title: "How it works", detail: card.explanation, code: "" });
  // The modal's step code holds 1,400 characters; longer code stays on API Docs only.
  if (card.syntax && card.syntax.length <= STEP_CODE_LIMIT) steps.push({ title: "Syntax", detail: card.returns ? `Returns: ${card.returns}` : "The shape documented on the official page.", code: card.syntax });
  if (card.example.code && card.example.code.length <= STEP_CODE_LIMIT) steps.push({ title: card.example.title || "Example", detail: card.example.explanation || card.summary, code: card.example.code });
  const interview = card.interview.map(item => ({ name: item.question, summary: item.answer, details: item.followUp ? [`Follow-up: ${item.followUp}`] : [], keyPoints: [] }));
  return {
    ...prepared,
    answer: dedupeAnswer({
      ...answer,
      summary: answer.summary || card.summary,
      steps: distinct(steps, step => `${step.title} ${step.detail}`).slice(0, 8),
      keyPoints: distinct([...answer.keyPoints, ...card.keyPoints]).slice(0, 12),
      caveats: distinct([...answer.caveats, ...card.gotchas], item => typeof item === "string" ? item : item.text).slice(0, 4),
      useCases: distinct([...answer.useCases, ...card.useCases.map(useCase => ({ ...useCase, example: "" }))], item => `${item.title} — ${item.scenario}`).slice(0, 5),
      subjects: distinct([...answer.subjects, ...interview], item => item.name).slice(0, 8),
    }),
    sources: byUrl([{ title: card.sourceTitle || "Official documentation", url: card.sourceUrl }, ...(prepared.sources ?? [])]),
  };
}
