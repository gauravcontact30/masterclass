import { z } from "zod";
import { answerFileSchema } from "@/lib/pro-learn/types";

/**
 * An "On The Go" answer: what the thing is, how to build it one step
 * at a time (each step carrying the commands it runs and what they do), the
 * complete multi-file codebase, and the few facts worth keeping. Shared by the
 * built-in guides, the model's output and the page, so all three agree.
 */
export const STEP_CATEGORIES = ["Next.js", "React", "Node.js", "Database", "Auth", "DevOps", "Testing", "Python", "Other"] as const;
export const STEP_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export const STEP_DEPTHS = ["concise", "detailed"] as const;
export type StepCategory = (typeof STEP_CATEGORIES)[number];
export type StepLevel = (typeof STEP_LEVELS)[number];
export type StepDepth = (typeof STEP_DEPTHS)[number];

export const stepCommandSchema = z.object({
  command: z.string().min(1).max(300),
  description: z.string().min(1).max(240),
});

export const guideStepSchema = z.object({
  title: z.string().min(1).max(120),
  detail: z.string().min(1).max(700),
  commands: z.array(stepCommandSchema).max(5).default([]),
  code: z.string().max(3000).default(""),
  /** The codebase file this step writes, so the reader can jump to it. */
  file: z.string().max(160).default(""),
});

/** One side of a comparison: a framework or technology described on its own. */
export const comparedItemSchema = z.object({
  name: z.string().min(1).max(60),
  summary: z.string().min(1).max(300),
  points: z.array(z.string().min(1).max(200)).min(2).max(5),
  bestFor: z.string().min(1).max(200),
});

/**
 * How the answer's technology differs from its closest alternative (or from
 * the ones the question names). Each difference gives one value per item, in
 * the same order as `items`, so the page can lay them side by side.
 */
export const comparisonSchema = z.object({
  items: z.array(comparedItemSchema).min(2).max(3),
  differences: z.array(z.object({
    aspect: z.string().min(1).max(60),
    values: z.array(z.string().min(1).max(220)).min(2).max(3),
  })).min(2).max(8),
}).refine(comparison => comparison.differences.every(difference => difference.values.length === comparison.items.length),
  "Every difference needs one value per compared item");

/** A core capability of the subject, named and explained in a sentence or two. */
export const guideFeatureSchema = z.object({
  name: z.string().min(1).max(80),
  detail: z.string().min(1).max(400),
  highlights: z.array(z.string().min(1).max(160)).max(4).optional(),
});

const interviewQuestionSchema = z.object({
  question: z.string().min(3).max(300),
  askRating: z.number().int().min(1).max(5),
  answer: z.string().min(1).max(600),
  keyPoints: z.array(z.string().min(1).max(300)).min(1).max(5),
});
export const objectiveQuestionSchema = interviewQuestionSchema.extend({
  options: z.array(z.string().min(1).max(400)).min(2).max(4),
  correctIndex: z.number().int().min(0).max(3),
}).refine(item => item.correctIndex < item.options.length && new Set(item.options).size === item.options.length,
  'Options must be distinct and include the correct answer');
export const guideInterviewSchema = z.object({
  subjective: z.array(interviewQuestionSchema).min(1).max(5),
  objective: z.array(objectiveQuestionSchema).min(1).max(5),
});
export type GuideInterview = z.infer<typeof guideInterviewSchema>;
export type ObjectiveQuestion = z.infer<typeof objectiveQuestionSchema>;

/**
 * A real situation the subject is used in, with the points that matter there
 * and a complete, runnable implementation (every import resolved, no ellipses).
 */
export const guideUseCaseSchema = z.object({
  title: z.string().min(1).max(120),
  scenario: z.string().min(1).max(500),
  points: z.array(z.string().min(1).max(260)).min(1).max(6),
  files: z.array(answerFileSchema).min(1).max(4),
});

/** Pointwise learning content; answers saved before it existed simply have none. */
const pointList = (max: number) => z.array(z.string().min(1).max(300)).max(max).default([]).catch([]);

export const stepGuideSchema = z.object({
  question: z.string().min(3).max(400),
  category: z.enum(STEP_CATEGORIES).catch("Other"),
  level: z.enum(STEP_LEVELS).catch("intermediate"),
  definition: z.string().min(1).max(600),
  definitionPoints: pointList(8),
  answer: z.string().min(1).max(900),
  answerPoints: pointList(8),
  features: z.array(guideFeatureSchema).max(10).default([]).catch([]),
  interview: guideInterviewSchema.optional().catch(undefined),
  useCases: z.array(guideUseCaseSchema).max(4).default([]).catch([]),
  steps: z.array(guideStepSchema).min(2).max(10),
  files: z.array(answerFileSchema).max(8).default([]),
  keyPoints: z.array(z.string().min(1).max(300)).min(1).max(10),
  tags: z.array(z.string().min(1).max(40)).max(10).default([]),
  // A malformed comparison drops out rather than failing the whole answer,
  // and answers saved before comparisons existed simply have none.
  comparison: comparisonSchema.nullable().default(null).catch(null),
});

export type StepCommand = z.infer<typeof stepCommandSchema>;
export type GuideStep = z.infer<typeof guideStepSchema>;
export type ComparedItem = z.infer<typeof comparedItemSchema>;
export type Comparison = z.infer<typeof comparisonSchema>;
export type GuideFeature = z.infer<typeof guideFeatureSchema>;
export type GuideUseCase = z.infer<typeof guideUseCaseSchema>;
export type StepGuide = z.infer<typeof stepGuideSchema>;
export type LibraryGuide = StepGuide & { id: string };

/** Advanced-search options: they shape the generated answer, not the card list. */
export const stepSearchOptionsSchema = z.object({
  category: z.enum(STEP_CATEGORIES).optional(),
  level: z.enum(STEP_LEVELS).optional(),
  depth: z.enum(STEP_DEPTHS).optional(),
  /** A Search-page catalogue title, set when a technology tab is open. */
  technology: z.string().trim().min(1).max(120).optional(),
}).strict();
export type StepSearchOptions = z.infer<typeof stepSearchOptionsSchema>;
