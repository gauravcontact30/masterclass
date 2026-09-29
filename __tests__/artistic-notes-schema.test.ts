/** @jest-environment node */
import { exportBundleSchema, notebookRequestSchema } from "@/lib/artistic-notes/schema";
import { latexToText, markupToPayloads, parseMarkup, SAMPLE_MARKUP } from "@/lib/artistic-notes/markup";

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
    const nb = notebookRequestSchema.parse(notebook());
    expect(nb.theme).toBe("high-contrast-light");
    expect(nb.sections[0]).toMatchObject({ takeaways: [], formulas: [], code: [], recall: [] });
  });

  test("normalise text: trims fields, unifies newlines, keeps code indentation", () => {
    const parsed = notebookRequestSchema.parse({
      ...notebook(),
      title: "  Sorting  ",
      setup: "\n\n    import math\n    more()   \n\n",
      sections: [{ heading: "Merge sort", markdown: "line one\r\nline two\u2028three" }],
    });
    expect(parsed.title).toBe("Sorting");
    expect(parsed.sections[0].markdown).toBe("line one\nline two\nthree");
    expect(parsed.setup).toBe("    import math\n    more()");
  });
});

describe("validation errors (the route answers these with 400)", () => {
  test("reject unknown keys at every level, since objects are strict", () => {
    expect(issuePaths(notebookRequestSchema.safeParse({ ...notebook(), author: "x" }))).toContain("");
    expect(issuePaths(notebookRequestSchema.safeParse({ ...notebook(), sections: [{ ...notebook().sections[0], colour: "red" }] }))).toContain("sections.0");
  });

  test("reject missing required fields and empty collections", () => {
    const { summary: _summary, ...noSummary } = notebook(); void _summary;
    expect(issuePaths(notebookRequestSchema.safeParse(noSummary))).toContain("summary");
    expect(issuePaths(notebookRequestSchema.safeParse({ ...notebook(), sections: [] }))).toContain("sections");
    expect(issuePaths(notebookRequestSchema.safeParse({ ...notebook(), title: "   " }))).toContain("title");
  });

  test("reject an unknown theme", () => {
    expect(issuePaths(notebookRequestSchema.safeParse({ ...notebook(), theme: "comic-sans" }))).toContain("theme");
  });

  test("enforce length caps and single-line fields", () => {
    expect(issuePaths(notebookRequestSchema.safeParse({ ...notebook(), title: "x".repeat(121) }))).toContain("title");
    expect(issuePaths(notebookRequestSchema.safeParse({ ...notebook(), subtitle: "two\nlines" }))).toContain("subtitle");
    expect(issuePaths(notebookRequestSchema.safeParse({ ...notebook(), setup: "x".repeat(2001) }))).toContain("setup");
  });

  test("reject control characters that would corrupt the generated file", () => {
    expect(issuePaths(notebookRequestSchema.safeParse({ ...notebook(), title: "bad\u0007bell" }))).toContain("title");
    expect(issuePaths(notebookRequestSchema.safeParse({ ...notebook(), sections: [{ ...notebook().sections[0], markdown: "null\u0000byte" }] }))).toContain("sections.0.markdown");
    expect(issuePaths(notebookRequestSchema.safeParse({ ...notebook(), setup: "x\u0001" }))).toContain("setup");
  });

  test("reject LaTeX that would break the notebook's $$ delimiters", () => {
    const withDollar = notebookRequestSchema.safeParse({ ...notebook(), sections: [{ ...notebook().sections[0], formulas: [{ latex: "$x^2$" }] }] });
    expect(issuePaths(withDollar)).toContain("sections.0.formulas.0.latex");
    const blankLine = notebookRequestSchema.safeParse({ ...notebook(), sections: [{ ...notebook().sections[0], formulas: [{ latex: "a\n\nb" }] }] });
    expect(issuePaths(blankLine)).toContain("sections.0.formulas.0.latex");
  });

  test("a bundle needs the notebook and validates it", () => {
    expect(exportBundleSchema.safeParse({}).success).toBe(false);
    expect(exportBundleSchema.safeParse({ notebook: notebook() }).success).toBe(true);
    expect(issuePaths(exportBundleSchema.safeParse({ notebook: { ...notebook(), summary: [] } }))).toContain("notebook.summary");
    expect(issuePaths(exportBundleSchema.safeParse({ notebook: notebook(), pdf: {} }))).toContain("");
  });
});

describe("quick markup", () => {
  test("the sample document produces a valid notebook payload", () => {
    const payloads = markupToPayloads(SAMPLE_MARKUP, { title: "Gradient descent", theme: "retro-cyberpunk" });
    expect(Object.keys(payloads)).toEqual(["notebook"]);
    const nb = notebookRequestSchema.parse(payloads.notebook);
    expect(nb.sections.some(section => section.code.some(cell => cell.source.includes("def gradient_descent")))).toBe(true);
    expect(nb.sections.some(section => section.formulas.some(formula => formula.latex.includes("\\frac{1}{n}")))).toBe(true);
  });

  test("parses every directive into the matching item", () => {
    const doc = parseMarkup(["TL;DR: remember me", "# Topic", "Def: Term = the meaning", "e.g. an example", "Key: key idea", "Warn: a trap", "Q: why?", "A: because", "Formula: E = mc²", "- one", "- two", "plain", "text"].join("\n"));
    expect(doc.summary).toEqual(["remember me"]);
    expect(doc.sections[0].items.map(item => item.kind)).toEqual(["definition", "takeaway", "warning", "recall", "formula", "bullets", "text"]);
    expect(doc.sections[0].items[0]).toEqual({ kind: "definition", term: "Term", meaning: "the meaning", example: "an example" });
    expect(doc.sections[0].items[6]).toEqual({ kind: "text", text: "plain text" });
  });

  test("renders simple LaTeX as readable Unicode", () => {
    expect(latexToText("\\theta \\leftarrow \\theta - \\eta \\nabla L(\\theta)")).toBe("θ ← θ − η ∇ L(θ)");
    expect(latexToText("\\sum_{i=1}^{n} x_i^2")).toBe("Σᵢ₌₁ⁿ xᵢ²");
    expect(latexToText("\\frac{a+b}{2}")).toBe("(a+b)/2");
  });
});
