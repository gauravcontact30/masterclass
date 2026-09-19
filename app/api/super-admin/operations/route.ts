import {api} from '@/lib/server/http';
import {requireSuperAdmin} from '@/lib/server/super-admin';
import {db,check} from '@/lib/server/db';
export async function GET(request:Request){return api(async()=>{
  await requireSuperAdmin();const days=Number(new URL(request.url).searchParams.get('days'));
  const data=check(await db().rpc('super_admin_operations',{p_days:[1,7,30,90].includes(days)?days:30}));
  return Response.json({...data,generatedAt:new Date().toISOString()});
},request);}
