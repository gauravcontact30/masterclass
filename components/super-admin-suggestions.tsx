"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, Clock, Copy, Download, Ellipsis, Flame, Inbox, ListChecks, LoaderCircle, Mail, MessageCircleReply, MessageSquarePlus, Minus, RefreshCw, Search, Send, SlidersHorizontal, Trash2, X, XCircle, type LucideIcon } from "lucide-react";
import { SUGGESTION_CATEGORIES, SUGGESTION_PAGE_SIZE, SUGGESTION_PRIORITIES, SUGGESTION_SCOPES, SUGGESTION_STATUSES, suggestionError, suggestionLabel, type Suggestion, type SuggestionCategory, type SuggestionPriority, type SuggestionStatus, type SuggestionUpdate } from "@/lib/suggestions";
import { suggestionRequest, SuggestionHistory } from "./suggestion-shared";
import { CATEGORY_ICONS } from "./suggestion-box-panel";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Pager } from "./super-admin-table";
import modal from "./suggestion-box.module.css";
import styles from "./super-admin-suggestions.module.css";

type InboxData = { suggestions: Suggestion[]; total: number; counts: Record<string, number>; awaitingReply?: number; urgent?: number; legacy?: boolean };
type Filters = { search: string; scope: string; status: string; category: string; priority: string; replied: string; from: string; to: string; sort: string };
export const STATUS_ICONS: Record<SuggestionStatus, LucideIcon> = { new: Inbox, reviewing: Search, planned: ListChecks, in_progress: LoaderCircle, completed: CheckCircle2, declined: XCircle };
const PRIORITY_ICONS: Record<SuggestionPriority, LucideIcon> = { low: ArrowDown, normal: Minus, high: ArrowUp, urgent: Flame };
const SCOPE_LABELS: Record<(typeof SUGGESTION_SCOPES)[number], string> = { all: "All fields", title: "Title", message: "Message", contributor: "Contributor", reply: "Replies", id: "Suggestion ID" };
const SORT_LABELS: Record<string, string> = { newest: "Newest first", oldest: "Oldest first", updated: "Recently updated", priority: "Highest priority" };
const REPLIED_LABELS: Record<string, string> = { yes: "Replied", no: "Awaiting reply" };
const emptyFilters: Filters = { search: "", scope: "all", status: "", category: "", priority: "", replied: "", from: "", to: "", sort: "newest" };
/** Starting points for a reply; the admin edits before saving. */
const REPLY_TEMPLATES = [
  { label: "Thanks", status: "reviewing", text: "Thank you for taking the time to share this. We are reviewing it and will update you here." },
  { label: "Planned", status: "planned", text: "Great idea, and we have added it to our plan. We will post here when work starts." },
  { label: "In progress", status: "in_progress", text: "Good news: we have started working on this. We will let you know as soon as it is live." },
  { label: "Done", status: "completed", text: "This is now live. Thank you for helping us improve, and please keep the ideas coming." },
  { label: "More details", status: "reviewing", text: "Thanks for the suggestion. Could you share a little more detail, for example the page and what you expected to happen?" },
  { label: "Not now", status: "declined", text: "Thank you for the suggestion. We have decided not to take this forward for now, but we appreciate you sharing it." },
] as const;
const relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
function ago(iso: string) {
  const days = Math.round((Date.parse(iso) - Date.now()) / 86400000);
  if (days === 0) { const hours = Math.round((Date.parse(iso) - Date.now()) / 3600000); return hours === 0 ? "just now" : relative.format(hours, "hour"); }
  return Math.abs(days) < 30 ? relative.format(days, "day") : new Date(iso).toLocaleDateString();
}
const query = (filters: Filters, extra: Record<string, string> = {}) => new URLSearchParams(Object.entries({ ...filters, ...extra }).filter(([key, value]) => value !== "" && !(key === "scope" && value === "all") && !(key === "sort" && value === "newest")));

export function StatusPill({ status }: { status: string }) {
  const Icon = STATUS_ICONS[status as SuggestionStatus] ?? Inbox;
  return <span className={styles.statusPill} data-status={status}><Icon size={12} aria-hidden="true" />{suggestionLabel(status)}</span>;
}
function PriorityTag({ priority }: { priority: string }) {
  const Icon = PRIORITY_ICONS[priority as SuggestionPriority] ?? Minus;
  return <span className={styles.priority} data-priority={priority}><Icon size={13} aria-hidden="true" />{suggestionLabel(priority)}</span>;
}

export function SuperAdminSuggestions() {
  const [filters, setFilters] = useState(emptyFilters);
  const [advanced, setAdvanced] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<InboxData | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(true);
  const [working, setWorking] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null);
  const [revision, setRevision] = useState(0);
  const serial = useRef(0);
  const updateFilter = (key: keyof Filters, value: string) => { setFilters(f => ({ ...f, [key]: value })); setPage(1); };
  const toggleFilter = (key: keyof Filters, value: string) => updateFilter(key, filters[key] === value ? "" : value);
  const reload = () => setRevision(v => v + 1);
  useEffect(() => {
    const controller = new AbortController(); const sequence = ++serial.current;
    const timer = setTimeout(async () => {
      setBusy(true); setError("");
      try {
        const result = await suggestionRequest<InboxData>(`/api/super-admin/suggestions?${query(filters, { page: String(page) })}`, { signal: controller.signal });
        if (sequence === serial.current && !controller.signal.aborted) {
          const last = Math.max(1, Math.ceil(result.total / SUGGESTION_PAGE_SIZE));
          if (page > last) { setPage(last); return; }
          setData(result); setChecked(new Set());
        }
      } catch (e) {
        if (!controller.signal.aborted && sequence === serial.current) { setData(null); setError(e instanceof Error && e.message === "migration_required" ? "Apply Supabase migration 0025_suggestion_box.sql to enable this inbox." : suggestionError(e instanceof Error ? e.message : "")); }
      } finally { if (!controller.signal.aborted && sequence === serial.current) setBusy(false); }
    }, 250);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [filters, page, revision]);

  const counts = data?.counts ?? {};
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const legacy = !!data?.legacy;
  const rows = data?.suggestions ?? [];
  const allChecked = rows.length > 0 && rows.every(row => checked.has(row.id));
  const active = useMemo(() => {
    const tokens: { key: keyof Filters; label: string }[] = [];
    if (filters.search) tokens.push({ key: "search", label: `“${filters.search}”${filters.scope !== "all" ? ` in ${SCOPE_LABELS[filters.scope as keyof typeof SCOPE_LABELS].toLowerCase()}` : ""}` });
    if (filters.status) tokens.push({ key: "status", label: `Status: ${suggestionLabel(filters.status)}` });
    if (filters.category) tokens.push({ key: "category", label: `Category: ${suggestionLabel(filters.category)}` });
    if (filters.priority) tokens.push({ key: "priority", label: `Priority: ${suggestionLabel(filters.priority)}` });
    if (filters.replied) tokens.push({ key: "replied", label: REPLIED_LABELS[filters.replied] });
    if (filters.from) tokens.push({ key: "from", label: `From ${filters.from}` });
    if (filters.to) tokens.push({ key: "to", label: `Through ${filters.to}` });
    if (filters.sort !== "newest") tokens.push({ key: "sort", label: SORT_LABELS[filters.sort] });
    return tokens;
  }, [filters]);
  const advancedCount = active.filter(token => !["search", "status"].includes(token.key)).length;

  async function bulk(body: { action: "update"; status?: string; priority?: string } | { action: "delete" }, ids: string[]) {
    setWorking(true); setError(""); setNotice("");
    try {
      const result = await suggestionRequest<{ affected: number }>("/api/super-admin/suggestions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, ids }) });
      setNotice(body.action === "delete" ? `Deleted ${result.affected} suggestion${result.affected === 1 ? "" : "s"}.` : `Updated ${result.affected} suggestion${result.affected === 1 ? "" : "s"}${result.affected < ids.length ? ` (${ids.length - result.affected} already matched)` : ""}.`);
      setChecked(new Set()); reload();
    } catch (e) { setError(e instanceof Error && e.message === "migration_required" ? "Bulk actions need Supabase migration 0026_suggestion_box_admin.sql." : suggestionError(e instanceof Error ? e.message : "")); }
    finally { setWorking(false); }
  }
  const copy = async (text: string, what: string) => { try { await navigator.clipboard.writeText(text); setNotice(`${what} copied.`); } catch { setError(`Could not copy the ${what.toLowerCase()}.`); } };
  const tiles: { label: string; value: number | undefined; note: string; icon: LucideIcon; tone: string; pressed: boolean; apply: () => void }[] = [
    { label: "All suggestions", value: data ? total : undefined, note: "Across the whole inbox", icon: MessageSquarePlus, tone: "clay", pressed: !filters.status && !filters.replied, apply: () => { setFilters(f => ({ ...f, status: "", replied: "" })); setPage(1); } },
    { label: "Awaiting review", value: data ? counts.new ?? 0 : undefined, note: "New, not yet triaged", icon: Inbox, tone: "blue", pressed: filters.status === "new", apply: () => toggleFilter("status", "new") },
    { label: "Needs a reply", value: data?.awaitingReply, note: legacy ? "Needs migration 0026" : "Open, with no reply yet", icon: MessageCircleReply, tone: "amber", pressed: filters.replied === "no", apply: () => { if (!legacy) toggleFilter("replied", "no"); } },
    { label: "Urgent & open", value: data?.urgent, note: legacy ? "Needs migration 0026" : "Urgent priority, still open", icon: Flame, tone: "red", pressed: filters.priority === "urgent", apply: () => toggleFilter("priority", "urgent") },
    { label: "Completed", value: data ? counts.completed ?? 0 : undefined, note: "Shipped and closed", icon: CheckCircle2, tone: "green", pressed: filters.status === "completed", apply: () => toggleFilter("status", "completed") },
  ];

  return <section className={styles.inbox} aria-label="Suggestion Box">
    <header className={styles.head}>
      {/* The dashboard's page header carries the "Suggestion Box" title; this heading names the inbox for assistive tech. */}
      <h2 className={styles.inboxTitle}><Inbox size={16} aria-hidden="true" />Inbox</h2>
      <div className={styles.headActions}>
        <Button variant="outline" disabled={busy} onClick={reload}><RefreshCw size={15} className={busy ? styles.spin : undefined} />Refresh</Button>
        {legacy || !data?.total ? <Button variant="outline" disabled title={legacy ? "Export needs migration 0026" : "Nothing to export"}><Download size={15} />Export CSV</Button>
          : <Button variant="outline" nativeButton={false} render={<a href={`/api/super-admin/suggestions?${query(filters, { format: "csv" })}`} download />}><Download size={15} />Export CSV</Button>}
      </div>
    </header>

    {legacy && <p className={styles.legacy} role="note">Basic inbox mode. Apply <code>supabase/migrations/0026_suggestion_box_admin.sql</code> to turn on field-scoped search, the reply filter, priority sorting, reply counts, bulk actions and CSV export.</p>}

    <div className={styles.tiles}>
      {tiles.map(({ label, value, note, icon: Icon, tone, pressed, apply }) => <button key={label} type="button" className={styles.tile} data-tone={tone} aria-pressed={pressed} onClick={apply}>
        <span className={styles.tileIcon} aria-hidden="true"><Icon size={17} /></span>
        <span className={styles.tileLabel}>{label}</span>
        <strong>{value ?? "—"}</strong>
        <small>{note}</small>
      </button>)}
    </div>

    <div className={styles.searchRow}>
      <div className={styles.search}>
        <Search size={17} aria-hidden="true" className={styles.searchIcon} />
        <input type="search" aria-label="Search suggestions" placeholder={filters.scope === "all" ? "Search title, message, contributor, email, ID or reply…" : `Search ${SCOPE_LABELS[filters.scope as keyof typeof SCOPE_LABELS].toLowerCase()}…`} maxLength={200} value={filters.search} onChange={e => updateFilter("search", e.target.value)} onKeyDown={e => { if (e.key === "Escape" && filters.search) { e.preventDefault(); updateFilter("search", ""); } }} />
        {filters.search && <button type="button" className={styles.clear} aria-label="Clear suggestion search" onClick={() => updateFilter("search", "")}><X size={15} /></button>}
        <label className={styles.scope}><span>Search in</span><select aria-label="Search in" value={filters.scope} disabled={legacy} onChange={e => updateFilter("scope", e.target.value)}>{SUGGESTION_SCOPES.map(scope => <option key={scope} value={scope}>{SCOPE_LABELS[scope]}</option>)}</select></label>
      </div>
      <Button variant={advanced ? "default" : "outline"} className={styles.filterToggle} aria-expanded={advanced} aria-controls="suggestion-filters" onClick={() => setAdvanced(v => !v)}><SlidersHorizontal size={15} />Filters{advancedCount > 0 && <span className={styles.badge}>{advancedCount}</span>}</Button>
    </div>

    <div className={styles.chips} role="group" aria-label="Filter suggestions by status">
      <button type="button" className={styles.chip} aria-pressed={!filters.status} onClick={() => updateFilter("status", "")}><Inbox size={14} aria-hidden="true" />All {data ? total : ""}</button>
      {SUGGESTION_STATUSES.map(status => { const Icon = STATUS_ICONS[status]; return <button type="button" key={status} className={styles.chip} data-status={status} aria-pressed={filters.status === status} onClick={() => toggleFilter("status", status)}><Icon size={14} aria-hidden="true" />{suggestionLabel(status)} {counts[status] ?? 0}</button>; })}
    </div>

    {advanced && <div id="suggestion-filters" className={styles.filters}>
      <fieldset><legend>Category</legend><div className={styles.chipSet}>{SUGGESTION_CATEGORIES.map(value => { const Icon = CATEGORY_ICONS[value as SuggestionCategory]; return <button type="button" key={value} className={styles.chip} aria-pressed={filters.category === value} onClick={() => toggleFilter("category", value)}><Icon size={14} aria-hidden="true" />{suggestionLabel(value)}</button>; })}</div></fieldset>
      <fieldset><legend>Priority</legend><div className={styles.chipSet}>{SUGGESTION_PRIORITIES.map(value => { const Icon = PRIORITY_ICONS[value]; return <button type="button" key={value} className={styles.chip} data-priority={value} aria-pressed={filters.priority === value} onClick={() => toggleFilter("priority", value)}><Icon size={14} aria-hidden="true" />{suggestionLabel(value)}</button>; })}</div></fieldset>
      <fieldset disabled={legacy}><legend>Replies</legend><div className={styles.chipSet}>{(["yes", "no"] as const).map(value => <button type="button" key={value} className={styles.chip} aria-pressed={filters.replied === value} onClick={() => toggleFilter("replied", value)}>{value === "yes" ? <MessageCircleReply size={14} aria-hidden="true" /> : <Clock size={14} aria-hidden="true" />}{REPLIED_LABELS[value]}</button>)}</div></fieldset>
      <div className={styles.filterFields}>
        <label>From (UTC)<Input type="date" value={filters.from} max={filters.to || undefined} onChange={e => updateFilter("from", e.target.value)} /></label>
        <label>Through (UTC)<Input type="date" value={filters.to} min={filters.from || undefined} onChange={e => updateFilter("to", e.target.value)} /></label>
        <label>Sort<select value={filters.sort} onChange={e => updateFilter("sort", e.target.value)}>{Object.entries(SORT_LABELS).map(([value, label]) => <option key={value} value={value} disabled={legacy && value === "priority"}>{label}</option>)}</select></label>
      </div>
    </div>}

    {active.length > 0 && <div className={styles.tokens} aria-label="Active filters">
      {active.map(token => <button type="button" key={token.key} className={styles.token} onClick={() => { if (token.key === "search") updateFilter("search", ""); else updateFilter(token.key, emptyFilters[token.key]); }} aria-label={`Remove filter ${token.label}`}>{token.label}<X size={12} aria-hidden="true" /></button>)}
      <button type="button" className={styles.clearAll} onClick={() => { setFilters(emptyFilters); setPage(1); }}>Clear all</button>
    </div>}

    {error && <p role="alert" className={modal.error}>{error}</p>}
    {notice && <p role="status" className={styles.notice}><CheckCircle2 size={15} aria-hidden="true" />{notice}<button type="button" aria-label="Dismiss" onClick={() => setNotice("")}><X size={14} /></button></p>}

    {checked.size > 0 && <div className={styles.bulkBar} role="region" aria-label="Bulk actions">
      <strong>{checked.size} selected</strong>
      <DropdownMenu><DropdownMenuTrigger className={styles.bulkButton} disabled={working || legacy}><ListChecks size={15} />Set status</DropdownMenuTrigger>
        <DropdownMenuContent className="w-52"><DropdownMenuGroup><DropdownMenuLabel>Move selected to</DropdownMenuLabel>{SUGGESTION_STATUSES.map(status => { const Icon = STATUS_ICONS[status]; return <DropdownMenuItem key={status} onClick={() => bulk({ action: "update", status }, [...checked])}><Icon size={14} />{suggestionLabel(status)}</DropdownMenuItem>; })}</DropdownMenuGroup></DropdownMenuContent></DropdownMenu>
      <DropdownMenu><DropdownMenuTrigger className={styles.bulkButton} disabled={working || legacy}><Flame size={15} />Set priority</DropdownMenuTrigger>
        <DropdownMenuContent className="w-48"><DropdownMenuGroup><DropdownMenuLabel>Priority</DropdownMenuLabel>{SUGGESTION_PRIORITIES.map(priority => { const Icon = PRIORITY_ICONS[priority]; return <DropdownMenuItem key={priority} onClick={() => bulk({ action: "update", priority }, [...checked])}><Icon size={14} />{suggestionLabel(priority)}</DropdownMenuItem>; })}</DropdownMenuGroup></DropdownMenuContent></DropdownMenu>
      <button type="button" className={styles.bulkButton} data-danger disabled={working || legacy} onClick={() => setConfirmDelete([...checked])}><Trash2 size={15} />Delete</button>
      <button type="button" className={styles.bulkButton} onClick={() => setChecked(new Set())}><X size={15} />Clear selection</button>
    </div>}

    {busy && !data && <p role="status" className={styles.loading}><LoaderCircle size={16} className={styles.spin} aria-hidden="true" />Loading suggestions…</p>}
    {data && <>
      <p className={styles.meta} aria-live="polite">{busy ? "Updating…" : `${data.total} matching suggestion${data.total === 1 ? "" : "s"} · ${SUGGESTION_PAGE_SIZE} per page · counts cover the whole inbox`}</p>
      <div className={styles.tableWrap} data-busy={busy || undefined}><table className={styles.table}>
        <thead><tr>
          <th scope="col" className={styles.checkCell}><input type="checkbox" aria-label="Select all suggestions on this page" checked={allChecked} disabled={!rows.length || legacy} onChange={() => setChecked(allChecked ? new Set() : new Set(rows.map(row => row.id)))} /></th>
          <th scope="col">Suggestion</th><th scope="col">Contributor</th><th scope="col">Category</th><th scope="col">Status</th><th scope="col">Priority</th><th scope="col">Replies</th><th scope="col">Submitted</th><th scope="col"><span className={styles.srOnly}>Actions</span></th>
        </tr></thead>
        <tbody>
          {rows.map(row => { const CategoryIcon = CATEGORY_ICONS[row.category as SuggestionCategory] ?? Ellipsis; return <tr key={row.id} data-checked={checked.has(row.id) || undefined}>
            <td className={styles.checkCell}><input type="checkbox" aria-label={`Select ${row.title}`} checked={checked.has(row.id)} disabled={legacy} onChange={() => setChecked(current => { const next = new Set(current); if (next.has(row.id)) next.delete(row.id); else next.add(row.id); return next; })} /></td>
            <td className={styles.titleCell}><button type="button" className={styles.titleButton} onClick={() => setSelected(row.id)}>{row.title}</button>{row.body && <span className={styles.snippet}>{row.body}</span>}<small className={styles.id}>{row.id}</small></td>
            <td data-label="Contributor"><span className={styles.person}>{row.name}</span><small>{row.email || "No email supplied"}</small></td>
            <td data-label="Category"><span className={styles.category}><CategoryIcon size={13} aria-hidden="true" />{suggestionLabel(row.category)}</span></td>
            <td data-label="Status"><StatusPill status={row.status} /></td>
            <td data-label="Priority"><PriorityTag priority={row.priority ?? "normal"} /></td>
            <td data-label="Replies"><span className={styles.replies} data-none={!row.reply_count || undefined}><MessageCircleReply size={13} aria-hidden="true" />{row.reply_count ?? "—"}</span></td>
            <td data-label="Submitted"><time dateTime={row.created_at} title={new Date(row.created_at).toLocaleString()}>{new Date(row.created_at).toLocaleDateString()}</time><small>{ago(row.created_at)}</small></td>
            <td className={styles.actionsCell}>
              <Button variant="outline" size="sm" aria-label={`Review and reply: ${row.title}`} onClick={() => setSelected(row.id)}><MessageCircleReply size={14} /><span className={styles.reviewLabel}>Review</span></Button>
              <DropdownMenu><DropdownMenuTrigger className={styles.iconButton} aria-label={`More options for ${row.title}`}><Ellipsis size={16} /></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setSelected(row.id)}><MessageCircleReply size={14} />Review & reply</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => copy(row.id, "Suggestion ID")}><Copy size={14} />Copy suggestion ID</DropdownMenuItem>
                  {row.email && <DropdownMenuItem render={<a href={`mailto:${row.email}?subject=${encodeURIComponent(`Re: ${row.title}`)}`} />}><Mail size={14} />Email contributor</DropdownMenuItem>}
                  {!legacy && <><DropdownMenuSeparator /><DropdownMenuGroup><DropdownMenuLabel>Set status</DropdownMenuLabel>
                    {SUGGESTION_STATUSES.filter(status => status !== row.status).map(status => { const Icon = STATUS_ICONS[status]; return <DropdownMenuItem key={status} onClick={() => bulk({ action: "update", status }, [row.id])}><Icon size={14} />{suggestionLabel(status)}</DropdownMenuItem>; })}
                  </DropdownMenuGroup><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete([row.id])}><Trash2 size={14} />Delete suggestion</DropdownMenuItem></>}
                </DropdownMenuContent></DropdownMenu>
            </td>
          </tr>; })}
          {!rows.length && <tr><td colSpan={9} className={styles.empty}><Inbox size={26} aria-hidden="true" /><strong>No suggestions match these filters.</strong>{active.length > 0 && <button type="button" className={styles.clearAll} onClick={() => { setFilters(emptyFilters); setPage(1); }}>Clear all filters</button>}</td></tr>}
        </tbody>
      </table></div>
      <Pager page={page} pages={Math.max(1, Math.ceil(data.total / SUGGESTION_PAGE_SIZE))} total={data.total} size={SUGGESTION_PAGE_SIZE} onPage={setPage} />
    </>}

    <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className={`${modal.modal} ${styles.reviewModal}`}><DialogHeader className={modal.header}><span className={modal.headerMark} aria-hidden="true"><MessageCircleReply size={22} /></span><DialogTitle className={modal.title}>Review suggestion</DialogTitle><DialogDescription className={modal.lede}>Update its progress or send a reply the contributor sees with their tracking code.</DialogDescription></DialogHeader>{selected && <SuggestionReview key={selected} id={selected} onSaved={reload} onDelete={legacy ? undefined : () => setConfirmDelete([selected])} />}</DialogContent></Dialog>

    <Dialog open={!!confirmDelete} onOpenChange={open => { if (!open) setConfirmDelete(null); }}><DialogContent className={`${modal.modal} ${styles.confirm}`}><DialogHeader><DialogTitle className={modal.title}>Delete {confirmDelete?.length === 1 ? "this suggestion" : `${confirmDelete?.length} suggestions`}?</DialogTitle><DialogDescription className={modal.lede}>This permanently removes {confirmDelete?.length === 1 ? "it" : "them"} with every reply and status change. Contributors’ tracking codes stop working. This cannot be undone.</DialogDescription></DialogHeader>
      <div className={modal.actions}><Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button><Button variant="destructive" disabled={working} onClick={async () => { const ids = confirmDelete ?? []; setConfirmDelete(null); if (ids.includes(selected ?? "")) setSelected(null); await bulk({ action: "delete" }, ids); }}><Trash2 size={14} />{working ? "Deleting…" : "Delete permanently"}</Button></div>
    </DialogContent></Dialog>
  </section>;
}

function SuggestionReview({ id, onSaved, onDelete }: { id: string; onSaved: () => void; onDelete?: () => void }) {
  const [data, setData] = useState<{ suggestion: Suggestion; updates: SuggestionUpdate[] } | null>(null);
  const [status, setStatus] = useState("new"); const [priority, setPriority] = useState("normal"); const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  const load = useCallback(async (signal?: AbortSignal) => {
    const result = await suggestionRequest<{ suggestion: Suggestion; updates: SuggestionUpdate[] }>(`/api/super-admin/suggestions?id=${id}`, { signal });
    if (!signal?.aborted) { setData(result); setStatus(result.suggestion.status); setPriority(result.suggestion.priority ?? "normal"); }
  }, [id]);
  useEffect(() => { const controller = new AbortController(); queueMicrotask(() => { if (!controller.signal.aborted) void load(controller.signal).catch(e => { if (!controller.signal.aborted) setError(suggestionError(e.message)); }); }); return () => controller.abort(); }, [load]);
  async function save(event: FormEvent) {
    event.preventDefault(); if (!data || busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const saved = await suggestionRequest<{ suggestion: Suggestion }>("/api/super-admin/suggestions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, version: data.suggestion.version, status, priority, reply }) });
      setData(previous => previous ? { ...previous, suggestion: saved.suggestion } : previous);
      setReply(""); setMessage("Saved. The contributor can see this update using their tracking code."); onSaved();
      try { await load(); } catch { setMessage("Saved successfully. Reload to see the refreshed history."); }
    } catch (e) { setError(suggestionError(e instanceof Error ? e.message : "")); }
    finally { setBusy(false); }
  }
  if (!data) return <>{error && <p role="alert" className={modal.error}>{error}</p>}<p role="status" className={styles.loading}><LoaderCircle size={16} className={styles.spin} aria-hidden="true" />Loading suggestion…</p></>;
  const s = data.suggestion; const CategoryIcon = CATEGORY_ICONS[s.category as SuggestionCategory] ?? Ellipsis;
  const unchanged = !reply.trim() && status === s.status && priority === s.priority;
  return <>
    {error && <p role="alert" className={modal.error}>{error}</p>}
    <section className={styles.reviewCard}>
      <div className={styles.reviewTags}><StatusPill status={s.status} /><PriorityTag priority={s.priority ?? "normal"} /><span className={styles.category}><CategoryIcon size={13} aria-hidden="true" />{suggestionLabel(s.category)}</span></div>
      <h3>{s.title}</h3>
      <p>{s.body}</p>
      <div className={styles.reviewPerson}>
        <span><strong>{s.name}</strong>{s.email ? <a href={`mailto:${s.email}?subject=${encodeURIComponent(`Re: ${s.title}`)}`}><Mail size={13} aria-hidden="true" />{s.email}</a> : <small>No email supplied</small>}</span>
        <small><Clock size={12} aria-hidden="true" /> Submitted {new Date(s.created_at).toLocaleString()}</small>
      </div>
    </section>
    {data.updates.length > 0 && <div className={styles.reviewHistory}><h4>History</h4><SuggestionHistory updates={data.updates} /></div>}
    <form onSubmit={save} className={modal.form}>
      <fieldset className={styles.statusPicker} disabled={busy}><legend>Progress status</legend><div>
        {SUGGESTION_STATUSES.map(value => { const Icon = STATUS_ICONS[value]; return <label key={value} data-status={value}><input type="radio" name="status" value={value} checked={status === value} onChange={() => setStatus(value)} /><Icon size={14} aria-hidden="true" /><span>{suggestionLabel(value)}</span></label>; })}
      </div></fieldset>
      <label>Priority (admin only)<select className={styles.select} value={priority} onChange={e => setPriority(e.target.value)} disabled={busy}>{SUGGESTION_PRIORITIES.map(value => <option key={value} value={value}>{suggestionLabel(value)}</option>)}</select></label>
      <div className={styles.templates} role="group" aria-label="Quick replies"><span>Quick replies</span>{REPLY_TEMPLATES.map(template => <button type="button" key={template.label} disabled={busy} onClick={() => { setReply(template.text); setStatus(template.status); }}>{template.label}</button>)}</div>
      <label>Reply to contributor<Textarea value={reply} onChange={e => setReply(e.target.value)} maxLength={4000} rows={4} disabled={busy} placeholder="Explain the next step, ask for context, or thank them for their idea." /></label>
      <p className={modal.hint}>Status changes and replies are saved in the history. Priority is visible only to admins.</p>
      <div className={styles.reviewActions}>
        <Button type="submit" disabled={busy || unchanged}><Send size={14} />{busy ? "Saving…" : "Save update & reply"}</Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={() => { setError(""); void load().catch(e => setError(suggestionError(e.message))); }}><RefreshCw size={14} />Reload</Button>
        {onDelete && <Button type="button" variant="ghost" className={styles.deleteButton} disabled={busy} onClick={onDelete}><Trash2 size={14} />Delete</Button>}
      </div>
      {message && <p role="status" className={styles.notice}><CheckCircle2 size={15} aria-hidden="true" />{message}</p>}
    </form>
  </>;
}
