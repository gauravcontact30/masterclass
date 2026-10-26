/** @jest-environment node */
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { cacheFetch, checkRateLimit, redis } from "@/lib/redis";
jest.mock("@/lib/env", () => ({ env: { UPSTASH_REDIS_REST_URL: "https://redis.example", UPSTASH_REDIS_REST_TOKEN: "test" } }));
jest.mock("@upstash/redis", () => ({ Redis: jest.fn(() => ({ get: jest.fn().mockResolvedValue(null), set: jest.fn().mockResolvedValue("OK") })) }));
jest.mock("@upstash/ratelimit", () => ({ Ratelimit: Object.assign(jest.fn(() => ({ limit: jest.fn().mockResolvedValue({ success: true, remaining: 59, reset: 1000 }) })), { slidingWindow: jest.fn(() => "policy") }) }));
const redisOptions = jest.mocked(Redis).mock.calls[0][0] as { signal: () => AbortSignal; retry: boolean };

test("Redis uses a fresh bounded timeout for every request and avoids retry amplification", () => {
  const options = redisOptions;
  expect(options.retry).toBe(false);
  expect(options.signal()).not.toBe(options.signal());
});

test("concurrent cache misses share one backend operation", async () => {
  let finish!: (value: string) => void;
  const fetcher = jest.fn(() => new Promise<string>(resolve => { finish = resolve; }));
  const requests = Array.from({ length: 20 }, () => cacheFetch("concurrent", fetcher));
  await Promise.resolve(); await Promise.resolve();
  expect(fetcher).toHaveBeenCalledTimes(1);
  finish("result");
  expect(await Promise.all(requests)).toEqual(Array(20).fill("result"));
  expect(redis.set).toHaveBeenCalledTimes(1);
});

test("failed computations can be retried", async () => {
  await expect(cacheFetch("retry", async () => { throw new Error("offline"); })).rejects.toThrow("offline");
  await expect(cacheFetch("retry", async () => "recovered")).resolves.toBe("recovered");
});

test("remote rate limits honor the caller's quota and window", async () => {
  await checkRateLimit("browser", 60, 60);
  expect(Ratelimit.slidingWindow).toHaveBeenCalledWith(60, "60 s");
  await checkRateLimit("browser", 5, 10);
  expect(Ratelimit.slidingWindow).toHaveBeenCalledWith(5, "10 s");
});
