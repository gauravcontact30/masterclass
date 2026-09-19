"use client";

import { useSyncExternalStore } from "react";

/**
 * "AI Mode" decides whether a search asks a model or only searches the app's
 * own notes. The sidebar toggle and the search page are rendered by separate
 * trees, so the flag lives here rather than in either of them: localStorage is
 * the record, a custom event is the notification, and `useSyncExternalStore`
 * keeps both subscribers on one value.
 */
export const AI_MODE_KEY = "masterclass:ai-search:ai-mode";
const EVENT = "masterclass:ai-mode-change";

function read() {
  try { return localStorage.getItem(AI_MODE_KEY) !== "off"; } catch { return true; }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => { window.removeEventListener(EVENT, onChange); window.removeEventListener("storage", onChange); };
}

export function setAiMode(enabled: boolean) {
  try { localStorage.setItem(AI_MODE_KEY, enabled ? "on" : "off"); } catch { /* The toggle still works for this page. */ }
  window.dispatchEvent(new Event(EVENT));
}

/** `true` until the browser says otherwise, so the server render and the first client render agree. */
export function useAiMode(): [boolean, (enabled: boolean) => void] {
  // `setAiMode` is module scope, so it is already stable across renders.
  return [useSyncExternalStore(subscribe, read, () => true), setAiMode];
}
