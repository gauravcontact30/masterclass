import { api, jsonBody, sameOrigin } from "@/lib/server/http";
import { answerStudyQuestion, limitStudyChat } from "@/lib/server/study-chat";
import { studyChatSchema } from "@/lib/study-chat";

export const runtime = "nodejs";
export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const input = studyChatSchema.parse(await jsonBody(request, 100000));
    await limitStudyChat(request);
    return Response.json(await answerStudyQuestion(input, request.signal));
  });
}
