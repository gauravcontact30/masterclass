import { api, jsonBody, sameOrigin, userId, HttpError } from "@/lib/server/http";
import { account } from "@/lib/server/repository";
import { preparationAccess } from "@/lib/server/preparations";
import { rateLimit } from "@/lib/server/rate-limit";
import { attachment } from "@/lib/artistic-notes/download";
import { buildNotebook, serializeNotebook } from "@/lib/artistic-notes/notebook";
import { notebookRequestSchema, requestLimits } from "@/lib/artistic-notes/schema";

export const runtime = "nodejs";
export const maxDuration = 30;

/** POST notebookRequestSchema JSON -> an nbformat 4.5 .ipynb download. */
export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const owner = await userId();
    if (!(await preparationAccess(owner)).isSuperAdmin && (await account(owner)).tier === "free") throw new HttpError(402, "subscription_required");
    await rateLimit(`artistic-notes:notebook:${owner}`, 20);
    const input = notebookRequestSchema.parse(await jsonBody(request, requestLimits.notebook));
    return attachment(serializeNotebook(buildNotebook(input)), input.title, "notebook");
  });
}
