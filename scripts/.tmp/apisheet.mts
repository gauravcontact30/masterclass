// Contact sheet of published API pictures: npx tsx apisheet.mts <out.png> <pkg,...>
import sharp from "sharp";
import { API_PACKAGES } from "../../lib/api-docs";
import { learningImageSlug } from "../../lib/learning-image";
const [out, ids] = process.argv.slice(2);
const base = `${process.env.NEXT_PUBLIC_LEARNING_IMAGE_BASE}/api/`;
const tiles: { label: string; buf: Buffer }[] = [];
for (const id of ids.split(",")) {
  const pkg = API_PACKAGES.find(p => p.id === id)!;
  for (const [label, parts] of [[pkg.name, [pkg.id]] as const, ...pkg.entries.map(e => [`${pkg.name}: ${e.name}`, [pkg.id, e.name]] as const)]) {
    const r = await fetch(base + learningImageSlug(...parts) + ".webp");
    if (r.ok) tiles.push({ label: label.slice(0, 44), buf: await sharp(Buffer.from(await r.arrayBuffer())).resize(330, 220).toBuffer() });
  }
}
const cols = 4, w = 340, h = 248, esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
await sharp({ create: { width: cols * w, height: Math.max(1, Math.ceil(tiles.length / cols)) * h, channels: 3, background: "#fff" } })
  .composite(tiles.flatMap((t, i) => [{ input: t.buf, left: (i % cols) * w + 5, top: Math.floor(i / cols) * h + 4 }, { input: Buffer.from(`<svg width="330" height="22"><text x="1" y="15" font-family="Arial" font-size="13">${esc(t.label)}</text></svg>`), left: (i % cols) * w + 5, top: Math.floor(i / cols) * h + 225 }]))
  .png().toFile(out);
console.log(`${tiles.length} pictures`);
