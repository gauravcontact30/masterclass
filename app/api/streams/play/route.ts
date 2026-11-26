import { api, HttpError } from "@/lib/server/http";
import { streamPlayback } from "@/lib/server/streams-access";

/**
 * GET /api/streams/play?step=<opaque step id> → { src, free }: the player address for one Streams step, for a viewer
 * entitled to it (lib/server/streams-access.ts). The first step of every course is free; the rest answer 401 (sign in)
 * or 402 (subscribe). Never cached: the answer depends on the session.
 */
export async function GET(request: Request) {
  return api(async () => {
    const step = new URL(request.url).searchParams.get("step") ?? "";
    if (!/^[A-Za-z0-9_-]{6,40}$/.test(step)) throw new HttpError(400, "invalid_step");
    return Response.json(await streamPlayback(step), { headers: { "Cache-Control": "private, no-store" } });
  }, request);
}
