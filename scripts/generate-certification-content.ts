/**
 * Writes the Certifications page's study material (components/certification-study.tsx): for every step of every
 * track in lib/certifications.ts, a lesson (overview, objectives, concepts, must-remember facts, an example,
 * pitfalls, a workflow and its service icons), a complete multi-file sample project (shown in the Apple-style editor)
 * and a question bank of objective (multiple choice) and subjective questions with answers: a first batch, then an
 * exam-style batch whose questions may carry a code snippet, at least 150 of each per track. Text comes from Claude through Vercel AI Gateway; each
 * step's picture is designed and judged by the card art director (scripts/card-art-director.ts) and painted with
 * openai/gpt-image-2, and only a picture scoring 4/5 or better with no text is kept.
 *
 * Parts are cached in node_modules/.cache/certification-content, so a stopped run resumes; the merged result is
 * lib/certification-content/<track>.json (served by app/api/certifications/[track]) and the pictures are
 * public/images/certifications/<track>/<step>.webp. The LangChain track is grounded in facts read from the
 * official docs through the docs-langchain MCP server and is labelled with that source.
 *
 * Run: npx tsx --env-file=.env scripts/generate-certification-content.ts [track…] [--text-only | --images-only]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { z } from "zod";
import { gateway, generateImage, generateText, Output } from "ai";
import { CERTIFICATION_TRACKS, type CertTrack } from "../lib/certifications";
import { ICON_CHOICES } from "../lib/certification-icons";
import { learningScenePrompt } from "../lib/learning-image";
import { designTopicScene, judgeTopicPicture, type Verdict } from "./card-art-director";

const MODEL = process.env.CERT_CONTENT_MODEL || "anthropic/claude-opus-5-5";
const IMAGE_MODEL = process.env.CARD_IMAGE_MODEL || "openai/gpt-image-2";
const CACHE = "node_modules/.cache/certification-content";
const OUT = "lib/certification-content";
const TARGET = 105;
/** The exam-style second batch tops every track up to at least this many objective and subjective questions. */
const TARGET_MORE = 155;
const args = process.argv.slice(2);
const only = args.filter(arg => !arg.startsWith("--"));
const textOnly = args.includes("--text-only"), imagesOnly = args.includes("--images-only");

// Read from docs.langchain.com through the docs-langchain MCP server (2026-10-22).
const LANGCHAIN_FACTS = `Current LangChain-family facts (from the official docs; follow them exactly and do not use older APIs):
- LangChain v1: build agents with create_agent(model, tools, system_prompt=..., middleware=[...], checkpointer=...) from langchain.agents. create_agent returns a compiled LangGraph graph.
- Middleware (langchain.agents.middleware) is the customisation primitive: SummarizationMiddleware(model=..., trigger=("tokens", 4000), keep=("messages", 20)); HumanInTheLoopMiddleware(interrupt_on={"send_email": {"allowed_decisions": ["approve", "edit", "reject"]}}); PIIMiddleware("email", strategy="redact", apply_to_input=True); built-ins also cover model fallback, tool retry, model call limits and LLM tool selection; custom middleware hooks into the agent loop.
- Deep Agents: create_deep_agent pre-assembles filesystem, summarization, subagents and prompt caching for long-running tasks.
- Multi-agent: the langgraph-supervisor package is no longer actively maintained; use the subagents pattern (a main create_agent whose tools wrap worker subagents). Only the outermost graph gets a checkpointer.
- LangGraph: StateGraph(State) with add_node, add_edge(START, ...), conditional edges, compile(checkpointer=InMemorySaver(), store=InMemoryStore()). Invoke with config {"configurable": {"thread_id": "..."}}; the checkpointer needs thread_id to save and resume. interrupt(payload) pauses a node; resume with Command(resume=value) on the same thread_id; the node re-runs from its start. graph.get_state_history(config) lists checkpoints newest first. stream_events(..., version="v3") is the recommended way to drive a graph and surfaces stream.interrupted / stream.interrupts. The Agent Server handles persistence automatically.
- LangSmith: tracing via LANGSMITH_TRACING=true and LANGSMITH_API_KEY; datasets of examples; evaluate(target, data=dataset, evaluators=[...]) runs an experiment; openevals create_llm_as_judge with CORRECTNESS_PROMPT for LLM-as-judge; LangSmith Studio connects to a local agent run with the LangGraph CLI (langgraph dev) and a langgraph.json config.
- Langflow is a separate open-source visual builder (components, flows, Playground, API); it has no official certification.`;

const SYSTEM = `You are a senior certification coach and practising engineer writing study material for MasterClass, an Indian e-learning platform. Learners use it to pass the named certifications and the interviews that follow.
Rules:
- Be accurate and current as of 2026. Use official terminology and the current exam guides. Never invent exam facts, prices, limits or API names; if unsure, describe the concept without the number.
- Plain, clear English for Indian learners; short sentences; no fluff, no marketing.
- Everything must be specific to the step you are given, and useful for the exam and real work.`;

const lessonSchema = (icons: string[]) => z.object({
  overview: z.string().describe("2-3 sentences: what this step covers and why it matters for the certification."),
  objectives: z.array(z.string()).min(3).max(5).describe("What the learner can do after the step, each starting with a verb."),
  concepts: z.array(z.object({ term: z.string(), explanation: z.string().describe("2-4 sentences, concrete, exam-ready.") })).min(6).max(10),
  keyFacts: z.array(z.string()).min(6).max(10).describe("Must-remember facts for the exam: numbers, limits, defaults, decision rules."),
  example: z.object({
    caption: z.string(), language: z.enum(["python", "typescript", "javascript", "bash", "yaml", "json", "sql", "text"]),
    code: z.string().describe("A short, correct, runnable or realistic example (max 30 lines). For non-code topics a worked estimate or config."),
  }),
  pitfalls: z.array(z.string()).min(3).max(6).describe("Common mistakes and exam traps."),
  workflow: z.object({
    title: z.string(),
    steps: z.array(z.object({ label: z.string().describe("At most 6 words."), detail: z.string().describe("One sentence.") })).min(4).max(7),
  }).describe("The step's core process as an ordered workflow, e.g. how a request flows or how to do the task."),
  icons: z.array(z.enum(icons as [string, ...string[]])).min(2).max(6).describe("Services or tools this step actually uses."),
});
const questionSchema = (count: number) => z.object({
  objective: z.array(z.object({
    question: z.string(), options: z.array(z.string()).length(4), answer: z.number().int().min(0).max(3),
    explanation: z.string().describe("Why the answer is right and the others are wrong, 1-3 sentences."),
    difficulty: z.enum(["easy", "medium", "hard"]),
  })).min(count).max(count + 3),
  subjective: z.array(z.object({
    question: z.string(),
    answer: z.string().describe("A model answer, 80-180 words, the way a strong candidate would say it."),
    keyPoints: z.array(z.string()).min(3).max(5),
    difficulty: z.enum(["easy", "medium", "hard"]),
  })).min(count).max(count + 3),
});
const snippet = z.object({ language: z.string(), code: z.string().describe("At most 25 lines.") }).nullable()
  .describe("The code, config, CLI command or query the question is about, or null when it needs none.");
const moreSchema = (count: number) => z.object({
  objective: z.array(z.object({
    question: z.string(), code: snippet, options: z.array(z.string()).length(4), answer: z.number().int().min(0).max(3),
    explanation: z.string().describe("Why the answer is right and the others are wrong, 1-3 sentences."),
    difficulty: z.enum(["easy", "medium", "hard"]),
  })).min(count).max(count + 3),
  subjective: z.array(z.object({
    question: z.string(), code: snippet,
    answer: z.string().describe("A model answer, 80-180 words, the way a strong candidate would say it."),
    keyPoints: z.array(z.string()).min(3).max(5),
    difficulty: z.enum(["easy", "medium", "hard"]),
  })).min(count).max(count + 3),
});
const projectSchema = z.object({
  title: z.string().describe("The sample project's folder name, e.g. 'orders-api'."),
  summary: z.string().describe("2 sentences: what the project does and which part of the step each file shows."),
  run: z.string().describe("The commands to install and run it, one per line."),
  files: z.array(z.object({
    path: z.string().describe("Path from the project root, e.g. 'src/handler.ts', 'infra/main.tf', 'README.md'."),
    code: z.string().describe("The complete file, correct for current versions, 10-70 lines, with brief comments on the key lines."),
  })).min(3).max(7),
});
type Lesson = z.infer<ReturnType<typeof lessonSchema>>;
type More = z.infer<ReturnType<typeof moreSchema>>;
type Project = z.infer<typeof projectSchema>;
type Questions = z.infer<ReturnType<typeof questionSchema>>;

const trackBrief = (track: CertTrack, index: number) => {
  const step = track.steps[index];
  return [
    `Certification track: ${track.title}. ${track.tagline}`,
    `Certificates on this path: ${track.certificates.map(cert => `${cert.name}${cert.code ? ` (${cert.code})` : ""}: ${cert.format}`).join("; ")}.`,
    `Step ${index + 1} of ${track.steps.length}: ${step.title} (${step.weeks}).`,
    `Syllabus: ${step.learn.join("; ")}.`,
    `Hands-on task: ${step.practice}`,
    `Checkpoint: ${step.checkpoint}`,
    track.id === "langchain-python" ? LANGCHAIN_FACTS : "",
  ].filter(Boolean).join("\n");
};

/** Moves each correct answer to a pseudo-random position (models favour B), stable per question. */
function shuffle<Q extends Questions["objective"][number]>(questions: Q[]): Q[] {
  return questions.map(question => {
    let seed = [...question.question].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
    const order = [0, 1, 2, 3];
    for (let i = 3; i > 0; i--) { seed = (seed * 1103515245 + 12345) >>> 0; const j = seed % (i + 1); [order[i], order[j]] = [order[j], order[i]]; }
    return { ...question, options: order.map(i => question.options[i]), answer: order.indexOf(question.answer) };
  });
}

const cached = <T,>(name: string): T | null => existsSync(`${CACHE}/${name}.json`) ? JSON.parse(readFileSync(`${CACHE}/${name}.json`, "utf8")) as T : null;
const store = (name: string, value: unknown) => writeFileSync(`${CACHE}/${name}.json`, JSON.stringify(value));

async function write<T>(name: string, schema: z.ZodType<T>, prompt: string): Promise<T> {
  const hit = cached<T>(name);
  if (hit) return hit;
  for (let tries = 1; ; tries++) {
    try {
      const { output } = await generateText({ model: gateway(MODEL), system: SYSTEM, prompt, output: Output.object({ schema }), maxRetries: 2, abortSignal: AbortSignal.timeout(600_000) });
      store(name, output);
      console.log(`ok ${name}`);
      return output as T;
    } catch (error) {
      if (tries >= 3) throw error;
      console.log(`  retry ${name} (${tries}): ${String(error).slice(0, 200)}`);
    }
  }
}

async function lesson(track: CertTrack, index: number) {
  return write<Lesson>(`${track.id}-${index}-lesson`, lessonSchema(ICON_CHOICES[track.id]) as z.ZodType<Lesson>,
    `${trackBrief(track, index)}\n\nWrite the lesson for this step: everything a learner needs to master it for the certification.`);
}

async function questions(track: CertTrack, index: number, taught: Lesson) {
  const count = Math.ceil(TARGET / track.steps.length);
  return write<Questions>(`${track.id}-${index}-questions`, questionSchema(count) as z.ZodType<Questions>, [
    trackBrief(track, index),
    `The lesson taught: ${taught.concepts.map(concept => concept.term).join(", ")}. Key facts: ${taught.keyFacts.join(" ")}`,
    `Write exactly ${count} objective questions (multiple choice, 4 options, one correct, plausible distractors, scenario questions in the style of the real exam where it has one) and exactly ${count} subjective questions (interview and written-exam style, each with a model answer and key points). Mix easy, medium and hard, mostly medium. Cover the whole step; do not repeat a question.`,
  ].join("\n\n"));
}

async function more(track: CertTrack, index: number, taught: Lesson, asked: Questions) {
  const first = track.steps.length * Math.ceil(TARGET / track.steps.length);
  const count = Math.ceil((TARGET_MORE - first) / track.steps.length) + 1;
  const existing = [...asked.objective, ...asked.subjective].map(question => `- ${question.question}`).join("\n");
  return write<More>(`${track.id}-${index}-questions-2`, moreSchema(count) as z.ZodType<More>, [
    trackBrief(track, index),
    `The lesson taught: ${taught.concepts.map(concept => concept.term).join(", ")}.`,
    `These questions already exist; do not repeat or rephrase them:\n${existing}`,
    `Write exactly ${count} more objective questions (multiple choice, 4 options, one correct, plausible distractors) and exactly ${count} more subjective questions in the style of the real certification exams on this path: scenarios ("A company needs… which solution…"), troubleshooting, and "what does this code or config do" questions. When a question is about code, a config, a CLI command or a query, put it in "code"; otherwise set "code" to null. Mostly medium and hard.`,
  ].join("\n\n"));
}

async function project(track: CertTrack, index: number, taught: Lesson) {
  return write<Project>(`${track.id}-${index}-project`, projectSchema, [
    trackBrief(track, index),
    `The lesson taught: ${taught.concepts.map(concept => concept.term).join(", ")}.`,
    "Write a small but complete sample project (3-7 files) a learner can read file by file to see this step working end to end: source files, configuration or infrastructure-as-code, and a short README.md. Make it do the step's hands-on task where possible. Every file must be complete and consistent with the others (same names, imports, ports and environment variables). For architecture and cloud topics use real infrastructure-as-code, service code and config; for tools such as n8n include the exported workflow JSON and the code around it.",
  ].join("\n\n"));
}

// The gateway allows 5 pictures a minute on this team: start one every 13 seconds.
let nextSlot = 0;
const slot = async () => { const wait = Math.max(0, nextSlot - Date.now()); nextSlot = Math.max(nextSlot, Date.now()) + 13_000; await new Promise(resolve => setTimeout(resolve, wait)); };

async function picture(track: CertTrack, index: number, taught: Lesson): Promise<string | null> {
  const file = `public/images/certifications/${track.id}/${index + 1}.webp`;
  const url = `/images/certifications/${track.id}/${index + 1}.webp`;
  if (existsSync(file)) return url;
  if (cached<{ rejected: true }>(`${track.id}-${index}-picture-rejected`)) return null;
  const topic = { name: track.steps[index].title, context: `${track.title} certification path`, summary: taught.overview, points: taught.keyFacts };
  let best: { webp: Buffer; verdict: Verdict } | undefined, critique: string | undefined;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const scene = await designTopicScene(topic, critique);
    await slot();
    let raw: Uint8Array;
    try {
      ({ image: { uint8Array: raw } } = await generateImage({ model: gateway.image(IMAGE_MODEL), prompt: learningScenePrompt({ subject: topic.name, scene: scene.scene }), size: "1536x1024", maxRetries: 1, abortSignal: AbortSignal.timeout(180_000) }));
    } catch (error) {
      critique = /safety/i.test(String(error)) ? "The image model's safety filter rejected that scene. Design a gentler, clearly harmless scene." : undefined;
      if (attempt === 3) break;
      continue;
    }
    const webp = await sharp(raw).resize(1200, 800, { fit: "cover", position: "attention" }).webp({ quality: 74 }).toBuffer();
    const verdict = await judgeTopicPicture(topic, await sharp(webp).resize(480).jpeg({ quality: 80 }).toBuffer());
    if (!best || verdict.score - (verdict.has_text ? 3 : 0) > best.verdict.score - (best.verdict.has_text ? 3 : 0)) best = { webp, verdict };
    if (verdict.score >= 5 && !verdict.has_text) break;
    critique = `The scene was: ${scene.scene}\n${verdict.has_text ? "It contained visible lettering. " : ""}It scored ${verdict.score}/5: ${verdict.problem}\nKeep what worked and fix this.`;
  }
  if (!best || best.verdict.score < 4 || best.verdict.has_text) {
    store(`${track.id}-${index}-picture-rejected`, { rejected: true, verdict: best?.verdict ?? null });
    console.log(`  no picture for ${track.id} step ${index + 1} (best ${best?.verdict.score ?? 0}/5)`);
    return null;
  }
  mkdirSync(`public/images/certifications/${track.id}`, { recursive: true });
  writeFileSync(file, best.webp);
  console.log(`ok picture ${file} ${best.verdict.score}/5`);
  return url;
}

async function pool<T>(items: T[], size: number, run: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(Array.from({ length: size }, async () => { for (let item = queue.shift(); item !== undefined; item = queue.shift()) await run(item); }));
}

/** lib/certification-content/index.ts: a loader per merged track, so the API imports only files that exist. */
function writeIndex() {
  const ready = CERTIFICATION_TRACKS.filter(track => existsSync(`${OUT}/${track.id}.json`)).map(track => track.id);
  writeFileSync(`${OUT}/index.ts`, `// Generated by scripts/generate-certification-content.ts: one loader per track whose study material exists.
export const CERTIFICATION_CONTENT: Record<string, () => Promise<{ default: unknown }>> = {
${ready.map(id => `  ${JSON.stringify(id)}: () => import(${JSON.stringify(`./${id}.json`)}),`).join("\n")}
};
`);
}

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) throw new Error("AI_GATEWAY_API_KEY must be set.");
  mkdirSync(CACHE, { recursive: true }); mkdirSync(OUT, { recursive: true });
  const tracks = CERTIFICATION_TRACKS.filter(track => !only.length || only.includes(track.id));
  const jobs = tracks.flatMap(track => track.steps.map((_, index) => ({ track, index })));
  const failures: string[] = [];
  if (!imagesOnly) await pool(jobs, 4, async ({ track, index }) => {
    try {
      const taught = await lesson(track, index), asked = await questions(track, index, taught);
      await Promise.all([more(track, index, taught, asked), project(track, index, taught)]);
    } catch (error) { failures.push(`${track.id} step ${index + 1}: ${String(error).slice(0, 200)}`); }
  });
  if (!textOnly) await pool(jobs, 3, async ({ track, index }) => {
    const taught = cached<Lesson>(`${track.id}-${index}-lesson`);
    if (taught) try { await picture(track, index, taught); } catch (error) { console.log(`  picture failed ${track.id} step ${index + 1}: ${String(error).slice(0, 200)}`); }
  });
  for (const track of tracks) {
    const steps = track.steps.map((_, index) => {
      const taught = cached<Lesson>(`${track.id}-${index}-lesson`), asked = cached<Questions>(`${track.id}-${index}-questions`);
      const extra = cached<More>(`${track.id}-${index}-questions-2`), sample = cached<Project>(`${track.id}-${index}-project`);
      const file = `public/images/certifications/${track.id}/${index + 1}.webp`;
      return taught && asked && extra && sample ? {
        ...taught, project: sample, image: existsSync(file) ? `/images/certifications/${track.id}/${index + 1}.webp` : null,
        objective: [...shuffle(asked.objective), ...shuffle(extra.objective)], subjective: [...asked.subjective, ...extra.subjective],
      } : null;
    });
    if (steps.some(step => !step)) { console.log(`skip merge ${track.id}: ${steps.filter(step => !step).length} steps missing`); continue; }
    const objective = steps.reduce((sum, step) => sum + step!.objective.length, 0), subjective = steps.reduce((sum, step) => sum + step!.subjective.length, 0);
    writeFileSync(`${OUT}/${track.id}.json`, JSON.stringify({
      track: track.id, generatedAt: new Date().toISOString(), model: MODEL,
      source: track.id === "langchain-python" ? "Sourced from Docs by LangChain (MCP)" : null, steps,
    }));
    console.log(`merged ${track.id}: ${objective} objective, ${subjective} subjective`);
  }
  writeIndex();
  if (failures.length) { console.log(`\n${failures.length} failed:\n${failures.join("\n")}`); process.exitCode = 1; }
}
void main();
