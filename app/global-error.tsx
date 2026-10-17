"use client";
import { useEffect } from "react";

/**
 * The last-resort boundary for an error in the root layout itself. It replaces the whole document, so it carries
 * its own <html> and <body>, and plain links rather than client navigation.
 */
export default function GlobalError({ error, reset }: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  useEffect(() => { console.error(error); }, [error]);
  return <html lang="en-IN"><body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", padding: "48px 20px", background: "#f5f4ed", color: "#262624", fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
    <main style={{ maxWidth: 520 }}>
      <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: 32 }}>MasterClass could not load</h1>
      <p style={{ color: "#5e5d59", lineHeight: 1.7 }}>Something went wrong while starting the app. Try again, or open the free library.</p>
      <p style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 20 }}>
        <button type="button" onClick={reset} style={{ padding: "10px 18px", border: 0, borderRadius: 10, background: "#bb5834", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Try again</button>
        <a href="/library" style={{ padding: "10px 18px", color: "#8f3f23" }}>Open the library</a>
      </p>
    </main>
  </body></html>;
}
