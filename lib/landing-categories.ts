import { GOVERNMENT_EXAM_IDS } from "./audience";
import { UPCOMING_WINDOW } from "./board-exams/papers";

/*
 * The landing page's three categories (Tech, Board Exams, Competitive Exams) and the answers shown in the two exam
 * categories' FAQs. The same text feeds the visible FAQ and the FAQPage structured data (app/(landing)/page.tsx), so
 * what search engines and AI answer engines read is exactly what visitors see.
 */
export const EXAM_COUNT = GOVERNMENT_EXAM_IDS.length;

export type Category = { id: "tech" | "board" | "competitive"; anchor: string; number: string; title: string; audience: string; summary: string; points: string[]; href: string };
export const CATEGORIES: Category[] = [
  { id: "tech", anchor: "category-tech", number: "01", title: "Tech", audience: "Tech professionals, college students and IT employees · worldwide",
    summary: "Interview questions, system design, Agentic AI, LangChain, n8n, Next.js, Python, AWS and DSA, with weekly Tech Buzz blogs.",
    points: ["Interview prep for 31 technologies", "System design and AI agent blueprints", "Weekly Tech Buzz and API docs"], href: "/learning" },
  { id: "board", anchor: "category-board-exams", number: "02", title: "Board Exams", audience: "Class 10 and 12 students · UP Board, CBSE, ICSE / ISC",
    summary: "Maths, Physics, Chemistry and English, chapter and topic wise, with 400+ most important questions per subject, star ratings and the years they recur.",
    points: ["400+ most important questions per subject", "Objective and subjective, with worked answers", "20 years of official papers and upcoming dates"], href: "/exams/board-exams" },
  { id: "competitive", anchor: "category-competitive-exams", number: "03", title: "Competitive Exams", audience: "Government and competitive exam aspirants · India",
    summary: `NDA, TET, Defence, Banks, Railways, SSC, UPSC, CBI, Income Tax and more: ${EXAM_COUNT} exams with 410+ objective and 400+ subjective questions each.`,
    points: ["TET and NDA with full pedagogy and GAT practice", "Marking scheme on every question", "Star-rated, most-asked questions first"], href: "/exams/competitive-exams" },
];

export type Faq = { question: string; answer: string };
export const BOARD_FAQ: Faq[] = [
  { question: "Which boards, classes and subjects are covered for board exam preparation?", answer: "UP Board (UPMSP), CBSE and ICSE / ISC, for Class 10 (High School) and Class 12 (Intermediate). Each board has Mathematics, Physics, Chemistry (split into Organic and Inorganic) and English, organised chapter and topic wise." },
  { question: "How many important questions are there for each board subject?", answer: "Every board and subject has 400 or more most important questions, objective and subjective together, each with a star rating, the years in which that type of question recurs and the boards that set it. On top of these come a question bank, 500+ objective MCQs with instant marking, solved and unsolved questions and a timed test series." },
  { question: "What do the star ratings and the 'asked in' years on board questions mean?", answer: "They are our editorial rating of how regularly a type of question has appeared in board papers from 2001 to 2025, weighted by each chapter's share of the board blueprint. Five stars means prepare it first. They are a study guide, not an official count from the board." },
  { question: "Can I get board exam question papers of the last 20 years?", answer: "Yes. For every board, class and subject we list the years 2006 to 2025 with links to the board's own official archive of question papers and sample papers, so you always read the authentic paper." },
  { question: "When will the UP Board 2027 examinations be held?", answer: `${UPCOMING_WINDOW.up.title}: ${UPCOMING_WINDOW.up.window} (${UPCOMING_WINDOW.up.source}). The page shows the subject-wise date and shift for Mathematics, Science or Physics, Chemistry and English, with a countdown. CBSE and CISCE dates are added when their date sheets are released.` },
];
export const COMPETITIVE_FAQ: Faq[] = [
  { question: "Which competitive and government exams can I prepare for?", answer: "NDA, Defence (CDS, AFCAT, Agniveer), Banks (IBPS, SBI, RBI), Railways (RRB NTPC, Group D), SSC (CGL, CHSL, MTS), UPSC Civil Services, State PSC, TET (CTET, UPTET and state TETs), CBI, Income Tax, Intelligence Bureau, Police, LIC and Insurance, EPFO, Coast Guard, ISRO, GATE and UGC NET." },
  { question: "Are TET (CTET and UPTET) questions included?", answer: "Yes. The TET section covers Child Development and Pedagogy (Piaget, Vygotsky, Kohlberg, learning theories, assessment), inclusive education, the RTE Act 2009, NCF 2005 and NEP 2020, and the pedagogy of Language, Mathematics and Environmental Studies, with 410+ objective and 400+ subjective questions. CTET has 1 mark per question and no negative marking." },
  { question: "What is the NDA exam pattern and marking scheme?", answer: "The NDA & NA written exam has two papers on the same day: Mathematics (120 questions, 300 marks) and the General Ability Test (150 questions, 600 marks), 2 hours 30 minutes each. One-third of a question's marks is deducted for a wrong answer. Qualified candidates then take the SSB interview (900 marks)." },
  { question: "How many questions are there for each competitive exam?", answer: "Each exam has at least 410 objective questions with four options, the correct answer and a short explanation, and 400 or more subjective questions: descriptive and interview answers, short answers and one-line revision facts. Every question shows a star rating, the exams in which it was asked and its chance of being asked again." },
  { question: "Do the questions show marks and negative marking?", answer: "Yes. Every objective question shows the marks for a correct answer and the deduction for a wrong one, from the exam's latest marking scheme we know of, for example +2 and −0.50 in SSC CGL Tier 1, or +1 with no negative marking in CTET. Always confirm with the current official notification." },
];
