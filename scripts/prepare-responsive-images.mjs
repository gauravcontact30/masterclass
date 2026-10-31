import { createHash } from "node:crypto";
import { readdir, readFile, writeFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Originals are never rewritten, and the native resolution is always the untouched original. Smaller widths are
// resized only downwards and encoded losslessly; when lossless is not smaller than the original (most photographic
// WebP sources), they fall back to visually lossless WebP q90, so phones still get a file sized for their screen.
// A variant is kept only when it transfers fewer bytes. Content-addressed URLs are safe to cache immutably.
const root = path.resolve("public");
const output = path.join(root, "images/responsive");
// Kept equal to next.config.ts images.deviceSizes; 720 and 1080 are common phone widths at 2x and 3x.
const widths = [320, 480, 640, 720, 960, 1080, 1280, 1920, 2560, 3840];
const manifest = {};
const previous = await readFile("lib/responsive-images.json", "utf8").then(JSON.parse).catch(() => ({}));
sharp.concurrency(2);
async function files(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (file === output) continue;
    if (entry.isDirectory()) result.push(...await files(file));
    else if (/\.(png|jpe?g|webp|avif)$/i.test(file)) result.push(file);
  }
  return result.sort();
}
let generated = 0, reused = 0;
for (const file of await files(root)) {
  const source = await readFile(file);
  const info = await sharp(source).metadata();
  if (!info.width || !info.height) continue;
  const url = `/${path.relative(root, file).split(path.sep).join("/")}`;
  const hash = createHash("sha256").update("responsive-v5:").update(source).digest("hex").slice(0, 20);
  // Animations are always served as the original, so a resize can never drop frames.
  if ((info.pages ?? 1) > 1) {
    manifest[url] = { width: info.width, height: info.height, hash, sizes: [] };
    continue;
  }
  // EXIF orientation 1 is upright; only 5–8 swap the displayed width and height.
  const rotated = [5, 6, 7, 8].includes(info.orientation ?? 1);
  const width0 = rotated ? info.height : info.width, height0 = rotated ? info.width : info.height;
  const cached = previous[url];
  if (cached?.hash === hash && (await Promise.all(cached.sizes.map(width => stat(path.join(output, hash, `${width}.webp`)).then(() => true).catch(() => false)))).every(Boolean)) {
    manifest[url] = cached;
    reused += cached.sizes.length;
    continue;
  }
  const candidates = [];
  for (const width of widths.filter(w => w < width0)) {
    const dest = path.join(output, hash, `${width}.webp`);
    let size;
    try { size = (await stat(dest)).size; reused++; } catch {
      // Upright pixels and the embedded colour profile carry over, so a variant looks exactly like its original.
      const resized = sharp(source).rotate().resize({ width, withoutEnlargement: true }).keepIccProfile();
      // Lossless only ever wins on PNG artwork; re-encoding a lossy photo losslessly is slow and always larger.
      let data = info.format === "png" ? await resized.clone().webp({ lossless: true, effort: 4 }).toBuffer() : null;
      if (!data || data.length >= source.length) data = await resized.clone().webp({ quality: 90, smartSubsample: true, effort: 5 }).toBuffer();
      if (data.length >= source.length) continue;
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, data);
      size = data.length; generated++;
    }
    if (size < source.length) candidates.push(width);
  }
  // A heavyweight original (a near-lossless export of several MB) also gets a visually lossless q90 copy at its own
  // resolution, so even the largest screens never download megabytes for one picture. Kept only when it halves the bytes.
  if (source.length > 400 * 1024) {
    const dest = path.join(output, hash, `${width0}.webp`);
    const size = await stat(dest).then(s => s.size).catch(async () => {
      const data = await sharp(source).rotate().keepIccProfile().webp({ quality: 90, smartSubsample: true, effort: 5 }).toBuffer();
      if (data.length * 2 > source.length) return Infinity;
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, data);
      generated++;
      return data.length;
    });
    if (size * 2 <= source.length) candidates.push(width0);
  }
  manifest[url] = { width: width0, height: height0, hash, sizes: candidates };
}
await writeFile("lib/responsive-images.json", JSON.stringify(manifest));
console.log(`Responsive images: ${Object.keys(manifest).length} originals indexed; ${generated} variants generated, ${reused} reused. Originals preserved.`);
