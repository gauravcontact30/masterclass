/** @jest-environment node */
import { account } from "@/lib/server/repository";
import { db } from "@/lib/server/db";

jest.mock("@/lib/server/db", () => ({
  db: jest.fn(),
  check: ({ data, error }: { data: unknown; error: unknown }) => { if (error) throw error; return data; },
}));

beforeEach(() => {
  process.env.FREE_MONTHLY_GENERATIONS = "3";
  process.env.PRO_MONTHLY_GENERATIONS = "50";
});

test("surfaces the purchased download-credit balance alongside the monthly quota", async () => {
  const tables: Record<string, unknown> = {
    profiles: {
      upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: "u1", language: "en", credit_balance: 2 }, error: null }),
    },
    subscriptions: {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    },
    usage_periods: {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { used: 1 }, error: null }),
    },
  };
  (db as jest.Mock).mockReturnValue({ from: (table: string) => tables[table] });

  const result = await account("u1");

  expect(result.creditBalance).toBe(2);
});
