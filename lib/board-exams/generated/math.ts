import type { ClassId } from "../types";
import { Bank, frac, gcd, int, lcm, neg, num, pick, rng, term, type Generated } from "./util";

/* Generated Math practice: every answer is computed from the question's own numbers. */
const TRIG: Record<string, Record<number, [number, number] | null>> = {
  // [numerator, denominator] for the rational values only; null where the value involves a surd or is undefined.
  sin: { 0: [0, 1], 30: [1, 2], 90: [1, 1] }, cos: { 0: [1, 1], 60: [1, 2], 90: [0, 1] }, tan: { 0: [0, 1], 45: [1, 1] },
  cosec: { 30: [2, 1], 90: [1, 1] }, sec: { 0: [1, 1], 60: [2, 1] }, cot: { 45: [1, 1], 90: [0, 1] },
};
/** Every standard value, surds included, as the textbooks write them. */
const TRIG_TABLE: [string, number, string][] = [
  ["sin", 0, "0"], ["sin", 30, "1/2"], ["sin", 45, "1/√2"], ["sin", 60, "√3/2"], ["sin", 90, "1"],
  ["cos", 0, "1"], ["cos", 30, "√3/2"], ["cos", 45, "1/√2"], ["cos", 60, "1/2"], ["cos", 90, "0"],
  ["tan", 0, "0"], ["tan", 30, "1/√3"], ["tan", 45, "1"], ["tan", 60, "√3"],
  ["cosec", 30, "2"], ["cosec", 45, "√2"], ["cosec", 60, "2/√3"], ["cosec", 90, "1"],
  ["sec", 0, "1"], ["sec", 30, "2/√3"], ["sec", 45, "√2"], ["sec", 60, "2"],
  ["cot", 30, "√3"], ["cot", 45, "1"], ["cot", 60, "1/√3"], ["cot", 90, "0"],
];
const TRIG_VALUES = ["0", "1/2", "1/√2", "√3/2", "1", "1/√3", "√3", "2", "√2", "2/√3"];
const TRIPLES: [number, number, number][] = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15], [7, 24, 25], [12, 16, 20]];
const factorise = (n: number) => { const out: number[] = []; let m = n; for (let p = 2; p * p <= m; p++) while (m % p === 0) { out.push(p); m /= p; } if (m > 1) out.push(m); return out; };
const powers = (n: number) => { const f = factorise(n); const counts = new Map<number, number>(); for (const p of f) counts.set(p, (counts.get(p) ?? 0) + 1); return [...counts].map(([p, k]) => k > 1 ? `${p}^${k}` : `${p}`).join(" × "); };
const quad = (b: number, c: number) => `x²${term(b, "x")}${term(c, "")} = 0`;
const C = (n: number, r: number) => { let v = 1; for (let i = 1; i <= r; i++) v = v * (n - r + i) / i; return Math.round(v); };
const P = (n: number, r: number) => { let v = 1; for (let i = 0; i < r; i++) v *= n - i; return v; };
const mat2 = (m: number[][]) => neg(`[${m[0][0]} ${m[0][1]}; ${m[1][0]} ${m[1][1]}]`.replace(/ -/g, " −").replace(/\[-/g, "[−"));
const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const poly = (terms: number[][]) => terms.filter(([c]) => c).map(([c, p], i) => term(c, p === 0 ? "" : p === 1 ? "x" : `x${String(p).replace(/\d/g, d => SUP[Number(d)])}`, i === 0)).join("").replace(/^ \+ /, "") || "0";
const DERIV: [string, string][] = [["sin x", "cos x"], ["cos x", "−sin x"], ["tan x", "sec²x"], ["cot x", "−cosec²x"], ["sec x", "sec x tan x"], ["cosec x", "−cosec x cot x"], ["eˣ", "eˣ"], ["log x", "1/x"], ["aˣ", "aˣ log a"], ["√x", "1/(2√x)"], ["sin⁻¹x", "1/√(1 − x²)"], ["tan⁻¹x", "1/(1 + x²)"], ["cos⁻¹x", "−1/√(1 − x²)"], ["1/x", "−1/x²"]];
const INTEG: [string, string][] = [["cos x", "sin x + C"], ["sin x", "−cos x + C"], ["sec²x", "tan x + C"], ["cosec²x", "−cot x + C"], ["eˣ", "eˣ + C"], ["1/x", "log|x| + C"], ["sec x tan x", "sec x + C"], ["1/(1 + x²)", "tan⁻¹x + C"], ["1/√(1 − x²)", "sin⁻¹x + C"], ["aˣ", "aˣ/log a + C"], ["tan x", "log|sec x| + C"], ["cot x", "log|sin x| + C"]];

function classTen(b: Bank, r: () => number) {
  // Arithmetic progressions
  b.repeat(95, () => {
    const a = int(r, -10, 20), d = pick(r, [-5, -4, -3, -2, 2, 3, 4, 5, 6, 7]), n = int(r, 6, 30); const v = a + (n - 1) * d;
    return b.mcq("Arithmetic Progressions", `The first term of an AP is ${neg(String(a))} and the common difference is ${neg(String(d))}. What is its ${n}th term?`, neg(String(v)), [a + n * d, a + (n - 2) * d, n * d, v + 2 * d].map(x => neg(String(x))), `aₙ = a + (n − 1)d = ${neg(String(a))} + ${n - 1} × ${neg(String(d))} = ${neg(String(v))}.`);
  });
  b.repeat(65, () => {
    const a = int(r, 1, 15), d = int(r, 2, 7), n = int(r, 8, 25); const s = n * (2 * a + (n - 1) * d) / 2;
    return b.solved("Arithmetic Progressions", `Find the sum of the first ${n} terms of the AP ${a}, ${a + d}, ${a + 2 * d}, …`, `S${n} = ${s}`,
      ["// Identify the first term and the common difference", `a = ${a}, d = ${a + d} − ${a} = ${d}, n = ${n}`, "// Use the sum formula", `Sₙ = n/2 [2a + (n − 1)d]`, `S${n} = ${n}/2 [2 × ${a} + ${n - 1} × ${d}]`, `S${n} = ${n}/2 × ${2 * a + (n - 1) * d}`, `∴ S${n} = ${s}`]);
  });
  b.repeat(35, () => {
    const a = int(r, 1, 15), d = int(r, 2, 7), n = int(r, 8, 25); const s = n * (2 * a + (n - 1) * d) / 2;
    return b.mcq("Arithmetic Progressions", `What is the sum of the first ${n} terms of the AP ${a}, ${a + d}, ${a + 2 * d}, …?`, String(s), [s + n * d, s - d, n * (a + (n - 1) * d), s + a].map(String), `Sₙ = n/2 [2a + (n − 1)d] = ${n}/2 × ${2 * a + (n - 1) * d} = ${s}.`);
  });
  // Quadratic equations
  b.repeat(75, () => {
    const p = pick(r, [-8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9]), q = pick(r, [-9, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8]);
    if (p === q || p === -q) return false;
    const eq = quad(-(p + q), p * q); const ans = `x = ${neg(String(Math.min(p, q)))}, ${neg(String(Math.max(p, q)))}`;
    const wrong = [`x = ${neg(String(Math.min(-p, -q)))}, ${neg(String(Math.max(-p, -q)))}`, `x = ${neg(String(p))}, ${neg(String(-q))}`, `x = ${neg(String(-p))}, ${neg(String(q))}`, `x = ${neg(String(p * q))}, 1`];
    return b.mcq("Quadratic Equations", `Find the roots of ${eq}.`, ans, wrong, `${eq} factorises as (x ${p < 0 ? "+" : "−"} ${Math.abs(p)})(x ${q < 0 ? "+" : "−"} ${Math.abs(q)}) = 0, so ${ans}.`);
  });
  b.repeat(60, () => {
    const p = int(r, -7, 8), q = int(r, -6, 9); if (p === q || !p || !q) return false;
    const B = -(p + q), Cc = p * q; const D = B * B - 4 * Cc; const root = Math.sqrt(D);
    return b.solved("Quadratic Equations", `Solve ${quad(B, Cc)} using the quadratic formula.`, `x = ${neg(String(Math.max(p, q)))} or x = ${neg(String(Math.min(p, q)))}`,
      ["// Compare with ax² + bx + c = 0", `a = 1, b = ${neg(String(B))}, c = ${neg(String(Cc))}`, "// Find the discriminant", `D = b² − 4ac = ${B * B} − ${neg(String(4 * Cc))} = ${D}`, "// Apply the formula", `x = (−b ± √D) / 2a = (${neg(String(-B))} ± ${root}) / 2`, `∴ x = ${neg(String(Math.max(p, q)))} or x = ${neg(String(Math.min(p, q)))}`], 4);
  });
  b.repeat(30, () => {
    const a = int(r, 1, 4), B = int(r, -9, 9), Cc = int(r, -6, 9); const D = B * B - 4 * a * Cc;
    const nature = D > 0 ? "Two distinct real roots" : D === 0 ? "Two equal real roots" : "No real roots";
    return b.mcq("Quadratic Equations", `What is the nature of the roots of ${a === 1 ? "" : a}x²${term(B, "x")}${term(Cc, "")} = 0?`, nature, ["Two distinct real roots", "Two equal real roots", "No real roots", "Infinitely many roots"], `D = b² − 4ac = ${B * B} − ${4 * a * Cc} = ${neg(String(D))}, which is ${D > 0 ? "positive" : D === 0 ? "zero" : "negative"}.`);
  });
  // Real numbers: HCF and LCM
  b.repeat(60, () => {
    const g = pick(r, [2, 3, 4, 5, 6, 7, 8, 9, 12, 15]), x = int(r, 2, 12) * g, y = int(r, 2, 12) * g; if (x === y) return false;
    const h = gcd(x, y), l = lcm(x, y);
    return b.mcq("Real Numbers", `What is the HCF of ${x} and ${y}?`, String(h), [h * 2, Math.max(1, h / 2), g === h ? h + 1 : g, l].map(String), `${x} = ${powers(x)} and ${y} = ${powers(y)}; the HCF is the product of the common prime factors with the smaller powers: ${h}.`);
  });
  b.repeat(40, () => {
    const x = int(r, 12, 96), y = int(r, 12, 96); if (x === y) return false;
    const h = gcd(x, y), l = lcm(x, y);
    return b.solved("Real Numbers", `Find the HCF and LCM of ${x} and ${y} by prime factorisation, and verify that HCF × LCM = product of the numbers.`, `HCF = ${h}, LCM = ${l}`,
      ["// Write each number as a product of primes", `${x} = ${powers(x)}`, `${y} = ${powers(y)}`, "// HCF: common primes, smallest powers; LCM: all primes, greatest powers", `HCF = ${h}, LCM = ${l}`, "// Verify", `HCF × LCM = ${h} × ${l} = ${h * l}`, `${x} × ${y} = ${x * y}`, `∴ HCF × LCM = product of the numbers`], 3);
  });
  // Coordinate geometry
  b.repeat(45, () => {
    const [p, q, h] = pick(r, TRIPLES); const x1 = int(r, -6, 6), y1 = int(r, -6, 6); const sx = pick(r, [1, -1]), sy = pick(r, [1, -1]);
    const x2 = x1 + sx * p, y2 = y1 + sy * q; const A = neg(`(${x1}, ${y1})`), B = neg(`(${x2}, ${y2})`);
    if (r() < 0.5) return b.mcq("Coordinate Geometry", `What is the distance between the points ${A} and ${B}?`, `${h} units`, [`${h + 1} units`, `${p + q} units`, `${h * h} units`, `${Math.abs(p - q) || h - 2} units`], `d = √[(${x2} − ${x1})² + (${y2} − ${y1})²] = √(${p * p} + ${q * q}) = √${h * h} = ${h}.`.replace(/− -/g, "+ "));
    return b.solved("Coordinate Geometry", `Find the distance between ${A} and ${B}.`, `${h} units`, ["// Distance formula", "d = √[(x₂ − x₁)² + (y₂ − y₁)²]", neg(`d = √[(${x2 - x1})² + (${y2 - y1})²]`), `d = √(${p * p} + ${q * q}) = √${h * h}`, `∴ d = ${h} units`]);
  });
  b.repeat(45, () => {
    const m = int(r, 1, 4), n = int(r, 1, 4), k = int(r, 1, 3) * (m + n); const x1 = int(r, -8, 6), y1 = int(r, -8, 6); const dx = pick(r, [k, -k]), dy = pick(r, [k, 2 * k, -k]);
    const x2 = x1 + dx, y2 = y1 + dy; const px = (m * x2 + n * x1) / (m + n), py = (m * y2 + n * y1) / (m + n);
    const A = neg(`(${x1}, ${y1})`), B = neg(`(${x2}, ${y2})`), ans = neg(`(${px}, ${py})`);
    return b.mcq("Coordinate Geometry", `Find the point that divides the line segment joining ${A} and ${B} internally in the ratio ${m} : ${n}.`, ans,
      [neg(`(${(n * x2 + m * x1) / (m + n)}, ${(n * y2 + m * y1) / (m + n)})`), neg(`(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`), neg(`(${px + 1}, ${py - 1})`), neg(`(${py}, ${px})`)],
      `P = ((m x₂ + n x₁)/(m + n), (m y₂ + n y₁)/(m + n)) = ${ans}.`);
  });
  // Trigonometry
  for (const [fn, deg, value] of TRIG_TABLE) b.mcq("Trigonometry", `What is the value of ${fn} ${deg}°?`, value, TRIG_VALUES, `Standard value: ${fn} ${deg}° = ${value}.`);
  const rational = Object.entries(TRIG).flatMap(([fn, row]) => Object.entries(row).map(([deg, v]) => ({ name: `${fn} ${deg}°`, v: v! })));
  b.repeat(45, () => {
    const x = pick(r, rational), y = pick(r, rational), z = pick(r, rational); if (x === y) return false;
    const n = x.v[0] * y.v[1] * z.v[1] + y.v[0] * x.v[1] * z.v[1] - z.v[0] * x.v[1] * y.v[1]; const d = x.v[1] * y.v[1] * z.v[1];
    const ans = frac(n, d);
    return b.solved("Trigonometry", `Evaluate: ${x.name} + ${y.name} − ${z.name}`, ans, ["// Substitute the standard values", `${x.name} = ${frac(...x.v)}, ${y.name} = ${frac(...y.v)}, ${z.name} = ${frac(...z.v)}`, `= ${frac(...x.v)} + ${frac(...y.v)} − ${frac(...z.v)}`, `∴ = ${ans}`], 2);
  });
  for (const [identity, value] of [["sin²θ + cos²θ", "1"], ["sec²θ − tan²θ", "1"], ["cosec²θ − cot²θ", "1"], ["sin θ × cosec θ", "1"], ["tan θ × cot θ", "1"], ["sin(90° − θ)", "cos θ"], ["cos(90° − θ)", "sin θ"], ["tan(90° − θ)", "cot θ"], ["sec(90° − θ)", "cosec θ"], ["sin θ / cos θ", "tan θ"]] as const)
    b.mcq("Trigonometry", `${identity} is equal to`, value, ["1", "0", "cos θ", "sin θ", "tan θ", "cot θ", "cosec θ", "sec θ", "2"], `Standard identity: ${identity} = ${value}.`);
  // Mensuration (π = 22/7)
  b.repeat(40, () => {
    const radius = pick(r, [7, 14, 21, 28, 35, 42]); const area = 22 * radius * radius / 7, circ = 44 * radius / 7;
    return r() < 0.5 ? b.mcq("Areas Related to Circles", `What is the area of a circle of radius ${radius} cm? (Take π = 22/7)`, `${area} cm²`, [`${circ} cm²`, `${area * 2} cm²`, `${area / 2} cm²`, `${22 * radius / 7 * 4} cm²`], `A = πr² = 22/7 × ${radius} × ${radius} = ${area} cm².`)
      : b.mcq("Areas Related to Circles", `What is the circumference of a circle of radius ${radius} cm? (Take π = 22/7)`, `${circ} cm`, [`${area} cm`, `${circ / 2} cm`, `${circ * 2} cm`, `${circ + 7} cm`], `C = 2πr = 2 × 22/7 × ${radius} = ${circ} cm.`);
  });
  b.repeat(45, () => {
    const radius = pick(r, [7, 14, 21]), h = pick(r, [3, 6, 9, 12, 15, 21, 30]); const shape = pick(r, ["cylinder", "cone"] as const);
    const v = shape === "cylinder" ? 22 * radius * radius * h / 7 : 22 * radius * radius * h / 21;
    return b.solved("Surface Areas and Volumes", `Find the volume of a ${shape} with radius ${radius} cm and height ${h} cm. (Take π = 22/7)`, `${v} cm³`,
      [`// Volume of a ${shape}`, shape === "cylinder" ? "V = πr²h" : "V = (1/3)πr²h", shape === "cylinder" ? `V = 22/7 × ${radius} × ${radius} × ${h}` : `V = 1/3 × 22/7 × ${radius} × ${radius} × ${h}`, `∴ V = ${v} cm³`], 3);
  });
  b.repeat(25, () => {
    const radius = pick(r, [3, 6, 9, 12, 15]); const v = 4 * radius ** 3 / 3; const sa = 4 * radius * radius;
    return r() < 0.5 ? b.mcq("Surface Areas and Volumes", `What is the volume of a sphere of radius ${radius} cm, in terms of π?`, `${v}π cm³`, [`${sa}π cm³`, `${v * 3 / 4}π cm³`, `${2 * v}π cm³`, `${v / 2}π cm³`], `V = (4/3)πr³ = 4/3 × ${radius ** 3}π = ${v}π cm³.`)
      : b.mcq("Surface Areas and Volumes", `What is the surface area of a sphere of radius ${radius} cm, in terms of π?`, `${sa}π cm²`, [`${v}π cm²`, `${sa / 2}π cm²`, `${3 * radius * radius}π cm²`, `${2 * sa}π cm²`], `S = 4πr² = 4 × ${radius * radius}π = ${sa}π cm².`);
  });
  // Probability
  const DIE: [string, (n: number) => boolean][] = [["an even number", n => n % 2 === 0], ["a prime number", n => [2, 3, 5].includes(n)], ["a number greater than 4", n => n > 4], ["a multiple of 3", n => n % 3 === 0], ["a number less than 3", n => n < 3], ["an odd number", n => n % 2 === 1], ["a number greater than 6", n => n > 6], ["a factor of 6", n => 6 % n === 0]];
  for (const [label, test] of DIE) { const k = [1, 2, 3, 4, 5, 6].filter(test).length; b.mcq("Probability", `A die is thrown once. What is the probability of getting ${label}?`, frac(k, 6), [frac(6 - k, 6), frac(k + 1, 6), frac(1, 6), frac(k, 12), "1"], `Favourable outcomes: ${k} of 6, so P = ${frac(k, 6)}.`); }
  for (let s = 2; s <= 12; s++) { const k = 6 - Math.abs(7 - s); b.mcq("Probability", `Two dice are thrown together. What is the probability that the sum is ${s}?`, frac(k, 36), [frac(k + 1, 36), frac(1, 6), frac(k, 6), frac(s, 36), frac(1, 36)], `${k} of the 36 equally likely outcomes give a sum of ${s}, so P = ${frac(k, 36)}.`); }
  const CARDS: [string, number][] = [["a king", 4], ["a red card", 26], ["a face card", 12], ["a spade", 13], ["the ace of hearts", 1], ["a red king", 2], ["a black face card", 6], ["a card that is not an ace", 48], ["a queen or a jack", 8], ["a diamond", 13]];
  for (const [label, k] of CARDS) b.mcq("Probability", `One card is drawn from a well-shuffled deck of 52 cards. What is the probability that it is ${label}?`, frac(k, 52), [frac(52 - k, 52), frac(k, 13), frac(k + 2, 52), frac(1, 52), frac(1, 4)], `${k} favourable cards out of 52, so P = ${frac(k, 52)}.`);
  b.repeat(30, () => {
    const red = int(r, 2, 9), blue = int(r, 2, 9), green = int(r, 1, 6); const total = red + blue + green; const colour = pick(r, ["red", "blue", "green", "not red"] as const);
    const k = colour === "red" ? red : colour === "blue" ? blue : colour === "green" ? green : total - red;
    return b.solved("Probability", `A bag has ${red} red, ${blue} blue and ${green} green balls. One ball is drawn at random. Find the probability that it is ${colour}.`, frac(k, total), ["// Count the outcomes", `Total balls = ${red} + ${blue} + ${green} = ${total}`, `Favourable outcomes = ${k}`, `∴ P = ${k}/${total} = ${frac(k, total)}`], 2);
  });
  // Pair of linear equations
  b.repeat(60, () => {
    const x = int(r, -5, 8), y = int(r, -5, 8); const a1 = int(r, 1, 5), b1 = int(r, -4, 5), a2 = int(r, 1, 5), b2 = int(r, -4, 5);
    if (!b1 || !b2 || a1 * b2 - a2 * b1 === 0) return false;
    const e1 = `${a1 === 1 ? "" : a1}x${term(b1, "y")} = ${neg(String(a1 * x + b1 * y))}`, e2 = `${a2 === 1 ? "" : a2}x${term(b2, "y")} = ${neg(String(a2 * x + b2 * y))}`;
    return b.mcq("Pair of Linear Equations", `Solve: ${e1} and ${e2}.`, neg(`x = ${x}, y = ${y}`), [neg(`x = ${y}, y = ${x}`), neg(`x = ${-x}, y = ${y}`), neg(`x = ${x}, y = ${-y}`), neg(`x = ${x + 1}, y = ${y - 1}`)], `Substituting x = ${neg(String(x))} and y = ${neg(String(y))} satisfies both equations (elimination gives the same result).`);
  });
  // Statistics
  b.repeat(30, () => {
    const n = int(r, 5, 8); const values = Array.from({ length: n }, () => int(r, 4, 60)); const sum = values.reduce((s, v) => s + v, 0);
    if (sum % n) return false;
    return b.mcq("Statistics", `Find the mean of ${values.join(", ")}.`, String(sum / n), [String(sum / n + 1), String(sum / n - 2), String(Math.round(sum / (n - 1))), String(sum)], `Mean = sum / number of values = ${sum} / ${n} = ${sum / n}.`);
  });
}

function classTwelve(b: Bank, r: () => number) {
  // Differentiation
  for (const [f, d] of DERIV) b.mcq("Continuity and Differentiability", `d/dx (${f}) =`, d, DERIV.map(([, x]) => x), `Standard derivative: d/dx (${f}) = ${d}.`);
  b.repeat(140, () => {
    const t: [number, number][] = [[int(r, -6, 9), int(r, 3, 6)], [int(r, -8, 9), 2], [int(r, -9, 9), 1], [int(r, -9, 9), 0]];
    if (!t[0][0]) return false;
    const f = poly(t), d = poly(t.filter(([, p]) => p > 0).map(([c, p]) => [c * p, p - 1]));
    const wrong = [poly(t.filter(([, p]) => p > 0).map(([c, p]) => [c * p, p])), poly(t.filter(([, p]) => p > 0).map(([c, p]) => [c, p - 1])), poly(t.map(([c, p]) => [c * (p + 1), p + 1])), poly(t.filter(([, p]) => p > 0).map(([c, p]) => [c * p, p - 1]).concat([[t[3][0] || 1, 0]]))];
    return b.mcq("Continuity and Differentiability", `If y = ${f}, then dy/dx =`, d, wrong, `Differentiate term by term with d/dx (xⁿ) = n xⁿ⁻¹: dy/dx = ${d}.`);
  });
  b.repeat(85, () => {
    const a = int(r, 1, 5), bb = int(r, -6, 6), c = int(r, -9, 9), k = int(r, -3, 4); const f = poly([[a, 3], [bb, 2], [c, 1], [int(r, -5, 9), 0]]);
    const val = 3 * a * k * k + 2 * bb * k + c;
    return b.solved("Applications of Derivatives", `If f(x) = ${f}, find f′(${k}).`.replace("f′(-", "f′(−"), `f′(${neg(String(k))}) = ${neg(String(val))}`,
      ["// Differentiate term by term", `f′(x) = ${poly([[3 * a, 2], [2 * bb, 1], [c, 0]])}`, `// Substitute x = ${neg(String(k))}`, neg(`f′(${k}) = ${3 * a}(${k})² + ${2 * bb}(${k}) + ${c}`), `∴ f′(${neg(String(k))}) = ${neg(String(val))}`]);
  });
  // Integration
  for (const [f, F] of INTEG) b.mcq("Integrals", `∫ ${f} dx =`, F, INTEG.map(([, x]) => x), `Standard integral: ∫ ${f} dx = ${F}.`);
  b.repeat(105, () => {
    const a = 3 * int(r, -2, 3), bb = 2 * int(r, -3, 4), c = int(r, -5, 6), lo = int(r, -2, 1), hi = lo + int(r, 1, 3); if (!a && !bb) return false;
    const F = (x: number) => (a * x ** 3) / 3 + (bb * x * x) / 2 + c * x; const v = F(hi) - F(lo);
    const integrand = poly([[a, 2], [bb, 1], [c, 0]]);
    if (r() < 0.5) return b.solved("Integrals", `Evaluate ∫ from ${neg(String(lo))} to ${hi} of (${integrand}) dx.`, neg(String(v)),
      ["// Integrate term by term", `∫ (${integrand}) dx = ${poly([[a / 3, 3], [bb / 2, 2], [c, 1]])}`, "// Apply the limits: F(b) − F(a)", neg(`F(${hi}) − F(${lo}) = ${F(hi)} − (${F(lo)})`), `∴ = ${neg(String(v))}`], 3);
    return b.mcq("Integrals", `∫ from ${neg(String(lo))} to ${hi} of (${integrand}) dx =`, neg(String(v)), [v + 1, v - 2, F(hi), -v || 3].map(x => neg(String(x))), `Antiderivative ${poly([[a / 3, 3], [bb / 2, 2], [c, 1]])}; F(${hi}) − F(${neg(String(lo))}) = ${neg(String(v))}.`);
  });
  // Determinants and matrices
  b.repeat(85, () => {
    const m = [[int(r, -5, 9), int(r, -5, 9)], [int(r, -5, 9), int(r, -5, 9)]]; const d = m[0][0] * m[1][1] - m[0][1] * m[1][0];
    return b.mcq("Determinants", `Find the determinant of the matrix ${mat2(m)}.`, neg(String(d)), [m[0][0] * m[1][1] + m[0][1] * m[1][0], m[0][0] * m[1][0] - m[0][1] * m[1][1], -d || 5, d + 1].map(x => neg(String(x))), `|A| = (${m[0][0]})(${m[1][1]}) − (${m[0][1]})(${m[1][0]}) = ${neg(String(d))}.`.replace(/\(-/g, "(−"));
  });
  b.repeat(70, () => {
    const m = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => int(r, -3, 5)));
    const minor = (i: number, j: number) => { const rows = m.filter((_, k) => k !== i).map(row => row.filter((_, l) => l !== j)); return rows[0][0] * rows[1][1] - rows[0][1] * rows[1][0]; };
    const terms = [0, 1, 2].map(j => (j % 2 ? -1 : 1) * m[0][j] * minor(0, j)); const d = terms.reduce((s, t) => s + t, 0);
    const show = neg(`[${m.map(row => row.join(" ")).join("; ")}]`.replace(/ -/g, " −").replace(/\[-/g, "[−").replace(/; -/g, "; −"));
    return b.solved("Determinants", `Evaluate the determinant of ${show} by expanding along the first row.`, neg(String(d)),
      ["// Expand along R₁: a₁₁M₁₁ − a₁₂M₁₂ + a₁₃M₁₃", neg(`= ${m[0][0]}(${minor(0, 0)}) − ${m[0][1]}(${minor(0, 1)}) + ${m[0][2]}(${minor(0, 2)})`).replace(/\(-/g, "(−"), neg(`= ${terms[0]} + ${terms[1]} + ${terms[2]}`).replace(/\+ −/g, "− "), `∴ |A| = ${neg(String(d))}`], 4);
  });
  b.repeat(75, () => {
    const A = [[int(r, -3, 5), int(r, -3, 5)], [int(r, -3, 5), int(r, -3, 5)]], B = [[int(r, -3, 5), int(r, -3, 5)], [int(r, -3, 5), int(r, -3, 5)]];
    const prod = [[A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]], [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]];
    const elem = [[A[0][0] * B[0][0], A[0][1] * B[0][1]], [A[1][0] * B[1][0], A[1][1] * B[1][1]]]; const rev = [[B[0][0] * A[0][0] + B[0][1] * A[1][0], B[0][0] * A[0][1] + B[0][1] * A[1][1]], [B[1][0] * A[0][0] + B[1][1] * A[1][0], B[1][0] * A[0][1] + B[1][1] * A[1][1]]];
    return b.mcq("Matrices", `If A = ${mat2(A)} and B = ${mat2(B)}, then AB =`, mat2(prod), [mat2(elem), mat2(rev), mat2([[prod[0][0], prod[1][0]], [prod[0][1], prod[1][1]]]), mat2([[prod[0][0] + 1, prod[0][1]], [prod[1][0], prod[1][1] - 1]])], `Row-by-column multiplication: (AB)ᵢⱼ = Σ aᵢₖ bₖⱼ, giving ${mat2(prod)}.`);
  });
  b.repeat(30, () => {
    const a = int(r, 1, 6), bb = int(r, 1, 5); const c = (a * int(r, 1, 3) - 1) / bb; if (!Number.isInteger(c)) return false; const d = (1 + bb * c) / a; if (!Number.isInteger(d)) return false;
    const m = [[a, bb], [c, d]]; const det = a * d - bb * c; if (det !== 1) return false;
    return b.solved("Matrices", `Find the inverse of A = ${mat2(m)}.`, `A⁻¹ = ${mat2([[d, -bb], [-c, a]])}`, ["// Find |A|", `|A| = ${a} × ${d} − ${bb} × ${c} = 1`, "// adj A: swap the diagonal, change the sign of the others", `adj A = ${mat2([[d, -bb], [-c, a]])}`, "// A⁻¹ = adj A / |A|", `∴ A⁻¹ = ${mat2([[d, -bb], [-c, a]])}`], 4);
  });
  // Vectors
  const VEC3: [number, number, number, number][] = [[1, 2, 2, 3], [2, 3, 6, 7], [1, 4, 8, 9], [2, 6, 9, 11], [4, 4, 7, 9], [2, 1, 2, 3], [6, 2, 3, 7], [3, 4, 12, 13]];
  for (const [x, y, z, m] of VEC3) for (const signs of [[1, 1, 1], [1, -1, 1], [-1, 1, -1]]) {
    const v = [x * signs[0], y * signs[1], z * signs[2]]; const show = neg(`${v[0]}î${term(v[1], "ĵ")}${term(v[2], "k̂")}`).replace(/^1î/, "î").replace(/^−1î/, "−î");
    b.mcq("Vector Algebra", `What is the magnitude of the vector ${show}?`, String(m), [String(m + 1), String(x + y + z), String(m * m), `√${x + y + z}`], `|a| = √(${x * x} + ${y * y} + ${z * z}) = √${m * m} = ${m}.`);
  }
  b.repeat(85, () => {
    const a = [int(r, -4, 5), int(r, -4, 5), int(r, -4, 5)], c = [int(r, -4, 5), int(r, -4, 5), int(r, -4, 5)]; const dot = a[0] * c[0] + a[1] * c[1] + a[2] * c[2];
    const show = (v: number[]) => neg(`(${v.join(", ")})`.replace(/, -/g, ", −").replace(/\(-/g, "(−"));
    return b.mcq("Vector Algebra", `If a = ${show(a)} and b = ${show(c)}, find a · b.`, neg(String(dot)), [dot + 2, -dot || 4, a[0] * c[0] + a[1] * c[1], dot * 2].map(x => neg(String(x))), `a · b = a₁b₁ + a₂b₂ + a₃b₃ = ${neg(String(dot))}${dot === 0 ? ", so the vectors are perpendicular" : ""}.`);
  });
  // Permutations, combinations and probability
  b.repeat(60, () => {
    const n = int(r, 5, 12), k = int(r, 2, Math.min(5, n - 1)); const useC = r() < 0.5; const v = useC ? C(n, k) : P(n, k);
    return b.mcq("Permutations and Combinations", useC ? `In how many ways can ${k} members be chosen from ${n} people?` : `In how many ways can ${k} people be seated in a row of ${k} chairs, chosen from ${n} people?`, String(v),
      [String(useC ? P(n, k) : C(n, k)), String(n ** k), String(v + n), String(useC ? C(n, k - 1) : P(n, k - 1))], useC ? `ⁿCᵣ = ${n}C${k} = ${v}.` : `ⁿPᵣ = ${n}P${k} = ${v}.`);
  });
  b.repeat(60, () => {
    const d = pick(r, [10, 12, 20, 24, 30]), pb = int(r, 2, d - 1), pab = int(r, 1, pb - 1); const ans = frac(pab, pb);
    return b.solved("Probability", `If P(B) = ${frac(pb, d)} and P(A ∩ B) = ${frac(pab, d)}, find P(A | B).`, `P(A | B) = ${ans}`, ["// Conditional probability", "P(A | B) = P(A ∩ B) / P(B)", `= (${frac(pab, d)}) / (${frac(pb, d)})`, `∴ P(A | B) = ${ans}`], 2);
  });
  b.repeat(35, () => {
    const n = int(r, 4, 20), pd = pick(r, [2, 4, 5, 10]), pn = int(r, 1, pd - 1); const mean = frac(n * pn, pd), variance = frac(n * pn * (pd - pn), pd * pd);
    return b.mcq("Probability", `For a binomial distribution with n = ${n} and p = ${frac(pn, pd)}, what is the variance?`, variance, [mean, frac(n * (pd - pn), pd), frac(n * pn * pn, pd * pd), frac(pn * (pd - pn), pd * pd)], `Variance = npq = ${n} × ${frac(pn, pd)} × ${frac(pd - pn, pd)} = ${variance} (mean np = ${mean}).`);
  });
}

export function generateMath(cls: ClassId): Generated {
  const r = rng(cls === "10" ? 1010 : 1212);
  const b = new Bank(`g${cls}-math`, r);
  if (cls === "10") classTen(b, r); else classTwelve(b, r);
  return { items: b.items, mcqs: b.mcqs };
}
void num;
