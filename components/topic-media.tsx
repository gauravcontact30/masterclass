import Image from "next/image";
import { brandAssetFor } from "@/lib/media";
import { creditLine } from "@/lib/media/types";
import { SubjectArtwork, hasSubjectArtwork } from "./subject-artwork";
import { SearchSectionIcon } from "./search-section-icon";
import styles from "./topic-media.module.css";

export { SubjectArtwork, hasSubjectArtwork } from "./subject-artwork";

/**
 * The logo for a technology, or a semantic icon when no logo is available.
 *
 * Every mark is a local file — simple-icons SVGs generated into
 * `public/images/brands/`, or one of the four PNGs the project owns — so
 * nothing here reaches out to a third-party CDN at render time and no remote
 * pattern has to be opened up in `next.config.ts`.
 *
 * `unoptimized` is deliberate: these are 24x24 single-path SVGs that the image
 * optimizer would refuse anyway without `dangerouslyAllowSVG`, and re-encoding
 * a 400-byte vector as a raster would be slower and worse-looking than serving
 * the file.
 */
export function BrandMark({ label, size = 16, className }: { label: string; size?: number; className?: string }) {
  const asset = brandAssetFor(label);
  if (!asset) return <SearchSectionIcon title={label} size={size}
    className={className ? `${styles.mark} ${className}` : styles.mark} />;
  const isVector = asset.src.endsWith(".svg");
  return <Image
    className={className ? `${styles.mark} ${className}` : styles.mark}
    src={asset.src} alt="" aria-hidden width={size} height={size}
    unoptimized={isVector}
  />;
}

/**
 * A brand mark where one exists, otherwise the caller's existing glyph.
 *
 * The 54 tracks and API packages each carry an emoji chosen before any logos
 * were available. About half of them name a product simple-icons draws, and
 * those read better as the real mark; the rest are themes ("System Design",
 * "AI Agents") or libraries with no published icon, and keep their emoji. One
 * helper rather than the same ternary on four screens.
 */
export function BrandOrGlyph({ label, glyph, size = 16 }: { label: string; glyph: string; size?: number }) {
  const asset = brandAssetFor(label);
  if (!asset) return <>{glyph}</>;
  return <BrandMark label={label} size={size} />;
}

/** Whether any artwork exists for this pair, so a caller can keep its own fallback. */
export function hasTopicMedia(label: string, catalogueId?: string): boolean {
  return Boolean(brandAssetFor(label)) || Boolean(catalogueId && hasSubjectArtwork(catalogueId));
}

/**
 * The cover for a catalogue or handbook panel.
 *
 * A technology gets its logo; a school subject gets its drawn scene. When the
 * label is neither — an "AI terms" glossary, say — a semantic icon keeps the
 * heading's cover visible even when no brand asset exists.
 *
 * A credit line appears only for the CC-BY family. The generated brand marks
 * are CC0 and the subject scenes are the project's own, so in practice nothing
 * ships a credit today; the branch stays because the manifest is built to carry
 * CC-BY assets and the obligation must not be something a future asset can slip
 * past.
 */
export function TopicCover({ label, catalogueId, className }: { label: string; catalogueId?: string; className?: string }) {
  const asset = brandAssetFor(label);
  const wrapper = className ? `${styles.cover} ${className}` : styles.cover;

  if (asset) {
    const credit = creditLine(asset);
    return <div className={wrapper}>
      <Image src={asset.src} alt="" aria-hidden width={44} height={44}
        className={styles.coverMark} unoptimized={asset.src.endsWith(".svg")} />
      {credit && <small className={styles.credit}>{credit}</small>}
    </div>;
  }

  if (catalogueId && hasSubjectArtwork(catalogueId)) {
    return <div className={wrapper}>
      <SubjectArtwork id={catalogueId} title={label} className={styles.coverArt} />
    </div>;
  }

  return <div className={wrapper}>
    <BrandMark label={label} size={44} className={styles.coverMark} />
  </div>;
}
