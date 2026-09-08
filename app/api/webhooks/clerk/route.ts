import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { createHash } from "node:crypto";
import { api,HttpError } from "@/lib/server/http";
import { required } from "@/lib/server/config";
import { check,db } from "@/lib/server/db";
import { profile } from "@/lib/server/repository";
export async function POST(request:Request){return api(async()=>{
  let event;try{event=await verifyWebhook(request,{signingSecret:required("CLERK_WEBHOOK_SECRET")});}catch{throw new HttpError(401,"unauthorized");}
  const id=event.data.id;if(!id)return Response.json({ignored:true});
  if(event.type==="user.created")await profile(id);
  if(event.type==="user.deleted") {
    // Revoke local design access immediately. Learning and billing records follow the documented retention policy.
    check(await db().from("integration_connections").delete().eq("user_id",id));
    check(await db().from("oauth_states").delete().eq("user_id",id));
  }
  const eventId=createHash("sha256").update(`${request.headers.get("svix-id")}:${event.type}:${id}`).digest("hex");
  check(await db().from("webhook_events").upsert({provider:"clerk",event_id:eventId,user_id:id},{onConflict:"provider,event_id",ignoreDuplicates:true}));
  return Response.json({ok:true});
});}
