import { api } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { trafficSourcesReport } from "@/lib/server/traffic-sources";

/** Super Admin → Traffic sources: live visitors by platform (Instagram, Facebook, LinkedIn, X, Pinterest, TrustMRR, Google, Direct…) and the window's sessions. */
export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    const days = Number(new URL(request.url).searchParams.get("days"));
    return Response.json(await trafficSourcesReport([1, 7, 30, 90].includes(days) ? days : 7), { headers: { "Cache-Control": "private, no-store" } });
  }, request);
}
