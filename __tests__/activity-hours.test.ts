/** @jest-environment node */
import { activityHours, type HourVisit } from "@/lib/activity-hours";

const visit = (created_at: string, overrides: Partial<HourVisit> = {}): HourVisit => ({ created_at, visitor_id: "browser-a", session_id: "session-a", user_id: null, path: "/", ...overrides });

test("daily hours use IST midnight and exclude both adjacent dates", () => {
  const report = activityHours([
    visit("2026-10-18T18:29:59.000Z"),
    visit("2026-10-18T18:30:00+00:00"),
    visit("2026-10-19T18:29:59.000Z", { path: "/learn" }),
    visit("2026-10-19T18:30:00.000Z"),
  ], "2026-10-19");
  expect(report.hours).toHaveLength(24);
  expect(report.totals.views).toBe(2);
  expect(report.hours[0].views).toBe(1);
  expect(report.hours[23].pages).toEqual([{ path: "/learn", views: 1 }]);
});

test("daily people and sessions are deduplicated across hours", () => {
  const report = activityHours([
    visit("2026-10-19T03:00:00.000Z", { user_id: "user-a" }),
    visit("2026-10-19T03:05:00.000Z", { user_id: "user-a" }),
    visit("2026-10-19T04:00:00.000Z", { user_id: "user-a" }),
    visit("2026-10-19T04:05:00.000Z", { visitor_id: "browser-b" }),
  ], "2026-10-19");
  expect(report.totals).toEqual({ views: 4, visitors: 2, signedIn: 1, sessions: 2 });
  expect(report.hours[8]).toMatchObject({ views: 2, visitors: 1, signedIn: 1, sessions: 1 });
  expect(report.hours[8]).toMatchObject({ routes: 1, firstSeen: "2026-10-19T03:00:00.000Z", lastSeen: "2026-10-19T03:05:00.000Z" });
  expect(report.hours[0]).toMatchObject({ routes: 0, firstSeen: null, lastSeen: null });
  expect(activityHours([], "2026-10-19").hours.every(row => row.views === 0)).toBe(true);
});
