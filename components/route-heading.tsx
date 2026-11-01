"use client";

import { useLayoutEffect, useState, type HTMLAttributes } from "react";

/**
 * A page's main heading. With Cache Components, Next.js keeps up to 3 visited routes in the document, hidden with
 * display: none (node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md), so after /sign-in → / the page
 * held two <h1>s and browser-based SEO checkers flagged it. While its route is hidden this renders no <h1>; the cleanup
 * runs when Activity hides the route, and the effect restores the heading before the route paints again.
 */
export function RouteH1(props: HTMLAttributes<HTMLHeadingElement>) {
  const [active, setActive] = useState(true);
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- must restore the <h1> before the re-shown route paints.
    setActive(true);
    return () => setActive(false);
  }, []);
  return active ? <h1 {...props} /> : <div {...props} />;
}
