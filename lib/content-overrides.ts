/*
 * Super Admin edits to built-in learning content (migration 0032). The content itself lives in the codebase; an
 * override replaces named text fields of one item, or removes the item, for every user. Keys are "<kind>:<id>"
 * ("pulse:<card id>", "section:ai-pulse"); field names are the item's own ("title", "points.0", "title.hi").
 *
 * Zod-free and import-free: the landing page and the dashboard both load this.
 */
export type ContentOverride = { fields: Record<string, string>; deleted: boolean };
export type ContentOverrides = Record<string, ContentOverride>;
export type ContentAction = "edit" | "reset" | "delete" | "restore";

export const CONTENT_KEY = /^[a-z][a-z0-9-]{0,30}:[A-Za-z0-9._:/-]{1,160}$/;
export const CONTENT_FIELD = /^[A-Za-z][A-Za-z0-9.]{0,40}$/;
/** Longest text one field may hold (a long interview answer is a few thousand characters). */
export const CONTENT_MAX = 20000;

/** A key safe for CONTENT_KEY from any id: unsupported characters become "-". */
export const contentKey = (kind: string, id: string | number) => `${kind}:${String(id).replace(/[^A-Za-z0-9._:/-]/g, "-").slice(0, 160) || "item"}`;
