import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { CALLBACK_PATH, GOOGLE_COOKIE, exchangeCode, sameToken, signInWithGoogleProfile } from "@/lib/server/google-auth";
import { isSafeRedirect } from "@/lib/safe-redirect";

// Google returns here (the redirect URI registered on the OAuth client). Check the state against the cookie set by
// app/api/auth/google, trade the code for a verified Google identity, and sign that account in with Supabase cookies.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const store = await cookies();
  const raw = store.get(GOOGLE_COOKIE)?.value;
  store.delete({ name: GOOGLE_COOKIE, path: CALLBACK_PATH });
  const fail = (reason: string) => {
    console.warn("google sign-in failed:", reason);
    const response = NextResponse.redirect(new URL("/sign-in?error=oauth_failed", request.url));
    response.headers.set("Cache-Control", "no-store");
    return response;
  };
  let flow: { state?: string; verifier?: string; nonce?: string; next?: string | null } = {};
  try { flow = raw ? JSON.parse(raw) : {}; } catch { /* treated as missing below */ }
  // Cancelled consent (error=access_denied) and any other refusal from Google.
  if (params.get("error")) return fail(`google_${params.get("error")}`);
  const code = params.get("code");
  if (!code || !flow.verifier || !flow.nonce || !sameToken(params.get("state"), flow.state)) return fail("state_mismatch");
  try {
    const google = await exchangeCode({ code, verifier: flow.verifier, nonce: flow.nonce, redirectUri: `${request.nextUrl.origin}${CALLBACK_PATH}` });
    const { created } = await signInWithGoogleProfile(google);
    const target = isSafeRedirect(flow.next) ? flow.next : `/learning?notice=${created ? "created" : "signed_in"}`;
    const response = NextResponse.redirect(new URL(target, request.url));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return fail(error instanceof Error ? error.message : "unknown");
  }
}
