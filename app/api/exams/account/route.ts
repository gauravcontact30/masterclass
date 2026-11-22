import { api, HttpError } from "@/lib/server/http";
import { examSession } from "@/lib/server/portal";
import { account, profile } from "@/lib/server/repository";
import { PORTAL_HEADER, isExamPortal } from "@/lib/portal";

/**
 * The signed-in exam account (Board Scholars or Exam Aspirants, by the x-portal header lib/client.ts sends from that
 * portal's pages): who it is and its plan (trial, membership). Separate from the Tech account's /api/account.
 */
export async function GET(request: Request) {
  return api(async () => {
    const portal = request.headers.get(PORTAL_HEADER);
    if (!isExamPortal(portal)) throw new HttpError(400, "invalid_request");
    const session = await examSession(portal);
    if (!session) throw new HttpError(401, "signin_required");
    const owner = profile(session.accountId);
    const [who, plan] = await Promise.all([owner, account(session.accountId, owner)]);
    return Response.json({ portal, email: session.user.email ?? null, name: who?.name ?? null, account: plan }, { headers: { "Cache-Control": "private, no-store" } });
  }, request);
}
