/**
 * Generates the 4 festive carousel images for the Diwali sale section using Vercel AI Gateway.
 * Run: npx tsx --env-file=.env scripts/generate-festive-carousel-images.ts
 */
import { existsSync, copyFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { gateway, generateImage } from "ai";

const PROMPTS = [
  {
    file: "public/images/landing/diwali-sale-1.webp",
    prompt: "Photorealistic, cinematic editorial photograph for a Diwali festive sale of an online technology learning platform. A cosy modern Indian living room on Diwali night: a young Indian professional woman in an elegant mustard kurta sits on floor cushions with a laptop showing a soft abstract code editor and diagram (nothing readable), smiling as she learns; in front of her a vibrant marigold-and-rose petal rangoli with a ring of glowing clay diyas; strings of warm fairy lights and marigold garlands frame a window through which golden fireworks bloom in a deep indigo sky; a brass lamp, a small plate of sweets and a cup of chai nearby. Warm amber, saffron, marigold and deep indigo palette, soft bokeh from the lights, shallow depth of field, premium and joyful. Absolutely no text, letters, numbers, logos, watermarks or readable screens."
  },
  {
    file: "public/images/landing/diwali-sale-2.webp",
    prompt: "Photorealistic, cinematic editorial photograph for a Diwali festive sale of an online tech learning platform. Two young Indian software engineers (a woman and a man) in festive ethnic attire (emerald green and navy kurtas) collaborating cheerfully over a modern silver laptop at a wooden table in a festive study room on Diwali evening; warm golden fairy lights, brass lamps with flickering flames, marigold garlands draping the bookshelf behind them; celebratory Diwali atmosphere with a decorative lantern (kandil) glowing in the corner, sparkling fireworks reflected in the window. Warm amber and festive lighting, joyful collaborative energy, premium professional atmosphere. Absolutely no text, letters, numbers, logos, watermarks or readable screens."
  },
  {
    file: "public/images/landing/diwali-sale-3.webp",
    prompt: "Photorealistic, cinematic editorial photograph for a Diwali festive sale. A dedicated young Indian software engineer in an elegant maroon silk kurta working on his laptop and curved monitor at a sleek wooden desk on Diwali night; the desk is adorned with small glowing clay diyas, fresh marigold flowers, and a steaming brass cup of coffee; warm bokeh of fairy lights and deep indigo night sky visible outside with soft distant Diwali fireworks; peaceful, inspiring atmosphere of late-night technical mastery and learning during the festival of lights. Cinematic golden-amber and royal-blue tones. Absolutely no text, letters, numbers, logos, watermarks or readable screens."
  },
  {
    file: "public/images/landing/diwali-sale-4.webp",
    prompt: "Photorealistic, cinematic editorial photograph for a Diwali festive sale of a tech career platform. A young Indian developer celebrating career success on Diwali evening: sitting comfortably in a beautifully decorated room with glowing hanging paper lanterns (akash kandil), intricate flower rangoli with lit earthen lamps on the floor, holding a modern laptop, smiling warmly towards the camera with a sense of accomplishment and career growth; golden sparkles, festive warmth, vibrant saffron, crimson, and gold colors, joyful and inspiring. Absolutely no text, letters, numbers, logos, watermarks or readable screens."
  }
];

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
    throw new Error("AI_GATEWAY_API_KEY must be set.");
  }

  // If diwali-sale-2026.webp already exists, copy it as slide 1
  if (existsSync("public/images/landing/diwali-sale-2026.webp") && !existsSync("public/images/landing/diwali-sale-1.webp")) {
    copyFileSync("public/images/landing/diwali-sale-2026.webp", "public/images/landing/diwali-sale-1.webp");
    console.log("reused existing diwali-sale-2026.webp as diwali-sale-1.webp");
  }

  for (let i = 0; i < PROMPTS.length; i++) {
    const item = PROMPTS[i];
    if (existsSync(item.file)) {
      console.log(`already exists: ${item.file}, skipping generation`);
      continue;
    }
    console.log(`generating slide ${i + 1}/4: ${item.file}...`);
    try {
      const { image } = await generateImage({
        model: gateway.image("openai/gpt-image-2"),
        prompt: item.prompt,
        size: "1536x1024",
        providerOptions: { openai: { quality: "high" } }
      });
      const webp = await sharp(Buffer.from(image.uint8Array))
        .resize(1600, 900, { fit: "cover", position: "attention", kernel: "lanczos3" })
        .sharpen({ sigma: 0.5 })
        .webp({ quality: 84, effort: 6 })
        .toBuffer();
      writeFileSync(item.file, webp);
      console.log(`wrote ${item.file} (${Math.round(webp.length / 1024)} KB)`);
    } catch (err) {
      console.error(`failed to generate ${item.file}:`, err);
    }
  }
  console.log("done!");
}

void main();
