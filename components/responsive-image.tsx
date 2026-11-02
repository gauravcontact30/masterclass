"use client";

import Image, { type ImageProps } from "next/image";
import { localImage, losslessImageLoader } from "@/lib/responsive-image-loader";

/** Site-wide local images use prebuilt, lossless responsive files. Other sources retain Next's existing policy. */
export default function ResponsiveImage(props: ImageProps) {
  const src = typeof props.src === "string" ? props.src : null;
  const managed = src ? localImage(src) : undefined;
  // Tiny originals have no smaller variants. Serving them directly avoids generating an identical srcset
  // (and Next's missing-loader-width warning) for every small technology icon.
  const originalOnly = managed && managed.sizes.length === 0 && !props.loader;
  return <Image {...props} alt={props.alt} unoptimized={props.unoptimized ?? !!originalOnly} loader={props.loader ?? (managed && !originalOnly ? losslessImageLoader : undefined)} />;
}
