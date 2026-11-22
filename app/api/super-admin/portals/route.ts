import { api } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { portalReports } from "@/lib/server/admin-portals";

/** Super Admin → Portals: accounts, sign-ups, memberships, traffic and content for Tech Pro, Board Scholars and Exam Aspirants. */
export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    const days = Number(new URL(request.url).searchParams.get("days"));
    return Response.json(await portalReports([1, 7, 30, 90].includes(days) ? days : 7), { headers: { "Cache-Control": "private, no-store" } });
  }, request);
}
