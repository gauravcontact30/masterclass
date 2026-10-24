import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const origin = process.argv[2] ?? 'http://localhost:3107';
const port = 9447;
const delay = ms => new Promise(r => setTimeout(r, ms));
await mkdir('artifacts', { recursive: true });
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${resolve('.next-perf-audit/chrome-profile')}`, '--no-first-run', '--no-default-browser-check', 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let ws;
try {
 let targets;
 for(let n=0;n<40;n++){try{targets=await (await fetch(`http://127.0.0.1:${port}/json`)).json();break;}catch{await delay(250);}}
 if(!targets) throw new Error('Chrome did not start');
 ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
 let id=0;const pending=new Map();
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const {ok,bad,timer}=pending.get(m.id);clearTimeout(timer);pending.delete(m.id);if(m.error) bad(new Error(m.error.message)); else ok(m.result);}};
 const send=(method,params={})=>new Promise((ok,bad)=>{const n=++id;const timer=setTimeout(()=>{pending.delete(n);bad(new Error('Timeout: '+method));},30000);pending.set(n,{ok,bad,timer});ws.send(JSON.stringify({id:n,method,params}));});
 const evaluate=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result?.value;
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__perf={lcp:0,events:[],longTasks:[]};new PerformanceObserver(l=>{for(const e of l.getEntries())window.__perf.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(l=>{for(const e of l.getEntries())if(e.interactionId)window.__perf.events.push({name:e.name,duration:e.duration});}).observe({type:'event',buffered:true,durationThreshold:16});new PerformanceObserver(l=>{for(const e of l.getEntries())window.__perf.longTasks.push(e.duration);}).observe({type:'longtask',buffered:true});`});
 if(process.env.PERF_CONTAIN_PREVIEW === '1') await send('Page.addScriptToEvaluateOnNewDocument',{source:`document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent='main#main-content > section:not(:first-of-type){content-visibility:auto;contain-intrinsic-size:auto 900px}';document.head.append(s);});`});
 const results=[];
 for(const profile of [{name:'desktop',width:1440,height:900,mobile:false,scale:1,cpu:1},{name:'mobile',width:390,height:844,mobile:true,scale:2,cpu:4}]){
  await send('Emulation.setDeviceMetricsOverride',{width:profile.width,height:profile.height,deviceScaleFactor:profile.scale,mobile:profile.mobile});
  await send('Emulation.setCPUThrottlingRate',{rate:profile.cpu});
  // Localhost transport, no network emulation: results are diagnostic, not field measurements.
  for(let run=1;run<=Number(process.env.PERF_RUNS ?? 3);run++){
   await send('Network.clearBrowserCache');await send('Page.navigate',{url:origin});await delay(8000);
   const point=await evaluate(`(()=>{const b=document.querySelector('button[aria-label="Next slide"]');if(!b)return null;const r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
   if(point){for(let k=0;k<3;k++){await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});await delay(300);}}
   const data=await evaluate(`({...window.__perf,ttfb:performance.getEntriesByType('navigation')[0]?.responseStart,resources:performance.getEntriesByType('resource').length,path:location.pathname})`);
   results.push({profile:profile.name,run,...data});console.log(JSON.stringify(results.at(-1)));
  }
 }
 await writeFile(process.env.PERF_CONTAIN_PREVIEW === '1' ? 'artifacts/performance-containment-preview.json' : 'artifacts/performance-audit.json',JSON.stringify({at:new Date().toISOString(),origin,conditions:'Local production build; cold browser cache; localhost network; desktop native CPU, mobile 4x CPU slowdown; three hero next clicks. Event duration is not field INP.',results},null,2));
 await send('Browser.close');
} finally { ws?.close();chrome.kill(); }
