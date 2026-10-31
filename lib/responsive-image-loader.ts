import images from "./responsive-images.json";
import type { ImageLoaderProps } from "next/image";

type Entry = { width: number; height: number; hash: string; sizes: number[] };
const manifest = images as Record<string, Entry>;
export const localImage = (src: string) => manifest[src];

/** Use the first available variant at least as wide as requested; never upscale. Past the widest variant the
 *  original is served, unless the build made a full-resolution copy (only for multi-megabyte originals). */
export function losslessImageLoader({ src, width }: ImageLoaderProps): string {
  const entry = localImage(src);
  const size = entry?.sizes.find(candidate => candidate >= width) ?? (entry?.sizes.at(-1) === entry?.width ? entry?.width : undefined);
  return size ? `/images/responsive/${entry.hash}/${size}.webp` : src;
}
