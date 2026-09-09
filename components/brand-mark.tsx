/*
 * MasterClass's short logo.
 *
 * Two stacked guide pages with a spark on the front one: the same object the
 * landing hero shows and the same gold head-rule every generated document
 * carries (lib/generation/render.ts), compressed to something that still reads
 * at 20px. It says what the product does — printed study guides — rather than
 * spelling initials.
 *
 * Colours are inherited: `currentColor` paints the pages, so the mark works on
 * the indigo nav, on paper, and in the favicon without a second variant.
 */
export function BrandMark({ size = 26, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className ? `brand-mark ${className}` : "brand-mark"} role="presentation" aria-hidden focusable="false">
      {/* Back page, tilted away. */}
      <g transform="rotate(-9 13 17)" opacity=".45">
        <rect x="5" y="6" width="15" height="21" rx="2.5" fill="currentColor" />
      </g>
      {/* Front page, with the head-rule the real documents print. */}
      <rect x="10" y="4" width="16" height="22" rx="2.5" fill="currentColor" />
      <rect x="10" y="4" width="16" height="3.4" rx="1.7" fill="#e0a94a" />
      {/* Body lines, so the page reads as a written guide, not a blank card. */}
      <g fill="#1b1436" opacity=".34">
        <rect x="13" y="12" width="10" height="1.6" rx=".8" />
        <rect x="13" y="16" width="10" height="1.6" rx=".8" />
        <rect x="13" y="20" width="6.5" height="1.6" rx=".8" />
      </g>
      {/* The spark: the wordmark's ✦, kept as the one warm accent. */}
      <path d="M25.5 22.2l1.15 2.65 2.65 1.15-2.65 1.15-1.15 2.65-1.15-2.65L21.7 26l2.65-1.15z" fill="#e0a94a" />
    </svg>
  );
}

/** Full lockup: mark plus name. Used anywhere the old text wordmark was. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={className ? `brand-lockup ${className}` : "brand-lockup"}>
      <BrandMark />
      <span className="brand-name">MasterClass</span>
    </span>
  );
}
