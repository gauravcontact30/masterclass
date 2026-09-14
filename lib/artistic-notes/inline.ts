/*
 * The tiny inline markup every one-line text field of the notebook payload may
 * carry: **bold fragment** for punchy emphasis and `code` for identifiers.
 * Nothing else is interpreted, so user text can never smuggle in structure —
 * the renderers escape each run themselves. (Notebook markdown cells are real
 * Markdown and are passed through untouched instead.)
 */
export type InlineRun = { text: string; bold: boolean; code: boolean };

const TOKEN = /(`[^`\n]+`|\*\*[^*\n]+?\*\*)/g;

export function parseInline(value: string): InlineRun[] {
  const runs: InlineRun[] = [];
  for (const part of value.split(TOKEN)) {
    if (!part) continue;
    if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) runs.push({ text: part.slice(1, -1), bold: false, code: true });
    else if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) runs.push({ text: part.slice(2, -2), bold: true, code: false });
    else runs.push({ text: part, bold: false, code: false });
  }
  return runs;
}

/** The same text with the markup removed, for places that cannot style runs (speaker notes, filenames). */
export function plainInline(value: string): string {
  return parseInline(value).map(run => run.text).join("");
}
