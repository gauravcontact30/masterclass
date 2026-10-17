import { z } from "zod";
import { generateInterview } from "@/lib/server/pro-learn-ai";
import { proLearnRoute } from "@/lib/server/pro-learn-route";
import { AI_PROVIDERS } from "@/lib/server/ai-providers";

export const maxDuration = 180;
export const POST = proLearnRoute("interview", z.object({ category: z.string().max(60), company: z.string().max(60), level: z.enum(["All", "Easy", "Medium", "Hard"]), provider: z.enum(AI_PROVIDERS).optional() }).strict(), (input, signal) => generateInterview(input.category, input.company, input.level, signal, input.provider));
