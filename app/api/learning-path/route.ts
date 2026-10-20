import { api, jsonBody, sameOrigin } from "@/lib/server/http";
import { limitAiFeature } from "@/lib/server/ai-limits";
import { buildLearningPath } from "@/lib/server/learning-path";
import { pathRequestSchema } from "@/lib/learning-path";

export const maxDuration = 60;

/** The landing page's path finder and the sign-up plan preview: a goal in, a week-by-week path through the catalog out. */
export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const input = pathRequestSchema.parse(await jsonBody(request, 4000));
    await limitAiFeature(request, "learning-path", { user: [20, 3600], visitor: [6, 3600], budget: [150, 3600] });
    return Response.json(await buildLearningPath(input, request.signal));
  }, request);
}
