import { ImageResponse } from "next/og";
import { siteName } from "@/lib/seo";

export const alt = `${siteName} — Master Coding, Cloud, System Design & Agentic AI in English and Hindi`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 32,
          background: "linear-gradient(135deg, #090b10 0%, #0f1422 50%, #151a2d 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ambient Glows */}
        <div
          style={{
            position: "absolute",
            top: -100,
            left: -100,
            width: 550,
            height: 550,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -100,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(245, 158, 11, 0.18) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -150,
            left: "30%",
            width: 600,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(147, 51, 234, 0.22) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />

        {/* Master Glassmorphic Frame */}
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: "rgba(15, 23, 42, 0.68)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: 24,
            padding: "36px 44px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.75)",
          }}
        >
          {/* Top Brand & Live Badge Bar */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            {/* Brand Logo & Name */}
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #8b5cf6 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 20px -4px rgba(245, 158, 11, 0.4)",
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                    fill="#ffffff"
                  />
                </svg>
              </div>
              <div style={{ display: "flex", flexDirection: "column", marginLeft: 14 }}>
                <span
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: "#ffffff",
                    letterSpacing: "-0.5px",
                    lineHeight: 1.1,
                  }}
                >
                  MasterClass Buddy
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#94a3b8",
                    letterSpacing: "0.5px",
                    marginTop: 2,
                  }}
                >
                  BILINGUAL TECH & AI ENGINEERING ACADEMY
                </span>
              </div>
            </div>

            {/* Live Indicator & Badges */}
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  background: "rgba(16, 185, 129, 0.12)",
                  border: "1px solid rgba(16, 185, 129, 0.35)",
                  padding: "6px 14px",
                  borderRadius: 999,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#10b981",
                    marginRight: 8,
                    boxShadow: "0 0 8px #10b981",
                  }}
                />
                <span style={{ fontSize: 12, fontWeight: 750, color: "#10b981", letterSpacing: "0.3px" }}>
                  BILINGUAL · EN + हिन्दी
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "rgba(245, 158, 11, 0.12)",
                  border: "1px solid rgba(245, 158, 11, 0.35)",
                  padding: "6px 14px",
                  borderRadius: 999,
                  marginLeft: 10,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 750, color: "#fbbf24", letterSpacing: "0.3px" }}>
                  ✨ 2026 EDITION
                </span>
              </div>
            </div>
          </div>

          {/* Center Hero Value Proposition */}
          <div style={{ display: "flex", flexDirection: "column", width: "100%", marginTop: 8 }}>
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                background: "rgba(56, 189, 248, 0.12)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                padding: "4px 12px",
                borderRadius: 999,
                marginBottom: 10,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 750, color: "#38bdf8", letterSpacing: "0.8px" }}>
                AI TUTOR · AUDIO LECTURES · 31+ TECH INTERVIEW BANKS · SYSTEM DESIGN
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: 44,
                  fontWeight: 900,
                  color: "#ffffff",
                  letterSpacing: "-1px",
                  lineHeight: 1.1,
                }}
              >
                Master Coding, Cloud &amp;
              </span>
              <span
                style={{
                  fontSize: 44,
                  fontWeight: 900,
                  letterSpacing: "-1px",
                  lineHeight: 1.1,
                  background: "linear-gradient(90deg, #38bdf8 0%, #a855f7 50%, #fb923c 100%)",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                Agentic AI Engineering.
              </span>
            </div>

            <span
              style={{
                fontSize: 16,
                color: "#cbd5e1",
                lineHeight: 1.45,
                maxWidth: 980,
                marginTop: 8,
              }}
            >
              Production-grade study notes in English &amp; Hindi, 31+ tech interview question banks, real-world system design blueprints, and audio lectures with an AI coach.
            </span>
          </div>

          {/* 3 Creative Feature Cards Showcase */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
              marginTop: 12,
            }}
          >
            {/* Card 1 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(56, 189, 248, 0.28)",
                borderRadius: 14,
                padding: "12px 16px",
                width: "32%",
              }}
            >
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#38bdf8" }}>
                  🤖 Bilingual AI Tutor
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#38bdf8", background: "rgba(56, 189, 248, 0.15)", padding: "2px 6px", borderRadius: 4 }}>
                  24/7 Live
                </span>
              </div>
              <span style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 4, lineHeight: 1.35 }}>
                Instant doubt solving in English &amp; Hindi with synchronized audio lectures.
              </span>
            </div>

            {/* Card 2 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(168, 85, 247, 0.28)",
                borderRadius: 14,
                padding: "12px 16px",
                width: "32%",
              }}
            >
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#c084fc" }}>
                  🎯 31+ Interview Banks
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#c084fc", background: "rgba(168, 85, 247, 0.15)", padding: "2px 6px", borderRadius: 4 }}>
                  FAANG Prep
                </span>
              </div>
              <span style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 4, lineHeight: 1.35 }}>
                Curated interview questions, worked solutions, code sandboxes &amp; test banks.
              </span>
            </div>

            {/* Card 3 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(251, 146, 60, 0.28)",
                borderRadius: 14,
                padding: "12px 16px",
                width: "32%",
              }}
            >
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#fb923c" }}>
                  ⚡ System Design &amp; AI
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#fb923c", background: "rgba(251, 146, 60, 0.15)", padding: "2px 6px", borderRadius: 4 }}>
                  Blueprints
                </span>
              </div>
              <span style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 4, lineHeight: 1.35 }}>
                LangGraph, LangChain, MCP, AWS, Docker, Kubernetes &amp; microservices.
              </span>
            </div>
          </div>

          {/* Bottom Trust & Tech Stack Bar */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              paddingTop: 14,
              marginTop: 10,
            }}
          >
            {/* Domain with Lock */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                background: "rgba(255, 255, 255, 0.07)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                padding: "5px 12px",
                borderRadius: 8,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>
                🔒 masterclassbuddy.com
              </span>
            </div>

            {/* Tech Badges */}
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
              {["React 19", "Next.js 16", "Python 3.12", "Agentic AI", "AWS", "System Design"].map(
                (tech, i) => (
                  <div
                    key={tech}
                    style={{
                      display: "flex",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      padding: "3px 8px",
                      borderRadius: 6,
                      marginLeft: i === 0 ? 0 : 6,
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>
                      {tech}
                    </span>
                  </div>
                ),
              )}
            </div>

            {/* Rating */}
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 750, color: "#fef08a" }}>
                ⭐ 4.9/5 Rating · Free Library Access
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
