import { ImageResponse } from "next/og";
export const alt = "MasterClass — Technology and AI learning guides in English and Hindi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(<div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", padding: 72, background: "#f3f5eb", color: "#203e2d", fontFamily: "sans-serif" }}>
    <div style={{ display: "flex", fontSize: 32 }}>MasterClass</div>
    <div style={{ display: "flex", fontSize: 72, fontWeight: 700, maxWidth: 950 }}>Your next skill starts with one clear step.</div>
    <div style={{ display: "flex", fontSize: 28 }}>Technology & AI · English & Hindi · In-app study notes</div>
  </div>, size);
}
