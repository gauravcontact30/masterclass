import { NODE_HEIGHT, NODE_WIDTH, WORKFLOW_HEIGHT, WORKFLOW_WIDTH, type Workflow, type WorkflowEdge, type WorkflowNode } from "./landing-workflows-shape";

/*
 * Where a workflow diagram's arrows and labels go (components/workflow-diagram draws the result). Arrows bend
 * round boxes they would cut through, labels slide to a clear spot, and a crowded diagram gets more room between
 * its rows; __tests__/workflow-diagram-layout.test.ts holds every blueprint to "nothing overlaps".
 */
export const labelWidth = (label: string) => label.length * 6.4 + 18;

type Point = { x: number; y: number };
type Box = { left: number; top: number; right: number; bottom: number };
type Geometry = { start: Point; end: Point; via: Point | null; via2?: Point };

/** Where the line from a node's centre toward `toward` leaves its box. */
function clip(node: WorkflowNode, toward: Point, pad = 5) {
  const dx = toward.x - node.x, dy = toward.y - node.y;
  const t = Math.min(dx ? (NODE_WIDTH / 2 + pad) / Math.abs(dx) : Infinity, dy ? (NODE_HEIGHT / 2 + pad) / Math.abs(dy) : Infinity);
  return { x: node.x + dx * t, y: node.y + dy * t };
}
const boxOf = (node: WorkflowNode, pad = 0): Box => ({ left: node.x - NODE_WIDTH / 2 - pad, top: node.y - NODE_HEIGHT / 2 - pad, right: node.x + NODE_WIDTH / 2 + pad, bottom: node.y + NODE_HEIGHT / 2 + pad });
const inside = (point: Point, box: Box) => point.x > box.left && point.x < box.right && point.y > box.top && point.y < box.bottom;
const overlap = (a: Box, b: Box) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
/** The point a fraction `t` along an edge: its straight line, or its quadratic curve through the control point. */
function pointAt({ start, end, via, via2 }: Geometry, t: number): Point {
  const u = 1 - t;
  if (via && via2) return { x: u * u * u * start.x + 3 * u * u * t * via.x + 3 * u * t * t * via2.x + t * t * t * end.x, y: u * u * u * start.y + 3 * u * u * t * via.y + 3 * u * t * t * via2.y + t * t * t * end.y };
  if (!via) return { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t };
  return { x: u * u * start.x + 2 * u * t * via.x + t * t * end.x, y: u * u * start.y + 2 * u * t * via.y + t * t * end.y };
}
const geometry = (from: WorkflowNode, to: WorkflowNode, via: Point | null): Geometry => ({ start: clip(from, via ?? to), end: clip(to, via ?? from), via });
/** Whether an edge runs through any box other than its own two. */
function crosses(shape: Geometry, others: Box[]) {
  for (let i = 1; i < 24; i++) { const point = pointAt(shape, i / 24); for (const box of others) if (inside(point, box)) return true; }
  return false;
}

/**
 * An edge's path. One drawn with `via` keeps its curve; a straight line that would cut through another box bends
 * around it instead, on the first curve (alternating sides, wider each time, then through any point of the canvas)
 * that clears every box.
 */
function route(edge: WorkflowEdge, from: WorkflowNode, to: WorkflowNode, nodes: WorkflowNode[], height: number, thorough: boolean): Geometry {
  if (edge.via) return geometry(from, to, { x: edge.via[0], y: edge.via[1] });
  const straight = geometry(from, to, null);
  const others = nodes.filter(node => node !== from && node !== to).map(node => boxOf(node, 6));
  if (!crosses(straight, others)) return straight;
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }, length = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  const normal = { x: -(to.y - from.y) / length, y: (to.x - from.x) / length };
  for (const bend of Array.from({ length: 16 }, (_, i) => (i % 2 ? -1 : 1) * (30 + Math.floor(i / 2) * 25))) {
    // The curve's apex sits halfway to its control point, so the control point goes twice as far out.
    const via = { x: mid.x + normal.x * bend * 2, y: mid.y + normal.y * bend * 2 };
    const curved = geometry(from, to, via);
    if (!crosses(curved, others)) return curved;
  }
  if (!thorough) return straight;
  // A long edge across a full grid: any control point whose curve stays on the canvas, nearest the middle first.
  const points = Array.from({ length: 21 }, (_, i) => i * 50).flatMap(x => Array.from({ length: Math.ceil(height / 25) + 1 }, (_, j) => ({ x, y: j * 25 })));
  points.sort((a, b) => Math.hypot(a.x - mid.x, a.y - mid.y) - Math.hypot(b.x - mid.x, b.y - mid.y));
  const onCanvas = (shape: Geometry) => {
    for (let i = 0; i <= 10; i++) { const point = pointAt(shape, i / 10); if (point.x < 2 || point.x > WORKFLOW_WIDTH - 2 || point.y < 2 || point.y > height - 2) return false; }
    return true;
  };
  for (const via of points) { const curved = geometry(from, to, via); if (onCanvas(curved) && !crosses(curved, others)) return curved; }
  // Last resort, an S-shaped curve: two control points on a coarse grid, the pair nearest each end first.
  const coarse = points.filter(point => point.x % 200 === 0 && point.y % 75 === 0);
  const near = (target: WorkflowNode) => [...coarse].sort((a, b) => Math.hypot(a.x - target.x, a.y - target.y) - Math.hypot(b.x - target.x, b.y - target.y));
  for (const first of near(from)) for (const second of near(to)) {
    const curved = { start: clip(from, first), end: clip(to, second), via: first, via2: second };
    if (onCanvas(curved) && !crosses(curved, others)) return curved;
  }
  return straight;
}

/**
 * Where each edge label sits: the middle of its edge if that is clear, else the first point along the edge (moving
 * out from the middle) that covers no box and no label placed before it, else the point with the least overlap.
 * A label on a short level arrow would cover both boxes, so it may also ride just above them.
 */
function placeLabels(edges: { edge: WorkflowEdge; shape: Geometry; from: WorkflowNode; to: WorkflowNode }[], nodes: WorkflowNode[], height: number, order: number[]) {
  const boxes = nodes.map(node => boxOf(node, 4)), placed: Box[] = [], points: (Point | null)[] = edges.map(() => null);
  for (const at of order) points[at] = place(edges[at]);
  return points;
  function place({ edge, shape, from, to }: (typeof edges)[number]): Point | null {
    if (!edge.label) return null;
    const width = labelWidth(edge.label);
    // Out from the middle of the edge in small steps, on the line and then just beside it.
    const steps = [.5, ...Array.from({ length: 8 }, (_, i) => [.5 - (i + 1) * .05, .5 + (i + 1) * .05]).flat()];
    const candidates = [0, -16, 16, -30, 30].flatMap(nudge => steps.map(t => { const point = pointAt(shape, t); return { x: point.x, y: point.y + nudge }; }));
    if (!shape.via && from.y === to.y && Math.abs(shape.end.x - shape.start.x) < width + 8) candidates.unshift({ x: (shape.start.x + shape.end.x) / 2, y: from.y - NODE_HEIGHT / 2 - 20 }, { x: (shape.start.x + shape.end.x) / 2, y: from.y + NODE_HEIGHT / 2 + 20 });
    const scored = candidates.map(point => {
      const x = Math.min(Math.max(point.x, width / 2 + 2), WORKFLOW_WIDTH - width / 2 - 2), y = Math.min(Math.max(point.y, 12), height - 12);
      const box = { left: x - width / 2, top: y - 10, right: x + width / 2, bottom: y + 10 };
      return { point: { x, y }, box, cost: [...boxes, ...placed].reduce((sum, other) => sum + overlap(box, other), 0) };
    });
    const best = scored.find(option => option.cost === 0) ?? scored.reduce((a, b) => b.cost < a.cost ? b : a);
    placed.push({ left: best.box.left - 3, top: best.box.top - 3, right: best.box.right + 3, bottom: best.box.bottom + 3 });
    return best.point;
  }
}

/** A layout of the workflow with its rows pulled `stretch` times further apart: nodes, edges and the canvas height. */
function layoutAt(workflow: Pick<Workflow, "nodes" | "edges">, stretch: number, thorough = false) {
  const top = Math.min(...workflow.nodes.map(node => node.y));
  const nodes = stretch === 1 ? workflow.nodes : workflow.nodes.map(node => ({ ...node, y: top + (node.y - top) * stretch }));
  const height = WORKFLOW_HEIGHT + (Math.max(...workflow.nodes.map(node => node.y)) - top) * (stretch - 1);
  const byId = new Map(nodes.map(node => [node.id, node]));
  const routed = workflow.edges.map(edge => { const from = byId.get(edge.from)!, to = byId.get(edge.to)!; return { edge, from, to, shape: route(edge, from, to, nodes, height, thorough) }; });
  // Labels are placed one at a time, so the order decides who gets the clear spots: in edge order, reversed, and
  // shortest edge first (a short edge has the fewest spots); the order leaving fewest overlaps wins.
  const natural = routed.map((_, i) => i), length = (i: number) => Math.hypot(routed[i].to.x - routed[i].from.x, routed[i].to.y - routed[i].from.y);
  let best: { edges: ReturnType<typeof withLabels>; problems: string[] } | null = null;
  function withLabels(order: number[]) { const labels = placeLabels(routed, nodes, height, order); return routed.map(({ edge, shape, from, to }, i) => ({ edge, shape, from, to, d: pathOf(shape), mid: labels[i] })); }
  for (const order of [natural, [...natural].reverse(), [...natural].sort((a, b) => length(a) - length(b))]) {
    const edges = withLabels(order), problems = problemsOf(nodes, edges);
    if (!best || problems.length < best.problems.length) best = { edges, problems };
    if (!problems.length) break;
  }
  return { nodes, height, ...best! };
}

/** Labels covering a box or another label, and edges running through a box not their own. */
function problemsOf(nodes: WorkflowNode[], edges: { edge: WorkflowEdge; shape: Geometry; from: WorkflowNode; to: WorkflowNode; mid: Point | null }[]) {
  const problems: string[] = [];
  const labelBoxes = edges.flatMap(({ edge, mid }) => edge.label && mid ? [{ name: edge.label, box: { left: mid.x - labelWidth(edge.label) / 2, top: mid.y - 10, right: mid.x + labelWidth(edge.label) / 2, bottom: mid.y + 10 } }] : []);
  labelBoxes.forEach(({ name, box }, i) => {
    nodes.forEach(node => { if (overlap(box, boxOf(node)) > 0) problems.push(`label "${name}" covers ${node.id}`); });
    labelBoxes.slice(i + 1).forEach(other => { if (overlap(box, other.box) > 0) problems.push(`label "${name}" covers label "${other.name}"`); });
  });
  edges.forEach(({ edge, shape, from, to }) => { if (crosses(shape, nodes.filter(node => node !== from && node !== to).map(node => boxOf(node)))) problems.push(`edge ${edge.from}→${edge.to} runs through a box`); });
  return problems;
}

/**
 * What the diagram draws. A crowded workflow gets more room between its rows (never wider, so its text stays the
 * same size): the first spacing with nothing overlapping, else the one with the fewest overlaps.
 */
const layouts = new WeakMap<object, ReturnType<typeof layoutAt>>();
export function diagramLayout(workflow: Pick<Workflow, "nodes" | "edges">) {
  // Laying out a crowded diagram takes a few milliseconds, so each workflow's layout is worked out once.
  let cached = layouts.get(workflow);
  if (!cached) { cached = searchLayout(workflow); layouts.set(workflow, cached); }
  return cached;
}
function searchLayout(workflow: Pick<Workflow, "nodes" | "edges">) {
  // The tightest row spacing with nothing overlapping, else the one with the fewest overlaps.
  let best = layoutAt(workflow, 1, true);
  for (const stretch of [1.3, 1.6, 1.9, 2.2]) {
    if (!best.problems.length) break;
    const next = layoutAt(workflow, stretch, true);
    if (next.problems.length < best.problems.length) best = next;
  }
  return best;
}
export const diagramProblems = (workflow: Pick<Workflow, "nodes" | "edges">) => diagramLayout(workflow).problems;

export const pathOf = ({ start, end, via, via2 }: Geometry) => via && via2 ? `M${start.x},${start.y} C${via.x},${via.y} ${via2.x},${via2.y} ${end.x},${end.y}` : via ? `M${start.x},${start.y} Q${via.x},${via.y} ${end.x},${end.y}` : `M${start.x},${start.y} L${end.x},${end.y}`;

