"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { deepCourseHref, deepCourseMeta, isCourseId } from "@/lib/deep-courses";
import TOPIC_INDEX from "@/lib/deep-courses/topic-index.json";
import { DeepCourseProgress, DeepTopicCard, type TopicCardData } from "./deep-topic-progress";
import styles from "./deep-course.module.css";

/**
 * On /learning/lessons, when the chosen technology is one of the in-depth courses: its topics as coloured cards,
 * module by module, each with its checklist, completion checkbox and progress.
 */
export function DeepCourseTopics({ trackId }: { trackId: string }) {
  if (!isCourseId(trackId)) return null;
  const course = deepCourseMeta(trackId)!;
  const topics = (TOPIC_INDEX as Record<string, TopicCardData[]>)[trackId] ?? [];
  const modules = [...new Set(topics.map(topic => topic.module))];
  return <section className={styles.lessonCourse} aria-labelledby={`lesson-course-${trackId}`}>
    <header className={styles.lessonCourseHead}>
      <div>
        <p className={styles.eyebrow}>In-depth course</p>
        <h2 id={`lesson-course-${trackId}`}><span aria-hidden="true">{course.glyph}</span> {course.name}: {topics.length} topics</h2>
        <p>{course.blurb}</p>
      </div>
      <Link href={deepCourseHref(trackId)} className={styles.start}>Open the course<ArrowRight size={15} aria-hidden="true" /></Link>
    </header>
    <DeepCourseProgress courseId={trackId} topicIds={topics.map(topic => topic.id)} />
    {modules.map((module, index) => <div key={module} className={styles.moduleBlock}>
      <h3 className={styles.lessonModule}><span>Module {index + 1}</span>{module}</h3>
      <div className={styles.topicGrid}>{topics.filter(topic => topic.module === module).map(topic =>
        <DeepTopicCard key={topic.id} courseId={trackId} topic={topic} index={topics.indexOf(topic)} href={deepCourseHref(trackId, topic.id)} />)}</div>
    </div>)}
  </section>;
}
