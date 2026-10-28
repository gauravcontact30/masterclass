"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Bookmark, BookmarkCheck, BookA } from "lucide-react";
import { toast } from "sonner";
import type { BookmarkDraft, BookmarkSource, SavedBookmark } from "@/lib/bookmarks";
import { bookmarkIdentity } from "@/lib/bookmark-identity";
import { maybeSignedIn, onAuthChange } from "@/lib/auth-listener";
import { triggerWordLookup } from "./vocabulary-lookup-provider";
// The zod schemas load on first use: this provider sits in the root layout, so a
// static import would put zod in every page's first-load JavaScript.
const schemas = () => import("@/lib/bookmarks");
import styles from "./bookmarks.module.css";

type State = { items: SavedBookmark[]; owner: string | null; status: "loading" | "ready" | "error" | "signin" };
type Store = State & { busy: boolean; refresh: () => void; save: (draft: BookmarkDraft) => Promise<boolean>; remove: (item: SavedBookmark) => Promise<boolean> };
const Context = createContext<Store | null>(null);
const SourceContext = createContext<BookmarkSource | null>(null);
const localKey = "masterclass:demo-bookmarks:v1";
export function useBookmarks() { return useContext(Context); }
export const BookmarkScope = SourceContext.Provider;

export function BookmarkSection({ title, children }: { title: string; children: ReactNode }) {
  const source = useContext(SourceContext);
  return source ? <BookmarkScope value={{ ...source, title, sourceKey: `${source.sourceKey}:${title}` }}>{children}</BookmarkScope> : children;
}

const FOCUS_STALE_MS = 60_000;

export function BookmarksProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ items: [], owner: null, status: "loading" });
  const [busy, setBusy] = useState(false);
  const current = useRef(state);
  useEffect(() => { current.current = state; }, [state]);
  const epoch = useRef(0);
  const lock = useRef(false);
  // When the list last loaded: a window regaining focus re-reads it only after FOCUS_STALE_MS, and without blanking it.
  const loadedAt = useRef(0);
  const refresh = useCallback(async ({ quiet = false } = {}) => {
    if (lock.current) return;
    const generation = ++epoch.current;
    if (!maybeSignedIn()) { setState({ items: [], owner: null, status: "signin" }); return; }
    if (!quiet) setState({ items: [], owner: null, status: "loading" });
    try {
      let after: number | null = 0;
      let owner: string | null = null;
      const items: SavedBookmark[] = [];
      while (after !== null) {
        const response: Response = await fetch(`/api/bookmarks?after=${after}`, { cache: "no-store" });
        if (generation !== epoch.current) return;
        if (response.status === 401) { setState({ items: [], owner: null, status: "signin" }); return; }
        if (!response.ok) throw new Error("Cannot load bookmarks");
        const result: { userId: string; bookmarks: SavedBookmark[]; nextCursor: number | null } = await response.json();
        if (owner && owner !== result.userId) throw new Error("Account changed");
        owner = result.userId;
        const { bookmarkSchema } = await schemas();
        items.push(...bookmarkSchema.array().parse(result.bookmarks));
        after = result.nextCursor;
      }
      if (owner === "demo") items.push(...(await schemas()).bookmarkSchema.array().parse(JSON.parse(localStorage.getItem(localKey) ?? "[]")));
      if (generation === epoch.current) { loadedAt.current = Date.now(); setState({ items, owner, status: "ready" }); }
    } catch { if (generation === epoch.current && !quiet) setState({ items: [], owner: null, status: "error" }); }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(() => refresh());
    // Every tab switch used to re-download the whole list (a quarter of all API calls): now only a stale one, quietly.
    const onFocus = () => { if (Date.now() - loadedAt.current > FOCUS_STALE_MS) void refresh({ quiet: current.current.status === "ready" }); };
    const onStorage = (event: StorageEvent) => { if (event.key === localKey) void refresh({ quiet: true }); };
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    const unsubscribe = onAuthChange(event => {
      if (event === "SIGNED_OUT" || event === "SIGNED_IN") { ++epoch.current; setState({ items: [], owner: null, status: "loading" }); setTimeout(() => void refresh(), 0); }
    });
    // Bumping the live ref on teardown is the point: it invalidates the
    // in-flight refresh. A copy taken when the Effect ran would invalidate a
    // generation that has already passed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { ++epoch.current; window.removeEventListener("focus", onFocus); window.removeEventListener("storage", onStorage); unsubscribe(); };
  }, [refresh]);
  async function mutate(draft: BookmarkDraft, removed?: SavedBookmark) {
    const snapshot = current.current;
    if (lock.current || snapshot.status !== "ready" || !snapshot.owner) return false;
    const generation = epoch.current;
    lock.current = true; setBusy(true);
    try {
      const { bookmarkDraftSchema, bookmarkSchema } = await schemas();
      draft = bookmarkDraftSchema.parse(draft);
      let saved: SavedBookmark | undefined;
      if (snapshot.owner === "demo") {
        const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(bookmarkIdentity(draft)));
        saved = { ...draft, id: Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join(""), savedAt: new Date().toISOString() };
      } else {
        const response = await fetch("/api/bookmarks", { method: removed ? "DELETE" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(removed ? { expectedUserId: snapshot.owner, id: removed.id } : { expectedUserId: snapshot.owner, bookmark: draft }) });
        if (!response.ok) throw new Error("Bookmark change failed");
        const result = await response.json();
        if (result.userId !== snapshot.owner) throw new Error("Account changed");
        if (!removed) saved = bookmarkSchema.parse(result.bookmark);
      }
      if (generation !== epoch.current) return false;
      const items = removed ? snapshot.items.filter(item => item.id !== removed.id) : [...snapshot.items.filter(item => item.id !== saved!.id), saved!];
      if (snapshot.owner === "demo") localStorage.setItem(localKey, JSON.stringify(items));
      setState({ ...snapshot, items });
      return true;
    } catch { toast.error(removed ? "Could not remove bookmark. Try again." : "Could not save bookmark. Try again."); return false; }
    finally { lock.current = false; setBusy(false); if (generation !== epoch.current) void refresh(); }
  }
  const save = (draft: BookmarkDraft) => current.current.owner === state.owner ? mutate(draft) : Promise.resolve(false);
  const remove = (item: SavedBookmark) => { if (current.current.owner !== state.owner) return Promise.resolve(false); const { id: _id, savedAt: _time, ...draft } = item; void _id; void _time; return mutate(draft, item); };
  return <Context.Provider value={{ ...state, busy, refresh, save, remove }}>{children}</Context.Provider>;
}

export function BookmarkButton({ source, points, compact = false }: { source?: BookmarkSource; points: string[]; compact?: boolean }) {
  const inherited = useContext(SourceContext);
  const store = useBookmarks();
  const origin = source ?? inherited;
  if (!origin) return null;
  const draft = { ...origin, points };
  const saved = store?.items.find(item => bookmarkIdentity(item) === bookmarkIdentity(draft));
  const label = saved ? "Remove bookmark" : compact ? "Bookmark key point" : "Bookmark note";
  async function toggle() {
    if (!store) return;
    if (store.status === "signin") { toast.error("Sign in to save bookmarks to your account."); return; }
    if (store.status === "error") { store.refresh(); toast("Reloading bookmarks. Try saving again once loaded."); return; }
    if (saved) { if (await store.remove(saved)) toast("Bookmark removed", { action: { label: "Undo", onClick: () => { void store.save(draft); } } }); }
    else if (await store.save(draft)) toast.success("Saved to Bookmark");
  }
  return <button type="button" className={styles.saveButton} data-compact={compact} aria-label={label} aria-pressed={Boolean(saved)} title={label} disabled={!store || store.busy || store.status === "loading"} onClick={() => void toggle()}>{saved ? <BookmarkCheck size={compact ? 15 : 17} aria-hidden /> : <Bookmark size={compact ? 15 : 17} aria-hidden />}</button>;
}

export function BookmarkPoint({ text, children }: { text: string; children: ReactNode }) {
  const colonIndex = text.indexOf(":");
  const candidateTerm = colonIndex > 0 && colonIndex < 40 ? text.slice(0, colonIndex).trim() : null;

  return (
    <span className={styles.point}>
      <span>{children}</span>
      <span className={styles.pointActions}>
        {candidateTerm && (
          <button
            type="button"
            className={styles.vocabPointButton}
            aria-label={`Look up “${candidateTerm}” in Vocabulary`}
            title={`Check “${candidateTerm}” meaning, Hindi, synonyms & antonyms`}
            onClick={() => triggerWordLookup(candidateTerm)}
          >
            <BookA size={14} aria-hidden="true" />
          </button>
        )}
        <BookmarkButton points={[text]} compact />
      </span>
    </span>
  );
}
