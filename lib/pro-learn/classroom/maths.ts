import type { AwsHighlight } from "../aws-highlights";

/** `chapter` groups the sub-topics under the textbook chapter they come from. */
type Chapter = [chapter: string, subtopics: [name: string, summary: string][]];

/**
 * Sub-topics carry the chapter in their summary rather than in their name.
 *
 * A card shows its name large and its summary small, so "Prime factorisation"
 * reads as the concept it is, while "Playing with Numbers · …" tells the reader
 * which chapter to open. Putting the chapter in the name instead would make
 * every card in a chapter start with the same twenty characters.
 */
export const forClass = (label: string, chapters: Chapter[]): AwsHighlight[] =>
  chapters.flatMap(([chapter, subtopics]) => subtopics.map(([name, summary]) => ({
    name, category: label, summary: `${chapter} · ${summary}`,
  })));

export const MATHS_6: AwsHighlight[] = forClass("Class 6", [
  ["Knowing Our Numbers", [
    ["Comparing numbers", "Order large numbers by place value and find the greatest and smallest."],
    ["Place value and expanded form", "Write a numeral as the sum of the value of each of its digits."],
    ["Indian and international systems", "Group digits into lakhs and crores, or thousands and millions."],
    ["Estimation and rounding", "Round to the nearest ten, hundred or thousand to check an answer quickly."],
    ["Roman numerals", "Read and write numbers with I, V, X, L, C, D and M and the subtraction rule."],
    ["Using brackets", "Apply BODMAS so a mixed expression has one unambiguous value."],
  ]],
  ["Whole Numbers", [
    ["The number line", "Represent whole numbers as equally spaced points and add or subtract by jumping."],
    ["Successor and predecessor", "Find the number just after and just before any whole number."],
    ["Commutative and associative properties", "Reorder and regroup addends or factors without changing the result."],
    ["Distributive property", "Split a multiplication over a sum to make mental arithmetic easier."],
    ["Identity elements", "Use 0 for addition and 1 for multiplication as the numbers that change nothing."],
    ["Patterns in whole numbers", "Arrange numbers as lines, rectangles, squares and triangles to see structure."],
  ]],
  ["Playing With Numbers", [
    ["Factors and multiples", "Find every factor of a number and generate its multiples."],
    ["Prime and composite numbers", "Separate numbers with exactly two factors from those with more."],
    ["Tests of divisibility", "Check divisibility by 2, 3, 4, 5, 6, 8, 9, 10 and 11 without dividing."],
    ["Prime factorisation", "Write a number as a product of primes using a factor tree."],
    ["HCF and LCM", "Find the highest common factor and lowest common multiple, and use them in word problems."],
    ["Co-prime numbers", "Recognise pairs whose only common factor is 1."],
  ]],
  ["Basic Geometrical Ideas", [
    ["Point, line, ray and line segment", "Tell apart the four basic objects and name them correctly."],
    ["Intersecting and parallel lines", "Decide whether two lines meet, and where."],
    ["Curves: open, closed and simple", "Classify curves and identify interior, exterior and boundary."],
    ["Angles and their parts", "Name the vertex and arms of an angle and read its interior."],
    ["Triangles and quadrilaterals", "Name vertices, sides, diagonals and adjacent parts of each figure."],
    ["Circles: centre, radius, chord, diameter", "Identify every part of a circle and how they relate."],
  ]],
  ["Understanding Elementary Shapes", [
    ["Measuring line segments", "Compare segments by observation, tracing and a divider."],
    ["Types of angles", "Classify angles as acute, right, obtuse, straight, reflex or complete."],
    ["Perpendicular lines", "Recognise lines meeting at a right angle and the perpendicular bisector."],
    ["Classifying triangles", "Sort triangles by sides (scalene, isosceles, equilateral) and by angles."],
    ["Classifying quadrilaterals", "Place trapezium, parallelogram, rhombus, rectangle and square in a hierarchy."],
    ["Polygons", "Name a figure by its number of sides from triangle to octagon."],
    ["Three-dimensional shapes", "Count faces, edges and vertices of cube, cuboid, cone, cylinder and sphere."],
  ]],
  ["Integers", [
    ["Need for negative numbers", "Use negatives for temperature, depth and debt where whole numbers fail."],
    ["Integers on the number line", "Place positive and negative integers and read their order."],
    ["Ordering integers", "Compare integers using position rather than magnitude."],
    ["Addition of integers", "Add with like and unlike signs, using the number line as a model."],
    ["Subtraction of integers", "Subtract by adding the additive inverse."],
    ["Absolute value", "Read the distance of an integer from zero, regardless of direction."],
  ]],
  ["Fractions", [
    ["Fraction as a part of a whole", "Read the numerator and denominator as parts taken and parts made."],
    ["Proper, improper and mixed fractions", "Convert between improper fractions and mixed numbers."],
    ["Equivalent fractions", "Multiply or divide both terms by the same number to rename a fraction."],
    ["Simplest form", "Reduce a fraction by dividing by the HCF of its terms."],
    ["Like and unlike fractions", "Compare and order fractions by making denominators equal."],
    ["Adding and subtracting fractions", "Use the LCM of denominators to combine unlike fractions."],
  ]],
  ["Decimals", [
    ["Tenths, hundredths and thousandths", "Extend place value to the right of the decimal point."],
    ["Decimals on the number line", "Locate a decimal between two whole numbers."],
    ["Comparing decimals", "Order decimals by comparing place by place, not by length."],
    ["Fraction and decimal conversion", "Move between a fraction and its decimal form."],
    ["Using decimals for money, length and weight", "Express rupees and paise, metres and centimetres in one number."],
    ["Adding and subtracting decimals", "Line up the decimal points and pad with zeros."],
  ]],
  ["Data Handling", [
    ["Recording data", "Collect raw data and organise it into a table."],
    ["Tally marks and frequency", "Count observations in groups of five and build a frequency table."],
    ["Pictographs", "Represent data with symbols and read a scale from the key."],
    ["Bar graphs", "Draw and interpret bars of equal width on a chosen scale."],
  ]],
  ["Mensuration", [
    ["Perimeter of a figure", "Add the boundary lengths of any closed figure."],
    ["Perimeter of rectangle, square and triangle", "Apply the standard formulas and use them in reverse."],
    ["Area by counting squares", "Estimate area on squared paper by counting full and half squares."],
    ["Area of rectangle and square", "Use length × breadth and side² and solve for a missing dimension."],
  ]],
  ["Algebra", [
    ["Variables and constants", "Use a letter to stand for a number that can change."],
    ["Forming expressions", "Translate a statement in words into an algebraic expression."],
    ["Using rules and formulas", "Express perimeter and area rules with variables."],
    ["Equations and solutions", "Recognise an equation and find the value that satisfies it."],
    ["Solving by trial and error", "Substitute candidate values until the two sides balance."],
  ]],
  ["Ratio and Proportion", [
    ["Meaning of ratio", "Compare two quantities of the same kind by division."],
    ["Equivalent ratios", "Scale both terms of a ratio by the same factor."],
    ["Proportion", "Test whether four quantities are in proportion using the product rule."],
    ["Unitary method", "Find the value of one unit, then scale to the quantity asked for."],
  ]],
  ["Symmetry", [
    ["Line of symmetry", "Find the fold that maps a figure exactly onto itself."],
    ["Figures with multiple lines of symmetry", "Count the axes of symmetry in regular polygons."],
    ["Reflection and mirror images", "Draw the mirror image of a figure across a given line."],
  ]],
  ["Practical Geometry", [
    ["Constructing a circle", "Draw a circle of given radius with a compass."],
    ["Constructing a line segment", "Copy a segment and construct one of stated length."],
    ["Perpendicular bisector", "Bisect a segment at right angles using arcs."],
    ["Constructing and bisecting angles", "Build 60°, 90°, 120° and bisect any angle with compasses."],
  ]],
]);

export const MATHS_7: AwsHighlight[] = forClass("Class 7", [
  ["Integers", [
    ["Multiplication of integers", "Apply the sign rules for products of positive and negative integers."],
    ["Division of integers", "Divide with signs and recognise when the quotient is not an integer."],
    ["Properties of integers", "Use closure, commutativity, associativity and distributivity over the integers."],
    ["Word problems with integers", "Model gain and loss, rise and fall, with signed arithmetic."],
  ]],
  ["Fractions and Decimals", [
    ["Multiplication of fractions", "Multiply fraction by whole number and by fraction, and see the product shrink."],
    ["Reciprocal of a fraction", "Invert a fraction and use it to divide."],
    ["Division of fractions", "Divide by multiplying by the reciprocal."],
    ["Multiplication of decimals", "Multiply decimals and place the point by counting decimal places."],
    ["Division of decimals", "Divide by whole numbers, by decimals, and by powers of ten."],
  ]],
  ["Data Handling", [
    ["Arithmetic mean", "Find the average and understand it as a fair share."],
    ["Mode and median", "Identify the most frequent value and the middle value of ordered data."],
    ["Bar graphs and double bar graphs", "Compare two data sets on one pair of axes."],
    ["Chance and probability", "Describe outcomes as certain, impossible or likely and count equally likely cases."],
  ]],
  ["Simple Equations", [
    ["Setting up an equation", "Turn a word problem into an equation with one unknown."],
    ["Solving by balancing", "Perform the same operation on both sides to isolate the variable."],
    ["Transposing terms", "Move a term across the equals sign by changing its sign."],
    ["Applications of simple equations", "Solve age, money and number puzzles algebraically."],
  ]],
  ["Lines and Angles", [
    ["Complementary and supplementary angles", "Use the 90° and 180° pair sums to find a missing angle."],
    ["Adjacent angles and linear pair", "Recognise angles sharing an arm and those summing to a straight line."],
    ["Vertically opposite angles", "Use the equality of angles formed by two intersecting lines."],
    ["Transversal and parallel lines", "Apply corresponding, alternate and co-interior angle relationships."],
  ]],
  ["The Triangle and Its Properties", [
    ["Medians and altitudes", "Draw the median to a side and the altitude from a vertex."],
    ["Angle sum property", "Use the fact that the three angles of a triangle total 180°."],
    ["Exterior angle property", "Relate an exterior angle to the two opposite interior angles."],
    ["Triangle inequality", "Test whether three lengths can form a triangle."],
    ["Pythagoras theorem", "Relate the squares on the sides of a right-angled triangle."],
  ]],
  ["Congruence of Triangles", [
    ["Congruent figures", "Decide when two figures coincide exactly on superposition."],
    ["SSS and SAS criteria", "Prove congruence from three sides, or two sides and the included angle."],
    ["ASA and RHS criteria", "Prove congruence from two angles and a side, or the right-angle-hypotenuse-side case."],
    ["Corresponding parts", "Use CPCT to deduce equal sides and angles once congruence is proved."],
  ]],
  ["Comparing Quantities", [
    ["Percentage", "Convert between fractions, decimals and percentages."],
    ["Increase and decrease per cent", "Compute a percentage change from original and new values."],
    ["Profit and loss", "Find profit, loss and their percentages from cost and selling price."],
    ["Simple interest", "Apply I = PRT/100 and find any one quantity from the others."],
  ]],
  ["Rational Numbers", [
    ["Meaning of a rational number", "Express a number as p/q with q not zero."],
    ["Positive and negative rationals", "Sort rationals by sign and place them on the number line."],
    ["Standard form", "Write a rational number with a positive denominator in lowest terms."],
    ["Operations on rational numbers", "Add, subtract, multiply and divide rationals fluently."],
  ]],
  ["Practical Geometry", [
    ["Constructing parallel lines", "Draw a line parallel to a given line through an external point."],
    ["Constructing triangles (SSS, SAS, ASA)", "Build a triangle from three given measurements."],
    ["Constructing a right-angled triangle", "Use the RHS data to construct a unique triangle."],
  ]],
  ["Perimeter and Area", [
    ["Area of a parallelogram", "Use base × height and identify the correct height."],
    ["Area of a triangle", "Apply ½ × base × height, including for obtuse triangles."],
    ["Circumference of a circle", "Use 2πr and relate it to the diameter."],
    ["Area of a circle", "Apply πr² and find the radius from a given area."],
    ["Area of combined figures", "Decompose a compound shape into rectangles, triangles and circles."],
  ]],
  ["Algebraic Expressions", [
    ["Terms, factors and coefficients", "Break an expression into terms and identify numerical coefficients."],
    ["Monomials, binomials and polynomials", "Classify an expression by the number of terms."],
    ["Like and unlike terms", "Combine only terms with identical variable parts."],
    ["Adding and subtracting expressions", "Collect like terms to simplify a sum or difference."],
    ["Value of an expression", "Substitute a number for the variable and evaluate."],
  ]],
  ["Exponents and Powers", [
    ["Exponential notation", "Write repeated multiplication compactly with a base and index."],
    ["Laws of exponents", "Apply the product, quotient and power rules with the same base."],
    ["Power of a product and quotient", "Distribute an exponent over multiplication and division."],
    ["Numbers in standard form", "Express very large numbers as a × 10ⁿ."],
  ]],
  ["Symmetry", [
    ["Lines of symmetry for regular polygons", "Relate the number of axes to the number of sides."],
    ["Rotational symmetry", "Find the centre, angle and order of rotation."],
    ["Line and rotational symmetry together", "Identify figures having both kinds of symmetry."],
  ]],
  ["Visualising Solid Shapes", [
    ["Faces, edges and vertices", "Count the parts of common solids and check Euler's relation."],
    ["Nets of solids", "Fold a flat net into a cube, cuboid, cone or cylinder."],
    ["Views of a solid", "Draw top, front and side views of a three-dimensional object."],
    ["Oblique and isometric sketches", "Represent a solid on paper with two standard drawing methods."],
  ]],
]);

export const MATHS_8: AwsHighlight[] = forClass("Class 8", [
  ["Rational Numbers", [
    ["Closure and commutativity", "Test which operations keep you inside the rational numbers."],
    ["Associativity and distributivity", "Regroup and expand rational expressions correctly."],
    ["Additive and multiplicative identity", "Use 0 and 1 as the elements that leave a number unchanged."],
    ["Rational numbers between two rationals", "Find as many rationals as you like between any two."],
    ["Representation on the number line", "Divide a unit into equal parts to plot a rational number."],
  ]],
  ["Linear Equations in One Variable", [
    ["Equations with variables on both sides", "Collect variable terms on one side and constants on the other."],
    ["Reducing to simpler form", "Clear denominators before solving."],
    ["Word problems on numbers and ages", "Translate a story into a linear equation and solve it."],
    ["Applications to perimeter and money", "Model geometric and currency problems with one unknown."],
  ]],
  ["Understanding Quadrilaterals", [
    ["Angle sum of a polygon", "Derive (n − 2) × 180° for the interior angles."],
    ["Exterior angles of a polygon", "Use the fact that exterior angles total 360°."],
    ["Properties of a parallelogram", "Apply equal opposite sides, equal opposite angles and bisecting diagonals."],
    ["Rhombus, rectangle and square", "Distinguish the special parallelograms by their diagonals."],
    ["Kite and trapezium", "Identify the defining properties of each."],
  ]],
  ["Practical Geometry", [
    ["Constructing a quadrilateral from four sides and a diagonal", "Use the given data to fix a unique figure."],
    ["Constructing from three sides and two diagonals", "Build the figure triangle by triangle."],
    ["Constructing from sides and included angles", "Combine length and angle data in a construction."],
    ["Special quadrilateral constructions", "Construct a rhombus, rectangle or square from minimal data."],
  ]],
  ["Data Handling", [
    ["Grouped frequency distribution", "Organise raw data into class intervals."],
    ["Histograms", "Draw bars with no gaps for continuous grouped data."],
    ["Pie charts", "Convert each category's share into a central angle."],
    ["Probability of an event", "Compute favourable outcomes over total equally likely outcomes."],
  ]],
  ["Squares and Square Roots", [
    ["Properties of square numbers", "Recognise which digits a perfect square can end in."],
    ["Patterns in squares", "Use identities such as the sum of consecutive odd numbers."],
    ["Finding squares of large numbers", "Apply (a ± b)² to square mentally."],
    ["Square roots by prime factorisation", "Pair identical primes to extract a root."],
    ["Square roots by long division", "Find roots of large numbers and of decimals."],
  ]],
  ["Cubes and Cube Roots", [
    ["Cube numbers", "Identify perfect cubes and their patterns."],
    ["Making a number a perfect cube", "Find the smallest multiplier or divisor that completes a cube."],
    ["Cube roots by prime factorisation", "Group primes in threes to extract a cube root."],
  ]],
  ["Comparing Quantities", [
    ["Discount and marked price", "Work between marked price, discount and selling price."],
    ["Sales tax, VAT and GST", "Add a tax percentage to a bill and work backwards from it."],
    ["Compound interest", "Apply A = P(1 + R/100)ⁿ and separate interest from amount."],
    ["Compounding more than once a year", "Adjust rate and time for half-yearly and quarterly compounding."],
    ["Growth and depreciation", "Model population increase and machine value decrease."],
  ]],
  ["Algebraic Expressions and Identities", [
    ["Multiplying monomials and binomials", "Apply the distributive law term by term."],
    ["Standard identities", "Use (a+b)², (a−b)² and (a+b)(a−b) to expand quickly."],
    ["Applying identities to numbers", "Compute products like 103 × 97 mentally."],
  ]],
  ["Visualising Solid Shapes", [
    ["Views of 3D shapes", "Map a solid to its top, front and side elevations."],
    ["Mapping space around us", "Read and draw simple scaled maps."],
    ["Euler's formula", "Verify F + V − E = 2 for polyhedra."],
  ]],
  ["Mensuration", [
    ["Area of a trapezium", "Apply ½ × (sum of parallel sides) × height."],
    ["Area of a general quadrilateral and rhombus", "Use the diagonal method and the half-product of diagonals."],
    ["Surface area of cube and cuboid", "Sum the areas of all six faces."],
    ["Surface area of a cylinder", "Separate curved surface from the two circular ends."],
    ["Volume of cube, cuboid and cylinder", "Compute capacity and convert between cm³, m³ and litres."],
  ]],
  ["Exponents and Powers", [
    ["Negative exponents", "Interpret a⁻ⁿ as the reciprocal of aⁿ."],
    ["Laws of exponents with integers", "Extend the product, quotient and power rules to negative indices."],
    ["Very small numbers in standard form", "Express quantities like 0.000003 as a × 10⁻ⁿ."],
    ["Comparing very large and very small numbers", "Use standard form to order extreme magnitudes."],
  ]],
  ["Direct and Inverse Proportions", [
    ["Direct proportion", "Recognise when the ratio of two quantities stays constant."],
    ["Inverse proportion", "Recognise when the product of two quantities stays constant."],
    ["Time and work problems", "Apply inverse proportion to workers and days."],
  ]],
  ["Factorisation", [
    ["Common factors", "Take out the highest common factor of every term."],
    ["Factorisation by regrouping", "Group terms so a common binomial factor appears."],
    ["Factorisation using identities", "Recognise perfect squares and the difference of two squares."],
    ["Factors of the form (x + a)(x + b)", "Split the middle term to factorise a quadratic."],
    ["Division of algebraic expressions", "Divide a polynomial by a monomial and by a binomial."],
  ]],
  ["Introduction to Graphs", [
    ["Cartesian plane and coordinates", "Plot an ordered pair using x and y axes."],
    ["Reading line graphs", "Extract values and trends from a plotted line."],
    ["Linear graphs", "Plot a straight line from a table of values."],
    ["Graphs in practical situations", "Interpret distance-time and quantity-cost graphs."],
  ]],
]);

export const MATHS_9: AwsHighlight[] = forClass("Class 9", [
  ["Number Systems", [
    ["Irrational numbers", "Show that numbers such as √2 cannot be written as p/q."],
    ["Real numbers on the number line", "Locate √x geometrically by successive magnification."],
    ["Decimal expansions", "Link terminating and recurring decimals to rational numbers."],
    ["Operations on real numbers", "Add and multiply surds and rationalise a denominator."],
    ["Laws of exponents for real numbers", "Extend index laws to rational exponents."],
  ]],
  ["Polynomials", [
    ["Degree and types of polynomials", "Classify by degree as linear, quadratic or cubic."],
    ["Zeroes of a polynomial", "Find values of x that make the polynomial vanish."],
    ["Remainder theorem", "Get the remainder of division by (x − a) by evaluating at a."],
    ["Factor theorem", "Use p(a) = 0 to identify (x − a) as a factor."],
    ["Algebraic identities", "Apply the cube and three-term expansion identities."],
  ]],
  ["Coordinate Geometry", [
    ["Cartesian system and quadrants", "Fix a point by its signed distances from two axes."],
    ["Plotting points", "Place ordered pairs accurately and read coordinates back."],
    ["Abscissa and ordinate", "Name the x and y coordinates correctly."],
  ]],
  ["Linear Equations in Two Variables", [
    ["Solutions of a linear equation", "Show that ax + by + c = 0 has infinitely many solutions."],
    ["Graph of a linear equation", "Plot two solutions and draw the line through them."],
    ["Lines parallel to the axes", "Interpret x = a and y = b as vertical and horizontal lines."],
  ]],
  ["Introduction to Euclid's Geometry", [
    ["Euclid's definitions and axioms", "Read the basic undefined terms and common notions."],
    ["Euclid's five postulates", "State the postulates and see where the fifth is special."],
    ["Equivalent versions of the fifth postulate", "Relate the parallel postulate to Playfair's axiom."],
  ]],
  ["Lines and Angles", [
    ["Linear pair and vertically opposite angles", "Prove and apply the two basic angle theorems."],
    ["Parallel lines and a transversal", "Prove the corresponding and alternate angle results."],
    ["Lines parallel to the same line", "Deduce parallelism transitively."],
    ["Angle sum property of a triangle", "Prove the 180° result using parallels."],
  ]],
  ["Triangles", [
    ["Congruence criteria", "Apply SSS, SAS, ASA, AAS and RHS in proofs."],
    ["Properties of isosceles triangles", "Prove that equal sides face equal angles, and its converse."],
    ["Inequalities in a triangle", "Relate the longer side to the larger opposite angle."],
    ["Triangle inequality theorem", "Prove that the sum of two sides exceeds the third."],
  ]],
  ["Quadrilaterals", [
    ["Angle sum of a quadrilateral", "Derive the 360° total by splitting into triangles."],
    ["Parallelogram theorems", "Prove the side, angle and diagonal properties and their converses."],
    ["Mid-point theorem", "Prove the segment joining two mid-points is parallel and half the third side."],
    ["Conditions for a parallelogram", "Decide from minimal data whether a quadrilateral is a parallelogram."],
  ]],
  ["Areas of Parallelograms and Triangles", [
    ["Figures on the same base and between the same parallels", "Prove equality of areas from this configuration."],
    ["Area of a triangle from parallelograms", "Relate a triangle's area to half the parallelogram on the same base."],
  ]],
  ["Circles", [
    ["Chords and the perpendicular from the centre", "Prove that the perpendicular from the centre bisects the chord."],
    ["Equal chords and their distances", "Relate chord length to distance from the centre."],
    ["Angle subtended at the centre", "Prove it is twice the angle at the remaining circumference."],
    ["Angles in the same segment", "Prove equality and the right angle in a semicircle."],
    ["Cyclic quadrilaterals", "Use the supplementary opposite angles property."],
  ]],
  ["Constructions", [
    ["Bisecting an angle and a segment", "Perform the two fundamental compass constructions."],
    ["Constructing standard angles", "Build 30°, 45°, 60°, 90° and 120° accurately."],
    ["Constructing triangles from perimeter and base angles", "Use given sum of sides with two angles."],
  ]],
  ["Heron's Formula", [
    ["Area from three sides", "Apply √(s(s−a)(s−b)(s−c)) when no height is given."],
    ["Area of a quadrilateral by triangles", "Split into two triangles and add their Heron areas."],
  ]],
  ["Surface Areas and Volumes", [
    ["Cuboid and cube", "Find lateral and total surface area and volume."],
    ["Right circular cylinder", "Separate curved and total surface area from volume."],
    ["Right circular cone", "Relate slant height, radius and height, then find area and volume."],
    ["Sphere and hemisphere", "Apply 4πr², 2πr² and the volume formulas."],
  ]],
  ["Statistics", [
    ["Collection and presentation of data", "Build ungrouped and grouped frequency distributions."],
    ["Bar graphs, histograms and frequency polygons", "Choose and draw the right graph for the data."],
    ["Mean, median and mode of ungrouped data", "Compute all three measures of central tendency."],
  ]],
  ["Probability", [
    ["Experimental probability", "Estimate probability from the frequency of observed outcomes."],
    ["Events and outcomes", "Count favourable outcomes against the total in a trial."],
  ]],
]);

export const MATHS_10: AwsHighlight[] = forClass("Class 10", [
  ["Real Numbers", [
    ["Euclid's division lemma", "Express a = bq + r and use it to find HCF."],
    ["Fundamental theorem of arithmetic", "Factorise uniquely into primes and apply it to HCF and LCM."],
    ["Proving irrationality", "Use contradiction to prove √2, √3 and similar are irrational."],
    ["Decimal expansion of rationals", "Predict terminating or recurring from the denominator's factors."],
  ]],
  ["Polynomials", [
    ["Geometrical meaning of zeroes", "Read zeroes as the x-intercepts of the graph."],
    ["Relationship between zeroes and coefficients", "Use sum and product of roots for quadratics and cubics."],
    ["Division algorithm for polynomials", "Divide one polynomial by another and interpret the remainder."],
  ]],
  ["Pair of Linear Equations in Two Variables", [
    ["Graphical solution", "Read consistency from whether lines intersect, coincide or are parallel."],
    ["Substitution method", "Express one variable in terms of the other and substitute."],
    ["Elimination method", "Add or subtract equations to remove a variable."],
    ["Cross-multiplication method", "Apply the general formula to the coefficients."],
    ["Equations reducible to linear form", "Substitute to linearise equations in 1/x and 1/y."],
  ]],
  ["Quadratic Equations", [
    ["Standard form of a quadratic", "Recognise and rearrange to ax² + bx + c = 0."],
    ["Solution by factorisation", "Split the middle term and use the zero-product rule."],
    ["Completing the square", "Convert to a perfect square to solve."],
    ["Quadratic formula", "Apply the root formula and handle the sign of the discriminant."],
    ["Nature of roots", "Use b² − 4ac to classify roots as real, equal or imaginary."],
    ["Word problems on quadratics", "Model speed, area and age problems with a quadratic."],
  ]],
  ["Arithmetic Progressions", [
    ["General term of an AP", "Apply aₙ = a + (n − 1)d and find any term."],
    ["Sum of n terms", "Use Sₙ = n/2 [2a + (n−1)d] and its variants."],
    ["Applications of APs", "Model instalments, savings and stacked objects."],
  ]],
  ["Triangles", [
    ["Similarity of triangles", "Define similarity by equal angles and proportional sides."],
    ["Basic Proportionality Theorem", "Prove and apply Thales' theorem and its converse."],
    ["Criteria for similarity", "Use AAA, SAS and SSS similarity."],
    ["Areas of similar triangles", "Relate area ratio to the square of the side ratio."],
    ["Pythagoras theorem and its converse", "Prove both and apply them to right triangles."],
  ]],
  ["Coordinate Geometry", [
    ["Distance formula", "Find the distance between two points and test collinearity."],
    ["Section formula", "Divide a segment internally in a given ratio, including the mid-point."],
    ["Area of a triangle from coordinates", "Apply the determinant form and detect collinear points."],
  ]],
  ["Introduction to Trigonometry", [
    ["Trigonometric ratios", "Define sine, cosine and tangent in a right triangle."],
    ["Ratios of standard angles", "Recall values at 0°, 30°, 45°, 60° and 90°."],
    ["Complementary angle relations", "Use sin(90° − θ) = cos θ and its partners."],
    ["Trigonometric identities", "Prove and apply sin²θ + cos²θ = 1 and its derived forms."],
  ]],
  ["Applications of Trigonometry", [
    ["Angle of elevation", "Model a line of sight above the horizontal."],
    ["Angle of depression", "Model a line of sight below the horizontal."],
    ["Heights and distances problems", "Combine two right triangles to find an unknown height."],
  ]],
  ["Circles", [
    ["Tangent to a circle", "Prove the tangent is perpendicular to the radius at the point of contact."],
    ["Number of tangents from a point", "Show two tangents from an external point are equal."],
  ]],
  ["Constructions", [
    ["Dividing a segment in a given ratio", "Use equally spaced arcs on a ray."],
    ["Constructing a similar triangle", "Scale a triangle by a given ratio."],
    ["Tangents from an external point", "Construct both tangents using the circle on the diameter."],
  ]],
  ["Areas Related to Circles", [
    ["Perimeter and area of a circle", "Revise 2πr and πr² in problem contexts."],
    ["Areas of sector and segment", "Apply the θ/360 fraction and subtract the triangle for a segment."],
    ["Combination of plane figures", "Find shaded areas made from circles, squares and triangles."],
  ]],
  ["Surface Areas and Volumes", [
    ["Combination of solids", "Add surface areas of a cone on a cylinder, or a hemisphere on a cube."],
    ["Volume of combined solids", "Sum or subtract component volumes."],
    ["Conversion of solids", "Equate volumes when a solid is melted and recast."],
    ["Frustum of a cone", "Apply the frustum surface area and volume formulas."],
  ]],
  ["Statistics", [
    ["Mean of grouped data", "Use direct, assumed-mean and step-deviation methods."],
    ["Mode of grouped data", "Apply the modal class formula."],
    ["Median of grouped data", "Use cumulative frequency and the median class formula."],
    ["Ogives", "Draw less-than and more-than curves and read the median from them."],
  ]],
  ["Probability", [
    ["Theoretical probability", "Compute probability from equally likely outcomes."],
    ["Complementary events", "Use P(not E) = 1 − P(E)."],
    ["Problems on cards, dice and coins", "Enumerate sample spaces for standard experiments."],
  ]],
]);

export const MATHS_11: AwsHighlight[] = forClass("Class 11", [
  ["Sets", [
    ["Types of sets", "Distinguish empty, finite, infinite, equal and subset relations."],
    ["Venn diagrams", "Represent set relationships pictorially."],
    ["Operations on sets", "Perform union, intersection, difference and complement."],
    ["Practical problems on union and intersection", "Apply the inclusion-exclusion counting formula."],
  ]],
  ["Relations and Functions", [
    ["Cartesian product of sets", "Form ordered pairs and count the product set."],
    ["Relations and their domain and range", "Describe a relation as a subset of a product."],
    ["Functions and their types", "Identify one-one, onto and real-valued functions."],
    ["Standard real functions and graphs", "Sketch identity, constant, modulus, signum and greatest-integer functions."],
    ["Algebra of real functions", "Add, subtract, multiply and divide functions."],
  ]],
  ["Trigonometric Functions", [
    ["Radian and degree measure", "Convert between the two angle measures."],
    ["Trigonometric functions of any angle", "Extend the ratios to all four quadrants."],
    ["Sum and difference formulas", "Expand sin(A ± B), cos(A ± B) and tan(A ± B)."],
    ["Multiple and sub-multiple angles", "Apply double and half angle identities."],
    ["Trigonometric equations", "Find the general solution of standard equations."],
    ["Sine and cosine rules", "Solve oblique triangles."],
  ]],
  ["Principle of Mathematical Induction", [
    ["The principle of induction", "State the base case and inductive step."],
    ["Proving divisibility and summation results", "Apply induction to standard identities."],
  ]],
  ["Complex Numbers and Quadratic Equations", [
    ["Algebra of complex numbers", "Add, multiply and divide numbers of the form a + ib."],
    ["Modulus and conjugate", "Compute |z| and z̄ and use their properties."],
    ["Argand plane and polar form", "Represent a complex number geometrically and in modulus-argument form."],
    ["Quadratic equations with complex roots", "Solve equations whose discriminant is negative."],
  ]],
  ["Linear Inequalities", [
    ["Solving linear inequalities in one variable", "Solve algebraically and show on the number line."],
    ["Graphical solution in two variables", "Shade the half-plane satisfying an inequality."],
    ["Systems of linear inequalities", "Find the feasible region common to several constraints."],
  ]],
  ["Permutations and Combinations", [
    ["Fundamental principle of counting", "Multiply choices across independent stages."],
    ["Permutations", "Count arrangements, including with repetition and identical objects."],
    ["Combinations", "Count selections where order does not matter."],
    ["Applications of nCr and nPr", "Solve selection and arrangement word problems."],
  ]],
  ["Binomial Theorem", [
    ["Binomial theorem for positive index", "Expand (a + b)ⁿ using binomial coefficients."],
    ["General and middle terms", "Locate a specific term in the expansion."],
    ["Applications of the binomial theorem", "Find coefficients, constant terms and approximations."],
  ]],
  ["Sequences and Series", [
    ["Arithmetic progression and mean", "Revise AP and insert arithmetic means."],
    ["Geometric progression", "Find the nth term and sum of a GP, finite and infinite."],
    ["Geometric mean and AM-GM", "Insert geometric means and compare AM with GM."],
    ["Sum of special series", "Sum Σn, Σn² and Σn³."],
  ]],
  ["Straight Lines", [
    ["Slope of a line", "Compute slope from two points and from the angle of inclination."],
    ["Forms of the equation of a line", "Use point-slope, two-point, slope-intercept, intercept and normal forms."],
    ["Angle between two lines", "Apply the tangent formula and the conditions for parallel and perpendicular."],
    ["Distance of a point from a line", "Apply the perpendicular distance formula."],
  ]],
  ["Conic Sections", [
    ["Circle", "Write the standard and general equations and find centre and radius."],
    ["Parabola", "Identify focus, directrix and latus rectum for the four standard forms."],
    ["Ellipse", "Find foci, vertices, axes and eccentricity."],
    ["Hyperbola", "Find foci, vertices, eccentricity and asymptotes."],
  ]],
  ["Introduction to Three-Dimensional Geometry", [
    ["Coordinate axes and planes in space", "Fix a point by three coordinates and identify octants."],
    ["Distance between two points in space", "Extend the distance formula to three dimensions."],
    ["Section formula in space", "Divide a segment in space in a given ratio."],
  ]],
  ["Limits and Derivatives", [
    ["Intuitive idea of a limit", "Approach a value from the left and the right."],
    ["Algebra of limits", "Apply sum, product and quotient rules for limits."],
    ["Limits of trigonometric functions", "Use the standard sin x / x result."],
    ["Derivative from first principles", "Compute the derivative as a limit of the difference quotient."],
    ["Rules of differentiation", "Differentiate sums, products, quotients and polynomials."],
  ]],
  ["Mathematical Reasoning", [
    ["Statements and their negation", "Identify mathematically acceptable statements."],
    ["Compound statements and connectives", "Use and, or, implies and if-and-only-if."],
    ["Quantifiers", "Interpret 'there exists' and 'for all'."],
    ["Validating statements", "Prove or disprove by contradiction and counter-example."],
  ]],
  ["Statistics", [
    ["Measures of dispersion", "Compute range and mean deviation."],
    ["Variance and standard deviation", "Calculate for ungrouped and grouped data."],
    ["Coefficient of variation", "Compare consistency between two data sets."],
  ]],
  ["Probability", [
    ["Random experiments and sample space", "List outcomes of an experiment precisely."],
    ["Events and their algebra", "Combine events with union, intersection and complement."],
    ["Axiomatic probability", "Apply the addition rule and mutually exclusive events."],
  ]],
]);

export const MATHS_12: AwsHighlight[] = forClass("Class 12", [
  ["Relations and Functions", [
    ["Types of relations", "Classify as reflexive, symmetric, transitive and equivalence."],
    ["One-one and onto functions", "Prove injectivity and surjectivity."],
    ["Composition of functions", "Form and simplify f∘g."],
    ["Invertible functions", "Find the inverse and state when it exists."],
    ["Binary operations", "Test closure, associativity, identity and invertibility."],
  ]],
  ["Inverse Trigonometric Functions", [
    ["Domain and range of inverse functions", "State the principal value branches."],
    ["Principal values", "Evaluate arcsin, arccos and arctan at standard arguments."],
    ["Properties of inverse trigonometric functions", "Simplify sums and differences of inverse functions."],
  ]],
  ["Matrices", [
    ["Types of matrices", "Identify row, column, square, diagonal, scalar and identity matrices."],
    ["Addition and scalar multiplication", "Combine matrices of the same order."],
    ["Matrix multiplication", "Multiply conformable matrices and note non-commutativity."],
    ["Transpose and symmetric matrices", "Express any square matrix as symmetric plus skew-symmetric."],
    ["Elementary operations and inverse", "Find an inverse by row reduction."],
  ]],
  ["Determinants", [
    ["Determinant of a square matrix", "Expand along a row or column."],
    ["Properties of determinants", "Use row and column operations to simplify evaluation."],
    ["Area of a triangle by determinants", "Apply the coordinate determinant formula."],
    ["Minors, cofactors and adjoint", "Build the adjoint from cofactors."],
    ["Inverse of a matrix", "Apply A⁻¹ = adj(A)/|A| and the singular case."],
    ["Solving systems by matrices", "Use the matrix method and test consistency."],
  ]],
  ["Continuity and Differentiability", [
    ["Continuity at a point and on an interval", "Test using left and right limits."],
    ["Differentiability", "Relate differentiability to continuity."],
    ["Chain rule", "Differentiate composite functions."],
    ["Implicit differentiation", "Differentiate relations not solved for y."],
    ["Derivatives of exponential and logarithmic functions", "Differentiate eˣ, aˣ and log x."],
    ["Logarithmic differentiation", "Handle variable bases and products of many factors."],
    ["Parametric differentiation", "Find dy/dx when x and y depend on a parameter."],
    ["Second order derivatives", "Differentiate twice and interpret the result."],
    ["Rolle's and Mean Value theorems", "State conditions and apply both theorems."],
  ]],
  ["Applications of Derivatives", [
    ["Rate of change", "Relate connected rates in geometry and physics."],
    ["Increasing and decreasing functions", "Use the sign of the first derivative."],
    ["Tangents and normals", "Find their equations at a given point."],
    ["Approximations", "Estimate small changes using differentials."],
    ["Maxima and minima", "Apply first and second derivative tests."],
    ["Absolute maximum and minimum", "Compare critical points with endpoints."],
  ]],
  ["Integrals", [
    ["Integration as an inverse of differentiation", "Recognise standard antiderivatives."],
    ["Integration by substitution", "Change the variable to reduce to a standard form."],
    ["Integration using trigonometric identities", "Convert products and powers before integrating."],
    ["Integration by partial fractions", "Split a rational function into simpler terms."],
    ["Integration by parts", "Apply the product rule in reverse with ILATE."],
    ["Definite integrals as a limit of a sum", "Build the integral from Riemann sums."],
    ["Fundamental theorem of calculus", "Evaluate definite integrals via antiderivatives."],
    ["Properties of definite integrals", "Use symmetry and interval-splitting properties."],
  ]],
  ["Applications of the Integrals", [
    ["Area under simple curves", "Integrate to find the area bounded by a curve and an axis."],
    ["Area between two curves", "Subtract integrals over the region of overlap."],
    ["Area of regions bounded by lines and conics", "Combine straight and curved boundaries."],
  ]],
  ["Differential Equations", [
    ["Order and degree", "Classify a differential equation correctly."],
    ["Formation of a differential equation", "Eliminate arbitrary constants from a family of curves."],
    ["Variable separable method", "Separate and integrate both sides."],
    ["Homogeneous differential equations", "Substitute y = vx to reduce to separable form."],
    ["Linear differential equations", "Apply the integrating factor method."],
  ]],
  ["Vector Algebra", [
    ["Vectors and scalars", "Distinguish magnitude-only from magnitude-and-direction quantities."],
    ["Types of vectors", "Identify unit, zero, equal, collinear and position vectors."],
    ["Addition and scalar multiplication of vectors", "Apply the triangle and parallelogram laws."],
    ["Section formula for vectors", "Divide a segment internally and externally."],
    ["Scalar (dot) product", "Compute projections and the angle between vectors."],
    ["Vector (cross) product", "Find a perpendicular vector and the area of a parallelogram."],
  ]],
  ["Three Dimensional Geometry", [
    ["Direction cosines and ratios", "Describe a line's orientation in space."],
    ["Equation of a line in space", "Write vector and Cartesian forms."],
    ["Angle between two lines", "Apply the direction ratio formula."],
    ["Shortest distance between two lines", "Handle skew and parallel line cases."],
    ["Equation of a plane", "Use normal, intercept and three-point forms."],
    ["Angle between planes and a line and a plane", "Apply the relevant dot product formulas."],
    ["Distance of a point from a plane", "Apply the perpendicular distance formula."],
  ]],
  ["Linear Programming", [
    ["Formulating an LPP", "Express objective and constraints algebraically."],
    ["Feasible region", "Graph constraints and identify the feasible set."],
    ["Corner point method", "Evaluate the objective at vertices to optimise."],
    ["Bounded and unbounded regions", "Decide when an optimum exists."],
  ]],
  ["Probability", [
    ["Conditional probability", "Apply P(A|B) = P(A∩B)/P(B)."],
    ["Multiplication theorem", "Chain conditional probabilities."],
    ["Independent events", "Test independence and use it in computation."],
    ["Bayes' theorem", "Revise prior probabilities in the light of evidence."],
    ["Random variables and distributions", "Build a probability distribution and find its mean and variance."],
    ["Bernoulli trials and binomial distribution", "Apply the binomial formula to repeated independent trials."],
  ]],
]);

export const MATHS = [...MATHS_6, ...MATHS_7, ...MATHS_8, ...MATHS_9, ...MATHS_10, ...MATHS_11, ...MATHS_12];
