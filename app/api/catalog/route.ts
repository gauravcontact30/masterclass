import { api } from "@/lib/server/http";
import { check, db } from "@/lib/server/db";
export async function GET() { return api(async () => {
  const [technologies, topics] = await Promise.all([db().from("technologies").select("*").order("title"), db().from("topics").select("*").order("title")]);
  return Response.json({ technologies: check(technologies), topics: check(topics) });
}); }
