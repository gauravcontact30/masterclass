"use client";
import { ExpandedText } from "@/components/expanded-text";


import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, NotebookText } from "lucide-react";
import { fill, pageItems } from "@/lib/library";
import { NotesThumbnail } from "./file-thumbnail";
import { useLanguage } from "./language-provider";
import { LearningRegion } from "./learning-marks";
import { learningContentKey } from "@/lib/learning-marks";
import styles from "./library.module.css";

export function LearningLibraryHeading({ id, total }: { id: string; total: number }) {
  const { t } = useLanguage();
  return <h2 id={id} className={styles.heading}><ExpandedText text={t("history")} /><span className={styles.total}>{total}</span></h2>;
}

/** Shared notebook presentation for saved guides and every study category. */
export function LearningCard({ title, titleId, accentId, label, status = "ready", overlay, children }: {
  title: string;
  titleId: string;
  accentId: string;
  label: string;
  status?: string;
  overlay?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useLanguage();
  return <article className={styles.card} data-status={status} aria-labelledby={titleId}>
    <div className={styles.stage}>
      <span className={styles.thumbWrap}><NotesThumbnail title={title} technologyId={accentId} label={label} /></span>
      <span className={styles.chip}><NotebookText size={12} aria-hidden="true" /><ExpandedText text={t("libraryTypeNotes")} /></span>
      {overlay}
    </div>
    <LearningRegion className={styles.body} contentKey={learningContentKey(accentId, title)}>{children}</LearningRegion>
  </article>;
}

export function LearningLibraryPager({ page, pages, onPage }: { page: number; pages: number; onPage: (page: number) => void }) {
  const { t } = useLanguage();
  if (pages <= 1) return null;
  return <nav className={styles.pager} aria-label={t("libraryPagination")}>
    <button type="button" className={`${styles.pageButton} ${styles.pageStep}`} disabled={page <= 1} onClick={() => onPage(page - 1)}>
      <ChevronLeft size={15} aria-hidden="true" /><span className={styles.stepLabel}><ExpandedText text={t("previous")} /></span>
    </button>
    <ol className={styles.pageList}>
      {pageItems(page, pages).map((entry, index) => entry === "gap"
        ? <li key={`gap-${index}`} className={styles.pageGap} aria-hidden="true">…</li>
        : <li key={entry}><button type="button" className={styles.pageButton} aria-label={fill(t("libraryPageLabel"), { page: entry })} aria-current={entry === page ? "page" : undefined} onClick={() => onPage(entry)}>{entry}</button></li>)}
    </ol>
    <span className={styles.pageOf} aria-hidden="true"><ExpandedText text={fill(t("libraryPageOf"), { page, pages })} /></span>
    <button type="button" className={`${styles.pageButton} ${styles.pageStep}`} disabled={page >= pages} onClick={() => onPage(page + 1)}>
      <span className={styles.stepLabel}><ExpandedText text={t("next")} /></span><ChevronRight size={15} aria-hidden="true" />
    </button>
  </nav>;
}
