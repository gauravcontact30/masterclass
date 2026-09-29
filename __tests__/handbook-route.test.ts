/** @jest-environment node */
import { GET } from "@/app/api/pro-learn/handbook/route";
import { authConfigured } from "@/lib/server/config";
import { userId } from "@/lib/server/http";
import { GIT_TITLE } from "@/lib/pro-learn/git-handbook";
import { TECHNOLOGY_HANDBOOKS } from "@/lib/pro-learn/technology-handbooks";

jest.mock("@/lib/server/config", () => ({ authConfigured: jest.fn(() => false) }));
jest.mock("@/lib/server/monitoring", () => ({ recordEvent: jest.fn() }));
jest.mock("@/lib/server/http", () => ({
  ...jest.requireActual("@/lib/server/http"), userId: jest.fn(),
}));

test.each(TECHNOLOGY_HANDBOOKS.map(book => book.title))("returns the authored topics for %s", async title => {
  const response = await GET(new Request(`http://localhost/api/pro-learn/handbook?title=${encodeURIComponent(title)}`));
  expect(response.status).toBe(200);
  const result = await response.json();
  expect(result.title).toBe(title);
  expect(result.topics.length).toBeGreaterThan(0);
  expect(result.categories.length).toBeGreaterThan(0);
  expect(result.topics.every((topic: { prepared?: unknown; vocabulary?: unknown }) => topic.prepared || topic.vocabulary)).toBe(true);
});

test("returns the complete Git lesson, including syntax and walkthrough metadata", async () => {
  const response = await GET(new Request(`http://localhost/api/pro-learn/handbook?title=${encodeURIComponent(GIT_TITLE)}`));
  expect(response.status).toBe(200);
  const result = await response.json();
  expect(result.topics[0].prepared.walkthrough).toBe("git");
  expect(result.topics[0].prepared.answer.steps.length).toBeGreaterThan(3);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
});

test("unknown titles return 404", async () => {
  expect((await GET(new Request("http://localhost/api/pro-learn/handbook?title=unknown"))).status).toBe(404);
});

test("authentication is enforced before serving catalogue content", async () => {
  (authConfigured as jest.Mock).mockReturnValue(true);
  const { HttpError } = jest.requireActual("@/lib/server/http");
  (userId as jest.Mock).mockRejectedValue(new HttpError(401, "signin_required"));
  const response = await GET(new Request(`http://localhost/api/pro-learn/handbook?title=${encodeURIComponent(GIT_TITLE)}`));
  expect(response.status).toBe(401);
  expect(await response.json()).toEqual({ error: "signin_required" });
});
