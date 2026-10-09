/**
 * Jest Mock for @t3-oss/env-nextjs
 * Provides runtime validation using Zod schemas during tests in CommonJS Jest environment.
 */
type SchemaLike = { safeParse?: (val: unknown) => { success: boolean; data?: unknown } };

export function createEnv(opts: {
  runtimeEnv?: Record<string, string | undefined>;
  skipValidation?: boolean;
  server?: Record<string, SchemaLike>;
  client?: Record<string, SchemaLike>;
  shared?: Record<string, SchemaLike>;
}) {
  const runtime = opts.runtimeEnv || process.env;
  if (opts.skipValidation) {
    return { ...runtime };
  }

  const result: Record<string, unknown> = { ...runtime };
  const allSchemas: Record<string, SchemaLike> = { ...(opts.server || {}), ...(opts.client || {}), ...(opts.shared || {}) };

  for (const [key, schema] of Object.entries(allSchemas)) {
    if (schema && typeof schema.safeParse === "function") {
      const parsed = schema.safeParse(runtime[key]);
      if (parsed.success) {
        result[key] = parsed.data;
      }
    }
  }

  return result;
}
