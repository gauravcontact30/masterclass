import type { NotebookRequest } from "./schema";
import { artisticThemes } from "./themes";

/*
 * Pure builder: a validated notebook request in, an nbformat 4.5 document
 * out. No I/O, deterministic cell ids, so the output is byte-stable for a
 * given input and straightforward to unit test.
 *
 * Cell order follows the fast-learning loop the other formats use too:
 * preview (summary) -> learn (explanation, formulas) -> do (runnable code)
 * -> consolidate (bold takeaways) -> retrieve (active recall with hidden
 * answers) -> spaced review (summary again, schedule, self-quiz code).
 */

type CellMetadata = { tags?: string[] };
export type MarkdownCell = { id: string; cell_type: "markdown"; metadata: CellMetadata; source: string[] };
export type CodeCell = { id: string; cell_type: "code"; metadata: CellMetadata; source: string[]; execution_count: null; outputs: never[] };
export type NotebookCell = MarkdownCell | CodeCell;
export type Notebook = {
  nbformat: 4;
  nbformat_minor: 5;
  metadata: {
    kernelspec: { name: "python3"; display_name: "Python 3"; language: "python" };
    language_info: { name: "python"; mimetype: "text/x-python"; file_extension: ".py"; pygments_lexer: "ipython3"; codemirror_mode: { name: "ipython"; version: 3 }; nbconvert_exporter: "python" };
    title: string;
    artistic_notes: { generator: "masterclass-artistic-notes"; version: 1; theme: string };
  };
  cells: NotebookCell[];
};

/** nbformat's multiline-string form: one entry per line, each keeping its "\n" except the last. */
export function toSource(text: string): string[] {
  let end = text.length;
  while (end > 0 && text[end - 1] === "\n") end--; // linear, unlike /\n+$/ on long input
  const trimmed = text.slice(0, end);
  if (!trimmed) return [];
  const lines = trimmed.split("\n");
  return lines.map((line, index) => (index < lines.length - 1 ? `${line}\n` : line));
}

/**
 * Escapes the HTML-significant characters of plain-text fields that end up in
 * Markdown (and inside the <details> wrappers this builder writes), while
 * leaving $…$ / $$…$$ maths and `code` spans untouched so LaTeX such as
 * "$a < b$" still reaches MathJax verbatim.
 */
export function escapeMarkdownText(value: string): string {
  return value
    .split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+\$|`[^`\n]+`)/)
    .map((part, index) => (index % 2 === 1 ? part : part.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!)))
    .join("");
}

/**
 * A Python string literal for arbitrary text. A JSON string literal is also a
 * valid Python 3 literal (same escapes, \uXXXX included) once the two line
 * separators JSON leaves raw are escaped as well.
 */
export function pythonString(value: string): string {
  return JSON.stringify(value).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

const pad = (n: number) => String(n).padStart(2, "0");
const bold = (text: string) => `**${escapeMarkdownText(text.replace(/\*\*/g, ""))}**`;

export function buildNotebook(input: NotebookRequest): Notebook {
  const cells: NotebookCell[] = [];
  const markdown = (text: string, tags?: string[]) => cells.push({ id: `an-${pad(cells.length + 1)}`, cell_type: "markdown", metadata: tags ? { tags } : {}, source: toSource(text) });
  const code = (text: string, tags?: string[]) => cells.push({ id: `an-${pad(cells.length + 1)}`, cell_type: "code", metadata: tags ? { tags } : {}, source: toSource(text), execution_count: null, outputs: [] });
  const theme = artisticThemes[input.theme];

  const recallCount = input.sections.reduce((sum, section) => sum + section.recall.length, 0);
  const codeCount = input.sections.reduce((sum, section) => sum + section.code.length, 0) + (input.setup ? 1 : 0);
  markdown([
    `# ${escapeMarkdownText(input.title)}`,
    input.subtitle ? `\n> ${escapeMarkdownText(input.subtitle)}` : "",
    `\n**${input.sections.length} section${input.sections.length === 1 ? "" : "s"} · ${codeCount} runnable cell${codeCount === 1 ? "" : "s"} · ${recallCount} recall prompt${recallCount === 1 ? "" : "s"}**`,
    "\n| Step | Do this |",
    "|:--|:--|",
    "| **1 · Preview** | Read the 60-second preview below before anything else. |",
    "| **2 · Learn** | Work through each section and run every code cell with **Shift + Enter**. |",
    "| **3 · Recall** | Answer each 🧠 prompt *out loud* before you reveal the answer. |",
    "| **4 · Review** | Rerun the self-quiz at the end tomorrow, in 3 days and in a week. |",
  ].filter(Boolean).join("\n"), ["title"]);

  markdown(["## ⚡ The 60-second preview", "", ...input.summary.map((item, index) => `${index + 1}. ${bold(item)}`)].join("\n"), ["summary"]);

  if (input.setup) {
    markdown("## ⚙️ Setup\n\nRun this cell first: it imports everything the examples below rely on.", ["setup"]);
    code(input.setup, ["setup"]);
  }

  input.sections.forEach((section, index) => {
    const lines = [`## ${pad(index + 1)} · ${escapeMarkdownText(section.heading)}`, "", section.markdown];
    for (const formula of section.formulas) {
      lines.push("", "$$", formula.latex, "$$");
      if (formula.caption) lines.push("", `<p align="center"><em>${escapeMarkdownText(formula.caption)}</em></p>`);
    }
    markdown(lines.join("\n"), ["concept"]);

    section.code.forEach((cell, codeIndex) => {
      markdown(`**▶ Try it${section.code.length > 1 ? ` (${codeIndex + 1}/${section.code.length})` : ""}.** ${cell.explanation ?? "Run the cell, then change one value and predict the new output before running it again."}`, ["try-it"]);
      code(cell.source, ["example"]);
    });

    if (section.takeaways.length) {
      markdown(["### ✅ Key takeaways", "", ...section.takeaways.map(item => `- ${bold(item)}`)].join("\n"), ["takeaways"]);
    }

    if (section.recall.length) {
      const prompts = section.recall.flatMap((item, recallIndex) => [
        `**Q${recallIndex + 1}. ${escapeMarkdownText(item.question.replace(/\*\*/g, ""))}**`,
        "",
        "<details>",
        "<summary>Reveal answer</summary>",
        "",
        escapeMarkdownText(item.answer),
        "",
        "</details>",
        "",
      ]);
      markdown(["### 🧠 Active recall", "", "*Cover the page, answer aloud, then reveal.*", "", ...prompts].join("\n").trimEnd(), ["active-recall"]);
    }
  });

  markdown([
    "## 🔁 Spaced review",
    "",
    "Say each line from memory first, then read it:",
    "",
    ...input.summary.map((item, index) => `${index + 1}. ${bold(item)}`),
    "",
    "**Review schedule** (tick each pass):",
    "",
    "- [ ] **Today:** reread every ✅ takeaway (5 minutes)",
    "- [ ] **Tomorrow:** run the self-quiz below without notes",
    "- [ ] **Day 3:** self-quiz, then rewrite one code cell from memory",
    "- [ ] **Day 7:** explain each section aloud in one sentence",
    "- [ ] **Day 21:** final self-quiz with `quiz(reveal=True)`",
  ].join("\n"), ["review"]);

  const cards = input.sections.flatMap(section => section.recall.map(item => ({ ...item, section: section.heading })));
  if (cards.length) {
    code([
      "# Active-recall self-quiz: answer each prompt aloud *before* revealing it.",
      "# quiz() prints the questions; quiz(reveal=True) prints the answers too.",
      "import random",
      "",
      "RECALL = [",
      ...cards.map(card => `    (${pythonString(card.question)}, ${pythonString(card.answer)}, ${pythonString(card.section)}),`),
      "]",
      "",
      "",
      "def quiz(reveal=False, shuffle=True, seed=None):",
      '    """Print every recall prompt, shuffled; pass reveal=True to check your answers."""',
      "    cards = list(RECALL)",
      "    if shuffle:",
      "        random.Random(seed).shuffle(cards)",
      "    for number, (question, answer, section) in enumerate(cards, start=1):",
      '        print(f"Q{number} [{section}] {question}")',
      "        if reveal:",
      '            print(f"    -> {answer}")',
      "        print()",
      "    return len(cards)",
      "",
      "",
      "quiz()",
    ].join("\n"), ["self-quiz"]);
  }

  return {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: { name: "python3", display_name: "Python 3", language: "python" },
      language_info: { name: "python", mimetype: "text/x-python", file_extension: ".py", pygments_lexer: "ipython3", codemirror_mode: { name: "ipython", version: 3 }, nbconvert_exporter: "python" },
      title: input.title,
      artistic_notes: { generator: "masterclass-artistic-notes", version: 1, theme: theme.name },
    },
    cells,
  };
}

/** Recursively orders object keys, as Jupyter does (json.dump with sort_keys=True). */
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, sortKeys((value as Record<string, unknown>)[key])]));
  return value;
}

/** Jupyter's own on-disk layout: sorted keys, one-space indentation and a trailing newline, so a save in Jupyter produces a minimal diff. */
export function serializeNotebook(notebook: Notebook): string {
  return `${JSON.stringify(sortKeys(notebook), null, 1)}\n`;
}
