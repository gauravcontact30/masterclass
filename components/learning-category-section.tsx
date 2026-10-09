"use client";
import { ExpandedText } from "@/components/expanded-text";


import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Layers, Blocks, Braces, Cloud, Database, FlaskConical, GraduationCap, Sparkles, Terminal } from "lucide-react";
import type { DocumentRecord } from "@/lib/domain";
import type { LearningCategory } from "@/lib/learning-categories";
import { fill, paginate } from "@/lib/library";
import { LearningLibraryPager } from "./learning-library-parts";
import { useLanguage } from "./language-provider";
import styles from "./class-sections.module.css";
import libraryStyles from "./library.module.css";

const icons = { notes: Sparkles, data: Database, security: Layers, frontend: Blocks, javascript: Braces, testing: FlaskConical, cloud: Cloud, ai: Sparkles, backend: Database, languages: Terminal, other: GraduationCap };

type CardDragProps = {
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
};

export function LearningCategorySection({ category, documents, renderDocument }: { category: LearningCategory; documents: DocumentRecord[]; renderDocument: (document: DocumentRecord, dragProps?: CardDragProps) => ReactNode }) {
  const { language, t } = useLanguage();
  const headingId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const [page, setPage] = useState(1);
  const [customOrder, setCustomOrder] = useState<string[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storageKey = `masterclass:library-order:${category.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) queueMicrotask(() => setCustomOrder(parsed));
      }
    } catch {}
  }, [category.id]);

  const moveDocument = (sourceId: string, targetId: string) => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    const currentIds = documents.map(d => d.id);
    const base = customOrder.length > 0 ? [...customOrder] : currentIds;
    for (const id of currentIds) {
      if (!base.includes(id)) base.push(id);
    }
    const sourceIndex = base.indexOf(sourceId);
    const targetIndex = base.indexOf(targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;
    const nextOrder = [...base];
    const [moved] = nextOrder.splice(sourceIndex, 1);
    nextOrder.splice(targetIndex, 0, moved);
    setCustomOrder(nextOrder);
    try {
      localStorage.setItem(`masterclass:library-order:${category.id}`, JSON.stringify(nextOrder));
    } catch {}
  };

  const orderedDocuments = useMemo(() => {
    if (!customOrder.length) return documents;
    const map = new Map(customOrder.map((id, idx) => [id, idx]));
    return [...documents].sort((a, b) => {
      const idxA = map.has(a.id) ? map.get(a.id)! : 999999;
      const idxB = map.has(b.id) ? map.get(b.id)! : 999999;
      return idxA - idxB;
    });
  }, [documents, customOrder]);

  const view = paginate(orderedDocuments, page);
  const Icon = icons[category.id];
  function changePage(next: number) {
    setPage(next);
    if (sectionRef.current && sectionRef.current.getBoundingClientRect().top < 0) sectionRef.current.scrollIntoView({ block: "start", behavior: "auto" });
  }
  return <section ref={sectionRef} className={styles.classSection} aria-labelledby={headingId}>
    <header className={styles.classHeader}><span className={styles.classIcon} aria-hidden="true"><Icon size={24} /></span><div><h3 id={headingId}><ExpandedText text={category.title[language]} /></h3><p><ExpandedText text={category.description[language]} /></p></div><span className={styles.classCount}>{documents.length} <ExpandedText text={language === "hi" ? "गाइड" : documents.length === 1 ? "guide" : "guides"} /></span></header>
    <p className={`${libraryStyles.summary} ${styles.classSummary}`} aria-live="polite"><ExpandedText text={fill(t("libraryShowing"), { from: view.from, to: view.to, total: view.total })} /></p>
    <ul key={view.page} className={`${libraryStyles.grid} ${styles.classPage}`}>
      {view.items.map(doc => {
        const isDragging = draggedId === doc.id;
        const isDragOver = dragOverId === doc.id && draggedId !== doc.id;
        return renderDocument(doc, {
          draggable: true,
          onDragStart: (e) => {
            e.dataTransfer.setData("text/plain", doc.id);
            e.dataTransfer.effectAllowed = "move";
            setDraggedId(doc.id);
          },
          onDragOver: (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (dragOverId !== doc.id) setDragOverId(doc.id);
          },
          onDragLeave: () => {
            if (dragOverId === doc.id) setDragOverId(null);
          },
          onDrop: (e) => {
            e.preventDefault();
            e.stopPropagation();
            const sourceId = e.dataTransfer.getData("text/plain") || draggedId;
            if (sourceId && sourceId !== doc.id) {
              moveDocument(sourceId, doc.id);
            }
            setDraggedId(null);
            setDragOverId(null);
          },
          onDragEnd: () => {
            setDraggedId(null);
            setDragOverId(null);
          },
          isDragging,
          isDragOver,
        });
      })}
    </ul>
    <LearningLibraryPager page={view.page} pages={view.pages} onPage={changePage} />
  </section>;
}
