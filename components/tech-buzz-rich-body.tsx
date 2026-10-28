"use client";

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent, type ReactNode } from "react";
import { Bold, Code, Heading2, ImagePlus, Italic, Link2, List, ListOrdered, Loader2, Minus, SquareCode, Strikethrough, TextQuote } from "lucide-react";
import styles from "./tech-buzz-write.module.css";

/*
 * A section's text in Write with a formatting toolbar. The text stays plain (lib/prose-markup.ts marks such as
 * **bold** and ``` code blocks), so drafts, autosave and the stored story shape are unchanged and the story page
 * draws it (components/tech-buzz-prose.tsx). Edits go through the browser's own insertText so Ctrl+Z still undoes them.
 */

export const CODE_LANGUAGES = ["typescript", "tsx", "javascript", "python", "java", "go", "rust", "bash", "json", "yaml", "sql", "html", "css", "text"];
const LINE_MARK = /^(\s*[-*•]\s+|\s*\d{1,2}[.)]\s+|#{2,3}\s+|>\s?)/;
const BULLET = /^\s*[-*•]\s+/;
const NUMBER = /^\s*(\d{1,2})[.)]\s+/;

export function RichBody({ value, onChange, label, onUpload }: {
  value: string; onChange: (value: string) => void; label: string;
  /** Uploads a picture and returns its URL, or null when the upload failed (the editor shows why). */
  onUpload: (file: File) => Promise<string | null>;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [language, setLanguage] = useState("typescript");
  const [uploading, setUploading] = useState(false);

  useEffect(() => { const area = ref.current; if (!area) return; area.style.height = "auto"; area.style.height = `${area.scrollHeight}px`; }, [value]);

  /** Replaces [from, to) with text, then selects [from + selectFrom, from + selectTo). */
  function replace(from: number, to: number, text: string, selectFrom = text.length, selectTo = selectFrom) {
    const area = ref.current;
    if (!area) return;
    area.focus();
    area.setSelectionRange(from, to);
    // insertText keeps the browser's undo history; where it is missing, set the text directly.
    if (!document.execCommand("insertText", false, text)) onChange(area.value.slice(0, from) + text + area.value.slice(to));
    requestAnimationFrame(() => { area.focus(); area.setSelectionRange(from + selectFrom, from + selectTo); });
  }

  const selection = () => { const area = ref.current!; return { start: area.selectionStart, end: area.selectionEnd, picked: value.slice(area.selectionStart, area.selectionEnd) }; };

  /** **bold**, *italic*, ~~strike~~, `code`: wraps the selection, or takes the marks off when it is already wrapped. */
  function wrap(mark: string, sample: string) {
    const { start, end, picked } = selection();
    if (picked && value.slice(start - mark.length, start) === mark && value.slice(end, end + mark.length) === mark) {
      replace(start - mark.length, end + mark.length, picked, 0, picked.length);
      return;
    }
    const text = picked || sample;
    replace(start, end, `${mark}${text}${mark}`, mark.length, mark.length + text.length);
  }

  function link() {
    const { start, end, picked } = selection();
    const text = picked || "link text";
    replace(start, end, `[${text}](https://)`, text.length + 3, text.length + 11);
  }

  /** Sub-heading, list or quote marks on every selected line; pressed again, they come off. */
  function lines(mark: (index: number) => string, pattern: RegExp) {
    const { start, end } = selection();
    const from = value.lastIndexOf("\n", start - 1) + 1;
    let to = value.indexOf("\n", end);
    if (to < 0) to = value.length;
    const rows = value.slice(from, to).split("\n");
    const on = rows.every(row => !row.trim() || pattern.test(row));
    const text = rows.map((row, index) => !row.trim() ? row : on ? row.replace(pattern, "") : mark(index) + row.replace(LINE_MARK, "")).join("\n");
    replace(from, to, text, text.length);
  }

  /** A block (code, picture, divider) on its own paragraph in place of the selection. */
  function block(text: string, selectFrom: number, selectTo: number) {
    const { start, end } = selection();
    const before = value.slice(0, start), after = value.slice(end);
    const lead = !before.trim() ? "" : before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
    const tail = after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n";
    replace(start, end, `${lead}${text}${tail}`, lead.length + selectFrom, lead.length + selectTo);
  }

  function codeBlock() {
    const { picked } = selection();
    const head = `\`\`\`${language}\n`;
    const code = picked.replace(/^\n+|\n+$/g, "");
    block(`${head}${code}\n\`\`\``, head.length, head.length + code.length);
  }

  async function picture(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    const url = await onUpload(file);
    setUploading(false);
    if (url) block(`![Describe the picture](${url})`, 2, 22);
  }

  function keys(event: KeyboardEvent<HTMLTextAreaElement>) {
    const mod = event.metaKey || event.ctrlKey;
    if (mod && !event.altKey) {
      const action = ({ b: () => wrap("**", "bold text"), i: () => wrap("*", "italic text"), k: link, e: () => wrap("`", "code") } as Record<string, () => void>)[event.key.toLowerCase()];
      if (action && !event.shiftKey) { event.preventDefault(); action(); return; }
    }
    const { start, end } = selection();
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const inCode = (value.slice(0, start).match(/^\s*```/gm)?.length ?? 0) % 2 === 1;
    if (event.key === "Tab" && inCode && start === end) { event.preventDefault(); replace(start, end, "  "); return; }
    if (event.key !== "Enter" || event.shiftKey || mod || inCode || start !== end) return;
    // Enter in a list carries the bullet or the next number on; on an empty item it ends the list.
    const line = value.slice(lineStart, start);
    const bullet = line.match(BULLET), number = line.match(NUMBER), quote = line.match(/^>\s?/);
    const mark = bullet?.[0] ?? (number ? number[0].replace(number[1], String(Number(number[1]) + 1)) : quote ? "> " : null);
    if (!mark) return;
    event.preventDefault();
    if (!line.replace(LINE_MARK, "").trim()) replace(lineStart, start, "");
    else replace(start, end, `\n${mark}`);
  }


  return <div className={styles.rich}>
    <div className={styles.toolbar} role="toolbar" aria-label={`Format ${label.toLowerCase()}`}>
      <span className={styles.toolGroup}>
        <Tool name="Bold" icon={<Bold size={15} />} run={() => wrap("**", "bold text")} keyHint="B" />
        <Tool name="Italic" icon={<Italic size={15} />} run={() => wrap("*", "italic text")} keyHint="I" />
        <Tool name="Strikethrough" icon={<Strikethrough size={15} />} run={() => wrap("~~", "text")} />
        <Tool name="Inline code" icon={<Code size={15} />} run={() => wrap("`", "code")} keyHint="E" />
        <Tool name="Link" icon={<Link2 size={15} />} run={link} keyHint="K" />
      </span>
      <span className={styles.toolGroup}>
        <Tool name="Sub-heading" icon={<Heading2 size={15} />} run={() => lines(() => "## ", /^#{2,3}\s+/)} />
        <Tool name="Bulleted list" icon={<List size={15} />} run={() => lines(() => "- ", BULLET)} />
        <Tool name="Numbered list" icon={<ListOrdered size={15} />} run={() => lines(index => `${index + 1}. `, NUMBER)} />
        <Tool name="Quote" icon={<TextQuote size={15} />} run={() => lines(() => "> ", /^>\s?/)} />
        <Tool name="Divider" icon={<Minus size={15} />} run={() => block("---", 3, 3)} />
      </span>
      <span className={styles.toolGroup}>
        <Tool name="Code block" icon={<SquareCode size={15} />} run={codeBlock} />
        <select value={language} onChange={event => setLanguage(event.target.value)} aria-label="Code block language" title="Language of the next code block">
          {CODE_LANGUAGES.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
        <label className={styles.toolPicture} title="Insert a picture here" aria-label="Insert a picture">
          {uploading ? <Loader2 size={15} className={styles.spin} aria-hidden="true" /> : <ImagePlus size={15} aria-hidden="true" />}
          <span>Picture</span>
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" onChange={event => void picture(event)} disabled={uploading} />
        </label>
      </span>
    </div>
    <textarea ref={ref} className={styles.body} value={value} rows={1} aria-label={label} spellCheck
      placeholder={"Write your story…\n\nSelect text to make it bold, add a link or a list; drop a code block or a picture anywhere."}
      onChange={event => onChange(event.target.value)} onKeyDown={keys} />
  </div>;
}

function Tool({ name, icon, run, keyHint }: { name: string; icon: ReactNode; run: () => void; keyHint?: string }) {
  // mousedown keeps the focus (and the selection) in the text while the button is pressed.
  return <button type="button" title={keyHint ? `${name} (Ctrl/⌘ + ${keyHint})` : name} aria-label={name} onMouseDown={event => event.preventDefault()} onClick={run}>{icon}</button>;
}
