/**
 * Three 4K (3840×2160) design directions for the landing hero's first slide, all listing every technology in
 * lib/deep-courses/catalog.ts with its real logo. Everything readable (type, logos, tiles) is vector-drawn at full
 * size, so the slide stays sharp on 4K and ultra-wide screens instead of being stretched from 1920×1080:
 *   a  "Midnight bento"  the current layout, redrawn at 4K over a painted backdrop (AI Gateway, openai/gpt-image-2)
 *   b  "Periodic table"  all 76 as element cells, 19 × 4, coloured by family, with a legend
 *   c  "Skyline"         one column per family, tallest first, so the chart itself shows where the depth is
 * Variant a is the live slide (public/images/landing/hero-stack.webp, chosen 2026-10-28); b and c write
 * hero-stack-4k-{b,c}.webp for comparison only.
 * Run: npx tsx --env-file=.env scripts/generate-hero-variants.ts [a|b|c ...] [--reuse]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import sharp, { type OverlayOptions } from "sharp";
import { gateway, generateImage } from "ai";
import * as simpleIcons from "simple-icons";
import { COURSE_CATALOG } from "../lib/deep-courses/catalog";

const W = 3840, H = 2160;
// Safe zone: what survives cover-cropping to 16:10, the slow zoom, the navbar and the slide controls (×2 of 1920 px).
const X0 = 340, X1 = 3500, Y0 = 330, Y1 = 1830;
const FONT = "'Segoe UI', 'Inter', Arial, sans-serif";
const esc = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;");

type Course = { id: string; name: string };
type Family = { name: string; accent: string; courses: Course[] };
const ACCENTS = ["#fdba74", "#c4b5fd", "#7dd3fc", "#fcd34d", "#86efac", "#f9a8d4", "#a5b4fc", "#5eead4", "#fda4af", "#bef264", "#93c5fd", "#fca5a5", "#67e8f9"];
const FAMILIES: Family[] = [];
for (const course of COURSE_CATALOG) {
  let family = FAMILIES.find(item => item.name === course.familyName);
  if (!family) FAMILIES.push(family = { name: course.familyName, accent: ACCENTS[FAMILIES.length % ACCENTS.length], courses: [] });
  family.courses.push({ id: course.id, name: course.name });
}
const familyNamed = (name: string) => { const found = FAMILIES.find(item => item.name === name); if (!found) throw new Error(`No family ${name}`); return found; };
const TOTAL = COURSE_CATALOG.length;

/* ── Logos: vector first (crisp at any size), the site's 64 px PNGs last ── */
type Icon = { title: string; slug: string; hex: string; svg: string };
const ICONS = (Object.values(simpleIcons) as Partial<Icon>[]).filter((icon): icon is Icon => Boolean(icon?.title && icon.slug && icon.svg));
const norm = (text: string) => text.toLowerCase().replace(/\+/g, "plus").replace(/\./g, "dot").replace(/[^a-z0-9]/g, "");
const luminance = (hex: string) => { const n = parseInt(hex, 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
function logoSource(course: Course): string | null {
  if (existsSync(`public/images/brands/${course.id}.svg`)) return `public/images/brands/${course.id}.svg`;
  const key = norm(course.name.replace(/ (16|19)\+$/, "").replace(/ Services$/, ""));
  const icon = ICONS.find(item => norm(item.title) === key || item.slug === key);
  if (icon) return icon.svg.replace("<svg ", `<svg fill="${luminance(icon.hex) > 0.85 ? "#1f1e1c" : `#${icon.hex}`}" `);
  return existsSync(`public/images/tech/${course.id}.png`) ? `public/images/tech/${course.id}.png` : null;
}
const logoCache = new Map<string, Buffer | null>();
/** The course's logo as a transparent PNG of `size` px, or null when there is none or it would vanish on white. */
async function logo(course: Course, size: number): Promise<Buffer | null> {
  const key = `${course.id}:${size}`;
  if (logoCache.has(key)) return logoCache.get(key)!;
  const source = logoSource(course);
  let png: Buffer | null = null;
  if (source) {
    const svg = source.startsWith("<svg") ? Buffer.from(source) : source.endsWith(".svg") ? readFileSync(source) : null;
    const input = svg ? sharp(svg, { density: Math.ceil(72 * size / 24) * 2 }) : sharp(source);
    png = await input.resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: "lanczos3" }).png().toBuffer();
    // stats() reads a pipeline's input, so flatten first and measure the result.
    const { channels } = await sharp(await sharp(png).flatten({ background: "#ffffff" }).toBuffer()).stats();
    if (!channels.slice(0, 3).some(channel => channel.mean < 244)) png = null;
  }
  logoCache.set(key, png);
  return png;
}

/** Words of `text` packed into lines of at most `chars` characters. */
function words(text: string, chars: number) {
  const lines: string[] = [];
  for (const word of text.split(" ")) {
    const last = lines.at(-1);
    if (last && `${last} ${word}`.length <= chars) lines[lines.length - 1] = `${last} ${word}`; else lines.push(word);
  }
  return lines;
}

class Canvas {
  constructor(readonly width = W, readonly height = H) {}
  svg: string[] = [];
  overlays: OverlayOptions[] = [];
  text(x: number, y: number, size: number, value: string, { weight = 600, fill = "#ffffff", opacity = 1, anchor = "start", spacing = 0 } = {}) {
    this.svg.push(`<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" fill-opacity="${opacity}" text-anchor="${anchor}" letter-spacing="${spacing}">${esc(value)}</text>`);
  }
  /** A white rounded tile with the course logo centred in it. */
  async tile(course: Course, x: number, y: number, box: number) {
    const size = Math.round(box * .7);
    const png = await logo(course, size);
    this.svg.push(`<rect x="${x}" y="${y}" width="${box}" height="${box}" rx="${Math.round(box * .26)}" fill="#ffffff"/>`);
    if (png) this.overlays.push({ input: png, left: Math.round(x + (box - size) / 2), top: Math.round(y + (box - size) / 2) });
    else this.text(x + box / 2, y + box * .64, Math.round(box * .42), course.name.slice(0, 1), { weight: 800, fill: "#1f1e1c", anchor: "middle" });
  }
  async render(background: Buffer, out: string) {
    const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}">${this.svg.join("")}</svg>`);
    const webp = await sharp(background).resize(this.width, this.height, { fit: "cover", kernel: "lanczos3" })
      .composite([{ input: overlay }, ...this.overlays]).webp({ quality: 90, effort: 6, smartSubsample: true }).toBuffer();
    writeFileSync(out, webp);
    console.log(`ok ${out} ${(webp.length / 1024).toFixed(0)} KB`);
  }
}

/** The eyebrow, headline and subline every variant opens with. */
function heading(c: Canvas, x: number, y: number, size: number, lines: string[], sub: string, anchor: "start" | "end" = "start") {
  c.text(x, y, Math.round(size * .36), "MASTERCLASS BUDDY · THE TECHNOLOGY UNIVERSE", { weight: 700, fill: "#fdba74", spacing: size * .09, anchor });
  lines.forEach((line, i) => c.text(x, y + size * (1.2 + i * 1.08), size, line, { weight: 700, spacing: -1, anchor }));
  c.text(x, y + size * (1.2 + lines.length * 1.08) + size * .12, Math.round(size * .37), sub, { weight: 500, opacity: .74, anchor });
}

/** A vector backdrop: dark base, soft coloured glows and a faint dot grid, sharp at any size. */
function vectorBackdrop(glows: { cx: number; cy: number; r: number; color: string; opacity: number }[], base: [string, string]) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>
    <linearGradient id="base" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${base[0]}"/><stop offset="1" stop-color="${base[1]}"/></linearGradient>
    ${glows.map((g, i) => `<radialGradient id="g${i}"><stop offset="0" stop-color="${g.color}" stop-opacity="${g.opacity}"/><stop offset="1" stop-color="${g.color}" stop-opacity="0"/></radialGradient>`).join("")}
    <pattern id="dots" width="48" height="48" patternUnits="userSpaceOnUse"><circle cx="24" cy="24" r="1.6" fill="#ffffff" fill-opacity=".07"/></pattern>
    <radialGradient id="vignette" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#base)"/>
  ${glows.map((g, i) => `<circle cx="${g.cx}" cy="${g.cy}" r="${g.r}" fill="url(#g${i})"/>`).join("")}
  <rect width="${W}" height="${H}" fill="url(#dots)"/>
  <rect width="${W}" height="${H}" fill="url(#vignette)"/></svg>`);
}

const SUB = `${FAMILIES.length} families, every course topic by topic: syntax, examples, assignments and interview questions.`;

/* ── a: the bento, redrawn at 4K over a painted backdrop ── */
const PAINT = "Abstract premium backdrop for a keynote infographic: deep graphite and midnight-navy darkness, soft volumetric light in warm terracotta orange from the top left and violet from the bottom right, a very subtle perspective grid floor fading into the dark, a few out-of-focus translucent glass prisms near the outer edges catching the light, fine film grain, calm and even across the whole centre, cinematic and high-end. Absolutely no text, letters, numbers, logos, icons, symbols, user interface or watermarks.";
const LANDSCAPE = ["3840x2160", "2560x1440", "2048x1152", "1536x1024"] as const;
const PORTRAIT = ["2160x3840", "1440x2560", "1152x2048", "1024x1536"] as const;
async function painted(reuse: boolean, file = ".cache/hero-stack/variant-a-4k.png", sizes: readonly `${number}x${number}`[] = LANDSCAPE) {
  if (reuse && existsSync(file)) return readFileSync(file);
  const [w, h] = sizes[0].split("x").map(Number);
  // The largest size the model accepts; smaller paintings are softened before upscaling so they never look pixelated.
  for (const size of sizes) {
    try {
      const { image } = await generateImage({ model: gateway.image("openai/gpt-image-2"), prompt: PAINT, size, providerOptions: { openai: { quality: "high" } } });
      const png = Buffer.from(image.uint8Array);
      const { width = 0 } = await sharp(png).metadata();
      console.log(`painted ${size} → ${width} px wide`);
      const full = width >= w ? png : await sharp(png).resize(w, h, { fit: "cover", kernel: "lanczos3" }).blur(1.2).png().toBuffer();
      writeFileSync(file, full);
      return full;
    } catch (error) { console.warn(`size ${size} refused: ${String(error).slice(0, 140)}`); }
  }
  throw new Error("No backdrop painted");
}

async function variantA(reuse: boolean) {
  const c = new Canvas();
  c.svg.push(`<defs><linearGradient id="wash" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05060f" stop-opacity=".62"/><stop offset=".45" stop-color="#05060f" stop-opacity=".36"/><stop offset="1" stop-color="#05060f" stop-opacity=".66"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#wash)"/>`);
  heading(c, X0, Y0 + 20, 96, [`${TOTAL} technologies. One place to master them.`], SUB);
  const rows: [string, number][][] = [
    [["AI & agents", 2], ["Java, C++ & DSA", 2], ["Frontend frameworks", 1], ["Languages & fundamentals", 1]],
    [["Python data & ML", 2], ["Databases & storage", 2], ["Backend & APIs", 1], ["Testing & quality", 1]],
    [["Cloud, ops & architecture", 2], ["State & data on the client", 1], ["Validation & forms", 1], ["Authentication", 1], ["HTTP & scraping", 1]],
  ];
  const SHORT: Record<string, string> = { "Languages & fundamentals": "Languages", "State & data on the client": "Client state", "Validation & forms": "Validation" };
  const gap = 28, top = 610, bottom = Y1, columns = 6;
  const cw = (X1 - X0 - gap * (columns - 1)) / columns, rh = (bottom - top - gap * (rows.length - 1)) / rows.length;
  const name = 42, text = 33, pad = 38, box = 74;
  for (const [r, row] of rows.entries()) {
    let col = 0;
    for (const [familyName, span] of row) {
      const f = familyNamed(familyName);
      const x = Math.round(X0 + col * (cw + gap)), y = Math.round(top + r * (rh + gap)), w = Math.round(cw * span + gap * (span - 1)), h = Math.round(rh);
      col += span;
      c.svg.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="40" fill="#ffffff" fill-opacity=".075" stroke="#ffffff" stroke-opacity=".17" stroke-width="2.4"/>`);
      c.svg.push(`<rect x="${x + pad}" y="${y}" width="${Math.min(w * .32, 230)}" height="7" rx="3.5" fill="${f.accent}"/>`);
      const titleY = y + pad + name * .95;
      c.text(x + pad, titleY, name, span === 1 ? SHORT[f.name] ?? f.name : f.name, { weight: 700, fill: f.accent });
      c.text(x + w - pad, titleY, Math.round(name * .72), String(f.courses.length), { opacity: .55, anchor: "end" });
      const step = box + 16, room = Math.floor((w - pad * 2 + 16) / step);
      for (const [i, course] of f.courses.slice(0, room).entries()) await c.tile(course, x + pad + i * step, Math.round(titleY + name * .6), box);
      const lines: string[] = [];
      for (const courseName of f.courses.map(course => course.name)) {
        const last = lines.at(-1), next = last ? `${last} · ${courseName}` : courseName;
        if (last && next.length > Math.floor((w - pad * 2) / (text * .5))) { lines[lines.length - 1] = `${last} ·`; lines.push(courseName); } else if (last) lines[lines.length - 1] = next; else lines.push(next);
      }
      const textTop = titleY + name * .6 + box;
      lines.forEach((line, i) => c.text(x + pad, textTop + text * 1.4 * (i + 1), text, line, { weight: 500, opacity: .9 }));
      if (textTop + lines.length * text * 1.4 + pad * .5 > y + h) console.warn(`a: ${f.name} overflows`);
    }
  }
  await c.render(await painted(reuse), "public/images/landing/hero-stack.webp");
}

/* ── b: a periodic table of the 76, coloured by family ── */
async function variantB() {
  const c = new Canvas();
  heading(c, X0, Y0 + 20, 92, [`${TOTAL} technologies. One periodic table.`], SUB);
  const columns = 19, rows = Math.ceil(TOTAL / columns), gap = 14, top = 610, bottom = 1640;
  const cw = (X1 - X0 - gap * (columns - 1)) / columns, ch = (bottom - top - gap * (rows - 1)) / rows;
  const cells = FAMILIES.flatMap(f => f.courses.map(course => ({ course, f })));
  for (const [i, { course, f }] of cells.entries()) {
    // Column by column, so each family reads as one coloured band.
    const col = Math.floor(i / rows), row = i % rows;
    const x = Math.round(X0 + col * (cw + gap)), y = Math.round(top + row * (ch + gap)), w = Math.round(cw), h = Math.round(ch);
    c.svg.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="${f.accent}" fill-opacity=".13" stroke="${f.accent}" stroke-opacity=".55" stroke-width="2"/>`);
    c.svg.push(`<rect x="${x + 16}" y="${y}" width="${w - 32}" height="5" rx="2.5" fill="${f.accent}"/>`);
    c.text(x + 16, y + 38, 22, String(i + 1).padStart(2, "0"), { weight: 700, fill: f.accent, opacity: .9 });
    const box = 84;
    await c.tile(course, Math.round(x + (w - box) / 2), y + 52, box);
    const lines = words(course.name, Math.floor((w - 18) / (23 * .52))).slice(0, 2);
    lines.forEach((line, j) => c.text(x + w / 2, y + 52 + box + 38 + j * 28, 23, line, { weight: 600, anchor: "middle" }));
  }
  // Legend: every family with its colour and count, flowing over two lines.
  let x = X0, y = 1712;
  for (const f of FAMILIES) {
    const label = `${f.name}  ${f.courses.length}`, width = 22 + 14 + label.length * 27 * .52 + 40;
    if (x + width > X1) { x = X0; y += 52; }
    c.svg.push(`<rect x="${x}" y="${y - 20}" width="22" height="22" rx="6" fill="${f.accent}"/>`);
    // One text run, so the count always sits right after the name.
    c.svg.push(`<text x="${x + 36}" y="${y}" font-family="${FONT}" font-size="27" font-weight="600" fill="#ffffff" fill-opacity=".92">${esc(f.name)}<tspan dx="12" font-weight="700" fill="${f.accent}" fill-opacity="1">${f.courses.length}</tspan></text>`);
    x += width;
  }
  await c.render(vectorBackdrop([
    { cx: 300, cy: 120, r: 1500, color: "#f97316", opacity: .26 },
    { cx: 3700, cy: 2100, r: 1700, color: "#7c3aed", opacity: .32 },
    { cx: 2300, cy: 900, r: 1300, color: "#0ea5e9", opacity: .1 },
  ], ["#070a16", "#0c1026"]), "public/images/landing/hero-stack-4k-b.webp");
}

/* ── c: a skyline, one column per family, tallest first ── */
async function variantC() {
  const c = new Canvas();
  const families = [...FAMILIES].sort((a, b) => b.courses.length - a.courses.length);
  const gap = 18, baseline = 1660, chip = 96, chipGap = 12;
  const cw = (X1 - X0 - gap * (families.length - 1)) / families.length;
  // The short columns are on the right, so the headline sits over them, right-aligned.
  heading(c, X1, Y0 + 20, 92, [`${TOTAL} technologies.`, "One skyline to master."], `${FAMILIES.length} families · every course topic by topic`, "end");
  c.svg.push(`<rect x="${X0 - 20}" y="${baseline + 10}" width="${X1 - X0 + 40}" height="3" rx="1.5" fill="#ffffff" fill-opacity=".35"/>`);
  for (const [k, f] of families.entries()) {
    const x = Math.round(X0 + k * (cw + gap)), w = Math.round(cw);
    const columnTop = baseline - f.courses.length * (chip + chipGap) + chipGap;
    c.svg.push(`<rect x="${x - 6}" y="${columnTop - 6}" width="${w + 12}" height="${baseline - columnTop + 12}" rx="24" fill="${f.accent}" fill-opacity=".07"/>`);
    c.text(x + w / 2, columnTop - 26, 52, String(f.courses.length), { weight: 800, fill: f.accent, anchor: "middle" });
    for (const [i, course] of f.courses.entries()) {
      const y = baseline - (i + 1) * (chip + chipGap) + chipGap;
      c.svg.push(`<rect x="${x}" y="${y}" width="${w}" height="${chip}" rx="18" fill="#0b1020" fill-opacity=".72" stroke="${f.accent}" stroke-opacity=".5" stroke-width="2"/>`);
      c.svg.push(`<rect x="${x}" y="${y + 18}" width="5" height="${chip - 36}" rx="2.5" fill="${f.accent}"/>`);
      await c.tile(course, x + 16, y + (chip - 60) / 2, 60);
      const lines = words(course.name, Math.floor((w - 98) / (21 * .52))).slice(0, 3);
      const first = y + chip / 2 - ((lines.length - 1) * 24) / 2 + 8;
      lines.forEach((line, j) => c.text(x + 90, first + j * 24, 21, line, { weight: 600 }));
    }
    words(f.name, Math.floor(w / (24 * .54))).slice(0, 3).forEach((line, j) => c.text(x + w / 2, baseline + 52 + j * 30, 24, line, { weight: 700, fill: f.accent, anchor: "middle" }));
  }
  await c.render(vectorBackdrop([
    { cx: 900, cy: -200, r: 1900, color: "#14b8a6", opacity: .22 },
    { cx: 2600, cy: -100, r: 1700, color: "#8b5cf6", opacity: .26 },
    { cx: 3600, cy: 700, r: 1200, color: "#f97316", opacity: .18 },
    { cx: 1900, cy: 1700, r: 1500, color: "#2563eb", opacity: .12 },
  ], ["#04060d", "#0a0f1f"]), "public/images/landing/hero-stack-4k-c.webp");
}

/*
 * a, for phones: 2160×3840 (twice hero-stack-portrait's old 1080×1920), two columns with the logos inline after each
 * family name. Shown at about 0.22× on a 390×844 screen: cover-cropping trims ~200 px a side, the slide controls cover
 * y > ~3240 and the Tech Buzz button x > ~1120 at y 410-620, so the headline breaks in two and stays left.
 */
async function variantAPortrait(reuse: boolean) {
  const PW = 2160, PH = 3840, left = 232, right = 1928, pad = 30, name = 46, text = 40, box = 58, gap = 24;
  const c = new Canvas(PW, PH);
  c.svg.push(`<defs><linearGradient id="wash" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05060f" stop-opacity=".62"/><stop offset=".45" stop-color="#05060f" stop-opacity=".38"/><stop offset="1" stop-color="#05060f" stop-opacity=".66"/></linearGradient></defs><rect width="${PW}" height="${PH}" fill="url(#wash)"/>`);
  c.text(left, 336, 26, "MASTERCLASS BUDDY · THE TECHNOLOGY UNIVERSE", { weight: 700, fill: "#fdba74", spacing: 6.5 });
  [`${TOTAL} technologies.`, "One place to master them."].forEach((line, i) => c.text(left, 336 + 72 * (1.2 + i * 1.08), 72, line, { weight: 700, spacing: -1 }));
  const rows: [string, number][][] = [
    [["AI & agents", 2]], [["Frontend frameworks", 1], ["Languages & fundamentals", 1]], [["Python data & ML", 2]],
    [["Backend & APIs", 1], ["Validation & forms", 1]], [["Java, C++ & DSA", 2]], [["Testing & quality", 2]], [["Databases & storage", 2]],
    [["State & data on the client", 1], ["HTTP & scraping", 1]], [["Cloud, ops & architecture", 2]], [["Authentication", 2]],
  ];
  const SHORT: Record<string, string> = { "Languages & fundamentals": "Languages", "State & data on the client": "Client state", "Validation & forms": "Validation", "Frontend frameworks": "Frontend" };
  const top = 592, bottom = 3208, cw = (right - left - gap) / 2, rh = (bottom - top - gap * (rows.length - 1)) / rows.length;
  for (const [r, row] of rows.entries()) {
    let col = 0;
    for (const [familyName, span] of row) {
      const f = familyNamed(familyName);
      const x = Math.round(left + col * (cw + gap)), y = Math.round(top + r * (rh + gap)), w = Math.round(cw * span + gap * (span - 1)), h = Math.round(rh);
      col += span;
      c.svg.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="32" fill="#ffffff" fill-opacity=".075" stroke="#ffffff" stroke-opacity=".17" stroke-width="2.4"/>`);
      c.svg.push(`<rect x="${x + pad}" y="${y}" width="${Math.min(w * .32, 200)}" height="6" rx="3" fill="${f.accent}"/>`);
      const label = span === 1 ? SHORT[f.name] ?? f.name : f.name, titleY = y + pad + name * .95;
      c.text(x + pad, titleY, name, label, { weight: 700, fill: f.accent });
      c.text(x + w - pad, titleY, Math.round(name * .72), String(f.courses.length), { opacity: .55, anchor: "end" });
      // Logos sit right of the family name, before the count.
      const step = box + 12, room = w - pad * 2 - label.length * name * .56 - name * 1.4;
      const count = Math.max(0, Math.min(f.courses.length, Math.floor(room / step)));
      const startX = x + w - pad - name * 1.2 - count * step;
      for (let i = 0; i < count; i++) await c.tile(f.courses[i], Math.round(startX + i * step), Math.round(titleY - name * .72 - (box - name * .9) / 2), box);
      const lines: string[] = [];
      for (const courseName of f.courses.map(course => course.name)) {
        const last = lines.at(-1), next = last ? `${last} · ${courseName}` : courseName;
        if (last && next.length > Math.floor((w - pad * 2) / (text * .5))) { lines[lines.length - 1] = `${last} ·`; lines.push(courseName); } else if (last) lines[lines.length - 1] = next; else lines.push(next);
      }
      const textTop = titleY + name * .25;
      lines.forEach((line, i) => c.text(x + pad, textTop + text * 1.4 * (i + 1), text, line, { weight: 500, opacity: .9 }));
      if (textTop + lines.length * text * 1.4 + pad * .5 > y + h) console.warn(`a-portrait: ${f.name} overflows`);
    }
  }
  await c.render(await painted(reuse, ".cache/hero-stack/variant-a-portrait-4k.png", PORTRAIT), "public/images/landing/hero-stack-portrait.webp");
}

async function main() {
  const reuse = process.argv.includes("--reuse");
  const pick = process.argv.slice(2).filter(arg => /^([abc]|a-portrait)$/.test(arg));
  const which = pick.length ? pick : ["a", "b", "c"];
  if (which.includes("a-portrait")) await variantAPortrait(reuse);
  mkdirSync(".cache/hero-stack", { recursive: true });
  if (which.includes("b")) await variantB();
  if (which.includes("c")) await variantC();
  if (which.includes("a")) {
    if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN && !reuse) throw new Error("AI_GATEWAY_API_KEY must be set.");
    await variantA(reuse);
  }
}
void main().catch(error => { console.error(String(error).slice(0, 400)); process.exitCode = 1; });
