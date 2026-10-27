import { ImageResponse } from "next/og";
import { HOME_OG_TECHNOLOGIES, HomeOgCard } from "@/components/og-card";
import { siteName, siteUrl } from "@/lib/seo";

export const alt = `${siteName}: learn ${HOME_OG_TECHNOLOGIES.join(", ")}, with daily Tech Buzz blogs, system design and interview prep`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The site's link preview: the current logo and the headline technologies, set large (components/og-card.tsx). */
export default function Image() {
  return new ImageResponse(<HomeOgCard
    headline="Master Agentic AI & the modern web stack"
    technologies={HOME_OG_TECHNOLOGIES}
    footer={siteUrl().host}
  />, size);
}
