import 'server-only';
import {createHash} from 'node:crypto';
import {z} from 'zod';
const recordSchema=z.object({id:z.string().max(200),projectId:z.string().max(200),timestamp:z.number().finite(),source:z.string().max(60),level:z.string().max(20).optional(),path:z.string().max(2000).optional(),statusCode:z.number().int().min(100).max(599).optional(),proxy:z.object({path:z.string().max(2000).optional(),statusCode:z.number().int().min(100).max(599).optional(),method:z.string().max(16).optional()}).optional()});
export function vercelEvents(payload:unknown,projectId:string){
  const logs=z.array(recordSchema).max(1000).parse(payload);
  return logs.filter(log=>log.projectId===projectId).flatMap(log=>{
    const path=(log.path??log.proxy?.path??'/').split(/[?#]/)[0].slice(0,300);
    if(path.startsWith('/api/internal/vercel-logs'))return [];
    const hash=createHash('sha256').update(`${projectId}:${log.id}`).digest('hex');
    return [{id:`${hash.slice(0,8)}-${hash.slice(8,12)}-${hash.slice(12,16)}-${hash.slice(16,20)}-${hash.slice(20,32)}`,created_at:new Date(log.timestamp).toISOString(),kind:'hosting',action:log.proxy?.method??log.level??'log',resource:path,status:log.statusCode??log.proxy?.statusCode??(log.level==='error'?500:null),details:{provider:'vercel',source:log.source,level:log.level??null}}];
  });
}
