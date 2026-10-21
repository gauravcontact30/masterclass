/**
 * Paints the landing "Featured lessons" carousel covers (and the Coffee & Code section photo) with
 * openai/gpt-image-2 through the AI Gateway, then writes 1200×800 WebP to public/images/landing/lessons/<id>.webp
 * (the photo to public/images/landing/feature-coffee.webp). The gateway allows 5 images a minute on this team, so
 * requests are spaced and a rate-limited one waits a minute and retries.
 * Run: npx tsx --env-file=.env scripts/generate-lesson-covers.ts [id…]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { gateway, generateImage } from "ai";
import { learningScenePrompt } from "../lib/learning-image";

const COVERS: Record<string, { subject: string; scene: string }> = {
  "react-hooks": { subject: "React hooks", scene: "A sleek glass component block on a pedestal with glowing hooks gently lifting small cubes labelled only by colour into it: a teal state cube, a coral effect cube looping back on a curved arrow, an amber memo cube under a glass dome, showing how hooks plug state and side effects into a component." },
  nextjs: { subject: "Next.js 16 full-stack framework", scene: "A modern isometric web server tower made of stacked layers: a glowing server layer rendering page tiles that stream down a conveyor to a browser window, a cache vault with neat shelves of pre-built pages, and a fast lightning route connecting them." },
  aws: { subject: "popular AWS cloud services", scene: "An isometric floating cloud city: a compute block with spinning gears, a storage warehouse of neat crates, a database cylinder vault, a serverless lambda spark and a global network of glowing arcs between them, orange and slate tones." },
  "agentic-ai": { subject: "agentic AI concepts", scene: "A friendly robot planner at a round table breaking a big glowing task orb into smaller steps, reaching out with tools (a magnifier, a wrench, a calendar) on a loop of plan, act and reflect arrows around it." },
  langchain: { subject: "LangChain", scene: "Glowing chain links connecting modular blocks in a row: a document stack, a prompt template card, a language model brain orb and an output scroll, data flowing as light along the chain." },
  langgraph: { subject: "LangGraph stateful agent graphs", scene: "An elegant node graph floating in space: rounded nodes joined by glowing directed edges with one edge looping back to an earlier node, a small memory crystal at the centre holding state." },
  langsmith: { subject: "LangSmith tracing and evaluation", scene: "A precision inspection workbench with a magnifying lens over a timeline of glowing trace bars, a dashboard of gauges and check marks, and a scale weighing two answer cards." },
  langflow: { subject: "LangFlow visual AI builder", scene: "A clean visual canvas with draggable rounded cards wired together by smooth curved connector cables, a hand placing one card, a soft glowing output preview at the end of the flow." },
  "system-design": { subject: "system design at scale", scene: "An isometric architecture blueprint come to life: a load balancer gate splitting traffic into three server towers, a cache layer, a replicated database pair and a message queue conveyor, tidy and balanced." },
  n8n: { subject: "n8n workflow automation", scene: "An automation assembly line of connected circular nodes passing envelopes, data cards and calendar tiles along glowing pipes, a trigger bell at the start and a checkmark box at the end." },
  "ai-latest": { subject: "the latest developments in artificial intelligence", scene: "A bright news desk of the future: a glowing AI core orb above a tablet showing fresh colourful cards rising like a morning sunrise, a calendar page turning to a new day beside it." },
};
const COFFEE = "A cosy, modern developer cafe corner at morning light: a steaming ceramic coffee cup beside an open laptop showing colourful abstract code blocks (no readable text), a notebook with a hand-drawn architecture sketch, a croissant on a small plate, a young Indian developer smiling while reading, warm cream and terracotta palette. Photorealistic, cinematic editorial photograph, 35mm lens, gentle depth of field, premium and calm. Absolutely no text, letters, numbers, logos, watermarks or readable screens.";

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
async function paint(prompt: string, out: string, size: [number, number]) {
  for (let tries = 1; ; tries++) {
    try {
      const { image } = await generateImage({ model: gateway.image("openai/gpt-image-2"), prompt, size: "1536x1024", providerOptions: { openai: { quality: "high" } } });
      const webp = await sharp(Buffer.from(image.uint8Array)).resize(size[0], size[1], { fit: "cover", position: "attention", kernel: "lanczos3" }).sharpen({ sigma: 0.5 }).webp({ quality: 80, effort: 6 }).toBuffer();
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
  mkdirSync("public/images/landing/lessons", { recursive: true });
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : [...Object.keys(COVERS), "coffee"];
  const jobs = ids.map(id => id === "coffee"
    ? () => paint(COFFEE, "public/images/landing/feature-coffee.webp", [1600, 1200])
    : () => paint(learningScenePrompt({ subject: COVERS[id].subject, scene: COVERS[id].scene }), `public/images/landing/lessons/${id}.webp`, [1200, 800]));
  // At most 5 a minute: start one every 13 seconds, several in flight at once.
  await Promise.all(jobs.map((job, index) => wait(index * 13_000).then(job)));
}
void main();
