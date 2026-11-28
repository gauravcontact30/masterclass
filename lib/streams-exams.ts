/*
 * Streams' study playlists (2026-11-26): Board Exams (UP Board, CBSE Class 10 and 12, ICSE Class 10 and ISC Class 12: Maths, Physics, Chemistry and English), government and
 * professional exams (UPSC, IAS, State PCS, SSC, NDA, Defence, Bank PO, Railways, Police, CBI, Income Tax, CTET/TET and CA)
 * and IELTS. Board and government-exam playlists are
 * shown only where exam content is offered (useIndiaAccess); IELTS is for everyone.
 *
 * Each topic is one step. Its video is chosen in lib/streams-exam-videos.ts (generated: the most-viewed public, embeddable
 * video of 1080p or more for that topic), by the key "<playlist>#<topic index>". Titles and study notes are ours, written
 * from the syllabus, so they describe the topic whichever video teaches it.
 */
export type ExamGroup = "board" | "exams" | "ielts";
export type ExamTopic = readonly [title: string, points: readonly [string, string, string]];
export type ExamChapter = { title: string; level: "Beginner" | "Intermediate" | "Advanced" | "All levels"; summary: string; topics: readonly ExamTopic[] };
export type ExamPlaylist = { id: string; group: ExamGroup; name: string; playlist: string; tagline: string; color: string; chapters: readonly ExamChapter[] };

export const EXAM_PLAYLISTS = [
  /* ---------- Board Exams: Class 10 ---------- */
  { id: "board10-maths", group: "board", name: "CBSE Class 10 Maths", playlist: "CBSE Class 10 Maths: every chapter", color: "#2f6fb0", tagline: "The full Class 10 Maths syllabus, chapter by chapter, for the board exam.",
    chapters: [
      { title: "Number systems and algebra", level: "Beginner", summary: "Real numbers, polynomials, linear and quadratic equations and arithmetic progressions.", topics: [
        ["Real Numbers", ["The Fundamental Theorem of Arithmetic", "HCF and LCM by prime factorisation", "Proving numbers such as √2 are irrational"]],
        ["Polynomials", ["Zeroes of a polynomial and its graph", "Relation between zeroes and coefficients", "Quadratic polynomials from their zeroes"]],
        ["Pair of Linear Equations in Two Variables", ["Graphical meaning of a pair of equations", "Substitution and elimination methods", "Word problems that lead to two equations"]],
        ["Quadratic Equations", ["Standard form ax² + bx + c = 0", "Solving by factorisation and the quadratic formula", "The discriminant and the nature of roots"]],
        ["Arithmetic Progressions", ["Common difference and the nth term", "Sum of the first n terms", "Board-style word problems"]],
      ] },
      { title: "Geometry", level: "Intermediate", summary: "Similar triangles, coordinate geometry and circles.", topics: [
        ["Triangles", ["Similar triangles and the criteria for similarity", "The Basic Proportionality Theorem", "Using similarity in proofs"]],
        ["Coordinate Geometry", ["The distance formula", "The section formula", "Checking collinearity and shapes with coordinates"]],
      ] },
      { title: "Trigonometry and circles", level: "Intermediate", summary: "Trigonometric ratios and identities, and tangents to a circle.", topics: [
        ["Introduction to Trigonometry", ["The six trigonometric ratios", "Ratios of 0°, 30°, 45°, 60° and 90°", "Proving identities such as sin²A + cos²A = 1"]],
        ["Circles", ["A tangent is perpendicular to the radius", "Tangents from an external point are equal", "Proof questions on tangents"]],
      ] },
      { title: "Mensuration, statistics and probability", level: "Intermediate", summary: "Surface areas and volumes of combined solids, grouped data and probability.", topics: [
        ["Surface Areas and Volumes", ["Surface area of combined solids", "Volume of combined solids", "Choosing the right formula in word problems"]],
        ["Statistics", ["Mean of grouped data: direct and assumed-mean methods", "Mode of grouped data", "Median of grouped data"]],
        ["Probability", ["Theoretical probability of an event", "Complementary events: P(E) + P(not E) = 1", "Coins, dice and cards questions"]],
      ] },
    ] },
  { id: "board10-physics", group: "board", name: "CBSE Class 10 Physics", playlist: "CBSE Class 10 Physics: light, eye, electricity, magnetism", color: "#2f6fb0", tagline: "The physics chapters of Class 10 Science, with numericals, for the board exam.",
    chapters: [
      { title: "Light", level: "Beginner", summary: "Mirrors, lenses and the human eye.", topics: [
        ["Light: Reflection and Refraction", ["Images formed by spherical mirrors", "Refraction and the refractive index", "Lens formula and magnification"]],
        ["The Human Eye and the Colourful World", ["Defects of vision and their correction", "Refraction through a prism and dispersion", "Scattering of light and the blue sky"]],
      ] },
      { title: "Electricity and magnetism", level: "Intermediate", summary: "Circuits and the magnetic effects of current.", topics: [
        ["Electricity", ["Ohm's law and resistance", "Resistors in series and parallel", "Heating effect and electric power"]],
        ["Magnetic Effects of Electric Current", ["Magnetic field lines", "Field due to a current-carrying conductor", "Force on a conductor and domestic circuits"]],
      ] },
      { title: "Exam practice", level: "Advanced", summary: "Numericals that come in the paper.", topics: [
        ["Physics Numericals for the Board Exam", ["Mirror and lens numericals", "Circuit and power numericals", "Showing working for full marks"]],
      ] },
    ] },
  { id: "board10-chemistry", group: "board", name: "CBSE Class 10 Chemistry", playlist: "CBSE Class 10 Chemistry: reactions to carbon", color: "#1c7c6c", tagline: "The chemistry chapters of Class 10 Science, with important questions, for the board exam.",
    chapters: [
      { title: "Reactions, acids and bases", level: "Beginner", summary: "Chemical reactions and the pH scale.", topics: [
        ["Chemical Reactions and Equations", ["Writing and balancing chemical equations", "Combination, decomposition, displacement and redox reactions", "Corrosion and rancidity"]],
        ["Acids, Bases and Salts", ["Indicators and the pH scale", "Neutralisation and reactions with metals", "Common salts: baking soda, washing soda, bleaching powder, plaster of Paris"]],
      ] },
      { title: "Metals and carbon", level: "Intermediate", summary: "Metals, non-metals and carbon compounds.", topics: [
        ["Metals and Non-metals", ["Physical and chemical properties", "The reactivity series", "Ionic compounds and the extraction of metals"]],
        ["Carbon and its Compounds", ["Covalent bonding and the versatility of carbon", "Homologous series and functional groups", "Ethanol, ethanoic acid, soaps and detergents"]],
      ] },
      { title: "Exam practice", level: "Advanced", summary: "The questions that come again and again.", topics: [
        ["Chemistry Important Questions", ["Equation-based questions", "Reasoning and assertion questions", "Revision of every chapter"]],
      ] },
    ] },
  { id: "board10-english", group: "board", name: "CBSE Class 10 English", playlist: "CBSE Class 10 English: literature and writing", color: "#7a5ea8", tagline: "First Flight lessons, letter writing and grammar for the Class 10 board exam.",
    chapters: [
      { title: "First Flight: prose", level: "Beginner", summary: "The main prose lessons, explained.", topics: [
        ["A Letter to God", ["Lencho's faith and the hailstorm", "The postmaster's kindness and the irony of the ending", "Likely board questions"]],
        ["Nelson Mandela: Long Walk to Freedom", ["The inauguration and its meaning", "Mandela's ideas of freedom and courage", "Character and theme questions"]],
        ["Two Stories about Flying", ["His First Flight: the young seagull's fear", "The Black Aeroplane: a mysterious rescue", "Themes and value-based questions"]],
        ["From the Diary of Anne Frank", ["Why Anne kept a diary", "Her teachers and the essay on 'chatterbox'", "Character sketch questions"]],
      ] },
      { title: "Writing and grammar", level: "Intermediate", summary: "Formal letters and the grammar the paper tests.", topics: [
        ["Letter Writing", ["Format of formal letters", "Letters of complaint and enquiry", "What earns full marks"]],
        ["Grammar for the Board Exam", ["Tenses and modals", "Subject-verb agreement and reported speech", "Gap-filling and editing questions"]],
      ] },
    ] },

  /* ---------- Board Exams: Class 12 ---------- */
  { id: "board12-physics", group: "board", name: "CBSE Class 12 Physics", playlist: "CBSE Class 12 Physics: every unit", color: "#2f6fb0", tagline: "Electrostatics to semiconductors, the full Class 12 Physics syllabus for the board exam.",
    chapters: [
      { title: "Electrostatics", level: "Intermediate", summary: "Charges, fields, potential and capacitance.", topics: [
        ["Electric Charges and Fields", ["Coulomb's law and superposition", "Electric field lines and dipoles", "Gauss's law and its applications"]],
        ["Electrostatic Potential and Capacitance", ["Potential and equipotential surfaces", "Capacitors and capacitance", "Dielectrics and energy stored"]],
      ] },
      { title: "Current, magnetism and induction", level: "Intermediate", summary: "Circuits, magnetic effects, induction and AC.", topics: [
        ["Current Electricity", ["Drift velocity and Ohm's law", "Kirchhoff's laws", "Wheatstone bridge and the potentiometer idea"]],
        ["Moving Charges and Magnetism", ["Biot-Savart law and Ampère's law", "Force on moving charges", "The moving-coil galvanometer"]],
        ["Electromagnetic Induction", ["Faraday's and Lenz's laws", "Motional EMF and eddy currents", "Self and mutual inductance"]],
        ["Alternating Current", ["RMS values and phasors", "LCR circuits and resonance", "Power factor and transformers"]],
      ] },
      { title: "Optics and modern physics", level: "Advanced", summary: "Ray and wave optics, dual nature and semiconductors.", topics: [
        ["Ray Optics and Optical Instruments", ["Refraction and total internal reflection", "Lenses and prisms", "Microscopes and telescopes"]],
        ["Wave Optics", ["Huygens' principle", "Young's double-slit experiment", "Diffraction and polarisation"]],
        ["Dual Nature of Radiation and Matter", ["The photoelectric effect", "Einstein's photoelectric equation", "De Broglie wavelength"]],
        ["Semiconductor Electronics", ["Intrinsic and extrinsic semiconductors", "The p-n junction diode", "Diodes as rectifiers"]],
      ] },
    ] },
  { id: "board12-chemistry", group: "board", name: "CBSE Class 12 Chemistry", playlist: "CBSE Class 12 Chemistry: physical, inorganic, organic", color: "#1c7c6c", tagline: "Physical, inorganic and organic chemistry for the Class 12 board exam.",
    chapters: [
      { title: "Physical chemistry", level: "Intermediate", summary: "Solutions, electrochemistry and kinetics.", topics: [
        ["Solutions", ["Concentration terms", "Raoult's law and ideal solutions", "Colligative properties"]],
        ["Electrochemistry", ["Galvanic cells and the Nernst equation", "Conductance and Kohlrausch's law", "Electrolysis and batteries"]],
        ["Chemical Kinetics", ["Rate of reaction and rate law", "Order and molecularity", "Integrated rate equations and half-life"]],
      ] },
      { title: "Inorganic chemistry", level: "Intermediate", summary: "The d- and f-block and coordination compounds.", topics: [
        ["The d- and f-Block Elements", ["Properties of transition metals", "Potassium dichromate and permanganate", "Lanthanoids and actinoids"]],
        ["Coordination Compounds", ["Werner's theory and IUPAC naming", "Isomerism", "Valence bond and crystal field theory"]],
      ] },
      { title: "Organic chemistry", level: "Advanced", summary: "From haloalkanes to biomolecules.", topics: [
        ["Haloalkanes and Haloarenes", ["Nomenclature and preparation", "SN1 and SN2 reactions", "Reactions of haloarenes"]],
        ["Alcohols, Phenols and Ethers", ["Preparation methods", "Acidity of alcohols and phenols", "Important named reactions"]],
        ["Aldehydes, Ketones and Carboxylic Acids", ["Nucleophilic addition", "Aldol and Cannizzaro reactions", "Acidity of carboxylic acids"]],
        ["Amines", ["Classification and basicity", "Preparation of amines", "Diazonium salts"]],
        ["Biomolecules", ["Carbohydrates", "Proteins and enzymes", "Vitamins and nucleic acids"]],
      ] },
    ] },
  { id: "board12-maths", group: "board", name: "CBSE Class 12 Maths", playlist: "CBSE Class 12 Maths: algebra, calculus, vectors", color: "#4a5bd4", tagline: "Relations to probability, the full Class 12 Maths syllabus for the board exam.",
    chapters: [
      { title: "Relations, functions and algebra", level: "Intermediate", summary: "Relations, inverse trigonometric functions, matrices and determinants.", topics: [
        ["Relations and Functions", ["Reflexive, symmetric, transitive and equivalence relations", "One-one and onto functions", "Composition and invertible functions"]],
        ["Inverse Trigonometric Functions", ["Domains and principal value branches", "Graphs of inverse functions", "Properties used in simplification"]],
        ["Matrices", ["Types of matrices and operations", "Transpose, symmetric and skew-symmetric matrices", "Invertible matrices"]],
        ["Determinants", ["Evaluating determinants", "Adjoint and inverse of a matrix", "Solving linear equations with matrices"]],
      ] },
      { title: "Calculus", level: "Advanced", summary: "Continuity, derivatives, integrals and differential equations.", topics: [
        ["Continuity and Differentiability", ["Continuity at a point", "Chain rule, implicit and logarithmic differentiation", "Second-order derivatives"]],
        ["Application of Derivatives", ["Rate of change", "Increasing and decreasing functions", "Maxima and minima"]],
        ["Integrals", ["Integration by substitution and by parts", "Partial fractions", "Definite integrals and their properties"]],
        ["Differential Equations", ["Order and degree", "Variable separable equations", "Linear differential equations"]],
      ] },
      { title: "Vectors and probability", level: "Intermediate", summary: "Vector algebra and conditional probability.", topics: [
        ["Vector Algebra", ["Types of vectors and components", "Scalar (dot) product", "Vector (cross) product"]],
        ["Probability", ["Conditional probability", "Multiplication theorem and independent events", "Bayes' theorem"]],
      ] },
    ] },
  { id: "board12-english", group: "board", name: "CBSE Class 12 English", playlist: "CBSE Class 12 English: Flamingo, Vistas and writing", color: "#7a5ea8", tagline: "Flamingo and Vistas lessons, poetry and writing skills for the Class 12 board exam.",
    chapters: [
      { title: "Flamingo: prose", level: "Intermediate", summary: "The main prose lessons, explained.", topics: [
        ["The Last Lesson", ["M. Hamel's last French lesson", "Language, identity and loss", "Character and theme questions"]],
        ["Lost Spring", ["Saheb and the ragpickers of Seemapuri", "Mukesh and the bangle makers of Firozabad", "Poverty and the cycle of child labour"]],
        ["Deep Water", ["Douglas's fear of water and its cause", "How he overcame it", "Courage and determination"]],
        ["The Rattrap", ["The peddler's view of the world as a rattrap", "Edla's kindness and his change", "Themes and character questions"]],
        ["Indigo", ["Gandhi and the Champaran sharecroppers", "Civil disobedience in practice", "Self-reliance and leadership"]],
      ] },
      { title: "Poetry and Vistas", level: "Intermediate", summary: "A key poem and a supplementary reader lesson.", topics: [
        ["My Mother at Sixty-six", ["The poet's fear of losing her mother", "Images of ageing and parting", "Poetic devices"]],
        ["The Third Level", ["Charley's escape to the past", "Fantasy, stress and insecurity", "Likely board questions"]],
      ] },
      { title: "Writing skills", level: "All levels", summary: "Formats that earn full marks.", topics: [
        ["Writing Skills: Notice, Invitation and Letter", ["Notice and invitation formats", "Formal letters and job applications", "Word limits and marking"]],
      ] },
    ] },

  /* ---------- Board Exams: ICSE Class 10 ---------- */
  { id: "icse10-maths", group: "board", name: "ICSE Class 10 Maths", playlist: "ICSE Class 10 Maths: every chapter", color: "#2f6fb0", tagline: "The ICSE Class 10 Mathematics syllabus, from commercial maths to probability, for the board exam.",
    chapters: [
      { title: "Commercial mathematics and algebra", level: "Beginner", summary: "GST, banking, inequations, quadratics and progressions.", topics: [
        ["GST", ["Input and output tax", "Computing GST across a supply chain", "Board-style GST problems"]],
        ["Banking: Recurring Deposit Accounts", ["How a recurring deposit grows", "Interest and maturity value", "Solving for the monthly instalment"]],
        ["Linear Inequations", ["Solving inequations in one variable", "Solution sets on the number line", "Replacement sets"]],
        ["Quadratic Equations", ["Factorisation and the formula", "Nature of roots", "Word problems"]],
        ["Factorisation and the Remainder Theorem", ["The remainder and factor theorems", "Factorising cubic polynomials", "Finding unknown coefficients"]],
        ["Matrices", ["Order and types of matrices", "Addition and multiplication", "Solving matrix equations"]],
        ["Arithmetic and Geometric Progression", ["nth term and sum of an AP", "nth term and sum of a GP", "Word problems"]],
      ] },
      { title: "Geometry and coordinate geometry", level: "Intermediate", summary: "Reflection, the section formula, straight lines, similarity, loci and circles.", topics: [
        ["Reflection", ["Reflection in the axes and the origin", "Invariant points", "Figures under reflection"]],
        ["Section and Mid-Point Formula", ["Internal division of a line", "The mid-point and centroid", "Finding a ratio of division"]],
        ["Equation of a Straight Line", ["Slope and inclination", "Slope-intercept and two-point forms", "Parallel and perpendicular lines"]],
        ["Similarity", ["Conditions for similar triangles", "Areas of similar triangles", "Maps and models"]],
        ["Loci", ["Locus as a set of points", "Standard loci theorems", "Constructing a locus"]],
        ["Circles", ["Angle properties of circles", "Cyclic quadrilaterals", "Tangents and intersecting chords"]],
      ] },
      { title: "Mensuration, trigonometry and statistics", level: "Intermediate", summary: "Solids, identities, heights and distances, data and chance.", topics: [
        ["Mensuration: Cylinder, Cone and Sphere", ["Surface area and volume", "Combined solids", "Melting and recasting"]],
        ["Trigonometric Identities", ["The three fundamental identities", "Proving identities", "Complementary angles"]],
        ["Heights and Distances", ["Angles of elevation and depression", "Using tables of values", "Two-triangle problems"]],
        ["Statistics: Mean, Median, Quartiles and Mode", ["Mean of grouped data", "Ogives, median and quartiles", "Mode from a histogram"]],
        ["Probability", ["Sample space and events", "Cards, dice and coins", "Board-style questions"]],
      ] },
    ] },
  { id: "icse10-physics", group: "board", name: "ICSE Class 10 Physics", playlist: "ICSE Class 10 Physics: every chapter", color: "#2f6fb0", tagline: "The ICSE Class 10 Physics syllabus with numericals, from force to radioactivity.",
    chapters: [
      { title: "Mechanics", level: "Beginner", summary: "Force, work, energy, power and machines.", topics: [
        ["Force: Moment of Force and Centre of Gravity", ["Moment of a force and couples", "The principle of moments", "Centre of gravity and uniform circular motion"]],
        ["Work, Energy and Power", ["Work done by a force", "Kinetic and potential energy", "Conservation of energy and power"]],
        ["Machines", ["Mechanical advantage, velocity ratio and efficiency", "The three classes of levers", "Pulley systems"]],
      ] },
      { title: "Light and sound", level: "Intermediate", summary: "Refraction, lenses, the spectrum and sound.", topics: [
        ["Refraction of Light at Plane Surfaces", ["Laws of refraction and refractive index", "Critical angle and total internal reflection", "Refraction through a prism"]],
        ["Refraction through a Lens", ["Convex and concave lenses", "Ray diagrams and the lens formula", "Magnification and power"]],
        ["Spectrum", ["Dispersion of white light", "The electromagnetic spectrum", "Scattering of light"]],
        ["Sound", ["Reflection of sound and echoes", "Natural, forced and resonant vibrations", "Loudness, pitch and quality"]],
      ] },
      { title: "Electricity, heat and the nucleus", level: "Intermediate", summary: "Current, household circuits, electromagnetism, calorimetry and radioactivity.", topics: [
        ["Current Electricity", ["Ohm's law and resistance", "Series and parallel combinations", "Electrical energy and power"]],
        ["Household Circuits", ["Ring and tree systems", "Fuses, MCBs and earthing", "Colour coding and safety"]],
        ["Electromagnetism", ["Magnetic effect of a current", "Electromagnetic induction", "The DC motor and AC generator"]],
        ["Calorimetry", ["Specific heat capacity", "Latent heat", "The principle of calorimetry"]],
        ["Radioactivity", ["Alpha, beta and gamma radiation", "Nuclear fission and fusion", "Uses and safety"]],
      ] },
    ] },
  { id: "icse10-chemistry", group: "board", name: "ICSE Class 10 Chemistry", playlist: "ICSE Class 10 Chemistry: every chapter", color: "#1c7c6c", tagline: "The ICSE Class 10 Chemistry syllabus, from the periodic table to organic chemistry.",
    chapters: [
      { title: "Physical and general chemistry", level: "Beginner", summary: "Periodic properties, bonding, acids, analysis, moles and electrolysis.", topics: [
        ["Periodic Table and Periodic Properties", ["Groups and periods", "Atomic size, ionisation energy and electron affinity", "Trends across and down"]],
        ["Chemical Bonding", ["Electrovalent and covalent bonds", "Coordinate bonds", "Properties of ionic and covalent compounds"]],
        ["Acids, Bases and Salts", ["Definitions and properties", "Preparation of salts", "Normal, acid and basic salts"]],
        ["Analytical Chemistry", ["Action of NaOH and ammonium hydroxide on salts", "Colours of precipitates", "Amphoteric metals"]],
        ["Mole Concept and Stoichiometry", ["Gay-Lussac's law and Avogadro's law", "The mole and molar volume", "Empirical and molecular formulae"]],
        ["Electrolysis", ["Electrolytes and electrodes", "Electrolysis of molten lead bromide and copper sulphate", "Electroplating and refining"]],
      ] },
      { title: "Metals, compounds and organic chemistry", level: "Intermediate", summary: "Metallurgy, important compounds and organic chemistry.", topics: [
        ["Metallurgy", ["Occurrence of metals", "Extraction of aluminium", "Alloys and their uses"]],
        ["Study of Compounds: Hydrogen Chloride", ["Preparation of HCl gas", "Properties and tests", "Hydrochloric acid"]],
        ["Study of Compounds: Ammonia", ["Laboratory and Haber process preparation", "Properties and the fountain experiment", "Uses of ammonia"]],
        ["Study of Compounds: Nitric Acid", ["Laboratory and Ostwald process", "Properties as an acid and oxidiser", "Tests for nitrates"]],
        ["Study of Compounds: Sulphuric Acid", ["The contact process", "Properties as acid, oxidiser and dehydrating agent", "Uses"]],
        ["Organic Chemistry", ["Homologous series and isomerism", "IUPAC naming", "Alkanes, alkenes, alkynes, alcohols and carboxylic acids"]],
      ] },
    ] },
  { id: "icse10-english", group: "board", name: "ICSE Class 10 English", playlist: "ICSE Class 10 English: language and literature", color: "#7a5ea8", tagline: "ICSE English Language composition, letters and grammar, with the literature syllabus, for the board exam.",
    chapters: [
      { title: "English Language", level: "All levels", summary: "Paper 1: writing tasks, comprehension and grammar.", topics: [
        ["ICSE English Composition", ["Choosing the right composition topic", "Narrative, descriptive and argumentative essays", "Structure and marking"]],
        ["ICSE Letter Writing", ["Formal and informal letter formats", "Tone and content", "Common mistakes"]],
        ["ICSE Notice and Email Writing", ["Notice format", "Email format", "Writing to the word limit"]],
        ["ICSE English Comprehension", ["Reading the passage for meaning", "Vocabulary questions", "Writing the summary"]],
        ["ICSE English Grammar", ["Prepositions and tenses", "Transformation of sentences", "Joining sentences"]],
      ] },
      { title: "English Literature", level: "Intermediate", summary: "Paper 2: poetry, prose and drama.", topics: [
        ["ICSE Class 10 English Literature: Poems", ["Reading the prescribed poems", "Themes and poetic devices", "Context questions"]],
        ["ICSE Class 10 English Literature: Short Stories", ["The prescribed stories", "Characters and themes", "Long-answer questions"]],
        ["ICSE Class 10 English Literature: Drama", ["The prescribed play, act by act", "Characters and key scenes", "Extract-based questions"]],
      ] },
    ] },

  /* ---------- Board Exams: ISC Class 12 ---------- */
  { id: "isc12-maths", group: "board", name: "ISC Class 12 Maths", playlist: "ISC Class 12 Maths: Sections A, B and C", color: "#4a5bd4", tagline: "The ISC Class 12 Mathematics syllabus: algebra, calculus, probability, vectors and applied maths.",
    chapters: [
      { title: "Section A: algebra", level: "Intermediate", summary: "Relations, functions, inverse trigonometry, matrices and determinants.", topics: [
        ["Relations and Functions", ["Types of relations and equivalence", "One-one, onto and inverse functions", "Composition of functions"]],
        ["Inverse Trigonometric Functions", ["Domains and principal values", "Properties and identities", "Solving equations"]],
        ["Matrices and Determinants", ["Matrix operations and inverses", "Properties of determinants", "Solving equations by Cramer's rule and matrices"]],
      ] },
      { title: "Section A: calculus and probability", level: "Advanced", summary: "Continuity, derivatives, integrals, differential equations and probability.", topics: [
        ["Continuity and Differentiability", ["Limits and continuity", "Differentiating implicit and parametric functions", "Rolle's and Lagrange's theorems"]],
        ["Applications of Derivatives", ["Rate of change and tangents", "Increasing and decreasing functions", "Maxima and minima"]],
        ["Indefinite Integrals", ["Substitution and partial fractions", "Integration by parts", "Standard integrals"]],
        ["Definite Integrals and Area under a Curve", ["Properties of definite integrals", "Area between curves", "Board-style problems"]],
        ["Differential Equations", ["Order and degree", "Variable separable and homogeneous equations", "Linear differential equations"]],
        ["Probability", ["Conditional probability", "Bayes' theorem", "Random variables and distributions"]],
      ] },
      { title: "Sections B and C", level: "Advanced", summary: "Vectors and 3D geometry, and applied mathematics.", topics: [
        ["Vectors", ["Scalar and vector products", "Scalar triple product", "Geometric applications"]],
        ["Three-Dimensional Geometry", ["Lines in space", "Planes", "Angles and distances"]],
        ["Application of Calculus in Commerce and Economics", ["Cost, revenue and profit functions", "Average and marginal functions", "Break-even point"]],
        ["Linear Regression", ["Lines of regression", "Regression coefficients", "Estimating values"]],
        ["Linear Programming", ["Formulating a problem", "The graphical method", "Feasible regions and optimal solutions"]],
      ] },
    ] },
  { id: "isc12-physics", group: "board", name: "ISC Class 12 Physics", playlist: "ISC Class 12 Physics: every unit", color: "#2f6fb0", tagline: "The ISC Class 12 Physics syllabus, from electrostatics to semiconductor electronics, with numericals.",
    chapters: [
      { title: "Electricity and magnetism", level: "Intermediate", summary: "Electrostatics, current, magnetism, induction and AC.", topics: [
        ["Electrostatics: Electric Charges and Fields", ["Coulomb's law", "Electric field and dipoles", "Gauss's theorem"]],
        ["Electric Potential and Capacitance", ["Potential and equipotential surfaces", "Capacitors and dielectrics", "Energy stored"]],
        ["Current Electricity", ["Drift velocity and Ohm's law", "Kirchhoff's laws and the Wheatstone bridge", "The potentiometer and meter bridge"]],
        ["Magnetic Effects of Current and Magnetism", ["Biot-Savart and Ampere's laws", "Force on a current and the moving coil galvanometer", "Magnetic materials"]],
        ["Electromagnetic Induction and Alternating Current", ["Faraday's and Lenz's laws", "Self and mutual induction", "LCR circuits and transformers"]],
      ] },
      { title: "Waves, optics and modern physics", level: "Advanced", summary: "Electromagnetic waves, optics, dual nature, atoms, nuclei and electronics.", topics: [
        ["Electromagnetic Waves", ["Displacement current", "The electromagnetic spectrum", "Properties of EM waves"]],
        ["Ray Optics and Optical Instruments", ["Reflection and refraction at curved surfaces", "Lenses and prisms", "Microscopes and telescopes"]],
        ["Wave Optics", ["Huygens' principle", "Young's double-slit experiment", "Diffraction and polarisation"]],
        ["Dual Nature of Radiation and Matter", ["The photoelectric effect", "Einstein's equation", "de Broglie waves"]],
        ["Atoms and Nuclei", ["The Bohr model and hydrogen spectrum", "Mass defect and binding energy", "Radioactive decay, fission and fusion"]],
        ["Semiconductor Electronics", ["Energy bands and p-n junctions", "Diodes and rectifiers", "Logic gates"]],
      ] },
    ] },
  { id: "isc12-chemistry", group: "board", name: "ISC Class 12 Chemistry", playlist: "ISC Class 12 Chemistry: physical, inorganic, organic", color: "#1c7c6c", tagline: "The ISC Class 12 Chemistry syllabus, from solutions to biomolecules.",
    chapters: [
      { title: "Physical chemistry", level: "Intermediate", summary: "Solutions, electrochemistry and chemical kinetics.", topics: [
        ["Solutions and Colligative Properties", ["Concentration terms", "Raoult's law", "Colligative properties and van't Hoff factor"]],
        ["Electrochemistry", ["Conductance and Kohlrausch's law", "Electrochemical cells and the Nernst equation", "Electrolysis and Faraday's laws"]],
        ["Chemical Kinetics", ["Rate laws and order", "Integrated rate equations and half-life", "Arrhenius equation"]],
      ] },
      { title: "Inorganic chemistry", level: "Intermediate", summary: "The d- and f-block elements and coordination compounds.", topics: [
        ["d and f Block Elements", ["Properties of transition elements", "Potassium dichromate and permanganate", "Lanthanoids and actinoids"]],
        ["Coordination Compounds", ["Werner's theory and IUPAC naming", "Isomerism", "Valence bond and crystal field theory"]],
      ] },
      { title: "Organic chemistry", level: "Advanced", summary: "Functional groups, their reactions and biomolecules.", topics: [
        ["Haloalkanes and Haloarenes", ["Preparation and properties", "SN1 and SN2 mechanisms", "Uses and environmental effects"]],
        ["Alcohols, Phenols and Ethers", ["Preparation and properties", "Acidity of alcohols and phenols", "Important reactions"]],
        ["Aldehydes, Ketones and Carboxylic Acids", ["Nucleophilic addition", "Named reactions", "Acidity of carboxylic acids"]],
        ["Amines", ["Classification and basicity", "Preparation and reactions", "Diazonium salts"]],
        ["Biomolecules", ["Carbohydrates", "Proteins and enzymes", "Vitamins and nucleic acids"]],
      ] },
    ] },
  { id: "isc12-english", group: "board", name: "ISC Class 12 English", playlist: "ISC Class 12 English: language and literature", color: "#7a5ea8", tagline: "ISC English Language writing tasks and grammar, with the literature syllabus, for the board exam.",
    chapters: [
      { title: "English Language", level: "All levels", summary: "Paper 1: composition, directed writing, proposals and grammar.", topics: [
        ["ISC English Composition", ["Choosing a topic", "Planning and structuring the essay", "What examiners reward"]],
        ["ISC Directed Writing and Proposal Writing", ["Article, speech and report formats", "Writing a proposal", "Word limits and marking"]],
        ["ISC English Grammar", ["Sentence transformation", "Prepositions and phrasal verbs", "Common errors"]],
      ] },
      { title: "English Literature", level: "Intermediate", summary: "Paper 2: poetry, short stories and drama.", topics: [
        ["ISC Class 12 English Literature: Poems", ["The prescribed poems", "Themes and literary devices", "Answering critical questions"]],
        ["ISC Class 12 English Literature: Short Stories", ["The prescribed stories", "Characters and themes", "Long-answer questions"]],
        ["ISC Class 12 English Literature: Drama", ["The prescribed play", "Key scenes and characters", "Extract and essay questions"]],
      ] },
    ] },

  /* ---------- Board Exams: UP Board High School (Class 10), NCERT syllabus (user request 2026-11-28) ---------- */
  { id: "up10-maths", group: "board", name: "UP Board Class 10 Maths", playlist: "UP Board High School Maths: every topic", color: "#c2410c", tagline: "UP Board High School Mathematics (गणित), every chapter topic by topic, for Part A objective and Part B descriptive questions.",
    chapters: [
      { title: "Number systems and algebra", level: "Beginner", summary: "Real numbers, polynomials, linear and quadratic equations and arithmetic progressions.", topics: [
        ["Fundamental Theorem of Arithmetic, HCF and LCM", ["Prime factorisation of a number", "HCF × LCM = product of two numbers", "Board questions on HCF and LCM"]],
        ["Irrational Numbers: proving √2, √3 and √5 irrational", ["Proof by contradiction", "Sums and products with irrational numbers", "The four-mark proof format"]],
        ["Zeroes of a Polynomial and their Geometrical Meaning", ["Reading zeroes from a graph", "Linear, quadratic and cubic graphs", "Number of zeroes from a graph"]],
        ["Relation between Zeroes and Coefficients", ["α + β = −b/a and αβ = c/a", "Finding a quadratic from its zeroes", "Expressions such as α² + β²"]],
        ["Pair of Linear Equations: Graphical Method", ["Consistent and inconsistent pairs", "Ratios a₁/a₂, b₁/b₂ and c₁/c₂", "Unique, no and infinitely many solutions"]],
        ["Pair of Linear Equations: Substitution and Elimination", ["The substitution method", "The elimination method", "Word problems on age, money and digits"]],
        ["Quadratic Equations by Factorisation", ["Standard form ax² + bx + c = 0", "Splitting the middle term", "Word problems that give a quadratic"]],
        ["Quadratic Formula and Nature of Roots", ["x = (−b ± √D) / 2a", "The discriminant D = b² − 4ac", "Finding k for equal roots"]],
        ["Arithmetic Progressions: nth Term", ["Common difference", "aₙ = a + (n − 1)d", "Which term of an AP is a given number"]],
        ["Arithmetic Progressions: Sum of n Terms", ["Sₙ = n/2 [2a + (n − 1)d]", "Sₙ = n/2 (a + l)", "Word problems on savings and instalments"]],
      ] },
      { title: "Geometry and coordinate geometry", level: "Intermediate", summary: "Similar triangles, the coordinate plane and tangents to a circle.", topics: [
        ["Similar Triangles and the Basic Proportionality Theorem", ["Similar figures", "Proof of the BPT (Thales theorem)", "Using the converse"]],
        ["Criteria for Similarity of Triangles", ["AAA, SSS and SAS similarity", "Proving triangles similar", "Finding unknown sides"]],
        ["Distance Formula", ["Distance between two points", "Checking collinearity", "Showing a figure is a square, rhombus or triangle type"]],
        ["Section Formula", ["Internal division in a ratio m : n", "The mid-point formula", "Finding the ratio of division"]],
        ["Tangent to a Circle", ["A tangent is perpendicular to the radius", "Tangents from an external point are equal", "Five-mark tangent proofs"]],
      ] },
      { title: "Trigonometry", level: "Intermediate", summary: "Ratios, identities and heights and distances.", topics: [
        ["Trigonometric Ratios", ["sin, cos, tan, cosec, sec and cot", "Finding all ratios from one", "Ratios in a right triangle"]],
        ["Trigonometric Ratios of Specific Angles", ["Values at 0°, 30°, 45°, 60° and 90°", "Evaluating expressions", "Finding an angle from a value"]],
        ["Trigonometric Identities", ["sin²A + cos²A = 1", "1 + tan²A = sec²A and 1 + cot²A = cosec²A", "Proving identities step by step"]],
        ["Heights and Distances", ["Angles of elevation and depression", "Towers, buildings and shadows", "Two-angle problems"]],
      ] },
      { title: "Mensuration", level: "Intermediate", summary: "Areas related to circles and surface areas and volumes.", topics: [
        ["Areas Related to Circles: Sectors and Segments", ["Length of an arc", "Area of a sector", "Area of a minor segment"]],
        ["Surface Areas of Combined Solids", ["Cylinder, cone, sphere and hemisphere", "Solids joined together", "Toys, tents and capsules"]],
        ["Volumes of Combined Solids", ["Volume of each solid", "Adding and subtracting volumes", "Word problems"]],
      ] },
      { title: "Statistics and probability", level: "Intermediate", summary: "Grouped data and the probability of an event.", topics: [
        ["Mean of Grouped Data", ["Direct method", "Assumed mean method", "Step deviation method"]],
        ["Mode and Median of Grouped Data", ["Mode = l + [(f₁ − f₀)/(2f₁ − f₀ − f₂)] × h", "Median from the cumulative frequency", "3 Median = Mode + 2 Mean"]],
        ["Probability", ["Theoretical probability", "Complementary events", "Coins, dice and playing cards"]],
      ] },
    ] },
  { id: "up10-physics", group: "board", name: "UP Board Class 10 Physics", playlist: "UP Board High School Science: Physics, every topic", color: "#1d4ed8", tagline: "The Physics part of UP Board High School Science (विज्ञान): light, the human eye, electricity and magnetism, topic by topic.",
    chapters: [
      { title: "Light: reflection and refraction", level: "Beginner", summary: "Mirrors, lenses and their formulas.", topics: [
        ["Reflection of Light and Spherical Mirrors", ["Laws of reflection", "Pole, centre of curvature and focus", "R = 2f"]],
        ["Image Formation by Concave and Convex Mirrors", ["Ray diagrams for each object position", "Uses of concave and convex mirrors", "Sign convention"]],
        ["Mirror Formula and Magnification", ["1/v + 1/u = 1/f", "m = −v/u", "Numericals on mirrors"]],
        ["Refraction of Light and Refractive Index", ["Laws of refraction (Snell's law)", "Refraction through a glass slab", "Absolute and relative refractive index"]],
        ["Image Formation by Lenses", ["Convex and concave lens ray diagrams", "Nature, position and size of image", "Uses of lenses"]],
        ["Lens Formula, Magnification and Power", ["1/v − 1/u = 1/f", "Power P = 1/f in dioptre", "Numericals on lenses"]],
      ] },
      { title: "The human eye and the colourful world", level: "Beginner", summary: "The eye, its defects and dispersion.", topics: [
        ["The Human Eye and Power of Accommodation", ["Parts of the eye", "Near point and far point", "Power of accommodation"]],
        ["Defects of Vision and their Correction", ["Myopia and its correction", "Hypermetropia and its correction", "Presbyopia"]],
        ["Refraction through a Prism and Dispersion", ["Angle of deviation", "Dispersion of white light", "The rainbow"]],
        ["Atmospheric Refraction and Scattering of Light", ["Twinkling of stars", "Advanced sunrise and delayed sunset", "Why the sky is blue and the sun red at sunset"]],
      ] },
      { title: "Electricity", level: "Intermediate", summary: "Current, resistance, circuits and heating.", topics: [
        ["Electric Current and Potential Difference", ["Charge, current and the ampere", "Potential difference and the volt", "Circuit symbols"]],
        ["Ohm's Law and Resistance", ["V = IR", "Factors affecting resistance", "Resistivity"]],
        ["Resistors in Series and Parallel", ["Equivalent resistance in series", "Equivalent resistance in parallel", "Mixed circuit numericals"]],
        ["Heating Effect of Electric Current and Electric Power", ["Joule's law H = I²Rt", "Power P = VI = I²R = V²/R", "Kilowatt hour and electricity bills"]],
      ] },
      { title: "Magnetic effects of electric current", level: "Intermediate", summary: "Fields, forces and domestic circuits.", topics: [
        ["Magnetic Field and Field Lines", ["Properties of magnetic field lines", "Field due to a straight conductor", "Right-hand thumb rule"]],
        ["Magnetic Field due to a Circular Loop and a Solenoid", ["Field of a circular coil", "Solenoid and electromagnet", "Factors affecting the field"]],
        ["Force on a Current-carrying Conductor and Fleming's Left-hand Rule", ["Direction of force", "Fleming's left-hand rule", "Electric motor principle"]],
        ["Domestic Electric Circuits", ["Live, neutral and earth wires", "Fuse and MCB", "Overloading and short circuit"]],
      ] },
    ] },
  { id: "up10-inorganic", group: "board", name: "UP Board Class 10 Inorganic Chemistry", playlist: "UP Board High School Science: Inorganic Chemistry, every topic", color: "#0f766e", tagline: "Inorganic Chemistry of UP Board High School Science: reactions and equations, acids, bases and salts, and metals and non-metals.",
    chapters: [
      { title: "Chemical reactions and equations", level: "Beginner", summary: "Writing, balancing and classifying reactions.", topics: [
        ["Chemical Equations and Balancing", ["Word and skeletal equations", "Balancing by the hit and trial method", "States of matter in an equation"]],
        ["Types of Chemical Reactions", ["Combination and decomposition", "Displacement and double displacement", "Exothermic and endothermic reactions"]],
        ["Oxidation and Reduction, Corrosion and Rancidity", ["Oxidation and reduction as oxygen gain or loss", "Redox reactions", "Corrosion and rancidity and their prevention"]],
      ] },
      { title: "Acids, bases and salts", level: "Beginner", summary: "Properties, pH and important salts.", topics: [
        ["Acids and Bases: Properties and Indicators", ["Litmus, phenolphthalein and methyl orange", "Reactions with metals and carbonates", "Neutralisation"]],
        ["The pH Scale and its Importance", ["pH from 0 to 14", "Universal indicator", "pH in digestion, soil and tooth decay"]],
        ["Important Salts: Common Salt, Baking Soda, Washing Soda, Bleaching Powder and Plaster of Paris", ["Preparation of each salt", "Formulae and uses", "Water of crystallisation"]],
      ] },
      { title: "Metals and non-metals", level: "Intermediate", summary: "Properties, reactivity and extraction.", topics: [
        ["Physical and Chemical Properties of Metals and Non-metals", ["Lustre, malleability and conductivity", "Reactions with oxygen, water and acids", "Amphoteric oxides"]],
        ["Reactivity Series and Ionic Compounds", ["The reactivity series", "Formation of ionic bonds", "Properties of ionic compounds"]],
        ["Occurrence and Extraction of Metals", ["Ores and minerals", "Roasting, calcination and reduction", "Electrolytic refining"]],
        ["Corrosion and its Prevention", ["Rusting of iron", "Galvanisation and painting", "Alloys"]],
      ] },
    ] },
  { id: "up10-organic", group: "board", name: "UP Board Class 10 Organic Chemistry", playlist: "UP Board High School Science: Organic Chemistry (Carbon and its Compounds)", color: "#7c3aed", tagline: "Carbon and its compounds for UP Board High School Science, from covalent bonds to soaps and detergents.",
    chapters: [
      { title: "Carbon and its compounds", level: "Intermediate", summary: "Bonding, naming and reactions of carbon compounds.", topics: [
        ["Covalent Bonding in Carbon Compounds", ["Tetravalency of carbon", "Single, double and triple bonds", "Electron dot structures"]],
        ["Versatile Nature of Carbon: Catenation and Isomerism", ["Catenation", "Saturated and unsaturated hydrocarbons", "Straight chain, branched and ring structures"]],
        ["Homologous Series and Functional Groups", ["Alkanes, alkenes and alkynes", "Functional groups", "Properties across a homologous series"]],
        ["Nomenclature of Carbon Compounds", ["IUPAC naming rules", "Prefixes and suffixes", "Naming compounds with functional groups"]],
        ["Chemical Properties of Carbon Compounds", ["Combustion and oxidation", "Addition reaction (hydrogenation)", "Substitution reaction"]],
        ["Ethanol and Ethanoic Acid", ["Properties of ethanol", "Properties of ethanoic acid", "Esterification and saponification"]],
        ["Soaps and Detergents", ["Structure of a soap molecule", "Micelle formation and cleansing action", "Hard water and detergents"]],
      ] },
    ] },
  { id: "up10-english", group: "board", name: "UP Board Class 10 English", playlist: "UP Board High School English: grammar, writing and translation", color: "#9d174d", tagline: "UP Board High School English (अंग्रेजी): grammar, letter and essay writing, Hindi to English translation and reading, for the board paper.",
    chapters: [
      { title: "Grammar", level: "All levels", summary: "The grammar topics set in the UP Board paper every year.", topics: [
        ["Tenses in English Grammar", ["Present, past and future forms", "Uses of each tense", "Common errors"]],
        ["Active and Passive Voice", ["Rules of voice change", "Voice in each tense", "Imperative and interrogative sentences"]],
        ["Direct and Indirect Speech (Narration)", ["Change of pronouns and tenses", "Assertive, interrogative and imperative sentences", "Exclamatory sentences"]],
        ["Articles, Prepositions and Determiners", ["Use of a, an and the", "Prepositions of time and place", "Determiners"]],
        ["Synonyms, Antonyms and One-word Substitution", ["Word meanings", "Opposites", "One word for many"]],
      ] },
      { title: "Writing and translation", level: "All levels", summary: "Formats and practice for the writing section.", topics: [
        ["Hindi to English Translation", ["Translating each tense", "Sentence structure", "Practice sentences from board papers"]],
        ["Letter and Application Writing", ["Formal letter format", "Application to the principal", "Informal letters"]],
        ["Essay Writing for the Board Exam", ["Planning an essay", "Introduction, body and conclusion", "Popular board essay topics"]],
      ] },
      { title: "Reading", level: "All levels", summary: "Unseen passages and comprehension.", topics: [
        ["Unseen Passage (Reading Comprehension)", ["Reading for the main idea", "Answering in your own words", "Vocabulary questions"]],
      ] },
    ] },

  /* ---------- Board Exams: UP Board Intermediate (Class 12), NCERT syllabus ---------- */
  { id: "up12-maths", group: "board", name: "UP Board Class 12 Maths", playlist: "UP Board Intermediate Maths: every topic", color: "#b45309", tagline: "UP Board Intermediate Mathematics (गणित), from relations to probability, topic by topic.",
    chapters: [
      { title: "Relations, functions and algebra", level: "Intermediate", summary: "Relations, inverse trigonometric functions, matrices and determinants.", topics: [
        ["Types of Relations and Equivalence Relations", ["Reflexive, symmetric and transitive", "Equivalence relations", "Proving a relation is an equivalence"]],
        ["Types of Functions: One-one and Onto", ["Injective and surjective functions", "Bijective functions", "Composition of functions"]],
        ["Inverse Trigonometric Functions: Principal Values", ["Domain and range", "Principal value branches", "Graphs"]],
        ["Properties of Inverse Trigonometric Functions", ["sin⁻¹x + cos⁻¹x = π/2", "tan⁻¹x + tan⁻¹y", "Simplification questions"]],
        ["Matrices: Types and Operations", ["Types of matrices", "Addition and multiplication", "Transpose, symmetric and skew-symmetric"]],
        ["Determinants and their Properties", ["Expanding a determinant", "Area of a triangle", "Minors and cofactors"]],
        ["Adjoint, Inverse and Solving Linear Equations", ["Adjoint of a matrix", "A⁻¹ = adj A / |A|", "Solving equations by the matrix method"]],
      ] },
      { title: "Differential calculus", level: "Advanced", summary: "Continuity, differentiation and its applications.", topics: [
        ["Continuity of a Function", ["Continuity at a point", "Continuity of composite functions", "Finding k for continuity"]],
        ["Differentiability and the Chain Rule", ["Derivatives of composite functions", "Implicit differentiation", "Derivatives of inverse trigonometric functions"]],
        ["Logarithmic and Parametric Differentiation", ["Logarithmic differentiation", "Parametric forms", "Second-order derivatives"]],
        ["Rate of Change and Increasing and Decreasing Functions", ["Rate of change of quantities", "Increasing and decreasing intervals", "Strictly monotonic functions"]],
        ["Maxima and Minima", ["First derivative test", "Second derivative test", "Word problems on maxima and minima"]],
      ] },
      { title: "Integral calculus", level: "Advanced", summary: "Integrals, area and differential equations.", topics: [
        ["Integration by Substitution", ["Standard integrals", "Substitution method", "Trigonometric substitutions"]],
        ["Integration by Parts and Partial Fractions", ["The ILATE rule", "Integration by parts", "Partial fractions"]],
        ["Definite Integrals and their Properties", ["Fundamental theorem of calculus", "Properties of definite integrals", "Evaluating definite integrals"]],
        ["Application of Integrals: Area under Curves", ["Area under a curve", "Area of a circle and an ellipse", "Area between a line and a curve"]],
        ["Differential Equations: Order, Degree and Variable Separable", ["Order and degree", "Forming a differential equation", "Variable separable method"]],
        ["Homogeneous and Linear Differential Equations", ["Homogeneous equations", "Linear equations dy/dx + Py = Q", "Integrating factor"]],
      ] },
      { title: "Vectors and three-dimensional geometry", level: "Advanced", summary: "Vector algebra, lines in space and linear programming.", topics: [
        ["Vector Algebra: Types and Components", ["Types of vectors", "Position vector and components", "Section formula in vectors"]],
        ["Dot Product and Cross Product of Vectors", ["Scalar product and the angle between vectors", "Vector product", "Area of a parallelogram and triangle"]],
        ["Three-dimensional Geometry: Direction Cosines and Lines", ["Direction cosines and ratios", "Equation of a line", "Angle between two lines"]],
        ["Shortest Distance between Two Lines", ["Skew lines", "Shortest distance formula", "Parallel lines"]],
        ["Linear Programming Problems", ["Objective function and constraints", "Graphical method", "Corner point method"]],
      ] },
      { title: "Probability", level: "Intermediate", summary: "Conditional probability and Bayes' theorem.", topics: [
        ["Conditional Probability and the Multiplication Theorem", ["P(A|B) = P(A∩B)/P(B)", "Multiplication theorem", "Independent events"]],
        ["Bayes' Theorem", ["Total probability theorem", "Bayes' theorem", "Board-style Bayes problems"]],
        ["Random Variables and Probability Distribution", ["Random variables", "Probability distribution", "Mean of a distribution"]],
      ] },
    ] },
  { id: "up12-physics", group: "board", name: "UP Board Class 12 Physics", playlist: "UP Board Intermediate Physics: every topic", color: "#1e40af", tagline: "UP Board Intermediate Physics (भौतिक विज्ञान), from electrostatics to semiconductors, topic by topic with numericals.",
    chapters: [
      { title: "Electrostatics", level: "Intermediate", summary: "Charges, fields, potential and capacitance.", topics: [
        ["Coulomb's Law and Electric Charge", ["Properties of charge", "Coulomb's law", "Superposition principle"]],
        ["Electric Field and Electric Dipole", ["Electric field lines", "Field of a dipole", "Torque on a dipole"]],
        ["Gauss's Law and its Applications", ["Electric flux", "Gauss's law", "Field of a wire, sheet and shell"]],
        ["Electric Potential and Potential Energy", ["Potential due to a point charge", "Potential of a dipole", "Equipotential surfaces"]],
        ["Capacitors and Capacitance", ["Parallel plate capacitor", "Series and parallel combination", "Energy stored and dielectrics"]],
      ] },
      { title: "Current electricity", level: "Intermediate", summary: "Ohm's law, cells and Kirchhoff's laws.", topics: [
        ["Drift Velocity, Ohm's Law and Resistivity", ["Drift velocity and mobility", "Ohm's law", "Temperature dependence of resistance"]],
        ["Cells, EMF and Internal Resistance", ["EMF and terminal voltage", "Cells in series and parallel", "Internal resistance"]],
        ["Kirchhoff's Laws and the Wheatstone Bridge", ["Junction and loop rules", "Wheatstone bridge", "The metre bridge"]],
      ] },
      { title: "Magnetism", level: "Advanced", summary: "Magnetic effects of current and magnetism in matter.", topics: [
        ["Biot-Savart Law and Ampere's Circuital Law", ["Field of a circular loop", "Ampere's law", "Field of a solenoid"]],
        ["Force on a Moving Charge and the Cyclotron", ["Lorentz force", "Motion in a magnetic field", "Cyclotron"]],
        ["Moving Coil Galvanometer", ["Torque on a current loop", "Galvanometer", "Conversion to ammeter and voltmeter"]],
        ["Magnetism and Matter", ["Bar magnet as a solenoid", "Dia, para and ferromagnetism", "Magnetic properties of materials"]],
      ] },
      { title: "Electromagnetic induction and alternating current", level: "Advanced", summary: "Induction, AC circuits and EM waves.", topics: [
        ["Faraday's and Lenz's Laws of Electromagnetic Induction", ["Magnetic flux", "Faraday's laws", "Lenz's law"]],
        ["Self and Mutual Inductance", ["Motional EMF", "Self inductance", "Mutual inductance"]],
        ["Alternating Current and LCR Circuits", ["RMS and peak values", "Reactance and impedance", "Resonance"]],
        ["Power in AC Circuits and the Transformer", ["Power factor", "Wattless current", "Transformer"]],
        ["Electromagnetic Waves", ["Displacement current", "Properties of EM waves", "Electromagnetic spectrum"]],
      ] },
      { title: "Optics", level: "Advanced", summary: "Ray optics, instruments and wave optics.", topics: [
        ["Refraction and Total Internal Reflection", ["Refraction at spherical surfaces", "Total internal reflection", "Optical fibres"]],
        ["Lenses, Lens Maker's Formula and Prism", ["Lens maker's formula", "Combination of lenses", "Refraction through a prism"]],
        ["Optical Instruments: Microscope and Telescope", ["Simple and compound microscope", "Astronomical telescope", "Magnifying power"]],
        ["Huygens' Principle and Young's Double Slit Experiment", ["Wavefronts", "Interference", "Fringe width"]],
        ["Diffraction and Polarisation", ["Single-slit diffraction", "Polarisation", "Brewster's law"]],
      ] },
      { title: "Modern physics", level: "Advanced", summary: "Dual nature, atoms, nuclei and semiconductors.", topics: [
        ["Photoelectric Effect and Dual Nature of Matter", ["Photoelectric effect", "Einstein's equation", "De Broglie wavelength"]],
        ["Atoms: Bohr Model and Hydrogen Spectrum", ["Rutherford's model", "Bohr's postulates", "Spectral series"]],
        ["Nuclei: Mass Defect, Binding Energy, Fission and Fusion", ["Nuclear size and density", "Mass defect and binding energy", "Fission and fusion"]],
        ["Semiconductors and the p-n Junction Diode", ["Intrinsic and extrinsic semiconductors", "p-n junction", "Forward and reverse bias"]],
        ["Diode as a Rectifier", ["Half-wave rectifier", "Full-wave rectifier", "Characteristics of a diode"]],
      ] },
    ] },
  { id: "up12-inorganic", group: "board", name: "UP Board Class 12 Inorganic & Physical Chemistry", playlist: "UP Board Intermediate Chemistry: Inorganic and Physical, every topic", color: "#047857", tagline: "UP Board Intermediate Chemistry (रसायन विज्ञान): solutions, electrochemistry, kinetics, the d- and f-block and coordination compounds.",
    chapters: [
      { title: "Physical chemistry", level: "Intermediate", summary: "Solutions, electrochemistry and chemical kinetics.", topics: [
        ["Solutions: Concentration Terms and Raoult's Law", ["Molarity, molality and mole fraction", "Raoult's law", "Ideal and non-ideal solutions"]],
        ["Colligative Properties and Van't Hoff Factor", ["Relative lowering of vapour pressure", "Elevation of boiling point and depression of freezing point", "Osmotic pressure and the van't Hoff factor"]],
        ["Electrochemical Cells and the Nernst Equation", ["Galvanic cells", "Standard electrode potential", "Nernst equation"]],
        ["Conductance, Kohlrausch's Law and Electrolysis", ["Molar conductivity", "Kohlrausch's law", "Faraday's laws of electrolysis"]],
        ["Chemical Kinetics: Rate, Order and Molecularity", ["Rate of reaction", "Rate law", "Order and molecularity"]],
        ["Integrated Rate Equations and Half-life", ["Zero and first-order reactions", "Half-life", "Arrhenius equation"]],
      ] },
      { title: "Inorganic chemistry", level: "Intermediate", summary: "Transition elements and coordination compounds.", topics: [
        ["d-Block Elements: Properties of Transition Metals", ["Electronic configuration", "Variable oxidation states", "Coloured ions and catalytic properties"]],
        ["Potassium Dichromate and Potassium Permanganate", ["Preparation", "Properties", "Structures"]],
        ["f-Block Elements: Lanthanoids and Actinoids", ["Lanthanoid contraction", "Actinoids", "Comparison"]],
        ["Coordination Compounds: Werner's Theory and IUPAC Naming", ["Werner's theory", "Ligands and coordination number", "IUPAC nomenclature"]],
        ["Isomerism in Coordination Compounds", ["Structural isomerism", "Geometrical isomerism", "Optical isomerism"]],
        ["Valence Bond and Crystal Field Theory", ["Hybridisation and magnetic properties", "Crystal field splitting", "Colour of complexes"]],
      ] },
    ] },
  { id: "up12-organic", group: "board", name: "UP Board Class 12 Organic Chemistry", playlist: "UP Board Intermediate Chemistry: Organic, every topic", color: "#6d28d9", tagline: "UP Board Intermediate Organic Chemistry, from haloalkanes to biomolecules, with named reactions and conversions.",
    chapters: [
      { title: "Haloalkanes, alcohols and ethers", level: "Advanced", summary: "Halogen and oxygen compounds.", topics: [
        ["Haloalkanes: Nomenclature and Preparation", ["Classification", "IUPAC names", "Preparation from alcohols and alkenes"]],
        ["SN1 and SN2 Reaction Mechanisms", ["SN2 mechanism", "SN1 mechanism", "Optical activity and stereochemistry"]],
        ["Haloarenes and their Reactions", ["Preparation of haloarenes", "Electrophilic substitution", "Wurtz-Fittig reaction"]],
        ["Alcohols: Preparation and Properties", ["Preparation of alcohols", "Physical and chemical properties", "Lucas test"]],
        ["Phenols: Acidity and Reactions", ["Acidity of phenol", "Kolbe's and Reimer-Tiemann reactions", "Electrophilic substitution"]],
        ["Ethers: Williamson Synthesis and Reactions", ["Williamson synthesis", "Properties of ethers", "Reaction with HI"]],
      ] },
      { title: "Carbonyl compounds and amines", level: "Advanced", summary: "Aldehydes, ketones, acids and amines.", topics: [
        ["Aldehydes and Ketones: Preparation", ["Rosenmund and Stephen reductions", "Etard reaction", "Friedel-Crafts acylation"]],
        ["Nucleophilic Addition, Aldol and Cannizzaro Reactions", ["Nucleophilic addition", "Aldol condensation", "Cannizzaro reaction"]],
        ["Carboxylic Acids: Acidity and Reactions", ["Preparation", "Acidity and the effect of substituents", "HVZ reaction"]],
        ["Amines: Classification, Preparation and Basicity", ["Classification and nomenclature", "Gabriel phthalimide and Hoffmann bromamide", "Basic character"]],
        ["Diazonium Salts and their Reactions", ["Preparation of diazonium salts", "Sandmeyer reaction", "Coupling reactions"]],
      ] },
      { title: "Biomolecules", level: "Intermediate", summary: "The chemistry of life.", topics: [
        ["Carbohydrates: Glucose and Fructose", ["Classification of carbohydrates", "Structure of glucose", "Disaccharides and polysaccharides"]],
        ["Proteins, Enzymes and Amino Acids", ["Amino acids and the peptide bond", "Structure of proteins", "Enzymes"]],
        ["Vitamins, Nucleic Acids and Hormones", ["Vitamins and their deficiency", "DNA and RNA", "Hormones"]],
      ] },
    ] },
  { id: "up12-english", group: "board", name: "UP Board Class 12 English", playlist: "UP Board Intermediate English: grammar, writing and translation", color: "#831843", tagline: "UP Board Intermediate English (अंग्रेजी): grammar, letter and essay writing, Hindi to English translation and reading, for the board paper.",
    chapters: [
      { title: "Grammar", level: "All levels", summary: "The grammar section of the Intermediate paper.", topics: [
        ["Transformation of Sentences", ["Simple, compound and complex sentences", "Affirmative and negative", "Degrees of comparison"]],
        ["Synthesis of Sentences", ["Joining with conjunctions", "Using participles and infinitives", "Relative clauses"]],
        ["Correction of Sentences (Common Errors)", ["Subject-verb agreement", "Errors with tenses and prepositions", "Errors with articles"]],
        ["Phrasal Verbs and Idioms", ["Common phrasal verbs", "Idioms and their meanings", "Using them in sentences"]],
        ["Figures of Speech", ["Simile and metaphor", "Personification and alliteration", "Identifying figures of speech in poems"]],
      ] },
      { title: "Writing and translation", level: "All levels", summary: "The writing section, with translation.", topics: [
        ["Hindi to English Translation for Class 12", ["Complex sentence translation", "Passages from board papers", "Common mistakes"]],
        ["Essay Writing for Class 12", ["Essay structure", "Current affairs topics", "Scoring tips"]],
        ["Formal Letter and Application Writing for Class 12", ["Letters to editors and officials", "Job applications", "Format and layout"]],
      ] },
      { title: "Reading", level: "All levels", summary: "Unseen passages and précis.", topics: [
        ["Unseen Passage and Précis Writing", ["Comprehension questions", "Writing a précis", "Giving a title"]],
      ] },
    ] },

  /* ---------- Government exams ---------- */
  { id: "nda", group: "exams", name: "NDA", playlist: "NDA: maths, GAT and SSB", color: "#3d5a2a", tagline: "National Defence Academy exam: the pattern, Mathematics, the General Ability Test and the SSB interview.",
    chapters: [
      { title: "Start here", level: "Beginner", summary: "The exam and how to plan for it.", topics: [["NDA Exam Pattern and Syllabus", ["The two papers: Mathematics and the General Ability Test", "Marks, timing and negative marking", "Building a study plan"]]] },
      { title: "Mathematics", level: "Intermediate", summary: "The topics that carry the most marks.", topics: [
        ["Trigonometry for NDA", ["Ratios, identities and heights and distances", "Inverse trigonometric functions", "Shortcut methods for MCQs"]],
        ["Matrices and Determinants for NDA", ["Matrix operations", "Determinants and their properties", "Adjoint, inverse and equations"]],
        ["Calculus for NDA", ["Limits and continuity", "Differentiation and its applications", "Integration and area under curves"]],
      ] },
      { title: "General Ability Test", level: "Intermediate", summary: "English, science and general studies.", topics: [
        ["English for NDA", ["Spotting errors and sentence improvement", "Vocabulary: synonyms and antonyms", "Comprehension and ordering"]],
        ["Physics for NDA", ["Mechanics and motion", "Heat, light and sound", "Electricity and magnetism basics"]],
        ["History and Polity for NDA", ["Indian national movement", "The Constitution and Parliament", "Fast revision of high-yield facts"]],
      ] },
      { title: "After the written exam", level: "All levels", summary: "The SSB interview.", topics: [["SSB Interview Preparation", ["The five-day SSB process", "Psychology tests and group tasks", "The personal interview"]]] },
    ] },
  { id: "ctet", group: "exams", name: "CTET / TET", playlist: "CTET and TET: pedagogy to strategy", color: "#c96442", tagline: "Teacher eligibility tests: child development and pedagogy, subject pedagogy and exam strategy.",
    chapters: [
      { title: "Child development and pedagogy", level: "Beginner", summary: "The paper every candidate takes.", topics: [
        ["Child Development and Pedagogy", ["Principles of child development", "Heredity and environment", "Learning and the role of the teacher"]],
        ["Piaget, Vygotsky and Kohlberg", ["Piaget's stages of cognitive development", "Vygotsky's zone of proximal development", "Kohlberg's stages of moral development"]],
        ["Inclusive Education", ["Learners with special needs", "Addressing diverse backgrounds", "Inclusive classroom practices"]],
      ] },
      { title: "Subject pedagogy", level: "Intermediate", summary: "How to teach each subject, as the paper asks it.", topics: [
        ["Mathematics Pedagogy", ["Nature of mathematics and learners' thinking", "Error analysis and remedial teaching", "Evaluation in mathematics"]],
        ["EVS Pedagogy", ["Concept and scope of EVS", "Activities, experiments and field visits", "Continuous and comprehensive evaluation"]],
        ["Hindi Pedagogy", ["Principles of language learning", "Listening, speaking, reading and writing", "Assessing language skills"]],
        ["English Pedagogy", ["Language acquisition and learning", "Teaching the four skills", "Remedial teaching and assessment"]],
      ] },
      { title: "Strategy", level: "All levels", summary: "Plan the last months well.", topics: [["CTET Exam Strategy", ["Paper I and Paper II", "Previous-year question patterns", "Time management in the exam"]]] },
    ] },
  { id: "defence", group: "exams", name: "Defence (CDS, AFCAT)", playlist: "Defence exams: CDS, AFCAT and Agniveer", color: "#2f4f6f", tagline: "Combined Defence Services, AFCAT and Agniveer: syllabus, subjects and strategy.",
    chapters: [
      { title: "CDS", level: "Intermediate", summary: "Combined Defence Services exam.", topics: [
        ["CDS Syllabus and Strategy", ["IMA, INA, AFA and OTA entries", "The three papers and marking", "A preparation plan"]],
        ["CDS Elementary Mathematics", ["Arithmetic and algebra", "Geometry and mensuration", "Trigonometry and statistics"]],
        ["CDS English", ["Grammar and error spotting", "Vocabulary", "Reading comprehension"]],
        ["CDS General Knowledge", ["History, geography and polity", "General science", "Current affairs"]],
      ] },
      { title: "AFCAT and Agniveer", level: "Intermediate", summary: "Air Force Common Admission Test and Agniveer.", topics: [
        ["AFCAT Preparation Strategy", ["Exam pattern and sections", "What to study first", "Mock tests and revision"]],
        ["AFCAT Reasoning and Military Aptitude", ["Verbal and non-verbal reasoning", "Spatial ability", "Practice with timed sets"]],
        ["AFCAT Numerical Ability", ["Percentages, ratios and averages", "Time, speed and distance", "Shortcut calculations"]],
        ["Agniveer Exam Strategy", ["Eligibility and selection stages", "Subjects in the written test", "Physical test preparation"]],
      ] },
    ] },
  { id: "bankpo", group: "exams", name: "Bank PO", playlist: "Bank PO: SBI PO and IBPS PO", color: "#1f6f5c", tagline: "Quantitative aptitude, reasoning, English and banking awareness for SBI PO and IBPS PO.",
    chapters: [
      { title: "Start here", level: "Beginner", summary: "The exam and the plan.", topics: [["Bank PO Exam Pattern and Strategy", ["Prelims, mains and interview", "Sections and sectional timing", "A study plan that works"]]] },
      { title: "Quantitative aptitude", level: "Intermediate", summary: "Speed and accuracy with numbers.", topics: [
        ["Data Interpretation", ["Tables, bar and line graphs", "Pie charts and caselets", "Calculation shortcuts"]],
        ["Simplification and Approximation", ["BODMAS and fast arithmetic", "Approximation tricks", "Practice under time"]],
      ] },
      { title: "Reasoning and English", level: "Intermediate", summary: "Puzzles, syllogisms and reading.", topics: [
        ["Puzzles and Seating Arrangement", ["Linear and circular arrangements", "Floor and box puzzles", "Drawing the right diagram fast"]],
        ["Syllogism", ["Statements and conclusions", "Venn diagram method", "'Possibility' questions"]],
        ["Reading Comprehension", ["Reading strategies for long passages", "Inference and main-idea questions", "Vocabulary in context"]],
      ] },
      { title: "Banking awareness and interview", level: "All levels", summary: "For mains and the interview.", topics: [
        ["Banking Awareness", ["RBI and monetary policy", "Types of banks and accounts", "Recent banking terms"]],
        ["Bank PO Interview Preparation", ["Common interview questions", "Talking about banking and current affairs", "Body language and confidence"]],
      ] },
    ] },
  { id: "railways", group: "exams", name: "Railways (RRB)", playlist: "Railways: RRB NTPC and Group D", color: "#8a3b2a", tagline: "RRB NTPC and Group D: maths, reasoning, general science and general awareness.",
    chapters: [
      { title: "Start here", level: "Beginner", summary: "The exams and the plan.", topics: [["RRB NTPC Exam Pattern and Strategy", ["CBT 1 and CBT 2", "Subjects and marks", "A study plan"]]] },
      { title: "Mathematics", level: "Intermediate", summary: "The arithmetic every railway exam asks.", topics: [
        ["Percentage", ["Percentage basics and fractions", "Increase, decrease and successive change", "Exam-level questions"]],
        ["Time and Work", ["Work-efficiency method", "Pipes and cisterns", "Previous-year questions"]],
      ] },
      { title: "Reasoning, science and awareness", level: "Intermediate", summary: "The non-maths sections.", topics: [
        ["Coding-Decoding", ["Letter and number coding", "New-pattern coding", "Quick solving methods"]],
        ["General Science", ["Physics basics", "Chemistry basics", "Biology basics"]],
        ["Static General Awareness", ["History and geography facts", "Polity and economy basics", "Important days, awards and books"]],
        ["Group D Science", ["Science topics in Group D", "Most-asked questions", "Fast revision"]],
      ] },
      { title: "Practice", level: "Advanced", summary: "Real past papers.", topics: [
        ["Previous-Year Maths Questions", ["Solving real past questions", "Spotting repeated patterns", "Time-saving methods"]],
      ] },
    ] },
  { id: "cbi", group: "exams", name: "CBI (SSC CGL)", playlist: "CBI Sub-Inspector through SSC CGL", color: "#4a3b8a", tagline: "Sub-Inspector posts in the CBI are filled through SSC CGL: the job, the exam and the subjects.",
    chapters: [
      { title: "The job and the exam", level: "Beginner", summary: "What the post is and how SSC CGL selects for it.", topics: [
        ["CBI Sub-Inspector: Job Profile", ["What a CBI Sub-Inspector does", "Physical standards and eligibility", "Pay, posting and career growth"]],
        ["SSC CGL Exam Pattern and Strategy", ["Tier 1 and Tier 2", "Subjects and marks", "A preparation plan"]],
      ] },
      { title: "Subjects", level: "Intermediate", summary: "Reasoning, awareness, English and maths.", topics: [
        ["Reasoning: Analogy and Series", ["Number and letter analogies", "Missing-term series", "Speed techniques"]],
        ["General Awareness: Polity", ["The Constitution and its features", "Parliament, President and judiciary", "Frequently asked facts"]],
        ["English Vocabulary", ["Synonyms and antonyms", "Idioms and one-word substitution", "Learning words that stick"]],
        ["Maths: Geometry", ["Triangles and their centres", "Circles and polygons", "Geometry shortcuts"]],
        ["Maths: Algebra", ["Identities", "Simplifying algebraic expressions", "Exam-level problems"]],
        ["Current Affairs", ["National and international news", "Schemes, awards and sports", "Revising current affairs"]],
      ] },
    ] },
  { id: "incometax", group: "exams", name: "Income Tax (SSC CGL)", playlist: "Income Tax Inspector through SSC CGL", color: "#6f5a1f", tagline: "Income Tax Inspector posts are filled through SSC CGL: the job, the exam and the subjects.",
    chapters: [
      { title: "The job", level: "Beginner", summary: "What an Income Tax Inspector does.", topics: [["Income Tax Inspector: Job Profile", ["Duties of an Income Tax Inspector", "Eligibility and selection through SSC CGL", "Pay and career growth"]]] },
      { title: "Subjects", level: "Intermediate", summary: "Maths, English, reasoning and awareness.", topics: [
        ["Maths: Number System", ["Divisibility and remainders", "HCF and LCM", "Unit digits and factors"]],
        ["Maths: Trigonometry", ["Ratios and identities", "Heights and distances", "Maximum and minimum values"]],
        ["Maths: Data Interpretation", ["Tables and charts", "Percentage-based questions", "Fast calculation"]],
        ["English: Error Spotting", ["Common grammar rules", "Spotting the error quickly", "Practice sentences"]],
        ["Reasoning: Blood Relations", ["Family-tree method", "Coded relations", "Tricky question types"]],
        ["General Awareness: Economics", ["Basic economic concepts", "Budget, banking and inflation", "Most-asked questions"]],
      ] },
      { title: "Strategy", level: "Advanced", summary: "Plan Tier 2.", topics: [["SSC CGL Tier 2 Strategy", ["Tier 2 papers and weightage", "Mock tests and analysis", "Final-month revision"]]] },
    ] },

  { id: "upsc", group: "exams", name: "UPSC CSE", playlist: "UPSC Civil Services: prelims to mains", color: "#8a3b2a", tagline: "The UPSC Civil Services Examination: the pattern, NCERT foundations and the core General Studies subjects.",
    chapters: [
      { title: "Start here", level: "Beginner", summary: "The exam and where to begin.", topics: [
        ["UPSC CSE Exam Pattern and Syllabus", ["Prelims, Mains and the Personality Test", "GS papers, CSAT and the optional", "How to read the syllabus"]],
        ["How to Read NCERTs for UPSC", ["Which NCERT books to read", "Reading for concepts and facts", "Making notes you can revise"]],
      ] },
      { title: "General Studies", level: "Intermediate", summary: "The subjects that carry the most marks.", topics: [
        ["Indian Polity", ["The making and features of the Constitution", "Fundamental Rights and Directive Principles", "Parliament, executive and judiciary"]],
        ["Modern Indian History", ["British expansion and the 1857 revolt", "The national movement", "Independence and Partition"]],
        ["Indian and World Geography", ["Physical geography basics", "Indian rivers, climate and soils", "Mapping practice"]],
        ["Indian Economy", ["National income, inflation and money", "Budget and fiscal policy", "Banking and the RBI"]],
        ["Environment and Ecology", ["Ecosystems and biodiversity", "Climate change and conventions", "Protected areas in India"]],
      ] },
      { title: "Prelims strategy", level: "Advanced", summary: "Current affairs and CSAT.", topics: [
        ["Current Affairs Strategy", ["Reading the newspaper for UPSC", "Linking news to the syllabus", "Monthly revision"]],
        ["CSAT Paper II", ["Comprehension", "Quantitative aptitude and reasoning", "Clearing the qualifying cut-off"]],
      ] },
    ] },
  { id: "ias", group: "exams", name: "IAS", playlist: "IAS: mains, essay, ethics and interview", color: "#6b2f5a", tagline: "Becoming an IAS officer: the role, Mains answer writing, the Essay and Ethics papers, the optional and the interview.",
    chapters: [
      { title: "The service", level: "Beginner", summary: "What the job is.", topics: [
        ["What an IAS Officer Does", ["Roles from SDM to Secretary", "Training at LBSNAA", "Choosing IAS among the services"]],
      ] },
      { title: "Mains", level: "Advanced", summary: "Writing that scores.", topics: [
        ["Mains Answer Writing", ["Structuring an answer: introduction, body, conclusion", "Using examples, data and diagrams", "Practising under time"]],
        ["The Essay Paper", ["Choosing a topic", "Building a multi-dimensional essay", "Introductions and conclusions that stand out"]],
        ["Ethics, Integrity and Aptitude (GS IV)", ["Key ethical concepts and thinkers", "Case studies", "Writing balanced answers"]],
        ["Choosing an Optional Subject", ["Interest, background and overlap with GS", "Success rates and resources", "Making the final choice"]],
      ] },
      { title: "The final stage", level: "All levels", summary: "Interview and toppers' advice.", topics: [
        ["The Personality Test (Interview)", ["The Detailed Application Form", "What the board looks for", "Mock interviews"]],
        ["Toppers' Strategy", ["Daily routines that worked", "Revision and test series", "Staying consistent"]],
      ] },
    ] },
  { id: "pcs", group: "exams", name: "State PCS", playlist: "State PCS: UPPSC, BPSC, MPPSC and RAS", color: "#5a4b2a", tagline: "State civil services exams: what a PCS officer does, the major state exams and how to prepare.",
    chapters: [
      { title: "Start here", level: "Beginner", summary: "The service and the exams.", topics: [
        ["What is PCS?", ["State civil services and their posts", "How PCS differs from UPSC", "Choosing your state exam"]],
      ] },
      { title: "State exams", level: "Intermediate", summary: "The patterns of the big state exams.", topics: [
        ["UPPSC PCS", ["Exam pattern and syllabus", "Uttar Pradesh special topics", "A study plan"]],
        ["BPSC", ["Exam pattern and syllabus", "Bihar special topics", "A study plan"]],
        ["MPPSC", ["Exam pattern and syllabus", "Madhya Pradesh special topics", "A study plan"]],
        ["RAS (RPSC)", ["Exam pattern and syllabus", "Rajasthan special topics", "A study plan"]],
      ] },
      { title: "Preparation", level: "Advanced", summary: "State GK and mains writing.", topics: [
        ["State-Specific General Knowledge", ["History and culture of your state", "Geography and economy of your state", "Schemes and current affairs"]],
        ["PCS Mains Answer Writing", ["Answer structure", "Using state examples", "Practice and evaluation"]],
      ] },
    ] },
  { id: "ssc", group: "exams", name: "SSC", playlist: "SSC: CGL, CHSL, MTS and GD", color: "#2a5a8a", tagline: "Staff Selection Commission exams: the major exams and the four subjects they share.",
    chapters: [
      { title: "The exams", level: "Beginner", summary: "Which SSC exam is which.", topics: [
        ["SSC Exams Explained", ["CGL, CHSL, MTS, GD, CPO and more", "Eligibility and posts", "Choosing your exam"]],
        ["SSC CGL Exam Pattern", ["Tier 1 and Tier 2", "Subjects and marks", "Normalisation and cut-offs"]],
        ["SSC CHSL Preparation", ["Exam pattern", "Typing and skill test", "A study plan"]],
        ["SSC GD Constable", ["Exam pattern", "Physical tests", "A study plan"]],
      ] },
      { title: "Subjects", level: "Intermediate", summary: "The four sections in every SSC exam.", topics: [
        ["Maths: Percentage and Profit and Loss", ["Percentage basics", "Profit, loss and discount", "Exam-level questions"]],
        ["English for SSC", ["Grammar rules that are tested", "Vocabulary and idioms", "Cloze test and comprehension"]],
        ["Reasoning for SSC", ["Analogy, series and coding", "Non-verbal reasoning", "Speed and accuracy"]],
        ["General Knowledge for SSC", ["Static GK", "History, polity and geography facts", "Current affairs"]],
      ] },
    ] },
  { id: "police", group: "exams", name: "Police", playlist: "Police: constable and sub-inspector", color: "#2a3f6f", tagline: "Police recruitment: constable and sub-inspector exams, the written subjects and the physical test.",
    chapters: [
      { title: "The exams", level: "Beginner", summary: "Major police recruitment exams.", topics: [
        ["UP Police Constable", ["Exam pattern and syllabus", "Eligibility", "A study plan"]],
        ["Delhi Police Constable", ["Exam pattern and syllabus", "Eligibility", "A study plan"]],
        ["SSC CPO Sub-Inspector", ["Delhi Police and CAPF SI posts", "Paper 1, PET and Paper 2", "A study plan"]],
      ] },
      { title: "Written subjects", level: "Intermediate", summary: "Reasoning, GK and maths.", topics: [
        ["Reasoning for Police Exams", ["Most-asked reasoning topics", "Shortcut methods", "Practice questions"]],
        ["General Knowledge for Police Exams", ["Static GK", "Constitution and law basics", "Current affairs"]],
        ["Maths for Police Exams", ["Arithmetic essentials", "Percentage, average and ratio", "Speed methods"]],
      ] },
      { title: "Physical test", level: "All levels", summary: "Clearing the PET and PST.", topics: [
        ["Physical Test Preparation", ["Running, long jump and high jump standards", "A training plan", "Diet and recovery"]],
      ] },
    ] },
  { id: "ca", group: "exams", name: "CA", playlist: "CA: Foundation to Final", color: "#1f5a4a", tagline: "The Chartered Accountancy course: how it works, the Foundation papers and strategy for Intermediate and Final.",
    chapters: [
      { title: "Start here", level: "Beginner", summary: "How the CA course works.", topics: [
        ["The CA Course Explained", ["Foundation, Intermediate and Final", "Articleship and registration", "Duration and costs"]],
      ] },
      { title: "CA Foundation", level: "Intermediate", summary: "The four Foundation papers.", topics: [
        ["Principles and Practice of Accounting", ["Accounting concepts and journal entries", "Final accounts", "Partnership and company accounts basics"]],
        ["Business Laws", ["The Indian Contract Act", "The Sale of Goods Act", "Partnership and LLP law"]],
        ["Quantitative Aptitude", ["Ratio, equations and maths of finance", "Logical reasoning", "Statistics"]],
        ["Business Economics", ["Demand and supply", "Theory of production and cost", "Market forms and business cycles"]],
      ] },
      { title: "Beyond Foundation", level: "Advanced", summary: "Intermediate, Final and articleship.", topics: [
        ["CA Intermediate Strategy", ["Group 1 and Group 2 papers", "Study plan and revision", "Mock test practice"]],
        ["CA Final Strategy", ["The Final papers", "Self-study and revision", "Exam-day approach"]],
        ["Articleship Guide", ["Choosing a firm", "What you learn", "Balancing articleship and study"]],
      ] },
    ] },

  /* ---------- IELTS ---------- */
  { id: "ielts", group: "ielts", name: "IELTS", playlist: "IELTS: all four skills, step by step", color: "#b5302a", tagline: "Listening, Reading, Writing and Speaking, with tips and practice for a higher band score.",
    chapters: [
      { title: "Listening", level: "Beginner", summary: "The four parts and how to score.", topics: [
        ["IELTS Listening: Tips", ["What each of the four parts tests", "Reading ahead and predicting answers", "Spelling, plurals and word limits"]],
        ["IELTS Listening: Practice", ["Working through a practice test", "Following signposting language", "Checking answers"]],
      ] },
      { title: "Reading", level: "Intermediate", summary: "Question types that cost marks.", topics: [
        ["Reading: True, False, Not Given", ["Telling False from Not Given", "Finding the matching sentence", "Common traps"]],
        ["Reading: Matching Headings", ["Reading for the main idea", "Ruling out distractors", "Managing time across passages"]],
      ] },
      { title: "Writing", level: "Intermediate", summary: "Task 1 and Task 2.", topics: [
        ["Writing Task 1 (Academic)", ["Describing charts, tables, maps and processes", "Writing an overview", "Selecting key features"]],
        ["Writing Task 2: the Essay", ["Essay types and structures", "Building clear arguments", "What examiners look for"]],
      ] },
      { title: "Speaking", level: "Intermediate", summary: "All three parts.", topics: [
        ["Speaking Part 1", ["Familiar topics and short answers", "Extending answers naturally", "Fluency and pronunciation"]],
        ["Speaking Part 2: the Cue Card", ["Using the one-minute preparation", "Speaking for two minutes", "Structuring the story"]],
        ["Speaking Part 3", ["Discussing abstract ideas", "Giving reasons and examples", "Agreeing, disagreeing and speculating"]],
      ] },
      { title: "Band scores", level: "All levels", summary: "How you are marked.", topics: [["IELTS Band Scores Explained", ["The nine-band scale", "How each skill is marked", "Raising your overall band"]]] },
    ] },
] as const satisfies readonly ExamPlaylist[];

export type ExamPlaylistId = (typeof EXAM_PLAYLISTS)[number]["id"];
/** "<playlist>#<topic index>" for every topic, in order: the search plan and the generated video map use the same keys. */
export const examTopicKeys = () => (EXAM_PLAYLISTS as readonly ExamPlaylist[]).flatMap(p => p.chapters.flatMap(c => [...c.topics]).map((_, i) => `${p.id}#${i}`));
