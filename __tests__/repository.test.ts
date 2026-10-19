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

test("account starts independent subscription and usage reads before the profile resolves", async () => {
  let release!: (value: { data: null; error: null }) => void;
  const profileWrite = new Promise<{ data: null; error: null }>(resolve => { release = resolve; });
  const subscription = jest.fn().mockResolvedValue({ data: null, error: null });
  const usage = jest.fn().mockResolvedValue({ data: { used: 2 }, error: null });
  const tables = {
    profiles: { upsert: () => profileWrite, select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: async () => ({ data: { id: "u1", credit_balance: 0 }, error: null }) },
    subscriptions: { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: subscription },
    usage_periods: { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: usage },
  };
  jest.mocked(db).mockReturnValue({ from: (name: keyof typeof tables) => tables[name] } as unknown as ReturnType<typeof db>);
  const pending = account("u1");
  expect(subscription).toHaveBeenCalledTimes(1);
  expect(usage).toHaveBeenCalledTimes(1);
  release({ data: null, error: null });
  expect((await pending).used).toBe(2);
});
