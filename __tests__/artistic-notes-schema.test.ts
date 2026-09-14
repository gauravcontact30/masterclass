/** @jest-environment node */
import { exportBundleSchema, notebookRequestSchema, pdfRequestSchema, pptxRequestSchema } from "@/lib/artistic-notes/schema";
import { latexToText, markupToPayloads, parseMarkup, SAMPLE_MARKUP } from "@/lib/artistic-notes/markup";

const pdf = () => ({
  title: "Sorting",
  theme: "warm-academic",
  summary: ["Merge sort is O(n log n)"],
  sections: [{ heading: "Merge sort", blocks: [{ type: "takeaway", text: "Split, sort, merge." }] }],
});
const pptx = () => ({
  title: "Sorting",
  slides: [{ concept: "Merge sort", headline: "Split, sort, **merge**.", points: ["Divide in half", "Recurse", "Merge in linear time"] }],
});
const notebook = () => ({
  title: "Sorting",
  summary: ["Merge sort is O(n log n)"],
  sections: [{ heading: "Merge sort", markdown: "Runs in $O(n \\log n)$ time." }],
});

/** Every issue path, joined with dots, for compact assertions. */
function issuePaths(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  expect(result.success).toBe(false);
  return result.error!.issues.map(issue => issue.path.join("."));
}

describe("valid requests", () => {
  test("accept minimal payloads and fill defaults", () => {
    expect(pdfRequestSchema.parse(pdf()).theme).toBe("warm-academic");
    const deck = pptxRequestSchema.parse(pptx());
    expect(deck.theme).toBe("high-contrast-light");
    expect(deck.recap).toEqual([]);
    const nb = notebookRequestSchema.parse(notebook());
    expect(nb.sections[0]).toMatchObject({ takeaways: [], formulas: [], code: [], recall: [] });
  });

  test("normalise text: trims fields, unifies newlines, keeps code indentation", () => {
    const input = pdf();
    input.title = "  Sorting  ";
    input.sections[0].blocks = [
      { type: "text", text: "line one\r\nline two" } as never,
      { type: "code", code: "\n\n    indented()\n    more()   \n\n" } as never,
    ];
    const parsed = pdfRequestSchema.parse(input);
    expect(parsed.title).toBe("Sorting");
    expect(parsed.sections[0].blocks[0]).toEqual({ type: "text", text: "line one\nline two" });
    expect(parsed.sections[0].blocks[1]).toEqual({ type: "code", language: "python", code: "    indented()\n    more()" });
  });
});

describe("validation errors (the routes answer these with 400)", () => {
  test("reject unknown keys at every level, since objects are strict", () => {
    expect(issuePaths(pdfRequestSchema.safeParse({ ...pdf(), author: "x" }))).toContain("");
    const nested = pdf();
    (nested.sections[0].blocks[0] as Record<string, unknown>).colour = "red";
    expect(issuePaths(pdfRequestSchema.safeParse(nested))).toContain("sections.0.blocks.0");
  });

  test("reject missing required fields and empty collections", () => {
    const noSummary: Partial<ReturnType<typeof pdf>> = pdf();
    delete noSummary.summary;
    expect(issuePaths(pdfRequestSchema.safeParse(noSummary))).toContain("summary");
    expect(issuePaths(pdfRequestSchema.safeParse({ ...pdf(), sections: [] }))).toContain("sections");
    expect(issuePaths(pptxRequestSchema.safeParse({ ...pptx(), slides: [] }))).toContain("slides");
    expect(issuePaths(notebookRequestSchema.safeParse({ ...notebook(), title: "   " }))).toContain("title");
  });

  test("reject an unknown block type and an unknown theme", () => {
    const input = pdf();
    input.sections[0].blocks = [{ type: "video", url: "x" } as never];
    expect(issuePaths(pdfRequestSchema.safeParse(input))).toContain("sections.0.blocks.0.type");
    expect(issuePaths(pdfRequestSchema.safeParse({ ...pdf(), theme: "comic-sans" }))).toContain("theme");
  });

  test("enforce one concept per slide: at most three points, no repeated concept", () => {
    const tooMany = pptx();
    tooMany.slides[0].points.push("A fourth point");
    const result = pptxRequestSchema.safeParse(tooMany);
    expect(issuePaths(result)).toContain("slides.0.points");
    expect(result.error!.issues[0].message).toMatch(/One concept per slide/);

    const repeated = pptx();
    repeated.slides.push({ ...repeated.slides[0], concept: "  merge SORT " });
    const duplicate = pptxRequestSchema.safeParse(repeated);
    expect(issuePaths(duplicate)).toEqual(["slides.1.concept"]);
    expect(duplicate.error!.issues[0].message).toMatch(/repeats slide 1/);
  });

  test("enforce length caps and single-line fields", () => {
    expect(issuePaths(pptxRequestSchema.safeParse({ ...pptx(), title: "x".repeat(91) }))).toContain("title");
    const multiline = pptx();
    multiline.slides[0].headline = "two\nlines";
    expect(issuePaths(pptxRequestSchema.safeParse(multiline))).toContain("slides.0.headline");
    expect(issuePaths(pptxRequestSchema.safeParse({ ...pptx(), slides: [{ ...pptx().slides[0], anchor: "123456789" }] }))).toContain("slides.0.anchor");
  });

  test("reject control characters that would corrupt the generated files", () => {
    expect(issuePaths(pdfRequestSchema.safeParse({ ...pdf(), title: "bad\u0007bell" }))).toContain("title");
    const input = notebook();
    input.sections[0].markdown = "null\u0000byte";
    expect(issuePaths(notebookRequestSchema.safeParse(input))).toContain("sections.0.markdown");
  });

  test("reject LaTeX that would break the notebook's $$ delimiters", () => {
    const withDollar = notebookRequestSchema.safeParse({ ...notebook(), sections: [{ ...notebook().sections[0], formulas: [{ latex: "$x^2$" }] }] });
    expect(issuePaths(withDollar)).toContain("sections.0.formulas.0.latex");
    const blankLine = notebookRequestSchema.safeParse({ ...notebook(), sections: [{ ...notebook().sections[0], formulas: [{ latex: "a\n\nb" }] }] });
    expect(issuePaths(blankLine)).toContain("sections.0.formulas.0.latex");
  });

  test("a bundle needs at least one format and validates each one", () => {
    expect(exportBundleSchema.safeParse({}).success).toBe(false);
    expect(exportBundleSchema.safeParse({ notebook: notebook() }).success).toBe(true);
    expect(issuePaths(exportBundleSchema.safeParse({ pdf: { ...pdf(), summary: [] } }))).toContain("pdf.summary");
  });
});

describe("quick markup", () => {
  test("the sample document produces three valid payloads", () => {
    const payloads = markupToPayloads(SAMPLE_MARKUP, { title: "Gradient descent", theme: "retro-cyberpunk" });
    expect(pdfRequestSchema.safeParse(payloads.pdf).success).toBe(true);
    expect(pptxRequestSchema.safeParse(payloads.pptx).success).toBe(true);
    expect(notebookRequestSchema.safeParse(payloads.notebook).success).toBe(true);
    const deck = pptxRequestSchema.parse(payloads.pptx);
    expect(deck.slides.map(slide => slide.concept)).toEqual(["The loss landscape", "The gradient", "The update rule"]);
    for (const slide of deck.slides) expect(slide.points.length).toBeLessThanOrEqual(3);
    const nb = notebookRequestSchema.parse(payloads.notebook);
    expect(nb.sections[2].code[0].source).toContain("def gradient_descent");
    expect(nb.sections[0].formulas[0].latex).toContain("\\frac{1}{n}");
  });

  test("parses every directive into the matching block", () => {
    const doc = parseMarkup(["TL;DR: remember me", "# Topic", "Def: Term = the meaning", "e.g. an example", "Key: key idea", "Warn: a trap", "Q: why?", "A: because", "Formula: E = mc²", "- one", "- two", "plain", "text"].join("\n"));
    expect(doc.summary).toEqual(["remember me"]);
    expect(doc.sections[0].items.map(item => item.kind)).toEqual(["definition", "takeaway", "warning", "recall", "formula", "bullets", "text"]);
    expect(doc.sections[0].items[0]).toEqual({ kind: "definition", term: "Term", meaning: "the meaning", example: "an example" });
    expect(doc.sections[0].items[6]).toEqual({ kind: "text", text: "plain text" });
  });

  test("renders simple LaTeX as readable Unicode for the PDF and deck", () => {
    expect(latexToText("\\theta \\leftarrow \\theta - \\eta \\nabla L(\\theta)")).toBe("θ ← θ − η ∇ L(θ)");
    expect(latexToText("\\sum_{i=1}^{n} x_i^2")).toBe("Σᵢ₌₁ⁿ xᵢ²");
    expect(latexToText("\\frac{a+b}{2}")).toBe("(a+b)/2");
  });
});
