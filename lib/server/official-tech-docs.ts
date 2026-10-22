import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { fetchOfficialTechDocs, slimTechDocs, type OfficialTechDocs } from "@/lib/tech-docs-official";
import { TECH_DOCS } from "@/lib/tech-docs";
import { COMPARISONS } from "@/lib/comparisons";
import { COMPARISON_DOCS } from "@/lib/comparisons-official";

/** Only what the one-panel previews show (one platform, first comparison), to keep the landing payload small.
 *  `techId` is the platform shown, the first by default; the landing page passes today's (dailyTechDoc). */
export function previewTechDocs(data: OfficialTechDocs, techId = TECH_DOCS[0].id) {
  const first = TECH_DOCS.find(tech => tech.id === techId) ?? TECH_DOCS[0];
  const urls = [first.docs, ...first.materials.map(m => m.url), ...(COMPARISONS[0]?.techs ?? []).map(t => COMPARISON_DOCS[t.name]).filter(Boolean)];
  return slimTechDocs(data, { urls, articles: [first.id] });
}
export { slimTechDocs };
import snapshot from "@/lib/generated/tech-docs-official.json";

/** The whole live refresh normally takes ~6s; past this the committed snapshot is served instead. */
const REFRESH_MS = 20_000;

/**
 * The Technology docs content, read from the official websites at most once a day (revalidateTag("tech-docs")
 * refreshes it at once). Any page that fails keeps its committed snapshot copy from `npm run docs:tech`, and a
 * total failure serves the snapshot, so the section never renders empty. Live refresh is opt-in:
 * TECH_DOCS_LIVE=true. By default, deploy the snapshot refreshed by `npm run docs:tech`.
 */
export async function officialTechDocs(): Promise<OfficialTechDocs> {
  "use cache";
  cacheLife("days");
  cacheTag("tech-docs");
  const fallback = snapshot as OfficialTechDocs;
  if (process.env.TECH_DOCS_LIVE !== "true") return fallback;
  // A refresh that hangs (a stalled vendor, or a fetch stuck on the outer render) must finish well inside Next's
  // ~50s cache-fill limit, or the whole landing page fails with "Filling a cache during prerender timed out".
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(`no response in ${REFRESH_MS}ms`)), REFRESH_MS); });
  try {
    return await Promise.race([fetchOfficialTechDocs(fallback), deadline]);
  } catch (error) {
    console.error(JSON.stringify({ event: "tech_docs_refresh_failed", message: String(error) }));
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}
