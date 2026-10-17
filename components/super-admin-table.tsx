"use client";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Ban, Briefcase, Camera, CheckCircle2, ChevronLeft, ChevronRight, CircleDot, Clock, Download, Layers, Monitor, PauseCircle, RotateCcw, Search, Send, SlidersHorizontal, Smartphone, Tablet, ThumbsUp, X, XCircle, PlayCircle, type LucideIcon } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Table as DataTable, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./ui/table";
import { AdminSelect } from "./super-admin-select";
import styles from "./super-admin-table.module.css";

type Row = Record<string, unknown>;
export type AdminColumn = string | { key: string; label?: string; render?: (row: Row) => ReactNode; filter?: boolean; sort?: boolean };
export const PAGE_SIZE = 5;
const PAGE_SIZES = [5, 10, 25, 50];

const text = (value: unknown) => value === null || value === undefined || value === "" ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
const show = (value: unknown) => text(value) || "—";
const isDate = (key: string) => /(^|_)(at|day|date|seen|time|on)$|^created|^updated/.test(key);
const fmtDate = (value: unknown) => { const t = text(value); const d = new Date(t); return t && !Number.isNaN(d.getTime()) && /\d{4}-\d{2}-\d{2}/.test(t) ? d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: /T\d/.test(t) ? "short" : undefined }) : show(value); };
const titleCase = (key: string) => key.replaceAll("_", " ").replace(/^\w/, c => c.toUpperCase());
/** Columns whose few values read best as icon chips above the table, in order of preference. */
const QUICK_KEYS = /^(status|state|platform|kind|tier|role|device|format|event|level|tone|action|result)$/;

/** An icon for a status-like value, chosen by meaning so every table shares one visual language. */
export function valueIcon(value: string): LucideIcon {
  const v = value.toLowerCase();
  if (/(^|_)(active|success|succeeded|paid|captured|live|ok|resolved|published|ready|done|verified|completed?)$/.test(v)) return CheckCircle2;
  if (/(fail|error|banned|declined|rejected|refused|invalid)/.test(v)) return XCircle;
  if (/(pending|queued|planned|waiting|processing|generating|created|authenticated|unverified|new)/.test(v)) return Clock;
  if (/paus|halt/.test(v)) return PauseCircle;
  if (/(cancel|ended|expired|closed|refund|inactive)/.test(v)) return Ban;
  if (/(mobile|phone|iphone|android)/.test(v)) return Smartphone;
  if (/(tablet|ipad)/.test(v)) return Tablet;
  if (/(desktop|laptop|windows|mac)/.test(v)) return Monitor;
  if (v === "instagram") return Camera;
  if (v === "facebook") return ThumbsUp;
  if (v === "linkedin") return Briefcase;
  if (v === "telegram") return Send;
  if (v === "youtube") return PlayCircle;
  return CircleDot;
}

/** One CSV field, quoted when it holds a comma, quote or line break. */
const csvField = (value: unknown) => { const s = text(value); return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s; };

/**
 * Every super admin table: icon chips for the main status-like column, a search box that suggests matching
 * values as you type (cleared in one click), an advanced-filters panel (a filter per low-variety column and a date
 * range when rows carry a timestamp), sortable columns, a page-size choice, numbered pages, CSV export of what is
 * shown, and one Reset that clears it all. On phones each row becomes a labelled card. `query` is the dashboard's
 * global search, applied on top.
 */
export function AdminTable({ title, rows, columns, note, query = "", empty, actions, rowKey }: {
  title: string; rows: Row[]; columns: AdminColumn[]; note?: ReactNode; query?: string; empty?: string; actions?: ReactNode; rowKey?: (row: Row, index: number) => string;
}) {
  const id = useId();
  const cols = useMemo(() => columns.map(column => typeof column === "string" ? { key: column, label: titleCase(column) } as { key: string; label: string; render?: (row: Row) => ReactNode; filter?: boolean; sort?: boolean } : { ...column, label: column.label ?? titleCase(column.key) }), [columns]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [range, setRange] = useState({ from: "", to: "" });
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [size, setSize] = useState(PAGE_SIZE);
  const [page, setPage] = useState(1);
  const box = useRef<HTMLDivElement>(null);

  const dateKey = cols.find(column => isDate(column.key))?.key;
  // A column is filterable when it has a handful of distinct values (status, kind, role…), not free text.
  const facets = useMemo(() => cols.filter(column => column.filter !== false && !isDate(column.key)).map(column => {
    const values = [...new Set(rows.map(row => text(row[column.key])).filter(Boolean))];
    return { ...column, values: values.sort() };
  }).filter(column => column.values.length >= 2 && column.values.length <= 12), [cols, rows]);
  const quick = facets.find(column => QUICK_KEYS.test(column.key) && column.values.length <= 8);

  const filtered = useMemo(() => rows.filter(row => {
    if (search && !cols.some(column => text(row[column.key]).toLowerCase().includes(search.toLowerCase()))) return false;
    if (query && !JSON.stringify(row).toLowerCase().includes(query.toLowerCase())) return false;
    for (const [key, value] of Object.entries(filters)) if (value && value !== "all" && text(row[key]) !== value) return false;
    if (dateKey && (range.from || range.to)) {
      const time = new Date(text(row[dateKey])).getTime();
      if (range.from && time < new Date(`${range.from}T00:00:00`).getTime()) return false;
      if (range.to && time > new Date(`${range.to}T23:59:59.999`).getTime()) return false;
    }
    return true;
  }), [rows, cols, search, query, filters, range, dateKey]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const factor = sort.dir === "asc" ? 1 : -1;
    const value = (row: Row) => row[sort.key];
    return [...filtered].sort((a, b) => {
      const x = value(a), y = value(b);
      if (x === y) return 0; if (x === null || x === undefined || x === "") return 1; if (y === null || y === undefined || y === "") return -1;
      if (typeof x === "number" && typeof y === "number") return (x - y) * factor;
      if (isDate(sort.key)) return (new Date(text(x)).getTime() - new Date(text(y)).getTime()) * factor;
      return text(x).localeCompare(text(y), "en", { numeric: true, sensitivity: "base" }) * factor;
    });
  }, [filtered, sort]);

  // Suggestions: distinct cell values that contain what has been typed, shortest (most likely wanted) first.
  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase(); if (!q) return [];
    const found = new Set<string>();
    for (const row of rows) for (const column of cols) { const value = text(row[column.key]); if (value.length <= 80 && value.toLowerCase().includes(q) && value.toLowerCase() !== q) found.add(value); if (found.size > 40) break; }
    return [...found].sort((a, b) => a.length - b.length).slice(0, 6);
  }, [rows, cols, search]);

  // Any change to what is shown goes back to the first page (adjusted while rendering, not in an effect).
  const signature = JSON.stringify([search, query, filters, range, sort, size]);
  const [shownFor, setShownFor] = useState(signature);
  if (shownFor !== signature) { setShownFor(signature); setPage(1); setActive(-1); }
  useEffect(() => { const close = (event: MouseEvent) => { if (!box.current?.contains(event.target as Node)) setFocused(false); }; document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, []);

  const pages = Math.max(1, Math.ceil(sorted.length / size));
  const current = Math.min(page, pages);
  const shown = sorted.slice((current - 1) * size, current * size);
  const activeFilters = Object.values(filters).filter(value => value && value !== "all").length + (range.from ? 1 : 0) + (range.to ? 1 : 0);
  const anything = activeFilters > 0 || !!search || !!sort;
  const clearFilters = () => { setFilters({}); setRange({ from: "", to: "" }); };
  const resetAll = () => { clearFilters(); setSearch(""); setSort(null); setFocused(false); };
  const pick = (value: string) => { setSearch(value); setFocused(false); };
  const toggleSort = (key: string) => setSort(current => current?.key !== key ? { key, dir: "asc" } : current.dir === "asc" ? { key, dir: "desc" } : null);
  const exportCsv = () => {
    const lines = [cols.map(column => csvField(column.label)).join(","), ...sorted.map(row => cols.map(column => csvField(row[column.key])).join(","))];
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([`﻿${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8" }));
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "table"}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };

  return <Card className={styles.panel}>
    <div className={styles.head}>
      <div className={styles.titleRow}><h2>{title}</h2><Badge variant="secondary">{filtered.length === rows.length ? `${rows.length} records` : `${filtered.length} of ${rows.length}`}</Badge></div>
      <div className={styles.tools}>
        <div className={styles.searchBox} ref={box}>
          <Search size={15} aria-hidden="true" />
          <input type="search" role="combobox" aria-expanded={focused && suggestions.length > 0} aria-controls={`${id}-suggest`} aria-autocomplete="list" aria-activedescendant={active >= 0 ? `${id}-s${active}` : undefined}
            aria-label={`Search ${title}`} placeholder="Search…" value={search} onFocus={() => setFocused(true)}
            onChange={event => { setSearch(event.target.value); setFocused(true); }}
            onKeyDown={event => {
              if (event.key === "Escape") { setFocused(false); return; }
              if (!suggestions.length) return;
              if (event.key === "ArrowDown") { event.preventDefault(); setFocused(true); setActive(index => (index + 1) % suggestions.length); }
              if (event.key === "ArrowUp") { event.preventDefault(); setActive(index => (index - 1 + suggestions.length) % suggestions.length); }
              if (event.key === "Enter" && active >= 0) { event.preventDefault(); pick(suggestions[active]); }
            }} />
          {search && <button type="button" className={styles.clearSearch} aria-label="Clear search" title="Clear search" onClick={() => { setSearch(""); setFocused(false); }}><X size={14} /></button>}
          {focused && suggestions.length > 0 && <ul id={`${id}-suggest`} role="listbox" className={styles.suggest} aria-label="Suggestions">
            {suggestions.map((value, index) => <li key={value} id={`${id}-s${index}`} role="option" aria-selected={index === active} onMouseDown={event => { event.preventDefault(); pick(value); }}><Search size={12} aria-hidden="true" />{value}</li>)}
          </ul>}
        </div>
        {(facets.length > 0 || dateKey) && <button type="button" className={styles.filterButton} aria-pressed={open} aria-expanded={open} aria-controls={`${id}-filters`} onClick={() => setOpen(value => !value)} title="Advanced filters">
          <SlidersHorizontal size={15} aria-hidden="true" /><span>Filters</span>{activeFilters > 0 && <span className={styles.filterCount}>{activeFilters}</span>}
        </button>}
        <button type="button" className={styles.iconButton} onClick={exportCsv} disabled={!sorted.length} title="Download the rows shown as CSV" aria-label={`Export ${title} as CSV`}><Download size={15} aria-hidden="true" /></button>
        <button type="button" className={styles.iconButton} onClick={resetAll} disabled={!anything} title="Reset search, filters and sorting" aria-label="Reset search, filters and sorting"><RotateCcw size={15} aria-hidden="true" /></button>
        {actions}
      </div>
    </div>
    {note && <p className={styles.note}>{note}</p>}
    {quick && <div className={styles.chips} role="group" aria-label={`Filter by ${quick.label.toLowerCase()}`}>
      <button type="button" aria-pressed={!filters[quick.key] || filters[quick.key] === "all"} onClick={() => setFilters(current => ({ ...current, [quick.key]: "all" }))}><Layers size={13} aria-hidden="true" />All<span>{rows.length}</span></button>
      {quick.values.map(value => { const Icon = valueIcon(value); return <button type="button" key={value} data-value={value.toLowerCase()} aria-pressed={filters[quick.key] === value} onClick={() => setFilters(current => ({ ...current, [quick.key]: current[quick.key] === value ? "all" : value }))}>
        <Icon size={13} aria-hidden="true" />{value.replaceAll("_", " ")}<span>{rows.filter(row => text(row[quick.key]) === value).length}</span>
      </button>; })}
    </div>}
    {open && <div id={`${id}-filters`} className={styles.filters}>
      {facets.map(column => <div key={column.key} className={styles.field}><label htmlFor={`${id}-${column.key}`}>{column.label}</label>
        <AdminSelect id={`${id}-${column.key}`} label={column.label} value={filters[column.key] ?? "all"} onValueChange={value => setFilters(current => ({ ...current, [column.key]: value }))}
          options={[{ value: "all", label: `All` }, ...column.values.map(value => ({ value, label: value.length > 40 ? `${value.slice(0, 40)}…` : value }))]} /></div>)}
      {dateKey && <>
        <div className={styles.field}><label htmlFor={`${id}-from`}>From</label><input id={`${id}-from`} type="date" className={styles.date} value={range.from} max={range.to || undefined} onChange={event => setRange(current => ({ ...current, from: event.target.value }))} /></div>
        <div className={styles.field}><label htmlFor={`${id}-to`}>To</label><input id={`${id}-to`} type="date" className={styles.date} value={range.to} min={range.from || undefined} onChange={event => setRange(current => ({ ...current, to: event.target.value }))} /></div>
      </>}
      <button type="button" className={styles.clearFilters} disabled={!activeFilters} onClick={clearFilters}><X size={13} />Clear filters</button>
    </div>}
    {shown.length ? <>
      <div className={styles.tableWrap}><DataTable><TableHeader><TableRow>{cols.map(column => {
        const sortable = column.sort !== false;
        const state = sort?.key === column.key ? sort.dir : null;
        return <TableHead key={column.key} aria-sort={state === "asc" ? "ascending" : state === "desc" ? "descending" : undefined}>
          {sortable ? <button type="button" className={styles.sortButton} onClick={() => toggleSort(column.key)} title={`Sort by ${column.label}`} aria-label={`Sort by ${column.label}`}>{column.label}{state === "asc" ? <ArrowUp size={12} aria-hidden="true" /> : state === "desc" ? <ArrowDown size={12} aria-hidden="true" /> : <ArrowUpDown size={12} aria-hidden="true" className={styles.sortIdle} />}</button> : column.label}
        </TableHead>;
      })}</TableRow></TableHeader>
        <TableBody>{shown.map((row, index) => <TableRow key={rowKey ? rowKey(row, index) : text(row.id ?? row.event_id ?? row.session_id ?? `${current}-${index}`)}>
          {cols.map(column => <TableCell key={column.key} data-label={column.label}>{"render" in column && column.render ? column.render(row) : isDate(column.key) ? fmtDate(row[column.key]) : <span className={styles.cell}>{show(row[column.key])}</span>}</TableCell>)}
        </TableRow>)}</TableBody></DataTable></div>
      <div className={styles.footer}>
        <label className={styles.sizeField}><span>Rows</span><select value={size} onChange={event => setSize(Number(event.target.value))} aria-label="Rows per page">{PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}</select></label>
        <Pager page={current} pages={pages} total={sorted.length} onPage={setPage} size={size} />
      </div>
    </> : <div className={styles.empty}><p>{anything || query ? "No records match your search or filters." : empty ?? "No recorded activity in this view yet."}</p>{(anything || query) && <button type="button" onClick={resetAll}><RotateCcw size={13} aria-hidden="true" />Reset search and filters</button>}</div>}
  </Card>;
}

/** "Showing 6–10 of 42", previous/next and numbered pages with the first and last always reachable. */
export function Pager({ page, pages, total, onPage, size = PAGE_SIZE }: { page: number; pages: number; total: number; onPage: (page: number) => void; size?: number }) {
  if (!total) return null;
  const numbers = [...new Set([1, pages, page - 1, page, page + 1].filter(n => n >= 1 && n <= pages))].sort((a, b) => a - b);
  return <nav className={styles.pager} aria-label="Pages">
    <span>Showing {(page - 1) * size + 1}–{Math.min(total, page * size)} of {total}</span>
    <div>
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft size={14} /></button>
      {numbers.map((n, i) => <span key={n} className={styles.pageGroup}>{i > 0 && n - numbers[i - 1] > 1 && <span className={styles.gap}>…</span>}
        <button type="button" aria-current={n === page ? "page" : undefined} onClick={() => onPage(n)}>{n}</button></span>)}
      <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight size={14} /></button>
    </div>
  </nav>;
}
