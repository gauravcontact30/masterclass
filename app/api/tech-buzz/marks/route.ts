import { z } from "zod";
import { api, HttpError, jsonBody, sameOrigin } from "@/lib/server/http";
import { currentUser } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rate-limit";
import { listMarks, setMarks } from "@/lib/server/tech-buzz-marks";
import { listPublishedTechBuzzSummaries } from "@/lib/server/tech-buzz-storage";
import { MARK_KINDS } from "@/lib/tech-buzz-mark-keys";

/*
 * A reader's Tech Buzz marks (migration 0051). GET: everything they follow, reposted, saved or hid. POST { kind, keys, on }:
 * sets or clears marks; more than one key only comes from the first upload of what a browser saved before signing in.
 * Reposts feed a public count, so they must name a published story.
 */
const bodySchema = z.object({
  kind: z.enum(MARK_KINDS),
  keys: z.array(z.string().trim().min(1).max(200)).min(1).max(500),
  on: z.boolean(),
});

export async function GET(request: Request) {
  return api(async () => {
    const user = await currentUser();
    if (!user) return Response.json({ signedIn: false, available: false });
    const marks = await listMarks(user.id);
    return Response.json({ signedIn: true, available: !!marks, marks: marks ?? undefined });
  }, request);
}

export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const user = await currentUser();
    if (!user) throw new HttpError(401, "signin_required");
    await rateLimit(`tech-buzz:marks:${user.id}`, 60, 60);
    const { kind, keys, on } = bodySchema.parse(await jsonBody(request, 60000));
    if (kind === "repost" && on) {
      const published = new Set((await listPublishedTechBuzzSummaries()).map(article => article.id));
      if (!keys.every(key => published.has(key))) throw new HttpError(404, "not_found");
    }
    if (!await setMarks(user.id, kind, keys, on)) throw new HttpError(503, "marks_unavailable");
    return Response.json({ ok: true });
  }, request);
}
