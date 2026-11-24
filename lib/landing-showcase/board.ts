import type { ShowcaseSlide, Stars } from "./types";
import { boardChapterImage } from "../exam-images";

/** A painted Board Exams chapter picture (learning-images bucket), or the local board picture when none is configured. */
const chapter = (cls: string, subject: string, name: string, fallback: string) => boardChapterImage(cls, subject, name) ?? fallback;

/*
 * Board Exams showcase: UP Board, CBSE and ICSE / ISC; Class 10 and 12; Mathematics, Physics, Chemistry and English.
 * Paper patterns follow lib/board-exams/boards.ts (copied here so the landing chunk does not pull in the question
 * banks). Sample questions are written for this page with worked answers; `boards` says which boards set the topic.
 * Past papers belong to the boards, so this page links to each board's official archive instead of reproducing them.
 */
export type BoardId = "up" | "cbse" | "icse";
export type ClassId = "10" | "12";
export type SubjectId = "math" | "physics" | "chemistry" | "english";

export type BoardSlide = ShowcaseSlide & { id: BoardId; name: string; exam: Record<ClassId, string> };
export const BOARD_SLIDES: BoardSlide[] = [
  {
    id: "up", name: "UP Board", logo: "/images/exams/board-up.png", image: chapter("10", "math", "Real Numbers", "/images/landing/hero-board-exams.webp"), fallback: "/images/landing/hero-board-exams.webp", focus: "50% 40%",
    alt: "A Class 10 student in school uniform building a factor tree for Real Numbers, with a compass and geometry set",
    kicker: "UP Board · UPMSP", title: "High School and Intermediate", text: "NCERT-based papers with a 20-mark OMR section in Class 10, and 70 or 100-mark papers in Class 12.",
    facts: ["Class 10 & 12", "3 h 15 min papers"], exam: { "10": "High School", "12": "Intermediate" },
  },
  {
    id: "cbse", name: "CBSE", logo: "/images/exams/board-cbse.png", image: chapter("12", "physics", "Alternating Current", "/images/landing/slide-exams.webp"), fallback: "/images/landing/slide-exams.webp", focus: "45% 50%",
    alt: "A Class 12 student testing an AC circuit with a transformer, a bulb and an oscilloscope showing a sine wave",
    kicker: "CBSE", title: "Competency and case-based papers", text: "Sections A to E: MCQs and assertion–reason, 2, 3 and 5-mark answers, and case-based questions.",
    facts: ["Class 10 & 12", "3 h papers"], exam: { "10": "Class 10", "12": "Class 12" },
  },
  {
    id: "icse", name: "ICSE / ISC", logo: "/images/exams/board-icse.png", image: chapter("10", "physics", "Electricity", "/images/landing/hero-board-exams.webp"), fallback: "/images/landing/hero-board-exams.webp", focus: "50% 45%",
    alt: "A Class 10 student wiring an electric circuit for the Electricity chapter",
    kicker: "CISCE · ICSE / ISC", title: "Separate science papers, compulsory Section A", text: "ICSE for Class 10 and ISC for Class 12: Physics and Chemistry as separate papers, with a choice of questions in Section B.",
    facts: ["ICSE & ISC", "2 h to 3 h papers"], exam: { "10": "ICSE", "12": "ISC" },
  },
];

export const BOARD_SUBJECTS: { id: SubjectId; name: string; mark: string }[] = [
  { id: "math", name: "Mathematics", mark: "∑" }, { id: "physics", name: "Physics", mark: "Φ" },
  { id: "chemistry", name: "Chemistry", mark: "⚗" }, { id: "english", name: "English", mark: "Aa" },
];

type Pattern = { paper: string; marks: number; minutes: number; sections: string };
const p = (paper: string, marks: number, minutes: number, sections: string): Pattern => ({ paper, marks, minutes, sections });
export const PATTERNS: Record<BoardId, Record<ClassId, Record<SubjectId, Pattern>>> = {
  up: {
    "10": {
      math: p("Mathematics", 70, 195, "Part A: 20 one-mark MCQs on the OMR sheet · Part B: 50 marks of descriptive questions"),
      physics: p("Science (Physics portion)", 70, 195, "Part A: 20 one-mark MCQs · Part B: descriptive questions across Physics, Chemistry and Biology"),
      chemistry: p("Science (Chemistry portion)", 70, 195, "Part A: 20 one-mark MCQs · Part B: descriptive questions across Physics, Chemistry and Biology"),
      english: p("English", 70, 195, "Part A: 20 one-mark MCQs · Part B: reading, writing, grammar and literature"),
    },
    "12": {
      math: p("Mathematics", 100, 195, "Multiple-choice, very short, short and long answers with internal choice"),
      physics: p("Physics", 70, 195, "Multiple-choice, very short, short and long answers; numericals and derivations"),
      chemistry: p("Chemistry", 70, 195, "Multiple-choice, very short, short and long answers; reactions and numericals"),
      english: p("English", 100, 195, "Reading, writing, grammar and literature"),
    },
  },
  cbse: {
    "10": {
      math: p("Mathematics (Standard)", 80, 180, "A: MCQs and assertion–reason · B: 2 marks · C: 3 marks · D: 5 marks · E: case-based, 4 marks"),
      physics: p("Science (Physics portion)", 80, 180, "A: MCQs · B: 2 marks · C: 3 marks · D: 5 marks · E: case-based"),
      chemistry: p("Science (Chemistry portion)", 80, 180, "A: MCQs · B: 2 marks · C: 3 marks · D: 5 marks · E: case-based"),
      english: p("English Language and Literature", 80, 180, "A: Reading · B: Writing and Grammar · C: Literature"),
    },
    "12": {
      math: p("Mathematics", 80, 180, "A: MCQs and assertion–reason · B: 2 marks · C: 3 marks · D: 5 marks · E: case-based, 4 marks"),
      physics: p("Physics", 70, 180, "A: MCQs · B: 2 marks · C: 3 marks · D: case-based, 4 marks · E: 5 marks"),
      chemistry: p("Chemistry", 70, 180, "A: MCQs · B: 2 marks · C: 3 marks · D: case-based, 4 marks · E: 5 marks"),
      english: p("English Core", 80, 180, "A: Reading · B: Creative Writing · C: Literature"),
    },
  },
  icse: {
    "10": {
      math: p("Mathematics", 80, 150, "Section A: 40 marks, compulsory · Section B: 40 marks, any four questions"),
      physics: p("Physics (Science Paper 1)", 80, 120, "Section A: 40 marks, compulsory · Section B: 40 marks, any four questions"),
      chemistry: p("Chemistry (Science Paper 2)", 80, 120, "Section A: 40 marks, compulsory · Section B: 40 marks, any four questions"),
      english: p("English Language (Paper 1)", 80, 120, "Composition · letter · notice and e-mail · comprehension · grammar"),
    },
    "12": {
      math: p("Mathematics", 80, 180, "Section A: compulsory · Section B or Section C: choose one"),
      physics: p("Physics (Paper 1, Theory)", 70, 180, "A: objective · B: short answer · C: long answer · D: case or detailed answer"),
      chemistry: p("Chemistry (Paper 1, Theory)", 70, 180, "A: objective · B: short answer · C: long answer · D: case or detailed answer"),
      english: p("English Language (Paper 1)", 80, 180, "Composition · directed writing · proposal · grammar · comprehension"),
    },
  },
};

/**
 * A sample-paper question. `options` makes it an MCQ (`answer` is then the option's index as text). `steps` is the
 * worked answer, one line per step; `image` is the chapter's subject in the exams picture set (organic or inorganic
 * for chemistry), so the card can ask for that chapter's painted picture.
 */
export type PaperQuestion = { ch: string; marks: number; stars: Stars; q: string; options?: string[]; steps: string[]; answer: string; boards: BoardId[]; image: string };
const ALL: BoardId[] = ["up", "cbse", "icse"];
const NCERT: BoardId[] = ["up", "cbse"];

export const SAMPLE_PAPERS: Record<`${ClassId}-${SubjectId}`, PaperQuestion[]> = {
  "10-math": [
    { ch: "Real Numbers", marks: 1, stars: 4, boards: NCERT, image: "math", q: "The HCF of 96 and 404 is", options: ["4", "8", "12", "16"], steps: ["96 = 2⁵ × 3", "404 = 2² × 101", "Common factor: 2²"], answer: "(a) 4" },
    { ch: "Quadratic Equations", marks: 2, stars: 5, boards: ALL, image: "math", q: "Find the discriminant of 2x² − 4x + 3 = 0 and state the nature of its roots.", steps: ["D = b² − 4ac = (−4)² − 4(2)(3)", "D = 16 − 24 = −8", "D < 0"], answer: "The equation has no real roots." },
    { ch: "Arithmetic Progressions", marks: 3, stars: 5, boards: ALL, image: "math", q: "Find the sum of the first 20 terms of the AP 3, 7, 11, …", steps: ["a = 3, d = 4, n = 20", "Sₙ = n/2 [2a + (n − 1)d]", "S₂₀ = 10 [6 + 19 × 4] = 10 × 82"], answer: "S₂₀ = 820" },
    { ch: "Heights and Distances", marks: 4, stars: 5, boards: ALL, image: "math", q: "The angle of elevation of the top of a tower from a point 20 m from its foot is 60°. Find the height of the tower.", steps: ["tan 60° = h / 20", "h = 20 × √3", "h = 20 × 1.732"], answer: "h = 20√3 m ≈ 34.64 m" },
  ],
  "10-physics": [
    { ch: "Light: Refraction", marks: 1, stars: 4, boards: ALL, image: "physics", q: "The SI unit of the power of a lens is", options: ["metre", "dioptre", "watt", "joule"], steps: ["P = 1/f, with f in metres", "1 m⁻¹ is called a dioptre"], answer: "(b) dioptre" },
    { ch: "Electricity", marks: 2, stars: 5, boards: ALL, image: "physics", q: "Find the resistance of a bulb rated 100 W, 220 V.", steps: ["P = V² / R, so R = V² / P", "R = (220)² / 100 = 48400 / 100"], answer: "R = 484 Ω" },
    { ch: "Light: Reflection", marks: 3, stars: 5, boards: NCERT, image: "physics", q: "An object is 30 cm in front of a concave mirror of focal length 15 cm. Find the position and nature of the image.", steps: ["u = −30 cm, f = −15 cm", "1/v = 1/f − 1/u = −1/15 + 1/30 = −1/30", "v = −30 cm, m = −v/u = −1"], answer: "Image at 30 cm in front of the mirror: real, inverted, same size." },
    { ch: "Calorimetry", marks: 3, stars: 5, boards: ["icse"], image: "physics", q: "How much heat is needed to raise 500 g of water from 20 °C to 70 °C? (c = 4200 J kg⁻¹ K⁻¹)", steps: ["Q = m c Δθ", "Q = 0.5 × 4200 × 50"], answer: "Q = 105 000 J = 105 kJ" },
    { ch: "Human Eye", marks: 5, stars: 5, boards: NCERT, image: "physics", q: "What is myopia? Give two causes and explain how it is corrected.", steps: ["// Defect", "A myopic eye sees near objects clearly but not distant ones; the image forms in front of the retina.", "// Causes", "The eyeball is too long, or the eye lens is too curved (focal length too short).", "// Correction", "A concave lens of suitable power diverges the rays so the image forms on the retina."], answer: "Myopia (near-sightedness) is corrected with a concave lens." },
  ],
  "10-chemistry": [
    { ch: "Chemical Reactions", marks: 1, stars: 4, boards: ALL, image: "inorganic", q: "2Mg + O₂ → 2MgO is an example of a", options: ["combination reaction", "decomposition reaction", "displacement reaction", "double displacement reaction"], steps: ["Two reactants join to form a single product"], answer: "(a) combination reaction" },
    { ch: "Acids, Bases and Salts", marks: 2, stars: 5, boards: ALL, image: "inorganic", q: "What is the pH of a neutral solution at 25 °C? What happens to the pH of an acid when it is diluted?", steps: ["Neutral: [H⁺] = 10⁻⁷ mol/L, so pH = 7", "Dilution lowers [H⁺], so the pH rises towards 7"], answer: "pH 7; the acid's pH increases on dilution." },
    { ch: "Metals and Non-metals", marks: 3, stars: 5, boards: ALL, image: "inorganic", q: "Write balanced equations: (i) zinc with dilute sulphuric acid (ii) iron with copper sulphate solution.", steps: ["(i) Zn + H₂SO₄ → ZnSO₄ + H₂↑", "(ii) Fe + CuSO₄ → FeSO₄ + Cu", "// Iron is more reactive than copper, so it displaces it"], answer: "Both are displacement reactions." },
    { ch: "Carbon Compounds", marks: 5, stars: 5, boards: ALL, image: "organic", q: "What is a homologous series? Give its characteristics with an example.", steps: ["A family of compounds with the same functional group and general formula.", "Successive members differ by –CH₂–, a mass of 14 u.", "Chemical properties are similar; physical properties change gradually.", "Example: alkanes CₙH₂ₙ₊₂: CH₄, C₂H₆, C₃H₈"], answer: "Same functional group, differ by CH₂, similar chemistry." },
  ],
  "10-english": [
    { ch: "Grammar: Voice", marks: 1, stars: 4, boards: ALL, image: "english", q: "Choose the passive form of: She writes a letter.", options: ["A letter was written by her.", "A letter is written by her.", "A letter has been written by her.", "A letter is being written by her."], steps: ["Simple present active → is/am/are + past participle"], answer: "(b) A letter is written by her." },
    { ch: "Grammar: Reported Speech", marks: 2, stars: 5, boards: ALL, image: "english", q: "Report: The teacher said, \"The Earth revolves around the Sun.\"", steps: ["// A universal truth keeps its tense", "said, \"…\" → said that …"], answer: "The teacher said that the Earth revolves around the Sun." },
    { ch: "Writing: Formal Letter", marks: 5, stars: 5, boards: ALL, image: "english", q: "Write the format of a formal letter of complaint.", steps: ["Sender's address and date", "Receiver's designation and address", "Subject line", "Salutation: Sir / Madam", "Body: the problem, its effect, the action you request", "Complimentary close, name and signature"], answer: "Address · date · receiver · subject · salutation · body · close" },
    { ch: "Literature: First Flight", marks: 5, stars: 5, boards: ["cbse"], image: "english", q: "In 'A Letter to God', why did Lencho call the post office employees 'a bunch of crooks'?", steps: ["Lencho asked God for 100 pesos after the hailstorm destroyed his crop.", "The postmaster collected 70 pesos from his staff and himself and sent them.", "Lencho believed God could not err, so he decided the employees had kept the rest."], answer: "The irony: the people who helped him are the ones he blames." },
    { ch: "Literature: Julius Caesar", marks: 5, stars: 5, boards: ["icse"], image: "english", q: "Why does Brutus join the conspiracy against Caesar?", steps: ["He loves Rome more than his friend Caesar.", "He fears Caesar's ambition will make him a tyrant.", "Cassius plays on this with forged letters that seem to come from citizens."], answer: "For the good of Rome, as he sees it: 'Not that I loved Caesar less, but that I loved Rome more.'" },
  ],
  "12-math": [
    { ch: "Determinants", marks: 1, stars: 5, boards: ALL, image: "math", q: "If A is a 3 × 3 matrix with |A| = 4, then |2A| is", options: ["8", "16", "32", "64"], steps: ["|kA| = kⁿ |A| for an n × n matrix", "|2A| = 2³ × 4"], answer: "(c) 32" },
    { ch: "Continuity and Differentiability", marks: 2, stars: 5, boards: ALL, image: "math", q: "Differentiate sin(x²) with respect to x.", steps: ["Chain rule: d/dx sin(u) = cos(u) · du/dx", "u = x², du/dx = 2x"], answer: "2x cos(x²)" },
    { ch: "Integrals", marks: 3, stars: 5, boards: ALL, image: "math", q: "Evaluate ∫₀^{π/2} sin²x dx.", steps: ["sin²x = (1 − cos 2x) / 2", "= ½ [x − (sin 2x)/2] from 0 to π/2", "= ½ (π/2 − 0)"], answer: "π/4" },
    { ch: "Linear Programming", marks: 5, stars: 5, boards: ALL, image: "math", q: "Maximise Z = 3x + 2y subject to x + y ≤ 4, x ≤ 3, x ≥ 0, y ≥ 0.", steps: ["Corner points: (0, 0), (3, 0), (3, 1), (0, 4)", "Z: 0, 9, 11, 8", "The largest value is at (3, 1)"], answer: "Maximum Z = 11 at x = 3, y = 1" },
  ],
  "12-physics": [
    { ch: "Semiconductors", marks: 1, stars: 4, boards: ALL, image: "physics", q: "In an n-type semiconductor the majority charge carriers are", options: ["holes", "electrons", "protons", "positive ions"], steps: ["Pentavalent donor atoms add free electrons"], answer: "(b) electrons" },
    { ch: "Dual Nature", marks: 2, stars: 5, boards: ALL, image: "physics", q: "Find the de Broglie wavelength of an electron accelerated through 100 V.", steps: ["λ = 1.227 / √V nm", "λ = 1.227 / √100 = 1.227 / 10"], answer: "λ ≈ 0.123 nm" },
    { ch: "Electric Charges and Fields", marks: 3, stars: 5, boards: ALL, image: "physics", q: "State Gauss's law and use it to find the field of an infinitely long straight wire with linear charge density λ.", steps: ["Gauss's law: ∮E·dA = q_enclosed / ε₀", "Take a cylinder of radius r, length l: E(2πrl) = λl / ε₀"], answer: "E = λ / (2πε₀r), directed radially" },
    { ch: "Alternating Current", marks: 5, stars: 5, boards: ALL, image: "physics", q: "Derive the impedance of a series LCR circuit and the condition for resonance.", steps: ["V_L and V_C are opposite in phase; V_R is in phase with the current", "V² = V_R² + (V_L − V_C)²", "Z = √(R² + (X_L − X_C)²)", "// Resonance", "X_L = X_C, so ωL = 1/ωC"], answer: "Z = √(R² + (X_L − X_C)²); resonance at f₀ = 1 / (2π√(LC)), where Z = R" },
  ],
  "12-chemistry": [
    { ch: "Solutions", marks: 1, stars: 4, boards: ALL, image: "inorganic", q: "Which of these is a colligative property?", options: ["Viscosity", "Surface tension", "Osmotic pressure", "Refractive index"], steps: ["Colligative properties depend only on the number of solute particles"], answer: "(c) Osmotic pressure" },
    { ch: "Chemical Kinetics", marks: 2, stars: 5, boards: ALL, image: "inorganic", q: "A first-order reaction has k = 0.0693 min⁻¹. Find its half-life.", steps: ["t½ = 0.693 / k", "t½ = 0.693 / 0.0693"], answer: "t½ = 10 min" },
    { ch: "Electrochemistry", marks: 3, stars: 5, boards: ALL, image: "inorganic", q: "Write the Nernst equation for the Daniell cell and find E°cell. (E°Zn²⁺/Zn = −0.76 V, E°Cu²⁺/Cu = +0.34 V)", steps: ["E°cell = E°cathode − E°anode = 0.34 − (−0.76)", "E_cell = E°cell − (0.059 / 2) log ([Zn²⁺] / [Cu²⁺])"], answer: "E°cell = 1.10 V" },
    { ch: "Aldehydes and Ketones", marks: 5, stars: 5, boards: ALL, image: "organic", q: "Explain aldol condensation with an example.", steps: ["Aldehydes and ketones with an α-hydrogen react in dilute alkali.", "2CH₃CHO —(dil. NaOH)→ CH₃CH(OH)CH₂CHO (3-hydroxybutanal, the aldol)", "On heating the aldol loses water:", "CH₃CH(OH)CH₂CHO → CH₃CH=CHCHO + H₂O (but-2-enal)"], answer: "Aldol addition, then dehydration to an α,β-unsaturated aldehyde." },
  ],
  "12-english": [
    { ch: "Literature: Flamingo", marks: 1, stars: 4, boards: ["cbse"], image: "english", q: "'The Last Lesson' was written by", options: ["Anees Jung", "Alphonse Daudet", "William Douglas", "A. R. Barton"], steps: ["A story of the last French lesson in Alsace after the Prussian order"], answer: "(b) Alphonse Daudet" },
    { ch: "Grammar: Narration", marks: 2, stars: 5, boards: ALL, image: "english", q: "Change into indirect speech: He said to me, \"Where are you going?\"", steps: ["said to → asked", "Question becomes a statement: no question mark", "are going → was going; you → I"], answer: "He asked me where I was going." },
    { ch: "Writing: Invitation", marks: 3, stars: 4, boards: ALL, image: "english", q: "How does a formal invitation differ from an informal one?", steps: ["Formal: written in the third person, no salutation or signature", "It gives the occasion, date, time, venue and RSVP", "Informal: a personal letter in the first person"], answer: "Formal invitations are third-person cards; informal ones are personal letters." },
    { ch: "Literature: Flamingo", marks: 5, stars: 5, boards: ["cbse"], image: "english", q: "How did William Douglas overcome his fear of water in 'Deep Water'?", steps: ["He hired an instructor, who trained him piece by piece over months.", "A rope and pulley tied to a belt held him while he learnt to breathe and kick.", "He then swam alone to test himself, and the terror did not return."], answer: "Through steady practice and will: 'All we have to fear is fear itself.'" },
  ],
};

/** The last five examination years, newest first, with a note where a board split its examination. */
export const PAST_FIVE: { year: number; notes: Partial<Record<BoardId, string>> }[] = [
  { year: 2026, notes: {} }, { year: 2025, notes: {} }, { year: 2024, notes: {} }, { year: 2023, notes: {} },
  { year: 2022, notes: { cbse: "Held in two terms", icse: "Held in two semesters" } },
];
