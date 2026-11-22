import type { ClassId } from "../types";
import { ANIONS, CATIONS, ELEMENTS, MASS, SYMBOLS, atoms, compound, configuration, massSteps, molarMass, periodGroup, shells, sub, valency } from "./chem-data";
import { Bank, int, num, pick, rng, sci, shuffle, type Generated, type Rand } from "./util";

/* Generated Inorganic (and Physical) Chemistry: formulae, moles, configurations, solutions, kinetics, cells, all computed. */
const COMPOUNDS = CATIONS.flatMap(c => ANIONS.map(a => compound(c, a))).filter((x): x is NonNullable<typeof x> => !!x);
const SOLUTES: [string, string, boolean][] = [["glucose", "C6H12O6", false], ["urea", "CO(NH2)2", false], ["sucrose", "C12H22O11", false], ["sodium hydroxide", "NaOH", true], ["sodium chloride", "NaCl", true], ["potassium chloride", "KCl", true], ["sulphuric acid", "H2SO4", true], ["calcium carbonate", "CaCO3", true]];
const ELECTRODES: [string, string, number, number][] = [["Zn²⁺/Zn", "Zn", -0.76, 2], ["Cu²⁺/Cu", "Cu", 0.34, 2], ["Ag⁺/Ag", "Ag", 0.8, 1], ["Fe²⁺/Fe", "Fe", -0.44, 2], ["Mg²⁺/Mg", "Mg", -2.37, 2], ["Ni²⁺/Ni", "Ni", -0.25, 2], ["Pb²⁺/Pb", "Pb", -0.13, 2], ["Al³⁺/Al", "Al", -1.66, 3], ["H⁺/H₂", "H₂", 0, 1], ["Sn²⁺/Sn", "Sn", -0.14, 2]];
/** Complexes with the metal's oxidation state and coordination number (hand-checked). */
const COMPLEXES: [string, string, number, number][] = [["[Co(NH₃)₆]Cl₃", "Co", 3, 6], ["K₄[Fe(CN)₆]", "Fe", 2, 6], ["K₃[Fe(CN)₆]", "Fe", 3, 6], ["[Ni(CO)₄]", "Ni", 0, 4], ["[Cu(NH₃)₄]SO₄", "Cu", 2, 4], ["K₂[PtCl₄]", "Pt", 2, 4], ["[Cr(H₂O)₆]Cl₃", "Cr", 3, 6], ["[Co(NH₃)₅Cl]Cl₂", "Co", 3, 6], ["K₃[Co(C₂O₄)₃]", "Co", 3, 6], ["[Pt(NH₃)₂Cl₂]", "Pt", 2, 4], ["K₂[Ni(CN)₄]", "Ni", 2, 4], ["[Fe(H₂O)₆]SO₄", "Fe", 2, 6], ["[Ag(NH₃)₂]Cl", "Ag", 1, 2], ["[Co(en)₃]Cl₃", "Co", 3, 6], ["Na₃[AlF₆]", "Al", 3, 6], ["[Zn(NH₃)₄]SO₄", "Zn", 2, 4], ["K₃[Cr(C₂O₄)₃]", "Cr", 3, 6], ["[Mn(H₂O)₆]Cl₂", "Mn", 2, 6]];
const sign = (x: number) => (x > 0 ? `+${x}` : x < 0 ? `−${-x}` : "0");

function classTen(b: Bank, r: Rand) {
  for (const c of shuffle(r, COMPOUNDS)) {
    const f = sub(c.formula); const chapter = /oxide|hydroxide/.test(c.name) ? "Acids, Bases and Salts" : "Chemical Reactions and Equations";
    const wrongs = [sub(c.formula.replace(/[()]/g, "")), ...COMPOUNDS.filter(o => o !== c && (o.name.startsWith(c.name.split(" ")[0]) || o.name.endsWith(c.name.split(" ").slice(1).join(" ")))).map(o => sub(o.formula))];
    const part = (ion: typeof c.cation, n: number) => n === 1 ? ion.symbol : ion.poly ? `(${ion.symbol})${n}` : `${ion.symbol}${n}`;
    const swapped = c.nCat !== c.nAn ? sub(part(c.cation, c.nAn) + part(c.anion, c.nCat)) : sub(part(c.cation, 2) + part(c.anion, 1));
    b.mcq(chapter, `What is the chemical formula of ${c.name}?`, f, [swapped, ...wrongs], `Criss-cross the valencies: the ions combine ${c.nCat} : ${c.nAn}, giving ${f}.`);
    const ionText = (ion: typeof c.cation) => `${sub(ion.symbol)}${ion.poly ? " (polyatomic)" : ""}, valency ${Math.abs(ion.charge)}`;
    b.solved(chapter, `Write the chemical formula of ${c.name} using the criss-cross method.`, f, ["// Write the symbols with their valencies", `Cation: ${ionText(c.cation)}`, `Anion: ${ionText(c.anion)}`, "// Cross the valencies over as subscripts, then reduce to the simplest ratio", `Ratio ${c.cation.symbol} : ${c.anion.symbol} = ${c.nCat} : ${c.nAn}${c.anion.poly && c.nAn > 1 ? " (brackets keep the polyatomic ion together)" : ""}`, `∴ ${f}`], 2);
    const M = molarMass(c.formula);
    b.mcq("Mole Concept", `What is the molar mass of ${c.name} (${f})?`, `${num(M)} g/mol`, [M + 16, M - 16, M + 1, M * 2, M - 1].map(x => `${num(x)} g/mol`), `${massSteps(c.formula).join("; ")}.`);
    b.solved("Mole Concept", `Calculate the molar mass of ${c.name} (${f}).`, `${num(M)} g/mol`, ["// Add the atomic masses of every atom", ...massSteps(c.formula), `∴ M = ${num(M)} g/mol`], 2);
    const total = [...atoms(c.formula).values()].reduce((s, n) => s + n, 0);
    b.mcq("Mole Concept", `How many atoms in total are there in one formula unit of ${f}?`, String(total), [total + 1, total - 1, total + 2, total * 2].map(String), `Count every atom, multiplying by subscripts outside brackets: ${[...atoms(c.formula)].map(([el, n]) => `${el} ${n}`).join(", ")} = ${total}.`);
  }
  b.repeat(110, () => {
    const c = pick(r, COMPOUNDS); const M = molarMass(c.formula); const n = pick(r, [0.1, 0.2, 0.25, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5]); const m = Number((M * n).toFixed(2)); const f = sub(c.formula);
    if (r() < 0.5) return b.mcq("Mole Concept", `How many moles are present in ${num(m)} g of ${f}?`, `${n} mol`, [`${num(n * 2)} mol`, `${num(n / 2, 3)} mol`, `${num(m * M)} mol`, `${num(n + 1)} mol`], `n = m/M = ${num(m)} / ${num(M)} = ${n} mol.`);
    return b.solved("Mole Concept", `Calculate the number of moles and the number of formula units in ${num(m)} g of ${c.name} (${f}).`, `${n} mol; ${sci(n * 6.022e23)} formula units`, ["// Molar mass", `M = ${num(M)} g/mol`, "// Moles = mass / molar mass", `n = ${num(m)} / ${num(M)} = ${n} mol`, "// Multiply by Avogadro's number", `N = ${n} × 6.022 × 10²³`, `∴ N = ${sci(n * 6.022e23)}`], 3);
  });
  for (let z = 1; z <= 20; z++) {
    const name = ELEMENTS[z - 1], { period, group } = periodGroup(z), v = valency(z);
    b.mcq("Periodic Classification of Elements", `What is the electronic configuration (K, L, M, N) of ${name} (Z = ${z})?`, shells(z), [shells(z + 1), shells(Math.max(1, z - 1)), shells(z).split(", ").reverse().join(", "), shells(Math.min(20, z + 2))], `Fill K (2), L (8), M (8) then N: ${name} = ${shells(z)}.`);
    b.mcq("Periodic Classification of Elements", `In which period and group is ${name} (Z = ${z}) placed in the modern periodic table?`, `Period ${period}, group ${group}`, [`Period ${period + 1}, group ${group}`, `Period ${period}, group ${group === 18 ? 17 : group + 1}`, `Period ${Math.max(1, period - 1)}, group ${group}`, `Period ${group > 4 ? 4 : group}, group ${period}`], `${shells(z).split(", ").length} shells → period ${period}; ${shells(z).split(", ").pop()} valence electron(s) → group ${group}.`);
    if (v !== null) b.mcq("Periodic Classification of Elements", `What is the valency of ${name} (Z = ${z})?`, String(v), ["0", "1", "2", "3", "4"], `Configuration ${shells(z)}: it ${v === 0 ? "has a complete octet" : `needs to lose or gain ${v} electron(s)`} → valency ${v}.`);
    b.bank("Periodic Classification of Elements", `Write the electronic configuration of ${name} (Z = ${z}) and state its period, group and valency.`, `${shells(z)}; period ${period}, group ${group}${v !== null ? `, valency ${v}` : ""}.`, 2);
  }
  for (let pH = 0; pH <= 14; pH++) b.mcq("Acids, Bases and Salts", `A solution has pH ${pH}. It is`, pH < 7 ? (pH <= 3 ? "Strongly acidic" : "Weakly acidic") : pH === 7 ? "Neutral" : pH >= 11 ? "Strongly basic" : "Weakly basic", ["Strongly acidic", "Weakly acidic", "Neutral", "Weakly basic", "Strongly basic"], `pH below 7 is acidic, 7 is neutral, above 7 is basic; the further from 7, the stronger.`);
  b.repeat(55, () => {
    const c = pick(r, COMPOUNDS); const els = [...atoms(c.formula)]; const [el, n] = pick(r, els); const M = molarMass(c.formula); const pct = (MASS[el] * n * 100) / M;
    return b.solved("Mole Concept", `Find the percentage by mass of ${el} in ${sub(c.formula)}.`, `${num(pct, 1)}%`, ["// Molar mass of the compound", `M = ${num(M)} g/mol`, `// Mass of ${el} in one mole`, `${MASS[el]} × ${n} = ${num(MASS[el] * n)} g`, `% ${el} = (mass of ${el} / M) × 100`, `∴ % ${el} = ${num(pct, 1)}%`], 2);
  });
}

function classTwelve(b: Bank, r: Rand) {
  for (let z = 1; z <= 30; z++) {
    const name = ELEMENTS[z - 1], conf = configuration(z);
    b.mcq(z > 20 ? "d- and f-Block Elements" : "Structure of Atom (revision)", `What is the ground-state electronic configuration of ${name} (Z = ${z})?`, conf, [configuration(z + 1 > 30 ? z - 2 : z + 1), configuration(Math.max(1, z - 1)), z === 24 ? "1s² 2s² 2p⁶ 3s² 3p⁶ 3d⁴ 4s²" : z === 29 ? "1s² 2s² 2p⁶ 3s² 3p⁶ 3d⁹ 4s²" : configuration(Math.max(1, z - 2)), configuration(Math.min(30, z + 2))], z === 24 || z === 29 ? `${name} is an exception: a half-filled (3d⁵) or full (3d¹⁰) d subshell is extra stable, so: ${conf}.` : `Aufbau order 1s 2s 2p 3s 3p 4s 3d: ${conf}.`);
  }
  // Transition-metal ions: unpaired electrons and spin-only magnetic moment.
  const IONS: [number, number][] = [[21, 3], [22, 3], [22, 4], [23, 3], [23, 2], [24, 3], [24, 2], [25, 2], [25, 3], [26, 2], [26, 3], [27, 2], [27, 3], [28, 2], [29, 2], [29, 1], [30, 2]];
  for (const [z, q] of IONS) {
    const d = z - 18 - q; const unpaired = d <= 5 ? d : 10 - d; const mu = Math.sqrt(unpaired * (unpaired + 2)); const ion = `${SYMBOLS[z - 1]}${q === 1 ? "⁺" : `${"⁰¹²³⁴"[q]}⁺`}`;
    b.mcq("d- and f-Block Elements", `How many unpaired electrons are there in ${ion} (Z of ${SYMBOLS[z - 1]} = ${z})?`, String(unpaired), ["0", "1", "2", "3", "4", "5"], `${ion}: [Ar] 3d${d === 10 ? "¹⁰" : "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]} (4s electrons leave first); Hund's rule gives ${unpaired} unpaired.`);
    b.solved("d- and f-Block Elements", `Calculate the spin-only magnetic moment of ${ion} (Z = ${z}).`, `${num(mu, 2)} BM`, ["// Configuration of the ion (remove 4s electrons first)", `${ion}: [Ar] 3d${"⁰¹²³⁴⁵⁶⁷⁸⁹"[d] ?? "¹⁰"}`, `// Unpaired electrons n = ${unpaired}`, "μ = √[n(n + 2)] BM", `μ = √(${unpaired} × ${unpaired + 2})`, `∴ μ = ${num(mu, 2)} BM`], 3);
  }
  // Solutions
  b.repeat(70, () => {
    const [name, formula] = pick(r, SOLUTES); const M = molarMass(formula); const n = pick(r, [0.1, 0.2, 0.25, 0.5, 1, 2]); const m = Number((M * n).toFixed(2)); const V = pick(r, [250, 500, 1000, 2000]); const molarity = n / (V / 1000);
    if (r() < 0.5) return b.mcq("Solutions", `${num(m)} g of ${name} (${sub(formula)}) is dissolved to make ${V} mL of solution. What is the molarity?`, `${num(molarity, 3)} M`, [`${num(n, 3)} M`, `${num(molarity * 2, 3)} M`, `${num(m / V, 3)} M`, `${num(molarity / 2, 3)} M`], `n = ${num(m)}/${num(M)} = ${n} mol; M = n/V(L) = ${n}/${V / 1000} = ${num(molarity, 3)} M.`);
    return b.solved("Solutions", `Calculate the molarity of a solution containing ${num(m)} g of ${name} (${sub(formula)}) in ${V} mL of solution.`, `${num(molarity, 3)} M`, ["// Moles of solute", `M(${sub(formula)}) = ${num(M)} g/mol`, `n = ${num(m)} / ${num(M)} = ${n} mol`, "// Molarity = moles per litre of solution", `M = ${n} / ${V / 1000}`, `∴ Molarity = ${num(molarity, 3)} M`], 3);
  });
  b.repeat(60, () => {
    const [name, formula, ionic] = pick(r, SOLUTES.filter(s => !s[2])); void ionic; const M = molarMass(formula); const mass = pick(r, [9, 18, 30, 34.2, 36, 45, 60, 68.4, 90]); const water = pick(r, [100, 200, 250, 500]); const molal = mass / M / (water / 1000);
    const freeze = r() < 0.5; const K = freeze ? 1.86 : 0.52; const dT = K * molal;
    return b.solved("Solutions", `${mass} g of ${name} (${sub(formula)}, a non-electrolyte) is dissolved in ${water} g of water. Find the ${freeze ? "depression in freezing point" : "elevation in boiling point"}. (${freeze ? "K_f" : "K_b"} of water = ${K} K kg/mol)`, `${num(dT, 3)} K`, ["// Molality of the solution", `n = ${mass} / ${num(M)} = ${num(mass / M, 4)} mol`, `m = ${num(mass / M, 4)} / ${water / 1000} kg = ${num(molal, 4)} mol/kg`, `// ${freeze ? "ΔT_f = K_f × m" : "ΔT_b = K_b × m"}`, `ΔT = ${K} × ${num(molal, 4)}`, `∴ ΔT = ${num(dT, 3)} K`], 3);
  });
  b.repeat(40, () => {
    const [name, formula] = pick(r, SOLUTES.filter(s => !s[2])); const M = molarMass(formula); const mass = pick(r, [18, 36, 60, 90, 34.2]); const water = pick(r, [100, 250, 500, 1000]); const molal = mass / M / (water / 1000); const dT = 1.86 * molal;
    return b.mcq("Solutions", `What is the freezing point of a solution of ${mass} g of ${name} in ${water} g of water? (K_f = 1.86 K kg/mol)`, `${num(-dT, 3)} °C`, [num(dT, 3), num(-dT * 2, 3), num(-dT / 2, 3), num(-0.52 * molal, 3)].map(x => `${x} °C`), `ΔT_f = 1.86 × ${num(molal, 4)} = ${num(dT, 3)} K below 0 °C.`);
  });
  // Chemical kinetics (first order)
  b.repeat(60, () => {
    const k = pick(r, [0.0693, 0.00693, 0.0231, 0.0347, 0.1386, 0.01155, 0.693, 0.231]); const unit = pick(r, ["s⁻¹", "min⁻¹"] as const); const t = 0.693 / k; const u = unit === "s⁻¹" ? "s" : "min";
    if (r() < 0.5) return b.mcq("Chemical Kinetics", `The rate constant of a first-order reaction is ${k} ${unit}. What is its half-life?`, `${num(t, 2)} ${u}`, [`${num(t * 2, 2)} ${u}`, `${num(k / 0.693, 3)} ${u}`, `${num(t / 2, 2)} ${u}`, `${num(1 / k, 2)} ${u}`], `t½ = 0.693/k = 0.693/${k} = ${num(t, 2)} ${u}.`);
    const n = int(r, 2, 5); return b.solved("Chemical Kinetics", `A first-order reaction has k = ${k} ${unit}. What fraction of the reactant remains after ${num(t * n, 2)} ${u}?`, `1/${2 ** n} (${num(100 / 2 ** n, 2)}%)`, ["// Half-life of a first-order reaction", `t½ = 0.693 / ${k} = ${num(t, 2)} ${u}`, `// Number of half-lives: ${num(t * n, 2)} / ${num(t, 2)} = ${n}`, `Fraction left = (1/2)^${n}`, `∴ 1/${2 ** n} remains`], 3);
  });
  // Solid state
  const CELLS: [string, number, string][] = [["simple cubic", 1, "8 corners × 1/8"], ["body-centred cubic", 2, "8 × 1/8 + 1 at the centre"], ["face-centred cubic", 4, "8 × 1/8 + 6 faces × 1/2"]];
  for (const [cell, z, why] of CELLS) b.mcq("Solid State", `How many atoms are there per unit cell in a ${cell} lattice?`, String(z), ["1", "2", "4", "6", "8"], `${why} = ${z}.`);
  b.repeat(30, () => {
    const [cell, z] = pick(r, CELLS); const [metal, M] = pick(r, [["copper", 63.5], ["silver", 108], ["iron", 56], ["aluminium", 27], ["sodium", 23], ["potassium", 39]] as const); const a = pick(r, [286, 300, 361, 400, 405, 409, 428]);
    const rho = (z * M) / ((a * 1e-10) ** 3 * 6.022e23);
    return b.solved("Solid State", `${metal[0].toUpperCase() + metal.slice(1)} (M = ${M} g/mol) is taken to crystallise in a ${cell} lattice with edge length ${a} pm. Calculate its density.`, `${num(rho, 2)} g/cm³`, ["// Density of a unit cell", "ρ = zM / (a³ N_A)", `z = ${z}, a = ${a} pm = ${a} × 10⁻¹⁰ cm`, `ρ = ${z} × ${M} / [(${a} × 10⁻¹⁰)³ × 6.022 × 10²³]`, `∴ ρ ≈ ${num(rho, 2)} g/cm³`], 4);
  });
  // Electrochemistry
  for (const [cathode, , e1, n1] of ELECTRODES) for (const [anode, , e2, n2] of ELECTRODES) {
    if (e1 <= e2) continue; const E = Number((e1 - e2).toFixed(2)); const n = (n1 * n2) / (n1 === n2 ? n1 : n1 % n2 === 0 || n2 % n1 === 0 ? Math.min(n1, n2) : 1); // electrons transferred: lcm of the two charges
    b.mcq("Electrochemistry", `Find E°cell for a cell made of ${anode} (anode, E° = ${sign(e2)} V) and ${cathode} (cathode, E° = ${sign(e1)} V).`, `${num(E)} V`, [num(e1 + e2), num(-E), num(E / 2), num(E + 0.5)].map(x => `${x} V`), `E°cell = E°cathode − E°anode = ${sign(e1)} − (${sign(e2)}) = ${num(E)} V.`);
    if (r() < 0.45) { const dG = -n * 96500 * E; b.solved("Electrochemistry", `Calculate ΔG° for the cell ${anode} || ${cathode} (E°: ${sign(e2)} V and ${sign(e1)} V), with n = ${n}.`, `${num(dG / 1000, 1)} kJ/mol`, ["// Standard cell potential", `E°cell = ${sign(e1)} − (${sign(e2)}) = ${num(E)} V`, "// ΔG° = −nFE°cell", `ΔG° = −${n} × 96500 × ${num(E)}`, `∴ ΔG° = ${num(dG, 0)} J/mol = ${num(dG / 1000, 1)} kJ/mol`], 3); }
  }
  // Coordination compounds
  for (const [complex, metal, ox, cn] of COMPLEXES) {
    b.mcq("Coordination Compounds", `What is the oxidation state of ${metal} in ${complex}?`, sign(ox), ["0", "+1", "+2", "+3", "+4"], `Sum of charges: ligands and counter-ions fix ${metal} at ${sign(ox)}.`);
    b.mcq("Coordination Compounds", `What is the coordination number of ${metal} in ${complex}?`, String(cn), ["2", "3", "4", "5", "6"], `${metal} is bonded to ${cn} donor atoms${complex.includes("en") || complex.includes("C₂O₄") ? " (each en or oxalate is bidentate)" : ""}.`);
    b.bank("Coordination Compounds", `State the oxidation state and coordination number of the central metal in ${complex}.`, `${metal}: oxidation state ${sign(ox)}, coordination number ${cn}.`, 2);
  }
  // More physical chemistry: solutions, kinetics, electrochemistry and the solid state.
  type P = { ch: string; q: string; a: string; steps: string[]; wrong: string[]; why: string };
  const both = (count: number, make: () => P | null) => {
    b.repeat(count, () => { const p = make(); return !!p && b.mcq(p.ch, p.q, p.a, p.wrong, p.why); });
    b.repeat(Math.ceil(count * 0.6), () => { const p = make(); return !!p && b.solved(p.ch, p.q, p.a, p.steps, 3); });
  };
  const nonElectrolytes = SOLUTES.filter(s => !s[2]);
  both(60, () => {
    const [name, formula] = pick(r, nonElectrolytes); const M = molarMass(formula); const mass = pick(r, [9, 18, 30, 34.2, 36, 45, 60, 68.4, 90, 171]); const kg = pick(r, [0.1, 0.2, 0.25, 0.5, 1]); const m = mass / M / kg;
    return { ch: "Solutions", q: `${mass} g of ${name} (${sub(formula)}) is dissolved in ${kg * 1000} g of water. Find the molality.`, a: `${num(m, 3)} mol/kg`, steps: ["// Moles of solute", `n = ${mass} / ${num(M)} = ${num(mass / M, 4)} mol`, "// Molality = moles per kilogram of solvent", `m = ${num(mass / M, 4)} / ${kg}`, `∴ m = ${num(m, 3)} mol/kg`], wrong: [`${num(mass / M, 3)} mol/kg`, `${num(m * 2, 3)} mol/kg`, `${num(mass / kg, 3)} mol/kg`, `${num(m / 2, 3)} mol/kg`], why: `m = (${mass}/${num(M)}) / ${kg} kg = ${num(m, 3)} mol/kg.` };
  });
  both(60, () => {
    const n = pick(r, [0.01, 0.02, 0.05, 0.1, 0.2, 0.5]), V = pick(r, [0.25, 0.5, 1, 2]), T = pick(r, [273, 298, 300, 310]); const C = n / V; const pi = C * 0.0821 * T;
    return { ch: "Solutions", q: `${n} mol of a non-electrolyte is dissolved to make ${V} L of solution at ${T} K. Find the osmotic pressure. (R = 0.0821 L atm K⁻¹ mol⁻¹)`, a: `${num(pi, 3)} atm`, steps: ["// Concentration in mol/L", `C = ${n} / ${V} = ${num(C, 4)} mol/L`, "// van 't Hoff equation", "π = CRT", `π = ${num(C, 4)} × 0.0821 × ${T}`, `∴ π = ${num(pi, 3)} atm`], wrong: [`${num(n * 0.0821 * T, 3)} atm`, `${num(pi * 2, 3)} atm`, `${num(C * 8.314 * T, 1)} atm`, `${num(pi / T, 5)} atm`], why: `π = CRT = ${num(C, 4)} × 0.0821 × ${T} = ${num(pi, 3)} atm.` };
  });
  both(45, () => {
    const [name, formula] = pick(r, nonElectrolytes); const M = molarMass(formula); const mass = pick(r, [18, 36, 60, 90, 171, 342]); const water = pick(r, [90, 180, 360, 500, 900]); const n2 = mass / M, n1 = water / 18; const x2 = n2 / (n1 + n2);
    return { ch: "Solutions", q: `${mass} g of ${name} is dissolved in ${water} g of water. Find the relative lowering of vapour pressure (the mole fraction of the solute).`, a: `${num(x2, 4)}`, steps: ["// Raoult's law: (p° − p)/p° = x₂", `n₂ = ${mass} / ${num(M)} = ${num(n2, 4)} mol; n₁ = ${water} / 18 = ${num(n1, 3)} mol`, `x₂ = n₂ / (n₁ + n₂) = ${num(n2, 4)} / ${num(n1 + n2, 4)}`, `∴ (p° − p)/p° = ${num(x2, 4)}`], wrong: [num(n1 / (n1 + n2), 4), num(n2 / n1 * 2, 4), num(n2, 4), num(x2 * 10, 4)], why: `The relative lowering equals the solute's mole fraction: ${num(x2, 4)}.` };
  });
  both(50, () => {
    const t = pick(r, [10, 20, 30, 40, 50, 69.3, 100, 138.6, 200, 346.5]); const unit = pick(r, ["s", "min"] as const); const k = 0.693 / t;
    return { ch: "Chemical Kinetics", q: `The half-life of a first-order reaction is ${t} ${unit}. Find its rate constant.`, a: `${sci(k)} ${unit}⁻¹`, steps: ["// For a first-order reaction t½ = 0.693/k", "k = 0.693 / t½", `k = 0.693 / ${t}`, `∴ k = ${sci(k)} ${unit}⁻¹`], wrong: [`${sci(t / 0.693)} ${unit}⁻¹`, `${sci(k * 2)} ${unit}⁻¹`, `${sci(1 / t)} ${unit}⁻¹`, `${sci(0.693 * t)} ${unit}⁻¹`], why: `k = 0.693/t½ = ${sci(k)} ${unit}⁻¹.` };
  });
  both(50, () => {
    const k = pick(r, [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 2.303e-3, 4.606e-3]); const [left, logv, label] = pick(r, [[10, 1, "90% completion"], [100, 2, "99% completion"], [4, 0.602, "75% completion"], [2, 0.301, "half completion"]] as const); const t = (2.303 / k) * logv;
    return { ch: "Chemical Kinetics", q: `A first-order reaction has k = ${sci(k)} s⁻¹. How long does it take to reach ${label}?`, a: `${sci(t)} s`, steps: ["// Integrated rate law for first order", "t = (2.303 / k) log([A]₀/[A])", `[A]₀/[A] = ${left}, log ${left} = ${logv}`, `t = (2.303 / ${sci(k)}) × ${logv}`, `∴ t = ${sci(t)} s`], wrong: [`${sci(t * 2)} s`, `${sci(2.303 / k)} s`, `${sci(t / 2.303)} s`, `${sci(k * t)} s`], why: `t = (2.303/k) log ${left} = ${sci(t)} s.` };
  });
  both(70, () => {
    const cat = pick(r, ELECTRODES), an = pick(r, ELECTRODES); if (cat[2] <= an[2] || cat[3] !== an[3]) return null; const n = cat[3]; const E0 = Number((cat[2] - an[2]).toFixed(2));
    const [Q, logQ] = pick(r, [[10, 1], [100, 2], [1000, 3], [0.1, -1], [0.01, -2]] as const); const E = E0 - (0.0591 / n) * logQ;
    return { ch: "Electrochemistry", q: `For the cell ${an[0]} (anode) || ${cat[0]} (cathode), E°cell = ${num(E0)} V and n = ${n}. Find E_cell when the reaction quotient Q = ${Q}.`, a: `${num(E, 4)} V`, steps: ["// Nernst equation at 298 K", "E = E° − (0.0591 / n) log Q", `E = ${num(E0)} − (0.0591 / ${n}) × log ${Q}`, `E = ${num(E0)} − (0.0591 / ${n}) × (${logQ})`, `∴ E = ${num(E, 4)} V`], wrong: [num(E0 + (0.0591 / n) * logQ, 4), num(E0, 2), num(E0 - 0.0591 * logQ, 4), num(E0 - (0.0591 / n) * logQ * 2.303, 4)].map(x => `${x} V`), why: `E = E° − (0.0591/n) log Q = ${num(E, 4)} V.` };
  });
  both(50, () => {
    const kappa = pick(r, [0.0025, 0.0049, 0.012, 0.0129, 0.0141, 1.06e-4, 3.9e-3]), c = pick(r, [0.001, 0.01, 0.02, 0.05, 0.1]); const L = kappa * 1000 / c;
    return { ch: "Electrochemistry", q: `The conductivity of a ${c} M solution is ${sci(kappa)} S cm⁻¹. Find its molar conductivity.`, a: `${sci(L)} S cm² mol⁻¹`, steps: ["// Molar conductivity", "Λₘ = κ × 1000 / C", `Λₘ = ${sci(kappa)} × 1000 / ${c}`, `∴ Λₘ = ${sci(L)} S cm² mol⁻¹`], wrong: [`${sci(kappa / c)} S cm² mol⁻¹`, `${sci(L / 1000)} S cm² mol⁻¹`, `${sci(kappa * c * 1000)} S cm² mol⁻¹`, `${sci(L * 2)} S cm² mol⁻¹`], why: `Λₘ = κ × 1000/C = ${sci(L)} S cm² mol⁻¹.` };
  });
  both(70, () => {
    const [metal, M, n] = pick(r, [["copper", 63.5, 2], ["silver", 108, 1], ["zinc", 65, 2], ["nickel", 59, 2], ["aluminium", 27, 3]] as const); const I = pick(r, [0.5, 1, 1.5, 2, 5, 10]), t = pick(r, [965, 1930, 3600, 9650, 19300]); const m = (M * I * t) / (n * 96500);
    return { ch: "Electrochemistry", q: `A current of ${I} A is passed for ${t} s through a solution of a ${metal} salt (${metal} ion charge +${n}). What mass of ${metal} is deposited? (M = ${M} g/mol, F = 96500 C/mol)`, a: `${num(m, 3)} g`, steps: ["// Charge passed", `Q = I × t = ${I} × ${t} = ${num(I * t)} C`, "// Faraday's first law: m = MQ / (nF)", `m = ${M} × ${num(I * t)} / (${n} × 96500)`, `∴ m = ${num(m, 3)} g`], wrong: [num(m * n, 3), num(m / 2, 3), num((M * I * t) / 96500, 3), num(m * 10, 3)].map(x => `${x} g`), why: `m = MIt/(nF) = ${num(m, 3)} g.` };
  });
  both(40, () => {
    const cell = pick(r, ["face-centred cubic", "body-centred cubic", "simple cubic"] as const); const a = pick(r, [286, 300, 316, 352, 361, 400, 408, 428, 494]);
    const radius = cell === "face-centred cubic" ? a / (2 * Math.SQRT2) : cell === "body-centred cubic" ? Math.sqrt(3) * a / 4 : a / 2; const rule = cell === "face-centred cubic" ? "r = a / (2√2)" : cell === "body-centred cubic" ? "r = √3 a / 4" : "r = a / 2";
    return { ch: "Solid State", q: `A metal crystallises in a ${cell} lattice with edge length ${a} pm. Find the atomic radius.`, a: `${num(radius, 1)} pm`, steps: [`// Atoms touch along the ${cell === "face-centred cubic" ? "face diagonal" : cell === "body-centred cubic" ? "body diagonal" : "edge"}`, rule, `r = ${rule.split("= ")[1].replace("a", String(a))}`, `∴ r ≈ ${num(radius, 1)} pm`], wrong: [num(a / 2, 1), num(Math.sqrt(3) * a / 4, 1), num(a / (2 * Math.SQRT2), 1), num(a, 1)].map(x => `${x} pm`), why: `${rule} = ${num(radius, 1)} pm.` };
  });
  both(40, () => {
    const [cell, z] = pick(r, CELLS); const [metal, M] = pick(r, [["copper", 63.5], ["silver", 108], ["iron", 56], ["aluminium", 27], ["sodium", 23], ["potassium", 39], ["gold", 197], ["nickel", 59]] as const); const a = pick(r, [286, 300, 316, 361, 400, 405, 408, 428]); const rho = (z * M) / ((a * 1e-10) ** 3 * 6.022e23);
    return { ch: "Solid State", q: `${metal[0].toUpperCase() + metal.slice(1)} (M = ${M} g/mol) is taken to form a ${cell} lattice with a = ${a} pm. What is its density?`, a: `${num(rho, 2)} g/cm³`, steps: ["ρ = zM / (a³ N_A)", `z = ${z}, a = ${a} × 10⁻¹⁰ cm`, `∴ ρ ≈ ${num(rho, 2)} g/cm³`], wrong: [num(rho * 2, 2), num(rho / z, 2), num(rho * z, 2), num(rho / 2, 2)].map(x => `${x} g/cm³`), why: `ρ = zM/(a³N_A) with z = ${z}: ${num(rho, 2)} g/cm³.` };
  });
  for (const [z, q] of IONS) {
    const d = z - 18 - q; const unpaired = d <= 5 ? d : 10 - d; const mu = Math.sqrt(unpaired * (unpaired + 2)); const ion = `${SYMBOLS[z - 1]}${q === 1 ? "⁺" : `${"⁰¹²³⁴"[q]}⁺`}`;
    b.mcq("d- and f-Block Elements", `What is the spin-only magnetic moment of ${ion} (Z = ${z})?`, `${num(mu, 2)} BM`, [0, 1, 2, 3, 4, 5].filter(n => n !== unpaired).map(n => `${num(Math.sqrt(n * (n + 2)), 2)} BM`), `${unpaired} unpaired electrons: μ = √[${unpaired}(${unpaired} + 2)] = ${num(mu, 2)} BM.`);
  }

}

export function generateInorganic(cls: ClassId): Generated {
  const r = rng(cls === "10" ? 4010 : 4212);
  const b = new Bank(`g${cls}-inorganic`, r);
  if (cls === "10") classTen(b, r); else classTwelve(b, r);
  return { items: b.items, mcqs: b.mcqs };
}
