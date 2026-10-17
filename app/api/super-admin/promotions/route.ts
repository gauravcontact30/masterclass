import { z } from "zod";
import { api, HttpError, jsonBody, sameOrigin } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { rateLimit } from "@/lib/server/rate-limit";
import { db } from "@/lib/server/db";
import { adminError } from "@/lib/server/admin-rpc";
import { PLATFORMS, PROMOTION_FORMATS, PROMOTION_STATUSES, attribute, campaignSlug, type ProfileRow, type Promotion, type SubscriptionRow, type VisitRow } from "@/lib/promotions";

/*
 * Promotional Tracking (migration 0024): the promotions an admin registers, joined to real traffic from
 * site_visits (migration 0023), sign-ups and memberships. GET returns everything the page shows for a window;
 * POST, PATCH and DELETE manage promotions. Reads are paged and capped so a busy month stays fast.
 */
const PAGE = 1000;
const MAX_VISITS = 20_000;

async function pagedVisits(since: string): Promise<{ rows: VisitRow[]; capped: boolean }> {
  const rows: VisitRow[] = [];
  for (let from = 0; from < MAX_VISITS; from += PAGE) {
    const { data, error } = await db().from("site_visits").select("created_at,visitor_id,session_id,user_id,path,referrer_host,utm_source,utm_medium,utm_campaign")
      .eq("event", "page_view").eq("is_bot", false).gte("created_at", since).order("created_at", { ascending: true }).range(from, from + PAGE - 1);
    if (error) adminError(error);
    rows.push(...(data ?? []) as VisitRow[]);
    if (!data || data.length < PAGE) return { rows, capped: false };
  }
  return { rows, capped: true };
}

export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    const days = Math.min(365, Math.max(1, Number(new URL(request.url).searchParams.get("days")) || 30));
    const since = new Date(Date.now() - days * 86_400_000).toISOString();
    const promotionsResult = await db().from("promotions").select("*").order("created_at", { ascending: false }).limit(500);
    if (promotionsResult.error) adminError(promotionsResult.error);
    const promotions = (promotionsResult.data ?? []).map(row => ({ ...row, budget_inr: Number(row.budget_inr), spend_inr: Number(row.spend_inr) })) as Promotion[];
    const { rows: visits, capped } = await pagedVisits(since);
    const userIds = [...new Set(visits.map(visit => visit.user_id).filter((id): id is string => !!id))];
    let profiles: ProfileRow[] = [], subscriptions: SubscriptionRow[] = [];
    for (let i = 0; i < userIds.length; i += 200) {
      const ids = userIds.slice(i, i + 200);
      const [p, s] = await Promise.all([db().from("profiles").select("id,created_at").in("id", ids), db().from("subscriptions").select("user_id,status,tier").in("user_id", ids)]);
      if (p.error) adminError(p.error); if (s.error) adminError(s.error);
      profiles = profiles.concat((p.data ?? []) as ProfileRow[]); subscriptions = subscriptions.concat((s.data ?? []) as SubscriptionRow[]);
    }
    return Response.json({ promotions, ...attribute({ visits, profiles, subscriptions, promotions, since }), days, capped, generatedAt: new Date().toISOString() });
  }, request);
}

const day = z.iso.date().nullable().optional();
const count = z.number().int().min(0).max(2_000_000_000);
const fields = {
  platform: z.enum(PLATFORMS), title: z.string().trim().min(3).max(160), format: z.enum(PROMOTION_FORMATS), status: z.enum(PROMOTION_STATUSES),
  url: z.url({ protocol: /^https?$/ }).max(500).nullable().optional(), utm_campaign: z.string().trim().min(1).max(80).transform(campaignSlug).refine(value => value.length > 0, "invalid_campaign"),
  audience: z.string().trim().max(160).nullable().optional(), owner: z.string().trim().max(80).nullable().optional(), starts_on: day, ends_on: day,
  budget_inr: z.number().min(0).max(1e10), spend_inr: z.number().min(0).max(1e10), reach: count, impressions: count, engagements: count, followers_gained: count,
  notes: z.string().trim().max(1000).nullable().optional(),
};
const createSchema = z.object({ ...fields, budget_inr: fields.budget_inr.default(0), spend_inr: fields.spend_inr.default(0), reach: count.default(0), impressions: count.default(0), engagements: count.default(0), followers_gained: count.default(0), status: fields.status.default("planned"), format: fields.format.default("post") }).strict()
  .refine(input => !input.starts_on || !input.ends_on || input.ends_on >= input.starts_on, { message: "invalid_window" });
const updateSchema = z.object({ id: z.uuid(), ...Object.fromEntries(Object.entries(fields).map(([key, schema]) => [key, schema.optional()])) }).strict();

async function mutate(request: Request, change: (actor: string) => Promise<Response>) {
  const admin = await requireSuperAdmin(); sameOrigin(request); await rateLimit(`admin-promotions:${admin.id}`, 30, 60);
  return change(admin.id);
}

export async function POST(request: Request) {
  return api(() => mutate(request, async actor => {
    const input = createSchema.parse(await jsonBody(request, 6000));
    const { data, error } = await db().from("promotions").insert({ ...input, created_by: actor }).select("*").single();
    if (error) adminError(error, { promotions_window: 400 });
    return Response.json({ promotion: data }, { status: 201 });
  }), request);
}

export async function PATCH(request: Request) {
  return api(() => mutate(request, async () => {
    const { id, ...patch } = updateSchema.parse(await jsonBody(request, 6000));
    if (!Object.keys(patch).length) throw new HttpError(400, "invalid_request");
    const { data, error } = await db().from("promotions").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id).select("*").maybeSingle();
    if (error) adminError(error, { promotions_window: 400 });
    if (!data) throw new HttpError(404, "not_found");
    return Response.json({ promotion: data });
  }), request);
}

export async function DELETE(request: Request) {
  return api(() => mutate(request, async () => {
    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (!z.uuid().safeParse(id).success) throw new HttpError(400, "invalid_request");
    const { error, count: deleted } = await db().from("promotions").delete({ count: "exact" }).eq("id", id);
    if (error) adminError(error);
    if (!deleted) throw new HttpError(404, "not_found");
    return Response.json({ ok: true });
  }), request);
}
