/**
 * Gives every card in content/landing/daily-pool.json its own use cases and industry problems.
 *
 * The library writes industry problems per technology (every LangGraph topic shares the same two) and some
 * catalogues share use cases too, so the landing cards repeated each other. This writes, for each card, two
 * industry problems specific to that topic, and two use cases where the card's own are shared with another
 * card. Every line must be unique across the whole pool; a duplicate is rejected and asked for again.
 *
 * Results are kept in content/landing/daily-enrichment.json (by card id), which scripts/build-landing-daily.ts
 * merges on every rebuild, so cards are only written once.
 *
 *   npm run landing:enrich              write what is missing, then rebuild the pool
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { DailyPool, PoolCard } from "../lib/landing-daily-types";

const MODEL = process.env.LANDING_ENRICH_MODEL || "anthropic/claude-sonnet-5-5";
const POOL = join("content", "landing", "daily-pool.json");
export const ENRICHMENT = join("content", "landing", "daily-enrichment.json");
const flag = (name: string) => { const at = process.argv.indexOf(`--${name}`); return at === -1 ? undefined : process.argv[at + 1]; };
const concurrency = Math.max(1, Number(flag("concurrency")) || 6);
const limit = Number(flag("limit") ?? Infinity);

const client = new Anthropic({ apiKey: process.env.AI_GATEWAY_API_KEY, baseURL: "https://ai-gateway.vercel.sh", timeout: 120_000, maxRetries: 3 });

const Schema = z.object({
  useCases: z.array(z.string()).describe("Two concrete use cases for this exact topic, each 'Short title — one-sentence scenario', 70-130 characters."),
  industries: z.array(z.object({
    industry: z.string().describe("A specific industry or sector, 1-3 words."),
    problem: z.string().describe("The real problem this exact topic solves there, one sentence, 60-120 characters."),
  })).describe("Two different industries."),
});
type Enrichment = { useCases?: string[]; industries: { industry: string; problem: string }[] };

const SYSTEM = `You write the "Real use cases" and "Real problems it solves, by industry" blocks of a learning card for software engineers.
Be specific to the exact topic on the card, not to its technology in general: a reader should be able to tell which card a line came from.
Use realistic, concrete situations (name the kind of system, data or workflow). No marketing language, no invented statistics, no brand claims.
Each line must be different in substance from every line listed under "Already used" — not a rephrasing of one.
The two industries must be different from each other.`;

const norm = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

async function write(card: PoolCard, needUses: boolean, used: string[], retry?: string): Promise<Enrichment> {
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 1500,
    system: SYSTEM,
    output_config: { format: zodOutputFormat(Schema) },
    messages: [{ role: "user", content: [
      `Technology: ${card.tag}`, `Topic: ${card.title}`, `Category: ${card.category}`, `Definition: ${card.definition}`,
      `Key points:\n- ${card.points.join("\n- ")}`,
      needUses ? "" : `Its use cases (already written; keep industries consistent with them):\n- ${card.useCases.join("\n- ")}`,
      used.length ? `Already used on other cards (do not repeat or rephrase):\n- ${used.slice(-60).join("\n- ")}` : "",
      retry ? `Your previous answer repeated an existing line: ${retry}. Write different ones.` : "",
    ].filter(Boolean).join("\n\n") }],
  });
  const out = response.parsed_output;
  if (!out || out.useCases.length < 2 || out.industries.length < 2) throw new Error(`incomplete answer for ${card.title}`);
  return { ...(needUses ? { useCases: out.useCases.slice(0, 2) } : {}), industries: out.industries.slice(0, 2) };
}

async function main() {
  const pool = JSON.parse(readFileSync(POOL, "utf8")) as DailyPool;
  const saved: Record<string, Enrichment> = existsSync(ENRICHMENT) ? JSON.parse(readFileSync(ENRICHMENT, "utf8")) : {};
  const cards = pool.groups.flatMap(group => group.cards);

  // A card's own use cases stand when no other card in the pool carries the same line.
  const useCount = new Map<string, number>();
  for (const card of cards) for (const use of card.useCases) useCount.set(norm(use), (useCount.get(norm(use)) ?? 0) + 1);
  const ownUsesUnique = (card: PoolCard) => card.useCases.length >= 2 && card.useCases.every(use => useCount.get(norm(use)) === 1);

  // Every line already on a card (hand-written, kept or previously written) is taken.
  const taken = new Set<string>();
  const byTag = new Map<string, string[]>();
  const remember = (tag: string, line: string) => { taken.add(norm(line)); byTag.set(tag, [...(byTag.get(tag) ?? []), line]); };
  for (const card of cards) {
    const done = saved[card.id];
    if (card.id.startsWith("pulse--") || done) {
      for (const use of done?.useCases ?? (ownUsesUnique(card) || card.id.startsWith("pulse--") ? card.useCases : [])) remember(card.tag, use);
      for (const entry of done?.industries ?? (card.id.startsWith("pulse--") ? card.industries : [])) remember(card.tag, `${entry.industry}: ${entry.problem}`);
    } else if (ownUsesUnique(card)) for (const use of card.useCases) remember(card.tag, use);
  }

  const todo = cards.filter(card => !card.id.startsWith("pulse--") && !saved[card.id]).slice(0, limit);
  console.log(`${cards.length} cards; ${todo.length} to write with ${MODEL}, ${concurrency} at a time.`);
  let next = 0, written = 0, failed = 0;
  const persist = () => writeFileSync(ENRICHMENT, JSON.stringify(saved, null, 1) + "\n");
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (next < todo.length) {
      const card = todo[next++];
      const needUses = !ownUsesUnique(card);
      let clash: string | undefined;
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const result = await write(card, needUses, byTag.get(card.tag) ?? [], clash);
          const lines = [...(result.useCases ?? []), ...result.industries.map(entry => `${entry.industry}: ${entry.problem}`)];
          clash = lines.find(line => taken.has(norm(line))) ?? (norm(result.industries[0].industry) === norm(result.industries[1].industry) ? "the same industry twice" : undefined);
          if (clash) continue;
          for (const line of lines) remember(card.tag, line);
          saved[card.id] = result; written++;
          if (written % 20 === 0) { persist(); console.log(`  ${written}/${todo.length}`); }
          break;
        } catch (error) { console.error(`! ${card.tag} › ${card.title}: ${(error as Error).message.slice(0, 160)}`); }
      }
      if (!saved[card.id]) failed++;
    }
  }));
  persist();
  console.log(`Done: ${written} written, ${failed} failed. Saved ${ENRICHMENT}.`);
}

main().catch(error => { console.error(error); process.exit(1); });
