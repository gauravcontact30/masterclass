"use client";
import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { BadgeCheck, CalendarDays, CheckCircle2, Printer, Send, Timer, ClipboardList, Clock, ExternalLink, History, RotateCcw, ScrollText, SlidersHorizontal, Star, X, XCircle } from "lucide-react";
import { ExamContent } from "./exam-locale";
import { ExamSearch } from "./exam-search";
import { ExamSelect } from "./exam-select";
import { Pager } from "./pager";
import type { Paper, PaperQuestion, PaperSet } from "@/lib/board-exams/sample-papers";
import styles from "./exam-sample-papers.module.css";

/*
 * Board Exams dashboard · Sample Papers (2026-11-24): sample papers, mock tests, year-wise practice papers for the
 * last 20 years and the most asked questions, for the board, class and subject picked above. Each question reads like
 * the paper: number, star rating, chapter, marks, options in two columns, and a worked answer behind "Show answer".
 * Search with suggestions, a filter panel and pages of ten questions work the same on every tab.
 */
type Tab = "sample" | "mock" | "years" | "asked";
type Kind = "all" | "mcq" | "written";
type Marks = "all" | "1" | "2" | "3" | "4";
export const PAPER_PAGE_SIZE = 10;
const LETTER = ["a", "b", "c", "d", "e"];
const SECTION: Record<string, string> = { A: "Section A · Objective", B: "Section B · Short answer", C: "Section C · Long answer" };
const sectionName = (s: string, official: boolean) => official ? (s ? `Section ${s}` : "Questions") : SECTION[s] ?? `Section ${s}`;
const YEARS_PER_PAGE = 10;

const StarRow = ({ count }: { count: number }) => <span className={styles.stars} role="img" aria-label={`${count} out of 5 stars`}>
  {[1, 2, 3, 4, 5].map(n => <span key={n} aria-hidden="true" data-on={n <= count || undefined}>★</span>)}
</span>;

/** The worked answer of a question. */
const Worked = ({ q }: { q: PaperQuestion }) => <div className={styles.worked}>
  {q.hint && <p className={styles.hint}><b>Hint:</b> {q.hint}</p>}
  {q.steps.length > 0 && <ol>{q.steps.map((step, i) => <li key={i} data-note={step.startsWith("// ") || undefined}>{step.startsWith("// ") ? step.slice(3) : step}</li>)}</ol>}
  <p className={styles.final}><CheckCircle2 size={16} aria-hidden="true" /><b>Answer:</b> {q.answer}</p>
  {q.answerBy && <p className={styles.by}>{q.answerBy === "board" ? "As in the board’s official marking scheme" : "Answer written by us: the board published none for this paper"}</p>}
</div>;

/**
 * One question. In a mock test (`exam`) options are picked while the clock runs and marked only on submit, and
 * answers stay hidden until then, as in the examination hall.
 */
function QuestionCard({ n, q, exam, chosen, onChoose, freshContext = true, freshFigure = true }: { n: number; q: PaperQuestion; freshContext?: boolean; freshFigure?: boolean; exam?: { running: boolean; submitted: boolean }; chosen?: number; onChoose: (option: number) => void }) {
  const [open, setOpen] = useState(false);
  const graded = Boolean(exam?.submitted);
  const shown = exam ? graded && (open || Boolean(q.options)) : open;
  return <li className={styles.q}>
    <p className={styles.meta}><span className={styles.qNo}>Q{q.no ?? n}</span>{q.stars && <StarRow count={q.stars} />}<small>{q.ch}</small><em className={styles.marks}>{q.pill ?? (q.marks > 0 ? <>{q.marks} {q.marks === 1 ? "mark" : "marks"}{q.negative ? <span className={styles.negative}> · −{q.negative} if wrong</span> : null}</> : "Written answer")}</em></p>
    {/* A passage shows once; the next questions on the same passage keep it folded. */}
    {q.context && <details className={styles.context} open={freshContext}><summary>{q.contextLabel ?? "Passage"}{freshContext ? "" : " (same as above)"}</summary><p>{q.context}</p></details>}
    <p className={styles.text}>{q.q}</p>
    {/* eslint-disable-next-line @next/next/no-img-element -- figures from scanned papers have no fixed size */}
    {q.figure && freshFigure && <img className={styles.figure} src={q.figure.src} alt={q.figure.alt} loading="lazy" decoding="async" />}
    {/* The same picture as the question above (a chart with several questions) stays folded. */}
    {/* eslint-disable-next-line @next/next/no-img-element -- as above */}
    {q.figure && !freshFigure && <details className={styles.context}><summary>Figure (same as above)</summary><img className={styles.figure} src={q.figure.src} alt={q.figure.alt} loading="lazy" decoding="async" /></details>}
    {q.options && (exam
      ? <div className={styles.options} role="group" aria-label={`Options for question ${n}`}>{q.options.map((option, i) => <button key={i} type="button" disabled={!exam.running}
          aria-pressed={chosen === i} data-state={graded ? (i === q.correct ? "right" : i === chosen ? "wrong" : undefined) : chosen === i ? "chosen" : undefined} onClick={() => onChoose(i)}>
          ({LETTER[i]}) {option}{graded && i === q.correct && <CheckCircle2 size={15} aria-label="Correct answer" />}{graded && i === chosen && i !== q.correct && <XCircle size={15} aria-label="Your answer" />}
        </button>)}</div>
      : <ol className={styles.options}>{q.options.map((option, i) => <li key={i} data-correct={(shown && i === q.correct) || undefined}>({LETTER[i]}) {option}{shown && i === q.correct && " ✓"}</li>)}</ol>)}
    {(!exam || (graded && !q.options)) && <button type="button" className={styles.reveal} data-open={shown || undefined} aria-expanded={shown} onClick={() => setOpen(!shown)}>{shown ? "Hide answer" : "Show answer"}</button>}
    {exam && !graded && <p className={styles.tip}>{q.options ? (exam.running ? "Choose an option. It is marked when you submit." : "Start the test to answer.") : "Write this answer on paper. The model answer opens after you submit."}</p>}
    {shown && <Worked q={q} />}
  </li>;
}

const clock = (seconds: number) => { const s = Math.max(0, Math.round(seconds)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60; return `${h ? `${h}:` : ""}${String(m).padStart(h ? 2 : 1, "0")}:${String(sec).padStart(2, "0")}`; };

/** The whole paper on paper: every question in order, with or without its answers. */
function PrintPaper({ paper, answers, boardName }: { paper: Paper; answers: boolean; boardName: string }) {
  return <div className={styles.printArea}>
    <header><h1>{paper.title}</h1><p>{boardName}{paper.official ? ` · ${paper.official.paper}${paper.official.set ? ` · ${paper.official.set}` : ""}` : ""}</p>
      <p><b>Time:</b> {paper.minutes} minutes · <b>Maximum marks:</b> {paper.marks}</p>
      {paper.sectionNames && <p>{Object.entries(paper.sectionNames).map(([s, name]) => `Section ${s}: ${name}`).join(" · ")}</p>}
      {!paper.official && <p className={styles.printNote}>A practice paper with answers by us, in the board&apos;s pattern. Not the board&apos;s own paper.</p>}</header>
    <ol>{paper.questions.map((q, i) => <li key={q.id}>
      {q.context && (i === 0 || paper.questions[i - 1].context !== q.context) && <blockquote className={styles.printPassage}>{q.context}</blockquote>}
      <p><b>Q{q.no ?? i + 1}.</b> {q.q} <i>[{q.pill ?? q.marks}]</i></p>
      {/* eslint-disable-next-line @next/next/no-img-element -- printed figures */}
      {q.figure && (i === 0 || paper.questions[i - 1].figure?.src !== q.figure.src) && <img className={styles.figure} src={q.figure.src} alt={q.figure.alt} />}
      {q.options && <ol className={styles.printOptions}>{q.options.map((o, k) => <li key={k}>({LETTER[k]}) {o}</li>)}</ol>}
      {answers && <p className={styles.printAnswer}><b>Answer:</b> {q.answer}{q.steps.length > 0 && <> — {q.steps.filter(st => !st.startsWith("// ")).join("; ")}</>}</p>}
    </li>)}</ol>
  </div>;
}

/** Wording that differs between dashboards (Board Exams is the default). */
export type PapersCopy = { yearsTab?: string; sampleTab?: string; mockTab?: string; askedTab?: string; lede?: ReactNode; yearNote?: (paper: Paper) => ReactNode; askedNote?: ReactNode; mockNote?: ReactNode };

export function ExamSamplePapers({ set, title, boardName, officialHref = "", archiveNote = () => "", officialYears = [], loadOfficial, copy = {} }: {
  /** `boardName` names whose questions these are (a board, an exam or "IELTS"). */
  set: PaperSet; title: string; boardName: string; officialHref?: string; archiveNote?: (year: number) => string; copy?: PapersCopy;
  /** Years with the board's own paper (lib/board-exams/official-papers), and how to load one. */
  officialYears?: number[]; loadOfficial?: (year: number) => Promise<Paper | null>;
}) {
  const [tab, setTab] = useState<Tab>("sample");
  const [pick, setPick] = useState<Record<Tab, number>>({ sample: 0, mock: 0, years: 0, asked: 0 });
  const [yearPage, setYearPage] = useState(0);
  const [query, setQuery] = useState("");
  const [chapter, setChapter] = useState("");
  const [kind, setKind] = useState<Kind>("all");
  const [minStars, setMinStars] = useState<0 | 4 | 5>(0);
  const [marks, setMarks] = useState<Marks>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [chosen, setChosen] = useState<Record<string, number>>({});
  // Mock test clock (ms since epoch) and the print view.
  const [test, setTest] = useState<{ startedAt: number | null; submittedAt: number | null }>({ startedAt: null, submittedAt: null });
  const [now, setNow] = useState(0);
  const [printing, setPrinting] = useState<null | "paper" | "answers">(null);
  // Official papers by year once loaded (null: the load found none); `practice` shows our paper for that year instead.
  const [official, setOfficial] = useState<Record<number, Paper | null>>({});
  const [practice, setPractice] = useState(false);
  const chapterId = useId(); const filterId = useId();

  const papers: Paper[] = tab === "sample" ? set.sample : tab === "mock" ? set.mock : tab === "years" ? set.years : [];
  const practicePaper = papers[Math.min(pick[tab], Math.max(0, papers.length - 1))] as Paper | undefined;
  const year = tab === "years" ? practicePaper?.year : undefined;
  const hasOfficial = year !== undefined && officialYears.includes(year) && Boolean(loadOfficial);
  const loading = hasOfficial && !practice && !(year in official);
  useEffect(() => {
    if (!hasOfficial || year in official || !loadOfficial) return;
    let live = true;
    void loadOfficial(year).catch(() => null).then(next => { if (live) setOfficial(o => ({ ...o, [year]: next })); });
    return () => { live = false; };
  }, [hasOfficial, year, official, loadOfficial]);
  const paper = hasOfficial && !practice ? (loading ? undefined : official[year!] ?? practicePaper) : practicePaper;
  const isOfficial = Boolean(paper?.official);
  const base = useMemo(() => tab === "asked" ? set.asked : paper?.questions ?? [], [tab, set.asked, paper]);
  // Question numbers stay those of the paper while filtering.
  const numbered = useMemo(() => base.map((q, i) => ({ q, n: i + 1 })), [base]);
  const chapters = useMemo(() => [...new Set(base.map(q => q.ch))].sort((a, b) => a.localeCompare(b)), [base]);
  const safeChapter = chapters.includes(chapter) ? chapter : "";
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const rows = useMemo(() => numbered.filter(({ q }) => (!safeChapter || q.ch === safeChapter)
    && (kind === "all" || (kind === "mcq") === Boolean(q.options))
    && (q.stars ?? 0) >= minStars
    && (marks === "all" || (marks === "4" ? q.marks >= 4 : q.marks === Number(marks)))
    && (!terms.length || terms.every(t => `${q.q} ${q.answer} ${q.ch} ${(q.options ?? []).join(" ")}`.toLowerCase().includes(t)))), [numbered, safeChapter, kind, minStars, marks, terms]);
  const pages = Math.max(1, Math.ceil(rows.length / PAPER_PAGE_SIZE)); const safePage = Math.min(page, pages - 1);
  const visible = rows.slice(safePage * PAPER_PAGE_SIZE, (safePage + 1) * PAPER_PAGE_SIZE);
  const active = (safeChapter ? 1 : 0) + (kind !== "all" ? 1 : 0) + (minStars ? 1 : 0) + (marks !== "all" ? 1 : 0);

  const clearFilters = () => { setChapter(""); setKind("all"); setMinStars(0); setMarks("all"); setPage(0); };
  const clearAll = () => { clearFilters(); setQuery(""); };
  const goTab = (next: Tab) => { setTab(next); setPage(0); resetTest(); clearAll(); };
  const resetTest = () => { setChosen({}); setTest({ startedAt: null, submittedAt: null }); };
  const goPaper = (index: number) => { setPick(p => ({ ...p, [tab]: index })); setPage(0); resetTest(); setPractice(false); clearAll(); };
  const showPractice = (on: boolean) => { setPractice(on); setPage(0); clearAll(); };
  const toPanel = () => document.getElementById("sample-papers")?.scrollIntoView({ behavior: "smooth", block: "start" });

  // Mock test score: objective questions answered so far.
  const mcqs = tab === "mock" ? base.filter(q => q.options) : [];
  const done = mcqs.filter(q => chosen[q.id] !== undefined); const right = done.filter(q => chosen[q.id] === q.correct);
  // Net marks: negative marking takes off each wrong answer's penalty (unanswered questions cost nothing).
  const wrongMarks = done.filter(q => chosen[q.id] !== q.correct).reduce((sum, q) => sum + (q.negative ?? 0), 0);
  const objectiveMarks = Math.round((right.reduce((sum, q) => sum + q.marks, 0) - wrongMarks) * 100) / 100;
  const running = tab === "mock" && test.startedAt !== null && test.submittedAt === null;
  const remaining = running && paper ? paper.minutes * 60 - (now - test.startedAt!) / 1000 : 0;
  const submit = () => setTest(t => t.startedAt !== null && t.submittedAt === null ? { ...t, submittedAt: Date.now() } : t);
  // The clock ticks once a second while a mock runs, and submits the paper when time is up.
  const limit = paper ? paper.minutes * 60_000 : 0;
  useEffect(() => {
    if (!running || test.startedAt === null) return;
    const started = test.startedAt;
    const id = window.setInterval(() => {
      const t = Date.now(); setNow(t);
      if (t - started >= limit) setTest(s => s.submittedAt === null ? { ...s, submittedAt: started + limit } : s);
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, test.startedAt, limit]);
  // Print: render the whole paper, open the browser's print dialog (Save as PDF works there), then go back.
  useEffect(() => {
    if (!printing) return;
    const done = () => setPrinting(null);
    window.addEventListener("afterprint", done);
    const frame = requestAnimationFrame(() => { try { window.print(); } catch { done(); } });
    return () => { cancelAnimationFrame(frame); window.removeEventListener("afterprint", done); };
  }, [printing]);
  const sections = paper ? [...new Set(paper.questions.map(q => q.section))].map(s => [s, paper.questions.filter(q => q.section === s).length] as const) : [];
  const yearPages = Math.ceil(set.years.length / YEARS_PER_PAGE);

  const ALL_TABS: { id: Tab; label: string; count: number; icon: typeof ScrollText }[] = [
    { id: "sample", label: copy.sampleTab ?? "Sample papers", count: set.sample.length, icon: ScrollText },
    { id: "mock", label: copy.mockTab ?? "Mock tests", count: set.mock.length, icon: ClipboardList },
    { id: "years", label: copy.yearsTab ?? `Previous ${set.years.length} years`, count: set.years.length, icon: History },
    { id: "asked", label: copy.askedTab ?? "Most asked", count: set.asked.length, icon: Star },
  ];
  // A set without year papers (IELTS Practice Tests) shows no years tab.
  const TABS = ALL_TABS.filter(t => t.count > 0);

  return <ExamContent><div id="sample-papers" className={styles.wrap}>
    <p className={styles.lede}>{copy.lede ?? <>{title}: {set.unique}+ different questions with answers across {set.sample.length + set.mock.length + set.years.length} papers, plus {set.asked.length} most asked questions rated by stars. All are {boardName} questions for this subject.</>}</p>

    <div className={styles.tabs} role="tablist" aria-label="Paper type">
      {TABS.map(t => <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => goTab(t.id)}><t.icon size={16} aria-hidden="true" />{t.label}<b>{t.count}</b></button>)}
    </div>

    {tab !== "asked" && <div className={styles.picker}>
      {tab === "years" && yearPages > 1 && <button type="button" className={styles.step} aria-label="Newer years" disabled={yearPage === 0} onClick={() => setYearPage(p => p - 1)}>‹</button>}
      <div className={styles.chips} role="group" aria-label={tab === "years" ? "Year" : tab === "mock" ? "Mock test" : "Sample paper"}>
        {papers.map((p, i) => ({ p, i })).filter(({ i }) => tab !== "years" || Math.floor(i / YEARS_PER_PAGE) === yearPage).map(({ p, i }) =>
          <button key={p.id} type="button" aria-pressed={pick[tab] === i} onClick={() => goPaper(i)}>{tab === "years" ? p.year : tab === "mock" ? `Mock ${i + 1}` : `Paper ${i + 1}`}
            {tab === "years" && officialYears.includes(p.year!) && <BadgeCheck size={14} className={styles.officialMark} aria-label="official paper" />}</button>)}
      </div>
      {tab === "years" && yearPages > 1 && <button type="button" className={styles.step} aria-label="Older years" disabled={yearPage >= yearPages - 1} onClick={() => setYearPage(p => p + 1)}>›</button>}
    </div>}

    {loading && <div className={styles.loading} aria-busy="true">Loading the {year} paper…</div>}
    {paper && <div className={styles.paperHead}>
      <div><h3>{paper.title}{isOfficial && <span className={styles.officialBadge}><BadgeCheck size={14} aria-hidden="true" />Official paper</span>}</h3>
        {paper.official && <p className={styles.printed}>{paper.official.paper}{paper.official.set && ` · ${paper.official.set}`}</p>}
        <p><span>{paper.questions.length} questions</span><span>{paper.marks} marks</span><span><Clock size={13} aria-hidden="true" />{paper.minutes} min</span>{sections.map(([s, n]) => <span key={s} title={paper.sectionNames?.[s]}>{paper.sectionNames?.[s] ? `Section ${s} · ${paper.sectionNames[s]}` : sectionName(s, isOfficial)}: {n}</span>)}</p></div>
      <div className={styles.headActions}>
        {tab === "mock" && <div className={styles.score} aria-live="polite">
          {test.startedAt === null && <><strong><Timer size={18} aria-hidden="true" />{paper.minutes} min</strong><small>The clock starts when you begin</small>
            <button type="button" className={styles.start} onClick={() => { const t = Date.now(); setNow(t); setTest({ startedAt: t, submittedAt: null }); }}><Timer size={14} aria-hidden="true" />Start test</button></>}
          {running && <><strong data-low={remaining < 300 || undefined} role="timer" aria-label="Time left">{clock(remaining)}</strong><small>{done.length} of {mcqs.length} objective answered</small>
            <button type="button" className={styles.start} onClick={submit}><Send size={14} aria-hidden="true" />Submit</button></>}
          {test.submittedAt !== null && <><strong>{right.length}/{mcqs.length}</strong><small>objective correct · {objectiveMarks} of {paper.marks} marks{wrongMarks ? ` after −${Math.round(wrongMarks * 100) / 100} negative` : ""} · time used {clock((test.submittedAt - test.startedAt!) / 1000)}</small>
            <button type="button" onClick={resetTest}><RotateCcw size={13} aria-hidden="true" />Retake</button></>}
        </div>}
        <div className={styles.print}>
          <button type="button" onClick={() => setPrinting("paper")}><Printer size={14} aria-hidden="true" />Print paper</button>
          {!running && <button type="button" onClick={() => setPrinting("answers")}><Printer size={14} aria-hidden="true" />With answers</button>}
        </div>
      </div>
    </div>}
    {tab === "years" && paper?.official && <p className={styles.note} data-official><BadgeCheck size={14} aria-hidden="true" /><span>{boardName}&apos;s own {paper.year} question paper, copied exactly from {paper.official.source.url
        ? <a href={paper.official.source.url} target="_blank" rel="noopener noreferrer">{paper.official.source.label}<ExternalLink size={12} aria-hidden="true" /></a> : paper.official.source.label}.
      Each answer says whether it follows the board&apos;s official marking scheme or was written by us. <button type="button" onClick={() => showPractice(true)}>Open our {paper.year} practice paper instead</button></span></p>}
    {tab === "years" && paper?.year && !paper.official && copy.yearNote && <p className={styles.note}><CalendarDays size={14} aria-hidden="true" /><span>{copy.yearNote(paper)}</span></p>}
    {tab === "years" && paper?.year && !paper.official && !copy.yearNote && <p className={styles.note}><CalendarDays size={14} aria-hidden="true" /><span>{hasOfficial && <><button type="button" onClick={() => showPractice(false)}>Back to the official {paper.year} paper</button>{" "}</>}A practice paper in the style of {boardName}&apos;s {paper.year} examination, written by us with full answers. It is not the board&apos;s own {paper.year} paper: {archiveNote(paper.year).toLowerCase()}. <a href={officialHref} target="_blank" rel="noopener noreferrer">Open the official archive<ExternalLink size={12} aria-hidden="true" /></a></span></p>}
    {tab === "asked" && copy.askedNote && <p className={styles.note}><Star size={14} aria-hidden="true" /><span>{copy.askedNote}</span></p>}
    {tab === "asked" && !copy.askedNote && <p className={styles.note}><Star size={14} aria-hidden="true" /><span>Highest rated first. Stars are our editorial rating of how regularly this type of question has appeared in board papers from 2001 to 2025; they are a study guide, not an official count.</span></p>}
    {tab === "mock" && <p className={styles.note}><ClipboardList size={14} aria-hidden="true" /><span>{copy.mockNote ?? <>Timed like the real paper. Start the test, pick an option for each objective question and write the other answers on paper. Submit (or let the clock run out) to see your objective score and every model answer.</>}</span></p>}

    <div className={styles.toolbar}>
      <ExamSearch value={query} onChange={value => { setQuery(value); setPage(0); }} onTopic={topic => { setChapter(topic); setPage(0); }} topics={chapters} questions={base.map(q => q.q)} placeholder="Search questions, answers or chapters…" />
      <button type="button" className={styles.filterButton} aria-expanded={filtersOpen} aria-controls={filterId} onClick={() => setFiltersOpen(o => !o)}>
        <SlidersHorizontal size={16} aria-hidden="true" />Filters{active > 0 && <b aria-label={`${active} active`}>{active}</b>}</button>
      {(active > 0 || query) && <button type="button" className={styles.clear} onClick={() => { clearAll(); setPage(0); }}><X size={14} aria-hidden="true" />Clear all</button>}
    </div>
    {filtersOpen && <div id={filterId} className={styles.filters} role="group" aria-label="Filters">
      <ExamSelect id={chapterId} label="Chapter" value={safeChapter} onChange={value => { setChapter(value); setPage(0); }} options={chapters} allLabel="All chapters" />
      <fieldset><legend>Type</legend>{([["all", "All"], ["mcq", "Objective"], ["written", "Written"]] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={kind === id} onClick={() => { setKind(id); setPage(0); }}>{label}</button>)}</fieldset>
      <fieldset><legend>Rating</legend>{([[0, "Any"], [4, "4★ +"], [5, "5★"]] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={minStars === id} onClick={() => { setMinStars(id); setPage(0); }}>{label}</button>)}</fieldset>
      <fieldset><legend>Marks</legend>{([["all", "Any"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4+"]] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={marks === id} onClick={() => { setMarks(id); setPage(0); }}>{label}</button>)}</fieldset>
    </div>}

    <p className={styles.count} aria-live="polite">{rows.length ? `Showing ${safePage * PAPER_PAGE_SIZE + 1}–${safePage * PAPER_PAGE_SIZE + visible.length} of ${rows.length} ${rows.length === 1 ? "question" : "questions"}` : "No question matches."}
      {!rows.length && <button type="button" onClick={clearAll}>Clear search and filters</button>}</p>
    <ol className={styles.list} key={`${tab}-${paper?.id ?? "asked"}-${safePage}`}>
      {visible.map(({ q, n }, i) => <QuestionCard key={q.id} n={n} q={q} freshContext={i === 0 || visible[i - 1].q.context !== q.context} freshFigure={i === 0 || visible[i - 1].q.figure?.src !== q.figure?.src} exam={tab === "mock" ? { running, submitted: test.submittedAt !== null } : undefined} chosen={chosen[q.id]} onChoose={option => setChosen(c => ({ ...c, [q.id]: option }))} />)}
    </ol>
    {pages > 1 && <Pager page={safePage} pages={pages} label="Question pages" onPage={next => { setPage(next); toPanel(); }} />}
    {printing && paper && <PrintPaper paper={paper} answers={printing === "answers"} boardName={boardName} />}
  </div></ExamContent>;
}
