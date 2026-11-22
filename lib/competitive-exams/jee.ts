import { obj, pack, sub } from "./types";

/* JEE Main and Advanced. Objective: single-correct questions. Subjective: derivations and worked numerical problems. */
export default pack("jee", [
  obj("Physics", 5, "JEE Main 2019, JEE Main 2022", "A projectile is fired at 45° with speed u. Its horizontal range is", ["u²/2g", "u²/g", "2u²/g", "u²/4g"], 1, "R = u² sin 2θ / g, and sin 90° = 1."),
  obj("Physics", 5, "JEE Main 2018, JEE Main 2021", "The escape speed from the surface of the Earth is about", ["7.9 km/s", "9.8 km/s", "11.2 km/s", "16.7 km/s"], 2, "vₑ = √(2gR) ≈ 11.2 km/s; 7.9 km/s is the orbital speed near the surface."),
  obj("Physics", 4, "JEE Main 2019, JEE Main 2023", "Two resistors of 6 Ω and 3 Ω are connected in parallel. The equivalent resistance is", ["9 Ω", "4.5 Ω", "2 Ω", "0.5 Ω"], 2, "R = (6 × 3)/(6 + 3) = 2 Ω."),
  obj("Physics", 4, "JEE Main 2020, JEE Advanced 2017", "In the photoelectric effect, the stopping potential depends on the", ["intensity of light", "frequency of light", "area of the plate", "exposure time"], 1, "eV₀ = hν − φ, so it depends on frequency and the work function, not on intensity."),
  obj("Chemistry", 5, "JEE Main 2018, JEE Main 2022", "The hybridisation of carbon in ethyne (C₂H₂) is", ["sp³", "sp²", "sp", "dsp²"], 2, "Each carbon forms two sigma bonds and two pi bonds, so it is sp hybridised and linear."),
  obj("Chemistry", 5, "JEE Main 2019, JEE Main 2021", "Which quantum number determines the shape of an orbital?", ["Principal (n)", "Azimuthal (l)", "Magnetic (m)", "Spin (s)"], 1, "l = 0, 1, 2 correspond to s, p and d shapes."),
  obj("Chemistry", 4, "JEE Main 2020, JEE Main 2023", "For a first-order reaction, the half-life is", ["proportional to the initial concentration", "inversely proportional to the initial concentration", "independent of the initial concentration", "proportional to the square of the initial concentration"], 2, "t½ = 0.693/k for a first-order reaction."),
  obj("Chemistry", 4, "JEE Main 2019, JEE Advanced 2018", "Which of the following has the highest first ionisation enthalpy?", ["Li", "Be", "B", "C"], 3, "Across period 2 the trend rises overall; among these carbon is highest, though B is lower than Be."),
  obj("Mathematics", 5, "JEE Main 2018, JEE Main 2022", "The value of the limit of (sin x)/x as x tends to 0 is", ["0", "1", "∞", "not defined"], 1, "This standard limit equals 1 when x is in radians."),
  obj("Mathematics", 5, "JEE Main 2019, JEE Main 2021", "If the roots of x² − 5x + k = 0 are equal, the value of k is", ["5/2", "25/4", "25/2", "5"], 1, "Discriminant = 25 − 4k = 0, so k = 25/4."),
  obj("Mathematics", 4, "JEE Main 2020, JEE Main 2023", "The number of ways of arranging the letters of the word 'LEVEL' is", ["120", "60", "30", "20"], 2, "5!/(2! × 2!) = 30, since L and E each repeat twice."),
  obj("Mathematics", 4, "JEE Main 2019, JEE Advanced 2016", "The derivative of ln(sin x) with respect to x is", ["tan x", "cot x", "sec x", "−cot x"], 1, "d/dx ln(sin x) = cos x / sin x = cot x."),
  obj("Physics", 4, "JEE Main 2019, JEE Main 2022", "The SI unit of magnetic flux is the", ["tesla", "weber", "henry", "gauss"], 1, "1 weber = 1 tesla × 1 m²."),
  obj("Chemistry", 4, "JEE Main 2018, JEE Main 2021", "How many moles of water are present in 18 g of water?", ["0.5", "1", "2", "18"], 1, "The molar mass of water is 18 g/mol."),
  obj("Mathematics", 4, "JEE Main 2019, JEE Main 2023", "The value of i² + i⁴, where i = √−1, is", ["−2", "0", "2", "2i"], 1, "i² = −1 and i⁴ = 1, so the sum is 0."),
], [
  sub("Physics", 5, "IIT-JEE subjective papers before 2006, JEE Main 2020", "Derive the expression for the escape speed from the surface of a planet of mass M and radius R.", [
    "At the surface the total energy is ½mv² − GMm/R.",
    "To just escape, the body reaches infinity with zero speed, so the total energy is zero.",
    "½mv² = GMm/R.",
    "v = √(2GM/R) = √(2gR), since g = GM/R².",
    "The result does not depend on the mass of the body.",
  ]),
  sub("Physics", 5, "JEE Main 2019 and 2022 (numerical value)", "A block of mass 2 kg slides down a rough incline of 30° with coefficient of kinetic friction 0.2. Find its acceleration. (g = 10 m/s²)", [
    "Component of weight along the incline: g sin 30° = 5 m/s².",
    "Friction per unit mass: μ g cos 30° = 0.2 × 10 × 0.866 = 1.73 m/s².",
    "a = g sin θ − μ g cos θ = 5 − 1.73.",
    "a ≈ 3.27 m/s², independent of the mass.",
  ]),
  sub("Chemistry", 4, "JEE Main 2018 and 2021", "Calculate the pH of a 0.01 M solution of acetic acid. (Kₐ = 1.8 × 10⁻⁵)", [
    "For a weak acid, [H⁺] = √(Kₐ × C).",
    "[H⁺] = √(1.8 × 10⁻⁵ × 10⁻²) = √(1.8 × 10⁻⁷) = 4.24 × 10⁻⁴ M.",
    "pH = −log(4.24 × 10⁻⁴) = 4 − 0.63.",
    "pH ≈ 3.37.",
  ]),
  sub("Chemistry", 4, "JEE Advanced 2015 and 2019", "Explain why the boiling point of water is much higher than that of hydrogen sulphide.", [
    "Oxygen is small and highly electronegative, so O–H bonds are strongly polar.",
    "Water molecules form intermolecular hydrogen bonds, each molecule with up to four neighbours.",
    "Sulphur is larger and less electronegative, so H₂S has only weak dipole and dispersion forces.",
    "More energy is needed to separate water molecules: 100 °C against about −60 °C.",
  ]),
  sub("Mathematics", 5, "JEE Main 2019 and 2023", "Evaluate the integral of x·eˣ dx.", [
    "Use integration by parts with u = x and dv = eˣ dx.",
    "Then du = dx and v = eˣ.",
    "∫x eˣ dx = x eˣ − ∫eˣ dx.",
    "= eˣ(x − 1) + C.",
  ]),
  sub("Mathematics", 4, "JEE Main 2018 and 2022", "Find the equation of the tangent to the circle x² + y² = 25 at the point (3, 4).", [
    "For the circle x² + y² = a², the tangent at (x₁, y₁) is x x₁ + y y₁ = a².",
    "Substitute (3, 4) and a² = 25.",
    "3x + 4y = 25.",
    "Check: the distance of the centre from this line is 25/5 = 5, the radius.",
  ]),
  sub("Physics", 4, "JEE Main 2019 and 2021", "Derive the time period of a simple pendulum for small oscillations.", [
    "For a bob displaced by a small angle θ, the restoring force is −mg sin θ ≈ −mgθ.",
    "With θ = x/l, F = −(mg/l)x, which is simple harmonic with k = mg/l.",
    "T = 2π√(m/k) = 2π√(l/g).",
    "The period does not depend on the mass of the bob or, for small angles, on the amplitude.",
  ]),
  sub("Mathematics", 4, "JEE Main 2018 and 2022", "Find the sum 1 + 3 + 5 + … + 99.", [
    "This is an arithmetic progression with a = 1 and d = 2.",
    "Number of terms: 99 = 1 + (n − 1) × 2, so n = 50.",
    "Sum = n/2 × (first + last) = 25 × 100.",
    "Sum = 2500, which equals n², the sum of the first n odd numbers.",
  ]),
]);
