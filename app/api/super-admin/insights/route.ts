import { api } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { adminRpc } from "@/lib/server/admin-rpc";

/** Learner growth and engagement: sign-ups, active learners, plans, credits and the most requested technologies (migration 0020). */
export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    const days = Number(new URL(request.url).searchParams.get("days"));
    return Response.json({ ...(await adminRpc<object>("admin_insights", { p_days: [1, 7, 30, 90].includes(days) ? days : 30 })), generatedAt: new Date().toISOString() });
  }, request);
}
