/** @jest-environment node */
import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import proxy from "@/proxy";
import { protectWithArcjet } from "@/lib/arcjet";

jest.mock("@supabase/ssr", () => ({ createServerClient: jest.fn() }));
jest.mock("@/lib/arcjet", () => ({ protectWithArcjet: jest.fn(async () => ({ allowed: true })) }));
jest.mock("@/lib/redis", () => ({ checkRateLimit: jest.fn(async () => ({ success: true })) }));
const getClaims = jest.fn();
const savedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const savedKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test";
  jest.mocked(createServerClient).mockReturnValue({ auth: { getClaims } } as unknown as ReturnType<typeof createServerClient>);
});
afterAll(() => {
  if (savedUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = savedUrl;
  if (savedKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = savedKey;
});

test.each(["/", "/sign-in", "/sign-up", "/api/catalog"])("anonymous %s avoids remote session lookup", async path => {
  const response = await proxy(new NextRequest(`https://example.com${path}`));
  expect(response.status).toBe(200);
  expect(createServerClient).not.toHaveBeenCalled();
  expect(protectWithArcjet).toHaveBeenCalled();
});
test("anonymous dashboard navigation still redirects", async () => {
  const response = await proxy(new NextRequest("https://example.com/dashboard/techy"));
  expect(response.headers.get("location")).toBe("https://example.com/sign-in");
  expect(getClaims).not.toHaveBeenCalled();
});
test.each([true, false])("validates chunked auth cookies before routing (valid=%s)", async valid => {
  getClaims.mockResolvedValue(valid ? { data: { claims: { sub: "learner", email: "learner@example.com" } }, error: null } : { data: null, error: new Error("invalid JWT") });
  const response = await proxy(new NextRequest("https://example.com/dashboard/techy", { headers: { cookie: "sb-example-auth-token.0=signed-token" } }));
  expect(getClaims).toHaveBeenCalledTimes(1);
  expect(response.status).toBe(valid ? 200 : 307);
});
