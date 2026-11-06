/** @jest-environment node */
import { exportBundleSchema, notebookRequestSchema } from "@/lib/artistic-notes/schema";

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
