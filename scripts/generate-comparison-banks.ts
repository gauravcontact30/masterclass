/**
 * Writes the difference-question bank behind a Tech Topics comparison (components/landing-comparisons.tsx) that has
 * none yet: 50 interview questions with model answers, grounded in the comparison's technologies and its At a glance
 * table, saved as lib/comparisons/banks/<id>.ts in the same shape as the hand-written banks. Text comes from Claude
 * through the Vercel AI Gateway. Register each new bank in LOADERS (lib/comparisons/index.ts) afterwards.
 *
 * Run: npx tsx --env-file=.env scripts/generate-comparison-banks.ts [id…]   (default: every comparison without a bank)
 */
import { existsSync, writeFileSync } from "node:fs";
import { z } from "zod";
import { gateway, generateText, Output } from "ai";
import { COMPARISONS, hasComparisonBank, type Comparison } from "../lib/comparisons";

const MODEL = process.env.COMPARISON_MODEL || "anthropic/claude-opus-5-5";
const COUNT = 50;

const schema = z.object({
  subjective: z.array(z.object({
    stars: z.number().int().min(1).max(5).describe("How often interviewers ask it: 5 = very common."),
    question: z.string().describe("Ends with a question mark."),
    answer: z.string().describe("A correct model answer, 2-4 sentences, 120-420 characters, specific and current."),
  })).min(COUNT).max(COUNT + 5),
});

const brief = (item: Comparison) => [
  `Comparison: ${item.question}`,
  `Summary: ${item.summary}`,
  `Technologies: ${item.techs.map(tech => `${tech.name}: ${tech.definition} ${tech.description}`).join(" | ")}`,
  `At a glance (aspect: values in the order above): ${item.aspects.map(([aspect, ...values]) => `${aspect}: ${values.join(" / ")}`).join("; ")}`,
].join("\n");

async function write(item: Comparison) {
  const { output } = await generateText({
    model: gateway(MODEL), maxRetries: 2, abortSignal: AbortSignal.timeout(600_000),
    system: "You are a senior engineer writing interview preparation for MasterClass, an Indian e-learning platform. Be accurate and current as of 2026; never invent APIs, numbers or features. Plain, clear English; short sentences; no marketing.",
    prompt: `${brief(item)}\n\nWrite exactly ${COUNT} distinct interview questions about the differences between these technologies, as candidates are asked them: the core difference, when to choose each, trade-offs, performance, scaling, cost, ecosystem, migration, common mistakes and scenario questions ("A team needs… which would you pick and why?"). Start with the most common. No two questions may ask the same thing.`,
    output: Output.object({ schema }),
  });
  const seen = new Set<string>();
  const rows = output.subjective.filter(q => q.question.trim().endsWith("?") && q.answer.length > 80 && !seen.has(q.question) && seen.add(q.question)).slice(0, COUNT);
  if (rows.length < COUNT) throw new Error(`${item.id}: only ${rows.length} usable questions`);
  const body = rows.map(q => `    s(${q.stars}, ${JSON.stringify(q.question.trim())}, ${JSON.stringify(q.answer.trim())}),`).join("\n");
  writeFileSync(`lib/comparisons/banks/${item.id}.ts`, `import { s, type QuestionSet } from "@/lib/interview-questions";\n\nconst bank: QuestionSet = {\n  subjective: [\n${body}\n  ],\n  objective: [],\n};\nexport default bank;\n`);
  console.log(`ok ${item.id}: ${rows.length} questions`);
}

async function main() {
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) throw new Error("AI_GATEWAY_API_KEY must be set.");
  const ids = process.argv.slice(2);
  const todo = COMPARISONS.filter(item => ids.length ? ids.includes(item.id) : !hasComparisonBank(item.id) && !existsSync(`lib/comparisons/banks/${item.id}.ts`));
  // Three at a time keeps the gateway comfortable; one failure does not stop the rest.
  const queue = [...todo];
  await Promise.all([0, 1, 2].map(async () => { for (let item = queue.shift(); item; item = queue.shift()) await write(item).catch(error => { console.error(`failed ${item.id}: ${String(error).slice(0, 200)}`); process.exitCode = 1; }); }));
}
void main();
