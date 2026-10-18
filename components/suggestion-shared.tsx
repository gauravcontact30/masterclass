"use client";
import { suggestionLabel, type SuggestionUpdate } from "@/lib/suggestions";
import styles from "./suggestion-box.module.css";

/** JSON fetch for the suggestion endpoints; a non-2xx response throws its `error` code. */
export async function suggestionRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? "service_error");
  return body;
}

/** Status changes and replies, oldest first, as the contributor and the admin both see them. */
export function SuggestionHistory({ updates }: { updates: SuggestionUpdate[] }) {
  return <ol className={styles.history}>{updates.map(update => <li key={update.id} data-status={update.status}><div><strong>{suggestionLabel(update.status)}</strong><time>{new Date(update.created_at).toLocaleString()}</time></div>{update.reply && <p>{update.reply}</p>}</li>)}</ol>;
}
