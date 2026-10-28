import { previewPool } from "@/lib/landing-workflows-preview";
import { contentOverrides } from "@/lib/server/content-overrides";

/**
 * Every blueprint the landing Workflow carousel can show. The page ships only the "All" tab's first screen
 * (previewWorkflows); the section fetches this the first time a category tab is picked. Super Admin deletions
 * apply, so the edge keeps it for minutes rather than a day.
 */
export async function GET() {
  return Response.json({ workflows: previewPool(await contentOverrides()) }, { headers: { "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=86400" } });
}
