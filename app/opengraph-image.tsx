import { ImageResponse } from "next/og";
import { siteName } from "@/lib/seo";

export const alt = `${siteName} — Master Coding, Cloud, System Design, Agentic AI & Tech Buzz Blogs`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Creative, High-Impact Open Graph Card for MasterClass Buddy
 * Showcases core features:
 * 1. Agentic AI & System Design
 * 2. 7 Global Languages (EN, HI, ES, JA, DE, FR, ZH)
 * 3. Tech Buzz Developer Blogs (Medium + daily.dev + Indie Hackers style)
 * 4. Diwali Festive Sale (25% OFF)
 */
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
          padding: 28,
          background: "linear-gradient(135deg, #090d16 0%, #0f172a 45%, #181d33 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ambient Cosmic Radial Glows */}
        <div
          style={{
            position: "absolute",
            top: -120,
            left: -100,
            width: 580,
            height: 580,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.28) 0%, transparent 70%)",
            filter: "blur(45px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -100,
            width: 550,
            height: 550,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(234, 88, 12, 0.24) 0%, transparent 70%)",
            filter: "blur(45px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -140,
            left: "35%",
            width: 650,
            height: 520,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, transparent 70%)",
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
            background: "rgba(15, 23, 42, 0.72)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: 22,
            padding: "32px 40px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
          }}
        >
          {/* Top Header: Brand + 7 Languages + Diwali Sale Ribbon */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            {/* Brand Logo & Title */}
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #ea580c 0%, #f97316 50%, #f59e0b 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 20px -4px rgba(234, 88, 12, 0.45)",
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
                    fontWeight: 900,
                    color: "#ffffff",
                    letterSpacing: "-0.6px",
                    lineHeight: 1.1,
                  }}
                >
                  MasterClass Buddy
                </span>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: "#94a3b8",
                    letterSpacing: "0.6px",
                    marginTop: 2,
                  }}
                >
                  GLOBAL TECH ACADEMY &amp; TECH BUZZ BLOGS
                </span>
              </div>
            </div>

            {/* i18n Languages Pill & Diwali Badge */}
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
              {/* 7 Global Languages Pill */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  background: "rgba(99, 102, 241, 0.15)",
                  border: "1px solid rgba(99, 102, 241, 0.4)",
                  padding: "5px 12px",
                  borderRadius: 999,
                }}
              >
                <span style={{ fontSize: 13, marginRight: 6 }}>🌍</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#818cf8", letterSpacing: "0.4px" }}>
                  7 LANGUAGES · 🇺🇸 🇮🇳 🇪🇸 🇯🇵 🇩🇪 🇫🇷 🇨🇳
                </span>
              </div>

              {/* Diwali Sale Badge */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  background: "linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(234, 88, 12, 0.25) 100%)",
                  border: "1px solid rgba(245, 158, 11, 0.5)",
                  padding: "5px 12px",
                  borderRadius: 999,
                  marginLeft: 10,
                }}
              >
                <span style={{ fontSize: 13, marginRight: 5 }}>🪔</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#fbbf24", letterSpacing: "0.3px" }}>
                  DIWALI SALE 25% OFF · ₹225/MO
                </span>
              </div>
            </div>
          </div>

          {/* Center Hero: Core Learning & Tech Buzz Headline */}
          <div style={{ display: "flex", flexDirection: "column", width: "100%", marginTop: 10 }}>
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                background: "rgba(234, 88, 12, 0.12)",
                border: "1px solid rgba(234, 88, 12, 0.35)",
                padding: "4px 12px",
                borderRadius: 999,
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 800, color: "#fb923c", letterSpacing: "0.8px" }}>
                AI TUTOR · AUDIO LECTURES · 31+ FAANG INTERVIEW BANKS · TECH BUZZ BLOGS
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: 42,
                  fontWeight: 900,
                  color: "#ffffff",
                  letterSpacing: "-1px",
                  lineHeight: 1.12,
                }}
              >
                Master Coding, Cloud Architecture &amp;
              </span>
              <span
                style={{
                  fontSize: 42,
                  fontWeight: 900,
                  letterSpacing: "-1px",
                  lineHeight: 1.12,
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
                fontSize: 15,
                color: "#cbd5e1",
                lineHeight: 1.45,
                maxWidth: 1040,
                marginTop: 8,
              }}
            >
              Production study notes in 7 native languages, 31+ tech interview question banks, real-world system design blueprints, and community-rated 4.94★ Tech Buzz developer blogs.
            </span>
          </div>

          {/* 3 Core Highlight Cards: Tech Buzz, Learning & Systems */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
              marginTop: 10,
            }}
          >
            {/* Card 1: Tech Buzz Blogs */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(234, 88, 12, 0.35)",
                borderRadius: 14,
                padding: "12px 16px",
                width: "32%",
              }}
            >
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#fb923c" }}>
                  🔥 Tech Buzz Blogs
                </span>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#fb923c", background: "rgba(234, 88, 12, 0.18)", padding: "2px 6px", borderRadius: 4 }}>
                  4.94★ Rated
                </span>
              </div>
              <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, lineHeight: 1.35 }}>
                Medium, daily.dev &amp; Indie Hackers inspired deep dives: MCP, Next.js 15 &amp; Rust.
              </span>
            </div>

            {/* Card 2: 7 Languages i18n */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(99, 102, 241, 0.35)",
                borderRadius: 14,
                padding: "12px 16px",
                width: "32%",
              }}
            >
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#a5b4fc" }}>
                  🌐 Global i18n Learning
                </span>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#818cf8", background: "rgba(99, 102, 241, 0.18)", padding: "2px 6px", borderRadius: 4 }}>
                  Auto-Detect
                </span>
              </div>
              <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, lineHeight: 1.35 }}>
                Native location detection for EN, हिन्दी, Español, 日本語, Deutsch, Français, 简体中文.
              </span>
            </div>

            {/* Card 3: 31+ Tech Interview & System Design */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                borderRadius: 14,
                padding: "12px 16px",
                width: "32%",
              }}
            >
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#34d399" }}>
                  🎯 31+ Interview Banks
                </span>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#10b981", background: "rgba(16, 185, 129, 0.18)", padding: "2px 6px", borderRadius: 4 }}>
                  FAANG Ready
                </span>
              </div>
              <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, lineHeight: 1.35 }}>
                Worked solutions, system design blueprints, code sandboxes &amp; interactive quizzes.
              </span>
            </div>
          </div>

          {/* Bottom Bar: Domain + Tech Badges + Community Trust */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              paddingTop: 12,
              marginTop: 10,
            }}
          >
            {/* Domain */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                padding: "4px 12px",
                borderRadius: 8,
              }}
            >
              <span style={{ fontSize: 12.5, fontWeight: 800, color: "#f8fafc" }}>
                🔒 masterclassbuddy.com
              </span>
            </div>

            {/* Core Tech Stack Badges */}
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
              {["Agentic AI", "Next.js 15", "Rust Tokio", "PostgreSQL 17", "AWS Bedrock", "eBPF"].map(
                (tech, i) => (
                  <div
                    key={tech}
                    style={{
                      display: "flex",
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.09)",
                      padding: "3px 8px",
                      borderRadius: 6,
                      marginLeft: i === 0 ? 0 : 6,
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#cbd5e1" }}>
                      {tech}
                    </span>
                  </div>
                ),
              )}
            </div>

            {/* Trust Metric */}
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: "#fef08a" }}>
                ⭐ 4.94/5 Trust Score · 34,200+ Developers
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
