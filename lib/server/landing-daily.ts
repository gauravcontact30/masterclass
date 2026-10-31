import "server-only";
import pool from "@/content/landing/daily-pool.json";
import type { AiPulseTone } from "@/lib/landing-ai-pulse";
import type { DailyPool, DailyWord, LockedTeaser, PoolImage, PulseCard, UnlockKind } from "@/lib/landing-daily-types";
import { learningImageUrl } from "@/lib/learning-image";
import { awsServiceImageUrl } from "@/lib/aws-service-image";
import { vocabularyImageUrl } from "@/lib/vocabulary-image";
import { istWeek, weekStartDate } from "@/lib/ist-week";

/** Word cards per week: 27 open and the last one locked behind a small payment. */
export const DAILY_COUNT = 28;
/** Pulse cards come a screen at a time, and every screen is one technology's three cards. */
export const PULSE_PER_PAGE = 3;
/** Screens of pulse cards per week: Agentic AI first, then every other technology in the pool, so each one is covered
 *  every week (the order rotates weekly); the very last card is locked. */
export const PULSE_PAGES = Number.POSITIVE_INFINITY;
const TONES: AiPulseTone[] = ["peach", "mint", "sky", "lavender", "butter", "rose", "sage"];

/** Days since the epoch on the India calendar (reports and analytics count by day). */
export function istDay(now = Date.now()) { return Math.floor((now + 5.5 * 3600_000) / 86_400_000); }
/** The landing and learning sets turn over weekly, at Monday 00:00 IST (user rule 2026-10-31): `period` is that week's
 *  number (lib/ist-week.ts) and its label is the Monday it starts on. */
export { istWeek };
const periodLabel = weekStartDate;

const imageUrl = (image: PoolImage) => !image ? null : image.kind === "aws" ? awsServiceImageUrl(image.name) : learningImageUrl("topics", image.parts);
const data = pool as unknown as DailyPool;

/**
 * The full set for one week, locked card included.
 *
 * Every screen is one technology: the first is always Agentic AI (the section's namesake), and the rest show
 * every other technology, starting where last week stopped. Each visit to a technology takes its next three
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
  const pulse = picked.map(({ image, ...card }, i): PulseCard => ({ ...card, image: imageUrl(image), tone: TONES[(day + i) % TONES.length] }));
  const words = Array.from({ length: DAILY_COUNT }, (_, k): DailyWord => ({ ...data.words[(day * DAILY_COUNT + k) % data.words.length], tone: TONES[(day + k + 3) % TONES.length] }));
  return { pulse, words };
}

/**
 * This week's cards for the landing carousels (`day` is the week's Monday). The last card of each is sent only as a
 * blurred teaser: its content stays on the server until /api/landing/unlock has verified a payment for it.
 */
export function landingDaily(now = Date.now()): { day: string; pulse: PulseCard[]; words: DailyWord[]; locked: { pulse: LockedTeaser | null; word: LockedTeaser | null } } {
  const week = istWeek(now);
  const { pulse, words } = fullDay(week);
  const lastPulse = pulse.at(-1), lastWord = words.at(-1);
  const label = periodLabel(week);
  return {
    day: label,
    pulse: pulse.slice(0, -1),
    words: words.slice(0, -1),
    locked: {
      pulse: lastPulse ? { kind: "pulse", day: label, id: lastPulse.id, tag: lastPulse.tag, title: lastPulse.title, image: lastPulse.image, tone: lastPulse.tone } : null,
      word: lastWord ? { kind: "word", day: label, id: lastWord.word, tag: lastWord.category, title: "This week's bonus word", image: vocabularyImageUrl(lastWord.word), tone: lastWord.tone } : null,
    },
  };
}

/**
 * The locked card of a given week (this week or last, so a purchase straddling Monday midnight still opens), or null
 * when the id is not that week's locked card. `day` is the week's label, its Monday.
 */
export function lockedCard(kind: UnlockKind, day: string, id: string, now = Date.now()): PulseCard | DailyWord | null {
  const week = istWeek(now);
  const which = [week, week - 1].find(candidate => periodLabel(candidate) === day);
  if (which === undefined) return null;
  const set = fullDay(which);
  const card = kind === "pulse" ? set.pulse.at(-1) : set.words.at(-1);
  if (!card) return null;
  return (kind === "pulse" ? (card as PulseCard).id : (card as DailyWord).word) === id ? card : null;
}
