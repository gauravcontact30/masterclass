import { z } from "zod";
import preview from "./catalog-preview.json";
import { stageSpans } from "./learning-path-stages";

export { PLAN_LENGTHS, stageSpans } from "./learning-path-stages";

/*
 * A learning plan for a stated goal ("backend job in 3 months"), used by the landing page's route planner, the
 * sign-up plan preview and the dashboard's starter plan. Every plan has exactly three stages (foundation, practice,
 * project) that split the chosen number of weeks between them. The model may only pick technologies from this app's
 * own catalog (by id); anything else it names is dropped, so every link in a plan opens real notes. Without a model,
 * rulePath() builds the same shape from keywords, labelled as such.
 *
 * Server and tests only: client components import the types with `import type` so zod stays off public pages.
 */
export type PathTechnology = { id: string; title: string; href: string };
/** One of the three stages; `from`/`to` are the 1-based weeks it covers. */
export type PathStage = { stage: 1 | 2 | 3; from: number; to: number; focus: string; technologies: PathTechnology[]; tasks: string[]; outcome: string };
export type LearningPath = { goal: string; weeks: number; summary: string; stages: PathStage[]; source: "ai" | "rules"; model?: string };

export const pathRequestSchema = z.object({
  goal: z.string().trim().min(3).max(300),
  weeks: z.number().int().min(3).max(12).default(4),
  language: z.enum(["en", "hi"]).default("en"),
});
export type PathRequest = z.infer<typeof pathRequestSchema>;

export const pathReplySchema = z.object({
  summary: z.string().trim().min(1).max(500),
  stages: z.array(z.object({
    focus: z.string().trim().min(1).max(90),
    technologyIds: z.array(z.string().trim().max(40)).max(4),
    tasks: z.array(z.string().trim().min(1).max(180)).min(1).max(3),
    outcome: z.string().trim().min(1).max(180),
  })).min(3),
});

const TECHNOLOGIES = new Map(preview.technologies.map(t => [t.id, t]));
export const technologyHref = (id: string) => `/dashboard/notes?technology=${encodeURIComponent(id)}`;
const tech = (id: string): PathTechnology | null => { const t = TECHNOLOGIES.get(id); return t ? { id, title: t.title, href: technologyHref(id) } : null; };
const techs = (ids: string[]) => [...new Set(ids)].map(tech).filter((t): t is PathTechnology => t !== null);

/** The catalog as the model sees it: one compact "id: title (category)" line per technology. */
export const catalogForPrompt = () => preview.technologies.map(t => `${t.id}: ${t.title} (${t.category})`).join("\n");

/** Pulls the first JSON object out of a reply and maps technology ids onto the catalog, dropping unknown ones. */
export function parsePath(text: string, input: PathRequest): Omit<LearningPath, "source" | "model"> | null {
  const start = text.indexOf("{"), end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let parsed;
  try { parsed = pathReplySchema.safeParse(JSON.parse(text.slice(start, end + 1))); } catch { return null; }
  if (!parsed.success) return null;
  const spans = stageSpans(input.weeks);
  const stages = parsed.data.stages.slice(0, 3).map((stage, index): PathStage => ({
    stage: (index + 1) as 1 | 2 | 3, from: spans[index][0], to: spans[index][1],
    focus: stage.focus, tasks: stage.tasks, outcome: stage.outcome, technologies: techs(stage.technologyIds),
  }));
  // A plan that links to nothing in the catalog is not worth showing over the rule-based one.
  if (!stages.some(stage => stage.technologies.length)) return null;
  return { goal: input.goal, weeks: input.weeks, summary: parsed.data.summary, stages };
}

/** Goal keywords → technologies for the foundation, practice and project stages. First match wins; the last is the default. */
const TRACKS: [RegExp, [string[], string[], string[]], string, string][] = [
  [/\b(ai|ml|llm|gen ?ai|machine learning|agents?|agentic|langchain|prompt|chatgpt|claude)\b|एआई|एजेंट/i, [["python", "ai"], ["prompting", "langchain"], ["agentic-ai", "claude"]], "AI engineering", "AI इंजीनियरिंग"],
  [/\b(data|analytics|analyst|etl|warehouse|sql)\b|डेटा/i, [["python"], ["data-engineering", "supabase"], ["elasticsearch", "data-engineering"]], "data engineering", "डेटा इंजीनियरिंग"],
  [/\b(devops|cloud|aws|docker|kubernetes|deploy|sre|platform)\b|क्लाउड/i, [["git", "docker"], ["aws", "devops"], ["platform-engineering", "devops"]], "cloud and DevOps", "क्लाउड और DevOps"],
  [/\b(test|testing|qa|quality|automation)\b|टेस्ट/i, [["javascript", "jest"], ["rtl", "vitest"], ["playwright", "cypress"]], "testing and QA", "टेस्टिंग और QA"],
  [/\b(security|cyber|hacking|appsec)\b|सुरक्षा/i, [["cybersecurity"], ["node", "docker"], ["aws", "cybersecurity"]], "security", "सुरक्षा"],
  [/\b(backend|back-end|api|server|node|database|nest)\b|बैकएंड/i, [["javascript", "typescript"], ["node", "express"], ["supabase", "redis"]], "backend development", "बैकएंड डेवलपमेंट"],
  [/\b(python)\b/i, [["python"], ["ai", "data-engineering"], ["pytorch"]], "Python", "Python"],
  [/\b(java|spring)\b/i, [["java"], ["git", "docker"], ["java"]], "Java", "Java"],
  [/\b(mobile|android|ios|flutter)\b/i, [["flutter"], ["supabase"], ["flutter", "git"]], "mobile development", "मोबाइल डेवलपमेंट"],
  [/\b(full ?stack|fullstack)\b/i, [["javascript", "typescript"], ["react", "node"], ["nextjs", "supabase"]], "full-stack development", "फ़ुल-स्टैक डेवलपमेंट"],
  [/.*/, [["javascript", "git"], ["typescript", "react"], ["nextjs"]], "frontend development", "फ्रंटएंड डेवलपमेंट"],
];
const titles = (ids: string[]) => techs(ids).map(t => t.title);
const list = (names: string[], hi: boolean) => names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")}${hi ? " और " : " and "}${names[names.length - 1]}`;

/** A plan from keywords alone: used without a model, or when the model's reply cannot be used. */
export function rulePath(input: PathRequest): Omit<LearningPath, "source" | "model"> {
  const [, groups, label, labelHi] = TRACKS.find(([pattern]) => pattern.test(input.goal))!;
  const hi = input.language === "hi";
  const spans = stageSpans(input.weeks);
  const [a, b, c] = groups.map(ids => list(titles(ids), hi));
  const copy: [focus: string, tasks: string[], outcome: string][] = hi ? [
    [`${a} की बुनियाद`, [`${a} के नोट्स पढ़ें और हर उदाहरण खुद चलाएँ`, "हर विषय के बाद छोटा क्विज़ दें"], `${a} की मूल बातें बिना देखे समझा सकेंगे`],
    [`${b} का अभ्यास`, [`${b} से छोटे अभ्यास बनाएँ`, "गलत उत्तरों को दोबारा पढ़ें और नोट्स में चिह्नित करें"], `${b} से छोटी चीज़ें खुद बना सकेंगे`],
    [`प्रोजेक्ट: ${c}`, ["पिछले दोनों चरणों के विषयों से एक छोटा प्रोजेक्ट बनाएँ", "इन विषयों के इंटरव्यू प्रश्नों का अभ्यास करें"], "एक पूरा प्रोजेक्ट, जिसे आप इंटरव्यू में समझा सकें"],
  ] : [
    [`${a} foundations`, [`Read the ${a} notes and run every worked example yourself`, "Take the short quiz after each topic"], `You can explain the basics of ${a} without looking them up`],
    [`Hands-on ${b}`, [`Build small exercises with ${b}`, "Revisit every quiz question you missed and mark it in your notes"], `You can build small features with ${b} on your own`],
    [`Project with ${c}`, ["Build one small project that uses the topics from both earlier stages", "Practice the interview questions for these topics"], "A finished project you can walk an interviewer through"],
  ];
  const stages = copy.map(([focus, tasks, outcome], index): PathStage => ({
    stage: (index + 1) as 1 | 2 | 3, from: spans[index][0], to: spans[index][1], focus, tasks, outcome, technologies: techs(groups[index]),
  }));
  return {
    goal: input.goal, weeks: input.weeks, stages,
    summary: hi ? `${input.weeks} हफ़्तों का ${labelHi} प्लान, तीन चरणों में: बुनियाद, अभ्यास और प्रोजेक्ट।` : `A ${input.weeks}-week ${label} plan in three stages: foundations, hands-on practice, then a project.`,
  };
}
