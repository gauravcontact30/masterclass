import { api, HttpError } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { studentTrace } from "@/lib/server/admin-students";
import { isStudentSegment } from "@/lib/admin-students";

/** Super Admin → Students: one student's trail (pages viewed and practice answers), newest first. */
export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    const url = new URL(request.url);
    const segment = url.searchParams.get("segment") ?? ""; const account = url.searchParams.get("account") ?? "";
    if (!isStudentSegment(segment) || !/^[0-9a-f-]{36}$/i.test(account)) throw new HttpError(400, "invalid_request");
    return Response.json(await studentTrace(segment, account), { headers: { "Cache-Control": "private, no-store" } });
  }, request);
}
