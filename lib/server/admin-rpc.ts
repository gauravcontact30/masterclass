import "server-only";
import { db } from "./db";
import { HttpError } from "./http";

/** A database object that does not exist yet means its migration has not been applied, not that the call failed. */
const missing = (error: { code?: string; message: string }) => error.code === "PGRST202" || error.code === "42P01" || error.code === "42883" || error.code === "PGRST205" || /could not find the (function|table)/i.test(error.message);

/** Raise a known database exception (e.g. `not_found`) as the matching HTTP error, and a missing migration as 503 `migration_required`. */
export function adminError(error: { code?: string; message: string }, known: Record<string, number> = {}): never {
  if (missing(error)) throw new HttpError(503, "migration_required");
  const code = Object.keys(known).find(key => error.message.includes(key));
  if (code) throw new HttpError(known[code], code);
  throw new Error(error.message);
}

/** Call a service-role-only admin function. */
export async function adminRpc<T>(name: string, args: Record<string, unknown> = {}, known?: Record<string, number>): Promise<T> {
  const { data, error } = await db().rpc(name, args);
  if (error) adminError(error, known);
  return data as T;
}
