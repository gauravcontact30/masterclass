import { ImageResponse } from "next/og";
import { siteName } from "@/lib/seo";
import { getDiwaliFestiveSaleInfo, getTechBuzzArticles } from "@/lib/tech-buzz-data";
import { getPublishedTechBuzzArticle, listPublishedTechBuzzArticles } from "@/lib/server/tech-buzz-storage";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
  const articles = await listPublishedTechBuzzArticles();
  return articles.map(article => ({
    slug: article.slug
  }));
}

interface ImageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Creative, High-Impact Dynamic Open Graph Card for Individual Tech Buzz Articles
 * Features:
 * - Real Article Headline, Subtitle & Technology Stack
 * - Author Metadata with Avatar & Role
 * - 7 Global Languages (🇺🇸 🇮🇳 🇪🇸 🇯🇵 🇩🇪 🇫🇷 🇨🇳)
 * - 4.96★ Community Trust Score & Upvotes
 * - 25% Diwali Festive Discount Ribbon (₹225/mo)
 * - Medium, daily.dev & Indie Hackers architectural design aesthetic
 */
export default async function Image({ params }: ImageProps) {
  const { slug } = await params;
  const article = await getPublishedTechBuzzArticle(slug) || getTechBuzzArticles()[0];
  const festiveSale = getDiwaliFestiveSaleInfo();

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
        {/* Ambient Radial Glows */}
        <div
          style={{
            position: "absolute",
            top: -100,
            left: -80,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(234, 88, 12, 0.3) 0%, transparent 70%)",
            filter: "blur(45px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            right: -80,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.28) 0%, transparent 70%)",
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
            background: "rgba(15, 23, 42, 0.76)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: 22,
            padding: "32px 38px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
          }}
        >
          {/* Header Row */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            {/* Brand + Tech Buzz Tag */}
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #ea580c 0%, #f97316 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 16px -2px rgba(234, 88, 12, 0.5)",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                    fill="#ffffff"
                  />
                </svg>
              </div>
              <div style={{ display: "flex", flexDirection: "column", marginLeft: 12 }}>
                <span
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    color: "#ffffff",
                    letterSpacing: "-0.5px",
                    lineHeight: 1.1,
                  }}
                >
                  MasterClass Buddy
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#fb923c",
                    letterSpacing: "0.5px",
                    marginTop: 2,
                  }}
                >
                  TECH BUZZ • ARCHITECTURE DEEP DIVES
                </span>
              </div>
            </div>

            {/* i18n & Diwali Ribbon */}
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
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
                <span style={{ fontSize: 11, fontWeight: 800, color: "#a5b4fc" }}>
                  7 LANGUAGES · 🇺🇸 🇮🇳 🇪🇸 🇯🇵 🇩🇪 🇫🇷 🇨🇳
                </span>
              </div>

              {festiveSale.active && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    background: "linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(234, 88, 12, 0.3) 100%)",
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
              )}
            </div>
          </div>

          {/* Center Body: Category Badge + Article Title + Subtitle */}
          <div style={{ display: "flex", flexDirection: "column", width: "100%", marginTop: 12 }}>
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <div
                style={{
                  display: "flex",
                  background: "rgba(234, 88, 12, 0.18)",
                  border: "1px solid rgba(234, 88, 12, 0.45)",
                  padding: "4px 10px",
                  borderRadius: 6,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 800, color: "#fb923c", textTransform: "uppercase" }}>
                  {article.category}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  background: "rgba(56, 189, 248, 0.15)",
                  border: "1px solid rgba(56, 189, 248, 0.35)",
                  padding: "4px 10px",
                  borderRadius: 6,
                  marginLeft: 8,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 800, color: "#38bdf8" }}>
                  ⚡ {article.technology}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  padding: "4px 10px",
                  borderRadius: 6,
                  marginLeft: 8,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: "#cbd5e1" }}>
                  📖 {article.readTimeMinutes} min read
                </span>
              </div>
            </div>

            <span
              style={{
                fontSize: 38,
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "-1px",
                lineHeight: 1.16,
                maxWidth: 1060,
              }}
            >
              {article.title}
            </span>

            <span
              style={{
                fontSize: 16,
                color: "#cbd5e1",
                lineHeight: 1.45,
                maxWidth: 1020,
                marginTop: 10,
              }}
            >
              {article.subtitle}
            </span>
          </div>

          {/* Author Strip & Platform Engagement */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 14,
              padding: "12px 18px",
              marginTop: 12,
            }}
          >
            {/* Author Info */}
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  border: "2px solid #ea580c",
                  overflow: "hidden",
                  display: "flex",
                  background: "#1e293b",
                }}
              >
                {/* The renderer fetches only absolute URLs; site-relative avatars (the editorial icon) show initials. */}
                {/^https?:/.test(article.author.avatar) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={article.author.avatar}
                    alt={article.author.name}
                    width="44"
                    height="44"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fb923c" }}>
                    {article.author.name.split(/\s+/).map(word => word[0]).slice(0, 2).join("")}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", marginLeft: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#ffffff" }}>
                  {article.author.name}
                </span>
                <span style={{ fontSize: 11.5, color: "#94a3b8" }}>
                  {article.author.role} • {article.publishedAt}
                </span>
              </div>
            </div>

            {/* Engagement Metrics */}
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "rgba(245, 158, 11, 0.18)",
                  border: "1px solid rgba(245, 158, 11, 0.4)",
                  padding: "4px 10px",
                  borderRadius: 8,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 800, color: "#fbbf24" }}>
                  {article.rating.count ? `★ ${article.rating.average} / 5 (${article.rating.count} ratings)` : `★ New · ${article.readTimeMinutes} min read`}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "rgba(234, 88, 12, 0.18)",
                  border: "1px solid rgba(234, 88, 12, 0.4)",
                  padding: "4px 10px",
                  borderRadius: 8,
                  marginLeft: 8,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 800, color: "#fb923c" }}>
                  {article.upvotes ? `▲ ${article.upvotes} upvotes` : article.technology}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "rgba(16, 185, 129, 0.18)",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  padding: "4px 10px",
                  borderRadius: 8,
                  marginLeft: 8,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 800, color: "#34d399" }}>
                  {article.claps ? `👏 ${article.claps} claps` : "Member story"}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Link Preview Details */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              paddingTop: 10,
              marginTop: 10,
            }}
          >
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#cbd5e1" }}>
              🔒 masterclassbuddy.com/tech-buzz/{article.slug}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>
              Medium • daily.dev • Dev.to • Hashnode • Substack • Indie Hackers
            </span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
