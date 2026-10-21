"use client";
import { AccordionChevron } from "@/components/ui/accordion-chevron";

import { useId, useMemo, useRef, useState } from "react";
import { Copy, Check, File, Folder } from "lucide-react";
import { highlightLines } from "@/lib/code-highlight";
import { inferLanguage, languageLabel } from "@/lib/code-run";
import type { AnswerFile } from "@/lib/pro-learn/types";
import { isCodeExampleTab } from "@/lib/code-example-tabs";
import { codeLineNotes, fileLanguage } from "@/lib/code-line-notes";
import styles from "./code-files.module.css";

/**
 * A worked example that spans several files: the tree on the left, the open
 * file on the right. The tree is derived from the paths themselves, so the
 * model only has to return `/app/page.tsx` for the folder to appear.
 */
type TreeRow = { kind: "folder"; depth: number; name: string; key: string } | { kind: "file"; depth: number; name: string; key: string; index: number };

function buildTree(files: AnswerFile[]): TreeRow[] {
  const rows: TreeRow[] = [];
  const opened: string[] = [];
  files.map((file, index) => ({ file, index })).sort((a, b) => a.file.path.localeCompare(b.file.path)).forEach(({ file, index }) => {
    const parts = file.path.replace(/^\/+/, "").split("/").filter(Boolean);
    const name = parts.pop() ?? file.path;
    parts.forEach((folder, depth) => {
      // A folder is printed once, when the run of shared parents diverges.
      if (opened[depth] === folder && parts.slice(0, depth).every((part, i) => opened[i] === part)) return;
      opened[depth] = folder;
      opened.length = depth + 1;
      rows.push({ kind: "folder", depth, name: folder, key: `${parts.slice(0, depth + 1).join("/")}:${depth}` });
    });
    if (!parts.length) opened.length = 0;
    rows.push({ kind: "file", depth: parts.length, name, key: `${file.path}:${index}`, index });
  });
  return rows;
}

export function CodeFiles({ files, label = "Code example", className, annotate = true, lineComments = annotate, includeConfigTabs = true, explainFormatting = true, hoverComments = false, skin, initialPath }: { files: AnswerFile[]; label?: string; /** The file open first (the tab this example is about); otherwise the first tab. */ initialPath?: string; className?: string; annotate?: boolean; lineComments?: boolean; includeConfigTabs?: boolean; explainFormatting?: boolean; hoverComments?: boolean; /** "apple": the neutral light Xcode look, with plain tabs instead of pastel ones. */ skin?: "apple" }) {
  const id = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(() => { const chosen = initialPath ? files.findIndex(file => file.path === initialPath) : -1; return chosen >= 0 ? chosen : Math.max(0, files.findIndex(file => isCodeExampleTab(file.path, includeConfigTabs))); });
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [open, setOpen] = useState(true);
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const rows = useMemo(() => buildTree(files), [files]);
  const tabs = files.map((entry, index) => ({ entry, index })).filter(({ entry }) => isCodeExampleTab(entry.path, includeConfigTabs));
  const file = files[Math.min(active, files.length - 1)];
  const language = useMemo(() => (lineComments || hoverComments) ? fileLanguage(file?.code ?? "", file?.path ?? "") : inferLanguage(file?.code ?? ""), [file?.code, file?.path, lineComments, hoverComments]);
  const annotatedCode = file?.code ?? "";
  const comments = useMemo(() => (lineComments || hoverComments) ? codeLineNotes(file?.code ?? "", file?.path ?? "", undefined, { explainFormatting }) : [], [file?.code, file?.path, lineComments, hoverComments, explainFormatting]);
  const lines = useMemo(() => highlightLines(annotatedCode, language), [annotatedCode, language]);
  if (!files.length || !file) return null;

  async function copy() {
    try { await navigator.clipboard.writeText(annotatedCode); setCopyFailed(false); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { setCopyFailed(true); }
  }

  function selectFile(index: number) { setActive(index); setCopied(false); setCopyFailed(false); setHoveredLine(null); }

  return <figure className={className ? `${styles.wrap} ${className}` : styles.wrap} aria-label={label} data-skin={skin}>
    <figcaption className={styles.bar}>
      <span className={styles.dots} aria-hidden="true"><i /><i /><i /></span>
      <button type="button" className={styles.disclose} aria-expanded={open} onClick={() => setOpen(value => !value)}>
        <AccordionChevron />
        <span>{label}</span>
      </button>
      <span className={styles.count}>{files.length} file{files.length === 1 ? "" : "s"} · {languageLabel(language)}</span>
    </figcaption>
    {open && <>
      {/* Tabs name the open file the way an editor does: the tree is for
          finding a file in the project, the tabs for moving between the ones
          this example actually spans. */}
      {tabs.length > 0 && <div className={styles.tabs} role="tablist" aria-label={`${label} files`}>
        {tabs.map(({ entry, index }, position) => <button key={`${entry.path}:${index}`} type="button" role="tab"
          id={`${id}-tab-${index}`} aria-controls={`${id}-panel`} ref={element => { tabRefs.current[index] = element; }}
          className={styles.tab} aria-selected={index === active} tabIndex={index === active || (!isCodeExampleTab(file.path, includeConfigTabs) && position === 0) ? 0 : -1}
          onClick={() => selectFile(index)} onKeyDown={event => {
            const nextPosition = event.key === "ArrowRight" ? (position + 1) % tabs.length : event.key === "ArrowLeft" ? (position + tabs.length - 1) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : null;
            const next = nextPosition === null ? null : tabs[nextPosition].index;
            if (next === null) return;
            event.preventDefault(); selectFile(next); tabRefs.current[next]?.focus();
          }}>
          <File size={12} aria-hidden="true" />{entry.path.replace(/^\/+/, "").split("/").at(-1) || entry.path}
        </button>)}
      </div>}
      <div className={styles.body}>
      <nav className={styles.tree} aria-label="Example files">
        <ul>{rows.map(row => <li key={row.key} style={{ paddingLeft: `${8 + row.depth * 13}px` }}>
          {row.kind === "folder"
            ? <span className={styles.folder}><Folder size={13} aria-hidden="true" />{row.name}</span>
            : <button type="button" className={styles.file} aria-current={row.index === active ? "true" : undefined} onClick={() => selectFile(row.index)}>
                <File size={13} aria-hidden="true" />{row.name}
              </button>}
        </li>)}</ul>
      </nav>
      <div className={styles.pane} id={`${id}-panel`} role="tabpanel" aria-labelledby={isCodeExampleTab(file.path, includeConfigTabs) ? `${id}-tab-${active}` : undefined} aria-label={isCodeExampleTab(file.path, includeConfigTabs) ? undefined : file.path}>
        <div className={styles.paneHead}>
          <code className={styles.path}>{file.path}</code>
          <button type="button" className={styles.copy} onClick={() => void copy()} aria-label={`Copy ${file.path}`}>
            {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}{copied ? "Copied" : "Copy"}
          </button>
        </div>
        {copyFailed && <p className={styles.note} role="status">Copy unavailable. Select the code and copy it manually.</p>}
        {file.note && <p className={styles.note}>{file.note}</p>}
        <pre className={styles.code} tabIndex={0} aria-label={`${file.path} source`}><code>
          {lines.map((line, index) => <span
            className={`${styles.line} ${hoverComments ? styles.lineHoverable : ""}`}
            key={index}
            onMouseEnter={() => hoverComments && setHoveredLine(index)}
            onMouseLeave={() => hoverComments && setHoveredLine(null)}
          >
            <span className={styles.gutter} aria-hidden="true">{index + 1}</span>
            <span className={styles.lineText}>
              {line.map((token, position) => <span key={position} data-token={token.tone || undefined}>{token.text}</span>)}
              {"\n"}
              {!hoverComments && lineComments && comments[index] && <span className={styles.lineComment} data-line-comment={index + 1}><span aria-hidden="true">{"// "}</span>{comments[index]}</span>}
            </span>
            {hoverComments && hoveredLine === index && comments[index] && (
              <span className={styles.lineFloatingTooltip} role="tooltip">
                {comments[index]}
              </span>
            )}
          </span>)}
        </code></pre>
        {hoverComments && (
          <div className={styles.hoverInspectorBar} aria-live="polite">
            <span className={styles.inspectorTag}>
              {hoveredLine !== null ? `Line ${hoveredLine + 1}` : "Hover Code"}
            </span>
            <span className={`${styles.inspectorText} ${hoveredLine !== null && comments[hoveredLine] ? styles.inspectorTextActive : ""}`}>
              {hoveredLine !== null && comments[hoveredLine]
                ? comments[hoveredLine]
                : "Hover over any code line above to display execution comments."}
            </span>
          </div>
        )}
      </div>
      </div>
    </>}
  </figure>;
}
