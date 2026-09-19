"use client";
import { ExpandedText } from "@/components/expanded-text";


import { useEffect, useId, useRef, useState } from "react";
import { Check, Code2, Copy, FileCode2, Folder, FolderOpen, Play, Square, Terminal } from "lucide-react";
import type { ApiReference, CodeExample, ExampleFile } from "@/lib/domain";
import { highlightLines } from "@/lib/code-highlight";
import { CodeLab } from "./code-lab";
import { runSupport } from "@/lib/code-run";
import { runJavaScriptPuzzle, type PuzzleResult } from "@/lib/javascript-sandbox";
import styles from "./lesson-code-examples.module.css";

/** React escapes every token; lesson text is never inserted as HTML. */
function Highlight({ code, language }: { code: string; language: ExampleFile["language"] }) {
  return <pre className={styles.code}><code>{highlightLines(code, language).map((line, index) => <span className={styles.line} key={index}><span className={styles.lineNumber} aria-hidden="true">{index + 1}</span><span>{line.map((token, position) => <span key={position} data-token={token.tone || undefined}>{token.text}</span>)}{"\n"}</span></span>)}</code></pre>;
}

function FileTree({ files, active, onSelect, prefix = "" }: { files: ExampleFile[]; active: string; onSelect: (path: string) => void; prefix?: string }) {
  const entries = [...new Set(files.filter(file => file.path.startsWith(prefix)).map(file => file.path.slice(prefix.length).split("/")[0]))];
  return <ul className={styles.tree}>{entries.map(entry => {
    const path = prefix + entry;
    const file = files.find(item => item.path === path);
    return <li key={path}>{file ? <button type="button" title={path} aria-label={path} aria-pressed={active === path} onClick={() => onSelect(path)}><FileCode2 size={14} aria-hidden="true" /><span><ExpandedText text={entry} /></span></button> : <details open><summary><Folder size={14} aria-hidden="true" /><span><ExpandedText text={entry} /></span></summary><FileTree files={files} active={active} onSelect={onSelect} prefix={`${path}/`} /></details>}</li>;
  })}</ul>;
}

export function CodeApiReference({ references, hi }: { references: ApiReference[]; hi: boolean }) {
  return <div className={styles.references}>{references.map((api, index) => <details key={`${api.name}-${index}`} open={index === 0}>
    <summary><code>{api.name}</code><span><ExpandedText text={api.kind} /></span></summary>
    <CodeLab title={api.name} code={api.signature} explanation={api.returns} editable={false} />
    {api.params.length > 0 && <div className={styles.tableScroll}><table><caption><ExpandedText text={hi ? "पैरामीटर, आर्ग्युमेंट और प्रॉपर्टी" : "Parameters, arguments & properties"} /></caption><thead><tr><th><ExpandedText text={hi ? "नाम" : "Name"} /></th><th><ExpandedText text={hi ? "प्रकार" : "Type"} /></th><th><ExpandedText text={hi ? "उपयोग" : "How to use it"} /></th></tr></thead><tbody>{api.params.map(param => <tr key={param.name}><td><code>{param.name}</code></td><td><code>{param.type}</code></td><td><ExpandedText text={param.description} /></td></tr>)}</tbody></table></div>}
    <p><strong><ExpandedText text={hi ? "रिटर्न प्रकार और मान" : "Return type & value"} />: </strong><ExpandedText text={api.returns} /></p>
    {api.notes && <p><ExpandedText text={api.notes} /></p>}
  </details>)}</div>;
}

/**
 * Most project files import a sibling, so they only run once the reader follows
 * "Set up & run". A self-contained file can be executed here, and what appears
 * below is then genuinely this file's output rather than an authored one.
 */
function RunPanel({ file, hi }: { file: ExampleFile; hi: boolean }) {
  const [output, setOutput] = useState<string[]>([]);
  const [result, setResult] = useState<PuzzleResult | null>(null);
  const [running, setRunning] = useState(false);
  const stop = useRef<(() => void) | null>(null);
  useEffect(() => {
    stop.current?.();
    setOutput([]);
    setResult(null);
  }, [file.path]);
  useEffect(() => () => stop.current?.(), []);
  if (!runSupport(file.code, file.language).runnable) return null;
  const start = () => {
    setOutput([]);
    setResult(null);
    setRunning(true);
    stop.current = runJavaScriptPuzzle(file.code, line => setOutput(previous => [...previous, line]), finished => {
      setResult(finished);
      setOutput(finished.output);
      setRunning(false);
      stop.current = null;
    });
  };
  return <div className={styles.runPanel}>
    <div className={styles.runBar}>
      <Terminal size={13} aria-hidden="true" />
      <span>{hi ? "इस फ़ाइल को चलाएँ" : "RUN THIS FILE"}</span>
      {running
        ? <button type="button" onClick={() => stop.current?.()} aria-label={`Stop running ${file.path}`}><Square size={12} />{hi ? "रोकें" : "Stop"}</button>
        : <button type="button" onClick={start} aria-label={`${result ? "Re-run" : "Run"} ${file.path}`}><Play size={12} />{result ? hi ? "फिर चलाएँ" : "Re-run" : hi ? "चलाएँ" : "Run"}</button>}
    </div>
    <pre role="status">{running ? "…" : output.join("\n") || (hi ? "चलाने पर वास्तविक आउटपुट यहाँ दिखेगा।" : "Press Run to execute this file and see its real output.")}</pre>
  </div>;
}

function ExampleWorkspace({ example, hi, id }: { example: CodeExample; hi: boolean; id: string }) {
  const [path, setPath] = useState(() => example.files.find(file => /^(src|hooks|stores|lib|components)\//.test(file.path))?.path ?? example.files[0].path);
  const [copyStatus, setCopyStatus] = useState("");
  const file = example.files.find(item => item.path === path) ?? example.files[0];
  async function copy() {
    try { await navigator.clipboard.writeText(file.code); setCopyStatus(hi ? "कॉपी हुआ" : "Copied"); }
    catch { setCopyStatus(hi ? "कॉपी नहीं हुआ। कोड चुनकर कॉपी करें।" : "Copy failed. Select the code to copy it."); }
  }
  function selectFile(value: string) { setPath(value); setCopyStatus(""); }
  return <div id={id}>
    <div className={styles.intro}><h4><ExpandedText text={example.title} /></h4><p><ExpandedText text={example.description} /></p></div>
    <div className={styles.editor}>
      <div className={styles.chrome}><span className={styles.lights} aria-hidden="true"><i /><i /><i /></span><span><Code2 size={14} aria-hidden="true" /><ExpandedText text={hi ? "कोड कार्यक्षेत्र" : "Code workspace"} /></span><span>{example.files.length} <ExpandedText text={hi ? "फ़ाइलें" : "files"} /></span></div>
      <div className={styles.workspace}>
        <aside className={styles.explorer} aria-label={hi ? "प्रोजेक्ट फ़ाइलें" : "Project files"}><div className={styles.explorerTitle}><FolderOpen size={14} aria-hidden="true" /><ExpandedText text={hi ? "प्रोजेक्ट" : "PROJECT"} /></div><FileTree files={example.files} active={file.path} onSelect={selectFile} /></aside>
        <div className={styles.source}>
          <div className={styles.fileTabs} role="tablist" aria-label={hi ? "इस उदाहरण की फ़ाइलें" : "Files in this example"}>
            {example.files.map(item => <button key={item.path} type="button" role="tab" aria-selected={item.path === file.path} title={`project/${item.path}`} onClick={() => selectFile(item.path)}>
              <FileCode2 size={13} aria-hidden="true" /><span>{item.path.split("/").pop()}</span>
            </button>)}
          </div>
          <div className={styles.fileBar}><span title={`project/${file.path}`} className={styles.filePath}><FileCode2 size={14} aria-hidden="true" />project/<ExpandedText text={file.path} /></span><button type="button" title={hi ? "फ़ाइल कॉपी करें" : "Copy file"} aria-label={hi ? "फ़ाइल कॉपी करें" : "Copy file"} onClick={() => void copy()}>{copyStatus === "Copied" || copyStatus === "कॉपी हुआ" ? <Check size={15} /> : <Copy size={15} />}</button></div>
          <p className={styles.fileDescription}><ExpandedText text={file.description} /></p>
          <div className={styles.codeScroll} tabIndex={0} role="region" aria-label={`${hi ? "कोड" : "Code"}: ${file.path}`}><Highlight code={file.code} language={file.language} /></div>
          <div className={styles.statusBar}><span><ExpandedText text={file.language} /> · UTF-8</span><span role="status"><ExpandedText text={copyStatus} /></span><span>{file.code.split("\n").length} <ExpandedText text={hi ? "पंक्तियाँ" : "lines"} /></span></div>
          <RunPanel file={file} hi={hi} />
        </div>
      </div>
    </div>
    {example.completeness === "snippet" && <p className={styles.excerptNote}><ExpandedText text={hi ? "पाठ का कोड अंश · आवश्यक सेटअप के लिए पाठ और API संदर्भ देखें।" : "Lesson excerpt · See the lesson and API reference for the surrounding setup."} /></p>}
    {example.setup.length > 0 && <details className={styles.run} open><summary><Terminal size={15} aria-hidden="true" /><ExpandedText text={hi ? "सेटअप और चलाने के चरण" : "Set up & run"} /></summary><ol>{example.setup.map((step, index) => <li key={index}><ExpandedText text={step} /></li>)}</ol></details>}
    {example.expectedOutput && <div className={styles.result}><span><Check size={14} aria-hidden="true" /><ExpandedText text={hi ? "अपेक्षित परिणाम" : "Expected result"} /></span><pre>{example.expectedOutput}</pre></div>}
    {example.apiReference?.length ? <CodeApiReference references={example.apiReference} hi={hi} /> : null}
  </div>;
}

export function LessonCodeExamples({ examples, hi }: { examples: CodeExample[]; hi: boolean }) {
  const id = useId();
  if (!examples.length) return null;
  return <section className={styles.examples} aria-label={hi ? "कोड उदाहरण" : "Code examples"}>
    <div className={styles.exampleHeading}><span><ExpandedText text={hi ? "कोड से सीखें" : "LEARN BY BUILDING"} /></span><span><ExpandedText text={String(examples.length).padStart(2, "0")} /> <ExpandedText text={hi ? "उदाहरण" : "examples"} /></span></div>
    {examples.map((example, index) => <details className={styles.exampleAccordion} key={`${example.kind}-${index}`} open={index === 0}>
      <summary>
        <span className={styles.exampleIndex} aria-hidden="true"><ExpandedText text={String(index + 1).padStart(2, "0")} /></span>
        <span className={styles.exampleSummary}>
          <span className={styles.exampleKind}><ExpandedText text={example.kind === "concept" ? hi ? "मूल अवधारणा" : "Core concept" : hi ? "व्यावहारिक उदाहरण" : "Applied example"} /></span>
          <span className={styles.exampleTitle}><ExpandedText text={example.title} /></span>
        </span>
        <span className={styles.exampleFiles} aria-hidden="true">{example.files.length} <ExpandedText text={hi ? "फ़ाइलें" : example.files.length === 1 ? "file" : "files"} /></span>
      </summary>
      <ExampleWorkspace example={example} hi={hi} id={`${id}-workspace-${index}`} />
    </details>)}
  </section>;
}
