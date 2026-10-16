import { z } from "zod";
import { revalidateTag } from "next/cache";
import { api, HttpError, jsonBody, sameOrigin } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { rateLimit } from "@/lib/server/rate-limit";
import { db } from "@/lib/server/db";
import { adminError } from "@/lib/server/admin-rpc";

/** Site-wide announcements shown to learners on the dashboard (migration 0020). Changes are audited by the table's trigger. */
export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    const { data, error } = await db().from("announcements").select("*").order("created_at", { ascending: false }).limit(100);
    if (error) adminError(error);
    return Response.json({ announcements: data ?? [], generatedAt: new Date().toISOString() });
  }, request);
}

const when = z.iso.datetime({ offset: true }).nullable().optional();
const createSchema = z.object({ title: z.string().trim().min(3).max(120), body: z.string().trim().min(3).max(600), tone: z.enum(["info", "success", "warning", "maintenance"]), starts_at: when, ends_at: when }).strict();
const updateSchema = z.object({ id: z.uuid(), active: z.boolean().optional(), ends_at: when }).strict();

async function mutate(request: Request, change: (actor: string) => Promise<Response>) {
  const admin = await requireSuperAdmin(); sameOrigin(request); await rateLimit(`admin-announce:${admin.id}`, 20, 60);
  const response = await change(admin.id);
  // Learners see the change on their next dashboard load rather than after the one-minute cache.
  revalidateTag("announcements", { expire: 0 });
  return response;
}

export async function POST(request: Request) {
  return api(() => mutate(request, async actor => {
    const input = createSchema.parse(await jsonBody(request, 4000));
    const starts = input.starts_at ?? new Date().toISOString();
    if (input.ends_at && new Date(input.ends_at) <= new Date(starts)) throw new HttpError(400, "invalid_window");
    const { data, error } = await db().from("announcements").insert({ ...input, starts_at: starts, created_by: actor }).select("*").single();
    if (error) adminError(error);
    return Response.json({ announcement: data }, { status: 201 });
  }), request);
}

export async function PATCH(request: Request) {
  return api(() => mutate(request, async () => {
    const { id, ...patch } = updateSchema.parse(await jsonBody(request, 2000));
    const { data, error } = await db().from("announcements").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id).select("*").maybeSingle();
    if (error) adminError(error, { announcements_window: 400 });
    if (!data) throw new HttpError(404, "not_found");
    return Response.json({ announcement: data });
  }), request);
}

export async function DELETE(request: Request) {
  return api(() => mutate(request, async () => {
    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (!z.uuid().safeParse(id).success) throw new HttpError(400, "invalid_request");
    const { error, count } = await db().from("announcements").delete({ count: "exact" }).eq("id", id);
    if (error) adminError(error);
    if (!count) throw new HttpError(404, "not_found");
    return Response.json({ ok: true });
  }), request);
}
