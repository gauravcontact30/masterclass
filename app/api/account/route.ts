import { api, userId, jsonBody, sameOrigin } from "@/lib/server/http";
import { account, documents, profile, progress } from "@/lib/server/repository";
import { ensureDefaultLibrary } from "@/lib/server/default-library";
import { check, db } from "@/lib/server/db";
import { z } from "zod";
import { preparationAccess, savePreparations } from "@/lib/server/preparations";
import { canReadTechnology } from "@/lib/study/preparations";
import { preparationSchema } from "@/lib/study/preparation-schema";
import { LANGUAGES } from "@/lib/domain";
export async function GET(monitorRequest: Request) { return api(async () => {
  const id = await userId();
  // The profile row and the preparations (auth metadata) are independent reads; this route is on every dashboard
  // load, so its round trips run side by side rather than one after another.
  const summary = new URL(monitorRequest.url).searchParams.get("view") === "summary";
  const owner = profile(id);
  const [user, preparations, subscription, learning] = await Promise.all([
    owner, preparationAccess(id), account(id, owner), summary ? Promise.resolve([]) : progress(id),
  ]);
  // ?view=summary: who is signed in and what they pay for, for public pages (Tech Buzz) that only gate on membership.
  // Skips the library seed, the document list and progress, the slow half of this route.
  if (summary) return Response.json({ profile: user, preparations, account: subscription }, { headers: { "Cache-Control": "private, no-store" } });
  // Seed the shared default guides before listing, so a first-time library is never empty. Only the document list
  // waits for it. Idempotent, and a failure here must not break the page.
  const seed = preparations.isSuperAdmin || preparations.selections.some(id => id.startsWith("tech:"))
    ? ensureDefaultLibrary(id).catch(error => console.error(JSON.stringify({ event: "default_library_seed_failed", message: String(error) })))
    : Promise.resolve();
  const items = await seed.then(() => documents(id));
  const visible = items.filter(item => canReadTechnology(preparations, item.request.technologyId));
  const visibleIds = new Set(visible.map(item => item.id));
  return Response.json({ profile: user, preparations, account: subscription, documents: visible, progress: learning.filter(item => visibleIds.has(item.document_id)) });
}, monitorRequest); }
export async function PATCH(request: Request) { return api(async () => {
  sameOrigin(request); const id = await userId(); const data = z.object({ language: z.enum(LANGUAGES).optional(), selections: preparationSchema.optional() }).strict().refine(value => value.language !== undefined || value.selections !== undefined).parse(await jsonBody(request));
  await profile(id);
  if (data.language) {
    try {
      check(await db().from("profiles").update({ language: data.language }).eq("id", id));
    } catch (e) {
      console.warn("Language update database check constraint notice:", e);
    }
  }
  if (data.selections) await savePreparations(id, data.selections);
  return Response.json({ ok: true });
}, request); }
