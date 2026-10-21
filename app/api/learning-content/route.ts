import { z } from "zod";
import { api, sameOrigin, jsonBody } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
import { learningPages, publishedBlocks, recordView } from "@/lib/server/learning-uploads";

// A first visit may generate a missing study pack after the response (text, a cover and two figures).
export const maxDuration = 300;

/*
 * Published Upload Learning content for one page of a surface (`?surface=landing&page=home`), or the visible
 * custom Learning Dashboard pages for the sidebar (`?pages=1`). Read by the client-side slots on each page.
 * POST `{ id }` counts a view of a block (once per visitor session, sent by the slot), rate limited per address.
 */
const query = z.union([
  z.object({ pages: z.literal("1") }),
  z.object({ surface: z.enum(["dashboard", "landing", "sign_in", "sign_up", "super_admin"]), page: z.string().trim().min(1).max(80) }),
]);

export async function GET(request: Request) {
  return api(async () => {
    const input = query.parse(Object.fromEntries(new URL(request.url).searchParams));
    if ("pages" in input) return Response.json({ pages: (await learningPages()).map(({ slug, title, icon, description }) => ({ slug, title, icon, description })) });
    return Response.json({ blocks: await publishedBlocks(input.surface, input.page) });
  }, request);
}

const client = (request: Request) => request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const { id } = z.object({ id: z.string().uuid() }).parse(await jsonBody(request, 200));
    await rateLimit(`learning:view:${client(request)}`, 60, 60);
    await recordView(id);
    return new Response(null, { status: 204 });
  }, request);
}
