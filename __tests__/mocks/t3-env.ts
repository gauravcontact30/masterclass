/**
 * Jest Mock for @t3-oss/env-nextjs
 * Provides runtime validation using Zod schemas during tests in CommonJS Jest environment.
 */
export function createEnv(opts: any) {
  const runtime = opts.runtimeEnv || process.env;
  if (opts.skipValidation) {
    return { ...runtime };
  }

  const result: Record<string, any> = { ...runtime };
  const allSchemas = { ...(opts.server || {}), ...(opts.client || {}), ...(opts.shared || {}) };

  for (const [key, schema] of Object.entries<any>(allSchemas)) {
    if (schema && typeof schema.safeParse === "function") {
      const parsed = schema.safeParse(runtime[key]);
      if (parsed.success) {
        result[key] = parsed.data;
      }
    }
  }

  return result;
}
