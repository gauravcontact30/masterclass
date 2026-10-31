import { api } from "@/lib/server/http";
import { studyBuddyAccess } from "@/lib/server/subscription-access";

/**
 * Whether this visitor may ask Study Buddy: { access, reason } from the session and the plan stored in Supabase
 * (lib/server/repository.ts account()). Always a 200, so the panel can ask on every open without a visitor's
 * curiosity being logged as a refused request; /api/study-chat itself refuses non-members with 401/402.
 */
export async function GET(request: Request) {
  return api(async () => Response.json(await studyBuddyAccess(), { headers: { "Cache-Control": "private, no-store" } }), request);
}
