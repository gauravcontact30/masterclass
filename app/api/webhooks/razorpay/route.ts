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
  // Persist only an explicit allowlist from the signed provider event. Retries are idempotent.
  const signed = z.object({event:z.string(),payload:z.record(z.string(),z.unknown())}).parse(JSON.parse(raw));
  const kind = signed.event.split(".")[0];
  if (["payment","refund","invoice","subscription"].includes(kind) && signed.payload[kind]) {
    const entity = z.object({entity:z.object({id:z.string(),amount:z.number().int().nonnegative().optional(),currency:z.string().length(3).optional(),subscription_id:z.string().optional(),invoice_id:z.string().nullable().optional()})}).parse(signed.payload[kind]).entity;
    check(await db().from("billing_ledger").upsert({event_id:createHash("sha256").update(raw).digest("hex"),event:signed.event,entity_id:entity.id,subscription_ref:entity.subscription_id??(kind==="subscription"?entity.id:null),amount:entity.amount??null,currency:entity.currency??null,invoice_id:entity.invoice_id??(kind==="invoice"?entity.id:null)},{onConflict:"event_id",ignoreDuplicates:true}));
  }
  const event=z.object({event:z.string(),payload:z.object({
    subscription:z.object({entity:z.object({id:z.string()})}).optional(),
    payment:z.object({entity:z.object({order_id:z.string().nullable().optional(),notes:z.object({kind:z.string().optional()}).passthrough().optional()})}).optional(),
  })}).parse(JSON.parse(raw));
  const subscriptionEvent=event.event.startsWith("subscription.")&&event.payload.subscription;
  const downloadCreditPayment=event.event==="payment.captured"&&event.payload.payment?.entity.notes?.kind==="download_credit"&&event.payload.payment;
  if(!subscriptionEvent&&!downloadCreditPayment)return Response.json({ignored:true});
  // Hash signed body instead of trusting an unsigned event-id header for deduplication.
  const id=createHash("sha256").update(raw).digest("hex");
  if(check(await db().from("webhook_events").select("event_id").eq("provider","razorpay").eq("event_id",id).maybeSingle()))return Response.json({duplicate:true});
  if(subscriptionEvent)await reconcileSubscription(subscriptionEvent.entity.id,id);
  else if(downloadCreditPayment && downloadCreditPayment.entity.order_id)await reconcileDownloadCredit(downloadCreditPayment.entity.order_id,id);
  return Response.json({ok:true});
}, request);}
