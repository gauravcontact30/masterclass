import type { AwsHighlight } from "../aws-highlights";

/** Explicit topic summaries, grouped in the order a learner encounters them. */
export const topics = (groups: Record<string, readonly (readonly [string, string, string[]?])[]>): AwsHighlight[] =>
  Object.entries(groups).flatMap(([category, rows]) => rows.map(([name, summary, points]) => ({ name, summary, category, ...(points ? { points } : {}) })));
