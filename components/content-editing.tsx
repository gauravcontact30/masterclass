"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Eye, PencilLine, RotateCcw, Trash2, Undo2 } from "lucide-react";
import type { ContentAction, ContentOverride, ContentOverrides } from "@/lib/content-overrides";
import styles from "./content-editing.module.css";

/*
 * Super Admin editing of built-in learning content, applied for everyone. <ContentProvider> holds the overrides
 * (read on the server, so no flash) and, for the Super Admin, the edit switch. <Editable> renders one text field
 * with its override; in edit mode it becomes editable in place and saves when focus leaves it. useContentItem() gives
 * a card or section its Delete / Restore toolbar and tells it when it has been removed. Outside a provider
 * everything renders the built-in content unchanged.
 */
type Change = { action: ContentAction; key: string; field?: string; value?: string };
type Context = {
  overrides: ContentOverrides; canEdit: boolean; editing: boolean;
  apply: (change: Change) => Promise<boolean>;
};
const ContentContext = createContext<Context>({ overrides: {}, canEdit: false, editing: false, apply: async () => false });

const MESSAGES: Record<string, string> = {
  migration_required: "Content editing needs migration 0032 (content_overrides) in Supabase.",
  forbidden: "Only the Super Admin can edit learning content.",
  signin_required: "Your session has ended. Sign in again to edit.",
  rate_limited: "Too many edits this hour. Try again shortly.",
  invalid_request: "That text could not be saved. It must not be empty or longer than 20,000 characters.",
};
const LABELS: Record<ContentAction, string> = { edit: "Saved", reset: "Restored the original text", delete: "Removed for all users", restore: "Restored for all users" };

export function ContentProvider({ overrides: initial, canEdit = false, children }: Readonly<{ overrides?: ContentOverrides; canEdit?: boolean; children: ReactNode }>) {
  const [overrides, setOverrides] = useState<ContentOverrides>(initial ?? {});
  const [editing, setEditing] = useState(false);
  // The Undo on a deletion toast restores through the latest apply().
  const latest = useRef<(change: Change) => Promise<boolean>>(async () => false);
  const apply = useCallback(async (change: Change) => {
    try {
      const response = await fetch("/api/content-overrides", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(change) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "service_error");
      const next = body.override as ContentOverride;
      setOverrides(current => {
        const copy = { ...current };
        if (!Object.keys(next.fields).length && !next.deleted) delete copy[change.key]; else copy[change.key] = next;
        return copy;
      });
      toast.success(LABELS[change.action], change.action === "delete" ? { action: { label: "Undo", onClick: () => void latest.current({ action: "restore", key: change.key }) } } : undefined);
      return true;
    } catch (error) {
      toast.error(MESSAGES[error instanceof Error ? error.message : ""] ?? "The change could not be saved. Try again.");
      return false;
    }
  }, []);
  useEffect(() => { latest.current = apply; }, [apply]);
  const value = useMemo(() => ({ overrides, canEdit, editing: canEdit && editing, apply }), [overrides, canEdit, editing, apply]);
  return <ContentContext.Provider value={value}>
    {children}
    {canEdit && <button type="button" className={styles.switch} data-on={editing} aria-pressed={editing} onClick={() => setEditing(on => !on)}>
      {editing ? <Eye size={16} aria-hidden="true" /> : <PencilLine size={16} aria-hidden="true" />}
      {editing ? "Done editing" : "Edit content"}
    </button>}
  </ContentContext.Provider>;
}

export const useContentEditing = () => useContext(ContentContext);

/** The override for one text field, or the built-in text. */
export function useContentText(key: string, field: string, fallback: string) {
  return useContext(ContentContext).overrides[key]?.fields[field] ?? fallback;
}

/**
 * One editable text field. Renders plain text for everyone (never HTML); in edit mode the Super Admin edits it in
 * place: Enter (or leaving the field) saves, Escape cancels, and an edited field offers "Original" to reset it.
 */
export function Editable({ k, f, children, multiline = false, render }: Readonly<{ k: string; f: string; children: string; multiline?: boolean; render?: (text: string) => ReactNode }>) {
  const { overrides, editing, apply } = useContext(ContentContext);
  const edited = overrides[k]?.fields[f];
  const text = edited ?? children;
  if (!editing) return <>{render ? render(text) : text}</>;
  const save = (element: HTMLElement) => {
    const value = (element.innerText ?? "").replace(/ /g, " ").trim();
    if (!value) { element.innerText = text; toast.error("Text cannot be empty. Delete the card instead."); return; }
    if (value !== text) void apply({ action: "edit", key: k, field: f, value });
  };
  const keys = (event: KeyboardEvent<HTMLSpanElement>) => {
    event.stopPropagation();
    if (event.key === "Escape") { event.currentTarget.innerText = text; event.currentTarget.blur(); }
    if (event.key === "Enter" && !(multiline && event.shiftKey)) { event.preventDefault(); event.currentTarget.blur(); }
  };
  return <span className={styles.field} data-edited={edited !== undefined}>
    <span contentEditable="plaintext-only" suppressContentEditableWarning role="textbox" aria-label={`Edit ${f}`} aria-multiline={multiline} tabIndex={0} className={styles.text}
      // Cards are links and carousel slides: editing must not navigate or swipe.
      onClick={event => { event.preventDefault(); event.stopPropagation(); }} onPointerDown={event => event.stopPropagation()}
      onKeyDown={keys} onBlur={event => save(event.currentTarget)}>{text}</span>
    {edited !== undefined && <button type="button" className={styles.reset} title="Restore the original text" onClick={event => { event.preventDefault(); event.stopPropagation(); void apply({ action: "reset", key: k, field: f }); }}>
      <RotateCcw size={11} aria-hidden="true" />Original
    </button>}
  </span>;
}

/**
 * A removable card or section. `hidden` is true when it was removed and the viewer is not editing (render nothing);
 * in edit mode `toolbar` carries Delete, or Restore once removed, and `props` mark the element for styling.
 */
export function useContentItem(key: string, label = "card") {
  const { overrides, editing, apply } = useContext(ContentContext);
  const removed = !!overrides[key]?.deleted;
  const toolbar = editing ? <span className={styles.toolbar} data-removed={removed}>
    {removed
      ? <><span className={styles.removedNote}>Removed for all users</span><button type="button" onClick={event => { event.preventDefault(); event.stopPropagation(); void apply({ action: "restore", key }); }}><Undo2 size={13} aria-hidden="true" />Restore</button></>
      : <button type="button" onClick={event => { event.preventDefault(); event.stopPropagation(); if (window.confirm(`Remove this ${label} for every user? You can restore it from edit mode.`)) void apply({ action: "delete", key }); }}><Trash2 size={13} aria-hidden="true" />Delete {label}</button>}
  </span> : null;
  return { hidden: removed && !editing, removed, toolbar, props: editing ? { "data-content-item": "", "data-removed": removed } : {} };
}

/** Drops removed items from a list for everyone except the Super Admin in edit mode, so carousels never show gaps. */
export function useVisibleContent<T>(items: T[], key: (item: T) => string) {
  const { overrides, editing } = useContext(ContentContext);
  return useMemo(() => editing ? items : items.filter(item => !overrides[key(item)]?.deleted), [items, overrides, editing, key]);
}
