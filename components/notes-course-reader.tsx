"use client";
import { ExpandedText } from "@/components/expanded-text";
import { compactAbbreviations } from "@/lib/abbreviations";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Search, X } from "lucide-react";
import { notesPage, type StudyNote } from "@/lib/notes-study";
import { LearningRegion } from "./learning-marks";
import { learningContentKey } from "@/lib/learning-marks";
import styles from "./notes-course-reader.module.css";

export function NotesCourseReader({ contents, renderLesson }: { contents: NonNullable<StudyNote["contents"]>; renderLesson: (note: StudyNote) => ReactNode }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [requestedPage, setRequestedPage] = useState(1);
  const [selected, setSelected] = useState("");
  const [loaded, setLoaded] = useState<StudyNote | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const cache = useRef(new Map<string, StudyNote>());
  const lessonHeading = useRef<HTMLHeadingElement>(null);
  const filtered = useMemo(() => {
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return contents.filter(item => (!category || item.category === category) && terms.every(term => `${item.title} ${item.category}`.toLowerCase().includes(term)));
  }, [contents, category, query]);
  const page = notesPage(filtered, requestedPage, 8);
  const selectedIndex = contents.findIndex(item => item.id === selected);
  const selectedSummary = contents[selectedIndex];
  const detail = loaded?.id === selected ? loaded : null;
  function choose(id: string) { setSelected(id); setError(false); setLoaded(cache.current.get(id) ?? null); }
  function clear() { setQuery(""); setCategory(""); setRequestedPage(1); }
  useEffect(() => {
    if (!selected || detail) return;
    const controller = new AbortController();
    fetch(`/api/notes/${encodeURIComponent(selected)}`, { signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error("Load failed"); return response.json() as Promise<{ note: StudyNote }>; })
      .then(({ note }) => {
        if (controller.signal.aborted) return;
        if (!note || note.id !== selected) throw new Error("Invalid lesson");
        cache.current.set(selected, note); setLoaded(note);
      }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [selected, detail, attempt]);
  useEffect(() => { if (selected) lessonHeading.current?.focus(); }, [selected]);
  return <div className={styles.reader}>
    <aside className={styles.contents} aria-label="Course contents">
      <div className={styles.contentsHeader}><BookOpen size={17} /><h3>Course contents</h3><span>{contents.length} lessons</span></div>
      <label className={styles.search}><Search size={15} /><input type="search" aria-label="Search course lessons" placeholder="Find a concept…" value={query} onChange={event => { setQuery(event.target.value); setRequestedPage(1); }} /></label>
      <select aria-label="Filter course category" value={category} onChange={event => { setCategory(event.target.value); setRequestedPage(1); }}><option value="">All subjects</option>{[...new Set(contents.map(item => item.category))].map(item => <option key={item}>{item}</option>)}</select>
      {(query || category) && <button className={styles.clear} onClick={clear}><X size={13} />Clear search &amp; filters</button>}
      <nav aria-label="Choose a course lesson"><ol>{page.items.map(item => <li key={item.id}><button aria-current={selected === item.id ? "step" : undefined} onClick={() => choose(item.id)} aria-label={`Read ${item.title}`}><span>{compactAbbreviations(item.title)}</span><small>{compactAbbreviations(item.category)}</small></button></li>)}</ol></nav>
      {!filtered.length && <p role="status">No lessons match. Try another term or clear the filters.</p>}
      <div className={styles.pagination}><button disabled={page.page === 1} onClick={() => setRequestedPage(page.page - 1)} aria-label="Previous contents page"><ArrowLeft size={15} /></button><span role="status">{page.page} / {page.pages}</span><button disabled={page.page === page.pages} onClick={() => setRequestedPage(page.page + 1)} aria-label="Next contents page"><ArrowRight size={15} /></button></div>
    </aside>
    <section className={styles.lesson} aria-label="Selected course lesson">
      {selectedSummary ? <><span className={styles.position}>LESSON {selectedIndex + 1} OF {contents.length}</span><LearningRegion contentKey={learningContentKey(detail?.technology ?? "course", selectedSummary.title)}><h3 ref={lessonHeading} tabIndex={-1}><ExpandedText text={selectedSummary.title} /></h3><p className={styles.category}><ExpandedText text={selectedSummary.category} /></p></LearningRegion>
        {detail ? <LearningRegion contentKey={learningContentKey(detail.technology, detail.title)}><p className={styles.description}><ExpandedText text={detail.description} /></p>{renderLesson(detail)}</LearningRegion> : error ? <div role="alert"><p>This lesson could not load. Try again to keep reading.</p><button className={styles.retry} onClick={() => { setError(false); setAttempt(value => value + 1); }}>Retry lesson</button></div> : <p role="status">Loading lesson…</p>}
        <nav className={styles.lessonNavigation} aria-label="Course lesson navigation"><button disabled={selectedIndex <= 0} onClick={() => choose(contents[selectedIndex - 1].id)}><ArrowLeft size={14} />Previous lesson</button><button disabled={selectedIndex >= contents.length - 1} onClick={() => choose(contents[selectedIndex + 1].id)}>Next lesson<ArrowRight size={14} /></button></nav>
      </> : <div className={styles.welcome}><BookOpen size={30} /><h3>One guide. Every concept connected.</h3><p>Choose a subject or search for a topic. Each lesson brings together an explanation, worked examples, practical decisions and questions to test your understanding.</p><p>Move through the original course chapters and the expanded topic lessons at your own pace.</p><button onClick={() => choose(contents.find(item => item.id.endsWith("concept-llm"))?.id ?? contents[0].id)}>Start learning <ArrowRight size={15} /></button></div>}
    </section>
  </div>;
}
