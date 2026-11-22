import { bank, imp, mcq, pack, solved, unsolved } from "./types";

/* Class 10 Physics (the Physics portion of Science for UP Board and CBSE; Science Paper 1 for ICSE). */
export default pack("x-physics", [
  bank("Light: Reflection", "State the laws of reflection of light.", "The angle of incidence equals the angle of reflection, and the incident ray, the reflected ray and the normal at the point of incidence all lie in the same plane.", 2),
  bank("Light: Refraction", "State Snell's law of refraction.", "For a given pair of media and a given colour of light, sin i / sin r is a constant, called the refractive index of the second medium with respect to the first.", 2),
  bank("Light: Refraction", "Define the power of a lens and give its SI unit.", "Power is the reciprocal of the focal length in metres, P = 1/f. Its SI unit is the dioptre (D). A convex lens has positive power, a concave lens negative.", 2),
  bank("Human Eye", "Why does the sky appear blue?", "Molecules of air scatter the shorter (blue) wavelengths of sunlight far more strongly than the longer (red) ones, so scattered blue light reaches the eye from all directions.", 2, "uc"),
  bank("Electricity", "State Ohm's law.", "At constant temperature, the current through a conductor is directly proportional to the potential difference across its ends: V = IR.", 2),
  bank("Electricity", "On what factors does the resistance of a conductor depend?", "Its length (R ∝ l), its area of cross-section (R ∝ 1/A), the material and the temperature. R = ρl/A.", 2),
  bank("Magnetic Effects", "State Fleming's left-hand rule.", "Hold the forefinger, middle finger and thumb of the left hand at right angles. If the forefinger shows the field and the middle finger the current, the thumb shows the force on the conductor.", 2),
  bank("Magnetic Effects", "What is the function of an earth wire?", "It gives leakage current a low-resistance path to the ground, so the metal body of an appliance stays at earth potential and the user does not get a shock.", 2),
  bank("Machines", "Define mechanical advantage and velocity ratio of a machine.", "Mechanical advantage = load / effort. Velocity ratio = distance moved by effort / distance moved by load. Efficiency = MA / VR.", 2, "i"),
  bank("Radioactivity", "What happens to the atomic number and mass number in alpha and beta emission?", "Alpha emission: atomic number falls by 2 and mass number by 4. Beta emission: atomic number rises by 1 and mass number stays the same.", 2, "i"),
  bank("Electricity", "Define electric power. How many joules make one kilowatt-hour?", "Power is the rate at which electrical energy is used: P = VI = I²R = V²/R. 1 kWh = 1000 W × 3600 s = 3.6 × 10⁶ J.", 2),
  bank("Light: Refraction", "Define the absolute refractive index of a medium.", "It is the ratio of the speed of light in vacuum to the speed of light in the medium: n = c/v. It has no unit.", 2),
  bank("Magnetic Effects", "State the right-hand thumb rule.", "Hold a current-carrying straight conductor in the right hand with the thumb along the current. The curled fingers show the direction of the magnetic field lines.", 2),
  bank("Human Eye", "What is myopia? How is it corrected?", "Myopia (short-sightedness): distant objects look blurred because the image forms in front of the retina. It is corrected with a concave lens of suitable power.", 2),
  imp("Electricity", 5, "An electric bulb is rated 100 W, 220 V. Find its resistance and the current it draws.", "R = 484 Ω, I ≈ 0.45 A", [
    "// Resistance from the rating", "R = V²/P = (220)²/100",
    "R = 48400/100 = 484 Ω",
    "// Current at the rated voltage", "I = P/V = 100/220",
    "∴ R = 484 Ω,  I ≈ 0.45 A",
  ], 3),

  imp("Light: Reflection", 5, "An object is placed 30 cm in front of a concave mirror of focal length 20 cm. Find the position and nature of the image.", "v = −60 cm: real, inverted, magnified image 60 cm in front of the mirror", [
    "// Sign convention: distances in front of the mirror are negative", "u = −30 cm,  f = −20 cm",
    "// Mirror formula", "1/v + 1/u = 1/f",
    "1/v = 1/f − 1/u = −1/20 + 1/30 = −1/60", "v = −60 cm",
    "// Magnification", "m = −v/u = −(−60)/(−30) = −2",
    "∴ Real, inverted image, twice the size, 60 cm in front of the mirror",
  ], 3),
  imp("Light: Refraction", 5, "A convex lens of focal length 10 cm forms an image of an object placed 15 cm from it. Find the image distance and magnification.", "v = +30 cm, m = −2", [
    "// Sign convention", "u = −15 cm,  f = +10 cm",
    "// Lens formula", "1/v − 1/u = 1/f",
    "1/v = 1/10 − 1/15 = 1/30", "v = +30 cm",
    "m = v/u = 30/(−15) = −2", "∴ Real, inverted image 30 cm behind the lens, twice the size",
  ], 3),
  imp("Electricity", 5, "Derive the expression for the equivalent resistance of three resistors connected in series.", "Rₛ = R₁ + R₂ + R₃", [
    "// The same current I flows through each resistor", "V = V₁ + V₂ + V₃",
    "// Ohm's law for each resistor", "V₁ = IR₁,  V₂ = IR₂,  V₃ = IR₃",
    "// For the equivalent resistor", "V = IRₛ",
    "IRₛ = IR₁ + IR₂ + IR₃", "∴ Rₛ = R₁ + R₂ + R₃",
  ], 3),
  imp("Electricity", 5, "Three resistors of 2 Ω, 3 Ω and 6 Ω are connected in parallel to a 6 V battery. Find the equivalent resistance and the total current.", "R = 1 Ω, I = 6 A", [
    "// Parallel combination", "1/R = 1/2 + 1/3 + 1/6",
    "1/R = (3 + 2 + 1)/6 = 1", "R = 1 Ω",
    "// Ohm's law", "I = V/R = 6/1", "∴ R = 1 Ω,  I = 6 A",
  ], 3),
  imp("Electricity", 4, "An electric iron draws 5 A from a 220 V supply. Find its power and the energy it uses in 2 hours.", "P = 1100 W, E = 2.2 kWh", [
    "// Power", "P = VI = 220 × 5 = 1100 W = 1.1 kW",
    "// Energy", "E = P × t = 1.1 kW × 2 h", "∴ P = 1100 W,  E = 2.2 kWh (2.2 units)",
  ], 3),
  imp("Human Eye", 4, "A person cannot see objects beyond 2 m clearly. Name the defect and find the power of the correcting lens.", "Myopia; P = −0.5 D (concave lens)", [
    "// The far point is 2 m, so the lens must form the image of a distant object there", "u = −∞,  v = −2 m",
    "// Lens formula", "1/f = 1/v − 1/u = −1/2 − 0", "f = −2 m",
    "P = 1/f = −0.5 D", "∴ Myopia, corrected by a concave lens of power −0.5 D",
  ], 3, "uc"),
  imp("Magnetic Effects", 4, "Describe the pattern of the magnetic field around a straight current-carrying conductor and state the rule that gives its direction.", "Concentric circles around the wire; direction by the right-hand thumb rule.", [
    "// Field lines", "Concentric circles centred on the wire, in a plane ⟂ to it",
    "// Strength", "B ∝ I,   B ∝ 1/r",
    "// Right-hand thumb rule", "Thumb → current,  curled fingers → field direction",
    "∴ Reversing the current reverses the field direction",
  ], 3),
  imp("Calorimetry", 4, "How much heat is needed to change 100 g of ice at 0 °C into water at 20 °C? (L = 336 J/g, c = 4.2 J/g°C)", "Q = 42,000 J", [
    "// Heat to melt the ice", "Q₁ = mL = 100 × 336 = 33,600 J",
    "// Heat to warm the water from 0 °C to 20 °C", "Q₂ = mcΔT = 100 × 4.2 × 20 = 8,400 J",
    "Q = Q₁ + Q₂", "∴ Q = 42,000 J",
  ], 4, "i"),

  solved("Light: Refraction", "Light travels from air into glass of refractive index 1.5. Find the speed of light in the glass. (c = 3 × 10⁸ m/s)", "v = 2 × 10⁸ m/s", [
    "// Refractive index", "n = c / v", "v = c / n = (3 × 10⁸) / 1.5", "∴ v = 2 × 10⁸ m/s",
  ], 2),
  solved("Electricity", "A wire of resistance 10 Ω is stretched to double its length. Find its new resistance.", "R′ = 40 Ω", [
    "// Volume stays the same, so doubling the length halves the area", "l′ = 2l,  A′ = A/2",
    "R′ = ρ l′/A′ = ρ (2l)/(A/2) = 4 ρl/A", "R′ = 4R = 4 × 10", "∴ R′ = 40 Ω",
  ], 3),
  solved("Electricity", "How much heat is produced in 10 s by a current of 2 A in a 5 Ω resistor?", "H = 200 J", [
    "// Joule's law of heating", "H = I²Rt", "H = 2² × 5 × 10", "∴ H = 200 J",
  ], 2),
  solved("Work, Energy and Power", "A pulley system has a velocity ratio of 4 and lifts a load of 300 N with an effort of 100 N. Find its mechanical advantage and efficiency.", "MA = 3, efficiency = 75%", [
    "// Mechanical advantage", "MA = load / effort = 300 / 100 = 3",
    "// Efficiency", "η = MA / VR = 3 / 4", "∴ MA = 3,  η = 75%",
  ], 3, "i"),

  unsolved("Light: Reflection", "An object is placed 10 cm in front of a convex mirror of focal length 15 cm. Find the position of the image.", "v = +6 cm: virtual, erect, diminished image behind the mirror.", "Use 1/v + 1/u = 1/f with u = −10 cm and f = +15 cm."),
  unsolved("Light: Refraction", "Two lenses of power +2.5 D and −1.5 D are placed in contact. Find the power and focal length of the combination.", "P = +1 D, f = 1 m (100 cm).", "Powers of lenses in contact add."),
  unsolved("Electricity", "A bulb is rated 100 W, 220 V. Find the resistance of its filament.", "R = 484 Ω", "Use P = V²/R."),
  unsolved("Electricity", "How many 40 W lamps can safely run on a 220 V line with a 5 A fuse?", "27 lamps", "Maximum power = 220 × 5 = 1100 W; divide by 40 and round down."),
  unsolved("Sound", "A sound wave has frequency 500 Hz and wavelength 0.68 m. Find its speed.", "v = 340 m/s", "Use v = fλ.", 2, "i"),
], [
  mcq("Light: Reflection", "The focal length of a spherical mirror of radius of curvature 30 cm is", ["10 cm", "15 cm", "30 cm", "60 cm"], 1, "f = R/2 = 15 cm."),
  mcq("Light: Reflection", "A mirror that always forms a virtual, erect and diminished image is", ["plane", "concave", "convex", "parabolic"], 2, "A convex mirror does so for every object position."),
  mcq("Light: Refraction", "The SI unit of the power of a lens is", ["metre", "dioptre", "watt", "joule"], 1, "1 D = 1 m⁻¹."),
  mcq("Electricity", "The SI unit of resistivity is", ["Ω", "Ω m", "Ω/m", "Ω m²"], 1, "ρ = RA/l, so the unit is Ω m."),
  mcq("Electricity", "1 kWh is equal to", ["3.6 × 10³ J", "3.6 × 10⁵ J", "3.6 × 10⁶ J", "3.6 × 10⁸ J"], 2, "1000 W × 3600 s = 3.6 × 10⁶ J."),
  mcq("Electricity", "In a series circuit, the quantity that stays the same through every resistor is", ["voltage", "current", "power", "resistance"], 1, "There is only one path, so the current is the same."),
  mcq("Magnetic Effects", "The device that converts electrical energy into mechanical energy is the", ["generator", "electric motor", "transformer", "galvanometer"], 1, "A motor uses the force on a current-carrying coil in a magnetic field."),
  mcq("Magnetic Effects", "The frequency of the AC mains supply in India is", ["25 Hz", "50 Hz", "60 Hz", "100 Hz"], 1, "India uses 220 V, 50 Hz."),
  mcq("Human Eye", "The part of the eye that controls the amount of light entering it is the", ["retina", "cornea", "iris", "ciliary muscle"], 2, "The iris adjusts the size of the pupil.", "uc"),
  mcq("Radioactivity", "The radiation with the greatest penetrating power is", ["alpha", "beta", "gamma", "all equal"], 2, "Gamma rays are the most penetrating and the least ionising.", "i"),
  mcq("Light: Refraction", "When light passes from a rarer to a denser medium, it", ["bends away from the normal", "bends towards the normal", "does not bend", "is totally reflected"], 1, "Its speed falls, so the ray bends towards the normal."),
], [
  { title: "light.formulas", lines: [
    "// Mirror", "1/v + 1/u = 1/f,   f = R/2", "m = −v/u = h′/h",
    "// Lens", "1/v − 1/u = 1/f", "m = v/u,   P = 1/f (in metres)",
    "// Refraction", "n = sin i / sin r = c / v",
  ] },
  { title: "electricity.formulas", lines: [
    "// Basics", "I = Q/t,   V = W/Q,   V = IR", "R = ρl/A",
    "// Combinations", "Series:   R = R₁ + R₂ + R₃", "Parallel: 1/R = 1/R₁ + 1/R₂ + 1/R₃",
    "// Power and heating", "P = VI = I²R = V²/R", "H = I²Rt,   1 kWh = 3.6 × 10⁶ J",
  ] },
]);
