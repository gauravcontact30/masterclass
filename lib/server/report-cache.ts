import "server-only";

/** Bounded per-process cache; callers must authorize before reading it. Coalesces concurrent refreshes. */
export function reportCache<T>(ttlMs: number, maxEntries = 12) {
  const entries = new Map<string, { expires: number; promise: Promise<T> }>();
  return {
    clear: () => entries.clear(),
    get(key: string, read: () => Promise<T>): Promise<T> {
      const previous = entries.get(key);
      if (previous && previous.expires > Date.now()) return previous.promise;
      if (entries.size >= maxEntries) entries.delete(entries.keys().next().value!);
      const entry = { expires: Infinity, promise: Promise.resolve().then(read) };
      entries.set(key, entry);
      entry.promise.then(() => { entry.expires = Date.now() + ttlMs; }, () => { if (entries.get(key) === entry) entries.delete(key); });
      return entry.promise;
    },
  };
}
