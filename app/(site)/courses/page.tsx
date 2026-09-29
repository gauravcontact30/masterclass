import Link from "next/link";
import { CATEGORY_LABELS, PREPARATIONS, PREPARATION_GROUPS, courseCategory } from "@/lib/study/preparations";
import { STUDY_COURSES } from "@/lib/study/catalog";
import { pageMetadata, siteUrl } from "@/lib/seo";
import { PageIntro } from "../page-intro";
import styles from "../site.module.css";

export const metadata = pageMetadata("/courses");

const SUMMARIES: Record<string, string> = {
  "civil-services": "UPSC Civil Services preparation with study notes, worked answers and practice.",
  ssc: "Preparation for SSC recruitment exams with worked answers and timed practice.",
  defence: "NDA, CDS and CAPF preparation with worked answers and timed practice.",
  banking: "IBPS PO and Clerk preparation with worked answers and practice.",
  railways: "RRB NTPC and Group D preparation with worked answers and practice.",
  teaching: "CTET teaching-aptitude preparation.",
  state: "Common foundations for state government exams.",
  engineering: "JEE Main and Advanced foundations on the IIT pathway.",
  medical: "NEET UG foundations for medical entrance.",
  cbse: "Class 6–12 concept notes and practice for CBSE students.",
  ncert: "Class 6–12 concept support built around NCERT textbooks. NCERT is a resource organisation, not an exam board.",
  icse: "CISCE school preparation through Class 10.",
  isc: "CISCE senior secondary preparation for Classes 11–12.",
  languages: "IELTS Academic practice, English vocabulary and Hindi meanings.",
  "system-design": "Detailed case studies on designing apps, APIs and scalable architecture.",
  technology: "Technology handbooks, coding labs and interview preparation.",
};

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
