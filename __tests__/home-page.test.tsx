/** @jest-environment node */
import Home from "@/app/page";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/server/auth";
import { LandingPage } from "@/components/landing-page";

jest.mock("next/navigation", () => ({ redirect: jest.fn() }));
jest.mock("@/lib/server/auth", () => ({ currentUser: jest.fn() }));

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
});

test("redirects signed-in visitors from the marketing page to the dashboard", async () => {
  (currentUser as jest.Mock).mockResolvedValue({ id: "user_1" });
  await Home();
  expect(redirect).toHaveBeenCalledWith("/dashboard");
});

test("renders the public landing page for signed-out visitors", async () => {
  (currentUser as jest.Mock).mockResolvedValue(null);
  const element = await Home();
  expect(element.type).toBe(LandingPage);
  expect(redirect).not.toHaveBeenCalled();
});

test("renders the landing page without checking a session when auth is not configured", async () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const element = await Home();
  expect(currentUser).not.toHaveBeenCalled();
  expect(element.type).toBe(LandingPage);
});
