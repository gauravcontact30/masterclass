import { BRAND_PATHS as P } from "@/lib/brand";

/**
 * The Master Class Buddy mark (lib/brand.ts): two overlapping speech bubbles, an open book whose pages make the M, a
 * learner above it and a gold star. Solid fills only, so it renders the same in any number of copies, in Open Graph
 * images and on light or dark grounds.
 */
export function BrandMark({ size = 36, className }: { size?: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 48 48" className={`brand-mark ${className ?? ""}`} aria-hidden="true" focusable="false" fill="none">
    <path d={P.back} fill={P.terracotta} />
    <path d={P.front} fill={P.ink} />
    <path d={P.pageLeft} fill={P.paper} />
    <path d={P.pageRight} fill={P.gold} />
    <circle cx={P.head.cx} cy={P.head.cy} r={P.head.r} fill={P.terracotta} />
    <path d={P.star} fill={P.gold} />
  </svg>;
}

/** The lockup: the mark beside "masterclass" (one lowercase word, "class" bold in terracotta), with BUDDY set beneath
 *  between two hairlines. Same footprint as the earlier one-line wordmark (36px mark, the same type size). */
export function Wordmark({ className }: { className?: string }) {
  return <span className={`brand-lockup ${className ?? ""}`}>
    <BrandMark />
    <span className="brand-name"><span className="brand-title">master<b>class</b></span>{/* A flex container drops this space visually, but assistive tech reads "masterclass Buddy", so link labels can contain it. */" "}<span className="brand-buddy">Buddy</span></span>
  </span>;
}
