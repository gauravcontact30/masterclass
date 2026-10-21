import { z } from "zod";
import { api, HttpError, jsonBody, sameOrigin } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
import { cachedDocumentation, checkDocumentation, importDocumentation, listDocumentationUpdates } from "@/lib/server/documentation-updates";

export const maxDuration = 60;
const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/);

export async function GET(request: Request) {
  return api(async () => {
    const id = new URL(request.url).searchParams.get("id");
    if (id) {
      const record = await cachedDocumentation(idSchema.parse(id));
      return Response.json({ published: record?.published ?? null, pending: record?.pending ?? null, importedAt: record?.importedAt ?? null });
    }
    return Response.json({ updates: await listDocumentationUpdates() });
  }, request);
}

export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const input = z.discriminatedUnion("action", [
      z.object({ action: z.literal("check"), ids: z.array(idSchema).min(1).max(3) }).strict(),
      z.object({ action: z.literal("import"), id: idSchema, hash: z.string().regex(/^[a-f0-9]{64}$/) }).strict(),
    ]).parse(await jsonBody(request, 3000));
    // Public source snapshots contain no account data. A shared database-backed
    // budget cannot be bypassed with forged development sessions or IP headers.
    await rateLimit("documentation-updates:public-sources", 120, 3600);
    if (input.action === "import") return Response.json({ update: await importDocumentation(input.id, input.hash) });
    const results = await Promise.all([...new Set(input.ids)].map(async id => {
      try { return { id, update: await checkDocumentation(id) }; }
      catch (error) {
        if (error instanceof HttpError) return { id, error: error.code };
        return { id, error: "Official source could not be checked. Try again later; the imported copy is unchanged." };
      }
    }));
    return Response.json({ results });
  }, request);
}
