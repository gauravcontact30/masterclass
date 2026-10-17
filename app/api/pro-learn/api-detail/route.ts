import { z } from "zod";
import { apiDetail } from "@/lib/server/pro-learn-ai";
import { proLearnRoute } from "@/lib/server/pro-learn-route";
import { AI_PROVIDERS } from "@/lib/server/ai-providers";

export const maxDuration = 180;
export const POST = proLearnRoute("api-detail", z.object({ packageId: z.string().min(1).max(60), name: z.string().min(1).max(120), provider: z.enum(AI_PROVIDERS).optional() }).strict(), (input, signal) => apiDetail(input.packageId, input.name, signal, input.provider));
