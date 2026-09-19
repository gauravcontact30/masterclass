import type { LearningProject } from './api-learning-schema';
/** Opaque-origin frame + disposable worker: Python never runs in the app or on its server. */
export function runPythonProject(project: LearningProject, onLine:(line:string)=>void, onDone:()=>void) {
  const token = crypto.randomUUID();
  const frame = document.createElement('iframe'); frame.hidden = true; frame.setAttribute('sandbox','allow-scripts');
  let timer: ReturnType<typeof setTimeout>; let closed = false;
  function stop() { if (closed) return; closed=true; clearTimeout(timer); window.removeEventListener('message',receive); frame.remove(); onDone(); }
  function watchdog(ms:number) { clearTimeout(timer); timer=setTimeout(()=>{onLine('Execution stopped: time limit exceeded.');stop();},ms); }
  function receive(event:MessageEvent) {
    if (event.source !== frame.contentWindow || event.data?.token !== token) return;
    if (event.data.type === 'ready') frame.contentWindow?.postMessage({token,project},'*');
    if (event.data.type === 'running') { onLine('Running Python…');watchdog(10000); }
    if (event.data.type === 'line') onLine(String(event.data.line).slice(0,4000));
    if (event.data.type === 'done') stop();
  }
  const worker = `self.onmessage=async({data:project})=>{let count=0;const line=text=>{if(count++<100)postMessage({type:'line',line:String(text).slice(0,4000)});};
try{const {loadPyodide}=await import('https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.mjs');const py=await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/',stdout:line,stderr:line});
for(const file of project.files){const path='/workspace/'+file.path.replace(/^\\//,'');py.FS.mkdirTree(path.slice(0,path.lastIndexOf('/')));py.FS.writeFile(path,file.code);}
py.FS.chdir('/workspace');await py.runPythonAsync('import sys\\nsys.path.insert(0, "/workspace")');
await py.loadPackagesFromImports(project.files.filter(f=>f.path.endsWith('.py')).map(f=>f.code).join('\\n'));
postMessage({type:'running'});await py.runPythonAsync(py.FS.readFile('/workspace/'+project.entry.replace(/^\\//,''),{encoding:'utf8'}));
line('Finished.');}catch(error){line(String(error));}finally{postMessage({type:'done'});close();}};`;
  const script = `const token=${JSON.stringify(token)};const worker=new Worker(URL.createObjectURL(new Blob([${JSON.stringify(worker)}],{type:'text/javascript'})),{type:'module'});worker.onmessage=e=>parent.postMessage({...e.data,token},'*');worker.onerror=error=>{parent.postMessage({token,type:'line',line:'Python runtime could not load: '+(error.message||'Check your connection or run the project locally.')},'*');parent.postMessage({token,type:'done'},'*');};onmessage=e=>{if(e.source===parent&&e.data?.token===token)worker.postMessage(e.data.project);};parent.postMessage({token,type:'ready'},'*');`;
  frame.srcdoc = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob: https://cdn.jsdelivr.net; worker-src blob:; connect-src https://cdn.jsdelivr.net;"><script>${script.replaceAll('</script','<\\/script')}</script>`;
  window.addEventListener('message',receive);document.body.appendChild(frame);watchdog(90000);
  return stop;
}
