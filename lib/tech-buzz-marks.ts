"use client";

import { useEffect, useMemo } from "react";
import { parseStoredRecord, useStoredValue, writeStoredValue } from "./local-store";
import { MARK_KINDS, type MarkKind } from "./tech-buzz-mark-keys";

/*
 * A reader's follows, reposts, saved and hidden stories. The account (/api/tech-buzz/marks, migration 0051) owns them;
 * localStorage is the copy the page renders from, so buttons answer instantly and nothing flickers on load. Visitors
 * without an account can still save and hide stories in this browser, and those are uploaded the first time they sign
 * in. Following and reposting are account actions.
 */
const STORAGE: Record<MarkKind, string> = {
  save: "masterclass:tech-buzz-bookmarks",
  topic: "masterclass:tech-buzz-follow-topics",
  author: "masterclass:tech-buzz-follow-authors",
  repost: "masterclass:tech-buzz-reposts",
  hide: "masterclass:tech-buzz-hidden",
  less: "masterclass:tech-buzz-less",
  mute_topic: "masterclass:tech-buzz-muted-topics",
  mute_author: "masterclass:tech-buzz-muted-authors",
  pref: "masterclass:tech-buzz-prefs",
};
const UPLOADED = "masterclass:tech-buzz-marks-uploaded";
const LOCAL_KINDS: MarkKind[] = ["save", "hide", "pref"];

export type MarkResult = "ok" | "signin" | "unavailable" | "error";
type Marks = Record<string, boolean>;

const hasSession = () => /(?:^|;\s*)sb-[^=]+-auth-token/.test(document.cookie);
const readLocal = (kind: MarkKind): Marks => {
  try { return parseStoredRecord<boolean>(localStorage.getItem(STORAGE[kind])); } catch { return {}; }
};
const writeLocal = (kind: MarkKind, marks: Marks) => writeStoredValue(STORAGE[kind], JSON.stringify(marks));
const setLocal = (kind: MarkKind, key: string, on: boolean) => {
  const next = { ...readLocal(kind) };
  if (on) next[key] = true; else delete next[key];
  writeLocal(kind, next);
};
const post = (kind: MarkKind, keys: string[], on: boolean) =>
  fetch("/api/tech-buzz/marks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, keys, on }) });

/** The reader's marks of one kind, as a key → true record (empty during the server render). */
export function useMarks(kind: MarkKind): Marks {
  const raw = useStoredValue(STORAGE[kind]);
  return useMemo(() => parseStoredRecord<boolean>(raw), [raw]);
}

/** Sets a mark at once and takes it back if the account refuses it. */
export async function setMark(kind: MarkKind, key: string, on: boolean): Promise<MarkResult> {
  const localOnly = LOCAL_KINDS.includes(kind);
  if (!hasSession()) {
    if (!localOnly) return "signin";
    setLocal(kind, key, on);
    return "ok";
  }
  setLocal(kind, key, on);
  try {
    const response = await post(kind, [key], on);
    if (response.ok) return "ok";
    if (localOnly && response.status !== 400) return "ok"; // Stays in this browser until the account can take it.
    setLocal(kind, key, !on);
    return response.status === 401 ? "signin" : response.status === 503 ? "unavailable" : "error";
  } catch {
    if (localOnly) return "ok";
    setLocal(kind, key, !on);
    return "error";
  }
}

/** Following and muting the same thing contradict each other, so setting one clears the other. */
export async function setExclusiveMark(kind: MarkKind, opposite: MarkKind, key: string, on: boolean): Promise<MarkResult> {
  const result = await setMark(kind, key, on);
  if (result === "ok" && on && readLocal(opposite)[key]) await setMark(opposite, key, false);
  return result;
}

let synced = false;

/** Once per page load for signed-in readers: uploads what this browser saved before signing in, then copies the account's marks here. */
async function syncFromAccount() {
  const response = await fetch("/api/tech-buzz/marks");
  const data = response.ok ? await response.json() as { signedIn: boolean; available: boolean; marks?: Record<MarkKind, string[]> } : null;
  if (!data?.signedIn || !data.available || !data.marks) return;
  const marks = data.marks;
  if (!localStorage.getItem(UPLOADED)) {
    for (const kind of LOCAL_KINDS) {
      const pending = Object.keys(readLocal(kind)).filter(key => readLocal(kind)[key] && !marks[kind].includes(key));
      if (pending.length && (await post(kind, pending.slice(0, 500), true)).ok) marks[kind] = [...marks[kind], ...pending.slice(0, 500)];
    }
    writeStoredValue(UPLOADED, "1");
  }
  for (const kind of MARK_KINDS) writeLocal(kind, Object.fromEntries(marks[kind].map(key => [key, true])));
}

/** Mount once on a Tech Buzz page to bring the account's marks into this browser. */
export function useMarksSync() {
  useEffect(() => {
    if (synced || !hasSession()) return;
    synced = true;
    syncFromAccount().catch(() => { synced = false; });
  }, []);
}
