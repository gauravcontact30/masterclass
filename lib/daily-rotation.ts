/**
 * Daily rotation for the landing page sections. `day` is the India-calendar day number (istDay in
 * lib/server/landing-daily.ts), computed once on the server and passed down, so the server HTML and hydration agree
 * and every section turns over together at midnight IST. Pure: safe in the landing bundle.
 */

/** The list starting at today's offset, wrapping round; `stride` steps further each day (a full page, say). */
export function rotateDaily<T>(list: readonly T[], day: number, stride = 1): T[] {
  if (!list.length) return [];
  const start = (((day * stride) % list.length) + list.length) % list.length;
  return [...list.slice(start), ...list.slice(0, start)];
}

/** Today's item of a list. */
export const pickDaily = <T,>(list: readonly T[], day: number): T => rotateDaily(list, day)[0];

/** `count` items for today: every item is shown before any repeats. */
export const takeDaily = <T,>(list: readonly T[], day: number, count: number): T[] => rotateDaily(list, day, count).slice(0, count);
