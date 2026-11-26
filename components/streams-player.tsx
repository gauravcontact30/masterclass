"use client";
import { Fragment, useEffect, useState } from "react";
import Link from "@/components/site-link";
import { CheckCircle2, CirclePlay, Crown, Loader2, Lock, LogIn, RotateCcw } from "lucide-react";
import { McbPoster } from "./streams-poster";
import { McbCover } from "./streams-cover";
import { canWatch, forgetStreamAccess, useStreamAccess } from "./streams-access";
import { clockTime, findStep, type StreamStep, type StreamTech } from "@/lib/streams";
import { signInFor } from "@/lib/safe-redirect";
import styles from "./streams.module.css";

/*
 * Streams' player, step list and progress, shared by the landing section, /streams and the Learning Dashboard.
 * The player is a facade: until play is pressed it is the Master Class Buddy thumbnail and a button, so a page with a
 * player downloads no video code at all. Pressing play asks /api/streams/play for this step's player address; the
 * server answers only for a viewer entitled to the step (the first step of every course is free, the rest need a
 * membership: lib/server/streams-access.ts) and otherwise says why, and the player shows how to sign in or subscribe.
 */
let warmed = false;
function warmConnections() {
  if (warmed) return; warmed = true;
  for (const href of ["https://www.youtube-nocookie.com", "https://www.google.com"]) {
    const link = document.createElement("link"); link.rel = "preconnect"; link.href = href; link.crossOrigin = ""; document.head.append(link);
  }
}

type Playback = { state: "loading" } | { state: "ready"; src: string } | { state: "denied"; reason: "signin_required" | "subscription_required" | "region_unavailable" } | { state: "error" };
const REASONS = new Set(["signin_required", "subscription_required", "region_unavailable"]);

/** The player address for a step while `playing`, from the server. */
function usePlayback(stepId: string, playing: boolean, attempt: number): Playback | null {
  const [result, setResult] = useState<{ key: string; value: Playback } | null>(null);
  const key = `${stepId}:${attempt}`;
  useEffect(() => {
    if (!playing) return;
    let active = true;
    fetch(`/api/streams/play?step=${encodeURIComponent(stepId)}`, { cache: "no-store", credentials: "same-origin" })
      .then(async response => {
        const body = await response.json().catch(() => ({})) as { src?: string; error?: string; code?: string };
        const reason = body.error ?? body.code;
        const value: Playback = response.ok && body.src ? { state: "ready", src: body.src }
          : reason && REASONS.has(reason) ? { state: "denied", reason: reason as "signin_required" } : response.status === 401 ? { state: "denied", reason: "signin_required" }
          : response.status === 402 ? { state: "denied", reason: "subscription_required" } : { state: "error" };
        if (value.state === "denied") forgetStreamAccess();
        if (active) setResult({ key, value });
      })
      .catch(() => { if (active) setResult({ key, value: { state: "error" } }); });
    return () => { active = false; };
  }, [stepId, playing, key]);
  return playing ? (result?.key === key ? result.value : { state: "loading" }) : null;
}

export function StreamPlayer({ step, playing, onPlay, label = "Play", stepWord }: { step: StreamStep; playing: boolean; onPlay: () => void; label?: string; stepWord?: string }) {
  const [attempt, setAttempt] = useState(0);
  const playback = usePlayback(step.id, playing, attempt);
  const access = useStreamAccess(); const open = canWatch(step, access);
  const here = typeof window === "undefined" ? "/streams" : `${window.location.pathname}${window.location.search}`;
  return <div className={styles.player}>
    {playback?.state === "ready"
      ? <iframe key={step.id} src={playback.src} title={step.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
      : <>
        <button type="button" className={styles.facade} onClick={onPlay} onPointerEnter={warmConnections} onFocus={warmConnections} disabled={playback?.state === "loading"}
          aria-label={`${label}: ${step.title} (${clockTime(step.seconds)})${open ? "" : " — members only"}`}>
          <McbPoster step={step} size="stage" stepWord={stepWord} />
          <span className={styles.playMark} aria-hidden="true">{playback?.state === "loading" ? <Loader2 size={56} className={styles.spin} /> : open ? <CirclePlay size={72} strokeWidth={1.3} /> : <Lock size={52} strokeWidth={1.6} />}</span>
          {!open && !playback && <span className={styles.memberBadge}><Crown size={13} aria-hidden="true" />Members</span>}
        </button>
        {playback?.state === "denied" && <div className={styles.gate} role="alert">
          <span className={styles.gateIcon}>{playback.reason === "signin_required" ? <LogIn size={22} aria-hidden="true" /> : <Crown size={22} aria-hidden="true" />}</span>
          <b>{playback.reason === "signin_required" ? "Sign in to keep watching" : playback.reason === "subscription_required" ? "Members watch every step" : "This course is not available here"}</b>
          <p>{playback.reason === "region_unavailable" ? "Exam courses are offered in India." : `The first step of every course is free. ${playback.reason === "signin_required" ? "Sign in, then become a member to watch" : "Become a member to watch"} step ${step.step} and every other step, with notes and progress.`}</p>
          {playback.reason !== "region_unavailable" && <span className={styles.gateActions}>
            {playback.reason === "signin_required" && <Link href={signInFor(here)} prefetch={false} className={styles.gatePrimary}><LogIn size={15} aria-hidden="true" />Sign in</Link>}
            <Link href="/subscribe" prefetch={false} className={playback.reason === "signin_required" ? styles.gateSecondary : styles.gatePrimary}><Crown size={15} aria-hidden="true" />See membership plans</Link>
          </span>}
        </div>}
        {playback?.state === "error" && <div className={styles.gate} role="alert">
          <b>The video could not start</b><p>Check your connection and try again.</p>
          <span className={styles.gateActions}><button type="button" className={styles.gatePrimary} onClick={() => setAttempt(a => a + 1)}><RotateCcw size={15} aria-hidden="true" />Try again</button></span>
        </div>}
      </>}
  </div>;
}

/** A playlist's steps in order; with `chapters`, each chapter's title heads its steps. Members-only steps show a padlock
 *  for viewers without a membership (`locked` overrides that). */
export function StepList({ steps, active, done, onPick, locked, chapters = false, label, stepWord }: {
  steps: StreamStep[]; active?: string; done: Record<string, true>; onPick: (step: StreamStep) => void; locked?: (step: StreamStep) => boolean; chapters?: boolean; label: string; stepWord?: string;
}) {
  const access = useStreamAccess();
  return <ol className={styles.playlist} aria-label={label}>
    {steps.map((step, i) => { const current = step.id === active; const isLocked = locked ? locked(step) : !canWatch(step, access);
      return <Fragment key={step.id}>
        {chapters && (i === 0 || steps[i - 1].chapter.id !== step.chapter.id) && <li className={styles.chapterHead} aria-hidden="true"><span>{step.chapterNo}</span>{step.chapter.title}</li>}
        <li>
          <button type="button" aria-current={current || undefined} onClick={() => onPick(step)} data-locked={isLocked || undefined}>
            <span className={styles.thumb}><McbCover tech={step.tech} step={step} size="sm" locked={isLocked} stepWord={stepWord} /></span>
            <span className={styles.lessonText}>
              <span className={styles.lessonNo}>{done[step.id] ? <CheckCircle2 size={14} aria-label="Watched" /> : isLocked ? <Lock size={12} aria-label="Members only" /> : step.step}</span>
              <span><b>{step.title}</b><small>{clockTime(step.seconds)} · {isLocked ? "Members" : step.step === 1 ? "Free" : step.level}</small></span>
            </span>
          </button>
        </li>
      </Fragment>; })}
  </ol>;
}

const PROGRESS_KEY = "mc:streams:progress:v1";
type Progress = { done: Record<string, true>; last?: { tech: StreamTech; lesson: string } };
/** Watched steps and the last step opened, kept in this browser (a per-viewer convenience; nothing is sent anywhere). */
export function useStreamProgress() {
  const [progress, setProgress] = useState<Progress>({ done: {} });
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(PROGRESS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { done?: Record<string, true>; last?: { lesson?: string } };
        // Earlier versions kept { course, lesson }; the step itself says which playlist it belongs to.
        const step = findStep(parsed.last?.lesson);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- restores saved progress after hydration, as the study plan does.
        setProgress({ done: parsed.done ?? {}, last: step ? { tech: step.tech, lesson: step.id } : undefined });
      }
    } catch { /* storage blocked: start empty */ }
  }, []);
  const save = (update: (current: Progress) => Progress) => setProgress(current => {
    const next = update(current); try { window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(next)); } catch { /* not saved */ } return next;
  });
  return {
    progress,
    toggleDone: (id: string) => save(current => { const done = { ...current.done }; if (done[id]) delete done[id]; else done[id] = true; return { ...current, done }; }),
    markDone: (id: string) => save(current => current.done[id] ? current : { ...current, done: { ...current.done, [id]: true } }),
    open: (tech: StreamTech, lesson: string) => save(current => current.last?.tech === tech && current.last.lesson === lesson ? current : { ...current, last: { tech, lesson } }),
  };
}
