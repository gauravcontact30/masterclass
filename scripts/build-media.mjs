/**
 * Populates `public/images/brands/` from simple-icons and writes the manifest.
 *
 * Run with `node scripts/build-media.mjs`. The script is the only thing that
 * writes those files, so re-running it after a simple-icons upgrade is how the
 * marks stay current. A slug that no longer resolves is a hard error rather
 * than a skipped file — a silently missing logo is much harder to notice in
 * review than a failed script.
 *
 * simple-icons ships its SVGs under CC0-1.0, which asks for no credit line, but
 * the manifest still records the license and the upstream URL so provenance
 * survives into the app and out to anyone auditing what it ships.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as simpleIcons from "simple-icons";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const brandDir = join(root, "public", "images", "brands");
const LICENSE = { license: "CC0-1.0", licenseName: "CC0 1.0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/" };

/**
 * The brand table, read out of the TypeScript module rather than duplicated.
 *
 * Keeping one copy means a brand added to `lib/media/brands.ts` is picked up
 * here without a second edit. The parse is deliberately narrow — it reads the
 * BRAND_SLUGS object literal only — and throws if that block ever stops
 * matching, so a refactor there cannot leave this script quietly reading none.
 */
function readBrandSlugs() {
  const source = readFileSync(join(root, "lib", "media", "brands.ts"), "utf8");
  const block = source.match(/export const BRAND_SLUGS[^=]*=\s*\{([\s\S]*?)\n\};/);
  if (!block) throw new Error("BRAND_SLUGS object literal not found in lib/media/brands.ts");
  const entries = [...block[1].matchAll(/"?([\w-]+)"?\s*:\s*"([\w-]+)"/g)].map(match => [match[1], match[2]]);
  if (!entries.length) throw new Error("BRAND_SLUGS matched but parsed to zero entries");
  return entries;
}

const bySlug = new Map(Object.values(simpleIcons).filter(icon => icon && icon.slug).map(icon => [icon.slug, icon]));

mkdirSync(brandDir, { recursive: true });

const manifest = {};
const missing = [];

for (const [key, slug] of readBrandSlugs()) {
  const icon = bySlug.get(slug);
  if (!icon) { missing.push(`${key} -> ${slug}`); continue; }
  // simple-icons gives a 24x24 path; the title makes the standalone file
  // readable to a screen reader if it is ever opened on its own.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" fill="#${icon.hex}">`
    + `<title>${icon.title}</title><path d="${icon.path}"/></svg>\n`;
  writeFileSync(join(brandDir, `${key}.svg`), svg, "utf8");
  manifest[key] = {
    src: `/images/brands/${key}.svg`, width: 24, height: 24,
    title: icon.title, sourceUrl: `https://simpleicons.org/?q=${slug}`, ...LICENSE,
  };
}

if (missing.length) {
  console.error(`simple-icons has no mark for:\n  ${missing.join("\n  ")}`);
  console.error("Remove the entry from BRAND_SLUGS or move it to OWNED_BRAND_PNGS.");
  process.exit(1);
}

writeFileSync(
  join(root, "lib", "media", "brand-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`, "utf8",
);
console.log(`wrote ${Object.keys(manifest).length} brand marks to public/images/brands/`);
