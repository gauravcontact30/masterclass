/**
 * `next/cache` for Jest. Cache Components APIs only mean something inside the Next.js compiler and runtime; under
 * Jest, `use cache` is a plain string, so cacheLife/cacheTag are no-ops and the invalidation helpers are spies.
 * The real module also pulls in Next's server runtime, which needs web globals jsdom does not provide.
 */
export const cacheLife = (): void => {};
export const cacheTag = (): void => {};
export const revalidateTag = jest.fn();
export const revalidatePath = jest.fn();
export const updateTag = jest.fn();
export const refresh = jest.fn();
export const unstable_cache = <T extends (...args: never[]) => unknown>(fn: T) => fn;
export const unstable_noStore = (): void => {};
