/**
 * Pronunciation and Hindi for every synonym and antonym on the landing page's Word power cards.
 *
 * Headwords already carry both (lib/pro-learn/english-exam-vocabulary.ts) and many related words have a
 * hand-written Hindi gloss (english-related-hindi.ts, english-vocabulary-hindi.ts); those always win.
 * This fills only what is missing, in batches, each word briefed with the headword it belongs to so the
 * Hindi follows the right sense. Results are kept in content/landing/related-words.json, which
 * scripts/build-landing-daily.ts merges.
 *
 *   npm run landing:words        fill what is missing, then rebuild the pool
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { ENGLISH_EXAM_VOCABULARY } from "../lib/pro-learn/english-exam-vocabulary";
import { RELATED_HINDI } from "../lib/pro-learn/english-related-hindi";
import { VOCABULARY_HINDI } from "../lib/pro-learn/english-vocabulary-hindi";

const MODEL = process.env.LANDING_ENRICH_MODEL || "anthropic/claude-sonnet-5-5";
export const RELATED_WORDS = join("content", "landing", "related-words.json");
const POOL = join("content", "landing", "daily-pool.json");
const BATCH = 40;
const client = new Anthropic({ apiKey: process.env.AI_GATEWAY_API_KEY, baseURL: "https://ai-gateway.vercel.sh", timeout: 120_000, maxRetries: 3 });

const Schema = z.object({ words: z.array(z.object({
  word: z.string(),
  pronunciation: z.string().describe("Spelled-out pronunciation, syllables joined by hyphens, stressed syllable in capitals, e.g. ar-TIK-yuh-luht, suhk-SINGKT, KAN-did."),
  hindi: z.string().describe("A short Hindi meaning in Devanagari, 1-5 words, for the sense used with the given headword."),
})) });

const SYSTEM = `You annotate English vocabulary for Indian learners.
For each word give (1) a plain-English respelling in the same style as these examples — ar-TIK-yuh-luht, suhk-SINGKT, KAN-did, vur-BOHSS, KOH-juhnt, EL-uh-kwuhnt — with the stressed syllable in capitals, and (2) a short, natural Hindi meaning in Devanagari for the sense in which the word relates to the given headword (as a synonym or antonym of it).
For a multi-word phrase, respell each word. Return every word exactly as given, in the same order.`;

type Entry = { pronunciation: string; hindi: string };

async function main() {
  const pool = JSON.parse(readFileSync(POOL, "utf8")) as { words: { word: string; meaning: string; synonyms: (string | { word: string })[]; antonyms: (string | { word: string })[] }[] };
  const saved: Record<string, Entry> = existsSync(RELATED_WORDS) ? JSON.parse(readFileSync(RELATED_WORDS, "utf8")) : {};
  const headwords = new Map(ENGLISH_EXAM_VOCABULARY.map(entry => [entry.word.toLowerCase(), entry]));
  const glossed = (word: string) => !!(RELATED_HINDI[word] || VOCABULARY_HINDI[word] || headwords.get(word)?.hindi);
  const respelled = (word: string) => !!headwords.get(word)?.pronunciation;

  // Each missing word once, with the first headword it appears under as its sense.
  const todo = new Map<string, { headword: string; meaning: string; relation: string }>();
  for (const entry of pool.words) for (const [relation, list] of [["synonym", entry.synonyms], ["antonym", entry.antonyms]] as const) for (const item of list) {
    const word = (typeof item === "string" ? item : item.word).toLowerCase();
    if (saved[word] || todo.has(word) || (glossed(word) && respelled(word))) continue;
    todo.set(word, { headword: entry.word, meaning: entry.meaning, relation });
  }
  const words = [...todo.entries()];
  console.log(`${words.length} related words to annotate with ${MODEL}, ${BATCH} a request.`);
  const batches = Array.from({ length: Math.ceil(words.length / BATCH) }, (_, i) => words.slice(i * BATCH, (i + 1) * BATCH));
  let next = 0, done = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (next < batches.length) {
      const batch = batches[next++];
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const response = await client.messages.parse({
            model: MODEL, max_tokens: 6000, system: SYSTEM, output_config: { format: zodOutputFormat(Schema) },
            messages: [{ role: "user", content: batch.map(([word, ctx]) => `${word} — ${ctx.relation} of "${ctx.headword}" (${ctx.meaning})`).join("\n") }],
          });
          for (const item of response.parsed_output?.words ?? []) {
            const word = item.word.trim().toLowerCase();
            if (todo.has(word) && item.pronunciation && /[ऀ-ॿ]/.test(item.hindi)) saved[word] = { pronunciation: item.pronunciation.trim(), hindi: item.hindi.trim() };
          }
          done += batch.length; console.log(`  ${done}/${words.length}`);
          writeFileSync(RELATED_WORDS, JSON.stringify(saved, null, 1) + "\n");
          break;
        } catch (error) { console.error(`! batch ${next}: ${(error as Error).message.slice(0, 160)}`); }
      }
    }
  }));
  writeFileSync(RELATED_WORDS, JSON.stringify(saved, null, 1) + "\n");
  console.log(`Saved ${Object.keys(saved).length} annotations to ${RELATED_WORDS}.`);
}

main().catch(error => { console.error(error); process.exit(1); });
