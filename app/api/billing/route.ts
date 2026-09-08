import { z } from "zod";
import { randomUUID } from "node:crypto";
import { api,userId,jsonBody,sameOrigin,HttpError } from "@/lib/server/http";
import { required,billingConfigured,quota } from "@/lib/server/config";
import { profile } from "@/lib/server/repository";
import { rateLimit } from "@/lib/server/rate-limit";
import { razorpay,billingSubscription,reconcileSubscription,createDownloadOrder } from "@/lib/server/billing";
import { db,check } from "@/lib/server/db";
export async function GET(){return api(async()=>Response.json({enabled:billingConfigured(),currency:"INR",freeLimit:quota("free"),proLimit:quota("monthly"),monthly:Number(process.env.PRO_MONTHLY_PRICE_INR??299),yearly:Number(process.env.PRO_YEARLY_PRICE_INR??2999),perDownload:Number(process.env.DOWNLOAD_CREDIT_PRICE_INR??49)}));}
export async function POST(request:Request){return api(async()=>{
  sameOrigin(request);const owner=await userId();await profile(owner);await rateLimit(`billing:${owner}`,3,60);
  const input=z.discriminatedUnion("action",[z.object({action:z.literal("checkout"),tier:z.enum(["monthly","yearly"])}).strict(),z.object({action:z.literal("cancel")}).strict(),z.object({action:z.literal("refresh")}).strict(),z.object({action:z.literal("buyDownloadCredit")}).strict()]).parse(await jsonBody(request));
  if(input.action==="buyDownloadCredit") {const order=await createDownloadOrder(owner);return Response.json({orderId:order.id,amount:order.amount,currency:order.currency,keyId:required("RAZORPAY_KEY_ID")});}
  const existing=check(await db().from("subscriptions").select("*").eq("user_id",owner).maybeSingle());
  if(input.action==="refresh") {if(existing)await reconcileSubscription(existing.provider_ref,`refresh:${randomUUID()}`);return Response.json({ok:true});}
  if(input.action==="cancel") {if(!existing)throw new HttpError(404,"not_found");await razorpay(`subscriptions/${encodeURIComponent(existing.provider_ref)}/cancel`,{cancel_at_cycle_end:1});check(await db().from("subscriptions").update({cancel_at_cycle_end:true}).eq("user_id",owner));return Response.json({ok:true});}
  if(existing){const remote=billingSubscription.parse(await razorpay(`subscriptions/${encodeURIComponent(existing.provider_ref)}`));if(["created","authenticated"].includes(remote.status)&&remote.short_url)return Response.json({url:remote.short_url});throw new HttpError(409,"invalid_request");}
  const planId=required(input.tier==="monthly"?"RAZORPAY_MONTHLY_PLAN_ID":"RAZORPAY_YEARLY_PLAN_ID");
  const remote=billingSubscription.parse(await razorpay("subscriptions",{plan_id:planId,total_count:input.tier==="monthly"?120:10,quantity:1,customer_notify:1,notes:{user_id:owner}}));
  // Insertion never grants access. Only reconciliation can establish a paid entitlement.
  const inserted=await db().from("subscriptions").insert({user_id:owner,provider_ref:remote.id,tier:input.tier,status:"created",synced_at:new Date(0).toISOString()});
  if(inserted.error){await razorpay(`subscriptions/${encodeURIComponent(remote.id)}/cancel`,{cancel_at_cycle_end:0});throw new HttpError(409,"invalid_request");}
  if(!remote.short_url)throw new HttpError(502,"service_error");
  return Response.json({url:remote.short_url});
});}
