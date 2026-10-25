import { api } from "@/lib/server/http";
import { currentUser } from "@/lib/server/auth";
import { account } from "@/lib/server/repository";
import { isSuperAdminUser } from "@/lib/study/preparations";
import { getPublishedTechBuzzArticle } from "@/lib/server/tech-buzz-storage";
import { toMemberContent } from "@/lib/tech-buzz-public";

/**
 * The member-only body of a Tech Buzz story (Medium-style metering): pages and the public API send only the preview,
 * and this route sends the rest after checking the session and plan on the server. Visitors who are not members get
 * a 200 with { member: false } rather than a 401/402, which would record a security event for every curious reader.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  return api(async () => {
    const { slug } = await params;
    const article = await getPublishedTechBuzzArticle(slug);
    if (!article) return Response.json({ error: "not_found" }, { status: 404 });
    const user = await currentUser();
    if (!user) return Response.json({ member: false, reason: "signin_required" });
    if (!isSuperAdminUser(user) && (await account(user.id)).tier === "free") return Response.json({ member: false, reason: "subscription_required" });
    return Response.json({ member: true, content: toMemberContent(article) });
  }, request);
}
