"use client";
import Link from "next/link";
import { useEffect } from "react";

/** Free library sections that render from prerendered HTML, so they stay readable even when a live service fails. */
const LIBRARY: [string, string][] = [["/interview-questions", "Interview questions"], ["/workflows", "Workflow blueprints"], ["/learn", "Technology handbooks"], ["/api-reference", "API reference"], ["/vocabulary", "Vocabulary"]];

/**
 * The app-wide error boundary: when a page fails at request time (a database or AI provider outage, say), the
 * reader gets a calm explanation, a retry that re-renders the segment, and the free learning library, instead of
 * a blank screen. The error is reported to the console for monitoring; its message is never shown.
 */
export default function RouteError({ error, reset }: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  useEffect(() => { console.error(error); }, [error]);
  return <main id="main-content" style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: "48px 20px", background: "#f5f4ed", color: "#262624", textAlign: "center" }}>
    <div style={{ maxWidth: 540 }}>
      <p style={{ fontSize: 13, letterSpacing: "1.4px", color: "#b5522f", fontWeight: 600, textTransform: "uppercase" }}>Something went wrong</p>
      <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: 34, margin: "10px 0 14px" }}>This page could not load just now</h1>
      <p style={{ color: "#5e5d59", lineHeight: 1.7 }}>A service it depends on did not answer. Try again; if it keeps happening, the free library below is always available.</p>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 22 }}>
        <button type="button" onClick={reset} style={{ padding: "10px 18px", border: 0, borderRadius: 10, background: "#bb5834", color: "#fff", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Try again</button>
        <Link href="/" style={{ padding: "10px 18px", border: "1px solid #dedcd1", borderRadius: 10, color: "#262624", textDecoration: "none", fontSize: 15 }}>Go to the home page</Link>
      </div>
      <nav aria-label="Free learning library" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 28 }}>
        {LIBRARY.map(([href, label]) => <Link key={href} href={href} style={{ padding: "6px 12px", border: "1px solid #e39a6d", borderRadius: 999, background: "#fff", color: "#8f3f23", textDecoration: "none", fontSize: 14 }}>{label}</Link>)}
      </nav>
      {error.digest && <p style={{ marginTop: 24, fontSize: 12, color: "#87867f" }}>Reference: {error.digest}</p>}
    </div>
  </main>;
}
