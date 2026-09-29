import type { TechnologyEssentials } from "./types";
import { WEB_ESSENTIALS } from "./web";
import { TESTING_ESSENTIALS } from "./testing";
import { DATA_ESSENTIALS } from "./data";
import { PLATFORM_ESSENTIALS } from "./platform";
import { AI_ESSENTIALS } from "./ai";

export type { TechnologyEssentials, TopicUseCase } from "./types";
export type { IndustryProblem, TechnologyIndustries } from "./industries";
import type { TopicUseCase } from "./types";
import { USE_CASES } from "./use-cases";
import { INDUSTRY_IMPACT, type IndustryProblem } from "./industries";
export { INDUSTRY_IMPACT } from "./industries";

export const TECHNOLOGY_ESSENTIALS: TechnologyEssentials[] = [
  ...WEB_ESSENTIALS, ...TESTING_ESSENTIALS, ...DATA_ESSENTIALS, ...PLATFORM_ESSENTIALS, ...AI_ESSENTIALS,
];

const useCaseIndex = new Map<string, (typeof USE_CASES)[number]>();
for (const entry of USE_CASES) for (const technology of entry.technologies) useCaseIndex.set(technology, entry);

const industryIndex = new Map<string, (typeof INDUSTRY_IMPACT)[number]>();
for (const entry of INDUSTRY_IMPACT) for (const technology of entry.technologies) industryIndex.set(technology, entry);

const byTechnology = new Map<string, TechnologyEssentials>();
for (const entry of TECHNOLOGY_ESSENTIALS) for (const technology of entry.technologies) byTechnology.set(technology, entry);

/**
 * The extra key points for one opened topic: the technology's own, plus the
 * points for the category the topic sits in.
 *
 * Category points lead, because they are the narrower statement — a reader who
 * opened a Prisma migration topic wants the migration warning before the
 * client-lifecycle one. Returns an empty list for a technology with no authored
 * entry, so the answer simply keeps the points it already had.
 */
export function essentialPoints(technology: string, category: string): string[] {
  const entry = byTechnology.get(technology);
  if (!entry) return [];
  return [...new Set([...(entry.categories?.[category] ?? []), ...entry.points])];
}

/**
 * The real use behind one topic: its category's, or its technology's.
 *
 * A card shows this when the row itself carries no authored use case, so the
 * reader still gets a real situation and the problem it solves rather than a
 * line that only repeats where the topic sits.
 */
export function topicUseCase(technology: string, category: string): TopicUseCase | undefined {
  const entry = useCaseIndex.get(technology);
  return entry?.categoryUseCases?.[category] ?? entry?.useCase;
}

/**
 * Every real use a card can show for one topic, narrowest first.
 *
 * The category's own use leads when one is written for it, then the
 * technology's, then the rest. A card takes the first couple; the answer shows
 * what an opened topic carries in full.
 */
export function topicUseCases(technology: string, category: string): TopicUseCase[] {
  const entry = useCaseIndex.get(technology);
  if (!entry) return [];
  const narrowest = entry.categoryUseCases?.[category];
  return [...(narrowest ? [narrowest] : []), entry.useCase, ...(entry.alsoUsedFor ?? [])];
}

/**
 * The real problems this topic's technology solves, by industry.
 *
 * A card shows these under its use cases, so a reader can see who pays for the
 * work before they open the topic. The narrowest authored list wins: the
 * category's when one is written for it, otherwise the technology's. A
 * technology with no entry returns nothing and its cards simply drop the block
 * rather than inventing a sector.
 */
export function industryProblems(technology: string, category: string): IndustryProblem[] {
  const entry = industryIndex.get(technology);
  return entry?.categoryIndustries?.[category] ?? entry?.industries ?? [];
}

/** Every technology with authored industry problems, for tests and for review. */
export const INDUSTRY_TECHNOLOGIES = [...industryIndex.keys()];

/** Every technology with authored key points, for tests and for review. */
export const ESSENTIAL_TECHNOLOGIES = [...byTechnology.keys()];
