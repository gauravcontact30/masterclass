import { WORKFLOWS, type Workflow } from "./landing-workflows";
import { contentKey, type ContentOverrides } from "./content-overrides";

/** Blueprints the landing preview shows per category (PREVIEW_COUNT in components/landing-ai-pulse.tsx). */
const PER_GROUP = 3;

export type WorkflowPreview = { workflows: Workflow[]; total: number; industries: number };

/**
 * The landing page's Workflow blueprints, chosen on the server: the first few of each category (dashboard-only and
 * deleted ones left out), plus the totals for "See all N blueprints". Only these reach the browser; /learning loads
 * every blueprint itself.
 */
export function previewWorkflows(overrides: ContentOverrides = {}): WorkflowPreview {
  const taken = new Map<Workflow["group"], number>();
  const workflows = WORKFLOWS.filter(workflow => {
    if (workflow.dashboardOnly || overrides[contentKey("workflow", workflow.id)]?.deleted) return false;
    const count = taken.get(workflow.group) ?? 0;
    if (count >= PER_GROUP) return false;
    taken.set(workflow.group, count + 1);
    return true;
  });
  return { workflows, total: WORKFLOWS.length, industries: new Set(WORKFLOWS.map(workflow => workflow.industry)).size };
}
