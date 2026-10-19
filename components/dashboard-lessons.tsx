"use client";
import { AccordionSummary } from "@/components/ui/accordion-chevron";
import { useState } from "react";
import { ArrowUpRight, BookOpen, Search } from "lucide-react";
import { DASHBOARD_LESSONS, type LessonSection } from "@/lib/dashboard-lessons";
import styles from "./dashboard-lessons.module.css";

export function DashboardLessons({ section }: { section: LessonSection }) {
  const [query, setQuery] = useState("");
  const lessons = DASHBOARD_LESSONS[section].filter(item => `${item.title} ${item.technology} ${item.summary}`.toLowerCase().includes(query.toLowerCase().trim()));
  return <div className={styles.root}>
    <header><div><p><BookOpen size={15} aria-hidden="true" /> DEEPER LEARNING</p><h3>{section === "interview" ? "Practice the reasoning" : section === "workflows" ? "Build beyond the blueprint" : "Explore the next layer"}</h3></div>
      <label><Search size={16} aria-hidden="true" /><input aria-label={`Search ${section} lessons`} placeholder="Find a topic or technology" value={query} onChange={e => setQuery(e.target.value)} /></label></header>
    <div className={styles.grid}>{lessons.map(lesson => <details key={lesson.id}>
      <AccordionSummary><span className={styles.meta}>{lesson.technology} · {lesson.minutes} min</span><strong>{lesson.title}</strong><span>{lesson.level} · Open lesson</span></AccordionSummary>
      <div className={styles.body}><p>{lesson.summary}</p><ol>{lesson.steps.map(step => <li key={step}>{step}</li>)}</ol>
        <div className={styles.exercise}><b>Try it yourself</b><p>{lesson.exercise}</p><details><AccordionSummary>Reveal the reasoning</AccordionSummary><p>{lesson.answer}</p></details></div>
        <a href={lesson.source} target="_blank" rel="noopener noreferrer">Read the source <ArrowUpRight size={14} aria-hidden="true" /></a>
      </div>
    </details>)}</div>
    {!lessons.length && <p role="status">No matching lessons. Try a technology such as PostgreSQL or clear your search.</p>}
  </div>;
}
