/** @jest-environment node */
import { userId } from "@/lib/server/http";
import { supabaseServer } from "@/lib/server/auth";

jest.mock("@/lib/server/auth", () => ({ supabaseServer: jest.fn() }));

function session(user: { id: string } | null) {
  (supabaseServer as jest.Mock).mockResolvedValue({ auth: { getUser: async () => ({ data: { user }, error: null }) } });
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
});

test("resolves the Supabase user id for a signed-in visitor", async () => {
  session({ id: "3f1c2e04-0000-4000-8000-000000000001" });
  await expect(userId()).resolves.toBe("3f1c2e04-0000-4000-8000-000000000001");
});

test("rejects with signin_required when there is no session", async () => {
  session(null);
  await expect(userId()).rejects.toMatchObject({ status: 401, code: "signin_required" });
});

test("rejects with setup_required before Supabase auth is configured", async () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  session({ id: "any" });
  await expect(userId()).rejects.toMatchObject({ status: 503, code: "setup_required" });
});
