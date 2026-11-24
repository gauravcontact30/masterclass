"use client";
import { useState } from "react";
import Link from "@/components/site-link";
import Image from "@/components/responsive-image";
import { ArrowRight, ArrowUpRight, BadgeCheck, CheckCircle2, ClipboardList, FileClock, GraduationCap, Landmark, Mic, RotateCcw, ScrollText, XCircle } from "lucide-react";
import { BOARD_SLIDES, BOARD_SUBJECTS, PAST_FIVE, PATTERNS, SAMPLE_PAPERS, type ClassId, type PaperQuestion, type SubjectId } from "@/lib/landing-showcase/board";
import { GOVT_EXAMS } from "@/lib/landing-showcase/govt";
import type { Choice } from "@/lib/landing-showcase/types";
import { OFFICIAL } from "@/lib/board-exams/papers";
import { ShowcaseAccordion, ShowcaseCarousel, ShowcasePicker, StarRating, useShowcase } from "./landing-showcase-carousel";
import home from "./landing-home.module.css";
import frame from "./landing-section.module.css";
import styles from "./landing-showcase.module.css";

/*
 * Sections 2 and 3 of the showcases under the landing slider (user request 2026-11-24). They mount only for visitors
 * in India (components/landing-page.tsx), with no wording about it. Both use the same exam card on the right: a header,
 * the paper pattern, tabs, and sample questions with options and an answer on demand. Board Exams adds class and
 * subject choices and the last five years' official papers; Government Job Exams adds a mock test marked on OMR
 * bubbles and star-rated interview questions.
 */
const LETTER = ["a", "b", "c", "d"];
const hours = (minutes: number) => `${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${minutes % 60} min` : ""}`;

/* ---------------------------------------------------------------- Board Exams */
export function LandingBoardShowcase() {
  const { ref, index, seen, go, pause, playing, setPlaying, running, panelProps } = useShowcase(BOARD_SLIDES.length);
  const [cls, setCls] = useState<ClassId>("10");
  const [subject, setSubject] = useState<SubjectId>("math");
  const [view, setView] = useState<"paper" | "past">("paper");
  const board = BOARD_SLIDES[index];
  const pattern = PATTERNS[board.id][cls][subject];
  const subjectName = BOARD_SUBJECTS.find(s => s.id === subject)!.name;
  const questions = SAMPLE_PAPERS[`${cls}-${subject}`].filter(q => q.boards.includes(board.id));
  const official = OFFICIAL[board.id];
  return <section id="showcase-board" ref={ref} className={`${frame.section} ${styles.section}`} data-theme="notebook" aria-labelledby="showcase-board-title"><div className={home.inner}>
    <header className={styles.head}>
      <p className={styles.kicker}><GraduationCap size={14} aria-hidden="true" />Board Exams<span>UP Board · CBSE · ICSE / ISC</span></p>
      <h2 id="showcase-board-title">Sample papers and past papers, <em>answered step by step.</em></h2>
      <p className={styles.lede}>Mathematics, Physics, Chemistry and English for Class 10 and 12, set in each board&apos;s own paper pattern, with worked answers and the last five years&apos; official papers.</p>
    </header>
    <div className={styles.split}>
      <ShowcaseCarousel slides={BOARD_SLIDES} label="Boards" index={index} seen={seen} go={go} playing={playing} setPlaying={setPlaying} running={running} />
      <div className={styles.panel} {...panelProps}>
        <ShowcasePicker items={BOARD_SLIDES.map(b => ({ id: b.id, label: b.name, logo: b.logo, sub: "Class 10 · 12" }))} index={index} onPick={go} label="Board" />
        <article className={styles.card} aria-label={`${board.name} Class ${cls} ${subjectName} sample paper`}>
          <header className={styles.cardHead}>
            {board.logo && <Image src={board.logo} alt="" width={44} height={44} unoptimized />}
            <div><p>{board.kicker}</p><h3>{board.name} · {board.exam[cls]}</h3></div>
            <span className={styles.stamp}><BadgeCheck size={14} aria-hidden="true" />Board pattern</span>
          </header>
          <div className={styles.cardFilters}>
            <div className={styles.segment} role="group" aria-label="Class">
              {(["10", "12"] as ClassId[]).map(c => <button key={c} type="button" aria-pressed={c === cls} onClick={() => setCls(c)}>Class {c}<small>{board.exam[c]}</small></button>)}
            </div>
            <div className={styles.subjects} role="group" aria-label="Subject">
              {BOARD_SUBJECTS.map(s => <button key={s.id} type="button" aria-pressed={s.id === subject} onClick={() => setSubject(s.id)}><em aria-hidden="true">{s.mark}</em>{s.name}</button>)}
            </div>
          </div>
          <dl className={styles.pattern}>
            <div><dt>Paper</dt><dd>{pattern.paper}</dd></div>
            <div><dt>Time · Maximum marks</dt><dd>{hours(pattern.minutes)} · {pattern.marks} marks</dd></div>
            <div className={styles.patternWide}><dt>Sections</dt><dd>{pattern.sections}</dd></div>
          </dl>
          <div className={styles.tabs} role="tablist" aria-label="View">
            <button type="button" role="tab" aria-selected={view === "paper"} onClick={() => setView("paper")}><ScrollText size={14} aria-hidden="true" />Sample paper<b>{questions.length}</b></button>
            <button type="button" role="tab" aria-selected={view === "past"} onClick={() => setView("past")}><FileClock size={14} aria-hidden="true" />Previous 5 years<b>5</b></button>
          </div>
          <div className={styles.cardBody} role="tabpanel" key={`${board.id}-${cls}-${subject}-${view}`}>
            {view === "paper"
              ? <ol className={styles.sampleQs}>{questions.map((q, i) => <BoardQuestion key={q.q} n={i + 1} q={q} onOpen={pause} />)}</ol>
              : <ul className={styles.years}>{PAST_FIVE.map(({ year, notes }) => <li key={year}>
                  <b>{year}</b>
                  <span>{board.exam[cls]} · {subjectName}{notes[board.id] && <small>{notes[board.id]}</small>}</span>
                  <a href={official.links[0].href} target="_blank" rel="noopener noreferrer">Official paper<ArrowUpRight size={14} aria-hidden="true" /><span className={home.srOnly}> (opens {official.links[0].label} on the board&apos;s site)</span></a>
                </li>)}</ul>}
          </div>
          <p className={styles.footnote}>{view === "paper" ? "Star ratings show how often a question type comes up in board papers; they are an editorial guide, not an official count." : "Question papers belong to the board, so each year opens the board's official archive."}</p>
        </article>
        <div className={styles.actions}>
          <Link className={styles.cta} href={`/exams/board-exams?board=${board.id}&class=${cls}&subject=${subject}`}>Open {subjectName} for {board.name}<ArrowRight size={16} aria-hidden="true" /></Link>
          <Link className={styles.ghost} href="/exams/board-exams/sign-up">Join Board Scholars</Link>
        </div>
      </div>
    </div>
  </div></section>;
}

/** A board sample-paper question in the exam-card style: number, rating, chapter and marks, options, and the worked answer on demand. */
function BoardQuestion({ n, q, onOpen }: Readonly<{ n: number; q: PaperQuestion; onOpen: () => void }>) {
  const [open, setOpen] = useState(false);
  const correct = q.options ? LETTER.indexOf(q.answer.match(/^\(([a-d])\)/)?.[1] ?? "") : -1;
  return <li className={styles.sampleQ}>
    <p className={styles.sampleMeta}><span>Q{n}</span><StarRating count={q.stars} /><small>{q.ch}</small><em className={styles.marks}>{q.marks} {q.marks === 1 ? "mark" : "marks"}</em></p>
    <p className={styles.sampleText}>{q.q}</p>
    {q.options && <ol className={styles.options}>{q.options.map((option, i) => <li key={option} data-correct={(open && i === correct) || undefined}>({LETTER[i]}) {option}</li>)}</ol>}
    <button type="button" className={styles.reveal} aria-expanded={open} onClick={() => { setOpen(o => !o); if (!open) onOpen(); }}>{open ? "Hide answer" : "Show answer"}</button>
    {open && <div className={styles.worked}>
      <ol>{q.steps.map(step => <li key={step} data-note={step.startsWith("// ") || undefined}>{step.startsWith("// ") ? step.slice(3) : step}</li>)}</ol>
      <p><CheckCircle2 size={15} aria-hidden="true" /><b>Answer:</b> {q.answer}</p>
    </div>}
  </li>;
}

/* ---------------------------------------------------------------- Government Job Exams */
export function LandingGovtShowcase() {
  const { ref, index, seen, go, pause, playing, setPlaying, running, panelProps } = useShowcase(GOVT_EXAMS.length);
  const [view, setView] = useState<"sample" | "mock" | "interview">("sample");
  const exam = GOVT_EXAMS[index];
  return <section id="showcase-govt" ref={ref} className={`${frame.section} ${styles.section}`} data-theme="official" aria-labelledby="showcase-govt-title"><div className={home.inner}>
    <header className={styles.head}>
      <p className={styles.kicker}><Landmark size={14} aria-hidden="true" />Government Job Exams<span>UPSC · SSC · Banks · Railways · NDA · State PSC</span></p>
      <h2 id="showcase-govt-title">India&apos;s top government exams, <em>from sample paper to interview.</em></h2>
      <p className={styles.lede}>For each exam: the paper pattern, a sample paper with answers, a mock test you can mark yourself, and star-rated interview questions with model answers.</p>
    </header>
    <div className={styles.split}>
      <ShowcaseCarousel slides={GOVT_EXAMS} label="Government exams" index={index} seen={seen} go={go} playing={playing} setPlaying={setPlaying} running={running} />
      <div className={styles.panel} {...panelProps}>
        <ShowcasePicker items={GOVT_EXAMS.map(e => ({ id: e.id, label: e.name.replace("UPSC Civil Services", "UPSC CSE"), logo: e.logo, sub: e.facts[1] }))} index={index} onPick={go} label="Exam" />
        <article className={styles.card} aria-label={`${exam.name} preparation`}>
          <header className={styles.cardHead}>
            {exam.logo && <Image src={exam.logo} alt="" width={44} height={44} unoptimized />}
            <div><p>{exam.body}</p><h3>{exam.name}</h3></div>
            <span className={styles.stamp}><BadgeCheck size={14} aria-hidden="true" />Top ranked</span>
          </header>
          <dl className={styles.pattern}>{exam.pattern.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>
          <div className={styles.tabs} role="tablist" aria-label="View">
            <button type="button" role="tab" aria-selected={view === "sample"} onClick={() => setView("sample")}><ScrollText size={14} aria-hidden="true" />Sample paper<b>{exam.sample.length}</b></button>
            <button type="button" role="tab" aria-selected={view === "mock"} onClick={() => setView("mock")}><ClipboardList size={14} aria-hidden="true" />Mock test<b>{exam.mock.length}</b></button>
            <button type="button" role="tab" aria-selected={view === "interview"} onClick={() => setView("interview")}><Mic size={14} aria-hidden="true" />Interview prep<b>{exam.interview?.length ?? 0}</b></button>
          </div>
          <div className={styles.cardBody} role="tabpanel" key={`${exam.id}-${view}`}>
            {view === "sample" && <ol className={styles.sampleQs}>{exam.sample.map((q, i) => <SampleItem key={q.q} n={i + 1} q={q} onOpen={pause} />)}</ol>}
            {view === "mock" && <MockTest questions={exam.mock} onStart={pause} />}
            {view === "interview" && (exam.interview
              ? <ShowcaseAccordion onOpen={pause} items={exam.interview.map((item, i) => ({ id: `${exam.id}-i${i}`, q: item.q, points: item.points, meta: <><StarRating count={item.stars} /><small>{item.tag}</small></> }))} />
              : <p className={styles.notice}>{exam.noInterview}</p>)}
          </div>
          <p className={styles.footnote}>Patterns change between notifications: confirm the details in the latest official notification.</p>
        </article>
        <div className={styles.actions}>
          <Link className={styles.cta} href={exam.href}>Practise {exam.name}<ArrowRight size={16} aria-hidden="true" /></Link>
          <Link className={styles.ghost} href="/exams/competitive-exams/sign-up">Start free trial</Link>
        </div>
      </div>
    </div>
  </div></section>;
}

/** A sample-paper question with its options; the answer and the reason show on demand. */
function SampleItem({ n, q, onOpen }: Readonly<{ n: number; q: Choice; onOpen: () => void }>) {
  const [open, setOpen] = useState(false);
  return <li className={styles.sampleQ}>
    <p className={styles.sampleMeta}><span>Q{n}</span><StarRating count={q.stars} /><small>{q.topic}</small></p>
    <p className={styles.sampleText}>{q.q}</p>
    <ol className={styles.options}>{q.options.map((option, i) => <li key={option} data-correct={(open && i === q.correct) || undefined}>({LETTER[i]}) {option}</li>)}</ol>
    <button type="button" className={styles.reveal} aria-expanded={open} onClick={() => { setOpen(o => !o); if (!open) onOpen(); }}>{open ? "Hide answer" : "Show answer"}</button>
    {open && <p className={styles.why}><CheckCircle2 size={15} aria-hidden="true" /><b>Answer: ({LETTER[q.correct]})</b> {q.why}</p>}
  </li>;
}

/** Three questions marked on OMR-style bubbles: each choice is marked at once, with the reason and a running score. */
function MockTest({ questions, onStart }: Readonly<{ questions: Choice[]; onStart: () => void }>) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const done = Object.keys(answers).length;
  const score = questions.reduce((sum, q, i) => sum + (answers[i] === q.correct ? 1 : 0), 0);
  return <div className={styles.mock}>
    <p className={styles.mockScore} aria-live="polite"><b>{score}</b> / {questions.length} correct<span>{done} of {questions.length} answered</span>
      {done > 0 && <button type="button" onClick={() => setAnswers({})}><RotateCcw size={13} aria-hidden="true" />Reset</button>}</p>
    <ol>{questions.map((q, i) => { const chosen = answers[i]; const marked = chosen !== undefined; return <li key={q.q}>
      <p className={styles.sampleMeta}><span>Q{i + 1}</span><StarRating count={q.stars} /><small>{q.topic}</small></p>
      <p className={styles.sampleText}>{q.q}</p>
      <div className={styles.bubbles} role="radiogroup" aria-label={`Answer to question ${i + 1}`}>
        {q.options.map((option, k) => <button key={option} type="button" role="radio" aria-checked={chosen === k} disabled={marked}
          data-state={marked ? (k === q.correct ? "correct" : k === chosen ? "wrong" : undefined) : undefined}
          onClick={() => { setAnswers(all => ({ ...all, [i]: k })); onStart(); }}><i aria-hidden="true">{LETTER[k].toUpperCase()}</i>{option}</button>)}
      </div>
      {marked && <p className={styles.why} data-right={chosen === q.correct || undefined}>{chosen === q.correct ? <CheckCircle2 size={15} aria-hidden="true" /> : <XCircle size={15} aria-hidden="true" />}<b>{chosen === q.correct ? "Correct." : `Answer: (${LETTER[q.correct]}).`}</b> {q.why}</p>}
    </li>; })}</ol>
  </div>;
}
