import { z } from "zod";
import { api, HttpError, jsonBody, sameOrigin } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { rateLimit } from "@/lib/server/rate-limit";
import { adminRpc } from "@/lib/server/admin-rpc";
import { isSuperAdminUser } from "@/lib/study/preparations";
import { db } from "@/lib/server/db";

/** Learner support: the 360° view of one learner, and the support actions on their account (migration 0020). */
export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    const user = new URL(request.url).searchParams.get("user") ?? "";
    if (!z.uuid().safeParse(user).success) throw new HttpError(400, "invalid_request");
    const data = await adminRpc<{ account: unknown } | null>("admin_learner", { p_user: user });
    if (!data?.account) throw new HttpError(404, "not_found");
    return Response.json({ ...data, generatedAt: new Date().toISOString() });
  }, request);
}

const reason = z.string().trim().min(5).max(500);
const inputSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("credits"), user: z.uuid(), delta: z.number().int().min(-100).max(100).refine(value => value !== 0), reason }).strict(),
  z.object({ action: z.literal("reset_usage"), user: z.uuid(), reason }).strict(),
  z.object({ action: z.literal("revoke_sessions"), user: z.uuid(), reason }).strict(),
]);

export async function POST(request: Request) {
  return api(async () => {
    const admin = await requireSuperAdmin(); sameOrigin(request); await rateLimit(`admin-support:${admin.id}`, 20, 60);
    const input = inputSchema.parse(await jsonBody(request, 3000));
    const { data: target } = await db().auth.admin.getUserById(input.user);
    if (!target.user) throw new HttpError(404, "not_found");
    // The owner account is protected from being signed out, as it is from role and ban changes.
    if (input.action === "revoke_sessions" && (input.user === admin.id || isSuperAdminUser(target.user))) throw new HttpError(409, "owner_protected");
    const known = { not_found: 404, insufficient_credits: 409, invalid_delta: 400 };
    if (input.action === "credits") return Response.json({ balance: await adminRpc<number>("admin_adjust_credits", { p_user: input.user, p_delta: input.delta, p_actor: admin.id, p_reason: input.reason }, known) });
    if (input.action === "reset_usage") return Response.json({ previous: await adminRpc<number>("admin_reset_usage", { p_user: input.user, p_actor: admin.id, p_reason: input.reason }, known) });
    return Response.json({ removed: await adminRpc<number>("admin_revoke_sessions", { p_user: input.user, p_actor: admin.id, p_reason: input.reason }, known) });
  }, request);
}
