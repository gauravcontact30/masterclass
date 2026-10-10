import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  serverExternalPackages: ["@electric-sql/pglite"],
  // AVIF first (smallest), WebP as the fallback, for every next/image.
  images: { formats: ["image/avif", "image/webp"], minimumCacheTTL: 60 * 60 * 24 * 30 },
  experimental: {
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
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
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
