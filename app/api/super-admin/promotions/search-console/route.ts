import { api } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { searchConsoleReport } from "@/lib/server/search-console";

export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    const days = Math.floor(Math.min(365, Math.max(1, Number(new URL(request.url).searchParams.get("days")) || 30)));
    return Response.json(await searchConsoleReport(days));
  }, request);
}
