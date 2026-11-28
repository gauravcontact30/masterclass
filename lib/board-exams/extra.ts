import { bank, mcq, solved, unsolved, type Item, type Mcq } from "./types";
import type { BankRow } from "./bank/types";
import { X_MATH } from "./bank/x-math";
import { X_PHYSICS } from "./bank/x-physics";
import { X_CHEMISTRY } from "./bank/x-chemistry";
import { XII_MATH } from "./bank/xii-math";
import { XII_PHYSICS } from "./bank/xii-physics";
import { XII_CHEMISTRY } from "./bank/xii-chemistry";
import { upFor } from "./up-board";

/*
 * Extra hand-authored board questions (2026-11-22): frequently set short answers, worked problems and MCQs for each
 * class and pack, merged after the main pack by loadPack (lib/board-exams/boards.ts). Chapter names match the packs,
 * so chapter filters and the chemistry Organic / Inorganic split apply to them unchanged.
 */
type Draft<T> = Omit<T, "id">;
type Extra = { items: Draft<Item>[]; mcqs: Draft<Mcq>[] };

export const EXTRA: Record<string, Extra> = {
  "10-math": {
    items: [
      bank("Polynomials", "Find a quadratic polynomial whose zeros are 3 and −2.", "x² − (sum of zeros)x + product of zeros = x² − x − 6.", 2),
      solved("Quadratic Equations", "Solve 2x² − 7x + 3 = 0 by factorisation.", "x = 3 or x = 1/2.", ["// Split the middle term: 2 × 3 = 6 = (−6) × (−1)", "2x² − 6x − x + 3 = 0", "2x(x − 3) − 1(x − 3) = 0", "(2x − 1)(x − 3) = 0", "x = 1/2 or x = 3"], 3),
      bank("Arithmetic Progressions", "Find the 20th term of the AP 7, 11, 15, …", "a = 7 and d = 4, so a₂₀ = 7 + 19 × 4 = 83.", 2),
      solved("Trigonometry", "If sin A = 3/5 and A is acute, find cos A and tan A.", "cos A = 4/5 and tan A = 3/4.", ["// Use sin²A + cos²A = 1", "cos²A = 1 − 9/25 = 16/25", "cos A = 4/5", "tan A = sin A / cos A = (3/5) / (4/5) = 3/4"], 3),
      bank("Statistics", "Write the empirical relation between mean, median and mode.", "3 Median = Mode + 2 Mean.", 1, "uc"),
      bank("Surface Areas and Volumes", "Write the volume and curved surface area of a cone of radius r, height h and slant height l.", "Volume = (1/3)πr²h and curved surface area = πrl, where l = √(r² + h²).", 2),
      unsolved("Coordinate Geometry", "Find the point on the x-axis that is equidistant from A(2, −5) and B(−2, 9).", "(−7, 0)", "Take P(x, 0) and set PA² = PB²: (x − 2)² + 25 = (x + 2)² + 81.", 3),
    ],
    mcqs: [
      mcq("Real Numbers", "The HCF of 26 and 91 is", ["13", "7", "26", "1"], 0, "26 = 2 × 13 and 91 = 7 × 13, so the HCF is 13."),
      mcq("Quadratic Equations", "The roots of x² − 4x + 4 = 0 are", ["Real and equal", "Real and distinct", "Not real", "One real and one not real"], 0, "D = 16 − 16 = 0, so the roots are real and equal (x = 2)."),
      mcq("Probability", "Two coins are tossed together. The probability of getting at least one head is", ["1/4", "1/2", "3/4", "1"], 2, "The outcomes are HH, HT, TH and TT; three of the four have a head, so P = 3/4."),
      mcq("Circles", "How many tangents can be drawn to a circle from a point inside it?", ["0", "1", "2", "Infinitely many"], 0, "Every line through an interior point cuts the circle in two points, so none is a tangent."),
    ],
  },
  "10-physics": {
    items: [
      bank("Electricity", "State Ohm's law.", "At constant temperature, the current through a conductor is directly proportional to the potential difference across it: V = IR.", 2),
      solved("Electricity", "Resistors of 2 Ω, 3 Ω and 6 Ω are connected in parallel. Find the equivalent resistance.", "1 Ω", ["1/R = 1/2 + 1/3 + 1/6", "1/R = (3 + 2 + 1)/6 = 1", "R = 1 Ω"], 3),
      bank("Light: Refraction", "Define the power of a lens and state its SI unit.", "Power P = 1/f, with f in metres. Its SI unit is the dioptre (D); a convex lens has positive power and a concave lens negative power.", 2),
      solved("Light: Refraction", "An object is placed 30 cm from a convex lens of focal length 20 cm. Find the image distance.", "v = +60 cm: the image is real and inverted.", ["// Lens formula 1/v − 1/u = 1/f, with u = −30 cm and f = +20 cm", "1/v = 1/20 + 1/(−30)", "1/v = (3 − 2)/60 = 1/60", "v = +60 cm"], 3),
      bank("Human Eye", "What is myopia, and how is it corrected?", "Myopia (short-sightedness): distant objects look blurred because their image forms in front of the retina. It is corrected with a concave lens of suitable power.", 2),
      bank("Magnetic Effects", "State Fleming's left-hand rule.", "Stretch the thumb, forefinger and middle finger of the left hand at right angles to each other: the forefinger points along the field, the middle finger along the current, and the thumb gives the force on the conductor.", 2),
    ],
    mcqs: [
      mcq("Electricity", "The SI unit of electric power is", ["Joule", "Watt", "Volt", "Ampere"], 1, "Power P = VI is measured in watts; 1 W = 1 J/s."),
      mcq("Light: Reflection", "The image formed by a plane mirror is", ["Real and inverted", "Virtual and erect", "Real and erect", "Virtual and inverted"], 1, "A plane mirror forms a virtual, erect image of the same size, as far behind the mirror as the object is in front of it."),
      mcq("Human Eye", "The defect in which a person cannot see nearby objects clearly is", ["Myopia", "Hypermetropia", "Astigmatism", "Cataract"], 1, "Hypermetropia (long-sightedness) is corrected with a convex lens."),
      mcq("Magnetic Effects", "Which device converts mechanical energy into electrical energy?", ["Electric motor", "Electric generator", "Galvanometer", "Transformer"], 1, "A generator works on electromagnetic induction; an electric motor does the reverse."),
    ],
  },
  "10-chemistry": {
    items: [
      bank("Chemical Reactions", "What is a displacement reaction? Give an example.", "A more reactive element displaces a less reactive one from its compound, for example Fe + CuSO₄ → FeSO₄ + Cu.", 2),
      bank("Acids, Bases and Salts", "What is the pH of a neutral solution, and what do values below and above it mean?", "pH 7 is neutral; a pH below 7 is acidic and above 7 is basic (alkaline).", 1),
      bank("Metals and Non-metals", "Why is aluminium used to make cooking utensils?", "It is light, a good conductor of heat, and resists corrosion because of a thin protective layer of aluminium oxide.", 2),
      bank("Carbon Compounds", "What is a homologous series?", "A family of compounds with the same functional group, in which successive members differ by a CH₂ unit and show similar chemical properties.", 2),
      solved("Mole Concept", "Find the number of moles in 22 g of carbon dioxide.", "0.5 mol", ["// Molar mass of CO₂ = 12 + 2 × 16 = 44 g/mol", "n = mass / molar mass = 22 / 44", "n = 0.5 mol"], 2, "i"),
      bank("Acids, Bases and Salts", "Write the chemical formula of bleaching powder and one use of it.", "CaOCl₂; it is used to disinfect drinking water and to bleach cotton and linen.", 2),
    ],
    mcqs: [
      mcq("Chemical Reactions", "The reaction 2Mg + O₂ → 2MgO is an example of", ["Decomposition", "Combination", "Displacement", "Double displacement"], 1, "Two substances combine to form a single product."),
      mcq("Acids, Bases and Salts", "Chemically, baking soda is", ["Sodium carbonate", "Sodium hydrogen carbonate", "Calcium carbonate", "Sodium chloride"], 1, "Baking soda is sodium hydrogen carbonate, NaHCO₃."),
      mcq("Metals and Non-metals", "Which metal is a liquid at room temperature?", ["Sodium", "Mercury", "Zinc", "Iron"], 1, "Mercury is the only metal that is liquid at room temperature."),
      mcq("Carbon Compounds", "The functional group present in ethanol is", ["−COOH", "−OH", "−CHO", "C=O"], 1, "Ethanol, C₂H₅OH, is an alcohol, so its functional group is −OH."),
    ],
  },
  "10-english": {
    items: [
      bank("Grammar: Voice", "Change into the passive voice: The teacher praised the students.", "The students were praised by the teacher.", 1),
      bank("Grammar: Reported Speech", "Change into indirect speech: She said, \"I am tired.\"", "She said that she was tired.", 1),
      bank("Grammar: Tenses", "Fill in the blank with the correct form of the verb: She ____ (live) here since 2015.", "She has been living here since 2015 (or: She has lived here since 2015).", 1),
      bank("Literature: First Flight", "In \"A Letter to God\", why did Lencho write a letter to God?", "A hailstorm destroyed his crop. With firm faith in God, he wrote asking for a hundred pesos so that he could sow his field again.", 3),
      bank("Literature: First Flight", "What is the central message of \"His First Flight\"?", "Fear holds us back: the young seagull flies only when hunger pushes him to try, showing that confidence comes from taking the first step.", 3),
      bank("Writing: Formal Letter", "What are the parts of a formal letter?", "Sender's address, date, receiver's address, subject, salutation, body, complimentary close (Yours faithfully or Yours sincerely), and the sender's name and signature.", 2),
    ],
    mcqs: [
      mcq("Grammar: Determiners", "Choose the correct determiner: He did not have ____ money left.", ["many", "much", "few", "a few"], 1, "\"Money\" is uncountable, so it takes \"much\"."),
      mcq("Grammar: Modals", "Choose the correct modal: You ____ wear a helmet while riding; it is the law.", ["may", "must", "might", "could"], 1, "\"Must\" expresses a legal obligation."),
      mcq("Grammar: Prepositions", "Fill in the blank: She is good ____ mathematics.", ["in", "at", "on", "with"], 1, "The fixed expression is \"good at\"."),
      mcq("Grammar: Subject-Verb Agreement", "Choose the correct verb: Each of the boys ____ a prize.", ["get", "gets", "are getting", "have got"], 1, "\"Each\" is singular, so it takes a singular verb: gets."),
    ],
  },
  "12-math": {
    items: [
      bank("Matrices", "When is a square matrix called symmetric, and when skew-symmetric?", "Symmetric if Aᵀ = A; skew-symmetric if Aᵀ = −A, in which case every diagonal entry is zero.", 2),
      solved("Determinants", "Evaluate the determinant with rows (2, 3) and (1, 4).", "5", ["Determinant = 2 × 4 − 3 × 1", "= 8 − 3 = 5"], 1),
      solved("Continuity and Differentiability", "Differentiate y = sin(x²) with respect to x.", "dy/dx = 2x cos(x²)", ["// Chain rule: d/dx f(g(x)) = f′(g(x)) · g′(x)", "dy/dx = cos(x²) · d/dx(x²)", "dy/dx = 2x cos(x²)"], 2),
      solved("Integrals", "Evaluate ∫ x eˣ dx.", "x eˣ − eˣ + C", ["// Integration by parts with u = x and dv = eˣ dx", "∫ x eˣ dx = x eˣ − ∫ eˣ dx", "= x eˣ − eˣ + C"], 3),
      bank("Probability", "State Bayes' theorem.", "If E₁, E₂, …, Eₙ partition the sample space and A is any event, P(Eᵢ|A) = P(Eᵢ) P(A|Eᵢ) / Σ P(Eⱼ) P(A|Eⱼ).", 3),
      bank("Vectors", "Write the formula for the angle θ between two vectors a and b.", "cos θ = (a · b) / (|a| |b|).", 2),
    ],
    mcqs: [
      mcq("Relations and Functions", "A relation that is reflexive, symmetric and transitive is called", ["A function", "An equivalence relation", "A partial order", "An identity relation"], 1, "A relation with all three properties is an equivalence relation."),
      mcq("Integrals", "∫ (1/x) dx equals", ["x + C", "log|x| + C", "1/x² + C", "−1/x² + C"], 1, "The derivative of log|x| is 1/x."),
      mcq("Application of Derivatives", "The function f(x) = x² is strictly decreasing on", ["(0, ∞)", "(−∞, 0)", "(−∞, ∞)", "No interval"], 1, "f′(x) = 2x, which is negative for x < 0."),
      mcq("Probability", "If A and B are independent events, P(A ∩ B) equals", ["P(A) + P(B)", "P(A) P(B)", "P(A|B)", "P(A) − P(B)"], 1, "For independent events, P(A ∩ B) = P(A) P(B)."),
    ],
  },
  "12-physics": {
    items: [
      bank("Electric Charges and Fields", "State Coulomb's law.", "The force between two point charges is F = k q₁q₂ / r²: proportional to the product of the charges and inversely proportional to the square of the distance between them, with k = 9 × 10⁹ N m² C⁻².", 2),
      bank("Current Electricity", "State Kirchhoff's two laws.", "Junction rule: the total current entering a junction equals the total current leaving it (conservation of charge). Loop rule: the sum of potential changes around any closed loop is zero (conservation of energy).", 3),
      solved("Dual Nature", "Find the de Broglie wavelength of an electron accelerated through 100 V.", "λ ≈ 0.123 nm", ["// For an electron accelerated through V volts, λ = 1.227 / √V nm", "λ = 1.227 / √100 nm", "λ = 0.1227 nm ≈ 0.123 nm"], 3),
      bank("Semiconductors", "Why is a p-n junction diode used in a rectifier?", "It conducts in forward bias and blocks current in reverse bias, so it converts alternating current into pulsating direct current.", 2),
      bank("Ray Optics", "Write the two conditions for total internal reflection.", "Light must travel from a denser to a rarer medium, and the angle of incidence must be greater than the critical angle.", 2),
      bank("Electromagnetic Induction", "State Lenz's law.", "The induced current flows in a direction that opposes the change in magnetic flux producing it.", 2),
    ],
    mcqs: [
      mcq("Current Electricity", "The SI unit of resistivity is", ["Ω", "Ω m", "Ω/m", "S"], 1, "ρ = RA/l, so its unit is Ω m."),
      mcq("Semiconductors", "In an n-type semiconductor, the majority charge carriers are", ["Holes", "Electrons", "Protons", "Ions"], 1, "Pentavalent impurity atoms donate free electrons."),
      mcq("Wave Optics", "Which phenomenon shows that light is a transverse wave?", ["Interference", "Diffraction", "Polarisation", "Reflection"], 2, "Only transverse waves can be polarised."),
      mcq("Nuclei", "The energy in a nuclear power reactor comes from", ["Nuclear fusion", "Nuclear fission", "Radioactive decay only", "Chemical combustion"], 1, "Reactors use the controlled fission of uranium-235."),
    ],
  },
  "12-chemistry": {
    items: [
      bank("Solutions", "Define molality.", "The number of moles of solute per kilogram of solvent. Unlike molarity, it does not change with temperature.", 2),
      bank("Electrochemistry", "State Faraday's first law of electrolysis.", "The mass of a substance deposited at an electrode is directly proportional to the charge passed: m = Z × Q = Z × I × t.", 2),
      solved("Chemical Kinetics", "The half-life of a first-order reaction is 30 min. Find its rate constant.", "k ≈ 0.0231 min⁻¹", ["// For a first-order reaction, t½ = 0.693 / k", "k = 0.693 / 30 min", "k ≈ 0.0231 min⁻¹"], 3),
      bank("Coordination Compounds", "Write the IUPAC name of [Co(NH₃)₆]Cl₃.", "Hexaamminecobalt(III) chloride.", 2),
      bank("Aldehydes and Ketones", "Give a test to distinguish an aldehyde from a ketone.", "Tollens' test: an aldehyde gives a silver mirror with Tollens' reagent; a ketone does not.", 2),
      bank("Biomolecules", "What are the products of the hydrolysis of sucrose?", "Glucose and fructose, in an equimolar mixture called invert sugar.", 2),
    ],
    mcqs: [
      mcq("Solutions", "Which of these is a colligative property?", ["Viscosity", "Osmotic pressure", "Surface tension", "Density"], 1, "Colligative properties depend only on the number of solute particles; osmotic pressure is one of them."),
      mcq("Electrochemistry", "The unit of molar conductivity is", ["S cm⁻¹", "S cm² mol⁻¹", "Ω cm", "mol L⁻¹"], 1, "Λm = κ × 1000 / M, which is measured in S cm² mol⁻¹."),
      mcq("Amines", "Which amines give the carbylamine (isocyanide) test?", ["Primary amines", "Secondary amines", "Tertiary amines", "All amines"], 0, "Only primary amines form foul-smelling isocyanides with chloroform and alcoholic KOH."),
      mcq("d- and f-Block Elements", "Lanthanoid contraction refers to", ["An increase in atomic size", "A steady decrease in atomic and ionic radii across the series", "An increase in ionisation energy only", "A change in colour"], 1, "Poor shielding by the 4f electrons makes the radii decrease steadily from lanthanum to lutetium."),
    ],
  },
  "12-english": {
    items: [
      bank("Literature: Flamingo", "In \"The Last Lesson\", why was M. Hamel's class special that day?", "An order from Berlin meant only German would be taught in the schools of Alsace and Lorraine. It was his last French lesson, so the villagers came to honour him.", 3),
      bank("Literature: Flamingo", "What does \"My Mother at Sixty-six\" say about ageing?", "Seeing her mother's pale, ashen face, the poet feels the pain and fear of losing her, but hides it with a smile and says \"see you soon, Amma\".", 3),
      bank("Literature: Vistas", "What is the theme of \"The Enemy\"?", "Humanity rising above war and hatred: Dr Sadao saves a wounded American prisoner because his duty as a doctor comes before national enmity.", 3),
      bank("Writing: Notice", "What should a notice include?", "The organisation's name, the word NOTICE, the date, a clear heading, the details (what, when, where and who), and the writer's name and designation, in about 50 words.", 2),
      bank("Grammar: Narration", "Change into indirect speech: He said to me, \"Where do you live?\"", "He asked me where I lived.", 1),
      bank("Writing: Report", "How is a newspaper report structured?", "A headline, a byline with place and date, an opening paragraph that answers what, where and when, then the details, causes and quotations, and a closing line on the outcome.", 3),
    ],
    mcqs: [
      mcq("Literature: Flamingo", "\"Lost Spring\" describes the lives of children in", ["Seemapuri and Firozabad", "Delhi and Agra", "Mumbai and Pune", "Kolkata and Chennai"], 0, "Anees Jung writes about ragpickers in Seemapuri and bangle-makers in Firozabad."),
      mcq("Literature: Vistas", "Who wrote \"The Third Level\"?", ["Jack Finney", "Selma Lagerlöf", "Pearl S. Buck", "Colin Dexter"], 0, "\"The Third Level\" is by Jack Finney."),
      mcq("Grammar", "Choose the correct sentence.", ["He is one of the best player.", "He is one of the best players.", "He is one of best players.", "He is one the best players."], 1, "\"One of the\" is followed by a plural noun."),
      mcq("Literature: Flamingo", "In \"Deep Water\", William Douglas became afraid of water after", ["A boating accident", "An older boy threw him into the deep end of the YMCA pool", "A flood in his village", "A fall from a bridge"], 1, "A big boy tossed him into the deep end of the YMCA pool, and he nearly drowned."),
    ],
  },
};

/* The larger Question Bank (lib/board-exams/bank, 2026-11-22): short answers across each subject's syllabus chapters. */
const BANK: Record<string, BankRow[]> = {
  "10-math": X_MATH, "10-physics": X_PHYSICS, "10-chemistry": X_CHEMISTRY,
  "12-math": XII_MATH, "12-physics": XII_PHYSICS, "12-chemistry": XII_CHEMISTRY,
};

/** The extra questions for one class and pack, with ids of their own. */
export function extraFor(cls: string, pack: string): { items: Item[]; mcqs: Mcq[] } {
  const extra = EXTRA[`${cls}-${pack}`] ?? { items: [], mcqs: [] };
  const rows = (BANK[`${cls}-${pack}`] ?? []).map(([ch, q, a, marks, b]) => bank(ch, q, a, marks, b));
  // UP Board only questions (lib/board-exams/up-board.ts), with ids of their own.
  const up = upFor(cls, pack);
  return {
    items: [
      ...extra.items.map((item, index) => ({ ...item, id: `${cls}-${pack}-x${index + 1}` })),
      ...rows.map((item, index) => ({ ...item, id: `${cls}-${pack}-qb${index + 1}` })),
      ...up.items.map((item, index) => ({ ...item, id: `${cls}-${pack}-up${index + 1}` })),
    ],
    mcqs: [
      ...extra.mcqs.map((item, index) => ({ ...item, id: `${cls}-${pack}-xm${index + 1}` })),
      ...up.mcqs.map((item, index) => ({ ...item, id: `${cls}-${pack}-upm${index + 1}` })),
    ],
  };
}
