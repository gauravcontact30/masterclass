import { NextResponse, type NextRequest } from "next/server";
import { CALLBACK_PATH, GOOGLE_COOKIE, googleClient, pkceChallenge, randomToken } from "@/lib/server/google-auth";
import { isSafeRedirect } from "@/lib/safe-redirect";

// "Sign in / up with Google" (components/auth-page.tsx) starts here: remember a CSRF state, PKCE verifier, nonce and the
// page to return to in a short-lived httpOnly cookie, then send the browser to Google's consent screen.
export async function GET(request: NextRequest) {
  const client = googleClient();
  if (!client) return NextResponse.redirect(new URL("/sign-in?error=oauth_unavailable", request.url));
  const next = request.nextUrl.searchParams.get("next");
  const flow = { state: randomToken(), verifier: randomToken(), nonce: randomToken(), next: isSafeRedirect(next) ? next : null };
  const google = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  google.search = new URLSearchParams({
    client_id: client.id, redirect_uri: `${request.nextUrl.origin}${CALLBACK_PATH}`, response_type: "code", scope: "openid email profile",
    state: flow.state, nonce: flow.nonce, code_challenge: pkceChallenge(flow.verifier), code_challenge_method: "S256", prompt: "select_account",
  }).toString();
  const response = NextResponse.redirect(google);
  response.headers.set("Cache-Control", "no-store");
  // SameSite=Lax: the cookie must come back on Google's top-level redirect to the callback.
  response.cookies.set(GOOGLE_COOKIE, JSON.stringify(flow), { httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", path: CALLBACK_PATH, maxAge: 600 });
  return response;
}
