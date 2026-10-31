import type { ImgHTMLAttributes } from "react";
import { localImage, losslessImageLoader } from "@/lib/responsive-image-loader";

/** Native content pictures keep their fallbacks and remote-source behaviour, with local responsive delivery. */
export function ContentImage({ src, alt, sizes = "(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 640px", ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const entry = typeof src === "string" ? localImage(src) : undefined;
  const srcSet = entry && typeof src === "string" ? [...new Set([...entry.sizes, entry.width])].map(width => `${losslessImageLoader({ src, width })} ${width}w`).join(", ") : undefined;
  // External sources and animations remain byte-for-byte originals; never invent a proxy URL for an unknown host.
  // eslint-disable-next-line @next/next/no-img-element -- build-time lossless srcset, including the original resolution.
  return <img loading="lazy" decoding="async" width={entry?.width} height={entry?.height} {...props} src={src} alt={alt} srcSet={props.srcSet ?? srcSet} sizes={srcSet || props.srcSet ? sizes : undefined} />;
}
