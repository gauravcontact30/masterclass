"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, Clock, Inbox, ListChecks, LoaderCircle, MessageSquarePlus, RefreshCw, Search, Send, SlidersHorizontal, X, XCircle } from "lucide-react";
import { SUGGESTION_CATEGORIES, SUGGESTION_PRIORITIES, SUGGESTION_STATUSES, suggestionError, suggestionLabel, type Suggestion, type SuggestionUpdate } from "@/lib/suggestions";
import { suggestionRequest, SuggestionHistory } from "./suggestion-box";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Pager } from "./super-admin-table";
import styles from "./suggestion-box.module.css";

type InboxData = { suggestions: Suggestion[]; total: number; counts: Record<string, number> };
const icons = { new: Inbox, reviewing: Search, planned: ListChecks, in_progress: LoaderCircle, completed: CheckCircle2, declined: XCircle };
const emptyFilters = { search: "", status: "", category: "", priority: "", from: "", to: "", sort: "newest" };

export function SuperAdminSuggestions() {
  const [filters, setFilters] = useState(emptyFilters);
  const [advanced, setAdvanced] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<InboxData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const serial = useRef(0);
  const updateFilter = (key: keyof typeof filters, value: string) => { setFilters(f => ({ ...f, [key]: value })); setPage(1); };
  useEffect(() => {
    const controller = new AbortController(); const sequence = ++serial.current;
    const timer = setTimeout(async () => {
      setBusy(true); setError("");
      try {
        const result = await suggestionRequest<InboxData>(`/api/super-admin/suggestions?${new URLSearchParams({ ...filters, page: String(page) })}`, { signal: controller.signal });
        if (sequence === serial.current && !controller.signal.aborted) {
          const last = Math.max(1, Math.ceil(result.total / 10));
          if (page > last) { setPage(last); return; }
          setData(result);
        }
      } catch (e) {
        if (!controller.signal.aborted && sequence === serial.current) { setData(null); setError(e instanceof Error && e.message === "migration_required" ? "Apply Supabase migration 0025_suggestion_box.sql to enable this inbox." : suggestionError(e instanceof Error ? e.message : "")); }
      } finally { if (!controller.signal.aborted && sequence === serial.current) setBusy(false); }
    }, 250);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [filters, page, revision]);

  return <section className={styles.inbox} aria-label="Suggestion Box">
    <div><h2 className="text-xl font-semibold flex items-center gap-2"><MessageSquarePlus size={22} />Suggestion Box</h2><p className="text-sm text-muted-foreground mt-1">Listen, review and keep contributors informed. Replies appear in their private tracking view.</p></div>
    <div className={styles.toolbar}><Search size={17} aria-hidden="true" /><Input aria-label="Search suggestions" placeholder="Search title, message, contributor, email, ID or reply…" maxLength={200} value={filters.search} onChange={e => updateFilter("search", e.target.value)} /><Button variant="ghost" aria-label="Clear suggestion search" disabled={!filters.search} onClick={() => updateFilter("search", "")}><X size={16} /></Button><Button variant="outline" aria-expanded={advanced} onClick={() => setAdvanced(v => !v)}><SlidersHorizontal size={15} />Advanced filters</Button><Button variant="outline" disabled={busy} onClick={() => setRevision(v => v + 1)}><RefreshCw size={15} />Refresh</Button></div>
    <div className={styles.chips} role="group" aria-label="Filter suggestions by status"><Button variant={!filters.status ? "default" : "outline"} onClick={() => updateFilter("status", "")}><Inbox size={14} />All {data ? Object.values(data.counts).reduce((a, b) => a + b, 0) : ""}</Button>{SUGGESTION_STATUSES.map(status => { const Icon = icons[status]; return <Button key={status} variant={filters.status === status ? "default" : "outline"} aria-pressed={filters.status === status} onClick={() => updateFilter("status", filters.status === status ? "" : status)}><Icon size={14} />{suggestionLabel(status)} {data?.counts[status] ?? 0}</Button>; })}</div>
    {advanced && <div className={styles.filters}>
      <label>Category<select value={filters.category} onChange={e => updateFilter("category", e.target.value)}><option value="">All categories</option>{SUGGESTION_CATEGORIES.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Priority<select value={filters.priority} onChange={e => updateFilter("priority", e.target.value)}><option value="">All priorities</option>{SUGGESTION_PRIORITIES.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>From (UTC)<Input type="date" value={filters.from} max={filters.to || undefined} onChange={e => updateFilter("from", e.target.value)} /></label><label>Through (UTC)<Input type="date" value={filters.to} min={filters.from || undefined} onChange={e => updateFilter("to", e.target.value)} /></label>
      <label>Sort<select value={filters.sort} onChange={e => updateFilter("sort", e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="updated">Recently updated</option></select></label>
      <Button variant="outline" onClick={() => { setFilters(emptyFilters); setPage(1); }}><X size={14} />Reset all filters</Button>
    </div>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {busy && <p role="status">Loading suggestions…</p>}
    {!busy && data && <><p className="text-xs text-muted-foreground">{data.total} matching suggestions · 10 per page · status counts cover the entire inbox</p>
      <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th scope="col">Suggestion</th><th scope="col">Contributor</th><th scope="col">Category</th><th scope="col">Status</th><th scope="col">Priority</th><th scope="col">Submitted</th><th scope="col">Action</th></tr></thead><tbody>
        {data.suggestions.map(row => <tr key={row.id}><td><button onClick={() => setSelected(row.id)}>{row.title}</button><small>{row.id}</small></td><td>{row.name}<small>{row.email || "No email supplied"}</small></td><td>{suggestionLabel(row.category)}</td><td><span className={styles.status}>{suggestionLabel(row.status)}</span></td><td>{suggestionLabel(row.priority ?? "normal")}</td><td>{new Date(row.created_at).toLocaleDateString()}</td><td><Button variant="outline" size="sm" onClick={() => setSelected(row.id)}>Review & reply</Button></td></tr>)}
        {!data.suggestions.length && <tr><td colSpan={7}>No suggestions match these filters.</td></tr>}
      </tbody></table></div><Pager page={page} pages={Math.max(1, Math.ceil(data.total / 10))} total={data.total} size={10} onPage={setPage} /></>}
    <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className={styles.modal}><DialogHeader><DialogTitle>Review suggestion</DialogTitle><DialogDescription>Update its progress or send a reply visible to the contributor.</DialogDescription></DialogHeader>{selected && <SuggestionReview key={selected} id={selected} onSaved={() => setRevision(v => v + 1)} />}</DialogContent></Dialog>
  </section>;
}

function SuggestionReview({ id, onSaved }: { id: string; onSaved: () => void }) {
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
  return <>{error && <p role="alert" className={styles.error}>{error}</p>}<Button variant="outline" disabled={busy} onClick={() => { setError(""); void load().catch(e => setError(suggestionError(e.message))); }}><RefreshCw size={14} />Reload suggestion</Button>{!data ? <p role="status">Loading suggestion…</p> : <>
    <section className={styles.receipt}><h3>{data.suggestion.title}</h3><small>{data.suggestion.name} {data.suggestion.email ? `(${data.suggestion.email})` : ""}</small><p>{data.suggestion.body}</p><small><Clock size={12} className="inline" /> Submitted {new Date(data.suggestion.created_at).toLocaleString()}</small></section>
    <SuggestionHistory updates={data.updates} />
    <form onSubmit={save} className={styles.form}><div className={styles.twoColumns}><label>Progress status<select value={status} onChange={e => setStatus(e.target.value)} disabled={busy}>{SUGGESTION_STATUSES.map(value => <option key={value} value={value}>{suggestionLabel(value)}</option>)}</select></label><label>Priority (admin only)<select value={priority} onChange={e => setPriority(e.target.value)} disabled={busy}>{SUGGESTION_PRIORITIES.map(value => <option key={value} value={value}>{suggestionLabel(value)}</option>)}</select></label></div><label>Reply to contributor<Textarea value={reply} onChange={e => setReply(e.target.value)} maxLength={4000} rows={4} disabled={busy} placeholder="Explain the next step, ask for context, or thank them for their idea." /></label><p className={styles.hint}>Status changes and replies are saved in the history. Priority is visible only to admins.</p><Button type="submit" disabled={busy || (!reply.trim() && status === data.suggestion.status && priority === data.suggestion.priority)}><Send size={14} />{busy ? "Saving…" : "Save update & reply"}</Button>{message && <p role="status">{message}</p>}</form>
  </>}</>;
}
