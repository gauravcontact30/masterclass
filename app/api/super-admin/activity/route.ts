import { api, HttpError } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { adminRpc } from "@/lib/server/admin-rpc";

/** The User activities page: the reporting window's summary, or one person's full trail (?person=<user id>|visitor:<id>). */
export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    const params = new URL(request.url).searchParams;
    const person = params.get("person");
    if (person) {
      if (!/^(visitor:[\w-]{8,64}|[0-9a-f-]{36})$/i.test(person)) throw new HttpError(400, "invalid_request");
      return Response.json({ ...(await adminRpc<object>("admin_person_timeline", { p_person: person }, { not_found: 404 })), generatedAt: new Date().toISOString() });
    }
    const days = Number(params.get("days"));
    const window = [1, 7, 30, 90].includes(days) ? days : 7;
    // The Audience explorer's complete country/city/page/source lists (migration 0027; 503 migration_required before it).
    if (params.get("view") === "breakdowns") return Response.json({ ...(await adminRpc<object>("admin_activity_breakdowns", { p_days: window })), generatedAt: new Date().toISOString() });
    const data = await adminRpc<object>("admin_user_activity", { p_days: window });
    return Response.json({ ...data, generatedAt: new Date().toISOString() });
  }, request);
}
