import { z } from "zod";
import { createHash } from "node:crypto";
import { api,HttpError } from "@/lib/server/http";
import { verifyHmac } from "@/lib/server/secrets";
import { required } from "@/lib/server/config";
import { reconcileSubscription,reconcileDownloadCredit } from "@/lib/server/billing";
import { db,check } from "@/lib/server/db";
export async function POST(request:Request){return api(async()=>{
  const raw=await request.text();if(raw.length>200000)throw new HttpError(413,"invalid_request");
  if(!verifyHmac(raw,request.headers.get("x-razorpay-signature")??"",required("RAZORPAY_WEBHOOK_SECRET")))throw new HttpError(401,"unauthorized");
  const event=z.object({event:z.string(),payload:z.object({
    subscription:z.object({entity:z.object({id:z.string()})}).optional(),
    payment:z.object({entity:z.object({order_id:z.string(),notes:z.object({kind:z.string().optional()}).passthrough().optional()})}).optional(),
  })}).parse(JSON.parse(raw));
  const subscriptionEvent=event.event.startsWith("subscription.")&&event.payload.subscription;
  const downloadCreditPayment=event.event==="payment.captured"&&event.payload.payment?.entity.notes?.kind==="download_credit"&&event.payload.payment;
  if(!subscriptionEvent&&!downloadCreditPayment)return Response.json({ignored:true});
  // Hash signed body instead of trusting an unsigned event-id header for deduplication.
  const id=createHash("sha256").update(raw).digest("hex");
  if(check(await db().from("webhook_events").select("event_id").eq("provider","razorpay").eq("event_id",id).maybeSingle()))return Response.json({duplicate:true});
  if(subscriptionEvent)await reconcileSubscription(subscriptionEvent.entity.id,id);
  else if(downloadCreditPayment)await reconcileDownloadCredit(downloadCreditPayment.entity.order_id,id);
  return Response.json({ok:true});
});}
