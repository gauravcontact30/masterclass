import { quick } from "@/lib/quick-qa";

/* Class 12 Mathematics: quick questions with short answers. */
export default quick("xii-math", `
# Relations and Functions
What is a relation from A to B? | A subset of the Cartesian product A × B.
When is a relation reflexive? | When (a, a) belongs to R for every a in the set.
When is a relation symmetric? | When (a, b) in R implies (b, a) in R.
When is a relation transitive? | When (a, b) and (b, c) in R imply (a, c) in R.
What is an equivalence relation? | A relation that is reflexive, symmetric and transitive.
What is a one-one (injective) function? | A function in which different elements have different images.
What is an onto (surjective) function? | A function whose range equals its codomain.
What is a bijective function? | A function that is both one-one and onto.
When is a function invertible? | When it is bijective.
What is the composition gof(x)? | g(f(x)).
How many relations are there on a set with n elements? | 2 raised to the power n².
What is the identity function? | f(x) = x for every x.
Is f(x) = x² from R to R one-one? | No, since f(1) = f(−1).
What is a binary operation on a set A? | A function from A × A to A.
What is the number of bijections on a set of n elements? | n!.
What is an equivalence class? | The set of all elements related to a given element under an equivalence relation.
What is the domain of a function? | The set of all inputs for which it is defined.
What is the range of f(x) = |x|? | All non-negative real numbers.

# Inverse Trigonometric Functions
What is the principal value branch of sin⁻¹x? | [−π/2, π/2].
What is the principal value branch of cos⁻¹x? | [0, π].
What is the principal value branch of tan⁻¹x? | (−π/2, π/2).
What is the domain of sin⁻¹x? | [−1, 1].
What is sin⁻¹x + cos⁻¹x? | π/2.
What is tan⁻¹x + cot⁻¹x? | π/2.
What is the value of sin⁻¹(1/2)? | π/6.
What is the value of cos⁻¹(1/2)? | π/3.
What is the value of tan⁻¹(1)? | π/4.
What is sin⁻¹(−x)? | −sin⁻¹x.
What is cos⁻¹(−x)? | π − cos⁻¹x.
What is the value of tan⁻¹(√3)? | π/3.
What is the value of cos⁻¹(−1)? | π.
What is 2 tan⁻¹x in terms of sin⁻¹? | sin⁻¹[2x/(1 + x²)], for |x| ≤ 1.
What is tan⁻¹x + tan⁻¹y? | tan⁻¹[(x + y)/(1 − xy)], for xy < 1.
What is the value of sin⁻¹(sin 2π/3)? | π/3.

# Matrices
What is a matrix? | A rectangular arrangement of numbers in rows and columns.
What is the order of a matrix? | Number of rows × number of columns.
What is a square matrix? | A matrix with equal numbers of rows and columns.
What is a diagonal matrix? | A square matrix in which all non-diagonal elements are zero.
What is a scalar matrix? | A diagonal matrix with all diagonal elements equal.
What is an identity matrix? | A square matrix with 1 on the diagonal and 0 elsewhere.
When can two matrices be added? | When they have the same order.
When is the product AB defined? | When the number of columns of A equals the number of rows of B.
Is matrix multiplication commutative? | Not in general: AB need not equal BA.
What is the transpose of a matrix? | The matrix obtained by interchanging rows and columns.
What is a symmetric matrix? | A matrix with A′ = A.
What is a skew-symmetric matrix? | A matrix with A′ = −A.
What are the diagonal elements of a skew-symmetric matrix? | All zero.
What is (AB)′? | B′A′.
How can any square matrix be split? | As ½(A + A′) + ½(A − A′): a symmetric part plus a skew-symmetric part.
What is (AB)⁻¹? | B⁻¹A⁻¹.
How many elements does a 3 × 4 matrix have? | 12.
What is a null matrix? | A matrix in which every element is zero.
What is a row matrix? | A matrix with only one row.
What is (A′)′? | A.

# Determinants
What is the determinant of [[a, b], [c, d]]? | ad − bc.
What is a singular matrix? | A square matrix whose determinant is zero.
When does a matrix have an inverse? | When its determinant is not zero.
What is the formula for the inverse of a matrix? | A⁻¹ = adj A / |A|.
What is |AB|? | |A| × |B|.
What is |kA| for an n × n matrix? | kⁿ|A|.
What is |A′|? | |A|.
What is the minor of an element? | The determinant left after deleting its row and column.
What is the cofactor of an element aᵢⱼ? | (−1) raised to (i + j) times its minor.
What is the adjoint of a matrix? | The transpose of its cofactor matrix.
What is A(adj A)? | |A| I.
What is |adj A| for an n × n matrix? | |A| raised to the power n − 1.
What happens to a determinant if two rows are interchanged? | Its sign changes.
What is the value of a determinant with two identical rows? | Zero.
Write the area of a triangle using a determinant. | ½ |x₁(y₂ − y₃) + x₂(y₃ − y₁) + x₃(y₁ − y₂)|.
How is the system AX = B solved? | X = A⁻¹B, when |A| ≠ 0.
When is the system AX = B inconsistent? | When |A| = 0 and (adj A)B ≠ 0.
What is |A⁻¹|? | 1/|A|.
What is the determinant of an identity matrix? | 1.

# Continuity and Differentiability
When is f continuous at x = a? | When the left-hand limit, the right-hand limit and f(a) are all equal.
Is every differentiable function continuous? | Yes, but the converse is not true.
Give a function that is continuous but not differentiable at 0. | f(x) = |x|.
What is the derivative of xⁿ? | nxⁿ⁻¹.
What is the derivative of sin x? | cos x.
What is the derivative of cos x? | −sin x.
What is the derivative of tan x? | sec²x.
What is the derivative of eˣ? | eˣ.
What is the derivative of log x? | 1/x.
What is the derivative of aˣ? | aˣ log a.
What is the derivative of sin⁻¹x? | 1/√(1 − x²).
What is the derivative of tan⁻¹x? | 1/(1 + x²).
State the product rule. | (uv)′ = u′v + uv′.
State the quotient rule. | (u/v)′ = (u′v − uv′)/v².
State the chain rule. | dy/dx = (dy/du) × (du/dx).
What is the derivative of sec x? | sec x tan x.
What is the derivative of cot x? | −cosec²x.
State Rolle's theorem. | If f is continuous on [a, b], differentiable on (a, b) and f(a) = f(b), then f′(c) = 0 for some c in (a, b).
State the Mean Value Theorem. | There is a c in (a, b) with f′(c) = [f(b) − f(a)]/(b − a).
When is logarithmic differentiation used? | For functions of the form f(x) raised to g(x), or long products and quotients.
What is the derivative of a constant? | Zero.
How is dy/dx found for parametric equations? | dy/dx = (dy/dt)/(dx/dt).
What is the second derivative? | The derivative of the first derivative, d²y/dx².

# Applications of Derivatives
What does dy/dx represent geometrically? | The slope of the tangent to the curve.
When is a function increasing on an interval? | When f′(x) > 0 there.
When is a function decreasing on an interval? | When f′(x) < 0 there.
What is a critical point? | A point where f′(x) = 0 or f′ does not exist.
State the second derivative test for a maximum. | f′(c) = 0 and f″(c) < 0.
State the second derivative test for a minimum. | f′(c) = 0 and f″(c) > 0.
What is the slope of the normal to a curve? | −1/(dy/dx).
What is the rate of change of the area of a circle with respect to its radius? | 2πr.
What is a point of inflection? | A point where the curve changes concavity.
What is the equation of the tangent at (x₁, y₁)? | y − y₁ = m(x − x₁), where m is dy/dx at the point.
Write the formula for approximation using differentials. | Δy ≈ (dy/dx) Δx.
What is marginal cost? | The rate of change of total cost with respect to output.
Where can the absolute maximum on a closed interval occur? | At a critical point or at an end point.

# Integrals
What is integration? | The reverse process of differentiation.
What is ∫xⁿ dx? | xⁿ⁺¹/(n + 1) + C, for n ≠ −1.
What is ∫(1/x) dx? | log |x| + C.
What is ∫eˣ dx? | eˣ + C.
What is ∫sin x dx? | −cos x + C.
What is ∫cos x dx? | sin x + C.
What is ∫sec²x dx? | tan x + C.
What is ∫tan x dx? | log |sec x| + C.
What is ∫cot x dx? | log |sin x| + C.
What is ∫sec x dx? | log |sec x + tan x| + C.
What is ∫dx/(1 + x²)? | tan⁻¹x + C.
What is ∫dx/√(1 − x²)? | sin⁻¹x + C.
What is ∫dx/(x² − a²)? | (1/2a) log |(x − a)/(x + a)| + C.
What is ∫dx/(a² + x²)? | (1/a) tan⁻¹(x/a) + C.
Write the formula for integration by parts. | ∫uv dx = u∫v dx − ∫(u′∫v dx) dx.
What is the ILATE rule? | Order for choosing the first function: inverse, logarithmic, algebraic, trigonometric, exponential.
What is ∫eˣ[f(x) + f′(x)] dx? | eˣf(x) + C.
State the Fundamental Theorem of Calculus. | ∫ from a to b of f(x) dx = F(b) − F(a), where F′ = f.
What is ∫ from a to a of f(x) dx? | Zero.
What is ∫ from −a to a of an odd function? | Zero.
What is ∫ from −a to a of an even function? | 2∫ from 0 to a of f(x) dx.
State the property ∫ from 0 to a of f(x) dx. | It equals ∫ from 0 to a of f(a − x) dx.
What is ∫log x dx? | x log x − x + C.
What is ∫aˣ dx? | aˣ/log a + C.
When are partial fractions used? | To integrate rational functions whose denominator can be factorised.
What is ∫cosec²x dx? | −cot x + C.

# Applications of Integrals
How is the area under y = f(x) from a to b found? | ∫ from a to b of y dx.
How is the area between two curves found? | ∫ of (upper curve − lower curve) dx between the points of intersection.
What is the area of a circle of radius a by integration? | πa².
What is the area enclosed by the ellipse x²/a² + y²/b² = 1? | πab.
What is the area bounded by y = x, the x-axis and x = 2? | 2 square units.
Can an area be negative? | No; take the absolute value when the curve lies below the axis.

# Differential Equations
What is a differential equation? | An equation involving derivatives of a dependent variable.
What is the order of a differential equation? | The order of the highest derivative in it.
What is the degree of a differential equation? | The power of the highest-order derivative when the equation is polynomial in derivatives.
How many arbitrary constants does the general solution of an nth-order equation have? | n.
What is a particular solution? | A solution obtained by giving values to the arbitrary constants.
How is a variable-separable equation solved? | Separate the variables and integrate both sides.
What substitution solves a homogeneous equation? | y = vx.
What is the standard form of a linear differential equation? | dy/dx + Py = Q.
What is the integrating factor of dy/dx + Py = Q? | e raised to ∫P dx.
What is the solution of a linear differential equation? | y × IF = ∫(Q × IF) dx + C.
What are the order and degree of d²y/dx² + (dy/dx)³ = 0? | Order 2, degree 1.
What is a homogeneous function of degree n? | One with f(λx, λy) = λⁿf(x, y).

# Vectors
What is a vector? | A quantity having both magnitude and direction.
What is a unit vector? | A vector of magnitude 1.
What is the magnitude of a î + b ĵ + c k̂? | √(a² + b² + c²).
What is the dot product of a and b? | |a||b| cos θ.
What is the magnitude of the cross product of a and b? | |a||b| sin θ.
When are two vectors perpendicular? | When their dot product is zero.
When are two vectors parallel? | When their cross product is zero.
What is î · î? | 1.
What is î · ĵ? | 0.
What is î × ĵ? | k̂.
What is the projection of a on b? | (a · b)/|b|.
What is the area of a parallelogram with adjacent sides a and b? | |a × b|.
What is the area of a triangle with sides a and b? | ½|a × b|.
What are direction cosines? | The cosines of the angles a vector makes with the three axes.
What is l² + m² + n²? | 1.
Is the cross product commutative? | No: a × b = −(b × a).
What is the position vector of the mid-point of AB? | (a + b)/2.
What is the scalar triple product? | a · (b × c), the volume of the parallelepiped.

# Three-Dimensional Geometry
What is the distance between (x₁, y₁, z₁) and (x₂, y₂, z₂)? | √[(x₂ − x₁)² + (y₂ − y₁)² + (z₂ − z₁)²].
Write the vector equation of a line. | r = a + λb.
Write the Cartesian equation of a line. | (x − x₁)/a = (y − y₁)/b = (z − z₁)/c.
What is the angle between two lines with direction ratios a₁, b₁, c₁ and a₂, b₂, c₂? | cos θ = |a₁a₂ + b₁b₂ + c₁c₂| / (√Σa₁² √Σa₂²).
When are two lines perpendicular? | When a₁a₂ + b₁b₂ + c₁c₂ = 0.
What are skew lines? | Lines that are neither parallel nor intersecting.
What is the shortest distance between two skew lines? | |(b₁ × b₂) · (a₂ − a₁)| / |b₁ × b₂|.
Write the general equation of a plane. | ax + by + cz + d = 0.
Write the equation of a plane in normal form. | r · n̂ = d.
Write the intercept form of a plane. | x/a + y/b + z/c = 1.
What is the distance of (x₁, y₁, z₁) from the plane ax + by + cz + d = 0? | |ax₁ + by₁ + cz₁ + d| / √(a² + b² + c²).
What are the direction ratios of the normal to ax + by + cz + d = 0? | a, b, c.
What are the direction cosines of the x-axis? | 1, 0, 0.

# Linear Programming
What is a linear programming problem? | Optimising a linear objective function subject to linear constraints.
What is the objective function? | The linear function Z = ax + by to be maximised or minimised.
What are constraints? | The linear inequalities that the variables must satisfy.
What is the feasible region? | The common region satisfying all the constraints.
What is a feasible solution? | Any point in the feasible region.
What is an optimal solution? | A feasible solution that gives the maximum or minimum value of Z.
Where does the optimum value occur? | At a corner point of the feasible region.
What is the corner point method? | Evaluate Z at each corner point and pick the largest or smallest value.
What are non-negativity constraints? | x ≥ 0 and y ≥ 0.
What is a bounded feasible region? | One that can be enclosed within a circle.

# Probability
What is conditional probability P(A|B)? | P(A ∩ B)/P(B), for P(B) ≠ 0.
State the multiplication theorem. | P(A ∩ B) = P(A) × P(B|A).
When are two events independent? | When P(A ∩ B) = P(A) × P(B).
State the theorem of total probability. | P(A) = Σ P(Eᵢ) P(A|Eᵢ).
State Bayes' theorem. | P(Eᵢ|A) = P(Eᵢ)P(A|Eᵢ) / Σ P(Eⱼ)P(A|Eⱼ).
What is a random variable? | A real-valued function defined on the sample space.
What is the mean of a random variable? | E(X) = Σ xᵢpᵢ.
What is the variance of a random variable? | E(X²) − [E(X)]².
What is the sum of all probabilities in a probability distribution? | 1.
What is a Bernoulli trial? | A trial with only two outcomes, success and failure, with fixed probabilities.
Write the binomial distribution formula. | P(X = r) = ⁿCᵣ pʳ qⁿ⁻ʳ.
What is the mean of a binomial distribution? | np.
What is the variance of a binomial distribution? | npq.
What is P(A ∪ B)? | P(A) + P(B) − P(A ∩ B).
What are mutually exclusive events? | Events that cannot occur together: P(A ∩ B) = 0.
What is P(A′)? | 1 − P(A).
`);
