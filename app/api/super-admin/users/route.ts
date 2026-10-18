import {z} from 'zod';
import {api,HttpError,jsonBody,sameOrigin} from '@/lib/server/http';
import {requireSuperAdmin} from '@/lib/server/super-admin';
import {db,check} from '@/lib/server/db';
import {rateLimit} from '@/lib/server/rate-limit';
import {account} from '@/lib/server/repository';
import {adminUserDetail,adminUsersPage} from '@/lib/server/admin-users';
import {isOwnerUser} from '@/lib/study/preparations';
import {ADMIN_USER_FILTERS} from '@/lib/admin-users';

const reason=z.string().trim().min(5).max(500);
const inputSchema=z.discriminatedUnion('action',[
  z.object({id:z.uuid(),action:z.literal('role'),role:z.enum(['viewer','editor','admin']),reason}).strict(),
  z.object({id:z.uuid(),action:z.enum(['ban','unban','grant_super_admin','revoke_super_admin','delete']),reason}).strict(),
  z.object({id:z.uuid(),action:z.literal('profile'),name:z.string().trim().min(1).max(80),language:z.enum(['en','hi']),reason}).strict(),
]);
const filters=ADMIN_USER_FILTERS.map(f=>f.id) as [string,...string[]];
const querySchema=z.object({page:z.coerce.number().int().min(1).max(10000).default(1),q:z.string().max(120).default(''),filter:z.enum(filters).default('all'),id:z.uuid().optional()});

/** The live user directory (one page, with summary counts), or one account's full profile with ?id=. */
export async function GET(request:Request){return api(async()=>{
  await requireSuperAdmin();
  const params=querySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  if(params.id){
    try{return Response.json({user:await adminUserDetail(params.id)});}catch(error){if((error as {status?:number}).status===404)throw new HttpError(404,'not_found');throw error;}
  }
  return Response.json(await adminUsersPage({page:params.page,query:params.q,filter:params.filter as never}));
},request);}

/**
 * Account changes from Users & access. Every change is written to the audit log before Auth is touched (a failed
 * audit write blocks it), and the owner and the acting admin's own account are protected.
 */
export async function PATCH(request:Request){return api(async()=>{
  const admin=await requireSuperAdmin();sameOrigin(request);await rateLimit(`admin-access:${admin.id}`,15,60);
  const input=inputSchema.parse(await jsonBody(request,3000));
  const {data,error}=await db().auth.admin.getUserById(input.id);if(error||!data.user)throw new HttpError(404,'not_found');
  const target=data.user;
  if(input.id===admin.id||isOwnerUser(target))throw new HttpError(409,'owner_protected');
  if(input.action==='grant_super_admin'&&!target.email_confirmed_at)throw new HttpError(409,'unconfirmed_email');
  // Removing a paying member would orphan a live Razorpay subscription: cancel it in Billing first.
  if(input.action==='delete'&&(await account(input.id)).paidTier!=='free')throw new HttpError(409,'active_subscription');
  const details={reason:input.reason,...(input.action==='role'?{role:input.role}:{}),...(input.action==='profile'?{name:input.name,language:input.language}:{}),email:target.email??null};
  const audit=check(await db().from('monitor_events').insert({kind:'admin',actor_id:admin.id,resource:input.id,action:`${input.action}_requested`,details}).select('id').single());
  if(!audit)throw new HttpError(503,'audit_unavailable');

  let failed=false;
  if(input.action==='delete'){
    failed=!!(await db().auth.admin.deleteUser(input.id)).error;
  }else if(input.action==='profile'){
    failed=!!(await db().auth.admin.updateUserById(input.id,{user_metadata:{...target.user_metadata,full_name:input.name}})).error;
    if(!failed){
      await db().from('profiles').upsert({id:input.id},{onConflict:'id',ignoreDuplicates:true});
      failed=!!(await db().from('profiles').update({name:input.name,language:input.language}).eq('id',input.id)).error;
    }
  }else{
    const patch=input.action==='role'?{app_metadata:{...target.app_metadata,role:input.role}}
      :input.action==='grant_super_admin'||input.action==='revoke_super_admin'?{app_metadata:{...target.app_metadata,super_admin:input.action==='grant_super_admin'}}
      :{ban_duration:input.action==='ban'?'876000h':'none'};
    failed=!!(await db().auth.admin.updateUserById(input.id,patch)).error;
  }
  if(failed)throw new HttpError(503,'account_update_failed');
  check(await db().from('monitor_events').insert({kind:'admin',actor_id:admin.id,resource:input.id,action:`${input.action}_completed`,details:{request_id:audit.id}}));
  return Response.json({ok:true});
},request);}
