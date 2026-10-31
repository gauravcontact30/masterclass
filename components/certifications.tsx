"use client";
import Image from "@/components/responsive-image";
import Link from "next/link";
import { useId, useMemo, useState, useSyncExternalStore } from "react";
import { ArrowRight, Award, BadgeCheck, BookOpen, Bot, CalendarClock, Check, CheckCircle2, ChevronsDownUp, ChevronsUpDown, Cloud, ClipboardCheck, Clock, GraduationCap, Hammer, HelpCircle, Info, Layers, Lightbulb, ListChecks, Search, Sparkles, Target, Users, Wallet, X, type LucideIcon } from "lucide-react";
import { CERT_CATEGORIES, CERTIFICATION_TRACKS, certificationTrack, type CertCategory, type CertLevel, type CertTrack } from "@/lib/certifications";
import { MockExam, StepStudy, useTrackContent } from "./certification-study";
import { ListenButton } from "./listen-button";
import styles from "./certifications.module.css";

/*
 * The Learning Dashboard's Certifications page: browse nine tracks grouped as cloud and infrastructure, AI and
 * automation, and software architecture (filter by group or search titles, certificates and exam codes), see the
 * certificates a track leads to (exam code, format, time and fee) and follow its step-by-step path from
 * the first lesson to exam day. Ticked steps are kept in this browser (localStorage), read through
 * useSyncExternalStore so the server render and the first client render agree. `?track=<id>` opens a track
 * directly (the landing cards link there).
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

const CATEGORY_ICON: Record<CertCategory, typeof Cloud> = { "Cloud & Infrastructure": Cloud, "AI & Automation": Bot, "Software Architecture": Layers };
const LEVEL_ORDER: CertLevel[] = ["Foundational", "Associate", "Professional", "Specialty", "Course certificate"];
const ALL_CERTIFICATES = new Set(CERTIFICATION_TRACKS.flatMap(track => track.certificates.map(cert => cert.name)));
const PROVIDERS = new Set(CERTIFICATION_TRACKS.flatMap(track => track.certificates.map(cert => cert.provider.split(" · ")[0].replace(/ Academy$/, ""))));
const TOTAL_STEPS = CERTIFICATION_TRACKS.reduce((sum, track) => sum + track.steps.length, 0);

/** Everything a search can match on a track: its words, its certificates, their providers and exam codes. */
const haystack = (track: CertTrack) => [track.title, track.tagline, track.category, ...track.certificates.flatMap(cert => [cert.name, cert.provider, cert.code ?? ""])].join(" ").toLowerCase();
const SEARCH_INDEX = new Map(CERTIFICATION_TRACKS.map(track => [track.id, haystack(track)]));

export function Certifications({ initialTrack }: { initialTrack?: string }) {
  const [trackId, setTrackId] = useState(certificationTrack(initialTrack ?? "")?.id ?? CERTIFICATION_TRACKS[0].id);
  const [category, setCategory] = useState<CertCategory | "all">("all");
  const [query, setQuery] = useState("");
  const raw = useSyncExternalStore(subscribe, readRaw, () => "{}");
  const done = useMemo(() => parse(raw), [raw]);
  const track = certificationTrack(trackId) ?? CERTIFICATION_TRACKS[0];
  const searchId = useId();

  const choose = (id: string, scroll = false) => {
    setTrackId(id);
    const url = new URL(window.location.href); url.searchParams.set("track", id); window.history.replaceState(window.history.state, "", url);
    if (scroll) requestAnimationFrame(() => document.getElementById("cert-track")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const toggle = (step: number) => {
    const current = new Set(done[track.id] ?? []);
    if (current.has(step)) current.delete(step); else current.add(step);
    save({ ...done, [track.id]: [...current].sort((a, b) => a - b) });
  };

  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const visible = CERTIFICATION_TRACKS.filter(item => (category === "all" || item.category === category) && words.every(word => SEARCH_INDEX.get(item.id)!.includes(word)));
  const stepsDone = CERTIFICATION_TRACKS.reduce((sum, item) => sum + Math.min(done[item.id]?.length ?? 0, item.steps.length), 0);
  const started = CERTIFICATION_TRACKS.filter(item => (done[item.id]?.length ?? 0) > 0);
  // The furthest-along path that is not finished yet is the one to pick up again.
  const resume = started.filter(item => (done[item.id]?.length ?? 0) < item.steps.length)
    .sort((a, b) => (done[b.id]!.length / b.steps.length) - (done[a.id]!.length / a.steps.length))[0];

  return <div className={styles.page}>
    <header className={styles.hero}>
      <div className={styles.heroText}>
        <p className={styles.eyebrow}><Award size={14} aria-hidden="true" />Professional Learn · Certifications</p>
        <h1>Certification paths, <em>step by step</em></h1>
        <p>Pick a certification, follow its weekly steps from the first lesson to exam day, and tick each one off as you finish it. Each certificate shows its exam code, format, time and fee, so you know exactly what you are preparing for.</p>
        {resume && <button type="button" className={styles.resume} onClick={() => choose(resume.id, true)}>
          Continue {resume.title}<span>{done[resume.id]!.length} of {resume.steps.length} steps done</span><ArrowRight size={16} aria-hidden="true" />
        </button>}
      </div>
      <dl className={styles.stats}>
        <div><dt>Paths</dt><dd>{CERTIFICATION_TRACKS.length}</dd></div>
        <div><dt>Certificates</dt><dd>{ALL_CERTIFICATES.size}</dd></div>
        <div><dt>Providers</dt><dd>{PROVIDERS.size}</dd></div>
        <div><dt>Your steps done</dt><dd>{stepsDone}<small> / {TOTAL_STEPS}</small></dd></div>
      </dl>
    </header>

    <section className={styles.browser} aria-labelledby="cert-browse-title">
      <div className={styles.browserHead}>
        <h2 id="cert-browse-title">Choose a path</h2>
        <div className={styles.filters} role="group" aria-label="Filter paths by area">
          <button type="button" aria-pressed={category === "all"} onClick={() => setCategory("all")}><Sparkles size={14} aria-hidden="true" />All<b>{CERTIFICATION_TRACKS.length}</b></button>
          {CERT_CATEGORIES.map(name => { const Icon = CATEGORY_ICON[name]; return <button key={name} type="button" aria-pressed={category === name} onClick={() => setCategory(name)}>
            <Icon size={14} aria-hidden="true" />{name}<b>{CERTIFICATION_TRACKS.filter(item => item.category === name).length}</b>
          </button>; })}
        </div>
        <div className={styles.search}>
          <label htmlFor={searchId} className={styles.srOnly}>Search paths, certificates and exam codes</label>
          <Search size={15} aria-hidden="true" />
          <input id={searchId} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search: Kubernetes, AZ-305, LangGraph…" autoComplete="off" />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={14} /></button>}
        </div>
      </div>
      <p className={styles.srOnly} role="status">{visible.length} {visible.length === 1 ? "path" : "paths"} shown</p>

      {visible.length === 0 && <p className={styles.empty}>No path matches “{query}”. <button type="button" onClick={() => { setQuery(""); setCategory("all"); }}>Show all paths</button></p>}
      {CERT_CATEGORIES.map(name => {
        const group = visible.filter(item => item.category === name);
        if (!group.length) return null;
        const Icon = CATEGORY_ICON[name];
        return <div key={name} className={styles.group}>
          <h3 className={styles.groupTitle}><Icon size={16} aria-hidden="true" />{name}<small>{group.length} {group.length === 1 ? "path" : "paths"}</small></h3>
          <nav aria-label={`${name} certification tracks`}><ul className={styles.tracks}>
            {group.map(item => { const count = Math.min(done[item.id]?.length ?? 0, item.steps.length); return <li key={item.id}>
              <button type="button" className={styles.track} aria-pressed={item.id === track.id} onClick={() => choose(item.id, true)}>
                <span className={styles.trackCover}><Image src={`/images/landing/certifications/${item.id}.webp`} alt="" fill sizes="(max-width: 640px) 90vw, 260px" /></span>
                <span className={styles.trackName}>{item.title}</span>
                {item.isNew && <span className={styles.newMark}>New</span>}
                <span className={styles.trackMeta}>{count ? `${count} of ${item.steps.length} steps done` : `${item.steps.length} steps · ${item.certificates.length} ${item.certificates.length === 1 ? "certificate" : "certificates"}`}</span>
                <span className={styles.trackBar} aria-hidden="true"><span style={{ width: `${(count / item.steps.length) * 100}%` }} /></span>
              </button>
            </li>; })}
          </ul></nav>
        </div>;
      })}
    </section>

    <TrackDetail key={track.id} track={track} done={new Set(done[track.id] ?? [])} onToggle={toggle} />
  </div>;
}

/** An exam fact ("65 questions", "130 minutes", "USD 150", "pass 720/1000") with an icon that says what it is. */
function factIcon(fact: string): LucideIcon {
  if (/question/i.test(fact)) return HelpCircle;
  if (/minute|hour/i.test(fact)) return Clock;
  if (/usd|inr|eur|₹|\$|free|fee/i.test(fact)) return Wallet;
  if (/pass|score/i.test(fact)) return Target;
  return CheckCircle2;
}

function TrackDetail({ track, done, onToggle }: { track: CertTrack; done: Set<number>; onToggle: (step: number) => void }) {
  const percent = Math.round((done.size / track.steps.length) * 100);
  const next = track.steps.findIndex((_, at) => !done.has(at));
  const [open, setOpen] = useState<Set<number>>(() => new Set([next === -1 ? 0 : next]));
  const material = useTrackContent(track.id);
  const content = material.status === "ready" ? material.content : null;
  const questions = content ? content.steps.reduce((sum, step) => sum + step.objective.length + step.subjective.length, 0) : 0;
  const certificates = [...track.certificates].sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level));
  const Icon = CATEGORY_ICON[track.category];
  const setStepOpen = (at: number, value: boolean) => setOpen(current => { if (current.has(at) === value) return current; const nextOpen = new Set(current); if (value) nextOpen.add(at); else nextOpen.delete(at); return nextOpen; });
  const goToNext = () => {
    if (next === -1) return;
    setStepOpen(next, true);
    requestAnimationFrame(() => { const summary = document.getElementById(`cert-step-${next + 1}`)?.querySelector("summary"); summary?.scrollIntoView({ behavior: "smooth", block: "center" }); summary?.focus({ preventScroll: true }); });
  };

  return <section id="cert-track" className={styles.detail} aria-labelledby="cert-track-title">
    <div className={styles.overview}>
      <div>
        <p className={styles.chips}><span className={styles.category}><Icon size={13} aria-hidden="true" />{track.category}</span>{track.isNew && <span className={styles.newChip}>New path</span>}</p>
        <div className={styles.titleRow}><h2 id="cert-track-title">{track.title}</h2>
          <ListenButton id={`cert:${track.id}`} title={track.title} text={() => [track.title, track.tagline, `Who it is for: ${track.who}`, `How long: ${track.duration}`, `The certificates on this path: ${track.certificates.map(cert => cert.name).join(", ")}`, `The ${track.steps.length} steps: ${track.steps.map((step, at) => `Step ${at + 1}, ${step.title}`).join(". ")}`].join(". ")} /></div>
        <p className={styles.tagline}>{track.tagline}</p>
        <dl className={styles.facts}>
          <div><dt><Users size={14} aria-hidden="true" />Who it is for</dt><dd>{track.who}</dd></div>
          <div><dt><CalendarClock size={14} aria-hidden="true" />How long</dt><dd>{track.duration}</dd></div>
          <div><dt><ListChecks size={14} aria-hidden="true" />Steps</dt><dd>{track.steps.length} weekly steps, each with a build task and a checkpoint</dd></div>
          <div><dt><BadgeCheck size={14} aria-hidden="true" />Certificates</dt><dd>{track.certificates.length} from {new Set(track.certificates.map(cert => cert.provider)).size === 1 ? track.certificates[0].provider : `${new Set(track.certificates.map(cert => cert.provider)).size} providers`}</dd></div>
        </dl>
      </div>
      <div className={styles.side}>
      <span className={styles.overviewCover}><Image src={`/images/landing/certifications/${track.id}.webp`} alt="" fill sizes="(max-width: 760px) 100vw, 300px" /></span>
      <div className={styles.progress}>
        <p><b>{percent}%</b> complete</p>
        <div className={styles.bar} role="progressbar" aria-label={`${track.title} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{ width: `${percent}%` }} /></div>
        <small>{next === -1 ? "Every step done. Time to book the exam." : `Next: step ${next + 1}, ${track.steps[next].title}`}</small>
        {next !== -1 && <button type="button" className={styles.nextButton} onClick={goToNext}>Go to step {next + 1}<ArrowRight size={14} aria-hidden="true" /></button>}
      </div>
      </div>
    </div>

    <nav className={styles.jump} aria-label="On this path">
      <a href="#cert-certificates"><BadgeCheck size={14} aria-hidden="true" />Certificates</a>
      <a href="#cert-path"><ListChecks size={14} aria-hidden="true" />Step-by-step path</a>
      {content && <a href="#cert-mock"><GraduationCap size={14} aria-hidden="true" />Mock exam</a>}
      <a href="#cert-tips"><Award size={14} aria-hidden="true" />Exam-day tips</a>
    </nav>

    <h3 id="cert-certificates" className={styles.heading}><BadgeCheck size={17} aria-hidden="true" />Certificates on this path<span className={styles.headingNote}>From first level to most advanced</span></h3>
    <ul className={styles.certs}>
      {certificates.map(cert => <li key={cert.name} className={styles.cert} data-level={cert.level}>
        <div className={styles.certTop}>
          <span className={styles.certBadge} aria-hidden="true"><Award size={18} /></span>
          <span className={styles.level} data-level={cert.level}>{cert.level}</span>
        </div>
        <h4>{cert.name}</h4>
        <p className={styles.provider}>{cert.provider}{cert.code && <> · <code>{cert.code}</code></>}</p>
        <ul className={styles.format} aria-label="Exam format">{cert.format.split(/\s*·\s*/).filter(Boolean).map(fact => { const FactIcon = factIcon(fact); return <li key={fact}><FactIcon size={13} aria-hidden="true" />{fact}</li>; })}</ul>
        {cert.note && <p className={styles.note}><Info size={14} aria-hidden="true" /><span>{cert.note}</span></p>}
      </li>)}
    </ul>

    <div className={styles.pathHead}>
      <h3 id="cert-path" className={styles.heading}><ListChecks size={17} aria-hidden="true" />Step-by-step path{content && <span className={styles.headingNote}>{questions} questions with answers · lessons · workflows</span>}</h3>
      <div className={styles.pathTools}>
        <button type="button" onClick={() => setOpen(new Set(track.steps.map((_, at) => at)))}><ChevronsUpDown size={14} aria-hidden="true" />Expand all</button>
        <button type="button" onClick={() => setOpen(new Set())}><ChevronsDownUp size={14} aria-hidden="true" />Collapse all</button>
      </div>
    </div>
    {material.status === "loading" && <p className={styles.notice} role="status">Loading the study material for this path…</p>}
    {material.status === "pending" && <p className={styles.notice}><BookOpen size={15} aria-hidden="true" />The full lessons and question bank for this path are being prepared. The steps below already show what to learn, build and check.</p>}
    {material.status === "locked" && <p className={styles.notice}>Lessons, question banks and mock exams are part of the membership. <Link href="/learning/plans">See plans</Link></p>}
    {material.status === "error" && <p className={styles.notice} role="alert">The study material could not be loaded. Refresh the page to try again.</p>}
    {content?.source && <p className={styles.sourceTag}>{content.source}</p>}
    <ol className={styles.steps}>
      {track.steps.map((step, at) => { const finished = done.has(at); return <li key={step.title} id={`cert-step-${at + 1}`} className={styles.step} data-done={finished || undefined} data-next={at === next || undefined}>
        <details open={open.has(at)} onToggle={event => setStepOpen(at, event.currentTarget.open)}>
          <summary>
            <span className={styles.number} aria-hidden="true">{finished ? <Check size={15} /> : at + 1}</span>
            <span className={styles.stepTitle}>{step.title}<small>{step.weeks}</small></span>
            <span className={styles.stepState}>{finished ? "Done" : at === next ? "Up next" : ""}</span>
          </summary>
          <div className={styles.stepBody}>
            <p className={`${styles.stepListen} ${styles.stepWide}`}><ListenButton id={`cert:${track.id}:step:${at + 1}`} title={`Step ${at + 1}: ${step.title}`} compact
              text={() => [`Step ${at + 1}. ${step.title}`, `What to learn: ${step.learn.join(". ")}`, `Build: ${step.practice}`, `Checkpoint: ${step.checkpoint}`].join(". ")} />Listen to this step</p>
            <div className={styles.panel} data-kind="learn"><h5><Lightbulb size={14} aria-hidden="true" />Learn</h5><ul className={styles.checks}>{step.learn.map(item => <li key={item}><Check size={13} aria-hidden="true" /><span>{item}</span></li>)}</ul></div>
            <div className={styles.panel} data-kind="build"><h5><Hammer size={14} aria-hidden="true" />Build</h5><p>{step.practice}</p></div>
            <div className={styles.panel} data-kind="check"><h5><ClipboardCheck size={14} aria-hidden="true" />Checkpoint</h5><p>{step.checkpoint}</p></div>
            {content?.steps[at] && <StepStudy step={content.steps[at]} number={at + 1} listenId={`cert:${track.id}:step:${at + 1}`} />}
            <label className={styles.doneToggle}><input type="checkbox" checked={finished} onChange={() => onToggle(at)} />Mark step {at + 1} as done</label>
          </div>
        </details>
      </li>; })}
    </ol>

    {content && <div id="cert-mock" className={styles.mockAnchor}><MockExam content={content} title={track.title} /></div>}

    <h3 id="cert-tips" className={styles.heading}><Award size={17} aria-hidden="true" />Exam-day tips<ListenButton id={`cert:${track.id}:tips`} title={`${track.title}: exam-day tips`} text={() => ["Exam-day tips", ...track.examTips].join(". ")} compact /></h3>
    <ul className={styles.tips}>{track.examTips.map(tip => <li key={tip}><Lightbulb size={16} aria-hidden="true" /><span>{tip}</span></li>)}</ul>
    {track.source && <p className={styles.source}>{track.source}</p>}
  </section>;
}
