import {connection} from 'next/server';
import {db} from '@/lib/server/db';

/** The last database check, reused for a few seconds: this endpoint is public, so a flood of probes must not become a flood of queries. */
let last: {ok: boolean; at: number} | null = null;
const FRESH_MS = 10_000;

export async function GET(){
  await connection();
  if(!last || Date.now()-last.at>FRESH_MS){
    try{const {error}=await db().from('profiles').select('id').limit(1);last={ok:!error,at:Date.now()};}
    catch{last={ok:false,at:Date.now()};}
  }
  return last.ok
    ? Response.json({status:'ok'},{headers:{'Cache-Control':'no-store'}})
    : Response.json({status:'unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
}
