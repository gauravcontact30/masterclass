import { api, userId } from "@/lib/server/http";
import { preparationAccess } from "@/lib/server/preparations";
import { STUDY_COURSES } from "@/lib/study/catalog";
import { canReadStudy } from "@/lib/study/preparations";
export async function GET() { return api(async () => {
  const owner = await userId(); const access = await preparationAccess(owner);
  return Response.json({ courses: STUDY_COURSES.filter(course => canReadStudy(access, course)), preparations: access });
}); }
