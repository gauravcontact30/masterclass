import { z } from "zod";
import { headers } from "next/headers";
import { api, jsonBody, readerId, sameOrigin, userId } from "@/lib/server/http";
import { PORTAL_HEADER, isExamPortal } from "@/lib/portal";
import { db } from "@/lib/server/db";

/*
 * Saved objective answers for Board Exams and Competitive Exams (supabase/migrations/0056_exam_answers.sql). Requests
 * come from an exam portal's pages with the x-portal header (lib/client.ts), so readerId/userId resolve to that
 * portal's own account; inside the Learning Dashboard there is no header and the Tech Pro account is used. Until the migration is applied, reads return nothing and writes report stored: false, so
 * practice keeps working in the page either way.
 */
const scopeSchema = z.string().regex(/^[a-z0-9-]{1,40}$/);
const answerSchema = z.object({
  scope: scopeSchema,
  item: z.string().regex(/^[A-Za-z0-9:_.-]{1,120}$/),
  choice: z.number().int().min(-1).max(9),
  correct: z.boolean(),
}).strict();
/** PostgREST / Postgres codes for a table that does not exist yet. */
const missingTable = (code?: string) => code === "PGRST205" || code === "42P01";

/** The exam portal the request came from, or tech for the same pages inside the Learning Dashboard (no header). */
async function examPortal() {
  const portal = (await headers()).get(PORTAL_HEADER);
  return isExamPortal(portal) ? portal : "tech";
}

export async function GET(request: Request) {
  return api(async () => {
    const portal = await examPortal();
    const owner = await readerId();
    const scope = scopeSchema.parse(new URL(request.url).searchParams.get("scope"));
    const { data, error } = await db().from("exam_answers").select("item_key, choice").eq("account_id", owner).eq("portal", portal).eq("scope", scope).limit(5000);
    if (error) { if (missingTable(error.code)) return Response.json({ answers: {}, stored: false }); throw new Error(error.message); }
    return Response.json({ answers: Object.fromEntries((data ?? []).map(row => [row.item_key, row.choice])), stored: true });
  }, request);
}

export async function PUT(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const portal = await examPortal();
    const owner = await userId();
    const { scope, item, choice, correct } = answerSchema.parse(await jsonBody(request, 2000));
    const { error } = await db().from("exam_answers").upsert(
      { account_id: owner, portal, scope, item_key: item, choice, correct, answered_at: new Date().toISOString() },
      { onConflict: "account_id,portal,scope,item_key" },
    );
    if (error) { if (missingTable(error.code)) return Response.json({ stored: false }); throw new Error(error.message); }
    return Response.json({ stored: true });
  }, request);
}

export async function DELETE(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const portal = await examPortal();
    const owner = await userId();
    const { scope } = z.object({ scope: scopeSchema }).strict().parse(await jsonBody(request, 500));
    const { error } = await db().from("exam_answers").delete().eq("account_id", owner).eq("portal", portal).eq("scope", scope);
    if (error && !missingTable(error.code)) throw new Error(error.message);
    return Response.json({ cleared: true });
  }, request);
}
