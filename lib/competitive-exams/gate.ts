import { obj, pack, sub } from "./types";

/* GATE: General Aptitude, Engineering Mathematics and the common core of CS, EC and ME papers. Subjective: worked problems and PSU interview questions. */
export default pack("gate", [
  obj("General Aptitude", 5, "GATE 2018, GATE 2021 (all papers)", "If 60% of a number is 90, what is 80% of the number?", ["100", "110", "120", "150"], 2, "The number is 90/0.6 = 150, and 80% of 150 is 120."),
  obj("General Aptitude", 4, "GATE 2019, GATE 2022 (all papers)", "Choose the word that best completes: 'The committee reached a ____ decision; not one member disagreed.'", ["unanimous", "anonymous", "ambiguous", "tentative"], 0, "Unanimous means agreed by everyone."),
  obj("Engineering Mathematics", 5, "GATE CS 2017, GATE EC 2020", "The eigenvalues of the matrix [[2, 0], [0, 3]] are", ["0 and 5", "2 and 3", "1 and 6", "−2 and −3"], 1, "The eigenvalues of a diagonal matrix are its diagonal entries."),
  obj("Engineering Mathematics", 5, "GATE ME 2018, GATE CS 2021", "The rank of a 3 × 3 matrix whose determinant is non-zero is", ["0", "1", "2", "3"], 3, "A non-singular n × n matrix has full rank n."),
  obj("Engineering Mathematics", 4, "GATE EC 2019, GATE ME 2022", "A fair coin is tossed three times. The probability of getting exactly two heads is", ["1/8", "1/4", "3/8", "1/2"], 2, "³C₂ × (1/2)³ = 3/8."),
  obj("Computer Science", 5, "GATE CS 2016, GATE CS 2020", "The time complexity of binary search on a sorted array of n elements is", ["O(1)", "O(log n)", "O(n)", "O(n log n)"], 1, "Each comparison halves the search interval."),
  obj("Computer Science", 5, "GATE CS 2017, GATE CS 2021", "Which page-replacement algorithm suffers from Belady's anomaly?", ["LRU", "Optimal", "FIFO", "LFU"], 2, "With FIFO, adding frames can increase page faults; stack algorithms such as LRU and Optimal do not show it."),
  obj("Computer Science", 4, "GATE CS 2018, GATE CS 2022", "Which of these languages is accepted by a pushdown automaton but not by a finite automaton?", ["a*b*", "(ab)*", "aⁿbⁿ, n ≥ 0", "(a + b)*"], 2, "aⁿbⁿ is context-free but not regular, since it needs unbounded counting."),
  obj("Electronics", 4, "GATE EC 2017, GATE EC 2021", "The Fourier transform of a unit impulse δ(t) is", ["0", "1", "δ(f)", "1/jω"], 1, "The impulse contains all frequencies with equal weight."),
  obj("Electronics", 4, "GATE EC 2018, GATE EE 2020", "An ideal operational amplifier has", ["zero input impedance and infinite output impedance", "infinite input impedance and zero output impedance", "infinite input and output impedance", "zero input and output impedance"], 1, "It also has infinite open-loop gain and bandwidth."),
  obj("Mechanical", 4, "GATE ME 2017, GATE ME 2021", "In a reversible adiabatic process, which quantity stays constant?", ["Temperature", "Pressure", "Entropy", "Enthalpy"], 2, "dS = δQ(rev)/T = 0, so the process is isentropic."),
  obj("Mechanical", 4, "GATE ME 2018, GATE ME 2022", "The Reynolds number is the ratio of", ["inertia force to viscous force", "viscous force to inertia force", "gravity force to inertia force", "pressure force to viscous force"], 0, "Re = ρVD/μ; a low value indicates laminar flow."),
  obj("Computer Science", 4, "GATE CS 2016, GATE CS 2021", "How many edges does a tree with n vertices have?", ["n", "n − 1", "n + 1", "n(n − 1)/2"], 1, "A tree is connected and acyclic, which fixes the edge count at n − 1."),
  obj("Engineering Mathematics", 4, "GATE ME 2017, GATE EC 2021", "The derivative of e^(2x) with respect to x is", ["e^(2x)", "2e^(2x)", "2xe^(2x)", "e^(2x)/2"], 1, "By the chain rule, d/dx e^(2x) = 2e^(2x)."),
  obj("General Aptitude", 4, "GATE 2019, GATE 2023 (all papers)", "If A is 20% more than B, then B is what per cent less than A?", ["16.67%", "20%", "25%", "83.33%"], 0, "A = 1.2B, so B is 0.2/1.2 = 16.67% less than A."),
], [
  sub("Computer Science", 5, "GATE CS 2016, 2019, 2022", "Solve the recurrence T(n) = 2T(n/2) + n using the Master theorem.", [
    "Compare with T(n) = aT(n/b) + f(n): a = 2, b = 2, f(n) = n.",
    "n^(log_b a) = n^(log₂ 2) = n.",
    "f(n) = Θ(n), which matches n^(log_b a), so case 2 applies.",
    "T(n) = Θ(n log n), the running time of merge sort.",
  ]),
  sub("Computer Science", 4, "GATE CS 2015, 2018, 2021", "State the four necessary conditions for deadlock.", [
    "Mutual exclusion: at least one resource is non-shareable.",
    "Hold and wait: a process holds a resource while waiting for another.",
    "No pre-emption: a resource cannot be taken away forcibly.",
    "Circular wait: a closed chain of processes, each waiting for a resource held by the next.",
    "All four must hold together; preventing any one prevents deadlock.",
  ]),
  sub("Engineering Mathematics", 5, "GATE 2017, 2020, 2023 (all papers)", "Find the eigenvalues of the matrix [[4, 1], [2, 3]].", [
    "Characteristic equation: |A − λI| = 0.",
    "(4 − λ)(3 − λ) − 2 = 0.",
    "λ² − 7λ + 10 = 0.",
    "(λ − 2)(λ − 5) = 0, so λ = 2 and λ = 5.",
    "Check: the sum 7 equals the trace and the product 10 equals the determinant.",
  ]),
  sub("Electronics", 4, "GATE EC 2016, 2019, 2022", "State the Nyquist sampling theorem and explain aliasing.", [
    "A signal band-limited to f(max) can be recovered exactly from its samples if the sampling rate is greater than 2 f(max).",
    "2 f(max) is called the Nyquist rate.",
    "Sampling below this rate makes the shifted spectra overlap.",
    "High frequencies then appear as lower ones; this is aliasing.",
    "An anti-aliasing low-pass filter before the sampler prevents it.",
  ]),
  sub("Mechanical", 4, "GATE ME 2017, 2020", "A Carnot engine receives 1000 kJ of heat at 800 K and rejects heat at 300 K. Find the work output.", [
    "Efficiency η = 1 − T(L)/T(H) = 1 − 300/800.",
    "η = 0.625.",
    "Work = η × Q(H) = 0.625 × 1000.",
    "W = 625 kJ, and the heat rejected is 375 kJ.",
  ]),
  sub("PSU Interview", 3, "PSU interviews through GATE, asked every year", "Why do you want to join a public sector undertaking instead of going for M.Tech?", [
    "Say what draws you to the company: the scale of its projects and the chance to apply core engineering.",
    "Mention stability and structured training honestly, without making them the only reason.",
    "Show you know the company's products, plants and recent projects.",
    "Leave room for learning: many PSUs sponsor higher study later.",
  ]),
  sub("Computer Science", 4, "GATE CS 2016, 2019, 2022 and PSU interviews", "Explain the ACID properties of a transaction.", [
    "Atomicity: a transaction happens completely or not at all.",
    "Consistency: it takes the database from one valid state to another.",
    "Isolation: concurrent transactions do not see each other's intermediate results.",
    "Durability: once committed, the changes survive a crash.",
  ]),
  sub("Electronics", 4, "GATE EC 2017, 2020 and PSU interviews", "Differentiate between combinational and sequential circuits.", [
    "Combinational: the output depends only on the present inputs; there is no memory.",
    "Sequential: the output depends on present inputs and past state, held in flip-flops.",
    "Sequential circuits usually need a clock; combinational circuits do not.",
    "Examples: adders and multiplexers are combinational; counters and registers are sequential.",
  ]),
]);
