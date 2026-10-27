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

/** Public files in Supabase Storage (Tech Buzz daily covers): resized by next/image (next.config.ts remotePatterns). */
export const isSupabaseStorage = (src: string) => /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//.test(src);
/** A remote image next/image cannot resize: any host that is neither Unsplash nor Supabase Storage. */
export const unoptimizedRemote = (src: string) => /^https?:/.test(src) && !isUnsplash(src) && !isSupabaseStorage(src);
