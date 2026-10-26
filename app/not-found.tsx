import Link from "next/link";
import { Wordmark } from "@/components/brand-mark";
import { PUBLIC_PAGES } from "@/lib/seo";

// Next.js already marks 404 responses noindex; only the title is needed here.
export const metadata = { title: "Page not found" };

export default function NotFound() {
  return <main id="main-content" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "48px 20px", background: "#f5f4ed", color: "#262624", textAlign: "center" }}>
    <div style={{ maxWidth: 520 }}>
      <Link href="/" aria-label="Master Class Buddy home"><Wordmark /></Link>
      <p style={{ marginTop: 40, fontSize: 12, letterSpacing: "1.6px", color: "#c6613f", fontWeight: 600 }}>404</p>
      <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: 38, margin: "10px 0 14px" }}>This page isn&apos;t here</h1>
      <p style={{ color: "#5e5d59", lineHeight: 1.7 }}>The link may be old or mistyped. Try one of these instead:</p>
      <nav aria-label="Helpful links" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px 20px", marginTop: 20 }}>
        {PUBLIC_PAGES.map(page => <Link key={page.path} href={page.path} style={{ color: "#c6613f" }}>{page.label}</Link>)}
        <Link href="/learning" style={{ color: "#c6613f" }}>Dashboard</Link>
      </nav>
      {/* A mistyped or retired address still leads somewhere worth reading: the free learning library, no sign-in needed. */}
      <p style={{ color: "#5e5d59", lineHeight: 1.7, marginTop: 28 }}>Or carry on learning:</p>
      <nav aria-label="Learning sections" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 12 }}>
        {[["/interview-questions", "Interview questions"], ["/workflows", "Workflow blueprints"], ["/learn", "Technology handbooks"], ["/api-reference", "API reference"], ["/vocabulary", "English vocabulary"]].map(([href, label]) =>
          <Link key={href} href={href} style={{ padding: "6px 12px", border: "1px solid #e39a6d", borderRadius: 999, background: "#fff", color: "#8f3f23", textDecoration: "none", fontSize: 14 }}>{label}</Link>)}
      </nav>
    </div>
  </main>;
}
