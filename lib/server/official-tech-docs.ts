import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { fetchOfficialTechDocs, type OfficialTechDocs } from "@/lib/tech-docs-official";
import snapshot from "@/lib/generated/tech-docs-official.json";

/**
 * The Technology docs content, read from the official websites at most once a day (revalidateTag("tech-docs")
 * refreshes it at once). Any page that fails keeps its committed snapshot copy from `npm run docs:tech`, and a
 * total failure serves the snapshot, so the section never renders empty. TECH_DOCS_LIVE=false serves the snapshot only.
 */
export async function officialTechDocs(): Promise<OfficialTechDocs> {
  "use cache";
  cacheLife("days");
  cacheTag("tech-docs");
  const fallback = snapshot as OfficialTechDocs;
  if (process.env.TECH_DOCS_LIVE === "false") return fallback;
  try {
    return await fetchOfficialTechDocs(fallback);
  } catch (error) {
    console.error(JSON.stringify({ event: "tech_docs_refresh_failed", message: String(error) }));
    return fallback;
  }
}
