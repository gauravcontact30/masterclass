/*
 * The zod-free part of lib/learning-path.ts: plan lengths and how a plan's weeks split into its three stages. The
 * landing route planner imports this directly, so it must never import zod or the catalog.
 */
export const PLAN_LENGTHS = [4, 6, 8, 12] as const;

/** The weeks each of the three stages covers: 4 → 1–2, 3, 4; 8 → 1–3, 4–6, 7–8. Earlier stages take the extra week. */
export function stageSpans(weeks: number): [number, number][] {
  const base = Math.floor(weeks / 3), extra = weeks % 3;
  const sizes = [base + (extra > 0 ? 1 : 0), base + (extra > 1 ? 1 : 0), base];
  let start = 1;
  return sizes.map(size => { const span: [number, number] = [start, start + size - 1]; start += size; return span; });
}
