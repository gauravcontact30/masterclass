/** Turns stored prose into scannable points. Display only: the words are never changed. */

// A new sentence starts with a capital, a quote, a bracket or an identifier such as pl.lit or useState(.
const SENTENCE_BREAK = /(?<!\b(?:e\.g|i\.e|vs|cf|etc|approx|No))(?<=[.!?])\s+(?=[A-Z`"'(\[]|[a-z_]\w*[.(])/;

const normal = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const STOP = new Set("a an and are as at be by can for from in into is it its of on or that the this to use used using when with you your".split(" "));
const words = (text: string) => new Set(normal(text).split(" ").filter(word => word && !STOP.has(word)));
/** The same idea in other words: most of the shorter sentence's meaningful words are in the other. */
function repeats(a: Set<string>, b: Set<string>) {
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  return small.size > 0 && [...small].filter(word => large.has(word)).length / small.size >= 0.6;
}

/** One point per sentence, without repeats or anything already said in `except`. */
export function toPoints(text: string, except: readonly string[] = []): string[] {
  const seen = except.map(words);
  const points: string[] = [];
  for (const part of text.replace(/\s+/g, " ").trim().split(SENTENCE_BREAK)) {
    const point = part.trim(), key = words(point);
    if (!key.size || seen.some(earlier => repeats(key, earlier))) continue;
    seen.push(key);
    points.push(point);
  }
  return points;
}

/** Follow-ups are stored as "Question? Answer." */
export function splitFollowUp(text: string): { question: string; answer: string } {
  const at = text.indexOf("? ");
  return at < 0 ? { question: "", answer: text.trim() } : { question: text.slice(0, at + 1).trim(), answer: text.slice(at + 2).trim() };
}

/** Use cases are stored as "Title — scenario". */
export function splitUseCase(text: string): { title: string; body: string } {
  const at = text.indexOf(" — ");
  return at < 0 ? { title: "", body: text.trim() } : { title: text.slice(0, at).trim(), body: text.slice(at + 3).trim() };
}
