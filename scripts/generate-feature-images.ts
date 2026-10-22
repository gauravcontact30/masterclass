/**
 * Paints the landing feature-section pictures (AI Search, Featured lessons, Notes & bookmarks, Certifications) with
 * openai/gpt-image-2 through the AI Gateway, in the hero slides' style, then crops each to 1600×1200 WebP in
 * public/images/landing/feature-*.webp. Run: npx tsx --env-file=.env scripts/generate-feature-images.ts [id…]
 */
import { writeFileSync } from "node:fs";
import sharp from "sharp";
import { gateway, generateImage } from "ai";

const STYLE = "Photorealistic, cinematic editorial photograph, shot on a full-frame camera with a 35mm lens, soft natural window light, warm cream and terracotta colour palette with gentle depth of field, premium and professional, calm uncluttered composition. Absolutely no text, letters, numbers, logos, watermarks or readable screens.";
const FEATURES: Record<string, string> = {
  search: "A curious young Indian developer at a bright minimalist desk leaning toward a laptop, a soft glowing orb of light and floating translucent answer cards rising from the screen like ideas taking shape (no readable text), a notebook with a hand-drawn question mark doodle and a cup of coffee, focused and delighted expression, subject on the left half.",
  lessons: "An overhead flat-lay of a beautifully organised study table: a tablet showing a colourful lesson cover illustration with a simple flow diagram of boxes and arrows (no readable text), printed interview question cards fanned out with coloured tabs, a terracotta pencil, sticky notes and a small plant, everything neatly arranged, creative and premium.",
  certifications: "A proud young Indian developer at a bright desk holding up a framed certificate with a ribbon seal (no readable text), a laptop beside showing a colourful abstract learning roadmap of connected steps, a small stack of study books and a coffee cup, subject on the left half.",
  notes: "A young Indian woman revising at a cosy reading nook by a window at dusk, a neat notebook with colour-coded highlighted notes and star stickers in the margins, a row of paper bookmarks in different pastel colours in an open book, a phone beside her showing saved cards as colourful tiles (no readable text), warm lamp light, calm and confident mood, subject on the right half.",
};

async function paint(id: string) {
  const { image } = await generateImage({
    model: gateway.image("openai/gpt-image-2"),
    prompt: `${FEATURES[id]} ${STYLE}`,
    size: "1536x1024",
    providerOptions: { openai: { quality: "high" } },
  });
  const out = `public/images/landing/feature-${id}.webp`;
  // 1536×1024 (3:2) → 4:3 crop around the subject, 1600×1200 for 2× displays at the section's ~800px width.
  const webp = await sharp(Buffer.from(image.uint8Array)).resize(1600, 1200, { fit: "cover", position: "attention", kernel: "lanczos3" }).sharpen({ sigma: 0.5 }).webp({ quality: 80, effort: 6 }).toBuffer();
  writeFileSync(out, webp);
  console.log(`ok ${out} ${(webp.length / 1024).toFixed(0)} KB`);
}

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) throw new Error("AI_GATEWAY_API_KEY must be set.");
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(FEATURES);
  await Promise.all(ids.map(id => paint(id).catch(error => console.error(`failed ${id}: ${String(error).slice(0, 300)}`))));
}
void main();
