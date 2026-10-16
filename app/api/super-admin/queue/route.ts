import { z } from "zod";
import { api, jsonBody, sameOrigin } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { rateLimit } from "@/lib/server/rate-limit";
import { adminRpc } from "@/lib/server/admin-rpc";

/** Generation queue: counts, stuck leases, failures by cause, and putting a failed job back in the queue (migration 0020). */
export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    return Response.json({ ...(await adminRpc<object>("admin_queue")), generatedAt: new Date().toISOString() });
  }, request);
}

const retrySchema = z.object({ id: z.uuid(), reason: z.string().trim().min(5).max(500) }).strict();

export async function POST(request: Request) {
  return api(async () => {
    const admin = await requireSuperAdmin(); sameOrigin(request); await rateLimit(`admin-queue:${admin.id}`, 30, 60);
    const input = retrySchema.parse(await jsonBody(request, 2000));
    const status = await adminRpc<string>("admin_retry_document", { p_id: input.id, p_actor: admin.id, p_reason: input.reason }, { not_found: 404, not_failed: 409, duplicate_active: 409 });
    return Response.json({ status });
  }, request);
}
