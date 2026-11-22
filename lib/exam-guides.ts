import type { PageAnswers } from "./page-answers";

/*
 * Public, indexable guides for the exam material that otherwise sits behind sign-in: Board Exams, Competitive Exams,
 * TET and IELTS (app/(site)/<path>/page.tsx, components/exam-guide.tsx). Each states what the signed-in dashboard really
 * holds, shows a few sample questions with answers (a preview, not the bank), and answers the questions people ask
 * search and answer engines, as FAQPage data. Keep the counts true when the content changes.
 */
export type ExamGuidePath = "/board-exams" | "/competitive-exams" | "/tet-exam" | "/ielts-preparation";
export type ExamGuide = {
  path: ExamGuidePath; eyebrow: string; image: string; imageSize: [width: number, height: number]; imageAlt: string; dashboard: string; cta: string;
  covers: { title: string; text: string }[];
  samples: { q: string; a: string; tag: string }[];
  keywords: string[]; answers: PageAnswers; courseName: string; teaches: string[];
};

export const EXAM_GUIDES: Record<ExamGuidePath, ExamGuide> = {
  "/board-exams": {
    path: "/board-exams", eyebrow: "Class 10 & 12 · UP Board, CBSE, ICSE", image: "/images/landing/hero-board-exams.webp", imageSize: [2752, 1536],
    imageAlt: "Students preparing for Class 10 and 12 board exams with notes and question papers", dashboard: "/exams/board-exams", cta: "Start your 1-day free trial",
    courseName: "Class 10 and 12 Board Exam Preparation (UP Board, CBSE, ICSE)",
    teaches: ["Mathematics", "Physics", "Chemistry", "English", "Chapter-wise question bank", "Past board papers"],
    covers: [
      { title: "Chapters & Topics", text: "Every chapter of Class 10 and 12 Maths, Physics, Chemistry and English as a picture card, with search, filters and 5 rows a page." },
      { title: "100+ question bank per subject", text: "Board-style questions with worked answers for each board, written in the marks pattern of UP Board, CBSE and ICSE / ISC." },
      { title: "Most asked, rated", text: "Questions that recur year after year carry the year asked, a star rating and the chance of being asked again." },
      { title: "MCQs and practice sets", text: "Objective questions with instant marking and reasons, plus solved and unsolved practice for each chapter." },
      { title: "20 years of past papers", text: "Links to official past papers and the upcoming exam calendar for each board." },
      { title: "English and Hindi", text: "Switch the whole dashboard to Hindi; formulas and units stay exactly as printed." },
    ],
    samples: [
      { tag: "Class 10 · Maths", q: "Find the HCF of 96 and 404 by prime factorisation, and use it to find their LCM.", a: "96 = 2⁵ × 3 and 404 = 2² × 101, so HCF = 2² = 4. LCM = (96 × 404) ÷ 4 = 9,696." },
      { tag: "Class 10 · Physics", q: "State Ohm's law. A 12 V battery drives a current of 0.5 A through a resistor. Find its resistance.", a: "At constant temperature, the current through a conductor is proportional to the potential difference across it (V = IR). R = V ÷ I = 12 ÷ 0.5 = 24 Ω." },
      { tag: "Class 10 · Chemistry", q: "Why does a copper vessel lose its shine and turn green when left in moist air?", a: "Copper reacts with oxygen, carbon dioxide and moisture in the air to form a green layer of basic copper carbonate, CuCO₃·Cu(OH)₂. This is corrosion of copper." },
      { tag: "Class 12 · Maths", q: "Differentiate y = sin(x²) with respect to x.", a: "By the chain rule, dy/dx = cos(x²) × 2x = 2x cos(x²)." },
      { tag: "Class 12 · Physics", q: "What is the de Broglie wavelength of an electron accelerated through 100 V?", a: "λ = 1.227 ÷ √V nm = 1.227 ÷ 10 nm ≈ 0.123 nm." },
    ],
    keywords: ["board exam preparation", "Class 10 board exam questions", "Class 12 board exam questions", "UP Board Class 10", "UP Board Class 12", "CBSE Class 10 important questions", "CBSE Class 12 important questions", "ICSE Class 10 questions", "ISC Class 12 questions", "board exam previous year papers", "chapter wise questions with answers", "board exam in Hindi", "Class 10 Maths important questions", "Class 12 Physics important questions"],
    answers: { faqs: [
      { question: "Which boards and classes does Board Exams cover?", answer: "Class 10 and Class 12 for UP Board, CBSE and ICSE / ISC, in Mathematics, Physics, Chemistry and English. Each board's questions follow its own marks pattern, and the past papers and exam calendar are listed board by board." },
      { question: "How many questions are there for each subject?", answer: "Each subject has over 100 question bank items per board with worked answers, plus most-asked questions with star ratings, MCQs with reasons and solved and unsolved practice, arranged chapter by chapter." },
      { question: "Is board exam preparation available in Hindi?", answer: "Yes. The whole Board Exams dashboard switches to Hindi with one button. Formulas, numbers and units are kept exactly as printed so that answers match the textbook." },
      { question: "Is Board Exams free?", answer: "Every new Board Scholars account gets a one-day free trial with full access. After that a membership opens every chapter, question bank, MCQ set and past paper. This page shows a few sample questions free." },
      { question: "How should I revise a chapter before the board exam?", answer: "Open the chapter card, read the most-asked questions first, then work through the question bank answers, test yourself with the MCQs and finish with the unsolved practice set under a timer." },
    ] },
  },
  "/competitive-exams": {
    path: "/competitive-exams", eyebrow: "Government & competitive exams", image: "/images/landing/hero-government-exams.webp", imageSize: [2752, 1536],
    imageAlt: "Aspirants preparing for Indian government recruitment exams", dashboard: "/exams/competitive-exams", cta: "Start your 1-day free trial",
    courseName: "Competitive and Government Exam Preparation (NDA, SSC, Banks, Railways, UPSC, TET)",
    teaches: ["Quantitative Aptitude", "Reasoning", "English", "General Knowledge", "Polity", "History", "Geography", "Current Affairs"],
    covers: [
      { title: "18 government exams", text: "NDA, Defence, Banks, Railways, SSC, UPSC, State PSC, CBI, Income Tax, Intelligence Bureau, Police, LIC, EPFO, Coast Guard, TET, ISRO, GATE and UGC NET." },
      { title: "Subjects & Topics", text: "Every subject of an exam as a picture card, with search suggestions, filters by question type and 5 rows a page." },
      { title: "400+ objective questions per exam", text: "Options, the correct answer, a short explanation and the exam's own marking scheme, including negative marking." },
      { title: "Subjective model answers", text: "Descriptive, short and one-line answers for essays, interviews and mains papers." },
      { title: "Most asked first", text: "Each question shows when it was asked, a star rating and its chance of being asked again." },
      { title: "Exam calendar", text: "Who conducts each exam, how often, and a link to the official site that publishes the notification." },
    ],
    samples: [
      { tag: "SSC · Polity", q: "Which Article of the Indian Constitution abolishes untouchability?", a: "Article 17." },
      { tag: "Banks · Quant", q: "A sum doubles in 8 years at simple interest. What is the rate of interest?", a: "Interest equals the principal in 8 years, so rate = 100 ÷ 8 = 12.5% per year." },
      { tag: "Railways · Science", q: "What is the SI unit of electric charge?", a: "The coulomb (C)." },
      { tag: "NDA · Defence", q: "Which is the highest peacetime gallantry award in India?", a: "The Ashoka Chakra." },
      { tag: "UPSC · Geography", q: "Which is the longest river of India?", a: "The Ganga, about 2,525 km long. The Godavari is the longest river of peninsular India." },
    ],
    keywords: ["competitive exam preparation", "government exam preparation", "SSC CGL questions", "SSC GD questions", "bank exam preparation", "IBPS PO questions", "SBI Clerk questions", "RRB NTPC questions", "railway exam GK", "NDA exam questions", "UPSC prelims questions", "state PSC preparation", "government exam mock test", "sarkari exam preparation", "competitive exam GK in Hindi"],
    answers: { faqs: [
      { question: "Which government exams can I prepare for here?", answer: "NDA, Defence (CDS, AFCAT), Banks, Railways, SSC, UPSC, State PSC, CBI, Income Tax, Intelligence Bureau, Police, LIC and insurance, EPFO, Coast Guard, TET, ISRO, GATE and UGC NET, each with its own subjects, questions and marking scheme." },
      { question: "How many questions does each exam have?", answer: "Every exam has at least 400 objective questions with explanations and subjective questions with model answers, plus more than 200 quick question-and-answer pairs for fast revision." },
      { question: "Does the practice follow negative marking?", answer: "Yes. Each exam shows its latest known marking scheme, and objective answers are scored the same way, including negative marking where the exam uses it. Always confirm with the current official notification." },
      { question: "Is the content available in Hindi?", answer: "Yes. The Competitive Exams dashboard switches to Hindi, which suits Hindi-medium candidates for SSC, railway, police and state exams." },
      { question: "Is it free?", answer: "Every new Exam Aspirants account gets a one-day free trial with full access to every exam. After the trial, a membership keeps everything open. This page shows a few sample questions free." },
    ] },
  },
  "/tet-exam": {
    path: "/tet-exam", eyebrow: "CTET · UPTET · State TETs", image: "/images/landing/slide-exams.webp", imageSize: [1920, 1080],
    imageAlt: "Teacher Eligibility Test preparation: child development, pedagogy and teaching", dashboard: "/exams/competitive-exams?exam=tet&type=topics", cta: "Start your 1-day free trial",
    courseName: "TET Preparation: CTET, UPTET and State Teacher Eligibility Tests",
    teaches: ["Child Development and Pedagogy", "Learning Theories", "Language Pedagogy", "Mathematics Pedagogy", "Environmental Studies", "Inclusive Education"],
    covers: [
      { title: "24 TET subjects", text: "Child Development, Piaget, Vygotsky and Kohlberg, learning theories, inclusive education, language, Maths and EVS pedagogy, policies and acts." },
      { title: "Paper 1 and Paper 2 pattern", text: "150 questions, 150 marks and 2 hours 30 minutes, with no negative marking in CTET." },
      { title: "Most asked questions", text: "Questions asked in past CTET and UPTET papers, rated by how often they come back." },
      { title: "Pedagogy explained", text: "Short reasons for every answer, so a concept is understood rather than memorised." },
      { title: "Hindi medium", text: "The full TET bank switches to Hindi for Hindi-medium candidates." },
      { title: "Subjects & Topics grid", text: "Search, filter and page through every TET subject, five rows at a time." },
    ],
    samples: [
      { tag: "Child Development", q: "Who proposed the Zone of Proximal Development?", a: "Lev Vygotsky. It is the gap between what a child can do alone and what the child can do with guidance." },
      { tag: "Piaget", q: "How many stages of cognitive development did Jean Piaget describe?", a: "Four: sensorimotor, preoperational, concrete operational and formal operational." },
      { tag: "Policies and Acts", q: "Which age group does the Right to Education Act, 2009 cover?", a: "Children aged 6 to 14 years, who have a right to free and compulsory elementary education." },
      { tag: "Pedagogy", q: "What is formative assessment?", a: "Assessment during learning, used to give feedback and adjust teaching, such as quizzes, observation and class discussion." },
      { tag: "Inclusive Education", q: "What does inclusive education mean?", a: "Teaching children of all abilities and backgrounds, including children with disabilities, together in the same classroom with the support each needs." },
    ],
    keywords: ["TET exam preparation", "CTET preparation", "CTET Paper 1 questions", "CTET Paper 2 questions", "UPTET questions", "child development and pedagogy questions", "CDP questions for CTET", "Piaget theory questions", "Vygotsky questions CTET", "TET previous year questions", "teacher eligibility test", "CTET in Hindi", "super TET preparation"],
    answers: { faqs: [
      { question: "What is the TET exam?", answer: "The Teacher Eligibility Test qualifies candidates to teach Classes 1 to 8. CTET is run by CBSE for central schools; UPTET and other state TETs qualify teachers for state schools. Paper 1 is for Classes 1 to 5 and Paper 2 for Classes 6 to 8." },
      { question: "What is the CTET exam pattern?", answer: "Each paper has 150 multiple-choice questions for 150 marks in 2 hours 30 minutes, with no negative marking. Paper 1 covers Child Development and Pedagogy, two languages, Mathematics and Environmental Studies." },
      { question: "Which topics are asked most in Child Development and Pedagogy?", answer: "Piaget's stages, Vygotsky's Zone of Proximal Development and scaffolding, Kohlberg's moral development, learning theories, intelligence, inclusive education and formative assessment come up in almost every CTET paper." },
      { question: "Can I prepare for TET in Hindi?", answer: "Yes. The TET question bank switches to Hindi with one button, for Hindi-medium candidates preparing for CTET, UPTET and other state TETs." },
      { question: "Where is TET in the dashboard?", answer: "TET is part of the Exam Aspirants portal. The TET Exams link in its sidebar opens TET directly on its Subjects & Topics grid, with a one-day free trial for new accounts." },
    ] },
  },
  "/ielts-preparation": {
    path: "/ielts-preparation", eyebrow: "IELTS Academic & General Training", image: "/images/landing/hero-campus-2.webp", imageSize: [1920, 1080],
    imageAlt: "Students practising English for the IELTS test", dashboard: "/learning/ielts", cta: "Start your 1-day free trial",
    courseName: "IELTS Preparation: Listening, Reading, Writing and Speaking",
    teaches: ["IELTS Listening", "IELTS Reading", "IELTS Writing Task 1 and Task 2", "IELTS Speaking", "Topic vocabulary", "Band score calculation"],
    covers: [
      { title: "Practice lab for all four skills", text: "Listening with fill-in answers, Reading True / False / Not Given, timed Writing tasks with a word counter, and Speaking cue cards with a timer." },
      { title: "30 Topics & Themes", text: "The themes that recur in Writing Task 2 and Speaking, each with vocabulary, an essay question with ideas, and Part 1 and Part 3 questions." },
      { title: "Band calculator", text: "Work out your overall band from the four skills, and convert raw Listening and Reading scores to bands." },
      { title: "Strategies", text: "How to answer each question type, and the common mistakes that cost bands." },
      { title: "Four-week study plan", text: "A plan you can tick off, with progress saved in your browser." },
      { title: "Hindi guidance", text: "Practice is in English, with optional Hindi explanations." },
    ],
    samples: [
      { tag: "Writing Task 2", q: "Some people think universities should prepare graduates for jobs; others think knowledge is valuable for its own sake. Discuss both views and give your opinion.", a: "Plan four paragraphs: introduction with your position, one body paragraph per view with an example, and a conclusion. Write at least 250 words in 40 minutes." },
      { tag: "Speaking Part 1", q: "Do you prefer studying alone or with others?", a: "Answer directly, give a reason and an example in two or three sentences: “Mostly alone, because I concentrate better, but I revise with friends before exams to test each other.”" },
      { tag: "Vocabulary", q: "What does “sedentary lifestyle” mean?", a: "A way of life with little physical activity, for example: “Office work often leads to a sedentary lifestyle.”" },
      { tag: "Band score", q: "Listening 7, Reading 6.5, Writing 6, Speaking 6.5: what is the overall band?", a: "The average is 6.5, so the overall band is 6.5. Averages ending in .25 round up to the next half band, and .75 to the next whole band." },
      { tag: "Reading", q: "What is the difference between False and Not Given?", a: "False means the passage says the opposite of the statement. Not Given means the passage gives no information either way." },
    ],
    keywords: ["IELTS preparation", "IELTS preparation online", "IELTS Academic preparation", "IELTS General Training", "IELTS writing task 2 topics", "IELTS speaking cue cards", "IELTS speaking part 1 questions", "IELTS vocabulary by topic", "IELTS band score calculator", "IELTS reading true false not given", "IELTS listening practice", "IELTS study plan", "IELTS preparation in Hindi"],
    answers: { faqs: [
      { question: "What does the IELTS preparation hub include?", answer: "A practice lab for Listening, Reading, Writing and Speaking with instant feedback, 30 Topics & Themes with vocabulary and essay and speaking questions, a band calculator, strategies for each question type and a four-week study plan." },
      { question: "How is the IELTS overall band calculated?", answer: "Add the four skill bands and divide by four. An average ending in .25 rounds up to the next half band and one ending in .75 rounds up to the next whole band, so 6.25 becomes 6.5 and 6.75 becomes 7." },
      { question: "Which topics come up most in IELTS Writing Task 2?", answer: "Education, environment, technology, health, work, cities, travel and tourism, family, crime, media and advertising, and social media appear most often in candidate reports. Each has its own card in Topics & Themes." },
      { question: "Is this official IELTS material?", answer: "No. The practice material is original and written in the IELTS style. For official sample tests, the hub links to ielts.org." },
      { question: "Is IELTS preparation free?", answer: "New accounts get a one-day free trial with full access to the IELTS hub inside the Learning Dashboard. After the trial, a membership keeps it open. This page shows sample questions free." },
    ] },
  },
};
