import { z } from "zod";
import { api, HttpError, jsonBody, sameOrigin } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { rateLimit } from "@/lib/server/rate-limit";
import { db } from "@/lib/server/db";
import { adminError } from "@/lib/server/admin-rpc";
import { METRIC_KEYS, PLATFORMS, PROMOTION_FORMATS, PROMOTION_STATUSES, attribute, campaignSlug, type ProfileRow, type Promotion, type SubscriptionRow, type VisitRow } from "@/lib/promotions";
import { VISIT_RETENTION_DAYS } from "@/lib/visit-retention";

/*
 * Promotional Tracking (migration 0024): the promotions an admin registers, joined to real traffic from
 * site_visits (migration 0023), sign-ups and memberships. GET returns everything the page shows for a window;
 * POST, PATCH and DELETE manage promotions. Reads are paged and capped so a busy month stays fast.
 */
const PAGE = 1000;

const visitsQuery = (since: string, until: string) => db().from("site_visits").select("id,created_at,visitor_id,session_id,user_id,path,referrer_host,utm_source,utm_medium,utm_campaign")
  .eq("event", "page_view").eq("is_bot", false).gte("created_at", since).lt("created_at", until);

/** Keyset pagination avoids truncated totals and shifting offsets during retention cleanup. */
async function pagedVisits(since: string, until: string): Promise<VisitRow[]> {
  const rows: VisitRow[] = [];
  let cursor = 0;
  while (true) {
    const { data, error } = await visitsQuery(since, until).gt("id", cursor).order("id", { ascending: true }).limit(PAGE);
    if (error) adminError(error);
    const page = (data ?? []) as (VisitRow & { id: number })[];
    rows.push(...page);
    if (page.length < PAGE) return rows;
    cursor = page.at(-1)!.id;
  }
}

async function allPromotions() {
  const rows: Promotion[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await db().from("promotions").select("*").order("id").range(offset, offset + PAGE - 1);
    if (error) adminError(error);
    rows.push(...(data ?? []).map(row => ({ ...row, budget_inr: Number(row.budget_inr), spend_inr: Number(row.spend_inr) })) as Promotion[]);
    if (!data || data.length < PAGE) return rows;
  }
}

export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    const days = Math.floor(Math.min(365, Math.max(1, Number(new URL(request.url).searchParams.get("days")) || 30)));
    const until = new Date().toISOString();
    const since = new Date(Date.parse(until) - days * 86_400_000).toISOString();
    // Promotions and the visit window are independent; read them side by side.
    const [promotions, visits] = await Promise.all([allPromotions(), pagedVisits(since, until)]);
    const userIds = [...new Set(visits.map(visit => visit.user_id).filter((id): id is string => !!id))];
    const chunks = Array.from({ length: Math.ceil(userIds.length / 200) }, (_, i) => userIds.slice(i * 200, i * 200 + 200));
    const results = await Promise.all(chunks.map(ids => Promise.all([db().from("profiles").select("id,created_at").in("id", ids), db().from("subscriptions").select("user_id,status,tier,current_period_end").in("user_id", ids)])));
    const profiles: ProfileRow[] = [], subscriptions: SubscriptionRow[] = [];
    for (const [p, s] of results) {
      if (p.error) adminError(p.error); if (s.error) adminError(s.error);
      profiles.push(...(p.data ?? []) as ProfileRow[]); subscriptions.push(...(s.data ?? []) as SubscriptionRow[]);
    }
    return Response.json({ promotions, ...attribute({ visits, profiles, subscriptions, promotions, since, until }), days, capped: false, retentionDays: VISIT_RETENTION_DAYS, generatedAt: until });
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
  // Medium, Pinterest and Coursera figures (migration 0038); an average rating is out of 5, everything else a count or ₹.
  platform_metrics: z.object(Object.fromEntries(METRIC_KEYS.map(key => [key, (key === "rating_average" ? z.number().min(0).max(5) : z.number().min(0).max(1e10)).optional()]))).strict().nullable().optional(),
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
