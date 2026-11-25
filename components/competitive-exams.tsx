"use client";
import Image from "@/components/responsive-image";
import { ExamContent } from "./exam-locale";
import { useExamLocale, useExamShard } from "./exam-locale";
import { LanguageSwitch } from "./language-switch";
import { RouteH1 } from "@/components/route-heading";
import { Pager } from "@/components/pager";
import { useDeferredValue, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowDownAZ, ArrowDownWideNarrow, BookOpen, Building2, CalendarClock, Languages, CalendarDays, CircleCheck, ExternalLink, FileText, Flame, LayoutGrid, ListChecks, MessageSquareText, PencilLine, Scale, Star, Trophy, X, Zap } from "lucide-react";
import { QuickQa } from "@/components/quick-qa";
import type { QuickItem } from "@/lib/quick-qa";
import { EXAMS, TABS_PER_PAGE, loadExam, loadQuick, type ExamId } from "@/lib/competitive-exams/exams";
import type { Objective, Pack, Subjective } from "@/lib/competitive-exams/types";
import { CALENDAR } from "@/lib/competitive-exams/calendar";
import { OBJECTIVE_MINIMUM } from "@/lib/competitive-exams/practice";
import { competitiveExamImage, competitiveSubjectImage } from "@/lib/exam-images";
import { useGridColumns } from "./use-grid-columns";
import { useExamAnswers } from "@/lib/use-exam-answers";
import { MARKING, marksFor } from "@/lib/competitive-exams/marking";
import { SUBJECTIVE_MINIMUM } from "@/lib/competitive-exams/subjective";
import { ExamSearch } from "./exam-search";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { ExamSelect } from "./exam-select";
import shared from "./board-exams.module.css";
import styles from "./competitive-exams.module.css";
import dynamic from "next/dynamic";
import { buildExamPapers, COMPETITIVE_YEARS } from "@/lib/competitive-exams/papers";
// Sample Papers loads with its tab, so the other question types do not ship it.
const ExamSamplePapers = dynamic(() => import("./exam-sample-papers").then(m => m.ExamSamplePapers), { loading: () => <div className={shared.skeleton} aria-busy="true" aria-label="Loading papers"><span /><span /><span /></div> });

/*
 * The Learning Dashboard's Competitive Exams page. Each exam family is a tab, four tabs to a page. Inside an exam the
 * most-asked questions sit in two tabs, Objective and Subjective, each question with a star rating and the exam and
 * year it was asked in. Content is hand-authored in lib/competitive-exams and loads one exam at a time.
 * The layout shares the Board Exams page's styles, so the two exam pages read as one family.
 */
type Kind = "topics" | "papers" | "objective" | "subjective" | "quick" | "calendar";
/** An exam's picture (npm run images:competitive); until it exists, the exam's code shows. */
function ExamArt({ id, code }: { id: string; code: string }) {
  const [failed, setFailed] = useState(false); const src = competitiveExamImage(id);
  return src && !failed ? <Image className={styles.examArt} src={src} alt="" aria-hidden="true" width={52} height={52} sizes="52px" onError={() => setFailed(true)} />
    : <span className={styles.examCode} aria-hidden="true">{code}</span>;
}
const PER_PAGE = 5;

/** A subject's picture, painted through the Vercel AI Gateway (npm run images:competitive-subjects); until it exists, an icon shows. */
function SubjectArt({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false);
  return <span className={shared.chapterArt} aria-hidden="true">
    {src && !failed ? <Image src={src} alt="" width={320} height={213} sizes="(max-width: 640px) 50vw, 320px" onError={() => setFailed(true)} /> : <BookOpen size={30} />}
  </span>;
}
type SubjectCard = { name: string; objective: number; subjective: number; popular: number; top: string | null };
type SubjectFilter = "all" | "objective" | "subjective" | "popular";
const SUBJECT_FILTERS: { id: SubjectFilter; label: string; icon: typeof ListChecks }[] = [
  { id: "all", label: "All subjects", icon: LayoutGrid }, { id: "objective", label: "Objective", icon: ListChecks },
  { id: "subjective", label: "Subjective", icon: PencilLine }, { id: "popular", label: "Most popular · 5★", icon: Flame },
];
const SUBJECT_ROWS = 5;
/** Subjects & Topics: every subject of the exam as a picture card, five rows to a page, with search suggestions, filters and sort. */
function SubjectGrid({ cards, texts, art, examName, onOpen }: {
  cards: SubjectCard[]; texts: Map<string, string>; art: (name: string) => ReactNode; examName: string; onOpen: (name: string, kind: "objective" | "subjective") => void;
}) {
  const [query, setQuery] = useState(""); const [filter, setFilter] = useState<SubjectFilter>("all"); const [sort, setSort] = useState<"most" | "az">("most"); const [page, setPage] = useState(0);
  const grid = useRef<HTMLUListElement>(null); const columns = useGridColumns(grid); const perPage = columns * SUBJECT_ROWS;
  const termKey = query.trim().toLowerCase();
  const shown = useMemo(() => {
    const terms = termKey.split(/\s+/).filter(Boolean);
    const has = (card: SubjectCard) => filter === "all" || card[filter] > 0;
    const hit = (card: SubjectCard) => !terms.length || terms.every(term => `${card.name} ${texts.get(card.name) ?? ""}`.toLowerCase().includes(term));
    const rows = cards.filter(card => has(card) && hit(card));
    return sort === "az" ? rows.toSorted((a, b) => a.name.localeCompare(b.name)) : rows.toSorted((a, b) => b.objective + b.subjective - a.objective - a.subjective);
  }, [cards, texts, filter, sort, termKey]);
  const pages = Math.max(1, Math.ceil(shown.length / perPage)); const safePage = Math.min(page, pages - 1);
  const visible = shown.slice(safePage * perPage, (safePage + 1) * perPage);
  const questions = useMemo(() => [...texts.values()].flatMap(text => text.split("\n")).filter(Boolean), [texts]);
  const reset = () => { setQuery(""); setFilter("all"); setSort("most"); setPage(0); };
  return <ExamContent><>
    <div className={shared.chapterTools}>
      <ExamSearch value={query} onChange={value => { setQuery(value); setPage(0); }} onTopic={name => { setQuery(name); setPage(0); }} topics={cards.map(card => card.name)} questions={questions}
        placeholder="Search subjects, topics or questions…" label="Search subjects" />
      <div className={shared.chipRow}>
        <div className={shared.chips} role="group" aria-label="Filter subjects by question type">
          {SUBJECT_FILTERS.map(({ id, label, icon: Icon }) => <ExamContent key={id}><button type="button" className={shared.chip} aria-pressed={filter === id} onClick={() => { setFilter(id); setPage(0); }}><Icon size={15} aria-hidden="true" />{label}</button></ExamContent>)}
        </div>
        <div className={shared.chips} role="group" aria-label="Sort subjects">
          <button type="button" className={shared.chip} aria-pressed={sort === "most"} onClick={() => { setSort("most"); setPage(0); }}><ArrowDownWideNarrow size={15} aria-hidden="true" />Most questions</button>
          <button type="button" className={shared.chip} aria-pressed={sort === "az"} onClick={() => { setSort("az"); setPage(0); }}><ArrowDownAZ size={15} aria-hidden="true" />A to Z</button>
        </div>
      </div>
      <p className={shared.chapterCount} aria-live="polite">{shown.length ? `Showing ${safePage * perPage + 1}–${Math.min(shown.length, (safePage + 1) * perPage)} of ${shown.length} subjects for ${examName}` : `No subject matches for ${examName}`}
        {(query || filter !== "all" || sort !== "most") && <button type="button" className={shared.clearAll} onClick={reset}><X size={14} aria-hidden="true" />Clear</button>}</p>
    </div>
    <ul ref={grid} className={shared.chapters}>{visible.map(card => <ExamContent key={card.name}><li className={shared.chapterCard}>
      {art(card.name)}
      <div className={shared.chapterBody}>
        <h3>{card.name}</h3>
        {card.top && <p className={shared.chapterTop}><Star size={12} aria-hidden="true" />{card.top}</p>}
        <div className={shared.chapterLinks}>
          {card.objective > 0 && <button type="button" onClick={() => onOpen(card.name, "objective")}><ListChecks size={13} aria-hidden="true" />Objective <b>{card.objective}</b></button>}
          {card.subjective > 0 && <button type="button" onClick={() => onOpen(card.name, "subjective")}><PencilLine size={13} aria-hidden="true" />Subjective <b>{card.subjective}</b></button>}
          {card.popular > 0 && <span className={styles.popular}><Flame size={13} aria-hidden="true" />5★ <b>{card.popular}</b></span>}
        </div>
      </div>
    </li></ExamContent>)}</ul>
    {shown.length > 0 && <div className={shared.gridFoot}>
      <p aria-live="polite">Showing {safePage * perPage + 1}–{Math.min(shown.length, (safePage + 1) * perPage)} of {shown.length} subjects · Page {safePage + 1} of {pages} · {SUBJECT_ROWS} rows per page</p>
      <Pager page={safePage} pages={pages} label="Subject pages" onPage={next => { setPage(next); toPanel(); }} />
    </div>}
  </></ExamContent>;
}

const words = (text: string) => text.toLowerCase().split(/\s+/).filter(Boolean);
function Mark({ text, terms }: { text: string; terms: string[] }): ReactNode {
  if (!terms.length) return text;
  const pattern = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return text.split(pattern).map((part, index) => index % 2 ? <mark key={index}>{part}</mark> : part);
}
const Stars = ({ count }: { count: number }) => <ExamContent><span className={shared.stars} role="img" aria-label={`${count} out of 5 stars`}>{[1, 2, 3, 4, 5].map(n => <ExamContent key={n}><Star size={13} aria-hidden="true" data-on={n <= count || undefined} /></ExamContent>)}</span></ExamContent>;
/** Editorial chance that this question, or a close variant, is asked again: follows the star rating. */
const CHANCE: Record<number, string> = { 5: "Very high", 4: "High", 3: "Moderate" };
const FORM: Record<NonNullable<Subjective["form"]>, string> = { descriptive: "Descriptive", short: "Short answer", oneLine: "One-line answer" };
const Meta = ({ item, exam }: { item: Objective | Subjective; exam: ExamId }) => <ExamContent><span className={shared.metaRow}><Stars count={item.stars} /><span className={shared.tag}>{item.subject}</span>
  {"options" in item ? <span className={styles.marksTag} title={MARKING[exam].basis}><Scale size={12} aria-hidden="true" />{marksFor(exam, item.subject).label}</span> : <span className={styles.formTag} data-form={item.form ?? "descriptive"}><MessageSquareText size={12} aria-hidden="true" />{FORM[item.form ?? "descriptive"]}</span>}
  <span className={styles.asked}><CalendarDays size={12} aria-hidden="true" />Asked in {item.asked}</span><span className={styles.chance} data-level={item.stars}><Flame size={12} aria-hidden="true" />Chance of being asked: {CHANCE[item.stars] ?? "Moderate"}</span></span></ExamContent>;
const toPanel = () => document.getElementById("competitive-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });

/** Answers are saved to the signed-in account of this portal (lib/use-exam-answers.ts), so progress survives reloads and devices. */
function ObjectiveList({ items, terms, start, scope }: { items: Objective[]; terms: string[]; start: number; scope: ExamId }) {
  const [picked, record] = useExamAnswers(scope);
  return <ExamContent><ol className={shared.list}>
    {items.map((item, index) => {
      const choice = picked[item.id]; const answered = choice !== undefined;
      return <ExamContent key={item.id}><li className={`${shared.card} ${styles.objective}`} data-open={answered || undefined}>
        <div className={styles.question}><span className={shared.num}>{start + index + 1}</span>
          <h3 className={shared.qText}><span><Mark text={item.q} terms={terms} /></span><Meta item={item} exam={scope} /></h3></div>
        <div className={styles.options} role="group" aria-label={`Options for question ${start + index + 1}`}>
          {item.options.map((option, i) => <ExamContent key={i}><button type="button" disabled={answered} data-state={answered ? (i === item.correct ? "right" : choice === i ? "wrong" : undefined) : undefined}
            onClick={() => record(item.id, i, i === item.correct)}><span>{String.fromCharCode(65 + i)}</span>{option}</button></ExamContent>)}
        </div>
        {answered
          ? <p className={styles.why} role="status"><CircleCheck size={15} aria-hidden="true" /><span><b>{choice === item.correct ? "Correct. " : choice === -1 ? "" : "Not quite. "}Answer: {String.fromCharCode(65 + item.correct)}. {item.options[item.correct]}.</b> {item.why}</span></p>
          : <button type="button" className={styles.reveal} onClick={() => record(item.id, -1, false)}>Show answer</button>}
      </li></ExamContent>;
    })}
  </ol></ExamContent>;
}

function SubjectiveList({ items, terms, start, exam }: { items: Subjective[]; terms: string[]; start: number; exam: ExamId }) {
  return <ExamContent><Accordion multiple render={<ol className={shared.list} />}>
    {items.map((item, index) => {
      return <ExamContent key={item.id}><AccordionItem value={item.id} render={<li className={shared.card} />}>
        <AccordionTrigger className={shared.trigger}>
          <span className={shared.num}>{start + index + 1}</span>
          <span className={shared.qText}><span><Mark text={item.q} terms={terms} /></span><Meta item={item} exam={exam} /></span>
        </AccordionTrigger>
        <AccordionContent className={shared.panelBody}><div className={shared.answer}>
          <div className={shared.paper}><strong><FileText size={14} aria-hidden="true" />Model answer</strong><ol>{item.a.map((line, i) => <ExamContent key={i}><li>{line}</li></ExamContent>)}</ol></div>
        </div></AccordionContent>
      </AccordionItem></ExamContent>;
    })}
  </Accordion></ExamContent>;
}

/** `context`: which dashboard hosts the page (Exams portal or Learning Dashboard), for the eyebrow label. */
export function CompetitiveExams({ initial, context = "exams" }: { initial?: { exam?: string; type?: string }; context?: "exams" | "learning" }) {
  const { localize, english } = useExamLocale();
  const first = Math.max(0, EXAMS.findIndex(e => e.id === initial?.exam));
  const [examId, setExamId] = useState<ExamId>(EXAMS[first].id);
  useExamShard(`exam-${examId}`);
  const [tabPage, setTabPage] = useState(Math.floor(first / TABS_PER_PAGE));
  const [kind, setKind] = useState<Kind>(initial?.type === "topics" || initial?.type === "papers" || initial?.type === "subjective" || initial?.type === "quick" || initial?.type === "calendar" ? initial.type : "objective");
  const [quickSet, setQuickSet] = useState<{ id: ExamId; items: QuickItem[] } | null>(null);
  const [loaded, setLoaded] = useState<{ id: ExamId; pack: Pack } | null>(null);
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [page, setPage] = useState(0);
  const [minStars, setMinStars] = useState<0 | 4 | 5>(0);
  const [form, setForm] = useState<"all" | NonNullable<Subjective["form"]>>("all");
  const subjectId = useId();
  const deferred = useDeferredValue(query);

  useEffect(() => {
    let live = true;
    void loadExam(examId).then(pack => { if (live) setLoaded({ id: examId, pack }); });
    return () => { live = false; };
  }, [examId]);

  // The 200+ quick questions are a separate chunk, fetched only when their tab is opened.
  useEffect(() => {
    if (kind !== "quick") return;
    let live = true;
    void loadQuick(examId).then(items => { if (live) setQuickSet({ id: examId, items }); });
    return () => { live = false; };
  }, [examId, kind]);

  const exam = EXAMS.find(e => e.id === examId)!;
  const quickItems = useMemo(() => quickSet?.id === examId ? localize(quickSet.items) : null, [quickSet, examId, localize]);
  const source = useMemo(() => loaded?.id === examId ? localize(loaded.pack) : null, [loaded, examId, localize]);
  /** Sample papers, mock tests and year papers of this exam (lib/competitive-exams/papers.ts), built when their tab opens. */
  const paperSet = useMemo(() => kind === "papers" && source ? buildExamPapers(source, examId, exam.name) : null, [kind, source, examId, exam.name]);
  const terms = useMemo(() => words(deferred), [deferred]);
  const all = useMemo<(Objective | Subjective)[]>(() => source && (kind === "objective" || kind === "subjective") ? source[kind] : [], [source, kind]);
  const subjects = useMemo(() => [...new Set(all.map(item => item.subject))], [all]);
  const safeSubject = subjects.includes(subject) ? subject : "";
  const rows = useMemo(() => all
    .filter(item => (!safeSubject || item.subject === safeSubject) && item.stars >= minStars && (form === "all" || !("a" in item) || (item.form ?? "descriptive") === form) && (!terms.length || terms.every(term => `${item.q} ${item.subject} ${item.asked} ${"a" in item ? item.a.join(" ") : item.options.join(" ")}`.toLowerCase().includes(term))))
    .toSorted((a, b) => b.stars - a.stars), [all, safeSubject, terms, minStars, form]);
  /** Every subject of the exam with how many questions it holds (the Subjects & Topics grid), and its question texts for search. */
  const subjectCards = useMemo<SubjectCard[]>(() => {
    if (!source) return [];
    const map = new Map<string, SubjectCard>(); const best = new Map<string, number>();
    for (const item of [...source.objective, ...source.subjective]) {
      const card = map.get(item.subject) ?? { name: item.subject, objective: 0, subjective: 0, popular: 0, top: null };
      if ("a" in item) card.subjective++; else card.objective++;
      if (item.stars >= 5) card.popular++;
      if (item.stars > (best.get(item.subject) ?? -1)) { best.set(item.subject, item.stars); card.top = item.q; }
      map.set(item.subject, card);
    }
    return [...map.values()];
  }, [source]);
  const subjectTexts = useMemo(() => { const map = new Map<string, string>(); if (source) for (const item of [...source.objective, ...source.subjective]) map.set(item.subject, `${map.get(item.subject) ?? ""}${item.q}\n`); return map; }, [source]);
  const suggestionTexts = useMemo(() => all.map(item => item.q), [all]);
  const filtered = query !== "" || safeSubject !== "" || minStars !== 0 || form !== "all";
  const clearFilters = () => { setQuery(""); setSubject(""); setMinStars(0); setForm("all"); setPage(0); };
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE)); const safePage = Math.min(page, pages - 1);
  const visible = rows.slice(safePage * PER_PAGE, (safePage + 1) * PER_PAGE);
  const tabPages = Math.ceil(EXAMS.length / TABS_PER_PAGE);
  const tabs = EXAMS.slice(tabPage * TABS_PER_PAGE, (tabPage + 1) * TABS_PER_PAGE);

  const remember = (next: { exam?: ExamId; type?: Kind }) => {
    const url = new URL(window.location.href);
    url.searchParams.set("exam", next.exam ?? examId); url.searchParams.set("type", next.type ?? kind);
    window.history.replaceState(window.history.state, "", url);
  };
  const reset = () => { setQuery(""); setSubject(""); setPage(0); setMinStars(0); setForm("all"); };
  const pickExam = (id: ExamId) => { setExamId(id); reset(); remember({ exam: id }); };
  const pickKind = (id: Kind) => { setKind(id); reset(); remember({ type: id }); };
  const openSubject = (name: string, next: "objective" | "subjective") => { pickKind(next); setSubject(name); requestAnimationFrame(toPanel); };
  const KINDS: { id: Kind; label: string; hint: string; icon: typeof ListChecks; count: number | null }[] = [
    { id: "topics", label: "Subjects & Topics", hint: "Every subject as a picture card", icon: LayoutGrid, count: source ? subjectCards.length : null },
    { id: "papers", label: "Sample Papers", hint: `Sample, mock & ${COMPETITIVE_YEARS.length} years`, icon: FileText, count: source ? 12 + COMPETITIVE_YEARS.length : null },
    { id: "objective", label: "Objective", hint: "Multiple choice with explanations", icon: ListChecks, count: source?.objective.length ?? null },
    { id: "subjective", label: "Subjective", hint: `${SUBJECTIVE_MINIMUM}+ descriptive, short and one-line answers`, icon: PencilLine, count: source?.subjective.length ?? null },
    { id: "quick", label: "Quick Q&A", hint: "200+ short, to-the-point answers", icon: Zap, count: quickItems?.length ?? null },
    { id: "calendar", label: "Exam Calendar", hint: "Conducting body and official site", icon: CalendarClock, count: EXAMS.length },
  ];

  return <ExamContent><div className={shared.page}>
    <header className={shared.hero}>
      <div className={shared.heroText}>
        <p className={shared.eyebrow}><Trophy size={14} aria-hidden="true" />{context === "learning" ? "Learning Dashboard · Competitive Exams" : "Exam Aspirants · Competitive Exams"}</p>
        {context === "learning" && <LanguageSwitch />}
        <RouteH1>Government exam preparation, <em>most-asked first</em></RouteH1>
        <p>Top-ranked government exams (NDA, Defence, Banks, Railways, SSC, UPSC, TET, CBI, Income Tax, Intelligence Bureau, LIC, EPFO, Coast Guard and more), each with {OBJECTIVE_MINIMUM}+ objective questions (options, answer, short explanation and the exam&apos;s marking scheme) and {SUBJECTIVE_MINIMUM}+ subjective questions with model answers. Every question shows when it was asked, a star rating and its chance of being asked again; filter by rating to see the most popular questions first.</p>
        <ul className={shared.highlights} aria-label="What you get">
          <li><Trophy size={14} aria-hidden="true" />{EXAMS.length} government exams</li>
          <li><Flame size={14} aria-hidden="true" />Most asked first, rated</li>
          <li><MessageSquareText size={14} aria-hidden="true" />Model answers</li>
          <li><Scale size={14} aria-hidden="true" />Real marking schemes</li>
          <li><Languages size={14} aria-hidden="true" />English and हिन्दी</li>
        </ul>
      </div>
      <dl className={shared.stats}>
        <div><dt>Exams</dt><dd>{EXAMS.length}</dd></div>
        <div><dt>Objective questions</dt><dd>{(EXAMS.length * OBJECTIVE_MINIMUM).toLocaleString("en-IN")}+</dd></div>
        <div><dt>Subjective per exam</dt><dd>{SUBJECTIVE_MINIMUM}+</dd></div>
      </dl>
    </header>

    <section className={shared.step} aria-labelledby="step-exam">
      <div className={styles.stepHead}><h2 id="step-exam"><span>1</span>Choose your exam</h2><p aria-live="polite">Exams {tabPage * TABS_PER_PAGE + 1} to {Math.min(EXAMS.length, (tabPage + 1) * TABS_PER_PAGE)} of {EXAMS.length}</p></div>
      <div className={styles.exams} role="tablist" aria-labelledby="step-exam">
        {tabs.map(e => <ExamContent key={e.id}><button type="button" role="tab" aria-selected={e.id === examId} aria-controls="competitive-panel" className={styles.exam} onClick={() => pickExam(e.id)}>
          <ExamArt id={e.id} code={e.code} />
          <span className={styles.examText}><strong>{e.name}</strong><small>{e.covers}</small></span>
        </button></ExamContent>)}
      </div>
      <div className={styles.tabPager}><Pager page={tabPage} pages={tabPages} label="Exam tabs pages" onPage={setTabPage} /></div>
      <aside className={styles.pattern} aria-label="Paper pattern">
        <small>{exam.name} · paper pattern</small>
        <p>{exam.pattern} <span>Patterns change between notifications, so confirm with the current official notification.</span></p>
        <p className={styles.body}><Scale size={13} aria-hidden="true" />Marking: {MARKING[examId].basis}</p>
        {CALENDAR[examId] && <p className={styles.body}><Building2 size={13} aria-hidden="true" />{CALENDAR[examId]!.body} · {CALENDAR[examId]!.frequency}{CALENDAR[examId]!.site && <> · <a href={CALENDAR[examId]!.site!} target="_blank" rel="noopener noreferrer">{CALENDAR[examId]!.siteLabel}<ExternalLink size={11} aria-hidden="true" /></a></>}</p>}
      </aside>
    </section>

    <section className={shared.step} aria-labelledby="step-type">
      <h2 id="step-type"><span>2</span>Choose the question type</h2>
      <div className={styles.kinds} role="tablist" aria-label="Question type">
        {KINDS.map(k => <ExamContent key={k.id}><button type="button" role="tab" aria-selected={k.id === kind} aria-controls="competitive-panel" className={shared.view} onClick={() => pickKind(k.id)}>
          <k.icon size={18} aria-hidden="true" /><span><strong>{k.label}</strong><small>{k.hint}</small></span><b>{k.count ?? "–"}</b></button></ExamContent>)}
      </div>
    </section>

    {(kind === "objective" || kind === "subjective") && <section className={shared.toolbar} aria-label="Search and filter questions">
      <ExamSearch value={query} onChange={value => { setQuery(value); setPage(0); }} onTopic={topic => { setSubject(topic); setPage(0); }} topics={subjects} questions={suggestionTexts} placeholder="Search questions, answers, subjects or years…" />
      <ExamSelect id={subjectId} label="Subject" value={safeSubject} onChange={next => { setSubject(next); setPage(0); }} options={subjects} allLabel="All subjects" />
      <div className={shared.chips} role="group" aria-label="Filter by rating and answer type">
        {([[0, "Any rating"], [4, "4★ and up"], [5, "Most popular · 5★"]] as const).map(([value, label]) => <ExamContent key={value}><button type="button" className={shared.chip} aria-pressed={minStars === value} onClick={() => { setMinStars(value); setPage(0); }}><Star size={15} aria-hidden="true" data-on={value > 0 || undefined} />{label}</button></ExamContent>)}
        {kind === "subjective" && <>
          <span className={shared.chipRule} aria-hidden="true" />
          {([["all", "All answers", LayoutGrid], ["descriptive", "Descriptive", FileText], ["short", "Short answer", PencilLine], ["oneLine", "One-line", Zap]] as const).map(([id, label, Icon]) => <ExamContent key={id}><button type="button" className={shared.chip} aria-pressed={form === id} onClick={() => { setForm(id); setPage(0); }}><Icon size={15} aria-hidden="true" />{label}</button></ExamContent>)}
        </>}
      </div>
      {filtered && <button type="button" className={shared.clearAll} onClick={clearFilters}><X size={14} aria-hidden="true" />Clear all filters</button>}
    </section>}

    <section id="competitive-panel" className={shared.panel} role="tabpanel" aria-label={`${exam.name} ${kind} questions`}>
      {kind === "calendar" ? <>
        <div className={shared.panelHead}><h2>Exam calendar · who conducts each exam</h2><p>{EXAMS.length} exams</p></div>
        <p className={shared.note}><CalendarClock size={14} aria-hidden="true" /><span>Dates change every cycle and are announced by the conducting body, so each exam links to its official site, where the notification and exam calendar are published. We do not print dates we cannot confirm.</span></p>
        <div className={shared.yearsWrap}><table className={shared.years}>
          <thead><tr><th scope="col">Exam</th><th scope="col">Conducted by</th><th scope="col">How often</th><th scope="col">Official site</th></tr></thead>
          <tbody>{EXAMS.map(e => { const c = CALENDAR[e.id]; return <ExamContent key={e.id}><tr className={styles.calendarRow} data-current={e.id === examId || undefined}>
            <th scope="row"><button type="button" className={styles.calendarExam} onClick={() => { pickExam(e.id); pickKind("objective"); }}>{e.name}</button></th>
            <td>{c?.body ?? "As notified"}</td><td>{c?.frequency ?? "As notified"}</td>
            <td>{c?.site ? <a href={c.site} target="_blank" rel="noopener noreferrer">{c.siteLabel} <ExternalLink size={12} aria-hidden="true" /></a> : c?.siteLabel ?? "–"}</td>
          </tr></ExamContent>; })}</tbody>
        </table></div>
      </> : kind === "topics" ? (!source ? <div className={shared.skeleton} aria-busy="true" aria-label="Loading subjects"><span /><span /><span /></div> : <>
        <div className={shared.panelHead}><h2>{exam.name} · Subjects &amp; Topics</h2><p aria-live="polite">{subjectCards.length} subjects</p></div>
        <SubjectGrid key={examId} cards={subjectCards} texts={subjectTexts} examName={exam.name} onOpen={openSubject} art={name => <SubjectArt key={name} src={competitiveSubjectImage(english(name))} />} />
      </>) : kind === "papers" ? (!paperSet ? <div className={shared.skeleton} aria-busy="true" aria-label="Loading papers"><span /><span /><span /></div> : <>
        <div className={shared.panelHead}><h2>{exam.name} · Sample Papers</h2><p>{paperSet.unique}+ questions with answers</p></div>
        <ExamSamplePapers key={examId} set={paperSet} boardName={exam.name} title={exam.name} copy={{
          yearsTab: `Previous ${COMPETITIVE_YEARS.length} years`,
          lede: <>{exam.name}: {paperSet.unique}+ different objective questions with answers across {paperSet.sample.length + paperSet.mock.length + paperSet.years.length} papers of {paperSet.sample[0]?.questions.length} questions, plus {paperSet.asked.length} most asked questions (objective and written) rated by stars. Marking: {MARKING[examId].basis}.</>,
          yearNote: paper => paper.note,
          askedNote: "Highest rated first. Stars, and the exam and years under each answer, are our editorial rating of how regularly a question or a close variant recurs, from released and memory-based papers as best recalled. A study guide, not an official count.",
          mockNote: <>Timed at the exam&apos;s own pace and marked with its scheme ({MARKING[examId].basis}). Start the test, pick an option for each question, then submit (or let the clock run out) to see your net score after negative marking and every answer.</>,
        }} />
      </>) : kind === "quick" ? (!quickItems ? <div className={shared.skeleton} aria-busy="true" aria-label="Loading questions"><span /><span /><span /></div> : <>
        <div className={shared.panelHead}><h2>{exam.name} · Quick questions and answers</h2></div>
        <QuickQa key={examId} items={quickItems} panelId="competitive-panel" />
      </>) : !source ? <div className={shared.skeleton} aria-busy="true" aria-label="Loading questions"><span /><span /><span /></div> : <>
        <div className={shared.panelHead}>
          <h2>{exam.name} · Most asked {kind === "objective" ? "objective" : "subjective"} questions</h2>
          <p aria-live="polite">{rows.length} {rows.length === 1 ? "question" : "questions"}, highest rated first</p>
        </div>
        <p className={shared.note}><Star size={14} aria-hidden="true" /><span>Stars, and the chance of being asked that follows from them, are our editorial rating of how regularly a question or a close variant recurs: five stars (very high) means prepare it first. The exam and year on each question are given to the best of our knowledge from released and memory-based papers; aptitude and reasoning questions are marked as recurring types because a type like this is set almost every year. Marks follow the exam&apos;s latest marking scheme we know of. Treat them as a study guide and check the official paper before quoting them.</span></p>
        {!rows.length ? <p className={shared.empty}>No question matches. <button type="button" onClick={clearFilters}>Clear all filters</button></p>
          : kind === "objective" ? <ObjectiveList key={`${examId}-${safeSubject}-${terms.join(" ")}-${safePage}`} items={visible as Objective[]} terms={terms} start={safePage * PER_PAGE} scope={examId} />
          : <SubjectiveList key={`${examId}-${safeSubject}-${terms.join(" ")}-${safePage}`} items={visible as Subjective[]} terms={terms} start={safePage * PER_PAGE} exam={examId} />}
        {pages > 1 && <Pager page={safePage} pages={pages} label="Questions pages" onPage={next => { setPage(next); toPanel(); }} />}
      </>}
    </section>
  </div></ExamContent>;
}
