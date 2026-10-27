import type { ObjectiveQuestion, SubjectiveQuestion } from "../types";

/**
 * Authoring helpers for course content. `code` is String.raw so "\n" inside Java or C++ source stays an escape
 * sequence; write a literal "${" (Spring placeholders, JSP EL) as ${"$"}{ to keep it out of interpolation.
 */
export const code = String.raw;
export const qa = (q: string, a: string): SubjectiveQuestion => ({ q, a });
export const mcq = (q: string, options: [string, string, string, string], answer: 0 | 1 | 2 | 3, explain: string): ObjectiveQuestion => ({ q, options, answer, explain });
/** Trims the leading newline a template literal starts with, so files begin on line 1. */
export const file = (path: string, source: string, note?: string) => ({ path, code: source.replace(/^\n/, "").replace(/\s+$/, "") + "\n", ...(note ? { note } : {}) });
