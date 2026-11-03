import { API_PACKAGES } from "@/lib/api-docs";
import { fieldGuide } from "@/lib/api-field-guides";
import type { LandingApiGuide } from "@/lib/landing-pro-preview";
import { apiPreview } from "@/lib/server/api-previews";

/*
 * The landing API Docs section's technologies beyond the field guides: short descriptions and locked names only, the
 * same public preview a non-member sees in the dashboard. Prerendered at build time and fetched only when a visitor
 * opens one of these technologies, so it costs the first load nothing.
 */
const clip = (text: string, max = 110) => { const line = text.split("\n")[0].trim(); return line.length > max ? `${line.slice(0, max - 1)}…` : line; };

export async function GET() {
  const guides: Record<string, Pick<LandingApiGuide, "tagline" | "count" | "free" | "locked">> = {};
  for (const pkg of API_PACKAGES) {
    if (fieldGuide(pkg.id)) continue;
    const free = apiPreview(pkg);
    const open = new Set(free.map(item => item.name));
    guides[pkg.id] = {
      tagline: pkg.description.charAt(0).toUpperCase() + pkg.description.slice(1), count: pkg.entries.length,
      free: free.map(({ name, kind, summary, signature }) => ({ name, kind, summary, signature: clip(signature) })),
      locked: pkg.entries.filter(entry => !open.has(entry.name)).slice(0, 8).map(({ name, kind }) => ({ name, kind })),
    };
  }
  return Response.json(guides, { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" } });
}
