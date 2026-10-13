/**
 * Claude as the art director for the card pictures (vocabulary words and AWS services).
 *
 * The handbook's example sentences are often office-flavoured ("keep the status
 * update succinct"), and a picture of that sentence is just people at a table —
 * it says nothing about the word. So Claude first designs a scene whose single
 * focal moment *is* the meaning (the way a bell tolling over a funeral is
 * "knell"), and after the image comes back, looks at it and says whether a
 * student could read the meaning from the picture alone. A picture that fails
 * is redrawn with that critique folded into a new scene.
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

// VOCABULARY_DIRECTOR_VIA_GATEWAY=1 sends these calls through the Vercel AI
// Gateway's Anthropic-compatible endpoint, so one gateway balance pays for both
// the scenes and the pictures; otherwise they go to the Anthropic API directly.
const viaGateway = process.env.VOCABULARY_DIRECTOR_VIA_GATEWAY === "1";
const MODEL = process.env.VOCABULARY_DIRECTOR_MODEL || (viaGateway ? "anthropic/claude-opus-5-5" : "claude-opus-5-5");
const client = viaGateway
  ? new Anthropic({ apiKey: process.env.AI_GATEWAY_API_KEY, baseURL: "https://ai-gateway.vercel.sh" })
  : new Anthropic();

type Word = { word: string; meaning: string; sentence: string; hindi?: string };
/** An AWS service card: what it is called and what it does. */
type Service = { name: string; category: string; summary: string; points?: string[] };

const SceneSchema = z.object({
  scene: z.string().describe("The scene to paint, 60-110 words, concrete and literal."),
  focal_cue: z.string().describe("A short phrase naming what in the picture carries the meaning."),
});
export type Scene = z.infer<typeof SceneSchema>;

const VerdictSchema = z.object({
  score: z.number().int().min(1).max(5).describe("5 = the meaning is unmistakable from the picture alone; 1 = unrelated."),
  has_text: z.boolean().describe("True if any letters, words, numbers or signage are visible."),
  problem: z.string().describe("If score < 5, what keeps the picture from showing the meaning; otherwise empty."),
});
export type Verdict = z.infer<typeof VerdictSchema>;

const DIRECTOR = `You design the picture on a vocabulary flashcard for Indian students preparing for competitive exams (SSC, banking, CAT). The card prints the word and its meaning under the picture; the picture's job is to make the meaning stick, so a student seeing only the picture should be able to guess what the word means.

Design one photorealistic scene whose single focal moment IS the core meaning:
- Depict the meaning itself, literally and unmistakably. Do not illustrate the example sentence when its setting is abstract (meetings, emails, reports, strategy); invent a vivid everyday moment instead.
- For abstract words, use the clearest familiar visual metaphor, exaggerated enough to read at a glance: "knell" → a great bell tolling above mourners at a funeral; "frugal" → a man carefully counting a few coins and patching his old shoes while a shop full of goods tempts him; "verbose" → a speaker talking endlessly while the listeners yawn and doze.
- Show emotion and body language that carry the meaning. Avoid generic scenes of people sitting and talking unless the manner of speaking is the meaning, and then make that manner obvious.
- Where people appear, prefer Indian people and Indian settings, unless the meaning calls for something else.
- No text, letters, numbers, signs, screens or documents with writing. Tasteful: no gore, no nudity, nothing frightening for teenagers.`;

const AWS_DIRECTOR = `You design the illustration across the top of a learning card for one AWS service, for students new to cloud computing. A learner glancing at the picture should grasp what the service does before reading a word.

Design one 3D isometric illustration whose focal action IS the service's job:
- Show the job as a clear physical metaphor: object storage as labelled-free buckets and crates of files on shelves; serverless functions as small machines that spring to life when a lightning trigger hits them; a load balancer as a traffic officer spreading cars evenly across lanes; a queue as parcels waiting on a conveyor belt for workers.
- Make it specific to this service, so it could not be mistaken for a neighbouring one in the same category (S3 versus EFS, SQS versus SNS).
- One focal action, a few supporting details, friendly and uncluttered.
- No AWS or Amazon logos, no brand marks, no text, letters, numbers or labels anywhere, no screens with writing.`;

const AWS_JUDGE = `You check card illustrations for a cloud-computing course. You are shown one picture and the AWS service it is meant to explain. Judge strictly whether a learner who sees only the picture would grasp what the service does. A generic cloud, server rack or abstract tech scene that could illustrate many services scores 2 at most. Any visible logo or brand mark counts as text.`;

const JUDGE = `You check flashcard pictures for a vocabulary course. You are shown one picture and the word it is meant to teach. Judge strictly whether a student who sees only the picture would grasp the word's meaning. A pleasant but generic scene that could equally illustrate many other words scores 2 at most.`;

export async function designServiceScene(service: Service, critique?: string): Promise<Scene> {
  return scene(AWS_DIRECTOR, [
    `Service: ${service.name}`,
    `Category: ${service.category}`,
    `What it does: ${service.summary}`,
    service.points?.length ? `Key facts: ${service.points.slice(0, 4).join(" ")}` : "",
  ], service.name, critique);
}

export async function judgeServicePicture(service: Service, jpeg: Buffer): Promise<Verdict> {
  return verdict(AWS_JUDGE, `Service: ${service.name}\nWhat it does: ${service.summary}`, service.name, jpeg);
}

export async function designScene(entry: Word, critique?: string): Promise<Scene> {
  return scene(DIRECTOR, [
    `Word: ${entry.word}`,
    `Meaning: ${entry.meaning}`,
    entry.hindi ? `Hindi meaning: ${entry.hindi}` : "",
    `Example sentence (context only): ${entry.sentence}`,
  ], entry.word, critique);
}

async function scene(system: string, brief: string[], subject: string, critique?: string): Promise<Scene> {
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    system,
    output_config: { effort: "medium", format: zodOutputFormat(SceneSchema) },
    messages: [{
      role: "user",
      content: [
        ...brief,
        critique ? `\nA previous picture failed review: ${critique}\nDesign a different scene that fixes this.` : "",
      ].filter(Boolean).join("\n"),
    }],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) throw new Error(`no scene for "${subject}" (${response.stop_reason})`);
  return response.parsed_output;
}

export async function judgePicture(entry: Word, jpeg: Buffer): Promise<Verdict> {
  return verdict(JUDGE, `Word: ${entry.word}\nMeaning: ${entry.meaning}`, entry.word, jpeg);
}

async function verdict(system: string, subjectText: string, subject: string, jpeg: Buffer): Promise<Verdict> {
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 3000,
    system,
    output_config: { effort: "low", format: zodOutputFormat(VerdictSchema) },
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: "image/jpeg", data: jpeg.toString("base64") } },
        { type: "text", text: subjectText },
      ],
    }],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) throw new Error(`no verdict for "${subject}" (${response.stop_reason})`);
  return response.parsed_output;
}
