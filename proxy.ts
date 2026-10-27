import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { redirectFor } from "@/lib/auth-routes";
import { protectWithArcjet } from "@/lib/arcjet";
import { checkRateLimit } from "@/lib/redis";
import { isUntrackedEmail, UNTRACKED_COOKIE } from "@/lib/server/tracking-exclusions";

/**
 * Next.js 16 Edge Proxy (replaces middleware.ts)
 * Handles Arcjet security, Upstash rate limiting, Supabase session refresh,
 * route guards, and edge security/performance headers.
 */
/** The same public data for every visitor, served from server-side caches: no session, no per-user state. Skipping the
 *  checks below spares each request three network round trips and lets the CDN keep the route's own Cache-Control. */
const PUBLIC_DATA = new Set(["/api/landing/news", "/api/landing/library"]);

export default async function proxy(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;
  if (PUBLIC_DATA.has(pathname) && request.method === "GET") return NextResponse.next();
  // Vercel Cron jobs carry the cron secret, which each /api/cron route checks itself (lib/server/visit-retention.ts).
  // Bot detection and the per-IP API budget are for visitors: the cron user agent was refused as a bot.
  if (pathname.startsWith("/api/cron/") && request.headers.has("authorization")) return NextResponse.next({ headers: { "Cache-Control": "no-store" } });

  // 1. Arcjet Bot Detection & Security Shield
  // These remote checks are independent; authorization still follows both decisions.
  const needsRateLimit = pathname.startsWith("/api/") && pathname !== "/api/track";
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const [arcjetCheck, rl] = await Promise.all([
    protectWithArcjet(request),
    needsRateLimit ? checkRateLimit(clientIp, 60, 60) : Promise.resolve(null),
  ]);
  if (!arcjetCheck.allowed) {
    return NextResponse.json(
      { error: "ACCESS_DENIED", message: arcjetCheck.reason },
      { status: arcjetCheck.status || 403 }
    );
  }

  // 2. Upstash Redis Rate Limiting on API endpoints
  // The page-view beacon has its own limiter (app/api/track/route.ts) and must not spend the API budget.
  if (rl) {
    if (!rl.success) {
      return NextResponse.json(
        { error: "RATE_LIMIT_EXCEEDED", message: "Too many requests. Please try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
  }

  // 3. Super Admin Route Protection Check
  if (pathname.startsWith("/super-admin")) {
    const hasSessionCookie = request.cookies.getAll().some(
      (c) => c.name.includes("auth-token") || c.name.startsWith("sb-")
    );
    if (process.env.SUPABASE_URL && !hasSessionCookie) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // 4. Supabase Session Management & Auth Redirection
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let response = NextResponse.next({ request });

  if (url && key) {
    const hasAuthCookie = request.cookies.getAll().some(({ name }) => /^sb-.+-auth-token(?:\.\d+)?$/.test(name));
    // No cookie means there is no SSR session to refresh. Avoid a remote auth
    // lookup for anonymous page/API visits, while retaining dashboard guards.
    if (!hasAuthCookie) {
      const target = redirectFor({ pathname, signedIn: false });
      if (target) {
        const redirected = NextResponse.redirect(new URL(target, request.url));
        redirected.headers.set("Cache-Control", "private, no-store");
        return redirected;
      }
    } else {
      const supabase = createServerClient(url, key, {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (list) => {
            list.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          },
        },
      });

      // Verify the signed JWT here; protected pages/APIs still fetch the current
      // user and enforce roles/subscriptions in their server authorization layer.
      const { data, error } = await supabase.auth.getClaims();
      const claims = error ? undefined : data?.claims;
      if (isUntrackedEmail(typeof claims?.email === "string" ? claims.email : undefined)) {
        request.cookies.set(UNTRACKED_COOKIE, "1");
        const refreshedCookies = response.cookies.getAll();
        response = NextResponse.next({ request });
        refreshedCookies.forEach(cookie => response.cookies.set(cookie));
        response.cookies.set(UNTRACKED_COOKIE, "1", {
          httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:",
          path: "/", maxAge: 365 * 86400,
        });
        response.cookies.delete("mc_vid");
        response.cookies.delete("mc_sid");
      }
      const target = redirectFor({ pathname, signedIn: Boolean(claims?.sub) });
      if (target) {
        const redirected = NextResponse.redirect(new URL(target, request.url));
        response.cookies.getAll().forEach((cookie) => redirected.cookies.set(cookie));
        redirected.headers.set("Cache-Control", "private, no-store");
        return redirected;
      }
    }
  }

  // 5. Attach Next.js Edge Security and Performance Headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  const duration = Date.now() - startTime;
  response.headers.set("Server-Timing", `edge;dur=${duration}`);
  // Signed-in visitors were redirected away from "/" above, so the landing page is the same prerendered page for
  // everyone who reaches it: leave its caching to Next.js so the CDN, the back/forward cache and crawlers get it fast.
  // Dashboard, auth and API responses are per-user and stay uncached.
  if (pathname !== "/") response.headers.set("Cache-Control", "private, no-store");

  return response;
}

export const config = {
  matcher: [
    "/",
    "/learning/:path*",
    "/super-admin/:path*",
    "/sign-in/:path*",
    "/sign-up/:path*",
    "/api/:path*",
  ],
};
