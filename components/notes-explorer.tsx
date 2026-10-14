"use client";
import learningCard from "./learning-card.module.css";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { NativeSelectOption } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import { uniqueLearningPoints, conciseStudyNote } from "@/lib/concise-learning";
import { ExpandedText } from "@/components/expanded-text";


import Link from "next/link";
import { BookmarkButton, BookmarkPoint, BookmarkScope } from "./bookmarks";
import { LearningRegion, LearningTools } from "./learning-marks";
import { learningContentKey } from "@/lib/learning-marks";
import { useDeferredValue, useEffect, useId, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, Code2, GraduationCap, Layers, Search, Star, X } from "lucide-react";
import { NotesToolbar } from "./notes-toolbar";
import { NotesCourseReader } from "./notes-course-reader";
import { KnowledgeCheck } from "./knowledge-check";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import type { NoteSection } from "@/lib/notes-directory";
import { CodeLab } from "./code-lab";
import { KeyText } from "./key-text";
import { InterviewFocusToggle, useInterviewFocus } from "./interview-focus";
import { showsSection } from "@/lib/interview-focus";
import { byInterviewPriority, NOTES_PAGE_SIZE, notesPage, searchStudyNotes, shortDefinition, type NotesSummary, type NotesTechnology, type StudyNote } from "@/lib/notes-study";
import styles from "./notes-explorer.module.css";
import { LearningPicture } from "@/components/learning-picture";
import { learningImageUrl } from "@/lib/learning-image";

export function NotesExplorer({ notes, technologies, initialQuery = "", initialTechnology = "", initialKind = "", initialNote = "" }: {
  notes: NotesSummary[]; technologies: NotesTechnology[]; initialQuery?: string; initialTechnology?: string; initialKind?: string; initialNote?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [technology, setTechnology] = useState(initialTechnology);
  const [kind, setKind] = useState(initialKind);
  const [priority, setPriority] = useState(0);
  const [reset, setReset] = useState(0);
  const deferredQuery = useDeferredValue(query);
  const filtered = useMemo(() => byInterviewPriority(searchStudyNotes(notes, deferredQuery, kind, priority)), [notes, deferredQuery, kind, priority]);
  const groups = useMemo(() => technologies.filter(item => !technology || item.id === technology).map(item => ({ technology: item, notes: filtered.filter(note => note.technology === item.id) })).filter(group => group.notes.length), [technologies, technology, filtered]);
  const count = groups.reduce((total, group) => total + group.notes.length, 0);
  const clear = () => { setQuery(""); setTechnology(""); setKind(""); setPriority(0); setReset(value => value + 1); };

  return <section className={styles.page} aria-label="Technology topic cards"><div className={styles.shell}>
    <NotesToolbar query={query} onQueryChange={setQuery} technology={technology} onTechnologyChange={setTechnology} kind={kind} onKindChange={setKind} priority={priority} onPriorityChange={setPriority} technologies={technologies} counts={Object.fromEntries(technologies.map(item => [item.id, notes.filter(note => note.technology === item.id).length]))} resultCount={count} technologyCount={groups.length} onClear={clear} />
    <div className={styles.pageTools}><LearningTools /></div>
    <div className={styles.layout}><div className={styles.sections}>
      {!groups.length && <section className={styles.empty}><Search size={30} /><h2>No topics found</h2><p>Try a broader term or clear the filters to explore every technology.</p><button type="button" onClick={clear}>Clear all filters</button></section>}
      {groups.map(group => <TechnologySection key={`${reset}-${group.technology.id}`} technology={group.technology} notes={group.notes} initialNote={initialNote} />)}
    </div></div><footer className={styles.footer}><BookOpen size={18} /><span>A little every day. A lot over time.</span><a href="#notes-search">Back to search ↑</a></footer>
  </div></section>;
}

function TechnologySection({ technology, notes, initialNote }: { technology: NotesTechnology; notes: NotesSummary[]; initialNote: string }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [paging, setPaging] = useState({ signature: "", page: 1 });
  const deferredQuery = useDeferredValue(query);
  const id = useId();
  const categories = [...new Set(notes.map(note => note.category))];
  const filtered = useMemo(() => byInterviewPriority(searchStudyNotes(notes, deferredQuery, "").filter(note => !category || note.category === category)), [notes, deferredQuery, category]);
  const signature = `${deferredQuery}:${category}:${notes.map(note => note.id).join(",")}`;
  const initialIndex = initialNote ? filtered.findIndex(note => note.id === initialNote) : -1;
  const requestedPage = paging.signature === signature ? paging.page : initialIndex >= 0 ? Math.floor(initialIndex / NOTES_PAGE_SIZE) + 1 : 1;
  const page = notesPage(filtered, requestedPage);
  const changePage = (next: number) => setPaging({ signature, page: next });
  const clear = () => { setQuery(""); setCategory(""); setPaging({ signature: "", page: 1 }); };
  return <section id={`technology-${technology.id}`} className={styles.technology} aria-labelledby={`${id}-title`}>
    <header className={styles.sectionHeader}><div className={styles.sectionIcon}><Layers size={25} /></div><div><span className={styles.eyebrow}>NOTES · <ExpandedText text={technology.category || "TECHNOLOGY"} /></span><h2 id={`${id}-title`}><ExpandedText text={technology.title} /></h2><p>Key ideas, practical examples and interview preparation.</p></div><span className={styles.count}>{notes.length} topics</span></header>
    <div className={styles.sectionFilters}><div className={styles.search}><Search size={16} /><Input type="search" aria-label={`Search ${technology.title} topics`} value={query} onChange={event => setQuery(event.target.value)} placeholder={`Search ${technology.title} topics…`} /></div><NativeSelect aria-label={`Filter ${technology.title} category`} value={category} onChange={event => setCategory(event.target.value)}><NativeSelectOption value="">All categories</NativeSelectOption>{categories.map(item => <NativeSelectOption key={item} value={item}>{item}</NativeSelectOption>)}</NativeSelect><button type="button" className={styles.clear} onClick={clear} aria-label={`Clear ${technology.title} search and filters`}><X size={14} /> Clear search</button></div>
    {!filtered.length ? <div className={styles.empty}><h3>No matching <ExpandedText text={technology.title} /> topics</h3><p>Clear this section&apos;s search or choose another category.</p><button type="button" onClick={clear}>Show all <ExpandedText text={technology.title} /> topics</button></div> : <div className={styles.grid}>{page.items.map(note => <TopicCard key={note.id} note={note} initiallyOpen={initialNote === note.id} />)}</div>}
    <nav className={styles.pagination} aria-label={`${technology.title} pagination`}><span role="status">{page.start}–{page.end} of {filtered.length} topics</span><div><button type="button" disabled={page.page === 1} onClick={() => changePage(page.page - 1)} aria-label={`Previous ${technology.title} page`}><ArrowLeft size={15} /> Previous</button><Label><span className={styles.srOnly}><ExpandedText text={technology.title} /> page</span><NativeSelect value={page.page} onChange={event => changePage(Number(event.target.value))}>{Array.from({ length: page.pages }, (_, index) => <NativeSelectOption key={index} value={index + 1}>{index + 1} / {page.pages}</NativeSelectOption>)}</NativeSelect></Label><button type="button" disabled={page.page === page.pages} onClick={() => changePage(page.page + 1)} aria-label={`Next ${technology.title} page`}>Next <ArrowRight size={15} /></button></div></nav>
    {!!technology.reading.length && <details className={styles.sources}><summary>Reading guide for <ExpandedText text={technology.title} /></summary><InAppReading title={`${technology.title}: the reading guide`} introduction="Connect the ideas behind the cards, then apply them in a practical scenario." sections={technology.reading} /></details>}
  </section>;
}

/** The short label shown above a lesson title, per technology. */
const TECHNOLOGY_LABELS: Record<string, string> = {
  claude: "Claude Code", zustand: "Zustand 5", "tanstack-start": "TanStack", python: "Python",
  nextjs: "Next.js", react: "React", "claude-fundamentals": "Claude Fundamentals",
  node: "Node.js", graphql: "GraphQL", nestjs: "Nest JS",
};
const technologyLabel = (id: string) => TECHNOLOGY_LABELS[id] ?? "AI Fundamentals";

function Priority({ value, rationale }: { value: number; rationale?: string }) {
  return <span className={styles.stars} aria-label={`Interview priority ${value} out of 5`} title={rationale ?? "Editorial preparation priority, not measured interview frequency"}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={13} fill={index < value ? "currentColor" : "none"} aria-hidden="true" />)}<span>{value}/5</span></span>;
}

export function TopicCard({ note: rawNote, initiallyOpen = false }: { note: NotesSummary; initiallyOpen?: boolean }) {
  const note = { ...rawNote, points: uniqueLearningPoints(rawNote.points, [rawNote.description]) };
  const useModal = Boolean(note.learnInApp);
  const [open, setOpen] = useState(initiallyOpen);
  const [detail, setDetail] = useState<StudyNote | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const id = useId();
  useEffect(() => {
    if (!open || detail) return;
    const controller = new AbortController();
    fetch(`/api/notes/${encodeURIComponent(note.id)}`, { signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error("Unable to load note"); return response.json() as Promise<{ note: StudyNote }>; })
      .then(result => { if (!controller.signal.aborted) { if (!result.note || result.note.id !== note.id) throw new Error("Invalid note"); setDetail(result.note); setError(false); } })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [open, detail, note.id, attempt]);
  const readerTitle = detail?.readerTitle ?? note.readerTitle ?? note.title;
  const content = detail ? detail.contents ? <NotesCourseReader contents={detail.contents} renderLesson={lesson => <StudyDetails key={lesson.id} note={lesson} />} /> : <StudyDetails note={detail} /> : error ? <div className={styles.error} role="alert"><p>We couldn&apos;t load this topic. Your place is saved.</p><button type="button" onClick={() => { setError(false); setAttempt(value => value + 1); }}>Try again</button></div> : <p role="status" className={styles.loading}>Loading examples, questions and vocabulary…</p>;
  return <BookmarkScope value={{ sourceKey: note.id, title: note.title, technology: note.technology, href: `/dashboard/notes?note=${encodeURIComponent(note.id)}` }}><article id={note.id} className={`${styles.card} ${learningCard.card}`} aria-labelledby={`${id}-title`} data-expanded={open && !useModal}>
    <LearningPicture variant="card" className={styles.cardPicture} src={learningImageUrl("notes", [note.id])} alt={`Illustration of ${note.title}`} />
    <LearningRegion contentKey={learningContentKey(note.technology, note.title)}>
    <header className={styles.cardHeader}><h3 id={`${id}-title`}><ExpandedText text={note.title} /></h3><span className={styles.badge}><ExpandedText text={note.kinds.includes("AWS services") ? "SERVICE" : note.kinds.includes("Glossary") ? "GLOSSARY" : "TOPIC"} /></span></header>
    <BookmarkButton points={[note.description, ...note.points]} /><div className={styles.purpose}><h4>Definition</h4><p><BookmarkPoint text={note.description}><ExpandedText text={shortDefinition(note.description)} /></BookmarkPoint></p></div>
    </LearningRegion>
    <div className={styles.cardMeta}><span><GraduationCap size={15} /> Interview prep</span><Priority value={note.priority} /></div>
    {useModal ? <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={styles.openCard}><BookOpen size={16} />Learn in App<ArrowRight size={16} /></DialogTrigger>
      <DialogContent className={styles.lessonDialog}>
        <header className={styles.lessonHeader}>
          <LearningRegion contentKey={learningContentKey(note.technology, note.title)}>
            <div className={styles.lessonMeta}>
              <span className={styles.eyebrow}><BookOpen size={13} /> <ExpandedText text={technologyLabel(note.technology)} /></span>
              <span className={styles.lessonCategory}><ExpandedText text={note.category} /></span>
              <div className={styles.lessonTools}><LearningTools compact /></div>
            </div>
            <DialogTitle className={styles.lessonTitle} aria-label={readerTitle}><ExpandedText text={readerTitle} /></DialogTitle>
            <DialogDescription className={styles.lessonDescription}><ExpandedText text={shortDefinition(note.description, 170)} /></DialogDescription>
          </LearningRegion>
        </header>
        <div className={styles.lessonBody} tabIndex={0} aria-label="Lesson reading area">
          {!detail?.contents && <LearningRegion contentKey={learningContentKey(note.technology, note.title)}><section className={styles.lessonOverview}><h3>At a glance</h3><ul>{note.points.map((point, index) => <li key={index}><BookmarkPoint text={point}><ExpandedText text={point} /></BookmarkPoint></li>)}</ul></section></LearningRegion>}
          {open && content}
        </div>
      </DialogContent>
    </Dialog> : <><button type="button" className={styles.openCard} aria-expanded={open} aria-controls={`${id}-details`} onClick={() => setOpen(value => !value)}><BookOpen size={16} /><ExpandedText text={open ? "Close study details" : "Study this topic"} /><ChevronDown size={16} /></button><div id={`${id}-details`} hidden={!open}>{open && content}</div></>}
  </article></BookmarkScope>;
}

function InAppReading({ title, introduction, sections }: { title: string; introduction: string; sections: NoteSection[] }) {
  const words = [introduction, ...sections.flatMap(section => section.points)].join(" ").split(/\s+/).length;
  return <div className={styles.reading}>
    <header className={styles.readingHeader}><span><BookOpen size={15} /> STUDY READING</span><small>{Math.max(1, Math.ceil(words / 200))} min read</small></header>
    <h4 className={styles.readingTitle}><ExpandedText text={title} /></h4><p className={styles.readingIntro}><ExpandedText text={introduction} /></p>
    <div className={styles.readingChapters}>{sections.map((section, index) => <section className={styles.readingChapter} key={index}><span className={styles.chapterNumber} aria-hidden="true"><ExpandedText text={String(index + 1).padStart(2, "0")} /></span><div><h5><ExpandedText text={section.title} /></h5>{section.points.map((point, index) => <p key={index}><ExpandedText text={point} /></p>)}</div></section>)}</div>
    <div className={styles.readingTakeaway}><Check size={16} /><div><strong>Make it stick</strong><p>Explain the main idea in your own words, walk through an example, then try the topic&apos;s objective questions.</p></div></div>
  </div>;
}

/** Bullets that carry code get the code block; the rest stay a scannable list. */
function SectionBody({ section }: { section: NoteSection }) {
  return <>
    {section.points.length > 0 && <ul>{section.points.map((point, index) => <li key={index}><BookmarkPoint text={point}><KeyText text={point} /></BookmarkPoint></li>)}</ul>}
    {section.code && <CodeLab title={section.title} code={section.code} expectedOutput={section.output} />}
  </>;
}

function StudyDetails({ note: source, alreadyShown = [] }: { note: StudyNote; alreadyShown?: string[] }) {
  const note = conciseStudyNote(source);
  const { focused } = useInterviewFocus();
  const points = uniqueLearningPoints(note.points, alreadyShown);
  // Worked examples stay under "Syntax"; the note's own sections — code and
  // prose alike — are the concepts, so their code renders alongside them.
  const examples = note.examples;
  const concepts = note.sections;
  const shows = (id: Parameters<typeof showsSection>[0]) => showsSection(id, focused);
  return <BookmarkScope value={{ sourceKey: note.id, title: note.title, technology: note.technology, href: `/dashboard/notes?note=${encodeURIComponent(note.id)}` }}><LearningRegion contentKey={learningContentKey(note.technology, note.title)}><div className={styles.studyDetails}><BookmarkButton points={[note.description, ...note.points].slice(0, 200)} />
    <InterviewFocusToggle />
    {shows("points") && points.length > 0 && <section className={styles.keyConcepts}><h4>Key points</h4><ul>{points.map(point => <li key={point}><BookmarkPoint text={point}><KeyText text={point} /></BookmarkPoint></li>)}</ul></section>}
    {shows("code") && examples.length > 0 && <details open><summary><Code2 size={16} /> Syntax, meaning &amp; examples</summary>{examples.map((example, index) => <section key={index}><h4><ExpandedText text={example.title} /></h4><SectionBody section={example} /></section>)}</details>}
    {shows("useCases") && note.useCases.length > 0 && <details><summary><Layers size={16} /> Real-world use cases</summary>{note.useCases.map((useCase, index) => <section key={index}><h4><ExpandedText text={useCase.title} /></h4><ul>{useCase.points.map((point, index) => <li key={index}><BookmarkPoint text={point}><KeyText text={point} /></BookmarkPoint></li>)}</ul></section>)}</details>}
    {shows("interview") && note.interview.length > 0 && <details><summary><GraduationCap size={16} /> Interview questions &amp; answers <small>{note.interview.length}</small></summary>{note.interview.map((question, index) => <section className={styles.interview} key={index}><Priority value={question.priority} rationale={question.rationale} /><h4>{index + 1}. <ExpandedText text={question.question} /></h4><ul>{question.points.map((point, index) => <li key={index}><BookmarkPoint text={point}><KeyText text={point} /></BookmarkPoint></li>)}</ul><p className={styles.ratingNote}><ExpandedText text={question.rationale} /></p></section>)}</details>}
    {shows("questions") && note.questions.length > 0 && <details><summary><Check size={16} /> Objective questions <small>{note.questions.length}</small></summary>{note.questions.map((question, index) => <KnowledgeCheck key={`${note.id}-${index}`} question={question} />)}</details>}
    {shows("vocabulary") && note.vocabulary.length > 0 && <details><summary><BookOpen size={16} /> Vocabulary, synonyms &amp; antonyms <small>{note.vocabulary.length}</small></summary>{note.vocabulary.map((word, index) => <section className={styles.word} key={index}><h4><ExpandedText text={word.word} /></h4><dl><dt>Meaning</dt><dd><ExpandedText text={word.meaning} /></dd><dt>Sentence</dt><dd><ExpandedText text={word.example} /></dd><dt>Synonyms</dt><dd><ExpandedText text={word.synonyms.join(", ") || "No direct synonym listed"} /></dd><dt>Antonyms</dt><dd><ExpandedText text={word.antonyms.join(", ") || "No direct antonym listed"} /></dd></dl></section>)}</details>}
    {shows("concepts") && concepts.length > 0 && <details open><summary><BookOpen size={16} /> Concepts &amp; practice <small>{concepts.length}</small></summary>{concepts.map((section, index) => <section key={index}><h4><ExpandedText text={section.title} /></h4><SectionBody section={section} /></section>)}</details>}
    <Link href={`/dashboard/notes?note=${encodeURIComponent(note.id)}`} prefetch={false} className={styles.permalink}>Open a link to this topic <ArrowRight size={13} /></Link>
  </div></LearningRegion></BookmarkScope>;
}
