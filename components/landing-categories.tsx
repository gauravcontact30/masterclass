"use client";
import type { ReactNode } from "react";
import Image from "@/components/responsive-image";
import Link from "@/components/site-link";
import { ArrowRight, BookOpenCheck, Briefcase, CalendarClock, ChevronDown, ClipboardList, GraduationCap, History, Landmark, ListChecks, PencilLine, Scale, Star, type LucideIcon } from "lucide-react";
import { BOARD_FAQ, CATEGORIES, COMPETITIVE_FAQ, EXAM_COUNT, type Category, type Faq } from "@/lib/landing-categories";
import { UPCOMING_WINDOW } from "@/lib/board-exams/papers";
import { MARKING } from "@/lib/competitive-exams/marking";
import home from "./landing-home.module.css";
import frame from "./landing-section.module.css";
import styles from "./landing-categories.module.css";

/*
 * The landing page's three categories: a band that opens each category (Tech · Board Exams · Competitive Exams),
 * and the two exam categories' own sections (what each includes, sample
 * most-important questions, TET and NDA spotlights, marking schemes and FAQs). All of it is static copy; the exam
 * parts mount only for visitors in India (components/landing-page.tsx).
 */
const ICON: Record<Category["id"], LucideIcon> = { tech: Briefcase, board: GraduationCap, competitive: Landmark };
const Stars = ({ count }: { count: number }) => <span className={styles.stars} role="img" aria-label={`${count} out of 5 stars`}>{[1, 2, 3, 4, 5].map(n => <i key={n} aria-hidden="true" data-on={n <= count || undefined}>★</i>)}</span>;

/** Opens one category: its number, name and audience, then the category's sections follow. */
export function CategoryBand({ id }: { id: Category["id"]; india?: boolean }) {
  const category = CATEGORIES.find(c => c.id === id)!; const Icon = ICON[id];
  return <div id={category.anchor} className={styles.band} data-category={id} role="region" aria-labelledby={`${category.anchor}-title`}><div className={`${home.inner} ${styles.bandInner}`}>
    <span className={styles.bandNumber} aria-hidden="true">{category.number}</span>
    <div className={styles.bandText}>
      <p className={styles.bandKicker}><Icon size={14} aria-hidden="true" />Category {category.number}</p>
      <h2 id={`${category.anchor}-title`} className={styles.bandTitle}>{category.title}</h2>
      <p className={styles.bandAudience}>{category.audience}</p>
    </div>
  </div></div>;
}

/* ---------------------------------------------------------------- Board Exams */
const BOARD_FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Star, title: "400+ most important", text: "Per board and subject, objective and subjective together, highest rated first." },
  { icon: ListChecks, title: "500+ objective MCQs", text: "Instant marking with the reason, and your answers saved to your account." },
  { icon: PencilLine, title: "Subjective, step by step", text: "Worked answers one step per line, the way examiners award marks." },
  { icon: History, title: "20 years of papers", text: "2006 to 2025, linked to each board's official archive." },
  { icon: CalendarClock, title: "Upcoming exam dates", text: "Subject-wise dates and a countdown once the board publishes them." },
  { icon: ClipboardList, title: "Test series", text: "Timed mock tests drawn from your own board's questions." },
];
const BOARD_CARDS = [
  { id: "up", name: "UP Board", full: "Madhyamik Shiksha Parishad, Uttar Pradesh", line: "High School and Intermediate on the NCERT syllabus; 70 or 100-mark papers with a 20-mark OMR section in Class 10." },
  { id: "cbse", name: "CBSE", full: "Central Board of Secondary Education", line: "Competency and case-based questions, assertion–reason MCQs and 2, 3 and 5-mark sections." },
  { id: "icse", name: "ICSE / ISC", full: "Council for the Indian School Certificate Examinations", line: "Separate Physics and Chemistry papers, a compulsory Section A and a choice of questions in Section B." },
] as const;
/** A few of the hand-rated five-star questions (lib/board-exams/important), as a sample. */
const BOARD_SAMPLES: { q: string; ch: string; cls: string; boards: string; stars: number; kind: "Subjective" | "Objective" }[] = [
  { q: "Prove that √2 is irrational.", ch: "Real Numbers", cls: "Class 10 Maths", boards: "UP · CBSE · ICSE", stars: 5, kind: "Subjective" },
  { q: "State and prove the Basic Proportionality Theorem.", ch: "Triangles", cls: "Class 10 Maths", boards: "UP · CBSE · ICSE", stars: 5, kind: "Subjective" },
  { q: "Derive the equivalent resistance of resistors in series and in parallel.", ch: "Electricity", cls: "Class 10 Physics", boards: "UP · CBSE · ICSE", stars: 5, kind: "Subjective" },
  { q: "What is saponification? Explain the cleansing action of soap.", ch: "Carbon and its Compounds", cls: "Class 10 Chemistry", boards: "UP · CBSE · ICSE", stars: 5, kind: "Subjective" },
  { q: "Derive the impedance of a series LCR circuit and the condition for resonance.", ch: "Alternating Current", cls: "Class 12 Physics", boards: "UP · CBSE · ISC", stars: 5, kind: "Subjective" },
  { q: "Derive the integrated rate equation of a first-order reaction.", ch: "Chemical Kinetics", cls: "Class 12 Chemistry", boards: "UP · CBSE · ISC", stars: 5, kind: "Subjective" },
];

export function LandingBoardHighlights() {
  return <section id="board-exams-guide" className={frame.section} data-ground="paper" aria-labelledby="board-guide-title"><div className={home.inner}>
    <header className={frame.head}>
      <div>
        <p className={frame.kicker}><GraduationCap size={14} aria-hidden="true" />Board Exams<span>Class 10 · Class 12</span></p>
        <h2 id="board-guide-title">Everything a board subject needs, <em>in one place.</em></h2>
      </div>
      <div>
        <p className={frame.lede}>Pick UP Board, CBSE or ICSE, then Mathematics, Physics, Chemistry or English. Each subject opens chapter and topic wise, with the most important questions marked by stars and the years they keep returning.</p>
        <dl className={frame.facts}>
          <div><dt>Boards</dt><dd>3</dd></div>
          <div><dt>Subjects</dt><dd>4</dd></div>
          <div><dt>Most important per subject</dt><dd>400+</dd></div>
          <div><dt>Years of papers</dt><dd>20</dd></div>
        </dl>
      </div>
    </header>
    <ul className={styles.features}>{BOARD_FEATURES.map(({ icon: Icon, title, text }) => <li key={title}><span aria-hidden="true"><Icon size={18} /></span><h3>{title}</h3><p>{text}</p></li>)}</ul>
    <div className={styles.split}>
      <ul className={styles.boards} aria-label="Boards">{BOARD_CARDS.map(board => <li key={board.id} data-board={board.id}>
        <Image className={styles.boardLogo} src={`/images/exams/board-${board.id}.png`} alt="" width={44} height={44} loading="lazy" unoptimized />
        <div><h3>{board.name}</h3><small>{board.full}</small><p>{board.line}</p>
          {board.id === "up" && <p className={styles.window}><CalendarClock size={13} aria-hidden="true" />{UPCOMING_WINDOW.up.title}: {UPCOMING_WINDOW.up.window}</p>}
        </div>
      </li>)}</ul>
      <div className={styles.samples}>
        <h3><Star size={15} aria-hidden="true" />Five-star questions to prepare first</h3>
        <ol>{BOARD_SAMPLES.map(sample => <li key={sample.q}>
          <p>{sample.q}</p>
          <span className={styles.sampleMeta}><Stars count={sample.stars} /><b>{sample.kind}</b>{sample.cls} · {sample.ch}<i>{sample.boards}</i></span>
        </li>)}</ol>
        <p className={styles.sampleNote}>Asked in most years, 2001–2025: our editorial rating from each board&apos;s blueprint and past papers.</p>
      </div>
    </div>
    <div className={frame.actions}><Link className={frame.cta} href="/exams/board-exams/sign-up">Start Board Exams preparation<ArrowRight size={16} aria-hidden="true" /></Link><small>Board Scholars account · 1-day free trial · India</small></div>
  </div></section>;
}

/* ---------------------------------------------------------------- Competitive Exams */
const SPOTLIGHT = [
  { id: "tet", name: "TET · CTET & UPTET", line: "Teacher Eligibility Tests for Classes 1 to 8", pattern: "Paper 1: 150 questions, 150 marks, 2 h 30 min across Child Development and Pedagogy, two languages, Mathematics and EVS.",
    topics: ["Piaget, Vygotsky, Kohlberg and learning theories", "Inclusive education and learning disabilities", "RTE Act 2009, NCF 2005 and NEP 2020", "Language, Maths and EVS pedagogy"],
    sample: { q: "Under the RTE Act, private unaided schools reserve what share of entry-level seats for weaker sections?", a: "25% (Section 12(1)(c))" } },
  { id: "nda", name: "NDA & NA", line: "National Defence Academy and Naval Academy", pattern: "Mathematics (120 questions, 300 marks) and the General Ability Test (150 questions, 600 marks), 2 h 30 min each, then the SSB interview (900 marks).",
    topics: ["Algebra, trigonometry, calculus and statistics", "Physics, chemistry and general science", "History, polity, geography and current affairs", "English: grammar, vocabulary and comprehension"],
    sample: { q: "Who is the Supreme Commander of the Indian Armed Forces?", a: "The President of India" } },
] as const;
const MARKING_ROWS = ["nda", "tet", "ssc", "banks", "railways", "upsc", "ib", "defence"] as const;
const MARKING_NAMES: Record<(typeof MARKING_ROWS)[number], string> = { nda: "NDA & NA", tet: "CTET / TET", ssc: "SSC CGL Tier 1", banks: "IBPS / SBI PO Prelims", railways: "RRB NTPC CBT-1", upsc: "UPSC Prelims GS", ib: "IB ACIO Tier 1", defence: "AFCAT" };

export function LandingCompetitiveHighlights() {
  return <section id="competitive-exams-guide" className={frame.section} data-ground="wash" aria-labelledby="competitive-guide-title"><div className={home.inner}>
    <header className={frame.head}>
      <div>
        <p className={frame.kicker}><Landmark size={14} aria-hidden="true" />Competitive Exams<span>{EXAM_COUNT} exams · TET · NDA</span></p>
        <h2 id="competitive-guide-title">From TET to NDA, <em>most-asked first.</em></h2>
      </div>
      <div>
        <p className={frame.lede}>Every exam has 410+ objective questions with the answer and a short explanation, and 400+ subjective questions with model answers. Each shows its star rating, the exams it was asked in, its chance of returning and the marks it carries.</p>
        <dl className={frame.facts}>
          <div><dt>Exams</dt><dd>{EXAM_COUNT}</dd></div>
          <div><dt>Objective per exam</dt><dd>410+</dd></div>
          <div><dt>Subjective per exam</dt><dd>400+</dd></div>
        </dl>
      </div>
    </header>
    <ul className={styles.spotlight}>{SPOTLIGHT.map(exam => <li key={exam.id}>
      <div className={styles.spotHead}><Image className={styles.boardLogo} src={`/images/exams/${exam.id === "nda" ? "defence" : exam.id}.png`} alt="" width={44} height={44} loading="lazy" unoptimized />
        <div><h3>{exam.name}</h3><small>{exam.line}</small></div></div>
      <p className={styles.spotPattern}>{exam.pattern}</p>
      <ul className={styles.spotTopics}>{exam.topics.map(topic => <li key={topic}><BookOpenCheck size={14} aria-hidden="true" />{topic}</li>)}</ul>
      <p className={styles.spotMarking}><Scale size={14} aria-hidden="true" />{MARKING[exam.id].basis}</p>
      <div className={styles.spotSample}><Stars count={5} /><p>{exam.sample.q}</p><b>{exam.sample.a}</b></div>
      <Link className={styles.cardOpen} href={`/exams/competitive-exams?exam=${exam.id}`}>Practise {exam.name}<ArrowRight size={14} aria-hidden="true" /></Link>
    </li>)}</ul>
    <div className={styles.tableWrap}><table className={styles.marking}>
      <caption>Marking schemes at a glance</caption>
      <thead><tr><th scope="col">Exam</th><th scope="col">Correct answer</th><th scope="col">Wrong answer</th></tr></thead>
      <tbody>{MARKING_ROWS.map(id => { const scheme = MARKING[id]; const correct = typeof scheme.correct === "number" ? `+${scheme.correct}` : "+2.5 Maths / +4 GAT"; const wrong = typeof scheme.wrong === "number" ? (scheme.wrong ? `−${scheme.wrong}` : "No negative marking") : "One-third of the marks";
        return <tr key={id}><th scope="row">{MARKING_NAMES[id]}</th><td>{correct}</td><td>{wrong}</td></tr>; })}</tbody>
    </table><p className={styles.sampleNote}>From the latest notifications we know of. Always confirm with the current official notification.</p></div>
    <div className={frame.actions}><Link className={frame.cta} href="/exams/competitive-exams/sign-up">Start Competitive Exams preparation<ArrowRight size={16} aria-hidden="true" /></Link><small>Exam Aspirants account · 1-day free trial · India</small></div>
  </div></section>;
}

/** A category's frequently asked questions (the same text is in the page's FAQPage structured data). */
export function LandingFaq({ id, title, items, ground = "paper" }: { id: string; title: ReactNode; items: Faq[]; ground?: "paper" | "wash" }) {
  return <section id={id} className={frame.section} data-ground={ground} aria-labelledby={`${id}-title`}><div className={`${home.inner} ${styles.faqInner}`}>
    <h2 id={`${id}-title`} className={styles.faqTitle}>{title}</h2>
    <div className={styles.faq}>{items.map(item => <details key={item.question}>
      <summary><h3>{item.question}</h3><ChevronDown size={18} aria-hidden="true" /></summary>
      <p>{item.answer}</p>
    </details>)}</div>
  </div></section>;
}
export const BoardFaq = () => <LandingFaq id="board-exams-faq" title={<>Board Exams: <em>questions students ask</em></>} items={BOARD_FAQ} />;
export const CompetitiveFaq = () => <LandingFaq id="competitive-exams-faq" title={<>Competitive Exams: <em>questions aspirants ask</em></>} items={COMPETITIVE_FAQ} ground="paper" />;
