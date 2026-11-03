import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { HOME_OG_TECHNOLOGIES, HOME_OG_WALL, HomeOgCard } from "@/components/og-card";
import { siteName, siteUrl } from "@/lib/seo";

export const alt = `${siteName}: from AI agents to production. Courses, interview prep and weekly Tech Buzz stories across ${HOME_OG_TECHNOLOGIES.map(tech => tech.name).join(", ")}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The site's link preview: the pitch beside a wall of every technology's logo (components/og-card.tsx). */
export default async function Image() {
  // The same 64×64 logos the landing page's subject ribbon shows, inlined as data URIs for Satori.
  const wall = await Promise.all(HOME_OG_WALL.map(column => Promise.all(column.map(async tech => ({
    name: tech.name,
    logo: `data:image/png;base64,${(await readFile(join(process.cwd(), "public/images/tech", `${tech.icon}.png`))).toString("base64")}`,
  })))));
  // Latin cuts of the site's Inter (lib/fonts): next/og's built-in font has one weight, which flattened the card.
  const [medium, heavy] = await Promise.all([500, 800].map(weight => readFile(join(process.cwd(), "lib/fonts", `inter-og-${weight}.ttf`))));
  return new ImageResponse(<HomeOgCard wall={wall} footer={siteUrl().host.replace(/^www\./, "")} />, {
    ...size,
    fonts: [{ name: "Inter", data: medium, weight: 500, style: "normal" }, { name: "Inter", data: heavy, weight: 800, style: "normal" }],
  });
}
