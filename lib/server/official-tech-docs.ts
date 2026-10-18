import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { fetchOfficialTechDocs, slimTechDocs, type OfficialTechDocs } from "@/lib/tech-docs-official";
import { TECH_DOCS } from "@/lib/tech-docs";
import { COMPARISONS } from "@/lib/comparisons";
import { COMPARISON_DOCS } from "@/lib/comparisons-official";

/** Only what the one-panel previews show (first platform, first comparison), to keep the landing payload small. */
export function previewTechDocs(data: OfficialTechDocs) {
  const first = TECH_DOCS[0];
  const urls = [first.docs, ...first.materials.map(m => m.url), ...(COMPARISONS[0]?.techs ?? []).map(t => COMPARISON_DOCS[t.name]).filter(Boolean)];
  return slimTechDocs(data, { urls, articles: [first.id] });
}
export { slimTechDocs };
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
