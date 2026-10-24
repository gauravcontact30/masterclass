"use client";
import { AccordionSummary } from "@/components/ui/accordion-chevron";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, RefreshCw } from "lucide-react";
import { DOCS_CHECK_INTERVAL, type DocumentationUpdate, type SourceSnapshot } from "@/lib/documentation-updates";
import { requestJson } from "@/lib/client";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import styles from "./documentation-refresh.module.css";

type SnapshotResponse = { published: SourceSnapshot | null; pending: SourceSnapshot | null; importedAt: string | null };
const endpoint = "/api/documentation-updates";
const statusLabels: Record<DocumentationUpdate["status"], string> = {
  unchecked: "Not checked", available: "Ready to import", changed: "Update available", current: "Imported source is current", error: "Check failed",
};
function message(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "signin_required") return "Sign in to check or upgrade documentation.";
  if (code === "rate_limited") return "Too many checks. Please try again in an hour.";
  if (code === "documentation_changed_check_again") return "This source changed since your preview. Select the technology again before importing.";
  if (code === "documentation_storage_unavailable") return "Documentation storage is unavailable. Your existing imports are unchanged. Please retry.";
  return "Unable to refresh documentation. Please try again.";
}
const date = (value: string | null) => value ? new Date(value).toLocaleString() : "Never";

export function DocumentationRefresh() {
  const [open, setOpen] = useState(false);
  const [updates, setUpdates] = useState<DocumentationUpdate[]>([]);
  const [selected, setSelected] = useState("");
  const [sourceState, setSourceState] = useState<{ id: string; revision: number; data: SnapshotResponse | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const sourceReady = sourceState?.id === selected && sourceState?.revision === revision;
  const snapshot = sourceReady ? sourceState.data : null;
  const loadingSource = open && !!selected && !sourceReady;
  const running = useRef(false);
  const mounted = useRef(false);

  const check = useCallback(async (ids: string[], background = false) => {
    if (running.current || !ids.length) return;
    running.current = true;
    setBusy(true); setError("");
    let changed = 0, failed = 0;
    try {
      for (let index = 0; index < ids.length && mounted.current; index += 3) {
        const response = await requestJson<{ results: { id: string; update?: DocumentationUpdate; error?: string }[] }>(endpoint, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "check", ids: ids.slice(index, index + 3) }),
        });
        if (!mounted.current) return;
        changed += response.results.filter(result => result.update?.status === "changed").length;
        failed += response.results.filter(result => result.error).length;
        setUpdates(current => current.map(item => {
          const result = response.results.find(result => result.id === item.id);
          return result?.update ?? (result?.error ? { ...item, status: "error", error: result.error } : item);
        }));
      }
      if (mounted.current) {
        setNotice(changed ? `${changed} official source${changed === 1 ? " has" : "s have"} changed. Review and upgrade below.` : failed ? `${failed} source${failed === 1 ? " could" : "s could"} not be checked. Existing imports are unchanged.` : "Check complete. Select a technology to review its latest source.");
        setRevision(value => value + 1);
      }
    } catch (cause) {
      if (mounted.current && (!background || !(cause instanceof Error && cause.message === "signin_required"))) setError(message(cause));
    } finally {
      running.current = false;
      if (mounted.current) setBusy(false);
    }
  }, []);

  const load = useCallback(async (automatic = false) => {
    try {
      const { updates: next } = await requestJson<{ updates: DocumentationUpdate[] }>(endpoint);
      if (!mounted.current) return;
      setUpdates(next); setError("");
      setSelected(current => current || next.find(item => item.status === "changed")?.id || next[0]?.id || "");
      if (automatic) void check(next.filter(item => !item.checkedAt || Date.now() - Date.parse(item.checkedAt) >= DOCS_CHECK_INTERVAL).map(item => item.id), true);
    } catch (cause) { if (mounted.current) setError(message(cause)); }
  }, [check]);

  useEffect(() => {
    mounted.current = true;
    void Promise.resolve().then(() => { if (mounted.current) void load(true); });
    const interval = setInterval(() => { if (document.visibilityState === "visible") void load(true); }, DOCS_CHECK_INTERVAL);
    return () => { mounted.current = false; clearInterval(interval); };
  }, [load]);

  useEffect(() => {
    if (!open || !selected) return;
    const controller = new AbortController();
    void requestJson<SnapshotResponse>(`${endpoint}?id=${encodeURIComponent(selected)}`, { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setSourceState({ id: selected, revision, data }); })
      .catch(cause => { if (!controller.signal.aborted) { setError(message(cause)); setSourceState({ id: selected, revision, data: null }); } });
    return () => controller.abort();
  }, [open, selected, revision]);

  async function upgrade() {
    if (!snapshot?.pending || running.current) return;
    running.current = true; setBusy(true); setError("");
    try {
      const { update } = await requestJson<{ update: DocumentationUpdate }>(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import", id: selected, hash: snapshot.pending.hash }),
      });
      setUpdates(current => current.map(item => item.id === update.id ? update : item));
      setNotice(`${update.title}: latest checked source imported into this website.`);
      setRevision(value => value + 1);
      window.dispatchEvent(new Event("documentation-updated"));
    } catch (cause) { setError(message(cause)); }
    finally { running.current = false; setBusy(false); }
  }

  const changed = updates.filter(item => item.status === "changed").length;
  const item = updates.find(item => item.id === selected);
  return <>
    <Button size="sm" variant="outline" className={styles.trigger} onClick={() => { setOpen(true); if (!updates.length) void load(); }} aria-label={changed ? `Latest documentation: ${changed} updates available` : "Latest documentation"}>
      <RefreshCw size={14} aria-hidden="true" className={busy ? "spin" : undefined} />
      <span>Latest documentation</span>
      {changed > 0 && <span className={styles.count}><Bell size={12} aria-hidden="true" />{changed}</span>}
    </Button>
    <span className={styles.srOnly} role="status">{changed > 0 ? `${changed} documentation updates available. Open Latest documentation to upgrade.` : ""}</span>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className={styles.dialog}>
        <DialogHeader><DialogTitle>Latest documentation</DialogTitle><DialogDescription>Check official technology sources and import the latest source text into this website.</DialogDescription></DialogHeader>
        <p className={styles.help}>Official overview pages are checked every 6 hours while this dashboard is open. Imports contain up to 24,000 characters from the linked page; authored lessons and code examples are not automatically rewritten.</p>
        {error && <p role="alert" className={styles.error}>{error}</p>}
        {notice && <p role="status" className={styles.notice}>{notice}</p>}
        <label className={styles.label}>Technology
          <select value={selected} onChange={event => { setSelected(event.target.value); setError(""); }} disabled={busy || !updates.length}>
            {!updates.length && <option value="">Loading technologies…</option>}
            {updates.map(item => <option key={item.id} value={item.id}>{item.title} — {statusLabels[item.status]}</option>)}
          </select>
        </label>
        <div className={styles.actions}>
          <Button variant="outline" size="sm" disabled={busy || !selected} onClick={() => void check([selected])}><RefreshCw size={14} aria-hidden="true" />{busy ? "Working…" : "Check selected"}</Button>
          <Button variant="outline" size="sm" disabled={busy || !updates.length} onClick={() => void check(updates.map(item => item.id))}>Check all technologies</Button>
          <Button size="sm" disabled={busy || loadingSource || !snapshot?.pending || snapshot.pending.hash === snapshot.published?.hash} onClick={() => void upgrade()}>{snapshot?.published ? "Upgrade documentation" : "Import latest source"}</Button>
        </div>
        {item && <div className={styles.meta}>
          <strong>{statusLabels[item.status]}</strong>
          {item.error && <p role="alert">{item.error}</p>}
          <span>Last checked: {date(item.checkedAt)}</span><span>Last imported: {date(item.importedAt)}</span>
        </div>}
        {loadingSource ? <p role="status">Loading source…</p> : snapshot?.pending ? <section className={styles.source} aria-label="Latest official source preview"><h3>{snapshot.pending.title}</h3><p>{snapshot.pending.text}</p></section> : <p className={styles.help}>Check this technology to fetch its official source. A first check creates a comparison baseline; future checks detect source changes.</p>}
      </DialogContent>
    </Dialog>
  </>;
}

export function ImportedDocumentation({ technologyId }: { technologyId: string }) {
  const [result, setResult] = useState<{ id: string; source: SourceSnapshot | null } | null>(null);
  const source = result?.id === technologyId ? result.source : null;
  useEffect(() => {
    const controller = new AbortController();
    const load = () => void requestJson<SnapshotResponse>(`${endpoint}?id=${encodeURIComponent(technologyId)}`, { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setResult({ id: technologyId, source: result.published }); }).catch(() => { /* Existing curated content remains available. */ });
    load(); window.addEventListener("documentation-updated", load);
    return () => { controller.abort(); window.removeEventListener("documentation-updated", load); };
  }, [technologyId]);
  if (!source) return null;
  return <details className={styles.imported}><AccordionSummary>Imported official documentation · fetched {date(source.retrievedAt)}</AccordionSummary><section className={styles.source}><h3>{source.title}</h3><p>{source.text}</p></section></details>;
}
