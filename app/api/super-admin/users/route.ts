import {z} from 'zod';
import {api,HttpError,jsonBody,sameOrigin} from '@/lib/server/http';
import {requireSuperAdmin} from '@/lib/server/super-admin';
import {db,check} from '@/lib/server/db';
import {rateLimit} from '@/lib/server/rate-limit';
const inputSchema=z.object({id:z.uuid(),action:z.enum(['ban','unban','role']),role:z.enum(['viewer','editor','admin']).optional(),reason:z.string().trim().min(5).max(500)}).strict();
export async function PATCH(request:Request){return api(async()=>{
  const admin=await requireSuperAdmin();sameOrigin(request);await rateLimit(`admin-access:${admin.id}`,15,60);
  const input=inputSchema.parse(await jsonBody(request,3000));
  const {data,error}=await db().auth.admin.getUserById(input.id);if(error||!data.user)throw new HttpError(404,'not_found');
  if(input.id===admin.id||data.user.email?.trim().toLowerCase()==='garvcontact30@gmail.com')throw new HttpError(409,'owner_protected');
  if(input.action==='role'&&!input.role)throw new HttpError(400,'invalid_request');
  // Persist the initiating administrator before changing Auth; a failed audit write blocks mutation.
  const audit=check(await db().from('monitor_events').insert({kind:'admin',actor_id:admin.id,resource:input.id,action:`${input.action}_requested`,details:{reason:input.reason,role:input.role??null}}).select('id').single());
  if(!audit)throw new HttpError(503,'audit_unavailable');
  const patch=input.action==='role'?{app_metadata:{...data.user.app_metadata,role:input.role}}:{ban_duration:input.action==='ban'?'876000h':'none'};
  const result=await db().auth.admin.updateUserById(input.id,patch);
  if(result.error)throw new HttpError(503,'account_update_failed');
  check(await db().from('monitor_events').insert({kind:'admin',actor_id:admin.id,resource:input.id,action:`${input.action}_completed`,details:{request_id:audit.id}}));
  return Response.json({ok:true});
},request);}
