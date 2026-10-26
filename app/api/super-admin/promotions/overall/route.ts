import { api } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { adminRpc } from "@/lib/server/admin-rpc";
import { VISIT_RETENTION_DAYS } from "@/lib/visit-retention";
import type { OverallVisitors } from "@/lib/overall-visitors";

export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    const data = await adminRpc<OverallVisitors>("overall_visitor_tracking");
    return Response.json({ ...data, retentionDays: VISIT_RETENTION_DAYS });
  }, request);
}
