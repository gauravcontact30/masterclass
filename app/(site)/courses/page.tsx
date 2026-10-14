import Link from "next/link";
import { CATEGORY_LABELS, PREPARATIONS, PREPARATION_GROUPS, courseCategory } from "@/lib/study/preparations";
import { STUDY_COURSES } from "@/lib/study/catalog";
import { COURSE_SUMMARIES as SUMMARIES } from "@/lib/study/course-summaries";
import { pageMetadata, siteUrl } from "@/lib/seo";
import { PageIntro } from "../page-intro";
import styles from "../site.module.css";
import { LearningPicture } from "@/components/learning-picture";
import { learningImageUrl } from "@/lib/learning-image";

export const metadata = pageMetadata("/courses");

const title = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
/** Subjects actually published for a category, read from the study catalogue. */
function subjectsFor(category: string): string[] {
  return [...new Set(STUDY_COURSES.filter(course => courseCategory(course) === category).flatMap(course => course.subjects))].map(title);
}

export default function CoursesPage() {
  const origin = siteUrl();
  const groups = PREPARATION_GROUPS.map(group => ({
    ...group,
    items: group.categories.map(category => ({ category, label: CATEGORY_LABELS[category].en, summary: SUMMARIES[category], subjects: subjectsFor(category), examples: PREPARATIONS.filter(option => option.category === category).slice(0, 4).map(option => option.label.en) })),
  }));
  const itemList = {
    "@context": "https://schema.org", "@type": "ItemList", name: "MasterClass learning paths",
    itemListElement: groups.flatMap(group => group.items).map((item, index) => ({ "@type": "ListItem", position: index + 1, item: { "@type": "Course", name: item.label, description: item.summary, provider: { "@id": `${origin.href}#organization` }, inLanguage: ["en", "hi"], url: new URL(`/courses#${item.category}`, origin).href } })),
  };
  return <>
    <PageIntro path="/courses" eyebrow="Learning paths" extraSchema={itemList} />
    <div className={styles.prose}>
      {groups.map(group => <section key={group.id} aria-labelledby={`group-${group.id}`}>
        <h2 id={`group-${group.id}`}>{group.label.en}</h2>
        <div className={styles.grid}>{group.items.map(item => <article key={item.category} id={item.category} className={styles.card}>
          <LearningPicture variant="card" className={styles.cardPicture} src={learningImageUrl("courses", [item.category])} alt={`Illustration of ${item.label}`} />
          <h3>{item.label}</h3>
          <p>{item.summary}</p>
          {item.subjects.length > 0 && <p><strong>Subjects:</strong> {item.subjects.join(", ")}</p>}
          {item.examples.length > 0 && <ul>{item.examples.map(example => <li key={example}>{example}</li>)}</ul>}
          <Link href={`/dashboard/${item.category}`}>Open in your dashboard →</Link>
        </article>)}</div>
      </section>)}
    </div>
    <div className={styles.banner}><p>Pick your paths, then learn in one focused space.</p><Link className={styles.cta} href="/sign-up">Create your account</Link></div>
  </>;
}
