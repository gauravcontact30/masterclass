import { z } from "zod";

/**
 * Every learning material is in-app study notes: read in the Learn in App
 * notes reader, copyable, and downloadable as plain text. The format is kept
 * on the request (rather than implied) so documents stay self-describing.
 */
import { DOCUMENT_FORMAT } from "./document-format";
export { DOCUMENT_FORMAT, labelledOption, optionLetter } from "./document-format";
export const LANGUAGES = ["en", "hi", "es", "ja", "de", "fr", "zh"] as const;
export type Language = (typeof LANGUAGES)[number];
export const requestSchema = z.object({
  technologyId: z.string().min(1).max(80),
  topicId: z.string().min(1).max(80),
  format: z.literal(DOCUMENT_FORMAT),
  language: z.enum(LANGUAGES),
  level: z.enum(["beginner", "intermediate", "advanced"]),
}).strict();
export type GenerationRequest = z.infer<typeof requestSchema>;
/** "trial" is the one-day full-access window after sign-up; it is never stored on a subscription row. */
export type Tier = "free" | "trial" | "monthly" | "yearly";
export type Topic = { id: string; technology_id: string; title: string; title_hi: string; full_track: boolean; version: number; references: string[] };
export type Technology = { id: string; title: string; title_hi: string; category: string };
// Rich sections remain optional so older saved curricula can still be read.
// A key point card: a short headline, the explanation, and an optional
// one-line example. title and example are optional so notes stored before
// they existed still validate.
export const keyPointSchema = z.object({ tone: z.enum(["key", "tip", "warning"]), title: z.string().max(100).optional(), text: z.string().max(500), example: z.string().max(300).optional() });
export const useCaseSchema = z.object({ scenario: z.string().max(700), example: z.string().max(1200), usage: z.string().max(700) });
export const vocabularyEntrySchema = z.object({ word: z.string().max(60), meaning: z.string().max(320), example: z.string().max(320), synonyms: z.array(z.string().max(40)).max(8), antonyms: z.array(z.string().max(40)).max(8) });
export const apiParamSchema = z.object({ name: z.string().max(60), type: z.string().max(80), description: z.string().max(300) });
export const apiReferenceSchema = z.object({ name: z.string().max(120), kind: z.string().max(60), signature: z.string().max(500), params: z.array(apiParamSchema).max(14), returns: z.string().max(400), notes: z.string().max(500).optional() });
// An original, code-drawn figure (no external or third-party imagery): a
// vertical flow of steps, an indented file tree, or a two-column comparison,
// plus the caption that explains what the figure shows.
export const diagramSchema = z.object({
  kind: z.enum(["flow", "tree", "split"]),
  caption: z.string().max(600),
  headings: z.array(z.string().max(60)).max(2).optional(),
  items: z.array(z.object({ label: z.string().max(90), detail: z.string().max(160).optional(), depth: z.number().int().min(0).max(4).optional(), group: z.number().int().min(0).max(1).optional() })).max(12),
});
// A frequently asked interview question for the lesson's topic: a short
// definition, a model answer, the syntax and a code sample, plus related
// questions shown as an accordion (collapsible in the app, expanded in print).
export const interviewQuestionSchema = z.object({
  question: z.string().max(240),
  definition: z.string().max(400),
  answer: z.string().max(1200),
  syntax: z.string().max(400).optional(),
  code: z.string().max(2000).optional(),
  similar: z.array(z.object({ question: z.string().max(240), answer: z.string().max(600) })).max(4),
});
export type Diagram = z.infer<typeof diagramSchema>;
export type InterviewQuestion = z.infer<typeof interviewQuestionSchema>;
export type KeyPoint = z.infer<typeof keyPointSchema>;
export type UseCase = z.infer<typeof useCaseSchema>;
export type VocabularyEntry = z.infer<typeof vocabularyEntrySchema>;
export type ApiReference = z.infer<typeof apiReferenceSchema>;
export const exampleFileSchema = z.object({
  path: z.string().min(1).max(200).refine(path => !path.startsWith("/") && !path.includes("\\") && !path.split("/").includes(".."), "Use a project-relative file path"),
  language: z.enum(["typescript", "tsx", "javascript", "jsx", "python", "json", "yaml", "bash", "css", "html", "markdown", "text", "hcl", "dockerfile"]),
  code: z.string().min(1).max(16000),
  description: z.string().min(1).max(500),
});
export const codeExampleSchema = z.object({
  kind: z.enum(["concept", "application"]),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  files: z.array(exampleFileSchema).min(1).max(16).refine(files => new Set(files.map(file => file.path)).size === files.length, "File paths must be unique"),
  setup: z.array(z.string().max(300)).max(10),
  expectedOutput: z.string().max(2000),
  apiReference: z.array(apiReferenceSchema).max(12).optional(),
  // Legacy snippets are explicitly distinguished from complete projects.
  completeness: z.enum(["project", "snippet"]).default("project"),
});
export type ExampleFile = z.infer<typeof exampleFileSchema>;
export type CodeExample = z.infer<typeof codeExampleSchema>;
export const objectiveQuestionSchema = z.object({
  question: z.string().min(10).max(800),
  options: z.array(z.string().min(1).max(600)).length(4),
  correct: z.number().int().min(0).max(3),
  shortAnswer: z.string().min(5).max(600),
  explanation: z.string().min(20).max(2200),
});
export type ObjectiveQuestion = z.infer<typeof objectiveQuestionSchema>;
/**
 * One catalogued service in a guide's service directory — the searchable card
 * grid the reader shows above the lessons for guides that cover a large
 * provider surface (AWS compute, storage, AI, DevOps and so on). `points` is
 * the pointwise explanation shown on the card.
 */
export const serviceEntrySchema = z.object({
  name: z.string().min(1).max(120),
  category: z.string().min(1).max(60),
  summary: z.string().min(1).max(300),
  points: z.array(z.string().min(1).max(300)).min(2).max(8),
  sourceUrl: z.string().url().optional(),
  kind: z.enum(["service", "capability"]).optional(),
  awsId: z.string().max(100).optional(),
});
export type ServiceEntry = z.infer<typeof serviceEntrySchema>;

export const lessonSchema = z.object({
  title: z.string().min(1).max(120),
  explanation: z.string().min(40).max(4000),
  example: z.string().min(10).max(2000),
  code: z.string().max(6000).default(""),
  exercise: z.string().min(10).max(1000),
  checkpoint: z.string().min(10).max(900),
  mistake: z.string().min(10).max(1000),
  diagram: diagramSchema.optional(),
  keyPoints: z.array(keyPointSchema).max(16).optional(),
  // Two to six worked examples per lesson: at least one that isolates the
  // mechanism (concept) and at least one that puts it to work (application).
  codeExamples: z.array(codeExampleSchema).min(2).max(6).refine(examples => new Set(examples.map(example => example.kind)).size === 2, "Provide at least one concept and one application example").optional(),
  useCase: useCaseSchema.optional(),
  vocabulary: z.array(vocabularyEntrySchema).max(12).optional(),
  apiReference: z.array(apiReferenceSchema).max(8).optional(),
  interview: z.array(interviewQuestionSchema).max(6).optional(),
  objectiveQuestions: z.array(objectiveQuestionSchema).max(8).optional(),
});
export type Lesson = z.infer<typeof lessonSchema>;
export const curriculumSchema = z.object({
  codeExamples: z.array(codeExampleSchema).min(2).max(6).optional(),
  // Complete ecosystem courses retain research metadata across many libraries.
  sources: z.array(z.object({ url: z.string().url(), title: z.string(), retrievedAt: z.string().datetime() })).max(128).optional(),
  title: z.string().min(1).max(120),
  objectives: z.array(z.string().max(320)).min(2).max(10),
  prerequisites: z.array(z.string().max(320)).max(8),
  minutes: z.number().int().min(10).max(3000),
  lessons: z.array(lessonSchema).min(3).max(180),
  project: z.string().min(20).max(2500),
  summary: z.string().min(20).max(2000),
  glossary: z.array(z.object({ term: z.string().max(100), definition: z.string().max(400) })).min(2).max(20),
  services: z.array(serviceEntrySchema).max(600).optional(),
});
export type Curriculum = z.infer<typeof curriculumSchema>;
export type DocumentRecord = {
  id: string; user_id: string; title: string; request: GenerationRequest;
  status: "queued" | "generating" | "ready" | "failed";
  created_at: string; error_code: string | null; curriculum: Curriculum | null;
  page_titles: string[]; storage_path: string | null; preview_paths: string[];
};
export type Progress = { document_id: string; page: number; completed: boolean; bookmarks: number[]; notes: string; updated_at?: string };
export const progressSchema = z.object({ page: z.number().int().min(1).max(900), completed: z.boolean(), bookmarks: z.array(z.number().int().min(1).max(900)).max(900), notes: z.string().max(20000) }).strict();

export function documentKey(input: GenerationRequest, version: number) {
  return [input.technologyId, input.topicId, input.format, input.language, input.level, version, "notes-v2", "sources-v1"].join(":");
}
/** Lesson titles double as a notes document's "pages": the reader tracks progress one lesson at a time. */
export function lessonTitles(deck: Curriculum) { return deck.lessons.map(lesson => lesson.title); }
export function monthKey(date = new Date()) { return date.toISOString().slice(0, 7) + "-01"; }
export function entitlementTier(subscription: { tier: Tier; status: string; current_period_end: string | null; grace_until?: string | null } | null, now = Date.now()): Tier {
  if (!subscription) return "free";
  // created/authenticated only carry an end when they renew a paid period (a new checkout has none).
  if (["active", "cancelled", "completed", "created", "authenticated"].includes(subscription.status) && Date.parse(subscription.current_period_end ?? "") > now) return subscription.tier;
  if (subscription.status === "pending" && Date.parse(subscription.grace_until ?? "") > now) return subscription.tier;
  return "free";
}
/** When a new account's full-access trial ends: `hours` after its profile was created (first sign-in). */
export function trialEndsAt(createdAt: string | null | undefined, hours: number) {
  const start = Date.parse(createdAt ?? "");
  return Number.isFinite(start) && hours > 0 ? new Date(start + hours * 3_600_000).toISOString() : null;
}
