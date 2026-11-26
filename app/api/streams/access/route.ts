import { api } from "@/lib/server/http";
import { streamAccess } from "@/lib/server/streams-access";

/**
 * GET /api/streams/access → { signedIn, member: { tech, board, exams, ielts } }: which Streams categories this viewer
 * may watch beyond each course's free first step, so pages can show padlocks honestly. Always a 200; the player
 * address itself comes only from /api/streams/play, which enforces the same rule.
 */
export async function GET(request: Request) {
  return api(async () => Response.json(await streamAccess(), { headers: { "Cache-Control": "private, no-store" } }), request);
}
