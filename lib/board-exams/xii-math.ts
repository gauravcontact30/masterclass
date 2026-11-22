import { bank, imp, mcq, pack, solved, unsolved } from "./types";

/* Class 12 Mathematics. Tags: u = UP Board, c = CBSE, i = ISC. */
export default pack("xii-math", [
  bank("Relations and Functions", "When is a relation called an equivalence relation?", "When it is reflexive (a R a), symmetric (a R b implies b R a) and transitive (a R b and b R c imply a R c).", 2),
  bank("Relations and Functions", "Define a one-one and an onto function.", "f is one-one if f(x₁) = f(x₂) implies x₁ = x₂. f is onto if every element of the codomain is the image of some element of the domain. A function that is both is a bijection.", 2),
  bank("Inverse Trigonometric Functions", "Write the principal value branch of sin⁻¹x, cos⁻¹x and tan⁻¹x.", "sin⁻¹x: [−π/2, π/2]. cos⁻¹x: [0, π]. tan⁻¹x: (−π/2, π/2).", 2),
  bank("Matrices", "Define symmetric and skew-symmetric matrices.", "A square matrix A is symmetric if Aᵀ = A and skew-symmetric if Aᵀ = −A. Every diagonal element of a skew-symmetric matrix is zero.", 2),
  bank("Determinants", "When does a square matrix have an inverse?", "Only when it is non-singular, that is |A| ≠ 0. Then A⁻¹ = adj A / |A|.", 2),
  bank("Continuity and Differentiability", "State the relation between continuity and differentiability.", "Every differentiable function is continuous, but a continuous function need not be differentiable. Example: |x| is continuous at 0 but not differentiable there.", 2),
  bank("Integrals", "State the formula for integration by parts.", "∫u v dx = u ∫v dx − ∫(u′ ∫v dx) dx, choosing u by the ILATE order (inverse, logarithmic, algebraic, trigonometric, exponential).", 2),
  bank("Vectors", "Give the condition for two non-zero vectors to be perpendicular and to be parallel.", "Perpendicular: a · b = 0. Parallel: a × b = 0, that is a = λb for some scalar λ.", 2),
  bank("Probability", "State Bayes' theorem.", "If E₁, …, Eₙ partition the sample space and A is any event with P(A) > 0, then P(Eᵢ | A) = P(Eᵢ) P(A | Eᵢ) / Σ P(Eⱼ) P(A | Eⱼ).", 2),
  bank("Application of Calculus", "Define marginal cost and marginal revenue.", "Marginal cost is the rate of change of total cost with output, MC = dC/dx. Marginal revenue is MR = dR/dx.", 2, "i"),
  bank("Integrals", "State the formula for integration by parts.", "∫u·v dx = u∫v dx − ∫(du/dx · ∫v dx) dx. Choose u by the ILATE order: inverse, logarithmic, algebraic, trigonometric, exponential.", 2),
  bank("Differential Equations", "Define the order and the degree of a differential equation.", "Order is the order of the highest derivative in the equation. Degree is the power of that highest derivative when the equation is a polynomial in its derivatives.", 2),
  bank("Three-Dimensional Geometry", "What relation do the direction cosines of a line satisfy?", "If l, m and n are the direction cosines, then l² + m² + n² = 1.", 1),
  bank("Linear Programming", "What is the feasible region of a linear programming problem?", "The common region determined by all the constraints, including the non-negativity constraints. The optimum value of the objective function occurs at a corner point of this region.", 2),
  imp("Application of Integrals", 5, "Find the area of the region bounded by the curve y = x², the x-axis and the lines x = 0 and x = 3.", "9 square units", [
    "// Area under the curve", "A = ∫₀³ x² dx",
    "A = [x³/3] from 0 to 3",
    "A = 27/3 − 0 = 9",
    "∴ Area = 9 square units",
  ], 4),

  imp("Matrices", 5, "Find the inverse of A = [[2, 3], [1, 2]] and verify that A A⁻¹ = I.", "A⁻¹ = [[2, −3], [−1, 2]]", [
    "// Determinant", "|A| = (2)(2) − (3)(1) = 1 ≠ 0",
    "// Adjoint: swap the diagonal, change the sign of the others", "adj A = [[2, −3], [−1, 2]]",
    "A⁻¹ = adj A / |A| = [[2, −3], [−1, 2]]",
    "// Verify", "A A⁻¹ = [[4 − 3, −6 + 6], [2 − 2, −3 + 4]] = [[1, 0], [0, 1]]", "∴ A⁻¹ = [[2, −3], [−1, 2]]",
  ], 4),
  imp("Continuity and Differentiability", 5, "Differentiate y = xˣ with respect to x.", "dy/dx = xˣ (1 + log x)", [
    "// Take logarithms on both sides", "log y = x log x",
    "// Differentiate with respect to x", "(1/y) dy/dx = x · (1/x) + log x · 1",
    "(1/y) dy/dx = 1 + log x", "∴ dy/dx = xˣ (1 + log x)",
  ], 3),
  imp("Application of Derivatives", 5, "Find the local maximum and minimum values of f(x) = 2x³ − 3x² − 12x + 5.", "Local maximum 12 at x = −1; local minimum −15 at x = 2", [
    "// First derivative", "f′(x) = 6x² − 6x − 12 = 6(x − 2)(x + 1)",
    "// Critical points", "f′(x) = 0  ⇒  x = −1, 2",
    "// Second derivative test", "f″(x) = 12x − 6",
    "f″(−1) = −18 < 0  ⇒  maximum,   f(−1) = −2 − 3 + 12 + 5 = 12",
    "f″(2) = 18 > 0  ⇒  minimum,   f(2) = 16 − 12 − 24 + 5 = −15",
    "∴ Maximum value 12, minimum value −15",
  ], 5),
  imp("Integrals", 5, "Evaluate ∫ x eˣ dx.", "eˣ (x − 1) + C", [
    "// Integration by parts with u = x and v = eˣ", "∫ x eˣ dx = x ∫eˣ dx − ∫(1 · eˣ) dx",
    "= x eˣ − eˣ + C", "∴ ∫ x eˣ dx = eˣ (x − 1) + C",
  ], 3),
  imp("Integrals", 5, "Evaluate I = ∫₀^(π/2) sin x / (sin x + cos x) dx.", "I = π/4", [
    "// Use the property ∫₀ᵃ f(x) dx = ∫₀ᵃ f(a − x) dx", "I = ∫₀^(π/2) cos x / (cos x + sin x) dx",
    "// Add the two forms of I", "2I = ∫₀^(π/2) (sin x + cos x)/(sin x + cos x) dx = ∫₀^(π/2) 1 dx",
    "2I = π/2", "∴ I = π/4",
  ], 4),
  imp("Differential Equations", 5, "Solve the differential equation dy/dx + y = e⁻ˣ.", "y = (x + C) e⁻ˣ", [
    "// Linear form dy/dx + Py = Q with P = 1, Q = e⁻ˣ", "IF = e^(∫P dx) = eˣ",
    "// Solution: y × IF = ∫(Q × IF) dx + C", "y eˣ = ∫ e⁻ˣ eˣ dx + C = ∫ 1 dx + C",
    "y eˣ = x + C", "∴ y = (x + C) e⁻ˣ",
  ], 4),
  imp("Probability", 5, "Bag I holds 3 red and 4 black balls; Bag II holds 5 red and 6 black. A ball drawn from one bag chosen at random is red. Find the probability that it came from Bag II.", "35/68", [
    "// Events", "P(E₁) = P(E₂) = 1/2",
    "P(R | E₁) = 3/7,   P(R | E₂) = 5/11",
    "// Bayes' theorem", "P(E₂ | R) = (1/2 · 5/11) / (1/2 · 3/7 + 1/2 · 5/11)",
    "= (5/11) / (68/77) = (5/11) × (77/68)", "∴ P(E₂ | R) = 35/68",
  ], 5),
  imp("Linear Programming", 4, "Maximise Z = 3x + 4y subject to x + y ≤ 4, x ≥ 0, y ≥ 0.", "Maximum Z = 16 at (0, 4)", [
    "// Corner points of the feasible region", "O(0, 0),  A(4, 0),  B(0, 4)",
    "// Value of Z at each corner", "Z(O) = 0,   Z(A) = 12,   Z(B) = 16",
    "∴ Maximum Z = 16 at (0, 4)",
  ], 4),
  imp("Vectors", 4, "Find the angle between a = î + 2ĵ + 3k̂ and b = 3î − 2ĵ + k̂.", "θ = cos⁻¹(1/7)", [
    "// Dot product", "a · b = (1)(3) + (2)(−2) + (3)(1) = 2",
    "// Magnitudes", "|a| = √(1 + 4 + 9) = √14,   |b| = √(9 + 4 + 1) = √14",
    "cos θ = a · b / (|a||b|) = 2/14 = 1/7", "∴ θ = cos⁻¹(1/7)",
  ], 3),
  imp("Three-Dimensional Geometry", 4, "Find the distance of the point (2, 3, −5) from the plane x + 2y − 2z = 9.", "3 units", [
    "// Distance of (x₁, y₁, z₁) from ax + by + cz = d", "D = |ax₁ + by₁ + cz₁ − d| / √(a² + b² + c²)",
    "D = |2 + 6 + 10 − 9| / √(1 + 4 + 4)", "D = 9 / 3", "∴ D = 3 units",
  ], 3, "i"),

  solved("Inverse Trigonometric Functions", "Find the value of tan⁻¹(1) + cos⁻¹(−1/2) + sin⁻¹(−1/2).", "3π/4", [
    "// Principal values", "tan⁻¹(1) = π/4,   cos⁻¹(−1/2) = 2π/3,   sin⁻¹(−1/2) = −π/6",
    "Sum = π/4 + 2π/3 − π/6 = (3π + 8π − 2π)/12", "∴ Sum = 9π/12 = 3π/4",
  ], 3),
  solved("Determinants", "Find the area of the triangle with vertices (1, 0), (6, 0) and (4, 3) using determinants.", "15/2 square units", [
    "// Area = ½ |x₁(y₂ − y₃) + x₂(y₃ − y₁) + x₃(y₁ − y₂)|", "Area = ½ |1(0 − 3) + 6(3 − 0) + 4(0 − 0)|",
    "= ½ |−3 + 18|", "∴ Area = 15/2 square units",
  ], 3),
  solved("Continuity and Differentiability", "Find k so that f(x) = kx + 1 for x ≤ 5 and f(x) = 3x − 5 for x > 5 is continuous at x = 5.", "k = 9/5", [
    "// Left-hand limit equals f(5)", "LHL = 5k + 1",
    "// Right-hand limit", "RHL = 3(5) − 5 = 10",
    "5k + 1 = 10", "∴ k = 9/5",
  ], 3),
  solved("Application of Integrals", "Find the area bounded by the parabola y² = 4x and the line x = 1.", "8/3 square units", [
    "// The region is symmetric about the x-axis; y = 2√x on the upper half", "A = 2 ∫₀¹ 2√x dx",
    "= 4 × [ (2/3) x^(3/2) ]₀¹", "∴ A = 8/3 square units",
  ], 4),
  solved("Application of Calculus", "The total cost of producing x units is C(x) = 0.005x³ − 0.02x² + 30x + 5000. Find the marginal cost when 3 units are produced.", "MC = ₹30.015", [
    "// Marginal cost", "MC = dC/dx = 0.015x² − 0.04x + 30",
    "MC(3) = 0.015(9) − 0.04(3) + 30 = 0.135 − 0.12 + 30", "∴ MC = ₹30.015",
  ], 3, "i"),

  unsolved("Relations and Functions", "Show that f : R → R given by f(x) = 2x + 3 is one-one and onto.", "One-one: 2x₁ + 3 = 2x₂ + 3 gives x₁ = x₂. Onto: for any y, x = (y − 3)/2 is real and f(x) = y.", "Check the two definitions directly."),
  unsolved("Matrices", "If A = [[1, 2], [3, 4]], find A + Aᵀ and state what kind of matrix it is.", "A + Aᵀ = [[2, 5], [5, 8]], a symmetric matrix.", "Transpose A and add entry by entry."),
  unsolved("Continuity and Differentiability", "Differentiate sin(x²) with respect to x.", "2x cos(x²)", "Use the chain rule."),
  unsolved("Integrals", "Evaluate ∫ 1/(x² + 4) dx.", "½ tan⁻¹(x/2) + C", "Use ∫ dx/(x² + a²) = (1/a) tan⁻¹(x/a) with a = 2."),
  unsolved("Differential Equations", "Find the order and degree of (d²y/dx²)³ + (dy/dx)² + y = 0.", "Order 2, degree 3", "The order is that of the highest derivative; the degree is its power."),
  unsolved("Probability", "A die is thrown twice. Find the probability that the sum is 8, given that the first throw shows 3.", "1/6", "With a 3 first, only a 5 on the second throw gives a sum of 8."),
], [
  mcq("Relations and Functions", "The relation R = {(1, 1), (2, 2), (3, 3)} on the set {1, 2, 3} is", ["reflexive only", "symmetric only", "an equivalence relation", "none of these"], 2, "The identity relation is reflexive, symmetric and transitive."),
  mcq("Inverse Trigonometric Functions", "The principal value of cos⁻¹(−1/2) is", ["π/3", "2π/3", "−π/3", "4π/3"], 1, "The range of cos⁻¹ is [0, π] and cos(2π/3) = −1/2."),
  mcq("Matrices", "If A is a 3 × 3 matrix with |A| = 4, then |2A| is", ["8", "16", "32", "64"], 2, "|kA| = kⁿ|A| = 2³ × 4 = 32."),
  mcq("Determinants", "If A is a square matrix of order 3 and |A| = 5, then |adj A| is", ["5", "25", "125", "15"], 1, "|adj A| = |A|ⁿ⁻¹ = 5² = 25."),
  mcq("Continuity and Differentiability", "The derivative of log(sin x) is", ["tan x", "cot x", "−cot x", "sec x"], 1, "(1/sin x) × cos x = cot x."),
  mcq("Application of Derivatives", "The function f(x) = x² − 4x + 6 is increasing on", ["(−∞, 2)", "(2, ∞)", "(−∞, ∞)", "(0, 2)"], 1, "f′(x) = 2x − 4 > 0 when x > 2."),
  mcq("Integrals", "∫ sec²x dx equals", ["tan x + C", "sec x + C", "cot x + C", "sec x tan x + C"], 0, "The derivative of tan x is sec²x."),
  mcq("Integrals", "The value of ∫₋₁¹ x³ dx is", ["2", "1/2", "0", "1/4"], 2, "x³ is an odd function, so its integral over [−a, a] is zero."),
  mcq("Vectors", "If a · b = 0 for non-zero vectors a and b, the vectors are", ["parallel", "perpendicular", "equal", "collinear"], 1, "cos θ = 0 gives θ = 90°."),
  mcq("Probability", "If A and B are independent events with P(A) = 0.3 and P(B) = 0.4, then P(A ∩ B) is", ["0.7", "0.12", "0.1", "0.58"], 1, "For independent events P(A ∩ B) = P(A) P(B)."),
  mcq("Differential Equations", "The integrating factor of dy/dx + y/x = x² is", ["x", "1/x", "eˣ", "log x"], 0, "IF = e^(∫dx/x) = e^(log x) = x."),
], [
  { title: "calculus.formulas", lines: [
    "// Derivatives", "d/dx (xⁿ) = n xⁿ⁻¹", "d/dx (sin x) = cos x,   d/dx (cos x) = −sin x", "d/dx (eˣ) = eˣ,   d/dx (log x) = 1/x", "d/dx (uv) = u v′ + v u′",
    "// Integrals", "∫ xⁿ dx = xⁿ⁺¹/(n + 1) + C", "∫ dx/(x² + a²) = (1/a) tan⁻¹(x/a) + C", "∫ dx/√(a² − x²) = sin⁻¹(x/a) + C", "∫ u v dx = u ∫v dx − ∫(u′ ∫v dx) dx",
    "// Definite integral property", "∫₀ᵃ f(x) dx = ∫₀ᵃ f(a − x) dx",
  ] },
  { title: "algebra.formulas", lines: [
    "// Matrices and determinants", "A⁻¹ = adj A / |A|,   |A| ≠ 0", "|kA| = kⁿ |A|,   |adj A| = |A|ⁿ⁻¹", "(AB)⁻¹ = B⁻¹ A⁻¹,   (AB)ᵀ = Bᵀ Aᵀ",
    "// Linear differential equation", "dy/dx + Py = Q,   IF = e^(∫P dx)", "y × IF = ∫(Q × IF) dx + C",
  ] },
  { title: "vectors-probability.formulas", lines: [
    "// Vectors", "a · b = |a||b| cos θ", "|a × b| = |a||b| sin θ", "Projection of a on b = a · b / |b|",
    "// Probability", "P(A | B) = P(A ∩ B) / P(B)", "P(Eᵢ | A) = P(Eᵢ) P(A | Eᵢ) / Σ P(Eⱼ) P(A | Eⱼ)", "Binomial: P(X = r) = ⁿCᵣ pʳ qⁿ⁻ʳ",
  ] },
]);
