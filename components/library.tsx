"use client";
import { ExpandedText } from "@/components/expanded-text";

import { useId, useMemo, useRef, useState } from "react";
import { BookOpen, Check, Copy, LoaderCircle, NotebookText, Search, SearchX, Trash2, X } from "lucide-react";
import type { DocumentRecord, GenerationRequest, Progress, Technology, Topic } from "@/lib/domain";
import { fill, searchDocuments, sortLibrary, uniqueLibraryDocuments } from "@/lib/library";
import { LearningCard, LearningLibraryHeading } from "./learning-library-parts";
import { DownloadLink } from "./download-link";
import { useLanguage } from "./language-provider";
import { Button } from "./ui/button";
import styles from "./library.module.css";
import { groupLearningDocuments } from "@/lib/learning-categories";
import { LearningCategorySection } from "./learning-category-section";

export type LibraryProps = {
  externalQuery?: string;
  onQueryChange?: (value: string) => void;
  documents: DocumentRecord[];
  technologies?: Technology[];
  topics?: Topic[];
  progress?: Progress[];
  loading?: boolean;
  busy?: boolean;
  copiedId?: string | null;
  onLearn: (doc: DocumentRecord) => void;
  onCopyNotes: (doc: DocumentRecord) => void;
  onRetry: (request: GenerationRequest) => void;
  onDelete: (doc: DocumentRecord) => void;
};

/**
 * The notes library shared by the Dashboard and My library views: search
 * (title / technology / topic) and a paginated grid of notebook cards, each
 * opening in the Learn in App notes reader and showing how far the learner got.
 */
export function Library({ externalQuery, onQueryChange, documents: sourceDocuments, technologies = [], topics = [], progress = [], loading = false, busy = false, copiedId = null, onLearn, onCopyNotes, onRetry, onDelete }: LibraryProps) {
  const documents = useMemo(() => uniqueLibraryDocuments(sourceDocuments), [sourceDocuments]);
  const { t, language } = useLanguage();
  const hi = language === "hi";
  const base = useId();
  const headingId = `${base}-heading`;
  const sectionRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [localQuery, setQuery] = useState("");
  const query=externalQuery??localQuery;

  const catalog = useMemo(() => ({ technologies, topics }), [technologies, topics]);
  const filtered = useMemo(() => sortLibrary(searchDocuments(documents, query, catalog)), [documents, query, catalog]);
  const groups = useMemo(() => groupLearningDocuments(filtered, technologies), [filtered, technologies]);
  const trimmed = query.trim();

  const technologyNames = useMemo(() => new Map(technologies.map(item => [item.id, hi ? item.title_hi || item.title : item.title])), [technologies, hi]);
  const progressById = useMemo(() => new Map(progress.map(item => [item.document_id, item])), [progress]);
  const dateFormat = useMemo(() => new Intl.DateTimeFormat(hi ? "hi-IN" : "en-IN", { dateStyle: "medium" }), [hi]);

  function clearSearch(refocus = true) {
    (onQueryChange ?? setQuery)("");
    if (refocus) inputRef.current?.focus();
  }

  const summary = loading || !documents.length ? ""
    : trimmed ? fill(t(filtered.length === 1 ? "libraryResultFor" : "libraryResultsFor"), { total: filtered.length, query: trimmed })
    : fill(t(filtered.length === 1 ? "libraryCountOne" : "libraryCount"), { total: filtered.length });

  return (
    <section ref={sectionRef} className={styles.library} aria-labelledby={headingId}>
      <div className={styles.header}>
        <LearningLibraryHeading id={headingId} total={documents.length} />
        {externalQuery===undefined&&<div className={styles.search} role="search">
          <Search size={16} className={styles.searchIcon} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            className={styles.searchInput}
            aria-label={t("search")}
            placeholder={t("librarySearchPlaceholder")}
            value={query}
            autoComplete="off"
            spellCheck={false}
            onChange={event => setQuery(event.target.value)}
            onKeyDown={event => { if (event.key === "Escape" && query) { event.preventDefault(); clearSearch(false); } }}
          />
          {query && <button type="button" className={styles.clear} aria-label={t("clearSearch")} title={t("clearSearch")} onClick={() => clearSearch()}><X size={15} aria-hidden="true" /></button>}
        </div>}
      </div>

      <div className={styles.toolbar}>
        {documents.length > 0 && <p className={styles.hint}><NotebookText size={13} aria-hidden="true" /><ExpandedText text={t("libraryNotesHint")} /></p>}
        <p className={styles.summary} role="status" aria-live="polite" aria-atomic="true"><ExpandedText text={summary} /></p>
      </div>

      <div className={styles.panel}>
        {loading ? (
          <>
            <span className={styles.srOnly} role="status"><ExpandedText text={t("loading")} /></span>
            <ul className={styles.grid} aria-hidden="true">{[0, 1, 2].map(i => <li key={i} className={styles.skeleton}><span /><span /><span /></li>)}</ul>
          </>
        ) : !documents.length ? (
          <div className={styles.empty}>
            <span className={styles.emptyArt} aria-hidden="true"><NotebookText size={26} /><BookOpen size={30} /></span>
            <h3><ExpandedText text={t("empty")} /></h3>
            <p><ExpandedText text={t("emptyHelp")} /></p>
          </div>
        ) : !filtered.length ? (
          <div className={styles.empty}>
            <span className={styles.emptyArt} aria-hidden="true"><SearchX size={28} /></span>
            <h3><ExpandedText text={fill(t("libraryNoMatchTitle"), { query: trimmed })} /></h3>
            <p><ExpandedText text={t("libraryNoMatchHelp")} /></p>
            <div className={styles.emptyActions}>
              <Button variant="outline" size="sm" className={styles.emptyButton} onClick={() => clearSearch()}><X size={14} aria-hidden="true" /><ExpandedText text={t("clearSearch")} /></Button>
            </div>
          </div>
        ) : (
          groups.map(group => <LearningCategorySection key={`${group.category.id}:${query.trim()}:${language}`} category={group.category} documents={group.documents} renderDocument={item => {
              const titleId = `${base}-${item.id}-title`;
              const pending = item.status === "queued" || item.status === "generating";
              const technology = technologyNames.get(item.request.technologyId) ?? prettify(item.request.technologyId);
              const lessons = item.page_titles?.length ?? 0;
              const saved = progressById.get(item.id);
              const reading = item.status === "ready" ? readingState(saved, lessons) : null;
              return (
                <li key={item.id} className={styles.item}>
                  <LearningCard title={item.title} titleId={titleId} accentId={item.request.technologyId} label={technology} status={item.status}
                    overlay={pending && <span className={styles.pending} aria-hidden="true"><LoaderCircle size={13} className={styles.spinner} />{t(item.status)}…</span>}>
                      <div className={styles.meta}>
                        <span className={styles.status} data-status={reading?.completed ? "completed" : item.status}>{reading?.completed ? t("completed") : t(item.status)}</span>
                        <span className={styles.lang} lang={item.request.language}>{item.request.language === "hi" ? "हिन्दी" : "English"}</span>
                        <Button variant="ghost" size="icon" className={styles.delete} disabled={busy || pending} aria-label={t("deleteMaterial")} title={t("deleteMaterial")} onClick={() => onDelete(item)}><Trash2 size={15} aria-hidden="true" /></Button>
                      </div>
                      <h4 id={titleId} className={styles.title} title={item.title}>{item.title}</h4>
                      <p className={styles.sub}>
                        <span>{technology}</span>
                        {lessons > 1 && <span>{fill(t("lessonCount"), { count: lessons })}</span>}
                        <span>{t(item.request.level)}</span>
                      </p>
                      {reading && reading.percent > 0 && (
                        <div className={styles.progress} data-complete={reading.completed || undefined}>
                          <span className={styles.progressBar} aria-hidden="true"><i style={{ width: `${reading.percent}%` }} /></span>
                          <span className={styles.progressLabel}>{reading.completed ? t("completed") : fill(t("lessonOf"), { lesson: reading.lesson, total: lessons })}</span>
                        </div>
                      )}
                      <time className={styles.date} dateTime={item.created_at}>{dateFormat.format(new Date(item.created_at))}</time>
                      {item.status === "failed" && <p className={styles.error}>{t("generation_failed")}</p>}
                      {pending ? (
                        // The stage overlay and status badge already show progress visually.
                        <span className={styles.srOnly} role="status">{t(item.status)}…</span>
                      ) : <div className={styles.actions}>
                        {item.status === "ready" ? (
                          <>
                            <Button size="sm" className={styles.learn} onClick={() => onLearn(item)}><BookOpen size={14} aria-hidden="true" />{saved && !saved.completed && saved.page > 1 ? t("resume") : t("learn")}</Button>
                            <Button variant="ghost" size="sm" className={styles.secondary} title={copiedId === item.id ? undefined : t("copyNotes")} onClick={() => onCopyNotes(item)}>{copiedId === item.id ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}<span className={styles.copyLabel}>{copiedId === item.id ? t("notesCopied") : t("copyNotes")}</span></Button>
                            <span className={styles.download}><DownloadLink href={`/api/documents/${item.id}/download`} filename={`masterclass-${item.id}-notes.txt`} /></span>
                          </>
                        ) : (
                          <Button size="sm" className={styles.learn} disabled={busy} onClick={() => onRetry(item.request)}>{t("retry")}</Button>
                        )}
                      </div>}
                  </LearningCard>
                </li>
              );
            }} />)
        )}



      </div>
    </section>
  );
}

/** Where the learner is in a guide: the saved lesson, and how much of the guide that covers. */
export function readingState(saved: Progress | undefined, lessons: number) {
  if (!saved) return { lesson: 0, percent: 0, completed: false };
  if (saved.completed) return { lesson: lessons, percent: 100, completed: true };
  const lesson = Math.min(Math.max(1, saved.page), Math.max(1, lessons));
  return { lesson, percent: lessons > 1 ? Math.round((lesson / lessons) * 100) : 0, completed: false };
}

function prettify(id: string) {
  const words = id.replace(/[-_]+/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : id;
}
