"use client";
import { createElement, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  Award, Bookmark, BookMarked, BookOpen, BookOpenText, Check, ChevronDown, CircleHelp, Clock3, Code2, Coffee, Compass, CreditCard, FileCode2, FileText, FilePlus2,
  GraduationCap, Landmark, Layers, Library, ListOrdered, MessagesSquare, Search, SearchX, Settings, ShieldCheck, Sparkles, UserCog, Workflow, X, type LucideIcon,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { PAGE_GROUPS, type PageGroup, type PageOption } from "@/lib/learning-uploads";
import styles from "./super-admin-page-picker.module.css";

const PAGE_ICONS: Record<string, LucideIcon> = {
  dashboard: Compass, library: Library, search: Search, "step-by-step": ListOrdered, notes: BookOpen, vocabulary: BookOpenText, "coffee-and-code": Coffee,
  classroom: GraduationCap, bookmark: Bookmark, "official-docs": BookMarked, techy: Code2, "api-docs": FileCode2, workflow: Workflow, certifications: Award, lessons: BookOpenText,
  quiz: CircleHelp, interview: MessagesSquare, plans: CreditCard, settings: Settings,
};
const GROUP_ICONS: Record<PageGroup, LucideIcon> = { learning: BookOpen, professional: Code2, exams: GraduationCap, account: UserCog, custom: FilePlus2 };
const iconFor = (option: PageOption): LucideIcon => PAGE_ICONS[option.value] ?? (option.group === "exams" ? Landmark : option.group === "custom" ? FileText : option.group ? Layers : ShieldCheck);
const RECENT_KEY = "masterclass:upload-learning:recent-pages";
const readRecent = (): string[] => { try { const list = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); return Array.isArray(list) ? list.filter(v => typeof v === "string").slice(0, 4) : []; } catch { return []; } };
const saveRecent = (value: string) => { try { localStorage.setItem(RECENT_KEY, JSON.stringify([value, ...readRecent().filter(v => v !== value)].slice(0, 4))); } catch { /* private window */ } };

/**
 * How well a page matches the search, highest first: the label starts with it, a word in the label starts with it,
 * the label contains it, the address or keywords contain it, or its letters appear in order (so "cfc" finds
 * Coffee & Code). 0 is no match.
 */
export function pageScore(option: PageOption, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 1;
  const label = option.label.toLowerCase();
  if (label.startsWith(q)) return 100;
  if (label.split(/[^a-z0-9]+/).some(word => word.startsWith(q))) return 80;
  if (label.includes(q)) return 60;
  if (option.value.toLowerCase().includes(q) || (option.keywords ?? "").toLowerCase().includes(q)) return 40;
  let at = 0;
  for (const ch of label) if (ch === q[at]) at++;
  return at === q.replace(/\s/g, "").length ? 10 : 0;
}

/** The label with the searched text marked. */
function Highlight({ text, query }: { text: string; query: string }): ReactNode {
  const q = query.trim();
  const at = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (at < 0) return text;
  return <>{text.slice(0, at)}<mark>{text.slice(at, at + q.length)}</mark>{text.slice(at + q.length)}</>;
}

/**
 * A searchable page picker for Upload Learning: type to filter (ranked, typo-tolerant), narrow by sidebar group with
 * the filter chips, pick with the mouse or the arrow keys and Enter. Recently picked pages are suggested first.
 */
export function AdminPagePicker({ id, value, options, onChange, disabled, hrefFor }: {
  id?: string; value: string; options: PageOption[]; onChange: (value: string) => void; disabled?: boolean; hrefFor?: (value: string) => string;
}) {
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<PageGroup | "all">("all");
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const current = options.find(o => o.value === value);
  const groups = PAGE_GROUPS.filter(g => options.some(o => o.group === g.value));
  const matches = useMemo(() => options.map(option => ({ option, score: pageScore(option, query) })).filter(m => m.score > 0), [options, query]);
  const shown = useMemo(() => {
    const inGroup = matches.filter(m => group === "all" || m.option.group === group);
    // While searching, the best matches come first; otherwise the sidebar order (and its groups) is kept.
    return (query.trim() ? [...inGroup].sort((a, b) => b.score - a.score) : inGroup).map(m => m.option);
  }, [matches, group, query]);
  const suggested = !query.trim() && group === "all" ? recent.map(v => options.find(o => o.value === v)).filter((o): o is PageOption => !!o && o.value !== value) : [];
  const flat = [...suggested, ...shown];
  const choose = (option: PageOption) => { onChange(option.value); saveRecent(option.value); setOpen(false); };
  const openChange = (next: boolean) => {
    setOpen(next);
    if (next) { setQuery(""); setGroup("all"); setRecent(readRecent()); setActive(Math.max(0, options.findIndex(o => o.value === value))); }
  };
  const clear = () => { setQuery(""); setActive(0); input.current?.focus(); };
  const onKey = (event: KeyboardEvent<HTMLInputElement>) => {
    const move = (to: number) => { event.preventDefault(); const next = (to + flat.length) % Math.max(flat.length, 1); setActive(next); document.getElementById(`${listId}-${next}`)?.scrollIntoView({ block: "nearest" }); };
    if (event.key === "ArrowDown") move(active + 1);
    else if (event.key === "ArrowUp") move(active - 1);
    else if (event.key === "Home") move(0);
    else if (event.key === "End") move(flat.length - 1);
    else if (event.key === "Enter") { event.preventDefault(); if (flat[active]) choose(flat[active]); }
    else if (event.key === "Escape" && query) { event.preventDefault(); event.stopPropagation(); clear(); }
  };
  const groupLabel = (g?: PageGroup) => PAGE_GROUPS.find(x => x.value === g)?.label;

  const row = (option: PageOption, index: number) => {
    return <li key={`${index < suggested.length ? "s" : "p"}-${option.value}`} id={`${listId}-${index}`} role="option" aria-selected={option.value === value} data-active={index === active || undefined}
      className={styles.option} onMouseMove={() => setActive(index)} onMouseDown={e => e.preventDefault()} onClick={() => choose(option)}>
      <span className={styles.optionIcon} data-group={option.group ?? "other"} aria-hidden="true">{createElement(iconFor(option), { size: 15 })}</span>
      <span className={styles.optionText}><strong><Highlight text={option.label} query={query} /></strong>{hrefFor && <small>{hrefFor(option.value)}</small>}</span>
      {query.trim() && option.group && group === "all" && <span className={styles.groupTag}>{groupLabel(option.group)}</span>}
      {option.value === value && <Check size={15} className={styles.check} aria-label="Selected" />}
    </li>;
  };

  return <Popover open={open} onOpenChange={openChange}>
    <PopoverTrigger id={id} disabled={disabled} className={styles.trigger} aria-label={`Page: ${current?.label ?? "choose a page"}`}>
      <span className={styles.optionIcon} data-group={current?.group ?? "other"} aria-hidden="true">{createElement(current ? iconFor(current) : Layers, { size: 15 })}</span>
      <span className={styles.triggerText}><strong>{current?.label ?? "Choose a page"}</strong>{current?.group && <small>{groupLabel(current.group)}</small>}</span>
      <ChevronDown size={16} className={styles.chevron} aria-hidden="true" />
    </PopoverTrigger>
    <PopoverContent align="start" initialFocus={input} className={styles.panel} style={{ width: "max(var(--anchor-width), 340px)" }}>
      <div className={styles.searchBox}>
        <Search size={15} aria-hidden="true" />
        <input ref={input} role="combobox" aria-expanded="true" aria-controls={listId} aria-autocomplete="list" aria-activedescendant={flat[active] ? `${listId}-${active}` : undefined}
          aria-label="Search pages" placeholder={`Search ${options.length} pages…`} value={query} onKeyDown={onKey} onChange={e => { setQuery(e.target.value); setActive(0); }} />
        {query && <button type="button" className={styles.clear} onClick={clear} aria-label="Clear search"><X size={14} /></button>}
      </div>
      {groups.length > 1 && <div className={styles.filters} role="group" aria-label="Filter by sidebar group">
        <button type="button" aria-pressed={group === "all"} onClick={() => { setGroup("all"); setActive(0); }}><Sparkles size={12} aria-hidden="true" />All<span>{matches.length}</span></button>
        {groups.map(g => { const Icon = GROUP_ICONS[g.value]; const count = matches.filter(m => m.option.group === g.value).length;
          return <button type="button" key={g.value} aria-pressed={group === g.value} disabled={!count && group !== g.value} onClick={() => { setGroup(g.value); setActive(0); }}><Icon size={12} aria-hidden="true" />{g.label}<span>{count}</span></button>; })}
      </div>}
      {flat.length ? <ul id={listId} role="listbox" aria-label="Pages" className={styles.list}>
        {suggested.length > 0 && <li role="presentation" className={styles.heading}><Clock3 size={12} aria-hidden="true" />Recently picked</li>}
        {suggested.map((option, i) => row(option, i))}
        {shown.map((option, i) => {
          const index = suggested.length + i;
          const heading = !query.trim() && group === "all" && option.group && option.group !== shown[i - 1]?.group;
          return [heading && <li key={`h-${option.group}`} role="presentation" className={styles.heading}>{groupLabel(option.group)}</li>, row(option, index)];
        })}
      </ul> : <div className={styles.empty} role="status">
        <SearchX size={20} aria-hidden="true" />
        <p>No page matches “{query}”{group !== "all" ? ` in ${groupLabel(group)}` : ""}.</p>
        <div>{query && <button type="button" onClick={clear}>Clear search</button>}{group !== "all" && <button type="button" onClick={() => setGroup("all")}>Search every group</button>}</div>
      </div>}
      <p className={styles.footer} aria-hidden="true"><kbd>↑</kbd><kbd>↓</kbd> to move · <kbd>Enter</kbd> to pick · <kbd>Esc</kbd> to {query ? "clear" : "close"}</p>
    </PopoverContent>
  </Popover>;
}
