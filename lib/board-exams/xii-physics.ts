import { bank, imp, mcq, pack, solved, unsolved } from "./types";

/* Class 12 Physics. Tags: u = UP Board, c = CBSE, i = ISC. */
export default pack("xii-physics", [
  bank("Electric Charges and Fields", "State Coulomb's law.", "The force between two point charges is directly proportional to the product of the charges and inversely proportional to the square of the distance between them: F = k q₁q₂ / r², acting along the line joining them.", 2),
  bank("Electric Charges and Fields", "State Gauss's law in electrostatics.", "The total electric flux through any closed surface equals 1/ε₀ times the net charge enclosed by it: Φ = q/ε₀.", 2),
  bank("Current Electricity", "State Kirchhoff's two laws.", "Junction law: the sum of currents entering a junction equals the sum leaving it (conservation of charge). Loop law: the algebraic sum of potential changes round any closed loop is zero (conservation of energy).", 2),
  bank("Moving Charges and Magnetism", "State the Biot-Savart law.", "The field dB due to a current element I dl at distance r is dB = (μ₀/4π) I dl sin θ / r², perpendicular to both dl and r.", 2),
  bank("Electromagnetic Induction", "State Faraday's laws and Lenz's law.", "An emf is induced whenever the magnetic flux linked with a circuit changes, and its magnitude equals the rate of change of flux: e = −dΦ/dt. Lenz's law: the induced current opposes the change that produces it.", 2),
  bank("Alternating Current", "What is the power factor of an AC circuit?", "cos φ = R/Z, the cosine of the phase angle between voltage and current. It is 1 for a pure resistor and 0 for a pure inductor or capacitor.", 2),
  bank("Ray Optics", "State the conditions for total internal reflection.", "Light must travel from a denser to a rarer medium, and the angle of incidence must exceed the critical angle, where sin C = 1/n.", 2),
  bank("Wave Optics", "State Huygens' principle.", "Every point on a wavefront acts as a source of secondary wavelets, and the forward envelope of these wavelets at a later time gives the new wavefront.", 2),
  bank("Dual Nature", "Write Einstein's photoelectric equation and explain its terms.", "K_max = hν − φ₀, where hν is the energy of the incident photon, φ₀ the work function of the metal and K_max the maximum kinetic energy of the emitted electron.", 2),
  bank("Semiconductors", "Distinguish between n-type and p-type semiconductors.", "n-type: doped with a pentavalent impurity (P, As); electrons are the majority carriers. p-type: doped with a trivalent impurity (B, Al); holes are the majority carriers.", 2),
  bank("Electrostatic Potential and Capacitance", "Write the expression for the capacitance of a parallel-plate capacitor.", "C = ε₀A/d for air between the plates, and C = Kε₀A/d with a dielectric of constant K. A is the plate area and d the separation.", 2),
  bank("Current Electricity", "State Kirchhoff's two laws.", "Junction law: the algebraic sum of currents at a junction is zero (conservation of charge). Loop law: the algebraic sum of potential changes round a closed loop is zero (conservation of energy).", 2),
  bank("Atoms", "State Bohr's postulates of the hydrogen atom.", "Electrons revolve in stationary orbits without radiating. Angular momentum is quantised: mvr = nh/2π. Radiation of energy hν = E₂ − E₁ is emitted or absorbed only when an electron jumps between orbits.", 3),
  bank("Electromagnetic Waves", "Arrange the electromagnetic spectrum in order of increasing frequency.", "Radio waves, microwaves, infrared, visible light, ultraviolet, X-rays, gamma rays.", 2),
  imp("Electrostatic Potential and Capacitance", 5, "Three capacitors of 2 μF, 3 μF and 6 μF are connected in series across a 12 V battery. Find the equivalent capacitance and the charge on each.", "C = 1 μF, Q = 12 μC on each", [
    "// Series combination", "1/C = 1/2 + 1/3 + 1/6",
    "1/C = (3 + 2 + 1)/6 = 1", "C = 1 μF",
    "// In series every capacitor carries the same charge", "Q = CV = 1 μF × 12 V",
    "∴ C = 1 μF,  Q = 12 μC on each capacitor",
  ], 3),

  imp("Electric Charges and Fields", 5, "Using Gauss's law, derive the electric field due to an infinitely long straight wire of linear charge density λ.", "E = λ / (2πε₀r)", [
    "// Gaussian surface: a cylinder of radius r and length l, coaxial with the wire", "Charge enclosed  q = λl",
    "// Flux passes only through the curved surface, where E is constant and normal", "Φ = E × 2πrl",
    "// Gauss's law", "E × 2πrl = λl / ε₀", "∴ E = λ / (2πε₀r)",
  ], 3),
  imp("Current Electricity", 5, "Derive the relation between current and drift velocity.", "I = n e A v_d", [
    "// Conductor of cross-section A with n free electrons per unit volume", "Electrons in length l:  N = nAl",
    "// Total charge", "Q = nAle",
    "// Time to cross the length at drift velocity v_d", "t = l / v_d",
    "I = Q / t = nAle × v_d / l", "∴ I = n e A v_d",
  ], 3),
  imp("Moving Charges and Magnetism", 5, "Find the magnetic field at the centre of a circular coil of 100 turns and radius 8 cm carrying 0.40 A.", "B = 3.14 × 10⁻⁴ T", [
    "// Field at the centre of a coil of N turns", "B = μ₀ N I / 2r",
    "B = (4π × 10⁻⁷ × 100 × 0.40) / (2 × 0.08)", "B = π × 10⁻⁴ T", "∴ B = 3.14 × 10⁻⁴ T",
  ], 3),
  imp("Alternating Current", 5, "A series LCR circuit has L = 2.0 H, C = 32 μF and R = 10 Ω. Find the resonant angular frequency and the Q-value.", "ω₀ = 125 rad/s, Q = 25", [
    "// Resonance", "ω₀ = 1 / √(LC)",
    "ω₀ = 1 / √(2.0 × 32 × 10⁻⁶) = 1 / (8 × 10⁻³) = 125 rad/s",
    "// Quality factor", "Q = ω₀L / R = 125 × 2.0 / 10", "∴ ω₀ = 125 rad/s,  Q = 25",
  ], 3),
  imp("Ray Optics", 5, "A double convex lens has radii of curvature 20 cm each and refractive index 1.5. Find its focal length.", "f = 20 cm", [
    "// Lens maker's formula", "1/f = (n − 1)(1/R₁ − 1/R₂)",
    "// Sign convention", "R₁ = +20 cm,  R₂ = −20 cm",
    "1/f = (1.5 − 1)(1/20 + 1/20) = 0.5 × 1/10 = 1/20", "∴ f = 20 cm",
  ], 3),
  imp("Wave Optics", 5, "In Young's double-slit experiment the slits are 0.28 mm apart and the screen is 1.4 m away. The fourth bright fringe is 1.2 cm from the central fringe. Find the wavelength.", "λ = 600 nm", [
    "// Position of the nth bright fringe", "xₙ = n λ D / d",
    "λ = xₙ d / (n D)", "λ = (1.2 × 10⁻² × 0.28 × 10⁻³) / (4 × 1.4)",
    "λ = 6 × 10⁻⁷ m", "∴ λ = 600 nm",
  ], 3),
  imp("Dual Nature", 5, "The work function of caesium is 2.14 eV. Find the maximum kinetic energy of photoelectrons when light of frequency 6 × 10¹⁴ Hz falls on it. (h = 6.63 × 10⁻³⁴ J s)", "K_max ≈ 0.35 eV", [
    "// Energy of the photon", "E = hν = 6.63 × 10⁻³⁴ × 6 × 10¹⁴ = 3.98 × 10⁻¹⁹ J",
    "E = 3.98 × 10⁻¹⁹ / 1.6 × 10⁻¹⁹ = 2.49 eV",
    "// Einstein's equation", "K_max = hν − φ₀ = 2.49 − 2.14", "∴ K_max ≈ 0.35 eV",
  ], 3),
  imp("Atoms", 5, "Find the energy and wavelength of the photon emitted when the electron in a hydrogen atom jumps from n = 2 to n = 1.", "E = 10.2 eV, λ ≈ 122 nm", [
    "// Energy levels of hydrogen", "Eₙ = −13.6 / n² eV",
    "E₁ = −13.6 eV,   E₂ = −3.4 eV",
    "ΔE = E₂ − E₁ = 10.2 eV",
    "// λ in nm from E in eV", "λ = 1242 / 10.2", "∴ E = 10.2 eV,  λ ≈ 122 nm (Lyman series)",
  ], 3),
  imp("Semiconductors", 4, "Explain the working of a p-n junction diode as a full-wave rectifier.", "Two diodes conduct on alternate half cycles, so the current in the load is unidirectional in both halves.", [
    "// Circuit", "Centre-tapped transformer + diodes D₁, D₂ + load R_L",
    "// Positive half cycle", "D₁ forward biased → conducts,   D₂ reverse biased → off",
    "// Negative half cycle", "D₂ forward biased → conducts,   D₁ reverse biased → off",
    "// In both halves the current through R_L has the same direction", "∴ Output frequency = 2 × input frequency",
  ], 3),
  imp("Nuclei", 4, "A radioactive sample has a half-life of 10 days. What fraction of it remains after 30 days?", "1/8 of the sample", [
    "// Number of half-lives", "n = t / T½ = 30 / 10 = 3",
    "// Fraction remaining", "N / N₀ = (1/2)ⁿ = (1/2)³", "∴ N / N₀ = 1/8",
  ], 3, "i"),

  solved("Electric Charges and Fields", "Find the force between charges of 2 μC and 3 μC placed 30 cm apart in air.", "F = 0.6 N, repulsive", [
    "// Coulomb's law", "F = k q₁q₂ / r²",
    "F = (9 × 10⁹ × 2 × 10⁻⁶ × 3 × 10⁻⁶) / (0.30)²", "F = 0.054 / 0.09", "∴ F = 0.6 N (repulsive)",
  ], 3),
  solved("Capacitance", "A 12 pF capacitor is connected to a 50 V battery. How much electrostatic energy is stored?", "U = 1.5 × 10⁻⁸ J", [
    "// Energy stored", "U = ½ C V²", "U = ½ × 12 × 10⁻¹² × (50)²", "∴ U = 1.5 × 10⁻⁸ J",
  ], 2),
  solved("Dual Nature", "Find the de Broglie wavelength of an electron accelerated through 100 V.", "λ = 1.227 Å", [
    "// For an electron accelerated through V volts", "λ = 12.27 / √V  Å", "λ = 12.27 / √100", "∴ λ = 1.227 Å",
  ], 2),
  solved("Alternating Current", "A step-down transformer changes 2300 V to 230 V. If the primary has 4000 turns, find the turns in the secondary.", "Nₛ = 400", [
    "// Transformer ratio", "Vₛ / Vₚ = Nₛ / Nₚ", "Nₛ = Nₚ × Vₛ / Vₚ = 4000 × 230 / 2300", "∴ Nₛ = 400",
  ], 2),

  unsolved("Current Electricity", "In a metre bridge the balance point is 40 cm from end A with 6 Ω in the left gap. Find the resistance in the right gap.", "9 Ω", "R/S = l / (100 − l)."),
  unsolved("Moving Charges and Magnetism", "A wire 0.5 m long carrying 4 A is placed at right angles to a field of 0.2 T. Find the force on it.", "F = 0.4 N", "Use F = B I l sin θ with θ = 90°.", 2),
  unsolved("Electromagnetic Induction", "The current in a coil of self-inductance 0.5 H changes from 2 A to 4 A in 0.1 s. Find the induced emf.", "|e| = 10 V", "Use e = L dI/dt."),
  unsolved("Ray Optics", "The refractive index of glass is 1.5. Find the critical angle for a glass-air surface.", "C = sin⁻¹(2/3) ≈ 41.8°", "sin C = 1/n."),
  unsolved("Nuclei", "The mass defect of a nucleus is 0.03 u. Find its binding energy.", "≈ 27.9 MeV", "1 u corresponds to 931.5 MeV.", 2),
], [
  mcq("Electric Charges and Fields", "The SI unit of electric flux is", ["N C⁻¹", "N m² C⁻¹", "C m⁻²", "V m⁻¹"], 1, "Φ = E · A, so its unit is N m² C⁻¹ (or V m)."),
  mcq("Capacitance", "When a dielectric slab fills the space between the plates of an isolated charged capacitor, its capacitance", ["decreases", "increases", "stays the same", "becomes zero"], 1, "C becomes K times the original value."),
  mcq("Current Electricity", "The resistivity of a metallic conductor, as temperature rises,", ["decreases", "increases", "stays constant", "first falls then rises"], 1, "More frequent collisions reduce the relaxation time."),
  mcq("Moving Charges and Magnetism", "A charged particle moving parallel to a uniform magnetic field experiences", ["maximum force", "zero force", "a force along the field", "a force opposite to the field"], 1, "F = qvB sin θ and θ = 0."),
  mcq("Electromagnetic Induction", "Lenz's law is a consequence of the conservation of", ["charge", "momentum", "energy", "mass"], 2, "The induced current opposes the change, so work must be done to produce it."),
  mcq("Alternating Current", "In a purely inductive AC circuit the current", ["leads the voltage by π/2", "lags the voltage by π/2", "is in phase with the voltage", "lags by π"], 1, "Current lags the voltage by 90° in an inductor."),
  mcq("Ray Optics", "Optical fibres work on the principle of", ["refraction", "dispersion", "total internal reflection", "scattering"], 2, "Light is trapped in the core by repeated total internal reflection."),
  mcq("Wave Optics", "In Young's experiment, if the slit separation is doubled, the fringe width", ["doubles", "is halved", "stays the same", "becomes four times"], 1, "β = λD/d is inversely proportional to d."),
  mcq("Dual Nature", "The photoelectric effect supports the", ["wave nature of light", "particle nature of light", "wave nature of electrons", "none of these"], 1, "It is explained only by photons."),
  mcq("Atoms", "The ground-state energy of the hydrogen atom is", ["−3.4 eV", "−13.6 eV", "13.6 eV", "−1.51 eV"], 1, "Eₙ = −13.6/n² eV with n = 1."),
  mcq("Semiconductors", "In a forward-biased p-n junction, the width of the depletion layer", ["increases", "decreases", "stays the same", "becomes infinite"], 1, "The applied field opposes the barrier field."),
], [
  { title: "electrostatics-current.formulas", lines: [
    "// Electrostatics", "F = k q₁q₂ / r²,   k = 1/4πε₀ = 9 × 10⁹ N m² C⁻²", "E = F / q,   V = kq / r,   Φ = q / ε₀", "C = ε₀A / d,   U = ½CV² = Q²/2C",
    "// Current electricity", "I = n e A v_d,   R = ρl / A", "V = E − Ir   (cell of emf E, internal resistance r)", "Wheatstone bridge:  P/Q = R/S",
  ] },
  { title: "magnetism-ac.formulas", lines: [
    "// Magnetism", "F = q(v × B),   F = BIl sin θ", "B = μ₀I / 2πr   (straight wire)", "B = μ₀NI / 2r   (centre of coil)",
    "// EMI and AC", "e = −dΦ/dt,   e = Blv,   e = L dI/dt", "X_L = ωL,   X_C = 1/ωC", "Z = √(R² + (X_L − X_C)²),   ω₀ = 1/√(LC)",
  ] },
  { title: "optics-modern.formulas", lines: [
    "// Optics", "1/f = (n − 1)(1/R₁ − 1/R₂)", "n = sin((A + δₘ)/2) / sin(A/2)", "β = λD / d",
    "// Modern physics", "E = hν,   K_max = hν − φ₀", "λ = h / p = h / √(2mK)", "Eₙ = −13.6 / n² eV,   rₙ = 0.529 n² Å", "N = N₀ e^(−λt),   T½ = 0.693 / λ",
  ] },
]);
