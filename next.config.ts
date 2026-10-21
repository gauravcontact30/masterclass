import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components: `use cache` + cacheLife/cacheTag and Partial Prerendering. Each route ships a static shell at
  // once and streams its request-time parts (the signed-in user, live data) inside Suspense.
  cacheComponents: true,
  poweredByHeader: false,
  // Dev only: phones and tablets open the dev server by this machine's LAN address (e.g. http://192.168.1.20:3000).
  // Without this, Next.js blocks that origin's /_next assets and HMR socket, the page never hydrates, and buttons
  // such as "Sign in" do nothing. Private ranges only; production ignores this setting.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", ...Array.from({ length: 16 }, (_, i) => `172.${16 + i}.*.*`), "*.local"],
  compress: true,
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  serverExternalPackages: ["@electric-sql/pglite"],
  // Official learning cards are read from disk at request time (lib/server/official-content.ts).
  outputFileTracingIncludes: Object.fromEntries(["/dashboard/search", "/api/pro-learn/handbook", "/api/pro-learn/api-detail"].map(route => [route, ["./content/official/**/*.json"]])),
  // AVIF first (smallest), WebP as the fallback, for every next/image.
  images: { formats: ["image/avif", "image/webp"], qualities: [75, 85], minimumCacheTTL: 60 * 60 * 24 * 30 },
  experimental: {
    // Group CSS per route by cost instead of merging stylesheets app-wide: the default merged the dashboard's and
    // Super Admin's styles into chunks the landing page had to download before first paint. Graph mode is
    // Turbopack-only, so webpack (`next dev --webpack`) and next/jest keep the default.
    cssChunking: process.env.TURBOPACK ? "graph" : true,
    optimizePackageImports: [
      "lucide-react",
      "@upstash/redis",
      "@upstash/ratelimit",
      "inngest",
      "cmdk",
      "@conform-to/react",
      "@conform-to/zod",
      "zod",
      "sonner",
      "class-variance-authority",
      "@base-ui/react",
      "simple-icons",
    ],
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // HTTPS only, for two years, on every subdomain (browsers ignore this header on plain-http localhost).
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          // Pages opened from here (or that open this site) cannot reach back into its window. "allow-popups" keeps
          // OAuth sign-in and the Razorpay checkout, which open popups that report back, working.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
      ...["/api/:path*", "/auth/:path*", "/dashboard/:path*", "/sign-in/:path*", "/sign-up/:path*"].map(source => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      })),
      // public/images files are not content-hashed, so cache for a month rather than forever.
      { source: "/images/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }] },
      // /_next/static is content-hashed and Next.js already serves it immutable; overriding it only triggers a build warning.
    ];
  },
};

export default nextConfig;
