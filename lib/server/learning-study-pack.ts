import "server-only";
import { z } from "zod";
import { gateway, generateImage, generateText, Output } from "ai";
import { db } from "./db";
import { providerConfigured, providerModel } from "./ai-providers";
import { LEARNING_IMAGE_BUCKET, learningScenePrompt } from "@/lib/learning-image";
import { DIAGRAM_KINDS, type StudyPack } from "@/lib/learning-uploads";

const ENTITIES: Record<string, string> = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", "#39": "'" };
/** The upload's text without markup (DOMParser is browser-only): one line per block, entities decoded, code kept as written. */
function htmlText(html: string) {
  return html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ").replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|tr|pre|blockquote)>/gi, "\n").replace(/<[^>]+>/g, " ")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+\d*);/gi, (entity, name: string) => name[0] !== "#" ? ENTITIES[name.toLowerCase()] ?? entity
      : String.fromCodePoint(name[1].toLowerCase() === "x" ? parseInt(name.slice(2), 16) : Number(name.slice(1))))
    .replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
}

/*
 * The study pack behind a Learning Dashboard upload's "Read more" window, made through Vercel AI Gateway: the text
 * model writes a description, the most-asked interview questions, a workflow, a diagram and scenes for pictures;
 * the image model paints a thumbnail and up to two illustrations. Pictures are stored as webp in the public
 * learning-images bucket under uploads/<id>/, like the other card pictures. A picture that fails is left out; the
 * pack itself only fails when the text does.
 */
const IMAGE_MODEL = process.env.CARD_IMAGE_MODEL || "openai/gpt-image-2";
const FOLDER = "uploads";

// No min/max on the arrays: some providers reject them in structured output, so counts are asked for in the prompt
// and enforced after.
const draftSchema = z.object({
  description: z.string().describe("Two or three plain sentences saying what this topic is and why it matters."),
  interview: z.array(z.object({ question: z.string(), answer: z.string().describe("A to-the-point answer, two to five sentences.") })).describe("Six most-asked interview questions."),
  workflow: z.array(z.object({ title: z.string().describe("A short step name."), detail: z.string().describe("One or two sentences.") })).describe("Four to seven steps in order."),
  diagram: z.object({
    title: z.string(),
    nodes: z.array(z.object({
      id: z.string().describe("A short slug, unique in the diagram."),
      label: z.string().describe("At most three words, e.g. 'Load balancer'."),
      detail: z.string().describe("A one-to-three word subtitle, e.g. 'Redis' or 'browser / app'."),
      kind: z.enum(DIAGRAM_KINDS).describe("client: who starts the flow; edge: gateways, load balancers, CDNs; service: code that does the work; data: caches, databases, queues, storage."),
    })).describe("Four to eight parts."),
    edges: z.array(z.object({ from: z.string(), to: z.string(), label: z.string().optional().describe("At most three words naming what passes, e.g. 'POST / GET'."), dashed: z.boolean().optional().describe("True when the hop only happens sometimes, such as a cache miss or a retry.") })),
  }),
  thumbnailScene: z.string().describe("A concrete visual scene for the cover picture, with no text in it."),
  illustrations: z.array(z.object({ scene: z.string().describe("A concrete visual scene, with no text in it."), caption: z.string().describe("What the picture explains, in one short sentence.") })).describe("Two pictures that explain key ideas."),
});

const SYSTEM = [
  "You turn a learning article into a study pack for students preparing for technical interviews.",
  "Stay faithful to the article; where it is thin, use well-established facts about its topic. Never invent APIs or version numbers.",
  "Write in clear, simple English. Interview answers are to the point: lead with the answer, then the one reason or example that makes it stick.",
  "The diagram reads left to right like a system-design sketch: a main flow of four to six nodes in order, from whoever starts it to where the data ends up; at most two side nodes hanging off one of them; and optionally one edge from a later node back to the first for the response. Every edge must join ids that exist in nodes.",
  "Picture scenes describe objects and actions only; pictures must contain no text, letters, numbers, code or logos.",
].join("\n");

const clip = (text: string, max: number) => text.trim().replace(/\s+/g, " ").slice(0, max);

/** Keeps the parts of a model's diagram that make a valid graph: unique ids, edges between known nodes. */
export function cleanDiagram(diagram: z.infer<typeof draftSchema>["diagram"]): StudyPack["diagram"] {
  const seen = new Set<string>();
  const nodes = diagram.nodes.map(node => ({ id: clip(node.id, 40), label: clip(node.label, 40), ...(node.detail?.trim() ? { detail: clip(node.detail, 40) } : {}), ...(DIAGRAM_KINDS.includes(node.kind) ? { kind: node.kind } : {}) })).filter(node => node.id && node.label && !seen.has(node.id) && seen.add(node.id)).slice(0, 10);
  const ids = new Set(nodes.map(node => node.id));
  const edges = diagram.edges.filter(edge => ids.has(edge.from) && ids.has(edge.to) && edge.from !== edge.to).slice(0, 16)
    .map(edge => ({ from: edge.from, to: edge.to, ...(edge.label?.trim() ? { label: clip(edge.label, 30) } : {}), ...(edge.dashed ? { dashed: true } : {}) }));
  return { title: clip(diagram.title, 80), nodes, edges };
}

async function paint(prompt: string): Promise<Buffer> {
  const { image } = await generateImage({
    model: gateway.image(IMAGE_MODEL),
    prompt,
    // OpenAI's image models take a fixed size; the rest take a ratio.
    ...(IMAGE_MODEL.startsWith("openai/") ? { size: "1536x1024" as const } : { aspectRatio: "3:2" as const }),
    maxRetries: 1,
    abortSignal: AbortSignal.timeout(150_000),
  });
  const { default: sharp } = await import("sharp");
  return sharp(image.uint8Array).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
}

async function store(path: string, webp: Buffer) {
  const storage = db().storage;
  let { error } = await storage.from(LEARNING_IMAGE_BUCKET).upload(path, webp, { contentType: "image/webp", cacheControl: "31536000", upsert: true });
  if (error && /bucket not found/i.test(error.message)) {
    await storage.createBucket(LEARNING_IMAGE_BUCKET, { public: true, allowedMimeTypes: ["image/webp"], fileSizeLimit: "2MB" });
    ({ error } = await storage.from(LEARNING_IMAGE_BUCKET).upload(path, webp, { contentType: "image/webp", cacheControl: "31536000", upsert: true }));
  }
  if (error) throw new Error(error.message);
  return storage.from(LEARNING_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Writes the pack for one upload; `version` keeps each edit's pictures at their own address, so caches never show stale ones. */
export async function buildStudyPack(upload: { id: string; title: string; summary: string | null; html: string; tags: string[]; version: number }): Promise<{ thumbnailUrl: string | null; pack: StudyPack }> {
  if (!providerConfigured("gateway")) throw new Error("ai_gateway_not_configured");
  const model = providerModel("gateway");
  const article = clip(htmlText(upload.html), 24_000);
  const { output } = await generateText({
    model: gateway(model),
    system: SYSTEM,
    prompt: `Title: ${upload.title}\n${upload.summary ? `Summary: ${upload.summary}\n` : ""}${upload.tags.length ? `Tags: ${upload.tags.join(", ")}\n` : ""}\nArticle:\n${article || "(no body text; work from the title)"}`,
    output: Output.object({ schema: draftSchema }),
    maxRetries: 2,
    abortSignal: AbortSignal.timeout(120_000),
  });
  const subject = upload.title;
  const scenes = [{ scene: output.thumbnailScene, caption: "" }, ...output.illustrations.slice(0, 2)];
  const painted = await Promise.allSettled(scenes.map(async ({ scene }, index) =>
    store(`${FOLDER}/${upload.id}/v${upload.version}-${index === 0 ? "cover" : `figure-${index}`}.webp`, await paint(learningScenePrompt({ subject, scene })))));
  painted.forEach((result, index) => { if (result.status === "rejected") console.error(`learning study pack: picture ${index} for ${upload.id} failed`, result.reason); });
  const url = (index: number) => painted[index]?.status === "fulfilled" ? (painted[index] as PromiseFulfilledResult<string>).value : null;
  const images = scenes.slice(1).flatMap((item, index) => { const at = url(index + 1); return at ? [{ url: at, caption: clip(item.caption, 160) }] : []; });
  return {
    thumbnailUrl: url(0),
    pack: {
      description: clip(output.description, 600),
      interview: output.interview.filter(item => item.question.trim() && item.answer.trim()).slice(0, 8).map(item => ({ question: clip(item.question, 240), answer: item.answer.trim().slice(0, 1500) })),
      workflow: output.workflow.filter(step => step.title.trim()).slice(0, 8).map(step => ({ title: clip(step.title, 80), detail: clip(step.detail, 400) })),
      diagram: cleanDiagram(output.diagram),
      images, model, generatedAt: new Date().toISOString(),
    },
  };
}
