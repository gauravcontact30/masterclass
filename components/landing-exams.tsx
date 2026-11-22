"use client";
import { ExamContent } from "./exam-locale";

import { GOVERNMENT_EXAM_IDS } from "@/lib/audience";
import { useState } from "react";
import Image from "@/components/responsive-image";
import Link from "@/components/site-link";
import { ArrowRight, BookOpenCheck, CalendarDays, Check, ClipboardList, GraduationCap, ListChecks, PencilLine, Sigma, Star, Trophy, Zap, type LucideIcon } from "lucide-react";
import { PillPager } from "./pill-pager";
import home from "./landing-home.module.css";
import frame from "./landing-section.module.css";
import dock from "./landing-pro-sections.module.css";
import styles from "./landing-exams.module.css";

/*
 * The landing page's two exam sections, under API Docs and built on the same frame: a paged dock of tabs, a rail of
 * choices and a sheet that shows a real sample. Board Exams walks board → examination → subject and shows one worked
 * answer; Competitive Exams pages through the exam families and lets the visitor try one most-asked question.
 * The samples here are a handful of lines written for this page. The full material (lib/board-exams and
 * lib/competitive-exams) stays in the Learning Dashboard's chunks and is never loaded by the landing page.
 */
/** This site's own PNG icon for a board or exam (scripts/generate-exam-icons.mjs); decorative, the name is always beside it. */
const Logo = ({ id, size }: { id: string; size: number }) => <ExamContent><Image className={styles.logo} src={`/images/exams/${id}.png`} alt="" width={size} height={size} loading="lazy" unoptimized /></ExamContent>;
const Stars = ({ count }: { count: number }) => <ExamContent><span className={styles.stars} role="img" aria-label={`${count} out of 5 stars`}>{[1, 2, 3, 4, 5].map(n => <i key={n} aria-hidden="true" data-on={n <= count || undefined}>★</i>)}</span></ExamContent>;

/* ---------------------------------------------------------------- Board Exams */
const BOARDS = [
  { id: "up", code: "UP", name: "UP Board", full: "Madhyamik Shiksha Parishad, Uttar Pradesh", tone: "peach" },
  { id: "cbse", code: "CBSE", name: "CBSE", full: "Central Board of Secondary Education", tone: "sky" },
  { id: "icse", code: "ICSE", name: "ICSE / ISC", full: "Council for the Indian School Certificate Examinations", tone: "mint" },
] as const;
const CLASSES = [{ id: "10", label: "High School · Class 10" }, { id: "12", label: "Intermediate · Class 12" }] as const;
const SUBJECTS = [{ id: "math", name: "Mathematics", code: "∑" }, { id: "physics", name: "Physics", code: "Φ" }, { id: "chemistry", name: "Chemistry", code: "⚗" }, { id: "english", name: "English", code: "Aa" }] as const;
type ClassId = typeof CLASSES[number]["id"]; type SubjectId = typeof SUBJECTS[number]["id"];
type Worked = { ch: string; stars: number; q: string; steps: string[]; a: string };
const WORKED: Record<`${ClassId}-${SubjectId}`, Worked> = {
  "10-math": { ch: "Quadratic Equations", stars: 5, q: "Find the roots of x² − 7x + 12 = 0 by factorisation.", steps: ["// Split the middle term", "x² − 4x − 3x + 12 = 0", "// Take common factors", "(x − 4)(x − 3) = 0"], a: "x = 4 or x = 3" },
  "10-physics": { ch: "Electricity", stars: 5, q: "Three resistors of 2 Ω, 3 Ω and 6 Ω are joined in parallel. Find the equivalent resistance.", steps: ["// Parallel combination", "1/R = 1/2 + 1/3 + 1/6", "1/R = (3 + 2 + 1)/6 = 1"], a: "R = 1 Ω" },
  "10-chemistry": { ch: "Acids, Bases and Salts", stars: 4, q: "What happens when baking soda is heated? Write the equation.", steps: ["// Thermal decomposition", "2NaHCO₃ → Na₂CO₃ + H₂O + CO₂", "// The CO₂ released makes cakes rise"], a: "Sodium carbonate, water and carbon dioxide are formed" },
  "10-english": { ch: "Grammar: Reported Speech", stars: 4, q: "Change into indirect speech: He said, 'I am busy now.'", steps: ["// The reporting verb is in the past, so the tense shifts back", "am → was", "// Words of nearness change", "now → then"], a: "He said that he was busy then." },
  "12-math": { ch: "Integrals", stars: 5, q: "Evaluate ∫ x·eˣ dx.", steps: ["// Integration by parts: u = x, dv = eˣ dx", "∫ x eˣ dx = x eˣ − ∫ eˣ dx", "= x eˣ − eˣ + C"], a: "eˣ (x − 1) + C" },
  "12-physics": { ch: "Capacitance", stars: 5, q: "Capacitors of 2 μF, 3 μF and 6 μF are in series across 12 V. Find the charge on each.", steps: ["// Series combination", "1/C = 1/2 + 1/3 + 1/6 = 1,  C = 1 μF", "// The same charge sits on each", "Q = CV = 1 μF × 12 V"], a: "Q = 12 μC on each capacitor" },
  "12-chemistry": { ch: "Chemical Kinetics", stars: 5, q: "A first-order reaction has k = 6.93 × 10⁻³ s⁻¹. Find its half-life.", steps: ["// Half-life of a first-order reaction", "t½ = 0.693 / k", "t½ = 0.693 / (6.93 × 10⁻³)"], a: "t½ = 100 s" },
  "12-english": { ch: "Writing: Notice", stars: 4, q: "What is the format of a notice?", steps: ["// Top of the box", "Name of the institution, then the word NOTICE", "// Middle", "Date, a heading and the body in about 50 words", "// End", "Name and designation of the writer"], a: "Institution · NOTICE · date · heading · body · signature" },
};
const BOARD_MATERIAL: { icon: LucideIcon; label: string; hint: string }[] = [
  { icon: BookOpenCheck, label: "Question Bank", hint: "Questions with answers" },
  { icon: Star, label: "Most Important", hint: "Star rated" },
  { icon: PencilLine, label: "Solved & Unsolved", hint: "Worked and practice" },
  { icon: ClipboardList, label: "Test Series", hint: "Timed mock tests" },
  { icon: Sigma, label: "Formula Sheet", hint: "Quick revision" },
  { icon: Zap, label: "Quick Q&A", hint: "200+ short answers" },
];

export function LandingBoardExams() {
  const [board, setBoard] = useState<typeof BOARDS[number]["id"]>("up");
  const [cls, setCls] = useState<ClassId>("10");
  const [subject, setSubject] = useState<SubjectId>("math");
  const sample = WORKED[`${cls}-${subject}`];
  const boardName = BOARDS.find(item => item.id === board)!.name;
  const subjectName = SUBJECTS.find(item => item.id === subject)!.name;
  return <ExamContent><section id="board-exams" className={frame.section} data-ground="wash" aria-labelledby="landing-board-title"><div className={home.inner}>
    <header className={frame.head}>
      <div>
        <p className={frame.kicker}><GraduationCap size={14} aria-hidden="true" />Board Exams<span>UP Board · CBSE · ICSE / ISC</span></p>
        <h3 data-h2="" id="landing-board-title">Board exam preparation, <em>step by step.</em></h3>
      </div>
      <div>
        <p className={frame.lede}>Choose your board, your examination and a subject. Every answer is worked one step per line, the way an examiner awards marks, and each subject carries its own test series.</p>
        <dl className={frame.facts}>
          <div><dt>Boards</dt><dd>3</dd></div>
          <div><dt>Examinations</dt><dd>10 &amp; 12</dd></div>
          <div><dt>Quick answers per subject</dt><dd>200+</dd></div>
        </dl>
      </div>
    </header>
    <div className={dock.guideDock}>
      <div className={`${dock.guideCats} ${styles.three}`} role="group" aria-label="Board">
        {BOARDS.map(item => <ExamContent key={item.id}><button type="button" data-tone={item.tone} title={item.full} aria-pressed={item.id === board} onClick={() => setBoard(item.id)}>
          <span className={`${dock.guideCatIcon} ${styles.logoSlot}`} aria-hidden="true"><Logo id={`board-${item.id}`} size={32} /></span>
          <span className={dock.guideCatLabel}>{item.name}</span>
          <small>{item.code}</small>
        </button></ExamContent>)}
      </div>
      <div className={styles.seg} role="group" aria-label="Examination">
        {CLASSES.map(item => <ExamContent key={item.id}><button type="button" aria-pressed={item.id === cls} onClick={() => setCls(item.id)}>{item.label}</button></ExamContent>)}
      </div>
    </div>
    <article className={dock.guide} aria-label="Board Exams preview">
      <div className={dock.guideRail} role="group" aria-label="Subject">
        {SUBJECTS.map(item => <ExamContent key={item.id}><button type="button" aria-pressed={item.id === subject} onClick={() => setSubject(item.id)}>
          <em aria-hidden="true">{item.code}</em><span>{item.name}</span><small>200+</small>
        </button></ExamContent>)}
      </div>
      <div className={dock.guideSheet}>
        <div className={styles.title}>
          <Logo id={`board-${board}`} size={56} />
          <div className={dock.guideHead}>
            <div className={dock.guideName}>{boardName} · Class {cls} {subjectName}</div>
            <p>One most-important question, answered the way the full set is: every step on its own line.</p>
          </div>
        </div>
        <div className={styles.sample} key={`${cls}-${subject}`}>
          <p className={styles.meta}><Stars count={sample.stars} /><span>{sample.ch}</span></p>
          <p className={styles.question}>{sample.q}</p>
          <figure className={styles.editor}>
            <figcaption><span aria-hidden="true"><i /><i /><i /></span><b>{subject}.solution</b></figcaption>
            <ol>{sample.steps.map((line, index) => <ExamContent key={index}><li data-note={line.startsWith("// ") || undefined}><code>{line.startsWith("// ") ? line.slice(3) : line}</code></li></ExamContent>)}
              <li data-result=""><code>∴ {sample.a}</code></li></ol>
          </figure>
        </div>
        <p className={dock.guideLabel}><ListChecks size={14} aria-hidden="true" />Inside every subject</p>
        <ul className={styles.material}>{BOARD_MATERIAL.map(item => <ExamContent key={item.label}><li><item.icon size={16} aria-hidden="true" /><span><b>{item.label}</b><small>{item.hint}</small></span></li></ExamContent>)}</ul>
        <div className={frame.actions}>
          <Link className={frame.cta} href={`/exams/board-exams?board=${board}&class=${cls}&subject=${subject}`}>Open {subjectName} for {boardName}<ArrowRight size={16} aria-hidden="true" /></Link>
          <small>Opens in Board Scholars. <Link href="/exams/board-exams/sign-up">Join Board Scholars</Link> to study the full material.</small>
        </div>
      </div>
    </article>
  </div></section></ExamContent>;
}

/* ---------------------------------------------------------------- Competitive Exams */
type ExamSample = { id: string; name: string; covers: string; tone: string; subject: string; stars: number; asked: string; q: string; options: string[]; correct: number; why: string; quick: [string, string][] };
const ALL_EXAMS: ExamSample[] = [
  { id: "defence", name: "Defence", covers: "NDA, CDS, AFCAT, Agniveer", tone: "sage", subject: "Polity", stars: 5, asked: "NDA 2018, CDS 2020", q: "Who is the Supreme Commander of the Indian Armed Forces?", options: ["The Prime Minister", "The President", "The Defence Minister", "The Chief of Defence Staff"], correct: 1, why: "Article 53 vests the supreme command of the Defence Forces in the President.", quick: [["Where is the National Defence Academy?", "Khadakwasla, Pune."], ["Which is the highest wartime gallantry award?", "Param Vir Chakra."]] },
  { id: "banks", name: "Govt. Banks", covers: "IBPS, SBI, RBI, RRB", tone: "butter", subject: "Banking Awareness", stars: 5, asked: "IBPS PO 2019, IBPS Clerk 2021", q: "The rate at which the RBI lends short-term funds to banks against securities is the", options: ["reverse repo rate", "repo rate", "bank rate", "cash reserve ratio"], correct: 1, why: "Repo is a repurchase agreement: banks borrow from the RBI by pledging government securities.", quick: [["When was the RBI established?", "1 April 1935."], ["What does NEFT stand for?", "National Electronic Funds Transfer."]] },
  { id: "railways", name: "Railways Exams", covers: "RRB NTPC, Group D, ALP, JE", tone: "sky", subject: "Mathematics", stars: 5, asked: "RRB NTPC 2019, RRB Group D 2021", q: "A train 150 m long passes a pole in 15 seconds. What is its speed?", options: ["30 km/h", "36 km/h", "40 km/h", "54 km/h"], correct: 1, why: "150 / 15 = 10 m/s, and 10 × 18/5 = 36 km/h.", quick: [["When did the first passenger train run in India?", "16 April 1853, Bombay to Thane."], ["What is the width of broad gauge?", "1.676 m."]] },
  { id: "tet", name: "TET Exams", covers: "CTET, UPTET, state TETs", tone: "rose", subject: "Child Development", stars: 5, asked: "CTET 2018, CTET 2021", q: "The 'Zone of Proximal Development' was proposed by", options: ["Jean Piaget", "Lev Vygotsky", "Lawrence Kohlberg", "B. F. Skinner"], correct: 1, why: "It is the gap between what a child can do alone and what the child can do with help.", quick: [["Which age group does the RTE Act cover?", "6 to 14 years."], ["How many stages did Piaget give?", "Four."]] },
  { id: "isro", name: "ISRO Qualifying", covers: "Scientist/Engineer, Technical Assistant", tone: "lavender", subject: "Space GK", stars: 5, asked: "ISRO written and interviews 2023", q: "Which launch vehicle carried Chandrayaan-3 in July 2023?", options: ["PSLV-C57", "GSLV Mk II", "LVM3-M4", "SSLV-D2"], correct: 2, why: "LVM3-M4 lifted off from Sriharikota on 14 July 2023; the lander touched down on 23 August.", quick: [["When was ISRO founded?", "15 August 1969."], ["Which was India's first satellite?", "Aryabhata, 1975."]] },
  { id: "upsc", name: "UPSC Civil Services", covers: "IAS, IPS, IFS", tone: "peach", subject: "Polity", stars: 5, asked: "UPSC Prelims 2013, 2019", q: "The 'basic structure' doctrine was laid down in", options: ["Golaknath v. State of Punjab", "Kesavananda Bharati v. State of Kerala", "Minerva Mills v. Union of India", "Maneka Gandhi v. Union of India"], correct: 1, why: "The 1973 bench held that Parliament may amend the Constitution but not alter its basic structure.", quick: [["Which Article deals with amendment?", "Article 368."], ["Who publishes the Red List?", "IUCN."]] },
  { id: "ssc", name: "SSC Exams", covers: "CGL, CHSL, MTS, GD, CPO", tone: "aqua", subject: "Quantitative Aptitude", stars: 5, asked: "SSC CGL 2018, SSC CHSL 2021", q: "If x + 1/x = 3, what is the value of x² + 1/x²?", options: ["5", "7", "9", "11"], correct: 1, why: "(x + 1/x)² = x² + 1/x² + 2, so x² + 1/x² = 9 − 2 = 7.", quick: [["Which Article abolishes untouchability?", "Article 17."], ["Who discovered the cell?", "Robert Hooke."]] },
  { id: "state-psc", name: "State PSC", covers: "UPPSC, BPSC, MPPSC, RPSC", tone: "sand", subject: "Polity", stars: 5, asked: "MPPSC 2019, UPPSC 2021", q: "The 73rd Constitutional Amendment Act relates to", options: ["urban local bodies", "Panchayati Raj institutions", "anti-defection", "cooperative societies"], correct: 1, why: "It added Part IX and the Eleventh Schedule in 1992; the 74th covers municipalities.", quick: [["Who appoints the Governor?", "The President."], ["When is National Panchayati Raj Day?", "24 April."]] },
  { id: "jee", name: "JEE Main & Advanced", covers: "IITs, NITs, IIITs", tone: "sky", subject: "Mathematics", stars: 5, asked: "JEE Main 2019, JEE Main 2021", q: "If the roots of x² − 5x + k = 0 are equal, the value of k is", options: ["5/2", "25/4", "25/2", "5"], correct: 1, why: "The discriminant 25 − 4k must be zero, so k = 25/4.", quick: [["What is the escape speed from Earth?", "About 11.2 km/s."], ["What is the hybridisation of carbon in ethyne?", "sp."]] },
  { id: "neet", name: "NEET UG", covers: "MBBS, BDS, AYUSH", tone: "mint", subject: "Biology", stars: 5, asked: "NEET 2016, 2019, 2022", q: "In a dihybrid cross between two heterozygotes, the F₂ phenotypic ratio is", options: ["3 : 1", "1 : 2 : 1", "9 : 3 : 3 : 1", "1 : 1 : 1 : 1"], correct: 2, why: "Mendel's law of independent assortment gives 9 : 3 : 3 : 1.", quick: [["What is the functional unit of the kidney?", "Nephron."], ["What is the start codon?", "AUG."]] },
  { id: "gate", name: "GATE", covers: "M.Tech and PSU recruitment", tone: "lilac", subject: "Computer Science", stars: 5, asked: "GATE CS 2017, GATE CS 2021", q: "Which page-replacement algorithm suffers from Belady's anomaly?", options: ["LRU", "Optimal", "FIFO", "LFU"], correct: 2, why: "With FIFO, adding frames can increase page faults; stack algorithms do not show it.", quick: [["What is the sum of the eigenvalues of a matrix?", "Its trace."], ["What is the Reynolds number?", "Inertia force / viscous force."]] },
  { id: "cat", name: "CAT & MBA Entrance", covers: "CAT, XAT, SNAP, NMAT", tone: "butter", subject: "Quantitative Ability", stars: 5, asked: "CAT 2017, CAT 2020", q: "The average of five consecutive odd numbers is 27. What is the largest?", options: ["29", "31", "33", "35"], correct: 1, why: "The middle number is 27, so the numbers are 23, 25, 27, 29 and 31.", quick: [["How many trailing zeros does 100! have?", "24."], ["What does TITA stand for?", "Type In The Answer."]] },
  { id: "clat", name: "CLAT & Law Entrance", covers: "CLAT, AILET, LSAT India", tone: "rose", subject: "Legal Reasoning", stars: 5, asked: "CLAT 2017, CLAT 2020", q: "'Volenti non fit injuria' means", options: ["let the buyer beware", "to a willing person, no injury is done", "the thing speaks for itself", "no one is above the law"], correct: 1, why: "A person who consents to a risk cannot later sue for the harm.", quick: [["What does 'audi alteram partem' mean?", "Hear the other side."], ["Which Article protects life and liberty?", "Article 21."]] },
  { id: "cuet", name: "CUET", covers: "Central university admission", tone: "aqua", subject: "English", stars: 5, asked: "CUET UG 2022, CUET UG 2024", q: "Choose the antonym of 'scarce'.", options: ["Rare", "Abundant", "Meagre", "Limited"], correct: 1, why: "Scarce means in short supply; abundant means plentiful.", quick: [["State the law of demand.", "Quantity demanded falls as price rises."], ["Who gave fourteen principles of management?", "Henri Fayol."]] },
  { id: "ugc-net", name: "UGC NET", covers: "Assistant Professor and JRF", tone: "lavender", subject: "Research Aptitude", stars: 5, asked: "UGC NET December 2018, June 2021", q: "A hypothesis that states there is no relationship between the variables is a", options: ["directional hypothesis", "null hypothesis", "alternative hypothesis", "research hypothesis"], correct: 1, why: "The null hypothesis (H₀) is the one tested statistically.", quick: [["Which is the highest level of teaching?", "Reflective level."], ["How many SDGs are there?", "17."]] },
  { id: "police", name: "Police & Paramilitary", covers: "CAPF, SI, Constable, CPO", tone: "sage", subject: "Police GK", stars: 4, asked: "UPSC CAPF 2019, SSC CPO 2022", q: "Which force guards the India–China border?", options: ["BSF", "ITBP", "SSB", "Assam Rifles"], correct: 1, why: "ITBP guards the China border; BSF guards Pakistan and Bangladesh, and SSB guards Nepal and Bhutan.", quick: [["What does FIR stand for?", "First Information Report."], ["When is Police Commemoration Day?", "21 October."]] },
];
const EXAMS = ALL_EXAMS.filter(exam => GOVERNMENT_EXAM_IDS.includes(exam.id));
const TABS_PER_PAGE = 4;
const KINDS: { icon: LucideIcon; label: string; hint: string }[] = [
  { icon: ListChecks, label: "Objective", hint: "Multiple choice with the reason for each answer" },
  { icon: PencilLine, label: "Subjective", hint: "Descriptive and interview questions with model answers" },
  { icon: Zap, label: "Quick Q&A", hint: "200+ short, to-the-point answers per exam" },
];

export function LandingCompetitiveExams() {
  const [page, setPage] = useState(0);
  const [examId, setExamId] = useState(EXAMS[0].id);
  const [picked, setPicked] = useState<number | null>(null);
  const exam = EXAMS.find(item => item.id === examId)!;
  const pages = Math.ceil(EXAMS.length / TABS_PER_PAGE);
  const choose = (id: string) => { setExamId(id); setPicked(null); };
  // Turning the page opens its first exam, so the sheet always matches a tab that is in view.
  const turn = (next: number) => { setPage(next); choose(EXAMS[next * TABS_PER_PAGE].id); };
  const answered = picked !== null;
  return <ExamContent><section id="competitive-exams" className={frame.section} data-ground="paper" aria-labelledby="landing-competitive-title"><div className={home.inner}>
    <header className={frame.head}>
      <div>
        <p className={frame.kicker}><Trophy size={14} aria-hidden="true" />Indian Government Jobs<span>{EXAMS.length} exams · English and Hindi</span></p>
        <h3 data-h2="" id="landing-competitive-title">The most-asked questions, <em>ranked for you.</em></h3>
      </div>
      <div>
        <p className={frame.lede}>For Indian government job seekers: Defence, banks, railways, police, IAS, PCS and UPSC Civil Services. Each question carries a star rating and the exam and year it was asked in, so you prepare what recurs first.</p>
        <dl className={frame.facts}>
          <div><dt>Exams</dt><dd>{EXAMS.length}</dd></div>
          <div><dt>Question types</dt><dd>3</dd></div>
          <div><dt>Quick answers per exam</dt><dd>200+</dd></div>
        </dl>
      </div>
    </header>
    <div className={dock.guideDock}>
      <div id="competitive-exam-tabs" key={page} className={dock.guideCats} role="group" aria-label="Exams">
        {EXAMS.slice(page * TABS_PER_PAGE, (page + 1) * TABS_PER_PAGE).map(item => <ExamContent key={item.id}><button type="button" data-tone={item.tone} title={`${item.name}: ${item.covers}`} aria-pressed={item.id === examId} onClick={() => choose(item.id)}>
          <span className={`${dock.guideCatIcon} ${styles.logoSlot}`} aria-hidden="true"><Logo id={item.id} size={32} /></span>
          <span className={dock.guideCatLabel}>{item.name}</span>
        </button></ExamContent>)}
      </div>
      <PillPager className={dock.guideCatPager} page={page} pages={pages} total={EXAMS.length} perPage={TABS_PER_PAGE} onPage={turn} label="Exams" noun="exams" controls="competitive-exam-tabs" />
    </div>
    <article className={`${dock.guide} ${styles.wide}`} aria-label="Competitive Exams preview">
      <div className={dock.guideSheet}>
        <div className={styles.title}>
          <Logo id={exam.id} size={56} />
          <div className={dock.guideHead}>
            <div className={dock.guideName}>{exam.name}</div>
            <p>{exam.covers}. Try one of its most-asked questions.</p>
          </div>
        </div>
        <div className={styles.sample} key={exam.id}>
          <p className={styles.meta}><Stars count={exam.stars} /><span>{exam.subject}</span><span className={styles.asked}><CalendarDays size={12} aria-hidden="true" />Asked in {exam.asked}</span></p>
          <p className={styles.question}>{exam.q}</p>
          <div className={styles.options} role="group" aria-label="Options">
            {exam.options.map((option, index) => <ExamContent key={index}><button type="button" disabled={answered} data-state={answered ? (index === exam.correct ? "right" : picked === index ? "wrong" : undefined) : undefined} onClick={() => setPicked(index)}>
              <span>{String.fromCharCode(65 + index)}</span>{option}</button></ExamContent>)}
          </div>
          <p className={styles.why} role="status" data-shown={answered || undefined}>{answered
            ? <><Check size={15} aria-hidden="true" /><span><b>{picked === exam.correct ? "Correct. " : "Not quite. "}Answer: {exam.options[exam.correct]}.</b> {exam.why}</span></>
            : <span>Pick an option to see the answer and the reason.</span>}</p>
        </div>
        <div className={frame.actions}>
          <Link className={frame.cta} href={`/exams/competitive-exams?exam=${exam.id}`}>Open {exam.name}<ArrowRight size={16} aria-hidden="true" /></Link>
          <small>Opens in Exam Aspirants. <Link href="/exams/competitive-exams/sign-up">Join Exam Aspirants</Link>, a separate account from Tech Pro.</small>
        </div>
      </div>
      <aside className={styles.side} aria-label="What each exam includes">
        <p className={dock.guideLabel}><Zap size={14} aria-hidden="true" />Quick answers from {exam.name}</p>
        <dl className={styles.quick}>{exam.quick.map(([question, answer]) => <ExamContent key={question}><div><dt>{question}</dt><dd>{answer}</dd></div></ExamContent>)}</dl>
        <p className={dock.guideLabel}><ListChecks size={14} aria-hidden="true" />Three ways to practise</p>
        <ul className={styles.material} data-stack="">{KINDS.map(item => <ExamContent key={item.label}><li><item.icon size={16} aria-hidden="true" /><span><b>{item.label}</b><small>{item.hint}</small></span></li></ExamContent>)}</ul>
      </aside>
    </article>
  </div></section></ExamContent>;
}
