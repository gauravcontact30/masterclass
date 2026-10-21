"use client";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

/**
 * Subscribe to Supabase auth changes without putting the Supabase SDK in the
 * first-load bundle. The providers that listen live in the root layout, so a
 * static import shipped ~250 KB (the client plus its Buffer polyfill) to every
 * page, including the landing page, before anything could paint or respond.
 * The SDK now loads after hydration; the listener attaches a moment later,
 * and Supabase still delivers the INITIAL_SESSION event to it.
 */
export function onAuthChange(callback: (event: AuthChangeEvent, session: Session | null) => void): () => void {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return () => {};
  let cancelled = false;
  let unsubscribe: (() => void) | undefined;
  void import("./supabase-browser").then(({ supabaseBrowser }) => {
    if (cancelled) return;
    const { data } = supabaseBrowser().auth.onAuthStateChange(callback);
    unsubscribe = () => data.subscription.unsubscribe();
  }).catch(() => { /* No listener means no live account switch; a reload still reflects it. */ });
  return () => { cancelled = true; unsubscribe?.(); };
}

/**
 * Whether this browser may hold a session: Supabase keeps it in a readable `sb-<project>-auth-token` cookie (chunked
 * as `.0`, `.1`… when large). Without one, account-only calls (bookmarks, learning marks) can only answer 401, so
 * guests skip them; those 401s were most of the API errors in Request tracing. Without Supabase configured the
 * server serves a demo account, so the answer is always yes.
 */
export function maybeSignedIn(): boolean {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return true;
  if (typeof document === "undefined") return false;
  return document.cookie.split(/;\s*/).some(cookie => /^sb-[^=]+-auth-token(\.\d+)?=./.test(cookie));
}
