/**
 * Paints the landing "Featured lessons" carousel covers (and the Coffee & Code section photo) with
 * openai/gpt-image-2 through the AI Gateway, then writes 1200×800 WebP to public/images/landing/lessons/<id>.webp
 * (the photo to public/images/landing/feature-coffee.webp, each Coffee & Code article's cover to
 * public/images/landing/coffee/<slug>.webp, the Notes & bookmarks carousel's to public/images/landing/notes/<id>.webp, the AI Search carousel's to
 * public/images/landing/search/<id>.webp). The gateway allows 5 images a minute on this team, so
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
// One cover per Coffee & Code article (lib/coffee-and-code.ts), keyed by slug; run with `coffee:<slug>` for one.
const ARTICLES: Record<string, { subject: string; scene: string }> = {
  "useeffect-is-not-a-lifecycle": { subject: "React useEffect and rendering", scene: "A glass React component cube on a desk computing a glowing total inside itself during render, while a single tidy cable labelled only by colour reaches out of it to an external device (a small network router), showing effects are only for syncing with the outside world." },
  "server-and-client-components": { subject: "Next.js server and client components", scene: "A split scene: on the left a calm server room tower assembling page tiles, on the right a browser window receiving them, with only one small glowing interactive button cube crossing the boundary on a conveyor." },
  "closures-in-five-minutes": { subject: "JavaScript closures", scene: "Nested translucent glass bubbles one inside another, the innermost holding a small glowing function orb that carries a tiny backpack of coloured variable cubes from the outer bubbles as it floats away." },
  "python-async-without-confusion": { subject: "Python async and await", scene: "A single elegant circular event-loop track with several small task carts paused at stations waiting on hourglasses, while one cart moves forward, a python-green and blue palette." },
  "rebase-or-merge": { subject: "Git rebase versus merge", scene: "Two railway branches of coloured commit beads: on one side they join with a merge junction knot, on the other the beads are lifted and placed neatly in a straight line on the main track." },
  "typescript-narrowing": { subject: "TypeScript type narrowing", scene: "A funnel of glass filters sorting mixed shaped tokens (circles, squares, triangles) into separate precise lanes, each lane lit with a check mark glow, a blue palette." },
  "rate-limiter-token-bucket": { subject: "a token bucket rate limiter", scene: "A transparent bucket slowly refilling with glowing tokens from a tap at a steady drip, request envelopes queued at a gate taking one token each, a few envelopes politely waiting." },
  "redis-cache-aside": { subject: "Redis cache-aside caching", scene: "An application robot first reaching into a fast red cache drawer beside it, and on a miss walking a short path to a large database vault, then placing a copy in the drawer for next time." },
};
// The Notes & bookmarks carousel (components/landing-features.tsx); run with `notes:<id>` for one.
const NOTES: Record<string, { subject: string; scene: string }> = {
  "topic-notes": { subject: "focused topic notes", scene: "A neat stack of crisp study note cards fanned on a desk, each card with clean coloured headings shown as bars and a small diagram sketch, a pen resting beside them, soft morning light." },
  "priority-stars": { subject: "priority-ranked revision topics", scene: "A row of glass study cards standing like a podium, the tallest crowned with five glowing golden stars, the next with four and three, a calm sense of ranking what matters most." },
  bookmarks: { subject: "bookmarking lessons", scene: "Open books and a tablet with colourful ribbon bookmarks and glowing bookmark tabs sticking out of their pages, a hand placing one more ribbon, warm terracotta and cream tones." },
  "revision-list": { subject: "a single revision list", scene: "A tidy checklist clipboard floating at the centre with saved items flowing into it from books, a laptop and a phone along gentle curved light trails, ticks appearing beside each line." },
  "offline-notes": { subject: "downloading notes for offline revision", scene: "A student on an Indian train by the window revising printed notes and a phone showing a download arrow icon, countryside softly blurred outside, cosy and focused." },
  "two-languages": { subject: "notes in English and Hindi", scene: "Two matching note cards side by side on a desk, one with abstract Latin letter shapes and one with abstract Devanagari shapes (nothing readable), joined by a soft glowing two-way arrow." },
};
// The AI Search carousel (components/landing-features.tsx); run with `search:<id>` for one.
const SEARCH: Record<string, { subject: string; scene: string }> = {
  "plain-words": { subject: "asking an AI search a question in plain words", scene: "A large friendly glowing search bar floating above a desk with a speech-bubble question mark rising into it, soft sparkles, a student's hand typing on a keyboard below." },
  "answer-card": { subject: "an AI answer card", scene: "A single elegant answer card floating forward from a glowing search orb: a bold headline bar at the top, three tidy bullet rows with check marks, calm and confident." },
  "related-topics": { subject: "related topics that lead to the next question", scene: "A central glowing topic node connected by curved light paths to a ring of smaller topic cards, like a constellation map guiding the learner onward." },
  "by-technology": { subject: "exploring topics by technology", scene: "Neat shelves of colourful technology blocks (a cloud, a database cylinder, a gear, a brain orb, a code bracket shape) with a magnifying glass gliding along them." },
  "history-kept": { subject: "search history kept and reused", scene: "A tidy vertical timeline of past question cards stacked like a softly glowing archive, one card being pulled out and lighting up instantly, a small clock beside it." },
  "two-languages": { subject: "asking in English or Hindi", scene: "Two speech bubbles, one with abstract Latin letter shapes and one with abstract Devanagari shapes (nothing readable), both flowing into one glowing search orb that returns a single answer card." },
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
  mkdirSync("public/images/landing/coffee", { recursive: true });
  mkdirSync("public/images/landing/notes", { recursive: true });
  mkdirSync("public/images/landing/search", { recursive: true });
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : [...Object.keys(COVERS), "coffee"];
  const jobs = ids.map(id => id === "coffee"
    ? () => paint(COFFEE, "public/images/landing/feature-coffee.webp", [1600, 1200])
    : id.startsWith("search:")
    ? () => { const key = id.slice(7); return paint(learningScenePrompt(SEARCH[key]), `public/images/landing/search/${key}.webp`, [1200, 800]); }
    : id.startsWith("notes:")
    ? () => { const key = id.slice(6); return paint(learningScenePrompt(NOTES[key]), `public/images/landing/notes/${key}.webp`, [1200, 800]); }
    : id.startsWith("coffee:")
    ? () => { const slug = id.slice(7); return paint(learningScenePrompt(ARTICLES[slug]), `public/images/landing/coffee/${slug}.webp`, [1200, 800]); }
    : () => paint(learningScenePrompt({ subject: COVERS[id].subject, scene: COVERS[id].scene }), `public/images/landing/lessons/${id}.webp`, [1200, 800]));
  // At most 5 a minute: start one every 13 seconds, several in flight at once.
  await Promise.all(jobs.map((job, index) => wait(index * 13_000).then(job)));
}
void main();
