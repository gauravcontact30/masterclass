import { z } from "zod";
import { createHash } from "node:crypto";
import { api, jsonBody, sameOrigin } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
import { cachedAudio, speak } from "@/lib/server/audio";
import { MAX_PART, isVoice } from "@/lib/audio-voices";

/*
 * POST `{ voice, text }`: the URL of an MP3 of `text` (one part of an audio lecture) read by `voice`. Parts made
 * before come straight from storage; only new ones count against the rate limit, since each costs a Vercel AI
 * Gateway call. Open to signed-out visitors because the landing page's cards have Listen buttons too.
 */
export const maxDuration = 90;
const input = z.object({ voice: z.string().refine(isVoice, "unknown_voice"), text: z.string().trim().min(1).max(MAX_PART) }).strict();
const client = (request: Request) => createHash("sha256").update(request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "anonymous").digest("hex").slice(0, 32);

export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const { voice, text } = input.parse(await jsonBody(request, 8_000));
    const cached = await cachedAudio(voice, text);
    if (cached) return Response.json({ url: cached, cached: true });
    await rateLimit(`audio:${client(request)}`, 40, 600);
    return Response.json({ url: await speak(voice, text), cached: false });
  }, request);
}
