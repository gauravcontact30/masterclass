import Link from "next/link";
import { Clock3 } from "lucide-react";
import styles from "./deep-course.module.css";

/*
 * Shown for a generated in-depth course (lib/server/course-generator.ts) whose outline, or one of whose topics, is not
 * stored yet. Every course is written ahead of time by scripts/pregenerate-courses.ts, so a visit never starts any
 * writing: the page only says the lesson is on its way. Server-rendered, no requests.
 */

const MIGRATION = "This course needs a database update (migration 0044) before it can be shown.";

function Notice({ title, lede }: { title: string; lede: string }) {
  return <div className={styles.generating} role="status">
    <Clock3 size={26} aria-hidden="true" />
    <h2>{title}</h2>
    <p>{lede}</p>
    <Link href="/learning/lessons" className={styles.generatingBack}>Back to Lessons</Link>
  </div>;
}

/** A course whose outline is not stored yet. */
export function PreparingCourse({ name, glyph, unavailable = false }: { name: string; glyph: string; unavailable?: boolean }) {
  return <div className={styles.main}>
    <header className={styles.hero}>
      <p className={styles.eyebrow}><Link href="/learning/lessons">Lessons</Link> / In-depth course</p>
      <h1><span aria-hidden="true">{glyph}</span> {name}</h1>
    </header>
    <Notice title={unavailable ? "Not available yet" : `The ${name} course is being prepared`}
      lede={unavailable ? MIGRATION : "Every lesson is researched from the official documentation, written and reviewed before it is published. This course will appear here as soon as it is ready."} />
  </div>;
}

/** A topic of a generated course that is not stored yet. */
export function PreparingTopic({ title }: { title: string }) {
  return <Notice title={`“${title}” is being prepared`}
    lede="This lesson is researched from the official documentation, written in full and passed by the editor before it is published. It will appear here as soon as it is ready; the other topics of this course are open now." />;
}
