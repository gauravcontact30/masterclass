"use client";
import { ExpandedText } from "@/components/expanded-text";


import { useState, type ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight, GripVertical, NotebookText } from "lucide-react";
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
export function LearningCard({
  title,
  titleId,
  accentId,
  label,
  status = "ready",
  overlay,
  children,
  checked,
  onToggleCheck,
  draggable = true,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  isDragging,
  isDragOver,
}: {
  title: string;
  titleId: string;
  accentId: string;
  label: string;
  status?: string;
  overlay?: ReactNode;
  children: ReactNode;
  checked?: boolean;
  onToggleCheck?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}) {
  const { t } = useLanguage();
  const [internalChecked, setInternalChecked] = useState(false);
  const isChecked = checked !== undefined ? checked : internalChecked;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleCheck) {
      onToggleCheck();
    } else {
      setInternalChecked(prev => !prev);
    }
  };

  return (
    <article
      className={styles.card}
      data-status={status}
      data-dragging={isDragging || undefined}
      data-dragover={isDragOver || undefined}
      data-checked={isChecked || undefined}
      aria-label={title}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {/* Top Left Drag Handle */}
      <div
        className={styles.cardDragHandle}
        title="Drag to reposition card"
        aria-label="Drag to reposition card"
        draggable
        onDragStart={onDragStart}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={15} aria-hidden="true" />
      </div>

      {/* Top Right Clickable Checkbox */}
      <button
        type="button"
        role="checkbox"
        aria-checked={isChecked}
        className={styles.cardCheckbox}
        onClick={handleCheckboxClick}
        title={isChecked ? "Deselect card" : "Select card"}
        aria-label={`Select ${title}`}
      >
        <span className={styles.cardCheckboxInner}>
          {isChecked && <Check size={12} strokeWidth={3} aria-hidden="true" />}
        </span>
      </button>

      <div className={styles.stage}>
        <span className={styles.thumbWrap}><NotesThumbnail title={title} technologyId={accentId} label={label} /></span>
        <span className={styles.chip}><NotebookText size={12} aria-hidden="true" /><ExpandedText text={t("libraryTypeNotes")} /></span>
        {overlay}
      </div>
      <LearningRegion className={styles.body} contentKey={learningContentKey(accentId, title)}>{children}</LearningRegion>
    </article>
  );
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
