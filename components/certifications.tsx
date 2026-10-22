"use client";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { ArrowUpRight, Award, BadgeCheck, CalendarClock, Check, ClipboardCheck, Hammer, Lightbulb, ListChecks, Users } from "lucide-react";
import { CERTIFICATION_TRACKS, certificationTrack, type CertTrack } from "@/lib/certifications";
import { MockExam, StepStudy, useTrackContent } from "./certification-study";
import styles from "./certifications.module.css";

/*
 * The Learning Dashboard's Certifications page: pick one of six tracks, see the certificates it leads to (exam code,
 * format and the official page) and follow its step-by-step path from the first lesson to exam day. Ticked steps
 * are kept in this browser (localStorage), read through useSyncExternalStore so the server render and the first
 * client render agree. `?track=<id>` opens a track directly (the landing cards link there).
 */
const STORE_KEY = "masterclass:certifications:done";
const CHANGE = "masterclass:certifications";
type Done = Record<string, number[]>;

const readRaw = () => { try { return localStorage.getItem(STORE_KEY) ?? "{}"; } catch { return "{}"; } };
const subscribe = (notify: () => void) => {
  window.addEventListener("storage", notify); window.addEventListener(CHANGE, notify);
  return () => { window.removeEventListener("storage", notify); window.removeEventListener(CHANGE, notify); };
};
const parse = (raw: string): Done => { try { const value = JSON.parse(raw); return value && typeof value === "object" ? value : {}; } catch { return {}; } };
const save = (done: Done) => { try { localStorage.setItem(STORE_KEY, JSON.stringify(done)); } catch { /* private window */ } window.dispatchEvent(new Event(CHANGE)); };

export function Certifications({ initialTrack }: { initialTrack?: string }) {
  const [trackId, setTrackId] = useState(certificationTrack(initialTrack ?? "")?.id ?? CERTIFICATION_TRACKS[0].id);
  const raw = useSyncExternalStore(subscribe, readRaw, () => "{}");
  const done = useMemo(() => parse(raw), [raw]);
  const track = certificationTrack(trackId) ?? CERTIFICATION_TRACKS[0];
  const choose = (id: string) => {
    setTrackId(id);
    const url = new URL(window.location.href); url.searchParams.set("track", id); window.history.replaceState(window.history.state, "", url);
  };
  const toggle = (step: number) => {
    const current = new Set(done[track.id] ?? []);
    if (current.has(step)) current.delete(step); else current.add(step);
    save({ ...done, [track.id]: [...current].sort((a, b) => a - b) });
  };
  return <div className={styles.page}>
    <header className={styles.hero}>
      <span className={styles.mark} aria-hidden="true"><Award size={22} /></span>
      <div>
        <p className={styles.eyebrow}>Professional Learn · Certifications</p>
        <h1>Certification paths, step by step</h1>
        <p>Pick a certification, follow its weekly steps from the first lesson to exam day, and tick each one off as you finish it. Every certificate links to its official page, where the latest exam details are published.</p>
      </div>
    </header>

    <nav aria-label="Certification tracks"><ul className={styles.tracks}>
      {CERTIFICATION_TRACKS.map(item => { const count = done[item.id]?.length ?? 0; return <li key={item.id}>
        <button type="button" className={styles.track} aria-pressed={item.id === track.id} onClick={() => choose(item.id)}>
          <span className={styles.trackCover}><Image src={`/images/landing/certifications/${item.id}.webp`} alt="" fill sizes="(max-width: 640px) 45vw, 200px" /></span>
          <span className={styles.trackName}>{item.title}</span>
          <span className={styles.trackMeta}>{count ? `${count} of ${item.steps.length} steps done` : `${item.steps.length} steps · ${item.certificates.length} ${item.certificates.length === 1 ? "certificate" : "certificates"}`}</span>
        </button>
      </li>; })}
    </ul></nav>

    <TrackDetail key={track.id} track={track} done={new Set(done[track.id] ?? [])} onToggle={toggle} />
  </div>;
}

function TrackDetail({ track, done, onToggle }: { track: CertTrack; done: Set<number>; onToggle: (step: number) => void }) {
  const percent = Math.round((done.size / track.steps.length) * 100);
  const next = track.steps.findIndex((_, at) => !done.has(at));
  const material = useTrackContent(track.id);
  const content = material.status === "ready" ? material.content : null;
  const questions = content ? content.steps.reduce((sum, step) => sum + step.objective.length + step.subjective.length, 0) : 0;
  return <section className={styles.detail} aria-labelledby="cert-track-title">
    <div className={styles.overview}>
      <div>
        <h2 id="cert-track-title">{track.title}</h2>
        <p className={styles.tagline}>{track.tagline}</p>
        <dl className={styles.facts}>
          <div><dt><Users size={14} aria-hidden="true" />Who it is for</dt><dd>{track.who}</dd></div>
          <div><dt><CalendarClock size={14} aria-hidden="true" />How long</dt><dd>{track.duration}</dd></div>
        </dl>
      </div>
      <div className={styles.progress}>
        <p><b>{percent}%</b> complete</p>
        <div className={styles.bar} role="progressbar" aria-label={`${track.title} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{ width: `${percent}%` }} /></div>
        <small>{next === -1 ? "Every step done. Time to book the exam." : `Next: step ${next + 1}, ${track.steps[next].title}`}</small>
      </div>
    </div>

    <h3 className={styles.heading}><BadgeCheck size={17} aria-hidden="true" />Certificates on this path</h3>
    <ul className={styles.certs}>
      {track.certificates.map(cert => <li key={cert.name} className={styles.cert}>
        <span className={styles.level} data-level={cert.level}>{cert.level}</span>
        <h4>{cert.name}</h4>
        <p className={styles.provider}>{cert.provider}{cert.code && <> · <code>{cert.code}</code></>}</p>
        <p className={styles.format}>{cert.format}</p>
        {cert.note && <p className={styles.note}>{cert.note}</p>}
        <a className={styles.official} href={cert.url} target="_blank" rel="noopener noreferrer">Official page<ArrowUpRight size={13} aria-hidden="true" /><span className={styles.srOnly}> (opens in a new tab)</span></a>
      </li>)}
    </ul>

    <h3 className={styles.heading}><ListChecks size={17} aria-hidden="true" />Step-by-step path{content && <span className={styles.headingNote}>{questions} questions with answers · lessons · workflows</span>}</h3>
    {material.status === "loading" && <p className={styles.notice} role="status">Loading the study material for this path…</p>}
    {material.status === "pending" && <p className={styles.notice}>The full lessons and question bank for this path are being prepared. The steps below already show what to learn, build and check.</p>}
    {material.status === "locked" && <p className={styles.notice}>Lessons, question banks and mock exams are part of the membership. <Link href="/dashboard/plans">See plans</Link></p>}
    {material.status === "error" && <p className={styles.notice} role="alert">The study material could not be loaded. Refresh the page to try again.</p>}
    {content?.source && <p className={styles.sourceTag}>{content.source}</p>}
    <ol className={styles.steps}>
      {track.steps.map((step, at) => { const finished = done.has(at); return <li key={step.title} className={styles.step} data-done={finished || undefined}>
        <details open={at === (next === -1 ? 0 : next)}>
          <summary>
            <span className={styles.number} aria-hidden="true">{finished ? <Check size={15} /> : at + 1}</span>
            <span className={styles.stepTitle}>{step.title}<small>{step.weeks}</small></span>
          </summary>
          <div className={styles.stepBody}>
            <div><h5><Lightbulb size={14} aria-hidden="true" />Learn</h5><ul>{step.learn.map(item => <li key={item}>{item}</li>)}</ul></div>
            <div><h5><Hammer size={14} aria-hidden="true" />Build</h5><p>{step.practice}</p></div>
            <div><h5><ClipboardCheck size={14} aria-hidden="true" />Checkpoint</h5><p>{step.checkpoint}</p></div>
            {content?.steps[at] && <StepStudy step={content.steps[at]} number={at + 1} />}
            <label className={styles.doneToggle}><input type="checkbox" checked={finished} onChange={() => onToggle(at)} />Mark step {at + 1} as done</label>
          </div>
        </details>
      </li>; })}
    </ol>

    {content && <MockExam content={content} title={track.title} />}

    <h3 className={styles.heading}><Award size={17} aria-hidden="true" />Exam-day tips</h3>
    <ul className={styles.tips}>{track.examTips.map(tip => <li key={tip}>{tip}</li>)}</ul>
    {track.source && <p className={styles.source}>{track.source}</p>}
  </section>;
}
