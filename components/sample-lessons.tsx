"use client";
import { ExpandedText } from "@/components/expanded-text";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowUpRight, NotebookText } from "lucide-react";
import type { DocumentRecord } from "@/lib/domain";
import { DOCUMENT_FORMAT } from "@/lib/domain";
import type { TechnologyGuide } from "@/lib/generation/guides";
import { fill } from "@/lib/library";
import { useLanguage } from "./language-provider";
import { NotesThumbnail } from "./file-thumbnail";
import styles from "./sample-lessons.module.css";

const NotesModal = dynamic(() => import("./notes-modal").then(module => module.NotesModal));

/**
 * Three of the seeded technology guides, each its own code-split chunk, so the
 * landing page ships none of the notes until the showcase mounts.
 */
const SAMPLES: { id: string; label: string; load: () => Promise<TechnologyGuide> }[] = [
  { id: "python", label: "Python", load: () => import("@/lib/generation/guides/python").then(module => module.default) },
  { id: "claude-skills-plugins-mcp", label: "Claude", load: () => import("@/lib/generation/guides/claude-ecosystem").then(module => module.default) },
  { id: "react-19-hooks", label: "React 19", load: () => import("@/lib/generation/guides/react-hooks").then(module => module.default) },
];

/** A read-only document the notes reader can open without an account; progress stays in this browser. */
function sampleDocument(guide: TechnologyGuide): DocumentRecord {
  return {
    id: `sample-${guide.id}`, user_id: "sample", title: guide.curriculum.title,
    request: { technologyId: guide.technologyId, topicId: guide.topicId, format: DOCUMENT_FORMAT, language: "en", level: guide.level },
    status: "ready", created_at: "2026-09-11T00:00:00Z", error_code: null, curriculum: guide.curriculum,
    page_titles: guide.curriculum.lessons.map(lesson => lesson.title), storage_path: null, preview_paths: [],
  };
}

export function SampleLessons() {
  const { t, language } = useLanguage();
  const hi = language === "hi";
  const [guides, setGuides] = useState<(TechnologyGuide | null)[]>(() => SAMPLES.map(() => null));
  const [open, setOpen] = useState<DocumentRecord | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([Promise.all(SAMPLES.map(sample => sample.load())), import("@/lib/generation/topic-projects")]).then(([loaded, { TOPIC_PROJECTS }]) => { if (active) setGuides(loaded.map(guide => ({ ...guide, curriculum: { ...guide.curriculum, codeExamples: TOPIC_PROJECTS[guide.id] } }))); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);

  return <>
    <div className={styles.gallery}>
      {SAMPLES.map((sample, index) => {
        const guide = guides[index];
        const deck = guide?.curriculum;
        return (
          <button key={sample.id} type="button" className={styles.card} disabled={!guide} aria-label={fill(t("sampleOpen"), { title: deck?.title ?? sample.label })} onClick={() => guide && setOpen(sampleDocument(guide))}>
            <span className={styles.cardTop}><span><NotebookText size={16} aria-hidden="true" /><ExpandedText text={t("libraryTypeNotes").toUpperCase()} /></span><span className={styles.number}>0{index + 1}</span></span>
            <span className={styles.art}><NotesThumbnail title={deck?.title ?? sample.label} technologyId={guide?.technologyId ?? sample.id} label={sample.label} /></span>
            <span className={styles.cardBody}>
              <strong><ExpandedText text={deck?.title ?? sample.label} /></strong>
              <span><ExpandedText text={deck ? `${fill(t("lessonCount"), { count: deck.lessons.length })} · ${deck.minutes} ${hi ? "मिनट" : "min"}` : t("loading")} /></span>
              {deck && <span className={styles.objective}><ExpandedText text={deck.objectives[0]} /></span>}
            </span>
            <span className={styles.cardFoot}><span><ExpandedText text={t("learn")} /></span><ArrowUpRight size={17} aria-hidden="true" /></span>
          </button>
        );
      })}
    </div>
    <p className={styles.hint}><ExpandedText text={failed ? t("service_error") : t("sampleHint")} /></p>
    {open && <NotesModal sample document={open} onClose={() => setOpen(null)} />}
  </>;
}
