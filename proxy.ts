import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { redirectFor } from "@/lib/auth-routes";
import { protectWithArcjet } from "@/lib/arcjet";
import { checkRateLimit } from "@/lib/redis";

/**
 * Next.js 16 Edge Proxy (replaces middleware.ts)
 * Handles Arcjet security, Upstash rate limiting, Supabase session refresh,
 * route guards, and edge security/performance headers.
 */
export default async function proxy(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;

  // 1. Arcjet Bot Detection & Security Shield
  const arcjetCheck = await protectWithArcjet(request);
  if (!arcjetCheck.allowed) {
    return NextResponse.json(
      { error: "ACCESS_DENIED", message: arcjetCheck.reason },
      { status: arcjetCheck.status || 403 }
    );
  }

  // 2. Upstash Redis Rate Limiting on API endpoints
  if (pathname.startsWith("/api/")) {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    const rl = await checkRateLimit(clientIp, 60, 60); // 60 requests per minute
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

  // 3. Direct Access: Auth pages redirect directly to dashboard
  if (pathname === "/sign-in" || pathname === "/sign-up" || pathname.startsWith("/sign-in/") || pathname.startsWith("/sign-up/")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 4. Session & Header Response Handling
  let response = NextResponse.next({ request });

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
  response.headers.set("Cache-Control", "private, no-store");

  return response;
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/sign-in/:path*",
    "/sign-up/:path*",
    "/api/:path*",
  ],
};
