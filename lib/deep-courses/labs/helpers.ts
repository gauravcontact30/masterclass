import type { LabExample, TopicLab } from "../types";

/**
 * Authoring helpers for topic labs (see TopicLab). Write sources and outputs with the `code` tag (String.raw) so
 * "\n" in Java or C++ string literals stays an escape; each helper trims the template's leading newline and trailing
 * whitespace. Outputs are exactly what the program prints: scripts/check-deep-labs.mts runs the Java ones.
 */
export { code } from "../content/helpers";

const tidy = (text: string) => text.replace(/^\n/, "").replace(/\s+$/, "");

export const ex = (title: string, file: string, source: string, output: string, explain?: string): LabExample =>
  ({ title, file, code: `${tidy(source)}\n`, output: tidy(output), ...(explain ? { explain } : {}) });
export const syntax = (file: string, source: string, notes: string[]): TopicLab["syntax"] => ({ file, code: `${tidy(source)}\n`, notes });
export const task = (q: string, a: string, source?: string): TopicLab["assignments"][number] => ({ q, a, ...(source ? { code: tidy(source) } : {}) });
export const alt = (title: string, why: string, file: string, source: string): TopicLab["alternates"][number] => ({ title, why, file, code: `${tidy(source)}\n` });
