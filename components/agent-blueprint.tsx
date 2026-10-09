"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  ChevronDown,
  Copy,
  FileCode2,
  FileText,
  Folder,
  KeyRound,
  MessageSquareText,
  Terminal,
  Users,
  Workflow,
} from "lucide-react";
import { API_PACKAGES } from "@/lib/api-docs";
import { BLUEPRINTS, fileCode, type BlueprintFile, type BlueprintMode } from "@/lib/agent-blueprint";
import { highlightLines } from "@/lib/code-highlight";
import styles from "./agent-blueprint.module.css";

const inCatalog = (pkg: string, name: string) =>
  API_PACKAGES.find(item => item.id === pkg)?.entries.some(entry => entry.name === name) ?? false;

function FileIcon({ path, size = 14 }: { path: string; size?: number }) {
  if (path.endsWith(".py")) return <FileCode2 size={size} aria-hidden="true" className={styles.iconPython} />;
  if (path.startsWith(".env")) return <KeyRound size={size} aria-hidden="true" className={styles.iconEnv} />;
  return <FileText size={size} aria-hidden="true" className={styles.iconText} />;
}

function CopyButton({ text, label, className }: { text: string; label: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={className ?? styles.copy}
      aria-label={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {}
      }}
    >
      {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

function Editor({ file, annotations, folder }: { file: BlueprintFile; annotations: boolean; folder: string }) {
  const code = useMemo(() => fileCode(file), [file]);
  const tokens = useMemo(() => highlightLines(code, file.language === "python" ? "python" : "text"), [code, file.language]);
  const [current, setCurrent] = useState<number | null>(null);
  const note = current !== null ? file.lines[current]?.[1] : undefined;

  return (
    <>
      <ol className={styles.code} data-annotations={annotations || undefined} aria-label={`${folder}/${file.path}, ${file.lines.length} lines`}>
        {file.lines.map(([text, lineNote], index) => (
          <li
            key={index}
            className={styles.line}
            data-current={current === index || undefined}
            data-blank={!text.trim() || undefined}
            onMouseEnter={() => setCurrent(index)}
            onClick={() => setCurrent(index)}
          >
            <span className={styles.lineNumber} aria-hidden="true">
              {index + 1}
            </span>
            <code className={styles.lineCode}>
              {text.trim()
                ? (tokens[index] ?? []).map((token, part) => (
                    <span key={part} className={token.tone ? styles[token.tone] : undefined}>
                      {token.text}
                    </span>
                  ))
                : " "}
            </code>
            {annotations && lineNote && <span className={styles.lineNote}>{lineNote}</span>}
          </li>
        ))}
      </ol>
      <footer className={styles.statusBar}>
        <span>{file.language === "python" ? "Python 3.10+" : file.path.startsWith(".env") ? "Environment" : "Plain text"}</span>
        <span className={styles.statusNote} aria-live="polite">
          {current !== null ? (
            <>
              <strong>Ln {current + 1}</strong> {note ?? (file.lines[current]?.[0].trim() ? "" : "Blank line")}
            </>
          ) : (
            "Hover a line to read what it does"
          )}
        </span>
        <span>{file.lines.length} lines · UTF-8</span>
      </footer>
    </>
  );
}

/** Build-along blueprint on the API Docs page: steps on the left, a light IDE on the right. */
export function AgentBlueprint() {
  const [mode, setMode] = useState<BlueprintMode>("single");
  const blueprint = BLUEPRINTS[mode];
  const [activePath, setActivePath] = useState(blueprint.steps[0].file);
  const [annotations, setAnnotations] = useState(true);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function selectMode(next: BlueprintMode) {
    setMode(next);
    setActivePath(BLUEPRINTS[next].steps[0].file);
  }

  const file = blueprint.files.find(item => item.path === activePath) ?? blueprint.files[0];
  const activeStep = blueprint.steps.find(step => step.file === file.path);
  const stepFiles = blueprint.files.filter(item => item.step);
  const projectFiles = blueprint.files.filter(item => !item.step);

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    if (event.key in keys) {
      event.preventDefault();
      const next = (index + keys[event.key] + blueprint.files.length) % blueprint.files.length;
      setActivePath(blueprint.files[next].path);
      tabRefs.current[next]?.focus();
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const next = event.key === "Home" ? 0 : blueprint.files.length - 1;
      setActivePath(blueprint.files[next].path);
      tabRefs.current[next]?.focus();
    }
  }

  return (
    <section className={styles.section} aria-labelledby="agent-blueprint-title">
      <header className={styles.header}>
        <div>
          <h2 id="agent-blueprint-title" className={styles.title}>
            <Workflow size={18} aria-hidden="true" />
            Build an agent with these APIs
          </h2>
          <p className={styles.subtitle}>
            A complete, runnable project built in five steps. Each step adds one file, every line carries a short note, and
            the identifiers it uses link back to this reference.
          </p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.modes} role="group" aria-label="Agent architecture">
            <button type="button" aria-pressed={mode === "single"} onClick={() => selectMode("single")}>
              <Bot size={14} aria-hidden="true" /> Single agent
            </button>
            <button type="button" aria-pressed={mode === "multi"} onClick={() => selectMode("multi")}>
              <Users size={14} aria-hidden="true" /> Multi-agent
            </button>
          </div>
          <Link href="/dashboard/workflow" className={styles.guidesLink}>
            Full build guides <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <div className={styles.layout}>
        <ol className={styles.steps} aria-label="Build steps">
          {blueprint.steps.map(step => {
            const active = activeStep?.num === step.num;
            return (
              <li key={step.num} className={styles.step} data-active={active || undefined}>
                <button
                  type="button"
                  className={styles.stepButton}
                  aria-expanded={active}
                  aria-controls={`blueprint-step-${mode}-${step.num}`}
                  onClick={() => setActivePath(step.file)}
                >
                  <span className={styles.stepNumber} aria-hidden="true">
                    {step.num}
                  </span>
                  <span className={styles.stepTitles}>
                    <span className={styles.stepTitle}>{step.title}</span>
                    <span className={styles.stepMeta}>
                      {step.tech} · <code>{step.file}</code>
                    </span>
                  </span>
                  <ChevronDown size={15} aria-hidden="true" className={styles.stepChevron} />
                </button>
                <div id={`blueprint-step-${mode}-${step.num}`} className={styles.stepBody} hidden={!active}>
                  <p>{step.desc}</p>
                  <div className={styles.apis}>
                    <span>APIs in this step</span>
                    {step.apis.map(api =>
                      inCatalog(api.pkg, api.name) ? (
                        <Link key={api.name} href={`/dashboard/api-docs/${api.pkg}/${api.name}`} className={styles.apiLink}>
                          {api.name}
                          <ArrowUpRight size={11} aria-hidden="true" />
                        </Link>
                      ) : (
                        <code key={api.name} className={styles.apiText}>
                          {api.name}
                        </code>
                      )
                    )}
                  </div>
                </div>
              </li>
            );
          })}
          <li className={styles.runCard}>
            <p>
              <Terminal size={14} aria-hidden="true" /> Run it
            </p>
            <code>pip install -r requirements.txt</code>
            <code>cp .env.example .env</code>
            <code>{blueprint.run}</code>
          </li>
        </ol>

        <div className={styles.ide}>
          <div className={styles.titleBar}>
            <span className={styles.lights} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className={styles.windowTitle}>
              {blueprint.folder} — {file.path}
            </span>
            <span className={styles.windowActions}>
              <button
                type="button"
                className={styles.chromeButton}
                aria-pressed={annotations}
                onClick={() => setAnnotations(value => !value)}
                title={annotations ? "Hide line notes" : "Show line notes"}
              >
                <MessageSquareText size={14} aria-hidden="true" />
                <span>Notes</span>
              </button>
              <CopyButton text={fileCode(file)} label={`Copy ${file.path}`} className={styles.chromeButton} />
            </span>
          </div>

          <div className={styles.workbench}>
            <nav className={styles.explorer} aria-label="Project files">
              <p className={styles.folder}>
                <ChevronDown size={13} aria-hidden="true" />
                <Folder size={14} aria-hidden="true" />
                {blueprint.folder}
              </p>
              <ul>
                {[...stepFiles, ...projectFiles].map(item => (
                  <li key={item.path}>
                    <button
                      type="button"
                      aria-current={item.path === file.path ? "true" : undefined}
                      onClick={() => setActivePath(item.path)}
                    >
                      <FileIcon path={item.path} />
                      <span className={styles.fileName}>{item.path}</span>
                      {item.step && <span className={styles.fileStep}>{item.step}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            <div className={styles.editorPane}>
              <div className={styles.tabs} role="tablist" aria-label="Open files">
                {blueprint.files.map((item, index) => (
                  <button
                    key={item.path}
                    ref={element => {
                      tabRefs.current[index] = element;
                    }}
                    type="button"
                    role="tab"
                    id={`blueprint-tab-${mode}-${index}`}
                    aria-selected={item.path === file.path}
                    aria-controls="blueprint-editor"
                    tabIndex={item.path === file.path ? 0 : -1}
                    className={styles.tab}
                    onClick={() => setActivePath(item.path)}
                    onKeyDown={event => onTabKey(event, index)}
                  >
                    <FileIcon path={item.path} size={13} />
                    {item.path}
                  </button>
                ))}
              </div>
              <div
                id="blueprint-editor"
                role="tabpanel"
                aria-labelledby={`blueprint-tab-${mode}-${blueprint.files.indexOf(file)}`}
                className={styles.editor}
              >
                <Editor key={`${mode}:${file.path}`} file={file} annotations={annotations} folder={blueprint.folder} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
