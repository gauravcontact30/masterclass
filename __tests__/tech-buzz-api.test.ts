/** @jest-environment node */
import { GET } from "@/app/api/tech-buzz/route";
import { POST } from "@/app/api/tech-buzz/action/route";

describe("Tech Buzz API Route & Server Actions (/api/tech-buzz)", () => {
  test("GET /api/tech-buzz returns articles with cache headers and platform matrix", async () => {
    const req = new Request("http://localhost:3000/api/tech-buzz?sort=trending");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=60");

    const data = await res.json();
    expect(data.articles).toBeDefined();
    expect(data.articles.length).toBeGreaterThanOrEqual(8);
    expect(data.platformsComparison).toBeDefined();
    expect(data.platformsComparison.length).toBeGreaterThanOrEqual(7);
    expect(data.stats.totalArticles).toBeGreaterThanOrEqual(8);
  });

  test("GET /api/tech-buzz filters by category and search query", async () => {
    const req = new Request("http://localhost:3000/api/tech-buzz?category=Artificial%20Intelligence&search=Anthropic");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.articles.length).toBeGreaterThanOrEqual(1);
    expect(data.articles[0].technology).toContain("MCP");
  });

  test("POST /api/tech-buzz/action handles upvote", async () => {
    const req = new Request("http://localhost:3000/api/tech-buzz/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "upvote", articleId: "tb-01", delta: 1 })
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.upvotes).toBeGreaterThan(0);
  });

  test("POST /api/tech-buzz/action handles dev.to multi-reactions", async () => {
    const req = new Request("http://localhost:3000/api/tech-buzz/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "react", articleId: "tb-01", reaction: "unicorn" })
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.reactions.unicorn).toBeGreaterThan(0);
  });

  test("POST /api/tech-buzz/action handles comments and newsletter signup", async () => {
    // 1. Comment
    const commentReq = new Request("http://localhost:3000/api/tech-buzz/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "comment",
        articleId: "tb-01",
        text: "Great insights on MCP tool servers!",
        authorName: "Test Dev"
      })
    });
    const commentRes = await POST(commentReq);
    expect(commentRes.status).toBe(200);
    const commentData = await commentRes.json();
    expect(commentData.success).toBe(true);
    expect(commentData.comment.text).toBe("Great insights on MCP tool servers!");

    // 2. Newsletter
    const newsReq = new Request("http://localhost:3000/api/tech-buzz/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "subscribe_newsletter",
        email: "subscriber@masterclass.dev"
      })
    });
    const newsRes = await POST(newsReq);
    expect(newsRes.status).toBe(200);
    const newsData = await newsRes.json();
    expect(newsData.success).toBe(true);
    expect(newsData.message).toContain("MasterClass Tech Dispatch");
  });
});
