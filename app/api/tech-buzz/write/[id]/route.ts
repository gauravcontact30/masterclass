import { api, HttpError, sameOrigin } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
import { deleteInkStory, getInkStory, requireWriter } from "@/lib/server/tech-buzz-ink";

/** One of the writer's own stories: GET loads it into the editor, DELETE removes it (published ones leave /tech-buzz). */
type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  return api(async () => {
    const writer = await requireWriter();
    const story = await getInkStory(writer.id, (await params).id);
    if (!story) throw new HttpError(404, "not_found");
    return Response.json({ story });
  }, request);
}

export async function DELETE(request: Request, { params }: Params) {
  return api(async () => {
    sameOrigin(request);
    const writer = await requireWriter();
    await rateLimit(`tech-buzz:write:${writer.id}`, 30, 60);
    await deleteInkStory(writer.id, (await params).id);
    return Response.json({ deleted: true });
  }, request);
}
