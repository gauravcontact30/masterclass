/** @jest-environment node */
import { existsSync } from "node:fs";
import { join } from "node:path";
import images from "@/lib/responsive-images.json";
import { losslessImageLoader } from "@/lib/responsive-image-loader";

test("responsive variants exist, never exceed source resolution, and preserve a full-resolution fallback", () => {
  expect(Object.keys(images).length).toBeGreaterThan(200);
  for (const [src, entry] of Object.entries(images)) {
    expect(existsSync(join(process.cwd(), "public", src))).toBe(true);
    expect(entry.sizes).toEqual([...entry.sizes].sort((a, b) => a - b));
    for (const width of entry.sizes) {
      expect(width).toBeLessThanOrEqual(entry.width);
      expect(existsSync(join(process.cwd(), "public", losslessImageLoader({ src, width })))).toBe(true);
    }
    if (entry.sizes.at(-1) !== entry.width) expect(losslessImageLoader({ src, width: entry.width * 2 })).toBe(src);
  }
});

test("a requested width rounds up, and unknown sources remain untouched", () => {
  const src = "/images/landing/hero-interviews-ads9.webp";
  expect(losslessImageLoader({ src, width: 641 })).toMatch(/\/720.webp$/);
  expect(losslessImageLoader({ src: "https://example.com/picture.png", width: 320 })).toBe("https://example.com/picture.png");
});
