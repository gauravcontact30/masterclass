import { z } from "zod";
import { api, HttpError, jsonBody, sameOrigin } from "@/lib/server/http";
import { currentUser } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rate-limit";
import { generateOutline, generateTopic } from "@/lib/server/course-generator";

/*
 * POST { trackId, topicId? }: writes a generated course's outline, or one of its topics, if nobody has yet
 * (lib/server/course-generator.ts). Answers { state: "ready" | "generating" }; "generating" means another visitor's
 * request is writing it, and the page asks again shortly.
 */
export const maxDuration = 300;

const bodySchema = z.object({ trackId: z.string().regex(/^[a-z0-9-]{1,40}$/), topicId: z.string().regex(/^[a-z0-9-]{1,80}$/).optional() });

export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const user = await currentUser();
    if (!user) throw new HttpError(401, "signin_required");
    // Polling a lesson someone else is writing is cheap; starting new work is capped per learner.
    await rateLimit(`course-gen:${user.id}`, 30, 3600);
    const { trackId, topicId } = bodySchema.parse(await jsonBody(request, 500));
    const state = topicId ? await generateTopic(trackId, topicId) : await generateOutline(trackId);
    return Response.json({ state }, { headers: { "Cache-Control": "no-store" } });
  }, request);
}
