/*
 * The small markup Tech Buzz paragraphs may carry, written by Write's formatting toolbar (components/tech-buzz-write.tsx)
 * and drawn by components/tech-buzz-prose.tsx:
 *   **bold**  *italic*  ~~strike~~  `code`  [text](https://…)          inline
 *   ## Sub-heading   > quote   ---   ![description](picture URL)     one line each
 *   ```tsx app/page.tsx  …code…  ```                                  a code block (language, optional file name)
 * Plain strings with none of it render exactly as before. Kept free of React so the server can use it too.
 */

/** A fenced code block: ```language optional/file.name, the code, then ``` on its own line. */
export const FENCE = /```([\w+#.-]*)[ \t]*([^\n`]*)\n([\s\S]*?)\n?```/g;
export const IMAGE_LINE = /^!\[([^\]\n]*)\]\((\S+?)\)$/;

/** File extension per language, for a code block's tab name when the writer gives none. */
export const EXTENSION: Record<string, string> = { typescript: "ts", ts: "ts", javascript: "js", js: "js", tsx: "tsx", jsx: "jsx", python: "py", py: "py", java: "java", cpp: "cpp", go: "go", rust: "rs", bash: "sh", sh: "sh", shell: "sh", json: "json", yaml: "yaml", yml: "yaml", sql: "sql", html: "html", css: "css", text: "txt" };

export const codeFileName = (language: string, name: string) => name.trim() || `example.${EXTENSION[language.toLowerCase()] ?? "txt"}`;

/** How many code blocks a paragraph holds. */
export const countCodeBlocks = (text: string) => [...text.matchAll(FENCE)].length;

/** The paragraph without its code blocks (the free preview never carries member code). */
export const withoutCode = (text: string) => text.replace(FENCE, "").trim();

/** Every picture URL a paragraph embeds. */
export const imageSources = (text: string) => text.split("\n").map(line => line.trim().match(IMAGE_LINE)?.[2]).filter((src): src is string => !!src);

/** Readable text only: for read-aloud and word counts. Code blocks and pictures are dropped, marks removed. */
export function plainProse(text: string) {
  return withoutCode(text).split("\n")
    .filter(line => !IMAGE_LINE.test(line.trim()) && !/^\s*(-{3,}|\*{3,})\s*$/.test(line))
    .map(line => line.replace(/^\s*(#{2,3}|>)\s+/, ""))
    .join("\n")
    .replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, "$1")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1").replace(/~~([^~\n]+)~~/g, "$1").replace(/`([^`\n]+)`/g, "$1")
    .replace(/(^|[^\w*])\*(?!\s)([^*\n]+?)\*(?![\w*])/g, "$1$2")
    .trim();
}
