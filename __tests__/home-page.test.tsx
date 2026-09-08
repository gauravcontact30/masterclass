/** @jest-environment node */
import Home from "@/app/page";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { LandingPage } from "@/components/landing-page";

jest.mock("next/navigation", () => ({ redirect: jest.fn() }));
jest.mock("@clerk/nextjs/server", () => ({ auth: jest.fn() }));

beforeEach(() => {
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "test";
  process.env.CLERK_SECRET_KEY = "test";
});

test("redirects signed-in visitors from the marketing page to the dashboard", async () => {
  (auth as unknown as jest.Mock).mockResolvedValue({ userId: "user_1" });
  await Home();
  expect(redirect).toHaveBeenCalledWith("/dashboard");
});

test("renders the public landing page for signed-out visitors", async () => {
  (auth as unknown as jest.Mock).mockResolvedValue({ userId: null });
  const element = await Home();
  expect(element.type).toBe(LandingPage);
  expect(redirect).not.toHaveBeenCalled();
});

test("renders the landing page without calling Clerk when auth is not configured", async () => {
  delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  delete process.env.CLERK_SECRET_KEY;
  const element = await Home();
  expect(auth).not.toHaveBeenCalled();
  expect(element.type).toBe(LandingPage);
});
