// Draws the PNG icons used by the landing page's Board Exams and Competitive Exams sections
// (components/landing-exams.tsx) into public/images/exams. The icons are this site's own artwork: a tinted tile
// with a white pictogram. They are deliberately not the boards' or the exam bodies' official emblems.
// Run: node scripts/generate-exam-icons.mjs
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import * as lucide from "lucide-react";

const SIZE = 160;
// id, pictogram, gradient from → to
const ICONS = [
  ["board-up", "Landmark", "#e98b5d", "#b4502b"], ["board-cbse", "BookOpenText", "#4f8fdc", "#1f4f96"], ["board-icse", "GraduationCap", "#3fae7a", "#1c6a45"],
  ["defence", "Shield", "#7d9a4a", "#3f5a1f"], ["banks", "Landmark", "#e0a526", "#9a6a08"], ["railways", "TrainFront", "#4f8fdc", "#1d4f86"], ["tet", "School", "#e36d8a", "#972b48"],
  ["isro", "Rocket", "#8b6fd0", "#4c3590"], ["upsc", "Building2", "#e98b5d", "#8f3f23"], ["ssc", "BriefcaseBusiness", "#2fa9b5", "#14616a"], ["state-psc", "Scale", "#b89766", "#6a5330"],
  ["jee", "Atom", "#4f8fdc", "#27408b"], ["neet", "Stethoscope", "#3fae7a", "#1f5a37"], ["gate", "Cog", "#b46bc0", "#6d2c78"], ["cat", "ChartNoAxesCombined", "#e0a526", "#8a5a05"],
  ["clat", "Gavel", "#e36d8a", "#8c2f46"], ["cuet", "University", "#2fa9b5", "#17616a"], ["ugc-net", "FlaskConical", "#8b6fd0", "#5b4388"], ["police", "Siren", "#7d9a4a", "#47602a"],
];

await mkdir("public/images/exams", { recursive: true });
for (const [id, name, from, to] of ICONS) {
  const Icon = lucide[name];
  if (!Icon) throw new Error(`lucide-react has no icon named ${name}`);
  const glyph = renderToStaticMarkup(createElement(Icon, { size: 84, color: "#ffffff", strokeWidth: 1.9, x: 38, y: 38 }));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>
      <radialGradient id="s" cx="0.25" cy="0.15" r="0.9"><stop offset="0" stop-color="#ffffff" stop-opacity="0.38"/><stop offset="0.55" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
    </defs>
    <rect x="4" y="4" width="152" height="152" rx="38" fill="url(#g)"/>
    <rect x="4" y="4" width="152" height="152" rx="38" fill="url(#s)"/>
    <rect x="5.5" y="5.5" width="149" height="149" rx="36.5" fill="none" stroke="#ffffff" stroke-opacity="0.28" stroke-width="3"/>
    <circle cx="80" cy="80" r="56" fill="#ffffff" fill-opacity="0.1"/>
    ${glyph}
  </svg>`;
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true }).toFile(`public/images/exams/${id}.png`);
  console.log("wrote", `public/images/exams/${id}.png`);
}
