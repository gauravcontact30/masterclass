"use client";
import { useDeferredValue, useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight, CirclePlay, Gift, LayoutGrid, Layers, ListVideo, Search, X } from "lucide-react";
import { pageWindow } from "./streams-explorer";
import { McbCover } from "./streams-cover";
import { GROUP_ICON, TECH_ICON } from "./streams-icons";
import { courseTime, playlist, STREAM_GROUPS, techInfo, type StreamGroup, type StreamTech } from "@/lib/streams";
import styles from "./streams-shelf.module.css";

/**
 * The course library on the landing page (2026-11-26): every playlist as a clean card (an MCB cover, the title and its
 * size under it), with a search box, category chips (only categories that have playlists) and numbered pages. Choosing
 * a card opens that course below.
 */
const matches = (tech: StreamTech, query: string) => {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean); if (!terms.length) return true;
  const p = playlist(tech); const text = `${p.info.name} ${p.info.playlist} ${p.info.tagline} ${p.chapters.map(c => c.title).join(" ")} ${p.steps.map(s => s.title).join(" ")}`.toLowerCase();
  return terms.every(t => text.includes(t));
};

export function StreamsShelf({ techs, groups, group, onGroup, onOpen, tr, done, pageSize = 8 }: {
  techs: StreamTech[]; groups: StreamGroup[]; group: StreamGroup | "all"; onGroup: (group: StreamGroup | "all") => void; onOpen: (tech: StreamTech) => void;
  tr: (en: string, hi: string) => string; done: Record<string, true>; pageSize?: number;
}) {
  const [page, setPage] = useState(0); const [query, setQuery] = useState(""); const deferred = useDeferredValue(query);
  const inGroup = group === "all" ? techs : techs.filter(t => techInfo(t).group === group);
  const shown = inGroup.filter(t => matches(t, deferred));
  const pages = Math.max(1, Math.ceil(shown.length / pageSize)); const safePage = Math.min(page, pages - 1);
  const slice = shown.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const pick = (next: StreamGroup | "all") => { onGroup(next); setPage(0); };

  return <div className={styles.shelf}>
    <div className={styles.head}>
      <p className={styles.title}><b>{tr("Course library", "कोर्स लाइब्रेरी")}</b><span>{tr(`${techs.length} complete courses. The first step of each is free.`, `${techs.length} पूरे कोर्स। हर कोर्स का पहला चरण मुफ़्त।`)}</span></p>
      <label className={styles.search}>
        <Search size={16} aria-hidden="true" />
        <input type="search" value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} placeholder={tr("Find a course… e.g. “UPSC”, “Physics”, “React”", "कोर्स खोजें… जैसे “UPSC”, “Physics”")} aria-label={tr("Find a course", "कोर्स खोजें")} />
        {query && <button type="button" onClick={() => setQuery("")} aria-label={tr("Clear", "साफ़ करें")}><X size={14} aria-hidden="true" /></button>}
      </label>
    </div>
    {groups.length > 1 && <div className={styles.chips} role="group" aria-label={tr("Categories", "श्रेणियाँ")}>
      {(["all", ...groups] as const).map(g => { const Icon = g === "all" ? LayoutGrid : GROUP_ICON[g]; const info = STREAM_GROUPS.find(x => x.id === g);
        const count = g === "all" ? techs.length : techs.filter(t => techInfo(t).group === g).length;
        return <button key={g} type="button" aria-pressed={group === g} onClick={() => pick(g)} data-group={g}>
          <span><Icon size={14} aria-hidden="true" /></span>{info ? tr(info.name, info.hi) : tr("All", "सभी")}<small>{count}</small>
        </button>; })}
    </div>}

    {slice.length ? <ul className={styles.grid}>
      {slice.map(id => { const p = playlist(id); const Icon = TECH_ICON[id]; const watched = p.steps.filter(s => done[s.id]).length; const group = STREAM_GROUPS.find(x => x.id === p.info.group)!;
        return <li key={id}>
          <button type="button" className={styles.card} onClick={() => onOpen(id)} style={{ "--accent": p.info.color } as CSSProperties} aria-label={tr(`${p.info.playlist}: ${p.steps.length} steps`, `${p.info.playlist}: ${p.steps.length} चरण`)}>
            <McbCover tech={id} stepsWord={tr("steps", "चरण")} />
            <span className={styles.body}>
              <span className={styles.kind}><Icon size={13} aria-hidden="true" />{p.info.name}<i>{tr(group.name, group.hi)}</i></span>
              <b>{p.info.playlist}</b>
              <span className={styles.meta}><span><Layers size={12} aria-hidden="true" />{p.chapters.length} {tr("chapters", "अध्याय")}</span><span><ListVideo size={12} aria-hidden="true" />{courseTime(p.seconds)}</span><span className={styles.free}><Gift size={12} aria-hidden="true" />{tr("Step 1 free", "चरण 1 मुफ़्त")}</span></span>
              {watched > 0 && <span className={styles.bar} role="img" aria-label={tr(`${watched} of ${p.steps.length} steps watched`, `${p.steps.length} में से ${watched} चरण देखे`)}><span style={{ width: `${(watched / p.steps.length) * 100}%` }} /></span>}
              <span className={styles.open}><CirclePlay size={15} aria-hidden="true" />{watched ? tr("Continue the course", "कोर्स जारी रखें") : tr("Start the course", "कोर्स शुरू करें")}</span>
            </span>
          </button>
        </li>; })}
    </ul> : <p className={styles.empty}>{tr("No course matches. Try another word.", "कोई कोर्स नहीं मिला। दूसरा शब्द आज़माएँ।")}</p>}

    {pages > 1 && <nav className={styles.pager} aria-label={tr("Course pages", "कोर्स पेज")}>
      <button type="button" onClick={() => setPage(safePage - 1)} disabled={safePage === 0} aria-label={tr("Previous courses", "पिछले कोर्स")}><ChevronLeft size={16} aria-hidden="true" /></button>
      {pageWindow(safePage, pages).map((i, k) => i < 0 ? <span key={`gap-${k}`} aria-hidden="true">…</span>
        : <button key={i} type="button" aria-current={i === safePage ? "page" : undefined} onClick={() => setPage(i)} aria-label={tr(`Courses page ${i + 1}`, `कोर्स पेज ${i + 1}`)}>{i + 1}</button>)}
      <button type="button" onClick={() => setPage(safePage + 1)} disabled={safePage >= pages - 1} aria-label={tr("Next courses", "अगले कोर्स")}><ChevronRight size={16} aria-hidden="true" /></button>
    </nav>}
  </div>;
}
