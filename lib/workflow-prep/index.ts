import { AGENTIC_PREP } from "./agentic";
import { SYSTEM_DESIGN_PREP } from "./system-design";
import type { WorkflowPrep } from "./types";

export type { ObjectiveQuestion, Stars, SubjectiveQuestion, WorkflowPrep } from "./types";
export { arrangeOptions, byStars } from "@/lib/interview-questions";

/**
 * Full detail and interview questions for every Workflow blueprint, keyed by workflow id.
 * Only components/landing-workflow-prep.tsx imports this, through a lazy chunk, so the landing page's
 * first load does not carry it.
 */
export const WORKFLOW_PREP: Record<string, WorkflowPrep> = { ...SYSTEM_DESIGN_PREP, ...AGENTIC_PREP };
