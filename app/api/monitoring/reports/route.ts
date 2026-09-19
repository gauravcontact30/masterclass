import { api, jsonBody, sameOrigin, userId } from '@/lib/server/http';
import { db, check } from '@/lib/server/db';
import { rateLimit } from '@/lib/server/rate-limit';
import { reportInput } from '@/lib/monitoring-input';
export async function POST(request: Request) { return api(async () => {
  sameOrigin(request); const id = await userId(); await rateLimit(`report:${id}`, 5, 3600);
  const input = reportInput.parse(await jsonBody(request, 10000));
  const report = check(await db().from('content_reports').insert({...input,user_id:id}).select('id,status').single());
  return Response.json({report}, {status:201});
}, request); }
