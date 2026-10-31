"use client";

import Image, { type ImageProps } from "next/image";
import { localImage, losslessImageLoader } from "@/lib/responsive-image-loader";

/** Site-wide local images use prebuilt, lossless responsive files. Other sources retain Next's existing policy. */
export default function ResponsiveImage(props: ImageProps) {
  const src = typeof props.src === "string" ? props.src : null;
  const managed = src ? localImage(src) : undefined;
  return <Image {...props} alt={props.alt} loader={props.loader ?? (managed ? losslessImageLoader : undefined)} />;
}
