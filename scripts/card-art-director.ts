/**
 * Claude as the art director for the card pictures (vocabulary words, AWS services,
 * the software-engineering topics, API entries, workflows, docs, notes, lessons
 * and guides, and the exam and school learning paths).
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
// A short deadline per request (retried by the SDK) so one dropped connection
// cannot stall a run of thousands of cards.
const client = viaGateway
  ? new Anthropic({ apiKey: process.env.AI_GATEWAY_API_KEY, baseURL: "https://ai-gateway.vercel.sh", timeout: 120_000, maxRetries: 3 })
  : new Anthropic({ timeout: 120_000, maxRetries: 3 });

type Word = { word: string; meaning: string; sentence: string; hindi?: string };
/** An AWS service card: what it is called and what it does. */
type Service = { name: string; category: string; summary: string; points?: string[] };

const SceneSchema = z.object({
  scene: z.string().describe("The scene to paint, 60-110 words, concrete and literal."),
  focal_cue: z.string().describe("A short phrase naming what in the picture carries the meaning."),
  distinct: z.boolean().describe("False only if no picture could show this subject distinctly from its close neighbours: a configuration setting, an environment variable, a URL option, or the difference between two similarly named functions. True for almost everything else."),
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
- No text, letters, numbers, signs, screens or documents with writing. Tasteful: no gore, no nudity, nothing frightening for teenagers.
- The image model's safety filter rejects anything that could read as violence or harm, so show strength, struggle or hardship through calm, positive moments (a farmer working on through the rain, a sapling growing through rock) rather than fights, falls, injury, weapons, storms battering people or anyone in danger.`;

const AWS_DIRECTOR = `You design the illustration across the top of a learning card for one AWS service, for students new to cloud computing. A learner glancing at the picture should grasp what the service does before reading a word.

Design one 3D isometric illustration whose focal action IS the service's job:
- Show the job as a clear physical metaphor: object storage as labelled-free buckets and crates of files on shelves; serverless functions as small machines that spring to life when a lightning trigger hits them; a load balancer as a traffic officer spreading cars evenly across lanes; a queue as parcels waiting on a conveyor belt for workers.
- Make it specific to this service, so it could not be mistaken for a neighbouring one in the same category (S3 versus EFS, SQS versus SNS).
- One focal action, a few supporting details, friendly and uncluttered.
- No AWS or Amazon logos, no brand marks, no text, letters, numbers or labels anywhere, no screens with writing.`;

const AWS_JUDGE = `You check card illustrations for a cloud-computing course. You are shown one picture and the AWS service it is meant to explain. Judge strictly whether a learner who sees only the picture would grasp what the service does. A generic cloud, server rack or abstract tech scene that could illustrate many services scores 2 at most. Any visible logo or brand mark counts as text.`;

const JUDGE = `You check flashcard pictures for a vocabulary course. You are shown one picture and the word it is meant to teach. Judge strictly whether a student who sees only the picture would grasp the word's meaning. A pleasant but generic scene that could equally illustrate many other words scores 2 at most.`;

const TECH_DIRECTOR = `You design the illustration across the top of a learning card for one software-engineering topic: a language feature, an API function or class, a library, a framework concept, or an end-to-end workflow. The learners are developers studying it for the first time. A learner glancing at the picture should grasp how the thing works before reading a word.

Design one 3D isometric illustration whose focal action IS the mechanism:
- Show the mechanism as a clear physical metaphor: a map() call as a conveyor belt where each parcel passes through one stamping machine and comes out changed; a cache as a small shelf by the counter that a clerk reaches for before walking to the big warehouse; a React state update as a puppet stage where one lever re-poses the puppet; a database migration as movers carefully reshaping a building's rooms while it stays open.
- For a process, a pipeline or an execution flow, lay at most four stages out left to right as distinct stations joined by belts, pipes or paths, with one work item visibly travelling through them; show the one step that defines this flow (a pause for human approval, a retry loop, a fan-out to parallel workers, a hand-off between agents) as the largest, most obvious element: a gate with an attendant holding the parcel, a return chute, a belt splitting into lanes, workers passing a parcel.
- When the idea is a contrast — right versus wrong, grounded versus made up, valid versus rejected, before versus after, one run versus many — show both sides as two clearly separated vignettes side by side on one platform, identical except for the one difference that is the point (a robot stacking blocks on a solid bookcase next to the same robot stacking blocks on a cloud that is crumbling). When checking or validation is the point, show one item passing and one visibly failing and being turned away.
- Prefer one unmistakable everyday metaphor over several loosely related props; leave out anything that is not part of the mechanism.
- Count the actors exactly as the topic has them: one robot for a single agent, one supervisor robot directing a few worker robots for a supervisor pattern. Never add extra robots, people or machines for decoration.
- Make it specific to this topic, so it could not be mistaken for a neighbouring one (map versus filter, a queue versus a pub/sub topic, a supervisor agent versus a single agent). Before answering, check: would a developer shown this picture and three neighbouring topic names pick this topic? If not, redesign.
- One focal action, a few supporting details, a calm uncluttered background.
- No text, letters, numbers, code, labels, logos or brand marks anywhere, and no screens or documents with writing on them.`;

const TECH_JUDGE = `You check card illustrations for a software-engineering course. You are shown one picture and the topic it is meant to explain. The picture must match this exact topic; a near miss misteaches. Judge strictly:
- 5: the focal action is unmistakably this topic's mechanism; a developer shown the picture and three neighbouring topic names would pick this one.
- 4: clearly this topic, with only a minor distraction (an extra prop, slight clutter) that does not change the meaning.
- 3 or less: the mechanism is unclear, the scene would fit a neighbouring topic as well, the number of actors or steps contradicts the topic, or the scene is busy enough to hide the point.
A generic computer, cloud, server or abstract tech scene that could illustrate many topics scores 2 at most. Any visible letters, numbers, code, logo or text-like marks count as text.`;

const STUDY_DIRECTOR = `You design the illustration across the top of a learning-path card for Indian students: a school board, a competitive exam (UPSC, SSC, banking, railways, defence, JEE, NEET, teaching) or a skill track. A student glancing at the picture should recognise which path it is before reading a word.

Design one 3D isometric illustration whose focal moment IS this path's goal or subject matter:
- Show what makes this path distinct: the officer's career it leads to (an IAS officer at a district office, an army cadet on a parade ground, a bank officer at a counter, a station master on a railway platform, a teacher in a classroom), or the subjects it covers (a CBSE Class 6 student with a science model and maths blocks).
- Prefer Indian people and settings. Make it specific enough that it could not be mistaken for a neighbouring path (SSC versus banking, NDA versus CDS, CBSE versus ICSE through its age group and subjects).
- One focal moment, a few supporting details, friendly and uncluttered.
- No text, letters, numbers, flags with writing, emblems, logos, signboards or documents with writing.`;

const STUDY_JUDGE = `You check card illustrations for an Indian exam-preparation and school-study app. You are shown one picture and the learning path it is meant to represent. The picture must match this exact path; a near miss misleads. Score 5 when a student would pick this path from the picture over its neighbours, 4 when it clearly fits with a minor distraction, 3 or less when it is generic study imagery (books, a desk, a graduation cap) that fits many paths. Any visible letters, numbers, emblems or text-like marks count as text.`;

/** A learning topic: what it is called, where it belongs and what it does. */
type Topic = { name: string; context: string; summary: string; points?: string[] };

/** "tech" for software topics; "study" for the exam and school learning paths. */
export type TopicField = "tech" | "study";

export async function designTopicScene(topic: Topic, critique?: string, field: TopicField = "tech"): Promise<Scene> {
  return scene(field === "study" ? STUDY_DIRECTOR : TECH_DIRECTOR, [
    `Topic: ${topic.name}`,
    `Part of: ${topic.context}`,
    `What it is: ${topic.summary}`,
    topic.points?.length ? `Key facts: ${topic.points.slice(0, 5).join(" ")}` : "",
    "Where the brief is thin, rely on what you know about this topic.",
  ], topic.name, critique);
}

export async function judgeTopicPicture(topic: Topic, jpeg: Buffer, field: TopicField = "tech"): Promise<Verdict> {
  return verdict(field === "study" ? STUDY_JUDGE : TECH_JUDGE, `Topic: ${topic.name} (${topic.context})\nWhat it is: ${topic.summary}`, topic.name, jpeg);
}

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
        critique ? `\nA previous picture failed review: ${critique}\nDesign an improved scene that fixes this.` : "",
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
