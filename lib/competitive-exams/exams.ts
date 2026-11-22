import { GOVERNMENT_EXAM_IDS } from "@/lib/audience";
import { extraFor } from "./extra";
import type { Pack } from "./types";
import { gkFor } from "./gk";
import { OBJECTIVE_MINIMUM, PRACTICE_PER_EXAM, practiceFor } from "./practice";
import type { QuickItem } from "../quick-qa";
import { buildSubjective } from "./subjective";

/*
 * The exam families shown as tabs on the Competitive Exams page, four to a page, in this order.
 * Paper patterns are written from memory and change between notifications, so the page asks the learner to confirm
 * them against the current official notification.
 */
export type ExamId = "nda" | "defence" | "banks" | "railways" | "tet" | "isro" | "upsc" | "ssc" | "state-psc" | "jee" | "neet" | "gate" | "cat" | "clat" | "cuet" | "ugc-net" | "police"
  | "cbi" | "income-tax" | "ib" | "insurance" | "epfo" | "coast-guard";
export type Exam = { id: ExamId; code: string; name: string; covers: string; pattern: string; written: string };

export const ALL_EXAMS: Exam[] = [
  { id: "nda", code: "NDA", name: "NDA", covers: "National Defence Academy and Naval Academy (NDA & NA)", pattern: "Two papers on the same day: Mathematics (120 questions, 300 marks) and the General Ability Test (150 questions, 600 marks), 2 h 30 min each, with negative marking; then the SSB interview (900 marks).", written: "SSB interview questions and lecturette topics with model answers" },
  { id: "defence", code: "DEF", name: "Defence", covers: "NDA, CDS, AFCAT, Agniveer", pattern: "NDA: Mathematics (300 marks) and General Ability Test (600 marks), 2 h 30 min each, then the SSB interview.", written: "SSB interview, lecturette and descriptive practice" },
  { id: "banks", code: "BANK", name: "Govt. Banks", covers: "IBPS PO and Clerk, SBI PO, RBI Grade B, RRB", pattern: "Prelims: English, Quantitative Aptitude and Reasoning, 100 marks in 60 minutes with sectional timing. Mains adds General Awareness and a descriptive paper.", written: "Descriptive paper (essay, letter) and interview" },
  { id: "railways", code: "RRB", name: "Railways Exams", covers: "RRB NTPC, Group D, ALP, JE", pattern: "NTPC CBT-1: 100 questions in 90 minutes from General Awareness (40), Mathematics (30) and Reasoning (30), with one-third negative marking.", written: "Short-answer revision and document-stage questions" },
  { id: "tet", code: "TET", name: "TET Exams", covers: "CTET, UPTET and other state TETs", pattern: "Paper 1 (classes 1 to 5): 150 questions in 2 h 30 min across Child Development and Pedagogy, two languages, Mathematics and Environmental Studies. No negative marking.", written: "Pedagogy short answers and teaching-interview questions" },
  { id: "isro", code: "ISRO", name: "ISRO Qualifying", covers: "ISRO Scientist/Engineer (ICRB), Technical Assistant", pattern: "Written test: 80 objective questions in 90 minutes in the candidate's discipline (Electronics, Mechanical or Computer Science), then an interview.", written: "Technical interview questions" },
  { id: "upsc", code: "UPSC", name: "UPSC Civil Services", covers: "IAS, IPS, IFS: Prelims and Mains", pattern: "Prelims: General Studies (100 questions, 200 marks) and CSAT (qualifying), 2 hours each. Mains: nine descriptive papers, then the personality test.", written: "Mains General Studies and essay" },
  { id: "ssc", code: "SSC", name: "SSC Exams", covers: "CGL, CHSL, MTS, GD Constable, CPO", pattern: "CGL Tier 1: 100 questions, 200 marks, 60 minutes across Reasoning, General Awareness, Quantitative Aptitude and English, with 0.50 negative marking.", written: "Short-answer revision and descriptive practice" },
  { id: "state-psc", code: "PSC", name: "State PSC", covers: "UPPSC, BPSC, MPPSC, RPSC and others", pattern: "Prelims: objective General Studies with a qualifying aptitude paper in most states. Mains: descriptive General Studies, essay and language papers, then an interview.", written: "Mains short and long answers" },
  { id: "jee", code: "JEE", name: "JEE Main & Advanced", covers: "Engineering entrance: IITs, NITs, IIITs", pattern: "JEE Main Paper 1: Physics, Chemistry and Mathematics, 75 questions to attempt, 300 marks, 3 hours. Multiple-choice and numerical-value questions.", written: "Worked derivations and numerical problems" },
  { id: "neet", code: "NEET", name: "NEET UG", covers: "Medical entrance: MBBS, BDS, AYUSH", pattern: "One paper of 180 questions, 720 marks, 3 hours: Physics (45), Chemistry (45) and Biology (90). +4 for a correct answer, −1 for a wrong one.", written: "Short-answer revision from NCERT" },
  { id: "gate", code: "GATE", name: "GATE", covers: "M.Tech admission and PSU recruitment", pattern: "65 questions, 100 marks, 3 hours: General Aptitude (15 marks) and the chosen paper (85 marks). MCQ, multiple-select and numerical-answer questions.", written: "Worked problems and PSU interview questions" },
  { id: "cat", code: "CAT", name: "CAT & MBA Entrance", covers: "CAT, XAT, SNAP, NMAT, CMAT", pattern: "CAT: three timed sections of 40 minutes each: Verbal Ability and Reading Comprehension, Data Interpretation and Logical Reasoning, Quantitative Ability.", written: "WAT and personal-interview questions" },
  { id: "clat", code: "CLAT", name: "CLAT & Law Entrance", covers: "CLAT, AILET, LSAT India", pattern: "CLAT UG: 120 passage-based questions in 2 hours across English, Current Affairs, Legal Reasoning, Logical Reasoning and Quantitative Techniques, with 0.25 negative marking.", written: "Legal reasoning short answers" },
  { id: "cuet", code: "CUET", name: "CUET", covers: "CUET UG and PG: central university admission", pattern: "CUET UG: language papers, domain subjects and a General Test, all objective and computer-based, each paper about 60 minutes.", written: "Short-answer revision" },
  { id: "ugc-net", code: "NET", name: "UGC NET", covers: "Assistant Professor eligibility and JRF", pattern: "Paper 1: 50 questions on teaching and research aptitude (100 marks). Paper 2: 100 questions in the chosen subject (200 marks). 3 hours in one sitting, no negative marking.", written: "Teaching and research aptitude short answers" },
  { id: "cbi", code: "CBI", name: "CBI", covers: "CBI Sub-Inspector (through SSC CGL), CBI support and investigation posts", pattern: "CBI Sub-Inspectors are recruited through SSC CGL. Tier 1: 100 questions, 200 marks, 60 minutes across Reasoning, General Awareness, Quantitative Aptitude and English, with 0.50 negative marking. Tier 2 adds Mathematical Abilities, Reasoning, English, General Awareness and Computer Knowledge, then a physical and medical test.", written: "Criminal law, investigation procedure and interview questions" },
  { id: "income-tax", code: "ITAX", name: "Income Tax", covers: "Income Tax Inspector, Tax Assistant and MTS (through SSC CGL, CHSL and MTS)", pattern: "Income Tax Inspectors are recruited through SSC CGL (Tax Assistants through CHSL). Tier 1: 100 questions, 200 marks, 60 minutes across Reasoning, General Awareness, Quantitative Aptitude and English, with 0.50 negative marking; Tier 2 follows, with a data entry skill test for Tax Assistants.", written: "Direct tax basics and departmental interview questions" },
  { id: "ib", code: "IB", name: "Intelligence Bureau", covers: "IB ACIO Grade II, Security Assistant, JIO", pattern: "IB ACIO Tier 1: 100 objective questions, 100 marks, 60 minutes across Current Affairs, General Studies, Numerical Aptitude, Reasoning and English, with 0.25 negative marking. Tier 2: a 50-mark descriptive paper (essay and comprehension), then an interview.", written: "Essay, precis and interview practice" },
  { id: "insurance", code: "LIC", name: "LIC & Insurance", covers: "LIC AAO and ADO, NIACL AO, NICL AO, LIC Assistant", pattern: "LIC AAO Prelims: 100 questions, 70 marks, 60 minutes across Reasoning, Quantitative Aptitude and English, with sectional timing. Mains adds Insurance and Financial Market Awareness, General Knowledge and a descriptive English paper, then an interview.", written: "Descriptive English (letter, essay) and insurance interview questions" },
  { id: "epfo", code: "EPFO", name: "EPFO", covers: "EPFO Social Security Assistant, UPSC EPFO Enforcement Officer and APFC", pattern: "EPFO SSA Prelims: 100 questions, 100 marks, 60 minutes across English, General Intelligence, General Awareness and Quantitative Aptitude. The UPSC EPFO EO/AO test adds Indian polity, economy, social security and labour laws.", written: "Labour laws and social security short answers" },
  { id: "coast-guard", code: "ICG", name: "Coast Guard", covers: "Indian Coast Guard Navik (GD and DB), Yantrik, Assistant Commandant", pattern: "Navik (GD) Section I: 60 questions in 45 minutes across Mathematics, Science, English, Reasoning and General Knowledge; Section II adds Class 12 Mathematics and Physics. Then an assessment and adaptability test, physical fitness and medical tests.", written: "Interview and service knowledge questions" },
  { id: "police", code: "POL", name: "Police & Paramilitary", covers: "CAPF, State Police SI and Constable, SSC CPO", pattern: "Written test in General Knowledge, Reasoning, Numerical Ability and a language, followed by physical standards and efficiency tests.", written: "CAPF Paper 2 essay and interview" },
];
/** The government exams shown as tabs, in the priority order of GOVERNMENT_EXAM_IDS (top-ranked first). */
export const EXAMS = ALL_EXAMS.filter(exam => GOVERNMENT_EXAM_IDS.includes(exam.id)).sort((a, b) => GOVERNMENT_EXAM_IDS.indexOf(a.id) - GOVERNMENT_EXAM_IDS.indexOf(b.id));
export const TABS_PER_PAGE = 4;

const LOADERS: Record<ExamId, () => Promise<{ default: Pack }>> = {
  nda: () => import("./nda"),
  defence: () => import("./defence"), banks: () => import("./banks"), railways: () => import("./railways"), tet: () => import("./tet"),
  isro: () => import("./isro"), upsc: () => import("./upsc"), ssc: () => import("./ssc"), "state-psc": () => import("./state-psc"),
  jee: () => import("./jee"), neet: () => import("./neet"), gate: () => import("./gate"), cat: () => import("./cat"),
  clat: () => import("./clat"), cuet: () => import("./cuet"), "ugc-net": () => import("./ugc-net"), police: () => import("./police"),
  cbi: () => import("./cbi"), "income-tax": () => import("./income-tax"), ib: () => import("./ib"), insurance: () => import("./insurance"), epfo: () => import("./epfo"), "coast-guard": () => import("./coast-guard"),
};
/**
 * An exam's questions: the hand-authored pack, then the shared static-GK bank, then computed aptitude and reasoning
 * practice (correct by construction) until the exam holds at least OBJECTIVE_MINIMUM objective questions.
 */
export const loadExam = (id: ExamId): Promise<Pack> => Promise.all([LOADERS[id](), loadQuick(id)]).then(([{ default: pack }, quickItems]) => {
  // A GK row that repeats a hand-authored question is dropped, so each question appears once.
  const seen = new Set<string>(); const extra = extraFor(id);
  const authored = [...pack.objective, ...extra.objective, ...gkFor(id)].filter(item => !seen.has(item.q) && Boolean(seen.add(item.q)));
  const objective = [...authored, ...practiceFor(id, Math.max(PRACTICE_PER_EXAM, OBJECTIVE_MINIMUM - authored.length))];
  return { objective, subjective: buildSubjective(ALL_EXAMS.find(exam => exam.id === id)?.name ?? id, [...pack.subjective, ...extra.subjective], quickItems, objective) };
});

/* The Quick Q&A set of each exam: 200+ one-line questions with short answers, in lib/competitive-exams/quick. */
const QUICK: Record<ExamId, () => Promise<{ default: QuickItem[] }>> = {
  nda: () => import("./quick/defence"),
  defence: () => import("./quick/defence"),
  banks: () => import("./quick/banks"),
  railways: () => import("./quick/railways"),
  tet: () => import("./quick/tet"),
  isro: () => import("./quick/isro"),
  upsc: () => import("./quick/upsc"),
  ssc: () => import("./quick/ssc"),
  "state-psc": () => import("./quick/state-psc"),
  jee: () => import("./quick/jee"),
  neet: () => import("./quick/neet"),
  gate: () => import("./quick/gate"),
  cat: () => import("./quick/cat"),
  clat: () => import("./quick/clat"),
  cuet: () => import("./quick/cuet"),
  "ugc-net": () => import("./quick/ugc-net"),
  police: () => import("./quick/police"),
  // CBI Sub-Inspector and Income Tax Inspector posts are filled through SSC CGL, so they share its quick answers.
  cbi: () => import("./quick/ssc"), "income-tax": () => import("./quick/ssc"), ib: () => import("./quick/ssc"),
  insurance: () => import("./quick/banks"), epfo: () => import("./quick/ssc"), "coast-guard": () => import("./quick/defence"),
};
export const loadQuick = (id: ExamId): Promise<QuickItem[]> => QUICK[id]().then(module => module.default);
