"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { deepCourseHref } from "@/lib/deep-courses";
import { COURSE_CATALOG } from "@/lib/deep-courses/catalog";
import TOPIC_INDEX from "@/lib/deep-courses/topic-index.json";
import { TRACK_FAMILIES } from "@/lib/pro-learn/families";
import { BrandOrGlyph } from "./topic-media";
import { pageWindow } from "./pager";
import { DeepCourseProgress } from "./deep-topic-progress";
import { ChipPager } from "./chip-pager";
import styles from "./deep-course.module.css";

/*
 * Every in-depth course on the platform, on the Learning dashboard and above /learning/lessons: the six hand-written
 * courses first, then one per technology (written on first open). Search by name, focus or syllabus; filter by
 * family (icons) and status; clear the search; page through the results. Each card shows the learner's progress.
 */

type Status = "all" | "handwritten" | "ready" | "new";
type Generated = Record<string, { status: string; topicIds: string[] }>;
const HANDWRITTEN_TOPICS = TOPIC_INDEX as Record<string, { id: string }[]>;
const STATUS_LABEL: Record<Status, string> = { all: "All", handwritten: "Hand-written", ready: "Ready", new: "Written on first open" };

export function DeepCourseShelf({ id = "deep-courses", inSheet = false }: { id?: string; /** Inside the dashboard's rounded sheet. */ inSheet?: boolean }) {
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("all");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(9);
  const [generated, setGenerated] = useState<Generated>({});

  useEffect(() => {
    let live = true;
    fetch("/api/deep-courses/catalog").then(response => response.ok ? response.json() : null).then(data => { if (live && data?.courses) setGenerated(data.courses); }).catch(() => undefined);
    return () => { live = false; };
  }, []);

  const topicIds = (courseId: string) => HANDWRITTEN_TOPICS[courseId]?.map(topic => topic.id) ?? generated[courseId]?.topicIds ?? [];
  const statusOf = (courseId: string, handwritten: boolean): Exclude<Status, "all"> => handwritten ? "handwritten" : generated[courseId]?.status === "ready" ? "ready" : "new";

  const q = query.trim().toLowerCase();
  const results = useMemo(() => COURSE_CATALOG.filter(course =>
    (!family || course.family === family) &&
    (status === "all" || statusOf(course.id, course.handwritten) === status) &&
    (!q || q.split(/\s+/).every(word => course.keywords.includes(word)))
  // eslint-disable-next-line react-hooks/exhaustive-deps -- statusOf reads `generated`
  ), [q, family, status, generated]);
  const pages = Math.max(1, Math.ceil(results.length / size));
  const current = Math.min(page, pages - 1);
  const shown = results.slice(current * size, current * size + size);
  const families = TRACK_FAMILIES.filter(item => COURSE_CATALOG.some(course => course.family === item.id));
  const reset = () => setPage(0);

  return <section className={`${styles.shelf} ${inSheet ? styles.inSheet : ""}`} id={id} aria-labelledby={`${id}-title`}>
    <div className={styles.shelfHead}>
      <p className={styles.eyebrow}>In-depth courses · {COURSE_CATALOG.length} technologies</p>
      <h2 id={`${id}-title`}>Every technology, topic by topic</h2>
      <p>Each topic walks through the idea step by step, then the syntax, worked examples with their output (simple, moderate and complex), assignments with answers, alternate ways, tips and interview questions, researched from the official documentation. Tick off each part as you go.</p>
    </div>

    <div className={styles.catalogTools}>
      <label className={styles.catalogSearch}>
        <Search size={16} aria-hidden="true" />
        <span className={styles.srOnly}>Search courses</span>
        <input type="search" value={query} onChange={event => { setQuery(event.target.value); reset(); }} placeholder="Search a technology, topic or skill (e.g. hooks, JVM, joins)…" />
        {query && <button type="button" onClick={() => { setQuery(""); reset(); }} aria-label="Clear search"><X size={14} aria-hidden="true" />Clear</button>}
      </label>
      <div className={styles.catalogStatus} role="radiogroup" aria-label="Status">
        {(Object.keys(STATUS_LABEL) as Status[]).map(item => <button key={item} type="button" role="radio" aria-checked={status === item} onClick={() => { setStatus(item); reset(); }}>{STATUS_LABEL[item]}</button>)}
      </div>
    </div>
    <ChipPager className={styles.catalogFamilies} chipClassName={styles.familyChip} label="Filter by family" chips={[
      { id: "all", node: <><span aria-hidden="true">✦</span>All</>, selected: !family, onSelect: () => { setFamily(null); reset(); } },
      ...families.map(item => ({ id: item.id, node: <><span aria-hidden="true">{item.icon}</span>{item.name}</>, selected: family === item.id,
        onSelect: () => { setFamily(family === item.id ? null : item.id); reset(); } })),
    ]} />

    {shown.length ? <div className={styles.shelfGrid}>
      {shown.map(course => { const ids = topicIds(course.id); const state = statusOf(course.id, course.handwritten); return <Link key={course.id} href={deepCourseHref(course.id)} className={styles.courseCard} style={{ "--tint": course.tint } as React.CSSProperties}>
        <span className={styles.courseTop}>
          <span className={styles.courseGlyph} aria-hidden="true"><BrandOrGlyph label={course.name} glyph={course.glyph} size={26} /></span>
          <i className={styles.courseState} data-state={state}>{state === "handwritten" ? "Hand-written" : state === "ready" ? "Ready" : "Written on first open"}</i>
        </span>
        <b>{course.name}</b>
        <span className={styles.courseBlurb}>{course.blurb}</span>
        <span className={styles.courseTags}>{course.highlights.map(item => <i key={item}>{item}</i>)}</span>
        {ids.length > 0 && <DeepCourseProgress courseId={course.id} topicIds={ids} />}
        <span className={styles.courseFoot}><span>{course.familyIcon} {course.familyName}</span><ArrowRight size={14} aria-hidden="true"/></span>
      </Link>; })}
    </div> : <p className={styles.catalogEmpty}>No course matches{query ? ` “${query}”` : ""}{family || status !== "all" ? " with these filters" : ""}. <button type="button" onClick={() => { setQuery(""); setFamily(null); setStatus("all"); reset(); }}>Show every course</button></p>}

    {results.length > 0 && <nav className={styles.catalogPager} aria-label="Course pages">
      <p aria-live="polite">Showing <b>{current * size + 1}–{Math.min(results.length, current * size + size)}</b> of <b>{results.length}</b></p>
      <div>
        <button type="button" onClick={() => setPage(current - 1)} disabled={current === 0} aria-label="Previous page"><ChevronLeft size={15} aria-hidden="true" /></button>
        {pageWindow(current, pages).map((index, position) => index === "gap" ? <span key={`gap-${position}`} aria-hidden="true">…</span>
          : <button key={index} type="button" onClick={() => setPage(index)} aria-current={index === current ? "page" : undefined} aria-label={`Page ${index + 1}`}>{index + 1}</button>)}
        <button type="button" onClick={() => setPage(current + 1)} disabled={current >= pages - 1} aria-label="Next page"><ChevronRight size={15} aria-hidden="true" /></button>
      </div>
      <label>Per page <select value={size} onChange={event => { setSize(Number(event.target.value)); reset(); }}>{[6, 9, 12, 24].map(option => <option key={option} value={option}>{option}</option>)}</select></label>
    </nav>}
  </section>;
}
