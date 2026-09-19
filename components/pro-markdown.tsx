import { Fragment, type ReactNode } from "react";
import { highlightLines, type CodeLanguage } from "@/lib/code-highlight";
import styles from "./pro-learn.module.css";

const LANGUAGES: Record<string, CodeLanguage> = { js: "javascript", javascript: "javascript", jsx: "jsx", ts: "typescript", typescript: "typescript", tsx: "tsx", py: "python", python: "python", json: "json", yaml: "yaml", yml: "yaml", bash: "bash", sh: "bash", shell: "bash", css: "css", html: "html", dockerfile: "dockerfile", hcl: "hcl" };

/** Inline Markdown: `code`, **bold** and *emphasis*. Everything else stays text. */
function inline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g).filter(Boolean).map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={key}>{part.slice(1, -1)}</code>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={key}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={key}>{part.slice(1, -1)}</em>;
    return <Fragment key={key}>{part}</Fragment>;
  });
}

export function CodeBlock({ code, language = "text" }: { code: string; language?: CodeLanguage }) {
  return <pre className={styles.code} tabIndex={0}><code>{highlightLines(code, language).map((line, index) => <span key={index}>{line.map((token, part) => <span key={part} className={token.tone ? styles[token.tone] : undefined}>{token.text}</span>)}{"\n"}</span>)}</code></pre>;
}

/** Renders the limited Markdown produced by the mentor and interview answers. */
export function ProMarkdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  for (let index = 0; index < lines.length;) {
    const line = lines[index];
    const fence = line.match(/^```\s*([\w+-]*)/);
    if (fence) {
      const body: string[] = [];
      index++;
      while (index < lines.length && !lines[index].startsWith("```")) body.push(lines[index++]);
      index++;
      blocks.push(<CodeBlock key={blocks.length} code={body.join("\n")} language={LANGUAGES[fence[1].toLowerCase()] ?? "text"}/>);
      continue;
    }
    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) {
      const ordered = /^\s*\d/.test(line);
      const items: string[] = [];
      while (index < lines.length && (ordered ? /^\s*\d+[.)]\s+/ : /^\s*[-*]\s+/).test(lines[index])) items.push(lines[index++].replace(/^\s*(?:[-*]|\d+[.)])\s+/, ""));
      const List = ordered ? "ol" : "ul";
      blocks.push(<List key={blocks.length}>{items.map((item, itemIndex) => <li key={itemIndex}>{inline(item, `li${blocks.length}-${itemIndex}`)}</li>)}</List>);
      continue;
    }
    const heading = line.match(/^(#{1,4})\s+(.*)/);
    if (heading) { blocks.push(<h4 key={blocks.length}>{inline(heading[2], `h${blocks.length}`)}</h4>); index++; continue; }
    if (!line.trim()) { index++; continue; }
    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim() && !/^```|^\s*[-*]\s+|^\s*\d+[.)]\s+|^#{1,4}\s/.test(lines[index])) paragraph.push(lines[index++]);
    blocks.push(<p key={blocks.length}>{inline(paragraph.join(" "), `p${blocks.length}`)}</p>);
  }
  return <div className={styles.markdown}>{blocks}</div>;
}
