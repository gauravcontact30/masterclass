import { connection } from "next/server";
import { landingNews } from "@/lib/server/landing-news";

// The response is immediate; a missing or stale set runs its ten live searches after it, each allowed a retry.
export const maxDuration = 180;

/**
 * The "Fresh in tech" slides (components/landing-news.tsx). Fetched by the carousel after the page loads rather
 * than rendered into it. landingNews answers from the stored set, or the built-in one while the first set is being
 * searched; the CDN may reuse a response for ten minutes.
 */
export async function GET() {
  // Answer at request time: prerendered at build, the route froze the set it found then (and ran ten live searches
  // during the build on a cold cache), so the nightly refresh never reached visitors until the next deploy.
  await connection();
  return Response.json(await landingNews(), { headers: { "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=3600" } });
}
