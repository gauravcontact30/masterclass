"use client";

import Link from "next/link";
import { useId, useMemo, useState, type MouseEvent } from "react";
import { ArrowRight, ChevronDown, ChevronsDownUp, ChevronsUpDown, PlayCircle, Search, X } from "lucide-react";
import { useDeepProgress } from "./deep-progress-store";
import { deepCourseHref } from "@/lib/deep-courses";
import styles from "./deep-course.module.css";

/*
 * The interactive parts of a course page's sidebar: module counts and the expand/collapse-all switch for the module
 * groups (plain <details>, so they work before hydration), and the "Other courses" accordion with search, the
 * learner's courses in progress and every other course grouped by family.
 */

export type SideCourse = { id: string; name: string; glyph: string; focus: string; handwritten: boolean };
export type SideFamily = { id: string; name: string; icon: string; related: boolean; courses: SideCourse[] };

/** "3/5" topics completed in one module. */
export function ModuleDone({ courseId, topicIds }: { courseId: string; topicIds: string[] }) {
  const map = useDeepProgress();
  const done = topicIds.filter(id => map[`${courseId}/${id}`]?.completed).length;
  return <span className={styles.sideCount} data-done={done === topicIds.length && done > 0 ? "" : undefined} aria-label={`${done} of ${topicIds.length} topics completed`}>{done}/{topicIds.length}</span>;
}

/** Opens every module group in this sidebar when any is closed, otherwise closes them all. */
export function ModulesToggle({ allOpen }: { allOpen: boolean }) {
  const [open, setOpen] = useState(allOpen);
  function toggle(event: MouseEvent<HTMLButtonElement>) {
    const groups = [...event.currentTarget.closest("nav")?.querySelectorAll<HTMLDetailsElement>("details[data-module]") ?? []];
    const next = groups.some(group => !group.open);
    groups.forEach(group => { group.open = next; });
    setOpen(next);
  }
  return <button type="button" className={styles.sideToggleAll} onClick={toggle} aria-label={open ? "Collapse all modules" : "Expand all modules"} title={open ? "Collapse all" : "Expand all"}>
    {open ? <ChevronsDownUp size={15} aria-hidden="true"/> : <ChevronsUpDown size={15} aria-hidden="true"/>}
  </button>;
}

function useCourseProgress() {
  const map = useDeepProgress();
  return useMemo(() => {
    const byCourse = new Map<string, { done: number; touched: number; updatedAt: number }>();
    for (const [key, value] of Object.entries(map)) {
      const courseId = key.split("/")[0];
      const entry = byCourse.get(courseId) ?? { done: 0, touched: 0, updatedAt: 0 };
      entry.touched += 1;
      if (value.completed) entry.done += 1;
      entry.updatedAt = Math.max(entry.updatedAt, value.updatedAt ?? 0);
      byCourse.set(courseId, entry);
    }
    return byCourse;
  }, [map]);
}

function CourseLink({ course, progress }: { course: SideCourse; progress?: { done: number } }) {
  return <Link href={deepCourseHref(course.id)} className={styles.otherLink} title={course.focus}>
    <span className={styles.otherGlyph} aria-hidden="true">{course.glyph}</span>
    <span className={styles.otherName}>{course.name}</span>
    {progress ? <i className={styles.otherBadge} data-kind="progress">{progress.done ? `${progress.done} done` : "Started"}</i>
      : course.handwritten && <i className={styles.otherBadge}>Curated</i>}
  </Link>;
}

function Group({ id, icon, title, count, open, onToggle, children }: { id: string; icon: React.ReactNode; title: string; count: number; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return <div className={styles.otherGroup} data-open={open ? "" : undefined}>
    <h3><button type="button" aria-expanded={open} aria-controls={id} onClick={onToggle}>
      <span className={styles.otherIcon} aria-hidden="true">{icon}</span><span className={styles.otherTitle}>{title}</span><span className={styles.sideCount}>{count}</span>
      <ChevronDown size={14} className={styles.otherChevron} aria-hidden="true"/>
    </button></h3>
    <div id={id} className={styles.otherPanel} hidden={!open}>{children}</div>
  </div>;
}

/** Every other course: search, the courses this learner has started, then one accordion group per family. */
export function OtherCourses({ currentId, families }: { currentId: string; families: SideFamily[] }) {
  const base = useId();
  const progress = useCourseProgress();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(families.find(family => family.related)?.id ?? null);
  const all = useMemo(() => families.flatMap(family => family.courses.map(course => ({ ...course, familyName: family.name }))), [families]);
  const total = all.length;
  const started = all.filter(course => progress.has(course.id)).sort((a, b) => progress.get(b.id)!.updatedAt - progress.get(a.id)!.updatedAt);
  const current = progress.get(currentId);
  const needle = query.trim().toLowerCase();
  const matches = needle ? all.filter(course => `${course.name} ${course.id} ${course.focus} ${course.familyName}`.toLowerCase().includes(needle)) : [];
  const toggle = (id: string) => setOpen(value => value === id ? null : id);

  return <div className={styles.sideOthers}>
    <div className={styles.sideHead}><p>Other courses</p><span className={styles.sideCount}>{total}</span></div>
    <label className={styles.otherSearch}>
      <Search size={14} aria-hidden="true"/>
      <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={`Search ${total} courses`} aria-label="Search other courses"/>
      {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={13} aria-hidden="true"/></button>}
    </label>

    {needle ? <div className={styles.otherResults} aria-live="polite">
      {matches.length ? matches.map(course => <CourseLink key={course.id} course={course} progress={progress.get(course.id)}/>)
        : <p className={styles.otherEmpty}>No course matches “{query.trim()}”.</p>}
    </div> : <>
      {!!started.length && <Group id={`${base}-started`} icon={<PlayCircle size={14}/>} title="Continue learning" count={started.length} open={open === "started"} onToggle={() => toggle("started")}>
        {started.map(course => <CourseLink key={course.id} course={course} progress={progress.get(course.id)}/>)}
      </Group>}
      {families.map(family => <Group key={family.id} id={`${base}-${family.id}`} icon={family.icon} title={family.related ? `Related · ${family.name}` : family.name} count={family.courses.length}
        open={open === family.id} onToggle={() => toggle(family.id)}>
        {family.courses.map(course => <CourseLink key={course.id} course={course} progress={progress.get(course.id)}/>)}
      </Group>)}
    </>}

    {current && <p className={styles.otherNote}>{current.done} topic{current.done === 1 ? "" : "s"} completed in this course.</p>}
    <Link href="/learning/lessons" className={styles.otherAll}>Browse all courses<ArrowRight size={14} aria-hidden="true"/></Link>
  </div>;
}
