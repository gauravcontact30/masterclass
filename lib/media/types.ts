/**
 * Licensing metadata travels with every asset.
 *
 * The app ships other people's artwork, so each file has to be able to say
 * where it came from and under what terms. A CC-BY or CC-BY-SA asset has to
 * show its credit next to the image; CC0 and public-domain assets do not, but
 * we still record the provenance so a later reviewer can retrace it.
 */
export type MediaLicense =
  | "CC0-1.0"
  | "CC-BY-4.0"
  | "CC-BY-SA-4.0"
  | "CC-BY-SA-3.0"
  | "public-domain"
  | "project-owned";

/** The licenses that oblige us to print a credit line beside the image. */
const ATTRIBUTION_REQUIRED: ReadonlySet<MediaLicense> = new Set<MediaLicense>([
  "CC-BY-4.0", "CC-BY-SA-4.0", "CC-BY-SA-3.0",
]);

export type MediaAsset = {
  /** Path under `public/`, so it is also the `src` a browser requests. */
  src: string;
  width: number;
  height: number;
  license: MediaLicense;
  /** Human-readable license name, for the credit line. */
  licenseName?: string;
  licenseUrl?: string;
  /** Where the file was obtained, so provenance survives a re-download. */
  sourceUrl?: string;
  /** Creator as the source names them — required for the CC-BY family. */
  creator?: string;
  /** The work's own title at the source. */
  title?: string;
};

/** Whether this asset's license makes a visible credit line mandatory. */
export function needsAttribution(asset: MediaAsset): boolean {
  return ATTRIBUTION_REQUIRED.has(asset.license);
}

/**
 * The one-line credit shown under an image, or null when none is required.
 *
 * Wikimedia's own reuse guidance asks for title, creator and license, so that
 * is the order here; anything the manifest is missing is simply left out
 * rather than rendered as an empty fragment.
 */
export function creditLine(asset: MediaAsset): string | null {
  if (!needsAttribution(asset)) return null;
  return [asset.title, asset.creator, asset.licenseName ?? asset.license]
    .filter(Boolean).join(" · ");
}
