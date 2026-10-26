import { ImageResponse } from "next/og";
import { OgCard } from "@/components/og-card";
import { siteName, siteUrl } from "@/lib/seo";

export const alt = `${siteName}: learn Agentic AI, System Design, Cloud and Next.js with interview prep and daily Tech Buzz blogs`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The site's link preview: what Master Class Buddy is for, in a clean white card (components/og-card.tsx). */
export default function Image() {
  return new ImageResponse(<OgCard
    eyebrow="Learn · Practise · Get hired"
    title="Your buddy for mastering modern tech, from first lesson to next job"
    subtitle="Guided learning paths, interview questions with answers, workflow blueprints and five fresh Tech Buzz blogs every morning."
    chips={["Agentic AI", "System Design", "AWS & DevOps", "Next.js & React", "Interview prep"]}
    footer={siteUrl().host}
  />, size);
}
