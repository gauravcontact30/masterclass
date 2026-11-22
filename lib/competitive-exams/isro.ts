import { obj, pack, sub } from "./types";

/* ISRO Scientist/Engineer (ICRB) written test in Electronics, Mechanical and Computer Science, with technical-interview questions as the subjective set. */
export default pack("isro", [
  obj("Computer Science", 5, "ISRO CS 2017, ISRO CS 2020", "What is the worst-case time complexity of quicksort?", ["O(n)", "O(n log n)", "O(n²)", "O(log n)"], 2, "When the pivot is always the smallest or largest element, the partitions are of size 0 and n − 1, giving O(n²)."),
  obj("Computer Science", 5, "ISRO CS 2016, ISRO CS 2018", "Which data structure is used to implement recursion?", ["Queue", "Stack", "Heap", "Linked list"], 1, "Each call's activation record is pushed on the call stack and popped on return."),
  obj("Computer Science", 4, "ISRO CS 2015, ISRO CS 2020", "How many layers does the OSI reference model have?", ["4", "5", "6", "7"], 3, "Physical, data link, network, transport, session, presentation and application."),
  obj("Computer Science", 4, "ISRO CS 2017, ISRO CS 2023", "Which normal form requires that every determinant be a candidate key?", ["2NF", "3NF", "BCNF", "4NF"], 2, "Boyce–Codd normal form: for every non-trivial functional dependency X → Y, X is a superkey."),
  obj("Electronics", 5, "ISRO EC 2016, ISRO EC 2019", "How many flip-flops are needed to build a MOD-10 counter?", ["3", "4", "5", "10"], 1, "2³ = 8 is less than 10, so four flip-flops (16 states) are needed."),
  obj("Electronics", 5, "ISRO EC 2015, ISRO EC 2018", "In a bipolar junction transistor operating in the active region, the", ["emitter junction is forward biased and the collector junction reverse biased", "both junctions are forward biased", "both junctions are reverse biased", "emitter junction is reverse biased and the collector junction forward biased"], 0, "Both forward biased is saturation; both reverse biased is cut-off."),
  obj("Electronics", 4, "ISRO EC 2017, ISRO EC 2020", "According to the Nyquist criterion, a signal band-limited to 4 kHz must be sampled at a rate of at least", ["2 kHz", "4 kHz", "8 kHz", "16 kHz"], 2, "The sampling rate must be at least twice the highest frequency."),
  obj("Mechanical", 5, "ISRO ME 2016, ISRO ME 2019", "The efficiency of a Carnot engine working between 600 K and 300 K is", ["25%", "50%", "75%", "100%"], 1, "η = 1 − T₂/T₁ = 1 − 300/600 = 0.5."),
  obj("Mechanical", 4, "ISRO ME 2015, ISRO ME 2018", "Bernoulli's equation is a statement of the conservation of", ["mass", "momentum", "energy", "angular momentum"], 2, "Pressure, kinetic and potential energy per unit weight stay constant along a streamline of an ideal fluid."),
  obj("Mechanical", 4, "ISRO ME 2017, ISRO ME 2020", "For most metals, the value of Poisson's ratio lies between", ["0 and 0.1", "0.25 and 0.35", "0.5 and 0.6", "0.75 and 1"], 1, "Steel is about 0.3; the theoretical upper limit for an isotropic material is 0.5."),
  obj("Space GK", 5, "ISRO interviews and written 2019 to 2023", "Which launch vehicle carried Chandrayaan-3 in July 2023?", ["PSLV-C57", "GSLV Mk II", "LVM3-M4", "SSLV-D2"], 2, "LVM3-M4 launched Chandrayaan-3 from Sriharikota on 14 July 2023; the lander touched down on 23 August 2023."),
  obj("Space GK", 4, "ISRO Technical Assistant 2018, 2022", "Where is the Vikram Sarabhai Space Centre located?", ["Bengaluru", "Sriharikota", "Thiruvananthapuram", "Ahmedabad"], 2, "VSSC, the lead centre for launch vehicles, is at Thumba, Thiruvananthapuram."),
  obj("Computer Science", 4, "ISRO CS 2016, ISRO CS 2020", "Which CPU scheduling algorithm can lead to starvation of long processes?", ["First come, first served", "Round robin", "Shortest job first", "None of these"], 2, "A steady stream of short jobs can keep a long job waiting indefinitely under SJF."),
  obj("Electronics", 4, "ISRO EC 2015, ISRO EC 2019", "Which of the following is a universal gate?", ["AND", "OR", "XOR", "NAND"], 3, "Any Boolean function can be built from NAND gates alone, and likewise from NOR gates."),
  obj("Mechanical", 4, "ISRO ME 2016, ISRO ME 2020", "The SI unit of thermal conductivity is", ["W/m²K", "W/mK", "J/kgK", "W/K"], 1, "From Fourier's law, q = −kA dT/dx, k has the unit W/m·K."),
], [
  sub("Space Technology", 5, "ISRO interviews, asked almost every year", "What is the difference between PSLV and GSLV?", [
    "PSLV: four stages, alternating solid and liquid; places about 1.75 tonnes in sun-synchronous polar orbit.",
    "GSLV Mk II: three stages with an indigenous cryogenic upper stage; places about 2.2 tonnes in geosynchronous transfer orbit.",
    "LVM3 (GSLV Mk III): two solid strap-ons, a liquid core and the CE-20 cryogenic stage; about 4 tonnes to GTO.",
    "PSLV is the workhorse for earth-observation satellites; GSLV and LVM3 launch heavier communication satellites and missions such as Chandrayaan.",
  ]),
  sub("Space Technology", 5, "ISRO interviews 2016 to 2023", "What is a geostationary orbit? Why are communication satellites placed in it?", [
    "A circular orbit above the equator at about 35,786 km altitude.",
    "The orbital period equals one sidereal day, so the satellite appears fixed over one point.",
    "Ground antennas can stay pointed without tracking.",
    "Three satellites spaced 120° apart cover almost the whole Earth, except the polar regions.",
  ]),
  sub("Space Technology", 4, "ISRO interviews 2017 to 2022", "Why does a launch vehicle need a cryogenic upper stage?", [
    "It burns liquid hydrogen with liquid oxygen, which gives the highest specific impulse of chemical propellants (about 450 s).",
    "Higher specific impulse means more payload for the same propellant mass.",
    "Difficulty: hydrogen must be stored at −253 °C and oxygen at −183 °C, which needs special insulation, pumps and materials.",
    "India flew its own cryogenic stage successfully on GSLV-D5 in January 2014.",
  ]),
  sub("Computer Science", 4, "ISRO CS interviews 2018 to 2023", "Explain the difference between a process and a thread.", [
    "A process is a program in execution with its own address space and resources.",
    "A thread is a unit of execution inside a process; threads share the code, data and open files and have their own stack and registers.",
    "Creating and switching threads is cheaper than for processes.",
    "A crash in one thread can bring down the whole process, while processes are isolated from each other.",
  ]),
  sub("Electronics", 4, "ISRO EC interviews 2017 to 2022", "What is modulation, and why is it needed?", [
    "Modulation varies a property (amplitude, frequency or phase) of a high-frequency carrier according to the message signal.",
    "It brings the antenna to a practical size, since antenna length is proportional to wavelength.",
    "It lets many signals share a channel by using different carrier frequencies.",
    "It improves range and resistance to noise.",
  ]),
  sub("Mechanical", 3, "ISRO ME interviews 2016 to 2021", "State the first and second laws of thermodynamics.", [
    "First law: energy is conserved; heat supplied equals the rise in internal energy plus work done, Q = ΔU + W.",
    "Second law (Kelvin–Planck): no engine can convert all the heat from a single reservoir into work.",
    "Second law (Clausius): heat cannot flow from a colder to a hotter body without external work.",
    "Consequence: the entropy of an isolated system never decreases.",
  ]),
  sub("Space Technology", 5, "ISRO interviews 2023 and 2024", "What did the Chandrayaan-3 mission achieve?", [
    "Launched on 14 July 2023 by LVM3-M4 from Sriharikota.",
    "The Vikram lander touched down near the lunar south pole on 23 August 2023.",
    "India became the fourth country to soft-land on the Moon and the first near its south pole.",
    "The Pragyan rover confirmed sulphur and other elements in the soil and measured the surface temperature profile.",
    "23 August is now observed as National Space Day.",
  ]),
  sub("Space Technology", 4, "ISRO interviews 2023 and 2024", "What is Aditya-L1?", [
    "India's first space-based observatory to study the Sun, launched on 2 September 2023 by PSLV-C57.",
    "It was placed in a halo orbit around the Sun–Earth Lagrange point L1 in January 2024, about 15 lakh km from Earth.",
    "At L1 the Sun can be watched without eclipses.",
    "Its seven payloads study the corona, the chromosphere, the solar wind and flares.",
  ]),
]);
