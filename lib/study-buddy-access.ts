import { startTransition, useEffect, useState } from "react";

/**
 * Whether this visitor may ask Study Buddy (members only, user rule 2026-10-31), for the panel and the landing page's
 * question box. Dependency-free like lib/study-buddy-bridge.ts, because the landing page imports it.
 * Without a Supabase session cookie the visitor cannot be a member, so no request is made; otherwise
 * /api/study-chat/access answers from the session and the stored plan. The server refuses non-members either way:
 * this only decides whether the inputs are enabled.
 */
export type StudyBuddyAccessState = "checking" | "member" | "signin_required" | "subscription_required";

const hasSessionCookie = () => /(?:^|;\s*)sb-[^=]+-auth-token/.test(document.cookie);
let pending: Promise<StudyBuddyAccessState> | null = null;

/** One check per page load, shared by every caller; a failed check is not cached, so the next open asks again. */
export function checkStudyBuddyAccess(): Promise<StudyBuddyAccessState> {
  if (!hasSessionCookie()) return Promise.resolve("signin_required");
  pending ??= fetch("/api/study-chat/access", { cache: "no-store", credentials: "same-origin" })
    .then(async response => {
      const body = await response.json() as { access?: boolean; reason?: string };
      if (body.access) return "member" as const;
      return body.reason === "subscription_required" ? "subscription_required" as const : "signin_required" as const;
    })
    .catch(error => { pending = null; throw error; });
  return pending;
}

/** The visitor's access, checked once `enabled` is true (the panel checks when it is first opened). */
export function useStudyBuddyAccess(enabled = true): StudyBuddyAccessState {
  const [state, setState] = useState<StudyBuddyAccessState>("checking");
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    // A failed check leaves the inputs locked ("checking"), never open.
    // A transition, so an answer arriving during hydration never forces the page to re-render on the client.
    checkStudyBuddyAccess().then(result => { if (live) startTransition(() => setState(result)); }, () => undefined);
    return () => { live = false; };
  }, [enabled]);
  return state;
}

/** Where a locked visitor goes next: sign in (then back here), or choose a plan. */
export const studyBuddyUnlockHref = (state: StudyBuddyAccessState, path: string) =>
  state === "subscription_required" ? "/learning/plans" : `/sign-in?redirect=${encodeURIComponent(path || "/")}`;
