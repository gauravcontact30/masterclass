import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import { required } from "./config";
import { AUTH_USER, requestOnce } from "./request-cache";
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
/**
 * The signed-in user, or null. A brief Auth failure is not a signed-out visitor: requests racing to refresh one token get
 * a 409, and a network error or 5xx says nothing about the session. Those used to read as 401 signin_required, so one
 * retry comes first. A real answer (no session, expired or revoked) has a 4xx status and is returned at once.
 */
export async function authUser() {
  const client = await supabaseServer();
  const first = await client.auth.getUser();
  const { status } = first.error ?? {};
  if (!first.error || (status && status !== 409 && status < 500)) return first.data.user;
  await new Promise(done => setTimeout(done, 250));
  return (await client.auth.getUser()).data.user;
}
/**
 * The signed-in user's id for read-only requests about their own data: the session token's signature is verified here
 * against the project's signing keys, with no call to the Auth server. A session ended elsewhere therefore keeps reading
 * until its token expires (about an hour). Changes, payments, paid content and admin routes use currentUser/userId.
 * A token that does not verify gets the Auth server's answer, so a brief failure is not a sign-out.
 */
export async function sessionUserId() {
  const { data, error } = await (await supabaseServer()).auth.getClaims();
  if (error) return (await requestOnce(AUTH_USER, authUser))?.id ?? null;
  return typeof data?.claims?.sub === "string" ? data.claims.sub : null;
}
// Deduplicate repeated authorization reads within one server render only.
// React resets this cache for each request; users never share cached sessions.
export const currentUser = cache(async function currentUser() {
  return requestOnce(AUTH_USER, authUser);
});
