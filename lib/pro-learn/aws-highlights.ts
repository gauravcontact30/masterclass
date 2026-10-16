import { AWS_SERVICE_CATALOG } from "@/lib/generation/guides/aws-service-catalog";
import { AWS_POPULARITY, popularityRank } from "@/lib/generation/guides/aws-popularity";
import type { PreparedExplanation } from "./prepared-explanation";

export type VocabularyWord = {
  word: string;
  /** Spelled-out pronunciation with the stressed syllable capitalised, e.g. "vur-BOHSS". */
  pronunciation?: string;
  meaning: string;
  /** The meaning in Hindi, written in Devanagari. Shown only when the reader asks for it. */
  hindi?: string;
  sentence: string;
  synonyms: string[];
  antonyms: string[];
};

/** Just enough to draw a card and ask a question, with optional vocabulary detail. */
export type AwsHighlight = {
  name: string;
  category: string;
  summary: string;
  /**
   * What is worth knowing about this row beyond its one-line summary.
   *
   * A card shows the first few as its key points and the answer carries them
   * all, so a catalogue can be authored a row at a time without writing a whole
   * prepared explanation for each one. Rows without them fall back to the
   * sentences of their own summary.
   */
  points?: string[];
  /** Where the row is used in practice, and what it is for: "Title — scenario". */
  useCase?: { title: string; scenario: string };
  /** Interview preparation authored on the row: a likely question and its model answer. */
  interview?: { question: string; answer: string }[];
  /**
   * The general form of the command this row is about, for rows that are one.
   *
   * A catalogue of commands owes the reader the shape of every invocation, not
   * just the one the walkthrough happened to use — so the card leads with this
   * and the answer opens on it.
   */
  syntax?: readonly string[];
  /** A worked example for this row, one entry per file of the editor. */
  code?: { path: string; code: string; note?: string }[];
  vocabulary?: VocabularyWord;
  prepared?: PreparedExplanation;
};
/** A tab: the category and how many services sit under it. */
export type AwsCategory = { name: string; count: number };

/** The catalog's own first sentence, which is all a card has room for. */
function oneLine(summary: string) {
  const sentence = summary.split(/(?<=\.)\s/)[0]?.trim() ?? summary.trim();
  return sentence.length > 150 ? `${sentence.slice(0, 147).trimEnd()}…` : sentence;
}

/**
 * The AWS service catalog, trimmed for the search page's browser.
 *
 * Ordering is `aws-popularity.ts`'s curated teaching order flattened across
 * categories, then everything unranked alphabetically behind it — so the "All"
 * tab opens on the services a learner actually meets first, while every
 * category tab still holds its full membership.
 *
 * This runs on the server and returns trimmed entries on purpose: the catalog
 * behind it carries per-service bullet lists and source URLs that no card
 * shows. Trimming is what makes shipping the whole directory affordable, and
 * shipping the whole directory is what makes the category tabs honest — seven
 * of the twenty-one categories have no ranked service at all, so a popularity
 * cut would leave those tabs empty.
 */
/**
 * The ordered rows, derived once.
 *
 * Held rather than rebuilt because the server's prepared-catalog cache keys off
 * row identity: returning freshly allocated objects on every call meant that
 * cache never hit, and all 438 explanations were re-derived on each request to
 * the search page. Callers still get their own array — only the rows inside it
 * are shared, and nothing mutates them.
 */
let ordered: AwsHighlight[] | undefined;

export function awsHighlights(limit = Number.MAX_SAFE_INTEGER): AwsHighlight[] {
  if (!ordered) {
    const ranked = new Set(AWS_POPULARITY);
    ordered = [...AWS_SERVICE_CATALOG]
      .sort((a, b) =>
        popularityRank(a.name) - popularityRank(b.name)
        || Number(ranked.has(b.name)) - Number(ranked.has(a.name))
        || a.name.localeCompare(b.name))
      .map(service => ({ name: service.name, category: service.category, summary: oneLine(service.summary) }));
  }
  return ordered.slice(0, limit);
}

/**
 * The categories present in a set of services, largest first, so the tab row
 * leads with the categories most worth opening. Derived from the services
 * themselves rather than from the category file: a tab nobody can fill is a
 * dead end, and this way the two can never drift apart.
 */
export function awsCategories(services: AwsHighlight[]): AwsCategory[] {
  const counts = new Map<string, number>();
  for (const service of services) counts.set(service.category, (counts.get(service.category) ?? 0) + 1);
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * Only the services in the curated popularity list (`aws-popularity.ts`), in that order: the Search page's
 * "Popular AWS services" catalogue. The long tail of niche services stays in `awsHighlights()` for the
 * generators, but a learner browsing the page sees only the services worth learning first.
 */
export function popularAwsHighlights(): AwsHighlight[] {
  const ranked = new Set(AWS_POPULARITY);
  return awsHighlights().filter(service => ranked.has(service.name));
}
