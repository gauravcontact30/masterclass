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

/**
 * The technologies on the home page's link preview, each with its logo from public/images/tech/<icon>.png, by row of the
 * wall. The panel's slanted edge leaves the top rows narrower, so they hold five tiles and the lower rows six.
 */
export const HOME_OG_WALL = [
  [{ name: "Agentic AI", icon: "agentic-ai" }, { name: "LangChain", icon: "langchain" }, { name: "LangGraph", icon: "langgraph" }, { name: "LangSmith", icon: "langsmith" }, { name: "LangFlow", icon: "langflow" }],
  [{ name: "Claude", icon: "claude" }, { name: "OpenAI", icon: "openai" }, { name: "Google AI", icon: "google" }, { name: "Microsoft AI", icon: "microsoft" }, { name: "n8n", icon: "n8n" }],
  [{ name: "Next.js", icon: "nextjs" }, { name: "React", icon: "react" }, { name: "TypeScript", icon: "typescript" }, { name: "JavaScript", icon: "javascript" }, { name: "TanStack", icon: "tanstack" }],
  [{ name: "AWS", icon: "aws" }, { name: "Docker", icon: "docker" }, { name: "Kubernetes", icon: "kubernetes" }, { name: "Linux", icon: "linux" }, { name: "Git", icon: "git" }, { name: "Zustand", icon: "zustand" }],
  [{ name: "System Design", icon: "system-design" }, { name: "Python", icon: "python" }, { name: "FastAPI", icon: "fastapi" }, { name: "Django", icon: "django" }, { name: "Node.js", icon: "nodejs" }, { name: "NestJS", icon: "nestjs" }],
  [{ name: "PostgreSQL", icon: "postgresql" }, { name: "Redis", icon: "redis" }, { name: "Supabase", icon: "supabase" }, { name: "GraphQL", icon: "graphql" }, { name: "Express", icon: "express" }, { name: "Playwright", icon: "playwright" }],
  [{ name: "Vitest", icon: "vitest" }, { name: "Vue", icon: "vue" }, { name: "Angular", icon: "angular" }, { name: "Flutter", icon: "flutter" }, { name: "Go", icon: "go" }, { name: "Rust", icon: "rust" }],
] as const;
export const HOME_OG_TECHNOLOGIES = HOME_OG_WALL.flat();
export type OgTechnology = { name: string; logo: string };

/** The home card's five pillars, in order: what each is and what it covers (titles as the user named them, 2026-11-28). */
export const HOME_OG_PILLARS = [
  ["Learning Technologies & AI", "Agentic AI, Next.js, React, Python, AWS, DSA · MCB Streams in 4K"],
  ["Board Exams", "UP Board, CBSE Board & ICSE Board · Class 10 and 12"],
  ["Top Rank Govt. Exams & Interview Q&A", "NDA, SSC, banks, railways, UPSC · most asked questions with answers"],
  ["TET Qualifying", "CTET, UPTET & state TETs · child development and pedagogy"],
  ["IELTS Preparation", "Writing, Speaking, Reading & Listening · band score calculator"],
] as const;
const PILLAR_TONES = [["#fdeee7", "#8f3f23"], ["#eaf3fb", "#1d4f7a"], ["#ecf7ef", "#1f5a37"], ["#f1ecfb", "#4b3c86"], ["#fdf6dc", "#6e4f00"]] as const;

/** The site's light tones, each with an ink that reads on it. */
const WALL_TONES = [["#eaf3fb", "#1d4f7a"], ["#ecf7ef", "#1f5a37"], ["#fdf6dc", "#6e4f00"], ["#f1ecfb", "#4b3c86"], ["#fdeee7", "#8f3f23"], ["#e6f5f6", "#17595f"]] as const;

/**
 * The home page's link preview (1200×630): what the site is for, its five pillars and a way in at the left, and at the right a clay panel
 * holding a wall of every technology, named, in light tones. The headline carries the card at thumbnail size;
 * the wall reads as breadth there and as a list of names at full size. `logo` is a data URI (app/opengraph-image.tsx
 * reads the PNGs). Satori rules as for OgCard; the Inter cuts it uses are loaded by the route.
 */
export function HomeOgCard({ wall, footer }: { wall: readonly (readonly OgTechnology[])[]; footer: string }) {
  return <div style={{ width: "100%", height: "100%", display: "flex", background: "#fbf8f3", position: "relative", overflow: "hidden", fontFamily: "Inter", color: INK }}>
    <div style={{ position: "absolute", top: -120, left: 648, width: 900, height: 900, background: `linear-gradient(160deg, ${P.terracotta}, #9a4a2e)`, transform: "rotate(7deg)", display: "flex" }} />
    {/* The tiles stay upright: Satori clips images inside a rotated parent. Each row starts where the slanted edge lets it. */}
    {wall.map((row, r) => <div key={row[0].name} style={{ position: "absolute", top: 8 + r * 88, left: 714 - r * 11, right: 14, display: "flex" }}>
      {row.map((tech, t) => { const [background, ink] = WALL_TONES[(r * 2 + t) % WALL_TONES.length]; return <div key={tech.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, height: 82, marginLeft: t ? 7 : 0, borderRadius: 14, background }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 10, background: "#ffffff" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img> */}
          <img src={tech.logo} width={28} height={28} alt="" />
        </div>
        <span style={{ marginTop: 5, fontSize: tech.name.length > 10 ? 11 : 12.5, fontWeight: 500, color: ink, whiteSpace: "nowrap" }}>{tech.name}</span>
      </div>; })}
    </div>)}

    <div style={{ display: "flex", flexDirection: "column", width: 660, padding: "34px 0 30px 52px", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <Mark size={68} />
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 14 }}>
          <div style={{ display: "flex", fontSize: 38, lineHeight: 1, letterSpacing: -1.4 }}>
            <span style={{ fontWeight: 500, color: INK }}>master</span>
            <span style={{ fontWeight: 800, color: P.terracotta }}>class</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 7 }}>
            <div style={{ width: 34, height: 2, background: "#d6d2c6", display: "flex" }} />
            <span style={{ margin: "0 9px", fontSize: 14, fontWeight: 800, letterSpacing: 6, color: P.terracotta }}>BUDDY</span>
            <div style={{ width: 34, height: 2, background: "#d6d2c6", display: "flex" }} />
          </div>
        </div>
        <span style={{ marginLeft: "auto", marginRight: 40, fontSize: 16, fontWeight: 600, color: SOFT }}>{footer}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", marginTop: 24, fontSize: 42, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1.6, color: INK }}>
        <span>Learn tech & AI.</span><span style={{ color: P.terracotta }}>Crack every exam.</span>
      </div>
      {/* The five things the platform teaches (user request 2026-11-28), numbered, each with what it covers. */}
      <div style={{ display: "flex", flexDirection: "column", marginTop: 16, width: 566 }}>
        {HOME_OG_PILLARS.map(([title, detail], i) => <div key={title} style={{ display: "flex", alignItems: "center", marginTop: i ? 9 : 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 10, background: PILLAR_TONES[i][0], color: PILLAR_TONES[i][1], fontSize: 18, fontWeight: 800 }}>{i + 1}</div>
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 13 }}>
            <span style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.1, color: INK }}>{title}</span>
            <span style={{ marginTop: 2, fontSize: 14.5, fontWeight: 500, lineHeight: 1.2, color: SOFT }}>{detail}</span>
          </div>
        </div>)}
      </div>

      <div style={{ display: "flex", alignItems: "center", marginTop: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "13px 22px", borderRadius: 14, background: INK, color: "#ffffff", fontSize: 21, fontWeight: 800 }}>Start learning free →</div>
        <div style={{ display: "flex", alignItems: "center", marginLeft: 12, padding: "6px 12px", borderRadius: 999, border: `2px solid ${P.terracotta}`, color: P.terracotta, fontSize: 15, fontWeight: 800 }}>English & Hindi</div>
      </div>
    </div>
  </div>;
}
