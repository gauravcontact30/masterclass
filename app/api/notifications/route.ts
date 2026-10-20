import { z } from "zod";
import { api, jsonBody, sameOrigin, userId } from "@/lib/server/http";
import { db } from "@/lib/server/db";

/*
 * The signed-in learner's notifications (migration 0031): the latest 30 and the unread count, and marking them read.
 * Rows are always filtered by the session's own user id; nobody can read or mark another learner's.
 */
const LIMIT = 30;
const missing = (code?: string) => code === "42P01" || code === "PGRST205";
const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  return api(async () => {
    const owner = await userId();
    const [list, unread] = await Promise.all([
      db().from("notifications").select("id,kind,title,body,link,created_at,read_at").eq("user_id", owner).order("created_at", { ascending: false }).limit(LIMIT),
      db().from("notifications").select("id", { count: "exact", head: true }).eq("user_id", owner).is("read_at", null),
    ]);
    // Before migration 0031 there is simply nothing to show.
    if (missing(list.error?.code)) return Response.json({ notifications: [], unread: 0, setup: false }, { headers });
    if (list.error) throw new Error(list.error.message);
    return Response.json({ notifications: list.data ?? [], unread: unread.count ?? 0, setup: true }, { headers });
  }, request);
}

const markSchema = z.union([z.object({ ids: z.array(z.uuid()).min(1).max(LIMIT) }).strict(), z.object({ all: z.literal(true) }).strict()]);

export async function PATCH(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const owner = await userId();
    const input = markSchema.parse(await jsonBody(request, 4000));
    let query = db().from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", owner).is("read_at", null);
    if ("ids" in input) query = query.in("id", input.ids);
    const { error } = await query;
    if (error && !missing(error.code)) throw new Error(error.message);
    return Response.json({ ok: true }, { headers });
  }, request);
}
