/** @jest-environment node */
import { reportCache } from "@/lib/server/report-cache";
test("coalesces reads, expires results, retries failures and invalidates mutations", async () => {
  jest.useFakeTimers();
  try {
    const cache = reportCache<number>(1000);
    const read = jest.fn().mockResolvedValue(1);
    expect(await Promise.all([cache.get("a", read), cache.get("a", read)])).toEqual([1, 1]);
    expect(read).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1001);
    await cache.get("a", read);
    expect(read).toHaveBeenCalledTimes(2);
    cache.clear();
    await cache.get("a", read);
    expect(read).toHaveBeenCalledTimes(3);
    const failure = jest.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(2);
    await expect(cache.get("b", failure)).rejects.toThrow("offline");
    expect(await cache.get("b", failure)).toBe(2);
  } finally { jest.useRealTimers(); }
});
