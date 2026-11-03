import type { PeriodSummary, StreamVisitor } from "./live-visits";

/**
 * Re-checks the Live command centre's figures on every refresh, before they are presented as verified (user request
 * 2026-11-03). Each check tests the figures a different way: how recent the read is, whether the read is whole, a recount
 * of the raw rows, the database's own report, and whether the figures agree with each other. Pure, so it can be run on real
 * rows from a script. A failed check never hides a figure; it says which figure is in doubt and why.
 */
export type LiveCheck = { id: string; label: string; ok: boolean; detail: string };
export type VerifyInput = {
  now: number; dayStart: number;
  /** The stream's rows as held in the browser, before people are grouped. */
  rows: readonly { event: string; created_at: string; visitor_id: string; session_id: string }[];
  /** Today, and the rolling 24 hours, as the tiles show them. */
  today: PeriodSummary; day: PeriodSummary;
  /** Today counted with visitors under a second kept in: the only people the tiles leave out on purpose. */
  todayAll: PeriodSummary;
  visitors: readonly StreamVisitor[];
  /** The latest read failed, or has not come back, so the figures are the last good ones. */
  stale: boolean; capped: boolean; readAt: number | null;
  /** The database report's count of the same rows; null when it has not loaded or covers another window. */
  report: { pageViews: number; visitors: number; sessions?: number } | null;
};

/** Older than this, a read counts as out of date: three missed refreshes. */
export const MAX_READ_AGE_MS = 20_000;
/** Rows this recent may have landed between the stream's read and the report's, so a difference this size is not an error. */
const IN_FLIGHT_MS = 20_000;
const FUTURE_MS = 2 * 60_000;

export function verifyLiveFigures(input: VerifyInput): LiveCheck[] {
  const { now, dayStart, rows, today, day, todayAll, visitors, stale, capped, readAt, report } = input;
  const age = readAt == null ? Infinity : now - readAt;
  const views = rows.filter(row => row.event === "page_view");
  const viewsToday = views.filter(row => Date.parse(row.created_at) >= dayStart);
  const inFlight = viewsToday.filter(row => Date.parse(row.created_at) >= now - IN_FLIGHT_MS).length;
  const cookies = new Set(viewsToday.map(row => row.visitor_id)).size, sessions = new Set(viewsToday.map(row => row.session_id)).size;
  const live = visitors.filter(v => v.live).length, active = visitors.filter(v => v.lastAt >= now - 30 * 60_000).length;
  const future = rows.filter(row => Date.parse(row.created_at) > now + FUTURE_MS).length;
  const hidden = todayAll.views - today.views, deviceTotal = today.devices.reduce((sum, d) => sum + d.people, 0), hourTotal = today.hours.reduce((sum, n) => sum + n, 0);
  const split = today.signedIn + today.newVisitors + today.returning;
  const close = (a: number, b: number) => Math.abs(a - b) <= inFlight;

  return [
    { id: "fresh", label: "Latest data", ok: !stale && age <= MAX_READ_AGE_MS, detail: stale ? "The last read failed, so these are the last good figures. Retrying." : age <= MAX_READ_AGE_MS ? "Read from the database within the last 20 seconds." : "No fresh read yet." },
    { id: "complete", label: "Whole data set", ok: !capped, detail: capped ? "More rows than one read can hold: the database report stands in for today's figures." : `All ${rows.length.toLocaleString("en-IN")} rows of the kept window were read.` },
    { id: "recount", label: "Raw row recount", ok: todayAll.views === viewsToday.length, detail: `${viewsToday.length} page views in the raw rows today, ${todayAll.views} after grouping into people${hidden > 0 ? `, ${hidden} of them from visitors under a second, left out of the tiles` : ""}.` },
    report
      ? { id: "database", label: "Database report", ok: close(report.pageViews, viewsToday.length) && close(report.visitors, cookies) && (report.sessions == null || close(report.sessions, sessions)), detail: `Report: ${report.pageViews} views, ${report.visitors} browsers${report.sessions == null ? "" : `, ${report.sessions} visits`}. Stream: ${viewsToday.length} views, ${cookies} browsers, ${sessions} visits.` }
      : { id: "database", label: "Database report", ok: true, detail: "Not compared on this read: the report has not loaded or covers another window." },
    { id: "split", label: "New and returning", ok: split === today.people, detail: `${today.signedIn} signed in + ${today.newVisitors} new + ${today.returning} returning = ${split}, against ${today.people} visitors today.` },
    { id: "totals", label: "Figures agree", ok: hourTotal === today.views && deviceTotal === today.people && today.sessions >= today.people && today.views >= today.sessions, detail: `Hourly bars add up to ${hourTotal} of ${today.views} views, devices to ${deviceTotal} of ${today.people} visitors, ${today.sessions} visits.` },
    { id: "order", label: "Time windows nest", ok: live <= active && active <= day.people && future === 0, detail: `${live} on the site now, ${active} active in 30 minutes, ${day.people} in 24 hours${future ? `; ${future} rows are stamped in the future` : ""}.` },
  ];
}
