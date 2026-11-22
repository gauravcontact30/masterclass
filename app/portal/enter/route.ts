import { NextResponse, type NextRequest } from "next/server";
import { authUser } from "@/lib/server/auth";
import { enterPortal, startExamsSession } from "@/lib/server/portal";
import { isSafeRedirect } from "@/lib/safe-redirect";
import { PORTALS, isExamPortal, isPortal, type Portal } from "@/lib/portal";

// Emailed links (/auth/callback) and Google sign-in return here when they were started from a portal's own sign-in
// or sign-up page: the session cookies are set by then, so this opens the portal and goes on to the page asked for.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const asked = params.get("portal");
  // "exams" is the pre-split name, still in links emailed before 2026-11-22: it opens Board Scholars.
  const portal: Portal = asked === "exams" ? "boards" : isPortal(asked) ? asked : "tech";
  const intent = params.get("intent") === "signup" ? "signup" : "signin";
  const next = params.get("next");
  const to = (path: string) => { const response = NextResponse.redirect(new URL(path, request.url)); response.headers.set("Cache-Control", "private, no-store"); return response; };
  const user = await authUser();
  if (!user) return to(PORTALS[portal].signIn);
  const entered = await enterPortal(user, portal, intent);
  if (!entered.ok && entered.reason === "region_unavailable") return to("/");
  if (!entered.ok) return to(`${entered.reason === "no_portal_account" ? PORTALS[portal].signUp : PORTALS[portal].signIn}?error=${entered.reason}`);
  if (isExamPortal(portal)) await startExamsSession(user.id);
  return to(isSafeRedirect(next) && !next.startsWith("/portal") ? next : PORTALS[portal].home);
}
