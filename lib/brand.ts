/**
 * The Master Class Buddy logo (48×48), shared by every place that draws it: components/brand-mark.tsx,
 * app/apple-icon.tsx, the Open Graph cards and scripts/generate-brand-assets.mjs (app/icon.svg, public/brand/*).
 * Two overlapping speech bubbles (the learner and their buddy in conversation); in the front one an open book whose
 * two pages make the M, a learner above its spine, and a gold guiding star. Solid fills only, so any number of copies
 * render on one page and in Open Graph images.
 */
export const BRAND_PATHS = {
  ink: "#1f1e1c",
  paper: "#faf9f5",
  terracotta: "#d97757",
  gold: "#f2b84b",
  /** The buddy's bubble, behind and to the lower right, tail on the right. */
  back: "M19 9h15a11 11 0 0 1 11 11v12.5a11 11 0 0 1-6.4 10l.9 4.3c.2 1-.9 1.7-1.7 1.1l-5-3.9H19a11 11 0 0 1-11-11V20A11 11 0 0 1 19 9z",
  /** The learner's bubble in front, tail on the left. */
  front: "M14 3h17a11 11 0 0 1 11 11v13a11 11 0 0 1-11 11H15.4l-6.6 5.2c-.8.6-1.9 0-1.8-1l.5-5.6A11 11 0 0 1 3 27V14A11 11 0 0 1 14 3z",
  /** The book's left and right pages, which together read as an M. */
  pageLeft: "M10.5 30.5V14.8c0-.8.9-1.3 1.6-.8l10.4 7.6v12.2l-11.1-2.4a1.2 1.2 0 0 1-.9-.9z",
  pageRight: "M34.5 30.5V14.8c0-.8-.9-1.3-1.6-.8l-10.4 7.6v12.2l11.1-2.4a1.2 1.2 0 0 0 .9-.9z",
  head: { cx: 22.5, cy: 11, r: 2.6 },
  star: "M39.6 4.2l.9 2.5 2.5.9-2.5.9-.9 2.5-.9-2.5-2.5-.9 2.5-.9z",
} as const;

export const BRAND_NAME = "Master Class Buddy";

/** The whole mark as SVG markup (no <svg> wrapper). */
export function brandArtwork() {
  const p = BRAND_PATHS;
  return `<path d="${p.back}" fill="${p.terracotta}"/><path d="${p.front}" fill="${p.ink}"/><path d="${p.pageLeft}" fill="${p.paper}"/><path d="${p.pageRight}" fill="${p.gold}"/><circle cx="${p.head.cx}" cy="${p.head.cy}" r="${p.head.r}" fill="${p.terracotta}"/><path d="${p.star}" fill="${p.gold}"/>`;
}

/** The mark as a standalone SVG document (favicons, generated PNGs). */
export function brandSvg(size = 48) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48" fill="none">${brandArtwork()}</svg>`;
}
