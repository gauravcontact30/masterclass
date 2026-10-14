// Contact sheet of published Search-tab pictures, in tab order: npx tsx sheet.ts <out.png> [tabs...]
import sharp from "sharp";
import { aiTerms } from "../../lib/pro-learn/ai-glossary";
import { pythonTopics } from "../../lib/pro-learn/python-handbook";
import { TECHNOLOGY_HANDBOOKS } from "../../lib/pro-learn/technology-handbooks";
import { learningImageSlug } from "../../lib/learning-image";
const [out, ...want] = process.argv.slice(2);
const base = `${process.env.NEXT_PUBLIC_LEARNING_IMAGE_BASE}/topics/`;
const tabs = [["AI terms", "AI terms worth knowing", aiTerms()], ["Python", "Python handbook", pythonTopics()], ...TECHNOLOGY_HANDBOOKS.map(b => [b.title, b.title, b.topics])] as [string, string, { name: string; vocabulary?: unknown }[]][];
const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const tiles: { label: string; buf: Buffer }[] = [];
for (const [cat, title, items] of tabs.sort((a, b) => a[1].localeCompare(b[1]))) {
  if (want.length && !want.includes(title)) continue;
  for (const item of items.filter(i => !i.vocabulary)) {
    const r = await fetch(base + learningImageSlug(cat, item.name) + ".webp");
    if (!r.ok) continue;
    tiles.push({ label: `${title.slice(0, 22)}: ${item.name}`.slice(0, 46), buf: await sharp(Buffer.from(await r.arrayBuffer())).resize(330, 220).toBuffer() });
  }
}
const cols = 4, w = 340, h = 248;
await sharp({ create: { width: cols * w, height: Math.max(1, Math.ceil(tiles.length / cols)) * h, channels: 3, background: "#fff" } })
  .composite(tiles.flatMap((t, i) => [{ input: t.buf, left: (i % cols) * w + 5, top: Math.floor(i / cols) * h + 4 }, { input: Buffer.from(`<svg width="330" height="22"><text x="1" y="15" font-family="Arial" font-size="13">${esc(t.label)}</text></svg>`), left: (i % cols) * w + 5, top: Math.floor(i / cols) * h + 225 }]))
  .png().toFile(out);
console.log(`${tiles.length} pictures`);
