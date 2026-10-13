/**
 * Generate the pictures for the learning cards: one per vocabulary word
 * (`--set vocabulary`) or one per AWS service (`--set aws`).
 *
 * Per card: Claude designs a scene whose focal moment is the meaning
 * (scripts/card-art-director.ts), the image model paints it through the Vercel
 * AI Gateway, and Claude looks at the result. A picture a learner could not read
 * the meaning from, or one with lettering in it, is redrawn from a new scene
 * that answers the critique — up to --attempts times, keeping the best. The
 * keeper is shrunk to WebP and uploaded to the set's public Supabase Storage
 * bucket, named by slug; the cards find it through the set's NEXT_PUBLIC_* base
 * URL (lib/vocabulary-image.ts, lib/aws-service-image.ts).
 *
 * The run is resumable: cards whose file is already in the bucket are skipped,
 * so a crash, a rate limit or a deliberate --limit just means running it again.
 * Every card's scenes and verdicts are appended to --report (JSON lines).
 *
 *   npm run images:vocabulary -- --dry-run --only knell,frugal   # design scenes only, no images
 *   npm run images:aws -- --only "Amazon S3,AWS Lambda"          # a couple of cards
 *   npm run images:vocabulary -- --limit 50                      # the next 50 missing
 *   npm run images:aws                                           # everything still missing
 *   npm run images:vocabulary -- --only knell --replace          # redo one that has a picture
 *
 * Needs AI_GATEWAY_API_KEY, NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY,
 * plus ANTHROPIC_API_KEY unless VOCABULARY_DIRECTOR_VIA_GATEWAY=1. CARD_IMAGE_MODEL
 * picks the image model (default below). --rpm caps image requests per minute
 * (default 5, the gateway limit for this team); rate-limit rejections are waited
 * out, not counted as failures.
 */
import { appendFileSync } from "node:fs";
import { gateway, generateImage } from "ai";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { ENGLISH_EXAM_VOCABULARY } from "../lib/pro-learn/english-exam-vocabulary";
import { awsHighlights } from "../lib/pro-learn/aws-highlights";
import { VOCABULARY_IMAGE_BUCKET, vocabularyImageSlug, vocabularyScenePrompt } from "../lib/vocabulary-image";
import { AWS_SERVICE_IMAGE_BUCKET, awsServiceImageSlug, awsServiceScenePrompt } from "../lib/aws-service-image";
import { designScene, designServiceScene, judgePicture, judgeServicePicture, type Scene, type Verdict } from "./card-art-director";

const MODEL = process.env.CARD_IMAGE_MODEL || process.env.VOCABULARY_IMAGE_MODEL || "openai/gpt-image-1-mini";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const at = args.indexOf(`--${name}`);
  return at === -1 ? undefined : (args[at + 1] ?? "");
};
const dryRun = args.includes("--dry-run");
const replace = args.includes("--replace");
const limit = Number(flag("limit") ?? Infinity);
const concurrency = Math.max(1, Number(flag("concurrency") ?? 4));
// The gateway caps image requests per minute per model (5 on this team's plan
// for gpt-image-1-mini), so requests are started no faster than that; going
// over only buys rejections. Raise --rpm if the team's limit is raised.
const rpm = Math.max(1, Number(flag("rpm") ?? 5));
const attempts = Math.max(1, Number(flag("attempts") ?? 3));
const setName = flag("set") ?? "vocabulary";
const report = flag("report") ?? `${setName}-images-report.jsonl`;
const only = flag("only")?.split(",").map(name => name.trim().toLowerCase()).filter(Boolean);

/** One kind of card picture: where the subjects come from and how each is briefed, painted and stored. */
type PictureSet = {
  bucket: string;
  /** Portrait for the vocabulary flashcard, landscape for the AWS card banner. */
  shape: { openai: "1024x1536" | "1536x1024"; ratio: "3:4" | "3:2"; width: number; height: number };
  subjects: { name: string; slug: string; design: (critique?: string) => Promise<Scene>; prompt: (scene: string) => string; judge: (jpeg: Buffer) => Promise<Verdict> }[];
};

function pictureSet(name: string): PictureSet {
  if (name === "aws") return {
    bucket: AWS_SERVICE_IMAGE_BUCKET,
    shape: { openai: "1536x1024", ratio: "3:2", width: 960, height: 640 },
    subjects: awsHighlights().map(service => ({
      name: service.name,
      slug: awsServiceImageSlug(service.name),
      design: critique => designServiceScene(service, critique),
      prompt: scene => awsServiceScenePrompt({ name: service.name, scene }),
      judge: jpeg => judgeServicePicture(service, jpeg),
    })),
  };
  if (name === "vocabulary") return {
    bucket: VOCABULARY_IMAGE_BUCKET,
    shape: { openai: "1024x1536", ratio: "3:4", width: 720, height: 960 },
    subjects: ENGLISH_EXAM_VOCABULARY.map(entry => ({
      name: entry.word,
      slug: vocabularyImageSlug(entry.word),
      design: critique => designScene(entry, critique),
      prompt: scene => vocabularyScenePrompt({ word: entry.word, scene }),
      judge: jpeg => judgePicture(entry, jpeg),
    })),
  };
  throw new Error(`--set must be "vocabulary" or "aws", not "${name}"`);
}

/** A picture passes when its meaning reads from the picture alone and it carries no lettering. */
const passes = (verdict: Verdict) => verdict.score >= 4 && !verdict.has_text;
/** Lettering costs more than a weaker reading: a clear picture with text in it is the worse keeper. */
const merit = (verdict: Verdict) => verdict.score - Number(verdict.has_text) * 3;

async function main() {
  const set = pictureSet(setName);
  // One file per slug: a word listed twice under two categories gets one picture.
  const seen = new Set<string>();
  let subjects = set.subjects.filter(subject => {
    if (!subject.slug || seen.has(subject.slug)) return false;
    seen.add(subject.slug);
    return !only || only.includes(subject.name.toLowerCase());
  });

  if (dryRun) {
    for (const subject of subjects.slice(0, Number.isFinite(limit) ? limit : 3)) {
      const scene = await subject.design();
      console.log(`── ${subject.slug}.webp  [cue: ${scene.focal_cue}]\n${subject.prompt(scene.scene)}\n`);
    }
    console.log(`${subjects.length} ${setName} cards would be considered. Image model: ${MODEL}. No images were generated.`);
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) throw new Error("AI_GATEWAY_API_KEY must be set.");
  const storage = createClient(url, key, { auth: { persistSession: false } }).storage;

  const { data: bucket } = await storage.getBucket(set.bucket);
  if (!bucket) {
    const { error } = await storage.createBucket(set.bucket, { public: true, allowedMimeTypes: ["image/webp"], fileSizeLimit: "2MB" });
    if (error) throw error;
    console.log(`Created public bucket "${set.bucket}".`);
  }

  const existing = new Set<string>();
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await storage.from(set.bucket).list("", { limit: 1000, offset });
    if (error) throw error;
    for (const file of data) existing.add(file.name);
    if (data.length < 1000) break;
  }

  if (!replace) subjects = subjects.filter(subject => !existing.has(`${subject.slug}.webp`));
  subjects = subjects.slice(0, limit);
  console.log(`${existing.size} already in "${set.bucket}"; generating ${subjects.length} with ${MODEL}, ${concurrency} at a time, at most ${rpm} images a minute, up to ${attempts} attempts each.`);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  // Each image request waits for the next free slot, spaced evenly across the minute.
  let nextSlot = Date.now();
  const takeSlot = async () => {
    const at = Math.max(nextSlot, Date.now());
    nextSlot = at + 60_000 / rpm;
    await sleep(at - Date.now());
  };
  const rateLimited = (error: unknown) => /rate limit/i.test(error instanceof Error ? `${error.name} ${error.message}` : String(error));

  async function paint(prompt: string) {
    // A rate-limit rejection is not the card's fault: wait out the window and
    // try the same prompt again rather than recording the card as failed.
    for (let tries = 1; ; tries++) {
      await takeSlot();
      try {
        const { image } = await generateImage({
          model: gateway.image(MODEL),
          prompt,
          // OpenAI's image models take a fixed size; the rest take a ratio.
          ...(MODEL.startsWith("openai/") ? { size: set.shape.openai } : { aspectRatio: set.shape.ratio }),
          maxRetries: 1,
        });
        return image.uint8Array;
      } catch (error) {
        if (!rateLimited(error) || tries >= 10) throw error;
        nextSlot = Math.max(nextSlot, Date.now() + 61_000);
      }
    }
  }

  const failures: string[] = [], weak: string[] = [];
  let done = 0;
  const queue = [...subjects];
  async function worker() {
    for (let subject = queue.shift(); subject; subject = queue.shift()) {
      const file = `${subject.slug}.webp`;
      const log: { scene: string; cue: string; verdict: Verdict }[] = [];
      try {
        let best: { webp: Buffer; verdict: Verdict } | undefined;
        let critique: string | undefined;
        for (let attempt = 1; attempt <= attempts; attempt++) {
          const scene = await subject.design(critique);
          const raw = await paint(subject.prompt(scene.scene));
          const webp = await sharp(raw).resize(set.shape.width, set.shape.height, { fit: "cover", position: "attention" }).webp({ quality: 72 }).toBuffer();
          const verdict = await subject.judge(await sharp(webp).resize(480).jpeg({ quality: 80 }).toBuffer());
          log.push({ scene: scene.scene, cue: scene.focal_cue, verdict });
          if (!best || merit(verdict) > merit(best.verdict)) best = { webp, verdict };
          if (passes(verdict)) break;
          critique = `${verdict.has_text ? "It contained visible lettering or a logo. " : ""}Scored ${verdict.score}/5: ${verdict.problem}`;
        }
        const { error } = await storage.from(set.bucket).upload(file, best!.webp, { contentType: "image/webp", cacheControl: "31536000", upsert: true });
        if (error) throw error;
        if (!passes(best!.verdict)) weak.push(subject.name);
        console.log(`[${++done}/${subjects.length}] ${file} score ${best!.verdict.score}/5 after ${log.length} ${log.length === 1 ? "try" : "tries"}${passes(best!.verdict) ? "" : " (weak)"}`);
      } catch (error) {
        failures.push(subject.name);
        console.error(`[failed] ${subject.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
      appendFileSync(report, `${JSON.stringify({ name: subject.name, attempts: log })}\n`);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));

  console.log(`\nDone: ${done} uploaded (${weak.length} below 4/5 after ${attempts} tries), ${failures.length} failed.`);
  if (weak.length) console.log(`Weak pictures to review: ${weak.join(", ")}`);
  if (failures.length) console.log(`Retry with: npm run images:${setName} -- --only "${failures.join(",")}"`);
  console.log(`Card base URL: ${url.replace(/\/+$/, "")}/storage/v1/object/public/${set.bucket}`);
  if (failures.length) process.exitCode = 1;
}

main().catch(error => { console.error(error); process.exit(1); });
