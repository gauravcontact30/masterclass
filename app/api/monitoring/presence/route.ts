import { api, jsonBody, sameOrigin, userId } from '@/lib/server/http';
import { db, check } from '@/lib/server/db';
import { rateLimit } from '@/lib/server/rate-limit';
import { recordEvent } from '@/lib/server/monitoring';
import { presenceInput } from '@/lib/monitoring-input';
let schemaRetryAt = 0;
export async function POST(request: Request) { return api(async () => {
  sameOrigin(request); const id = await userId();
  if (Date.now() < schemaRetryAt) return Response.json({ok:false,enabled:false,reason:'monitoring_setup_required'});
  await rateLimit(`presence:${id}`, 20, 60);
  const input = presenceInput.parse(await jsonBody(request, 2000));
  const agent = request.headers.get('user-agent') ?? '';
  const device = /tablet|ipad/i.test(agent) ? 'Tablet' : /mobile|iphone|android/i.test(agent) ? 'Mobile' : 'Desktop';
  const result = await db().from('learning_presence').upsert({ user_id:id, session_id:input.sessionId, path:input.path, device, last_seen_at:new Date().toISOString() }, {onConflict:'user_id,session_id'});
  if (result.error?.code === 'PGRST205' || result.error?.code === '42P01') {
    schemaRetryAt = Date.now() + 5 * 60 * 1000;
    console.warn('Presence tracking disabled: apply supabase/migrations/0019_admin_operations.sql, then reload the dashboard.');
    return Response.json({ok:false,enabled:false,reason:'monitoring_setup_required'});
  }
  check(result);
  if (input.view) await recordEvent({kind:'page',action:'view',resource:input.path,actor_id:id,duration_ms:input.loadMs});
  return Response.json({ok:true});
}, request); }
