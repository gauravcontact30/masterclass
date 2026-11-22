import { api, HttpError } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { studentsReport } from "@/lib/server/admin-students";
import { isStudentSegment } from "@/lib/admin-students";

/** Super Admin → Students: tracking for one audience (tech, boards, competitive or tet) over the reporting window. */
export async function GET(request: Request) {
  return api(async () => {
    await requireSuperAdmin();
    const url = new URL(request.url);
    const segment = url.searchParams.get("segment") ?? "";
    if (!isStudentSegment(segment)) throw new HttpError(400, "invalid_segment");
    const days = Number(url.searchParams.get("days"));
    return Response.json(await studentsReport(segment, [1, 7, 30, 90].includes(days) ? days : 7), { headers: { "Cache-Control": "private, no-store" } });
  }, request);
}
