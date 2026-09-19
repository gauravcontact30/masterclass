import { api,userId,HttpError } from "@/lib/server/http";
import { providerSchema,completeOAuth } from "@/lib/server/design";
import { required } from "@/lib/server/config";
export async function GET(request:Request,context:{params:Promise<{provider:string}>}){return api(async()=>{const owner=await userId();const provider=providerSchema.parse((await context.params).provider);const url=new URL(request.url);const state=url.searchParams.get("state"),code=url.searchParams.get("code");if(!state||!code||state.length>200||code.length>2000)throw new HttpError(400,"invalid_request");await completeOAuth(provider,owner,state,code);return Response.redirect(`${required("APP_URL")}/dashboard?connections=1`,303);}, request);}
