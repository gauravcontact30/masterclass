import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import { required } from "./config";
// Session-bound Supabase client. Reads and refreshes the auth cookies Supabase
// sets; never uses the service role, so RLS applies to anything it touches.
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(required("NEXT_PUBLIC_SUPABASE_URL"), required("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    cookies: {
      getAll: () => store.getAll(),
      // Server Components cannot set cookies; the proxy middleware refreshes them instead.
      setAll: list => { try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* read-only context */ } },
    },
  });
}
// Deduplicate repeated authorization reads within one server render only.
// React resets this cache for each request; users never share cached sessions.
export const currentUser = cache(async function currentUser() {
  const { data } = await (await supabaseServer()).auth.getUser();
  return data.user;
});
