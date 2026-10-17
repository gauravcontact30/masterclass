"use client";
import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Bot, Boxes, ChevronLeft, ChevronRight, Cloud, Code2, Database, FlaskConical, GitBranch, Layers, LayoutGrid, Search, SearchX, Server, Sparkles, X, type LucideIcon } from "lucide-react";
import type { InterviewKind, InterviewTech } from "@/lib/interview-bank";
import styles from "./interview-tech-nav.module.css";

type Text = (en: string, hindi: string) => string;
type Kind = InterviewKind | "all";

export const KIND_ICON: Record<InterviewKind, LucideIcon> = { ai: Bot, frontend: Code2, backend: Server, testing: FlaskConical, state: Layers, language: Sparkles, cloud: Cloud, tooling: GitBranch, design: Boxes, data: Database };
const KIND_LABEL: Record<InterviewKind, [string, string]> = {
  ai: ["AI & agents", "AI और एजेंट"], frontend: ["Frontend", "फ्रंटएंड"], backend: ["Backend", "बैकएंड"], testing: ["Testing", "टेस्टिंग"], state: ["State", "स्टेट"],
  language: ["Languages", "भाषाएँ"], cloud: ["Cloud", "क्लाउड"], tooling: ["Tooling", "टूलिंग"], design: ["System design", "सिस्टम डिज़ाइन"], data: ["Data", "डेटा"],
};
/** Technology cards per navigator page. */
export const NAV_PAGE_SIZE = 8;
/** Suggestions shown under the search box. */
const SUGGESTIONS = 6;

const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9+#.]+/g, " ").trim();
/** Title matches rank above tagline matches; words may come in any order. */
function score(tech: InterviewTech, query: string) {
  const words = normalise(query).split(" ").filter(Boolean);
  if (!words.length) return 1;
  const title = normalise(tech.title); const rest = normalise(`${tech.tagline} ${tech.tabs?.map(t => t.title).join(" ") ?? ""} ${KIND_LABEL[tech.kind][0]}`);
  let total = 0;
  for (const word of words) {
    if (title.startsWith(word)) total += 6; else if (title.includes(word)) total += 4; else if (rest.includes(word)) total += 1; else return 0;
  }
  return total;
}

/** The query's first match inside a title, wrapped in <mark>. */
function Highlight({ text, query }: Readonly<{ text: string; query: string }>) {
  const word = normalise(query).split(" ").find(Boolean);
  const at = word ? text.toLowerCase().indexOf(word) : -1;
  if (!word || at < 0) return <>{text}</>;
  return <>{text.slice(0, at)}<mark>{text.slice(at, at + word.length)}</mark>{text.slice(at + word.length)}</>;
}

/**
 * The Interview prep technology navigator: a search box with suggestions and a clear button, category filters
 * with icons, eight technologies a page, and pagination aligned in one bar. Picking a technology turns the
 * carousel to it; as the carousel turns, the navigator follows to the page holding the current technology.
 */
export function InterviewTechNav({ techs, current, onPick, tones, text, tab = 0, onTab }: Readonly<{ techs: InterviewTech[]; current: number; onPick: (index: number) => void; tones: number; text: Text; tab?: number; onTab?: (tab: number) => void }>) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<Kind>("all");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();

  const indexed = useMemo(() => techs.map((tech, index) => ({ tech, index })), [techs]);
  const kinds = useMemo(() => {
    const counts = new Map<InterviewKind, number>();
    for (const tech of techs) counts.set(tech.kind, (counts.get(tech.kind) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [techs]);
  const results = useMemo(() => indexed
    .filter(({ tech }) => kind === "all" || tech.kind === kind)
    .map(entry => ({ ...entry, score: score(entry.tech, query) }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => query.trim() ? b.score - a.score || a.index - b.index : a.index - b.index), [indexed, kind, query]);
  const suggestions = query.trim() ? results.slice(0, SUGGESTIONS) : [];

  // The page follows the current technology until the reader browses; browsing lasts until the slide or filters change.
  const pageCount = Math.max(1, Math.ceil(results.length / NAV_PAGE_SIZE));
  const position = results.findIndex(r => r.index === current);
  const key = `${current}|${kind}|${query}`;
  const [browsed, setBrowsed] = useState<{ key: string; page: number } | null>(null);
  const page = Math.min(pageCount - 1, browsed?.key === key ? browsed.page : position >= 0 ? Math.floor(position / NAV_PAGE_SIZE) : 0);
  const browse = (next: number) => setBrowsed({ key, page: Math.min(pageCount - 1, Math.max(0, next)) });
  const shown = results.slice(page * NAV_PAGE_SIZE, (page + 1) * NAV_PAGE_SIZE);
  const from = results.length ? page * NAV_PAGE_SIZE + 1 : 0; const to = Math.min(results.length, (page + 1) * NAV_PAGE_SIZE);

  const selected = techs[current];
  const pick = (index: number) => { onPick(index); setOpen(false); setActive(-1); };
  const clear = () => { setQuery(""); setActive(-1); input.current?.focus(); };
  const reset = () => { setQuery(""); setKind("all"); setActive(-1); };
  const onKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && suggestions.length) { event.preventDefault(); setOpen(true); setActive(a => (a + 1) % suggestions.length); }
    else if (event.key === "ArrowUp" && suggestions.length) { event.preventDefault(); setOpen(true); setActive(a => (a <= 0 ? suggestions.length : a) - 1); }
    else if (event.key === "Enter" && suggestions.length) { event.preventDefault(); pick(suggestions[Math.max(0, active)].index); }
    else if (event.key === "Escape") { if (open && suggestions.length) setOpen(false); else clear(); }
  };

  return <div className={styles.nav}>
    <div className={styles.toolbar}>
      <div className={styles.search} data-open={open && suggestions.length > 0}>
        <Search size={17} aria-hidden="true" className={styles.searchIcon} />
        <input ref={input} type="search" role="combobox" value={query} placeholder={text("Search 31 technologies, e.g. “react”, “testing”, “cache”", "31 तकनीकें खोजें, जैसे “react”, “testing”")}
          aria-label={text("Search technologies", "तकनीकें खोजें")} aria-expanded={open && suggestions.length > 0} aria-controls={listId} aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
          onChange={event => { setQuery(event.target.value); setOpen(true); setActive(-1); }} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onKeyDown={onKey} />
        {query && <button type="button" className={styles.clear} onClick={clear} aria-label={text("Clear search", "खोज साफ़ करें")}><X size={15} aria-hidden="true" /></button>}
        <kbd className={styles.hint} aria-hidden="true">↑↓ ↵</kbd>
        {open && suggestions.length > 0 && <ul id={listId} role="listbox" className={styles.suggestions} aria-label={text("Suggestions", "सुझाव")}>
          {suggestions.map(({ tech, index }, k) => { const Icon = KIND_ICON[tech.kind]; return <li key={tech.id} id={`${listId}-${k}`} role="option" aria-selected={k === active} data-tone={index % tones}
            onMouseDown={event => { event.preventDefault(); pick(index); }} onMouseEnter={() => setActive(k)}>
            <span className={styles.suggestIcon}><Icon size={15} aria-hidden="true" /></span>
            <span className={styles.suggestText}><b><Highlight text={tech.title} query={query} /></b><small>{tech.tagline}</small></span>
            <span className={styles.suggestNo}>{String(index + 1).padStart(2, "0")}</span>
          </li>; })}
        </ul>}
      </div>
      <p className={styles.count} role="status">{results.length === techs.length ? text(`${techs.length} technologies`, `${techs.length} तकनीकें`) : text(`${results.length} of ${techs.length} match`, `${techs.length} में से ${results.length} मिलीं`)}</p>
    </div>

    <div className={styles.filters} role="group" aria-label={text("Filter by category", "श्रेणी से छाँटें")}>
      <button type="button" data-tone="all" aria-pressed={kind === "all"} onClick={() => setKind("all")}><LayoutGrid size={14} aria-hidden="true" />{text("All", "सभी")}<span>{techs.length}</span></button>
      {kinds.map(([k, n], i) => { const Icon = KIND_ICON[k]; return <button key={k} type="button" data-tone={i % tones} aria-pressed={kind === k} onClick={() => setKind(kind === k ? "all" : k)}>
        <Icon size={14} aria-hidden="true" />{text(...KIND_LABEL[k])}<span>{n}</span>
      </button>; })}
    </div>

    {shown.length
      ? <div className={styles.grid} role="group" aria-label={text("Choose a technology", "तकनीक चुनें")}>
        {shown.map(({ tech, index }) => { const Icon = KIND_ICON[tech.kind]; return <button key={tech.id} type="button" data-tone={index % tones} aria-current={index === current} onClick={() => pick(index)}>
          <span className={styles.chipIcon}><Icon size={15} aria-hidden="true" /></span>
          <span className={styles.chipTitle}><Highlight text={tech.title} query={query} /></span>
          <span className={styles.chipNo} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        </button>; })}
      </div>
      : <div className={styles.empty} role="status"><SearchX size={22} aria-hidden="true" /><p>{text(`No technology matches “${query}”${kind === "all" ? "" : " in this category"}.`, `“${query}” से कोई तकनीक नहीं मिली।`)}</p>
        <button type="button" onClick={reset}>{text("Clear search and filters", "खोज और फ़िल्टर साफ़ करें")}</button></div>}

    {selected?.tabs && onTab && <div className={styles.libraries} data-tone={current % tones}>
      <p><b>{selected.title}</b>{text(" · choose a library", " · लाइब्रेरी चुनें")}</p>
      <div role="group" aria-label={text(`${selected.title}: libraries`, `${selected.title}: लाइब्रेरी`)}>
        {selected.tabs.map((t, k) => <button key={t.id} type="button" data-tone={(current + k + 1) % tones} aria-pressed={k === tab} onClick={() => onTab(k)}>{t.title.replace(/^TanStack /, "")}</button>)}
      </div>
    </div>}

    <nav className={styles.pager} aria-label={text("Technology pages", "तकनीक पृष्ठ")}>
      <p className={styles.range}>{text(`Showing ${from}–${to} of ${results.length}`, `${results.length} में से ${from}–${to}`)}</p>
      <div className={styles.pages}>
        <button type="button" className={styles.step} onClick={() => browse(page - 1)} disabled={page === 0} aria-label={text("Previous technologies", "पिछली तकनीकें")}><ChevronLeft size={16} aria-hidden="true" /><span>{text("Prev", "पिछला")}</span></button>
        {Array.from({ length: pageCount }, (_, p) => <button key={p} type="button" className={styles.num} aria-current={p === page ? "page" : undefined} onClick={() => browse(p)} aria-label={text(`Page ${p + 1}`, `पृष्ठ ${p + 1}`)}>{p + 1}</button>)}
        <button type="button" className={styles.step} onClick={() => browse(page + 1)} disabled={page >= pageCount - 1} aria-label={text("Next technologies", "अगली तकनीकें")}><span>{text("Next", "अगला")}</span><ChevronRight size={16} aria-hidden="true" /></button>
      </div>
    </nav>
  </div>;
}
