import { ImageResponse } from "next/og";
import { OgCard } from "@/components/og-card";
import { siteUrl } from "@/lib/seo";

export const alt = "MCB - Tech Buzz: five new technology blogs every week, published Monday at 00:00 AM IST, rated by developers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The Tech Buzz link preview (components/og-card.tsx). */
export default function Image() {
  return new ImageResponse(<OgCard
    eyebrow="MCB - Tech Buzz"
    title="Five fresh technology blogs every week"
    subtitle="Agentic AI, System Design, AWS & DevOps, Kubernetes & Docker and Next.js & React, rated, liked and clapped by developers."
    chips={["This week's 5", "Star rated", "Most liked", "n8n workflows", "Fresh & latest"]}
    footer={`${siteUrl().host}/tech-buzz`}
  />, size);
}
