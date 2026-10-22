/**
 * Paints the five landing hero slides with openai/gpt-image-2 through the AI Gateway, then crops and resizes each
 * to 1920×1080 WebP in public/images/landing/hero-*.webp. Run: npx tsx --env-file=.env scripts/generate-hero-images.ts [id…]
 * Slide 5 shows the live site on its screen: screenshot https://www.masterclassbuddy.com at 1440×900 and pass --site=<png>.
 */
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { gateway, generateImage } from "ai";

const STYLE = "Photorealistic, cinematic editorial photograph, shot on a full-frame camera with a 35mm lens, soft natural window light, warm cream and terracotta colour palette with gentle depth of field, premium and professional, clean composition with calm empty space on the left third for headline text. Absolutely no text, letters, logos, watermarks or readable screens.";
// These slides show words on purpose (a campus sign, certificates, a web address): only the quoted text may appear.
const TEXT_STYLE = STYLE.replace("Absolutely no text, letters, logos, watermarks or readable screens.", "The only readable text in the image is the exact quoted text in the description, spelled exactly and rendered crisply; no other text, logos or watermarks.");
const WITH_TEXT = new Set(["school", "anywhere"]);
const FILES: Record<string, string> = { school: "campus-2", anywhere: "certified-2" };
// A slide whose screen shows the real site paints from a screenshot of it: --site=<png> (see the run line above).
const site = process.argv.find(arg => arg.startsWith("--site="))?.slice(7);
const REFERENCE = new Set(["anywhere"]);
const SLIDES: Record<string, string> = {
  school: "A confident young Indian professional man, 27 years old, in a smart navy blazer over a light shirt with a leather laptop bag on his shoulder, walking with purpose up the wide stone steps toward the grand entrance of a modern university campus at golden morning light; on the sandstone wall above the glass entrance, large elegant brass letters read exactly \"Master Class Buddy - www.masterclassbuddy.com\" on one line, and there is no other text anywhere on the building, wide shot from further back and slightly lower: the whole building facade including its roofline is visible with open sky above it, and the complete sign sits in the upper-middle of the frame with plenty of space around it; trees, a lawn and a few students softly blurred around, aspirational and welcoming mood, the man and the entrance on the right two thirds.",
  exams: "A focused young Indian woman preparing for a competitive exam in a bright modern library, a tablet showing a timer and colourful progress rings (no readable text), stacked reference books, sticky notes and a cup of chai, rows of bookshelves softly blurred behind her, subject on the right side.",
  build: "A young Indian software developer building a project at a sunlit studio desk with two monitors showing abstract colourful code blocks and an architecture diagram (no readable text), mechanical keyboard, coffee mug, small succulent, creative and productive atmosphere, subject on the right side.",
  career: "Two young Indian professionals practising a mock technical interview across a table in a stylish co-working space, one asking questions with a laptop, the other answering confidently with a whiteboard of abstract boxes and arrows behind them (no readable text), warm and encouraging mood, subjects on the right two thirds.",
  anywhere: "In a bright, modern corporate office reception with a warm walnut reception desk, a smiling young Indian man and a smiling young Indian woman, both about 25 and dressed in smart business attire, stand side by side holding premium framed certificates toward the camera. Each certificate is a luxurious, professionally designed award: heavy cream textured paper, an intricate gold-foil guilloche border, a deep navy band at the top with the gold wordmark \"MasterClass Buddy\", the line \"Certificate of Completion\" in elegant serif small caps, the course title large in navy serif, an embossed gold foil seal with navy and gold ribbons in the lower corner and a fine signature line, in slim matte black frames. His certificate's course title reads exactly \"Agentic AI\"; she holds two certificates whose course titles read exactly \"AWS\" and \"n8n\". With their free hands they both point at a large 27-inch silver Apple iMac standing on the reception desk. The iMac screen shows exactly the website in the reference image (the MasterClass homepage with its dark top navigation bar, the large headline and the photo of a developer at his desk), inside a browser window whose address bar reads exactly \"https://www.masterclassbuddy.com\". Plants and a softly blurred office behind, proud and celebratory mood, the people and the iMac on the right two thirds.",
};

async function paint(id: string) {
  const { image } = await generateImage({
    model: gateway.image("openai/gpt-image-2"),
    prompt: REFERENCE.has(id) && site
      ? { images: [readFileSync(site)], text: `${SLIDES[id]} ${TEXT_STYLE}` }
      : `${SLIDES[id]} ${WITH_TEXT.has(id) ? TEXT_STYLE : STYLE}`,
    size: "1536x1024",
    providerOptions: { openai: { quality: "high" } },
  });
  // Files are renamed when a slide's picture changes, because /images is cached for a month (next.config.ts).
  const out = `public/images/landing/hero-${FILES[id] ?? id}.webp`;
  // Slides with readable words crop from the centre, so a sign is never trimmed away.
  // 1536×1024 (3:2) → centre crop to 16:9, then 1920×1080 with a Lanczos resize and a light sharpen.
  const webp = await sharp(Buffer.from(image.uint8Array)).resize(1920, 1080, { fit: "cover", position: WITH_TEXT.has(id) ? "centre" : "attention", kernel: "lanczos3" }).sharpen({ sigma: 0.6 }).webp({ quality: 86, effort: 6 }).toBuffer();
  writeFileSync(out, webp);
  console.log(`ok ${out} ${(webp.length / 1024).toFixed(0)} KB`);
}

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) throw new Error("AI_GATEWAY_API_KEY must be set.");
  const named = process.argv.slice(2).filter(arg => !arg.startsWith("--"));
  const ids = named.length ? named : Object.keys(SLIDES);
  for (const id of ids) { try { await paint(id); } catch (error) { console.error(`failed ${id}: ${String(error).slice(0, 300)}`); } }
}
void main();
