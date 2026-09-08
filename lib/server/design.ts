import "server-only";
import { createHash,randomBytes } from "node:crypto";
import { z } from "zod";
import { db,check } from "./db";
import { required } from "./config";
import { encrypt,decrypt } from "./secrets";
import { HttpError } from "./http";
export const providerSchema=z.enum(["figma","canva"]);
export type DesignProvider=z.infer<typeof providerSchema>;
const tokenSchema=z.object({access_token:z.string().min(1),refresh_token:z.string().optional(),expires_in:z.number().positive()});
export function providerConfig(provider:DesignProvider){const prefix=provider.toUpperCase();return {clientId:required(`${prefix}_CLIENT_ID`),clientSecret:required(`${prefix}_CLIENT_SECRET`),redirect:`${required("APP_URL")}/api/integrations/${provider}/callback`};}
export async function tokenRequest(provider:DesignProvider,params:Record<string,string>,refresh=false) {
  const config=providerConfig(provider);
  const url=provider==="canva"?"https://api.canva.com/rest/v1/oauth/token":`https://api.figma.com/v1/oauth/${refresh?"refresh":"token"}`;
  const response=await fetch(url,{method:"POST",headers:{Authorization:`Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams(params),signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new HttpError(502,"integrationUnavailable");return tokenSchema.parse(await response.json());
}
export async function beginOAuth(provider:DesignProvider,owner:string) {
  const config=providerConfig(provider);const state=randomBytes(32).toString("base64url");const verifier=randomBytes(48).toString("base64url");
  check(await db().from("oauth_states").insert({state_hash:createHash("sha256").update(state).digest("hex"),user_id:owner,provider,verifier:encrypt(verifier),expires_at:new Date(Date.now()+600000).toISOString()}));
  const url=new URL(provider==="canva"?"https://www.canva.com/api/oauth/authorize":"https://www.figma.com/oauth");
  const params={client_id:config.clientId,redirect_uri:config.redirect,response_type:"code",state,scope:provider==="canva"?"design:meta:read design:content:read":"file_content:read webhooks:write"};
  Object.entries(params).forEach(([key,value])=>url.searchParams.set(key,value));
  if(provider==="canva"){url.searchParams.set("code_challenge",createHash("sha256").update(verifier).digest("base64url"));url.searchParams.set("code_challenge_method","S256");}
  return url.toString();
}
export async function completeOAuth(provider:DesignProvider,owner:string,state:string,code:string) {
  const hash=createHash("sha256").update(state).digest("hex");
  const row=check(await db().from("oauth_states").delete().eq("state_hash",hash).eq("user_id",owner).eq("provider",provider).gt("expires_at",new Date().toISOString()).select().maybeSingle());
  if(!row)throw new HttpError(400,"invalid_request");
  const config=providerConfig(provider);
  const tokens=await tokenRequest(provider,{grant_type:"authorization_code",code,redirect_uri:config.redirect,...(provider==="canva"?{code_verifier:decrypt(row.verifier)}:{})});
  check(await db().from("integration_connections").upsert({user_id:owner,provider,credentials:encrypt(JSON.stringify(tokens)),expires_at:new Date(Date.now()+tokens.expires_in*1000).toISOString(),refresh_lease_until:null},{onConflict:"user_id,provider"}));
}
async function accessToken(provider:DesignProvider,owner:string) {
  const connection=check(await db().from("integration_connections").select("*").eq("user_id",owner).eq("provider",provider).maybeSingle());
  if(!connection)throw new HttpError(409,"integrationUnavailable");
  const tokens=tokenSchema.parse(JSON.parse(decrypt(connection.credentials)));
  if(Date.parse(connection.expires_at)>Date.now()+60000)return tokens.access_token;
  if(!tokens.refresh_token)throw new HttpError(409,"integrationUnavailable");
  // Compare-and-swap lease prevents consuming Canva's single-use refresh token twice.
  const claimed=check(await db().from("integration_connections").update({refresh_lease_until:new Date(Date.now()+30000).toISOString()}).eq("user_id",owner).eq("provider",provider).eq("credentials",connection.credentials).or(`refresh_lease_until.is.null,refresh_lease_until.lt.${new Date().toISOString()}`).select("user_id").maybeSingle());
  if(!claimed)throw new HttpError(429,"rate_limited");
  try {
    const refreshed=await tokenRequest(provider,{grant_type:"refresh_token",refresh_token:tokens.refresh_token},true);
    check(await db().from("integration_connections").update({credentials:encrypt(JSON.stringify({...refreshed,refresh_token:refreshed.refresh_token??tokens.refresh_token})),expires_at:new Date(Date.now()+refreshed.expires_in*1000).toISOString(),refresh_lease_until:null}).eq("user_id",owner).eq("provider",provider).eq("credentials",connection.credentials));
    return refreshed.access_token;
  }catch(error){await db().from("integration_connections").update({refresh_lease_until:null}).eq("user_id",owner).eq("provider",provider).eq("credentials",connection.credentials);throw error;}
}
export async function designRequest(provider:DesignProvider,owner:string,path:string,body?:unknown) {
  const token=await accessToken(provider,owner);
  const base=provider==="canva"?"https://api.canva.com/rest/v1/":"https://api.figma.com/";
  const response=await fetch(base+path,{method:body?"POST":"GET",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined,redirect:"error",signal:AbortSignal.timeout(25000),cache:"no-store"});
  if(!response.ok)throw new HttpError(response.status===429?429:502,response.status===429?"rate_limited":"integrationUnavailable");
  return response.json();
}
