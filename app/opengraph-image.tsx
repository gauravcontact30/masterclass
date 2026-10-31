import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { HOME_OG_TECHNOLOGIES, HomeOgCard } from "@/components/og-card";
import { siteName, siteUrl } from "@/lib/seo";

export const alt = `${siteName}: learn ${HOME_OG_TECHNOLOGIES.map(tech => tech.name).join(", ")}, with daily Tech Buzz blogs and interview prep`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The site's link preview: the logo and the headline technologies as logo tiles (components/og-card.tsx). */
export default async function Image() {
  // The same 64×64 logos the landing page's subject ribbon shows, inlined as data URIs for Satori.
  const technologies = await Promise.all(HOME_OG_TECHNOLOGIES.map(async tech => ({
    name: tech.name,
    logo: `data:image/png;base64,${(await readFile(join(process.cwd(), "public/images/tech", `${tech.icon}.png`))).toString("base64")}`,
  })));
  return new ImageResponse(<HomeOgCard
    headline="Master Agentic AI & the modern web stack"
    technologies={technologies}
    footer={siteUrl().host}
  />, size);
}
