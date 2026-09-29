import { z } from "zod";

/** One term: letters, with hyphens and apostrophes inside rather than around. */
const TERM = /^[a-zA-Z]+(?:['’-][a-zA-Z]+)*$/;

/**
 * Terms a phrase may hold.
 *
 * Six covers the idioms and collocations people look up — "a blessing in
 * disguise", "get the hang of it" — without letting a pasted sentence through
 * as a dictionary query.
 */
export const MAX_PHRASE_TERMS = 6;

/** Whether a query is several words whose combined meaning is being asked for. */
export const isPhrase = (query: string) => query.trim().includes(" ");

/**
 * What may be looked up: one English word, or a phrase of up to six of them.
 *
 * Runs of whitespace are collapsed before the check, so a query pasted with a
 * line break or a double space is the same query as one typed cleanly rather
 * than a rejection the reader cannot see the cause of.
 */
export const wordQuerySchema = z.object({
  word: z.string().trim().min(1).max(80).transform(value => value.replace(/\s+/g, " "))
    .refine(value => {
      const terms = value.split(" ");
      return terms.length <= MAX_PHRASE_TERMS && terms.every(term => TERM.test(term));
    }, `Enter an English word, or a phrase of up to ${MAX_PHRASE_TERMS} words.`),
}).strict();

const relatedWordSchema = z.object({ word: z.string().min(1).max(80), hindi: z.string().max(250) });
export const englishWordSchema = z.object({
  /** The headword, or the whole phrase when several words were looked up. */
  word: z.string().min(1).max(80),
  pronunciation: z.string().max(150),
  meaning: z.string().min(1).max(800),
  hindi: z.string().max(800),
  sentence: z.string().max(800),
  /**
   * The example sentence in Hindi, when the entry has one.
   *
   * Defaults rather than being required: library and dictionary entries carry
   * only the English sentence, and a card in Hindi falls back to it — a saved
   * card from before this field still parses.
   */
  sentenceHindi: z.string().max(800).default(""),
  synonyms: z.array(relatedWordSchema).max(6),
  antonyms: z.array(relatedWordSchema).max(6),
});
export type EnglishWord = z.infer<typeof englishWordSchema>;
export type WordLookup = { entry: EnglishWord; source: "library" | "dictionary" | "ai"; notice?: string };
