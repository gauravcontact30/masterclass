/**
 * Paints the five landing hero slides with openai/gpt-image-2 through the AI Gateway, then crops and resizes each
 * to 1920×1080 WebP in public/images/landing/hero-*.webp. Run: npx tsx --env-file=.env scripts/generate-hero-images.ts [id…]
 */
import { writeFileSync } from "node:fs";
import sharp from "sharp";
import { gateway, generateImage } from "ai";

const STYLE = "Photorealistic, cinematic editorial photograph, shot on a full-frame camera with a 35mm lens, soft natural window light, warm cream and terracotta colour palette with gentle depth of field, premium and professional, clean composition with calm empty space on the left third for headline text. Absolutely no text, letters, logos, watermarks or readable screens.";
const SLIDES: Record<string, string> = {
  school: "An Indian teenage school student in a neat uniform studying at a wooden desk at golden hour, a laptop showing a clean colourful diagram (no readable text), an open notebook with hand-drawn science diagrams, a desk lamp and a small plant, focused and confident expression, the subject on the right two thirds.",
  exams: "A focused young Indian woman preparing for a competitive exam in a bright modern library, a tablet showing a timer and colourful progress rings (no readable text), stacked reference books, sticky notes and a cup of chai, rows of bookshelves softly blurred behind her, subject on the right side.",
  build: "A young Indian software developer building a project at a sunlit studio desk with two monitors showing abstract colourful code blocks and an architecture diagram (no readable text), mechanical keyboard, coffee mug, small succulent, creative and productive atmosphere, subject on the right side.",
  career: "Two young Indian professionals practising a mock technical interview across a table in a stylish co-working space, one asking questions with a laptop, the other answering confidently with a whiteboard of abstract boxes and arrows behind them (no readable text), warm and encouraging mood, subjects on the right two thirds.",
  anywhere: "An Indian college student in a clean white shirt with wireless earbuds learning on a smartphone inside a modern metro train at sunrise, the phone screen showing colourful lesson cards (no readable text), city skyline softly blurred through the window, backpack on one shoulder, subject on the right side.",
};

async function paint(id: string) {
  const { image } = await generateImage({
    model: gateway.image("openai/gpt-image-2"),
    prompt: `${SLIDES[id]} ${STYLE}`,
    size: "1536x1024",
    providerOptions: { openai: { quality: "high" } },
  });
  const out = `public/images/landing/hero-${id}.webp`;
  // 1536×1024 (3:2) → centre crop to 16:9, then 1920×1080 with a Lanczos resize and a light sharpen.
  const webp = await sharp(Buffer.from(image.uint8Array)).resize(1920, 1080, { fit: "cover", position: "attention", kernel: "lanczos3" }).sharpen({ sigma: 0.6 }).webp({ quality: 86, effort: 6 }).toBuffer();
  writeFileSync(out, webp);
  console.log(`ok ${out} ${(webp.length / 1024).toFixed(0)} KB`);
}

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) throw new Error("AI_GATEWAY_API_KEY must be set.");
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SLIDES);
  for (const id of ids) { try { await paint(id); } catch (error) { console.error(`failed ${id}: ${String(error).slice(0, 300)}`); } }
}
void main();
