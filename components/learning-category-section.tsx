"use client";
import { ExpandedText } from "@/components/expanded-text";


import { useId, useRef, useState, type ReactNode } from "react";
import { Layers, Blocks, Braces, Cloud, Database, FlaskConical, GraduationCap, Sparkles, Terminal } from "lucide-react";
import type { DocumentRecord } from "@/lib/domain";
import type { LearningCategory } from "@/lib/learning-categories";
import { fill, paginate } from "@/lib/library";
import { LearningLibraryPager } from "./learning-library-parts";
import { useLanguage } from "./language-provider";
import styles from "./class-sections.module.css";
import libraryStyles from "./library.module.css";

const icons = { notes: Sparkles, data: Database, security: Layers, frontend: Blocks, javascript: Braces, testing: FlaskConical, cloud: Cloud, ai: Sparkles, backend: Database, languages: Terminal, other: GraduationCap };

export function LearningCategorySection({ category, documents, renderDocument }: { category: LearningCategory; documents: DocumentRecord[]; renderDocument: (document: DocumentRecord) => ReactNode }) {
  const { language, t } = useLanguage();
  const headingId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const [page, setPage] = useState(1);
  const view = paginate(documents, page);
  const Icon = icons[category.id];
  function changePage(next: number) {
    setPage(next);
    if (sectionRef.current && sectionRef.current.getBoundingClientRect().top < 0) sectionRef.current.scrollIntoView({ block: "start", behavior: "auto" });
  }
  return <section ref={sectionRef} className={styles.classSection} aria-labelledby={headingId}>
    <header className={styles.classHeader}><span className={styles.classIcon} aria-hidden="true"><Icon size={24} /></span><div><h3 id={headingId}><ExpandedText text={category.title[language]} /></h3><p><ExpandedText text={category.description[language]} /></p></div><span className={styles.classCount}>{documents.length} <ExpandedText text={language === "hi" ? "गाइड" : documents.length === 1 ? "guide" : "guides"} /></span></header>
    <p className={`${libraryStyles.summary} ${styles.classSummary}`} aria-live="polite"><ExpandedText text={fill(t("libraryShowing"), { from: view.from, to: view.to, total: view.total })} /></p>
    <ul key={view.page} className={`${libraryStyles.grid} ${styles.classPage}`}>{view.items.map(renderDocument)}</ul>
    <LearningLibraryPager page={view.page} pages={view.pages} onPage={changePage} />
  </section>;
}
