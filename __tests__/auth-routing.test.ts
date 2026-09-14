/** @jest-environment node */
import { redirectFor } from "@/lib/auth-routes";
import { GET } from "@/app/auth/callback/route";
import { supabaseServer } from "@/lib/server/auth";

jest.mock("@/lib/server/auth", () => ({ supabaseServer: jest.fn() }));

describe("redirectFor", () => {
  it("redirects signed-in homepage visitors before static rendering", () => {
    expect(redirectFor({ pathname: "/", signedIn: true })).toBe("/dashboard");
  });
  it("sends signed-out visitors from the dashboard to sign-in", () => {
    expect(redirectFor({ pathname: "/dashboard", signedIn: false })).toBe("/sign-in");
    expect(redirectFor({ pathname: "/dashboard/library", signedIn: false })).toBe("/sign-in");
  });

  it("leaves signed-in visitors on the dashboard", () => {
    expect(redirectFor({ pathname: "/dashboard", signedIn: true })).toBeNull();
  });

  it("keeps the marketing page and auth pages open to signed-out visitors", () => {
    expect(redirectFor({ pathname: "/", signedIn: false })).toBeNull();
    expect(redirectFor({ pathname: "/sign-in", signedIn: false })).toBeNull();
    expect(redirectFor({ pathname: "/sign-up", signedIn: false })).toBeNull();
  });

  it("moves signed-in visitors off the auth pages into the app", () => {
    expect(redirectFor({ pathname: "/sign-in", signedIn: true })).toBe("/dashboard");
    expect(redirectFor({ pathname: "/sign-up", signedIn: true })).toBe("/dashboard");
  });
});

describe("GET /auth/callback", () => {
  function request(url: string) { return new Request(url) as unknown as Parameters<typeof GET>[0]; }

  it("exchanges a confirmation code for a session and opens the dashboard", async () => {
    const exchangeCodeForSession = jest.fn().mockResolvedValue({ error: null });
    (supabaseServer as jest.Mock).mockResolvedValue({ auth: { exchangeCodeForSession } });

    const response = await GET(request("http://localhost:3000/auth/callback?code=abc123"));

    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc123");
    expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });

  it("sends the visitor back to sign-in when the link is invalid or expired", async () => {
    const exchangeCodeForSession = jest.fn().mockResolvedValue({ error: { message: "expired" } });
    (supabaseServer as jest.Mock).mockResolvedValue({ auth: { exchangeCodeForSession } });

    const response = await GET(request("http://localhost:3000/auth/callback?code=stale"));

    expect(response.headers.get("location")).toBe("http://localhost:3000/sign-in");
  });

  it("sends the visitor to sign-in when the link carries no code at all", async () => {
    const exchangeCodeForSession = jest.fn();
    (supabaseServer as jest.Mock).mockResolvedValue({ auth: { exchangeCodeForSession } });

    const response = await GET(request("http://localhost:3000/auth/callback"));

    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("http://localhost:3000/sign-in");
  });
});
