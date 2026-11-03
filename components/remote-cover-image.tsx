"use client";
import type { ImageProps } from "next/image";
import Image from "@/components/responsive-image";
import { isUnsplash, unoptimizedRemote, unsplashLoader } from "@/lib/image-loaders";

/**
 * A story cover that may be remote. The loader is chosen here because a function cannot cross from a server component
 * into a client one: passing unsplashLoader as a prop from a server component fails the whole page's render.
 */
export function RemoteCoverImage({ src, ...props }: Omit<ImageProps, "src" | "loader" | "unoptimized"> & { src: string }) {
  return <Image {...props} src={src} loader={isUnsplash(src) ? unsplashLoader : undefined} unoptimized={unoptimizedRemote(src)} />;
}
