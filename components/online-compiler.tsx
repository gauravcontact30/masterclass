"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check, Copy, Download, FilePlus2, Loader2, Play, RotateCcw, SquareTerminal, X } from "lucide-react";
import { highlightLines } from "@/lib/code-highlight";
import { COMPILER_HANDOFF_KEY, COMPILER_LIMITS, CPP_STANDARDS, JAVA_RELEASES, STARTERS, type CompilerFile, type CompilerLanguage, type CompilerResult } from "@/lib/compiler";
import styles from "./online-compiler.module.css";

/*
 * The online Java and C++ compiler on the Learning dashboard. Code is edited here and compiled and run on the server
 * in a Vercel Sandbox (lib/server/compiler.ts) with the latest OpenJDK and GCC. Each language keeps its own files,
 * input and standard in this browser; course examples arrive through "Open in compiler".
 */

type Workspace = { files: CompilerFile[]; active: number; stdin: string; standard: string };
const STORE = (language: CompilerLanguage) => `mcb:compiler:${language}:v1`;
const DEFAULT_STANDARD: Record<CompilerLanguage, string> = { java: "25", cpp: "c++23" };
const fresh = (language: CompilerLanguage): Workspace => ({ files: STARTERS[language].map(file => ({ ...file })), active: 0, stdin: "", standard: DEFAULT_STANDARD[language] });

function load(language: CompilerLanguage): Workspace {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE(language)) ?? "null") as Workspace | null;
    if (saved?.files?.length) return { ...saved, active: Math.min(saved.active ?? 0, saved.files.length - 1) };
  } catch { /* fall through */ }
  return fresh(language);
}

const ERRORS: Record<string, string> = {
  signin_required: "Sign in to compile and run code.",
  rate_limited: "That is a lot of runs in a short time. Wait a minute and run again.",
  compiler_unavailable: "The compiler is starting up or unavailable right now. Try again in a minute.",
  request_too_large: "The program or its input is too large to run here.",
  invalid_files: "Check the file names: Java files end in .java, C++ files in .cpp, .cc, .h or .hpp, with at least one .cpp file.",
  duplicate_file: "Two files have the same name.",
};

export function OnlineCompiler() {
  const [language, setLanguage] = useState<CompilerLanguage>("java");
  const [work, setWork] = useState<Workspace>(() => fresh("java"));
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CompilerResult | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"output" | "compiler">("output");
  const [copied, setCopied] = useState(false);
  const [renaming, setRenaming] = useState<number | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const highlight = useRef<HTMLPreElement>(null);

  // Load this browser's saved work, or a course example handed over by "Open in compiler".
  useEffect(() => {
    let start: CompilerLanguage = "java";
    let next: Workspace | null = null;
    try {
      const handoff = JSON.parse(localStorage.getItem(COMPILER_HANDOFF_KEY) ?? "null") as { language: CompilerLanguage; files: CompilerFile[]; stdin?: string } | null;
      if (handoff?.files?.length && (handoff.language === "java" || handoff.language === "cpp")) {
        start = handoff.language;
        next = { files: handoff.files.slice(0, COMPILER_LIMITS.files), active: 0, stdin: handoff.stdin ?? "", standard: DEFAULT_STANDARD[handoff.language] };
        localStorage.removeItem(COMPILER_HANDOFF_KEY);
      } else {
        start = localStorage.getItem("mcb:compiler:language") === "cpp" ? "cpp" : "java";
      }
    } catch { /* storage blocked */ }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only saved work loads after hydration
    setLanguage(start);
    setWork(next ?? load(start));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORE(language), JSON.stringify(work)); localStorage.setItem("mcb:compiler:language", language); } catch { /* optional */ }
  }, [ready, language, work]);

  const file = work.files[work.active] ?? work.files[0];
  const lines = useMemo(() => highlightLines(file?.code ?? "", language), [file?.code, language]);

  const switchLanguage = (next: CompilerLanguage) => { if (next === language) return; setLanguage(next); setWork(load(next)); setResult(null); setError(""); };
  const editFile = (patch: Partial<CompilerFile>, index = work.active) => setWork(current => ({ ...current, files: current.files.map((entry, i) => i === index ? { ...entry, ...patch } : entry) }));

  function addFile() {
    if (work.files.length >= COMPILER_LIMITS.files) return;
    const taken = new Set(work.files.map(entry => entry.name));
    let n = work.files.length + 1, name = language === "java" ? `Helper${n}.java` : `util${n}.hpp`;
    while (taken.has(name)) { n++; name = language === "java" ? `Helper${n}.java` : `util${n}.hpp`; }
    const code = language === "java" ? `public class ${name.replace(/\.java$/, "")} {\n    \n}\n` : "#pragma once\n\n";
    setWork(current => ({ ...current, files: [...current.files, { name, code }], active: current.files.length }));
    setRenaming(work.files.length);
  }

  function removeFile(index: number) {
    if (work.files.length === 1) return;
    setWork(current => ({ ...current, files: current.files.filter((_, i) => i !== index), active: Math.max(0, Math.min(current.active - (index <= current.active ? 1 : 0), current.files.length - 2)) }));
  }

  async function run() {
    if (running) return;
    setRunning(true);
    setError("");
    try {
      const response = await fetch("/api/compiler/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language, standard: work.standard, files: work.files, stdin: work.stdin }) });
      const body = await response.json().catch(() => null) as (CompilerResult & { error?: string }) | null;
      if (!response.ok || !body || body.error) { setError(ERRORS[body?.error ?? ""] ?? "The run could not be completed. Try again."); return; }
      setResult(body);
      setTab(body.phase === "compile" || (!body.stdout && body.compileOutput) ? "compiler" : "output");
    } catch {
      setError("You appear to be offline. Check the connection and run again.");
    } finally {
      setRunning(false);
    }
  }

  function onKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); void run(); return; }
    if (event.key !== "Tab") return;
    event.preventDefault();
    const target = event.currentTarget, start = target.selectionStart, end = target.selectionEnd;
    editFile({ code: `${file.code.slice(0, start)}    ${file.code.slice(end)}` });
    requestAnimationFrame(() => { target.selectionStart = target.selectionEnd = start + 4; });
  }

  async function copy() {
    try { await navigator.clipboard.writeText(file.code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([file.code], { type: "text/plain" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: file.name });
    link.click();
    URL.revokeObjectURL(url);
  }

  const standards = language === "java" ? JAVA_RELEASES.map(release => ({ value: release, label: `Java ${release}${release === "25" ? " (latest LTS)" : ""}` })) : CPP_STANDARDS.map(standard => ({ value: standard, label: `${standard.toUpperCase()}${standard === "c++26" ? " (preview)" : standard === "c++23" ? " (latest)" : ""}` }));
  const status = !result ? null : result.phase === "compile" ? { tone: "error", text: "Compilation failed" } : result.timedOut ? { tone: "error", text: `Stopped after ${COMPILER_LIMITS.runSeconds} s` } : result.ok ? { tone: "ok", text: "Ran successfully" } : { tone: "warn", text: `Exited with code ${result.exitCode}` };

  return <section className={styles.compiler} aria-labelledby="compiler-title">
    <header className={styles.head}>
      <div>
        <p className={styles.eyebrow}><SquareTerminal size={14} aria-hidden="true" />Online compiler</p>
        <h1 id="compiler-title">Java and C++ compiler</h1>
        <p className={styles.lede}>Write, compile and run real programs with the latest OpenJDK and GCC. Each run gets its own isolated machine with no network, up to {COMPILER_LIMITS.runSeconds} seconds of run time and your standard input.</p>
      </div>
      <div className={styles.langs} role="radiogroup" aria-label="Language">
        {(["java", "cpp"] as const).map(item => <button key={item} type="button" role="radio" aria-checked={language === item} onClick={() => switchLanguage(item)}>
          <span aria-hidden="true">{item === "java" ? "☕" : "➕"}</span>{item === "java" ? "Java" : "C++"}
        </button>)}
      </div>
    </header>

    <div className={styles.ide} data-skin="apple">
      <div className={styles.toolbar}>
        <span className={styles.dots} aria-hidden="true"><i /><i /><i /></span>
        <label className={styles.standard}><span>{language === "java" ? "Release" : "Standard"}</span>
          <select value={work.standard} onChange={event => setWork(current => ({ ...current, standard: event.target.value }))}>{standards.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
        </label>
        {result?.toolchain && <span className={styles.toolchain} title="Compiler used for the last run">{result.toolchain}</span>}
        <span className={styles.toolbarActions}>
          <button type="button" onClick={() => void copy()} aria-label={`Copy ${file?.name}`}>{copied ? <Check size={15} /> : <Copy size={15} />}</button>
          <button type="button" onClick={download} aria-label={`Download ${file?.name}`}><Download size={15} /></button>
          <button type="button" onClick={() => { if (window.confirm("Replace your files with the starter program?")) { setWork(fresh(language)); setResult(null); } }} aria-label="Reset to the starter program"><RotateCcw size={15} /></button>
          <button type="button" className={styles.run} onClick={() => void run()} disabled={running || !ready}>
            {running ? <Loader2 size={15} className={styles.spin} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}{running ? "Running…" : "Run"}<kbd>Ctrl ↵</kbd>
          </button>
        </span>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Files">
        {work.files.map((entry, index) => <span key={index} className={styles.tab} data-active={index === work.active || undefined}>
          {renaming === index
            ? <input autoFocus defaultValue={entry.name} aria-label="File name" maxLength={80}
                onBlur={event => { const name = event.target.value.trim(); if (name && !work.files.some((other, i) => i !== index && other.name === name)) editFile({ name }, index); setRenaming(null); }}
                onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") setRenaming(null); }} />
            : <button type="button" role="tab" aria-selected={index === work.active} onClick={() => setWork(current => ({ ...current, active: index }))} onDoubleClick={() => setRenaming(index)} title="Double-click to rename">{entry.name}</button>}
          {work.files.length > 1 && <button type="button" className={styles.closeTab} onClick={() => removeFile(index)} aria-label={`Delete ${entry.name}`}><X size={12} /></button>}
        </span>)}
        {work.files.length < COMPILER_LIMITS.files && <button type="button" className={styles.addTab} onClick={addFile} aria-label="Add a file"><FilePlus2 size={14} /></button>}
      </div>

      <div className={styles.editor}>
        <div className={styles.gutter} aria-hidden="true">{lines.map((_, index) => <span key={index}>{index + 1}</span>)}</div>
        <div className={styles.surface}>
          <pre ref={highlight} className={styles.highlight} aria-hidden="true"><code>{lines.map((line, index) => <span key={index} className={styles.line}>{line.map((token, position) => <span key={position} data-token={token.tone || undefined}>{token.text}</span>)}{"\n"}</span>)}</code></pre>
          <textarea ref={area} className={styles.input} value={file?.code ?? ""} spellCheck={false} autoCapitalize="off" autoCorrect="off" wrap="off" aria-label={`Code of ${file?.name}`}
            onChange={event => editFile({ code: event.target.value })} onKeyDown={onKey}
            onScroll={event => { if (highlight.current) { highlight.current.scrollTop = event.currentTarget.scrollTop; highlight.current.scrollLeft = event.currentTarget.scrollLeft; } }} />
        </div>
      </div>
    </div>

    <div className={styles.io}>
      <label className={styles.stdin}>
        <span>Input (stdin)</span>
        <textarea value={work.stdin} onChange={event => setWork(current => ({ ...current, stdin: event.target.value }))} placeholder="Anything your program reads from standard input, one value per line" spellCheck={false} />
      </label>
      <section className={styles.output} aria-live="polite" aria-label="Result">
        <div className={styles.outputHead}>
          <div role="tablist" aria-label="Result">
            <button type="button" role="tab" aria-selected={tab === "output"} onClick={() => setTab("output")}>Output</button>
            <button type="button" role="tab" aria-selected={tab === "compiler"} onClick={() => setTab("compiler")}>Compiler messages{result?.compileOutput ? " •" : ""}</button>
          </div>
          {status && <span className={styles.status} data-tone={status.tone}>{status.text} · {(result!.durationMs / 1000).toFixed(1)} s</span>}
        </div>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {!result && !error && <p className={styles.placeholder}>{running ? "Compiling and running on a fresh machine…" : "Press Run to compile and run your program. Output appears here."}</p>}
        {result && tab === "output" && <>
          {result.phase === "compile" ? <p className={styles.placeholder}>The program did not compile. Open Compiler messages to see why.</p> : <pre className={styles.console}>{result.stdout || <span className={styles.muted}>(no output)</span>}</pre>}
          {result.stderr && <pre className={styles.stderr}>{result.stderr}</pre>}
        </>}
        {result && tab === "compiler" && <pre className={styles.console}>{result.compileOutput || <span className={styles.muted}>No warnings or errors.</span>}</pre>}
      </section>
    </div>
  </section>;
}
