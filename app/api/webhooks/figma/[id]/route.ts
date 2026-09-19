import { z } from "zod";
import { createHash,createHmac } from "node:crypto";
import { api,HttpError,jsonBody } from "@/lib/server/http";
import { equalSecret } from "@/lib/server/secrets";
import { required } from "@/lib/server/config";
import { db,check } from "@/lib/server/db";
export async function POST(request:Request,context:{params:Promise<{id:string}>}){return api(async()=>{
  const id=z.uuid().parse((await context.params).id);
  const payload=z.object({passcode:z.string(),event_type:z.string(),file_key:z.string().optional(),timestamp:z.string().optional()}).passthrough().parse(await jsonBody(request));
  const expected=createHmac("sha256",required("FIGMA_WEBHOOK_SECRET")).update(id).digest("hex");
  if(!equalSecret(expected,payload.passcode))throw new HttpError(401,"unauthorized");
  if(payload.event_type==="PING")return Response.json({ok:true});
  const timestamp=Date.parse(payload.timestamp??"");if(!Number.isFinite(timestamp)||Math.abs(Date.now()-timestamp)>7*86400000)throw new HttpError(400,"invalid_request");
  const asset=check(await db().from("design_assets").select("*").eq("id",id).eq("provider","figma").maybeSingle());
  if(!asset||asset.external_id!==payload.file_key)throw new HttpError(404,"not_found");
  const eventId=createHash("sha256").update(JSON.stringify({...payload,passcode:undefined})).digest("hex");
  if(check(await db().from("webhook_events").select("event_id").eq("provider","figma").eq("event_id",eventId).maybeSingle()))return Response.json({duplicate:true});
  // Mark synced design metadata stale; don't accept remote event data as executable theme code.
  check(await db().from("design_assets").update({metadata:{...asset.metadata,needs_sync:true},updated_at:new Date().toISOString()}).eq("id",id));
  check(await db().from("webhook_events").upsert({provider:"figma",event_id:eventId,user_id:asset.user_id},{onConflict:"provider,event_id",ignoreDuplicates:true}));
  return Response.json({ok:true});
}, request);}
