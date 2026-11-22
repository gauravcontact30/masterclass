import { quick } from "@/lib/quick-qa";

/* Class 10 Mathematics: quick questions with short answers. */
export default quick("x-math", `
# Real Numbers
What is a rational number? | A number that can be written as p/q, where p and q are integers and q ≠ 0.
What is an irrational number? | A number that cannot be written as p/q; its decimal form neither ends nor repeats.
State Euclid's division lemma. | For positive integers a and b there are unique integers q and r with a = bq + r and 0 ≤ r < b.
State the Fundamental Theorem of Arithmetic. | Every composite number can be written as a product of primes in exactly one way, apart from order.
What is the HCF of two co-prime numbers? | 1.
What is the relation between HCF and LCM of two numbers? | HCF × LCM = product of the two numbers.
Find the HCF of 12 and 18. | 6.
Find the LCM of 12 and 18. | 36.
Is √2 rational or irrational? | Irrational.
When does p/q have a terminating decimal expansion? | When the prime factors of q (in lowest terms) are only 2 and 5.
Is 0.333… rational? | Yes, it equals 1/3.
What is the smallest prime number? | 2.
What is the only even prime number? | 2.
Write the prime factorisation of 84. | 2² × 3 × 7.
Is π a rational number? | No, it is irrational; 22/7 is only an approximation.
What is the sum of a rational and an irrational number? | Always irrational.
What is the decimal expansion of 1/8? | 0.125.
What is the HCF of 17 and 23? | 1, since both are primes.
Find the LCM of 4, 6 and 8. | 24.
Is 1 a prime number? | No, it is neither prime nor composite.

# Polynomials
What is the degree of a polynomial? | The highest power of the variable in it.
What is a zero of a polynomial p(x)? | A value of x for which p(x) = 0.
How many zeroes can a quadratic polynomial have at most? | Two.
For ax² + bx + c, what is the sum of the zeroes? | −b/a.
For ax² + bx + c, what is the product of the zeroes? | c/a.
Write a quadratic polynomial with sum of zeroes S and product P. | x² − Sx + P.
What is the degree of a cubic polynomial? | 3.
For ax³ + bx² + cx + d, what is the sum of the zeroes? | −b/a.
For ax³ + bx² + cx + d, what is the product of the zeroes? | −d/a.
Find the zeroes of x² − 5x + 6. | 2 and 3.
What does the graph of a quadratic polynomial look like? | A parabola.
State the division algorithm for polynomials. | p(x) = g(x) × q(x) + r(x), where r(x) = 0 or degree of r(x) < degree of g(x).
What is the zero of the linear polynomial ax + b? | −b/a.
State the remainder theorem. | When p(x) is divided by (x − a), the remainder is p(a).
State the factor theorem. | (x − a) is a factor of p(x) if and only if p(a) = 0.
How many zeroes does the polynomial x² + 1 have among real numbers? | None.
What is the degree of the constant polynomial 7? | 0.
Find the value of p(2) for p(x) = x² − 3x + 1. | −1.

# Linear Equations in Two Variables
What is the general form of a linear equation in two variables? | ax + by + c = 0, where a and b are not both zero.
When does a pair of linear equations have a unique solution? | When a₁/a₂ ≠ b₁/b₂ (the lines intersect).
When does a pair of linear equations have no solution? | When a₁/a₂ = b₁/b₂ ≠ c₁/c₂ (the lines are parallel).
When does a pair of linear equations have infinitely many solutions? | When a₁/a₂ = b₁/b₂ = c₁/c₂ (the lines coincide).
What is a consistent pair of equations? | A pair that has at least one solution.
Name three algebraic methods of solving a pair of linear equations. | Substitution, elimination and cross-multiplication.
Solve x + y = 5 and x − y = 1. | x = 3, y = 2.
What does the graph of a linear equation in two variables represent? | A straight line.
What is an inconsistent pair of equations? | A pair with no solution.
How many solutions does a single linear equation in two variables have? | Infinitely many.

# Quadratic Equations
What is the standard form of a quadratic equation? | ax² + bx + c = 0, with a ≠ 0.
Write the quadratic formula. | x = [−b ± √(b² − 4ac)] / 2a.
What is the discriminant? | D = b² − 4ac.
What is the nature of roots when D > 0? | Two distinct real roots.
What is the nature of roots when D = 0? | Two equal real roots.
What is the nature of roots when D < 0? | No real roots.
Find the roots of x² − 7x + 12 = 0. | 3 and 4.
Find the discriminant of 2x² − 4x + 3 = 0. | −8, so there are no real roots.
For what value of k does x² + kx + 9 = 0 have equal roots? | k = ±6.
Name three methods of solving a quadratic equation. | Factorisation, completing the square and the quadratic formula.
What is the sum of the roots of x² − 5x + 6 = 0? | 5.
What is the product of the roots of 2x² + 3x − 4 = 0? | −2.
Form the quadratic equation whose roots are 2 and −3. | x² + x − 6 = 0.

# Arithmetic Progressions
What is an arithmetic progression? | A list of numbers in which each term is obtained by adding a fixed number to the previous term.
What is the common difference? | The fixed number d = a₂ − a₁.
Write the formula for the nth term of an AP. | aₙ = a + (n − 1)d.
Write the formula for the sum of the first n terms of an AP. | Sₙ = n/2 [2a + (n − 1)d].
Write the sum of an AP in terms of first and last terms. | Sₙ = n/2 (a + l).
What is the sum of the first n natural numbers? | n(n + 1)/2.
Find the 10th term of 2, 5, 8, … | 29.
Find the sum of the first 20 natural numbers. | 210.
What is the common difference of 7, 3, −1, −5, …? | −4.
If a, b, c are in AP, what is b? | b = (a + c)/2, the arithmetic mean.
How many two-digit numbers are divisible by 3? | 30.
Find the sum of the first 10 odd numbers. | 100.
What is the nth term from the end of an AP with last term l? | l − (n − 1)d.

# Triangles
When are two figures similar? | When they have the same shape, though not necessarily the same size.
State the Basic Proportionality (Thales) Theorem. | A line parallel to one side of a triangle divides the other two sides in the same ratio.
Name the criteria for similarity of triangles. | AAA (or AA), SSS and SAS.
State the Pythagoras theorem. | In a right triangle, the square of the hypotenuse equals the sum of the squares of the other two sides.
What is the ratio of the areas of two similar triangles? | The ratio of the squares of their corresponding sides.
State the converse of the Pythagoras theorem. | If the square of one side equals the sum of the squares of the other two, the angle opposite the first side is 90°.
Are all equilateral triangles similar? | Yes.
Are all congruent triangles similar? | Yes, but similar triangles need not be congruent.
The sides of a triangle are 3 cm, 4 cm and 5 cm. Is it right-angled? | Yes, since 3² + 4² = 5².
Find the hypotenuse of a right triangle with legs 6 cm and 8 cm. | 10 cm.
What is the ratio of the perimeters of two similar triangles? | The ratio of their corresponding sides.
What is the altitude of an equilateral triangle of side a? | (√3/2)a.

# Coordinate Geometry
Write the distance formula. | √[(x₂ − x₁)² + (y₂ − y₁)²].
Write the section formula. | ((mx₂ + nx₁)/(m + n), (my₂ + ny₁)/(m + n)).
Write the mid-point formula. | ((x₁ + x₂)/2, (y₁ + y₂)/2).
Write the formula for the area of a triangle with given vertices. | ½ |x₁(y₂ − y₃) + x₂(y₃ − y₁) + x₃(y₁ − y₂)|.
What is the distance of the point (3, 4) from the origin? | 5 units.
What are the coordinates of the origin? | (0, 0).
When are three points collinear? | When the area of the triangle formed by them is zero.
What is the x-coordinate of a point also called? | The abscissa.
What is the y-coordinate of a point also called? | The ordinate.
Find the mid-point of (2, 4) and (6, 8). | (4, 6).
Write the coordinates of the centroid of a triangle. | ((x₁ + x₂ + x₃)/3, (y₁ + y₂ + y₃)/3).
What is the y-coordinate of any point on the x-axis? | 0.
Find the distance between (1, 2) and (4, 6). | 5 units.
What is the slope of a line through (x₁, y₁) and (x₂, y₂)? | (y₂ − y₁)/(x₂ − x₁).

# Trigonometry
Define sin θ in a right triangle. | Opposite side / hypotenuse.
Define cos θ. | Adjacent side / hypotenuse.
Define tan θ. | Opposite side / adjacent side, which equals sin θ / cos θ.
What is the value of sin 30°? | 1/2.
What is the value of cos 60°? | 1/2.
What is the value of tan 45°? | 1.
What is the value of sin 90°? | 1.
What is the value of cos 0°? | 1.
What is the value of sin 45°? | 1/√2.
What is the value of tan 60°? | √3.
What is the value of tan 30°? | 1/√3.
What is the value of sin 60°? | √3/2.
Write the identity connecting sin and cos. | sin²θ + cos²θ = 1.
Write the identity connecting sec and tan. | 1 + tan²θ = sec²θ.
Write the identity connecting cosec and cot. | 1 + cot²θ = cosec²θ.
What is sin (90° − θ)? | cos θ.
What is tan (90° − θ)? | cot θ.
What is the reciprocal of sin θ? | cosec θ.
What is the reciprocal of cos θ? | sec θ.
What is the value of tan 90°? | Not defined.
What is the value of sin²45° + cos²45°? | 1.

# Heights and Distances
What is the line of sight? | The line drawn from the eye of the observer to the object viewed.
What is the angle of elevation? | The angle between the horizontal and the line of sight when the object is above the horizontal.
What is the angle of depression? | The angle between the horizontal and the line of sight when the object is below the horizontal.
A tower casts a shadow equal to its height. What is the Sun's elevation? | 45°.
A 10 m ladder makes 60° with the ground. How high does it reach on the wall? | 10 sin 60° = 5√3 m.
From 20 m away, the top of a tower is seen at 45°. What is its height? | 20 m.
Which ratio is used most in heights-and-distances problems? | tan θ = height / distance.
How are the angle of elevation and the angle of depression between two points related? | They are equal (alternate angles).

# Circles
What is a tangent to a circle? | A line that touches the circle at exactly one point.
What is the angle between a tangent and the radius at the point of contact? | 90°.
How many tangents can be drawn to a circle from a point outside it? | Two.
What is true of the lengths of tangents drawn from an external point? | They are equal.
How many tangents can be drawn from a point inside a circle? | None.
How many tangents can be drawn from a point on the circle? | One.
What is a secant? | A line that cuts the circle at two points.
What is the angle in a semicircle? | 90°.
What is the longest chord of a circle? | The diameter.
What is the sum of opposite angles of a cyclic quadrilateral? | 180°.
How is the angle at the centre related to the angle at the circumference on the same arc? | The angle at the centre is double.
How many parallel tangents can a circle have at most? | Two.

# Areas Related to Circles
Write the formula for the circumference of a circle. | 2πr.
Write the formula for the area of a circle. | πr².
Write the formula for the length of an arc of angle θ. | (θ/360) × 2πr.
Write the formula for the area of a sector of angle θ. | (θ/360) × πr².
How is the area of a segment found? | Area of the sector − area of the triangle.
What is the area of a quadrant of a circle? | πr²/4.
What is the area of a semicircle? | πr²/2.
Find the circumference of a circle of radius 7 cm. | 44 cm.
Find the area of a circle of radius 7 cm. | 154 cm².
What is the perimeter of a semicircle? | πr + 2r.
What is the area of a ring with outer radius R and inner radius r? | π(R² − r²).

# Surface Areas and Volumes
What is the volume of a cuboid? | l × b × h.
What is the total surface area of a cuboid? | 2(lb + bh + hl).
What is the volume of a cube of side a? | a³.
What is the total surface area of a cube? | 6a².
What is the volume of a cylinder? | πr²h.
What is the curved surface area of a cylinder? | 2πrh.
What is the total surface area of a cylinder? | 2πr(r + h).
What is the volume of a cone? | ⅓πr²h.
What is the curved surface area of a cone? | πrl.
What is the slant height of a cone? | l = √(r² + h²).
What is the volume of a sphere? | 4⁄3 πr³.
What is the surface area of a sphere? | 4πr².
What is the volume of a hemisphere? | 2⁄3 πr³.
What is the total surface area of a solid hemisphere? | 3πr².
What is the curved surface area of a hemisphere? | 2πr².
What stays the same when a solid is melted and recast? | Its volume.
What is the volume of the frustum of a cone? | ⅓πh(R² + r² + Rr).
What is the diagonal of a cuboid? | √(l² + b² + h²).
What is the diagonal of a cube of side a? | √3 a.

# Statistics
What is the mean of ungrouped data? | Sum of observations / number of observations.
Write the direct-method formula for the mean of grouped data. | x̄ = Σfᵢxᵢ / Σfᵢ.
Write the assumed-mean formula. | x̄ = a + Σfᵢdᵢ / Σfᵢ.
Write the formula for the mode of grouped data. | l + [(f₁ − f₀)/(2f₁ − f₀ − f₂)] × h.
Write the formula for the median of grouped data. | l + [(n/2 − cf)/f] × h.
What is the empirical relation between mean, median and mode? | Mode = 3 Median − 2 Mean.
What is the class mark? | (Upper limit + lower limit)/2.
What is the modal class? | The class with the highest frequency.
What is an ogive? | A cumulative frequency curve.
What is the median of 3, 5, 7, 9, 11? | 7.
What is the mode of 2, 3, 3, 5, 3, 7? | 3.
What is the mean of the first five natural numbers? | 3.
Which measure of central tendency can be found from the intersection of two ogives? | The median.
What is the range of data? | Highest value − lowest value.
What is class size? | Upper limit − lower limit of a class.

# Probability
Write the formula for the probability of an event E. | P(E) = favourable outcomes / total outcomes.
What is the probability of a sure event? | 1.
What is the probability of an impossible event? | 0.
Between which values does a probability lie? | 0 and 1, both included.
What is P(E) + P(not E)? | 1.
What is the probability of getting a head when a coin is tossed? | 1/2.
What is the probability of getting a 6 when a die is thrown? | 1/6.
What is the probability of an even number on a die? | 1/2.
What is the probability of a prime number on a die? | 1/2 (2, 3 and 5).
How many cards are there in a pack? | 52.
What is the probability of drawing an ace from a pack of cards? | 1/13.
What is the probability of drawing a red card? | 1/2.
What is the probability of drawing a king of hearts? | 1/52.
How many face cards are there in a pack? | 12.
How many outcomes are there when two coins are tossed? | 4.
How many outcomes are there when two dice are thrown? | 36.
What is the probability of a sum of 7 with two dice? | 6/36 = 1/6.
What are complementary events? | An event E and the event 'not E'.
What are equally likely outcomes? | Outcomes that have the same chance of occurring.
What is an elementary event? | An event with only one outcome.
`);
