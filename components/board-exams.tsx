"use client";
import { ExamContent } from "./exam-locale";
import { useExamLocale, useExamShard } from "./exam-locale";
import { LanguageSwitch } from "./language-switch";
import { RouteH1 } from "@/components/route-heading";
import { Pager } from "@/components/pager";
import { useDeferredValue, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowDownWideNarrow, ArrowRight, Atom, ListOrdered, BookOpenCheck, CalendarClock, CalendarDays, Check, CircleCheck, ClipboardList, Clock, Copy, ExternalLink, FileText, FlaskConical, GraduationCap, History, Languages, LayoutGrid, Lightbulb, ListChecks, PencilLine, RotateCcw, Sigma, Star, Timer, Trophy, X, Zap } from "lucide-react";
import { QuickQa } from "@/components/quick-qa";
import type { QuickItem } from "@/lib/quick-qa";
import { BOARDS, CLASSES, SUBJECTS, buildTests, loadPack, loadQuick, packOf, patternOf, type Test } from "@/lib/board-exams/boards";
import { OFFICIAL, PAST_YEARS, UPCOMING_WINDOW, archiveNote, askedBand, upcomingFor } from "@/lib/board-exams/papers";
import { boardChapterImage } from "@/lib/exam-images";
import { useExamAnswers } from "@/lib/use-exam-answers";
import { mostImportant, type Ranked } from "@/lib/board-exams/importance";
import { ExamSearch } from "./exam-search";
import { useGridColumns } from "./use-grid-columns";
import { forBoard, type BoardId, type ClassId, type Item, type Mcq, type Pack, type PackSubject, type Sheet, type SubjectId } from "@/lib/board-exams/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { ExamSelect } from "./exam-select";
import styles from "./board-exams.module.css";
import choice from "./competitive-exams.module.css";

/*
 * The Learning Dashboard's Board Exams page. Four steps, top to bottom: board (UP Board, CBSE, ICSE/ISC), examination
 * (High School or Intermediate), subject, then the study material: question bank, most important questions with a
 * star rating, solved and unsolved questions, that board's test series, and the formula sheet. Worked solutions for
 * Math, Physics and Chemistry are set in a light code-editor window, one step per numbered line.
 * Content is hand-authored in lib/board-exams and loads one subject pack at a time.
 */
export type View = "chapters" | "bank" | "objective" | "important" | "practice" | "tests" | "papers" | "upcoming" | "sheets" | "quick";
const VIEWS: { id: View; label: string; hint: string; icon: typeof FileText }[] = [
  { id: "chapters", label: "Chapters & Topics", hint: "Chapter-wise, with pictures", icon: LayoutGrid },
  { id: "bank", label: "Question Bank", hint: "Questions with answers", icon: BookOpenCheck },
  { id: "important", label: "Most Important", hint: "400+ star rated, year asked", icon: Star },
  { id: "objective", label: "Objective MCQs", hint: "500+ with instant answers", icon: ListChecks },
  { id: "practice", label: "Solved & Unsolved", hint: "Worked and practice", icon: PencilLine },
  { id: "tests", label: "Test Series", hint: "Timed mock tests", icon: ClipboardList },
  { id: "papers", label: "Past Papers", hint: "Last 20 years, official", icon: History },
  { id: "upcoming", label: "Upcoming Exams", hint: "Dates by subject", icon: CalendarClock },
  { id: "sheets", label: "Formula Sheet", hint: "Quick revision", icon: Sigma },
  { id: "quick", label: "Quick Q&A", hint: "200+ short answers", icon: Zap },
];
const SUBJECT_ICON: Record<SubjectId, typeof FileText> = { math: Sigma, physics: Atom, organic: FlaskConical, inorganic: FlaskConical, english: Languages };
const PACK_NAMES: Record<PackSubject, string> = { math: "Mathematics", physics: "Physics", chemistry: "Chemistry", english: "English" };
const longDate = (iso: string) => new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(`${iso}T00:00:00+05:30`));
const daysUntil = (iso: string) => Math.ceil((new Date(`${iso}T00:00:00+05:30`).getTime() - Date.now()) / 86400000);

/** A chapter's picture, painted through the Vercel AI Gateway (npm run images:boards). Until it exists, the subject icon shows. */
function ChapterArt({ src, icon: Icon }: { src: string | null; icon: typeof FileText }) {
  const [failed, setFailed] = useState(false);
  return <span className={styles.chapterArt} aria-hidden="true">
    {src && !failed ? <img src={src} alt="" loading="lazy" decoding="async" width={320} height={213} onError={() => setFailed(true)} /> : <Icon size={30} />}
  </span>;
}
const PER_PAGE = 6;
const words = (text: string) => text.toLowerCase().split(/\s+/).filter(Boolean);
function Mark({ text, terms }: { text: string; terms: string[] }): ReactNode {
  if (!terms.length) return text;
  const pattern = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return text.split(pattern).map((part, index) => index % 2 ? <mark key={index}>{part}</mark> : part);
}

/* ---- The light editor window: numbered lines, comments for the reasoning, colour for numbers and operators. ---- */
const TOKEN = /(\d+(?:[.,]\d+)*|[=+−×÷→⇒≤≥≠≈±∝↓<>]|\b(?:sin|cos|tan|cot|sec|cosec|log|adj)\b)/g;
function tint(line: string): ReactNode {
  return line.split(TOKEN).map((part, index) => {
    if (!(index % 2)) return part;
    const kind = /^\d/.test(part) ? styles.tokNum : /^[a-z]/.test(part) ? styles.tokFn : styles.tokOp;
    return <ExamContent key={index}><span className={kind}>{part}</span></ExamContent>;
  });
}
function CodeSheet({ title, lines, steps = false }: { title: string; lines: string[]; /** Number the comment lines as steps (worked solutions), or leave them as headings (formula sheets). */ steps?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { void navigator.clipboard?.writeText(lines.join("\n")).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1600); }); };
  const stepOf = lines.map((line, index) => lines.slice(0, index + 1).filter(l => l.startsWith("// ")).length);
  return <ExamContent><figure className={styles.editor}>
    <figcaption className={styles.editorBar}>
      <span className={styles.lights} aria-hidden="true"><i /><i /><i /></span>
      <span className={styles.editorTab}>{title}</span>
      <button type="button" onClick={copy} aria-label={copied ? "Copied" : `Copy ${title}`}>{copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}{copied ? "Copied" : "Copy"}</button>
    </figcaption>
    <ol className={styles.code}>
      {lines.map((line, index) => {
        const comment = line.startsWith("// "); const result = line.startsWith("∴");
        return <ExamContent key={index}><li className={comment ? styles.lineComment : result ? styles.lineResult : undefined}>
          <span className={styles.lineNo} aria-hidden="true">{index + 1}</span>
          <code>{comment ? steps ? <><b>Step {stepOf[index]}</b>{line.slice(2)}</> : line : tint(line)}</code>
        </li></ExamContent>;
      })}
    </ol>
  </figure></ExamContent>;
}
/* English answers are prose, so they sit on a ruled sheet instead of the editor. */
function Paper({ title, lines }: { title: string; lines: string[] }) {
  return <ExamContent><div className={styles.paper}><strong><FileText size={14} aria-hidden="true" />{title}</strong><ol>{lines.map((line, index) => <ExamContent key={index}><li>{line}</li></ExamContent>)}</ol></div></ExamContent>;
}
const Stars = ({ count }: { count: number }) => <ExamContent><span className={styles.stars} role="img" aria-label={`${count} out of 5 stars`}>{[1, 2, 3, 4, 5].map(n => <ExamContent key={n}><Star size={13} aria-hidden="true" data-on={n <= count || undefined} /></ExamContent>)}</span></ExamContent>;

const BOARD_CODE: Record<BoardId, string> = { up: "UP", cbse: "CBSE", icse: "ICSE" };
/** Which boards set this question, as small code badges. */
const BoardBadges = ({ boards }: { boards: BoardId[] }) => <ExamContent><span className={styles.boardsOf} aria-label={`Boards: ${boards.map(b => BOARD_CODE[b]).join(", ")}`}>{boards.map(b => <ExamContent key={b}><i data-board={b}>{BOARD_CODE[b]}</i></ExamContent>)}</span></ExamContent>;
/** Stars and the year band of a question (our editorial rating, see lib/board-exams/importance.ts). */
const Rating = ({ stars }: { stars: number }) => { const band = askedBand(stars as 3 | 4 | 5); return <ExamContent><><Stars count={stars} />{band && <span className={styles.asked}><CalendarDays size={12} aria-hidden="true" />{band}</span>}</></ExamContent>; };
const boardsOfRow = (b?: string): BoardId[] => (["up", "cbse", "icse"] as BoardId[]).filter(id => !b || b.includes(id === "up" ? "u" : id === "cbse" ? "c" : "i"));

function Solution({ item, prose, shown = true }: { item: Item; prose: boolean; shown?: boolean }) {
  return <ExamContent><div className={styles.answer}>
    {item.hint && <p className={styles.hint}><Lightbulb size={14} aria-hidden="true" /><span><b>Hint:</b> {item.hint}</span></p>}
    {shown && <>
      {item.steps && (prose ? <Paper title="Model answer" lines={item.steps} /> : <CodeSheet steps title={`${item.ch.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.solution`} lines={item.steps} />)}
      <p className={styles.final}><b>Answer</b>{item.a}</p>
    </>}
  </div></ExamContent>;
}

function QuestionList({ items, prose, terms, stars, emptyReset }: { items: Item[]; prose: boolean; terms: string[]; stars: Map<string, number>; emptyReset: () => void }) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / PER_PAGE)); const safePage = Math.min(page, pages - 1);
  const visible = items.slice(safePage * PER_PAGE, (safePage + 1) * PER_PAGE);
  if (!items.length) return <ExamContent><p className={styles.empty}>No question matches. <button type="button" onClick={emptyReset}>Clear search and chapter</button></p></ExamContent>;
  return <ExamContent><>
    <Accordion multiple render={<ol className={styles.list} />}>
      {visible.map((item, index) => {
        return <ExamContent key={item.id}><AccordionItem value={item.id} render={<li className={styles.card} />}>
          <AccordionTrigger className={styles.trigger}>
            <span className={styles.num}>{safePage * PER_PAGE + index + 1}</span>
            <span className={styles.qText}><Mark text={item.q} terms={terms} />
              <span className={styles.metaRow}><Rating stars={item.stars ?? stars.get(item.id) ?? 3} /><span className={styles.tag}>{item.ch}</span><BoardBadges boards={boardsOfRow(item.b)} /><span className={styles.marks}>{item.marks} {item.marks === 1 ? "mark" : "marks"}</span>
                {item.kind === "unsolved" && <span className={styles.practiceTag}>Practice</span>}{item.kind === "solved" && <span className={styles.solvedTag}>Solved</span>}</span></span>
          </AccordionTrigger>
          <AccordionContent className={styles.panelBody}><Solution item={item} prose={prose} /></AccordionContent>
        </AccordionItem></ExamContent>;
      })}
    </Accordion>
    {pages > 1 && <Pager page={safePage} pages={pages} label="Questions pages" onPage={next => { setPage(next); document.getElementById("board-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} />}
  </></ExamContent>;
}

/* Chapters & Topics: search with suggestions, icon filters, sorting and pages of five rows (2026-11-22). */
type ChapterCard = { name: string; bank: number; important: number; practice: number; mcqs: number; top: string | null };
type ChapterFilter = "all" | "bank" | "important" | "objective" | "practice";
const CHAPTER_FILTERS: { id: ChapterFilter; label: string; icon: typeof FileText }[] = [
  { id: "all", label: "All chapters", icon: LayoutGrid }, { id: "bank", label: "Q&A", icon: BookOpenCheck },
  { id: "important", label: "Most asked", icon: Star }, { id: "objective", label: "MCQs", icon: ListChecks }, { id: "practice", label: "Practice", icon: PencilLine },
];
const CHAPTER_ROWS = 5;
function ChapterGrid({ cards, texts, art, boardName, onOpen }: {
  cards: ChapterCard[]; texts: Map<string, string>; art: (name: string) => ReactNode; boardName: string; onOpen: (name: string, view: View) => void;
}) {
  const [query, setQuery] = useState(""); const [filter, setFilter] = useState<ChapterFilter>("all"); const [sort, setSort] = useState<"syllabus" | "most">("syllabus"); const [page, setPage] = useState(0);
  const grid = useRef<HTMLUListElement>(null); const columns = useGridColumns(grid); const perPage = columns * CHAPTER_ROWS;
  const termKey = query.trim().toLowerCase();
  const shown = useMemo(() => {
    const terms = termKey.split(/\s+/).filter(Boolean);
    const total = (card: ChapterCard) => card.bank + card.important + card.mcqs + card.practice;
    const has = (card: ChapterCard) => filter === "all" ? true : filter === "objective" ? card.mcqs > 0 : card[filter] > 0;
    const hit = (card: ChapterCard) => !terms.length || terms.every(term => `${card.name} ${texts.get(card.name) ?? ""}`.toLowerCase().includes(term));
    const rows = cards.filter(card => has(card) && hit(card));
    return sort === "most" ? rows.toSorted((a, b) => total(b) - total(a)) : rows;
  }, [cards, texts, filter, sort, termKey]);
  const pages = Math.max(1, Math.ceil(shown.length / perPage)); const safePage = Math.min(page, pages - 1);
  const visible = shown.slice(safePage * perPage, (safePage + 1) * perPage);
  const questions = useMemo(() => [...texts.values()].flatMap(text => text.split("\n")).filter(Boolean), [texts]);
  const reset = () => { setQuery(""); setFilter("all"); setSort("syllabus"); setPage(0); };
  return <ExamContent><>
    <div className={styles.chapterTools}>
      <ExamSearch value={query} onChange={value => { setQuery(value); setPage(0); }} onTopic={name => { setQuery(name); setPage(0); }} topics={cards.map(card => card.name)} questions={questions}
        placeholder="Search chapters, topics or questions…" label="Search chapters" />
      <div className={styles.chipRow}>
        <div className={styles.chips} role="group" aria-label="Filter chapters by material">
          {CHAPTER_FILTERS.map(({ id, label, icon: Icon }) => <ExamContent key={id}><button type="button" className={styles.chip} aria-pressed={filter === id} onClick={() => { setFilter(id); setPage(0); }}><Icon size={15} aria-hidden="true" />{label}</button></ExamContent>)}
        </div>
        <div className={styles.chips} role="group" aria-label="Sort chapters">
          <button type="button" className={styles.chip} aria-pressed={sort === "syllabus"} onClick={() => { setSort("syllabus"); setPage(0); }}><ListOrdered size={15} aria-hidden="true" />Syllabus order</button>
          <button type="button" className={styles.chip} aria-pressed={sort === "most"} onClick={() => { setSort("most"); setPage(0); }}><ArrowDownWideNarrow size={15} aria-hidden="true" />Most questions</button>
        </div>
      </div>
      <p className={styles.chapterCount} aria-live="polite">{shown.length ? `Showing ${safePage * perPage + 1}–${Math.min(shown.length, (safePage + 1) * perPage)} of ${shown.length} chapters for ${boardName}` : `No chapter matches for ${boardName}`}
        {(query || filter !== "all" || sort !== "syllabus") && <button type="button" className={styles.clearAll} onClick={reset}><X size={14} aria-hidden="true" />Clear</button>}</p>
    </div>
    <ul ref={grid} className={styles.chapters}>{visible.map(card => <ExamContent key={card.name}><li className={styles.chapterCard}>
      {art(card.name)}
      <div className={styles.chapterBody}>
        <h3>{card.name}</h3>
        {card.top && <p className={styles.chapterTop}><Star size={12} aria-hidden="true" />{card.top}</p>}
        <div className={styles.chapterLinks}>
          {card.bank > 0 && <button type="button" onClick={() => onOpen(card.name, "bank")}><BookOpenCheck size={13} aria-hidden="true" />Q&amp;A <b>{card.bank}</b></button>}
          {card.important > 0 && <button type="button" onClick={() => onOpen(card.name, "important")}><Star size={13} aria-hidden="true" />Most asked <b>{card.important}</b></button>}
          {card.mcqs > 0 && <button type="button" onClick={() => onOpen(card.name, "objective")}><ListChecks size={13} aria-hidden="true" />MCQs <b>{card.mcqs}</b></button>}
          {card.practice > 0 && <button type="button" onClick={() => onOpen(card.name, "practice")}><PencilLine size={13} aria-hidden="true" />Practice <b>{card.practice}</b></button>}
        </div>
      </div>
    </li></ExamContent>)}</ul>
    {shown.length > 0 && <div className={styles.gridFoot}>
      <p aria-live="polite">Showing {safePage * perPage + 1}–{Math.min(shown.length, (safePage + 1) * perPage)} of {shown.length} chapters · Page {safePage + 1} of {pages} · {CHAPTER_ROWS} rows per page</p>
      <Pager page={safePage} pages={pages} label="Chapter pages" onPage={next => { setPage(next); document.getElementById("board-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} />
    </div>}
  </></ExamContent>;
}

/* Objective practice: pick an option for instant marking and the reason, or reveal the answer. */
const MCQ_PER_PAGE = 8;
/** Answers are saved to the signed-in account of this portal (lib/use-exam-answers.ts), so progress survives reloads and devices. */
function ObjectiveList({ items, terms, emptyReset, scope, stars }: { items: Mcq[]; terms: string[]; emptyReset: () => void; scope: string; stars: Map<string, number> }) {
  const [page, setPage] = useState(0);
  const [saved, record, reset] = useExamAnswers(scope);
  // Only this list's questions count towards the score line (the scope holds the whole subject).
  const picked = Object.fromEntries(items.filter(m => saved[m.id] !== undefined).map(m => [m.id, saved[m.id]]));
  const pages = Math.max(1, Math.ceil(items.length / MCQ_PER_PAGE)); const safePage = Math.min(page, pages - 1);
  const visible = items.slice(safePage * MCQ_PER_PAGE, (safePage + 1) * MCQ_PER_PAGE);
  const score = Object.entries(picked).filter(([id, i]) => items.find(m => m.id === id)?.correct === i).length;
  if (!items.length) return <ExamContent><p className={styles.empty}>No question matches. <button type="button" onClick={emptyReset}>Clear search and chapter</button></p></ExamContent>;
  return <ExamContent><>
    {Object.keys(picked).length > 0 && <p className={styles.note} role="status"><Trophy size={14} aria-hidden="true" />You have answered {Object.keys(picked).filter(id => picked[id] >= 0).length} and got {score} right so far. <button type="button" className={styles.resetAnswers} onClick={reset}>Start again</button></p>}
    <ol className={styles.list}>
      {visible.map((m, index) => {
        const chosen = picked[m.id]; const answered = chosen !== undefined;
        return <ExamContent key={m.id}><li className={`${styles.card} ${choice.objective}`} data-open={answered || undefined}>
          <div className={choice.question}><span className={styles.num}>{safePage * MCQ_PER_PAGE + index + 1}</span>
            <h3 className={styles.qText}><span><Mark text={m.q} terms={terms} /></span><span className={styles.metaRow}><Rating stars={stars.get(m.id) ?? 3} /><span className={styles.tag}>{m.ch}</span><span className={styles.marks}>1 mark</span><BoardBadges boards={boardsOfRow(m.b)} /></span></h3></div>
          <div className={choice.options} role="group" aria-label={`Options for question ${safePage * MCQ_PER_PAGE + index + 1}`}>
            {m.options.map((option, i) => <ExamContent key={i}><button type="button" disabled={answered} data-state={answered ? (i === m.correct ? "right" : chosen === i ? "wrong" : undefined) : undefined}
              onClick={() => record(m.id, i, i === m.correct)}><span>{String.fromCharCode(65 + i)}</span>{option}</button></ExamContent>)}
          </div>
          {answered
            ? <p className={choice.why} role="status"><CircleCheck size={15} aria-hidden="true" /><span><b>{chosen === m.correct ? "Correct. " : chosen === -1 ? "" : "Not quite. "}Answer: {String.fromCharCode(65 + m.correct)}. {m.options[m.correct]}.</b> {m.why}</span></p>
            : <button type="button" className={choice.reveal} onClick={() => record(m.id, -1, false)}>Show answer</button>}
        </li></ExamContent>;
      })}
    </ol>
    {pages > 1 && <Pager page={safePage} pages={pages} label="Objective questions pages" onPage={next => { setPage(next); document.getElementById("board-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} />}
  </></ExamContent>;
}

/* Most Important: the subject's top-rated subjective and objective questions together, with pagination. */
function ImportantList({ rows, prose, terms, scope, emptyReset }: { rows: Ranked[]; prose: boolean; terms: string[]; scope: string; emptyReset: () => void }) {
  const [page, setPage] = useState(0);
  const [picked, record] = useExamAnswers(scope);
  const pages = Math.max(1, Math.ceil(rows.length / MCQ_PER_PAGE)); const safePage = Math.min(page, pages - 1);
  const visible = rows.slice(safePage * MCQ_PER_PAGE, (safePage + 1) * MCQ_PER_PAGE);
  if (!rows.length) return <ExamContent><p className={styles.empty}>No question matches these filters. <button type="button" onClick={emptyReset}>Clear all filters</button></p></ExamContent>;
  return <ExamContent><>
    <Accordion multiple render={<ol className={styles.list} />}>
      {visible.map((row, index) => {
        const n = safePage * MCQ_PER_PAGE + index + 1;
        const meta = <span className={styles.metaRow}><Rating stars={row.stars} /><span className={styles.kindTag} data-kind={row.type}>{row.type === "subjective" ? <PencilLine size={11} aria-hidden="true" /> : <ListChecks size={11} aria-hidden="true" />}{row.type === "subjective" ? "Subjective" : "Objective"}</span><span className={styles.tag}>{row.ch}</span><span className={styles.marks}>{row.type === "subjective" ? `${row.item.marks} ${row.item.marks === 1 ? "mark" : "marks"}` : "1 mark"}</span><BoardBadges boards={row.boards} /></span>;
        if (row.type === "subjective") {
          return <ExamContent key={row.id}><AccordionItem value={row.id} render={<li className={styles.card} />}>
            <AccordionTrigger className={styles.trigger}>
              <span className={styles.num}>{n}</span><span className={styles.qText}><Mark text={row.item.q} terms={terms} />{meta}</span>
            </AccordionTrigger>
            <AccordionContent className={styles.panelBody}><Solution item={row.item} prose={prose} /></AccordionContent>
          </AccordionItem></ExamContent>;
        }
        const m = row.mcq; const chosen = picked[m.id]; const answered = chosen !== undefined;
        return <ExamContent key={row.id}><li className={`${styles.card} ${choice.objective}`} data-open={answered || undefined}>
          <div className={choice.question}><span className={styles.num}>{n}</span><h3 className={styles.qText}><span><Mark text={m.q} terms={terms} /></span>{meta}</h3></div>
          <div className={choice.options} role="group" aria-label={`Options for question ${n}`}>
            {m.options.map((option, i) => <ExamContent key={i}><button type="button" disabled={answered} data-state={answered ? (i === m.correct ? "right" : chosen === i ? "wrong" : undefined) : undefined}
              onClick={() => record(m.id, i, i === m.correct)}><span>{String.fromCharCode(65 + i)}</span>{option}</button></ExamContent>)}
          </div>
          {answered
            ? <p className={choice.why} role="status"><CircleCheck size={15} aria-hidden="true" /><span><b>{chosen === m.correct ? "Correct. " : chosen === -1 ? "" : "Not quite. "}Answer: {String.fromCharCode(65 + m.correct)}. {m.options[m.correct]}.</b> {m.why}</span></p>
            : <button type="button" className={choice.reveal} onClick={() => record(m.id, -1, false)}>Show answer</button>}
        </li></ExamContent>;
      })}
    </Accordion>
    {pages > 1 && <Pager page={safePage} pages={pages} label="Most important questions pages" onPage={next => { setPage(next); document.getElementById("board-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} />}
  </></ExamContent>;
}

const clock = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
function TestRunner({ test, prose, onExit }: { test: Test; prose: boolean; onExit: () => void }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [left, setLeft] = useState(test.minutes * 60);
  const [done, setDone] = useState(false);
  const over = done || left <= 0;
  useEffect(() => {
    if (over) return;
    const timer = window.setInterval(() => setLeft(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [over]);
  const score = test.mcqs.filter(m => answers[m.id] === m.correct).length;
  const written = [...test.short, ...test.long];
  return <ExamContent><div className={styles.runner}>
    <header className={styles.runnerHead} data-low={!over && left < 120 || undefined}>
      <div><h3>{test.title}</h3><p>{test.marks} marks · {test.minutes} minutes · {test.mcqs.length} objective + {written.length} written</p></div>
      {over ? <p className={styles.score}><Trophy size={18} aria-hidden="true" /><span>Objective score <b>{score} / {test.mcqs.length}</b></span></p>
        : <p className={styles.timer} role="timer" aria-label="Time left"><Timer size={18} aria-hidden="true" />{clock(left)}</p>}
    </header>
    {over && <p className={styles.note}>Objective answers are marked below. Check your written answers against each model solution and award yourself the marks you would earn step by step.</p>}

    <section aria-label="Section A: objective questions"><h4>Section A · Objective <small>1 mark each</small></h4>
      <ol className={styles.mcqs}>{test.mcqs.map((m, index) => <ExamContent key={m.id}><li>
        <fieldset disabled={over}><legend><span>{index + 1}.</span> {m.q}</legend>
          <div className={styles.options}>{m.options.map((option, i) => <ExamContent key={i}><label data-state={over ? (i === m.correct ? "right" : answers[m.id] === i ? "wrong" : undefined) : undefined}>
            <input type="radio" name={m.id} checked={answers[m.id] === i} onChange={() => setAnswers(prev => ({ ...prev, [m.id]: i }))} /><span>{String.fromCharCode(65 + i)}</span>{option}</label></ExamContent>)}</div>
        </fieldset>
        {over && <p className={styles.why}><b>{answers[m.id] === m.correct ? "Correct." : answers[m.id] === undefined ? "Not attempted." : "Incorrect."}</b> {m.why}</p>}
      </li></ExamContent>)}</ol>
    </section>
    {([["Section B · Short answer", test.short, test.mcqs.length], ["Section C · Long answer", test.long, test.mcqs.length + test.short.length]] as [string, Item[], number][]).map(([title, rows, start]) => rows.length > 0 && <section key={title} aria-label={title}>
      <h4>{title} <small>write on paper</small></h4>
      <ol className={styles.written}>{rows.map((item, index) => <ExamContent key={item.id}><li>
        <p><span>{start + index + 1}.</span> {item.q} <em>[{item.marks}]</em></p>
        {over && <Solution item={{ ...item, hint: undefined }} prose={prose} />}
      </li></ExamContent>)}</ol>
    </section>)}
    <footer className={styles.runnerFoot}>
      {!over && <button type="button" className={styles.primary} onClick={() => setDone(true)}><Check size={16} aria-hidden="true" />Submit test</button>}
      <button type="button" className={styles.ghost} onClick={onExit}>{over ? <><RotateCcw size={15} aria-hidden="true" />Back to the test series</> : <><X size={15} aria-hidden="true" />Leave test</>}</button>
      {!over && <small>Model solutions unlock when you submit or the time runs out.</small>}
    </footer>
  </div></ExamContent>;
}

/** `context`: which dashboard hosts the page (Exams portal or Learning Dashboard), for the eyebrow label. */
export function BoardExams({ initial, context = "exams" }: { initial?: { board?: string; cls?: string; subject?: string; view?: string }; context?: "exams" | "learning" }) {
  const { localize, dictionary, english } = useExamLocale();
  const [boardId, setBoardId] = useState<BoardId>(BOARDS.find(b => b.id === initial?.board)?.id ?? "up");
  const [cls, setCls] = useState<ClassId>(initial?.cls === "12" ? "12" : "10");
  // Old links used subject=chemistry, which is now split: they open Inorganic Chemistry.
  const [subject, setSubject] = useState<SubjectId>(SUBJECTS.find(s => s.id === (initial?.subject === "chemistry" ? "inorganic" : initial?.subject))?.id ?? "math");
  useExamShard(`board-${cls}-${subject}`);
  const [view, setView] = useState<View>(VIEWS.find(v => v.id === initial?.view)?.id ?? "chapters");
  const [loaded, setLoaded] = useState<{ key: string; pack: Pack } | null>(null);
  const [query, setQuery] = useState("");
  const [chapter, setChapter] = useState("");
  const [mode, setMode] = useState<"all" | "solved" | "unsolved">("all");
  const [kind, setKind] = useState<"all" | "subjective" | "objective">("all");
  const [minStars, setMinStars] = useState<0 | 4 | 5>(0);
  const [testId, setTestId] = useState("");
  const chapterId = useId();
  const deferred = useDeferredValue(query);
  const key = `${cls}-${subject}`;

  useEffect(() => {
    let live = true;
    void loadPack(cls, subject).then(next => { if (live) setLoaded({ key: `${cls}-${subject}`, pack: next }); });
    return () => { live = false; };
  }, [cls, subject]);

  // The quick questions are a separate small chunk, loaded with the pack so the subjective total is known.
  const [quickSet, setQuickSet] = useState<{ key: string; items: QuickItem[] } | null>(null);
  useEffect(() => {
    let live = true;
    void loadQuick(cls, subject).then(items => { if (live) setQuickSet({ key: `${cls}-${subject}`, items }); });
    return () => { live = false; };
  }, [cls, subject]);
  const quickItems = useMemo(() => quickSet?.key === key ? localize(quickSet.items) : null, [quickSet, key, dictionary]);

  const board = BOARDS.find(b => b.id === boardId)!;
  const source = useMemo(() => loaded?.key === key ? localize(loaded.pack) : null, [loaded, key, dictionary]);
  const pattern = patternOf(board, cls, subject);
  const prose = subject === "english";
  const items = useMemo(() => source ? forBoard(source.items, boardId) : [], [source, boardId]);
  const mcqs = useMemo(() => source ? forBoard(source.mcqs, boardId) : [], [source, boardId]);
  const tests = useMemo(() => source ? buildTests(source, board, cls, subject) : [], [source, board, cls, subject]);
  const terms = useMemo(() => words(deferred), [deferred]);
  /** Every question of the subject with its star rating, and the Most Important list (lib/board-exams/importance.ts). */
  const ranked = useMemo(() => source ? mostImportant(items, mcqs, cls, subject) : [], [source, items, mcqs, cls, subject]);
  const starMap = useMemo(() => new Map<string, number>(ranked.map(row => [row.id, row.stars])), [ranked]);
  const inView = useMemo(() => items.filter(item => view === "bank" ? item.kind === "bank" : view === "important" ? false
    : view === "practice" ? (item.kind === "solved" || item.kind === "unsolved") && (mode === "all" || item.kind === mode) : false), [items, view, mode]);
  const chapters = useMemo(() => [...new Set((view === "objective" ? mcqs : view === "important" ? ranked : inView).map(item => item.ch))], [inView, mcqs, view, ranked]);
  /** Every chapter of this subject for this board, with how much material each holds (the Chapters & Topics grid). */
  const chapterCards = useMemo(() => [...new Set([...items.map(item => item.ch), ...mcqs.map(item => item.ch)])].map(name => {
    const own = items.filter(item => item.ch === name);
    return { name, bank: own.filter(item => item.kind === "bank").length, important: own.filter(item => item.kind === "important").length,
      practice: own.filter(item => item.kind === "solved" || item.kind === "unsolved").length, mcqs: mcqs.filter(item => item.ch === name).length,
      top: own.filter(item => item.kind === "important").toSorted((a, b) => (b.stars ?? 0) - (a.stars ?? 0))[0]?.q ?? own[0]?.q ?? null };
  }), [items, mcqs]);
  /** Each chapter's question texts, one per line: the chapter search matches inside them and suggests them. */
  const chapterTexts = useMemo(() => { const map = new Map<string, string>(); for (const row of [...items, ...mcqs]) map.set(row.ch, `${map.get(row.ch) ?? ""}${row.q}\n`); return map; }, [items, mcqs]);
  const safeChapter = chapters.includes(chapter) ? chapter : "";
  const rows = useMemo(() => {
    const matched = inView.filter(item => (!safeChapter || item.ch === safeChapter) && (!terms.length || terms.every(term => `${item.q} ${item.a} ${item.ch}`.toLowerCase().includes(term))));
    return matched;
  }, [inView, safeChapter, terms]);
  const importantRows = useMemo(() => view !== "important" ? [] : ranked.filter(row => (kind === "all" || row.type === kind) && row.stars >= minStars && (!safeChapter || row.ch === safeChapter)
    && (!terms.length || terms.every(term => (row.type === "subjective" ? `${row.item.q} ${row.item.a} ${row.ch}` : `${row.mcq.q} ${row.mcq.options.join(" ")} ${row.ch}`).toLowerCase().includes(term)))), [ranked, view, kind, minStars, safeChapter, terms]);
  /** Question texts of the current view, for search suggestions. */
  const suggestionTexts = useMemo(() => view === "objective" ? mcqs.map(m => m.q) : view === "important" ? ranked.map(row => row.type === "subjective" ? row.item.q : row.mcq.q) : inView.map(item => item.q), [view, mcqs, ranked, inView]);
  const mcqRows = useMemo(() => view !== "objective" ? [] : mcqs.filter(m => (!safeChapter || m.ch === safeChapter) && (!terms.length || terms.every(term => `${m.q} ${m.options.join(" ")} ${m.ch}`.toLowerCase().includes(term)))), [mcqs, view, safeChapter, terms]);
  const counts: Record<View, number> = {
    bank: items.filter(i => i.kind === "bank").length, objective: mcqs.length, important: ranked.length,
    practice: items.filter(i => i.kind === "solved" || i.kind === "unsolved").length, tests: tests.length, sheets: source?.sheets.length ?? 0, quick: quickItems?.length ?? 0,
    chapters: chapterCards.length, papers: PAST_YEARS.length, upcoming: 4,
  };
  const activeTest = tests.find(test => test.id === testId) ?? null;

  const remember = (next: { board?: BoardId; cls?: ClassId; subject?: SubjectId; view?: View }) => {
    const url = new URL(window.location.href);
    const state = { board: next.board ?? boardId, class: next.cls ?? cls, subject: next.subject ?? subject, view: next.view ?? view };
    for (const [name, value] of Object.entries(state)) url.searchParams.set(name, value);
    window.history.replaceState(window.history.state, "", url);
  };
  const reset = () => { setQuery(""); setChapter(""); setTestId(""); setKind("all"); setMinStars(0); };
  const filtered = query !== "" || safeChapter !== "" || kind !== "all" || minStars !== 0 || mode !== "all";
  const clearFilters = () => { setQuery(""); setChapter(""); setKind("all"); setMinStars(0); setMode("all"); };
  const pickBoard = (id: BoardId) => { setBoardId(id); reset(); remember({ board: id }); };
  const pickClass = (id: ClassId) => { setCls(id); reset(); remember({ cls: id }); };
  const pickSubject = (id: SubjectId) => { setSubject(id); reset(); remember({ subject: id }); };
  const pickView = (id: View) => { setView(id); reset(); remember({ view: id }); };
  /** From a chapter card: open that chapter's questions in one view. */
  const openChapter = (name: string, next: View) => { pickView(next); setChapter(name); requestAnimationFrame(() => document.getElementById("board-panel")?.scrollIntoView({ behavior: "smooth", block: "start" })); };
  const sheetLabel = prose ? "Rules & Formats" : "Formula Sheet";
  const listing = view === "bank" || view === "important" || view === "practice";
  const searchable = listing || view === "objective";
  const subjectiveTotal = items.length + (quickItems?.length ?? 0);

  return <ExamContent><div className={styles.page}>
    <header className={styles.hero}>
      <div className={styles.heroText}>
        <p className={styles.eyebrow}><GraduationCap size={14} aria-hidden="true" />{context === "learning" ? "Learning Dashboard · Board Exams" : "Board Scholars · Board Exams"}</p>
        {context === "learning" && <LanguageSwitch />}
        <RouteH1>Board exam preparation, <em>step by step</em></RouteH1>
        <p>UP Board, CBSE and ICSE / ISC for Class 10 and 12: Maths, Physics, Chemistry and English, chapter and topic wise. Every subject has 500+ questions with answers, 500+ objective questions with instant marking, the most asked questions with star ratings, worked solutions, timed tests, official past papers for 20 years and the upcoming exam dates.</p>
        <ul className={styles.highlights} aria-label="What you get">
          <li><GraduationCap size={14} aria-hidden="true" />UP Board · CBSE · ICSE / ISC</li>
          <li><Languages size={14} aria-hidden="true" />English and हिन्दी</li>
          <li><History size={14} aria-hidden="true" />20 years of past papers</li>
          <li><Timer size={14} aria-hidden="true" />Timed mock tests</li>
          <li><Star size={14} aria-hidden="true" />Most asked, rated</li>
        </ul>
      </div>
      <dl className={styles.stats}>
        <div><dt>Boards</dt><dd>{BOARDS.length}</dd></div>
        <div><dt>Subjective</dt><dd>{source && quickItems ? subjectiveTotal : "–"}</dd></div>
        <div><dt>Objective</dt><dd>{source ? mcqs.length : "–"}</dd></div>
      </dl>
    </header>

    <section className={styles.step} aria-labelledby="step-board">
      <h2 id="step-board"><span>1</span>Choose your board</h2>
      <div className={styles.boardTabs} role="tablist" aria-labelledby="step-board">
        {BOARDS.map(b => <ExamContent key={b.id}><button type="button" role="tab" aria-selected={b.id === boardId} aria-controls="board-panel" data-board={b.id} className={styles.boardTab} onClick={() => pickBoard(b.id)}>
          <span className={styles.boardCode} aria-hidden="true">{b.code}</span>
          <span className={styles.boardText}><strong>{b.name}</strong><small>{b.full}</small></span>
          {b.id === boardId && <Check size={18} aria-hidden="true" className={styles.boardCheck} />}
        </button></ExamContent>)}
      </div>
      <p className={styles.boardLine}>{board.tagline}</p>
    </section>

    <section className={styles.step} aria-labelledby="step-class">
      <h2 id="step-class"><span>2</span>Choose the examination and subject</h2>
      <div className={styles.row}>
        <div className={styles.seg} role="radiogroup" aria-label="Examination">
          {CLASSES.map(c => <ExamContent key={c.id}><button type="button" role="radio" aria-checked={c.id === cls} onClick={() => pickClass(c.id)}>{c.label}</button></ExamContent>)}
        </div>
        <div className={styles.subjects} role="tablist" aria-label="Subject">
          {SUBJECTS.map(s => <ExamContent key={s.id}><button type="button" role="tab" aria-selected={s.id === subject} aria-controls="board-panel" className={styles.subject} onClick={() => pickSubject(s.id)}>
            <span className={styles.badge} aria-hidden="true">{(() => { const Icon = SUBJECT_ICON[s.id]; return <Icon size={15} />; })()}</span>{s.name}</button></ExamContent>)}
        </div>
      </div>
      <aside className={styles.pattern} aria-label="Paper pattern">
        <div><small>{board.exams[cls].name}</small><strong>{pattern.paper}</strong></div>
        <dl><div><dt>Marks</dt><dd>{pattern.marks}</dd></div><div><dt>Time</dt><dd><Clock size={14} aria-hidden="true" />{Math.floor(pattern.minutes / 60)} h{pattern.minutes % 60 ? ` ${pattern.minutes % 60} min` : ""}</dd></div></dl>
        <p>{pattern.sections}. <span>Patterns change from year to year, so confirm with your board&apos;s current sample paper.</span></p>
      </aside>
    </section>

    <section className={styles.step} aria-labelledby="step-material">
      <h2 id="step-material"><span>3</span>Choose what to study</h2>
      <div className={styles.views} role="tablist" aria-label="Study material">
        {VIEWS.map(v => <ExamContent key={v.id}><button type="button" role="tab" aria-selected={v.id === view} aria-controls="board-panel" className={styles.view} onClick={() => pickView(v.id)}>
          <v.icon size={18} aria-hidden="true" /><span><strong>{v.id === "sheets" ? sheetLabel : v.label}</strong><small>{v.hint}</small></span><b>{v.id === "quick" ? (quickItems ? counts.quick : "–") : source || v.id === "papers" || v.id === "upcoming" ? counts[v.id] : "–"}</b></button></ExamContent>)}
      </div>
    </section>

    {searchable && <section className={styles.toolbar} aria-label="Search and filter questions">
      <ExamSearch value={query} onChange={setQuery} onTopic={setChapter} topics={chapters} questions={suggestionTexts} placeholder="Search questions, answers or chapters…" />
      <ExamSelect id={chapterId} label="Chapter" value={safeChapter} onChange={setChapter} options={chapters} allLabel="All chapters" />
      {view === "practice" && <div className={styles.seg} role="radiogroup" aria-label="Solved or unsolved">
        {(["all", "solved", "unsolved"] as const).map(m => <ExamContent key={m}><button type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)}>{m === "all" ? "All" : m === "solved" ? "Solved" : "Unsolved"}</button></ExamContent>)}
      </div>}
      {view === "important" && <div className={styles.chips} role="group" aria-label="Filter by question type and rating">
        {([["all", "All types", LayoutGrid], ["subjective", "Subjective", PencilLine], ["objective", "Objective", ListChecks]] as const).map(([id, label, Icon]) => <ExamContent key={id}><button type="button" className={styles.chip} aria-pressed={kind === id} onClick={() => setKind(id)}><Icon size={15} aria-hidden="true" />{label}</button></ExamContent>)}
        <span className={styles.chipRule} aria-hidden="true" />
        {([[0, "Any rating"], [4, "4★ and up"], [5, "5★ only"]] as const).map(([value, label]) => <ExamContent key={value}><button type="button" className={styles.chip} aria-pressed={minStars === value} onClick={() => setMinStars(value)}><Star size={15} aria-hidden="true" data-on={value > 0 || undefined} />{label}</button></ExamContent>)}
      </div>}
      {filtered && <button type="button" className={styles.clearAll} onClick={clearFilters}><X size={14} aria-hidden="true" />Clear all filters</button>}
    </section>}

    <section id="board-panel" className={styles.panel} role="tabpanel" aria-label={`${board.name} ${board.exams[cls].short} ${SUBJECTS.find(s => s.id === subject)!.name}`}>
      {!source && view !== "papers" && view !== "upcoming" ? <div className={styles.skeleton} aria-busy="true" aria-label="Loading questions"><span /><span /><span /></div> : <>
        <div className={styles.panelHead}>
          <h2>{board.exams[cls].short} {SUBJECTS.find(s => s.id === subject)!.name} · {view === "sheets" ? sheetLabel : view === "quick" ? "Quick questions and answers" : VIEWS.find(v => v.id === view)!.label}</h2>
          {view === "chapters" && <p aria-live="polite">{chapterCards.length} chapters for {board.name}</p>}
          {listing && view !== "important" && <p aria-live="polite">{rows.length} {rows.length === 1 ? "question" : "questions"} for {board.name}</p>}
          {view === "important" && <p aria-live="polite">{importantRows.length} of {ranked.length} most important questions for {board.name}</p>}
          {view === "objective" && <p aria-live="polite">{mcqRows.length} objective {mcqRows.length === 1 ? "question" : "questions"} for {board.name}</p>}
        </div>
        {view === "important" && <p className={styles.note}><Star size={14} aria-hidden="true" />The {ranked.length} most important questions of this subject, subjective and objective together, highest rated first. Stars and the year band are our editorial rating of how regularly this type of question has appeared in board papers from 2001 to 2025, based on each chapter&apos;s weight in the board&apos;s blueprint: five stars means prepare it first. They are a study guide, not an official count from the board; open Past Papers to see the board&apos;s own papers.</p>}

        {view === "chapters" && <ChapterGrid cards={chapterCards} texts={chapterTexts} boardName={board.name} onOpen={openChapter}
          art={name => <ChapterArt src={boardChapterImage(cls, subject, english(name))} icon={SUBJECT_ICON[subject]} />} />}

        {view === "papers" && <>
          <p className={styles.note}><History size={14} aria-hidden="true" />Question papers belong to {board.name}, so we link to the board&apos;s own archive instead of copying them. Recent years are usually online; for older years, ask your school or the board&apos;s regional office.</p>
          <ul className={styles.officialLinks}>{OFFICIAL[boardId].links.map(link => <ExamContent key={link.label}><li><a href={link.href} target="_blank" rel="noopener noreferrer"><strong>{link.label}<ExternalLink size={13} aria-hidden="true" /></strong><small>{link.note}</small></a></li></ExamContent>)}</ul>
          <div className={styles.yearsWrap}><table className={styles.years}>
            <caption>{board.exams[cls].name} · {PACK_NAMES[packOf(subject)]}: the last 20 years</caption>
            <thead><tr><th scope="col">Year</th><th scope="col">Paper</th><th scope="col">Where to find it</th><th scope="col"><span className={styles.srOnly}>Link</span></th></tr></thead>
            <tbody>{PAST_YEARS.map(year => <ExamContent key={year}><tr>
              <th scope="row">{year}</th><td>{board.code} {board.exams[cls].short} {PACK_NAMES[packOf(subject)]}</td><td>{archiveNote(boardId, year)}</td>
              <td><a href={OFFICIAL[boardId].links[0].href} target="_blank" rel="noopener noreferrer" aria-label={`Open the ${board.name} archive for ${year}`}>Open <ExternalLink size={12} aria-hidden="true" /></a></td>
            </tr></ExamContent>)}</tbody>
          </table></div>
        </>}

        {view === "upcoming" && <>
          <div className={styles.window} data-status={UPCOMING_WINDOW[boardId].status}>
            <CalendarClock size={22} aria-hidden="true" />
            <div><strong>{UPCOMING_WINDOW[boardId].title}: {UPCOMING_WINDOW[boardId].window}</strong><small>{UPCOMING_WINDOW[boardId].source}</small></div>
            <a href={OFFICIAL[boardId].site} target="_blank" rel="noopener noreferrer">Official site <ExternalLink size={12} aria-hidden="true" /></a>
          </div>
          <ul className={styles.upcoming}>{(["math", "physics", "chemistry", "english"] as const).map(pack => { const next = upcomingFor(boardId, cls, pack); const days = next.date ? daysUntil(next.date) : null;
            return <ExamContent key={pack}><li data-current={packOf(subject) === pack || undefined} data-status={next.status}>
              <span className={styles.upcomingDay} aria-hidden="true">{next.date ? new Date(`${next.date}T00:00:00+05:30`).getDate() : "–"}<small>{next.date ? "Feb" : "TBA"}</small></span>
              <div><h3>{PACK_NAMES[pack]}</h3><p>{next.date ? <>{longDate(next.date)} · {next.shift}<br /><small>{next.paper}</small></> : <>Awaiting the official {board.name} date sheet.</>}</p></div>
              {days !== null && days >= 0 && <b className={styles.countdown}>{days} {days === 1 ? "day" : "days"} to go</b>}
            </li></ExamContent>; })}</ul>
          <p className={styles.note}><CalendarDays size={14} aria-hidden="true" />Dates are shown only once the board publishes them. Always confirm with your admit card and the board&apos;s latest notice.</p>
        </>}
        {view === "objective" && <p className={styles.note}><ListChecks size={14} aria-hidden="true" />Choose an option to see at once whether it is right and why. Many numerical questions are generated from hand-checked formulas with fresh values, so each answer is computed exactly.</p>}
        {view === "objective" && <ObjectiveList key={`${boardId}-${key}-${safeChapter}-${terms.join(" ")}`} items={mcqRows} terms={terms} scope={`${boardId}-${key}`} stars={starMap} emptyReset={() => { setQuery(""); setChapter(""); }} />}
        {view === "important" && <ImportantList key={`${boardId}-${key}-${kind}-${minStars}-${safeChapter}-${terms.join(" ")}`} rows={importantRows} prose={prose} terms={terms} scope={`${boardId}-${key}`} emptyReset={clearFilters} />}
        {view === "practice" && <p className={styles.note}><PencilLine size={14} aria-hidden="true" />Solved questions show every step. Try each unsolved question on paper first, use the hint if you are stuck, then open it to check your answer.</p>}
        {listing && view !== "important" && <QuestionList key={`${boardId}-${key}-${view}-${mode}-${safeChapter}-${terms.join(" ")}`} items={rows} prose={prose} terms={terms} stars={starMap} emptyReset={clearFilters} />}

        {view === "tests" && (activeTest ? <TestRunner key={activeTest.id} test={activeTest} prose={prose} onExit={() => setTestId("")} /> : <>
          <p className={styles.note}><ClipboardList size={14} aria-hidden="true" />Each test is a short mock drawn only from {board.name} questions for this subject, timed in proportion to the real {pattern.marks}-mark paper. Objective answers are marked for you; written answers come with model solutions.</p>
          <ul className={styles.tests}>{tests.map((test, index) => <ExamContent key={test.id}><li>
            <span className={styles.testNo} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <div><h3>{test.title}</h3><p>{test.mcqs.length} objective · {test.short.length} short answer · {test.long.length} long answer</p>
              <dl><div><dt>Marks</dt><dd>{test.marks}</dd></div><div><dt>Time</dt><dd>{test.minutes} min</dd></div></dl></div>
            <button type="button" className={styles.primary} onClick={() => { setTestId(test.id); requestAnimationFrame(() => document.getElementById("board-panel")?.scrollIntoView({ behavior: "smooth", block: "start" })); }}>Start test</button>
          </li></ExamContent>)}</ul>
        </>)}

        {view === "quick" && (quickItems ? <QuickQa key={key} items={quickItems} panelId="board-panel" /> : <div className={styles.skeleton} aria-busy="true" aria-label="Loading questions"><span /><span /><span /></div>)}

        {view === "sheets" && source && <div className={styles.sheets}>{source.sheets.map((sheet: Sheet) => prose ? <Paper key={sheet.title} title={sheet.title} lines={sheet.lines} /> : <CodeSheet key={sheet.title} title={sheet.title} lines={sheet.lines} />)}</div>}
      </>}
    </section>
  </div></ExamContent>;
}
