/** @jest-environment node */
import { NextRequest, type NextFetchEvent } from "next/server";
import proxy from "@/proxy";
import { visitorCountry } from "@/lib/server/audience";
import { GET as geo } from "@/app/api/geo/route";
import { isIndiaOnlyPath } from "@/lib/audience";

jest.mock("@datafast/ai-crawl", () => ({ trackAICrawlerRequest: jest.fn() }));
jest.mock("@supabase/ssr", () => ({ createServerClient: jest.fn() }));
jest.mock("@/lib/arcjet", () => ({ protectWithArcjet: jest.fn(async () => ({ allowed: true })) }));
jest.mock("@/lib/redis", () => ({ checkRateLimit: jest.fn(async () => ({ success: true })) }));
const event = { waitUntil: jest.fn() } as unknown as NextFetchEvent;
beforeEach(() => {
  jest.replaceProperty(process, "env", { ...process.env, VERCEL: "1", DEV_VISITOR_COUNTRY: "", TRUSTED_GEO_PROVIDER: "", NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "" });
});
afterEach(() => jest.restoreAllMocks());
const request = (path: string, country = "US", extra: Record<string, string> = {}) => new NextRequest(`https://example.com${path}`, { headers: { "x-vercel-ip-country": country, ...extra } });

test.each(["IN", "in", " IN "])("normalizes trusted India country %s", country => {
  expect(visitorCountry(new Headers({ "x-vercel-ip-country": country }))).toBe("IN");
});
test.each(["", "XX", "IN,US", "IND", "123"])("invalid or unknown country stays closed: %s", country => {
  expect(visitorCountry(new Headers({ "x-vercel-ip-country": country, "cf-ipcountry": "IN", "x-country-code": "IN", "accept-language": "hi-IN" }))).toBeNull();
});
test("unconfigured origins cannot trust client-supplied country headers", () => {
  process.env.VERCEL = "";
  expect(visitorCountry(new Headers({ "x-vercel-ip-country": "IN", "cf-ipcountry": "IN" }))).toBeNull();
  process.env.TRUSTED_GEO_PROVIDER = "cloudflare";
  expect(visitorCountry(new Headers({ "x-vercel-ip-country": "IN", "cf-ipcountry": "US" }))).toBe("US");
});
test("development country override never applies in production", () => {
  process.env.DEV_VISITOR_COUNTRY = "IN";
  expect(visitorCountry(new Headers())).toBe("IN");
  jest.replaceProperty(process, "env", { ...process.env, NODE_ENV: "production" });
  expect(visitorCountry(new Headers())).toBeNull();
});
test.each(["/exams", "/exams/sign-in", "/exams/sign-up", "/exams/plans", "/exams/board-exams", "/exams/competitive-exams", "/exams/blog", "/exams/blog/revision", "/learning/board-exams", "/learning/competitive-exams", "/portal/join?portal=exams", "/portal/enter?portal=exams"])("redirects overseas direct and prefetch access: %s", async path => {
  const response = await proxy(request(path, "US", { "next-router-prefetch": "1", rsc: "1" }), event);
  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe("https://example.com/");
  expect(response.headers.get("cache-control")).toContain("no-store");
});
test.each(["/", "/learning", "/tech-buzz", "/tech-buzz/some-article", "/exams", "/exams/blog", "/learning/board-exams"])("India can reach the route: %s", async path => {
  const response = await proxy(request(path, "IN"), event);
  expect(response.status).toBe(200);
});
test.each(["US", "GB", "", "XX"])("worldwide Tech stays available for %s", async country => {
  for (const path of ["/", "/learning", "/tech-buzz", "/tech-buzz/article", "/sign-in"]) {
    expect((await proxy(request(path, country), event)).status).toBe(200);
  }
  expect((await proxy(request("/exams/blog", country), event)).status).toBe(307);
});
test.each(["/api/exams/account", "/api/account", "/api/billing"])("refuses overseas exam APIs and shared exam accounts: %s", async path => {
  const response = await proxy(request(path, "US", { "x-portal": "exams" }), event);
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({ error: "region_unavailable" });
});
test.each(["IN", "US", ""])("geo endpoint matches route policy and is never cached: %s", async country => {
  const response = await geo(request("/api/geo", country));
  expect(await response.json()).toMatchObject({ country: country || null, indiaAccess: country === "IN" });
  expect(response.headers.get("cache-control")).toContain("no-store");
});
test("route policy uses path boundaries", () => {
  expect(isIndiaOnlyPath("/exams/blog")).toBe(true);
  expect(isIndiaOnlyPath("/exams-other")).toBe(false);
  expect(isIndiaOnlyPath("/tech-buzz/exams-in-tech")).toBe(false);
});
