import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/server/auth";
import { isSafeRedirect } from "@/lib/safe-redirect";

/*
 * Target of the confirmation email (Supabase template "Confirm signup":
 * {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email). Verifying the token hash on the server works
 * on any device, unlike the PKCE code in /auth/callback, which only works in the browser that signed up.
 * Success signs the learner in and lands on the dashboard with a "verified" notice; failure explains itself on
 * the sign-in page.
 */
const TYPES: EmailOtpType[] = ["email", "signup", "magiclink", "recovery", "invite", "email_change"];

export async function GET(request: NextRequest) {
  const params = new URL(request.url).searchParams;
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  if (!tokenHash || !/^[\w-]{10,200}$/.test(tokenHash) || !type || !TYPES.includes(type)) return NextResponse.redirect(new URL("/sign-in?error=link_invalid", request.url));
  const { data, error } = await (await supabaseServer()).auth.verifyOtp({ token_hash: tokenHash, type });
  // A dead reset link reopens the "Reset your password" form, so the reader can ask for a fresh one straight away.
  if (error || !data.session) return NextResponse.redirect(new URL(`/sign-in?error=${type === "recovery" ? "reset_expired" : error?.code === "otp_expired" ? "link_expired" : "link_invalid"}`, request.url));
  const notice = type === "recovery" ? "recovery" : type === "magiclink" ? "signed_in" : "verified";
  const next = params.get("next") || params.get("redirect");
  const fallback = type === "recovery" ? "/reset-password" : `/learning?notice=${notice}`;
  const target = isSafeRedirect(next) ? next : fallback;
  return NextResponse.redirect(new URL(target, request.url));
}
