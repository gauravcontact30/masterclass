import {connection} from 'next/server';
import {db} from '@/lib/server/db';
export async function GET(){
  await connection();
  try{const {error}=await db().from('profiles').select('id').limit(1);if(error)throw error;return Response.json({status:'ok'},{headers:{'Cache-Control':'no-store'}});}
  catch{return Response.json({status:'unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
