/**
 * The content week (user rule 2026-10-31): generated and rotating content turns over once a week, at Monday 00:00
 * IST, instead of every day. Pure and dependency-free, so client bundles (the landing page) can import it.
 */
const DAY_MS = 86_400_000;
const IST_MS = 5.5 * 3_600_000;

/** Days since the epoch on the India calendar. */
const istDayNumber = (now: number) => Math.floor((now + IST_MS) / DAY_MS);
/** Weeks since the epoch on the India calendar, each starting on a Monday (1 Jan 1970 was a Thursday). */
export const istWeek = (now = Date.now()) => Math.floor((istDayNumber(now) + 3) / 7);
/** The Monday (YYYY-MM-DD) a week starts on. */
export const weekStartDate = (week: number) => new Date((week * 7 - 3) * DAY_MS).toISOString().slice(0, 10);
/** The Monday of the week a date (YYYY-MM-DD) falls in. */
export const weekOfDate = (date: string) => weekStartDate(Math.floor((Math.floor(Date.parse(`${date}T00:00:00Z`) / DAY_MS) + 3) / 7));

/**
 * The week a scheduled job writes for. On the Hobby plan Vercel may start a cron anywhere within its hour, so the
 * Monday 00:00 IST job can begin up to 30 minutes early; a run in the last hour of a week writes the coming week.
 */
export const scheduledWeek = (now = Date.now()) => istWeek(now + 3_600_000);

/** The next Monday 00:00 IST after `now`, for "next edition" labels. */
export const nextWeekStart = (now = Date.now()) => new Date((((istWeek(now) + 1) * 7 - 3) * DAY_MS) - IST_MS);
