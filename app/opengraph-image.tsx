import { ImageResponse } from "next/og";
import { siteName } from "@/lib/seo";
export const alt = `${siteName} — School, exam and technology learning in English and Hindi`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(<div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", padding: 72, background: "#f5f4ed", color: "#262624", fontFamily: "sans-serif" }}>
    <div style={{ display: "flex", fontSize: 32, color: "#c6613f" }}>{siteName}</div>
    <div style={{ display: "flex", fontSize: 72, fontWeight: 700, maxWidth: 1000, lineHeight: 1.1 }}>Your next skill starts with one clear step.</div>
    <div style={{ display: "flex", fontSize: 28, color: "#5e5d59" }}>School · Competitive exams · Technology & system design · English & Hindi</div>
  </div>, size);
}
