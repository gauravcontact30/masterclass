import { bank, imp, mcq, pack, solved, unsolved } from "./types";

/* Class 12 Chemistry. Tags: u = UP Board, c = CBSE, i = ISC. */
export default pack("xii-chemistry", [
  bank("Solutions", "State Raoult's law for a solution of volatile liquids.", "The partial vapour pressure of each component is directly proportional to its mole fraction in the solution: p₁ = x₁ p₁°.", 2),
  bank("Solutions", "What are colligative properties? Name the four.", "Properties that depend only on the number of solute particles, not their nature: relative lowering of vapour pressure, elevation of boiling point, depression of freezing point and osmotic pressure.", 2),
  bank("Electrochemistry", "State Kohlrausch's law of independent migration of ions.", "The limiting molar conductivity of an electrolyte is the sum of the individual contributions of its cation and anion: Λ°ₘ = ν₊λ°₊ + ν₋λ°₋.", 2),
  bank("Chemical Kinetics", "Distinguish between order and molecularity of a reaction.", "Order is the sum of the powers of concentration terms in the experimental rate law and may be zero or fractional. Molecularity is the number of species colliding in an elementary step and is always a whole number.", 2),
  bank("d- and f-Block Elements", "What is lanthanoid contraction? Give one consequence.", "The steady decrease in atomic and ionic radii across the lanthanoids, caused by poor shielding by 4f electrons. As a result, Zr and Hf have almost the same radii.", 2),
  bank("Coordination Compounds", "Write the IUPAC name of K₄[Fe(CN)₆].", "Potassium hexacyanidoferrate(II).", 1),
  bank("Haloalkanes and Haloarenes", "Why are haloarenes less reactive than haloalkanes towards nucleophilic substitution?", "Resonance gives the C–X bond partial double-bond character, the carbon is sp² hybridised and holds the bond more tightly, and the electron-rich ring repels the nucleophile.", 2),
  bank("Aldehydes and Ketones", "Which compounds undergo the Cannizzaro reaction?", "Aldehydes with no α-hydrogen, such as HCHO and C₆H₅CHO. With concentrated alkali, one molecule is oxidised to the acid salt and another reduced to the alcohol.", 2),
  bank("Biomolecules", "What is a peptide bond?", "The amide linkage –CO–NH– formed between the carboxyl group of one amino acid and the amino group of the next, with loss of a water molecule.", 2),
  bank("Solid State", "How many atoms are present in the unit cell of a face-centred cubic lattice?", "Four: 8 corners × 1/8 + 6 face centres × 1/2 = 1 + 3 = 4.", 2, "i"),
  bank("Electrochemistry", "State Faraday's first law of electrolysis.", "The mass of a substance deposited or liberated at an electrode is directly proportional to the quantity of electricity passed: m = ZIt.", 2),
  bank("Chemical Kinetics", "Distinguish between the order and the molecularity of a reaction.", "Order is the sum of the powers of concentration terms in the experimental rate law; it may be zero or fractional. Molecularity is the number of species colliding in an elementary step; it is a whole number and never zero.", 2),
  bank("Alcohols, Phenols and Ethers", "Why is phenol more acidic than ethanol?", "The phenoxide ion left after loss of H⁺ is stabilised by resonance with the benzene ring, while the ethoxide ion is destabilised by the electron-releasing ethyl group.", 2),
  bank("Biomolecules", "What is a peptide bond?", "The amide linkage –CO–NH– formed between the carboxyl group of one amino acid and the amino group of the next, with loss of a water molecule.", 2),
  imp("Chemical Kinetics", 5, "A first-order reaction has a rate constant of 6.93 × 10⁻³ s⁻¹. Find its half-life and the time taken for 75% of the reaction to complete.", "t½ = 100 s, t(75%) = 200 s", [
    "// Half-life of a first-order reaction", "t½ = 0.693/k = 0.693/(6.93 × 10⁻³)",
    "t½ = 100 s",
    "// 75% completion leaves one quarter, which is two half-lives", "t = 2 × t½ = 2 × 100",
    "∴ t½ = 100 s,  t(75%) = 200 s",
  ], 3),

  imp("Solutions", 5, "The boiling point of water is 373.15 K. Find the boiling point of a solution of 18 g of glucose (M = 180) in 1 kg of water. (K_b = 0.52 K kg mol⁻¹)", "T_b = 373.202 K", [
    "// Moles of glucose", "n = 18 / 180 = 0.1 mol",
    "// Molality", "m = 0.1 mol / 1 kg = 0.1 mol kg⁻¹",
    "// Elevation of boiling point", "ΔT_b = K_b × m = 0.52 × 0.1 = 0.052 K",
    "T_b = 373.15 + 0.052", "∴ T_b = 373.202 K",
  ], 3),
  imp("Electrochemistry", 5, "Calculate the standard Gibbs energy change of the Daniell cell. (E°cell = 1.10 V, F = 96500 C mol⁻¹)", "ΔG° = −212.3 kJ mol⁻¹", [
    "// Cell reaction: two electrons are transferred", "Zn + Cu²⁺ → Zn²⁺ + Cu,   n = 2",
    "// Relation", "ΔG° = −nFE°cell",
    "ΔG° = −2 × 96500 × 1.10 = −212300 J mol⁻¹", "∴ ΔG° = −212.3 kJ mol⁻¹",
  ], 3),
  imp("Electrochemistry", 5, "Calculate the emf of the cell Mg | Mg²⁺ (0.130 M) ‖ Ag⁺ (0.0001 M) | Ag at 298 K. (E°cell = 3.17 V)", "E_cell ≈ 2.96 V", [
    "// Cell reaction", "Mg + 2Ag⁺ → Mg²⁺ + 2Ag,   n = 2",
    "// Nernst equation at 298 K", "E = E° − (0.059/n) log([Mg²⁺] / [Ag⁺]²)",
    "E = 3.17 − (0.059/2) log(0.130 / (10⁻⁴)²)",
    "E = 3.17 − 0.0295 × log(1.3 × 10⁷) = 3.17 − 0.0295 × 7.11", "∴ E_cell ≈ 2.96 V",
  ], 3),
  imp("Chemical Kinetics", 5, "Derive the expression for the half-life of a first-order reaction.", "t½ = 0.693 / k", [
    "// Integrated rate law for first order", "k = (2.303 / t) log([R]₀ / [R])",
    "// At t = t½", "[R] = [R]₀ / 2",
    "k = (2.303 / t½) log 2 = (2.303 × 0.3010) / t½",
    "∴ t½ = 0.693 / k   (independent of initial concentration)",
  ], 3),
  imp("Coordination Compounds", 5, "Using valence bond theory, explain the hybridisation, shape and magnetic behaviour of [Fe(CN)₆]⁴⁻.", "d²sp³, octahedral, diamagnetic (inner orbital complex)", [
    "// Oxidation state and configuration", "Fe²⁺ : 3d⁶",
    "// CN⁻ is a strong-field ligand and pairs up the electrons", "3d: ↑↓ ↑↓ ↑↓ _ _   (two 3d orbitals empty)",
    "// Six empty orbitals accept the six lone pairs", "Hybridisation: d²sp³",
    "∴ Octahedral, no unpaired electron, diamagnetic",
  ], 3),
  imp("Haloalkanes and Haloarenes", 5, "Compare the SN1 and SN2 mechanisms.", "SN1: two steps through a carbocation; SN2: one step with inversion.", [
    "// SN2: one step, bimolecular", "Rate = k [R–X][Nu⁻]", "Backside attack → inversion of configuration", "Reactivity: CH₃X > 1° > 2° > 3°",
    "// SN1: two steps, unimolecular", "Rate = k [R–X]", "Carbocation intermediate → racemisation", "Reactivity: 3° > 2° > 1° > CH₃X",
  ], 5),
  imp("Aldehydes and Ketones", 5, "Write the aldol condensation of ethanal.", "Ethanal gives 3-hydroxybutanal, which loses water to give but-2-enal.", [
    "// Two molecules of ethanal with dilute NaOH", "2CH₃CHO → CH₃–CH(OH)–CH₂–CHO",
    "// The aldol loses water on heating", "CH₃–CH(OH)–CH₂–CHO → CH₃–CH=CH–CHO + H₂O",
    "∴ Needs at least one α-hydrogen; product is but-2-enal (crotonaldehyde)",
  ], 3),
  imp("Amines", 5, "Write the Hoffmann bromamide reaction and the carbylamine test.", "An amide gives a primary amine with one carbon less; primary amines give foul-smelling isocyanides.", [
    "// Hoffmann bromamide degradation", "RCONH₂ + Br₂ + 4NaOH → RNH₂ + Na₂CO₃ + 2NaBr + 2H₂O",
    "// Carbylamine reaction (test for primary amines)", "RNH₂ + CHCl₃ + 3KOH → RNC + 3KCl + 3H₂O",
    "∴ Secondary and tertiary amines do not give the carbylamine test",
  ], 3),
  imp("d- and f-Block Elements", 4, "How is potassium permanganate prepared from pyrolusite?", "MnO₂ is fused to manganate, which is then oxidised to permanganate.", [
    "// Fusion of MnO₂ with KOH in air", "2MnO₂ + 4KOH + O₂ → 2K₂MnO₄ + 2H₂O",
    "// Disproportionation in acidic medium", "3MnO₄²⁻ + 4H⁺ → 2MnO₄⁻ + MnO₂ + 2H₂O",
    "∴ Green manganate → purple permanganate",
  ], 3),
  imp("Solid State", 4, "Copper crystallises in an fcc lattice with edge length 3.61 × 10⁻⁸ cm. Calculate its density. (M = 63.5 g mol⁻¹)", "d ≈ 8.97 g cm⁻³", [
    "// For fcc", "Z = 4",
    "// Density of a unit cell", "d = Z M / (a³ N_A)",
    "d = (4 × 63.5) / ((3.61 × 10⁻⁸)³ × 6.022 × 10²³)", "d = 254 / 28.33", "∴ d ≈ 8.97 g cm⁻³",
  ], 3, "i"),

  solved("Solutions", "Calculate the molality of 2.5 g of ethanoic acid (M = 60) in 75 g of benzene.", "m = 0.556 mol kg⁻¹", [
    "// Moles of solute", "n = 2.5 / 60 = 0.0417 mol",
    "// Molality", "m = n / mass of solvent in kg = 0.0417 / 0.075", "∴ m = 0.556 mol kg⁻¹",
  ], 2),
  solved("Electrochemistry", "Find Λ°ₘ for acetic acid, given Λ°ₘ of HCl, NaCl and CH₃COONa as 425.9, 126.4 and 91.0 S cm² mol⁻¹.", "Λ°ₘ = 390.5 S cm² mol⁻¹", [
    "// Kohlrausch's law", "Λ°(CH₃COOH) = Λ°(CH₃COONa) + Λ°(HCl) − Λ°(NaCl)",
    "= 91.0 + 425.9 − 126.4", "∴ Λ°ₘ = 390.5 S cm² mol⁻¹",
  ], 3),
  solved("Electrochemistry", "What mass of copper is deposited when a current of 1.5 A is passed through CuSO₄ solution for 10 minutes? (Cu = 63.5)", "m ≈ 0.296 g", [
    "// Charge passed", "Q = I t = 1.5 × 600 = 900 C",
    "// Cu²⁺ + 2e⁻ → Cu, so 2 × 96500 C deposit 63.5 g", "m = 63.5 × 900 / (2 × 96500)", "∴ m ≈ 0.296 g",
  ], 3),
  solved("Chemical Kinetics", "A first-order reaction has k = 5.5 × 10⁻¹⁴ s⁻¹. Find its half-life.", "t½ = 1.26 × 10¹³ s", [
    "// First order", "t½ = 0.693 / k", "t½ = 0.693 / (5.5 × 10⁻¹⁴)", "∴ t½ = 1.26 × 10¹³ s",
  ], 2),

  unsolved("Chemical Kinetics", "The half-life of a first-order reaction is 10 minutes. How long does 75% completion take?", "20 minutes", "75% completion is two half-lives."),
  unsolved("Coordination Compounds", "Write the IUPAC name of [Co(NH₃)₆]Cl₃.", "Hexaamminecobalt(III) chloride", "Name the ligands first, then the metal with its oxidation state.", 1),
  unsolved("Alcohols and Phenols", "Write the equation for the Reimer-Tiemann reaction.", "Phenol + CHCl₃ + aqueous NaOH, then acid, gives salicylaldehyde (2-hydroxybenzaldehyde).", "A –CHO group enters at the ortho position of phenol."),
  unsolved("Amines", "Arrange in increasing order of basic strength in aqueous solution: NH₃, CH₃NH₂, (CH₃)₂NH, (CH₃)₃N.", "NH₃ < (CH₃)₃N < CH₃NH₂ < (CH₃)₂NH", "Consider inductive effect, solvation and steric hindrance together."),
  unsolved("Solutions", "Find the osmotic pressure of a 0.1 M solution of a non-electrolyte at 300 K. (R = 0.0821 L atm K⁻¹ mol⁻¹)", "π ≈ 2.46 atm", "Use π = CRT."),
], [
  mcq("Solutions", "Which of these is a colligative property?", ["Surface tension", "Viscosity", "Osmotic pressure", "Refractive index"], 2, "It depends only on the number of solute particles."),
  mcq("Solutions", "The van't Hoff factor for complete dissociation of K₂SO₄ is", ["1", "2", "3", "4"], 2, "K₂SO₄ → 2K⁺ + SO₄²⁻, three ions."),
  mcq("Electrochemistry", "The SI unit of molar conductivity is", ["S m⁻¹", "S m² mol⁻¹", "S mol m⁻²", "Ω m"], 1, "Λₘ = κ / c."),
  mcq("Electrochemistry", "The charge required to deposit one mole of aluminium from Al³⁺ is", ["1 F", "2 F", "3 F", "6 F"], 2, "Al³⁺ + 3e⁻ → Al."),
  mcq("Chemical Kinetics", "The unit of the rate constant of a zero-order reaction is", ["s⁻¹", "mol L⁻¹ s⁻¹", "L mol⁻¹ s⁻¹", "no unit"], 1, "Rate = k, so k has the unit of rate."),
  mcq("d- and f-Block Elements", "Transition metals form coloured compounds because of", ["paired electrons", "d–d transitions", "high density", "high melting points"], 1, "Unpaired d electrons absorb visible light in d–d transitions."),
  mcq("Coordination Compounds", "The coordination number of cobalt in [Co(en)₃]³⁺ is", ["3", "4", "6", "2"], 2, "Ethane-1,2-diamine is bidentate: 3 × 2 = 6."),
  mcq("Haloalkanes and Haloarenes", "The alkyl halide that reacts fastest by the SN1 mechanism is", ["CH₃Br", "CH₃CH₂Br", "(CH₃)₂CHBr", "(CH₃)₃CBr"], 3, "It forms the most stable (tertiary) carbocation."),
  mcq("Aldehydes and Ketones", "Tollens' reagent is used to detect", ["alcohols", "aldehydes", "ketones", "ethers"], 1, "Aldehydes reduce it to a silver mirror."),
  mcq("Biomolecules", "The sugar present in DNA is", ["ribose", "2-deoxyribose", "glucose", "fructose"], 1, "RNA has ribose; DNA has 2-deoxyribose."),
  mcq("Solid State", "The coordination number of each ion in the NaCl structure is", ["4", "6", "8", "12"], 1, "Each Na⁺ is surrounded by six Cl⁻ and vice versa.", "i"),
], [
  { title: "physical-chemistry.formulas", lines: [
    "// Solutions", "p₁ = x₁ p₁°", "ΔT_b = i K_b m,   ΔT_f = i K_f m", "π = i C R T",
    "// Electrochemistry", "E = E° − (0.059/n) log Q   (298 K)", "ΔG° = −nFE°,   log K = nE° / 0.059", "Λₘ = κ × 1000 / M",
    "// Kinetics", "k = (2.303/t) log([R]₀/[R]),   t½ = 0.693/k", "k = A e^(−Eₐ/RT)", "log(k₂/k₁) = (Eₐ/2.303R)(1/T₁ − 1/T₂)",
  ] },
  { title: "organic.reactions", lines: [
    "// Named reactions", "2CH₃CHO → CH₃CH(OH)CH₂CHO              (aldol)", "2HCHO + NaOH → HCOONa + CH₃OH           (Cannizzaro)", "RCONH₂ + Br₂ + 4NaOH → RNH₂ + Na₂CO₃ + 2NaBr + 2H₂O   (Hoffmann)",
    "RNH₂ + CHCl₃ + 3KOH → RNC + 3KCl + 3H₂O (carbylamine)", "2RX + 2Na → R–R + 2NaX                  (Wurtz)", "C₆H₅N₂Cl + CuCl/HCl → C₆H₅Cl + N₂       (Sandmeyer)",
  ] },
  { title: "inorganic.equations", lines: [
    "// Permanganate and dichromate", "2MnO₂ + 4KOH + O₂ → 2K₂MnO₄ + 2H₂O", "MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H₂O", "Cr₂O₇²⁻ + 14H⁺ + 6e⁻ → 2Cr³⁺ + 7H₂O",
    "// Magnetic moment", "μ = √(n(n + 2)) BM",
  ] },
]);
