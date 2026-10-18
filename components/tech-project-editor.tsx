"use client";
import { useId, useState, type KeyboardEvent } from "react";
import { Check, Copy, Download, FileCode2, Pencil, RotateCcw, Terminal } from "lucide-react";
import type { TechProject } from "@/lib/tech-doc-projects";
import styles from "./tech-project-editor.module.css";

/** Small, escaped token renderer; code is always React text, never injected HTML. */
function Highlight({ line }: { line: string }) {
  const parts = line.split(/(\/\/.*$|#.*$|--.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:import|from|export|default|const|let|return|if|else|function|async|await|class|new|try|catch|throw|def|while|for|in|SELECT|FROM|WHERE|UPDATE|INSERT|CREATE|TABLE|BEGIN|COMMIT|WITH|RETURNING|true|false|null)\b|\b\d+\b)/g);
  return <>{parts.map((part, i) => <span key={i} className={/^(\/\/|#|--)/.test(part) ? styles.comment : /^["']/.test(part) ? styles.string : /^\d+$/.test(part) ? styles.number : i % 2 ? styles.keyword : undefined}>{part}</span>)}</>;
}

export function TechProjectEditor({ project }: { project: TechProject }) {
  const id = useId();
  const [active, setActive] = useState(0);
  const [files, setFiles] = useState(project.files);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState("");
  const current = files[active];
  const changed = files.some((item, index) => item.code !== project.files[index].code);
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === "ArrowRight" ? (index + 1) % files.length : event.key === "ArrowLeft" ? (index - 1 + files.length) % files.length : event.key === "Home" ? 0 : event.key === "End" ? files.length - 1 : null;
    if (next === null) return;
    event.preventDefault(); setActive(next); setStatus("");
    document.getElementById(`${id}-tab-${next}`)?.focus();
  }
  async function copy() {
    try { await navigator.clipboard.writeText(current.code); setStatus(`Copied ${current.name}`); }
    catch { setStatus("Copy unavailable. Select the code or download the file."); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([current.code], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = current.name.split("/").at(-1)!;
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus(`Downloaded ${current.name}. Save it at the path shown in its tab.`);
  }
  return <section className={styles.root} aria-label={`${project.title} project`}>
    <div className={styles.chrome}><span className={styles.lights} aria-hidden="true"><i /><i /><i /></span><span>{project.title}</span><span className={styles.fileCount}>{files.length} files</span></div>
    <p className={styles.description}>{project.description}</p>
    <div className={styles.tabs} role="tablist" aria-label="Project files">{files.map((item, index) => <button key={item.name} type="button" role="tab" id={`${id}-tab-${index}`} aria-selected={active === index} aria-controls={`${id}-panel`} tabIndex={active === index ? 0 : -1} onKeyDown={event => navigate(event, index)} onClick={() => { setActive(index); setStatus(""); }}><FileCode2 size={13} aria-hidden="true" />{item.name}</button>)}</div>
    <div className={styles.actions}><span>{changed ? "Edited locally · unsaved" : "Complete project"}</span><button type="button" aria-pressed={editing} onClick={() => setEditing(value => !value)}><Pencil size={13} />{editing ? "View code" : "Edit"}</button><button type="button" onClick={() => void copy()}>{status.startsWith("Copied") ? <Check size={13} /> : <Copy size={13} />}Copy</button><button type="button" onClick={download}><Download size={13} />File</button><button type="button" disabled={!changed} onClick={() => { setFiles(project.files); setStatus("Original files restored"); }}><RotateCcw size={13} />Reset</button></div>
    <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${active}`} tabIndex={0} className={styles.panel}>
      {editing ? <textarea aria-label={`Edit ${current.name}`} spellCheck={false} value={current.code} onChange={event => { const code = event.target.value; setFiles(all => all.map((item, index) => index === active ? { ...item, code } : item)); }} /> : <pre><code>{current.code.split("\n").map((line, index) => <span className={styles.line} key={index}><span className={styles.lineNumber} aria-hidden="true">{index + 1}</span><span><Highlight line={line} />{"\n"}</span></span>)}</code></pre>}
    </div>
    <div className={styles.status} role="status">{status || `${current.name} · UTF-8 · ${current.code.split("\n").length} lines`}</div>
    <details className={styles.run} open><summary><Terminal size={15} aria-hidden="true" />Run locally</summary><p>{project.prerequisites}</p><p>Save each file using the path in its tab. Edits stay in this workspace until you leave the technology; download files to keep them.</p><pre tabIndex={0}>{project.commands}</pre><p><b>Expected result</b><br />{project.expected}</p></details>
  </section>;
}
