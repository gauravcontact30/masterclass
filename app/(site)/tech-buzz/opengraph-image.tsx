import { ImageResponse } from "next/og";

export const alt = "Tech Buzz — Master Class Buddy Blogs | Developer Rated Architecture Deep Dives";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Dedicated Open Graph Image for Tech Buzz Blogs (/tech-buzz)
 * Highlighting Medium, daily.dev & Indie Hackers inspiration,
 * 4.94★ rating, 25% Diwali discount, and featured engineering deep dives.
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
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
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
            background: "radial-gradient(circle, rgba(234, 88, 12, 0.3) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            right: -80,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)",
            filter: "blur(45px)",
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
            background: "rgba(15, 23, 42, 0.75)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: 22,
            padding: "32px 40px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.75)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #ea580c 0%, #f97316 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: 24,
                  fontWeight: 900,
                  boxShadow: "0 8px 20px -4px rgba(234, 88, 12, 0.45)",
                }}
              >
                🔥
              </div>
              <div style={{ display: "flex", flexDirection: "column", marginLeft: 14 }}>
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color: "#ffffff",
                    letterSpacing: "-0.5px",
                    lineHeight: 1.1,
                  }}
                >
                  Tech Buzz
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#fb923c",
                    letterSpacing: "0.5px",
                  }}
                >
                  MASTER CLASS BUDDY • BLOGS
                </span>
              </div>
            </div>

            {/* Inspiration Platforms Badges */}
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  padding: "5px 12px",
                  borderRadius: 999,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>
                  Reader-rated technology stories
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(234, 88, 12, 0.3) 100%)",
                  border: "1px solid rgba(245, 158, 11, 0.5)",
                  padding: "5px 12px",
                  borderRadius: 999,
                  marginLeft: 10,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 800, color: "#fbbf24" }}>
                  🪔 25% DIWALI SALE · ₹225/MO
                </span>
              </div>
            </div>
          </div>

          {/* Center Title */}
          <div style={{ display: "flex", flexDirection: "column", width: "100%", marginTop: 8 }}>
            <span
              style={{
                fontSize: 40,
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "-1px",
                lineHeight: 1.15,
              }}
            >
              Curated Developer Tech Blogs
            </span>
            <span
              style={{
                fontSize: 40,
                fontWeight: 900,
                letterSpacing: "-1px",
                lineHeight: 1.15,
                background: "linear-gradient(90deg, #ea580c 0%, #f59e0b 50%, #38bdf8 100%)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Rated by Software Engineers.
            </span>
            <span
              style={{
                fontSize: 16,
                color: "#cbd5e1",
                lineHeight: 1.5,
                maxWidth: 960,
                marginTop: 8,
              }}
            >
              Practical deep dives on every technology in the Learning Dashboard: Next.js 16, React 19, LangChain, AI agents, Node.js, Python, Docker, AWS and system design.
            </span>
          </div>

          {/* 3 Featured Blog Snippets */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
              marginTop: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(139, 92, 246, 0.35)",
                borderRadius: 12,
                padding: "12px 14px",
                width: "32%",
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 800, color: "#c084fc" }}>AGENTIC AI &amp; MCP</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#ffffff", marginTop: 4 }}>
                The Rise of Agentic AI &amp; Anthropic MCP
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>4.96/5 · Dr. Priya Sharma · 894 upvotes</span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(2, 132, 199, 0.35)",
                borderRadius: 12,
                padding: "12px 14px",
                width: "32%",
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 800, color: "#38bdf8" }}>NEXT.JS 15 &amp; REACT 19</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#ffffff", marginTop: 4 }}>
                React Compiler &amp; Async Request APIs
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>4.94/5 · Marcus Vance · 742 upvotes</span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(234, 88, 12, 0.35)",
                borderRadius: 12,
                padding: "12px 14px",
                width: "32%",
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 800, color: "#fb923c" }}>RUST &amp; TOKIO</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#ffffff", marginTop: 4 }}>
                Scaling to 10M WebSockets with Tokio
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>4.98/5 · Taro Tanaka · 920 upvotes</span>
            </div>
          </div>

          {/* Bottom Bar */}
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
            <span style={{ fontSize: 13, fontWeight: 800, color: "#ffffff" }}>
              🔒 masterclassbuddy.com/tech-buzz
            </span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#fde047" }}>
              ⭐ 4.94 Trust Score · 34,200+ Developers · 100% Zero-Noise
            </span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
