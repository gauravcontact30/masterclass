/**
 * The Diwali sale carousel: a festive scene for each slide, painted through Vercel AI Gateway, with a framed poster
 * composited onto its wall. The poster is drawn here, not painted, because image models garble logos and small text: it
 * carries the site's real logo at the top left, the technology's real icon and its name. Scenes are kept in
 * node_modules/.cache/festive-scenes, so changing a poster costs no new images.
 * Run: npx tsx --env-file=.env scripts/generate-festive-poster-images.tsx [--repaint] [--only langchain-family]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { gateway, generateImage } from "ai";
import { ImageResponse } from "next/og";
import { siNestjs } from "simple-icons";
import { BRAND_PATHS as P } from "../lib/brand";

const SCENES_DIR = "node_modules/.cache/festive-scenes";
const svgIcon = (icon: { path: string; hex: string }) => `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="480" height="480"><path fill="#${icon.hex}" d="${icon.path}"/></svg>`).toString("base64")}`;
const file = (path: string, type: string) => `data:${type};base64,${readFileSync(path).toString("base64")}`;

const STYLE = "Photorealistic, cinematic editorial photograph, warm natural colour, shallow depth of field. No text, no letters, no logos, no signs, no posters, no pictures or frames on any wall.";
const WALL = "The camera faces the wall straight on. The upper right part of the picture is a large, completely empty, plain, softly lit wall, free of objects, garlands and lights, so that a poster can be hung there later.";
const SLIDES = [
  { id: "langchain-family", name: "Agentic AI", icon: () => "", scene: `An elegant Indian home library on Diwali evening, with teak bookshelves at the far left. On the left, a young Indian man in a deep teal silk kurta and a young Indian woman in a coral saree sit side by side at a low teak table, smiling and pointing at a laptop. A wide brass urli bowl of floating marigolds and small candles sits on the floor in the foreground, and brass lanterns glow at the far left. ${WALL}` },
  { id: "zustand", name: "Zustand", icon: () => file(join(SCENES_DIR, "zustand-512.png"), "image/png"), scene: `A sunlit-to-dusk Indian home study decorated for Diwali. On the left, two young Indian software engineers, a woman in an emerald kurta and a man in a navy kurta, laugh together over a laptop at a wooden table with a brass lamp, sweets and marigold flowers. Paper lanterns hang at the far left. ${WALL}` },
  { id: "python", name: "Python", icon: () => file("public/images/brands/python.svg", "image/svg+xml"), scene: `A traditional Indian courtyard terrace on Diwali night with a warm lime-plastered wall. On the left, a young Indian developer in a maroon silk kurta works on a laptop on a low carved wooden table, and fireworks bloom in the night sky above the left side of the terrace. Rows of lit clay diyas line the floor along the wall. ${WALL}` },
  { id: "nestjs", name: "Nest.js", icon: () => svgIcon(siNestjs), scene: `A modern Indian tech office decorated for Diwali in the evening. On the left, a young Indian team of three in festive kurtas and sarees share sweets beside a desk with laptops, under marigold torans hanging over the far left doorway. Brass diyas glow along the bottom of the wall on a low console. ${WALL}` },
] as const;

/** Where each poster hangs on its 1600×1000 scene: the empty stretch of wall, clear of the carousel's controls and diyas. */
const PLACE: Record<(typeof SLIDES)[number]["id"], { left: number; top: number }> = {
  "langchain-family": { left: 1058, top: 56 }, zustand: { left: 1058, top: 56 }, python: { left: 1058, top: 56 }, nestjs: { left: 1058, top: 56 },
};
const POSTER = { width: 470, height: 620 };

async function paint(slide: (typeof SLIDES)[number]) {
  const path = join(SCENES_DIR, `${slide.id}.png`);
  if (existsSync(path) && !process.argv.includes("--repaint")) return path;
  console.log(`painting ${slide.id}...`);
  const { image } = await generateImage({ model: gateway.image("openai/gpt-image-2"), prompt: `${slide.scene} ${STYLE}`, size: "1536x1024", providerOptions: { openai: { quality: "high" } } });
  writeFileSync(path, image.uint8Array);
  return path;
}

const FAMILY = [["langchain", "LangChain"], ["langgraph", "LangGraph"], ["langsmith", "LangSmith"], ["langflow", "LangFlow"]] as const;

/** The four LangChain-family logos from public/images/tech, enlarged smoothly for the poster's tiles. */
async function familyPoster() {
  const font = (weight: number) => readFileSync(`lib/fonts/inter-og-${weight}.ttf`);
  const logos = await Promise.all(FAMILY.map(async ([id]) => `data:image/png;base64,${(await sharp(`public/images/tech/${id}.png`).resize(256, 256, { kernel: "lanczos3" }).png().toBuffer()).toString("base64")}`));
  const response = new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: 12, background: "linear-gradient(145deg, #e5b95a, #8a5a14 50%, #e5b95a)", fontFamily: "Inter" }}>
    <div style={{ display: "flex", flexDirection: "column", flex: 1, background: "linear-gradient(165deg, #0f4a4e, #082b30)" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "12px 18px", background: "#fffaf0" }}>
        <svg width={62} height={62} viewBox="0 0 48 48" fill="none">
          <path d={P.back} fill={P.terracotta} /><path d={P.front} fill={P.ink} /><path d={P.pageLeft} fill={P.paper} /><path d={P.pageRight} fill={P.gold} />
          <circle cx={P.head.cx} cy={P.head.cy} r={P.head.r} fill={P.terracotta} /><path d={P.star} fill={P.gold} />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 10 }}>
          <div style={{ display: "flex", fontSize: 30, lineHeight: 1, letterSpacing: -1 }}><span style={{ fontWeight: 500, color: P.ink }}>master</span><span style={{ fontWeight: 800, color: P.terracotta }}>class</span></div>
          <span style={{ marginTop: 5, fontSize: 12, fontWeight: 800, letterSpacing: 6, color: P.terracotta }}>BUDDY</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 18px 14px" }}>
        <span style={{ fontSize: 46, fontWeight: 800, lineHeight: 1, letterSpacing: -1.5, color: "#fffaf0" }}>Agentic AI</span>
        <div style={{ display: "flex", alignItems: "center", marginTop: 12 }}>
          {[6, 9, 13, 9, 6].map((size, at) => <div key={at} style={{ width: size, height: size, margin: "0 5px", borderRadius: size, background: at === 2 ? "#f28c28" : "#e5b95a" }} />)}
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", padding: "0 18px 18px", flex: 1, alignContent: "space-between" }}>
        {FAMILY.map(([id, name], at) => <div key={id} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 196, height: 184, borderRadius: 16, background: "#fffaf0", border: "2px solid #e5b95a" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img> */}
          <img src={logos[at]} width={96} height={96} alt="" />
          <span style={{ marginTop: 10, fontSize: 26, fontWeight: 800, letterSpacing: -.8, color: P.ink }}>{name}</span>
        </div>)}
      </div>
    </div>
  </div>, { ...POSTER, fonts: [{ name: "Inter", data: font(500), weight: 500, style: "normal" }, { name: "Inter", data: font(800), weight: 800, style: "normal" }] });
  return Buffer.from(await response.arrayBuffer());
}

async function poster(slide: (typeof SLIDES)[number]) {
  if (slide.id === "langchain-family") return familyPoster();
  const font = (weight: number) => readFileSync(`lib/fonts/inter-og-${weight}.ttf`);
  const response = new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: 14, background: "linear-gradient(145deg, #d9a441, #8a5a14 55%, #e5b95a)", fontFamily: "Inter" }}>
    <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "20px 22px 24px", background: "#fffaf0" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <svg width={104} height={104} viewBox="0 0 48 48" fill="none">
          <path d={P.back} fill={P.terracotta} /><path d={P.front} fill={P.ink} /><path d={P.pageLeft} fill={P.paper} /><path d={P.pageRight} fill={P.gold} />
          <circle cx={P.head.cx} cy={P.head.cy} r={P.head.r} fill={P.terracotta} /><path d={P.star} fill={P.gold} />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 12 }}>
          <div style={{ display: "flex", fontSize: 44, lineHeight: 1, letterSpacing: -1.6 }}><span style={{ fontWeight: 500, color: P.ink }}>master</span><span style={{ fontWeight: 800, color: P.terracotta }}>class</span></div>
          <span style={{ marginTop: 8, fontSize: 18, fontWeight: 800, letterSpacing: 8, color: P.terracotta }}>BUDDY</span>
        </div>
      </div>
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img> */}
        <img src={slide.icon()} width={235} height={235} alt="" />
      </div>
      <div style={{ display: "flex", justifyContent: "center", fontSize: 62, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, color: P.ink }}>{slide.name}</div>
    </div>
  </div>, { ...POSTER, fonts: [{ name: "Inter", data: font(500), weight: 500, style: "normal" }, { name: "Inter", data: font(800), weight: 800, style: "normal" }] });
  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) throw new Error("AI_GATEWAY_API_KEY must be set.");
  mkdirSync(SCENES_DIR, { recursive: true });
  const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;
  const chosen = SLIDES.filter(slide => !only || slide.id === only);
  const scenes = await Promise.all(chosen.map(paint));
  for (const [at, slide] of chosen.entries()) {
    const place = PLACE[slide.id];
    const art = await poster(slide);
    // The poster's soft shadow on the wall, a little below and to the right of it.
    const shadow = await sharp({ create: { width: POSTER.width + 80, height: POSTER.height + 80, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: await sharp({ create: { ...POSTER, channels: 4, background: { r: 20, g: 10, b: 0, alpha: .55 } } }).png().toBuffer(), left: 40, top: 40 }]).blur(16).png().toBuffer();
    const out = await sharp(scenes[at]).resize(1600, 1000, { fit: "cover" })
      .composite([{ input: shadow, left: place.left - 30, top: place.top - 26 }, { input: art, left: place.left, top: place.top }])
      .webp({ quality: 86, effort: 6 }).toBuffer();
    writeFileSync(`public/images/landing/diwali-poster-${slide.id}.webp`, out);
    console.log(`wrote diwali-poster-${slide.id}.webp (${Math.round(out.length / 1024)} KB)`);
  }
}

void main().catch(error => { console.error(error); process.exit(1); });
