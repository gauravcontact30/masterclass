import { periodSummary, type StreamVisitor } from "./live-visits";

/*
 * Overview → "Visitors by hour": one IST calendar day, midnight to midnight (00:00:00–24:00:00), in 24 one-hour slots.
 * Every slot is counted from the Live visitor stream's people (lib/live-visits.ts periodSummary), so the figures agree
 * with every other panel on the Overview and User activities: crawlers, automated browsers (lib/visit-quality.ts),
 * the site's own machines and visitors under a second left out; one person per signed-in account or linked device.
 */
export const HOUR_MS = 3_600_000;
const IST_MS = 19_800_000, DAY_MS = 86_400_000;

export type HourSlot = {
  /** Start of the slot (ms since epoch), on an IST hour boundary. */
  start: number;
  /** The slot's IST clock hour, 0–23. */
  hour: number;
  /** Different people who opened a page in this hour (one person can appear in several hours). */
  people: number;
  /** People whose first visit ever began in this hour. */
  newVisitors: number;
  /** Guests seen before this hour (not signed in, not new). */
  returning: number;
  signedIn: number;
  views: number;
  /** Time on screen of the pages opened in this hour (leave beacons and open pages' heartbeats). */
  readingMs: number;
  topCountry: string | null;
  topSource: string | null;
  /** 1, 2 or 3 for the three hours with the most visitors (ties broken by page views, then the earlier hour). */
  rank: number | null;
  /** The slot holds the current moment. */
  current: boolean;
  /** The slot has not started yet (later today). */
  future: boolean;
};
export type HourlyVisitors = {
  /** 00:00:00 IST of the day shown. */
  dayStart: number;
  slots: HourSlot[];
  /** The top three hours, best first (fewer when fewer hours had visitors). */
  top: HourSlot[];
  /** Different people across the day (a person seen in several hours counts once). */
  people: number;
  newVisitors: number;
  views: number;
  activeHours: number;
};

/** The start of the IST hour holding `ms`. IST has no daylight saving, so every hour is exactly an hour. */
export const istHourStart = (ms: number) => Math.floor((ms + IST_MS) / HOUR_MS) * HOUR_MS - IST_MS;
/** 00:00:00 IST of the day holding `ms`. */
export const istDayStart = (ms: number) => Math.floor((ms + IST_MS) / DAY_MS) * DAY_MS - IST_MS;
const istHourOf = (ms: number) => new Date(ms + IST_MS).getUTCHours();

/** The 24 slot starts of the IST day `daysAgo` days before the one holding `now` (0 = today). */
export function slotStarts(daysAgo: number, now: number): number[] {
  const first = istDayStart(now) - daysAgo * DAY_MS;
  return Array.from({ length: 24 }, (_, i) => first + i * HOUR_MS);
}

export function hourlyVisitors(everyone: StreamVisitor[], daysAgo: number, now: number, ownHosts: string[] = []): HourlyVisitors {
  const starts = slotStarts(daysAgo, now);
  const slots = starts.map((start): HourSlot => {
    const end = start + HOUR_MS, future = start > now;
    const sum = future ? null : periodSummary(everyone, start, end, ownHosts);
    let readingMs = 0;
    if (!future) for (const v of everyone) for (const visit of v.visits) for (const step of visit.steps) if (step.at >= start && step.at < end && step.ms != null) readingMs += step.ms;
    return {
      start, hour: istHourOf(start), current: now >= start && now < end, future, rank: null, readingMs,
      people: sum?.people ?? 0, newVisitors: sum?.newVisitors ?? 0, returning: sum?.returning ?? 0, signedIn: sum?.signedIn ?? 0, views: sum?.views ?? 0,
      topCountry: sum?.countries.find(c => c.country !== "Unknown")?.country ?? null, topSource: sum?.sources[0]?.source ?? null,
    };
  });
  const top = slots.filter(s => s.people > 0).sort((a, b) => b.people - a.people || b.views - a.views || a.hour - b.hour).slice(0, 3);
  top.forEach((slot, i) => { slot.rank = i + 1; });
  const whole = periodSummary(everyone, starts[0], starts[23] + HOUR_MS, ownHosts);
  return { dayStart: starts[0], slots, top, people: whole.people, newVisitors: whole.newVisitors, views: whole.views, activeHours: slots.filter(s => s.people > 0).length };
}

const clock = (hour: number) => `${String(hour).padStart(2, "0")}:00:00`;
/** "14:00:00–15:00:00": an hour span on the 24-hour clock, HH:MM:SS; the day's last hour ends at 24:00:00. */
export const hourSpan = (hour: number) => `${clock(hour)}–${clock(hour + 1)}`;
/** "14:07:32": a moment on the 24-hour IST clock, HH:MM:SS. */
export const istClock = (ms: number) => new Date(ms + IST_MS).toISOString().slice(11, 19);
