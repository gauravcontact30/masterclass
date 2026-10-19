import { useId } from "react";
import { NODE_HEIGHT, NODE_WIDTH, WORKFLOW_HEIGHT, WORKFLOW_WIDTH, type Workflow, type WorkflowEdge, type WorkflowNode } from "@/lib/landing-workflows";
import styles from "./landing-workflows.module.css";

/*
 * A workflow blueprint drawn as SVG: its nodes, arrows, edge labels and numbered step badges. No client state, so
 * it renders on the server (the public /workflows pages) as well as inside the landing carousel. Its colours read
 * the landing tokens, so place it inside an element carrying the landing-home `.home` class.
 */
/** Seven light tones the step pills and their diagram badges cycle through, so badge 03 matches pill 03. */
export const STEP_TONES = 7;
export const two = (n: number) => String(n).padStart(2, "0");
const labelWidth = (label: string) => label.length * 6.4 + 18;

/** Where the line from a node's centre toward `toward` leaves its box. */
function clip(node: WorkflowNode, toward: { x: number; y: number }, pad = 5) {
  const dx = toward.x - node.x, dy = toward.y - node.y;
  const t = Math.min(dx ? (NODE_WIDTH / 2 + pad) / Math.abs(dx) : Infinity, dy ? (NODE_HEIGHT / 2 + pad) / Math.abs(dy) : Infinity);
  return { x: node.x + dx * t, y: node.y + dy * t };
}

function edgeGeometry(edge: WorkflowEdge, from: WorkflowNode, to: WorkflowNode) {
  if (edge.via) {
    const via = { x: edge.via[0], y: edge.via[1] };
    const s = clip(from, via), e = clip(to, via);
    return { d: `M${s.x},${s.y} Q${via.x},${via.y} ${e.x},${e.y}`, mid: { x: .25 * s.x + .5 * via.x + .25 * e.x, y: .25 * s.y + .5 * via.y + .25 * e.y } };
  }
  const s = clip(from, to), e = clip(to, from);
  const mid = { x: (s.x + e.x) / 2, y: (s.y + e.y) / 2 };
  // A label on a short level arrow would cover both boxes, so it rides just above them instead.
  if (edge.label && from.y === to.y && Math.abs(e.x - s.x) < labelWidth(edge.label) + 8) mid.y = from.y - NODE_HEIGHT / 2 - 20;
  return { d: `M${s.x},${s.y} L${e.x},${e.y}`, mid };
}

export function WorkflowDiagram({ workflow }: Readonly<{ workflow: Pick<Workflow, "title" | "nodes" | "edges"> }>) {
  const id = useId().replaceAll(":", "");
  const byId = new Map(workflow.nodes.map(node => [node.id, node]));
  const edges = workflow.edges.map(edge => ({ edge, ...edgeGeometry(edge, byId.get(edge.from)!, byId.get(edge.to)!) }));
  return <svg viewBox={`0 0 ${WORKFLOW_WIDTH} ${WORKFLOW_HEIGHT}`} role="img" aria-label={`${workflow.title} workflow: ${workflow.nodes.map(node => node.label.replace("\n", " ")).join(", ")}`}>
    <defs>
      <marker id={`arrow-${id}`} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M1,1 L9,5 L1,9 z" className={styles.arrowHead} /></marker>
      <filter id={`lift-${id}`} x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#141413" floodOpacity=".08" /></filter>
    </defs>
    <g>{edges.map(({ edge, d }) => <g key={`${edge.from}-${edge.to}`}>
      <path d={d} className={styles.edge} data-dashed={!!edge.dashed} markerEnd={`url(#arrow-${id})`} />
      {!edge.dashed && <path d={d} className={styles.flow} />}
    </g>)}</g>
    <g filter={`url(#lift-${id})`}>{workflow.nodes.map(node => <NodeBox key={node.id} node={node} />)}</g>
    <g>{edges.filter(({ edge }) => edge.label).map(({ edge, mid }) => {
      const width = labelWidth(edge.label!);
      return <g key={`label-${edge.from}-${edge.to}`} className={styles.edgeLabel}>
        <rect x={mid.x - width / 2} y={mid.y - 10} width={width} height={20} rx={10} />
        <text x={mid.x} y={mid.y + 4} textAnchor="middle">{edge.label}</text>
      </g>;
    })}</g>
  </svg>;
}

function NodeBox({ node }: Readonly<{ node: WorkflowNode }>) {
  const [title, detail] = node.label.split("\n");
  const left = node.x - NODE_WIDTH / 2, top = node.y - NODE_HEIGHT / 2;
  return <g className={styles.node} data-kind={node.kind}>
    <rect x={left} y={top} width={NODE_WIDTH} height={NODE_HEIGHT} rx={node.kind === "decision" ? NODE_HEIGHT / 2 : 14} />
    <rect className={styles.accent} x={left + 10} y={top + 14} width={4} height={NODE_HEIGHT - 28} rx={2} />
    <text x={node.x + 5} y={detail ? node.y - 3 : node.y + 5} textAnchor="middle" className={styles.nodeTitle}>{title}</text>
    {detail && <text x={node.x + 5} y={node.y + 16} textAnchor="middle" className={styles.nodeDetail}>{detail}</text>}
    {node.step && <g className={styles.badge} data-tone={(node.step - 1) % STEP_TONES}><circle cx={left + 4} cy={top + 4} r={12.5} /><text x={left + 4} y={top + 8} textAnchor="middle">{two(node.step)}</text></g>}
  </g>;
}
