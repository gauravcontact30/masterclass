import "server-only";
import type { z } from "zod";
import { authConfigured } from "./config";
import { api, HttpError, jsonBody, sameOrigin, userId } from "./http";
import { limitProLearn } from "./pro-learn-ai";

/** Shared POST handler: same-origin, signed-in when auth exists, validated body, rate limited. */
export function proLearnRoute<T>(feature: string, schema: z.ZodType<T>, handle: (input: T, signal: AbortSignal) => Promise<unknown>, maxBody = 20000) {
  return (request: Request) => api(async () => {
    sameOrigin(request);
    if (authConfigured()) await userId();
    const input = schema.parse(await jsonBody(request, maxBody));
    await limitProLearn(request, feature);
    const signal=AbortSignal.any([request.signal, AbortSignal.timeout(165000)]);
    try { return Response.json(await handle(input, signal)); }
    catch(error) {
      if(signal.aborted && signal.reason?.name==='TimeoutError') throw new HttpError(504,'reference_timeout');
      throw error;
    }
  }, request);
}
