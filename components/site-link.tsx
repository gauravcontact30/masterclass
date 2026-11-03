import NextLink from "next/link";
import type { ComponentProps } from "react";

/**
 * The site's link: next/link without automatic prefetching. A prefetch also preloads the destination's stylesheets, so
 * every link on screen made Chrome warn "preloaded but not used" (13 to 24 files a page in production) and spent the
 * visitor's data on pages they may never open. A link that is worth it can still pass `prefetch` itself.
 */
export default function Link({ prefetch = false, ...props }: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={prefetch} {...props} />;
}
