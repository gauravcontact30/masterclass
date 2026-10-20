/** @jest-environment node */
import { POST } from "@/app/api/learning-path/route";
import { completeWithFallback, defaultProvider } from "@/lib/server/ai-providers";
jest.mock("@/lib/server/ai-providers", () => ({ completeWithFallback: jest.fn(), defaultProvider: jest.fn() }));
jest.mock("@/lib/server/ai-limits", () => ({ limitAiFeature: jest.fn() }));
jest.mock("@/lib/server/monitoring", () => ({ recordEvent: jest.fn() }));
jest.mock("next/server", () => ({ after: jest.fn() }));

const post = (body: unknown) => POST(new Request("https://example.test/api/learning-path", { method: "POST", headers: { "Content-Type": "application/json", origin: "https://example.test" }, body: JSON.stringify(body) }));
beforeEach(() => jest.clearAllMocks());

test("returns the model's path when it is usable", async () => {
  (defaultProvider as jest.Mock).mockReturnValue("anthropic");
  (completeWithFallback as jest.Mock).mockResolvedValue({ model: "m", text: JSON.stringify({ summary: "Go.", stages: [["JS", "javascript"], ["React", "react"], ["Next", "nextjs"]].map(([focus, id]) => ({ focus, technologyIds: [id], tasks: ["Read"], outcome: "Done" })) }) });
  const response = await post({ goal: "frontend job", weeks: 6 });
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ source: "ai", model: "m", weeks: 6, stages: [{ stage: 1, from: 1, to: 2 }, { stage: 2, from: 3, to: 4 }, { stage: 3, from: 5, to: 6 }] });
});

test("falls back to the rule-based path when the model fails, so a visitor always gets a plan", async () => {
  (defaultProvider as jest.Mock).mockReturnValue("anthropic");
  (completeWithFallback as jest.Mock).mockRejectedValue(new Error("timeout"));
  jest.spyOn(console, "error").mockImplementation(() => {});
  const body = await (await post({ goal: "learn devops", weeks: 4 })).json();
  expect(body.source).toBe("rules");
  expect(body.stages).toHaveLength(3);
});

test("rejects goals that are too short or cross-site posts", async () => {
  expect((await post({ goal: "x" })).status).toBe(400);
  const cross = await POST(new Request("https://example.test/api/learning-path", { method: "POST", headers: { "sec-fetch-site": "cross-site" }, body: "{}" }));
  expect(cross.status).toBe(403);
});
