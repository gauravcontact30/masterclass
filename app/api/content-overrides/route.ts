import { api, jsonBody, sameOrigin } from "@/lib/server/http";
import { requireSuperAdmin } from "@/lib/server/super-admin";
import { rateLimit } from "@/lib/server/rate-limit";
import { contentOverrides, parseContentChange, saveContentOverride } from "@/lib/server/content-overrides";

/** Every content override (public: it is the content every visitor already sees). */
export async function GET(request: Request) {
  return api(async () => Response.json(await contentOverrides()), request);
}

/** Super Admin only: edit or reset one field, or delete or restore one card or section. */
export async function POST(request: Request) {
  return api(async () => {
    sameOrigin(request);
    const admin = await requireSuperAdmin();
    const change = parseContentChange(await jsonBody(request, 60000));
    await rateLimit(`content-edit:${admin.id}`, 240, 3600);
    return Response.json({ key: change.key, override: await saveContentOverride(change, admin.email ?? admin.id) });
  }, request);
}
