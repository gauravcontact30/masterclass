import { bank, imp, mcq, solved, type Item, type Mcq } from "./types";

/*
 * UP Board only (user request 2026-11-28): questions of the kinds UPMSP sets every year, for High School (Class 10) and
 * Intermediate (Class 12). They are merged after the shared extra questions by extraFor (lib/board-exams/extra.ts) and
 * marked for UP Board, so they appear only when UP Board is chosen: in the question bank, Most Important, Objective
 * MCQs, the test series and the sample, mock and year-wise papers. Hindi comes from the shared exam dictionary
 * (lib/locales/hi), like every other board question.
 *
 * English: Hindi to English translation is a fixed section of the UP Board English paper, so those exercises are written
 * with the Hindi sentence and its English translation. Stars are our editorial rating of how regularly the question type
 * recurs (see lib/board-exams/papers.ts askedBand), never a claim about one particular paper.
 */
type Draft<T> = Omit<T, "id">;
type UpSet = { items: Draft<Item>[]; mcqs: Draft<Mcq>[] };
const T10 = "Translation: Hindi to English", T12 = "Translation: Hindi to English";
const tr = (ch: string, hindi: string, english: string, marks = 1) => bank(ch, `Translate into English: ${hindi}`, english, marks);

export const UP_EXTRA: Record<string, UpSet> = {
  "10-math": {
    items: [
      imp("Real Numbers", 5, "Prove that √5 is an irrational number.", "√5 is irrational: assuming √5 = a/b in lowest terms leads to 5 dividing both a and b.", [
        "// Suppose √5 is rational, so √5 = a/b where a and b are co-prime integers and b ≠ 0", "Squaring: 5 = a²/b², so a² = 5b²", "So 5 divides a², hence 5 divides a; write a = 5c",
        "Then 25c² = 5b², so b² = 5c²: 5 divides b² and hence b", "// 5 divides both a and b, which contradicts that they are co-prime", "So √5 is irrational."], 4),
      imp("Triangles", 5, "State and prove the Basic Proportionality Theorem (Thales theorem).", "If a line drawn parallel to one side of a triangle meets the other two sides in distinct points, it divides them in the same ratio.", [
        "// Given: in △ABC, DE ∥ BC meets AB at D and AC at E. To prove: AD/DB = AE/EC", "Join BE and CD; draw EN ⊥ AB and DM ⊥ AC",
        "ar(ADE)/ar(BDE) = (½ × AD × EN)/(½ × DB × EN) = AD/DB", "ar(ADE)/ar(DEC) = (½ × AE × DM)/(½ × EC × DM) = AE/EC",
        "// △BDE and △DEC stand on the same base DE between the same parallels DE and BC", "So ar(BDE) = ar(DEC), and therefore AD/DB = AE/EC."], 5),
      imp("Circles", 5, "Prove that the lengths of the tangents drawn from an external point to a circle are equal.", "PQ = PR: the two right triangles OQP and ORP are congruent by RHS.", [
        "// Given: a circle with centre O, external point P, tangents PQ and PR. To prove: PQ = PR", "Join OP, OQ and OR",
        "∠OQP = ∠ORP = 90° (a tangent is perpendicular to the radius at the point of contact)", "OQ = OR (radii) and OP is common",
        "So △OQP ≅ △ORP (RHS)", "Hence PQ = PR (CPCT)."], 4),
      imp("Trigonometry", 4, "Prove that (sin A + cosec A)² + (cos A + sec A)² = 7 + tan²A + cot²A.", "Expanding both squares and using sin²A + cos²A = 1 gives 7 + tan²A + cot²A.", [
        "LHS = sin²A + cosec²A + 2 sin A cosec A + cos²A + sec²A + 2 cos A sec A", "// sin A × cosec A = 1 and cos A × sec A = 1",
        "= (sin²A + cos²A) + cosec²A + sec²A + 4", "= 1 + (1 + cot²A) + (1 + tan²A) + 4", "= 7 + tan²A + cot²A = RHS"], 4),
      imp("Heights and Distances", 4, "The angle of elevation of the top of a tower from a point on the ground 20 m from its foot is 60°. Find the height of the tower.", "20√3 m ≈ 34.64 m", [
        "// Let the height be h; the base, the point and the top form a right triangle", "tan 60° = h / 20", "√3 = h / 20", "h = 20√3 ≈ 20 × 1.732 = 34.64 m"], 3),
      imp("Arithmetic Progressions", 4, "Find the sum of the first 40 positive integers divisible by 6.", "4920", [
        "// The numbers are 6, 12, 18, … so a = 6, d = 6 and n = 40", "Sₙ = n/2 [2a + (n − 1)d]", "S₄₀ = 20 [12 + 39 × 6]", "= 20 × 246 = 4920"], 3),
    ],
    mcqs: [
      mcq("Polynomials", "If α and β are the zeroes of x² − 5x + 6, then α + β is", ["5", "−5", "6", "−6"], 0, "α + β = −b/a = −(−5)/1 = 5."),
      mcq("Coordinate Geometry", "The distance of the point (3, 4) from the origin is", ["5", "7", "1", "25"], 0, "√(3² + 4²) = √25 = 5."),
      mcq("Trigonometry", "sin 30° + cos 60° equals", ["1", "1/2", "√3", "0"], 0, "1/2 + 1/2 = 1."),
      mcq("Probability", "If P(E) = 0.05, then P(not E) is", ["0.95", "0.05", "0.5", "1.05"], 0, "P(not E) = 1 − P(E) = 0.95."),
      mcq("Real Numbers", "The LCM of 12 and 18 is", ["36", "6", "72", "216"], 0, "12 = 2² × 3 and 18 = 2 × 3², so LCM = 2² × 3² = 36."),
      mcq("Quadratic Equations", "The discriminant of 2x² − 4x + 3 = 0 is", ["−8", "8", "40", "−40"], 0, "D = b² − 4ac = 16 − 24 = −8, so the roots are not real."),
      mcq("Arithmetic Progressions", "The 10th term of the AP 2, 7, 12, … is", ["47", "52", "45", "50"], 0, "a₁₀ = 2 + 9 × 5 = 47."),
      mcq("Areas Related to Circles", "The area of a quadrant of a circle of radius 14 cm is (π = 22/7)", ["154 cm²", "616 cm²", "44 cm²", "308 cm²"], 0, "(1/4) × (22/7) × 14 × 14 = 154 cm²."),
    ],
  },
  "12-math": {
    items: [
      imp("Relations and Functions", 4, "Show that the relation R = {(a, b) : |a − b| is even} on A = {1, 2, 3, 4, 5} is an equivalence relation.", "R is reflexive, symmetric and transitive, so it is an equivalence relation.", [
        "Reflexive: |a − a| = 0 is even, so (a, a) ∈ R for every a ∈ A", "Symmetric: if |a − b| is even then |b − a| = |a − b| is even, so (b, a) ∈ R",
        "Transitive: if |a − b| and |b − c| are even, a, b and c have the same parity", "// Numbers of the same parity differ by an even number", "So |a − c| is even and (a, c) ∈ R",
        "Hence R is an equivalence relation."], 4),
      imp("Integrals", 5, "Evaluate ∫ x eˣ dx.", "eˣ(x − 1) + C", [
        "// Integration by parts with u = x (algebraic) and dv = eˣ dx (exponential), by ILATE", "∫ x eˣ dx = x eˣ − ∫ 1 · eˣ dx", "= x eˣ − eˣ + C", "= eˣ(x − 1) + C"], 2),
      imp("Differential Equations", 5, "Solve dy/dx + y = eˣ.", "y = eˣ/2 + C e⁻ˣ", [
        "// A linear equation dy/dx + Py = Q with P = 1 and Q = eˣ", "Integrating factor = e^∫1 dx = eˣ", "y eˣ = ∫ eˣ · eˣ dx = ∫ e²ˣ dx = e²ˣ/2 + C",
        "y = eˣ/2 + C e⁻ˣ"], 4),
      imp("Probability", 5, "Bag I has 3 red and 4 black balls; bag II has 5 red and 6 black balls. A bag is chosen at random and a ball drawn from it is red. Find the probability that it came from bag II.", "35/68", [
        "// Bayes' theorem with E₁ = bag I, E₂ = bag II, A = the ball is red", "P(E₁) = P(E₂) = 1/2", "P(A|E₁) = 3/7 and P(A|E₂) = 5/11",
        "P(E₂|A) = P(E₂)P(A|E₂) / [P(E₁)P(A|E₁) + P(E₂)P(A|E₂)]", "= (5/11) / (3/7 + 5/11)", "= (5/11) / (68/77) = 35/68"], 4),
      imp("Application of Derivatives", 4, "Find two positive numbers whose sum is 15 and the sum of whose squares is the least.", "7.5 and 7.5", [
        "Let the numbers be x and 15 − x; S = x² + (15 − x)²", "dS/dx = 2x − 2(15 − x) = 4x − 30", "dS/dx = 0 gives x = 15/2",
        "d²S/dx² = 4 > 0, so S is least at x = 15/2", "The numbers are 15/2 and 15/2."], 4),
      imp("Application of Integrals", 4, "Find the area of the circle x² + y² = a² by integration.", "πa²", [
        "// The circle is symmetric in all four quadrants", "Area = 4 ∫₀ᵃ √(a² − x²) dx", "= 4 [ (x/2)√(a² − x²) + (a²/2) sin⁻¹(x/a) ]₀ᵃ",
        "= 4 [ 0 + (a²/2)(π/2) − 0 ]", "= πa² square units"], 5),
    ],
    mcqs: [
      mcq("Continuity and Differentiability", "d/dx (sin⁻¹ x) equals", ["1/√(1 − x²)", "−1/√(1 − x²)", "1/(1 + x²)", "√(1 − x²)"], 0, "The standard derivative of sin⁻¹ x, for −1 < x < 1."),
      mcq("Integrals", "∫₀^(π/2) sin x dx equals", ["1", "0", "π/2", "−1"], 0, "[−cos x]₀^(π/2) = −0 + 1 = 1."),
      mcq("Differential Equations", "The order of d²y/dx² + (dy/dx)³ = 0 is", ["2", "3", "1", "6"], 0, "The highest derivative present is the second."),
      mcq("Determinants", "If A is a 3 × 3 matrix with |A| = 4, then |adj A| is", ["16", "4", "64", "12"], 0, "|adj A| = |A|ⁿ⁻¹ = 4² = 16."),
      mcq("Vector Algebra", "î · (ĵ × k̂) equals", ["1", "0", "−1", "3"], 0, "ĵ × k̂ = î and î · î = 1."),
      mcq("Inverse Trigonometric Functions", "The principal value of tan⁻¹(1) is", ["π/4", "π/2", "3π/4", "π/3"], 0, "tan(π/4) = 1 and π/4 lies in (−π/2, π/2)."),
      mcq("Probability", "If A and B are independent with P(A) = 0.4 and P(B) = 0.5, then P(A ∩ B) is", ["0.2", "0.9", "0.1", "0.45"], 0, "P(A ∩ B) = P(A) × P(B) = 0.2."),
      mcq("Relations and Functions", "The number of one-one functions from {1, 2, 3} to itself is", ["6", "3", "9", "27"], 0, "3! = 6 bijections."),
    ],
  },
  "10-physics": {
    items: [
      imp("Light: Reflection", 4, "An object is placed 10 cm in front of a concave mirror of focal length 15 cm. Find the position, nature and magnification of the image.", "v = +30 cm: a virtual, erect image 3 times the size, behind the mirror.", [
        "// Sign convention: u = −10 cm, f = −15 cm", "1/v = 1/f − 1/u = −1/15 + 1/10", "1/v = (−2 + 3)/30 = 1/30, so v = +30 cm",
        "m = −v/u = −30/(−10) = +3", "// Positive v and m: the image is virtual, erect and magnified, 30 cm behind the mirror"], 3),
      imp("Light: Refraction", 5, "An object is placed 15 cm from a convex lens of focal length 10 cm. Find the position, nature and magnification of the image.", "v = +30 cm: a real, inverted image twice the size.", [
        "// u = −15 cm, f = +10 cm", "1/v = 1/f + 1/u = 1/10 − 1/15", "1/v = (3 − 2)/30 = 1/30, so v = +30 cm", "m = v/u = 30/(−15) = −2",
        "// The image is real, inverted and twice the size of the object, 30 cm on the other side of the lens"], 3),
      imp("Human Eye", 5, "What is myopia? State its two causes and how it is corrected, with a diagram description.", "Myopia (near-sightedness): distant objects look blurred because the image forms in front of the retina; it is corrected with a concave lens.", [
        "A myopic eye sees near objects clearly but not distant ones; its far point is nearer than infinity", "Cause 1: excessive curvature of the eye lens",
        "Cause 2: elongation of the eyeball", "Correction: a concave (diverging) lens of suitable power", "// The lens makes parallel rays appear to come from the far point, so the image forms on the retina"], 4),
      imp("Electricity", 4, "Resistors of 4 Ω and 6 Ω are joined in series to a 20 V battery. Find the current and the potential difference across each resistor.", "I = 2 A; 8 V across 4 Ω and 12 V across 6 Ω.", [
        "R = 4 + 6 = 10 Ω", "I = V/R = 20/10 = 2 A", "V₁ = IR₁ = 2 × 4 = 8 V", "V₂ = IR₂ = 2 × 6 = 12 V"], 3),
      imp("Electricity", 4, "A 100 W bulb is used for 5 hours a day for 30 days. Find the energy used and its cost at ₹6 per unit.", "15 kWh (15 units), costing ₹90.", [
        "Energy = power × time = 0.1 kW × (5 × 30) h", "= 0.1 × 150 = 15 kWh", "// 1 unit = 1 kWh", "Cost = 15 × ₹6 = ₹90"], 2),
      imp("Magnetic Effects", 4, "State Fleming's left-hand rule. Name one device that works on it.", "Stretch the forefinger, middle finger and thumb of the left hand at right angles: forefinger = field, middle finger = current, thumb = force (motion). The electric motor works on it.", [
        "Forefinger: direction of the magnetic field", "Middle finger: direction of the current", "Thumb: direction of the force on the conductor", "Used in the electric motor"], 3),
    ],
    mcqs: [
      mcq("Light: Refraction", "The SI unit of the power of a lens is", ["Dioptre", "Metre", "Watt", "Joule"], 0, "P = 1/f with f in metres; 1 m⁻¹ = 1 dioptre."),
      mcq("Light: Refraction", "The refractive index of glass is 1.5. The speed of light in glass is", ["2 × 10⁸ m/s", "3 × 10⁸ m/s", "1.5 × 10⁸ m/s", "4.5 × 10⁸ m/s"], 0, "v = c/n = 3 × 10⁸ / 1.5 = 2 × 10⁸ m/s."),
      mcq("Human Eye", "The least distance of distinct vision for a normal eye is about", ["25 cm", "25 m", "2.5 cm", "250 cm"], 0, "The near point of a normal adult eye is about 25 cm."),
      mcq("Electricity", "1 kWh equals", ["3.6 × 10⁶ J", "3.6 × 10³ J", "1000 J", "3600 J"], 0, "1000 W × 3600 s = 3.6 × 10⁶ J."),
      mcq("Electricity", "The SI unit of resistivity is", ["Ohm metre", "Ohm", "Ohm per metre", "Siemens"], 0, "ρ = RA/l, so its unit is Ω m."),
      mcq("Magnetic Effects", "The magnetic field inside a long current-carrying solenoid is", ["Uniform", "Zero", "Greatest at the ends", "Circular"], 0, "Inside a long solenoid the field lines are parallel and evenly spaced."),
      mcq("Human Eye", "Which colour of white light is scattered least by air?", ["Red", "Blue", "Violet", "Green"], 0, "Red has the longest wavelength, so it is scattered least."),
      mcq("Light: Reflection", "The magnification produced by a plane mirror is", ["+1", "−1", "0", "Infinite"], 0, "A plane mirror gives an erect image of the same size."),
    ],
  },
  "12-physics": {
    items: [
      imp("Electric Charges and Fields", 5, "Using Gauss's law, find the electric field due to an infinitely long straight wire with uniform linear charge density λ.", "E = λ / (2πε₀r), directed radially.", [
        "// Take a cylindrical Gaussian surface of radius r and length l, coaxial with the wire", "No flux passes through the flat ends; on the curved surface E is radial and constant",
        "Flux = E × 2πrl", "Charge enclosed = λl", "By Gauss's law: E × 2πrl = λl/ε₀", "E = λ / (2πε₀r)"], 5),
      imp("Electrostatic Potential and Capacitance", 5, "Derive the capacitance of a parallel plate capacitor.", "C = ε₀A/d", [
        "// Plates of area A, separation d, charges +Q and −Q; surface charge density σ = Q/A", "The field between the plates is E = σ/ε₀ = Q/(ε₀A)",
        "Potential difference V = Ed = Qd/(ε₀A)", "C = Q/V = ε₀A/d", "// With a dielectric of constant K filling the gap, C = Kε₀A/d"], 5),
      imp("Current Electricity", 5, "Using Kirchhoff's laws, obtain the condition of balance of a Wheatstone bridge.", "P/Q = R/S", [
        "// Arms P, Q, R and S; galvanometer between B and D; balanced when no current flows through it", "With Ig = 0, the current I₁ flows through P and Q, and I₂ through R and S",
        "Loop ABDA: I₁P − I₂R = 0, so I₁P = I₂R", "Loop BCDB: I₁Q − I₂S = 0, so I₁Q = I₂S", "Dividing: P/Q = R/S"], 5),
      imp("Dual Nature of Radiation and Matter", 4, "Light of photon energy 4 eV falls on a metal of work function 2 eV. Find the maximum kinetic energy of the photoelectrons and the stopping potential.", "Kmax = 2 eV; stopping potential = 2 V.", [
        "Einstein's equation: Kmax = hν − φ₀", "Kmax = 4 − 2 = 2 eV", "eV₀ = Kmax, so V₀ = 2 V"], 3),
      imp("Wave Optics", 4, "In Young's double-slit experiment, λ = 600 nm, the slit separation is 0.5 mm and the screen is 1 m away. Find the fringe width.", "1.2 mm", [
        "β = λD/d", "= (600 × 10⁻⁹ × 1) / (0.5 × 10⁻³)", "= 1.2 × 10⁻³ m = 1.2 mm"], 3),
      imp("Semiconductors", 5, "Explain the working of a p-n junction diode as a full-wave rectifier.", "Two diodes with a centre-tapped transformer conduct in alternate half cycles, so current flows through the load in the same direction in both halves.", [
        "// Circuit: the secondary of a centre-tapped transformer feeds diodes D₁ and D₂; the load joins the centre tap and the diodes' common output", "In the positive half cycle D₁ is forward biased and conducts; D₂ is reverse biased",
        "In the negative half cycle D₂ conducts and D₁ is off", "In both halves the current through the load flows the same way", "The output is a pulsating DC whose frequency is twice the input frequency"], 5),
    ],
    mcqs: [
      mcq("Electric Charges and Fields", "The SI unit of electric flux is", ["N m² C⁻¹", "N C⁻¹", "V m⁻²", "C m⁻²"], 0, "Flux = E × area, so N C⁻¹ × m²."),
      mcq("Electrostatic Potential and Capacitance", "The energy stored in a capacitor of capacitance C charged to potential V is", ["½CV²", "CV²", "½CV", "C²V"], 0, "U = ½CV² = Q²/2C."),
      mcq("Alternating Current", "The resonant frequency of a series LCR circuit is", ["1/(2π√(LC))", "2π√(LC)", "√(LC)/2π", "1/(LC)"], 0, "At resonance XL = XC, which gives ω₀ = 1/√(LC)."),
      mcq("Electromagnetic Induction", "Lenz's law is a consequence of the conservation of", ["Energy", "Charge", "Momentum", "Mass"], 0, "The induced current opposes its cause, so work must be done and energy is conserved."),
      mcq("Dual Nature of Radiation and Matter", "The de Broglie wavelength of a particle of momentum p is", ["h/p", "hp", "p/h", "h/p²"], 0, "λ = h/p."),
      mcq("Atoms", "The ionisation energy of a hydrogen atom in its ground state is", ["13.6 eV", "3.4 eV", "10.2 eV", "1.51 eV"], 0, "E₁ = −13.6 eV, so 13.6 eV removes the electron."),
      mcq("Semiconductors", "In an n-type semiconductor the majority charge carriers are", ["Electrons", "Holes", "Protons", "Positive ions"], 0, "Pentavalent donors add free electrons."),
      mcq("Alternating Current", "The average power in an AC circuit is", ["Vrms Irms cos φ", "Vrms Irms", "V₀I₀", "Vrms Irms sin φ"], 0, "P = Vrms Irms cos φ, where cos φ is the power factor."),
    ],
  },
  "10-chemistry": {
    items: [
      imp("Chemical Reactions and Equations", 5, "Balance the equation: Fe + H₂O → Fe₃O₄ + H₂", "3Fe + 4H₂O → Fe₃O₄ + 4H₂", [
        "// Balance the atom that appears in fewest compounds first: Fe", "3Fe + H₂O → Fe₃O₄ + H₂", "// Four O atoms on the right need 4H₂O on the left", "3Fe + 4H₂O → Fe₃O₄ + H₂",
        "// Eight H atoms on the left need 4H₂ on the right", "3Fe + 4H₂O → Fe₃O₄ + 4H₂"], 2),
      imp("Chemical Reactions and Equations", 4, "What is a decomposition reaction? Give one example each of thermal decomposition and of decomposition by light.", "A single reactant breaks into two or more simpler products. Thermal: 2Pb(NO₃)₂ → 2PbO + 4NO₂ + O₂. Light: 2AgCl → 2Ag + Cl₂ (in sunlight).", [
        "Decomposition: one reactant gives two or more products", "Thermal: 2Pb(NO₃)₂ → 2PbO + 4NO₂ + O₂ on heating; brown NO₂ fumes are seen", "Photolytic: 2AgCl → 2Ag + Cl₂ in sunlight; white AgCl turns grey",
        "// Silver bromide behaves the same way, which is used in black and white photography"], 3),
      imp("Acids, Bases and Salts", 5, "How is bleaching powder prepared? Write the equation and two uses.", "Ca(OH)₂ + Cl₂ → CaOCl₂ + H₂O; used for bleaching cotton and linen and for disinfecting drinking water.", [
        "Chlorine is passed over dry slaked lime", "Ca(OH)₂ + Cl₂ → CaOCl₂ + H₂O", "Use 1: bleaching cotton and linen in the textile industry and wood pulp in paper mills",
        "Use 2: disinfecting drinking water", "Use 3: as an oxidising agent in chemical industries"], 3),
      imp("Acids, Bases and Salts", 5, "How is Plaster of Paris prepared? Why must it be stored in a moisture-proof container?", "CaSO₄·2H₂O → CaSO₄·½H₂O + 1½H₂O at 373 K; with water it sets back into hard gypsum.", [
        "Gypsum is heated at 373 K", "CaSO₄·2H₂O → CaSO₄·½H₂O + 1½H₂O", "With water it changes back to gypsum and sets into a hard mass",
        "CaSO₄·½H₂O + 1½H₂O → CaSO₄·2H₂O", "// So moisture in the air would set it in the container"], 3),
      imp("Metals and Non-metals", 4, "Distinguish between roasting and calcination with one equation for each.", "Roasting heats a sulphide ore in excess air; calcination heats a carbonate ore in little or no air.", [
        "Roasting: sulphide ores in plenty of air", "2ZnS + 3O₂ → 2ZnO + 2SO₂", "Calcination: carbonate ores in limited air", "ZnCO₃ → ZnO + CO₂",
        "// Both give the metal oxide, which is then reduced, for example ZnO + C → Zn + CO"], 3),
      imp("Carbon and its Compounds", 5, "What is esterification? Write the equation for it and for saponification.", "An acid and an alcohol give an ester; the ester with an alkali gives back the alcohol and the salt of the acid (soap).", [
        "Esterification: CH₃COOH + C₂H₅OH → CH₃COOC₂H₅ + H₂O (with conc. H₂SO₄ as catalyst)", "// The ester, ethyl ethanoate, has a sweet smell",
        "Saponification: CH₃COOC₂H₅ + NaOH → C₂H₅OH + CH₃COONa", "// The same reaction with fats gives soap"], 3),
      imp("Carbon and its Compounds", 5, "Explain the cleansing action of soap.", "Soap molecules form micelles: their hydrocarbon tails hold the oily dirt inside and their ionic heads face the water, so the dirt is rinsed away.", [
        "A soap molecule has a long hydrophobic hydrocarbon tail and a hydrophilic ionic head (–COO⁻Na⁺)", "In water the tails turn towards the oily dirt and the heads towards the water",
        "The molecules form clusters called micelles, with the oil trapped in the centre", "The micelles stay suspended as an emulsion and are rinsed away with water"], 4),
      imp("Carbon and its Compounds", 4, "What are structural isomers? Draw the isomers of butane.", "Compounds with the same molecular formula but different structures. Butane (C₄H₁₀) has two: n-butane and isobutane (2-methylpropane).", [
        "Same molecular formula, different structural formula", "n-butane: CH₃–CH₂–CH₂–CH₃ (straight chain)", "Isobutane (2-methylpropane): CH₃–CH(CH₃)–CH₃ (branched chain)"], 3),
    ],
    mcqs: [
      mcq("Acids, Bases and Salts", "The chemical formula of washing soda is", ["Na₂CO₃·10H₂O", "NaHCO₃", "Na₂CO₃", "CaOCl₂"], 0, "Sodium carbonate decahydrate."),
      mcq("Acids, Bases and Salts", "The pH of pure water at 25 °C is", ["7", "0", "14", "1"], 0, "Pure water is neutral."),
      mcq("Chemical Reactions and Equations", "The rusting of iron is an example of", ["Oxidation", "Reduction", "Neutralisation", "Decomposition"], 0, "Iron combines with oxygen in moist air."),
      mcq("Metals and Non-metals", "Which metal is stored under kerosene?", ["Sodium", "Iron", "Copper", "Aluminium"], 0, "Sodium reacts vigorously with air and water."),
      mcq("Metals and Non-metals", "Which of these is an amphoteric oxide?", ["Al₂O₃", "Na₂O", "CO₂", "CaO"], 0, "Al₂O₃ reacts with both acids and bases."),
      mcq("Carbon and its Compounds", "The IUPAC name of CH₃CHO is", ["Ethanal", "Methanal", "Ethanol", "Ethanoic acid"], 0, "Two carbon atoms with an aldehyde group: ethanal."),
      mcq("Carbon and its Compounds", "The general formula of alkynes is", ["CₙH₂ₙ₋₂", "CₙH₂ₙ", "CₙH₂ₙ₊₂", "CₙHₙ"], 0, "One triple bond removes four hydrogens from the alkane formula."),
      mcq("Carbon and its Compounds", "Ethanol reacts with sodium to give", ["Hydrogen gas", "Oxygen gas", "Carbon dioxide", "Methane"], 0, "2C₂H₅OH + 2Na → 2C₂H₅ONa + H₂."),
    ],
  },
  "12-chemistry": {
    items: [
      imp("Electrochemistry", 5, "Calculate the EMF of the cell Zn | Zn²⁺ (0.1 M) || Cu²⁺ (1 M) | Cu at 298 K, given E°cell = 1.10 V.", "Ecell ≈ 1.13 V", [
        "Cell reaction: Zn + Cu²⁺ → Zn²⁺ + Cu, n = 2", "Nernst equation: Ecell = E°cell − (0.059/n) log([Zn²⁺]/[Cu²⁺])", "= 1.10 − (0.059/2) log(0.1/1)",
        "= 1.10 − 0.0295 × (−1)", "= 1.1295 V ≈ 1.13 V"], 3),
      imp("Chemical Kinetics", 5, "The rate constant of a first-order reaction is 6.93 × 10⁻³ s⁻¹. Find its half-life.", "100 s", [
        "For a first-order reaction t½ = 0.693/k", "t½ = 0.693 / (6.93 × 10⁻³)", "= 100 s", "// The half-life of a first-order reaction does not depend on the initial concentration"], 2),
      imp("Solutions", 4, "Find the freezing point of a 0.5 molal aqueous solution of glucose (Kf of water = 1.86 K kg mol⁻¹).", "−0.93 °C", [
        "ΔTf = Kf × m", "= 1.86 × 0.5 = 0.93 K", "// Glucose does not ionise, so i = 1", "Freezing point = 0 − 0.93 = −0.93 °C"], 3),
      imp("Coordination Compounds", 5, "Write the IUPAC name of [Co(NH₃)₆]Cl₃. State the hybridisation and magnetic behaviour of [Fe(CN)₆]⁴⁻.", "Hexaamminecobalt(III) chloride. [Fe(CN)₆]⁴⁻: d²sp³ hybridised, octahedral and diamagnetic.", [
        "[Co(NH₃)₆]Cl₃: hexaamminecobalt(III) chloride", "In [Fe(CN)₆]⁴⁻ iron is Fe²⁺, 3d⁶", "CN⁻ is a strong-field ligand, so the six d electrons pair up in three orbitals",
        "Two empty 3d, one 4s and three 4p orbitals give d²sp³ hybridisation, an octahedral shape", "No unpaired electron, so it is diamagnetic"], 4),
      imp("d- and f-Block Elements", 5, "What is lanthanoid contraction? Give its cause and two consequences.", "The steady decrease in the size of lanthanoid atoms and ions with increasing atomic number, caused by the poor shielding of 4f electrons.", [
        "Definition: atomic and ionic radii fall steadily from La to Lu", "Cause: 4f electrons shield the outer electrons poorly, so the effective nuclear charge rises",
        "Consequence 1: Zr and Hf (4d and 5d) have almost the same radii and very similar properties", "Consequence 2: the basic strength of the lanthanoid hydroxides decreases from La(OH)₃ to Lu(OH)₃",
        "// This also makes separating the lanthanoids from one another difficult"], 4),
      imp("d- and f-Block Elements", 4, "How is potassium permanganate prepared from pyrolusite? Write the equations.", "MnO₂ is fused with KOH in air to give K₂MnO₄, which disproportionates in acid to KMnO₄.", [
        "2MnO₂ + 4KOH + O₂ → 2K₂MnO₄ + 2H₂O (fusion, green manganate)", "3MnO₄²⁻ + 4H⁺ → 2MnO₄⁻ + MnO₂ + 2H₂O (purple permanganate)",
        "// Commercially the manganate is oxidised electrolytically in alkaline solution"], 3),
      imp("Haloalkanes and Haloarenes", 5, "Distinguish between SN1 and SN2 reactions.", "SN2 is a one-step, second-order reaction with inversion; SN1 is a two-step, first-order reaction through a carbocation with racemisation.", [
        "SN2: one step, rate = k[RX][Nu⁻], second order", "SN2: backside attack causes inversion of configuration; reactivity 1° > 2° > 3°",
        "SN1: two steps through a carbocation, rate = k[RX], first order", "SN1: gives a racemic mixture; reactivity 3° > 2° > 1°", "// Polar protic solvents favour SN1"], 4),
      imp("Alcohols, Phenols and Ethers", 5, "Write the Reimer–Tiemann reaction.", "Phenol with chloroform and aqueous NaOH, then acid, gives salicylaldehyde (2-hydroxybenzaldehyde).", [
        "C₆H₅OH + CHCl₃ + aq. NaOH, at 340 K", "An intermediate substituted benzal chloride forms", "Acidification gives salicylaldehyde, o-HO–C₆H₄–CHO",
        "// The –CHO group enters at the ortho position"], 2),
      imp("Aldehydes, Ketones and Carboxylic Acids", 5, "Write the Cannizzaro reaction with an example.", "2HCHO + conc. KOH → CH₃OH + HCOOK", [
        "Aldehydes with no α-hydrogen undergo self oxidation and reduction (disproportionation) with concentrated alkali", "2HCHO + conc. KOH → CH₃OH + HCOOK",
        "// One molecule is oxidised to the acid salt and the other reduced to the alcohol", "2C₆H₅CHO + conc. NaOH → C₆H₅CH₂OH + C₆H₅COONa"], 2),
      imp("Aldehydes, Ketones and Carboxylic Acids", 5, "Write the aldol condensation of ethanal.", "2CH₃CHO → CH₃CH(OH)CH₂CHO (aldol), which on heating gives but-2-enal.", [
        "Aldehydes with an α-hydrogen react with dilute alkali", "2CH₃CHO → CH₃CH(OH)CH₂CHO (3-hydroxybutanal) with dil. NaOH",
        "On heating it loses water: CH₃CH(OH)CH₂CHO → CH₃CH=CHCHO + H₂O (but-2-enal)"], 2),
      imp("Amines", 5, "Write the Hoffmann bromamide degradation reaction.", "RCONH₂ + Br₂ + 4NaOH → RNH₂ + Na₂CO₃ + 2NaBr + 2H₂O", [
        "An amide is heated with bromine and aqueous NaOH", "RCONH₂ + Br₂ + 4NaOH → RNH₂ + Na₂CO₃ + 2NaBr + 2H₂O",
        "// The amine has one carbon atom fewer than the amide", "Example: CH₃CONH₂ gives CH₃NH₂"], 2),
      imp("Amines", 4, "Write the carbylamine reaction. Why is it used as a test?", "RNH₂ + CHCl₃ + 3KOH → RNC + 3KCl + 3H₂O; only primary amines give the foul-smelling isocyanide.", [
        "A primary amine is heated with chloroform and alcoholic KOH", "RNH₂ + CHCl₃ + 3KOH → RNC + 3KCl + 3H₂O",
        "The isocyanide (carbylamine) has a very unpleasant smell", "// Secondary and tertiary amines do not react, so the test identifies primary amines"], 2),
    ],
    mcqs: [
      mcq("Solutions", "The unit of molality is", ["mol kg⁻¹", "mol L⁻¹", "g L⁻¹", "mol"], 0, "Moles of solute per kilogram of solvent."),
      mcq("Solutions", "Colligative properties depend on", ["The number of solute particles", "The nature of the solute", "The colour of the solution", "The volume of the solvent only"], 0, "They depend only on how many particles are dissolved."),
      mcq("Chemical Kinetics", "The unit of the rate constant of a first-order reaction is", ["s⁻¹", "mol L⁻¹ s⁻¹", "L mol⁻¹ s⁻¹", "mol L⁻¹"], 0, "rate = k[A], so k has units of s⁻¹."),
      mcq("Coordination Compounds", "The coordination number of cobalt in [Co(en)₃]³⁺ is", ["6", "3", "4", "2"], 0, "Ethylenediamine is bidentate: 3 × 2 = 6."),
      mcq("d- and f-Block Elements", "The most common oxidation state of the lanthanoids is", ["+3", "+2", "+4", "+1"], 0, "All lanthanoids show +3."),
      mcq("Haloalkanes and Haloarenes", "CH₃Br heated with sodium in dry ether gives", ["Ethane", "Methane", "Propane", "Ethene"], 0, "Wurtz reaction: 2CH₃Br + 2Na → C₂H₆ + 2NaBr."),
      mcq("Alcohols, Phenols and Ethers", "Lucas reagent is", ["Conc. HCl and anhydrous ZnCl₂", "Conc. H₂SO₄", "Alkaline KMnO₄", "Ammoniacal silver nitrate"], 0, "It distinguishes primary, secondary and tertiary alcohols."),
      mcq("Aldehydes, Ketones and Carboxylic Acids", "Tollens' reagent gives a silver mirror with", ["Aldehydes", "Ketones", "Ethers", "Alcohols"], 0, "Aldehydes reduce [Ag(NH₃)₂]⁺ to silver; ketones do not."),
      mcq("Amines", "Which is the strongest base in aqueous solution?", ["(CH₃)₂NH", "CH₃NH₂", "(CH₃)₃N", "NH₃"], 0, "In water the order is (CH₃)₂NH > CH₃NH₂ > (CH₃)₃N > NH₃."),
      mcq("Biomolecules", "A deficiency of vitamin C causes", ["Scurvy", "Rickets", "Night blindness", "Beriberi"], 0, "Vitamin C (ascorbic acid) prevents scurvy."),
    ],
  },
  "10-english": {
    items: [
      tr(T10, "वह प्रतिदिन सुबह टहलने जाता है।", "He goes for a walk every morning."),
      tr(T10, "क्या तुम अपना गृहकार्य कर रहे हो?", "Are you doing your homework?"),
      tr(T10, "मैंने अपना पाठ याद कर लिया है।", "I have learnt my lesson."),
      tr(T10, "सूर्य पूर्व में उगता है।", "The sun rises in the east."),
      tr(T10, "वे दो घंटे से क्रिकेट खेल रहे हैं।", "They have been playing cricket for two hours."),
      tr(T10, "कल रात बहुत वर्षा हुई।", "It rained heavily last night."),
      tr(T10, "जब मैं स्टेशन पहुँचा, गाड़ी जा चुकी थी।", "When I reached the station, the train had left."),
      tr(T10, "हम कल दिल्ली जाएँगे।", "We shall go to Delhi tomorrow."),
      tr(T10, "ईमानदारी सबसे अच्छी नीति है।", "Honesty is the best policy."),
      tr(T10, "मोहन सोहन से लंबा है।", "Mohan is taller than Sohan."),
      tr(T10, "अध्यापक ने छात्रों को एक कहानी सुनाई।", "The teacher told the students a story."),
      tr(T10, "हमें अपने बड़ों का आदर करना चाहिए।", "We should respect our elders."),
      tr(T10, "मेरे पिताजी एक किसान हैं।", "My father is a farmer."),
      tr(T10, "क्या तुमने ताजमहल देखा है?", "Have you seen the Taj Mahal?"),
      tr(T10, "यदि तुम परिश्रम करोगे तो अवश्य सफल होगे।", "If you work hard, you will surely succeed."),
      solved("Writing: Formal Letter", "Write an application to the principal of your school for two days' leave on account of illness.", "A formal application: addressee, date, subject, salutation, the request with its reason, a polite close and your name and class.", [
        "To, The Principal, Government Inter College, Lucknow", "Date: 10 January 2027", "Subject: Application for two days' leave", "Sir,",
        "With due respect, I beg to state that I have been suffering from fever since last night. The doctor has advised me to rest for two days.", "So I am unable to attend school on 10 and 11 January 2027. Kindly grant me leave for these two days.",
        "Thanking you,", "Yours obediently, Ramesh Kumar, Class 10 A", "// Keep the subject line, the reason and the dates exact: they carry the marks"], 4),
    ],
    mcqs: [
      mcq(T10, "Choose the correct translation: वह पत्र लिख रहा है।", ["He writes a letter.", "He is writing a letter.", "He has written a letter.", "He wrote a letter."], 1, "रहा है shows an action going on now: the present continuous."),
      mcq(T10, "Choose the correct translation: मैं कल बाज़ार गया था।", ["I go to the market yesterday.", "I went to the market yesterday.", "I have gone to the market yesterday.", "I will go to the market yesterday."], 1, "A finished action at a past time (कल, yesterday) takes the simple past."),
      mcq(T10, "Choose the correct translation: बच्चे मैदान में खेल रहे थे।", ["The children were playing in the field.", "The children are playing in the field.", "The children played in the field.", "The children have played in the field."], 0, "रहे थे is the past continuous."),
      mcq(T10, "Choose the correct translation: वह दस वर्ष से यहाँ रह रहा है।", ["He lives here for ten years.", "He is living here since ten years.", "He has been living here for ten years.", "He lived here for ten years."], 2, "An action going on from the past into the present takes the present perfect continuous, with for before a period."),
      mcq(T10, "Choose the correct translation: हमें समय का सदुपयोग करना चाहिए।", ["We should make good use of time.", "We must waste time.", "We can use time.", "We would use the time."], 0, "चाहिए is translated with should."),
      mcq(T10, "Choose the correct translation: भारत एक विशाल देश है।", ["India was a vast country.", "India is a vast country.", "India has a vast country.", "India will be a vast country."], 1, "A general fact takes the simple present."),
    ],
  },
  "12-english": {
    items: [
      tr(T12, "यदि वर्षा नहीं होती तो फ़सलें सूख जातीं।", "If it had not rained, the crops would have dried up.", 2),
      tr(T12, "जैसे ही घंटी बजी, छात्र कक्षा से बाहर निकल आए।", "As soon as the bell rang, the students came out of the class.", 2),
      tr(T12, "वह इतना कमज़ोर है कि चल नहीं सकता।", "He is too weak to walk.", 2),
      tr(T12, "भारत की अधिकांश जनता गाँवों में रहती है।", "Most of the people of India live in villages.", 2),
      tr(T12, "परिश्रम सफलता की कुंजी है।", "Hard work is the key to success.", 2),
      tr(T12, "उसने मुझसे पूछा कि मैं कहाँ जा रहा था।", "He asked me where I was going.", 2),
      tr(T12, "यह पुस्तक मेरे द्वारा पढ़ी गई है।", "This book has been read by me.", 2),
      tr(T12, "हमारे देश को 15 अगस्त 1947 को स्वतंत्रता मिली।", "Our country got independence on 15 August 1947.", 2),
      tr(T12, "विज्ञान ने मनुष्य के जीवन को सुखमय बना दिया है।", "Science has made human life comfortable.", 2),
      tr(T12, "वृक्ष हमें छाया, फल और शुद्ध वायु देते हैं।", "Trees give us shade, fruit and pure air.", 2),
      tr(T12, "जो परिश्रम करता है, वह कभी असफल नहीं होता।", "He who works hard never fails.", 2),
      tr(T12, "मुझे खेद है कि मैं समय पर नहीं आ सका।", "I am sorry that I could not come on time.", 2),
      tr(T12, "प्रदूषण आज एक गंभीर समस्या बन गया है।", "Pollution has become a serious problem today.", 2),
      tr(T12, "काश! मैं एक पक्षी होता।", "I wish I were a bird!", 2),
      tr(T12, "उसके आने से पहले हम खाना खा चुके थे।", "We had taken our meal before he came.", 2),
    ],
    mcqs: [
      mcq(T12, "Choose the correct translation: काश मैं डॉक्टर होता।", ["I wish I am a doctor.", "I wish I were a doctor.", "I wish I was being a doctor.", "I wish I will be a doctor."], 1, "An unreal wish takes were for every subject."),
      mcq(T12, "Choose the correct translation: वह जितना अमीर है, उतना ही कंजूस है।", ["He is as miserly as he is rich.", "He is richer than miserly.", "He is so rich that he is miserly.", "He is rich but not miserly."], 0, "जितना … उतना is as … as."),
      mcq(T12, "Choose the correct translation: मेरे पहुँचने से पहले गाड़ी छूट चुकी थी।", ["The train left before I had reached.", "The train had left before I reached.", "The train has left before I reached.", "The train was leaving before I reached."], 1, "The earlier of two past actions takes the past perfect."),
      mcq(T12, "Choose the correct translation: यह कार्य मुझसे नहीं हो सकता।", ["This work cannot be done by me.", "I do not do this work.", "This work is not done by me.", "I could not do this work."], 0, "मुझसे नहीं हो सकता is a passive with cannot be."),
      mcq(T12, "Choose the correct translation: बच्चों को ठंड से बचाना चाहिए।", ["Children should be protected from cold.", "Children must protect the cold.", "Children are protected by cold.", "Cold should protect children."], 0, "A passive with should be."),
      mcq(T12, "Choose the correct translation: क्या तुम्हें तैरना आता है?", ["Do you swim?", "Do you know how to swim?", "Are you swimming?", "Did you swim?"], 1, "आना here means to know how to."),
    ],
  },
};

/** The UP Board questions for one class and pack, marked for UP Board only. */
export function upFor(cls: string, pack: string): UpSet {
  const set = UP_EXTRA[`${cls}-${pack}`] ?? { items: [], mcqs: [] };
  return { items: set.items.map(item => ({ ...item, b: "u" })), mcqs: set.mcqs.map(item => ({ ...item, b: "u" })) };
}
