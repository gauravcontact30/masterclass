"use client";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowDownAZ, Building2, Clock, Compass, Download, EyeOff, FileText, Globe2, Home, LayoutDashboard, Library, Link2, LogIn, MapPin, MousePointerClick, Search, Share2, Sparkles, UserPlus, UserRound, Users, X, type LucideIcon } from "lucide-react";
import { Card } from "./ui/card";
import { Pager } from "./super-admin-table";
import shell from "./super-admin-dashboard.module.css";
import styles from "./super-admin-audience.module.css";

type Row = Record<string, unknown>;
export type AudienceData = { countries: Row[]; cities: Row[]; pages: Row[]; referrers: Row[] };
type Tab = "countries" | "cities" | "pages" | "sources";
type Filter = { id: string; label: string; icon: LucideIcon; test: (row: Row) => boolean };
const PAGE_SIZE = 10;

const num = (value: unknown) => typeof value === "number" || (typeof value === "string" && value !== "" && !Number.isNaN(Number(value))) ? Number(value) : null;
const fmt = (value: unknown) => { const n = num(value); return n == null ? "—" : new Intl.NumberFormat("en-IN").format(n); };
const text = (value: unknown) => value == null || value === "" ? "" : String(value);
const seconds = (value: unknown) => { const n = num(value); return n == null ? "—" : n < 60 ? `${Math.round(n)} s` : `${Math.floor(n / 60)} m ${Math.round(n % 60)} s`; };
const ago = (value: unknown) => {
  if (!value) return "—";
  const s = Math.max(0, (Date.now() - new Date(String(value)).getTime()) / 1000);
  return s < 60 ? "just now" : s < 3600 ? `${Math.round(s / 60)} min ago` : s < 86400 ? `${Math.round(s / 3600)} h ago` : `${Math.round(s / 86400)} d ago`;
};

// Full country names from the browser's own CLDR data, so every ISO code reads as "India", "United States"…
let regionNames: Intl.DisplayNames | null = null;
export function countryName(code: string) {
  if (!/^[A-Z]{2}$/i.test(code)) return code || "Unknown";
  try { regionNames ??= new Intl.DisplayNames(["en"], { type: "region" }); return regionNames.of(code.toUpperCase()) ?? code; } catch { return code; }
}
/** A flag image (Windows shows flag emoji as bare letters, so emoji are not used). Hidden if it cannot load. */
export function Flag({ code }: { code: string }) {
  const [failed, setFailed] = useState(false);
  if (!/^[A-Z]{2}$/i.test(code) || failed) return <span className={styles.flagless} aria-hidden="true"><Globe2 size={13} /></span>;
  const lower = code.toLowerCase();
  // eslint-disable-next-line @next/next/no-img-element -- 20×15 flag thumbnails from a flag CDN; next/image adds nothing at this size.
  return <img className={styles.flag} src={`https://flagcdn.com/w20/${lower}.png`} srcSet={`https://flagcdn.com/w40/${lower}.png 2x`} width={20} height={15} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}

const SEARCH = /(^|\.)(google|bing|duckduckgo|yahoo|yandex|baidu|ecosia|search\.brave)\.|^com\.google\.android/;
const SOCIAL = /(^|\.)(facebook|instagram|t\.co|twitter|x\.com|linkedin|lnkd\.in|youtube|whatsapp|reddit|pinterest|telegram|quora|threads)(\.|$)/;
export function sourceKind(referrer: string): "direct" | "search" | "social" | "other" {
  const host = referrer.toLowerCase();
  if (!host || host === "direct / none") return "direct";
  if (SEARCH.test(host)) return "search";
  if (SOCIAL.test(host)) return "social";
  return "other";
}
const LIBRARY = /^\/(library|courses|interview-questions|workflows|learn|api-reference|compare|vocabulary|about|contact)(\/|$)/;
export function pageSection(path: string): "home" | "dashboard" | "auth" | "library" | "other" {
  if (path === "/") return "home";
  if (path.startsWith("/dashboard")) return "dashboard";
  if (/^\/(sign-in|sign-up|auth|subscribe)(\/|$)/.test(path)) return "auth";
  if (LIBRARY.test(path)) return "library";
  return "other";
}

const has = (key: string) => (row: Row) => (num(row[key]) ?? 0) > 0;
const known = (key: string) => (row: Row) => !["", "unknown"].includes(text(row[key]).toLowerCase());
const TABS: { id: Tab; label: string; icon: LucideIcon; key: keyof AudienceData; noun: string }[] = [
  { id: "countries", label: "Countries", icon: Globe2, key: "countries", noun: "countries" },
  { id: "cities", label: "Cities", icon: MapPin, key: "cities", noun: "cities" },
  { id: "pages", label: "Pages", icon: FileText, key: "pages", noun: "pages" },
  { id: "sources", label: "Traffic sources", icon: Link2, key: "referrers", noun: "sources" },
];
const SORTS: Record<Tab, { id: string; label: string; icon: LucideIcon }[]> = {
  countries: [{ id: "visitors", label: "Visitors", icon: Users }, { id: "views", label: "Views", icon: MousePointerClick }, { id: "signed_in", label: "Signed in", icon: UserRound }, { id: "avg_seconds", label: "Read time", icon: Clock }, { id: "name", label: "A–Z", icon: ArrowDownAZ }],
  cities: [{ id: "visitors", label: "Visitors", icon: Users }, { id: "views", label: "Views", icon: MousePointerClick }, { id: "signed_in", label: "Signed in", icon: UserRound }, { id: "name", label: "A–Z", icon: ArrowDownAZ }],
  pages: [{ id: "views", label: "Views", icon: MousePointerClick }, { id: "visitors", label: "Visitors", icon: Users }, { id: "avg_seconds", label: "Read time", icon: Clock }, { id: "name", label: "A–Z", icon: ArrowDownAZ }],
  sources: [{ id: "views", label: "Views", icon: MousePointerClick }, { id: "visitors", label: "Visitors", icon: Users }, { id: "new_visitors", label: "New", icon: UserPlus }, { id: "name", label: "A–Z", icon: ArrowDownAZ }],
};

/** One row's display name and searchable text for a tab. */
function describe(tab: Tab, row: Row) {
  if (tab === "countries") { const code = text(row.country) || "Unknown"; const name = countryName(code); return { code, name, sub: /^[A-Z]{2}$/i.test(code) ? code.toUpperCase() : "Location not detected", haystack: `${name} ${code}` }; }
  if (tab === "cities") { const code = text(row.country); const name = text(row.city) || "Unknown"; const where = [text(row.region), code ? countryName(code) : ""].filter(Boolean).join(", "); return { code, name, sub: where || "Unknown country", haystack: `${name} ${where} ${code}` }; }
  if (tab === "pages") { const path = text(row.path); return { code: "", name: path, sub: text(row.title), haystack: `${path} ${text(row.title)}` }; }
  const ref = text(row.referrer) || "Direct / none"; return { code: "", name: ref, sub: { direct: "Direct or no referrer", search: "Search engine", social: "Social network", other: "Referring website" }[sourceKind(ref)], haystack: ref };
}

/**
 * Super admin → User activities: the complete audience by country (full name + flag), city, page and traffic
 * source, with suggestion search, icon filters and sorts, share bars, 10-row pages and a CSV of the current view.
 */
export function AudienceExplorer({ days, fallback }: { days: number; fallback: AudienceData }) {
  const [full, setFull] = useState<AudienceData | null>(null);
  const [legacy, setLegacy] = useState(false);
  const [tab, setTab] = useState<Tab>("countries");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState("visitors");
  const [page, setPage] = useState(1);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/super-admin/activity?days=${days}&view=breakdowns`, { cache: "no-store", signal: controller.signal })
      .then(async response => { const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error ?? "service_error"); setFull(body); setLegacy(false); })
      .catch(e => { if (!controller.signal.aborted) { setFull(null); setLegacy(e instanceof Error && e.message === "migration_required"); } });
    return () => controller.abort();
  }, [days]);

  const data = full ?? fallback;
  const meta = TABS.find(item => item.id === tab)!;
  const rows = useMemo(() => data[meta.key] ?? [], [data, meta.key]);
  const totalVisitors = useMemo(() => rows.reduce((sum, row) => sum + (num(row.visitors) ?? 0), 0), [rows]);
  const totalViews = useMemo(() => rows.reduce((sum, row) => sum + (num(row.views) ?? 0), 0), [rows]);

  const tabFilters: Filter[] = useMemo(() => {
    if (tab === "countries") return [
      { id: "signed", label: "With signed-in learners", icon: UserRound, test: has("signed_in") },
      { id: "new", label: "With new visitors", icon: Sparkles, test: has("new_visitors") },
      { id: "known", label: "Hide unknown", icon: EyeOff, test: known("country") },
    ];
    if (tab === "cities") {
      const top = [...new Map(rows.map(row => [text(row.country), 0])).keys()].filter(code => /^[A-Z]{2}$/i.test(code));
      const counts = new Map(top.map(code => [code, rows.filter(row => text(row.country) === code).reduce((s, r) => s + (num(r.visitors) ?? 0), 0)]));
      return [
        ...top.sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0)).slice(0, 6).map(code => ({ id: `country:${code}`, label: countryName(code), icon: Globe2, test: (row: Row) => text(row.country) === code })),
        { id: "signed", label: "With signed-in learners", icon: UserRound, test: has("signed_in") },
        { id: "known", label: "Hide unknown", icon: EyeOff, test: known("city") },
      ];
    }
    if (tab === "pages") return ([["home", "Home", Home], ["dashboard", "Dashboard", LayoutDashboard], ["auth", "Sign-in & checkout", LogIn], ["library", "Public library", Library], ["other", "Other", Compass]] as const)
      .map(([id, label, icon]) => ({ id: `section:${id}`, label, icon, test: (row: Row) => pageSection(text(row.path)) === id }));
    return ([["direct", "Direct", Compass], ["search", "Search", Search], ["social", "Social", Share2], ["other", "Websites", Building2]] as const)
      .map(([id, label, icon]) => ({ id: `kind:${id}`, label, icon, test: (row: Row) => sourceKind(text(row.referrer)) === id }));
  }, [tab, rows]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    // Chips in the same family (countries, sections, kinds) widen the match; different families narrow it.
    const active = tabFilters.filter(f => filters.has(f.id));
    const groups = new Map<string, Filter[]>();
    for (const f of active) { const family = f.id.includes(":") ? f.id.split(":")[0] : f.id; groups.set(family, [...(groups.get(family) ?? []), f]); }
    const out = rows.filter(row => (!q || describe(tab, row).haystack.toLowerCase().includes(q)) && [...groups.values()].every(group => group.some(f => f.test(row))));
    const key = sort;
    return out.sort((a, b) => key === "name" ? describe(tab, a).name.localeCompare(describe(tab, b).name) : (num(b[key]) ?? -1) - (num(a[key]) ?? -1));
  }, [rows, search, filters, tabFilters, sort, tab]);

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return rows.map(row => describe(tab, row)).filter(d => d.haystack.toLowerCase().includes(q) && d.name.toLowerCase() !== q).slice(0, 6);
  }, [rows, search, tab]);

  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = visible.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const leader = visible[0] ? describe(tab, visible[0]) : null;
  const shareBase = tab === "pages" || tab === "sources" ? totalViews : totalVisitors;
  const shareKey = tab === "pages" || tab === "sources" ? "views" : "visitors";

  const reset = (next?: Tab) => { setSearch(""); setFilters(new Set()); setPage(1); setHighlight(-1); if (next) { setTab(next); setSort(SORTS[next][0].id); } };
  const toggle = (id: string) => { setFilters(current => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; }); setPage(1); };
  const choose = (name: string) => { setSearch(name); setSuggestOpen(false); setHighlight(-1); setPage(1); };
  function exportCsv() {
    const columns = Object.keys(visible[0] ?? {});
    const cell = (v: unknown) => { const s = text(v); return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replaceAll('"', '""')}"`; };
    const extra = tab === "countries" ? ["country_name"] : tab === "cities" ? ["country_name"] : [];
    const lines = [[...columns, ...extra].join(","), ...visible.map(row => [...columns.map(c => cell(row[c])), ...extra.map(() => cell(countryName(text(row.country))))].join(","))];
    const url = URL.createObjectURL(new Blob([`﻿${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `audience-${tab}-${days}d.csv`; a.click(); URL.revokeObjectURL(url);
  }

  const columns: { label: string; render: (row: Row) => ReactNode; className?: string }[] = [
    ...(tab === "countries" || tab === "cities" ? [{ label: "Visitors", render: (row: Row) => fmt(row.visitors) }, { label: "Views", render: (row: Row) => fmt(row.views) }] : [{ label: "Views", render: (row: Row) => fmt(row.views) }, { label: "Visitors", render: (row: Row) => fmt(row.visitors) }]),
    { label: "Signed in", render: row => fmt(row.signed_in) },
    ...(tab === "pages" ? [{ label: "Avg. read", render: (row: Row) => seconds(row.avg_seconds) }] : [{ label: "New", render: (row: Row) => fmt(row.new_visitors) }]),
    ...(tab === "countries" ? [{ label: "Cities", render: (row: Row) => fmt(row.cities) }, { label: "Avg. read", render: (row: Row) => seconds(row.avg_seconds) }] : []),
    { label: "Last seen", render: row => ago(row.last_seen), className: styles.muted },
  ];

  return <Card className={`${shell.panel} ${styles.explorer}`}>
    <div className={styles.head}>
      <div><h2><Compass size={18} aria-hidden="true" />Audience explorer</h2><p>Where visitors come from and what they read, over the selected window. Bots are excluded.</p></div>
      <button type="button" className={styles.export} onClick={exportCsv} disabled={!visible.length}><Download size={14} aria-hidden="true" />Export view</button>
    </div>
    {legacy && <p className={styles.legacy} role="note">Showing the top 12 per list. Apply <code>supabase/migrations/0027_activity_breakdowns.sql</code> for complete lists with signed-in, new-visitor, read-time and last-seen figures.</p>}

    <div className={styles.tabs} role="tablist" aria-label="Audience dimension">
      {TABS.map(({ id, label, icon: Icon, key }) => <button key={id} type="button" role="tab" aria-selected={tab === id} className={styles.tab} onClick={() => reset(id)}><Icon size={15} aria-hidden="true" />{label}<span>{fmt((data[key] ?? []).length)}</span></button>)}
    </div>

    <div className={styles.summary}>
      <span><Users size={14} aria-hidden="true" /><b>{fmt(totalVisitors)}</b> visitors</span>
      <span><MousePointerClick size={14} aria-hidden="true" /><b>{fmt(totalViews)}</b> views</span>
      <span><meta.icon size={14} aria-hidden="true" /><b>{fmt(rows.length)}</b> {meta.noun}</span>
      {leader && shareBase > 0 && <span className={styles.leader}>{(tab === "countries" || tab === "cities") && <Flag code={leader.code} />}Top: <b>{leader.name}</b> · {Math.round(((num(visible[0][shareKey]) ?? 0) / shareBase) * 100)}%</span>}
    </div>

    <div className={styles.searchWrap}>
      <div className={styles.search}>
        <Search size={16} aria-hidden="true" className={styles.searchIcon} />
        <input ref={inputRef} type="search" role="combobox" aria-expanded={suggestOpen && suggestions.length > 0} aria-controls={listId} aria-autocomplete="list" aria-activedescendant={highlight >= 0 ? `${listId}-${highlight}` : undefined}
          aria-label={`Search ${meta.noun}`} placeholder={{ countries: "Search a country or code, e.g. India or IN…", cities: "Search a city, state or country…", pages: "Search a path or page title…", sources: "Search a source, e.g. google or instagram…" }[tab]}
          value={search} maxLength={120}
          onChange={e => { setSearch(e.target.value); setSuggestOpen(true); setHighlight(-1); setPage(1); }}
          onFocus={() => setSuggestOpen(true)} onBlur={() => setTimeout(() => setSuggestOpen(false), 120)}
          onKeyDown={e => {
            if (e.key === "ArrowDown" && suggestions.length) { e.preventDefault(); setSuggestOpen(true); setHighlight(h => (h + 1) % suggestions.length); }
            else if (e.key === "ArrowUp" && suggestions.length) { e.preventDefault(); setHighlight(h => (h <= 0 ? suggestions.length : h) - 1); }
            else if (e.key === "Enter" && highlight >= 0 && suggestions[highlight]) { e.preventDefault(); choose(suggestions[highlight].name); }
            else if (e.key === "Escape") { if (suggestOpen && suggestions.length) setSuggestOpen(false); else if (search) { e.preventDefault(); choose(""); } }
          }} />
        {search && <button type="button" className={styles.clear} aria-label="Clear search" onClick={() => { choose(""); inputRef.current?.focus(); }}><X size={14} /></button>}
      </div>
      {suggestOpen && suggestions.length > 0 && <ul id={listId} role="listbox" className={styles.suggestions} aria-label="Suggestions">
        {suggestions.map((s, i) => <li key={`${s.name}-${s.sub}`} id={`${listId}-${i}`} role="option" aria-selected={i === highlight} onMouseDown={e => { e.preventDefault(); choose(s.name); }}>
          {(tab === "countries" || tab === "cities") ? <Flag code={s.code} /> : <Search size={13} aria-hidden="true" />}<span><b>{s.name}</b><small>{s.sub}</small></span>
        </li>)}
      </ul>}
    </div>

    <div className={styles.controls}>
      <div className={styles.chips} role="group" aria-label="Filters">
        {tabFilters.map(f => { const Icon = f.icon; const code = f.id.startsWith("country:") ? f.id.slice(8) : ""; return <button key={f.id} type="button" className={styles.chip} aria-pressed={filters.has(f.id)} onClick={() => toggle(f.id)}>{code ? <Flag code={code} /> : <Icon size={14} aria-hidden="true" />}{f.label}</button>; })}
      </div>
      <div className={styles.chips} role="group" aria-label="Sort by">
        <span className={styles.chipsLabel}>Sort</span>
        {SORTS[tab].map(s => { const Icon = s.icon; return <button key={s.id} type="button" className={styles.chip} data-sort aria-pressed={sort === s.id} onClick={() => { setSort(s.id); setPage(1); }}><Icon size={14} aria-hidden="true" />{s.label}</button>; })}
      </div>
    </div>
    {(search || filters.size > 0) && <p className={styles.active}>{fmt(visible.length)} of {fmt(rows.length)} {meta.noun} match<button type="button" onClick={() => reset()}>Clear all</button></p>}

    {shown.length ? <div className={styles.tableWrap}><table className={styles.table}>
      <thead><tr><th scope="col">#</th><th scope="col">{meta.label.replace("Traffic sources", "Source")}</th><th scope="col">Share</th>{columns.map(c => <th key={c.label} scope="col">{c.label}</th>)}</tr></thead>
      <tbody>{shown.map((row, i) => { const d = describe(tab, row); const share = shareBase ? ((num(row[shareKey]) ?? 0) / shareBase) * 100 : 0; return <tr key={`${d.name}-${d.sub}-${i}`}>
        <td className={styles.rank}>{(current - 1) * PAGE_SIZE + i + 1}</td>
        <td className={styles.nameCell}><div className={styles.name}>{(tab === "countries" || tab === "cities") && <Flag code={d.code} />}<span><b title={d.name}>{d.name}</b>{d.sub && <small title={d.sub}>{d.sub}</small>}</span></div></td>
        <td data-label="Share" className={styles.shareCell}><div className={styles.shareRow}><span className={styles.share}><i style={{ width: `${Math.max(2, share)}%` }} /></span><small>{share >= 10 ? Math.round(share) : share.toFixed(1)}%</small></div></td>
        {columns.map(c => <td key={c.label} data-label={c.label} className={c.className}>{c.render(row)}</td>)}
      </tr>; })}</tbody>
    </table></div> : <p className={shell.empty}>{rows.length ? "Nothing matches this search and these filters." : "No data in this window yet."}</p>}
    <Pager page={current} pages={pages} total={visible.length} size={PAGE_SIZE} onPage={setPage} />
  </Card>;
}
