import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/server/auth";
// Target of the confirmation link Supabase emails on sign-up. Exchanging the
// code here is what actually sets the session cookies.
export async function GET(request: NextRequest) {
  const code = new URL(request.url).searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/sign-in", request.url));
  const { error } = await (await supabaseServer()).auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL(error ? "/sign-in" : "/dashboard", request.url));
}
