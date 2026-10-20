"use client";
import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Ban, Globe2, Layers, Scale, Search, ServerCrash, Siren, Timer, UserX, X, XCircle, type LucideIcon } from "lucide-react";
import { Pager } from "./super-admin-table";
import styles from "./super-admin-security.module.css";
import trace from "./super-admin-trace-table.module.css";

export type TraceRow = { at: string; method: string; path: string | null; status: number | null; reason: string; ip: string | null; ua: string | null; requestId: string | null };
const PAGE = 10;
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

/** Icon filters: one per kind of refusal, each with how many rows it matches. */
const FILTERS: { id: string; label: string; icon: LucideIcon; match: (r: TraceRow) => boolean }[] = [
  { id: "all", label: "All", icon: Layers, match: () => true },
  { id: "401", label: "Not signed in", icon: UserX, match: r => r.status === 401 },
  { id: "403", label: "Forbidden", icon: Ban, match: r => r.status === 403 && r.reason !== "Cross-site request blocked" },
  { id: "cross-site", label: "Cross-site", icon: Globe2, match: r => r.reason === "Cross-site request blocked" },
  { id: "429", label: "Rate limited", icon: Timer, match: r => r.status === 429 },
  { id: "413", label: "Oversized", icon: Scale, match: r => r.status === 413 },
  { id: "405", label: "Wrong method", icon: XCircle, match: r => r.status === 405 },
  { id: "admin", label: "Admin API", icon: Siren, match: r => Boolean(r.path?.startsWith("/api/super-admin")) },
  { id: "5xx", label: "Server errors", icon: ServerCrash, match: r => (r.status ?? 0) >= 500 },
];

/** Search fields: `field:value` narrows to one column; plain words match any of them. */
const FIELDS: Record<string, { label: string; value: (r: TraceRow) => string | null }> = {
  ip: { label: "Source IP", value: r => r.ip },
  path: { label: "Path", value: r => r.path },
  reason: { label: "Reason", value: r => r.reason },
  status: { label: "Status", value: r => r.status == null ? null : String(r.status) },
  method: { label: "Method", value: r => r.method },
  id: { label: "Request id", value: r => r.requestId },
  browser: { label: "Browser", value: r => r.ua },
};

/** Every term must match: `field:value` against that field, a bare word against any field. Quotes keep spaces. */
export function matchesQuery(row: TraceRow, query: string) {
  const terms = query.match(/(\w+:)?"[^"]*"|\S+/g) ?? [];
  return terms.every(term => {
    const [, field, raw] = /^(?:(\w+):)?(.*)$/.exec(term) ?? [];
    const value = raw.replace(/^"|"$/g, "").toLowerCase();
    if (!value) return true;
    const known = field ? FIELDS[field.toLowerCase()] : undefined;
    if (field && known) return Boolean(known.value(row)?.toLowerCase().includes(value));
    const text = (field ? `${field}:${value}` : value);
    return Object.values(FIELDS).some(f => f.value(row)?.toLowerCase().includes(text));
  });
}

/**
 * The blocked-request trace: icon filters by kind of refusal, a search with field-aware suggestions (ip:, path:,
 * status:, reason:, id:, browser:), a clear button and ten rows a page.
 */
export function TraceTable({ rows, query, onQuery, truncated }: Readonly<{ rows: TraceRow[]; query: string; onQuery: (query: string) => void; truncated: boolean }>) {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();

  const counts = useMemo(() => Object.fromEntries(FILTERS.map(f => [f.id, rows.filter(f.match).length])), [rows]);
  const shown = useMemo(() => {
    const kind = FILTERS.find(f => f.id === filter) ?? FILTERS[0];
    return rows.filter(r => kind.match(r) && matchesQuery(r, query.trim()));
  }, [rows, filter, query]);
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const current = Math.min(page, pages);
  const visible = shown.slice((current - 1) * PAGE, current * PAGE);

  // Suggestions for the word being typed: field names first, then values seen in the data, most frequent first.
  const suggestions = useMemo(() => {
    const words = query.split(/\s+/); const last = (words.at(-1) ?? "").toLowerCase();
    const [, field, partial = ""] = /^(?:(\w+):)?(.*)$/.exec(last) ?? [];
    const out: { label: string; hint: string; insert: string }[] = [];
    if (!field) for (const [key, f] of Object.entries(FIELDS)) if (key.startsWith(partial) && out.length < 3) out.push({ label: `${key}:`, hint: `Search by ${f.label.toLowerCase()}`, insert: `${key}:` });
    const keys = field && FIELDS[field] ? [field] : Object.keys(FIELDS);
    const seen = new Map<string, { key: string; count: number }>();
    for (const r of rows) for (const key of keys) {
      const value = FIELDS[key].value(r); if (!value) continue;
      const short = key === "browser" ? value.slice(0, 60) : value;
      if (partial && !short.toLowerCase().includes(partial)) continue;
      const id = `${key}\u0000${short}`; const hit = seen.get(id); seen.set(id, { key, count: (hit?.count ?? 0) + 1 });
    }
    for (const [id, { key, count }] of [...seen].sort((a, b) => b[1].count - a[1].count).slice(0, 8 - out.length)) {
      const value = id.split("\u0000")[1];
      out.push({ label: `${key}:${value}`, hint: `${FIELDS[key].label} · ${count} request${count === 1 ? "" : "s"}`, insert: `${key}:${/\s/.test(value) ? `"${value}"` : value}` });
    }
    return query.trim() || open ? out : [];
  }, [query, rows, open]);

  const choose = (insert: string) => {
    const words = query.split(/\s+/); words[words.length - 1] = insert;
    const next = words.join(" ") + (insert.endsWith(":") ? "" : " ");
    onQuery(next.trimStart()); setPage(1); setActive(-1); setOpen(!insert.endsWith(":") ? false : true); input.current?.focus();
  };
  const onKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && suggestions.length) { event.preventDefault(); setOpen(true); setActive(a => (a + 1) % suggestions.length); }
    else if (event.key === "ArrowUp" && suggestions.length) { event.preventDefault(); setActive(a => (a <= 0 ? suggestions.length : a) - 1); }
    else if (event.key === "Enter" && open && active >= 0 && suggestions[active]) { event.preventDefault(); choose(suggestions[active].insert); }
    else if (event.key === "Escape") { if (open) { event.preventDefault(); setOpen(false); setActive(-1); } else if (query) onQuery(""); }
  };
  const clear = () => { onQuery(""); setFilter("all"); setPage(1); setActive(-1); input.current?.focus(); };
  const expanded = open && suggestions.length > 0;

  return <section className={styles.card} data-tone="slate" aria-labelledby="sec-log">
    <div className={styles.logHead}>
      <h3 id="sec-log"><Search size={16} aria-hidden="true" />Trace blocked requests</h3>
      <div className={trace.searchBox}>
        <div className={styles.search}>
          <Search size={14} aria-hidden="true" />
          <input ref={input} type="search" role="combobox" aria-label="Search blocked requests" aria-expanded={expanded} aria-controls={listId} aria-autocomplete="list"
            aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
            placeholder="ip:, path:, status:, reason:… or any word" value={query}
            onChange={e => { onQuery(e.target.value); setPage(1); setOpen(true); setActive(-1); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 120)} onKeyDown={onKey} />
          {(query || filter !== "all") && <button type="button" className={trace.clear} onClick={clear} aria-label="Clear search and filters"><X size={14} aria-hidden="true" />Clear</button>}
        </div>
        {expanded && <ul id={listId} role="listbox" className={trace.suggestions} aria-label="Search suggestions">
          {suggestions.map((s, i) => <li key={s.label} id={`${listId}-${i}`} role="option" aria-selected={i === active} onMouseDown={e => { e.preventDefault(); choose(s.insert); }}>
            <code>{s.label}</code><small>{s.hint}</small>
          </li>)}
        </ul>}
      </div>
    </div>
    <div className={trace.filters} role="group" aria-label="Filter by kind of block">
      {FILTERS.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-pressed={filter === id} disabled={id !== "all" && !counts[id]} onClick={() => { setFilter(id); setPage(1); }} title={label} aria-label={`${label}: ${counts[id]}`}>
        <Icon size={14} aria-hidden="true" /><span>{label}</span><b>{counts[id]}</b>
      </button>)}
    </div>
    {visible.length ? <div className={styles.tableWrap}><table className={styles.table}>
      <thead><tr><th>When</th><th>Request</th><th>Status</th><th>Reason</th><th>Source</th><th>Request id</th></tr></thead>
      <tbody>{visible.map((r, i) => <tr key={`${r.requestId ?? ""}-${(current - 1) * PAGE + i}`}>
        <td data-label="When">{when(r.at)}</td>
        <td data-label="Request"><code>{r.method} {r.path}</code></td>
        <td data-label="Status"><span className={styles.status}>{r.status}</span></td>
        <td data-label="Reason">{r.reason}</td>
        <td data-label="Source"><button type="button" className={trace.link} onClick={() => { onQuery(`ip:${r.ip}`); setPage(1); }} disabled={!r.ip} title="Show every block from this source"><code>{r.ip ?? "—"}</code></button>{r.ua && <small title={r.ua}>{r.ua.slice(0, 48)}</small>}</td>
        <td data-label="Request id"><code className={styles.small}>{r.requestId ?? "—"}</code></td>
      </tr>)}</tbody>
    </table></div> : <p className={styles.empty}>{query || filter !== "all" ? "No blocked request matches this search and filter." : "No blocked requests in this window."}</p>}
    <Pager page={current} pages={pages} total={shown.length} size={PAGE} onPage={setPage} />
    <p className={styles.note}>Recorded for every API request refused for sign-in, permission, origin, size or rate limits, with the source address and browser, and kept 90 days. The table holds the latest {rows.length.toLocaleString("en-IN")} blocks{truncated ? " (of the most recent 5,000 failed requests)" : ""}. The request id matches the X-Request-ID response header and the server logs.</p>
  </section>;
}
