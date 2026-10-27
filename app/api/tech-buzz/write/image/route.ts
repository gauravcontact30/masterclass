import { api, HttpError, sameOrigin } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
import { MAX_INK_IMAGE_BYTES, requireWriter, storeInkImage } from "@/lib/server/tech-buzz-ink";

/** POST multipart { file }: a cover or in-story picture for Write, stored in Supabase Storage; returns its public URL. */
export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const writer = await requireWriter();
    await rateLimit(`tech-buzz:write-image:${writer.id}`, 20, 600);
    if (Number(request.headers.get("content-length")) > MAX_INK_IMAGE_BYTES + 64_000) throw new HttpError(413, "request_too_large");
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "invalid_request");
    return Response.json({ url: await storeInkImage(writer.id, file) });
  }, request);
}
