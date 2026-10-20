import "server-only";
import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import { db } from "./db";
import { adminError } from "./admin-rpc";
import { HttpError } from "./http";
import { CONTENT_FIELD, CONTENT_KEY, CONTENT_MAX, type ContentAction, type ContentOverride, type ContentOverrides } from "@/lib/content-overrides";

export const CONTENT_TAG = "content-overrides";

/**
 * Every Super Admin content override, for the dashboard and the landing previews. Cached and tagged, so a page
 * render costs no database call; saveContentOverride() expires the tag. Before migration 0032, or without a
 * database, there are simply no overrides.
 */
export async function contentOverrides(): Promise<ContentOverrides> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  try {
    const { data, error } = await db().from("content_overrides").select("key,fields,deleted").limit(10000);
    if (error) return {};
    return Object.fromEntries((data ?? []).map(row => [String(row.key), { fields: (row.fields ?? {}) as Record<string, string>, deleted: !!row.deleted } satisfies ContentOverride]));
  } catch { return {}; }
}

export type ContentChange = { action: ContentAction; key: string; field?: string; value?: string };

/** Validates by hand (no zod) so the shapes match lib/content-overrides.ts exactly. */
export function parseContentChange(body: unknown): ContentChange {
  const input = (body ?? {}) as Record<string, unknown>;
  const action = input.action;
  if (action !== "edit" && action !== "reset" && action !== "delete" && action !== "restore") throw new HttpError(400, "invalid_request");
  if (typeof input.key !== "string" || !CONTENT_KEY.test(input.key)) throw new HttpError(400, "invalid_request");
  if (action === "edit" || action === "reset") {
    if (typeof input.field !== "string" || !CONTENT_FIELD.test(input.field)) throw new HttpError(400, "invalid_request");
  }
  if (action === "edit") {
    if (typeof input.value !== "string") throw new HttpError(400, "invalid_request");
    const value = input.value.replace(/\r\n?/g, "\n").trim();
    if (!value || value.length > CONTENT_MAX) throw new HttpError(400, "invalid_request");
    return { action, key: input.key, field: input.field as string, value };
  }
  return { action, key: input.key, field: typeof input.field === "string" ? input.field : undefined };
}

/** Applies one change, records it in the history, and expires the cached overrides (and the cached landing page). */
export async function saveContentOverride(change: ContentChange, actor: string): Promise<ContentOverride> {
  const read = await db().from("content_overrides").select("fields,deleted").eq("key", change.key).maybeSingle();
  if (read.error) adminError(read.error);
  const current: ContentOverride = { fields: { ...((read.data?.fields ?? {}) as Record<string, string>) }, deleted: !!read.data?.deleted };
  const before = change.field ? current.fields[change.field] ?? null : null;
  if (change.action === "edit") current.fields[change.field!] = change.value!;
  if (change.action === "reset") delete current.fields[change.field!];
  if (change.action === "delete") current.deleted = true;
  if (change.action === "restore") current.deleted = false;
  const write = !Object.keys(current.fields).length && !current.deleted
    // Nothing left to override: drop the row so the built-in content shows again.
    ? await db().from("content_overrides").delete().eq("key", change.key)
    : await db().from("content_overrides").upsert({ key: change.key, fields: current.fields, deleted: current.deleted, updated_by: actor, updated_at: new Date().toISOString() });
  if (write.error) adminError(write.error);
  const history = await db().from("content_override_history").insert({ key: change.key, action: change.action, field: change.field ?? null, before, after: change.action === "edit" ? change.value : null, actor });
  if (history.error) console.error(JSON.stringify({ event: "content_history_failed", code: history.error.code }));
  revalidateTag(CONTENT_TAG, { expire: 0 });
  revalidateTag("landing", { expire: 0 });
  return current;
}
