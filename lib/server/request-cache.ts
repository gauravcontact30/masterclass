import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";

// A route handler has no React render cache. Keep deduplication within its own
// async context: sessions must never enter a process-wide or cross-request cache.
const requests = new AsyncLocalStorage<Map<symbol, Promise<unknown>>>();
export const AUTH_USER = Symbol("authenticated-user");

export function withRequestCache<T>(action: () => Promise<T>): Promise<T> {
  return requests.run(new Map(), action);
}

export function requestOnce<T>(key: symbol, read: () => Promise<T>): Promise<T> {
  const store = requests.getStore();
  if (!store) return read();
  const pending = store.get(key);
  if (pending) return pending as Promise<T>;
  const result = Promise.resolve().then(read);
  store.set(key, result);
  return result;
}
