import { z } from "zod";
import { api, HttpError, jsonBody, sameOrigin } from "@/lib/server/http";
import { currentUser } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rate-limit";
import { readDeepProgress, writeDeepProgress } from "@/lib/server/deep-progress";
import { isCourseId } from "@/lib/deep-courses";
import { CHECKLIST_IDS } from "@/lib/deep-courses/progress";

/*
 * The signed-in learner's in-depth course progress. GET: every topic's checklist and completion. POST { entries }:
 * saves one or more topics (the page sends one per tick, and the whole browser copy once after the migration lands).
 */
const entrySchema = z.object({
  courseId: z.string().refine(isCourseId),
  topicId: z.string().regex(/^[a-z0-9-]{1,80}$/),
  checklist: z.array(z.enum(CHECKLIST_IDS as [string, ...string[]])).max(16),
  completed: z.boolean(),
});
const bodySchema = z.object({ entries: z.array(entrySchema).min(1).max(200) });

async function learner() {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "signin_required");
  return user.id;
}

export async function GET(request: Request) {
  return api(async () => Response.json({ progress: await readDeepProgress(await learner()) }, { headers: { "Cache-Control": "no-store" } }), request);
}

export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const userId = await learner();
    await rateLimit(`deep-progress:${userId}`, 120, 60);
    const { entries } = bodySchema.parse(await jsonBody(request, 60_000));
    await writeDeepProgress(userId, entries as Parameters<typeof writeDeepProgress>[1]);
    return Response.json({ saved: entries.length });
  }, request);
}
