import { z } from "zod";
import { defaultThemeName, themeNames } from "./themes";

/*
 * Request contract for the export endpoint:
 *
 *   POST /api/generate/notebook  notebookRequestSchema  -> .ipynb (nbformat 4.5)
 *
 * Objects are strict: an unknown key is a 400, so a stale client (or the
 * examples in .claude/skills/artistic-notes-generator/SKILL.md, which a test
 * parses against these schemas) cannot drift silently. The length caps keep
 * each notebook cell short enough to read at a glance.
 *
 * This module is imported by the client exporter too, so it must stay free of
 * server-only imports.
 */

/** Maximum request body per endpoint, in bytes (enforced by jsonBody()). */
export const requestLimits = { notebook: 200_000 } as const;
export type ExportFormat = keyof typeof requestLimits;

// C0 controls other than tab/newline/carriage return, DEL, and the two XML
// non-characters. None has a legitimate use in notes.
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\uFFFE\uFFFF]/;
const LINE_BREAK = /[\r\n\u2028\u2029]/;
const normaliseNewlines = (value: string) => value.replace(/\r\n?/g, "\n").replace(/[\u2028\u2029]/g, "\n");

/** A one-line string: headings, labels, bullets, questions. */
export const singleLine = (max: number) =>
  z.string().trim().min(1, "Required").max(max, `Keep this under ${max} characters`)
    .refine(value => !CONTROL.test(value), "Contains control characters")
    .refine(value => !LINE_BREAK.test(value), "Must be a single line");

/** Prose that may span lines; a blank line starts a new paragraph. */
export const multiline = (max: number) =>
  z.string().overwrite(normaliseNewlines).trim().min(1, "Required").max(max, `Keep this under ${max} characters`)
    .refine(value => !CONTROL.test(value), "Contains control characters");

/**
 * Source code: indentation is significant, so only surrounding blank lines and
 * trailing space are trimmed. This runs before the length check, on up to a
 * whole request body, so it sticks to linear-time operations (trimEnd, and a
 * start-anchored pattern) rather than a backtracking /\s+$/.
 */
export const codeText = (max: number) =>
  z.string().overwrite(value => normaliseNewlines(value).trimEnd().replace(/^(?:[ \t]*\n)+/, ""))
    .min(1, "Required").max(max, `Keep code under ${max} characters`)
    .refine(value => !CONTROL.test(value), "Contains control characters");

/** A LaTeX body without its delimiters. "$" would close the math early and a blank line ends it in Markdown. */
export const latex = z.string().overwrite(normaliseNewlines).trim().min(1, "Required").max(600, "Keep formulas under 600 characters")
  .refine(value => !CONTROL.test(value), "Contains control characters")
  .refine(value => !value.includes("$"), "Omit the $ delimiters; they are added for you")
  .refine(value => !/\n[ \t]*\n/.test(value), "A formula cannot contain a blank line");

export const themeSchema = z.enum(themeNames);
const theme = themeSchema.default(defaultThemeName);
const recallSchema = z.strictObject({ question: singleLine(240), answer: multiline(600) });

/* ------------------------------------------------------------- Notebook -- */

export const notebookSectionSchema = z.strictObject({
  heading: singleLine(100),
  /** Real Markdown; inline $…$ and display $$…$$ LaTeX render in Jupyter. */
  markdown: multiline(4000),
  takeaways: z.array(singleLine(200)).max(5).default([]),
  formulas: z.array(z.strictObject({ latex, caption: singleLine(200).optional() })).max(6).default([]),
  code: z.array(z.strictObject({ source: codeText(4000), explanation: multiline(600).optional() })).max(6).default([]),
  recall: z.array(recallSchema).max(5).default([]),
});

export const notebookRequestSchema = z.strictObject({
  title: singleLine(120),
  subtitle: singleLine(200).optional(),
  theme,
  /** Imports and helpers, emitted as the first code cell ("run me first"). */
  setup: codeText(2000).optional(),
  sections: z.array(notebookSectionSchema).min(1).max(30),
  summary: z.array(singleLine(200)).min(1).max(8),
});

/* --------------------------------------------------------------- Bundle -- */

/** What the skill emits; the exporter UI accepts it pasted as-is. */
export const exportBundleSchema = z.strictObject({
  notebook: notebookRequestSchema,
});

export const exportSchemas = { notebook: notebookRequestSchema } as const;

export type NotebookRequest = z.output<typeof notebookRequestSchema>;
export type ExportBundle = z.output<typeof exportBundleSchema>;
export type NotebookRequestInput = z.input<typeof notebookRequestSchema>;
export type ExportPayloads = { notebook: NotebookRequestInput };
