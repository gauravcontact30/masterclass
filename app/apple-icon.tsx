import { ImageResponse } from "next/og";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
// The app/icon.svg mark, redrawn opaque because iOS home screens ignore transparency.
export default function AppleIcon() {
  return new ImageResponse(<div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: "#234b3a" }}>
    <svg width="132" height="132" viewBox="0 0 48 48" fill="none"><g stroke="#f6f6ef" strokeWidth="1.7" strokeLinejoin="round"><path d="M7 14c6-1 12 2 17 6 5-4 11-7 17-6v23c-6-1-12 1-17 5-5-4-11-6-17-5Z"/><path d="M12 10c4 1 8 4 12 8 4-4 8-7 12-8v23c-4 1-8 4-12 8-4-4-8-7-12-8ZM24 19v22"/></g><path d="m24 2 1.5 4L30 8l-4.5 1.5L24 14l-1.5-4.5L18 8l4.5-2Z" fill="#d6b86b"/></svg>
  </div>, size);
}
