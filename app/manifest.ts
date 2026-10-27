import type { MetadataRoute } from "next";
import { siteDescription, siteName } from "@/lib/seo";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteName} — Learn in App`,
    short_name: siteName,
    description: siteDescription,
    start_url: "/learning",
    scope: "/",
    display: "standalone",
    background_color: "#f5f4ed",
    theme_color: "#f5f4ed",
    lang: "en-IN",
    categories: ["education"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
      { src: "/brand/masterclass-mark-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/masterclass-mark-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
