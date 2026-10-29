"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { ArrowRight, CheckCircle2, Clock3, SquareTerminal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useDeepProgress, setTopicProgress } from "./deep-progress-store";
import { progressKey, TOPIC_CHECKLIST, topicShare, topicTint, type ChecklistId } from "@/lib/deep-courses/progress";
import { COMPILER_HANDOFF_KEY, languageOfFile } from "@/lib/compiler";
import styles from "./deep-course.module.css";

/*
 * Progress UI for the in-depth courses: the checklist on a topic page, the coloured topic cards (course overview and
 * /learning/lessons), a course's progress bar (dashboard shelf) and "Open in compiler" on Java and C++ examples.
 * State comes from ./deep-progress-store (this browser, synced to Supabase for signed-in learners).
 */

/** takeaway: the topic's core concept (essentials), shown on its card so the overview doubles as a revision sheet. */
export type TopicCardData = { id: string; title: string; module: string; level: string; minutes: number; summary: string; takeaway?: string };

const percent = (share: number) => Math.round(share * 100);

function toggleItem(courseId: string, topicId: string, item: ChecklistId, on: boolean) {
  setTopicProgress(courseId, topicId, current => {
    const checklist = on ? [...new Set([...current.checklist, item])] : current.checklist.filter(id => id !== item);
    // Ticking every item completes the topic; unticking one reopens it.
    return { checklist, completed: on ? current.completed || checklist.length === TOPIC_CHECKLIST.length : false };
  });
}

function setCompleted(courseId: string, topicId: string, completed: boolean) {
  setTopicProgress(courseId, topicId, current => ({ checklist: completed ? TOPIC_CHECKLIST.map(item => item.id) : current.checklist, completed }));
}

function Meter({ value, label }: { value: number; label: string }) {
  return <span className={styles.meter} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label={label}><i style={{ width: `${value}%` }} /></span>;
}

/** The study checklist at the top of a topic page; each item jumps to its section. */
export function DeepTopicChecklist({ courseId, topicId, index }: { courseId: string; topicId: string; index: number }) {
  const progress = useDeepProgress()[progressKey(courseId, topicId)];
  const ticked = new Set(progress?.checklist ?? []);
  const value = percent(topicShare(progress));
  const tone = topicTint(index);
  return <section className={styles.checklist} style={{ "--tint": tone.tint, "--ink": tone.ink } as CSSProperties} aria-labelledby={`checklist-${topicId}`}>
    <div className={styles.checklistHead}>
      <h2 id={`checklist-${topicId}`}>Your checklist</h2>
      <span>{value}%</span>
    </div>
    <Meter value={value} label="Topic progress" />
    <ul>
      {TOPIC_CHECKLIST.map(item => <li key={item.id}>
        <label>
          <Checkbox checked={ticked.has(item.id)} onCheckedChange={checked => toggleItem(courseId, topicId, item.id, checked === true)} aria-label={item.label} />
          <a href={`#${item.anchor}`}>{item.label}</a>
        </label>
      </li>)}
    </ul>
    <label className={styles.complete}>
      <Checkbox checked={!!progress?.completed} onCheckedChange={checked => setCompleted(courseId, topicId, checked === true)} aria-label="Mark this topic complete" />
      <span>{progress?.completed ? "Topic complete" : "Mark this topic complete"}</span>
      {progress?.completed && <CheckCircle2 size={16} aria-hidden="true" />}
    </label>
  </section>;
}

/** A topic as a coloured card: its own tint, the checklist, a completion checkbox and its progress. */
export function DeepTopicCard({ courseId, topic, index, href }: { courseId: string; topic: TopicCardData; index: number; href: string }) {
  const progress = useDeepProgress()[progressKey(courseId, topic.id)];
  const ticked = new Set(progress?.checklist ?? []);
  const value = percent(topicShare(progress));
  const tone = topicTint(index);
  return <article className={styles.topicCard} data-done={progress?.completed || undefined} style={{ "--tint": tone.tint, "--ink": tone.ink } as CSSProperties}>
    <header className={styles.topicCardHead}>
      <span className={styles.topicNumber}>{String(index + 1).padStart(2, "0")}</span>
      <label className={styles.cardComplete} title={progress?.completed ? "Completed" : "Mark complete"}>
        <Checkbox checked={!!progress?.completed} onCheckedChange={checked => setCompleted(courseId, topic.id, checked === true)} aria-label={`Mark "${topic.title}" complete`} />
        <span>{progress?.completed ? "Done" : "Complete"}</span>
      </label>
    </header>
    <Link href={href} className={styles.topicCardLink}><b>{topic.title}</b></Link>
    <span className={styles.topicSummary}>{topic.summary}</span>
    {topic.takeaway && <p className={styles.topicTakeaway}><b>Key takeaway</b>{topic.takeaway}</p>}
    <small className={styles.topicMeta}><i data-level={topic.level}>{topic.level}</i><Clock3 size={12} aria-hidden="true" />{topic.minutes} min</small>
    <details className={styles.cardChecklist}>
      <summary>Checklist · {ticked.size}/{TOPIC_CHECKLIST.length}</summary>
      <ul>{TOPIC_CHECKLIST.map(item => <li key={item.id}><label>
        <Checkbox checked={ticked.has(item.id)} onCheckedChange={checked => toggleItem(courseId, topic.id, item.id, checked === true)} aria-label={`${item.label} — ${topic.title}`} />
        <span>{item.label}</span>
      </label></li>)}</ul>
    </details>
    <footer className={styles.topicCardFoot}>
      <Meter value={value} label={`${topic.title} progress`} />
      <span>{value}%</span>
      <Link href={href} aria-label={`Open ${topic.title}`}><ArrowRight size={15} /></Link>
    </footer>
  </article>;
}

/** A course's progress across its topics, for the dashboard shelf and the course overview. */
export function DeepCourseProgress({ courseId, topicIds }: { courseId: string; topicIds: string[] }) {
  const map = useDeepProgress();
  const done = topicIds.filter(id => map[progressKey(courseId, id)]?.completed).length;
  const value = topicIds.length ? percent(topicIds.reduce((total, id) => total + topicShare(map[progressKey(courseId, id)]), 0) / topicIds.length) : 0;
  return <span className={styles.courseProgress}>
    <Meter value={value} label="Course progress" />
    <span>{done}/{topicIds.length} topics · {value}%</span>
  </span>;
}

/** Sends an example's files to the online compiler (/learning/compiler) and opens it. */
export function OpenInCompiler({ files }: { files: { name: string; code: string }[] }) {
  const router = useRouter();
  const language = files.map(file => languageOfFile(file.name)).find(Boolean);
  if (!language) return null;
  const runnable = files.filter(file => languageOfFile(file.name) === language);
  return <button type="button" className={styles.openCompiler} onClick={() => {
    try { localStorage.setItem(COMPILER_HANDOFF_KEY, JSON.stringify({ language, files: runnable })); } catch { /* storage blocked */ }
    router.push("/learning/compiler");
  }}><SquareTerminal size={14} aria-hidden="true" />Open in compiler</button>;
}
