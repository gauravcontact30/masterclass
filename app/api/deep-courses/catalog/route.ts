import { api } from "@/lib/server/http";
import { currentUser } from "@/lib/server/auth";
import { generatedCatalog } from "@/lib/server/course-generator";

/** GET: which generated in-depth courses are written, and their topic ids (for the catalogue's badges and progress). */
export async function GET(request: Request) {
  return api(async () => {
    if (!await currentUser()) return Response.json({ courses: {} });
    return Response.json({ courses: await generatedCatalog() }, { headers: { "Cache-Control": "private, max-age=60" } });
  }, request);
}
