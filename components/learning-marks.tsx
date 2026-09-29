"use client";

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Highlighter, Eraser, Trash2 } from "lucide-react";
import { MARKER_COLORS, anchorText, locateAnchor, type LearningMark, type MarkerColor, type TextAnchor } from "@/lib/learning-marks";
import { renderPersonalText, restorePersonalText, selectionAnchor, textModel, wordAtPoint } from "@/lib/learning-text-dom";
import { onAuthChange } from "@/lib/auth-listener";
import styles from "./learning-marks.module.css";

type SelectionTarget = { regionId: string; contentKey: string; anchor: TextAnchor };
type MarkDraft = Omit<LearningMark, "updatedAt">;
type State = { userId: string | null; marks: LearningMark[]; status: "loading" | "ready" | "signin" | "error" };
type MarkContext = State & {
  selection: SelectionTarget | null; busy: boolean; message: string;
  save: (mark: MarkDraft) => Promise<boolean>; unhighlight: (target: SelectionTarget) => Promise<void>;
  refresh: () => void; clearSelection: () => void;
  erasing: boolean; setErasing: (enabled: boolean) => void;
  brush: boolean; color: MarkerColor; setBrush: (enabled: boolean) => void; setColor: (color: MarkerColor) => void;
  pendingCount: number; retryPending: () => void;
};
const Context = createContext<MarkContext | null>(null);
const endpoint = "/api/learning-marks";

export function LearningMarksProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ userId: null, marks: [], status: "loading" });
  const [selection, setSelection] = useState<SelectionTarget | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [brush, setBrush] = useState(false);
  const [erasing, setErasing] = useState(false);
  const [removals, setRemovals] = useState<string[]>([]);
  const removalsRef = useRef(new Set<string>());
  const [color, setColor] = useState<MarkerColor>("yellow");
  const [pending, setPending] = useState<LearningMark[]>([]);
  const pendingRef = useRef<LearningMark[]>([]);
  const brushSaving = useRef(false);
  const brushFailed = useRef(false);
  const brushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  const epoch = useRef(0);
  const loading = useRef<AbortController | null>(null);
  const mutation = useRef(false);
  const channel = useRef<BroadcastChannel | null>(null);
  const clearSelection = useCallback(() => { setSelection(null); window.getSelection()?.removeAllRanges(); }, []);
  const flushPending = useCallback(async function flushPending() {
    brushTimer.current = null;
    if (brushSaving.current || (!pendingRef.current.length && !removalsRef.current.size) || !stateRef.current.userId) return;
    if (mutation.current) { brushTimer.current = setTimeout(() => void flushPending(), 200); return; }
    const owner = stateRef.current.userId, generation = epoch.current;
    const batch = pendingRef.current.slice(0, 50);
    const removedBatch = [...removalsRef.current].slice(0, 50);
    brushSaving.current = true; loading.current?.abort();
    setMessage("Saving highlights to your account…");
    let failed = false;
    try {
      let data: { userId: string; marks: LearningMark[]; failedIds: string[] } = { userId: owner, marks: [], failedIds: [] };
      if (batch.length) {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ marks: batch.map(mark => {
        const { id, contentKey, kind, color, quote, prefix, suffix, start, end } = mark;
        return { id, contentKey, kind, color, quote, prefix, suffix, start, end, expectedUserId: owner };
      }) }) });
      if (generation !== epoch.current) return;
      if (!response.ok) throw Error("save");
      data = await response.json();
      }
      if (generation !== epoch.current || data.userId !== owner) return;
      const removedIds = new Set<string>();
      for (let offset = 0; offset < removedBatch.length; offset += 10) {
        if (generation !== epoch.current) return;
        const outcomes = await Promise.allSettled(removedBatch.slice(offset, offset + 10).map(async id => {
          const response = await fetch(endpoint, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, expectedUserId: owner }) });
          if (!response.ok || (await response.json()).userId !== owner) throw Error("remove");
          return id;
        }));
        for (const result of outcomes) { if (result.status === "fulfilled") removedIds.add(result.value); else failed = true; }
      }
      if (generation !== epoch.current) return;
      const savedIds = new Set(data.marks.map(mark => mark.id));
      const next: State = { userId: owner, status: "ready", marks: [...stateRef.current.marks.filter(mark => !savedIds.has(mark.id) && !removedIds.has(mark.id)), ...data.marks.filter(mark => !removedIds.has(mark.id))] };
      stateRef.current = next; setState(next);
      pendingRef.current = pendingRef.current.filter(mark => !savedIds.has(mark.id) || batch.find(item => item.id === mark.id)?.updatedAt !== mark.updatedAt);
      setPending([...pendingRef.current]);
      removedIds.forEach(id => removalsRef.current.delete(id)); setRemovals([...removalsRef.current]);
      failed = failed || data.failedIds.length > 0;
      if (failed) throw Error("partial_save");
      setMessage(pendingRef.current.length || removalsRef.current.size ? "Saving highlights to your account…" : "Highlights saved to your account.");
      channel.current?.postMessage({ userId: owner });
    } catch {
      failed = true;
      if (generation === epoch.current) setMessage("Some highlights are visible but not saved. Keep this page open and retry saving.");
    } finally {
      if (generation === epoch.current) {
        brushSaving.current = false; brushFailed.current = failed;
        if (!failed && (pendingRef.current.length || removalsRef.current.size)) brushTimer.current = setTimeout(() => void flushPending(), 100);
      }
    }
  }, []);
  const load = useCallback(async () => {
    if (mutation.current || brushSaving.current || pendingRef.current.length || removalsRef.current.size) return;
    loading.current?.abort();
    const controller = new AbortController(); loading.current = controller;
    const generation = epoch.current;
    const commit = (next: State) => { stateRef.current = next; setState(next); };
    try {
      const marks: LearningMark[] = [];
      let cursor: string | null = null, owner: string | null = null;
      do {
        const response = await fetch(`${endpoint}${cursor ? `?after=${cursor}` : ""}`, { signal: controller.signal, cache: "no-store" });
        if (controller.signal.aborted || epoch.current !== generation) return;
        if (response.status === 401) { commit({ userId: null, marks: [], status: "signin" }); return; }
        if (!response.ok) throw new Error("load");
        const data: { userId: string; marks: LearningMark[]; nextCursor: string | null } = await response.json();
        if (owner && owner !== data.userId) throw new Error("account_changed");
        owner = data.userId; marks.push(...data.marks); cursor = data.nextCursor;
      } while (cursor);
      if (!controller.signal.aborted && epoch.current === generation) commit({ userId: owner, marks: [...new Map(marks.map(mark => [mark.id, mark])).values()], status: "ready" });
    } catch {
      if (!controller.signal.aborted && epoch.current === generation) commit({ ...stateRef.current, status: "error" });
    }
  }, []);
  useEffect(() => {
    void load();
    let knownUser: string | null | undefined;
    const unsubscribe = onAuthChange((_event, session) => {
      const nextUser = session?.user.id ?? null;
      if (knownUser === nextUser) return;
      knownUser = nextUser;
      epoch.current++; loading.current?.abort(); mutation.current = false;
      pendingRef.current = []; setPending([]); removalsRef.current.clear(); setRemovals([]); setErasing(false); brushSaving.current = false; brushFailed.current = false; setBrush(false);
      if (brushTimer.current) clearTimeout(brushTimer.current);
      const next: State = { userId: nextUser, marks: [], status: nextUser ? "loading" : "signin" };
      stateRef.current = next; setState(next); setSelection(null); setBusy(false); setMessage("");
      if (nextUser) queueMicrotask(() => void load());
    });
    const focus = () => { if (document.visibilityState === "visible") void load(); };
    window.addEventListener("focus", focus); document.addEventListener("visibilitychange", focus);
    if (typeof BroadcastChannel !== "undefined") {
      channel.current = new BroadcastChannel("learning-marks");
      channel.current.onmessage = event => { if (event.data?.userId === stateRef.current.userId) void load(); };
    }
    const generationRef = epoch;
    return () => { generationRef.current++; loading.current?.abort(); if (brushTimer.current) clearTimeout(brushTimer.current); unsubscribe(); window.removeEventListener("focus", focus); document.removeEventListener("visibilitychange", focus); channel.current?.close(); };
  }, [load]);
  useEffect(() => {
    if (!brush) return;
    document.documentElement.dataset.learningMarker = erasing ? "erase" : color;
    let stroke: { region: HTMLElement; anchor: TextAnchor; id: string } | null = null;
    let previous = "";
    const move = (event: PointerEvent) => {
      if (!(event.buttons & 1) || mutation.current || stateRef.current.status !== "ready") return;
      const element = event.target as Element;
      if (element.closest?.("[data-learning-tools],button,a,input,textarea,select,svg,[aria-hidden='true'],[inert],[data-base-ui-inert]")) return;
      const root = element.closest<HTMLElement>("[data-learning-content]");
      if (!root || !stateRef.current.userId || typeof CSS === "undefined" || !("highlights" in CSS)) return;
      const word = wordAtPoint(root, event.clientX, event.clientY);
      if (!word) return;
      event.preventDefault();
      const contentKey = root.dataset.learningContent!;
      if (!stroke || stroke.region !== root) stroke = { region: root, anchor: word, id: crypto.randomUUID() };
      const text = textModel(root).text;
      const anchor = anchorText(text, Math.min(stroke.anchor.start, word.start), Math.max(stroke.anchor.end, word.end));
      if (anchor.quote.length > 12000) return;
      const signature = `${contentKey}:${anchor.start}:${anchor.end}:${erasing}:${color}`;
      if (signature === previous) return;
      previous = signature;
      const pendingIds = new Set(pendingRef.current.map(mark => mark.id));
      const visible = [...stateRef.current.marks.filter(mark => !pendingIds.has(mark.id)), ...pendingRef.current].filter(mark => !removalsRef.current.has(mark.id));
      if (erasing) {
        for (const mark of visible) {
          if (mark.contentKey !== contentKey || mark.kind !== "highlight") continue;
          const span = locateAnchor(text, mark);
          if (!span || span.end <= anchor.start || span.start >= anchor.end) continue;
          const pieces = [
            ...(span.start < anchor.start ? [anchorText(text, span.start, anchor.start)] : []),
            ...(span.end > anchor.end ? [anchorText(text, anchor.end, span.end)] : []),
          ];
          pendingRef.current = pendingRef.current.filter(item => item.id !== mark.id);
          if (!pieces.length) removalsRef.current.add(mark.id);
          else pieces.forEach((piece, index) => pendingRef.current.push({ ...mark, ...piece, id: index ? crypto.randomUUID() : mark.id, updatedAt: new Date().toISOString() }));
        }
        setRemovals([...removalsRef.current]);
      } else {
        const existing = visible.find(mark => mark.contentKey === contentKey && mark.kind === "highlight" && mark.start === anchor.start && mark.quote === anchor.quote);
        if (existing && existing.id !== stroke.id) stroke.id = existing.id;
        const mark: LearningMark = { ...anchor, contentKey, id: stroke.id, kind: "highlight", color, updatedAt: new Date().toISOString() };
        pendingRef.current = [...pendingRef.current.filter(item => item.id !== mark.id), mark];
      }
      setPending([...pendingRef.current]);
      if (!brushFailed.current && !brushTimer.current) brushTimer.current = setTimeout(() => void flushPending(), 350);
    };
    const end = () => { stroke = null; previous = ""; setBrush(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setBrush(false); } };
    document.addEventListener("pointerdown", move); document.addEventListener("pointermove", move); document.addEventListener("pointerup", end); document.addEventListener("pointercancel", end); document.addEventListener("keydown", escape, true);
    return () => { delete document.documentElement.dataset.learningMarker; document.removeEventListener("pointerdown", move); document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", end); document.removeEventListener("pointercancel", end); document.removeEventListener("keydown", escape, true); };
  }, [brush, erasing, color, flushPending]);
  useEffect(() => {
    const leave = (event: BeforeUnloadEvent) => { if (pendingRef.current.length || removalsRef.current.size) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", leave); return () => window.removeEventListener("beforeunload", leave);
  }, []);
  useEffect(() => {
    let dragging = false;
    let lastSelection = "";
    const select = () => {
      if (dragging || document.documentElement.dataset.learningMarker) return;
      const selected = window.getSelection();
      if (!selected?.rangeCount || selected.isCollapsed) return; // Retain selection while using header tools.
      const range = selected.getRangeAt(0);
      const start = range.startContainer.nodeType === Node.ELEMENT_NODE ? range.startContainer as Element : range.startContainer.parentElement;
      const end = range.endContainer.nodeType === Node.ELEMENT_NODE ? range.endContainer as Element : range.endContainer.parentElement;
      if (start?.closest("[data-learning-tools]") || end?.closest("[data-learning-tools]")) return;
      const root = start?.closest<HTMLElement>("[data-learning-content]");
      if (!root || end?.closest("[data-learning-content]") !== root) { setSelection(null); return; }
      const anchor = selectionAnchor(root, range);
      const signature = anchor ? `${root.dataset.learningRegion}:${anchor.start}:${anchor.end}:${anchor.quote}` : "";
      if (signature && signature === lastSelection) return;
      lastSelection = signature;
      setSelection(anchor ? { regionId: root.dataset.learningRegion!, contentKey: root.dataset.learningContent!, anchor } : null);
      setMessage(anchor ? "" : "Select up to 12,000 characters within one lesson or card.");
    };
    const down = (event: PointerEvent) => { if (!(event.target as Element)?.closest?.("[data-learning-tools]")) { dragging = true; lastSelection = ""; setSelection(null); } };
    const up = () => { dragging = false; select(); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setSelection(null); };
    document.addEventListener("selectionchange", select); document.addEventListener("keyup", select); document.addEventListener("pointerdown", down, true); document.addEventListener("pointerup", up); document.addEventListener("pointercancel", up); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("selectionchange", select); document.removeEventListener("keyup", select); document.removeEventListener("pointerdown", down, true); document.removeEventListener("pointerup", up); document.removeEventListener("pointercancel", up); document.removeEventListener("keydown", escape); };
  }, []);
  async function mutate(method: "PUT" | "DELETE", mark: MarkDraft | LearningMark) {
    const owner = stateRef.current.userId;
    if (!owner || stateRef.current.status !== "ready" || mutation.current || brushSaving.current || pendingRef.current.length || removalsRef.current.size) return false;
    mutation.current = true; setBusy(true); setMessage("Saving to your account…");
    loading.current?.abort();
    const generation = epoch.current;
    try {
      const { id, contentKey, kind, color, quote, prefix, suffix, start, end } = mark;
      const response = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(method === "DELETE" ? { id, expectedUserId: owner } : { id, contentKey, kind, color, quote, prefix, suffix, start, end, expectedUserId: owner }) });
      if (generation !== epoch.current) return false;
      if (!response.ok) throw new Error("save");
      const data = await response.json();
      if (generation !== epoch.current || data.userId !== owner) return false;
      const marks = stateRef.current.marks.filter(item => item.id !== mark.id);
      if (method === "PUT") marks.push(data.mark);
      const next: State = { userId: owner, marks, status: "ready" }; stateRef.current = next; setState(next);
      setMessage(method === "DELETE" ? "Highlight removed. Saved to your account." : mark.kind === "delete" ? "Selected text deleted from your account’s view." : "Highlight saved to your account.");
      clearSelection(); channel.current?.postMessage({ userId: owner });
      return true;
    } catch { if (generation === epoch.current) setMessage("Couldn’t save. Your content is unchanged. Please try again."); return false; }
    finally { if (generation === epoch.current) { mutation.current = false; setBusy(false); } }
  }
  async function unhighlight(target: SelectionTarget) {
    const region = document.querySelector<HTMLElement>(`[data-learning-region="${target.regionId}"]`);
    if (!region || region.closest("[inert],[data-base-ui-inert],[aria-hidden='true']")) return;
    setBrush(false);
    const text = textModel(region).text;
    const cut = target.anchor;
    const targets = stateRef.current.marks.filter(mark => mark.contentKey === target.contentKey && mark.kind === "highlight");
    const generation = epoch.current;
    for (const mark of targets) {
      if (generation !== epoch.current) return;
      const span = locateAnchor(text, mark);
      if (!span || span.end <= cut.start || span.start >= cut.end) continue;
      const pieces = [
        ...(span.start < cut.start ? [anchorText(text, span.start, cut.start)] : []),
        ...(span.end > cut.end ? [anchorText(text, cut.end, span.end)] : []),
      ];
      // Save the second remainder before shortening the original. A failed save
      // must never remove highlighting outside the selected passage.
      if (pieces[1] && !await mutate("PUT", { ...mark, ...pieces[1], id: crypto.randomUUID() })) return;
      if (generation !== epoch.current) return;
      if (!await mutate(pieces.length ? "PUT" : "DELETE", pieces.length ? { ...mark, ...pieces[0] } : mark)) return;
    }
    if (generation === epoch.current) { setMessage("Highlight removed. Saved to your account."); clearSelection(); }
  }
  const visibleMarks = useMemo(() => {
    const pendingIds = new Set(pending.map(mark => mark.id));
    return [...state.marks.filter(mark => !pendingIds.has(mark.id)), ...pending].filter(mark => !removals.includes(mark.id));
  }, [state.marks, pending, removals]);
  const markerHex = erasing ? "#ffffff" : MARKER_COLORS.find(item => item.id === color)!.hex;
  const markerCursor = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M5 23 21 7l6 6-16 16H5z" fill="${markerHex}" stroke="#172033" stroke-width="2"/><path d="m21 7 3-3 6 6-3 3" fill="white" stroke="#172033" stroke-width="2"/><path d="M3 30h10" stroke="${markerHex}" stroke-width="3"/></svg>`)}") 5 29, crosshair`;
  return <Context.Provider value={{ ...state, marks: visibleMarks, selection, busy: busy || pending.length + removals.length > 0, message, save: mark => mutate("PUT", mark), unhighlight, refresh: () => void load(), clearSelection, erasing, setErasing: enabled => { clearSelection(); setErasing(enabled); setBrush(enabled); }, brush, color, setBrush: enabled => { if (enabled) clearSelection(); setErasing(false); setBrush(enabled); }, setColor, pendingCount: pending.length + removals.length, retryPending: () => { brushFailed.current = false; void flushPending(); } }}><style>{`:root[data-learning-marker] [data-learning-content], :root[data-learning-marker] [data-learning-content] * { cursor: ${markerCursor}; user-select: none !important; -webkit-user-select: none !important; } :root[data-learning-marker] [data-learning-tools], :root[data-learning-marker] [data-learning-tools] *, :root[data-learning-marker] [data-learning-content] button, :root[data-learning-marker] [data-learning-content] a { cursor: pointer; }`}</style>{children}</Context.Provider>;
}

/** `compact` drops the button labels and the idle hint, for a dense dialog header. */
export function LearningTools({ contentKey, compact = false }: { contentKey?: string; compact?: boolean }) {
  const context = useContext(Context);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const paletteId = useId();
  useEffect(() => {
    if (!paletteOpen) return;
    const close = (event: PointerEvent) => { if (!(event.target as Element).closest?.("[data-learning-tools]")) setPaletteOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setPaletteOpen(false); } };
    document.addEventListener("pointerdown", close); document.addEventListener("keydown", escape, true);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape, true); };
  }, [paletteOpen]);
  if (!context) return null;
  const selected = context.selection && (!contentKey || context.selection.contentKey === contentKey) ? context.selection : null;
  const enabled = context.status === "ready" && !context.busy;
  const supported = typeof CSS !== "undefined" && "highlights" in CSS;
  const preserve = (event: React.MouseEvent) => { if ((event.target as Element).closest("button")) event.preventDefault(); };
  function apply(kind: "highlight" | "delete", color: MarkerColor = "yellow") {
    if (!selected || !context) return;
    const region = document.querySelector(`[data-learning-region="${selected.regionId}"]`);
    if (!region || region.closest("[inert],[data-base-ui-inert],[aria-hidden='true']")) { context.clearSelection(); return; }
    const existing = context.marks.find(mark => mark.contentKey === selected.contentKey && mark.kind === kind && mark.quote === selected.anchor.quote && mark.start === selected.anchor.start);
    void context.save({ ...selected.anchor, id: existing?.id ?? crypto.randomUUID(), contentKey: selected.contentKey, kind, color });
  }
  const idleHint = "Select text to highlight, unhighlight or delete; or turn on the highlighter";
  return <div className={`${styles.tools}${compact ? ` ${styles.compact}` : ""}`} data-learning-tools="" onMouseDown={preserve}>
    <div className={styles.actions}>
      <button type="button" aria-label="Highlight selected text" title={compact ? "Highlight selected text" : undefined} aria-pressed={context.brush && !context.erasing} aria-expanded={paletteOpen} aria-controls={paletteId} onClick={() => { context.setBrush(false); setPaletteOpen(!paletteOpen); }}><Highlighter size={15} />{!compact && "Highlight"}</button>
      <button type="button" aria-label="Unhighlight selected text" title="Select text to unhighlight, or activate the eraser and drag over highlighted text" aria-pressed={context.brush && context.erasing} disabled={context.status !== "ready"} onClick={() => { setPaletteOpen(false); if (selected && enabled) void context.unhighlight(selected); else context.setErasing(!(context.brush && context.erasing)); }}><Eraser size={15} />{!compact && "Unhighlight"}</button>
      <button type="button" aria-label="Delete selected text" title="Delete selected text from your account's view" disabled={!enabled || !selected} onClick={() => apply("delete")}><Trash2 size={15} />{!compact && "Delete"}</button>
    </div>
    {paletteOpen && <div id={paletteId} className={styles.colors} role="group" aria-label="Marker colors">{MARKER_COLORS.map(color => <button key={color.id} type="button" aria-label={`Highlight ${color.label}`} aria-pressed={context.color === color.id} title={color.label} style={{ backgroundColor: color.hex }} onClick={() => { context.setColor(color.id); setPaletteOpen(false); if (selected && enabled && supported) apply("highlight", color.id); else if (enabled && supported) context.setBrush(true); }} />)}</div>}
    <div className={styles.feedback} role={context.status === "error" ? "alert" : "status"}>{context.status === "signin" ? "Sign in to save highlights and deleted text to your account." : context.status === "loading" ? "Loading your highlights..." : context.status === "error" ? <>Your highlights couldn’t load. <button type="button" onClick={context.refresh}>Retry</button></> : context.pendingCount > 0 ? <>{context.pendingCount} unsaved changes <button type="button" onClick={context.retryPending}>Retry saving</button></> : !supported ? "This browser does not support text markers." : context.message || (context.brush ? `${context.erasing ? "Unhighlight" : "Highlighter"} on: hold left mouse button and drag. Esc to stop.` : selected ? `${selected.anchor.quote.length} characters selected · Highlight, Unhighlight or Delete` : compact ? "" : idleHint)}</div>
  </div>;
}

export function LearningRegion({ contentKey, children, toolbar = false, className }: { contentKey: string; children: ReactNode; toolbar?: boolean; className?: string }) {
  const context = useContext(Context);
  const root = useRef<HTMLDivElement>(null);
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const marks = context?.marks;
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const names: string[] = [];
    const sheet = document.createElement("style"); document.head.appendChild(sheet);
    let scheduled = false, active = true;
    function paint() {
      scheduled = false;
      if (!element || !active) return;
      const own = (marks ?? []).filter(mark => mark.contentKey === contentKey);
      const ranges = renderPersonalText(element, own);
      if (typeof CSS === "undefined" || !("highlights" in CSS) || typeof Highlight === "undefined") return;
      names.splice(0).forEach(name => CSS.highlights.delete(name));
      const rules: string[] = [];
      own.filter(mark => mark.kind === "highlight").sort((a, b) => a.updatedAt.localeCompare(b.updatedAt)).forEach((mark, index) => {
        const name = `learning-${id}-${index}`;
        const color = MARKER_COLORS.find(color => color.id === mark.color);
        if (!color) return;
        const highlight = new Highlight(...(ranges.get(mark.id) ?? [])); highlight.priority = index;
        CSS.highlights.set(name, highlight); names.push(name);
        rules.push(`::highlight(${name}) { background-color: ${color.hex}; color: #172033; text-shadow: none; }`);
      });
      sheet.textContent = rules.join("\n");
    }
    const observer = new MutationObserver(() => { if (!scheduled) { scheduled = true; queueMicrotask(paint); } });
    paint(); observer.observe(element, { childList: true, characterData: true, subtree: true });
    return () => { active = false; observer.disconnect(); restorePersonalText(element); names.forEach(name => { if (typeof CSS !== "undefined" && "highlights" in CSS) CSS.highlights.delete(name); }); sheet.remove(); };
  }, [contentKey, id, marks]);
  return <div ref={root} data-learning-content={contentKey} data-learning-region={id} className={className}>{toolbar && <LearningTools contentKey={contentKey} />}{children}</div>;
}
