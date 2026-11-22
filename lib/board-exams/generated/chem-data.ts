/*
 * Hand-checked chemistry tables for the generated Organic and Inorganic banks. Atomic masses are the rounded values
 * board papers use (Cl = 35.5, Cu = 63.5).
 */
export const MASS: Record<string, number> = { H: 1, He: 4, Li: 7, Be: 9, B: 11, C: 12, N: 14, O: 16, F: 19, Ne: 20, Na: 23, Mg: 24, Al: 27, Si: 28, P: 31, S: 32, Cl: 35.5, Ar: 40, K: 39, Ca: 40, Cr: 52, Mn: 55, Fe: 56, Co: 59, Ni: 59, Cu: 63.5, Zn: 65, Br: 80, Ag: 108, I: 127, Ba: 137, Pb: 207 };

/** Element counts of a formula such as Ca(OH)2, Al2(SO4)3 or CH3COOH. */
export function atoms(formula: string): Map<string, number> {
  const plain = formula.replace(/[₀-₉]/g, d => String("₀₁₂₃₄₅₆₇₈₉".indexOf(d)));
  let i = 0;
  const group = (): Map<string, number> => {
    const out = new Map<string, number>();
    const add = (el: string, n: number) => out.set(el, (out.get(el) ?? 0) + n);
    while (i < plain.length && plain[i] !== ")") {
      let part: Map<string, number>;
      if (plain[i] === "(") { i++; part = group(); i++; }
      else { const m = /^[A-Z][a-z]?/.exec(plain.slice(i)); if (!m) { i++; continue; } i += m[0].length; part = new Map([[m[0], 1]]); }
      const n = /^\d+/.exec(plain.slice(i)); const k = n ? Number(n[0]) : 1; if (n) i += n[0].length;
      for (const [el, c] of part) add(el, c * k);
    }
    return out;
  };
  return group();
}
export const molarMass = (formula: string) => [...atoms(formula)].reduce((sum, [el, n]) => sum + MASS[el] * n, 0);
/** "Ca: 40 × 1 = 40" lines and the total, for a worked molar-mass solution. */
export function massSteps(formula: string): string[] {
  const rows = [...atoms(formula)].map(([el, n]) => `${el}: ${MASS[el]} × ${n} = ${Number((MASS[el] * n).toFixed(2))}`);
  return [...rows, `Sum = ${Number(molarMass(formula).toFixed(2))} g/mol`];
}
/** Subscript digits for display: H2SO4 → H₂SO₄. */
export const sub = (formula: string) => formula.replace(/\d/g, d => "₀₁₂₃₄₅₆₇₈₉"[Number(d)]);

/* Ions for formula writing. Combinations that do not exist as stable compounds are excluded below. */
export type Ion = { name: string; symbol: string; charge: number; poly?: boolean };
export const CATIONS: Ion[] = [
  { name: "sodium", symbol: "Na", charge: 1 }, { name: "potassium", symbol: "K", charge: 1 }, { name: "ammonium", symbol: "NH4", charge: 1, poly: true }, { name: "silver", symbol: "Ag", charge: 1 },
  { name: "magnesium", symbol: "Mg", charge: 2 }, { name: "calcium", symbol: "Ca", charge: 2 }, { name: "zinc", symbol: "Zn", charge: 2 }, { name: "copper(II)", symbol: "Cu", charge: 2 },
  { name: "iron(II)", symbol: "Fe", charge: 2 }, { name: "barium", symbol: "Ba", charge: 2 }, { name: "lead(II)", symbol: "Pb", charge: 2 }, { name: "aluminium", symbol: "Al", charge: 3 }, { name: "iron(III)", symbol: "Fe", charge: 3 },
];
export const ANIONS: Ion[] = [
  { name: "chloride", symbol: "Cl", charge: -1 }, { name: "bromide", symbol: "Br", charge: -1 }, { name: "iodide", symbol: "I", charge: -1 }, { name: "hydroxide", symbol: "OH", charge: -1, poly: true },
  { name: "nitrate", symbol: "NO3", charge: -1, poly: true }, { name: "hydrogen carbonate", symbol: "HCO3", charge: -1, poly: true }, { name: "oxide", symbol: "O", charge: -2 }, { name: "sulphide", symbol: "S", charge: -2 },
  { name: "sulphate", symbol: "SO4", charge: -2, poly: true }, { name: "carbonate", symbol: "CO3", charge: -2, poly: true }, { name: "phosphate", symbol: "PO4", charge: -3, poly: true },
];
const MISSING = new Set(["ammonium oxide", "ammonium sulphide", "silver hydroxide", "silver hydrogen carbonate", "copper(II) iodide", "iron(III) iodide", "iron(III) sulphide", "iron(III) carbonate", "aluminium carbonate", "aluminium hydrogen carbonate", "iron(III) hydrogen carbonate", "copper(II) hydrogen carbonate", "iron(II) hydrogen carbonate", "lead(II) hydrogen carbonate", "zinc hydrogen carbonate", "barium hydrogen carbonate"]);
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
export function compound(cation: Ion, anion: Ion): { name: string; formula: string; nCat: number; nAn: number; cation: Ion; anion: Ion } | null {
  const name = `${cation.name} ${anion.name}`; if (MISSING.has(name)) return null;
  const l = (cation.charge * -anion.charge) / gcd(cation.charge, -anion.charge); const nCat = l / cation.charge, nAn = l / -anion.charge;
  const part = (ion: Ion, n: number) => n === 1 ? ion.symbol : ion.poly ? `(${ion.symbol})${n}` : `${ion.symbol}${n}`;
  return { name, formula: part(cation, nCat) + part(anion, nAn), nCat, nAn, cation, anion };
}

/* Elements 1 to 30, for configurations, periods, groups and valency. */
export const ELEMENTS = ["Hydrogen", "Helium", "Lithium", "Beryllium", "Boron", "Carbon", "Nitrogen", "Oxygen", "Fluorine", "Neon", "Sodium", "Magnesium", "Aluminium", "Silicon", "Phosphorus", "Sulphur", "Chlorine", "Argon", "Potassium", "Calcium", "Scandium", "Titanium", "Vanadium", "Chromium", "Manganese", "Iron", "Cobalt", "Nickel", "Copper", "Zinc"];
export const SYMBOLS = ["H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne", "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar", "K", "Ca", "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn"];
const ORDER: [string, number][] = [["1s", 2], ["2s", 2], ["2p", 6], ["3s", 2], ["3p", 6], ["4s", 2], ["3d", 10]];
/** Ground-state configuration by the Aufbau order, with the Cr and Cu exceptions. */
export function configuration(z: number): string {
  if (z === 24) return "1s² 2s² 2p⁶ 3s² 3p⁶ 3d⁵ 4s¹";
  if (z === 29) return "1s² 2s² 2p⁶ 3s² 3p⁶ 3d¹⁰ 4s¹";
  const sup = (n: number) => String(n).replace(/\d/g, d => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(d)]);
  const parts: [string, number][] = []; let left = z;
  for (const [orbital, cap] of ORDER) { if (!left) break; const n = Math.min(cap, left); parts.push([orbital, n]); left -= n; }
  // Written in shell order (3d before 4s), as the textbooks do.
  return parts.sort((a, b) => Number(a[0][0]) - Number(b[0][0]) || "spd".indexOf(a[0][1]) - "spd".indexOf(b[0][1])).map(([o, n]) => `${o}${sup(n)}`).join(" ");
}
/** K, L, M, N shell distribution for Z ≤ 20 (the Class 10 form). */
export function shells(z: number): string { const caps = [2, 8, 8, 2]; const out: number[] = []; let left = z; for (const cap of caps) { if (!left) break; const n = Math.min(cap, left); out.push(n); left -= n; } return out.join(", "); }
export function periodGroup(z: number): { period: number; group: number } {
  if (z <= 2) return { period: 1, group: z === 1 ? 1 : 18 };
  const [start, period] = z <= 10 ? [3, 2] : z <= 18 ? [11, 3] : [19, 4];
  const pos = z - start; // 0-based position in the period
  if (period < 4) return { period, group: pos < 2 ? pos + 1 : pos + 11 };
  return { period, group: pos + 1 }; // K, Ca and the 3d series: groups 1 to 12
}
export function valency(z: number): number | null { const { group, period } = periodGroup(z); if (period === 4 && group > 2) return null; return group <= 2 ? group : group === 18 ? 0 : group <= 14 ? group - 10 : 18 - group; }

/* Organic: straight-chain homologous series, C1 to C10. */
export const ROOTS = ["meth", "eth", "prop", "but", "pent", "hex", "hept", "oct", "non", "dec"];
export type Series = { id: string; name: string; group: string; general: string; min: number; className: "10" | "12" | "both"; name_: (n: number) => string; formula: (n: number) => string; condensed: (n: number) => string };
/** k CH2 units: "", "CH2" or "(CH2)k". */
const tail = (k: number) => k <= 0 ? "" : k === 1 ? "CH2" : `(CH2)${k}`;
export const SERIES: Series[] = [
  { id: "alkane", name: "Alkanes", group: "None (C–C single bonds only)", general: "CₙH₂ₙ₊₂", min: 1, className: "both", name_: n => `${ROOTS[n - 1]}ane`, formula: n => `C${n}H${2 * n + 2}`, condensed: n => n === 1 ? "CH4" : `CH3${tail(n - 2)}CH3` },
  { id: "alkene", name: "Alkenes", group: "C=C (double bond)", general: "CₙH₂ₙ", min: 2, className: "both", name_: n => n <= 3 ? `${ROOTS[n - 1]}ene` : `${ROOTS[n - 1]}-1-ene`, formula: n => `C${n}H${2 * n}`, condensed: n => n === 2 ? "CH2=CH2" : `CH2=CH${tail(n - 3)}CH3` },
  { id: "alkyne", name: "Alkynes", group: "C≡C (triple bond)", general: "CₙH₂ₙ₋₂", min: 2, className: "both", name_: n => n <= 3 ? `${ROOTS[n - 1]}yne` : `${ROOTS[n - 1]}-1-yne`, formula: n => `C${n}H${2 * n - 2}`, condensed: n => n === 2 ? "HC≡CH" : `HC≡C${tail(n - 3)}CH3` },
  { id: "alcohol", name: "Alcohols", group: "–OH (hydroxyl)", general: "CₙH₂ₙ₊₁OH", min: 1, className: "both", name_: n => n <= 2 ? `${ROOTS[n - 1]}anol` : `${ROOTS[n - 1]}an-1-ol`, formula: n => `C${n}H${2 * n + 1}OH`, condensed: n => n === 1 ? "CH3OH" : `CH3${tail(n - 2)}CH2OH` },
  { id: "aldehyde", name: "Aldehydes", group: "–CHO (aldehyde)", general: "CₙH₂ₙ₊₁CHO", min: 1, className: "both", name_: n => `${ROOTS[n - 1]}anal`, formula: n => n === 1 ? "HCHO" : `C${n - 1}H${2 * n - 1}CHO`, condensed: n => n === 1 ? "HCHO" : `CH3${tail(n - 2)}CHO` },
  { id: "ketone", name: "Ketones", group: ">C=O (keto)", general: "CₙH₂ₙO", min: 3, className: "both", name_: n => n === 3 ? "propanone" : `${ROOTS[n - 1]}an-2-one`, formula: n => `C${n}H${2 * n}O`, condensed: n => `CH3CO${tail(n - 3)}CH3` },
  { id: "acid", name: "Carboxylic acids", group: "–COOH (carboxyl)", general: "CₙH₂ₙ₊₁COOH", min: 1, className: "both", name_: n => `${ROOTS[n - 1]}anoic acid`, formula: n => n === 1 ? "HCOOH" : `C${n - 1}H${2 * n - 1}COOH`, condensed: n => n === 1 ? "HCOOH" : `CH3${tail(n - 2)}COOH` },
  { id: "haloalkane", name: "Haloalkanes", group: "–X (halogen; here –Cl)", general: "CₙH₂ₙ₊₁Cl", min: 1, className: "12", name_: n => n <= 2 ? `chloro${ROOTS[n - 1]}ane` : `1-chloro${ROOTS[n - 1]}ane`, formula: n => `C${n}H${2 * n + 1}Cl`, condensed: n => n === 1 ? "CH3Cl" : `CH3${tail(n - 2)}CH2Cl` },
  { id: "amine", name: "Primary amines", group: "–NH₂ (amino)", general: "CₙH₂ₙ₊₁NH₂", min: 1, className: "12", name_: n => n <= 2 ? `${ROOTS[n - 1]}anamine` : `${ROOTS[n - 1]}an-1-amine`, formula: n => `C${n}H${2 * n + 1}NH2`, condensed: n => n === 1 ? "CH3NH2" : `CH3${tail(n - 2)}CH2NH2` },
];
/** Number of structural (chain) isomers of the alkane CₙH₂ₙ₊₂. */
export const ALKANE_ISOMERS: Record<number, number> = { 1: 1, 2: 1, 3: 1, 4: 2, 5: 3, 6: 5, 7: 9, 8: 18, 9: 35, 10: 75 };
/** Balanced complete combustion of CxHyOz(N): coefficients [fuel, O2, CO2, H2O] in lowest whole numbers. */
export function combustion(formula: string): { fuel: number; o2: number; co2: number; h2o: number } | null {
  const a = atoms(formula); const x = a.get("C") ?? 0, y = a.get("H") ?? 0, z = a.get("O") ?? 0;
  if (!x || [...a.keys()].some(el => !["C", "H", "O"].includes(el))) return null;
  // Work in quarters so fractional O2 becomes whole.
  for (const k of [1, 2, 4]) { const o2 = k * (x + y / 4 - z / 2); if (Number.isInteger(o2) && Number.isInteger(k * y / 2)) return { fuel: k, o2, co2: k * x, h2o: k * y / 2 }; }
  return null;
}
