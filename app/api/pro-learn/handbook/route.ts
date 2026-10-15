import { authConfigured } from "@/lib/server/config";
import { api, HttpError, userId } from "@/lib/server/http";
import { TECHNOLOGY_HANDBOOKS } from "@/lib/pro-learn/technology-handbooks";
import { prepareSearchTopics } from "@/lib/server/prepared-catalog";
import { withApiReference } from "@/lib/server/handbook-api-reference";
import { requirePaidAccess } from "@/lib/server/subscription-access";

export function GET(request: Request) {
  return api(async () => {
    if (authConfigured() || process.env.NODE_ENV === "production") await requirePaidAccess(await userId());
    const title = new URL(request.url).searchParams.get("title");
    const found = TECHNOLOGY_HANDBOOKS.find(entry => entry.title === title);
    if (!found) throw new HttpError(404, "handbook_not_found");
    // The same API Docs reference the search page counted in this tab's pill.
    const [book] = withApiReference([found]);
    return Response.json({ ...book, topics: prepareSearchTopics(book.topics, book.title, book.sources) });
  }, request);
}
