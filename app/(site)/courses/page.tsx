import Link from "next/link";
import { CATEGORY_LABELS, PREPARATIONS, PREPARATION_GROUPS, courseCategory } from "@/lib/study/preparations";
import { STUDY_COURSES } from "@/lib/study/catalog";
import { COURSE_SUMMARIES as SUMMARIES } from "@/lib/study/course-summaries";
import { pageMetadata, siteUrl } from "@/lib/seo";
import { PageIntro } from "../page-intro";
import styles from "../site.module.css";
import { LearningPicture } from "@/components/learning-picture";
import { learningImageUrl } from "@/lib/learning-image";

import { CoursesFeed } from "@/components/courses-feed";

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
    <CoursesFeed />
  </>;
}
