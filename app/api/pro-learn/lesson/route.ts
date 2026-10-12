import { z } from "zod";
import { PRO_LEVELS, trackById } from "@/lib/pro-learn/types";
import { HttpError } from "@/lib/server/http";
import { generateLesson } from "@/lib/server/pro-learn-ai";
import { proLearnRoute } from "@/lib/server/pro-learn-route";
import { AI_PROVIDERS } from "@/lib/server/ai-providers";

export const runtime = "nodejs";
export const maxDuration = 180;
export const POST = proLearnRoute("lesson", z.object({ trackId: z.string().max(40), topic: z.string().trim().min(2).max(160), level: z.enum(PRO_LEVELS), provider: z.enum(AI_PROVIDERS).optional() }).strict(), async (input, signal) => {
  const track = trackById(input.trackId);
  if (!track) throw new HttpError(400, "invalid_request");
  const { lesson, provider } = await generateLesson(track, input.topic, input.level, signal, input.provider);
  return { lesson, source: "ai", provider };
});
