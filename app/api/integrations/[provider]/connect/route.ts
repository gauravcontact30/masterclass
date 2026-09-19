import { api,userId,sameOrigin } from "@/lib/server/http";
import { providerSchema,beginOAuth } from "@/lib/server/design";
import { profile } from "@/lib/server/repository";
import { rateLimit } from "@/lib/server/rate-limit";
export async function POST(request:Request,context:{params:Promise<{provider:string}>}){return api(async()=>{sameOrigin(request);const owner=await userId();await profile(owner);await rateLimit(`oauth:${owner}`,5);const provider=providerSchema.parse((await context.params).provider);return Response.json({url:await beginOAuth(provider,owner)});}, request);}
