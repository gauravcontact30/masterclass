import { z } from "zod";
import { api, jsonBody, sameOrigin } from "@/lib/server/http";
import { createPage, deletePage, pageInput, requireOwner, updatePage } from "@/lib/server/learning-uploads";

/** Custom Learning Dashboard pages (sidebar entries at /dashboard/learn/[slug]), managed by the owner account only. */
export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request); await requireOwner();
    return Response.json({ page: await createPage(pageInput.parse(await jsonBody(request))) }, { status: 201 });
  }, request);
}

const patch = z.object({ id: z.string().uuid(), changes: pageInput.partial() });
export async function PATCH(request: Request) {
  return api(async () => {
    sameOrigin(request); await requireOwner();
    const body = await jsonBody(request);
    const { id, changes } = patch.parse(body);
    const sent = Object.fromEntries(Object.entries(changes).filter(([key]) => key in (body.changes ?? {})));
    return Response.json({ page: await updatePage(id, sent) });
  }, request);
}

export async function DELETE(request: Request) {
  return api(async () => {
    sameOrigin(request); await requireOwner();
    await deletePage(z.object({ id: z.string().uuid() }).parse(await jsonBody(request)).id);
    return Response.json({ ok: true });
  }, request);
}
