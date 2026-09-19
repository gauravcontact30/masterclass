"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Copy, Check, File, Folder } from "lucide-react";
import { highlightLines } from "@/lib/code-highlight";
import { inferLanguage, languageLabel } from "@/lib/code-run";
import type { AnswerFile } from "@/lib/pro-learn/types";
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
  files.forEach((file, index) => {
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

export function CodeFiles({ files, label = "Code example" }: { files: AnswerFile[]; label?: string }) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(true);
  const rows = useMemo(() => buildTree(files), [files]);
  const file = files[Math.min(active, files.length - 1)];
  const language = useMemo(() => inferLanguage(file?.code ?? ""), [file?.code]);
  const lines = useMemo(() => highlightLines(file?.code ?? "", language), [file?.code, language]);
  if (!files.length || !file) return null;

  async function copy() {
    try { await navigator.clipboard.writeText(file.code); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* Copying is a convenience; the code is on screen either way. */ }
  }

  return <figure className={styles.wrap} aria-label={label}>
    <figcaption className={styles.bar}>
      <button type="button" className={styles.disclose} aria-expanded={open} onClick={() => setOpen(value => !value)}>
        <ChevronDown size={14} aria-hidden="true" data-open={open || undefined} />
        <span>{label}</span>
      </button>
      <span className={styles.count}>{files.length} file{files.length === 1 ? "" : "s"} · {languageLabel(language)}</span>
    </figcaption>
    {open && <div className={styles.body}>
      <nav className={styles.tree} aria-label="Example files">
        <ul>{rows.map(row => <li key={row.key} style={{ paddingLeft: `${8 + row.depth * 13}px` }}>
          {row.kind === "folder"
            ? <span className={styles.folder}><Folder size={13} aria-hidden="true" />{row.name}</span>
            : <button type="button" className={styles.file} aria-current={row.index === active ? "true" : undefined} onClick={() => setActive(row.index)}>
                <File size={13} aria-hidden="true" />{row.name}
              </button>}
        </li>)}</ul>
      </nav>
      <div className={styles.pane}>
        <div className={styles.paneHead}>
          <code className={styles.path}>{file.path}</code>
          <button type="button" className={styles.copy} onClick={() => void copy()} aria-label={`Copy ${file.path}`}>
            {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}{copied ? "Copied" : "Copy"}
          </button>
        </div>
        {file.note && <p className={styles.note}>{file.note}</p>}
        <pre className={styles.code} tabIndex={0} aria-label={`${file.path} source`}><code>
          {lines.map((line, index) => <span className={styles.line} key={index}>
            <span className={styles.gutter} aria-hidden="true">{index + 1}</span>
            <span className={styles.lineText}>
              {line.map((token, position) => <span key={position} data-token={token.tone || undefined}>{token.text}</span>)}
              {"\n"}
            </span>
          </span>)}
        </code></pre>
      </div>
    </div>}
  </figure>;
}
