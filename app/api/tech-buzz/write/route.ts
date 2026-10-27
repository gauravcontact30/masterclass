import { z } from "zod";
import { api, HttpError, jsonBody, sameOrigin } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
import { listInkStories, requireWriter, saveInkStory } from "@/lib/server/tech-buzz-ink";

/*
 * Write (lib/server/tech-buzz-ink.ts), for signed-in members. GET: the writer's own stories, drafts and published.
 * POST { story, publish }: saves a draft (autosave and "Save draft") or publishes it; returns its id, slug and status.
 */
const bodySchema = z.object({ story: z.unknown(), publish: z.boolean().default(false) });

export async function GET(request: Request) {
  return api(async () => {
    const writer = await requireWriter();
    return Response.json({ stories: await listInkStories(writer.id) });
  }, request);
}

export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const writer = await requireWriter();
    await rateLimit(`tech-buzz:write:${writer.id}`, 30, 60);
    const parsed = bodySchema.safeParse(await jsonBody(request, 400_000));
    if (!parsed.success) throw new HttpError(400, "invalid_request");
    // Going live is limited separately: twenty publishes a day is plenty for a person and stops a runaway script.
    if (parsed.data.publish) await rateLimit(`tech-buzz:publish:${writer.id}`, 20, 86_400);
    return Response.json(await saveInkStory(writer, parsed.data.story, parsed.data.publish));
  }, request);
}
