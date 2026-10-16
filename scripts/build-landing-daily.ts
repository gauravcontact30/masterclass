/**
 * Builds content/landing/daily-pool.json: the cards the landing page's "AI & agentic pulse" and "Word power"
 * carousels rotate through, one new set per day (lib/server/landing-daily.ts picks the day's cards).
 *
 * Every card comes from content the app already publishes, so nothing here is written fresh:
 *  - topic cards from the Search handbooks, AI terms, the Python handbook and the popular AWS services,
 *    preferring the evidence-verified official card (content/official/search) and its per-topic source link;
 *  - the hand-written cards in lib/landing-ai-pulse.ts (including the "X vs. Y" comparisons);
 *  - vocabulary words from lib/pro-learn/english-exam-vocabulary.ts.
 * Only cards whose picture is actually published make the pool (each picture URL is checked).
 *
 *   npm run landing:daily            rebuild after new pictures or official cards land
 */
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { TECHNOLOGY_HANDBOOKS } from "../lib/pro-learn/technology-handbooks";
import { aiTerms } from "../lib/pro-learn/ai-glossary";
import { pythonTopics } from "../lib/pro-learn/python-handbook";
import { awsHighlights } from "../lib/pro-learn/aws-highlights";
import { ENGLISH_EXAM_VOCABULARY } from "../lib/pro-learn/english-exam-vocabulary";
import { AI_PULSE } from "../lib/landing-ai-pulse";
import { learningImageUrl } from "../lib/learning-image";
import { awsServiceImageUrl } from "../lib/aws-service-image";
import { vocabularyImageUrl } from "../lib/vocabulary-image";
import { officialSlug, searchCardKey } from "../lib/official-content/card";
import { RELATED_HINDI } from "../lib/pro-learn/english-related-hindi";
import { VOCABULARY_HINDI } from "../lib/pro-learn/english-vocabulary-hindi";
import { essentialPoints, industryProblems, topicUseCases } from "../lib/pro-learn/essentials";
import type { DailyPool, PoolCard, PoolImage } from "../lib/landing-daily-types";

/** Most cards kept per technology: enough for weeks of rotation without bloating the server bundle. */
const PER_GROUP = 45;
/** Topics left out for want of a picture, as the image generator labels them ("Catalogue: Topic"). */
const waiting: string[] = [];

type Topic = { name: string; category: string; summary: string; points?: string[]; useCase?: { title: string; scenario: string }; industries?: { industry: string; problem: string }[]; vocabulary?: unknown; prepared?: { answer?: { keyPoints?: string[]; useCases?: { title: string; scenario: string }[]; industries?: { industry: string; problem: string }[] } } };
type Source = { catalogue: string; topics: Topic[] };
type Group = { tag: string; docs: { label: string; href: string }; sources: () => Source[]; aws?: boolean };

const books = (match: (title: string) => boolean): Source[] => TECHNOLOGY_HANDBOOKS.filter(book => match(book.title)).map(book => ({ catalogue: book.title, topics: book.topics as Topic[] }));
const titled = (title: string) => books(t => t === title);
const starts = (prefix: string) => books(t => t.startsWith(prefix));

const GROUPS: Group[] = [
  { tag: "Agentic AI", docs: { label: "Anthropic: Building effective agents", href: "https://www.anthropic.com/engineering/building-effective-agents" }, sources: () => [...titled("Agentic AI"), { catalogue: "AI terms", topics: aiTerms() as Topic[] }] },
  { tag: "LangChain", docs: { label: "LangChain docs", href: "https://docs.langchain.com/oss/python/langchain/overview" }, sources: () => titled("LangChain") },
  { tag: "LangGraph", docs: { label: "LangGraph docs", href: "https://docs.langchain.com/oss/python/langgraph/overview" }, sources: () => titled("LangGraph") },
  { tag: "LangSmith", docs: { label: "LangSmith docs", href: "https://docs.langchain.com/langsmith/home" }, sources: () => titled("LangSmith") },
  { tag: "LangFlow", docs: { label: "Langflow docs", href: "https://docs.langflow.org" }, sources: () => titled("LangFlow") },
  { tag: "Next.js 16+", docs: { label: "Next.js docs", href: "https://nextjs.org/docs" }, sources: () => starts("Next.js 16+") },
  { tag: "React 19+", docs: { label: "React reference", href: "https://react.dev/reference/react" }, sources: () => starts("React 19+") },
  { tag: "AWS", docs: { label: "AWS documentation", href: "https://docs.aws.amazon.com" }, sources: () => [{ catalogue: "AWS", topics: awsHighlights(120) as Topic[] }], aws: true },
  { tag: "Automation · n8n", docs: { label: "n8n docs", href: "https://docs.n8n.io" }, sources: () => titled("n8n") },
  { tag: "Python", docs: { label: "Python docs", href: "https://docs.python.org/3/" }, sources: () => [{ catalogue: "Python", topics: pythonTopics() as Topic[] }] },
  { tag: "Playwright", docs: { label: "Playwright docs", href: "https://playwright.dev/docs/intro" }, sources: () => starts("Playwright") },
  { tag: "Cypress", docs: { label: "Cypress docs", href: "https://docs.cypress.io" }, sources: () => starts("Cypress") },
  { tag: "GitHub Actions", docs: { label: "GitHub Actions docs", href: "https://docs.github.com/en/actions" }, sources: () => titled("GitHub Actions") },
  { tag: "System Design", docs: { label: "System Design Primer", href: "https://github.com/donnemartin/system-design-primer" }, sources: () => titled("System Design") },
  { tag: "Redis", docs: { label: "Redis docs", href: "https://redis.io/docs/latest/" }, sources: () => titled("Redis caching solutions") },
  { tag: "Inngest", docs: { label: "Inngest docs", href: "https://www.inngest.com/docs" }, sources: () => titled("Inngest services") },
];

const official = new Map<string, Record<string, { sourceUrl?: string; sourceTitle?: string; summary?: string; keyPoints?: string[]; useCases?: { title: string; scenario: string }[] }>>();
function officialCard(catalogue: string, topic: Topic) {
  if (!official.has(catalogue)) {
    const path = join("content", "official", "search", `${officialSlug(catalogue)}.json`);
    official.set(catalogue, existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {});
  }
  return official.get(catalogue)![searchCardKey(topic.category, topic.name)];
}

const firstSentence = (text: string) => (text.split(/(?<=[.!?])\s+/)[0] ?? text).trim();
const useLine = (use: { title: string; scenario: string }) => use.scenario ? `${use.title} — ${use.scenario}` : use.title;
/** A line the source cut short ("…" or "..." at the end) is never shown: a card shows only whole sentences. */
const whole = (line: string) => !/(…|\.\.\.)\s*$/.test(line.trim());
const unique = (lines: string[]) => [...new Set(lines.map(line => line.trim()).filter(line => line && whole(line)))];

function card(group: Group, source: Source, topic: Topic): (PoolCard & { url: string | null; verified: boolean }) | null {
  const verified = officialCard(source.catalogue, topic);
  const answer = topic.prepared?.answer;
  // Rows without authored points (the AWS catalogue) fall back to their own summary's later sentences, as the Search cards do.
  const sentences = topic.summary.split(/(?<=[.!?])\s+/).slice(1);
  const points = unique(verified?.keyPoints?.length ? verified.keyPoints : [...(topic.points ?? []), ...(answer?.keyPoints ?? []), ...sentences, ...essentialPoints(source.catalogue, topic.category)]).slice(0, 3);
  if (points.length < 3) return null;
  const definition = verified?.summary ? firstSentence(verified.summary) : firstSentence(topic.summary);
  if (!whole(definition)) return null;
  const image: PoolImage = group.aws ? { kind: "aws", name: topic.name } : { kind: "topics", parts: [source.catalogue, topic.name] };
  return {
    id: `${officialSlug(group.tag)}--${officialSlug(source.catalogue)}--${officialSlug(topic.name)}`,
    tag: group.tag,
    title: topic.name,
    category: topic.category,
    definition,
    points,
    // Rows without their own use cases or industry problems take their technology's, as the Search cards and answers do.
    useCases: unique((verified?.useCases?.length ? verified.useCases : [topic.useCase, ...(answer?.useCases ?? []), ...topicUseCases(source.catalogue, topic.category)].filter((use): use is { title: string; scenario: string } => !!use?.title)).map(useLine)).slice(0, 2),
    industries: [...(topic.industries ?? []), ...(answer?.industries ?? []), ...industryProblems(source.catalogue, topic.category)].slice(0, 2),
    source: verified?.sourceUrl ? { label: verified.sourceTitle || group.docs.label, href: verified.sourceUrl } : group.docs,
    image,
    url: group.aws ? awsServiceImageUrl(topic.name) : learningImageUrl("topics", [source.catalogue, topic.name]),
    verified: !!verified?.sourceUrl,
  };
}

/** Every card fills the same blocks, so cards in a row match in height without empty space. */
function complete(card: PoolCard) {
  return card.points.length >= 3 && card.useCases.length >= 1 && card.industries.length >= 1;
}

async function published(urls: (string | null)[]): Promise<boolean[]> {
  const out: boolean[] = new Array(urls.length).fill(false);
  let next = 0;
  await Promise.all(Array.from({ length: 16 }, async () => {
    while (next < urls.length) {
      const i = next++; const url = urls[i]; if (!url) continue;
      for (let attempt = 0; attempt < 3; attempt++) {
        try { out[i] = (await fetch(url, { method: "HEAD" })).ok; break; } catch { /* retry */ }
      }
    }
  }));
  return out;
}

/** A stable shuffle, so a rebuild with the same content keeps the same order. */
function seeded<T>(items: T[], seed: string): T[] {
  let h = 2166136261; for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const rand = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1_000_000) / 1_000_000; };
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}

async function main() {
  const groups: DailyPool["groups"] = [];
  for (const group of GROUPS) {
    const seen = new Set<string>();
    const candidates = group.sources().flatMap(source => source.topics.filter(topic => !topic.vocabulary).map(topic => card(group, source, topic))).filter((c): c is NonNullable<typeof c> => !!c && complete(c) && !seen.has(c.title) && !!seen.add(c.title));
    const live = await published(candidates.map(c => c.url));
    // Every landing card shows its picture, as the Search cards do: a topic joins the rotation once its picture is
    // published. Those still waiting are listed in content/landing/unpictured.txt for scripts/generate-card-images.ts.
    const kept = candidates.filter((_, i) => live[i]);
    waiting.push(...candidates.filter((c, i) => !live[i] && c.image?.kind === "topics").map(c => (c.image as { parts: string[] }).parts.join(": ")));
    // Verified cards first, each half shuffled so consecutive days wander across categories.
    const ordered = [...seeded(kept.filter(c => c.verified), group.tag), ...seeded(kept.filter(c => !c.verified), group.tag)].slice(0, PER_GROUP);
    const cards: PoolCard[] = ordered.map(({ url: _url, verified: _verified, ...rest }) => rest);
    if (group.tag === "Agentic AI") {
      const pulseLive = await published(AI_PULSE.map(item => learningImageUrl("topics", ["ai-pulse", item.id])));
      cards.unshift(...AI_PULSE.map((item, i): PoolCard => ({
        id: `pulse--${item.id}`, tag: "Agentic AI", title: item.title, category: item.kind, definition: item.definition, hiDefinition: item.hiDefinition,
        points: item.points, useCases: item.useCases, industries: item.industries, source: item.source, compare: item.compare,
        image: pulseLive[i] ? { kind: "topics", parts: ["ai-pulse", item.id] } : null,
      })).filter(card => card.image));
    }
    console.log(`${group.tag.padEnd(18)} ${String(cards.length).padStart(3)} cards (${cards.filter(c => c.image).length} with pictures, ${kept.filter(c => c.verified).length} verified, ${candidates.length} candidates)`);
    groups.push({ tag: group.tag, cards });
  }

  const words = ENGLISH_EXAM_VOCABULARY.filter(entry => entry.pronunciation && entry.hindi && entry.synonyms.length >= 4 && entry.antonyms.length >= 4);
  const uniqueWords = [...new Map(words.map(entry => [entry.word, entry])).values()];
  const wordLive = await published(uniqueWords.map(entry => vocabularyImageUrl(entry.word)));
  // Each synonym and antonym carries its own respelling and Hindi: the handbook's where it has them, otherwise
  // scripts/enrich-landing-words.ts's (content/landing/related-words.json).
  const relatedPath = join("content", "landing", "related-words.json");
  const annotated: Record<string, { pronunciation: string; hindi: string }> = existsSync(relatedPath) ? JSON.parse(readFileSync(relatedPath, "utf8")) : {};
  const headwords = new Map(ENGLISH_EXAM_VOCABULARY.map(entry => [entry.word.toLowerCase(), entry]));
  const related = (word: string) => {
    const key = word.toLowerCase(); const head = headwords.get(key);
    const pronunciation = head?.pronunciation ?? annotated[key]?.pronunciation;
    const hindi = RELATED_HINDI[key] ?? VOCABULARY_HINDI[key] ?? head?.hindi ?? annotated[key]?.hindi;
    return { word, ...(pronunciation ? { pronunciation } : {}), ...(hindi ? { hindi } : {}) };
  };
  const wordPool: DailyPool["words"] = seeded(uniqueWords.filter((_, i) => wordLive[i]), "words").map(entry => ({
    word: entry.word, pronunciation: entry.pronunciation!, category: entry.category, meaning: entry.meaning, hindi: entry.hindi!, sentence: entry.sentence,
    synonyms: entry.synonyms.slice(0, 4).map(related), antonyms: entry.antonyms.slice(0, 4).map(related),
  }));
  console.log(`Words              ${wordPool.length} with pictures (of ${uniqueWords.length})`);

  // Topic-specific use cases and industry problems written by scripts/enrich-landing-daily.ts replace the shared ones.
  const enrichmentPath = join("content", "landing", "daily-enrichment.json");
  const enrichment: Record<string, { useCases?: string[]; industries: { industry: string; problem: string }[] }> = existsSync(enrichmentPath) ? JSON.parse(readFileSync(enrichmentPath, "utf8")) : {};
  for (const group of groups) group.cards = group.cards.map(card => {
    const extra = enrichment[card.id];
    return extra ? { ...card, useCases: extra.useCases ?? card.useCases, industries: extra.industries } : card;
  });

  mkdirSync(join("content", "landing"), { recursive: true });
  writeFileSync(join("content", "landing", "unpictured.txt"), `${waiting.join("\n")}\n`);
  console.log(`${waiting.length} topics wait for a picture (content/landing/unpictured.txt).`);
  const pool: DailyPool = { builtAt: new Date().toISOString().slice(0, 10), groups: groups.filter(group => group.cards.length), words: wordPool };
  writeFileSync(join("content", "landing", "daily-pool.json"), JSON.stringify(pool) + "\n");
  console.log(`Wrote content/landing/daily-pool.json (${Math.round(JSON.stringify(pool).length / 1024)} KB).`);
}

main().catch(error => { console.error(error); process.exit(1); });
