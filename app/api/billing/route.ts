import { z } from "zod";
import { randomUUID } from "node:crypto";
import { api,userId,jsonBody,sameOrigin,HttpError } from "@/lib/server/http";
import { required,billingConfigured,quota } from "@/lib/server/config";
import { profile } from "@/lib/server/repository";
import { rateLimit } from "@/lib/server/rate-limit";
import { razorpay,billingSubscription,reconcileSubscription } from "@/lib/server/billing";
import { db,check } from "@/lib/server/db";
import { savePreparations } from "@/lib/server/preparations";
import { preparationSchema } from "@/lib/study/preparations";
export async function GET(monitorRequest?: Request){return api(async()=>Response.json({enabled:billingConfigured(),currency:"INR",proLimit:quota("monthly"),monthly:Number(process.env.PRO_MONTHLY_PRICE_INR??299),yearly:Number(process.env.PRO_YEARLY_PRICE_INR??2999)}), monitorRequest);}
export async function POST(request:Request){return api(async()=>{
  sameOrigin(request);const owner=await userId();await profile(owner);await rateLimit(`billing:${owner}`,3,60);
  const input=z.discriminatedUnion("action",[z.object({action:z.literal("checkout"),tier:z.enum(["monthly","yearly"]),selections:preparationSchema}).strict(),z.object({action:z.literal("cancel")}).strict(),z.object({action:z.literal("refresh")}).strict()]).parse(await jsonBody(request));
  const existing=check(await db().from("subscriptions").select("*").eq("user_id",owner).maybeSingle());
  if(input.action==="refresh") {if(existing)await reconcileSubscription(existing.provider_ref,`refresh:${randomUUID()}`);return Response.json({ok:true});}
  if(input.action==="cancel") {if(!existing)throw new HttpError(404,"not_found");await razorpay(`subscriptions/${encodeURIComponent(existing.provider_ref)}/cancel`,{cancel_at_cycle_end:1});check(await db().from("subscriptions").update({cancel_at_cycle_end:true}).eq("user_id",owner));return Response.json({ok:true});}
  await savePreparations(owner,input.selections);
  const planId=required(input.tier==="monthly"?"RAZORPAY_MONTHLY_PLAN_ID":"RAZORPAY_YEARLY_PLAN_ID");
  if(existing){
    const remote=billingSubscription.parse(await razorpay(`subscriptions/${encodeURIComponent(existing.provider_ref)}`));
    if(["created","authenticated"].includes(remote.status)&&remote.short_url){
      if(remote.plan_id!==planId)throw new HttpError(409,"checkout_plan_conflict");
      return Response.json({url:remote.short_url});
    }
    const paidUntil=Math.max(remote.current_end?remote.current_end*1000:0,Date.parse(existing.current_period_end??"")||0);
    if(!["cancelled","completed","expired"].includes(remote.status)||paidUntil>Date.now())throw new HttpError(409,"subscription_exists");
  }
  const remote=billingSubscription.parse(await razorpay("subscriptions",{plan_id:planId,total_count:input.tier==="monthly"?120:10,quantity:1,customer_notify:1,notes:{user_id:owner}}));
  // Insertion never grants access. Only reconciliation can establish a paid entitlement.
  const row={user_id:owner,provider_ref:remote.id,tier:input.tier,status:"created",synced_at:new Date(0).toISOString(),current_period_end:null,grace_until:null,cancel_at_cycle_end:false};
  const inserted=existing
    ?await db().from("subscriptions").update(row).eq("user_id",owner).eq("provider_ref",existing.provider_ref).select("provider_ref").maybeSingle()
    :await db().from("subscriptions").insert(row).select("provider_ref").single();
  if(inserted.error||!inserted.data){await razorpay(`subscriptions/${encodeURIComponent(remote.id)}/cancel`,{cancel_at_cycle_end:0});throw new HttpError(409,"invalid_request");}
  if(!remote.short_url)throw new HttpError(502,"service_error");
  return Response.json({url:remote.short_url});
}, request);}
