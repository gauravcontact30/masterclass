"use client";
import { useEffect, useRef, useState } from 'react';
import { SandpackProvider, SandpackLayout, SandpackFileExplorer, SandpackCodeEditor, SandpackPreview, SandpackConsole, useSandpack } from '@codesandbox/sandpack-react';
import type { LearningProject } from '@/lib/api-learning-schema';
import { isCodeExampleTab } from '@/lib/code-example-tabs';
import styles from './api-project.module.css';

/** Sandpack addresses every file by absolute path; a relative key silently fails to override the template. */
const absolute = (path: string) => '/' + path.replace(/^\/+/, '');
const hidden = (path: string) => !isCodeExampleTab(path);
const snapshot = (files: Record<string, { code: string }>) => Object.fromEntries(Object.entries(files).map(([path, file]) => [path, file.code]));
const sameCode = (a: Record<string, string>, b: Record<string, string>) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every(key => a[key] === b[key]);
};

function ActivePreview() {
  const {sandpack}=useSandpack();const started=useRef(false);const [error,setError]=useState('');
  useEffect(()=>{if(started.current)return;started.current=true;void sandpack.runSandpack().catch(()=>setError('Unable to start the runtime. Stop and try Run again.'));},[sandpack]);
  return <>{error&&<p role="alert">{error}</p>}<SandpackPreview showOpenInCodeSandbox={false} showOpenNewtab={false}/><h3>Console output</h3><SandpackConsole/></>;
}

function Workspace({project}:{project:LearningProject}) {
  const {sandpack} = useSandpack();
  const [explorer,setExplorer] = useState(true);
  const [running,setRunning] = useState(false);
  const [error,setError] = useState('');
  // Edits are held until Save, so the preview only ever shows code the learner chose to apply.
  const [applied,setApplied] = useState(() => snapshot(sandpack.files));
  const [justSaved,setJustSaved] = useState(false);
  const current = snapshot(sandpack.files);
  const dirty = !sameCode(current, applied);

  async function save() {
    setError(''); setApplied(current); setJustSaved(true);
    if (!running) { setRunning(true); return; }
    try { await sandpack.runSandpack(); } catch { setError('The runtime could not restart. Try Run again.'); }
  }
  async function run() {
    setError(''); setApplied(current);
    if (!running) { setRunning(true); return; }
    try { await sandpack.runSandpack(); } catch { setError('The runtime could not start. Check your connection and try Run again.'); }
  }
  function reset() { sandpack.resetAllFiles(); setApplied(snapshot(sandpack.files)); setJustSaved(false); }

  // Ctrl/Cmd+S is muscle memory in an editor; intercept it so the browser does not offer to save the page.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.key === 's' && (event.ctrlKey || event.metaKey))) return;
      const target = event.target as HTMLElement | null;
      if (!target?.closest?.(`.${styles.workspace}`)) return;
      event.preventDefault(); void save();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const status = error
    || (dirty ? 'Unsaved changes • press Save (or Ctrl+S) to apply them to the preview.'
      : justSaved && running ? 'Saved • the browser and console output below are running your latest code.'
      : justSaved ? 'Saved • press Run to see the result.'
      : running ? 'Live runtime • edit a file, then Save to rebuild. Stop closes the preview.'
      : 'Ready • edit a file, then press Run. Your edits stay in this page until you leave or reset.');

  return <div className={styles.workspace}>
    <div className={styles.bar}>
      <span className={styles.dots} aria-hidden="true"><i/><i/><i/></span>
      <strong>{project.title}</strong>
      {dirty && <span className={styles.unsaved}>Unsaved changes</span>}
      <button onClick={()=>setExplorer(!explorer)} aria-expanded={explorer}>{explorer?'Hide':'Show'} files</button>
      <button onClick={reset}>Reset</button>
      <button className={styles.save} data-dirty={dirty} disabled={!dirty} onClick={()=>void save()}>Save</button>
      <button onClick={()=>void run()}>Run</button>
      {running&&<button onClick={()=>setRunning(false)}>Stop</button>}
    </div>
    <SandpackLayout>
      {explorer&&<SandpackFileExplorer autoHiddenFiles={false}/>}
      <div className={styles.editor} style={{flex:1,minWidth:0}}>
        <div className={styles.tabs} role="tablist" aria-label="Code files">{project.files.filter(file=>!hidden(file.path)).map(file=><button key={file.path} role="tab" aria-selected={sandpack.activeFile===absolute(file.path)} onClick={()=>sandpack.setActiveFile(absolute(file.path))}>{file.path.split("/").at(-1)}</button>)}</div>
        <SandpackCodeEditor showRunButton={false} showTabs={false} showLineNumbers showInlineErrors/>
      </div>
    </SandpackLayout>
    <div className={styles.output}>
      <h3>Browser output</h3>
      {running?<ActivePreview/>:<p className={styles.console}>Click Run to start this project. Browser and console output appear here once the runtime starts.</p>}
    </div>
    <p className={styles.status} role="status">{status}</p>
    <ol className={styles.instructions}>{project.instructions.map(item=><li key={item}>{item}</li>)}</ol>
  </div>;
}

export default function BrowserProject({project}:{project:LearningProject}) {
  const template = project.template === 'python' || project.template === 'local' ? 'vanilla-ts' : project.template;
  return <SandpackProvider
    template={template}
    files={Object.fromEntries(project.files.map(file=>[absolute(file.path),file.code]))}
    customSetup={{dependencies:project.dependencies,entry:absolute(project.entry)}}
    theme={{colors:{surface1:'#ffffff',surface2:'#f5f6f8',surface3:'#e7ebf0',clickable:'#687080',base:'#30394b',disabled:'#adb2bd',hover:'#b4593e',accent:'#b4593e',error:'#bf3548',errorSurface:'#fff2f3'},syntax:{plain:'#30394b',comment:'#818a98',keyword:'#a33cad',tag:'#a33cad',punctuation:'#6e7686',definition:'#326ca6',property:'#326ca6',static:'#b66b1d',string:'#438454'},font:{body:'system-ui, sans-serif',mono:'ui-monospace, SFMono-Regular, Consolas, monospace',size:'13px',lineHeight:'22px'}}}
    options={{autorun:false,autoReload:false,activeFile:absolute(project.entry),visibleFiles:project.files.filter(file=>!hidden(file.path)).map(file=>absolute(file.path))}}>
    <Workspace project={project}/>
  </SandpackProvider>;
}
