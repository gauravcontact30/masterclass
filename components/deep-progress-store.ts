"use client";

import { useEffect, useSyncExternalStore } from "react";
import { progressKey, type ChecklistId, type ProgressMap, type TopicProgress } from "@/lib/deep-courses/progress";

/*
 * In-depth course progress in the browser, one store for every checklist, topic card and progress bar on the page.
 * The browser copy answers at once; the signed-in learner's Supabase copy (/api/learning/deep-progress) is loaded
 * once per page, merged topic by topic (the newer change wins), and every tick is saved to both. Before migration
 * 0043 runs, or for a signed-out visitor, progress simply stays in this browser.
 */

const KEY = "mcb:deep-progress:v1";
const EMPTY: ProgressMap = {};
let state: ProgressMap | null = null;
let synced = false;
const listeners = new Set<() => void>();

function readLocal(): ProgressMap {
  try { const value = JSON.parse(localStorage.getItem(KEY) ?? "{}"); return value && typeof value === "object" ? value as ProgressMap : {}; } catch { return {}; }
}
function commit(next: ProgressMap) {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode */ }
  listeners.forEach(listener => listener());
}
const snapshot = () => state ??= readLocal();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };

type Entry = { courseId: string; topicId: string; checklist: ChecklistId[]; completed: boolean };
const toEntry = (key: string, value: TopicProgress): Entry => { const [courseId, topicId] = key.split("/"); return { courseId, topicId, checklist: value.checklist, completed: value.completed }; };

async function push(entries: Entry[]) {
  for (let i = 0; i < entries.length; i += 200) {
    await fetch("/api/learning/deep-progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entries: entries.slice(i, i + 200) }) }).catch(() => null);
  }
}

async function sync() {
  if (synced) return;
  synced = true;
  const response = await fetch("/api/learning/deep-progress", { cache: "no-store" }).catch(() => null);
  if (!response?.ok) return; // signed out, or the table is not there yet: the browser copy is the record
  const remote = (await response.json() as { progress: ProgressMap }).progress;
  const local = snapshot();
  const merged: ProgressMap = { ...remote };
  const upload: Entry[] = [];
  for (const [key, value] of Object.entries(local)) {
    if (!remote[key] || value.updatedAt > remote[key].updatedAt) { merged[key] = value; upload.push(toEntry(key, value)); }
  }
  commit(merged);
  if (upload.length) await push(upload);
}

export function setTopicProgress(courseId: string, topicId: string, change: (current: TopicProgress) => Omit<TopicProgress, "updatedAt">) {
  const key = progressKey(courseId, topicId);
  const current = snapshot()[key] ?? { checklist: [], completed: false, updatedAt: 0 };
  const next = { ...change(current), updatedAt: Date.now() };
  commit({ ...snapshot(), [key]: next });
  void push([toEntry(key, next)]);
}

/** Every topic's progress; the first component to mount on a page also loads the learner's saved copy. */
export function useDeepProgress(): ProgressMap {
  const map = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  useEffect(() => { void sync(); }, []);
  return map;
}
