import { bank, imp, mcq, pack, solved, unsolved } from "./types";

/* Class 10 Chemistry (the Chemistry portion of Science for UP Board and CBSE; Science Paper 2 for ICSE). */
export default pack("x-chemistry", [
  bank("Chemical Reactions", "Why must a chemical equation be balanced?", "By the law of conservation of mass, atoms are neither created nor destroyed in a reaction, so each element must have the same number of atoms on both sides.", 2),
  bank("Chemical Reactions", "What is a redox reaction? Give one example.", "A reaction in which one substance is oxidised while another is reduced. Example: CuO + H₂ → Cu + H₂O (CuO is reduced, H₂ is oxidised).", 2),
  bank("Acids, Bases and Salts", "What is the pH scale?", "A scale from 0 to 14 that measures hydrogen ion concentration. pH below 7 is acidic, 7 is neutral and above 7 is basic.", 2),
  bank("Acids, Bases and Salts", "What is a neutralisation reaction?", "An acid reacts with a base to give salt and water. Example: NaOH + HCl → NaCl + H₂O.", 2),
  bank("Metals and Non-metals", "Why is sodium kept under kerosene?", "Sodium reacts vigorously with oxygen and moisture in air and can catch fire, so it is stored under kerosene to keep air away.", 2),
  bank("Metals and Non-metals", "What is an alloy? Give two examples.", "A homogeneous mixture of two or more metals, or of a metal with a non-metal. Brass is copper and zinc; bronze is copper and tin.", 2),
  bank("Carbon Compounds", "What is a homologous series?", "A family of organic compounds with the same functional group and similar chemical properties, in which successive members differ by a CH₂ unit.", 2),
  bank("Carbon Compounds", "Why does carbon form such a large number of compounds?", "Because of catenation (carbon atoms link to each other in chains, branches and rings) and tetravalency (each carbon forms four covalent bonds).", 2),
  bank("Periodic Table", "How does atomic size change across a period and down a group?", "It decreases from left to right across a period as nuclear charge increases, and increases down a group as new shells are added.", 2, "i"),
  bank("Electrolysis", "What are electrolytes? Distinguish between strong and weak electrolytes.", "Compounds that conduct electricity in solution or when molten and are decomposed by it. Strong electrolytes ionise almost completely (NaCl, HCl); weak ones only partly (CH₃COOH, NH₄OH).", 2, "i"),
  bank("Chemical Reactions", "What is a redox reaction? Give one example.", "A reaction in which oxidation and reduction take place together. In CuO + H₂ → Cu + H₂O, copper oxide is reduced to copper and hydrogen is oxidised to water.", 2),
  bank("Acids, Bases and Salts", "What does the pH scale measure?", "The hydrogen-ion concentration of a solution on a scale of 0 to 14. Below 7 is acidic, 7 is neutral and above 7 is basic.", 2),
  bank("Carbon Compounds", "What is a homologous series?", "A family of organic compounds with the same functional group and general formula, in which successive members differ by a –CH₂– unit (14 u). Example: the alkanes CH₄, C₂H₆, C₃H₈.", 2),
  bank("Metals and Non-metals", "What is an alloy? Name the constituents of brass and bronze.", "An alloy is a homogeneous mixture of a metal with other metals or non-metals. Brass is copper and zinc; bronze is copper and tin.", 2),
  imp("Acids, Bases and Salts", 4, "What happens when baking soda is heated? Write the equation and give two uses of baking soda.", "It decomposes to sodium carbonate, water and carbon dioxide.", [
    "// Thermal decomposition", "2NaHCO₃ → Na₂CO₃ + H₂O + CO₂",
    "// Why cakes rise", "The CO₂ released makes the dough soft and spongy",
    "// Uses", "Ingredient of baking powder and of antacids; used in soda-acid fire extinguishers",
    "∴ Products: Na₂CO₃, H₂O and CO₂",
  ], 3),

  imp("Chemical Reactions", 5, "Balance the equation Fe + H₂O → Fe₃O₄ + H₂ step by step.", "3Fe + 4H₂O → Fe₃O₄ + 4H₂", [
    "// Unbalanced (skeletal) equation", "Fe + H₂O → Fe₃O₄ + H₂",
    "// Balance oxygen: 4 atoms on the right", "Fe + 4H₂O → Fe₃O₄ + H₂",
    "// Balance hydrogen: 8 atoms on the left", "Fe + 4H₂O → Fe₃O₄ + 4H₂",
    "// Balance iron: 3 atoms on the right", "∴ 3Fe + 4H₂O → Fe₃O₄ + 4H₂",
  ], 3),
  imp("Chemical Reactions", 5, "Name the four main types of chemical reaction with one equation each.", "Combination, decomposition, displacement and double displacement.", [
    "// Combination", "CaO + H₂O → Ca(OH)₂",
    "// Decomposition", "CaCO₃ → CaO + CO₂",
    "// Displacement", "Fe + CuSO₄ → FeSO₄ + Cu",
    "// Double displacement", "Na₂SO₄ + BaCl₂ → BaSO₄↓ + 2NaCl",
  ], 4),
  imp("Acids, Bases and Salts", 5, "How are baking soda and washing soda prepared from common salt? Write the equations.", "Baking soda by the Solvay step; washing soda by heating it and recrystallising.", [
    "// Baking soda from brine, ammonia and carbon dioxide", "NaCl + H₂O + CO₂ + NH₃ → NH₄Cl + NaHCO₃",
    "// Heating baking soda gives sodium carbonate", "2NaHCO₃ → Na₂CO₃ + H₂O + CO₂",
    "// Recrystallisation gives washing soda", "Na₂CO₃ + 10H₂O → Na₂CO₃·10H₂O",
  ], 3, "uc"),
  imp("Metals and Non-metals", 5, "Explain the formation of sodium chloride by transfer of electrons.", "Na loses one electron to Cl, giving Na⁺ and Cl⁻ held by ionic bonds.", [
    "// Electronic configurations", "Na: 2, 8, 1      Cl: 2, 8, 7",
    "// Sodium loses one electron", "Na → Na⁺ + e⁻      (2, 8)",
    "// Chlorine gains that electron", "Cl + e⁻ → Cl⁻      (2, 8, 8)",
    "// Oppositely charged ions attract", "∴ Na⁺ + Cl⁻ → NaCl  (ionic compound)",
  ], 3),
  imp("Metals and Non-metals", 4, "What is the thermit reaction? Write its equation and one use.", "Aluminium reduces iron(III) oxide to molten iron; used to weld rail tracks.", [
    "// Aluminium is more reactive than iron, so it displaces it", "Fe₂O₃ + 2Al → 2Fe + Al₂O₃ + heat",
    "// The reaction is strongly exothermic", "Iron is obtained in the molten state",
    "∴ Used for joining railway tracks and cracked machine parts",
  ], 3),
  imp("Carbon Compounds", 5, "Write equations for the esterification of ethanol and the saponification of the ester formed.", "Ethanol and ethanoic acid give ethyl ethanoate; alkali splits it back.", [
    "// Esterification, in the presence of conc. H₂SO₄", "CH₃COOH + C₂H₅OH → CH₃COOC₂H₅ + H₂O",
    "// Saponification with sodium hydroxide", "CH₃COOC₂H₅ + NaOH → CH₃COONa + C₂H₅OH",
    "∴ Esters are sweet-smelling; saponification is used to make soap",
  ], 3),
  imp("Mole Concept", 4, "Calculate the percentage of nitrogen in ammonium nitrate, NH₄NO₃. (N = 14, H = 1, O = 16)", "35% nitrogen", [
    "// Molar mass", "M = 14 + 4(1) + 14 + 3(16) = 80 g/mol",
    "// Mass of nitrogen in one mole", "m(N) = 2 × 14 = 28 g",
    "% N = 28/80 × 100", "∴ 35% nitrogen",
  ], 3, "i"),
  imp("Electrolysis", 4, "Write the electrode reactions for the electrolysis of acidified water using platinum electrodes.", "Hydrogen at the cathode and oxygen at the anode, in the ratio 2 : 1 by volume.", [
    "// At the cathode (reduction)", "4H⁺ + 4e⁻ → 2H₂",
    "// At the anode (oxidation)", "4OH⁻ → 2H₂O + O₂ + 4e⁻",
    "∴ H₂ : O₂ = 2 : 1 by volume",
  ], 3, "i"),

  solved("Chemical Reactions", "What mass of carbon dioxide is formed when 50 g of calcium carbonate is decomposed completely? (Ca = 40, C = 12, O = 16)", "22 g of CO₂", [
    "// Balanced equation", "CaCO₃ → CaO + CO₂",
    "// Molar masses", "CaCO₃ = 100 g/mol,   CO₂ = 44 g/mol",
    "// 100 g of CaCO₃ gives 44 g of CO₂", "50 g gives 44 × 50/100", "∴ 22 g of CO₂",
  ], 3),
  solved("Acids, Bases and Salts", "A solution has a hydrogen ion concentration of 10⁻³ mol/L. Find its pH and state its nature.", "pH = 3, acidic", [
    "// Definition", "pH = −log[H⁺]", "pH = −log(10⁻³) = 3", "∴ pH = 3, so the solution is acidic",
  ], 2),
  solved("Carbon Compounds", "Write the molecular formula and structure of the third member of the alkane series.", "Propane, C₃H₈", [
    "// General formula of alkanes", "CₙH₂ₙ₊₂",
    "// For n = 3", "C₃H₈",
    "// Structure", "CH₃ − CH₂ − CH₃", "∴ Propane, C₃H₈",
  ], 2),
  solved("Mole Concept", "Find the volume occupied by 8 g of oxygen gas at STP. (O = 16, molar volume = 22.4 L)", "5.6 L", [
    "// Moles of O₂", "n = 8 / 32 = 0.25 mol",
    "// One mole occupies 22.4 L at STP", "V = 0.25 × 22.4", "∴ V = 5.6 L",
  ], 3, "i"),

  unsolved("Chemical Reactions", "Balance: Al + HCl → AlCl₃ + H₂.", "2Al + 6HCl → 2AlCl₃ + 3H₂", "Balance chlorine first, then hydrogen."),
  unsolved("Acids, Bases and Salts", "Write the equation for the preparation of plaster of Paris from gypsum.", "CaSO₄·2H₂O → CaSO₄·½H₂O + 1½H₂O (on heating at 373 K)", "Gypsum loses three quarters of its water of crystallisation."),
  unsolved("Metals and Non-metals", "Zinc is added to copper sulphate solution. Write the equation and what you observe.", "Zn + CuSO₄ → ZnSO₄ + Cu. The blue colour fades and reddish-brown copper deposits.", "Zinc lies above copper in the reactivity series."),
  unsolved("Carbon Compounds", "Write the equation for the complete combustion of methane.", "CH₄ + 2O₂ → CO₂ + 2H₂O + heat and light", "Complete combustion of a hydrocarbon gives only carbon dioxide and water."),
  unsolved("Mole Concept", "Find the empirical formula of a compound containing 40% carbon, 6.67% hydrogen and 53.33% oxygen.", "CH₂O", "Divide each percentage by the atomic mass, then by the smallest result.", 3, "i"),
], [
  mcq("Chemical Reactions", "Fe₂O₃ + 2Al → Al₂O₃ + 2Fe is an example of a", ["combination reaction", "decomposition reaction", "displacement reaction", "double displacement reaction"], 2, "Aluminium displaces iron from its oxide."),
  mcq("Chemical Reactions", "Rancidity of food is caused by", ["reduction", "oxidation", "neutralisation", "hydration"], 1, "Fats and oils are oxidised, changing smell and taste."),
  mcq("Acids, Bases and Salts", "A solution turns red litmus blue. Its pH is likely to be", ["1", "4", "5", "10"], 3, "Only a base turns red litmus blue, so pH is above 7."),
  mcq("Acids, Bases and Salts", "The chemical formula of bleaching powder is", ["CaO", "CaCO₃", "CaOCl₂", "Ca(OH)₂"], 2, "It is made by passing chlorine over dry slaked lime."),
  mcq("Metals and Non-metals", "The metal that is liquid at room temperature is", ["sodium", "mercury", "zinc", "aluminium"], 1, "Mercury melts at about −39 °C."),
  mcq("Metals and Non-metals", "The most reactive of these metals is", ["copper", "iron", "potassium", "zinc"], 2, "Potassium is at the top of the reactivity series."),
  mcq("Carbon Compounds", "The functional group in ethanol is", ["−CHO", "−COOH", "−OH", ">C=O"], 2, "Ethanol, C₂H₅OH, is an alcohol."),
  mcq("Carbon Compounds", "The general formula of alkenes is", ["CₙH₂ₙ₊₂", "CₙH₂ₙ", "CₙH₂ₙ₋₂", "CₙH₂ₙ₊₁"], 1, "Alkenes have one double bond: CₙH₂ₙ."),
  mcq("Periodic Table", "The most electronegative element is", ["oxygen", "chlorine", "fluorine", "nitrogen"], 2, "Fluorine has the highest electronegativity.", "i"),
  mcq("Mole Concept", "The number of molecules in one mole of a substance is", ["6.022 × 10²²", "6.022 × 10²³", "3.011 × 10²³", "22.4"], 1, "Avogadro's number is 6.022 × 10²³.", "i"),
  mcq("Acids, Bases and Salts", "The acid present in vinegar is", ["citric acid", "acetic acid", "lactic acid", "tartaric acid"], 1, "Vinegar is a dilute solution of acetic (ethanoic) acid."),
], [
  { title: "reactions.equations", lines: [
    "// Types of reaction", "A + B → AB            (combination)", "AB → A + B            (decomposition)", "A + BC → AC + B       (displacement)", "AB + CD → AD + CB     (double displacement)",
    "// Reactivity series", "K > Na > Ca > Mg > Al > Zn > Fe > Pb > H > Cu > Hg > Ag > Au",
  ] },
  { title: "acids-and-salts.equations", lines: [
    "// pH", "pH = −log[H⁺]", "pH < 7 acidic,  pH = 7 neutral,  pH > 7 basic",
    "// Salts from common salt", "2NaCl + 2H₂O → 2NaOH + Cl₂ + H₂", "Ca(OH)₂ + Cl₂ → CaOCl₂ + H₂O", "2NaHCO₃ → Na₂CO₃ + H₂O + CO₂",
  ] },
  { title: "carbon.equations", lines: [
    "// Homologous series", "Alkanes CₙH₂ₙ₊₂,  Alkenes CₙH₂ₙ,  Alkynes CₙH₂ₙ₋₂",
    "// Key reactions", "CH₄ + 2O₂ → CO₂ + 2H₂O", "CH₃COOH + C₂H₅OH → CH₃COOC₂H₅ + H₂O", "2C₂H₅OH + 2Na → 2C₂H₅ONa + H₂",
  ] },
]);
