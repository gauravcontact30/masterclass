import type { TechnologyHandbook } from "../technology-handbooks";
import { topics } from "../automation-handbooks/shared";
import { summaryExplanation } from "../prepared-explanation";

export type HandbookContext = { mechanism: string; example: string; pitfall: string };

export function defineHandbook(title: string, description: string, url: string, context: HandbookContext,
  groups: Record<string, readonly (readonly [string, string, string[]?])[]>): TechnologyHandbook {
  const sources = [{ title: `${title} official documentation`, url, reviewedAt: "2026-09-20" }];
  const entries = topics(groups).map(topic => {
    const prepared = summaryExplanation(topic.name, topic.summary, topic.category);
    if (topic.points?.length) prepared.answer.keyPoints = [...topic.points];
    prepared.sources = sources;
    prepared.answer.steps.push({ title: `${title}: how the pieces fit`, detail: context.mechanism, code: "" },
      { title: "Applied walkthrough", detail: context.example, code: "" });
    // The pitfall is said once, under "Watch out for" — not again as a question.
    prepared.answer.caveats = [context.pitfall];
    return { ...topic, prepared };
  });
  const counts = new Map<string, number>();
  entries.forEach(topic => counts.set(topic.category, (counts.get(topic.category) ?? 0) + 1));
  return { title, description, questionPrefix: title, topics: entries, categories: [...counts].map(([name, count]) => ({ name, count })), sources };
}
