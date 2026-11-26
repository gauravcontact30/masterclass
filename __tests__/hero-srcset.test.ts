import { uniqueSrcSet } from "@/components/landing-slider";
import { localImage } from "@/lib/responsive-image-loader";

const portrait = "/images/landing/hero-interviews-ads9-portrait.webp";

test("a hero srcset lists each file once, at its real width", () => {
  const { hash, width } = localImage(portrait)!;
  const raw = [`/images/responsive/${hash}/320.webp 32w`, `/images/responsive/${hash}/320.webp 256w`, `/images/responsive/${hash}/480.webp 384w`,
    `/images/responsive/${hash}/720.webp 720w`, `${portrait} 960w`, `${portrait} 1080w`, `${portrait} 3840w`].join(", ");
  expect(uniqueSrcSet(raw, portrait)).toBe(`/images/responsive/${hash}/320.webp 320w, /images/responsive/${hash}/480.webp 480w, /images/responsive/${hash}/720.webp 720w, ${portrait} ${width}w`);
  expect(uniqueSrcSet(undefined, portrait)).toBeUndefined();
});
