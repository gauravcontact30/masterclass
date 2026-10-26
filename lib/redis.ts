import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { env } from "./env";

/**
 * In-memory fallback Redis cache for local development, offline mode, and testing.
 */
class MemoryRedisStore {
  private store = new Map<string, { value: string; expiresAt: number | null }>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt !== null && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    try {
      return JSON.parse(item.value) as T;
    } catch {
      return item.value as unknown as T;
    }
  }

  async set(key: string, value: unknown, options?: { ex?: number }): Promise<"OK"> {
    // Expired keys otherwise accumulate forever when they are never read again.
    if (this.store.size >= 5000) {
      const now = Date.now();
      for (const [name, entry] of this.store) if (entry.expiresAt !== null && entry.expiresAt <= now) this.store.delete(name);
      if (this.store.size >= 5000) this.store.delete(this.store.keys().next().value!);
    }
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    const expiresAt = options?.ex ? Date.now() + options.ex * 1000 : null;
    this.store.set(key, { value: serialized, expiresAt });
    return "OK";
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async flushall(): Promise<"OK"> {
    this.store.clear();
    return "OK";
  }
}

const memoryStore = new MemoryRedisStore();

/**
 * Primary Redis client (Upstash or in-memory fallback)
 */
export const redis =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
        retry: false,
        signal: () => AbortSignal.timeout(1500),
      })
    : (memoryStore as unknown as Redis);

/**
 * Primary Upstash Ratelimit instance
 */
export const ratelimiter =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(20, "10 s"),
        analytics: true,
        prefix: "masterclass:ratelimit",
      })
    : null;
const limiters = new Map<string, Ratelimit>();
const pendingFetches = new Map<string, Promise<unknown>>();

/**
 * Universal caching utility with TTL and transparent serialization.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get<T>(key);
    return raw ?? null;
  } catch {
    return null;
  }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch {
    // Non-blocking cache write failure
  }
}

export async function cacheDelete(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch {
    // Non-blocking cache delete failure
  }
}

/**
 * Stale-while-revalidate or Cache-aside pattern helper.
 */
export async function cacheFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 300
): Promise<T> {
  const pending = pendingFetches.get(key);
  if (pending) return pending as Promise<T>;
  const work = (async () => {
    const cached = await cacheGet<T>(key);
    if (cached !== null && cached !== undefined) return cached;
    const fresh = await fetcher();
    await cacheSet(key, fresh, ttlSeconds);
    return fresh;
  })();
  pendingFetches.set(key, work);
  try { return await work; }
  finally { if (pendingFetches.get(key) === work) pendingFetches.delete(key); }
}

/**
 * Rate limit check utility supporting both Upstash and local fallback.
 */
export async function checkRateLimit(
  identifier: string,
  limit = 20,
  windowSeconds = 10
): Promise<{ success: boolean; remaining: number; reset: number }> {
  if (ratelimiter) {
    try {
      const policy = `${limit}:${windowSeconds}`;
      let configured = limiters.get(policy);
      if (!configured) {
        configured = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`), analytics: false, prefix: `masterclass:ratelimit:${policy}` });
        limiters.set(policy, configured);
      }
      const res = await configured.limit(identifier);
      return { success: res.success, remaining: res.remaining, reset: res.reset };
    } catch {
      // Fallback on network/redis error
    }
  }

  // Local fallback sliding window
  const key = `rl:${limit}:${windowSeconds}:${identifier}`;
  const record = await memoryStore.get<{ count: number; start: number }>(key);
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  if (!record || now - record.start > windowMs) {
    await memoryStore.set(key, { count: 1, start: now }, { ex: windowSeconds });
    return { success: true, remaining: limit - 1, reset: now + windowMs };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0, reset: record.start + windowMs };
  }

  record.count += 1;
  await memoryStore.set(key, record, { ex: windowSeconds });
  return { success: true, remaining: limit - record.count, reset: record.start + windowMs };
}
