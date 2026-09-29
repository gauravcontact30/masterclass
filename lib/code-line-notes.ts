import { explainLines } from "./code-explain";
import { getLineComment } from "./code-annotator";
import { inferLanguage } from "./code-run";
import type { CodeLanguage } from "./code-highlight";
import { jsxReturnLines } from "./jsx-return-lines";

export function fileLanguage(code: string, path: string): CodeLanguage {
  const filename = path.replace(/\\/g, "/").split("/").at(-1)?.toLowerCase() ?? "";
  if (/^dockerfile(?:\.|$)/.test(filename)) return "dockerfile";
  if (/^\.env(?:\.|$)/.test(filename) || filename === ".gitignore") return "text";
  const extension = path.split(".").at(-1)?.toLowerCase() ?? "";
  const languages: Record<string, CodeLanguage> = { js: "javascript", mjs: "javascript", cjs: "javascript", ts: "typescript", mts: "typescript", cts: "typescript", tsx: "tsx", jsx: "jsx", py: "python", json: "json", yaml: "yaml", yml: "yaml", css: "css", html: "html", htm: "html", sh: "bash", bash: "bash", sql: "text", go: "text", rs: "text", toml: "text", md: "markdown", mdx: "markdown", tf: "hcl", hcl: "hcl", vue: "text", svelte: "text", scss: "text", sass: "text", less: "text" };
  return languages[extension] ?? inferLanguage(code);
}

/** Display-only notes: never insert comments into JSON, JSX, or copied source. */
export function codeLineNotes(code: string, path = "", language: CodeLanguage = fileLanguage(code, path), { explainFormatting = true }: { explainFormatting?: boolean } = {}): (string | null)[] {
  const lines = code.split("\n");
  if (/\.(?:html?|css)$/i.test(path) || (!path && (language === "html" || language === "css"))) {
    return lines.map(() => null);
  }
  const explanations = explainLines(code, language);
  const jsxLines = ["javascript", "typescript", "jsx", "tsx"].includes(language) ? jsxReturnLines(code) : new Set<number>();
  return lines.map((line, index) => {
    if (jsxLines.has(index)) return null;
    const text = line.trim();
    if (!text) return explainFormatting ? "Blank line separates related steps for readability." : null;
    if (/^\.gitignore$/i.test(path.replace(/\\/g, "/").split("/").at(-1) ?? "") && !text.startsWith("#")) return text.startsWith("!") ? `Keep ${text.slice(1)} eligible for Git tracking despite an earlier ignore rule.` : `Exclude paths matching ${text} from untracked files shown by Git.`;
    if (language === "markdown" && /^#+\s/.test(text)) return `Introduce the documentation heading: ${text.replace(/^#+\s*/, "")}.`;
    if (/^(\/\/|\/\*|\*|<!--|--\s|#\s)/.test(text)) return "Existing source comment documents the surrounding code.";
    if (language === "jsx" || language === "tsx") {
      const tag = text.match(/^(?:return\s*\(?\s*)?<\/?([\w.-]+)/);
      if (tag) return `${text.startsWith("</") ? "Close" : "Render"} the ${tag[1]} JSX element with the properties or children shown.`;
      if (/^\/?>(?:[;)]*)$/.test(text)) return "Finish the JSX element's opening or self-closing tag.";
      const prop = text.match(/^([\w-]+)=/);
      if (prop) return `Pass the value of ${prop[1]} to the JSX element.`;
    }
    if (/^[}\])]+[,;]?$/.test(text)) return explainFormatting ? "Close the current block, collection, or function call." : null;
    if (/^[{[(]$/.test(text)) return "Open a block or collection continued on the following lines.";
    if (explanations[index]) return explanations[index]!;
    const property = text.match(/^["']?([\w.-]+)["']?\s*:\s*(.*)/);
    if (property) return `Set ${property[1]} to ${property[2].replace(/,$/, "") || "the nested values below"}.`;
    if (["javascript", "typescript", "jsx", "tsx", "python", "bash"].includes(language)) {
      const comment = getLineComment(line, language, path);
      if (comment) return comment.replace(/^(\/\/|#)\s*/, "");
    }
    const declaration = text.match(/^(?:export\s+)?(?:async\s+)?(?:fn|func|def|class|interface|type)\s+(\w+)/);
    if (declaration) return `Declare ${declaration[1]}; its definition continues on this line or below.`;
    const assignment = text.match(/^(?:(?:const|let|var|mut|pub)\s+)*([\w.]+)\s*(?::=|=)\s*([^=].*)/);
    if (assignment) return `Assign the expression on the right to ${assignment[1]}.`;
    const call = text.match(/^(?:await\s+)?([\w.]+)\s*\(/);
    if (call) return `Call ${call[1]} with the supplied arguments.`;
    if (/^return\b/.test(text)) return "Return this value to the caller.";
    if (/^(if|else|elif|for|while|match|switch)\b/.test(text)) return "Control which statements run using this condition or loop.";
    if (/^import\b|^from\b|^use\s|^#include/.test(text)) return "Bring the named module or symbols into this file.";
    if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|FROM|WHERE|JOIN)\b/i.test(text) && path.endsWith(".sql")) return `Define the ${text.split(/\s/)[0].toUpperCase()} part of this SQL statement.`;
    if (language === "bash" || language === "dockerfile") return `Run or configure the ${text.split(/\s/)[0]} instruction with the arguments shown.`;
    if (/^['"`]/.test(text)) return "Supply this literal value to the surrounding expression or collection.";
    return `Continue the surrounding expression with ${text}.`;
  });
}
