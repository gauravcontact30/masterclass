"use client";
import { AccordionSummary } from "@/components/ui/accordion-chevron";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { uniqueLearningPoints } from "@/lib/concise-learning";
import { ExpandedText } from "@/components/expanded-text";
import { compactAbbreviations } from "@/lib/abbreviations";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { BookOpen, Check, ChevronLeft, ChevronRight, Copy, Lightbulb, ListTree, NotebookPen, PanelLeftClose, PanelLeftOpen, Sparkles, TriangleAlert } from "lucide-react";
import { Curriculum, DocumentRecord, KeyPoint, Progress, VocabularyEntry } from "@/lib/domain";
import { curriculumNotes } from "@/lib/notes";
import { enrichLearningNotes, lessonCodeExamples } from "@/lib/learning-content";
import { requestJson, errorKey } from "@/lib/client";
import { fill } from "@/lib/library";
import type { TranslationKey } from "@/lib/i18n";
import { useLanguage } from "./language-provider";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { DownloadLink } from "./download-link";
import { Button } from "./ui/button";
import { LessonCodeExamples } from "./lesson-code-examples";
import { InterviewFocusToggle, useInterviewFocus } from "./interview-focus";
import { showsSection } from "@/lib/interview-focus";
import { ServiceCatalog } from "./service-catalog";
import { AnswerPanels, KnowledgeCheck } from "./knowledge-check";
import { BookmarkButton, BookmarkPoint, BookmarkScope } from "./bookmarks";
import { LearningRegion, LearningTools } from "./learning-marks";
import { learningContentKey } from "@/lib/learning-marks";
import { withoutBlankLines } from "@/lib/code-line-notes";
import styles from "./notes-reader.module.css";

/** Render each unique learning point once, using a list for multi-line prose. */
function Prose({ text }: { text: string }) {
  const points = uniqueLearningPoints([text]);
  return points.length > 1 ? <ul className="notes-bullets">{points.map(line => <li key={line}><BookmarkPoint text={line}><ExpandedText text={line} /></BookmarkPoint></li>)}</ul> : points.length ? <p className="notes-prose"><BookmarkPoint text={points[0]}><ExpandedText text={points[0]} /></BookmarkPoint></p> : null;
}

type SectionRef = (index: number) => (node: HTMLElement | null) => void;

const TONES = {
  key: { Icon: Lightbulb, en: "Key idea", hi: "मुख्य बात" },
  tip: { Icon: Sparkles, en: "Pro tip", hi: "सुझाव" },
  warning: { Icon: TriangleAlert, en: "Watch out", hi: "सावधान" },
} as const;

/** Key points as a grid of cards: tone, headline, explanation and an optional example. */
function KeyPoints({ points, hi }: { points: KeyPoint[]; hi: boolean }) {
  return <ul className={`${styles.keyPoints} learning-key-points`}>
    {points.map((point, index) => {
      const tone = TONES[point.tone];
      return <li key={index} className={styles.kp} data-tone={point.tone}>
        <div className={styles.kpHead}>
          <span className={styles.kpIcon} aria-hidden="true"><tone.Icon size={15} /></span>
          <span className={styles.kpTag}><ExpandedText text={hi ? tone.hi : tone.en} /></span>
          <span className={styles.kpIndex} aria-hidden="true"><ExpandedText text={String(index + 1).padStart(2, "0")} /></span>
        </div>
        {point.title && <p className={styles.kpTitle}><ExpandedText text={point.title} /></p>}
        <p className={styles.kpText}><BookmarkPoint text={[point.title, point.text, point.example].filter(Boolean).join(": ")}><ExpandedText text={point.text} /></BookmarkPoint></p>
        {point.example && <code className={styles.kpExample}>{point.example}</code>}
      </li>;
    })}
  </ul>;
}

/**
 * A vocabulary card's related words. Synonyms and antonyms each get their own
 * headed list — a learner reads "words that mean the same" and "words that mean
 * the opposite" separately — and every word sits in its own pastel pill so a
 * list of six reads as six distinct words rather than one coloured block.
 *
 * Hue is chosen by position within the group, so the palette is stable for a
 * given card: the same word keeps the same colour across re-renders, and the
 * two groups stay visually separated (greens for same, warm tones for opposite).
 */
const RELATION_SHADES = { syn: 5, ant: 5 } as const;

function WordRelations({ word, hi }: { word: VocabularyEntry; hi: boolean }) {
  const groups = [
    { key: "syn" as const, label: hi ? "समानार्थी शब्द" : "Synonyms", words: word.synonyms },
    { key: "ant" as const, label: hi ? "विलोम शब्द" : "Antonyms", words: word.antonyms },
  ].filter(group => group.words.length > 0);
  if (!groups.length) return null;
  return <dl className="notes-vocab-rel">
    {groups.map(group => <div key={group.key} className="notes-vocab-rel-row" data-relation={group.key}>
      <dt className="notes-vocab-rel-label">
        <span className="notes-vocab-rel-dot" aria-hidden="true" />
        <ExpandedText text={group.label} />
        <span className="notes-vocab-rel-count" aria-hidden="true">{group.words.length}</span>
      </dt>
      <dd className="notes-vocab-rel-words">
        {group.words.map((item, index) => <span key={item} className="notes-word-pill" data-relation={group.key} data-shade={index % RELATION_SHADES[group.key]}><ExpandedText text={item} /></span>)}
      </dd>
    </div>)}
  </dl>;
}

/**
 * One vocabulary card. Every part of the entry is labelled — Definition,
 * Example (Sentence), Synonyms, Antonyms — so a learner reads a dictionary
 * entry rather than a paragraph followed by loose chips. Two cards sit per row
 * on a wide reader and one on a narrow screen, which keeps the pill lists
 * readable instead of wrapping into thin columns.
 */
function VocabularyCard({ word, hi }: { word: VocabularyEntry; hi: boolean }) {
  return <div className="notes-vocab-card">
    <span className="notes-vocab-word"><ExpandedText text={word.word} /></span>
    <div className="notes-vocab-field">
      <span className="notes-vocab-field-label"><ExpandedText text={hi ? "परिभाषा" : "Definition"} /></span>
      <p className="notes-vocab-meaning"><ExpandedText text={word.meaning} /></p>
    </div>
    <div className="notes-vocab-field">
      <span className="notes-vocab-field-label"><ExpandedText text={hi ? "उदाहरण (वाक्य)" : "Example (Sentence)"} /></span>
      <p className="notes-vocab-example">&ldquo;<ExpandedText text={word.example} />&rdquo;</p>
    </div>
    <WordRelations word={word} hi={hi} />
  </div>;
}

/**
 * The vocabulary builder: two cards per row, two rows per page. Four entries at
 * a time keeps a lesson's word list from pushing the rest of the notes off the
 * screen, and the pager only appears when there is more than one page.
 *
 * The page resets when the lesson's words change, so moving between lessons
 * never lands on an empty page.
 */
const VOCAB_PAGE_SIZE = 4;

function VocabularyBuilder({ words, hi }: { words: VocabularyEntry[]; hi: boolean }) {
  return <VocabularyPage key={`${hi}:${words.map(word => word.word).join("|")}`} words={words} hi={hi} />;
}

function VocabularyPage({ words, hi }: { words: VocabularyEntry[]; hi: boolean }) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(words.length / VOCAB_PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const shown = words.slice(current * VOCAB_PAGE_SIZE, current * VOCAB_PAGE_SIZE + VOCAB_PAGE_SIZE);
  return <>
    <div className="notes-vocab">{shown.map(word => <VocabularyCard key={word.word} word={word} hi={hi} />)}</div>
    {pages > 1 && <nav className="notes-vocab-pager" aria-label={hi ? "शब्दावली पृष्ठ" : "Vocabulary pages"}>
      <button type="button" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={current === 0}>
        <ChevronLeft size={14} aria-hidden="true" /><ExpandedText text={hi ? "पिछला" : "Previous"} />
      </button>
      <span className="notes-vocab-pager-count"><ExpandedText text={fill(hi ? "{from}–{to} / {total} शब्द" : "{from}–{to} of {total} words", { from: current * VOCAB_PAGE_SIZE + 1, to: current * VOCAB_PAGE_SIZE + shown.length, total: words.length })} /></span>
      <button type="button" onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={current === pages - 1}>
        <ExpandedText text={hi ? "अगला" : "Next"} /><ChevronRight size={14} aria-hidden="true" />
      </button>
    </nav>}
  </>;
}

/**
 * The notes themselves: real headings, labeled lesson fields, code panels,
 * API references and interview questions — built
 * straight from the curriculum object rather than parsed back out of the flat
 * notes string, so it renders correctly in Hindi too (Devanagari has no letter
 * case for ALL-CAPS headings to signal). The flat string from curriculumNotes()
 * still backs copy and download.
 *
 * Sections are registered by index: 0 is the overview, 1..n the lessons and
 * n+1 the wrap-up, which is what the reader's contents list and progress use.
 */
function StructuredNotes({ deck, title, language, technology, sourceHref, sectionRef, idPrefix }: { deck: Curriculum; title: string; language: "en" | "hi"; technology: string; sourceHref: string; sectionRef: SectionRef; idPrefix: string }) {
  const hi = language === "hi";
  const count = deck.lessons.length;
  const { focused } = useInterviewFocus();
  return <BookmarkScope value={{ sourceKey: learningContentKey(technology, title, language), title, technology, href: sourceHref }}><div className="notes-doc">
    <InterviewFocusToggle />
    <section ref={sectionRef(0)} id={`${idPrefix}-0`} tabIndex={-1} className={styles.anchor}>
      <LearningRegion contentKey={learningContentKey(technology, `${title}:overview`, language)}>
      <h2 className="notes-doc-title"><ExpandedText text={title} /></h2><BookmarkButton points={deck.objectives} />
      <span className="notes-doc-meta">{deck.minutes} <ExpandedText text={hi ? "मिनट" : "minutes"} /> · <ExpandedText text={fill(hi ? "{count} पाठ" : "{count} lessons", { count })} /></span>
      <div className="notes-section"><h3><ExpandedText text={hi ? "आप क्या सीखेंगे" : "What you'll learn"} /></h3><ul className="notes-bullets">{deck.objectives.map(o => <li key={o}><ExpandedText text={o} /></li>)}</ul></div>
      {deck.prerequisites.length > 0 && <div className="notes-section"><h3><ExpandedText text={hi ? "शुरू करने से पहले" : "Before you begin"} /></h3><ul className="notes-bullets">{deck.prerequisites.map(p => <li key={p}><ExpandedText text={p} /></li>)}</ul></div>}
      {deck.codeExamples?.length ? <div className="notes-section"><h3><ExpandedText text={hi ? "इस विषय के दो प्रोजेक्ट" : "Two projects for this topic"} /></h3><LessonCodeExamples examples={deck.codeExamples} hi={hi} /></div> : null}
      {deck.services?.length ? <div className="notes-section"><h3><ExpandedText text={hi ? "सेवाएँ, बिंदुवार" : "Services, explained pointwise"} /></h3><ServiceCatalog services={deck.services} hi={hi} /></div> : null}
    </LearningRegion></section>
    {deck.lessons.map((lesson, i) => <section ref={sectionRef(i + 1)} id={`${idPrefix}-${i + 1}`} tabIndex={-1} className={`notes-lesson ${styles.anchor}`} key={i}>
      <BookmarkScope value={{ sourceKey: learningContentKey(technology, lesson.title, language), title: lesson.title, technology, href: sourceHref }}><LearningRegion contentKey={learningContentKey(technology, lesson.title, language)}>
      <span className={styles.lessonEyebrow}><ExpandedText text={hi ? "पाठ" : "Lesson"} /> {i + 1} / {count}</span>
      <h3><ExpandedText text={lesson.title} /></h3><BookmarkButton points={uniqueLearningPoints([lesson.explanation])} />
      {lesson.diagram && <><p className="notes-label"><ExpandedText text={hi ? "यह कैसे काम करता है" : "How it fits together"} /></p><figure className="notes-fig">{lesson.diagram.kind === "tree" ? <div className="notes-fig-tree">{lesson.diagram.items.map((item, n) => <div key={n} style={{ paddingLeft: `${(item.depth ?? 0) * 20}px` }}><span><ExpandedText text={item.label} /></span>{item.detail && <em><ExpandedText text={item.detail} /></em>}</div>)}</div> : lesson.diagram.kind === "split" ? <div className="notes-fig-split">{[0, 1].map(group => <div key={group} className="notes-fig-col"><span className="notes-fig-col-head"><ExpandedText text={lesson.diagram?.headings?.[group] ?? ""} /></span>{lesson.diagram?.items.filter(item => (item.group ?? 0) === group).map((item, n) => <div key={n} className="notes-fig-cell"><strong><ExpandedText text={item.label} /></strong>{item.detail && <span><ExpandedText text={item.detail} /></span>}</div>)}</div>)}</div> : <div className="notes-fig-flow">{lesson.diagram.items.map((item, index) => <div key={index} className="notes-fig-step"><span className="notes-fig-index">{index + 1}</span><div><strong><ExpandedText text={item.label} /></strong>{item.detail && <span><ExpandedText text={item.detail} /></span>}</div></div>)}</div>}<figcaption><ExpandedText text={lesson.diagram.caption} /></figcaption></figure></>}
      <p className="notes-label"><ExpandedText text={hi ? "समझें" : "The idea"} /></p><Prose text={lesson.explanation} />
      {lesson.keyPoints && lesson.keyPoints.length > 0 && <><p className="notes-label"><ExpandedText text={hi ? "मुख्य बातें" : "Key points"} /></p><KeyPoints points={lesson.keyPoints} hi={hi} /></>}
      {uniqueLearningPoints([lesson.example], [lesson.explanation]).length > 0 && <><p className="notes-label"><ExpandedText text={hi ? "उदाहरण" : "Example"} /></p><Prose text={uniqueLearningPoints([lesson.example], [lesson.explanation]).join("\n")} /></>}
      {showsSection("useCases", focused) && lesson.useCase && <><p className="notes-label"><ExpandedText text={hi ? "वास्तविक उपयोग" : "Real-world use case"} /></p><div className="notes-usecase">{([[hi ? "स्थिति" : "Scenario", lesson.useCase.scenario], [hi ? "उदाहरण" : "Worked example", lesson.useCase.example], [hi ? "व्यवहार में उपयोग" : "How it's used in practice", lesson.useCase.usage]] as const).filter(([, text], index, fields) => uniqueLearningPoints([text], [lesson.explanation, lesson.example, ...fields.slice(0, index).map(([, prior]) => prior)]).length > 0).map(([label, text]) => <div key={label}><span><ExpandedText text={label} /></span><p><ExpandedText text={text} /></p></div>)}</div></>}
      <LessonCodeExamples examples={lessonCodeExamples(lesson, technology, language)} hi={hi} />
      {lesson.apiReference && lesson.apiReference.length > 0 && <><p className="notes-label"><ExpandedText text={hi ? "API संदर्भ" : "API reference"} /></p>{lesson.apiReference.map(api => <div className="notes-apiref" key={api.name}><div className="notes-apiref-head"><span className="notes-apiref-kind"><ExpandedText text={api.kind} /></span><span className="notes-apiref-name"><ExpandedText text={api.name} /></span></div><pre className="notes-code notes-apiref-sig"><code>{api.signature}</code></pre>{api.params.length > 0 && <table className="notes-apiref-params"><tbody>{api.params.map(param => <tr key={param.name}><td><ExpandedText text={param.name} /></td><td><ExpandedText text={param.type} /></td><td><ExpandedText text={param.description} /></td></tr>)}</tbody></table>}<p className="notes-apiref-returns"><strong><ExpandedText text={hi ? "रिटर्न" : "Returns"} />:</strong> <ExpandedText text={api.returns} /></p>{api.notes && <p className="notes-apiref-notes"><ExpandedText text={api.notes} /></p>}</div>)}</>}
      <div className={styles.practicePanel}><p className="notes-label"><ExpandedText text={hi ? "अभ्यास" : "Try it yourself"} /></p><Prose text={lesson.exercise} /></div>
      <p className="notes-label"><ExpandedText text={hi ? "समझ जाँचें" : "Check your understanding"} /></p><Prose text={lesson.checkpoint} />
      {lesson.objectiveQuestions?.map(question => <KnowledgeCheck key={question.question} question={question} hi={hi} />)}
      <p className="notes-label notes-label-warn"><ExpandedText text={hi ? "इस गलती से बचें" : "Avoid this mistake"} /></p><Prose text={lesson.mistake} />
      {showsSection("vocabulary", focused) && lesson.vocabulary && lesson.vocabulary.length > 0 && <><p className="notes-label"><ExpandedText text={hi ? "शब्दावली भवन" : "Vocabulary builder"} /></p><VocabularyBuilder words={lesson.vocabulary} hi={hi} /></>}
      {lesson.interview && lesson.interview.length > 0 && <><p className="notes-label"><ExpandedText text={hi ? "इंटरव्यू प्रश्न" : "Interview questions"} /></p>{lesson.interview.map((q, n) => <div className="notes-iv" key={q.question}>
        <p className="notes-iv-q"><span className="notes-iv-badge">Q{n + 1}</span><ExpandedText text={q.question} /></p>
        <AnswerPanels shortAnswer={q.definition} explanation={q.answer} hi={hi} />
        {q.syntax && <pre className="notes-code notes-iv-syntax" aria-label={hi ? "सिंटैक्स" : "Syntax"}><code>{withoutBlankLines(q.syntax)}</code></pre>}
        {q.code && <pre className="notes-code" aria-label={hi ? "कोड उदाहरण" : "Code example"}><code>{withoutBlankLines(q.code)}</code></pre>}
        {q.similar.length > 0 && <div className="notes-iv-similar"><span className="notes-iv-similar-label"><ExpandedText text={hi ? "मिलते-जुलते प्रश्न" : "Similar questions"} /></span>{q.similar.map(s => <details className="notes-iv-acc" key={s.question}><AccordionSummary><ExpandedText text={s.question} /></AccordionSummary><p><ExpandedText text={s.answer} /></p></details>)}</div>}
      </div>)}</>}
    </LearningRegion></BookmarkScope></section>)}
    <section ref={sectionRef(count + 1)} id={`${idPrefix}-${count + 1}`} tabIndex={-1} className={styles.anchor}>
      <LearningRegion contentKey={learningContentKey(technology, `${title}:summary`, language)}>
      <div className="notes-section"><h3><ExpandedText text={hi ? "मिनी प्रोजेक्ट" : "Put it together"} /></h3><Prose text={deck.project} /></div>
      <div className="notes-section"><h3><ExpandedText text={hi ? "सारांश" : "What to remember"} /></h3><Prose text={deck.summary} /></div>
      <div className="notes-section"><h3><ExpandedText text={hi ? "शब्दावली" : "Glossary"} /></h3><dl className="notes-glossary">{deck.glossary.map(g => <div key={g.term}><dt><ExpandedText text={g.term} /></dt><dd><ExpandedText text={g.definition} /></dd></div>)}</dl></div>
    </LearningRegion></section>
  </div></BookmarkScope>;
}

const emptyProgress = (id: string): Progress => ({ document_id: id, page: 1, completed: false, bookmarks: [], notes: "" });

/**
 * Learn in App: the notes reader. A contents rail lists every lesson and marks
 * the one being read; scrolling, the rail, or the previous/next controls move
 * between lessons, and the learner's place, completion and personal notes are
 * saved (to the account, or to this browser for the public samples) so a
 * guide reopens where they left off.
 */
export function NotesModal({ document: initial, initialProgress, onClose, sample = false }: { document: DocumentRecord; initialProgress?: Progress; onClose: () => void; sample?: boolean }) {
  const { t } = useLanguage();
  const idPrefix = useId().replace(/:/g, "");
  const [document, setDocument] = useState<DocumentRecord | null>(initial.curriculum ? initial : null);
  const [error, setError] = useState<TranslationKey | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [copied, setCopied] = useState(false);
  const [contentsOpen, setContentsOpen] = useState(true);
  const [state, setState] = useState<Progress>(() => {
    if (!sample) return initialProgress ?? emptyProgress(initial.id);
    try { const saved = localStorage.getItem(`masterclass:sample:${initial.id}`); if (saved) return { ...emptyProgress(initial.id), ...JSON.parse(saved) as Partial<Progress> }; } catch { /* storage unavailable */ }
    return emptyProgress(initial.id);
  });
  const [section, setSection] = useState(() => state.page > 1 ? state.page : 0);
  const latest = useRef(state);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);
  const scroller = useRef<HTMLDivElement>(null);
  const sections = useRef<(HTMLElement | null)[]>([]);
  const jumping = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restored = useRef(false);

  useEffect(() => {
    if (initial.curriculum) return;
    let active = true;
    void requestJson<{ document: DocumentRecord }>(`/api/documents/${initial.id}`).then(value => {
      if (!value.document.curriculum) throw new Error("not_ready");
      if (active) { setDocument(value.document); setError(null); }
    }).catch(e => { if (active) setError(errorKey(e)); });
    return () => { active = false; };
  }, [initial, attempt]);

  const deck = useMemo(() => document?.curriculum ? enrichLearningNotes(document.curriculum, document.request.language) : null, [document]);
  const count = deck?.lessons.length ?? 0;
  // position: the section on screen (0 overview, 1..count lessons, count+1 wrap-up); lesson: the lesson it belongs to.
  const position = Math.min(Math.max(0, section), count + 1);
  const lesson = Math.min(Math.max(1, section), Math.max(1, count));
  const notes = useMemo(() => deck ? curriculumNotes(deck, document!.title, document!.request.language) : "", [deck, document]);
  const sectionRef = useCallback<SectionRef>(index => node => { sections.current[index] = node; }, []);

  const persist = useCallback(async (): Promise<boolean> => {
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
    if (!dirty.current) return true;
    dirty.current = false;
    const next = latest.current;
    if (sample) {
      try { localStorage.setItem(`masterclass:sample:${initial.id}`, JSON.stringify(next)); return true; } catch { return true; }
    }
    const { page, completed, bookmarks, notes: text } = next;
    const request = queue.current.catch(() => {}).then(() => requestJson(`/api/documents/${initial.id}/progress`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ page, completed, bookmarks, notes: text }) }));
    queue.current = request;
    try { await request; setError(null); return true; } catch { dirty.current = true; setError("saveError"); return false; }
  }, [initial.id, sample]);

  const update = useCallback((patch: Partial<Progress>, delay = 900) => {
    const next = { ...latest.current, ...patch };
    latest.current = next; dirty.current = true; setState(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (delay === 0) void persist(); else saveTimer.current = setTimeout(() => void persist(), delay);
  }, [persist]);

  // Tracks the lesson being read: the last section whose top has scrolled past
  // the upper third of the reading pane. Programmatic jumps suspend it briefly
  // so a smooth scroll does not flicker through every lesson on the way.
  useEffect(() => {
    const root = scroller.current;
    if (!deck || !root) return;
    const onScroll = () => {
      if (jumping.current) return;
      const line = root.getBoundingClientRect().top + root.clientHeight / 3;
      let current = 0;
      sections.current.forEach((node, index) => { if (node && node.getBoundingClientRect().top <= line) current = index; });
      setSection(current);
      if (current >= 1 && current <= count && current !== latest.current.page) update({ page: current });
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, [deck, count, update]);

  const jump = useCallback((index: number, smooth = true) => {
    const node = sections.current[index];
    if (!node) return;
    setSection(index);
    if (index >= 1 && index <= count && index !== latest.current.page) update({ page: index });
    if (jumping.current) clearTimeout(jumping.current);
    jumping.current = setTimeout(() => { jumping.current = null; }, smooth ? 700 : 50);
    const reduced = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollIntoView?.({ block: "start", behavior: smooth && !reduced ? "smooth" : "auto" });
    node.focus({ preventScroll: true });
    if (typeof window.matchMedia === "function" && window.matchMedia("(max-width: 820px)").matches) setContentsOpen(false);
  }, [count, update]);

  // Reopen at the saved lesson, once the notes have rendered.
  useEffect(() => {
    if (!deck || restored.current) return;
    restored.current = true;
    if (latest.current.page > 1) requestAnimationFrame(() => jump(Math.min(latest.current.page, count), false));
  }, [deck, count, jump]);

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); if (jumping.current) clearTimeout(jumping.current); }, []);

  async function close() { await persist(); onClose(); }
  async function copy() { try { await navigator.clipboard.writeText(notes); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { setError("copyNotesFailed"); } }

  const hi = (document ?? initial).request.language === "hi";
  const percent = state.completed ? 100 : count ? Math.round((Math.min(state.page, count) / count) * 100) : 0;
  const contents = deck ? [{ index: 0, label: hi ? "अवलोकन" : "Overview", prefix: "" }, ...deck.lessons.map((item, i) => ({ index: i + 1, label: item.title, prefix: String(i + 1).padStart(2, "0") })), { index: count + 1, label: hi ? "समापन" : "Wrap-up", prefix: "" }] : [];

  return <Dialog open onOpenChange={open => { if (!open) void close(); }}>
    <DialogContent className={`notes-dialog ${styles.dialog}`}>
      <header className={styles.header}><LearningTools />
        <Button className={styles.iconButton} variant="ghost" size="sm" disabled={!deck} title={contentsOpen ? hi ? "विषय-सूची छिपाएँ" : "Collapse contents" : hi ? "विषय-सूची दिखाएँ" : "Expand contents"} aria-label={contentsOpen ? hi ? "विषय-सूची छिपाएँ" : "Collapse contents" : hi ? "विषय-सूची दिखाएँ" : "Expand contents"} aria-expanded={contentsOpen} aria-controls={`${idPrefix}-contents`} onClick={() => setContentsOpen(value => !value)}>{contentsOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}</Button>
        <span className="section-icon"><BookOpen size={20} /></span>
        <div className={styles.headerText}>
          <DialogTitle><ExpandedText text={initial.title} /></DialogTitle>
          <DialogDescription><ExpandedText text={t("learn")} /> &middot; <ExpandedText text={t("libraryTypeNotes")} /> &middot; <ExpandedText text={hi ? "हिन्दी" : "English"} />{count ? <> &middot; <ExpandedText text={fill(t("lessonCount"), { count })} /></> : null}</DialogDescription>
        </div>
      <div className={styles.toolbar}>
        {deck && <div className={styles.progress} role="group" aria-label={t("readingProgress")}>
          <span className={styles.progressBar} aria-hidden="true"><i style={{ width: `${percent}%` }} /></span>
          <span className={styles.progressLabel}><ExpandedText text={state.completed ? t("completed") : position === 0 ? hi ? "अवलोकन" : "Overview" : fill(t("lessonOf"), { lesson, total: count })} /></span>
        </div>}
        <div className={styles.stepper}>
          <Button className={styles.iconButton} variant="ghost" size="sm" disabled={!deck || position <= 0} onClick={() => jump(position - 1)} title={t("previousLesson")} aria-label={t("previousLesson")}><ChevronLeft size={18} /></Button>
          <Button className={styles.iconButton} variant="ghost" size="sm" disabled={!deck || position >= count + 1} onClick={() => jump(position + 1)} title={t("nextLesson")} aria-label={t("nextLesson")}><ChevronRight size={18} /></Button>
        </div>
        {deck && <Label className={styles.jump}><ListTree size={14} aria-hidden="true" /><span className={styles.srOnly}><ExpandedText text={t("contents")} /></span><NativeSelect value={position} onChange={event => jump(Number(event.target.value))}>{contents.map(item => <NativeSelectOption key={item.index} value={item.index}>{item.prefix ? `${item.prefix}. ` : ""}{item.label}</NativeSelectOption>)}</NativeSelect></Label>}
        <div className={styles.actions}>
          <Button className={styles.iconButton} variant={state.completed ? "default" : "ghost"} size="sm" disabled={!deck} title={state.completed ? t("completed") : t("markComplete")} aria-label={state.completed ? t("completed") : t("markComplete")} aria-pressed={state.completed} onClick={() => update({ completed: !state.completed }, 0)}><Check size={17} /></Button>
          <Button className={styles.iconButton} variant="ghost" size="sm" disabled={!notes} title={copied ? t("notesCopied") : t("copyNotes")} aria-label={t("copyNotes")} onClick={() => void copy()}>{copied ? <Check size={17} /> : <Copy size={17} />}</Button>
          <span className={styles.srOnly} role="status"><ExpandedText text={copied ? t("notesCopied") : ""} /></span>
          <DownloadLink iconOnly href={sample ? `data:text/plain;charset=utf-8,${encodeURIComponent(notes)}` : `/api/documents/${initial.id}/download`} filename={`masterclass-${initial.id}-notes.txt`} />
        </div>
      </div>
      </header>
      {error && <div role="alert" className="error-banner"><ExpandedText text={t(error)} /><button onClick={() => { setError(null); if (error === "saveError") void persist(); else setAttempt(value => value + 1); }}><ExpandedText text={t("retry")} /></button></div>}
      {sample && <p className={styles.sampleNote}><ExpandedText text={t("sampleProgress")} /></p>}
      {!document && !error ? <p role="status"><ExpandedText text={t("loading")} /></p> : deck ? <div className={styles.layout} data-contents-open={contentsOpen}>
        <nav id={`${idPrefix}-contents`} className={styles.rail} hidden={!contentsOpen} aria-label={t("contents")}>
          <h3>{t("contents")}</h3>
          <ol>{contents.map(item => <li key={item.index}><button type="button" aria-current={item.index === position ? "location" : undefined} data-done={state.completed || (item.index >= 1 && item.index < lesson) ? "" : undefined} onClick={() => jump(item.index)}>{item.prefix ? <span className={styles.railIndex}>{item.prefix}</span> : <span className={styles.railIndex} aria-hidden="true">•</span>}<span className={styles.railLabel}>{compactAbbreviations(item.label)}</span></button></li>)}</ol>
          <details className={styles.myNotes} open={Boolean(state.notes)}>
            <AccordionSummary><NotebookPen size={14} aria-hidden="true" /><ExpandedText text={t("notes")} /></AccordionSummary>
            <Textarea aria-label={t("notes")} maxLength={20000} placeholder={t("notesHint")} value={state.notes} onChange={event => update({ notes: event.target.value }, 1500)} onBlur={() => void persist()} />
          </details>
        </nav>
        <div ref={scroller} className={`study-notes-content ${styles.content}`} tabIndex={0} aria-label={initial.title}>
          <StructuredNotes sourceHref={sample ? `/dashboard/notes?technology=${encodeURIComponent(initial.request.technologyId)}` : `/dashboard/library?document=${encodeURIComponent(initial.id)}`} deck={deck} title={document!.title} language={document!.request.language} technology={document!.request.technologyId} sectionRef={sectionRef} idPrefix={idPrefix} />
          <div className={styles.finish}>
            {state.completed ? <p><Check size={16} aria-hidden="true" /><ExpandedText text={t("guideCompleted")} /></p> : <Button onClick={() => update({ completed: true, page: count }, 0)}><Check size={15} /><ExpandedText text={t("finishGuide")} /></Button>}
          </div>
        </div>
      </div> : null}
    </DialogContent>
  </Dialog>;
}
