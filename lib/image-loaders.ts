import type { ImageLoaderProps } from "next/image";

/**
 * Unsplash photos (Tech Buzz covers and avatars) are resized by Unsplash's own CDN: next/image asks for each srcset
 * width and Unsplash returns that width in AVIF/WebP. No next.config remotePatterns entry is needed, so a running dev
 * server never breaks on a config change it has not reloaded.
 */
export function unsplashLoader({ src, width, quality }: ImageLoaderProps) {
  const url = new URL(src);
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 75));
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "crop");
  return url.href;
}

export const isUnsplash = (src: string) => src.startsWith("https://images.unsplash.com/");
