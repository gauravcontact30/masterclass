import { brandAssetFor } from "@/lib/media";
import { techLogo } from "@/lib/tech-buzz-public";

/** Catalogue ids whose logo is filed under another id. */
const LOGO_IDS: Record<string, string> = { "agentic-terms": "agentic-ai", agents: "agentic-ai", systemdesign: "system-design", deepagents: "langchain", node: "nodejs", "tanstack-libraries": "tanstack" };

/**
 * A technology's real logo: the project's own PNG for its id, else its brand mark by name. Null when it has neither,
 * so callers show the name alone rather than a stand-in. Read by the /site-map page and the image sitemaps.
 */
export function technologyLogo(id: string, name: string): string | null {
  return techLogo(LOGO_IDS[id] ?? id) ?? brandAssetFor(name)?.src ?? null;
}
