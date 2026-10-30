import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/server/auth";
import { isSafeRedirect } from "@/lib/safe-redirect";
// Target of the PKCE links Supabase emails (confirmation with the default template, magic sign-in links, password
// resets). Exchanging the code here sets the session cookies. It only works in the browser that started the flow;
// app/auth/confirm handles the cross-device token-hash links. Google sign-in has its own callback, app/api/auth/callback/google.
export async function GET(request: NextRequest) {
  const params = new URL(request.url).searchParams;
  // Supabase sends expired or reused links back here with an error instead of a code.
  const failed = params.get("error_code") ?? params.get("error");
  if (failed) return NextResponse.redirect(new URL(`/sign-in?error=${failed === "otp_expired" ? "link_expired" : "link_invalid"}`, request.url));
  const code = params.get("code");
  if (!code) return NextResponse.redirect(new URL("/sign-in", request.url));
  const { data, error } = await (await supabaseServer()).auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/sign-in?error=link_other_device", request.url));
  // A first sign-in right after confirming is "verified"; a magic link is a plain sign-in.
  const confirmedAt = data.user?.email_confirmed_at ? Date.parse(data.user.email_confirmed_at) : 0;
  const notice = Date.now() - confirmedAt < 10 * 60_000 ? "verified" : "signed_in";
  const next = params.get("next") || params.get("redirect");
  const target = isSafeRedirect(next) ? next : `/learning?notice=${notice}`;
  return NextResponse.redirect(new URL(target, request.url));
}
