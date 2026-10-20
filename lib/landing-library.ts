import "server-only";
import { ENGLISH_EXAM_VOCABULARY } from "@/lib/pro-learn/english-exam-vocabulary";
import { TECHNOLOGY_HANDBOOKS } from "@/lib/pro-learn/technology-handbooks";
import { SEARCH_FIXED_CATALOGUES } from "@/lib/step-by-step/technologies";
import { CATEGORY_LABELS, PREPARATIONS } from "@/lib/study/preparations";
import type { LandingProPreview } from "@/lib/landing-pro-preview";

export type LibraryKind = "technology" | "api" | "course" | "word" | "techy";
/** One row of the landing ledger: what it is, where it opens, a line of detail. */
export type LibraryEntry = { id: string; kind: LibraryKind; title: string; hi?: string; note: string; meta: string };
export type LandingLibrary = {
  entries: LibraryEntry[];
  /** Rows in the full ledger; the landing page ships only the first ones (previewLibrary) and fetches the rest on use. */
  total: number;
  /** True catalogue sizes; the entries are a representative slice of them. */
  counts: Record<LibraryKind, number> & { handbookTopics: number; apiIdentifiers: number; techyQuestions: number };
};

const clip = (value: string, max = 118) => value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
const WORDS_PER_CATEGORY = 3;

/**
 * The real dashboard catalogues, reduced to what the landing page's library
 * ledger needs. Every row is a real entry; only vocabulary is sampled (a few
 * words from each category) because all 2,091 would bloat the page.
 */
export function landingLibrary(pro: LandingProPreview): LandingLibrary {
  const technologies: LibraryEntry[] = [
    ...SEARCH_FIXED_CATALOGUES.map(title => ({ id: `fixed:${title}`, kind: "technology" as const, title, note: "A curated catalogue on the Search page.", meta: "Catalogue" })),
    ...TECHNOLOGY_HANDBOOKS.map(handbook => ({ id: `tech:${handbook.title}`, kind: "technology" as const, title: handbook.title.split(" — ")[0], note: clip(handbook.description), meta: `${handbook.topics.length} topics` })),
  ];
  const api: LibraryEntry[] = pro.api.packages.map(pkg => ({ id: `api:${pkg.id}`, kind: "api", title: pkg.name, note: clip(pkg.sample.slice(0, 6).map(item => item.name).join(" · ")), meta: `${pkg.count} entries` }));
  const courses: LibraryEntry[] = PREPARATIONS.filter(option => option.category !== "technology").map(option => ({
    id: `course:${option.id}`, kind: "course", title: option.label.en, hi: option.label.hi, note: CATEGORY_LABELS[option.category]?.en ?? "Preparation", meta: CATEGORY_LABELS[option.category]?.en ?? "",
  }));
  const seen = new Map<string, number>();
  const words: LibraryEntry[] = ENGLISH_EXAM_VOCABULARY.filter(entry => {
    const taken = seen.get(entry.category) ?? 0;
    seen.set(entry.category, taken + 1);
    return taken < WORDS_PER_CATEGORY;
  }).map(entry => ({ id: `word:${entry.word}`, kind: "word", title: entry.word, hi: entry.hindi?.split(";")[0].trim() || undefined, note: clip(entry.meaning), meta: entry.category }));
  const techy: LibraryEntry[] = pro.techy.topics.map(topic => ({ id: `techy:${topic.id}`, kind: "techy", title: topic.title, note: clip(topic.summary), meta: `${topic.questionCount} questions` }));
  const entries = [...technologies, ...api, ...courses, ...words, ...techy];
  return {
    entries, total: entries.length,
    counts: {
      technology: technologies.length, api: api.length, course: courses.length, word: ENGLISH_EXAM_VOCABULARY.length, techy: techy.length,
      handbookTopics: TECHNOLOGY_HANDBOOKS.reduce((sum, handbook) => sum + handbook.topics.length, 0),
      apiIdentifiers: pro.api.identifierCount, techyQuestions: pro.techy.questionCount,
    },
  };
}

/** Rows the landing ledger shows before a visitor searches or filters; the full list loads from /api/landing/library. */
export const LEDGER_PREVIEW_ROWS = 40;
/**
 * The ledger as the landing page ships it: the first rows only, with the real totals. The full ledger was ~50 KB of
 * page data that most visitors never search.
 */
export function previewLibrary(library: LandingLibrary): LandingLibrary {
  return { ...library, entries: library.entries.slice(0, LEDGER_PREVIEW_ROWS) };
}
