/**
 * Paints the sign-in / sign-up carousel photos (one per slide and page in components/auth-carousel.tsx; sign-up's carry a "signup-" prefix) with
 * openai/gpt-image-2 through the AI Gateway, and writes 1200×800 WebP to public/images/auth/<id>.webp. The gateway
 * allows 5 images a minute on this team, so requests are spaced and a rate-limited one waits a minute and retries.
 * When sharp cannot load (Windows Smart App Control blocks its native binary) the original PNG is written under the .webp name;
 * re-encode it to 1200×800 WebP before committing (any WebAssembly encoder works, such as @jsquash/webp).
 * Run: npx tsx --env-file=.env scripts/generate-auth-images.ts [id…]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { gateway, generateImage } from "ai";

const STYLE = "Photorealistic, cinematic editorial photograph, 35mm lens, soft natural window light, gentle depth of field, warm cream, deep green and terracotta palette, premium and calm. Absolutely no text, letters, numbers, logos, watermarks or readable screens.";
const SCENES: Record<string, string> = {
  guide: "A focused Indian high-school student at a tidy wooden desk planning their study goals: an open notebook with a hand-drawn checklist of ticks (no readable words), a laptop, a small potted plant and a wall calendar softly out of focus, morning light.",
  formats: "Close view over the shoulder of a young Indian college student reading a lesson on a tablet showing a clean diagram of boxes and arrows and colourful abstract code blocks (nothing readable), a highlighter and sticky notes beside it, a cup of chai.",
  languages: "Two Indian friends, a girl and a boy, studying together at a library table and smiling, one pointing at an open bilingual textbook with abstract English and Devanagari-like shapes (nothing readable), bookshelves warmly blurred behind them.",
  plans: "A confident young Indian professional in a bright modern co-working space looking at a laptop with a calm smile, a certificate-style card and a neat stack of books beside the laptop, a sense of achievement and progress, evening golden light.",
  // Sign-up has its own four, so no photograph repeats between the two pages.
  "signup-guide": "A young Indian woman in her early twenties sitting cross-legged on a sofa at home with a laptop on her knees, sketching a simple roadmap of circles joined by lines in a spiral notebook (nothing readable), a mug and fairy lights softly blurred behind, relaxed evening lamp light.",
  "signup-formats": "A young Indian man with headphones around his neck at a standing desk by a large window, a monitor showing an abstract flowchart of rounded boxes and a second screen with colourful abstract blocks (nothing readable), a small succulent and a notepad, bright overcast daylight.",
  "signup-languages": "An Indian grandmother and her teenage grandson sitting together at a kitchen table, both smiling at a tablet, the grandson explaining something with an open hand, steel tumblers and a fruit bowl nearby, warm afternoon sunlight through a curtained window.",
  // The two exam portals (India only): Board Scholars (Class 10 and 12 boards) and Exam Aspirants (government exams).
  "boards-chapters": "An Indian Class 10 schoolgirl in a neat school uniform at a study table at home, solving maths in a ruled notebook with a geometry box, compass and protractor beside her, a stack of textbooks (no readable titles), warm morning light through a window.",
  "boards-practice": "An Indian Class 12 schoolboy in a school uniform in a bright classroom, writing an answer sheet with focus, a wall clock softly blurred behind, other students at desks out of focus, calm exam-practice atmosphere, daylight.",
  "boards-science": "Two Indian high-school students in lab coats in a school chemistry laboratory, one carefully pouring a blue liquid into a test tube while the other watches and smiles, beakers and a periodic-table-like poster of coloured squares (nothing readable) behind them.",
  "boards-results": "A joyful Indian teenage girl hugging her proud mother in a sunlit home courtyard, holding a folded sheet of paper (nothing readable), marigold flowers and a brass lamp nearby, festive warm light, celebrating board exam results.",
  "competitive-defence": "A determined young Indian man in athletic wear running at dawn on an open parade ground lined with trees, training for a defence entrance exam, mist and golden sunrise behind him.",
  "competitive-study": "A young Indian woman aspirant studying late at a library desk with a lamp, surrounded by thick reference books and a notebook of handwritten notes (nothing readable), a wall clock blurred behind, focused and calm, warm lamp light.",
  "competitive-practice": "A young Indian man with a laptop and a printed sheet of multiple-choice bubbles (no readable text), timing himself with a wristwatch at a tidy desk in a small rented room, a wall map of India as soft coloured shapes (no labels), evening light.",
  "competitive-success": "A proud young Indian woman in formal attire standing in front of a grand sandstone government building, holding a folder with a confident smile, her father beside her beaming, clear blue sky, achievement and new beginnings.",
  "signup-plans": "A young Indian woman in a smart kurta walking out of a glass office building with a laptop bag over her shoulder and a proud smile, holding a phone, city trees and soft bokeh behind her, golden hour.",
};

type Sharp = typeof import("sharp").default;
/** sharp, or null when its native binary cannot load on this machine. */
let sharpModule: Promise<Sharp | null> | undefined;
const loadSharp = () => sharpModule ??= import("sharp").then(module => module.default).catch(() => null);

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
async function paint(id: string) {
  const out = `public/images/auth/${id}.webp`;
  for (let tries = 1; ; tries++) {
    try {
      const sharp = await loadSharp();
      const { image } = await generateImage({ model: gateway.image("openai/gpt-image-2"), prompt: `${SCENES[id]} ${STYLE}`, size: "1536x1024", providerOptions: { openai: { quality: "high" } } });
      const webp = sharp ? await sharp(Buffer.from(image.uint8Array)).resize(1200, 800, { fit: "cover", position: "attention", kernel: "lanczos3" }).sharpen({ sigma: 0.5 }).webp({ quality: 80, effort: 6 }).toBuffer() : Buffer.from(image.uint8Array);
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
