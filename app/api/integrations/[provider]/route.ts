import { z } from "zod";
import { createHmac } from "node:crypto";
import { api,userId,jsonBody,sameOrigin,HttpError } from "@/lib/server/http";
import { providerSchema,designRequest } from "@/lib/server/design";
import { check,db } from "@/lib/server/db";
import { required } from "@/lib/server/config";
import { rateLimit } from "@/lib/server/rate-limit";
export async function DELETE(request:Request,context:{params:Promise<{provider:string}>}){return api(async()=>{sameOrigin(request);const owner=await userId();const provider=providerSchema.parse((await context.params).provider);check(await db().from("integration_connections").delete().eq("user_id",owner).eq("provider",provider));check(await db().from("oauth_states").delete().eq("user_id",owner).eq("provider",provider));return Response.json({ok:true});});}
export async function POST(request:Request,context:{params:Promise<{provider:string}>}){return api(async()=>{
  sameOrigin(request);const owner=await userId();const provider=providerSchema.parse((await context.params).provider);await rateLimit(`design:${owner}`,15);
  const input=z.object({action:z.enum(["browse","export","status","subscribe"]),id:z.string().regex(/^[a-zA-Z0-9_-]+$/).max(150).optional(),nodeId:z.string().regex(/^[a-zA-Z0-9:_-]+$/).max(100).optional(),format:z.enum(["pdf","pptx","png"]).optional()}).strict().parse(await jsonBody(request));
  if(provider==="canva") {
    if(input.action==="browse")return Response.json(await designRequest(provider,owner,"designs"));
    if(!input.id)throw new HttpError(400,"invalid_request");
    if(input.action==="export") {
      const result=await designRequest(provider,owner,"exports",{design_id:input.id,format:{type:input.format??"pdf"}});
      const job=z.object({job:z.object({id:z.string(),status:z.string()})}).parse(result);
      check(await db().from("design_assets").upsert({user_id:owner,provider,external_id:job.job.id,name:input.id,metadata:{kind:"export"}},{onConflict:"user_id,provider,external_id"}));return Response.json(result);
    }
    if(input.action==="status") {const owned=check(await db().from("design_assets").select("id").eq("user_id",owner).eq("provider",provider).eq("external_id",input.id).maybeSingle());if(!owned)throw new HttpError(404,"not_found");return Response.json(await designRequest(provider,owner,`exports/${encodeURIComponent(input.id)}`));}
  } else {
    if(!input.id)throw new HttpError(400,"invalid_request");
    if(input.action==="browse") {
      const result=await designRequest(provider,owner,`v1/files/${encodeURIComponent(input.id)}?depth=2`);
      check(await db().from("design_assets").upsert({user_id:owner,provider,external_id:input.id,name:String(result.name??input.id).slice(0,200),metadata:{version:result.version}},{onConflict:"user_id,provider,external_id"}));
      return Response.json({name:result.name,document:result.document});
    }
    if(input.action==="export") {
      if(!input.nodeId||input.format==="pptx")throw new HttpError(400,"invalid_request");
      return Response.json(await designRequest(provider,owner,`v1/images/${encodeURIComponent(input.id)}?ids=${encodeURIComponent(input.nodeId)}&format=${input.format??"pdf"}`));
    }
    if(input.action==="subscribe") {
      const asset=check(await db().from("design_assets").select("id").eq("user_id",owner).eq("provider",provider).eq("external_id",input.id).maybeSingle());if(!asset)throw new HttpError(404,"not_found");
      const passcode=createHmac("sha256",required("FIGMA_WEBHOOK_SECRET")).update(asset.id).digest("hex");
      return Response.json(await designRequest(provider,owner,"v2/webhooks",{event_type:"FILE_UPDATE",context:"file",context_id:input.id,endpoint:`${required("APP_URL")}/api/webhooks/figma/${asset.id}`,passcode,status:"ACTIVE"}));
    }
  }
  throw new HttpError(400,"invalid_request");
});}
