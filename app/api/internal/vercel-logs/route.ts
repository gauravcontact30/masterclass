import {createHmac} from 'node:crypto';
import {api,HttpError} from '@/lib/server/http';
import {required} from '@/lib/server/config';
import {equalSecret} from '@/lib/server/secrets';
import {db,check} from '@/lib/server/db';
import {vercelEvents} from '@/lib/server/vercel-monitoring';
export const runtime='nodejs';
export async function POST(request:Request){return api(async()=>{
  const secret=required('VERCEL_LOG_DRAIN_SECRET'),projectId=required('VERCEL_PROJECT_ID');
  if(Number(request.headers.get('content-length'))>1048576)throw new HttpError(413,'request_too_large');
  const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'invalid_request');
  const chunks:Uint8Array[]=[];let size=0;
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>1048576){await reader.cancel();throw new HttpError(413,'request_too_large');}chunks.push(value);}
  const raw=Buffer.concat(chunks).toString('utf8');
  const expected=createHmac('sha1',secret).update(raw).digest('hex');
  if(!equalSecret(expected,request.headers.get('x-vercel-signature')??''))throw new HttpError(403,'invalid_signature');
  let payload:unknown;try{payload=JSON.parse(raw);}catch{throw new HttpError(400,'invalid_request');}
  const events=vercelEvents(payload,projectId);
  if(events.length)check(await db().from('monitor_events').upsert(events,{onConflict:'id',ignoreDuplicates:true}));
  return Response.json({ok:true,accepted:events.length});
});}
