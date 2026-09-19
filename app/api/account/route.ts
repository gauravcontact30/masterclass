import { api, userId, jsonBody, sameOrigin } from "@/lib/server/http";
import { account, documents, profile, progress } from "@/lib/server/repository";
import { ensureDefaultLibrary } from "@/lib/server/default-library";
import { check, db } from "@/lib/server/db";
import { z } from "zod";
import { preparationAccess, savePreparations } from "@/lib/server/preparations";
import { canReadTechnology, preparationSchema } from "@/lib/study/preparations";
export async function GET(monitorRequest?: Request) { return api(async () => {
  const id = await userId(); const user = await profile(id);
  const preparations = await preparationAccess(id);
  // Seed the shared default guides before listing, so a first-time library
  // is never empty. Idempotent, and a failure here must not break the page.
  if (preparations.isSuperAdmin || preparations.selections.some(id => id.startsWith("tech:"))) await ensureDefaultLibrary(id).catch(error => console.error(JSON.stringify({ event: "default_library_seed_failed", message: String(error) })));
  const [subscription, items, learning] = await Promise.all([account(id), documents(id), progress(id)]);
  const visible = items.filter(item => canReadTechnology(preparations, item.request.technologyId));
  return Response.json({ profile: user, preparations, account: subscription, documents: visible, progress: learning.filter(item => visible.some(doc => doc.id === item.document_id)) });
}, monitorRequest); }
export async function PATCH(request: Request) { return api(async () => {
  sameOrigin(request); const id = await userId(); const data = z.object({ language: z.enum(["en","hi"]).optional(), selections: preparationSchema.optional() }).strict().refine(value => value.language !== undefined || value.selections !== undefined).parse(await jsonBody(request));
  await profile(id);
  if (data.language) check(await db().from("profiles").update({ language: data.language }).eq("id", id));
  if (data.selections) await savePreparations(id, data.selections);
  return Response.json({ ok: true });
}, request); }
