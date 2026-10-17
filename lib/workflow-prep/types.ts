import type { ObjectiveQuestion, SubjectiveQuestion } from "@/lib/interview-questions";

export { o, s, type ObjectiveQuestion, type Stars, type SubjectiveQuestion } from "@/lib/interview-questions";

/** The full detail behind one workflow blueprint, keyed by its id in lib/landing-workflows.ts. */
export type WorkflowPrep = {
  /** The tools and services a real build uses. */
  stack: string[];
  /** The choices that make the design work, each with its reason. */
  decisions: string[];
  /** What teams get wrong the first time. */
  pitfalls: string[];
  /** The numbers that tell you it is working. */
  metrics: string[];
  subjective: SubjectiveQuestion[];
  objective: ObjectiveQuestion[];
};
