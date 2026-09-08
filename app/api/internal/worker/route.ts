import { api,HttpError } from "@/lib/server/http";
import { required } from "@/lib/server/config";
import { equalSecret } from "@/lib/server/secrets";
import { processOne } from "@/lib/server/worker";
export const runtime="nodejs";
export const maxDuration=300;
export async function POST(request:Request) {return api(async()=>{
  if(!equalSecret(request.headers.get("authorization") ?? "",`Bearer ${required("WORKER_SECRET")}`)) throw new HttpError(401,"unauthorized");
  return Response.json(await processOne());
});}
