/** @jest-environment node */
import { GET } from "@/app/api/tech-buzz/route";
import { POST } from "@/app/api/tech-buzz/action/route";
import { TECH_BUZZ_ARTICLES } from "@/lib/tech-buzz-data";
import { isTechnologyStory } from "@/lib/tech-buzz-public";

// GET waits for connection() (request-time only); outside Next there is no request scope, so it resolves at once.
jest.mock("next/server", () => ({ ...jest.requireActual("next/server"), connection: async () => {} }));
// Stories come from storage in production; the bundled catalogue stands in. Counters fall back to the in-memory copy.
jest.mock("@/lib/server/tech-buzz-storage", () => ({
  listPublishedTechBuzzArticles: async () => jest.requireActual("@/lib/tech-buzz-data").TECH_BUZZ_ARTICLES,
  getPublishedTechBuzzArticle: async (slug: string) => jest.requireActual("@/lib/tech-buzz-data").TECH_BUZZ_ARTICLES.find((a: { slug: string }) => a.slug === slug) ?? null,
  bumpTechBuzzCounter: async () => null,
}));
jest.mock("@/lib/server/rate-limit", () => ({ rateLimit: async () => {} }));

const stories = TECH_BUZZ_ARTICLES.filter(isTechnologyStory);
const first = stories[0] ?? TECH_BUZZ_ARTICLES[0];
// The action route is same-origin only: a cross-site form must not post reactions as the visitor.
const action = (body: object) => new Request("http://localhost:3000/api/tech-buzz/action", { method: "POST", headers: { "Content-Type": "application/json", origin: "http://localhost:3000" }, body: JSON.stringify(body) });

describe("Tech Buzz API (/api/tech-buzz)", () => {
  test("GET returns cards with public cache headers and the platform matrix", async () => {
    const res = await GET(new Request("http://localhost:3000/api/tech-buzz?sort=trending"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=60");
    const data = await res.json();
    expect(data.articles).toHaveLength(stories.length);
    expect(data.platformsComparison.length).toBeGreaterThanOrEqual(7);
    expect(data.stats.totalArticles).toBe(stories.length);
  });

  test("GET filters by search query", async () => {
    const res = await GET(new Request(`http://localhost:3000/api/tech-buzz?search=${encodeURIComponent(first.technology)}`));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.articles.length).toBeGreaterThanOrEqual(1);
    expect(data.articles.some((a: { slug: string }) => a.slug === first.slug)).toBe(true);
  });

  test("POST upvote and dev.to reactions update the story", async () => {
    const upvote = await POST(action({ action: "upvote", articleId: first.id, delta: 1 }));
    expect(upvote.status).toBe(200);
    expect((await upvote.json()).success).toBe(true);
    const react = await POST(action({ action: "react", articleId: first.id, reaction: "unicorn" }));
    expect(react.status).toBe(200);
    expect((await react.json()).reactions.unicorn).toBeGreaterThan(0);
  });

  test("POST rejects cross-origin writes, retired comment actions and bad newsletter emails", async () => {
    const cross = new Request("http://localhost:3000/api/tech-buzz/action", { method: "POST", headers: { "Content-Type": "application/json", origin: "https://evil.example" }, body: JSON.stringify({ action: "upvote", articleId: first.id }) });
    expect((await POST(cross)).status).toBe(403);
    // Comments are per account now (/api/tech-buzz/[slug]/comments); the old action answers 410 Gone.
    expect((await POST(action({ action: "comment", articleId: first.id, text: "Hi" }))).status).toBe(410);
    expect((await POST(action({ action: "subscribe_newsletter", email: "not-an-email" }))).status).toBe(400);
    const ok = await POST(action({ action: "subscribe_newsletter", email: "subscriber@masterclass.dev" }));
    expect(ok.status).toBe(200);
    expect((await ok.json()).success).toBe(true);
  });
});
