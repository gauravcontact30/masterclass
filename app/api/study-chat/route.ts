import { api, jsonBody, sameOrigin } from "@/lib/server/http";
import { answerStudyQuestion, limitStudyChat, streamStudyAnswer } from "@/lib/server/study-chat";
import { studyChatSchema } from "@/lib/study-chat";

export const maxDuration = 60;

export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const input = studyChatSchema.parse(await jsonBody(request, 100000));
    await limitStudyChat(request);
    // Streamed: the first words reach the reader in about a second instead of after the whole answer.
    if (input.stream) return new Response(streamStudyAnswer(input, request.signal), { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" } });
    return Response.json(await answerStudyQuestion(input, request.signal));
  }, request);
}
