import { api, jsonBody, sameOrigin } from '@/lib/server/http';
import { requireSuperAdmin } from '@/lib/server/super-admin';
import { db, check } from '@/lib/server/db';
import { reviewInput } from '@/lib/monitoring-input';
import { HttpError } from '@/lib/server/http';
export async function PATCH(request: Request) { return api(async () => {
  const admin = await requireSuperAdmin(); sameOrigin(request);
  const {id,...input} = reviewInput.parse(await jsonBody(request, 5000));
  const report = check(await db().from('content_reports').update({...input,reviewed_by:admin.id,updated_at:new Date().toISOString()}).eq('id',id).select('id,status').maybeSingle());
  if (!report) throw new HttpError(404,'not_found');
  return Response.json({report});
}, request); }
