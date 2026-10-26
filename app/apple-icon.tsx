import { ImageResponse } from "next/og";
import { BRAND_PATHS as P } from "@/lib/brand";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
// The Master Class Buddy mark (lib/brand.ts) on an opaque cream ground, because iOS home screens ignore transparency.
export default function AppleIcon() {
  return new ImageResponse(<div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: "#f5f4ed" }}>
    <svg width="150" height="150" viewBox="0 0 48 48" fill="none">
      <path d={P.back} fill={P.terracotta} />
      <path d={P.front} fill={P.ink} />
      <path d={P.pageLeft} fill={P.paper} />
      <path d={P.pageRight} fill={P.gold} />
      <circle cx={P.head.cx} cy={P.head.cy} r={P.head.r} fill={P.terracotta} />
      <path d={P.star} fill={P.gold} />
    </svg>
  </div>, size);
}
