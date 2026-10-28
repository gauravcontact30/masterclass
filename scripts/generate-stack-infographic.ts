/**
 * Paints the landing hero's first slide: "The technology universe", a full-bleed bento infographic of every technology
 * MasterClass Buddy teaches (lib/deep-courses/catalog.ts), one tile per family with its real logos and every course name.
 * The AI Gateway (openai/gpt-image-2) paints the backdrop; logos, names and headline are composited on top, because
 * image models misspell words and invent logos.
 * Writes hero-stack-portrait.webp (1080×1920, phones). The landscape slide is now the 4K one from
 * scripts/generate-hero-variants.ts (variant a); this script no longer writes it. The portrait is
 * cover-cropped and slowly zoomed like the other slides, so every word stays inside the frame's safe zone.
 * Run: npx tsx --env-file=.env scripts/generate-stack-infographic.ts [--reuse]   (--reuse keeps the painted backdrops)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import sharp, { type OverlayOptions } from "sharp";
import { gateway, generateImage } from "ai";
import * as simpleIcons from "simple-icons";
import { COURSE_CATALOG } from "../lib/deep-courses/catalog";

type Family = { name: string; accent: string; courses: { id: string; name: string }[] };

// One accent per family, in catalogue order.
const ACCENTS = ["#fdba74", "#c4b5fd", "#7dd3fc", "#fcd34d", "#86efac", "#f9a8d4", "#a5b4fc", "#5eead4", "#fda4af", "#bef264", "#93c5fd", "#fca5a5", "#67e8f9"];
const FAMILIES: Family[] = [];
for (const course of COURSE_CATALOG) {
  let family = FAMILIES.find(item => item.name === course.familyName);
  if (!family) FAMILIES.push(family = { name: course.familyName, accent: ACCENTS[FAMILIES.length % ACCENTS.length], courses: [] });
  family.courses.push({ id: course.id, name: course.name });
}
const family = (name: string) => { const found = FAMILIES.find(item => item.name === name); if (!found) throw new Error(`No family ${name}`); return found; };

const BACKDROP = "Abstract premium backdrop for a keynote infographic: deep graphite and midnight-navy darkness, soft volumetric light in warm terracotta orange from the top left and violet from the bottom right, a very subtle perspective grid floor fading into the dark, a few out-of-focus translucent glass prisms near the outer edges catching the light, fine film grain, calm and even across the whole centre, cinematic and high-end. Absolutely no text, letters, numbers, logos, icons, symbols, user interface or watermarks.";
const FONT = "'Segoe UI', 'Inter', Arial, sans-serif";
const esc = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;");

/* ── Logos: the site's own brand files first, then simple-icons in the brand's colour ── */
type Icon = { title: string; slug: string; hex: string; svg: string };
const ICONS = (Object.values(simpleIcons) as Partial<Icon>[]).filter((icon): icon is Icon => Boolean(icon?.title && icon.slug && icon.svg));
const norm = (text: string) => text.toLowerCase().replace(/\+/g, "plus").replace(/\./g, "dot").replace(/[^a-z0-9]/g, "");
const luminance = (hex: string) => { const n = parseInt(hex, 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
function logoSource(course: { id: string; name: string }): string | null {
  // The site's 64 px logos are the ones it shows everywhere, and sharp at this size.
  if (existsSync(`public/images/tech/${course.id}.png`)) return `public/images/tech/${course.id}.png`;
  if (existsSync(`public/images/brands/${course.id}.svg`)) return `public/images/brands/${course.id}.svg`;
  const key = norm(course.name.replace(/ (16|19)\+$/, "").replace(/ Services$/, ""));
  const icon = ICONS.find(item => norm(item.title) === key || item.slug === key);
  // White or near-white brand colours would vanish on the white logo tile.
  return icon ? icon.svg.replace("<svg ", `<svg fill="${luminance(icon.hex) > 0.85 ? "#1f1e1c" : `#${icon.hex}`}" `) : null;
}
async function logo(source: string, size: number) {
  const svg = source.startsWith("<svg") ? Buffer.from(source) : source.endsWith(".svg") ? readFileSync(source) : null;
  const input = svg ? sharp(svg, { density: Math.ceil(72 * size / 24) * 2 }) : sharp(source);
  return input.resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: "lanczos3" }).png().toBuffer();
}
/** False for a logo that would be invisible on its white tile (a white or transparent mark). */
async function visible(png: Buffer) {
  // stats() reads a pipeline's input, so flatten first and measure the result.
  const { channels } = await sharp(await sharp(png).flatten({ background: "#ffffff" }).toBuffer()).stats();
  return channels.slice(0, 3).some(channel => channel.mean < 244);
}
// Tile labels short enough for a one-column tile.
const SHORT: Record<string, string> = { "Languages & fundamentals": "Languages", "State & data on the client": "Client state", "Validation & forms": "Validation" };

/** Course names joined with " · ", wrapped at the separators to fit `chars` characters a line. */
function wrap(names: string[], chars: number) {
  const lines: string[] = [];
  let line = "";
  for (const name of names) {
    const next = line ? `${line} · ${name}` : name;
    if (line && next.length > chars) { lines.push(`${line} ·`); line = name; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

async function backdrop(file: string, size: "1536x1024" | "1024x1536", reuse: boolean) {
  if (reuse && existsSync(file)) return readFileSync(file);
  const { image } = await generateImage({ model: gateway.image("openai/gpt-image-2"), prompt: BACKDROP, size, providerOptions: { openai: { quality: "high" } } });
  const png = Buffer.from(image.uint8Array);
  writeFileSync(file, png);
  return png;
}

type Tile = { family: Family; x: number; y: number; w: number; h: number };
type Layout = {
  width: number; height: number; out: string;
  head: { x: number; y: number; size: number; lines: string[]; sub?: string };
  tiles: Tile[];
  /** Type sizes; `inline` puts the logos at the right of the family name instead of on their own row. */
  name: number; text: number; logo: number; inline: boolean; pad: number;
};

async function compose(art: Buffer, layout: Layout) {
  const { width, height, head, tiles, name, text, logo: logoSize, inline, pad } = layout;
  const svg: string[] = [];
  const overlays: OverlayOptions[] = [];
  svg.push(`<defs><linearGradient id="wash" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05060f" stop-opacity=".62"/><stop offset=".45" stop-color="#05060f" stop-opacity=".38"/><stop offset="1" stop-color="#05060f" stop-opacity=".66"/></linearGradient></defs>`);
  svg.push(`<rect width="${width}" height="${height}" fill="url(#wash)"/>`);
  svg.push(`<text x="${head.x}" y="${head.y}" font-family="${FONT}" font-size="${Math.round(head.size * .4)}" font-weight="700" letter-spacing="${head.size * .1}" fill="#fdba74">MASTERCLASS BUDDY · THE TECHNOLOGY UNIVERSE</text>`);
  head.lines.forEach((line, i) => svg.push(`<text x="${head.x}" y="${head.y + head.size * (1.18 + i * 1.08)}" font-family="${FONT}" font-size="${head.size}" font-weight="700" letter-spacing="-.5" fill="#ffffff">${esc(line)}</text>`));
  if (head.sub) svg.push(`<text x="${head.x}" y="${head.y + head.size * (1.18 + head.lines.length * 1.08) + head.size * .2}" font-family="${FONT}" font-size="${Math.round(head.size * .38)}" font-weight="500" fill="#ffffff" fill-opacity=".72">${esc(head.sub)}</text>`);

  // Segoe UI's average glyph is about half its size; course names are mostly lower case.
  const charWidth = text * 0.5;
  for (const { family: f, x, y, w, h } of tiles) {
    svg.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.round(pad * 1.15)}" fill="#ffffff" fill-opacity=".07" stroke="#ffffff" stroke-opacity=".16" stroke-width="1.4"/>`);
    svg.push(`<rect x="${x + pad}" y="${y}" width="${Math.min(w * .32, 120)}" height="4" rx="2" fill="${f.accent}"/>`);
    const label = w < width / 5 ? SHORT[f.name] ?? f.name : f.name;
    const titleY = y + pad + name * .95;
    svg.push(`<text x="${x + pad}" y="${titleY}" font-family="${FONT}" font-size="${name}" font-weight="700" fill="${f.accent}">${esc(label)}</text>`);
    svg.push(`<text x="${x + w - pad}" y="${titleY}" text-anchor="end" font-family="${FONT}" font-size="${Math.round(name * .72)}" font-weight="600" fill="#ffffff" fill-opacity=".55">${f.courses.length}</text>`);
    const sources: Buffer[] = [];
    for (const course of f.courses) { const source = logoSource(course); if (!source) continue; const png = await logo(source, logoSize); if (await visible(png)) sources.push(png); }
    const box = Math.round(logoSize * 1.25), step = box + Math.round(box * .22);
    let textTop: number;
    if (inline) {
      // Logos sit right of the family name, before the count.
      const nameWidth = label.length * name * .56;
      const room = w - pad * 2 - nameWidth - name * 1.4;
      const count = Math.max(0, Math.min(sources.length, Math.floor(room / step)));
      const startX = x + w - pad - name * 1.2 - count * step;
      const top = Math.round(titleY - name * .72 - (box - name * .9) / 2);
      for (let i = 0; i < count; i++) {
        const left = Math.round(startX + i * step);
        svg.push(`<rect x="${left}" y="${top}" width="${box}" height="${box}" rx="${box * .26}" fill="#ffffff"/>`);
        overlays.push({ input: sources[i], left: Math.round(left + (box - logoSize) / 2), top: Math.round(top + (box - logoSize) / 2) });
      }
      textTop = titleY + name * .25;
    } else {
      const count = Math.min(sources.length, Math.floor((w - pad * 2 + box * .22) / step));
      const top = Math.round(titleY + name * .6);
      for (let i = 0; i < count; i++) {
        const left = Math.round(x + pad + i * step);
        svg.push(`<rect x="${left}" y="${top}" width="${box}" height="${box}" rx="${box * .26}" fill="#ffffff"/>`);
        overlays.push({ input: sources[i], left: Math.round(left + (box - logoSize) / 2), top: Math.round(top + (box - logoSize) / 2) });
      }
      textTop = top + box;
    }
    const lines = wrap(f.courses.map(course => course.name), Math.floor((w - pad * 2) / charWidth));
    const lineHeight = text * 1.4;
    const last = textTop + lines.length * lineHeight + pad * .6;
    if (last > y + h) console.warn(`overflow: ${f.name} in ${layout.out} by ${Math.round(last - y - h)} px`);
    lines.forEach((line, i) => svg.push(`<text x="${x + pad}" y="${textTop + lineHeight * (i + 1)}" font-family="${FONT}" font-size="${text}" font-weight="500" fill="#ffffff" fill-opacity=".9">${esc(line)}</text>`));
  }

  const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${svg.join("")}</svg>`);
  const webp = await sharp(art).resize(width, height, { fit: "cover", kernel: "lanczos3" })
    .composite([{ input: overlay }, ...overlays]).webp({ quality: 88, effort: 6 }).toBuffer();
  writeFileSync(layout.out, webp);
  console.log(`ok ${layout.out} ${(webp.length / 1024).toFixed(0)} KB`);
}

/** Rows of [family, span] packed into a grid of `columns` between x0..x1 and y0..y1. */
function grid(rows: [string, number][][], columns: number, x0: number, x1: number, y0: number, y1: number, gap: number): Tile[] {
  const cw = (x1 - x0 - gap * (columns - 1)) / columns, rh = (y1 - y0 - gap * (rows.length - 1)) / rows.length;
  return rows.flatMap((row, r) => {
    let col = 0;
    return row.map(([name, span]) => {
      const tile = { family: family(name), x: Math.round(x0 + col * (cw + gap)), y: Math.round(y0 + r * (rh + gap)), w: Math.round(cw * span + gap * (span - 1)), h: Math.round(rh) };
      col += span;
      return tile;
    });
  });
}

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) throw new Error("AI_GATEWAY_API_KEY must be set.");
  const reuse = process.argv.includes("--reuse");
  // The raw paintings are kept out of public/ so a layout tweak can rerun without painting again.
  mkdirSync(".cache/hero-stack", { recursive: true });
  const [wide, tall] = await Promise.all([
    backdrop(".cache/hero-stack/universe-wide.png", "1536x1024", reuse),
    backdrop(".cache/hero-stack/universe-tall.png", "1024x1536", reuse),
  ]);
  const total = COURSE_CATALOG.length;
  const sub = `${FAMILIES.length} families, every course topic by topic: syntax, examples, assignments and interview questions.`;

  // Landscape: cover-cropped to 1440×900 it loses ~96 px a side, the zoom another ~4%, the navbar the top ~150 px and
  // the slide controls the bottom ~150 px, so everything sits inside x 170-1750, y 160-915.
  if (process.argv.includes("--landscape-1080")) await compose(wide, {
    width: 1920, height: 1080, out: "public/images/landing/hero-stack.webp",
    head: { x: 170, y: 172, size: 46, lines: [`${total} technologies. One place to master them.`], sub },
    tiles: grid([
      [["AI & agents", 2], ["Java, C++ & DSA", 2], ["Frontend frameworks", 1], ["Languages & fundamentals", 1]],
      [["Python data & ML", 2], ["Databases & storage", 2], ["Backend & APIs", 1], ["Testing & quality", 1]],
      [["Cloud, ops & architecture", 2], ["State & data on the client", 1], ["Validation & forms", 1], ["Authentication", 1], ["HTTP & scraping", 1]],
    ], 6, 170, 1750, 300, 915, 14),
    name: 21, text: 17, logo: 30, inline: false, pad: 20,
  });

  // Portrait for phones, shown at about 0.44× on a 390×844 screen: cover-cropping trims ~100 px a side, the slide
  // controls cover image y > ~1620 and the Tech Buzz button image x > ~560 at y 205-310, so the headline breaks in two.
  await compose(tall, {
    width: 1080, height: 1920, out: "public/images/landing/hero-stack-portrait.webp",
    head: { x: 116, y: 168, size: 36, lines: [`${total} technologies.`, "One place to master them."] },
    tiles: grid([
      [["AI & agents", 2]], [["Frontend frameworks", 1], ["Languages & fundamentals", 1]], [["Python data & ML", 2]],
      [["Backend & APIs", 1], ["Validation & forms", 1]], [["Java, C++ & DSA", 2]], [["Testing & quality", 2]], [["Databases & storage", 2]],
      [["State & data on the client", 1], ["HTTP & scraping", 1]], [["Cloud, ops & architecture", 2]], [["Authentication", 2]],
    ], 2, 116, 964, 296, 1604, 12),
    name: 23, text: 20, logo: 22, inline: true, pad: 15,
  });
}
void main().catch(error => { console.error(String(error).slice(0, 400)); process.exitCode = 1; });
