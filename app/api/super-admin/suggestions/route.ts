import { z } from "zod";
import { api, HttpError, jsonBody, sameOrigin } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { db } from "@/lib/server/db";
import { adminError, adminRpc } from "@/lib/server/admin-rpc";
import { rateLimit } from "@/lib/server/rate-limit";
import { SUGGESTION_CATEGORIES, SUGGESTION_PAGE_SIZE, SUGGESTION_PRIORITIES, SUGGESTION_SCOPES, SUGGESTION_SORTS, SUGGESTION_STATUSES, type Suggestion } from "@/lib/suggestions";
import { suggestionBulkSchema, suggestionUpdateSchema } from "@/lib/suggestions-schema";

const filters = z.object({
  search: z.string().trim().max(200).default(""), scope: z.enum(SUGGESTION_SCOPES).default("all"),
  status: z.union([z.enum(SUGGESTION_STATUSES), z.literal("")]).default(""),
  category: z.union([z.enum(SUGGESTION_CATEGORIES), z.literal("")]).default(""), priority: z.union([z.enum(SUGGESTION_PRIORITIES), z.literal("")]).default(""),
  replied: z.enum(["", "yes", "no"]).default(""),
  page: z.coerce.number().int().min(1).max(1000000).default(1), sort: z.enum(SUGGESTION_SORTS).default("newest"),
  from: z.union([z.iso.date(), z.literal("")]).default(""), to: z.union([z.iso.date(), z.literal("")]).default(""),
  format: z.enum(["json", "csv"]).default("json"),
});
type Filters = z.infer<typeof filters>;
type Listing = { total: number; suggestions: Suggestion[]; counts: Record<string, number>; awaitingReply?: number; urgent?: number };
const EXPORT_LIMIT = 1000;
const migrationMissing = (error: unknown) => error instanceof HttpError && error.code === "migration_required";

/** 0026's listing; until that migration is applied, 0025's (no scope, replied filter, priority sort or reply counts). */
async function list(f: Filters, limit: number): Promise<Listing & { legacy?: true }> {
  const end = f.to ? new Date(Date.parse(`${f.to}T00:00:00Z`) + 86400000).toISOString() : null;
  const from = f.from ? `${f.from}T00:00:00Z` : null;
  try {
    return await adminRpc<Listing>("admin_list_suggestions_v2", { p_search: f.search, p_scope: f.scope, p_status: f.status, p_category: f.category, p_priority: f.priority, p_replied: f.replied, p_page: f.page, p_limit: limit, p_sort: f.sort, p_from: from, p_to: end });
  } catch (error) {
    if (!migrationMissing(error) || limit !== SUGGESTION_PAGE_SIZE) throw error;
    const legacy = await adminRpc<Listing>("admin_list_suggestions", { p_search: f.search, p_status: f.status, p_category: f.category, p_priority: f.priority, p_page: f.page, p_sort: f.sort === "priority" ? "newest" : f.sort, p_from: from, p_to: end });
    return { ...legacy, legacy: true };
  }
}

/** A spreadsheet cell: quoted, and with formula prefixes neutralised so a suggestion cannot run as a formula. */
function cell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${(/^[=+\-@\t\r]/.test(text) ? `'${text}` : text).replaceAll('"', '""')}"`;
}
function csv(rows: Suggestion[]) {
  const columns: (keyof Suggestion)[] = ["id", "created_at", "updated_at", "status", "priority", "category", "name", "email", "title", "body", "reply_count", "last_reply_at"];
  return [columns.join(","), ...rows.map(row => columns.map(column => cell(row[column])).join(","))].join("\r\n");
}

export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    const params = new URL(request.url).searchParams;
    if (params.has("id")) {
      const id = z.uuid().parse(params.get("id"));
      const result = await db().from("suggestions").select("id,name,email,category,title,body,status,priority,version,created_at,updated_at").eq("id", id).maybeSingle();
      if (result.error) adminError(result.error);
      if (!result.data) throw new HttpError(404, "not_found");
      const updates = await db().from("suggestion_updates").select("id,status,priority,reply,actor_id,created_at").eq("suggestion_id", id).order("created_at");
      if (updates.error) adminError(updates.error);
      return Response.json({ suggestion: result.data, updates: updates.data });
    }
    const f = filters.parse(Object.fromEntries(params));
    if (f.from && f.to && f.from > f.to) throw new HttpError(400, "invalid_request");
    if (f.format === "csv") {
      const data = await list({ ...f, page: 1 }, EXPORT_LIMIT);
      return new Response(`﻿${csv(data.suggestions)}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="suggestions-${new Date().toISOString().slice(0, 10)}.csv"` } });
    }
    return Response.json(await list(f, SUGGESTION_PAGE_SIZE));
  }, request);
}
export async function PATCH(request: Request) {
  return api(async () => {
    const actor = await requireSuperAdmin();
    sameOrigin(request); await rateLimit(`suggestions:admin:${actor.id}`, 30, 60);
    const input = suggestionUpdateSchema.parse(await jsonBody(request, 20000));
    const suggestion = await adminRpc("admin_update_suggestion", { p_id: input.id, p_version: input.version, p_status: input.status, p_priority: input.priority, p_reply: input.reply, p_actor: actor.id }, { conflict: 409, not_found: 404 });
    return Response.json({ suggestion });
  }, request);
}
/** Bulk actions: `{ action: "update", ids, status?, priority? }` or `{ action: "delete", ids }`. */
export async function POST(request: Request) {
  return api(async () => {
    const actor = await requireSuperAdmin();
    sameOrigin(request); await rateLimit(`suggestions:admin:${actor.id}`, 30, 60);
    const input = suggestionBulkSchema.parse(await jsonBody(request, 8000));
    const affected = input.action === "delete"
      ? await adminRpc<number>("admin_delete_suggestions", { p_ids: input.ids }, { invalid_request: 400 })
      : await adminRpc<number>("admin_bulk_update_suggestions", { p_ids: input.ids, p_status: input.status ?? null, p_priority: input.priority ?? null, p_actor: actor.id }, { invalid_request: 400 });
    return Response.json({ affected });
  }, request);
}
