import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      ...["/api/:path*", "/auth/:path*", "/dashboard/:path*", "/sign-in/:path*", "/sign-up/:path*", "/ui-review/:path*"].map(source => ({ source, headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] })),
    ];
  },
};

export default nextConfig;
