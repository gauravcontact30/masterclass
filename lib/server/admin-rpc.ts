import "server-only";
import { db } from "./db";
import { HttpError } from "./http";

/**
 * The admin database functions raise named exceptions (`raise exception
 * 'insufficient_credits'`). Each name maps to the HTTP status a caller should
 * see, so the dashboard can say exactly what went wrong.
 */
const RAISED: Record<string, number> = {
  not_found: 404,
  invalid_delta: 400,
  insufficient_credits: 409,
  not_failed: 409,
  duplicate_active: 409,
};

/** Call an admin function with the service role, translating its failures. */
export async function adminRpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await db().rpc(name, args);
  if (error) {
    const raised = Object.keys(RAISED).find(code => error.message.includes(code));
    if (raised) throw new HttpError(RAISED[raised], raised);
    // PostgREST's wording when the function (or a table it reads) is not in the database yet.
    if (/could not find the function|does not exist|schema cache/i.test(error.message)) throw new HttpError(503, "migration_required");
    throw new Error(error.message);
  }
  return data as T;
}
