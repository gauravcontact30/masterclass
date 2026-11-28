"use client";
import { useDeferredValue, useEffect, useId, useMemo, useState, type CSSProperties } from "react";
import Link from "@/components/site-link";
import { ArrowLeft, ArrowRight, BookOpenText, CheckCircle2, ChevronLeft, ChevronRight, Circle, CirclePlay, Clock, LayoutGrid, Layers, ListVideo, MonitorPlay, Search, SkipBack, SkipForward, Sparkles, TriangleAlert, X } from "lucide-react";
import { useIndiaAccess } from "./audience-provider";
import { pageWindow, QualityBadge } from "./streams-explorer";
import { McbCover } from "./streams-cover";
import { canWatch, useStreamAccess } from "./streams-access";
import { StepList, StreamPlayer, useStreamProgress } from "./streams-player";
import { GROUP_ICON, TECH_ICON } from "./streams-icons";
import { clockTime, courseTime, findStep, isTech, playlist, quality, STREAM_GROUPS, streamsHref, streamTotals, suggest, techInfo, techsIn, visibleGroups, type StreamGroup, type StreamStep, type StreamTech, type Suggestion } from "@/lib/streams";
import styles from "./streams-hub.module.css";
import search from "./streams-explorer.module.css";
import player from "./streams.module.css";

/*
 * MCB Streams (/streams, user request 2026-11-26): every Master Class Buddy playlist on one public page, category by
 * category (Tech, Board Exams, Government Exams, IELTS; the exam categories only with exam access), each in its own
 * light colour and split into sub-groups. Opening a course (?playlist=<id>&step=<id>) plays any of its steps here, with
 * previous/next, "mark as watched", an up-next list and every step by chapter in numbered pages.
 */
const GROUP_COPY: Record<StreamGroup, { lede: string; parts?: { title: string; ids: StreamTech[] }[] }> = {
  tech: { lede: "For tech professionals: languages, frameworks, testing, backends, AI agents, the cloud, DevOps, DSA and system design, from zero to production.",
    parts: [
      { title: "Web development", ids: ["nextjs", "react", "typescript", "modernjs", "tanstack", "zustand"] },
      { title: "Testing", ids: ["testing", "playwright"] },
      { title: "Python and backend", ids: ["python", "fastapi", "nestjs"] },
      { title: "AI agents", ids: ["langchain", "langgraph", "langsmith", "langflow", "langserve", "n8n"] },
      { title: "Cloud and DevOps", ids: ["aws", "devops-aws", "devops"] },
      { title: "Problem solving and architecture", ids: ["dsa", "sysdesign"] },
    ] },
  board: { lede: "For CBSE, ICSE and ISC Class 10 and 12 board exam students: Maths, Physics, Chemistry and English, chapter by chapter.",
    parts: [
      { title: "CBSE Class 10", ids: ["board10-maths", "board10-physics", "board10-chemistry", "board10-english"] },
      { title: "CBSE Class 12", ids: ["board12-maths", "board12-physics", "board12-chemistry", "board12-english"] },
      { title: "ICSE Class 10", ids: ["icse10-maths", "icse10-physics", "icse10-chemistry", "icse10-english"] },
      { title: "ISC Class 12", ids: ["isc12-maths", "isc12-physics", "isc12-chemistry", "isc12-english"] },
    ] },
  exams: { lede: "For government and professional exam aspirants: civil services, SSC, defence, banking, railways, police, teaching and CA.",
    parts: [
      { title: "Civil services", ids: ["upsc", "ias", "pcs"] },
      { title: "SSC, police and investigation", ids: ["ssc", "police", "cbi", "incometax"] },
      { title: "Defence", ids: ["nda", "defence"] },
      { title: "Banking and railways", ids: ["bankpo", "railways"] },
      { title: "Teaching and professional", ids: ["ctet", "ca"] },
    ] },
  ielts: { lede: "For study and work abroad: all four IELTS skills, with tips for a higher band." },
};

export function StreamsHub() {
  const india = useIndiaAccess(); const groups = visibleGroups(india); const techs = techsIn(groups);
  const [openId, setOpenId] = useState<StreamTech | null>(null);
  const [stepId, setStepId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const { progress, toggleDone, markDone, open: remember } = useStreamProgress();
  const totals = streamTotals(techs);
  const open = openId && techs.includes(openId) ? openId : null;

  // ?playlist=<id>&step=<id> opens a playlist on arrival (read after hydration so the page itself stays static).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search); const id = params.get("playlist"); const step = findStep(params.get("step") ?? undefined);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restores the playlist named in the URL after hydration.
    if (isTech(id)) { setOpenId(id); if (step?.tech === id) setStepId(step.id); }
  }, []);
  const sync = (id: StreamTech | null, step: string | null, target = "streams-hub-top") => {
    const url = new URL(window.location.href); url.hash = "";
    if (id) url.searchParams.set("playlist", id); else url.searchParams.delete("playlist");
    if (step) url.searchParams.set("step", step); else url.searchParams.delete("step");
    window.history.replaceState(window.history.state, "", url);
    requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const openPlaylist = (id: StreamTech | null, step?: StreamStep) => { setOpenId(id); setStepId(step?.id ?? null); setPlaying(Boolean(step)); sync(id, step?.id ?? null); };
  // Every step plays here; the player scrolls into view and the dashboard remembers where you are.
  const pickStep = (step: StreamStep) => {
    if (step.tech !== open) setOpenId(step.tech);
    setStepId(step.id); setPlaying(true); remember(step.tech, step.id); sync(step.tech, step.id, "streams-hub-player");
  };

  return <div id="streams-hub-top" className={styles.hub}>
    {open ? <PlaylistView tech={open} stepId={stepId} playing={playing} done={progress.done} onBack={() => openPlaylist(null)} onPick={pickStep} onPlay={() => setPlaying(true)} onToggleDone={toggleDone} onFinish={markDone} />
    : <>
      <section className={styles.hero} aria-labelledby="streams-hub-title">
        <p className={styles.kicker}><MonitorPlay size={15} aria-hidden="true" />MCB Streams</p>
        <h1 id="streams-hub-title">Learn step by step, <em>in Ultra HD.</em></h1>
        <p className={styles.lede}>Video playlists that take you from the first lesson to exam-ready, one step at a time. Every step plays in Full HD or better, with study notes beside it. The first step of every course is free. Members watch every step, with notes and their place remembered.</p>
        <ul className={styles.stats}>
          <li><b>{totals.playlists}</b>playlists</li><li><b>{totals.lessons}</b>steps</li><li><b>{courseTime(totals.seconds).replace(/ \d+ min$/, "")}</b>of learning</li><li><b>{totals.uhd}</b>in 4K Ultra HD</li>
        </ul>
        <HubSearch techs={techs} onPlaylist={id => openPlaylist(id)} onStep={pickStep} />
        <nav className={styles.jump} aria-label="Categories">
          {groups.map(g => { const info = STREAM_GROUPS.find(x => x.id === g)!; const Icon = GROUP_ICON[g]; const n = techs.filter(t => techInfo(t).group === g).length;
            return <a key={g} href={`#${g}`} data-group={g}><span><Icon size={16} aria-hidden="true" /></span>{info.name}<small>{n}</small></a>; })}
        </nav>
      </section>

      {groups.map(g => { const info = STREAM_GROUPS.find(x => x.id === g)!; const Icon = GROUP_ICON[g]; const copy = GROUP_COPY[g];
        const inGroup = techs.filter(t => techInfo(t).group === g);
        const parts = (copy.parts ?? [{ title: "", ids: inGroup }]).map(p => ({ ...p, ids: p.ids.filter(id => inGroup.includes(id)) })).filter(p => p.ids.length);
        // Anything in the category that no sub-group names still shows, at the end.
        const named = new Set(parts.flatMap(p => p.ids)); const rest = inGroup.filter(id => !named.has(id));
        if (rest.length) parts.push({ title: parts.length ? "More" : "", ids: rest });
        return <section key={g} id={g} className={styles.category} data-group={g} aria-labelledby={`streams-cat-${g}`}>
          <header className={styles.categoryHead}>
            <span className={styles.categoryIcon}><Icon size={22} aria-hidden="true" /></span>
            <div><h2 id={`streams-cat-${g}`}>{info.name}</h2><p>{copy.lede}</p></div>
            <span className={styles.categoryCount}>{inGroup.length} playlists · {streamTotals(inGroup).lessons} steps</span>
          </header>
          {parts.map(part => <div key={part.title || g} className={styles.part}>
            {part.title && <h3>{part.title}</h3>}
            <ul className={styles.playlists}>
              {part.ids.map(id => <li key={id}><PlaylistCard tech={id} done={progress.done} onOpen={() => openPlaylist(id)} /></li>)}
            </ul>
          </div>)}
        </section>; })}
    </>}
  </div>;
}

function PlaylistCard({ tech, done, onOpen }: { tech: StreamTech; done: Record<string, true>; onOpen: () => void }) {
  const p = playlist(tech); const Icon = TECH_ICON[tech]; const watched = p.steps.filter(s => done[s.id]).length; const uhd = p.steps.filter(s => quality(s.id) === "4K").length;
  return <button type="button" className={styles.card} onClick={onOpen} style={{ "--accent": p.info.color } as CSSProperties} aria-label={`${p.info.playlist}: ${p.steps.length} steps`}>
    <McbCover tech={tech} />
    <span className={styles.cardBody}>
      <span className={styles.cardTech}><Icon size={13} aria-hidden="true" />{p.info.name}</span>
      <b>{p.info.playlist}</b>
      <span className={styles.cardMeta}><span><Layers size={12} aria-hidden="true" />{p.chapters.length} chapters</span><span><ListVideo size={12} aria-hidden="true" />{p.steps.length} steps</span><span>{courseTime(p.seconds)}</span>{uhd > 0 && <span className={styles.uhd}><Sparkles size={12} aria-hidden="true" />{uhd} in 4K</span>}</span>
      {watched > 0 && <span className={styles.bar} role="img" aria-label={`${watched} of ${p.steps.length} steps watched`}><span style={{ width: `${(watched / p.steps.length) * 100}%` }} /></span>}
      <span className={styles.cardCta}><CirclePlay size={15} aria-hidden="true" />{watched ? "Continue the course" : "Start with the free first step"}</span>
    </span>
  </button>;
}

const STEPS_PER_PAGE = 8;

function PlaylistView({ tech, stepId, playing, done, onBack, onPick, onPlay, onToggleDone, onFinish }: {
  tech: StreamTech; stepId: string | null; playing: boolean; done: Record<string, true>; onBack: () => void; onPick: (step: StreamStep) => void; onPlay: () => void; onToggleDone: (id: string) => void; onFinish: (id: string) => void;
}) {
  const p = playlist(tech); const Icon = TECH_ICON[tech]; const group = STREAM_GROUPS.find(g => g.id === p.info.group)!;
  const step = p.steps.find(s => s.id === stepId) ?? p.steps[0];
  const prev = p.steps[step.step - 2], next = p.steps[step.step];
  const watched = p.steps.filter(s => done[s.id]).length;
  const [chapter, setChapter] = useState<number | "all">("all");
  const [page, setPage] = useState(0);
  const inChapter = chapter === "all" ? p.steps : p.steps.filter(s => s.chapterNo === chapter);
  const pages = Math.max(1, Math.ceil(inChapter.length / STEPS_PER_PAGE)); const safePage = Math.min(page, pages - 1);
  const slice = inChapter.slice(safePage * STEPS_PER_PAGE, (safePage + 1) * STEPS_PER_PAGE);
  const access = useStreamAccess();
  return <div className={`${styles.playlistView} ${player.tokens}`} style={{ "--accent": p.info.color } as CSSProperties} data-group={p.info.group}>
    <button type="button" className={styles.back} onClick={onBack}><ArrowLeft size={15} aria-hidden="true" />All courses</button>
    <header className={styles.viewHead}>
      <span className={styles.viewIcon}><Icon size={28} aria-hidden="true" /></span>
      <div>
        <p className={styles.viewGroup}>{group.name} · Complete course</p>
        <h1>{p.info.playlist}</h1>
        <p>{p.info.tagline}</p>
        <p className={styles.viewMeta}><span><Layers size={12} aria-hidden="true" />{p.chapters.length} chapters</span><span><ListVideo size={12} aria-hidden="true" />{p.steps.length} steps</span><span>{courseTime(p.seconds)}</span><span>{watched}/{p.steps.length} watched</span></p>
        <span className={styles.viewBar} role="img" aria-label={`${watched} of ${p.steps.length} steps watched`}><span style={{ width: `${(watched / p.steps.length) * 100}%` }} /></span>
      </div>
      <Link className={styles.viewCta} href={streamsHref(tech, step.id)} prefetch={false}>Open in my dashboard<ArrowRight size={16} aria-hidden="true" /></Link>
    </header>
    {p.info.status && <p className={styles.warn}><TriangleAlert size={15} aria-hidden="true" />{p.info.status}</p>}

    <div id="streams-hub-player" className={styles.stage}>
      <div className={styles.main}>
        <StreamPlayer step={step} playing={playing} onPlay={onPlay} label="Play" />
        <div className={styles.controls}>
          <button type="button" disabled={!prev} onClick={() => prev && onPick(prev)}><SkipBack size={15} aria-hidden="true" />Previous</button>
          <button type="button" aria-pressed={Boolean(done[step.id])} onClick={() => onToggleDone(step.id)}>{done[step.id] ? <CheckCircle2 size={15} aria-hidden="true" /> : <Circle size={15} aria-hidden="true" />}{done[step.id] ? "Watched" : "Mark as watched"}</button>
          <button type="button" disabled={!next} onClick={() => { onFinish(step.id); if (next) onPick(next); }}>Next step<SkipForward size={15} aria-hidden="true" /></button>
        </div>
        <div className={styles.now}>
          <p className={styles.viewMeta}><span>Step {step.step} / {p.steps.length}</span><span>Chapter {step.chapterNo}: {step.chapter.title}</span><span>{step.level}</span><span>{clockTime(step.seconds)}</span><QualityBadge value={quality(step.id)} /></p>
          <h2>{step.title}</h2>
          <h3><BookOpenText size={14} aria-hidden="true" />Study notes</h3>
          <ul>{step.points.map(point => <li key={point}>{point}</li>)}</ul>
          {step.chapter.note && <p className={styles.note}>{step.chapter.note}</p>}
        </div>
      </div>
      <aside className={styles.side} aria-label="Up next">
        <p className={styles.sideHead}><b>Up next</b><span>{p.steps.length} steps in {p.chapters.length} chapters</span></p>
        <StepList steps={p.steps} active={step.id} done={done} onPick={onPick} chapters label="Course steps in order" />
      </aside>
    </div>

    <section className={styles.steps} aria-labelledby="streams-course-steps">
      <div className={styles.stepsHead}>
        <h2 id="streams-course-steps">Course steps</h2>
        <div className={styles.chapterChips} role="group" aria-label="Chapters">
          <button type="button" aria-pressed={chapter === "all"} onClick={() => { setChapter("all"); setPage(0); }}><span><LayoutGrid size={13} aria-hidden="true" /></span>All<small>{p.steps.length}</small></button>
          {p.chapters.map((c, i) => <button key={c.id} type="button" aria-pressed={chapter === i + 1} onClick={() => { setChapter(i + 1); setPage(0); }}><span>{i + 1}</span>{c.title}<small>{c.lessons.length}</small></button>)}
        </div>
      </div>
      <ul className={styles.stepGrid}>
        {slice.map(s => <li key={s.id}>
          <button type="button" className={styles.stepCard} aria-pressed={s.id === step.id} onClick={() => onPick(s)} aria-label={`Step ${s.step}: ${s.title}`}>
            <McbCover tech={tech} step={s} locked={!canWatch(s, access)} />
            <span className={styles.stepText}>
              <small>Chapter {s.chapterNo} · {s.chapter.title}</small>
              <b>{s.title}</b>
              <span className={styles.cardMeta}><span><Clock size={12} aria-hidden="true" />{clockTime(s.seconds)}</span><span>{s.step === 1 ? "Free" : canWatch(s, access) ? s.level : "Members"}</span>{done[s.id] && <span className={styles.seen}><CheckCircle2 size={12} aria-hidden="true" />Watched</span>}</span>
            </span>
          </button>
        </li>)}
      </ul>
      {pages > 1 && <nav className={styles.pager} aria-label="Step pages">
        <button type="button" onClick={() => setPage(safePage - 1)} disabled={safePage === 0} aria-label="Previous steps"><ChevronLeft size={16} aria-hidden="true" /></button>
        {pageWindow(safePage, pages).map((i, k) => i < 0 ? <span key={`gap-${k}`} aria-hidden="true">…</span>
          : <button key={i} type="button" aria-current={i === safePage ? "page" : undefined} onClick={() => setPage(i)} aria-label={`Steps page ${i + 1}`}>{i + 1}</button>)}
        <button type="button" onClick={() => setPage(safePage + 1)} disabled={safePage >= pages - 1} aria-label="Next steps"><ChevronRight size={16} aria-hidden="true" /></button>
      </nav>}
    </section>
  </div>;
}

/** Search every visible playlist: picking a playlist opens it, picking a step plays it (or opens it in the dashboard). */
function HubSearch({ techs, onPlaylist, onStep }: { techs: StreamTech[]; onPlaylist: (id: StreamTech) => void; onStep: (step: StreamStep) => void }) {
  const [query, setQuery] = useState(""); const deferred = useDeferredValue(query); const [highlighted, setHighlighted] = useState(-1); const listId = useId();
  const results = useMemo(() => suggest(deferred, techs, 8), [deferred, techs]);
  const choose = (s: Suggestion) => { setQuery(""); setHighlighted(-1); const step = findStep(s.lesson); if (s.kind === "playlist" || !step) onPlaylist(s.tech); else onStep(step); };
  return <div className={`${search.search} ${styles.search}`}>
    <Search size={17} aria-hidden="true" className={search.searchIcon} />
    <input type="text" role="combobox" aria-expanded={results.length > 0} aria-controls={listId} aria-autocomplete="list" aria-activedescendant={highlighted >= 0 ? `${listId}-${highlighted}` : undefined}
      aria-label="Search playlists, steps and topics" placeholder="Search a subject, exam or topic… e.g. “trigonometry”, “UPSC”, “React”" value={query}
      onChange={e => { setQuery(e.target.value); setHighlighted(-1); }}
      onKeyDown={e => {
        if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted(h => Math.min(results.length - 1, h + 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted(h => Math.max(-1, h - 1)); }
        else if (e.key === "Enter" && highlighted >= 0 && results[highlighted]) { e.preventDefault(); choose(results[highlighted]); }
        else if (e.key === "Escape") setQuery("");
      }} />
    {query && <button type="button" className={search.clearSearch} onClick={() => setQuery("")} aria-label="Clear search"><X size={15} aria-hidden="true" /></button>}
    {results.length > 0 && <ul id={listId} role="listbox" className={search.suggestions} aria-label="Suggestions">
      {results.map((s, i) => { const Icon = TECH_ICON[s.tech]; return <li key={`${s.kind}-${s.label}-${s.lesson ?? ""}`} id={`${listId}-${i}`} role="option" aria-selected={i === highlighted}
        onPointerDown={e => { e.preventDefault(); choose(s); }} onPointerEnter={() => setHighlighted(i)} style={{ "--accent": techInfo(s.tech).color } as CSSProperties}>
        <span className={search.sugIcon}><Icon size={15} aria-hidden="true" /></span>
        <span className={search.sugText}><b>{s.label}</b><small>{s.kind === "playlist" ? "Playlist" : s.kind === "chapter" ? "Chapter" : s.kind === "lesson" ? "Step" : "Topic"} · {s.detail}</small></span>
      </li>; })}
    </ul>}
  </div>;
}
