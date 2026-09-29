import manifest from "./brand-manifest.json";
import { brandKeyFor, OWNED_BRAND_PNGS } from "./brands";
import type { MediaAsset } from "./types";

export type { MediaAsset, MediaLicense } from "./types";
export { needsAttribution, creditLine } from "./types";
export { brandKeyFor } from "./brands";

/** The generated simple-icons manifest, typed once at the boundary. */
const BRANDS = manifest as Record<string, MediaAsset>;

/** A mark the project owns outright, so it carries no third-party terms. */
const owned = (src: string): MediaAsset => ({
  src, width: 64, height: 64, license: "project-owned",
});

/**
 * The brand mark for a free-text label, or null when there is no logo for it.
 *
 * Most topics are concepts rather than products — "Reducers and context" has no
 * logo and never will — so null is the ordinary answer and callers are expected
 * to fall through to an icon. Owned PNGs are checked before the generated
 * manifest because the four marks that live there were withdrawn from
 * simple-icons and must not come back through a stale manifest entry.
 */
export function brandAssetFor(label: string): MediaAsset | null {
  const key = brandKeyFor(label);
  if (!key) return null;
  const owns = OWNED_BRAND_PNGS[key];
  if (owns) return owned(owns);
  return BRANDS[key] ?? null;
}

/** Every brand key the manifest can currently serve, for tests and audits. */
export function knownBrandKeys(): string[] {
  return [...Object.keys(BRANDS), ...Object.keys(OWNED_BRAND_PNGS)].sort();
}
