import { api, HttpError } from "@/lib/server/http";
import { catalogTechnologies, catalogTopics } from "@/lib/server/catalog";
import { currentUser } from "@/lib/server/auth";
import { preparationAccess } from "@/lib/server/preparations";
import { canReadTechnology } from "@/lib/study/preparations";
import { authConfigured } from "@/lib/server/config";
export async function GET(request: Request) { return api(async () => {
  const user = authConfigured() ? await currentUser() : null;
  const access = user ? await preparationAccess(user.id) : null;
  const technologyId = new URL(request.url).searchParams.get("technologyId");
  if (technologyId !== null) {
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(technologyId)) throw new HttpError(400, "invalid_request");
    return Response.json({ topics: access && !canReadTechnology(access, technologyId) ? [] : await catalogTopics(technologyId) });
  }
  const [technologies, topics] = await Promise.all([catalogTechnologies(), catalogTopics()]);
  return Response.json({ technologies: access ? technologies.filter(item => canReadTechnology(access, item.id)) : technologies, topics: access ? topics.filter(item => canReadTechnology(access, item.technology_id)) : topics });
}); }
