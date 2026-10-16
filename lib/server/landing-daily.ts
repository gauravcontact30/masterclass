import "server-only";
import pool from "@/content/landing/daily-pool.json";
import type { AiPulseTone } from "@/lib/landing-ai-pulse";
import type { DailyPool, DailyWord, LockedTeaser, PoolImage, PulseCard, UnlockKind } from "@/lib/landing-daily-types";
import { learningImageUrl } from "@/lib/learning-image";
import { awsServiceImageUrl } from "@/lib/aws-service-image";
import { vocabularyImageUrl } from "@/lib/vocabulary-image";

/** Cards per carousel per day: 27 open and the last one locked behind a small payment. */
export const DAILY_COUNT = 28;
const TONES: AiPulseTone[] = ["peach", "mint", "sky", "lavender", "butter", "rose", "sage"];
/** How many of each day's pulse cards always come from the agentic AI group (the section's namesake). */
const AGENTIC_SLOTS = 2;

/** Days since the epoch on the India calendar, so the set turns over at midnight IST. */
export function istDay(now = Date.now()) { return Math.floor((now + 5.5 * 3600_000) / 86_400_000); }
const dayLabel = (day: number) => new Date(day * 86_400_000).toISOString().slice(0, 10);

const imageUrl = (image: PoolImage) => !image ? null : image.kind === "aws" ? awsServiceImageUrl(image.name) : learningImageUrl("topics", image.parts);
const data = pool as unknown as DailyPool;

/**
 * The full set for one day, locked card included.
 *
 * Each day gives two cards from the agentic AI group, then deals the rest one per technology in turn, starting
 * where yesterday stopped; within a technology it walks the cards in order, so every card is shown before any
 * repeats. Words walk the word list the same way.
 */
function fullDay(day: number): { pulse: PulseCard[]; words: DailyWord[] } {
  const agentic = data.groups.find(group => group.tag === "Agentic AI" && group.cards.length);
  const others = data.groups.filter(group => group !== agentic && group.cards.length);
  const rest = DAILY_COUNT - (agentic ? AGENTIC_SLOTS : 0);
  const picked = [
    ...(agentic ? Array.from({ length: AGENTIC_SLOTS }, (_, k) => agentic.cards[(day * AGENTIC_SLOTS + k) % agentic.cards.length]) : []),
    ...Array.from({ length: rest }, (_, k) => {
      const slot = day * rest + k;
      const group = others[slot % others.length];
      return group.cards[Math.floor(slot / others.length) % group.cards.length];
    }),
  ];
  // A technology with few cards can come round twice in one day; each card appears once.
  const seen = new Set<string>();
  const pulse = picked.filter(card => !seen.has(card.id) && !!seen.add(card.id))
    .map(({ image, ...card }, i): PulseCard => ({ ...card, image: imageUrl(image), tone: TONES[(day + i) % TONES.length] }));
  const words = Array.from({ length: DAILY_COUNT }, (_, k): DailyWord => ({ ...data.words[(day * DAILY_COUNT + k) % data.words.length], tone: TONES[(day + k + 3) % TONES.length] }));
  return { pulse, words };
}

/**
 * Today's cards for the landing carousels. The last card of each is sent only as a blurred teaser: its content
 * stays on the server until /api/landing/unlock has verified a payment for it.
 */
export function landingDaily(now = Date.now()): { day: string; pulse: PulseCard[]; words: DailyWord[]; locked: { pulse: LockedTeaser | null; word: LockedTeaser | null } } {
  const day = istDay(now);
  const { pulse, words } = fullDay(day);
  const lastPulse = pulse.at(-1), lastWord = words.at(-1);
  return {
    day: dayLabel(day),
    pulse: pulse.slice(0, -1),
    words: words.slice(0, -1),
    locked: {
      pulse: lastPulse ? { kind: "pulse", day: dayLabel(day), id: lastPulse.id, tag: lastPulse.tag, title: lastPulse.title, image: lastPulse.image, tone: lastPulse.tone } : null,
      word: lastWord ? { kind: "word", day: dayLabel(day), id: lastWord.word, tag: lastWord.category, title: "Today's bonus word", image: vocabularyImageUrl(lastWord.word), tone: lastWord.tone } : null,
    },
  };
}

/**
 * The locked card of a given day (today or yesterday, so a purchase straddling midnight still opens), or null
 * when the id is not that day's locked card.
 */
export function lockedCard(kind: UnlockKind, day: string, id: string, now = Date.now()): PulseCard | DailyWord | null {
  const today = istDay(now);
  const which = [today, today - 1].find(candidate => dayLabel(candidate) === day);
  if (which === undefined) return null;
  const set = fullDay(which);
  const card = kind === "pulse" ? set.pulse.at(-1) : set.words.at(-1);
  if (!card) return null;
  return (kind === "pulse" ? (card as PulseCard).id : (card as DailyWord).word) === id ? card : null;
}
