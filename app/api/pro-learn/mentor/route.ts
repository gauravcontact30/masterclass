import { z } from "zod";
import { PRO_LEVELS } from "@/lib/pro-learn/types";
import { mentorReply } from "@/lib/server/pro-learn-ai";
import { proLearnRoute } from "@/lib/server/pro-learn-route";
import { AI_PROVIDERS } from "@/lib/server/ai-providers";
import { studyChatSchema } from "@/lib/study-chat";

export const maxDuration = 180;
const schema = z.object({ trackId: z.string().max(40), level: z.enum(PRO_LEVELS), goal: z.string().trim().max(200).default(""), messages: studyChatSchema.shape.messages, provider: z.enum(AI_PROVIDERS).optional() }).strict();
export const POST = proLearnRoute("mentor", schema, (input, signal) => mentorReply(input.trackId, input.level, input.goal, input.messages, signal, input.provider), 100000);
