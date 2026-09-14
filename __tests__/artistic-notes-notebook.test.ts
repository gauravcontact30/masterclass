/** @jest-environment node */
import { buildNotebook, escapeMarkdownText, pythonString, serializeNotebook, toSource, type Notebook, type NotebookCell } from "@/lib/artistic-notes/notebook";
import { notebookRequestSchema, type NotebookRequestInput } from "@/lib/artistic-notes/schema";

const request: NotebookRequestInput = {
  title: "Big-O <fast> & loose",
  subtitle: "Growth rates, measured",
  theme: "warm-academic",
  setup: "import timeit",
  sections: [
    {
      heading: "Linear time",
      markdown: "Work grows **in step** with input: $T(n) = c \\cdot n$.",
      formulas: [{ latex: "T(n) \\in O(n)", caption: "Linear growth" }],
      takeaways: ["Double the input, double the work.", "Constants **vanish** in Big-O."],
      code: [{ explanation: "Time a linear scan.", source: "def total(xs):\n    s = 0\n    for x in xs:\n        s += x\n    return s\n\nprint(total(range(10)))" }],
      recall: [{ question: "What happens to a linear algorithm's time when the input doubles?", answer: "It roughly doubles.\nConstants do not change that." }],
    },
    {
      heading: "Quadratic time",
      markdown: "Nested loops over the same input give $O(n^2)$.",
      code: [{ source: "pairs = [(a, b) for a in range(3) for b in range(3)]\nprint(len(pairs))" }],
      recall: [{ question: "Why is a < b comparison of all pairs O(n^2)?", answer: "There are n·n \"pairs\" to compare; the quote and backslash \\ must survive." }],
    },
  ],
  summary: ["Big-O keeps the **dominant** term.", "Nested loops multiply."],
};

const built = (): Notebook => buildNotebook(notebookRequestSchema.parse(request));
const text = (cell: NotebookCell) => cell.source.join("");

describe("buildNotebook", () => {
  test("produces an nbformat 4.5 document with a Python 3 kernel", () => {
    const nb = built();
    expect(nb.nbformat).toBe(4);
    expect(nb.nbformat_minor).toBe(5);
    expect(nb.metadata.kernelspec).toEqual({ name: "python3", display_name: "Python 3", language: "python" });
    expect(nb.metadata.language_info).toMatchObject({ name: "python", file_extension: ".py", mimetype: "text/x-python", pygments_lexer: "ipython3" });
    expect(nb.metadata.artistic_notes).toEqual({ generator: "masterclass-artistic-notes", version: 1, theme: "warm-academic" });
  });

  test("every cell satisfies the nbformat 4.5 cell schema", () => {
    const nb = built();
    const ids = new Set<string>();
    for (const cell of nb.cells) {
      // Cell ids became mandatory in nbformat 4.5: 1-64 chars of [a-zA-Z0-9-_], unique.
      expect(cell.id).toMatch(/^[a-zA-Z0-9-_]{1,64}$/);
      expect(ids.has(cell.id)).toBe(false);
      ids.add(cell.id);
      expect(["markdown", "code"]).toContain(cell.cell_type);
      expect(typeof cell.metadata).toBe("object");
      expect(Array.isArray(cell.source)).toBe(true);
      cell.source.forEach((line, index) => {
        expect(typeof line).toBe("string");
        // Multiline-string form: a newline ends every entry except the last, and never appears mid-entry.
        if (index < cell.source.length - 1) expect(line.endsWith("\n")).toBe(true);
        expect(line.slice(0, -1)).not.toContain("\n");
      });
      if (cell.cell_type === "code") {
        expect(cell.execution_count).toBeNull();
        expect(cell.outputs).toEqual([]);
        expect(Object.keys(cell).sort()).toEqual(["cell_type", "execution_count", "id", "metadata", "outputs", "source"]);
      } else {
        expect(Object.keys(cell).sort()).toEqual(["cell_type", "id", "metadata", "source"]);
      }
    }
  });

  test("serialises to JSON that round-trips exactly, in Jupyter's layout", () => {
    const nb = built();
    const json = serializeNotebook(nb);
    expect(json.endsWith("\n")).toBe(true);
    expect(json.split("\n")[1]).toBe(' "cells": [');
    expect(JSON.parse(json)).toEqual(nb);
    expect(serializeNotebook(built())).toBe(json); // deterministic
  });

  test("follows the learning loop: preview, setup, concept, try-it + code, takeaways, recall, review, self-quiz", () => {
    const tags = built().cells.map(cell => `${cell.cell_type}:${cell.metadata.tags?.[0]}`);
    expect(tags).toEqual([
      "markdown:title", "markdown:summary", "markdown:setup", "code:setup",
      "markdown:concept", "markdown:try-it", "code:example", "markdown:takeaways", "markdown:active-recall",
      "markdown:concept", "markdown:try-it", "code:example", "markdown:active-recall",
      "markdown:review", "code:self-quiz",
    ]);
  });

  test("renders rich markdown: LaTeX, bold takeaways and hidden recall answers", () => {
    const cells = built().cells.map(text);
    const concept = cells[4];
    expect(concept).toContain("## 01 · Linear time");
    expect(concept).toContain("$T(n) = c \\cdot n$");
    expect(concept).toContain("$$\nT(n) \\in O(n)\n$$");
    expect(cells[7]).toContain("- **Double the input, double the work.**");
    expect(cells[7]).toContain("- **Constants vanish in Big-O.**"); // nested ** would break the bold
    expect(cells[8]).toContain("**Q1. What happens to a linear algorithm's time when the input doubles?**");
    expect(cells[8]).toMatch(/<details>\n<summary>Reveal answer<\/summary>\n\nIt roughly doubles\.\nConstants do not change that\.\n\n<\/details>/);
    expect(cells[13]).toContain("1. **Big-O keeps the dominant term.**");
    expect(cells[13]).toContain("- [ ] **Day 7:**");
  });

  test("escapes HTML in plain-text fields but leaves maths and code spans alone", () => {
    const nb = built();
    expect(text(nb.cells[0])).toContain("# Big-O &lt;fast&gt; &amp; loose");
    expect(text(nb.cells[12])).toContain("Why is a &lt; b comparison");
    expect(escapeMarkdownText("a < b and $a < b$ and `a < b`")).toBe("a &lt; b and $a < b$ and `a < b`");
  });

  test("keeps user code verbatim in code cells", () => {
    const code = built().cells.filter(cell => cell.cell_type === "code").map(text);
    expect(code[0]).toBe("import timeit");
    expect(code[1]).toBe("def total(xs):\n    s = 0\n    for x in xs:\n        s += x\n    return s\n\nprint(total(range(10)))");
  });

  test("the self-quiz cell embeds every recall item as safe Python string literals", () => {
    const quiz = text(built().cells.at(-1)!);
    expect(quiz).toContain("def quiz(reveal=False, shuffle=True, seed=None):");
    expect(quiz.trimEnd().endsWith("quiz()")).toBe(true);
    const rows = quiz.split("\n").filter(line => line.startsWith("    (\""));
    expect(rows).toHaveLength(2);
    // A JSON string literal is a valid Python literal; parse it back to prove the escaping round-trips.
    const second = JSON.parse(`[${rows[1].trim().replace(/^\(/, "").replace(/\),$/, "")}]`);
    expect(second).toEqual(["Why is a < b comparison of all pairs O(n^2)?", "There are n·n \"pairs\" to compare; the quote and backslash \\ must survive.", "Quadratic time"]);
  });

  test("omits the quiz when there is nothing to recall, and the setup cells when there is no setup", () => {
    const nb = buildNotebook(notebookRequestSchema.parse({ title: "T", summary: ["S"], sections: [{ heading: "H", markdown: "M" }] }));
    expect(nb.cells.map(cell => cell.metadata.tags?.[0])).toEqual(["title", "summary", "concept", "review"]);
    expect(nb.metadata.artistic_notes.theme).toBe("high-contrast-light");
  });
});

describe("helpers", () => {
  test("toSource splits into nbformat lines", () => {
    expect(toSource("a\nb\n")).toEqual(["a\n", "b"]);
    expect(toSource("single")).toEqual(["single"]);
    expect(toSource("")).toEqual([]);
  });

  test("pythonString escapes the line separators JSON leaves raw", () => {
    expect(pythonString("a\u2028b\u2029c")).toBe('"a\\u2028b\\u2029c"');
    expect(pythonString('say "hi"\n')).toBe('"say \\"hi\\"\\n"');
  });
});
