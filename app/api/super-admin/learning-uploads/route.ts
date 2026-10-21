import { z } from "zod";
import { api, jsonBody, sameOrigin } from "@/lib/server/http";
import {
  bulkUpdate, createUpload, deleteUploads, learningPages, listRevisions, listUploads, refreshStudyPack, requireOwner, restoreRevision, updateUpload, uploadFields, uploadInput,
} from "@/lib/server/learning-uploads";

/*
 * Upload Learning, for the owner account only: list every upload with the custom pages (or one upload's earlier
 * versions with `?revisions=<id>`), publish a Notepad document, restore an earlier version, change one upload or
 * many at once, and delete uploads. Bodies may carry embedded images, so they are allowed up to 4.4 MB.
 * POST `{ studyPack: id }` regenerates an upload's thumbnail and study pack through Vercel AI Gateway; publishing
 * to the Learning Dashboard starts the same work after the response, which is why the route may run 300 seconds.
 */
const MAX_BODY = 4_400_000;
export const maxDuration = 300;

export async function GET(request: Request) {
  return api(async () => {
    await requireOwner();
    const revisions = new URL(request.url).searchParams.get("revisions");
    if (revisions) return Response.json({ revisions: await listRevisions(z.string().uuid().parse(revisions)) });
    const [uploads, pages] = await Promise.all([listUploads(), learningPages(true)]);
    return Response.json({ uploads, pages });
  }, request);
}

const restore = z.object({ restore: z.string().uuid() });
const studyPack = z.object({ studyPack: z.string().uuid() });
export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request); const owner = await requireOwner();
    const body = await jsonBody(request, MAX_BODY);
    if (body && typeof body === "object" && "restore" in body) return Response.json({ upload: await restoreRevision(restore.parse(body).restore) });
    if (body && typeof body === "object" && "studyPack" in body) return Response.json({ upload: await refreshStudyPack(studyPack.parse(body).studyPack, true) });
    return Response.json({ upload: await createUpload(uploadInput.parse(body), owner.id) }, { status: 201 });
  }, request);
}

const single = z.object({ id: z.string().uuid(), changes: z.record(z.string(), z.unknown()) });
const many = z.object({ ids: z.array(z.string().uuid()).min(1).max(100), changes: z.object({ status: z.enum(["draft", "published", "hidden"]).optional(), pinned: z.boolean().optional() }).refine(c => c.status !== undefined || c.pinned !== undefined) });
export async function PATCH(request: Request) {
  return api(async () => {
    sameOrigin(request); await requireOwner();
    const body = await jsonBody(request, MAX_BODY);
    if (body && typeof body === "object" && "ids" in body) { const { ids, changes } = many.parse(body); await bulkUpdate(ids, changes); return Response.json({ ok: true }); }
    const { id, changes } = single.parse(body);
    // Validate the changed fields with the same rules as a new upload, keeping only what was sent.
    const parsed = uploadFields.partial().parse(changes);
    const sent = Object.fromEntries(Object.entries(parsed).filter(([key]) => key in changes));
    return Response.json({ upload: await updateUpload(id, sent) });
  }, request);
}

const remove = z.object({ ids: z.array(z.string().uuid()).min(1).max(100) });
export async function DELETE(request: Request) {
  return api(async () => {
    sameOrigin(request); await requireOwner();
    await deleteUploads(remove.parse(await jsonBody(request)).ids);
    return Response.json({ ok: true });
  }, request);
}
