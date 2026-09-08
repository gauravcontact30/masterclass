import { api, userId, jsonBody, sameOrigin, HttpError } from "@/lib/server/http";
import { account } from "@/lib/server/repository";
import { check, db } from "@/lib/server/db";
import { requestSchema, documentKey } from "@/lib/domain";
import { rateLimit } from "@/lib/server/rate-limit";
import { required } from "@/lib/server/config";
export async function POST(request: Request) { return api(async () => {
  sameOrigin(request); const owner = await userId(); const input = requestSchema.parse(await jsonBody(request));
  await rateLimit(`generate:${owner}`, 6);
  const topic = check(await db().from("topics").select("*").eq("id",input.topicId).eq("technology_id",input.technologyId).maybeSingle());
  if (!topic) throw new HttpError(400,"invalid_topic");
  required("ANTHROPIC_API_KEY"); required("ANTHROPIC_MODEL"); required("CHROMIUM_EXECUTABLE_PATH"); required("DOCUMENT_FONT_PATH"); required("WORKER_SECRET");
  const access = await account(owner);
  const result = await db().rpc("reserve_document", { p_user: owner, p_key: documentKey(input,topic.version), p_title: input.language === "hi" ? topic.title_hi : topic.title, p_request: input, p_limit: access.limit });
  if (result.error?.message.includes("quota_exceeded")) throw new HttpError(403,"quota_exceeded");
  return Response.json({ document: check(result) }, { status: 202 });
}); }
