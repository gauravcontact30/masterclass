import { z } from "zod";
import { api, HttpError, jsonBody, sameOrigin } from "@/lib/server/http";
import { currentUser } from "@/lib/server/auth";
import { rateLimit } from "@/lib/server/rate-limit";
import { compileAndRun } from "@/lib/server/compiler";
import { COMPILER_LIMITS } from "@/lib/compiler";

/** POST { language, standard, files, stdin }: compiles and runs a Java or C++ program in a Vercel Sandbox. */
export const maxDuration = 120;

const bodySchema = z.object({
  language: z.enum(["java", "cpp"]),
  standard: z.string().max(10),
  files: z.array(z.object({ name: z.string().max(80), code: z.string().max(COMPILER_LIMITS.fileBytes) })).min(1).max(COMPILER_LIMITS.files),
  stdin: z.string().max(COMPILER_LIMITS.stdinBytes).default(""),
});

export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const user = await currentUser();
    if (!user) throw new HttpError(401, "signin_required");
    // Each run boots a microVM: a burst limit per minute and a daily budget per learner.
    await rateLimit(`compiler:${user.id}`, 10, 60);
    await rateLimit(`compiler-day:${user.id}`, 300, 86_400);
    const body = bodySchema.parse(await jsonBody(request, COMPILER_LIMITS.totalBytes + COMPILER_LIMITS.stdinBytes + 20_000));
    return Response.json(await compileAndRun(body), { headers: { "Cache-Control": "no-store" } });
  }, request);
}
