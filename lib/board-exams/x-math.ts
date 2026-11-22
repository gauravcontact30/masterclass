import { bank, imp, mcq, pack, solved, unsolved } from "./types";

/* Class 10 Mathematics. Tags: u = UP Board, c = CBSE, i = ICSE. */
export default pack("x-math", [
  bank("Real Numbers", "State the Fundamental Theorem of Arithmetic.", "Every composite number can be written as a product of primes, and this factorisation is unique apart from the order of the factors.", 1, "uc"),
  bank("Real Numbers", "Find the HCF and LCM of 12 and 18, and verify that HCF × LCM equals the product of the numbers.", "12 = 2² × 3 and 18 = 2 × 3². HCF = 2 × 3 = 6, LCM = 2² × 3² = 36. HCF × LCM = 216 = 12 × 18.", 2, "uc"),
  bank("Polynomials", "Write the relation between the zeros and the coefficients of ax² + bx + c.", "Sum of zeros α + β = −b/a and product of zeros αβ = c/a.", 2),
  bank("Quadratic Equations", "What does the discriminant tell you about the roots of ax² + bx + c = 0?", "D = b² − 4ac. D > 0: two distinct real roots. D = 0: two equal real roots. D < 0: no real roots.", 2),
  bank("Arithmetic Progressions", "Write the nth term and the sum of the first n terms of an AP.", "aₙ = a + (n − 1)d and Sₙ = n/2 [2a + (n − 1)d] = n/2 (a + l), where l is the last term.", 2),
  bank("Triangles", "State the Basic Proportionality Theorem (Thales theorem).", "A line drawn parallel to one side of a triangle, cutting the other two sides in distinct points, divides those two sides in the same ratio.", 2),
  bank("Circles", "What can you say about the two tangents drawn to a circle from an external point?", "They are equal in length, and they make equal angles with the line joining the point to the centre.", 2),
  bank("Probability", "A die is thrown once. What is the probability of getting a prime number?", "The primes are 2, 3 and 5, so P = 3/6 = 1/2.", 1),
  bank("Commercial Mathematics", "How is the maturity value of a recurring deposit calculated?", "Interest I = P × n(n + 1)/(2 × 12) × r/100, where P is the monthly deposit and n the number of months. Maturity value = P × n + I.", 2, "i"),
  bank("Matrices", "When can two matrices be multiplied?", "AB is defined only when the number of columns of A equals the number of rows of B. If A is m × n and B is n × p, then AB is m × p.", 2, "i"),
  bank("Trigonometry", "Write the three fundamental trigonometric identities.", "sin²θ + cos²θ = 1, 1 + tan²θ = sec²θ and 1 + cot²θ = cosec²θ.", 2),
  bank("Coordinate Geometry", "State the distance formula and the section formula.", "Distance between (x₁, y₁) and (x₂, y₂) = √[(x₂ − x₁)² + (y₂ − y₁)²]. The point dividing the join internally in the ratio m : n is ((mx₂ + nx₁)/(m + n), (my₂ + ny₁)/(m + n)).", 2),
  bank("Statistics", "Write the empirical relation between mean, median and mode.", "Mode = 3 Median − 2 Mean.", 1),
  bank("Surface Areas and Volumes", "Write the formulas for the volume of a cylinder, a cone and a sphere.", "Cylinder: πr²h. Cone: ⅓πr²h. Sphere: 4⁄3 πr³.", 2),
  imp("Coordinate Geometry", 5, "In what ratio does the point (−1, 6) divide the line segment joining (−3, 10) and (6, −8)?", "2 : 7", [
    "// Let the ratio be k : 1", "x-coordinate: (6k − 3)/(k + 1) = −1",
    "6k − 3 = −k − 1", "7k = 2,  k = 2/7",
    "// Check with the y-coordinate", "(−8k + 10)/(k + 1) = (−16/7 + 10)/(9/7) = 6",
    "∴ The point divides the segment in the ratio 2 : 7",
  ], 3),

  imp("Real Numbers", 5, "Prove that √2 is irrational.", "√2 cannot be written as p/q, so it is irrational.", [
    "// Assume the opposite: √2 is rational, in lowest terms", "√2 = p/q,  HCF(p, q) = 1",
    "// Square both sides", "p² = 2q²",
    "// So 2 divides p², hence 2 divides p. Put p = 2m", "4m² = 2q²  ⇒  q² = 2m²",
    "// So 2 divides q as well", "2 | p  and  2 | q",
    "// This contradicts HCF(p, q) = 1", "∴ √2 is irrational",
  ], 3, "uc"),
  imp("Quadratic Equations", 5, "Solve 2x² − 7x + 3 = 0 using the quadratic formula.", "x = 3 or x = 1/2", [
    "// Compare with ax² + bx + c = 0", "a = 2,  b = −7,  c = 3",
    "// Discriminant", "D = b² − 4ac = 49 − 24 = 25",
    "// Quadratic formula", "x = (−b ± √D) / 2a = (7 ± 5) / 4",
    "x = 12/4 = 3   or   x = 2/4 = 1/2", "∴ x = 3 or x = 1/2",
  ], 3),
  imp("Arithmetic Progressions", 5, "Find the sum of the first 20 terms of the AP 3, 7, 11, …", "S₂₀ = 820", [
    "// First term and common difference", "a = 3,  d = 7 − 3 = 4,  n = 20",
    "// Sum formula", "Sₙ = n/2 [2a + (n − 1)d]",
    "S₂₀ = 20/2 [2(3) + 19(4)]", "S₂₀ = 10 × (6 + 76) = 10 × 82", "∴ S₂₀ = 820",
  ], 3),
  imp("Triangles", 5, "Prove that if a line is drawn parallel to one side of a triangle, it divides the other two sides in the same ratio.", "AD/DB = AE/EC", [
    "// Given: in △ABC, DE ∥ BC with D on AB and E on AC. Join BE and CD; draw EM ⊥ AB and DN ⊥ AC", "ar(ADE) = ½ × AD × EM,   ar(BDE) = ½ × DB × EM",
    "// Ratio of areas with the same height EM", "ar(ADE) / ar(BDE) = AD / DB",
    "// Similarly with the height DN", "ar(ADE) / ar(DEC) = AE / EC",
    "// △BDE and △DEC stand on the same base DE between the same parallels", "ar(BDE) = ar(DEC)",
    "∴ AD/DB = AE/EC",
  ], 5),
  imp("Trigonometry", 5, "Prove that (1 + tan²A) / (1 + cot²A) = tan²A.", "LHS = tan²A = RHS", [
    "// Use the identities 1 + tan²A = sec²A and 1 + cot²A = cosec²A", "LHS = sec²A / cosec²A",
    "// Write in sin and cos", "= (1/cos²A) × (sin²A/1)",
    "= sin²A / cos²A", "∴ LHS = tan²A = RHS",
  ], 3),
  imp("Heights and Distances", 4, "From a point on the ground 30 m from the foot of a tower, the angle of elevation of the top is 30°. Find the height of the tower.", "h = 10√3 m ≈ 17.32 m", [
    "// Let the height be h; the base is 30 m", "tan 30° = h / 30",
    "1/√3 = h / 30", "h = 30/√3 = 10√3",
    "∴ h = 10√3 m ≈ 17.32 m",
  ], 3),
  imp("Circles", 5, "Prove that the lengths of tangents drawn from an external point to a circle are equal.", "PA = PB", [
    "// Given: tangents PA and PB from P to a circle with centre O. Join OA, OB, OP", "∠OAP = ∠OBP = 90°   (radius ⊥ tangent)",
    "// In right triangles OAP and OBP", "OA = OB (radii),   OP = OP (common)",
    "// RHS congruence", "△OAP ≅ △OBP",
    "∴ PA = PB   (CPCT)",
  ], 3),
  imp("Statistics", 4, "Find the mean of the data: classes 0–10, 10–20, 20–30, 30–40, 40–50 with frequencies 5, 8, 15, 16, 6.", "Mean = 27", [
    "// Class marks xᵢ", "x = 5, 15, 25, 35, 45",
    "// Multiply by the frequencies", "Σfᵢxᵢ = 25 + 120 + 375 + 560 + 270 = 1350",
    "Σfᵢ = 5 + 8 + 15 + 16 + 6 = 50", "Mean = Σfᵢxᵢ / Σfᵢ = 1350 / 50", "∴ Mean = 27",
  ], 4),
  imp("Shares and Dividends", 4, "A man invests ₹9,600 in ₹100 shares at ₹120. If the company pays a 15% dividend, find his annual income and the rate of return.", "Income = ₹1,200, return = 12.5%", [
    "// Number of shares bought", "n = 9600 / 120 = 80",
    "// Dividend is paid on the face value", "Income = 80 × (15% of 100) = 80 × 15 = ₹1,200",
    "// Return on the money invested", "Rate = 1200 / 9600 × 100", "∴ Income = ₹1,200, return = 12.5%",
  ], 4, "i"),
  imp("Factor Theorem", 4, "Using the factor theorem, factorise x³ − 7x + 6 completely.", "(x − 1)(x − 2)(x + 3)", [
    "// Try x = 1", "f(1) = 1 − 7 + 6 = 0  ⇒  (x − 1) is a factor",
    "// Divide by (x − 1)", "x³ − 7x + 6 = (x − 1)(x² + x − 6)",
    "// Factorise the quadratic", "x² + x − 6 = (x + 3)(x − 2)", "∴ (x − 1)(x − 2)(x + 3)",
  ], 4, "i"),

  solved("Linear Equations", "Solve: 2x + 3y = 11 and x − 2y = −5.", "x = 1, y = 3", [
    "// From the second equation", "x = 2y − 5",
    "// Substitute in the first", "2(2y − 5) + 3y = 11", "7y = 21  ⇒  y = 3",
    "x = 2(3) − 5 = 1", "∴ x = 1, y = 3",
  ], 3, "uc"),
  solved("Coordinate Geometry", "Find the point that divides the join of A(1, −2) and B(6, 8) in the ratio 2 : 3.", "P(3, 2)", [
    "// Section formula with m : n = 2 : 3", "x = (m x₂ + n x₁) / (m + n) = (2·6 + 3·1) / 5 = 3",
    "y = (m y₂ + n y₁) / (m + n) = (2·8 + 3·(−2)) / 5 = 2", "∴ P(3, 2)",
  ], 3),
  solved("Surface Areas and Volumes", "A solid is a cone standing on a hemisphere, both of radius 7 cm; the cone is 24 cm high. Find the volume. (π = 22/7)", "V ≈ 1950.67 cm³", [
    "// Volume of the cone", "V₁ = ⅓ π r² h = ⅓ × 22/7 × 49 × 24 = 1232 cm³",
    "// Volume of the hemisphere", "V₂ = ⅔ π r³ = ⅔ × 22/7 × 343 = 718.67 cm³",
    "V = V₁ + V₂", "∴ V ≈ 1950.67 cm³",
  ], 4),
  solved("Linear Inequations", "Solve −3 ≤ 2x − 1 < 5, x ∈ R, and describe the solution set.", "−1 ≤ x < 3", [
    "// Add 1 throughout", "−2 ≤ 2x < 6",
    "// Divide by 2", "−1 ≤ x < 3", "∴ Solution set = { x : −1 ≤ x < 3, x ∈ R }",
  ], 3, "i"),

  unsolved("Polynomials", "Find the zeros of x² − 5x + 6 and verify the relation between zeros and coefficients.", "Zeros 2 and 3. Sum = 5 = −b/a, product = 6 = c/a.", "Split the middle term: −5x = −2x − 3x."),
  unsolved("Arithmetic Progressions", "Which term of the AP 21, 18, 15, … is −81?", "The 35th term.", "Use aₙ = a + (n − 1)d with a = 21 and d = −3."),
  unsolved("Trigonometry", "Evaluate 2 tan²45° + cos²30° − sin²60°.", "2", "cos 30° and sin 60° are both √3/2, so those two terms cancel."),
  unsolved("Probability", "Two coins are tossed together. Find the probability of getting at least one head.", "3/4", "List the outcomes HH, HT, TH, TT."),
  unsolved("Mensuration", "Find the area of a sector of a circle of radius 6 cm with angle 60°. (π = 22/7)", "132/7 cm² ≈ 18.86 cm²", "Area of a sector = θ/360 × πr²."),
  unsolved("GST", "A shopkeeper sells an article of marked price ₹5,000 at a 10% discount within the state. If GST is 18%, find the amount the customer pays.", "₹5,310", "Selling price = ₹4,500; add 18% GST on it (CGST 9% + SGST 9%).", 3, "i"),
], [
  mcq("Real Numbers", "The HCF of 96 and 404 is", ["2", "4", "8", "12"], 1, "96 = 2⁵ × 3 and 404 = 2² × 101, so the HCF is 2² = 4.", "uc"),
  mcq("Polynomials", "The number of zeros of a quadratic polynomial is at most", ["1", "2", "3", "0"], 1, "A polynomial of degree n has at most n zeros."),
  mcq("Quadratic Equations", "The roots of x² − 4x + 4 = 0 are", ["real and distinct", "real and equal", "not real", "one real, one not"], 1, "D = 16 − 16 = 0, so the roots are real and equal."),
  mcq("Arithmetic Progressions", "The 10th term of the AP 2, 7, 12, … is", ["45", "47", "52", "50"], 1, "a₁₀ = 2 + 9 × 5 = 47."),
  mcq("Trigonometry", "The value of sin²θ + cos²θ is", ["0", "1", "2", "tan θ"], 1, "It is the basic Pythagorean identity."),
  mcq("Coordinate Geometry", "The distance of the point (3, 4) from the origin is", ["3", "4", "5", "7"], 2, "√(3² + 4²) = √25 = 5."),
  mcq("Circles", "A tangent to a circle meets it in", ["no point", "one point", "two points", "many points"], 1, "A tangent touches the circle at exactly one point."),
  mcq("Probability", "The probability of a sure event is", ["0", "1/2", "1", "cannot be found"], 2, "A sure event always happens, so P = 1."),
  mcq("Statistics", "For a frequency distribution, the empirical relation is", ["Mode = 3 Median − 2 Mean", "Mode = 2 Median − 3 Mean", "Mean = 3 Median − 2 Mode", "Median = 3 Mode − 2 Mean"], 0, "3 Median = Mode + 2 Mean."),
  mcq("Matrices", "If A is of order 2 × 3 and B is of order 3 × 2, the order of AB is", ["3 × 3", "2 × 2", "2 × 3", "3 × 2"], 1, "An m × n matrix times an n × p matrix is m × p.", "i"),
  mcq("Surface Areas and Volumes", "The volume of a sphere of radius r is", ["4πr²", "⅔πr³", "⁴⁄₃πr³", "πr²h"], 2, "V = 4/3 πr³; 4πr² is its surface area."),
], [
  { title: "algebra.formulas", lines: [
    "// Quadratic equation ax² + bx + c = 0", "x = (−b ± √(b² − 4ac)) / 2a", "D = b² − 4ac",
    "// Zeros of ax² + bx + c", "α + β = −b/a,   αβ = c/a",
    "// Arithmetic progression", "aₙ = a + (n − 1)d", "Sₙ = n/2 [2a + (n − 1)d]",
    "// Identities", "(a + b)² = a² + 2ab + b²", "a³ + b³ = (a + b)(a² − ab + b²)",
  ] },
  { title: "trigonometry.formulas", lines: [
    "// Identities", "sin²θ + cos²θ = 1", "1 + tan²θ = sec²θ", "1 + cot²θ = cosec²θ",
    "// Standard values", "sin 30° = 1/2,  sin 45° = 1/√2,  sin 60° = √3/2", "tan 30° = 1/√3,  tan 45° = 1,  tan 60° = √3",
  ] },
  { title: "geometry.formulas", lines: [
    "// Coordinate geometry", "d = √((x₂ − x₁)² + (y₂ − y₁)²)", "P = ((m x₂ + n x₁)/(m + n), (m y₂ + n y₁)/(m + n))",
    "// Mensuration", "Cylinder: V = πr²h,  CSA = 2πrh", "Cone: V = ⅓πr²h,  CSA = πrl,  l = √(r² + h²)", "Sphere: V = ⁴⁄₃πr³,  SA = 4πr²",
    "Sector: A = θ/360 × πr²,  arc = θ/360 × 2πr",
  ] },
]);
