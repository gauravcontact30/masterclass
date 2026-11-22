import { quick } from "@/lib/quick-qa";

/* CAT and MBA entrance tests: quick questions with short answers. */
export default quick("cat", `
# Number System
What is a prime number? | A number greater than 1 with exactly two factors, 1 and itself.
How many primes are there below 100? | 25.
What is the divisibility rule for 4? | The last two digits form a number divisible by 4.
What is the divisibility rule for 8? | The last three digits form a number divisible by 8.
What is the divisibility rule for 11? | The difference between the sums of alternate digits is 0 or a multiple of 11.
How many factors does a number p^a × q^b have? | (a + 1)(b + 1).
What is the sum of the factors of p^a × q^b? | [(p^(a+1) − 1)/(p − 1)] × [(q^(b+1) − 1)/(q − 1)].
How many trailing zeros does 100! have? | 24.
How do you find the highest power of a prime p in n!? | Add n/p + n/p² + n/p³ … taking integer parts.
What is the unit-digit cycle of 2? | 2, 4, 8, 6.
What is the unit-digit cycle of 3? | 3, 9, 7, 1.
What is the unit-digit cycle of 7? | 7, 9, 3, 1.
What is Fermat's little theorem? | a^(p−1) leaves remainder 1 when divided by a prime p that does not divide a.
What is Wilson's theorem? | (p − 1)! + 1 is divisible by a prime p.
What is the remainder when a perfect square is divided by 4? | 0 or 1.
What is the product of two numbers in terms of LCM and HCF? | LCM × HCF.
What is the HCF of fractions? | HCF of numerators / LCM of denominators.
What is the LCM of fractions? | LCM of numerators / HCF of denominators.
What is the sum of the first n natural numbers? | n(n + 1)/2.
What is the sum of the cubes of the first n natural numbers? | [n(n + 1)/2]².
How many digits does 2¹⁰ have? | Four (1024).
What is a perfect number? | A number equal to the sum of its proper divisors, such as 6 and 28.
Which numbers have an odd number of factors? | Perfect squares.
What is Euler's totient of a prime p? | p − 1.
What is the base-2 form of 13? | 1101.

# Arithmetic
What is 1/7 as a percentage? | 14.28 per cent.
What is 1/9 as a percentage? | 11.11 per cent.
What is 1/11 as a percentage? | 9.09 per cent.
What is 3/8 as a percentage? | 37.5 per cent.
What is the net change for successive changes a% and b%? | a + b + ab/100.
If a price rises by 25 per cent, by how much must consumption fall to keep spending the same? | 20 per cent.
What is profit percentage? | (SP − CP)/CP × 100.
What is the markup? | (MP − CP)/CP × 100.
What is the net result of selling two items at the same price, one at x% gain and one at x% loss? | A loss of x²/100 per cent.
What is the simple interest formula? | PRT/100.
What is the difference between CI and SI for two years? | P(R/100)².
What is the rule of 72? | Doubling time ≈ 72 / rate of interest.
What is the weighted average? | Σwx / Σw.
What is the alligation rule? | Quantities mix in the ratio (dearer − mean) : (mean − cheaper).
After n replacements of x litres from V litres, how much original liquid remains? | V(1 − x/V)ⁿ.
What is average speed? | Total distance / total time.
What is the average speed for two equal distances at a and b? | 2ab/(a + b).
What is relative speed in the same direction? | The difference of the speeds.
How long does a train take to cross another train? | Sum of lengths / relative speed.
What is the upstream speed of a boat? | Boat speed − stream speed.
How often do two runners on a circular track meet (opposite directions)? | Every L/(a + b) time.
If A is twice as efficient as B, how do their times compare? | A takes half the time B takes.
What is the work formula with men, days and hours? | M₁D₁H₁/W₁ = M₂D₂H₂/W₂.
If pipes fill in a and b hours, how long together? | ab/(a + b) hours.
How are profits shared in a partnership? | In the ratio of capital × time.
What is compounded ratio of a : b and c : d? | ac : bd.
If a/b = c/d, what is componendo and dividendo? | (a + b)/(a − b) = (c + d)/(c − d).
What is the true discount? | The difference between the amount due and its present worth.
What is CAGR? | (Final / initial)^(1/n) − 1.
At how many degrees per minute does the minute hand move? | 6°.
At how many degrees per minute does the hour hand move? | 0.5°.
How many times do clock hands form a right angle in 12 hours? | 22.
How many odd days are there in 100 years? | 5.
What day was 1 January 2000? | Saturday.

# Algebra
What is the quadratic formula? | x = [−b ± √(b² − 4ac)]/2a.
What is the sum and product of roots of ax² + bx + c = 0? | −b/a and c/a.
When does a quadratic have its minimum? | At x = −b/2a, when a > 0.
What is the AM–GM inequality? | (a + b)/2 ≥ √(ab) for positive numbers.
For a fixed sum, when is a product maximum? | When the numbers are equal.
For a fixed product, when is a sum minimum? | When the numbers are equal.
What is |x| < a equivalent to? | −a < x < a.
What is |x| > a equivalent to? | x < −a or x > a.
What is logₐ(xy)? | logₐ x + logₐ y.
What is logₐ(xⁿ)? | n logₐ x.
What is logₐ a? | 1.
What is the change of base rule? | logₐ b = log b / log a.
What is a⁰? | 1, for a ≠ 0.
What is a^(m) × a^(n)? | a^(m+n).
What is the nth term of an AP? | a + (n − 1)d.
What is the sum of n terms of an AP? | n/2 [2a + (n − 1)d].
What is the nth term of a GP? | arⁿ⁻¹.
What is the sum of an infinite GP? | a/(1 − r).
What is the harmonic mean of a and b? | 2ab/(a + b).
What is a function? | A rule that assigns exactly one output to each input.
What is an even function? | f(−x) = f(x).
What is an odd function? | f(−x) = −f(x).
What is f(g(x)) called? | A composite function.
How many integer solutions does x + y = n have in positive integers? | n − 1.
How many non-negative integer solutions does x₁ + … + x(r) = n have? | (n + r − 1)C(r − 1).
What is the maximum of ax + by on a region? | It occurs at a corner point.
What is a³ + b³? | (a + b)(a² − ab + b²).
What is a³ + b³ + c³ − 3abc? | (a + b + c)(a² + b² + c² − ab − bc − ca).
If a + b + c = 0, what is a³ + b³ + c³? | 3abc.

# Geometry and Mensuration
What is the sum of the angles of a triangle? | 180°.
What is the triangle inequality? | The sum of any two sides is greater than the third.
What is the area of a triangle with sides a, b and included angle C? | ½ab sin C.
What is Heron's formula? | √[s(s − a)(s − b)(s − c)].
What is the inradius of a triangle? | Area / semi-perimeter.
What is the circumradius of a triangle? | abc / (4 × area).
In what ratio does the centroid divide a median? | 2 : 1.
What is the angle bisector theorem? | The bisector divides the opposite side in the ratio of the adjacent sides.
What is Apollonius's theorem? | AB² + AC² = 2(AD² + BD²), where AD is a median.
Name three Pythagorean triplets. | 3-4-5, 5-12-13 and 8-15-17.
What are the sides of a 30-60-90 triangle in ratio? | 1 : √3 : 2.
What are the sides of a 45-45-90 triangle in ratio? | 1 : 1 : √2.
What is the area of an equilateral triangle? | (√3/4)a².
What is the ratio of areas of similar triangles? | The square of the ratio of sides.
What is the sum of interior angles of an n-gon? | (n − 2) × 180°.
What is the area of a regular hexagon of side a? | (3√3/2)a².
What is the area of a trapezium? | ½ × (sum of parallel sides) × height.
What is the area of a rhombus? | ½ × product of diagonals.
What is the angle subtended by a diameter on the circle? | 90°.
What is the tangent–secant theorem? | Tangent² = product of the whole secant and its external part.
What is the intersecting chords theorem? | PA × PB = PC × PD.
What is the length of an arc? | (θ/360) × 2πr.
What is the area of a sector? | (θ/360) × πr².
What is the volume of a sphere? | 4⁄3 πr³.
What is the surface area of a sphere? | 4πr².
What is the volume of a cylinder? | πr²h.
What is the curved surface area of a cone? | πrl.
What is the diagonal of a cube? | √3 a.
What is the distance between two points? | √[(x₂ − x₁)² + (y₂ − y₁)²].
What is the slope of a line? | (y₂ − y₁)/(x₂ − x₁).
When are two lines perpendicular? | When the product of their slopes is −1.

# Modern Mathematics
What is n!? | n × (n − 1) × … × 1.
What is ⁿPᵣ? | n!/(n − r)!.
What is ⁿCᵣ? | n!/[r!(n − r)!].
How many ways can the letters of a word with repeats be arranged? | n!/(p! q! …).
How many circular arrangements of n objects are there? | (n − 1)!.
How many ways can n identical items be given to r people? | (n + r − 1)C(r − 1).
What is the number of derangements of 4 objects? | 9.
How many handshakes are there among n people? | n(n − 1)/2.
How many diagonals does a decagon have? | 35.
What is the probability of an event? | Favourable outcomes / total outcomes.
What is P(A or B)? | P(A) + P(B) − P(A and B).
What is P(A and B) for independent events? | P(A) × P(B).
What is conditional probability? | P(A|B) = P(A and B)/P(B).
What is the probability of a sum of 7 with two dice? | 1/6.
What is the probability of drawing two aces from a pack without replacement? | 1/221.
What is the expected value? | Σ(value × probability).
How many subsets does a set of n elements have? | 2ⁿ.
What is n(A ∪ B)? | n(A) + n(B) − n(A ∩ B).
What is the three-set union formula? | n(A) + n(B) + n(C) − n(A∩B) − n(B∩C) − n(A∩C) + n(A∩B∩C).
What is the binomial theorem's general term? | ⁿCᵣ aⁿ⁻ʳ bʳ.

# Data Interpretation and Logical Reasoning
What is the percentage change formula? | (New − old)/old × 100.
What is a percentage point? | The simple difference between two percentages.
How is a share found from a pie chart in degrees? | (Angle/360) × total.
What is growth rate? | Change over a period divided by the starting value.
What is the fastest way to compare two fractions? | Cross-multiply.
What is the first step in a DI set? | Read the titles, units, axes and footnotes.
What is a caselet? | A DI set presented as a paragraph of data.
What is a Venn diagram used for? | Showing overlaps between sets.
What is a linear arrangement? | Placing people or objects in a row according to given conditions.
What is a circular arrangement's key idea? | Fix one position and place the others relative to it.
What is a matrix puzzle? | Matching several attributes of people using a grid.
What is the first step in an arrangement puzzle? | Note the definite clues first, then the conditional ones.
How many matches are played in a knockout of n teams? | n − 1.
How many matches are played in a round robin of n teams? | n(n − 1)/2.
In a blood relation puzzle, what should be drawn? | A family tree.
What is a binary logic question? | People who always tell the truth, always lie or alternate.
What is a cubes question? | Counting small cubes with a given number of painted faces.
How many small cubes have three painted faces in a painted cube? | Eight, the corners.
How many small cubes have no painted face in an n × n × n cube? | (n − 2)³.
What is a games-and-tournaments set? | A set on scores, rounds and rankings of players.
What is a network or routes set? | A set on paths, flows and costs between nodes.
What is data sufficiency? | Deciding whether given statements are enough to answer a question.
In a syllogism, what follows from 'All A are B' and 'All B are C'? | All A are C.
What is the strategy for DILR in CAT? | Pick the sets you can finish; skipping the hardest set is part of the test.

# Verbal Ability and Reading Comprehension
What is the main idea of a passage? | The central point the author makes.
What is the tone of a passage? | The author's attitude to the subject.
What is an inference? | A conclusion that must be true from what the passage states.
What is an assumption? | An unstated premise the argument depends on.
What strengthens an argument? | A fact that makes the conclusion more likely.
What weakens an argument? | A fact that makes the conclusion less likely.
What is a para-jumble? | Sentences to be arranged into a coherent paragraph.
What helps to solve a para-jumble? | Mandatory pairs, connectors, pronouns and the opening sentence.
What is an odd-sentence-out question? | Finding the sentence that does not fit the paragraph.
What is a para-summary question? | Choosing the option that best captures the author's position.
What should a good summary avoid? | New ideas, extreme words and minor details.
What is a critical reasoning paradox question? | Finding a fact that explains two seemingly conflicting statements.
What is correlation versus causation? | Two things occurring together does not prove one causes the other.
What is an ad hominem argument? | Attacking the person instead of the argument.
What is a straw man argument? | Misrepresenting a view to attack it more easily.
What is circular reasoning? | Using the conclusion as a premise.
Give a synonym of 'pragmatic'. | Practical.
Give a synonym of 'ambivalent'. | Having mixed feelings.
Give a synonym of 'ephemeral'. | Short-lived.
Give a synonym of 'cogent'. | Convincing.
Give an antonym of 'candid'. | Evasive.
Give an antonym of 'frugal'. | Extravagant.
Give an antonym of 'mitigate'. | Aggravate.
What does 'laconic' mean? | Using very few words.
What does 'esoteric' mean? | Understood by only a few.
What does 'dichotomy' mean? | A division into two opposed parts.
What does 'paradigm' mean? | A model or pattern.
What does 'anomaly' mean? | Something that deviates from the normal.
How many RC passages does CAT usually have? | Four.
What is the best way to improve RC? | Regular reading of varied, dense material and reviewing mistakes.

# Exam, WAT and Interview
How many sections does CAT have? | Three: VARC, DILR and QA.
How long is each CAT section? | 40 minutes.
What is the marking scheme of CAT? | +3 for a correct answer and −1 for a wrong MCQ; no negative marks for TITA.
What does TITA stand for? | Type In The Answer.
Who conducts CAT? | The IIMs, by rotation.
What does XAT have that CAT does not? | A Decision Making section.
What is a percentile? | The percentage of test-takers who scored below you.
What does WAT stand for? | Written Ability Test.
What does PI stand for? | Personal Interview.
What does GD stand for? | Group Discussion.
What is the usual structure of a WAT essay? | Introduction, two or three argument paragraphs, the other side and a conclusion.
What is the first question in most interviews? | Tell me about yourself.
What should an answer to 'Why MBA?' include? | Your background, the gap you want to fill and your goals.
What is a SWOT analysis? | Strengths, weaknesses, opportunities and threats.
What are the four Ps of marketing? | Product, price, place and promotion.
What is ROI? | Return on investment.
What is a balance sheet? | A statement of assets, liabilities and equity on a date.
What is working capital? | Current assets minus current liabilities.
What is a start-up unicorn? | A privately held start-up valued at over one billion dollars.
What is opportunity cost? | The value of the next best alternative given up.
What is inflation? | A sustained rise in the general price level.
What is GDP? | The value of final goods and services produced in a country in a year.
What is the repo rate? | The rate at which the RBI lends to banks.
What is market segmentation? | Dividing a market into groups with similar needs.
What is a case interview? | An interview in which a business problem is solved aloud.
`);
