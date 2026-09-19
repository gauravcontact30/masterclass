import { api, jsonBody, sameOrigin, userId } from '@/lib/server/http';
import { db, check } from '@/lib/server/db';
import { rateLimit } from '@/lib/server/rate-limit';
import { recordEvent } from '@/lib/server/monitoring';
import { presenceInput } from '@/lib/monitoring-input';
export async function POST(request: Request) { return api(async () => {
  sameOrigin(request); const id = await userId();
  await rateLimit(`presence:${id}`, 20, 60);
  const input = presenceInput.parse(await jsonBody(request, 2000));
  const agent = request.headers.get('user-agent') ?? '';
  const device = /tablet|ipad/i.test(agent) ? 'Tablet' : /mobile|iphone|android/i.test(agent) ? 'Mobile' : 'Desktop';
  check(await db().from('learning_presence').upsert({ user_id:id, session_id:input.sessionId, path:input.path, device, last_seen_at:new Date().toISOString() }, {onConflict:'user_id,session_id'}));
  if (input.view) await recordEvent({kind:'page',action:'view',resource:input.path,actor_id:id,duration_ms:input.loadMs});
  return Response.json({ok:true});
}, request); }
