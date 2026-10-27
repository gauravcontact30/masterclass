/**
 * The shape of a workflow blueprint and its canvas size, apart from the blueprints themselves (lib/landing-workflows.ts,
 * ~110 KB compressed with lib/landing-workflows-extra.ts). Diagram and layout code import from here, so drawing a
 * blueprint does not ship every blueprint to the browser.
 */
export type WorkflowNodeKind = "actor" | "service" | "store" | "queue" | "llm" | "tool" | "decision";
/** A box centred on (x, y); `label` takes one line break, and `step` puts a numbered badge on its corner. */
export type WorkflowNode = { id: string; label: string; x: number; y: number; kind: WorkflowNodeKind; step?: number };
/** An arrow between two nodes; `via` bends it through a control point, `dashed` marks a background or failure path. */
export type WorkflowEdge = { from: string; to: string; label?: string; dashed?: boolean; via?: [number, number] };
export type Workflow = {
  id: string; group: "System Design" | "LangChain" | "LangGraph" | "LangFlow" | "LangSmith" | "n8n" | "Companies";
  /** Shown on the Learning Dashboard only, never in the landing page's preview. */
  dashboardOnly?: boolean;
  title: string; summary: string; nodes: WorkflowNode[]; edges: WorkflowEdge[]; steps: string[];
  /** Who meets this problem, the real-life problem it solves and what changes once it is in place. */
  industry: string; problem: string; outcome: string;
};

export const WORKFLOW_WIDTH = 1000;
export const WORKFLOW_HEIGHT = 380;
export const NODE_WIDTH = 168;
export const NODE_HEIGHT = 62;
