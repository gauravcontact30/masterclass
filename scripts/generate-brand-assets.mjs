// Redraws app/icon.svg, public/brand/* and public/images/brand/mcb-avatar.svg from the Master Class Buddy mark in
// lib/brand.ts. Run: node scripts/generate-brand-assets.mjs (Node 22.18+ reads the .ts file directly).
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { BRAND_PATHS as P, brandArtwork, brandSvg } from "../lib/brand.ts";

const art = brandArtwork();
writeFileSync("app/icon.svg", brandSvg());
writeFileSync("public/images/brand/mcb-avatar.svg", brandSvg());

// The lockup: the mark, "masterclass" (one lowercase word, "class" bold in terracotta), and BUDDY centred beneath it.
const logo = dark => {
  const ink = dark ? "#faf9f5" : "#1f1e1c", rule = dark ? "#5e5d59" : "#c9c6bb";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="300" viewBox="0 0 1200 300"><rect width="1200" height="300" fill="${dark ? "#141413" : "#f5f4ed"}"/><g transform="translate(70 42) scale(4.5)">${art}</g><text x="330" y="160" font-family="Segoe UI, Arial, sans-serif" font-weight="500" font-size="112" letter-spacing="-5" fill="${ink}">master<tspan font-weight="800" fill="${P.terracotta}">class</tspan></text><line x1="336" y1="212" x2="560" y2="212" stroke="${rule}" stroke-width="3"/><text x="680" y="226" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-weight="700" font-size="40" letter-spacing="17" fill="${P.terracotta}">BUDDY</text><line x1="805" y1="212" x2="1030" y2="212" stroke="${rule}" stroke-width="3"/></svg>`;
};
const icon = dark => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 48 48"><rect width="48" height="48" fill="${dark ? "#141413" : "#f5f4ed"}"/><g transform="translate(4 4) scale(.8333)">${art}</g></svg>`;

for (const dark of [false, true]) {
  const suffix = dark ? "-dark" : "";
  for (const [name, svg] of [["logo", logo(dark)], ["icon", icon(dark)]]) {
    const image = sharp(Buffer.from(svg));
    await image.clone().png().toFile(`public/brand/masterclass-${name}${suffix}.png`);
    await image.clone().jpeg({ quality: 92 }).toFile(`public/brand/masterclass-${name}${suffix}.jpg`);
  }
}
console.log("brand assets written");
