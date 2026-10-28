import { WORKFLOWS, type Workflow } from "./landing-workflows";
import { contentKey, type ContentOverrides } from "./content-overrides";

/** Blueprints the landing preview shows per category (PREVIEW_COUNT in components/landing-ai-pulse.tsx). */
const PER_GROUP = 3;

/**
 * `workflows`: only the blueprints the "All" tab paints first. `groups`: how many each category tab holds; the
 * section fetches those blueprints (/api/landing/workflows) the first time a tab is picked.
 */
export type WorkflowPreview = { workflows: Workflow[]; total: number; industries: number; groups: Partial<Record<Workflow["group"], number>> };

/**
 * Every blueprint the landing carousel can show: the first few of each category, dashboard-only and deleted ones
 * left out. /learning loads every blueprint itself.
 */
export function previewPool(overrides: ContentOverrides = {}): Workflow[] {
  const taken = new Map<Workflow["group"], number>();
  return WORKFLOWS.filter(workflow => {
    if (workflow.dashboardOnly || overrides[contentKey("workflow", workflow.id)]?.deleted) return false;
    const count = taken.get(workflow.group) ?? 0;
    if (count >= PER_GROUP) return false;
    taken.set(workflow.group, count + 1);
    return true;
  });
}

/**
 * The landing page's Workflow blueprints, chosen on the server. Sending the whole pool put ~50 KB of diagram nodes,
 * edges and steps into the page's RSC payload for tabs most visitors never open, so the page carries the first
 * screenful and the counts behind the tabs and "See all N blueprints".
 */
export function previewWorkflows(overrides: ContentOverrides = {}): WorkflowPreview {
  const pool = previewPool(overrides);
  const groups: WorkflowPreview["groups"] = {};
  for (const workflow of pool) groups[workflow.group] = (groups[workflow.group] ?? 0) + 1;
  return { workflows: pool.slice(0, PER_GROUP), total: WORKFLOWS.length, industries: new Set(WORKFLOWS.map(workflow => workflow.industry)).size, groups };
}
