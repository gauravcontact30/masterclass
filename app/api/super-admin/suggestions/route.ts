import { z } from "zod";
import { api, HttpError, jsonBody, sameOrigin } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { db } from "@/lib/server/db";
import { adminError, adminRpc } from "@/lib/server/admin-rpc";
import { rateLimit } from "@/lib/server/rate-limit";
import { SUGGESTION_CATEGORIES, SUGGESTION_PRIORITIES, SUGGESTION_STATUSES, suggestionUpdateSchema } from "@/lib/suggestions";

const filters = z.object({
  search: z.string().trim().max(200).default(""), status: z.union([z.enum(SUGGESTION_STATUSES), z.literal("")]).default(""),
  category: z.union([z.enum(SUGGESTION_CATEGORIES), z.literal("")]).default(""), priority: z.union([z.enum(SUGGESTION_PRIORITIES), z.literal("")]).default(""),
  page: z.coerce.number().int().min(1).max(1000000).default(1), sort: z.enum(["newest", "oldest", "updated"]).default("newest"),
  from: z.union([z.iso.date(), z.literal("")]).default(""), to: z.union([z.iso.date(), z.literal("")]).default(""),
});
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
    const end = f.to ? new Date(Date.parse(`${f.to}T00:00:00Z`) + 86400000).toISOString() : null;
    return Response.json(await adminRpc("admin_list_suggestions", { p_search: f.search, p_status: f.status, p_category: f.category, p_priority: f.priority, p_page: f.page, p_sort: f.sort, p_from: f.from ? `${f.from}T00:00:00Z` : null, p_to: end }));
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
