import { periodSummary, type StreamVisitor } from "./live-visits";

/*
 * Overview → "Visitors by hour": the site's visitors in one-hour slots on the 24-hour IST clock (00:00–23:59).
 * Every slot is counted from the Live visitor stream's people (lib/live-visits.ts periodSummary), so the figures agree
 * with every other panel on the Overview and User activities: crawlers, automated browsers (lib/visit-quality.ts),
 * the site's own machines and visitors under a second left out; one person per signed-in account or linked device.
 */
export const HOUR_MS = 3_600_000;
const IST_MS = 19_800_000, DAY_MS = 86_400_000;

export type HourWindow = "24h" | "today" | "yesterday";
export type HourSlot = {
  /** Start of the slot (ms since epoch), on an IST hour boundary. */
  start: number;
  /** The slot's IST clock hour, 0–23. */
  hour: number;
  /** Different people with a page on screen in this hour (one person can appear in several hours). */
  people: number;
  /** People whose first visit ever began in this hour. */
  newVisitors: number;
  signedIn: number;
  views: number;
  topCountry: string | null;
  /** The slot holds the current moment. */
  current: boolean;
  /** The slot has not started yet (later today). */
  future: boolean;
};
export type HourlyVisitors = {
  slots: HourSlot[];
  /** The hours with the most visitors (ties all count); empty while nobody has visited. */
  peakHours: number[];
  peakPeople: number;
  /** Different people across the whole window (a person seen in several hours counts once). */
  people: number;
  newVisitors: number;
  views: number;
  activeHours: number;
};

/** The start of the IST hour holding `ms`. IST has no daylight saving, so every hour is exactly an hour. */
export const istHourStart = (ms: number) => Math.floor((ms + IST_MS) / HOUR_MS) * HOUR_MS - IST_MS;
const istMidnight = (ms: number) => Math.floor((ms + IST_MS) / DAY_MS) * DAY_MS - IST_MS;
const istHourOf = (ms: number) => new Date(ms + IST_MS).getUTCHours();

/** The 24 slot starts for a window: the last 24 clock hours up to the current one, today, or yesterday. */
export function slotStarts(window: HourWindow, now: number): number[] {
  const first = window === "24h" ? istHourStart(now) - 23 * HOUR_MS : istMidnight(now) - (window === "yesterday" ? DAY_MS : 0);
  return Array.from({ length: 24 }, (_, i) => first + i * HOUR_MS);
}

export function hourlyVisitors(everyone: StreamVisitor[], window: HourWindow, now: number, ownHosts: string[] = []): HourlyVisitors {
  const starts = slotStarts(window, now);
  const slots = starts.map((start): HourSlot => {
    const future = start > now;
    const sum = future ? null : periodSummary(everyone, start, start + HOUR_MS, ownHosts);
    return {
      start, hour: istHourOf(start), current: now >= start && now < start + HOUR_MS, future,
      people: sum?.people ?? 0, newVisitors: sum?.newVisitors ?? 0, signedIn: sum?.signedIn ?? 0, views: sum?.views ?? 0,
      topCountry: sum?.countries.find(c => c.country !== "Unknown")?.country ?? null,
    };
  });
  const whole = periodSummary(everyone, starts[0], starts[23] + HOUR_MS, ownHosts);
  const peakPeople = Math.max(0, ...slots.map(s => s.people));
  return {
    slots, peakPeople, peakHours: peakPeople ? slots.filter(s => s.people === peakPeople).map(s => s.hour) : [],
    people: whole.people, newVisitors: whole.newVisitors, views: whole.views, activeHours: slots.filter(s => s.people > 0).length,
  };
}

const clock = (hour: number) => `${String(hour).padStart(2, "0")}:00:00`;
/** "14:00:00–15:00:00": an hour span on the 24-hour clock, HH:MM:SS; the day's last hour ends at 24:00:00. */
export const hourSpan = (hour: number) => `${clock(hour)}–${clock(hour + 1)}`;
/** "14:07:32": a moment on the 24-hour IST clock, HH:MM:SS. */
export const istClock = (ms: number) => new Date(ms + IST_MS).toISOString().slice(11, 19);
