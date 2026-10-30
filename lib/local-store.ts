"use client";

import { useSyncExternalStore } from "react";

/**
 * A localStorage entry read during render. The server render and the first client render both see `null`, then React
 * re-reads the browser's value without an extra effect pass. `writeStoredValue` notifies every reader on the page;
 * the "storage" event covers other tabs. Snapshots are raw strings, so they compare stably between renders.
 */
const EVENT = "masterclass:local-store";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => { window.removeEventListener(EVENT, onChange); window.removeEventListener("storage", onChange); };
}

function read(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function useStoredValue(key: string): string | null {
  return useSyncExternalStore(subscribe, () => read(key), () => null);
}

export function writeStoredValue(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* Private windows can refuse storage; the page still works. */ }
  window.dispatchEvent(new Event(EVENT));
}

/** Parses a stored JSON object, or `{}` when it is missing or unreadable. */
export function parseStoredRecord<T>(raw: string | null): Record<string, T> {
  try { const value = raw ? JSON.parse(raw) : null; return value && typeof value === "object" ? value : {}; } catch { return {}; }
}
