/**
 * The PNG icons of the landing page's Questions section, painted through Vercel AI Gateway as one set. Each sits on a
 * white tile in its card, so it is painted on white and needs no transparency. Existing files are kept.
 * Run: npx tsx --env-file=.env scripts/generate-answer-icons.ts
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { gateway, generateImage } from "ai";

const STYLE = "A single icon of one simple, instantly recognisable object, soft 3D clay render, matte and rounded, gentle studio light, warm palette of saffron, terracotta and cream with one cool accent. Centred with generous margin on a pure white background, no shadow touching the edges. No text, no letters, no numbers, no people, no faces.";
const ICONS: Record<string, string> = {
  platform: "an open book with a small graduation cap resting on it",
  technologies: "a small stack of three building blocks, one with a tiny gear on it",
  free: "an open gift box with a book rising out of it",
  cost: "a gold rupee coin leaning on a small price tag, the coin plain with a simple raised rim",
  cancel: "a calendar page with a round check mark badge",
  buzz: "a folded newspaper with a small lightning bolt beside it",
  interview: "two speech bubbles side by side, one with a small check mark",
  contact: "a map pin beside a classic telephone handset",
  ask: "a round question-mark-free chat bubble with three dots inside",
  "step-read": "an open book with a small magnifying glass over it",
  "step-account": "a smooth round white padlock-free sign-up card with a simple rounded head-and-shoulders silhouette shape and a small plus badge, no camera",
  "step-dashboard": "a small laptop showing simple coloured bars and tiles",
  "step-membership": "a golden membership card with a crown shape on it",
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
async function paint(id: string) {
  const out = `public/images/landing/answers/${id}.png`;
  if (existsSync(out)) return;
  for (let tries = 1; ; tries++) {
    try {
      const { image } = await generateImage({ model: gateway.image("openai/gpt-image-2"), prompt: `${ICONS[id]}. ${STYLE}`, size: "1024x1024", providerOptions: { openai: { quality: "medium" } } });
      const png = await sharp(Buffer.from(image.uint8Array)).resize(192, 192, { kernel: "lanczos3" }).png({ compressionLevel: 9, palette: true, quality: 90 }).toBuffer();
      writeFileSync(out, png);
      console.log(`ok ${id} ${(png.length / 1024).toFixed(0)} KB`);
      return;
    } catch (error) {
      if (tries >= 4) { console.error(`failed ${id}: ${String(error).slice(0, 300)}`); return; }
      console.log(`  retrying ${id}`); await wait(20_000 * tries);
    }
  }
}

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) throw new Error("AI_GATEWAY_API_KEY must be set.");
  mkdirSync("public/images/landing/answers", { recursive: true });
  const ids = Object.keys(ICONS);
  for (let at = 0; at < ids.length; at += 4) await Promise.all(ids.slice(at, at + 4).map(paint));
}

void main().catch(error => { console.error(error); process.exit(1); });
