import { landingNews } from "@/lib/server/landing-news";

// A cold cache runs ten live searches side by side, each allowed a retry.
export const maxDuration = 180;

/**
 * The "Fresh in tech" slides (components/landing-news.tsx). Fetched by the carousel after the page loads rather
 * than rendered into it, so a cold cache (a deploy, a dev-server restart) never holds the landing page up while
 * ten live searches run. landingNews caches each slide itself; the CDN may reuse a response for ten minutes.
 */
export async function GET() {
  return Response.json(await landingNews(), { headers: { "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=3600" } });
}
