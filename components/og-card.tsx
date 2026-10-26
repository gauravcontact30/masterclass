import { BRAND_PATHS as P } from "@/lib/brand";

/**
 * The one Open Graph card layout (1200×630, rendered by next/og): a clean white page with the Master Class Buddy
 * lockup, a large headline saying what the page is for, one supporting line, topic chips and a footer bar. Used by
 * app/opengraph-image.tsx and the Tech Buzz cards. Satori rules apply: every element with more than one child is
 * display:flex, and only inline styles.
 */
export type OgCardProps = { eyebrow: string; title: string; subtitle: string; chips: string[]; footer: string; accent?: string };

const INK = "#1f1e1c", SOFT = "#5e5d59", RULE = "#ece9df";

function Mark({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path d={P.back} fill={P.terracotta} />
    <path d={P.front} fill={P.ink} />
    <path d={P.pageLeft} fill={P.paper} />
    <path d={P.pageRight} fill={P.gold} />
    <circle cx={P.head.cx} cy={P.head.cy} r={P.head.r} fill={P.terracotta} />
    <path d={P.star} fill={P.gold} />
  </svg>;
}

export function OgCard({ eyebrow, title, subtitle, chips, footer, accent = P.terracotta }: OgCardProps) {
  // Long article titles step down so they always fit in three lines.
  const titleSize = title.length > 90 ? 48 : title.length > 60 ? 56 : 66;
  return <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#ffffff", position: "relative", fontFamily: "system-ui, sans-serif", color: INK }}>
    {/* Soft warm light in two corners and a faint dot grid keep the white page from feeling empty. */}
    <div style={{ position: "absolute", top: -220, right: -160, width: 620, height: 620, borderRadius: 620, background: "radial-gradient(circle, rgba(217,119,87,0.16) 0%, rgba(217,119,87,0) 70%)", display: "flex" }} />
    <div style={{ position: "absolute", bottom: -260, left: -200, width: 640, height: 640, borderRadius: 640, background: "radial-gradient(circle, rgba(242,184,75,0.14) 0%, rgba(242,184,75,0) 70%)", display: "flex" }} />
    <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(31,30,28,0.07) 1.5px, transparent 1.5px)", backgroundSize: "28px 28px", display: "flex" }} />
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 10, background: `linear-gradient(90deg, ${P.terracotta}, ${P.gold})`, display: "flex" }} />

    <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "58px 72px 0", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <Mark size={78} />
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 18 }}>
            <div style={{ display: "flex", fontSize: 40, lineHeight: 1, letterSpacing: -1.5 }}>
              <span style={{ fontWeight: 500, color: INK }}>master</span>
              <span style={{ fontWeight: 800, color: P.terracotta }}>class</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", marginTop: 8 }}>
              <div style={{ width: 34, height: 2, background: "#d6d2c6", display: "flex" }} />
              <span style={{ margin: "0 10px", fontSize: 15, fontWeight: 700, letterSpacing: 7, color: P.terracotta }}>BUDDY</span>
              <div style={{ width: 34, height: 2, background: "#d6d2c6", display: "flex" }} />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", padding: "10px 20px", borderRadius: 999, border: `2px solid ${accent}`, color: accent, fontSize: 20, fontWeight: 700, background: "#ffffff" }}>{eyebrow}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", marginTop: 46, maxWidth: 1040 }}>
        <div style={{ display: "flex", fontSize: titleSize, fontWeight: 800, lineHeight: 1.08, letterSpacing: -2, color: INK }}>{title}</div>
        <div style={{ display: "flex", marginTop: 22, fontSize: 27, lineHeight: 1.4, color: SOFT, maxWidth: 960 }}>{subtitle}</div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", marginTop: 30 }}>
        {chips.slice(0, 5).map((chip, i) => <div key={chip} style={{ display: "flex", alignItems: "center", marginRight: 12, marginBottom: 10, padding: "9px 18px", borderRadius: 999, background: i === 0 ? INK : "#f6f4ee", border: `1.5px solid ${i === 0 ? INK : RULE}`, color: i === 0 ? "#ffffff" : INK, fontSize: 20, fontWeight: 600 }}>{chip}</div>)}
      </div>
    </div>

    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 72px", borderTop: `2px solid ${RULE}`, background: "rgba(250,249,245,0.9)", position: "relative" }}>
      <span style={{ fontSize: 20, fontWeight: 600, color: SOFT }}>{footer}</span>
      <div style={{ display: "flex", alignItems: "center", fontSize: 20, fontWeight: 700, color: accent }}>
        <span>Start learning free</span><span style={{ marginLeft: 10 }}>→</span>
      </div>
    </div>
  </div>;
}
