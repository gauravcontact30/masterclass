import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--remote-debugging-port=9448',`--user-data-dir=${resolve('.next-perf-audit/notepad-profile')}`,'--no-first-run','about:blank'],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));let ws;
try{
 let targets;for(let n=0;n<40;n++){try{targets=await(await fetch('http://localhost:9448/json')).json();break;}catch{await delay(250);}}
 ws=new WebSocket(targets.find(x=>x.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let id=0;const waiting=new Map();
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){waiting.get(m.id)?.(m.result);waiting.delete(m.id);}};
 const send=(method,params={})=>new Promise(r=>{const n=++id;waiting.set(n,r);ws.send(JSON.stringify({id:n,method,params}));});
 await send('Page.enable');const {frameTree}=await send('Page.getFrameTree');
 const css=await readFile('components/super-admin-notepad.module.css','utf8');
 for(const width of [390,768,1280,1920]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  const content=`<h1>Deep Agents</h1><p>A supervisor architecture with specialist subagents.</p><pre>${'long_code_identifier_'.repeat(70)}</pre><p><code style="white-space:nowrap">${'very_long_inline_code_'.repeat(45)}</code></p><table><tr>${'<td>LongContentWithoutSpaces</td>'.repeat(6)}</tr></table>`;
  await send('Page.setDocumentContent',{frameId:frameTree.frame.id,html:`<!doctype html><style>*{box-sizing:border-box}body{margin:0;padding:20px}${css}</style><section class="notepad"><div class="canvas"><div class="paper" contenteditable>${content}</div></div></section>`});
  const result=await send('Runtime.evaluate',{expression:`(()=>{const c=document.querySelector('.canvas');return {width:${width},client:c.clientWidth,scroll:c.scrollWidth,document:document.documentElement.scrollWidth};})()`,returnByValue:true});
  const data=result.result.value;console.log(JSON.stringify(data));if(data.scroll>data.client+1)throw new Error('Horizontal overflow at '+width);
 }
 await send('Browser.close');
}finally{ws?.close();chrome.kill();}
