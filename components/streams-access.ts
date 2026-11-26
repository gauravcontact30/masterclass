"use client";
import { useEffect, useState } from "react";
import { isFree, techInfo, type StreamGroup, type StreamStep } from "@/lib/streams";

/*
 * What this viewer may watch on Streams, from /api/streams/access (lib/server/streams-access.ts), for padlocks and
 * labels. It is only a hint for the interface: the player address comes from /api/streams/play, which checks again.
 * One request per page view, shared by every component that asks; a page shown again from the back/forward cache
 * asks afresh, since the viewer may have signed in or subscribed meanwhile.
 */
export type StreamAccess = { signedIn: boolean; member: Record<StreamGroup, boolean> };
let pending: Promise<StreamAccess | null> | null = null;
/** Only a well-formed answer counts; anything else is treated as "no membership known". */
const isAccess = (value: unknown): value is StreamAccess => typeof value === "object" && value !== null && typeof (value as StreamAccess).member === "object" && (value as StreamAccess).member !== null;
const load = () => pending ??= fetch("/api/streams/access", { cache: "no-store", credentials: "same-origin" })
  .then(async response => { const body = response.ok ? await response.json() : null; return isAccess(body) ? body : null; }).catch(() => null);

export function useStreamAccess(): StreamAccess | null {
  const [access, setAccess] = useState<StreamAccess | null>(null);
  useEffect(() => {
    let active = true;
    const read = () => { void load().then(value => { if (active) setAccess(value); }); };
    const fresh = (event: PageTransitionEvent) => { if (event.persisted) { pending = null; read(); } };
    read(); window.addEventListener("pageshow", fresh);
    return () => { active = false; window.removeEventListener("pageshow", fresh); };
  }, []);
  return access;
}
/** Forget the cached answer (after the player was refused, the session may have changed). */
export const forgetStreamAccess = () => { pending = null; };

/** Whether the viewer may watch a step: the free first step, or a membership in its category. Unknown counts as no. */
export const canWatch = (step: StreamStep, access: StreamAccess | null) => isFree(step) || Boolean(access?.member?.[techInfo(step.tech).group]);
