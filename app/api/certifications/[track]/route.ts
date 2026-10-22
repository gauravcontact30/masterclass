import { api, HttpError } from "@/lib/server/http";
import { currentUser } from "@/lib/server/auth";
import { requirePaidAccess } from "@/lib/server/subscription-access";
import { authConfigured } from "@/lib/server/config";
import { CERTIFICATION_CONTENT } from "@/lib/certification-content";

/*
 * One certification track's study material for the dashboard's Certifications page (lessons, workflows, pictures,
 * objective and subjective question banks), written by scripts/generate-certification-content.ts. Members, trial
 * users and super admins only. Each track is its own chunk, loaded when that track is opened.
 */

export async function GET(request: Request, { params }: { params: Promise<{ track: string }> }) {
  return api(async () => {
    if (authConfigured() || process.env.NODE_ENV === "production") {
      const user = await currentUser();
      if (!user) throw new HttpError(401, "signin_required");
      await requirePaidAccess(user.id);
    }
    const load = CERTIFICATION_CONTENT[(await params).track];
    // A track whose material has not been generated yet answers 404 and the page shows the path alone.
    if (!load) throw new HttpError(404, "unknown_track");
    return Response.json((await load()).default, { headers: { "Cache-Control": "private, max-age=3600" } });
  }, request);
}
