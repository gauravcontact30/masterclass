import { randomUUID } from "node:crypto";
import { api, HttpError } from "@/lib/server/http";
import { required } from "@/lib/server/config";
import { equalSecret } from "@/lib/server/secrets";
import { db, check } from "@/lib/server/db";
import { reconcileSubscription } from "@/lib/server/billing";

export const runtime="nodejs";
export const maxDuration=300;
/** Schedule every few minutes; webhooks remain the primary synchronization channel. */
export async function POST(request:Request) {
  return api(async()=>{
    if(!equalSecret(request.headers.get("authorization")??"",`Bearer ${required("WORKER_SECRET")}`))throw new HttpError(401,"unauthorized");
    const rows=check(await db().from("subscriptions").select("provider_ref").in("status",["created","authenticated","active","pending","halted","paused"]).order("synced_at",{ascending:true}).limit(10));
    let reconciled=0,failed=0;
    for(const row of rows??[]) {
      try {await reconcileSubscription(row.provider_ref,`scheduled:${randomUUID()}`);reconciled++;}
      catch {failed++;}
    }
    return Response.json({reconciled,failed},{status:failed?503:200});
  },request);
}
