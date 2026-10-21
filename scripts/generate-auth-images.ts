/**
 * Paints the sign-in / sign-up carousel photos (one per slide in components/auth-carousel.tsx) with
 * openai/gpt-image-2 through the AI Gateway, and writes 1200×800 WebP to public/images/auth/<id>.webp. The gateway
 * allows 5 images a minute on this team, so requests are spaced and a rate-limited one waits a minute and retries.
 * Run: npx tsx --env-file=.env scripts/generate-auth-images.ts [id…]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { gateway, generateImage } from "ai";

const STYLE = "Photorealistic, cinematic editorial photograph, 35mm lens, soft natural window light, gentle depth of field, warm cream, deep green and terracotta palette, premium and calm. Absolutely no text, letters, numbers, logos, watermarks or readable screens.";
const SCENES: Record<string, string> = {
  guide: "A focused Indian high-school student at a tidy wooden desk planning their study goals: an open notebook with a hand-drawn checklist of ticks (no readable words), a laptop, a small potted plant and a wall calendar softly out of focus, morning light.",
  formats: "Close view over the shoulder of a young Indian college student reading a lesson on a tablet showing a clean diagram of boxes and arrows and colourful abstract code blocks (nothing readable), a highlighter and sticky notes beside it, a cup of chai.",
  languages: "Two Indian friends, a girl and a boy, studying together at a library table and smiling, one pointing at an open bilingual textbook with abstract English and Devanagari-like shapes (nothing readable), bookshelves warmly blurred behind them.",
  plans: "A confident young Indian professional in a bright modern co-working space looking at a laptop with a calm smile, a certificate-style card and a neat stack of books beside the laptop, a sense of achievement and progress, evening golden light.",
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
async function paint(id: string) {
  const out = `public/images/auth/${id}.webp`;
  for (let tries = 1; ; tries++) {
    try {
      const { image } = await generateImage({ model: gateway.image("openai/gpt-image-2"), prompt: `${SCENES[id]} ${STYLE}`, size: "1536x1024", providerOptions: { openai: { quality: "high" } } });
      const webp = await sharp(Buffer.from(image.uint8Array)).resize(1200, 800, { fit: "cover", position: "attention", kernel: "lanczos3" }).sharpen({ sigma: 0.5 }).webp({ quality: 80, effort: 6 }).toBuffer();
      writeFileSync(out, webp);
      console.log(`ok ${out} ${(webp.length / 1024).toFixed(0)} KB`);
      return;
    } catch (error) {
      if (tries >= 4 || !/rate|429|limit/i.test(String(error))) { console.error(`failed ${out}: ${String(error).slice(0, 300)}`); return; }
      console.log(`  rate limited, waiting a minute (${out})`); await wait(61_000);
    }
  }
}

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) throw new Error("AI_GATEWAY_API_KEY must be set.");
  mkdirSync("public/images/auth", { recursive: true });
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SCENES);
  // At most 5 a minute: start one every 13 seconds, several in flight at once.
  await Promise.all(ids.map((id, index) => wait(index * 13_000).then(() => paint(id))));
}
void main();
