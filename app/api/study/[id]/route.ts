import { api, userId, HttpError, sameOrigin, jsonBody } from "@/lib/server/http";
import { preparationAccess } from "@/lib/server/preparations";
import { account } from "@/lib/server/repository";
import { findStudyCourse } from "@/lib/study/catalog";
import { canReadStudy } from "@/lib/study/preparations";
import { buildStudyPack } from "@/lib/study/content";
import { gradePaper } from "@/lib/study/types";
import { attemptSchema } from "@/lib/study/schemas";
import type { Language } from "@/lib/domain";
async function packFor(id: string, language: Language) {
  const owner = await userId(); const access = await preparationAccess(owner);
  const course = findStudyCourse(id);
  if (!course || !canReadStudy(access, course)) throw new HttpError(404, "not_found");
  const subscription = await account(owner);
  if (subscription.tier === "free" && !access.isSuperAdmin) throw new HttpError(402, "subscription_required");
  return buildStudyPack(course, language, subscription.tier, owner, access.isSuperAdmin);
}
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) { return api(async () => {
  const { id } = await context.params; const language = new URL(request.url).searchParams.get("language") ?? "en";
  if (language !== "en" && language !== "hi") throw new HttpError(400, "invalid_request");
  return Response.json({ pack: await packFor(id, language) });
}, request); }
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) { return api(async () => {
  sameOrigin(request); const { id } = await context.params;
  const input = attemptSchema.parse(await jsonBody(request)); const pack = await packFor(id, input.language);
  const paper = pack.papers.find(paper => paper.id === input.paperId);
  if (!paper) throw new HttpError(404, "not_found");
  try { return Response.json({ result: gradePaper(paper, pack.questions, input.answers) }); }
  catch { throw new HttpError(400, "invalid_answers"); }
}, request); }
