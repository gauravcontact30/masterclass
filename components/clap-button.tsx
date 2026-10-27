"use client";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import styles from "./clap-button.module.css";

/*
 * Medium-style claps for Tech Buzz stories, stored per reader in Supabase (/api/tech-buzz/[slug]/claps, migration 0042).
 * Tap to clap, or press and hold to keep clapping; a "+N" bubble counts the burst. Each reader can give a story up to
 * 50 claps and undo them. A burst goes to the server as one request once the reader pauses, so holding the button
 * never floods the API. Signed-out readers are asked to sign in.
 */
export const MAX_CLAPS = 50;
const FLUSH_MS = 650;
const HOLD_DELAY_MS = 380;
const HOLD_EVERY_MS = 130;

type ServerState = { total: number; clappers: number; mine: number; signedIn?: boolean };

const hasSessionCookie = () => /(?:^|;\s*)sb-[^=]+-auth-token/.test(document.cookie);
const noSubscription = () => () => {};
const compact = (value: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);

/** One story's claps: live state, optimistic clapping in batches, undo. `live` fetches the exact state on mount. */
export function useClaps(slug: string, initialTotal: number, { live = true }: { live?: boolean } = {}) {
  const cookieSignedIn = useSyncExternalStore(noSubscription, hasSessionCookie, () => false);
  const [state, setState] = useState({ total: initialTotal, clappers: 0, mine: 0 });
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [burst, setBurst] = useState({ count: 0, key: 0 });
  const pending = useRef(0);
  // The reader's own claps, read synchronously when they press (state updates land later).
  const mineRef = useRef(0);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const burstTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const url = `/api/tech-buzz/${encodeURIComponent(slug)}/claps`;
  const isSignedIn = signedIn ?? cookieSignedIn;

  const apply = useCallback((server: ServerState) => {
    // Claps pressed while a batch was in flight stay on top of what the server reports.
    mineRef.current = Math.min(MAX_CLAPS, server.mine + pending.current);
    setState({ total: server.total + pending.current, clappers: server.clappers, mine: mineRef.current });
    if (typeof server.signedIn === "boolean") setSignedIn(server.signedIn);
  }, []);

  useEffect(() => {
    if (!live) return;
    const controller = new AbortController();
    fetch(url, { signal: controller.signal }).then(response => response.ok ? response.json() : null).then(data => { if (data) apply(data); }).catch(() => {});
    return () => controller.abort();
  }, [url, live, apply]);

  // A batch the server refused (signed out, rate limited, offline) is taken back off the counts.
  const revert = useCallback((count: number) => {
    mineRef.current = Math.max(0, mineRef.current - count);
    setState(current => ({ ...current, total: Math.max(0, current.total - count), mine: mineRef.current }));
  }, []);

  const flush = useCallback((keepalive = false) => {
    clearTimeout(flushTimer.current);
    const count = pending.current;
    if (!count) return;
    pending.current = 0;
    fetch(url, { method: "POST", keepalive, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ count }) })
      .then(async response => {
        if (response.status === 401) setSignedIn(false);
        const data = response.ok ? await response.json() : null;
        if (data) apply(data); else revert(count);
      })
      .catch(() => revert(count));
  }, [url, apply, revert]);

  // A burst still waiting when the reader leaves is sent on the way out.
  useEffect(() => {
    const leave = () => flush(true);
    addEventListener("pagehide", leave);
    return () => { removeEventListener("pagehide", leave); flush(true); clearTimeout(burstTimer.current); };
  }, [flush]);

  /** One clap. Returns false when nothing happened (signed out, or all 50 given). */
  const clap = useCallback(() => {
    if (!isSignedIn || mineRef.current >= MAX_CLAPS) return false;
    const first = mineRef.current === 0;
    mineRef.current += 1;
    setState(current => ({ total: current.total + 1, clappers: first ? current.clappers + 1 : current.clappers, mine: mineRef.current }));
    pending.current += 1;
    setBurst(current => ({ count: current.count + 1, key: current.key + 1 }));
    clearTimeout(burstTimer.current);
    burstTimer.current = setTimeout(() => setBurst(current => ({ count: 0, key: current.key })), 1100);
    clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(() => flush(), FLUSH_MS);
    return true;
  }, [isSignedIn, flush]);

  const undo = useCallback(() => {
    clearTimeout(flushTimer.current);
    pending.current = 0;
    const given = mineRef.current;
    mineRef.current = 0;
    setState(current => ({ total: Math.max(0, current.total - given), clappers: Math.max(0, current.clappers - (given > 0 ? 1 : 0)), mine: 0 }));
    fetch(url, { method: "DELETE" }).then(response => response.ok ? response.json() : null).then(data => { if (data) apply(data); }).catch(() => {});
  }, [url, apply]);

  return { ...state, signedIn: isSignedIn, burst, clap, undo };
}

type Claps = ReturnType<typeof useClaps>;

/**
 * The clap button. `size="large"` is the article page's button (with its count, readers and undo); `size="small"` is
 * the compact pill on story cards. Pass `claps` to share one state between several buttons for the same story.
 */
export function ClapButton({ slug, claps, size = "large", tone = "light", label }: { slug: string; claps: Claps; size?: "large" | "small"; tone?: "light" | "dark"; label?: string }) {
  const [prompt, setPrompt] = useState(false);
  const [denied, setDenied] = useState(0);
  const hold = useRef<{ delay?: ReturnType<typeof setTimeout>; every?: ReturnType<typeof setInterval> }>({});
  const atMax = claps.mine >= MAX_CLAPS;

  const press = useCallback(() => {
    if (!claps.signedIn) { setPrompt(true); return false; }
    if (!claps.clap()) { setDenied(value => value + 1); return false; }
    return true;
  }, [claps]);

  const stop = useCallback(() => { clearTimeout(hold.current.delay); clearInterval(hold.current.every); hold.current = {}; }, []);
  useEffect(() => stop, [stop]);

  const start = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    stop();
    if (!press()) return;
    hold.current.delay = setTimeout(() => { hold.current.every = setInterval(() => { if (!press()) stop(); }, HOLD_EVERY_MS); }, HOLD_DELAY_MS);
  };

  const signIn = `/sign-in?redirect=${encodeURIComponent(`/tech-buzz/${slug}`)}`;
  const title = atMax ? "You gave this story all 50 claps" : claps.signedIn ? `Clap for this story (up to ${MAX_CLAPS}; press and hold for more)` : "Sign in to clap";

  return <div className={styles.wrap} data-size={size} data-tone={tone}>
    <button type="button" className={styles.button} data-mine={claps.mine > 0 || undefined} data-max={atMax || undefined}
      aria-label={`${label ?? "Clap"}. ${claps.total} claps${claps.mine ? `, ${claps.mine} from you` : ""}`} title={title}
      onPointerDown={start} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop} onContextMenu={event => event.preventDefault()}
      onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); press(); } }}>
      <span className={styles.icon} key={denied} data-denied={denied > 0 || undefined} aria-hidden="true">👏</span>
      {claps.burst.count > 0 && <span key={claps.burst.key} className={styles.bubble} aria-hidden="true">+{claps.burst.count}</span>}
      {claps.burst.count > 0 && <span key={`b${claps.burst.key}`} className={styles.burst} aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <i key={i} style={{ "--i": i } as React.CSSProperties} />)}</span>}
      {size === "small" && <span className={styles.count}>{compact(claps.total)}</span>}
    </button>
    {size === "large" && <span className={styles.meta}>
      <span className={styles.count} title={`${claps.total.toLocaleString("en-IN")} claps${claps.clappers ? ` from ${claps.clappers.toLocaleString("en-IN")} ${claps.clappers === 1 ? "reader" : "readers"}` : ""}`}>{compact(claps.total)}</span>
      {claps.mine > 0 && <button type="button" className={styles.undo} onClick={claps.undo}>Undo {claps.mine === 1 ? "clap" : `${claps.mine} claps`}</button>}
    </span>}
    <span className={styles.live} aria-live="polite">{atMax ? "You gave all 50 claps" : ""}</span>
    {prompt && <span className={styles.prompt} role="status">
      <Link href={signIn}>Sign in</Link> to clap for this story
      <button type="button" aria-label="Close" onClick={() => setPrompt(false)}>×</button>
    </span>}
  </div>;
}
