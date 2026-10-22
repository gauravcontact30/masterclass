import { api, HttpError, jsonBody, sameOrigin } from "@/lib/server/http";
import { studyChatSchema, type StudyChatRequest } from "@/lib/study-chat";

// Long answers stream for well over a minute on a slow provider; the client allows two minutes in all.
export const maxDuration = 120;

// The tutor module (notes index, providers, rate limiter) is imported on use: on a cold start it took ~25 s before
// the first byte, so a streamed request now sends its headers and a keep-alive first and loads it inside the stream.
const tutor = () => import("@/lib/server/study-chat");

export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const input = studyChatSchema.parse(await jsonBody(request, 100000));
    if (input.stream) return new Response(streamTutor(input, request), { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" } });
    const { answerStudyQuestion, limitStudyChat } = await tutor();
    await limitStudyChat(request);
    return Response.json(await answerStudyQuestion(input, request.signal));
  }, request);
}

/** Relays the tutor's stream with a ping every 5 s throughout (events are whole lines, so a ping never splits one);
 *  a refused request ends with an error event instead of an HTTP status, because the headers are already sent. */
function streamTutor(input: StudyChatRequest, request: Request): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | undefined;
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (line: string) => { try { controller.enqueue(encoder.encode(line)); } catch { /* reader gone */ } };
      const ping = () => send(`${JSON.stringify({ type: "ping" })}
`);
      ping(); timer = setInterval(ping, 5000);
      try {
        const { limitStudyChat, streamStudyAnswer } = await tutor();
        await limitStudyChat(request);
        const reader = streamStudyAnswer(input, request.signal).getReader();
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
      } catch (failure) {
        const error = failure instanceof HttpError ? failure.code : "tutor_unavailable";
        if (!(failure instanceof HttpError)) console.error(JSON.stringify({ event: "study_chat_stream_failed", reason: failure instanceof Error ? failure.message.slice(0, 300) : "unknown" }));
        send(`${JSON.stringify({ type: "error", error })}
`);
      } finally {
        clearInterval(timer);
        try { controller.close(); } catch { /* already closed */ }
      }
    },
    cancel() { clearInterval(timer); },
  });
}
