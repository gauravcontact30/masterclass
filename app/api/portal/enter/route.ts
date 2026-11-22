import { z } from "zod";
import { api, jsonBody, sameOrigin, HttpError } from "@/lib/server/http";
import { authUser } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rate-limit";
import { enterPortal, startExamsSession } from "@/lib/server/portal";
import { isExamPortal } from "@/lib/portal";

const input = z.object({ portal: z.enum(["tech", "boards", "competitive"]), intent: z.enum(["signin", "signup"]) }).strict();

/**
 * Called by the sign-in and sign-up forms once Supabase has issued a session: opens the chosen portal for that
 * identity. Sign-up creates the portal account; sign-in needs one. Sets the Exams session cookie for an exam portal.
 */
export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const user = await authUser();
    if (!user) throw new HttpError(401, "signin_required");
    if (!user.email_confirmed_at) throw new HttpError(403, "email_not_confirmed");
    const { portal, intent } = input.parse(await jsonBody(request));
    await rateLimit(`portal:enter:${user.id}`, 20, 60);
    const entered = await enterPortal(user, portal, intent);
    if (!entered.ok) return Response.json({ error: entered.reason, hasOther: entered.hasOther }, { status: entered.reason === "region_unavailable" ? 403 : entered.reason === "no_portal_account" ? 404 : 503 });
    if (isExamPortal(portal)) await startExamsSession(user.id);
    return Response.json({ ok: true, created: entered.created });
  }, request);
}
