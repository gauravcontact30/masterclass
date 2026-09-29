import { tokens } from "./guides";
import type { StepGuide } from "./types";

/**
 * The fixed catalogues the Search page's "Explore topics" strip opens with,
 * before its alphabetical technology handbooks. Kept in the same order so the
 * two strips list technologies identically.
 */
export const SEARCH_FIXED_CATALOGUES = ["Popular AWS services", "AI terms worth knowing", "Python handbook"] as const;

// Words that describe a catalogue rather than name its technology.
const GENERIC = new Set(["handbook", "popular", "services", "service", "worth", "knowing", "terms", "packages", "package", "apis",
  "hooks", "solutions", "integration", "libraries", "library", "user", "management", "manager", "validation", "caching",
  "environment", "technologies", "modern", "design", "system", "gateway", "orm"]);

/**
 * The words that identify a technology in a catalogue title: the part before
 * the dash ("Docker", "Next.js 16+"), minus descriptive and numeric words. So
 * "Next.js 16+ — Routing, Rendering & Caching" is ["next.js"].
 */
export function technologyTerms(title: string) {
  const name = title.split(/\s[—–-]\s/)[0];
  const terms = tokens(name).filter(word => !GENERIC.has(word) && !/^\d/.test(word));
  // A title made only of generic words ("System Design") names itself.
  return terms.length ? terms : tokens(name);
}

/** Whether a card is about a catalogue's technology: whole-word matches on its question, category and tags. */
export function guideMatchesTechnology(question: string, guide: StepGuide | undefined, title: string) {
  const words = new Set(tokens([question, guide?.category, ...(guide?.tags ?? [])].join(" ")));
  return technologyTerms(title).some(term => words.has(term));
}
