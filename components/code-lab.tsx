"use client";

import { Textarea } from "@/components/ui/textarea";
import { memo, useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, Copy, Link2, ListTree, MessageSquareCode, Pencil, Play, RotateCcw, Square, Terminal, X } from "lucide-react";
import { highlightLines, type CodeLanguage } from "@/lib/code-highlight";
import { inferLanguage, languageLabel, runSupport } from "@/lib/code-run";
import { extractSymbols, urlAnatomy, type CodeSymbol, type SymbolKind } from "@/lib/code-explain";
import { codeLineNotes } from "@/lib/code-line-notes";
import { CodeLineComment } from "./code-line-comment";
import { runJavaScriptPuzzle, type PuzzleResult } from "@/lib/javascript-sandbox";
import { ExpandedText } from "./expanded-text";
import styles from "./code-lab.module.css";

type Props = {
  code: string;
  /** Omit to infer from the code itself; note sections arrive without one. */
  language?: CodeLanguage;
  title: string;
  /** Authored result, shown when the block cannot be executed in the browser. */
  expectedOutput?: string;
  /** One line on what the code demonstrates, shown above the editor. */
  explanation?: string;
  editable?: boolean;
};

const STATUS: Record<PuzzleResult["status"], { label: string; tone: string }> = {
  complete: { label: "Run complete", tone: "ok" },
  error: { label: "Run failed", tone: "error" },
  timeout: { label: "Stopped: 3-second time limit", tone: "warn" },
  stopped: { label: "Run stopped", tone: "warn" },
};

/** Reference entries are grouped in the order a reader wants to meet them. */
const KIND_ORDER: SymbolKind[] = [
  "directive",
  "package",
  "module",
  "hook",
  "function",
  "method",
  "class",
  "interface",
  "type",
  "property",
  "variable",
];
const KIND_LABEL: Record<SymbolKind, string> = {
  directive: "Directives",
  package: "Packages",
  module: "Modules",
  hook: "Hooks",
  function: "Functions",
  method: "Methods",
  class: "Classes & components",
  interface: "Interfaces",
  type: "Types",
  property: "Properties",
  variable: "Variables",
};

const commentPrefix = (language: CodeLanguage) =>
  ["python", "yaml", "bash", "dockerfile", "hcl"].includes(language) ? "#" : "//";

function CodeLabView({ code, language, title, expectedOutput, explanation, editable = true }: Props) {
  const id = useId();
  const original = code.trim();
  const [draft, setDraft] = useState(original);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState("code");
  const [output, setOutput] = useState<string[]>([]);
  const [result, setResult] = useState<PuzzleResult | null>(null);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const stopRun = useRef<(() => void) | null>(null);

  useEffect(() => () => stopRun.current?.(), []);

  const resolved = language ?? inferLanguage(original);
  const support = runSupport(draft, resolved);
  const dirty = draft.trim() !== original;
  const lines = highlightLines(draft, resolved);
  const notes = useMemo(() => codeLineNotes(draft, "", resolved), [draft, resolved]);
  const symbols = useMemo(() => extractSymbols(draft, resolved), [draft, resolved]);
  const anatomy = useMemo(() => urlAnatomy(draft), [draft]);

  const tabs = [
    { id: "code", label: "Code", icon: Terminal },
    ...(notes.some(Boolean) ? [{ id: "explained", label: "Explained", icon: MessageSquareCode }] : []),
    ...(symbols.length ? [{ id: "reference", label: "Reference", icon: ListTree }] : []),
    ...(anatomy ? [{ id: "url", label: "URL", icon: Link2 }] : []),
  ];
  // Editing always happens against the source, never a derived view.
  const active = editing ? "code" : tabs.some(item => item.id === tab) ? tab : "code";

  function run() {
    if (running || !support.runnable) return;
    setOutput([]);
    setResult(null);
    setRunning(true);
    stopRun.current = runJavaScriptPuzzle(
      draft,
      line => setOutput(previous => [...previous, line]),
      finished => {
        setResult(finished);
        setOutput(finished.output);
        setRunning(false);
        stopRun.current = null;
      },
    );
  }

  function reset() {
    stopRun.current?.();
    setDraft(original);
    setOutput([]);
    setResult(null);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const grouped = KIND_ORDER.map(kind => ({ kind, items: symbols.filter(symbol => symbol.kind === kind) })).filter(
    group => group.items.length,
  );

  return (
    <div className={styles.lab} role="group" aria-labelledby={`${id}-title`}>
      {explanation && (
        <p className={styles.explanation}>
          <ExpandedText text={explanation} />
        </p>
      )}

      <div className={styles.chrome}>
        <span className={styles.dots} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className={styles.title} id={`${id}-title`}>
          <ExpandedText text={title} />
        </span>
        <span className={styles.badge} aria-label={`Language: ${languageLabel(resolved)}`}>
          {languageLabel(resolved)}
        </span>
        <span className={styles.actions}>
          {editable && (
            <button
              type="button"
              onClick={() => setEditing(value => !value)}
              aria-pressed={editing}
              aria-label={`${editing ? "Finish editing" : "Edit"} ${title} code`}
            >
              {editing ? <X size={13} /> : <Pencil size={13} />}
              <span>{editing ? "Done" : "Edit"}</span>
            </button>
          )}
          {dirty && (
            <button type="button" onClick={reset} aria-label={`Reset ${title} code`}>
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
          {support.runnable &&
            (running ? (
              <button
                type="button"
                className={styles.stop}
                onClick={() => stopRun.current?.()}
                aria-label={`Stop running ${title}`}
              >
                <Square size={13} />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                className={styles.run}
                onClick={run}
                aria-label={`${result ? "Re-run" : "Run"} ${title}`}
              >
                <Play size={13} />
                <span>{result ? "Re-run" : "Run"}</span>
              </button>
            ))}
          <button type="button" onClick={() => void copy()} aria-label={`Copy ${title} code`}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </span>
      </div>

      {tabs.length > 1 && !editing && (
        <div className={styles.tabs} role="tablist" aria-label={`${title} views`}>
          {tabs.map(({ id: value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={active === value}
              aria-controls={`${id}-panel`}
              onClick={() => setTab(value)}
            >
              <Icon size={12} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.body} id={`${id}-panel`} role={tabs.length > 1 ? "tabpanel" : undefined}>
        {editing ? (
          <Textarea
            className={styles.editor}
            value={draft}
            onChange={event => setDraft(event.target.value)}
            spellCheck={false}
            rows={Math.min(24, Math.max(6, lines.length + 1))}
            maxLength={12000}
            aria-label={`Edit ${title}`}
            disabled={running}
          />
        ) : active === "code" ? (
          <pre className={styles.code} tabIndex={0} aria-label={`${title} code`}>
            <code>
              {lines.map((line, index) => (
                <span className={styles.line} key={index}>
                  <span className={styles.gutter} aria-hidden="true">
                    {index + 1}
                  </span>
                  <span className={styles.lineText}>
                    {line.map((token, position) => (
                      <span key={position} data-token={token.tone || undefined}>
                        {token.text}
                      </span>
                    ))}
                    {"\n"}
                    <CodeLineComment note={notes[index]} />
                  </span>
                </span>
              ))}
            </code>
          </pre>
        ) : active === "explained" ? (
          <pre className={`${styles.code} ${styles.explained}`} tabIndex={0} aria-label={`${title} explained line by line`}>
            <code>
              {lines.map((line, index) => (
                <span key={index}>
                  <span className={styles.line}>
                    <span className={styles.gutter} aria-hidden="true">
                      {index + 1}
                    </span>
                    <span className={styles.lineText}>
                      {line.map((token, position) => (
                        <span key={position} data-token={token.tone || undefined}>
                          {token.text}
                        </span>
                      ))}
                      {"\n"}
                    </span>
                  </span>
                  {notes[index] && (
                    <span className={styles.line}>
                      <span className={styles.gutter} aria-hidden="true" />
                      <span className={styles.lineNote} data-token="comment">
                        {commentPrefix(resolved)} {notes[index]}
                        {"\n"}
                      </span>
                    </span>
                  )}
                </span>
              ))}
            </code>
          </pre>
        ) : active === "reference" ? (
          <div className={styles.reference}>
            {grouped.map(group => (
              <section key={group.kind}>
                <h5>{KIND_LABEL[group.kind]}</h5>
                <dl>
                  {group.items.map(symbol => (
                    <div key={symbol.name}>
                      <dt>
                        <code>{symbol.name}</code>
                      </dt>
                      <dd>
                        <ExpandedText text={symbol.detail} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        ) : (
          anatomy && (
            <div className={styles.url}>
              <p className={styles.urlIntro}>
                One worked request against this code. The keys come from the snippet; the values are an example, since a
                snippet carries no real request.
              </p>
              <dl>
                <div>
                  <dt>Route</dt>
                  <dd>
                    <code>{anatomy.route}</code>
                  </dd>
                </div>
                <div>
                  <dt>URL</dt>
                  <dd>
                    <code>{anatomy.url}</code>
                  </dd>
                </div>
                <div>
                  <dt>Pathname</dt>
                  <dd>
                    <code>{anatomy.pathname}</code>
                    <small>usePathname()</small>
                  </dd>
                </div>
                <div>
                  <dt>SearchParams</dt>
                  <dd>
                    {anatomy.searchParams.length ? (
                      anatomy.searchParams.map(item => (
                        <code key={item.key}>
                          {item.key} = {item.value}
                        </code>
                      ))
                    ) : (
                      <span>None — this URL has no query string.</span>
                    )}
                    <small>useSearchParams()</small>
                  </dd>
                </div>
                <div>
                  <dt>Params</dt>
                  <dd>
                    {anatomy.params.length ? (
                      anatomy.params.map(item => (
                        <code key={item.key}>
                          {item.key} = {item.value}
                        </code>
                      ))
                    ) : (
                      <span>None — this route has no dynamic segments.</span>
                    )}
                    <small>useParams()</small>
                  </dd>
                </div>
              </dl>
            </div>
          )
        )}
      </div>

      {!support.runnable && <p className={styles.explanation}>{support.reason}</p>}
      {support.runnable ? (
        <div className={styles.console} data-tone={result ? STATUS[result.status].tone : undefined}>
          <span className={styles.consoleBar}>
            <Terminal size={12} aria-hidden="true" />
            <span>CONSOLE</span>
            <span role="status" className={styles.consoleStatus}>
              {running ? "Running…" : result ? STATUS[result.status].label : "Not run yet"}
            </span>
          </span>
          <pre className={styles.consoleOut}>
            {output.join("\n") ||
              (result
                ? "No console output. Use console.log() to inspect a value."
                : "Press Run to execute this code and see its real output.")}
          </pre>
        </div>
      ) : expectedOutput ? (
        <div className={styles.expected}>
          <span className={styles.expectedBar}>
            <Check size={12} aria-hidden="true" />
            <span>EXPECTED RESULT</span>
          </span>
          <pre className={styles.expectedOut}>{expectedOutput}</pre>
        </div>
      ) : null}
    </div>
  );
}

/** Props are plain strings, so a parent re-render need not re-tokenise the source. */
/**
 * A new `code` prop is a different snippet, so the lab starts over: the draft,
 * the open tab and the last run all belong to the snippet that produced them.
 * Keying on the snippet says that in one line, where an Effect that reset five
 * pieces of state would run after the wrong ones had already rendered.
 */
const KeyedCodeLab = (props: Props) => <CodeLabView key={props.code.trim()} {...props} />;
export const CodeLab = memo(KeyedCodeLab);
export type { CodeSymbol };
