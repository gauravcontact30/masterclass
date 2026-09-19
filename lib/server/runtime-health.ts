import 'server-only';
import {cpus,freemem,totalmem} from 'node:os';
import {statfs} from 'node:fs/promises';
let previous:{time:number;cpu:number}|null=null;
export async function runtimeHealth(){
  const time=performance.now(),usage=process.cpuUsage(),cpu=usage.user+usage.system;
  const cpuPercent=previous&&time>previous.time?Math.max(0,(cpu-previous.cpu)/((time-previous.time)*1000)*100):null;
  previous={time,cpu};
  let storage:{total:number;available:number}|null=null;
  try{const fs=await statfs(process.cwd());storage={total:fs.blocks*fs.bsize,available:fs.bavail*fs.bsize};}catch{}
  return {processUptime:Math.round(process.uptime()),processMemory:process.memoryUsage().rss,heapUsed:process.memoryUsage().heapUsed,hostMemory:totalmem(),hostUsedMemory:totalmem()-freemem(),cpuCores:cpus().length,cpuSeconds:cpu/1e6,cpuPercent,storage,bandwidth:null,environment:process.env.NODE_ENV,nodeVersion:process.version};
}
