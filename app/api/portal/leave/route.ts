import { api, sameOrigin } from "@/lib/server/http";
import { authUser } from "@/lib/server/auth";
import { endExamsSession, portalsOf } from "@/lib/server/portal";

/**
 * Sign out of the exam portals (Board Scholars and Exam Aspirants) in this browser. `signOut`: the identity has no
 * Tech Pro account, so end the login too.
 */
export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    await endExamsSession();
    const user = await authUser();
    const held = user ? await portalsOf(user.id) : null;
    return Response.json({ ok: true, signOut: Boolean(held && !held.includes("tech")) });
  }, request);
}
