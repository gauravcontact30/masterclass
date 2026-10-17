import { z } from "zod";
import { searchAnswer } from "@/lib/server/pro-learn-ai";
import { proLearnRoute } from "@/lib/server/pro-learn-route";
import { AI_PROVIDERS } from "@/lib/server/ai-providers";

export const maxDuration = 180;
export const POST = proLearnRoute("search", z.object({ question: z.string().trim().min(3).max(400), provider: z.enum(AI_PROVIDERS).optional(), aiMode: z.boolean().optional() }).strict(), (input, signal) => searchAnswer(input.question, signal, input.provider, input.aiMode ?? true));
