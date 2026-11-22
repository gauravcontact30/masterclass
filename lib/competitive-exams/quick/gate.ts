import { quick } from "@/lib/quick-qa";

/* GATE: quick questions with short answers on General Aptitude, Engineering Mathematics and core CS, EC, EE, ME and CE topics. */
export default quick("gate", `
# General Aptitude
What is the formula for percentage change? | (Change / original) × 100.
If A is x per cent more than B, how much less is B than A? | x/(100 + x) × 100 per cent.
What is the average speed for equal distances at speeds a and b? | 2ab/(a + b).
What is the compound interest amount? | P(1 + r/100)ⁿ.
If A and B finish a job in x and y days, how long together? | xy/(x + y) days.
What is the probability of at least one head in n tosses? | 1 − (1/2)ⁿ.
How many ways can n distinct objects be arranged in a row? | n!.
How many ways can n people sit round a table? | (n − 1)!.
What is the sum of an arithmetic series? | n/2 × (first + last).
What is the sum of an infinite geometric series? | a/(1 − r), for |r| < 1.
What is the angle between clock hands at h hours m minutes? | |30h − 5.5m| degrees.
What is the number of diagonals of an n-sided polygon? | n(n − 3)/2.
What is the area of an equilateral triangle of side a? | (√3/4)a².
What is the volume of a cone? | ⅓πr²h.
What is a syllogism? | A conclusion drawn from two premises.
What is an analogy question? | Finding a pair with the same relationship as a given pair.
What is the difference between 'affect' and 'effect'? | 'Affect' is usually a verb; 'effect' is usually a noun.
What is the difference between 'its' and 'it's'? | 'Its' shows possession; 'it's' means 'it is'.
Give a synonym of 'ubiquitous'. | Omnipresent.
Give an antonym of 'verbose'. | Concise.
What is the median? | The middle value of ordered data.
What is the mode? | The most frequent value.
What is log₁₀ 1000? | 3.
What is the unit digit of 7⁴? | 1.
What is the relation between LCM and HCF? | LCM × HCF = product of the two numbers.

# Engineering Mathematics
What is the rank of a matrix? | The number of linearly independent rows or columns.
When does AX = B have a unique solution? | When rank(A) = rank([A|B]) = number of unknowns.
When does AX = 0 have a non-trivial solution? | When |A| = 0.
What are eigenvalues? | Roots of |A − λI| = 0.
What is the sum of the eigenvalues? | The trace of the matrix.
What is the product of the eigenvalues? | The determinant of the matrix.
What are the eigenvalues of a triangular matrix? | Its diagonal entries.
What are the eigenvalues of a real symmetric matrix? | Always real.
State the Cayley–Hamilton theorem. | Every square matrix satisfies its own characteristic equation.
What is an orthogonal matrix? | A matrix with AAᵀ = I.
State the mean value theorem. | f′(c) = [f(b) − f(a)]/(b − a) for some c in (a, b).
What is the Taylor series of eˣ? | 1 + x + x²/2! + x³/3! + …
What is the Taylor series of sin x? | x − x³/3! + x⁵/5! − …
What is the gradient of a scalar field? | A vector pointing in the direction of greatest increase.
What is the divergence of a curl? | Zero.
What is the curl of a gradient? | Zero.
State Green's theorem. | It relates a line integral round a closed curve to a double integral over the region inside.
State Stokes' theorem. | The line integral of F round a curve equals the surface integral of curl F.
State Gauss's divergence theorem. | The flux of F through a closed surface equals the volume integral of div F.
What is the Laplace transform of 1? | 1/s.
What is the Laplace transform of e^(at)? | 1/(s − a).
What is the Laplace transform of sin at? | a/(s² + a²).
What is the Laplace transform of tⁿ? | n!/s^(n+1).
What is the integrating factor of y′ + Py = Q? | e^(∫P dx).
What is the auxiliary equation of ay″ + by′ + cy = 0? | am² + bm + c = 0.
What are the Cauchy–Riemann equations? | uₓ = v(y) and u(y) = −vₓ.
State Cauchy's integral theorem. | The integral of an analytic function round a closed curve is zero.
What is the mean of a Poisson distribution? | λ, which also equals its variance.
What is the mean and variance of a binomial distribution? | np and npq.
What fraction of a normal distribution lies within one standard deviation? | About 68 per cent.
What is the Newton–Raphson formula? | xₙ₊₁ = xₙ − f(xₙ)/f′(xₙ).
What is the order of convergence of Newton–Raphson? | Two (quadratic).
What is the error order of the trapezoidal rule? | h².
What is the error order of Simpson's one-third rule? | h⁴.
State Bayes' theorem. | P(A|B) = P(B|A)P(A)/P(B).

# Computer Science
What is the time complexity of binary search? | O(log n).
What is the time complexity of merge sort? | O(n log n) in all cases.
What is the worst case of quicksort? | O(n²).
What is the time complexity of heap sort? | O(n log n).
What is the time to build a heap? | O(n).
What is the lower bound of comparison sorting? | Ω(n log n).
What is the Master theorem for? | Solving recurrences of the form T(n) = aT(n/b) + f(n).
What is the complexity of Dijkstra's algorithm with a binary heap? | O((V + E) log V).
Which algorithm finds shortest paths with negative edges? | Bellman–Ford.
Which algorithm finds all-pairs shortest paths? | Floyd–Warshall, O(V³).
Name two minimum spanning tree algorithms. | Kruskal's and Prim's.
What is dynamic programming? | Solving a problem by storing solutions of overlapping subproblems.
What is a greedy algorithm? | One that makes the locally best choice at each step.
What is the height of a balanced binary tree with n nodes? | O(log n).
How many binary trees are possible with n nodes? | The Catalan number, (2n)!/[(n + 1)! n!].
What is a regular language accepted by? | A finite automaton.
What is a context-free language accepted by? | A pushdown automaton.
Is the halting problem decidable? | No.
What is the pumping lemma used for? | To prove that a language is not regular (or not context-free).
What are the phases of a compiler? | Lexical analysis, syntax analysis, semantic analysis, intermediate code, optimisation and code generation.
What is an LL(1) parser? | A top-down parser reading left to right with one lookahead symbol.
What is an LR parser? | A bottom-up shift-reduce parser.
What is a process control block? | The data structure holding the state of a process.
What is a context switch? | Saving one process's state and loading another's.
Which scheduling gives minimum average waiting time? | Shortest job first.
What is Belady's anomaly? | More frames causing more page faults in FIFO.
What is the Banker's algorithm for? | Deadlock avoidance.
What is a critical section? | Code that accesses shared data and must run exclusively.
What is internal fragmentation? | Wasted space inside an allocated block.
What is a page table? | A table mapping virtual pages to physical frames.
What is a TLB? | A cache of recent page-table entries.
What is 3NF? | A relation in 2NF with no transitive dependency of non-prime attributes on a key.
What is BCNF? | Every determinant is a candidate key.
What is a lossless join? | A decomposition from which the original relation can be rebuilt exactly.
What is two-phase locking? | A protocol with a growing phase and a shrinking phase that ensures serialisability.
What is the size of an IPv4 address? | 32 bits.
What is subnetting? | Dividing a network into smaller networks.
What is the three-way handshake? | SYN, SYN-ACK, ACK to set up a TCP connection.
Which layer does TCP belong to? | The transport layer.
What is CSMA/CD used in? | Classic Ethernet.
What is a sliding window protocol? | A flow-control method that allows several frames in transit.
What is the Hamming distance? | The number of bit positions in which two code words differ.
What is the minimum distance to correct t errors? | 2t + 1.
What is a cache hit ratio? | Hits divided by total memory accesses.
What is Amdahl's law? | Speed-up is limited by the fraction of a task that cannot be parallelised.
What are the pipeline hazards? | Structural, data and control hazards.
How many minterms does an n-variable function have? | 2ⁿ.
What is a Karnaugh map used for? | Simplifying Boolean expressions.

# Electronics and Communication
What is the built-in potential of a silicon p-n junction? | About 0.7 V.
What is the Early effect? | Base-width modulation in a BJT with collector voltage.
What is the threshold voltage of a MOSFET? | The gate voltage at which a conducting channel forms.
What are the regions of a MOSFET? | Cut-off, triode (linear) and saturation.
What is the gain–bandwidth product? | A constant for an op-amp: gain × bandwidth.
What is the slew rate? | The maximum rate of change of an op-amp's output voltage.
What is the gain of a non-inverting amplifier? | 1 + R(f)/R₁.
What is a Schmitt trigger? | A comparator with hysteresis.
What is the Nyquist rate? | Twice the highest frequency of the signal.
What is aliasing? | Overlap of spectra when sampling below the Nyquist rate.
What is the Fourier transform of an impulse? | 1.
What is the Fourier transform of a rectangular pulse? | A sinc function.
State Parseval's theorem. | Energy in the time domain equals energy in the frequency domain.
What is a causal system? | One whose output depends only on present and past inputs.
What is BIBO stability? | Every bounded input gives a bounded output.
When is a discrete LTI system stable? | When all poles lie inside the unit circle.
When is a continuous LTI system stable? | When all poles lie in the left half of the s-plane.
What is the z-transform of a unit step? | z/(z − 1).
What is the bandwidth of AM? | 2f(m).
What is Carson's rule? | FM bandwidth ≈ 2(Δf + f(m)).
What is the Shannon capacity? | C = B log₂(1 + S/N).
What is the modulation index of AM? | The ratio of message amplitude to carrier amplitude.
What is PCM? | Pulse code modulation: sampling, quantising and encoding.
What is the quantisation SNR per bit? | About 6 dB per bit.
What is the characteristic impedance of a lossless line? | √(L/C).
What is VSWR? | (1 + |Γ|)/(1 − |Γ|).
What is the dominant mode of a rectangular waveguide? | TE₁₀.
What is the intrinsic impedance of free space? | 377 Ω.
State Maxwell's equation for Faraday's law. | curl E = −∂B/∂t.
What is the Routh–Hurwitz criterion for? | Testing stability from the characteristic equation.
What is the phase margin? | 180° plus the phase at the gain crossover frequency.
What does a root locus show? | The path of closed-loop poles as gain varies.
What is the steady-state error of a type-1 system to a step? | Zero.
What is the damping ratio for critical damping? | 1.

# Electrical Engineering
State Thevenin's theorem. | A linear network is equivalent to a voltage source in series with a resistance.
State Norton's theorem. | A linear network is equivalent to a current source in parallel with a resistance.
State the superposition theorem. | The response is the sum of responses to each source acting alone.
State the maximum power transfer theorem. | Load resistance equals source resistance.
What is the power in a three-phase system? | √3 V(L) I(L) cos φ.
What is the relation between line and phase voltage in star? | V(L) = √3 V(ph).
What is the emf equation of a transformer? | E = 4.44 f N φ(m).
When is transformer efficiency maximum? | When copper loss equals iron loss.
What is the synchronous speed? | 120f/P rpm.
What is slip? | (Nₛ − N)/Nₛ.
What is the back emf of a DC motor? | V − Iₐ Rₐ.
Which test finds the iron loss of a transformer? | The open-circuit test.
Which test finds the copper loss of a transformer? | The short-circuit test.
What is the power factor? | The cosine of the angle between voltage and current.
What is a per-unit value? | Actual value divided by base value.
What is a thyristor (SCR)? | A four-layer device that conducts after a gate trigger.
What does a chopper do? | Converts fixed DC to variable DC.
What does an inverter do? | Converts DC to AC.
What is the Ferranti effect? | Receiving-end voltage higher than sending-end on a lightly loaded long line.
What is the skin effect? | Tendency of AC to flow near the surface of a conductor.

# Mechanical Engineering
State the first law for a closed system. | Q − W = ΔU.
What is the steady flow energy equation? | h₁ + V₁²/2 + gz₁ + q = h₂ + V₂²/2 + gz₂ + w.
What is the Carnot efficiency? | 1 − T(L)/T(H).
What is the COP of a refrigerator? | Q(L)/W.
What is the Clausius inequality? | The cyclic integral of δQ/T ≤ 0.
What is the air-standard efficiency of the Otto cycle? | 1 − 1/r^(γ−1).
What is the bending equation? | M/I = σ/y = E/R.
What is the torsion equation? | T/J = τ/r = Gθ/L.
What is Euler's buckling load? | π²EI/L(e)².
What is the relation between E, G and ν? | E = 2G(1 + ν).
What is the hoop stress in a thin cylinder? | pd/2t.
What is the longitudinal stress in a thin cylinder? | pd/4t.
What is the natural frequency of a spring–mass system? | √(k/m).
What is Grashof's law? | The sum of the shortest and longest links is not greater than the sum of the other two for continuous rotation.
What is the Reynolds number? | ρVD/μ.
What is the Darcy–Weisbach equation? | h(f) = fLV²/2gD.
What is the friction factor for laminar pipe flow? | 64/Re.
What is the Nusselt number? | hL/k.
What is the Prandtl number? | μCₚ/k.
What is LMTD? | Log mean temperature difference: (ΔT₁ − ΔT₂)/ln(ΔT₁/ΔT₂).
What is the critical radius of insulation for a cylinder? | k/h.
What is Taylor's tool life equation? | VTⁿ = C.
What is the eutectoid composition of steel? | 0.8 per cent carbon.
What is EOQ? | Economic order quantity: √(2DC₀/Cₕ).
What is the Merchant circle used for? | Analysing forces in metal cutting.

# Civil Engineering
What is the slump test for? | The workability of concrete.
What is the characteristic strength of M20 concrete? | 20 N/mm² at 28 days.
What is the initial setting time of ordinary Portland cement? | Not less than 30 minutes.
What is the modular ratio? | E(steel)/E(concrete).
What is the void ratio? | Volume of voids / volume of solids.
What is porosity? | Volume of voids / total volume.
State Darcy's law. | v = ki.
What is the plasticity index? | Liquid limit − plastic limit.
What is effective stress? | Total stress − pore water pressure.
What is Terzaghi's bearing capacity equation for a strip footing? | q(u) = cN(c) + qN(q) + 0.5γBN(γ).
What is Manning's formula? | V = (1/n) R^(2/3) S^(1/2).
What is the Froude number? | V/√(gD).
What is a hydraulic jump? | A sudden change from supercritical to subcritical flow.
What is BOD? | Biochemical oxygen demand.
What is the super-elevation formula? | e + f = V²/127R.
What is a bench mark? | A point of known elevation.
What is the fineness modulus? | An index of the coarseness of aggregate.
What is the degree of static indeterminacy? | Number of unknown reactions minus number of equilibrium equations.
What is the moment at the centre of a simply supported beam with UDL? | wL²/8.
What is the deflection at the centre of a simply supported beam with UDL? | 5wL⁴/384EI.
`);
