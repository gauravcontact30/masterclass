import { z } from "zod";
import { stepByStepAnswer } from "@/lib/server/step-by-step-ai";
import { proLearnRoute } from "@/lib/server/pro-learn-route";
import { AI_PROVIDERS } from "@/lib/server/ai-providers";
import { stepSearchOptionsSchema } from "@/lib/step-by-step/types";

export const maxDuration = 180;
export const POST = proLearnRoute("step-by-step", z.object({
  question: z.string().trim().min(3),
  options: stepSearchOptionsSchema.default({}),
  provider: z.enum(AI_PROVIDERS).optional(),
  aiMode: z.boolean().optional(),
}).strict(), (input, signal) => stepByStepAnswer(input.question, input.options, signal, input.provider, input.aiMode ?? true));
