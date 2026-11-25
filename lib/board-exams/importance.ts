import { packOf } from "./boards";
import { askedBand } from "./papers";
import type { BoardId, ClassId, Item, Mcq, Stars, SubjectId } from "./types";

/*
 * Most Important questions: an editorial star rating for every question of a subject, objective and subjective alike.
 * Hand-rated questions keep their own stars. Every other question is rated by how heavily its chapter is weighted
 * in board papers (the HIGH and MID lists below, from the boards' published blueprints and recent papers) and by the
 * kind of question (worked, long-answer questions recur more as whole questions), then ranked within the subject:
 * about the top 12 per cent get five stars and the next 38 per cent four. It is a study guide, not an official count,
 * and the page says so.
 */
const HIGH: Record<`${ClassId}-${string}`, RegExp> = {
  "10-math": /quadratic|trigonometry|triangles|circles$|statistics|surface areas|arithmetic|heights/i,
  "10-physics": /electricity|refraction|reflection|human eye|magnetic/i,
  "10-chemistry": /carbon|chemical reactions|acids|metals/i,
  "10-english": /literature|writing|reported|voice|tenses/i,
  "12-math": /integrals|determinants|matrices|continuity|derivatives|probability|vector|three-dimensional|differential/i,
  "12-physics": /electric charges|capacitance|current electricity|moving charges|induction|alternating|ray optics|wave optics|dual nature|semiconductors|atoms|nuclei/i,
  "12-chemistry": /solutions|electrochemistry|kinetics|coordination|haloalkanes|alcohols|aldehydes|amines|biomolecules/i,
  "12-english": /literature|writing|narration/i,
};
const MID: Record<`${ClassId}-${string}`, RegExp> = {
  "10-math": /coordinate|pair of linear|real numbers|polynomials|areas related|probability/i,
  "10-physics": /machines|sound|calorimetry|radioactivity|work/i,
  "10-chemistry": /periodic|mole|electrolysis/i,
  "10-english": /vocabulary|prepositions|verb forms|error|direct|active|articles|agreement/i,
  "12-math": /relations|inverse|linear programming|application|permutations/i,
  "12-physics": /electromagnetic waves|optical/i,
  "12-chemistry": /d- and f|solid state|hydrocarbons|structure/i,
  "12-english": /grammar|vocabulary|transformation/i,
};

/** The question kinds that recur as whole questions in papers. */
const WORKED = new Set(["important", "solved"]);
const tierOf = (cls: ClassId, subject: SubjectId, chapter: string): 2 | 1 | 0 => {
  const key = `${cls}-${packOf(subject)}` as const;
  return HIGH[key]?.test(chapter) ? 2 : MID[key]?.test(chapter) ? 1 : 0;
};
/** A small, stable number from a question id, to break ties evenly across chapters. */
const jitter = (id: string) => { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; return (h % 1000) / 1000; };
/** How strongly a question type recurs: chapter weight, worked or long answers, and marks. */
const scoreItem = (item: Item, cls: ClassId, subject: SubjectId) => tierOf(cls, subject, item.ch) * 3 + (WORKED.has(item.kind) ? 2 : 0) + (item.marks >= 4 ? 1.5 : item.marks >= 3 ? 1 : 0) + jitter(item.id);
const scoreMcq = (mcq: Mcq, cls: ClassId, subject: SubjectId) => tierOf(cls, subject, mcq.ch) * 3 + 0.5 + jitter(mcq.id);
/** Share of a subject's questions rated five stars, and five or four stars, when not rated by hand. */
const FIVE = 0.12, FOUR_OR_MORE = 0.5;

export type Ranked =
  | { type: "subjective"; id: string; ch: string; stars: Stars; asked: string; boards: BoardId[]; item: Item }
  | { type: "objective"; id: string; ch: string; stars: Stars; asked: string; boards: BoardId[]; mcq: Mcq };

const BOARD_LETTERS: [BoardId, string][] = [["up", "u"], ["cbse", "c"], ["icse", "i"]];
/** The boards a question suits, from its `b` letters (absent: all three). */
export const boardsOf = (b?: string): BoardId[] => BOARD_LETTERS.filter(([, letter]) => !b || b.includes(letter)).map(([id]) => id);

/** The smallest number of questions the Most Important list shows per board and subject. */
export const MOST_IMPORTANT_MINIMUM = 400;

/**
 * A board's most important questions for one subject, highest rated first: every question rated four or five stars,
 * topped up with the best three-star questions so the list never falls below MOST_IMPORTANT_MINIMUM. Subjective and
 * objective questions are interleaved chapter by chapter, so no single chapter fills the first pages.
 */
export function mostImportant(items: Item[], mcqs: Mcq[], cls: ClassId, subject: SubjectId): Ranked[] {
  const ordered = rankAll(items, mcqs, cls, subject);
  const strong = ordered.filter(row => row.stars >= 4).length;
  return ordered.slice(0, Math.max(strong, Math.min(MOST_IMPORTANT_MINIMUM + 50, ordered.length)));
}

/** Every question of the subject with its star rating, in the Most Important order (the list above is its head). */
export function rankAll(items: Item[], mcqs: Mcq[], cls: ClassId, subject: SubjectId): Ranked[] {
  const scored = [
    ...items.map(item => ({ score: item.stars ? 100 + item.stars : scoreItem(item, cls, subject), row: { type: "subjective" as const, id: item.id, ch: item.ch, boards: boardsOf(item.b), item } })),
    ...mcqs.map(mcq => ({ score: scoreMcq(mcq, cls, subject), row: { type: "objective" as const, id: mcq.id, ch: mcq.ch, boards: boardsOf(mcq.b), mcq } })),
  ].sort((a, b) => b.score - a.score);
  const total = scored.length;
  const all: Ranked[] = scored.map(({ row }, rank) => {
    const own = row.type === "subjective" ? row.item.stars : undefined;
    const stars: Stars = own ?? (rank < total * FIVE ? 5 : rank < total * FOUR_OR_MORE ? 4 : 3);
    return { ...row, stars, asked: askedBand(stars) ?? "" } as Ranked;
  });
  // Within each star level: hand-rated questions first, then a round-robin over chapters so no chapter fills a page.
  const handRated = (row: Ranked) => (row.type === "subjective" && row.item.stars ? 0 : 1);
  const ordered: Ranked[] = [];
  for (const stars of [5, 4, 3] as Stars[]) {
    for (const group of [0, 1]) {
      const byChapter = new Map<string, Ranked[]>();
      for (const row of all) if (row.stars === stars && handRated(row) === group) byChapter.set(row.ch, [...(byChapter.get(row.ch) ?? []), row]);
      const queues = [...byChapter.values()];
      for (let index = 0; queues.some(queue => index < queue.length); index++) for (const queue of queues) if (index < queue.length) ordered.push(queue[index]);
    }
  }
  return ordered;
}

/** The stars of every question of a subject, by id (the same ratings the Most Important list uses). */
export function starsById(items: Item[], mcqs: Mcq[], cls: ClassId, subject: SubjectId): Map<string, Stars> {
  const list = mostImportant(items, mcqs, cls, subject);
  const map = new Map<string, Stars>(list.map(row => [row.id, row.stars]));
  for (const row of [...items, ...mcqs]) if (!map.has(row.id)) map.set(row.id, ("stars" in row && row.stars) || 3);
  return map;
}
