import type { Item, Mcq, Stars } from "../types";

/*
 * Helpers for the generated practice banks (lib/board-exams/generated/*). Every answer is computed from the
 * question's own numbers or from a hand-checked data table, so it is correct by construction. A fixed seed per
 * class and subject keeps the same questions, in the same order and with the same ids, on every visit.
 */
export type Rand = () => number;
/** mulberry32: small, fast and deterministic. */
export function rng(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const int = (r: Rand, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
export const pick = <T,>(r: Rand, list: readonly T[]): T => list[Math.floor(r() * list.length)];
export function shuffle<T>(r: Rand, list: readonly T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
export const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
export const lcm = (a: number, b: number) => Math.abs(a * b) / gcd(a, b);
/** A minus sign that reads as one in print (U+2212). */
export const neg = (text: string) => text.replace(/^-/, "−").replace(/ -/g, " −").replace(/\(-/g, "(−");
/** n/d in lowest terms, as "3/4", "−2" or "5". */
export function frac(n: number, d = 1): string {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1; n /= g; d /= g;
  return neg(d === 1 ? `${n}` : `${n}/${d}`);
}
/** A number to at most `dp` decimal places, trailing zeros dropped. */
export const num = (x: number, dp = 2) => neg(String(Number(x.toFixed(dp))));
/** Three significant figures, as scientific notation (3.6 × 10⁻³) when very large or small. */
export function sci(x: number): string {
  if (x === 0) return "0";
  const exp = Math.floor(Math.log10(Math.abs(x)));
  if (exp >= -2 && exp <= 4) return num(Number(x.toPrecision(3)), 6);
  const mant = Number((x / 10 ** exp).toPrecision(3));
  const sup = String(exp).replace(/-/g, "⁻").replace(/\d/g, digit => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(digit)]);
  return `${neg(String(mant))} × 10${sup}`;
}
/** A signed term for an expression: " + 3x", " − 3x" (first term without a leading plus). */
export function term(coef: number, body: string, first = false): string {
  if (coef === 0) return "";
  const abs = Math.abs(coef); const c = abs === 1 && body ? "" : String(abs);
  if (first) return `${coef < 0 ? "−" : ""}${c}${body}`;
  return ` ${coef < 0 ? "−" : "+"} ${c}${body}`;
}

/** Collects one class and subject's generated questions, skipping duplicates and any MCQ without three distinct distractors. */
export class Bank {
  items: Item[] = [];
  mcqs: Mcq[] = [];
  private seen = new Set<string>();
  constructor(private prefix: string, private r: Rand) {}
  mcq(ch: string, q: string, correct: string, distractors: string[], why: string): boolean {
    const key = `m:${q}`;
    if (this.seen.has(key)) return false;
    const wrong = [...new Set(distractors.map(String).filter(option => option && option !== correct))];
    if (wrong.length < 3) return false;
    const options = shuffle(this.r, [correct, ...shuffle(this.r, wrong).slice(0, 3)]);
    this.seen.add(key);
    this.mcqs.push({ id: `${this.prefix}-m${this.mcqs.length + 1}`, ch, q, options, correct: options.indexOf(correct), why });
    return true;
  }
  /** A short question with its answer (Question Bank). */
  bank(ch: string, q: string, a: string, marks = 2): boolean {
    return this.add({ kind: "bank", ch, q, a, marks });
  }
  /** A worked question: one line per step, "// " lines explain the step under them (Solved & Unsolved). */
  solved(ch: string, q: string, a: string, steps: string[], marks = 3): boolean {
    return this.add({ kind: "solved", ch, q, a, steps, marks });
  }
  /** A practice question with a hint, answer shown on request. */
  unsolved(ch: string, q: string, a: string, hint: string, marks = 2): boolean {
    return this.add({ kind: "unsolved", ch, q, a, hint, marks });
  }
  important(ch: string, stars: Stars, q: string, a: string, steps: string[], marks = 4): boolean {
    return this.add({ kind: "important", ch, q, a, steps, stars, marks });
  }
  private add(item: Omit<Item, "id">): boolean {
    const key = `i:${item.q}`;
    if (this.seen.has(key)) return false;
    this.seen.add(key);
    this.items.push({ ...item, id: `${this.prefix}-g${this.items.length + 1}` });
    return true;
  }
  /** Runs `make` until it has produced `count` new entries (or gives up after many duplicate attempts). */
  repeat(count: number, make: () => boolean) {
    let made = 0, tries = 0;
    while (made < count && tries < count * 40) { tries++; if (make()) made++; }
  }
}
export type Generated = { items: Item[]; mcqs: Mcq[] };
