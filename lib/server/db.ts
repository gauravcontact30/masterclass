import "server-only";
import { createClient } from "@supabase/supabase-js";
import { required } from "./config";
// The service-role client keeps no session, so one per server instance is safe and saves rebuilding it (and its
// auth, storage and realtime sub-clients) on every query.
const create = () => createClient(required("NEXT_PUBLIC_SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
let client: ReturnType<typeof create> | undefined;
export function db() { return client ??= create(); }
export function check<T>({ data, error }: { data: T; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data;
}
