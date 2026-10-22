/**
 * Paints the "Fresh in tech" slide covers (components/landing-news.tsx) with openai/gpt-image-2 through the AI
 * Gateway: painted at 2048×1152 and saved as full-HD 1920×1080 WebP to public/images/news/<id>.webp, so the
 * cover's 16:9 frame shows the whole picture, never stretched. The gateway allows 5 images a minute on this team,
 * so requests are spaced and a rate-limited one waits a minute and retries.
 * Run: npx tsx --env-file=.env scripts/generate-news-covers.ts [id…]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { gateway, generateImage } from "ai";

import { NEWS_COVER_SCENES as SCENES, NEWS_COVER_STYLE as STYLE } from "../lib/news-covers";


const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
async function paint(id: string) {
  const out = `public/images/news/${id}.webp`;
  for (let tries = 1; ; tries++) {
    try {
      const { image } = await generateImage({ model: gateway.image("openai/gpt-image-2"), prompt: `${SCENES[id]} ${STYLE}`, size: "2048x1152", providerOptions: { openai: { quality: "high" } } });
      const webp = await sharp(Buffer.from(image.uint8Array)).resize(1920, 1080, { fit: "cover", kernel: "lanczos3" }).webp({ quality: 82, effort: 6 }).toBuffer();
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
  mkdirSync("public/images/news", { recursive: true });
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SCENES);
  // At most 5 a minute: start one every 13 seconds, several in flight at once.
  await Promise.all(ids.map((id, index) => wait(index * 13_000).then(() => paint(id))));
}
void main();
