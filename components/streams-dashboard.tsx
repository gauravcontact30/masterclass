"use client";
import { useState, type CSSProperties } from "react";
import { ArrowLeft, CheckCircle2, Circle, CirclePlay, MonitorPlay, SkipBack, SkipForward, TriangleAlert } from "lucide-react";
import { RouteH1 } from "./route-heading";
import { useLanguage } from "./language-provider";
import { useIndiaAccess } from "./audience-provider";
import { StepList, StreamPlayer, useStreamProgress } from "./streams-player";
import { QualityBadge, StreamExplorer } from "./streams-explorer";
import { McbCover } from "./streams-cover";
import { GROUP_ICON, TECH_ICON } from "./streams-icons";
import { clockTime, courseTime, findStep, playlist, quality, STREAM_GROUPS, streamTotals, techInfo, techsIn, visibleGroups, type StreamGroup, type StreamStep, type StreamTech } from "@/lib/streams";
import styles from "./streams.module.css";

/**
 * Learning Dashboard · Streams (/learning/streams, 2026-11-26): every Master Class Buddy playlist, step by step.
 * Without ?tech it lists the playlists by category (?group= picks one: Tech, Board Exams, Government Exams, IELTS; the exam
 * categories only with exam access); ?tech=<id> opens one (explorer: search, icon filters, pages) and
 * ?tech=<id>&lesson=<id> plays a step with study notes, previous/next, "mark as watched" and progress kept in this
 * browser. The sidebar links to each playlist (streams-sidebar-nav.tsx); the URL follows what is open so it can be shared.
 */
export function StreamsDashboard({ initialTech, initialLesson, initialGroup }: { initialTech?: StreamTech; initialLesson?: string; initialGroup?: StreamGroup }) {
  const { language } = useLanguage(); const hi = language === "hi"; const tr = (en: string, hindi: string) => hi ? hindi : en;
  const india = useIndiaAccess(); const groups = visibleGroups(india); const techs = techsIn(groups);
  const start = findStep(initialLesson);
  const [chosenTech, setTech] = useState<StreamTech | null>(start?.tech ?? initialTech ?? null);
  const [open, setOpen] = useState<string | null>(start?.id ?? null);
  const [chosenGroup, setGroup] = useState<StreamGroup | "all">(initialGroup ?? "all");
  // Exam playlists appear once exam access is known; until then (or without it) a link to one shows the overview.
  const tech = chosenTech && techs.includes(chosenTech) ? chosenTech : null;
  const group = chosenGroup !== "all" && groups.includes(chosenGroup) ? chosenGroup : "all";
  const [playing, setPlaying] = useState(false);
  const { progress, toggleDone, markDone, open: remember } = useStreamProgress();
  const totals = streamTotals(techs); const stepWord = tr("Step", "चरण");

  const sync = (nextTech: StreamTech | null, lesson: string | null, nextGroup: StreamGroup | "all" = "all") => {
    const url = new URL(window.location.href);
    url.searchParams.delete("course");
    if (!nextTech && nextGroup !== "all") url.searchParams.set("group", nextGroup); else url.searchParams.delete("group");
    if (nextTech) url.searchParams.set("tech", nextTech); else url.searchParams.delete("tech");
    if (lesson) url.searchParams.set("lesson", lesson); else url.searchParams.delete("lesson");
    window.history.replaceState(window.history.state, "", url);
    requestAnimationFrame(() => document.getElementById("streams-top")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const showPlaylist = (next: StreamTech | null) => { setTech(next); setOpen(null); setPlaying(false); sync(next, null); };
  const showStep = (step: StreamStep, play: boolean) => { setTech(step.tech); setOpen(step.id); setPlaying(play); remember(step.tech, step.id); sync(step.tech, step.id); };
  const nextUnwatched = (t: StreamTech) => { const steps = playlist(t).steps; return steps.find(s => !progress.done[s.id]) ?? steps[0]; };
  const showGroup = (next: StreamGroup | "all") => { setGroup(next); setTech(null); setOpen(null); setPlaying(false); sync(null, null, next); };
  const lastStep = findStep(progress.last?.lesson); const last = lastStep && techs.includes(lastStep.tech) ? lastStep : undefined;
  const openStep = findStep(open ?? undefined); const step = openStep && techs.includes(openStep.tech) ? openStep : undefined;
  const railFor = (t: StreamTech) => techs.filter(id => techInfo(id).group === techInfo(t).group);

  return <div id="streams-top" className={styles.dashboard}>
    <header className={styles.dashHead}>
      <p className={styles.kicker}><MonitorPlay size={15} aria-hidden="true" />MCB Streams</p>
      <RouteH1>{tr("Learn it ", "सीखें ")}<em>{tr("step by step", "चरण दर चरण")}</em></RouteH1>
      <p className={styles.lede}>{tr(`${totals.playlists} playlists · ${totals.lessons} steps · ${courseTime(totals.seconds)}. Every step plays in Full HD or better; ${totals.uhd} are 4K Ultra HD.`,
        `${totals.playlists} प्लेलिस्ट · ${totals.lessons} चरण · ${courseTime(totals.seconds)}। हर चरण फ़ुल HD या बेहतर में; ${totals.uhd} चरण 4K अल्ट्रा HD में।`)}</p>
    </header>

    {step ? <StepView step={step} playing={playing} tr={tr} stepWord={stepWord} done={progress.done}
      onBack={() => showPlaylist(step.tech)} onPick={(s, play) => showStep(s, play)} onPlay={() => setPlaying(true)} onToggleDone={toggleDone} onFinish={markDone} />
    : tech ? <>
      <PlaylistHeader tech={tech} done={progress.done} tr={tr} onAll={() => showPlaylist(null)} onStart={() => showStep(nextUnwatched(tech), true)} />
      <StreamExplorer techs={railFor(tech)} tech={tech} onTech={showPlaylist} onPick={s => showStep(s, true)} pageSize={9} tr={tr} progress={progress.done} />
    </> : <>
      {last && <button type="button" className={styles.resume} onClick={() => showStep(last, false)} style={{ "--accent": playlist(last.tech).info.color } as CSSProperties}>
        <span className={styles.resumePoster}><McbCover tech={last.tech} step={last} size="sm" stepWord={stepWord} /></span>
        <span><small>{tr("Continue watching", "देखना जारी रखें")}</small><b>{last.title}</b><em>{playlist(last.tech).info.playlist} · {stepWord} {last.step}</em></span>
      </button>}
      <div className={styles.groupChips} role="group" aria-label={tr("Categories", "श्रेणियाँ")}>
        {(["all", ...groups] as const).map(g => { const Icon = g === "all" ? MonitorPlay : GROUP_ICON[g]; const info = STREAM_GROUPS.find(x => x.id === g);
          const count = g === "all" ? techs.length : techs.filter(t => techInfo(t).group === g).length;
          return <button key={g} type="button" aria-pressed={group === g} onClick={() => showGroup(g)}><span><Icon size={15} aria-hidden="true" /></span>{info ? tr(info.name, info.hi) : tr("All", "सभी")}<small>{count}</small></button>; })}
      </div>
      {groups.filter(g => group === "all" || group === g).map(g => { const info = STREAM_GROUPS.find(x => x.id === g)!; const inGroup = techs.filter(t => techInfo(t).group === g); const GroupIcon = GROUP_ICON[g];
        return <section key={g} className={styles.groupSection} aria-labelledby={`streams-group-${g}`}>
          <h2 id={`streams-group-${g}`}><GroupIcon size={18} aria-hidden="true" />{tr(info.name, info.hi)}<small>{inGroup.length} {tr("playlists", "प्लेलिस्ट")}</small></h2>
          <ul className={styles.playlists} aria-label={tr(info.name, info.hi)}>
        {inGroup.map(id => { const p = playlist(id); const watched = p.steps.filter(s => progress.done[s.id]).length; const Icon = TECH_ICON[id];
          return <li key={id} style={{ "--accent": p.info.color } as CSSProperties}>
            <button type="button" onClick={() => showPlaylist(id)}>
              <McbCover tech={id} stepsWord={tr("steps", "चरण")} />
              <span className={styles.playlistBody}>
                <span className={styles.playlistTech}><Icon size={13} aria-hidden="true" />{p.info.name}{p.info.status ? ` · ${tr("legacy", "पुराना")}` : ""}</span>
                <b>{p.info.playlist}</b>
                <span className={styles.playlistMeta}>{p.chapters.length} {tr("chapters", "अध्याय")} · {p.steps.length} {tr("steps", "चरण")} · {courseTime(p.seconds)}</span>
                <span className={styles.bar} role="img" aria-label={tr(`${watched} of ${p.steps.length} steps watched`, `${p.steps.length} में से ${watched} चरण देखे`)}><span style={{ width: `${(watched / p.steps.length) * 100}%` }} /></span>
              </span>
            </button>
          </li>; })}
          </ul>
        </section>; })}
    </>}
  </div>;
}

function PlaylistHeader({ tech, done, tr, onAll, onStart }: { tech: StreamTech; done: Record<string, true>; tr: (en: string, hi: string) => string; onAll: () => void; onStart: () => void }) {
  const p = playlist(tech); const Icon = TECH_ICON[tech]; const watched = p.steps.filter(s => done[s.id]).length;
  return <div className={styles.playlistHeader} style={{ "--accent": p.info.color } as CSSProperties}>
    <button type="button" className={styles.back} onClick={onAll}><ArrowLeft size={15} aria-hidden="true" />{tr("All playlists", "सभी प्लेलिस्ट")}</button>
    <div className={styles.playlistHero}>
      <span className={styles.heroIcon}><Icon size={26} aria-hidden="true" /></span>
      <div>
        <h2>{p.info.playlist}</h2>
        <p>{p.info.tagline}</p>
        <p className={styles.meta}><span>{p.chapters.length} {tr("chapters", "अध्याय")}</span><span>{p.steps.length} {tr("steps", "चरण")}</span><span>{courseTime(p.seconds)}</span><span>{watched}/{p.steps.length} {tr("watched", "देखे")}</span></p>
      </div>
      <button type="button" className={styles.cta} onClick={onStart}><CirclePlay size={17} aria-hidden="true" />{watched ? tr("Continue", "जारी रखें") : tr("Start step 1", "चरण 1 शुरू करें")}</button>
    </div>
    {p.info.status && <p className={styles.warn}><TriangleAlert size={15} aria-hidden="true" />{p.info.status}</p>}
  </div>;
}

function StepView({ step, playing, done, tr, stepWord, onBack, onPick, onPlay, onToggleDone, onFinish }: {
  step: StreamStep; playing: boolean; done: Record<string, true>; tr: (en: string, hi: string) => string; stepWord: string;
  onBack: () => void; onPick: (step: StreamStep, play: boolean) => void; onPlay: () => void; onToggleDone: (id: string) => void; onFinish: (id: string) => void;
}) {
  const p = playlist(step.tech); const index = step.step - 1; const prev = p.steps[index - 1], next = p.steps[index + 1];
  const watched = p.steps.filter(s => done[s.id]).length;
  return <div className={styles.courseView} style={{ "--accent": p.info.color } as CSSProperties}>
    <button type="button" className={styles.back} onClick={onBack}><ArrowLeft size={15} aria-hidden="true" />{p.info.playlist}</button>
    <div className={styles.stage}>
      <div className={styles.main}>
        <StreamPlayer step={step} playing={playing} onPlay={onPlay} label={tr("Play", "चलाएँ")} stepWord={stepWord} />
        <div className={styles.controls}>
          <button type="button" disabled={!prev} onClick={() => prev && onPick(prev, true)}><SkipBack size={15} aria-hidden="true" />{tr("Previous", "पिछला")}</button>
          <button type="button" aria-pressed={Boolean(done[step.id])} onClick={() => onToggleDone(step.id)}>{done[step.id] ? <CheckCircle2 size={15} aria-hidden="true" /> : <Circle size={15} aria-hidden="true" />}{done[step.id] ? tr("Watched", "देखा गया") : tr("Mark as watched", "देखा हुआ चिह्नित करें")}</button>
          <button type="button" disabled={!next} onClick={() => { onFinish(step.id); if (next) onPick(next, true); }}>{tr("Next step", "अगला चरण")}<SkipForward size={15} aria-hidden="true" /></button>
        </div>
        <div className={styles.nowPlaying}>
          <p className={styles.meta}><span>{p.info.name}</span><span>{stepWord} {step.step} / {p.steps.length}</span><span>{tr("Chapter", "अध्याय")} {step.chapterNo}: {step.chapter.title}</span><span>{step.level}</span><span>{clockTime(step.seconds)}</span><QualityBadge value={quality(step.id)} /></p>
          <h2>{step.title}</h2>
          {p.info.status && <p className={styles.warn}><TriangleAlert size={15} aria-hidden="true" />{p.info.status}</p>}
          <h3 className={styles.notesHead}>{tr("Study notes", "अध्ययन नोट्स")}</h3>
          <ul className={styles.points}>{step.points.map(point => <li key={point}>{point}</li>)}</ul>
          {step.chapter.note && <p className={styles.note}>{step.chapter.note}</p>}
        </div>
      </div>
      <aside className={styles.side} aria-label={tr("Playlist steps", "प्लेलिस्ट के चरण")}>
        <div className={styles.courseHead}><b>{p.info.playlist}</b><small>{p.steps.length} {tr("steps", "चरण")} · {courseTime(p.seconds)} · {watched}/{p.steps.length} {tr("watched", "देखे")}</small></div>
        <StepList steps={p.steps} active={step.id} done={done} onPick={s => onPick(s, true)} chapters label={tr("Playlist steps", "प्लेलिस्ट के चरण")} stepWord={stepWord} />
      </aside>
    </div>
  </div>;
}
