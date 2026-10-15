import type { ObjectiveQuestion } from "@/lib/api-learning-schema";
import type { AwsHighlight } from "../aws-highlights";
import { conciseFocus, emptyAnswer, type PreparedExplanation } from "../prepared-explanation";

/** Shown first in every tab that carries a module, so the overview opens before the reference rows. */
export const LEARNING_MODULE_CATEGORY = "Learning module";

/**
 * One technology's complete learning module, authored from its official documentation.
 *
 * The shape follows the curriculum a learner works through: what it is, how it
 * works, a runnable example, the problem it removes, where it is used, then
 * interview preparation in both subjective and objective form.
 */
export type LearningModule = {
  technology: string;
  /** The official, one-sentence definition. */
  definition: string;
  /** What the technology is for in today's stack: the paragraph under the definition. */
  overview: string;
  /** The short technical summary: architecture, what happens under the hood and the core building blocks. */
  architecture: readonly { title: string; detail: string }[];
  code: readonly { path: string; code: string; note?: string }[];
  /** The pain without the tool, and how the tool removes it in production. */
  problem: { title: string; scenario: string };
  useCases: readonly { title: string; scenario: string }[];
  subjective: readonly { question: string; answer: string; rating: string }[];
  objective: readonly ObjectiveQuestion[];
  keyPoints: readonly string[];
  sources: readonly { title: string; url: string }[];
};

export function learningModuleRow(module: LearningModule): AwsHighlight {
  const answer = emptyAnswer(`${module.technology} learning module`, module.definition);
  answer.summary = module.overview;
  answer.steps = module.architecture.map(part => ({ ...part, code: "" }));
  answer.files = module.code.map(file => ({ path: file.path, code: file.code, note: file.note ?? "" }));
  // The first use case is what the worked example opens on, so the core problem leads.
  answer.useCases = [module.problem, ...module.useCases].map(item => ({ ...item, example: "" }));
  answer.subjects = module.subjective.map(item => ({ name: item.question, summary: item.answer, details: [`Interview ask rating: ${item.rating}`], keyPoints: [] }));
  answer.keyPoints = [...module.keyPoints];
  const prepared: PreparedExplanation = {
    answer, focus: conciseFocus(module.definition), kind: "interview",
    sources: [...module.sources], objective: [...module.objective],
  };
  return { name: `${module.technology} learning module`, category: LEARNING_MODULE_CATEGORY, summary: module.definition, points: [...module.keyPoints], useCase: module.problem, prepared };
}
