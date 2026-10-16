import type { AiPulseSide, AiPulseTone } from "./landing-ai-pulse";

/** Where a card's picture lives: the learning-images topics folder, or the AWS service bucket. */
export type PoolImage = { kind: "topics"; parts: string[] } | { kind: "aws"; name: string } | null;

/** One topic card in content/landing/daily-pool.json (built by scripts/build-landing-daily.ts). */
export type PoolCard = {
  id: string;
  tag: string;
  title: string;
  category: string;
  definition: string;
  hiDefinition?: string;
  points: string[];
  useCases: string[];
  industries: { industry: string; problem: string }[];
  source: { label: string; href: string };
  compare?: [AiPulseSide, AiPulseSide];
  image: PoolImage;
};

/** A synonym or antonym with its own respelling and Hindi meaning, when known. */
export type RelatedWord = { word: string; pronunciation?: string; hindi?: string };
export type PoolWord = { word: string; pronunciation: string; category: string; meaning: string; hindi: string; sentence: string; synonyms: RelatedWord[]; antonyms: RelatedWord[] };

export type DailyPool = { builtAt: string; groups: { tag: string; cards: PoolCard[] }[]; words: PoolWord[] };

/** What the landing page renders today: picture URLs resolved and a tint assigned. */
export type PulseCard = Omit<PoolCard, "image"> & { image: string | null; tone: AiPulseTone };
export type DailyWord = PoolWord & { tone: AiPulseTone };

export type UnlockKind = "pulse" | "word";
/** The last card of each landing carousel before it is unlocked: enough to tempt, nothing to read. */
export type LockedTeaser = { kind: UnlockKind; day: string; id: string; tag: string; title: string; image: string | null; tone: AiPulseTone };
