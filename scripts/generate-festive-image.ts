/**
 * Paints the landing page's Diwali sale artwork (components/landing-festive-sale.tsx) through Vercel AI Gateway:
 * a warm, photorealistic festive scene of learning at home on Diwali night, no text, with calm space on the left for
 * the offer copy. Run: npx tsx --env-file=.env scripts/generate-festive-image.ts
 */
import { writeFileSync } from "node:fs";
import sharp from "sharp";
import { gateway, generateImage } from "ai";

const PROMPT = "Photorealistic, cinematic editorial photograph for a Diwali festive sale of an online technology learning platform. A cosy modern Indian living room on Diwali night: a young Indian professional woman in an elegant mustard kurta sits on floor cushions with a laptop showing a soft abstract code editor and diagram (nothing readable), smiling as she learns; in front of her a vibrant marigold-and-rose petal rangoli with a ring of glowing clay diyas; strings of warm fairy lights and marigold garlands frame a window through which golden fireworks bloom in a deep indigo sky; a brass lamp, a small plate of sweets and a cup of chai nearby. Warm amber, saffron, marigold and deep indigo palette, soft bokeh from the lights, shallow depth of field, premium and joyful, the subject and rangoli on the right two thirds, calm darker space on the left third for headline text. Absolutely no text, letters, numbers, logos, watermarks or readable screens.";

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) throw new Error("AI_GATEWAY_API_KEY must be set.");
  const { image } = await generateImage({ model: gateway.image("openai/gpt-image-2"), prompt: PROMPT, size: "1536x1024", providerOptions: { openai: { quality: "high" } } });
  const webp = await sharp(Buffer.from(image.uint8Array)).resize(1600, 900, { fit: "cover", position: "attention", kernel: "lanczos3" }).sharpen({ sigma: 0.5 }).webp({ quality: 84, effort: 6 }).toBuffer();
  writeFileSync("public/images/landing/diwali-sale-2026.webp", webp);
  console.log(`wrote public/images/landing/diwali-sale-2026.webp (${Math.round(webp.length / 1024)} KB)`);
}
void main();
