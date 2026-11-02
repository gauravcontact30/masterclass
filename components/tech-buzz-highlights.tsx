"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { Copy, Highlighter, Trash2 } from "lucide-react";
import { setMark, useMarks, type MarkResult } from "@/lib/tech-buzz-marks";
import { HIDE_HIGHLIGHTS } from "@/lib/tech-buzz-mark-keys";
import styles from "./tech-buzz-highlights.module.css";
import "./tech-buzz-highlights.css";

/*
 * Reader highlights on an opened story. Select text in a paragraph to get the toolbar; saved passages are painted with the
 * CSS Custom Highlight API, which needs no change to React's DOM, so a re-render can never lose or duplicate one. Click a
 * passage to remove it. Ctrl+/ (Cmd+/ on a Mac) or the More menu turns them all off, stored on the account.
 */
type Mine = { id: string; quote: string };
type Top = { quote: string; readers: number };
type Toolbar = { x: number; y: number; below: boolean } & ({ mode: "new"; quote: string } | { mode: "mine"; id: string; quote: string } | { mode: "top"; quote: string; readers: number });

const BLOCK = "[data-highlight-block]";
const MINE = "tb-highlight-mine";
const TOP = "tb-highlight-top";
const MAX_QUOTE = 600;
const hasSession = () => /(?:^|;\s*)sb-[^=]+-auth-token/.test(document.cookie);
const supported = () => typeof CSS !== "undefined" && "highlights" in CSS && typeof Highlight !== "undefined";

/** The first place `quote` occurs in the story's paragraphs, as a Range spanning however many text nodes it crosses. */
function findRange(blocks: Element[], quote: string): Range | null {
  for (const block of blocks) {
    const nodes: Text[] = [];
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);
    const at = nodes.map(node => node.data).join("").indexOf(quote);
    if (at < 0) continue;
    const range = document.createRange();
    let offset = 0;
    let started = false;
    for (const node of nodes) {
      const end = offset + node.length;
      if (!started && at < end) { range.setStart(node, at - offset); started = true; }
      if (started && at + quote.length <= end) { range.setEnd(node, at + quote.length - offset); return range; }
      offset = end;
    }
  }
  return null;
}

/** Whether the point lies inside a range; only the rects of the text itself count, not its whole bounding box. */
const rangeAt = (range: Range, x: number, y: number) => [...range.getClientRects()].some(rect => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom);

export function useHighlightsHidden() {
  return !!useMarks("pref")[HIDE_HIGHLIGHTS];
}

export function HighlightLayer({ slug, area, bodyKey, onResult, notify, signInLink }: {
  slug: string;
  /** The element holding the story's paragraphs. */
  area: RefObject<HTMLElement | null>;
  /** Changes when the member body arrives, which adds paragraphs to search. */
  bodyKey: string;
  onResult: (result: MarkResult, done?: string) => void;
  notify: (message: string, link?: { href: string; label: string } | null) => void;
  signInLink: { href: string; label: string };
}) {
  const hidden = useHighlightsHidden();
  const [mine, setMine] = useState<Mine[]>([]);
  const [top, setTop] = useState<Top[]>([]);
  const [toolbar, setToolbar] = useState<Toolbar | null>(null);
  const url = `/api/tech-buzz/${encodeURIComponent(slug)}/highlights`;
  // The painted ranges, for hit-testing clicks.
  const painted = useRef<{ mine: { item: Mine; range: Range }[]; top: { item: Top; range: Range }[] }>({ mine: [], top: [] });

  useEffect(() => {
    if (!hasSession()) return;
    const controller = new AbortController();
    fetch(url, { signal: controller.signal }).then(res => (res.ok ? res.json() : null))
      .then((data: { mine: Mine[]; top: Top[] } | null) => { if (data) { setMine(data.mine); setTop(data.top); } })
      .catch(() => {});
    return () => controller.abort();
  }, [url, bodyKey]);

  // Paint. Own passages sit above the ones other readers marked.
  useEffect(() => {
    if (!supported() || !area.current) return;
    const blocks = [...area.current.querySelectorAll(BLOCK)];
    const mineRanges = hidden ? [] : mine.flatMap(item => { const range = findRange(blocks, item.quote); return range ? [{ item, range }] : []; });
    const topRanges = hidden ? [] : top.flatMap(item => { const range = findRange(blocks, item.quote); return range ? [{ item, range }] : []; });
    painted.current = { mine: mineRanges, top: topRanges };
    const own = new Highlight(...mineRanges.map(entry => entry.range));
    own.priority = 2;
    CSS.highlights.set(MINE, own);
    CSS.highlights.set(TOP, new Highlight(...topRanges.map(entry => entry.range)));
    return () => { CSS.highlights.delete(MINE); CSS.highlights.delete(TOP); };
  }, [area, mine, top, hidden, bodyKey]);

  const place = useCallback((rect: DOMRect) => {
    const below = window.matchMedia("(pointer: coarse)").matches || rect.top < 72; // A phone draws its own menu above the selection.
    return { x: Math.min(window.innerWidth - 16, Math.max(16, rect.left + rect.width / 2)), y: below ? rect.bottom + 8 : rect.top - 8, below };
  }, []);

  // The toolbar follows a selection made inside one paragraph.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const read = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount) {
        setToolbar(current => (current?.mode === "new" ? null : current));
        return;
      }
      const range = selection.getRangeAt(0);
      const start = (range.startContainer.nodeType === 1 ? range.startContainer as Element : range.startContainer.parentElement)?.closest(BLOCK);
      const end = (range.endContainer.nodeType === 1 ? range.endContainer as Element : range.endContainer.parentElement)?.closest(BLOCK);
      const quote = range.toString().trim();
      if (!start || start !== end || !area.current?.contains(start) || quote.length < 3 || quote.length > MAX_QUOTE) { setToolbar(null); return; }
      setToolbar({ ...place(range.getBoundingClientRect()), mode: "new", quote });
    };
    const onChange = () => { clearTimeout(timer); timer = setTimeout(read, 140); };
    document.addEventListener("selectionchange", onChange);
    return () => { clearTimeout(timer); document.removeEventListener("selectionchange", onChange); };
  }, [area, place]);

  // Clicking a painted passage opens its actions, and must not also start the click-to-listen on its paragraph.
  useEffect(() => {
    const element = area.current;
    if (!element) return;
    const click = (event: MouseEvent) => {
      if (!window.getSelection()?.isCollapsed) return;
      const own = painted.current.mine.find(entry => rangeAt(entry.range, event.clientX, event.clientY));
      const shared = own ? undefined : painted.current.top.find(entry => rangeAt(entry.range, event.clientX, event.clientY));
      if (!own && !shared) return;
      event.stopPropagation();
      const rect = (own ?? shared)!.range.getBoundingClientRect();
      if (own) setToolbar({ ...place(rect), mode: "mine", id: own.item.id, quote: own.item.quote });
      else setToolbar({ ...place(rect), mode: "top", quote: shared!.item.quote, readers: shared!.item.readers });
    };
    element.addEventListener("click", click, true);
    return () => element.removeEventListener("click", click, true);
  }, [area, place]);

  // A scroll moves the page under a fixed toolbar: close it rather than leave it pointing at the wrong words.
  useEffect(() => {
    if (!toolbar) return;
    const close = () => setToolbar(null);
    window.addEventListener("scroll", close, { passive: true, once: true });
    return () => window.removeEventListener("scroll", close);
  }, [toolbar]);

  const toggleHidden = useCallback(() => {
    const next = !hidden;
    setToolbar(null);
    setMark("pref", HIDE_HIGHLIGHTS, next).then(result => onResult(result, next ? "Highlights hidden" : "Highlights showing"));
  }, [hidden, onResult]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key !== "/" || !(event.ctrlKey || event.metaKey)) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      event.preventDefault();
      toggleHidden();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [toggleHidden]);

  const save = async (quote: string) => {
    setToolbar(null);
    if (!hasSession()) { notify("Sign in to save highlights.", signInLink); return; }
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quote }) }).catch(() => null);
    if (res?.ok) {
      const { highlight } = await res.json() as { highlight: Mine };
      setMine(current => (current.some(item => item.id === highlight.id) ? current : [...current, highlight]));
      window.getSelection()?.removeAllRanges();
      if (hidden) await setMark("pref", HIDE_HIGHLIGHTS, false); // A new highlight the reader cannot see would look like a failure.
      notify("Highlight saved");
    } else if (res?.status === 401) notify("Sign in to save highlights.", signInLink);
    else if (res?.status === 503) notify("Highlights are being set up and cannot be saved yet.");
    else if (res?.status === 422) notify("Code examples cannot be highlighted. Try a passage of text.");
    else notify("That highlight did not save. Try again.");
  };

  const remove = async (id: string) => {
    setToolbar(null);
    const res = await fetch(`${url}?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) { notify("That highlight could not be removed. Try again."); return; }
    setMine(current => current.filter(item => item.id !== id));
    notify("Highlight removed");
  };

  const copy = (quote: string) => {
    setToolbar(null);
    navigator.clipboard?.writeText(quote).then(() => notify("Passage copied"), () => notify("Your browser blocked copying."));
  };

  if (!toolbar) return null;
  return <div className={styles.toolbar} data-below={toolbar.below || undefined} style={{ left: toolbar.x, top: toolbar.y }} role="toolbar" aria-label="Passage actions" onPointerDown={event => event.preventDefault()}>
    {toolbar.mode === "top" && <span className={styles.note}>{toolbar.readers} readers highlighted this</span>}
    {toolbar.mode !== "mine" && <button type="button" onClick={() => save(toolbar.quote)}><Highlighter size={15} aria-hidden="true" />Highlight</button>}
    {toolbar.mode === "mine" && <button type="button" onClick={() => remove(toolbar.id)}><Trash2 size={15} aria-hidden="true" />Remove highlight</button>}
    <button type="button" onClick={() => copy(toolbar.quote)}><Copy size={15} aria-hidden="true" />Copy</button>
  </div>;
}
