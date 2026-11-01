"use client";
import { useEffect, useRef, useState } from 'react';
import { SandpackProvider, SandpackLayout, SandpackFileExplorer, SandpackCodeEditor, SandpackPreview, SandpackConsole, useSandpack } from '@codesandbox/sandpack-react';
import type { LearningProject } from '@/lib/api-learning-schema';
import { Play } from 'lucide-react';
import styles from './api-project.module.css';

/** Sandpack addresses every file by absolute path; a relative key silently fails to override the template. */
const absolute = (path: string) => '/' + path.replace(/^\/+/, '');
const snapshot = (files: Record<string, { code: string }>) => Object.fromEntries(Object.entries(files).map(([path, file]) => [path, file.code]));
const sameCode = (a: Record<string, string>, b: Record<string, string>) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every(key => a[key] === b[key]);
};

function ActivePreview() {
  const {sandpack}=useSandpack();const started=useRef(false);const [error,setError]=useState('');
  useEffect(()=>{if(started.current)return;started.current=true;void sandpack.runSandpack().catch(()=>setError('Unable to start the runtime. Stop and try Run again.'));},[sandpack]);
  return <>{error&&<p role="alert">{error}</p>}<SandpackPreview showOpenInCodeSandbox={false} showOpenNewtab={false}/><h3>Console</h3><SandpackConsole/></>;
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
      <button className={styles.filesToggle} onClick={()=>setExplorer(!explorer)} aria-expanded={explorer}>{explorer?'Hide':'Show'} files</button>
      <button onClick={reset}>Reset</button>
      <button className={styles.save} data-dirty={dirty} disabled={!dirty} onClick={()=>void save()}>Save</button>
      <button className={styles.run} onClick={()=>void run()}><Play size={12} aria-hidden="true"/>{running?'Run again':'Run'}</button>
      {running&&<button onClick={()=>setRunning(false)}>Stop</button>}
    </div>
    <SandpackLayout>
      {explorer&&<SandpackFileExplorer className={styles.filesPane} autoHiddenFiles={false}/>}
      <div className={styles.editor} style={{flex:1,minWidth:0}}>
        <div className={styles.tabs} role="tablist" aria-label="Code files">{project.files.map(file=><button key={file.path} role="tab" aria-selected={sandpack.activeFile===absolute(file.path)} onClick={()=>sandpack.setActiveFile(absolute(file.path))}>{file.path.split("/").at(-1)}</button>)}</div>
        <SandpackCodeEditor showRunButton={false} showTabs={false} showLineNumbers showInlineErrors/>
      </div>
    </SandpackLayout>
    <div className={styles.output}>
      <h3>Output</h3>
      {running?<ActivePreview/>:<p className={styles.console}>Press Run to execute this code and see its real output here.</p>}
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
    // A framework template's own index mounts the app; pointing the entry at App.tsx rendered nothing.
    customSetup={{dependencies:project.dependencies,...(template==='vanilla-ts'?{entry:absolute(project.entry)}:{})}}
    theme={{colors:{surface1:'#ffffff',surface2:'#f5f5f7',surface3:'#e8e8ed',clickable:'#6e6e73',base:'#1d1d1f',disabled:'#aeaeb2',hover:'#0071e3',accent:'#0071e3',error:'#c41a16',errorSurface:'#fff2f1'},syntax:{plain:'#1d1d1f',comment:'#5d6c79',keyword:'#9b2393',tag:'#9b2393',punctuation:'#424245',definition:'#0b4f79',property:'#326d74',static:'#1c00cf',string:'#c41a16'},font:{body:'-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',mono:'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',size:'13px',lineHeight:'22px'}}}
    options={{autorun:false,autoReload:false,activeFile:absolute(project.entry),visibleFiles:project.files.map(file=>absolute(file.path))}}>
    <Workspace project={project}/>
  </SandpackProvider>;
}
