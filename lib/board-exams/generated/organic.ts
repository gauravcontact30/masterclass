import type { ClassId } from "../types";
import { ALKANE_ISOMERS, ROOTS, SERIES, combustion, massSteps, molarMass, sub, type Series } from "./chem-data";
import { Bank, num, pick, rng, shuffle, type Generated } from "./util";

/* Generated Organic Chemistry: names, formulae, functional groups, molar masses and balanced equations, all computed. */
const clean = (f: string) => f.replace(/C1(?=[A-Z])/g, "C");
type Compound = { s: Series; n: number; name: string; formula: string; condensed: string; mass: number };

/** Hand-written facts for Class 12: named reactions and laboratory tests (question, answer, wrong options). */
const NAMED: [string, string, string, string[]][] = [
  ["Haloalkanes and Haloarenes", "Which reaction joins two alkyl halides with sodium in dry ether to give a higher alkane?", "Wurtz reaction", ["Fittig reaction", "Kolbe's reaction", "Sandmeyer reaction"]],
  ["Haloalkanes and Haloarenes", "Which reaction converts an alkyl chloride or bromide to an alkyl iodide using NaI in dry acetone?", "Finkelstein reaction", ["Swarts reaction", "Wurtz reaction", "Hunsdiecker reaction"]],
  ["Haloalkanes and Haloarenes", "Heating an alkyl chloride with AgF or Hg₂F₂ to give an alkyl fluoride is called the", "Swarts reaction", ["Finkelstein reaction", "Gattermann reaction", "Wurtz reaction"]],
  ["Haloalkanes and Haloarenes", "Benzenediazonium chloride treated with CuCl/HCl gives chlorobenzene. This is the", "Sandmeyer reaction", ["Gattermann–Koch reaction", "Reimer–Tiemann reaction", "Etard reaction"]],
  ["Haloalkanes and Haloarenes", "Which alkyl halide reacts fastest by the SN1 mechanism?", "Tertiary alkyl halide", ["Primary alkyl halide", "Methyl halide", "Secondary alkyl halide"]],
  ["Haloalkanes and Haloarenes", "Addition of HBr to propene in the presence of a peroxide gives 1-bromopropane. This is", "Anti-Markovnikov addition (peroxide effect)", ["Markovnikov addition", "Saytzeff elimination", "SN2 substitution"]],
  ["Alcohols, Phenols and Ethers", "Which reagent distinguishes primary, secondary and tertiary alcohols by the time taken to turn cloudy?", "Lucas reagent (conc. HCl + anhydrous ZnCl₂)", ["Tollens' reagent", "Fehling's solution", "Hinsberg's reagent"]],
  ["Alcohols, Phenols and Ethers", "Phenol treated with CO₂ and NaOH under pressure, then acidified, gives salicylic acid. This is", "Kolbe's reaction", ["Reimer–Tiemann reaction", "Williamson synthesis", "Cannizzaro reaction"]],
  ["Alcohols, Phenols and Ethers", "Phenol with chloroform and aqueous NaOH gives salicylaldehyde. This is the", "Reimer–Tiemann reaction", ["Kolbe's reaction", "Etard reaction", "Rosenmund reduction"]],
  ["Alcohols, Phenols and Ethers", "Ethers are best prepared from an alkyl halide and sodium alkoxide by", "Williamson synthesis", ["Wurtz reaction", "Kolbe electrolysis", "Fittig reaction"]],
  ["Alcohols, Phenols and Ethers", "Phenol is more acidic than ethanol because", "The phenoxide ion is stabilised by resonance", ["Phenol has more hydrogen atoms", "Ethanol is a gas", "Ethoxide ion is resonance stabilised"]],
  ["Aldehydes, Ketones and Carboxylic Acids", "Tollens' reagent is", "Ammoniacal silver nitrate", ["Alkaline copper sulphate with Rochelle salt", "Conc. HCl with ZnCl₂", "Benzenesulphonyl chloride"]],
  ["Aldehydes, Ketones and Carboxylic Acids", "Which test gives a yellow precipitate with compounds containing a CH₃CO– group (and with ethanol)?", "Iodoform test", ["Tollens' test", "Lucas test", "Carbylamine test"]],
  ["Aldehydes, Ketones and Carboxylic Acids", "Aldehydes without an α-hydrogen, such as HCHO, undergo self oxidation-reduction with conc. NaOH. This is", "Cannizzaro reaction", ["Aldol condensation", "Clemmensen reduction", "Wolff–Kishner reduction"]],
  ["Aldehydes, Ketones and Carboxylic Acids", "Aldehydes and ketones having an α-hydrogen, with dilute NaOH, undergo", "Aldol condensation", ["Cannizzaro reaction", "Kolbe's reaction", "Hoffmann bromamide degradation"]],
  ["Aldehydes, Ketones and Carboxylic Acids", "Reduction of a carbonyl group to CH₂ with zinc amalgam and conc. HCl is", "Clemmensen reduction", ["Wolff–Kishner reduction", "Rosenmund reduction", "Stephen reduction"]],
  ["Aldehydes, Ketones and Carboxylic Acids", "Reduction of a carbonyl group to CH₂ with hydrazine and KOH in ethylene glycol is", "Wolff–Kishner reduction", ["Clemmensen reduction", "Rosenmund reduction", "Etard reaction"]],
  ["Aldehydes, Ketones and Carboxylic Acids", "Acyl chloride hydrogenated over Pd/BaSO₄ to give an aldehyde is the", "Rosenmund reduction", ["Stephen reduction", "Clemmensen reduction", "Cannizzaro reaction"]],
  ["Aldehydes, Ketones and Carboxylic Acids", "A nitrile reduced with SnCl₂/HCl then hydrolysed to an aldehyde is the", "Stephen reduction", ["Rosenmund reduction", "Gabriel synthesis", "Hoffmann bromamide degradation"]],
  ["Aldehydes, Ketones and Carboxylic Acids", "Toluene oxidised by chromyl chloride (CrO₂Cl₂) to benzaldehyde is the", "Etard reaction", ["Gattermann–Koch reaction", "Friedel–Crafts acylation", "Kolbe's reaction"]],
  ["Aldehydes, Ketones and Carboxylic Acids", "Carboxylic acids with an α-hydrogen, treated with Cl₂ and red phosphorus, give α-chloro acids. This is the", "Hell–Volhard–Zelinsky reaction", ["Hunsdiecker reaction", "Kolbe electrolysis", "Cannizzaro reaction"]],
  ["Aldehydes, Ketones and Carboxylic Acids", "Fehling's solution gives a red precipitate of", "Cu₂O", ["CuO", "Ag", "CuSO₄"]],
  ["Amines", "Which reaction converts an amide to a primary amine with one carbon atom fewer?", "Hoffmann bromamide degradation", ["Gabriel phthalimide synthesis", "Carbylamine reaction", "Sandmeyer reaction"]],
  ["Amines", "Which method gives pure primary amines from phthalimide?", "Gabriel phthalimide synthesis", ["Hoffmann bromamide degradation", "Hinsberg test", "Wurtz reaction"]],
  ["Amines", "Primary amines heated with chloroform and alcoholic KOH give a foul-smelling isocyanide. This is the", "Carbylamine reaction", ["Hinsberg test", "Iodoform test", "Lucas test"]],
  ["Amines", "Which reagent (Hinsberg's reagent) distinguishes primary, secondary and tertiary amines?", "Benzenesulphonyl chloride", ["Chloroform with KOH", "Nitrous acid only", "Ammoniacal silver nitrate"]],
  ["Amines", "Aniline is a weaker base than ammonia because", "Its lone pair is delocalised over the benzene ring", ["It has no lone pair", "It has more hydrogen atoms", "Its nitrogen is positively charged"]],
  ["Biomolecules", "Glucose is classified as an", "Aldohexose", ["Ketohexose", "Aldopentose", "Ketopentose"]],
  ["Biomolecules", "Fructose is classified as a", "Ketohexose", ["Aldohexose", "Aldopentose", "Disaccharide"]],
  ["Biomolecules", "Which of these is a non-reducing sugar?", "Sucrose", ["Glucose", "Maltose", "Lactose"]],
  ["Biomolecules", "The bond joining two amino acids in a protein is the", "Peptide bond", ["Glycosidic bond", "Phosphodiester bond", "Hydrogen bond"]],
  ["Biomolecules", "The sugar present in DNA is", "β-D-2-deoxyribose", ["β-D-ribose", "Glucose", "Fructose"]],
  ["Biomolecules", "Which base is present in RNA but not in DNA?", "Uracil", ["Thymine", "Adenine", "Guanine"]],
  ["Biomolecules", "Which vitamin is water soluble?", "Vitamin C", ["Vitamin A", "Vitamin D", "Vitamin K"]],
  ["Biomolecules", "Deficiency of vitamin D causes", "Rickets", ["Scurvy", "Night blindness", "Beri-beri"]],
  ["Biomolecules", "Hydrolysis of sucrose gives", "Glucose and fructose", ["Two glucose units", "Glucose and galactose", "Fructose only"]],
];

export function generateOrganic(cls: ClassId): Generated {
  const r = rng(cls === "10" ? 3010 : 3212);
  const b = new Bank(`g${cls}-organic`, r);
  const series = SERIES.filter(s => s.className === "both" || s.className === cls);
  const list: Compound[] = series.flatMap(s => Array.from({ length: 10 - s.min + 1 }, (_, k) => s.min + k).map(n => {
    const formula = clean(s.formula(n)); return { s, n, name: s.name_(n), formula, condensed: clean(s.condensed(n)), mass: molarMass(formula) };
  }));
  const ch = (c: Compound) => cls === "10" ? "Carbon and its Compounds" : c.s.id === "haloalkane" ? "Haloalkanes and Haloarenes" : c.s.id === "amine" ? "Amines" : c.s.id === "alcohol" ? "Alcohols, Phenols and Ethers" : ["aldehyde", "ketone", "acid"].includes(c.s.id) ? "Aldehydes, Ketones and Carboxylic Acids" : "Hydrocarbons (revision)";
  const sameN = (c: Compound) => list.filter(o => o.n === c.n && o !== c);
  const near = (c: Compound) => list.filter(o => o.s === c.s && Math.abs(o.n - c.n) === 1);
  const others = (c: Compound) => shuffle(r, [...sameN(c), ...near(c)]);

  for (const c of shuffle(r, list)) {
    const f = sub(c.formula), cond = sub(c.condensed);
    b.mcq(ch(c), `What is the molecular formula of ${c.name}?`, f, others(c).map(o => sub(o.formula)), `${c.name} belongs to the ${c.s.name.toLowerCase()} (${c.s.general}) with ${c.n} carbon atom${c.n > 1 ? "s" : ""}: ${f}.`);
    b.mcq(ch(c), `What is the IUPAC name of ${cond}?`, c.name, others(c).map(o => o.name), `${c.n} carbon atom${c.n > 1 ? "s" : ""} (root "${ROOTS[c.n - 1]}") with the ${c.s.group} group: ${c.name}.`);
    b.mcq(ch(c), `Which functional group is present in ${c.name}?`, c.s.group, SERIES.filter(s => s !== c.s).map(s => s.group), `${c.name} is one of the ${c.s.name.toLowerCase()}, whose group is ${c.s.group}.`);
    b.mcq(ch(c), `What is the molar mass of ${c.name} (${f})?`, `${num(c.mass)} g/mol`, [c.mass + 14, c.mass - 14, c.mass + 2, c.mass + 16, c.mass - 2].map(m => `${num(m)} g/mol`), `${massSteps(c.formula).join("; ")}.`);
    if (c.n < 10) { const next = list.find(o => o.s === c.s && o.n === c.n + 1)!; b.mcq(ch(c), `What is the next higher homologue of ${c.name}?`, next.name, [...sameN(next).map(o => o.name), ...near(c).filter(o => o !== next).map(o => o.name)], `Successive homologues differ by one CH₂ unit (14 u): ${c.name} → ${next.name}.`); }
    if (["alkane", "alkene", "alkyne"].includes(c.s.id)) b.mcq(ch(c), `${c.name} is a`, c.s.id === "alkane" ? "Saturated hydrocarbon" : "Unsaturated hydrocarbon", ["Saturated hydrocarbon", "Unsaturated hydrocarbon", "Carbohydrate", "Aromatic compound", "Inorganic compound"], c.s.id === "alkane" ? "Only C–C single bonds, so it is saturated." : `It has a ${c.s.group}, so it is unsaturated.`);
    const burn = combustion(c.formula);
    if (burn) {
      const eq = `${burn.fuel > 1 ? burn.fuel : ""}${f} + ${burn.o2}O₂ → ${burn.co2}CO₂ + ${burn.h2o}H₂O`;
      b.mcq(ch(c), `In the balanced equation for the complete combustion of ${c.name}, with the smallest whole-number coefficients, what is the coefficient of O₂?`, String(burn.o2), [burn.o2 + 1, burn.o2 - 1, burn.co2, burn.h2o, burn.o2 * 2].map(String), `${eq}.`);
      b.solved(ch(c), `Write the balanced chemical equation for the complete combustion of ${c.name}.`, eq, ["// Products of complete combustion are CO₂ and H₂O", `${f} + O₂ → CO₂ + H₂O`, `// Balance C: ${c.formula.match(/C/g) ? burn.co2 / burn.fuel : 0} C per molecule; balance H next, then O`, `CO₂: ${burn.co2}, H₂O: ${burn.h2o} (for ${burn.fuel} molecule${burn.fuel > 1 ? "s" : ""})`, `O₂ needed = (2 × ${burn.co2} + ${burn.h2o} − ${burn.fuel} × O in the compound) / 2 = ${burn.o2}`, `∴ ${eq}`], 3);
    }
    const carbon = (12 * c.n * 100) / c.mass;
    b.mcq(ch(c), `What is the percentage of carbon by mass in ${c.name}?`, `${num(carbon, 1)}%`, [num(100 - carbon, 1), num(carbon + 5, 1), num((12 * 100) / c.mass, 1), num(carbon * 0.8, 1)].map(x => `${x}%`), `% C = (12 × ${c.n} / ${num(c.mass)}) × 100 = ${num(carbon, 1)}%.`);
    b.solved(ch(c), `Calculate the molar mass of ${c.name} (${f}).`, `${num(c.mass)} g/mol`, ["// Add the atomic masses of every atom", ...massSteps(c.formula), `∴ M = ${num(c.mass)} g/mol`], 2);
    b.solved(ch(c), `Calculate the percentage composition of carbon in ${c.name}.`, `${num(carbon, 1)}%`, ["// Molar mass first", `M(${f}) = ${num(c.mass)} g/mol`, "// Mass of carbon in one mole", `12 × ${c.n} = ${12 * c.n} g`, `% C = ${12 * c.n} / ${num(c.mass)} × 100`, `∴ % C = ${num(carbon, 1)}%`], 2);
    b.bank(ch(c), `Write the molecular and condensed structural formula of ${c.name}.`, `Molecular formula ${f}; condensed formula ${cond}.`, 2);
    b.bank(ch(c), `Name the compound ${cond} and identify its functional group.`, `${c.name}; functional group ${c.s.group}.`, 2);
    b.bank(ch(c), `To which homologous series does ${c.name} belong? Write its general formula.`, `${c.s.name}; general formula ${c.s.general}.`, 1);
    if (c.n < 10) { const next = list.find(o => o.s === c.s && o.n === c.n + 1)!; b.bank(ch(c), `By how much do the molecular masses of ${c.name} and ${next.name} differ, and why?`, `By 14 u, because successive members of a homologous series differ by one CH₂ unit (${num(c.mass)} → ${num(next.mass)} g/mol).`, 2); }
  }
  // Reactions of alcohols, acids and alkenes (Class 10 chapter content).
  for (const c of list) {
    const f = sub(c.formula);
    if (c.s.id === "acid") {
      const salt = `sodium ${ROOTS[c.n - 1]}anoate`; const saltF = c.n === 1 ? "HCOONa" : clean(`C${c.n - 1}H${2 * c.n - 1}COONa`);
      b.bank(ch(c), `Write the equation for the reaction of ${c.name} with sodium hydrogen carbonate.`, `${f} + NaHCO₃ → ${sub(saltF)} (${salt}) + H₂O + CO₂↑. The brisk effervescence of CO₂ is the test for a carboxylic acid.`, 2);
      const ester = `ethyl ${ROOTS[c.n - 1]}anoate`; const esterF = c.n === 1 ? "HCOOC2H5" : clean(`C${c.n - 1}H${2 * c.n - 1}COOC2H5`);
      b.bank(ch(c), `Write the esterification reaction of ${c.name} with ethanol.`, `${f} + C₂H₅OH ⇌ ${sub(esterF)} (${ester}) + H₂O, in the presence of a few drops of conc. H₂SO₄.`, 3);
      b.mcq(ch(c), `What is the ester formed when ${c.name} reacts with ethanol?`, ester, [`methyl ${ROOTS[c.n - 1]}anoate`, `ethyl ${ROOTS[Math.min(9, c.n)]}anoate`, `${ROOTS[c.n - 1]}yl ethanoate`, `ethyl ${ROOTS[Math.max(0, c.n - 2)]}anoate`], `Acid + alcohol → ester + water; ${c.name} + ethanol gives ${ester}.`);
    }
    if (c.s.id === "alcohol") {
      const alk = `sodium ${ROOTS[c.n - 1]}oxide`;
      b.bank(ch(c), `What happens when sodium is added to ${c.name}? Write the equation.`, `Hydrogen gas is evolved and ${alk} forms: 2${f} + 2Na → 2${sub(c.formula.replace("OH", "ONa"))} + H₂↑.`, 2);
      if (c.n >= 2) { const alkene = list.find(o => o.s.id === "alkene" && o.n === c.n)!; b.mcq(ch(c), `Heating ${c.name} with excess conc. H₂SO₄ at about 443 K gives`, alkene.name, [list.find(o => o.s.id === "alkane" && o.n === c.n)!.name, list.find(o => o.s.id === "acid" && o.n === c.n)!.name, list.find(o => o.s.id === "aldehyde" && o.n === c.n)!.name], `Conc. H₂SO₄ dehydrates the alcohol, removing H₂O to give ${alkene.name}.`); }
      const acid = list.find(o => o.s.id === "acid" && o.n === c.n)!; b.mcq(ch(c), `Oxidation of ${c.name} with alkaline KMnO₄ (or acidified K₂Cr₂O₇) gives`, acid.name, [list.find(o => o.s.id === "alkane" && o.n === c.n)!.name, ...(c.n >= 2 ? [list.find(o => o.s.id === "alkene" && o.n === c.n)!.name] : []), `${ROOTS[c.n - 1]}yl ethanoate`, near(acid)[0]?.name ?? "methanol"], `Strong oxidation converts a primary alcohol to the carboxylic acid with the same number of carbons: ${acid.name}.`);
    }
    if (c.s.id === "alkene") { const alkane = list.find(o => o.s.id === "alkane" && o.n === c.n)!; b.bank(ch(c), `Write the hydrogenation reaction of ${c.name}.`, `${f} + H₂ → ${sub(alkane.formula)} (${alkane.name}), in the presence of a nickel or palladium catalyst. This is how vegetable oils are hardened.`, 2); }
  }
  for (let n = 4; n <= 10; n++) b.mcq(cls === "10" ? "Carbon and its Compounds" : "Hydrocarbons (revision)", `How many structural (chain) isomers does ${ROOTS[n - 1]}ane, ${sub(`C${n}H${2 * n + 2}`)}, have?`, String(ALKANE_ISOMERS[n]), [ALKANE_ISOMERS[n] + 1, ALKANE_ISOMERS[n - 1], ALKANE_ISOMERS[n] * 2, n].map(String), `${ROOTS[n - 1]}ane has ${ALKANE_ISOMERS[n]} structural isomers.`);
  for (const s of series) b.mcq(cls === "10" ? "Carbon and its Compounds" : ch({ s, n: 2 } as Compound), `What is the general formula of the ${s.name.toLowerCase()}?`, s.general, SERIES.filter(o => o !== s).map(o => o.general), `${s.name}: ${s.general}.`);
  if (cls === "12") for (const [chapter, q, a, wrong] of NAMED) { b.mcq(chapter, q, a, wrong, `${a}.`); b.bank(chapter, q.endsWith("?") ? q : `${q} …?`, a, 1); }
  return { items: b.items, mcqs: b.mcqs };
}
void pick;
