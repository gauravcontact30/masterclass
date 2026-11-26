"use client";
import { useDeferredValue, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import Link from "@/components/site-link";
import { BookOpenText, CheckCircle2, ChevronLeft, ChevronRight, CirclePlay, Clock, CornerDownLeft, Gift, Hourglass, Layers, ListVideo, MonitorPlay, Rocket, Search, SlidersHorizontal, Sparkles, Sprout, TrendingUp, X, Zap, type LucideIcon } from "lucide-react";
import { TECH_ICON } from "./streams-icons";
import { McbCover } from "./streams-cover";
import { clockTime, findStep, filterSteps, isSample, NO_FILTERS, playlist, suggest, techInfo, type StreamFilters, type StreamStep, type StreamTech, type Suggestion } from "@/lib/streams";
import styles from "./streams-explorer.module.css";

/*
 * Streams' playlist explorer, shared by the landing section and the Learning Dashboard: a rail of playlists, a search box
 * with grouped suggestions (an ARIA combobox: arrows, Enter, Esc, "/" to focus), icon filters and the selected
 * playlist's steps as Master Class Buddy cards in numbered pages. Locked steps (landing page, past the free samples)
 * link to the same step in the dashboard.
 */
const KIND_ICON: Record<Suggestion["kind"], LucideIcon> = { playlist: ListVideo, chapter: Layers, lesson: CirclePlay, topic: BookOpenText };
type Tr = (en: string, hi: string) => string;
type FilterOption<K extends keyof StreamFilters> = { key: K; value: StreamFilters[K]; en: string; hi: string; icon: LucideIcon };
const FILTERS: { en: string; hi: string; options: FilterOption<keyof StreamFilters>[] }[] = [
  { en: "Level", hi: "स्तर", options: [
    { key: "level", value: "Beginner", en: "Beginner", hi: "शुरुआती", icon: Sprout }, { key: "level", value: "Intermediate", en: "Intermediate", hi: "मध्यम", icon: TrendingUp },
    { key: "level", value: "Advanced", en: "Advanced", hi: "उन्नत", icon: Rocket }, { key: "level", value: "All levels", en: "All levels", hi: "सभी स्तर", icon: Layers }] },
  { en: "Length", hi: "अवधि", options: [
    { key: "length", value: "short", en: "Under 10 min", hi: "10 मिनट से कम", icon: Zap }, { key: "length", value: "medium", en: "10–30 min", hi: "10–30 मिनट", icon: Clock },
    { key: "length", value: "long", en: "30 min +", hi: "30 मिनट +", icon: Hourglass }] },
  { en: "Quality", hi: "गुणवत्ता", options: [
    { key: "quality", value: "4K", en: "4K Ultra HD", hi: "4K अल्ट्रा HD", icon: Sparkles }, { key: "quality", value: "1440p", en: "1440p +", hi: "1440p +", icon: MonitorPlay }] },
];
const SAMPLES: FilterOption<"samples"> = { key: "samples", value: true, en: "Free samples", hi: "मुफ़्त नमूने", icon: Gift };

/** Page numbers to show: the first, the last and the current one with its neighbours; -1 marks a gap ("…"). */
export function pageWindow(current: number, pages: number): number[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i);
  const keep = new Set([0, pages - 1, current - 1, current, current + 1].filter(i => i >= 0 && i < pages));
  if (current <= 2) [1, 2, 3].forEach(i => keep.add(i));
  if (current >= pages - 3) [pages - 4, pages - 3, pages - 2].forEach(i => keep.add(i));
  const sorted = [...keep].sort((x, y) => x - y); const out: number[] = [];
  sorted.forEach((i, k) => { if (k && i - sorted[k - 1] > 1) out.push(-1); out.push(i); });
  return out;
}

/** The part of `text` that matches the first search term, in <mark>. */
function Highlight({ text, query }: { text: string; query: string }) {
  const term = query.trim().split(/\s+/)[0]?.toLowerCase(); const at = term ? text.toLowerCase().indexOf(term) : -1;
  return at < 0 ? <>{text}</> : <>{text.slice(0, at)}<mark>{text.slice(at, at + term.length)}</mark>{text.slice(at + term.length)}</>;
}

export function QualityBadge({ value }: { value: "4K" | "1440p" | "1080p" }) {
  return <span className={styles.quality} data-q={value}>{value === "4K" ? "4K UHD" : value}</span>;
}

export function StreamExplorer({ techs, tech, onTech, onPick, pageSize, tr, active, progress, lockedHref, sampleFilter = false }: {
  techs: StreamTech[]; tech: StreamTech; onTech: (tech: StreamTech) => void; onPick: (step: StreamStep) => void; pageSize: number; tr: Tr;
  active?: string; progress?: Record<string, true>;
  /** Landing page: steps after the free samples are locked and link here (the same step in the dashboard). */
  lockedHref?: (step: StreamStep) => string; sampleFilter?: boolean;
}) {
  const [query, setQuery] = useState(""); const deferred = useDeferredValue(query);
  const [filters, setFilters] = useState<StreamFilters>(NO_FILTERS);
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false); const [highlighted, setHighlighted] = useState(-1);
  const listId = useId(); const box = useRef<HTMLDivElement>(null); const input = useRef<HTMLInputElement>(null);
  const list = playlist(tech); const stepWord = tr("Step", "चरण");
  const suggestions = useMemo(() => suggest(deferred, techs, 8), [deferred, techs]);
  const steps = useMemo(() => filterSteps(list.steps, deferred, filters), [list, deferred, filters]);
  const pages = Math.max(1, Math.ceil(steps.length / pageSize)); const safePage = Math.min(page, pages - 1);
  const shown = steps.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const activeFilters = (filters.level !== "any" ? 1 : 0) + (filters.length !== "any" ? 1 : 0) + (filters.quality !== "any" ? 1 : 0) + (filters.samples ? 1 : 0);
  const reset = () => { setFilters(NO_FILTERS); setQuery(""); setPage(0); };
  const toggle = (option: FilterOption<keyof StreamFilters>) => { setFilters(f => ({ ...f, [option.key]: f[option.key] === option.value ? NO_FILTERS[option.key] : option.value })); setPage(0); };
  const switchTech = (next: StreamTech) => { onTech(next); setPage(0); };

  // Close the suggestions on a click outside; "/" focuses the search when it is on screen.
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!box.current?.contains(event.target as Node)) setOpen(false); };
    const slash = (event: globalThis.KeyboardEvent) => { if (event.key !== "/" || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || !box.current) return; const r = box.current.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) { event.preventDefault(); input.current?.focus(); } };
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", slash);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", slash); };
  }, []);

  const choose = (s: Suggestion) => {
    setOpen(false); setHighlighted(-1); setQuery("");
    if (s.tech !== tech) switchTech(s.tech);
    const step = findStep(s.lesson);
    if (step) { const at = playlist(step.tech).steps.indexOf(step); setPage(Math.floor(at / pageSize)); onPick(step); }
  };
  const onKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setHighlighted(a => Math.min(suggestions.length - 1, a + 1)); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setHighlighted(a => Math.max(-1, a - 1)); }
    else if (event.key === "Enter") { if (open && highlighted >= 0 && suggestions[highlighted]) { event.preventDefault(); choose(suggestions[highlighted]); } else setOpen(false); }
    else if (event.key === "Escape") { if (open) setOpen(false); else setQuery(""); }
  };

  return <div className={styles.explorer}>
    {techs.length > 1 && <div className={styles.rail} role="tablist" aria-label={tr("Playlists", "प्लेलिस्ट")}>
      {techs.map(id => { const t = techInfo(id); const Icon = TECH_ICON[id]; return <button key={id} type="button" role="tab" aria-selected={tech === id} onClick={() => switchTech(id)} style={{ "--accent": t.color } as CSSProperties}>
        <span className={styles.railIcon}><Icon size={17} aria-hidden="true" /></span><span><b>{t.name}</b><small>{playlist(id).steps.length} {tr("steps", "चरण")}{t.status ? ` · ${tr("legacy", "पुराना")}` : ""}</small></span>
      </button>; })}
    </div>}

    <div className={styles.panel} style={{ "--accent": list.info.color } as CSSProperties}>
      <div className={styles.toolbar}>
        <div className={styles.search} ref={box}>
          <Search size={17} aria-hidden="true" className={styles.searchIcon} />
          <input ref={input} type="text" role="combobox" aria-expanded={open && suggestions.length > 0} aria-controls={listId} aria-autocomplete="list"
            aria-activedescendant={open && highlighted >= 0 ? `${listId}-${highlighted}` : undefined} aria-label={tr("Search playlists, steps and topics", "प्लेलिस्ट, चरण और विषय खोजें")}
            placeholder={tr("Search steps or topics… e.g. “caching”, “agents”, “Suspense”", "चरण या विषय खोजें… जैसे “caching”, “agents”")} value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); setHighlighted(-1); setPage(0); }} onFocus={() => setOpen(true)} onKeyDown={onKey} />
          {query ? <button type="button" className={styles.clearSearch} onClick={() => { setQuery(""); input.current?.focus(); }} aria-label={tr("Clear search", "खोज साफ़ करें")}><X size={15} aria-hidden="true" /></button>
            : <kbd className={styles.kbd} aria-hidden="true">/</kbd>}
          {open && suggestions.length > 0 && <ul id={listId} role="listbox" className={styles.suggestions} aria-label={tr("Suggestions", "सुझाव")}>
            {suggestions.map((s, i) => { const Icon = s.kind === "playlist" ? TECH_ICON[s.tech] : KIND_ICON[s.kind]; return <li key={`${s.kind}-${s.label}-${s.lesson ?? ""}`} id={`${listId}-${i}`} role="option" aria-selected={i === highlighted}
              onPointerDown={e => { e.preventDefault(); choose(s); }} onPointerEnter={() => setHighlighted(i)} style={{ "--accent": techInfo(s.tech).color } as CSSProperties}>
              <span className={styles.sugIcon}><Icon size={15} aria-hidden="true" /></span>
              <span className={styles.sugText}><b><Highlight text={s.label} query={deferred} /></b><small>{s.kind === "playlist" ? tr("Playlist", "प्लेलिस्ट") : s.kind === "chapter" ? tr("Chapter", "अध्याय") : s.kind === "lesson" ? tr("Step", "चरण") : tr("Topic", "विषय")} · {s.detail}</small></span>
              {i === highlighted && <CornerDownLeft size={14} aria-hidden="true" className={styles.sugEnter} />}
            </li>; })}
          </ul>}
        </div>

        <div className={styles.filters} role="group" aria-label={tr("Filters", "फ़िल्टर")}>
          <span className={styles.filterLead} aria-hidden="true"><SlidersHorizontal size={15} /></span>
          {FILTERS.map(group => <fieldset key={group.en} className={styles.group}>
            <legend>{tr(group.en, group.hi)}</legend>
            {group.options.map(option => <FilterChip key={String(option.value)} option={option} on={filters[option.key] === option.value} onClick={() => toggle(option)} tr={tr} />)}
          </fieldset>)}
          {sampleFilter && <fieldset className={styles.group}><legend>{tr("Access", "पहुँच")}</legend><FilterChip option={SAMPLES} on={filters.samples} onClick={() => toggle(SAMPLES)} tr={tr} /></fieldset>}
          {(activeFilters > 0 || query) && <button type="button" className={styles.reset} onClick={reset}><X size={13} aria-hidden="true" />{tr("Reset", "रीसेट")}{activeFilters > 0 && <b>{activeFilters}</b>}</button>}
        </div>
      </div>

      <div className={styles.listHead}>
        <p className={styles.listTitle}><b>{list.info.playlist}</b><span>{list.chapters.length} {tr("chapters", "अध्याय")} · {list.steps.length} {tr("steps", "चरण")}</span></p>
        <p className={styles.count} aria-live="polite">{steps.length
          ? tr(`Showing ${safePage * pageSize + 1}–${safePage * pageSize + shown.length} of ${steps.length} ${steps.length === 1 ? "step" : "steps"}`, `${steps.length} में से ${safePage * pageSize + 1}–${safePage * pageSize + shown.length} चरण`)
          : tr("No step matches. Try another word or remove a filter.", "कोई चरण नहीं मिला। दूसरा शब्द आज़माएँ या फ़िल्टर हटाएँ।")}</p>
      </div>

      <ul className={styles.cards}>
        {shown.map(step => { const locked = Boolean(lockedHref) && !isSample(step); const watched = progress?.[step.id];
          const body = <>
            <span className={styles.cardPoster}><McbCover tech={step.tech} step={step} locked={locked} stepWord={stepWord} /></span>
            <span className={styles.cardBody}>
              <span className={styles.cardStep}>{stepWord} {step.step} · {step.chapter.title}</span>
              <b>{step.title}</b>
              <span className={styles.cardMeta}><span><Clock size={12} aria-hidden="true" />{clockTime(step.seconds)}</span><span>{step.level}</span>
                {!locked && lockedHref && <span className={styles.free}><Gift size={12} aria-hidden="true" />{tr("Free sample", "मुफ़्त नमूना")}</span>}
                {watched && <span className={styles.watched}><CheckCircle2 size={12} aria-hidden="true" />{tr("Watched", "देखा")}</span>}
                {locked && <span className={styles.lockedNote}>{tr("In your dashboard", "आपके डैशबोर्ड में")}</span>}</span>
            </span>
          </>;
          return <li key={step.id} style={{ "--accent": list.info.color } as CSSProperties}>
            {locked ? <Link className={styles.card} href={lockedHref!(step)} aria-label={tr(`${stepWord} ${step.step}: ${step.title} — continue in your dashboard`, `${stepWord} ${step.step}: ${step.title} — डैशबोर्ड में जारी रखें`)}>{body}</Link>
              : <button type="button" className={styles.card} aria-pressed={active === step.id} onClick={() => onPick(step)} aria-label={`${stepWord} ${step.step}: ${step.title}`}>{body}</button>}
          </li>; })}
      </ul>

      {pages > 1 && <nav className={styles.pager} aria-label={tr("Step pages", "चरण पेज")}>
        <button type="button" onClick={() => setPage(safePage - 1)} disabled={safePage === 0} aria-label={tr("Previous page", "पिछला पेज")}><ChevronLeft size={16} aria-hidden="true" /></button>
        {pageWindow(safePage, pages).map((i, k) => i < 0 ? <span key={`gap-${k}`} className={styles.gap} aria-hidden="true">…</span>
          : <button key={i} type="button" aria-current={i === safePage ? "page" : undefined} onClick={() => setPage(i)} aria-label={tr(`Page ${i + 1}`, `पेज ${i + 1}`)}>{i + 1}</button>)}
        <button type="button" onClick={() => setPage(safePage + 1)} disabled={safePage >= pages - 1} aria-label={tr("Next page", "अगला पेज")}><ChevronRight size={16} aria-hidden="true" /></button>
      </nav>}
    </div>
  </div>;
}

function FilterChip({ option, on, onClick, tr }: { option: FilterOption<keyof StreamFilters>; on: boolean; onClick: () => void; tr: Tr }) {
  const label = tr(option.en, option.hi);
  return <button type="button" aria-pressed={on} onClick={onClick} title={label} aria-label={label}><span className={styles.chipIcon}><option.icon size={14} aria-hidden="true" /></span><span className={styles.chipLabel}>{label}</span></button>;
}
