import "server-only";
import pool from "@/content/landing/daily-pool.json";
import type { AiPulseTone } from "@/lib/landing-ai-pulse";
import type { DailyPool, DailyWord, LockedTeaser, PoolImage, PulseCard, UnlockKind } from "@/lib/landing-daily-types";
import { learningImageUrl } from "@/lib/learning-image";
import { awsServiceImageUrl } from "@/lib/aws-service-image";
import { vocabularyImageUrl } from "@/lib/vocabulary-image";

/** Word cards per day: 27 open and the last one locked behind a small payment. */
export const DAILY_COUNT = 28;
/** Pulse cards come a screen at a time, and every screen is one technology's three cards. */
export const PULSE_PER_PAGE = 3;
/** Screens of pulse cards per day: Agentic AI first, then nine more technologies; the very last card is locked. */
export const PULSE_PAGES = 10;
const TONES: AiPulseTone[] = ["peach", "mint", "sky", "lavender", "butter", "rose", "sage"];

/** Days since the epoch on the India calendar, so the set turns over at midnight IST. */
export function istDay(now = Date.now()) { return Math.floor((now + 5.5 * 3600_000) / 86_400_000); }
const dayLabel = (day: number) => new Date(day * 86_400_000).toISOString().slice(0, 10);

const imageUrl = (image: PoolImage) => !image ? null : image.kind === "aws" ? awsServiceImageUrl(image.name) : learningImageUrl("topics", image.parts);
const data = pool as unknown as DailyPool;

/**
 * The full set for one day, locked card included.
 *
 * Every screen is one technology: the first is always Agentic AI (the section's namesake), and the rest deal the
 * other technologies in turn, starting where yesterday stopped. Each visit to a technology takes its next three
 * cards, so every card is shown before any repeats. Words walk the word list the same way.
 */
function fullDay(day: number): { pulse: PulseCard[]; words: DailyWord[] } {
  // A technology needs a full screen of its own cards to get one.
  const groups = data.groups.filter(group => group.cards.length >= PULSE_PER_PAGE);
  const agentic = groups.find(group => group.tag === "Agentic AI");
  const others = groups.filter(group => group !== agentic);
  const screen = (group: (typeof groups)[number], visit: number) => Array.from({ length: PULSE_PER_PAGE }, (_, k) => group.cards[(visit * PULSE_PER_PAGE + k) % group.cards.length]);
  const rest = Math.min(PULSE_PAGES - (agentic ? 1 : 0), others.length);
  const picked = [
    ...(agentic ? screen(agentic, day) : []),
    ...Array.from({ length: rest }, (_, k) => {
      const slot = day * rest + k;
      return screen(others[slot % others.length], Math.floor(slot / others.length));
    }).flat(),
  ];
  const pulse = picked.map(({ image, ...card }, i): PulseCard => ({ ...card, image: imageUrl(image), tone: TONES[(day + Math.floor(i / PULSE_PER_PAGE)) % TONES.length] }));
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
