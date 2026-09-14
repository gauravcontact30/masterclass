import type { ArtisticThemeName } from "./themes";
import type { ExportPayloads, NotebookRequestInput } from "./schema";

/*
 * "Quick markup": a line-oriented shorthand the exporter UI turns into the
 * notebook request payload, so raw notes can be exported without writing JSON.
 *
 *   TL;DR: …            summary line (repeatable)
 *   # Heading           starts a section
 *   Def: Term = meaning definition ("=", " — ", " - " or ": " separates);
 *   e.g. …              …an example line right after a Def attaches to it
 *   Key: …              key takeaway
 *   Warn: …             warning
 *   Q: … / A: …         active-recall question and its answer
 *   Formula: …          plain-text/Unicode formula
 *   $$ … $$             LaTeX formula (one line, or $$ on its own lines)
 *   - item              bullet
 *   ```python … ```     code block (python blocks become notebook code cells)
 *   anything else       paragraph text; a blank line ends the paragraph
 *
 * The derivation is faithful rather than forgiving: the notebook gets
 * everything, and anything over a schema cap surfaces as a validation issue
 * in the UI.
 */

type Item =
  | { kind: "text"; text: string }
  | { kind: "bullets"; items: string[] }
  | { kind: "definition"; term: string; meaning: string; example?: string }
  | { kind: "takeaway"; text: string }
  | { kind: "warning"; text: string }
  | { kind: "recall"; question: string; answer: string }
  | { kind: "formula"; expression: string; latex?: string }
  | { kind: "code"; language: string; code: string };

export type MarkupSection = { heading: string; items: Item[] };
export type MarkupDocument = { summary: string[]; sections: MarkupSection[] };

const DIRECTIVE = /^(tl;dr|summary|def|definition|key|takeaway|warn|warning|watch out|q|a|formula)\s*:\s*(.*)$/i;
const DEFINITION_SEPARATORS = [" = ", " — ", " – ", " - ", ": "];

/** "Term = meaning" (or " — ", " - ", ": "), split at the earliest separator; linear time on long lines. */
function splitDefinition(value: string): [string, string] | null {
  let best: { index: number; length: number } | null = null;
  for (const separator of DEFINITION_SEPARATORS) {
    const index = value.indexOf(separator);
    if (index > 0 && (!best || index < best.index)) best = { index, length: separator.length };
  }
  if (!best) return null;
  const term = value.slice(0, best.index).trim();
  const meaning = value.slice(best.index + best.length).trim();
  return term && meaning ? [term, meaning] : null;
}

export function parseMarkup(source: string): MarkupDocument {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const summary: string[] = [];
  const sections: MarkupSection[] = [];
  let current: MarkupSection | null = null;
  let paragraph: string[] = [];
  let continuation: ((line: string) => void) | null = null;

  const section = () => {
    if (!current) { current = { heading: "Overview", items: [] }; sections.push(current); }
    return current;
  };
  const push = (item: Item) => section().items.push(item);
  const last = () => current?.items[current.items.length - 1];
  const flushParagraph = () => {
    if (paragraph.length) push({ kind: "text", text: paragraph.join(" ") });
    paragraph = [];
  };

  for (let index = 0; index < lines.length; index++) {
    const raw = lines[index];
    const line = raw.trim();

    if (!line) { flushParagraph(); continuation = null; continue; }

    const fence = line.match(/^```\s*([A-Za-z][A-Za-z0-9+#.-]*)?\s*$/);
    if (fence) {
      flushParagraph(); continuation = null;
      const body: string[] = [];
      while (++index < lines.length && !/^\s*```\s*$/.test(lines[index])) body.push(lines[index]);
      push({ kind: "code", language: (fence[1] ?? "python").toLowerCase(), code: body.join("\n") });
      continue;
    }

    if (line.startsWith("$$")) {
      flushParagraph(); continuation = null;
      let latex = line.slice(2);
      if (latex.trimEnd().endsWith("$$") && latex.trim().length > 2) latex = latex.trimEnd().slice(0, -2);
      else {
        const body = [latex];
        while (++index < lines.length && !lines[index].includes("$$")) body.push(lines[index]);
        if (index < lines.length) body.push(lines[index].slice(0, lines[index].indexOf("$$")));
        latex = body.join("\n");
      }
      latex = latex.trim();
      if (latex) push({ kind: "formula", latex, expression: latexToText(latex) });
      continue;
    }

    const heading = line.match(/^#{1,3}\s+(.+)$/);
    if (heading) {
      flushParagraph(); continuation = null;
      current = { heading: heading[1].trim(), items: [] };
      sections.push(current);
      continue;
    }

    const bullet = line.match(/^[-*•]\s+(.+)$/);
    if (bullet) {
      flushParagraph(); continuation = null;
      const previous = last();
      if (previous?.kind === "bullets") previous.items.push(bullet[1].trim());
      else push({ kind: "bullets", items: [bullet[1].trim()] });
      continue;
    }

    const example = line.match(/^e\.g\.\s*(.+)$/i);
    const previous = last();
    if (example && previous?.kind === "definition" && !paragraph.length) {
      previous.example = example[1].trim();
      continuation = null;
      continue;
    }

    const directive = line.match(DIRECTIVE);
    if (directive) {
      flushParagraph(); continuation = null;
      const key = directive[1].toLowerCase();
      const value = directive[2].trim();
      if (key === "tl;dr" || key === "summary") { if (value) summary.push(value); continue; }
      if (key === "def" || key === "definition") {
        const split = splitDefinition(value);
        push({ kind: "definition", term: split ? split[0] : value, meaning: split ? split[1] : "" });
        continue;
      }
      if (key === "key" || key === "takeaway") { const item: Item = { kind: "takeaway", text: value }; push(item); continuation = text => { item.text += ` ${text}`; }; continue; }
      if (key === "warn" || key === "warning" || key === "watch out") { const item: Item = { kind: "warning", text: value }; push(item); continuation = text => { item.text += ` ${text}`; }; continue; }
      if (key === "formula") { if (value) push({ kind: "formula", expression: value }); continue; }
      if (key === "q") { push({ kind: "recall", question: value, answer: "" }); continue; }
      if (key === "a") {
        const target = last();
        if (target?.kind === "recall" && !target.answer) {
          target.answer = value;
          continuation = text => { target.answer += `\n${text}`; };
        } else paragraph.push(line);
        continue;
      }
    }

    if (continuation) { continuation(line); continue; }
    paragraph.push(line);
  }
  flushParagraph();
  return { summary, sections: sections.filter(item => item.items.length || item.heading !== "Overview") };
}

/* ------------------------------------------------------------- LaTeX -> text */

const SYMBOLS: Record<string, string> = {
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", varepsilon: "ε", zeta: "ζ", eta: "η", theta: "θ", iota: "ι", kappa: "κ", lambda: "λ", mu: "μ", nu: "ν", xi: "ξ", pi: "π", rho: "ρ", sigma: "σ", tau: "τ", upsilon: "υ", phi: "φ", varphi: "φ", chi: "χ", psi: "ψ", omega: "ω",
  Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Xi: "Ξ", Pi: "Π", Sigma: "Σ", Phi: "Φ", Psi: "Ψ", Omega: "Ω",
  cdot: "·", times: "×", div: "÷", pm: "±", mp: "∓", le: "≤", leq: "≤", ge: "≥", geq: "≥", neq: "≠", ne: "≠", approx: "≈", equiv: "≡", propto: "∝", sim: "∼",
  infty: "∞", sum: "Σ", prod: "Π", int: "∫", partial: "∂", nabla: "∇", sqrt: "√", to: "→", rightarrow: "→", leftarrow: "←", Rightarrow: "⇒", iff: "⇔", mapsto: "↦",
  in: "∈", notin: "∉", subset: "⊂", subseteq: "⊆", cup: "∪", cap: "∩", forall: "∀", exists: "∃", emptyset: "∅", ldots: "…", cdots: "⋯", circ: "∘", degree: "°",
  log: "log", ln: "ln", exp: "exp", sin: "sin", cos: "cos", tan: "tan", max: "max", min: "min", lim: "lim", arg: "arg",
};
const SUPERSCRIPT: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾", n: "ⁿ", i: "ⁱ", T: "ᵀ" };
const SUBSCRIPT: Record<string, string> = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉", "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎", a: "ₐ", e: "ₑ", i: "ᵢ", j: "ⱼ", k: "ₖ", n: "ₙ", o: "ₒ", t: "ₜ", x: "ₓ" };

function script(value: string, table: Record<string, string>, marker: string): string {
  const chars = [...value];
  return chars.every(char => table[char]) ? chars.map(char => table[char]).join("") : `${marker}(${value})`;
}

/**
 * Best-effort, readable Unicode rendering of simple LaTeX, for places that
 * have no TeX engine: Greek letters, common operators, \frac,
 * \sqrt, \text, and super/subscripts where Unicode has the glyphs. Anything
 * it does not know is kept as its command name, never dropped silently.
 */
export function latexToText(latex: string): string {
  let text = latex.split("\n").map(line => line.trim()).join(" ");
  text = text.replace(/\\(?:left|right|displaystyle|quad|qquad)(?![A-Za-z])|\\[,;!]/g, " ");
  text = text.replace(/\\(?:text|mathrm|mathbf|mathit|operatorname)\{([^{}]*)\}/g, "$1");
  text = text.replace(/\\mathbb\{R\}/g, "ℝ").replace(/\\mathbb\{N\}/g, "ℕ").replace(/\\mathbb\{Z\}/g, "ℤ");
  // Accents become the matching combining mark on the (single) accented symbol.
  text = text.replace(/\\(?:hat|widehat)\{([^{}]*)\}/g, `$1${String.fromCharCode(0x302)}`)
    .replace(/\\(?:bar|overline)\{([^{}]*)\}/g, `$1${String.fromCharCode(0x304)}`)
    .replace(/\\vec\{([^{}]*)\}/g, `$1${String.fromCharCode(0x20d7)}`);
  for (let pass = 0; pass < 4; pass++) {
    text = text.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, a: string, b: string) => `${/^\w+$/.test(a) ? a : `(${a})`}/${/^\w+$/.test(b) ? b : `(${b})`}`);
    text = text.replace(/\\sqrt\{([^{}]*)\}/g, (_, a: string) => `√${/^\w+$/.test(a) ? a : `(${a})`}`);
  }
  text = text.replace(/\^\{([^{}]*)\}/g, (_, v: string) => script(v, SUPERSCRIPT, "^")).replace(/\^(\w)/g, (_, v: string) => script(v, SUPERSCRIPT, "^"));
  text = text.replace(/_\{([^{}]*)\}/g, (_, v: string) => script(v, SUBSCRIPT, "_")).replace(/_(\w)/g, (_, v: string) => script(v, SUBSCRIPT, "_"));
  text = text.replace(/\\([A-Za-z]+)/g, (_, name: string) => SYMBOLS[name] ?? name);
  text = text.replace(/[{}]/g, "").replace(/\s+/g, " ").replace(/ - /g, " − ").trim();
  return text.length > 160 ? `${text.slice(0, 159).trimEnd()}…` : text;
}

/* ----------------------------------------------------------- Derivations */

/** Cuts at a word boundary and marks the cut, so a summary line never ends in half a word. */
export function clip(text: string, max: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:.–—-]+$/, "")}…`;
}
const PYTHON = new Set(["python", "py", "python3", "ipython"]);

type Meta = { title: string; subtitle?: string; theme: ArtisticThemeName };

export function toNotebookPayload(doc: MarkupDocument, meta: Meta): NotebookRequestInput {
  return {
    title: meta.title,
    ...(meta.subtitle ? { subtitle: meta.subtitle } : {}),
    theme: meta.theme,
    summary: summaryOf(doc).slice(0, 8),
    sections: doc.sections.map(section => {
      const prose: string[] = [];
      const takeaways: string[] = [];
      const formulas: { latex: string }[] = [];
      const code: { source: string }[] = [];
      const recall: { question: string; answer: string }[] = [];
      for (const item of section.items) {
        switch (item.kind) {
          case "text": prose.push(item.text); break;
          case "bullets": prose.push(item.items.map(point => `- ${point}`).join("\n")); break;
          case "definition": prose.push(`**${item.term.replace(/\*\*/g, "")}** — ${item.meaning}${item.example ? `\n\n*e.g.* ${item.example}` : ""}`); break;
          case "takeaway": takeaways.push(item.text); break;
          case "warning": prose.push(`> **⚠ Watch out:** ${item.text}`); break;
          case "recall": recall.push({ question: item.question, answer: item.answer }); break;
          case "formula":
            if (item.latex) formulas.push({ latex: item.latex });
            else if (!item.expression.includes("$")) formulas.push({ latex: item.expression });
            else prose.push(item.expression);
            break;
          case "code":
            if (PYTHON.has(item.language)) code.push({ source: item.code });
            else prose.push(`\`\`\`${item.language}\n${item.code}\n\`\`\``);
            break;
        }
      }
      return {
        heading: section.heading,
        markdown: prose.join("\n\n") || `*${section.heading}: the takeaways, formulas and code below carry this section.*`,
        takeaways,
        formulas,
        code,
        recall,
      };
    }),
  };
}

/** The spaced summary: explicit TL;DR lines, else the takeaways, else the section headings. */
function summaryOf(doc: MarkupDocument): string[] {
  if (doc.summary.length) return doc.summary;
  const takeaways = doc.sections.flatMap(section => section.items.filter(item => item.kind === "takeaway").map(item => (item as { text: string }).text));
  return (takeaways.length ? takeaways : doc.sections.map(section => section.heading)).slice(0, 6).map(item => clip(item, 200));
}

export function markupToPayloads(source: string, meta: Meta): ExportPayloads {
  const doc = parseMarkup(source);
  return { notebook: toNotebookPayload(doc, meta) };
}

/** The exporter's starter document: exercises every markup directive. */
export const SAMPLE_MARKUP = [
  "TL;DR: Gradient descent walks downhill on the loss, one small step at a time.",
  "TL;DR: The gradient points uphill, so every step goes against it.",
  "TL;DR: The learning rate sets the step size: too big diverges, too small crawls.",
  "",
  "# The loss landscape",
  "Training a model means finding parameters that make the loss small. Picture the loss as a landscape: every parameter setting is a location and its height is the error.",
  "Def: Loss function = one number measuring how wrong the model's predictions are.",
  "e.g. Mean squared error averages the squared gaps between predictions and targets.",
  String.raw`$$ L(\theta) = \frac{1}{n} \sum_{i=1}^{n} (y_i - \hat{y}_i)^2 $$`,
  "Key: **Lower loss = better fit.** Training is a search for the lowest point.",
  "Q: What does the height of the landscape represent?",
  "A: The loss: how wrong the model is at those parameter values.",
  "",
  "# The gradient",
  "Def: Gradient = the vector of partial derivatives; it points in the direction of steepest increase.",
  "- Each component says how the loss changes when one parameter nudges up",
  "- Its length says how steep the slope is",
  "Key: Step **against** the gradient to go downhill.",
  "Q: Why do we subtract the gradient instead of adding it?",
  "A: The gradient points uphill; subtracting it moves toward lower loss.",
  "",
  "# The update rule",
  String.raw`$$ \theta \leftarrow \theta - \eta \nabla L(\theta) $$`,
  "Warn: A learning rate that is too large overshoots the minimum and can diverge.",
  "```python",
  "def gradient_descent(grad, theta, lr=0.1, steps=50):",
  "    for _ in range(steps):",
  "        theta = theta - lr * grad(theta)",
  "    return theta",
  "",
  "# Minimise f(x) = (x - 3)^2, whose gradient is 2(x - 3).",
  "print(round(gradient_descent(lambda x: 2 * (x - 3), theta=0.0), 4))",
  "```",
  "Key: One line of maths, one line of code: `theta = theta - lr * grad(theta)`.",
  "Q: What happens when the learning rate is far too large?",
  "A: Each step overshoots the minimum, so the loss bounces around or blows up.",
].join("\n");
