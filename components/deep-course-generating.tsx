"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpenCheck, Loader2, RotateCcw, Search, ShieldCheck, Sparkles } from "lucide-react";
import styles from "./deep-course.module.css";

/*
 * Shown while a generated in-depth course (lib/server/course-generator.ts) writes its outline or one of its topics
 * on first open. It starts the work, waits while someone else's request is writing it, and refreshes the page when
 * the content is stored.
 */

const ERRORS: Record<string, string> = {
  rate_limited: "Lots of new lessons are being written for you right now. Try again in a little while.",
  ai_not_configured: "Course writing is not configured on this server yet.",
  migration_required: "Course writing needs a database update (migration 0044) before it can run.",
  generation_failed: "This lesson did not pass our quality check this time. Try again to write a fresh version.",
  signin_required: "Sign in to open this course.",
};

const STAGES = [
  { icon: Search, text: "Researching the official documentation" },
  { icon: Sparkles, text: "Writing explanations, syntax and worked examples" },
  { icon: BookOpenCheck, text: "Adding assignments, alternate ways and questions" },
  { icon: ShieldCheck, text: "Editor review for accuracy and clarity" },
];

function useGeneration(body: { trackId: string; topicId?: string }, enabled: boolean) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const key = `${body.trackId}/${body.topicId ?? ""}`;
  const started = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const marker = `${key}#${attempt}`;
    if (started.current === marker) return;
    started.current = marker;
    let cancelled = false;
    const begin = Date.now();
    const tick = setInterval(() => setElapsed(Math.round((Date.now() - begin) / 1000)), 1000);
    (async () => {
      // A long first request writes the content; if someone else is writing it, ask again every few seconds.
      for (let tries = 0; tries < 60 && !cancelled; tries++) {
        const response = await fetch("/api/deep-courses/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
        const data = await response?.json().catch(() => null) as { state?: string; error?: string } | null;
        if (cancelled) return;
        if (!response?.ok) { setError(ERRORS[data?.error ?? ""] ?? "The connection dropped while writing this lesson. Try again."); return; }
        if (data?.state === "ready") { router.refresh(); return; }
        await new Promise(done => setTimeout(done, 8000));
      }
      if (!cancelled) setError("This is taking longer than usual. Try again in a minute.");
    })().finally(() => clearInterval(tick));
    return () => { cancelled = true; clearInterval(tick); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `body` is identified by `key`
  }, [key, attempt, enabled, router]);

  return { error, elapsed, retry: () => { setError(""); setElapsed(0); setAttempt(value => value + 1); } };
}

function Progress({ elapsed, title, lede }: { elapsed: number; title: string; lede: string }) {
  const stage = Math.min(STAGES.length - 1, Math.floor(elapsed / 25));
  return <div className={styles.generating} role="status" aria-live="polite">
    <Loader2 size={26} className={styles.spin} aria-hidden="true" />
    <h2>{title}</h2>
    <p>{lede}</p>
    <ol className={styles.generatingStages}>{STAGES.map(({ icon: Icon, text }, index) => <li key={text} data-state={index < stage ? "done" : index === stage ? "active" : "todo"}><Icon size={15} aria-hidden="true" />{text}</li>)}</ol>
    <small>{elapsed}s · usually one to three minutes, once. Everyone after you opens it instantly.</small>
  </div>;
}

function Failure({ error, retry }: { error: string; retry: () => void }) {
  return <div className={styles.generating} role="alert">
    <h2>Not ready yet</h2>
    <p>{error}</p>
    <button type="button" className={styles.start} onClick={retry}><RotateCcw size={15} aria-hidden="true" />Try again</button>
    <Link href="/learning/lessons" className={styles.generatingBack}>Back to Lessons</Link>
  </div>;
}

/** A course whose outline has not been written yet. */
export function GeneratingCourse({ trackId, name, glyph, unavailable = false }: { trackId: string; name: string; glyph: string; unavailable?: boolean }) {
  const { error, elapsed, retry } = useGeneration({ trackId }, !unavailable);
  return <div className={styles.main}>
    <header className={styles.hero}>
      <p className={styles.eyebrow}><Link href="/learning/lessons">Lessons</Link> / In-depth course</p>
      <h1><span aria-hidden="true">{glyph}</span> {name}</h1>
    </header>
    {unavailable ? <Failure error={ERRORS.migration_required} retry={() => window.location.reload()} />
      : error ? <Failure error={error} retry={retry} />
      : <Progress elapsed={elapsed} title={`Preparing the ${name} course`} lede="This course is being planned from the official documentation, topic by topic, the first time anyone opens it." />}
  </div>;
}

/** A topic of a generated course that has not been written yet. */
export function GeneratingTopic({ trackId, topicId, title }: { trackId: string; topicId: string; title: string }) {
  const { error, elapsed, retry } = useGeneration({ trackId, topicId }, true);
  return error ? <Failure error={error} retry={retry} /> : <Progress elapsed={elapsed} title={`Writing “${title}”`} lede="This lesson is being researched from the official documentation and written in full: step by step, syntax, worked examples with output, assignments, alternate ways and interview questions." />;
}
