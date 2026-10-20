import { landingLibrary } from "@/lib/landing-library";
import { landingProPreview } from "@/lib/landing-pro-preview";

/**
 * The full landing-page library ledger. The page itself ships only the first rows (previewLibrary); the ledger
 * fetches this once, the first time a visitor searches or filters. Built from static catalogues, so it is cached
 * hard at the edge and in the browser.
 */
export async function GET() {
  return Response.json(landingLibrary(landingProPreview()), { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" } });
}
