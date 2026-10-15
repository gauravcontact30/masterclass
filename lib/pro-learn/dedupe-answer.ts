import type { SearchAnswer } from "./types";

/**
 * Removing the same idea said twice in one answer.
 *
 * An answer is assembled from several sources — the row's summary, its authored
 * points, a matched study note, the technology's essentials, a category lesson —
 * and two of them often say the same thing in different words ("Keying on IP
 * alone punishes shared networks" as both a key point and a caveat). An exact
 * comparison misses those, so sentences are compared by the words that carry
 * their meaning: when most of the shorter one's words are in the longer one,
 * the reader has already read it.
 */

const STOP = new Set(("a an and are as at be but by can do does for from has have how if in into is it its "
  + "not of on or so than that the then this to was what when where which while who why will with without you your").split(" "));

function words(text: string): Set<string> {
  return new Set(text.toLowerCase().replace(/`[^`]*`/g, match => match.replace(/\W+/g, "")).split(/[^a-z0-9]+/)
    .filter(word => word.length > 2 && !STOP.has(word)));
}

/** Whether two lines state the same idea, so only the first is worth printing. */
export function sameIdea(a: string, b: string): boolean {
  const left = words(a);
  const right = words(b);
  const [small, large] = left.size <= right.size ? [left, right] : [right, left];
  if (!small.size) return a.trim().toLowerCase() === b.trim().toLowerCase();
  let shared = 0;
  for (const word of small) if (large.has(word)) shared++;
  // A short line is only a repeat of another short line with the same words —
  // a topic's name recurring inside a full sentence does not make the sentence
  // old news. A longer one has been said once most of its words have been.
  return small.size < 4 ? shared === small.size && large.size <= small.size + 1 : shared / small.size >= 0.75;
}

/** A running record of what the reader has already been told. */
export function saidOnce() {
  const said: string[] = [];
  return {
    /** True — and remembered — when `text` says something new. */
    fresh(text: string) {
      const line = text.trim();
      if (!line || said.some(previous => sameIdea(previous, line))) return false;
      said.push(line);
      return true;
    },
    remember(text: string) { if (text.trim()) said.push(text.trim()); },
  };
}

/**
 * The answer with every repeated idea removed, kept in the order the modal
 * reads it: definition, summary, questions, steps, uses, key points, caveats.
 * The first place an idea appears keeps it; later sections lose the copy, and a
 * section with nothing new left is empty rather than padded.
 */
export function dedupeAnswer(answer: SearchAnswer): SearchAnswer {
  const record = saidOnce();
  record.remember(answer.headline);
  record.fresh(answer.definition);
  const summary = record.fresh(answer.summary) ? answer.summary : "";
  const subjects = answer.subjects.filter(subject => record.fresh(`${subject.summary} ${subject.details.join(" ")}`.trim() || subject.name));
  // A step that carries code is kept for the code even when its prose repeats.
  const steps = answer.steps.filter(step => record.fresh(step.detail) || !!step.code.trim());
  const useCases = answer.useCases.filter(entry => record.fresh(`${entry.title} — ${entry.scenario}`));
  const keyPoints = answer.keyPoints.filter(point => record.fresh(point));
  const caveats = answer.caveats.filter(point => record.fresh(typeof point === "string" ? point : point.text));
  return { ...answer, summary, subjects, steps, useCases, keyPoints, caveats };
}
