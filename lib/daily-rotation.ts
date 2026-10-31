/**
 * Rotation for the landing page and dashboard sections. `day` is the period number, now the India-calendar week
 * (istWeek in lib/ist-week.ts, user rule 2026-10-31), computed once on the server and passed down, so the server HTML
 * and hydration agree and every section turns over together on Monday at 00:00 IST. Pure: safe in the landing bundle.
 * The names keep "Daily" from when the period was a day.
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
