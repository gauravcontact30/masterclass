"use client";
import { BookOpen } from "lucide-react";
import { LearningSlot } from "./learning-slot";
import styles from "./learning-slot.module.css";

/** A Learning Dashboard page the owner created in Upload Learning; its content is whatever is published to "main". */
export function LearningCustomPage({ slug, title, description }: { slug: string; title: string; description: string | null }) {
  return <div className={styles.page}>
    <header className={styles.pageHead}><span className={styles.pageMark} aria-hidden="true"><BookOpen size={20} /></span><div><h1>{title}</h1>{description && <p>{description}</p>}</div></header>
    <LearningSlot surface="dashboard" page={`learn:${slug}`} section="main" fallback={<p className={styles.pageEmpty}>Nothing has been published on this page yet. Check back soon.</p>} />
  </div>;
}
