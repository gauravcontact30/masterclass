import { z } from "zod";
import { PRO_LEVELS, trackById } from "@/lib/pro-learn/types";
import { HttpError } from "@/lib/server/http";
import { generateQuiz } from "@/lib/server/pro-learn-ai";
import { proLearnRoute } from "@/lib/server/pro-learn-route";
import { AI_PROVIDERS } from "@/lib/server/ai-providers";

export const runtime = "nodejs";
export const maxDuration = 180;
export const POST = proLearnRoute("quiz", z.object({ trackId: z.string().max(40), count: z.union([z.literal(3), z.literal(5), z.literal(10), z.literal(15), z.literal(20)]), level: z.enum(PRO_LEVELS), topic: z.string().trim().max(160).default(""), provider: z.enum(AI_PROVIDERS).optional() }).strict(), async (input, signal) => {
  const track = trackById(input.trackId);
  if (!track) throw new HttpError(400, "invalid_request");
  return generateQuiz(track, input.count, input.level, input.topic, signal, input.provider);
});
