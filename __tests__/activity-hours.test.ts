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

test("each hour lists the sections and cards clicked, its visitors, signed-in users and routes", () => {
  const report = activityHours([
    visit("2026-10-19T03:00:00.000Z", { user_id: "user-a", email: "a@example.test", path: "/dashboard", title: "Dashboard", new_visitor: true, city: "Pune", country: "IN" }),
    visit("2026-10-19T03:10:00.000Z", { user_id: "user-a", email: "a@example.test", path: "/dashboard/certifications" }),
    visit("2026-10-19T03:20:00.000Z", { visitor_id: "browser-b", session_id: "session-b", path: "/dashboard" }),
  ], "2026-10-19", [
    { created_at: "2026-10-19T03:11:00.000Z", visitor_id: "browser-a", user_id: "user-a", path: "/dashboard/certifications", topic: "Certification tracks", option: "AWS certifications" },
    { created_at: "2026-10-19T03:12:00.000Z", visitor_id: "browser-a", user_id: "user-a", path: "/dashboard/certifications", topic: "Certification tracks", option: "n8n automation" },
    { created_at: "2026-10-19T09:00:00.000Z", visitor_id: "browser-b", user_id: null, path: "/", topic: "Hero", option: "Sign up" },
  ]);
  const details = report.hours[8].details;
  expect(details.clicks).toBe(2);
  expect(details.sections).toEqual([{ section: "Certification tracks", clicks: 2, visitors: 1 }]);
  expect(details.cards.map(card => card.card)).toEqual(["AWS certifications", "n8n automation"]);
  // The signed-in visitor's path interleaves their pages and clicks in time order.
  expect(details.journeys[0].visitor).toBe("browser-");
  expect(details.journeys.find(j => j.email)?.steps.map(step => step.kind === "view" ? step.path : step.card)).toEqual(["/dashboard", "/dashboard/certifications", "AWS certifications", "n8n automation"]);
  expect(details.visitors[0]).toMatchObject({ email: "a@example.test", views: 2, routes: 2, clicks: 2, place: "Pune, IN", newVisitor: true });
  expect(details.users).toEqual([expect.objectContaining({ email: "a@example.test", views: 2, sessions: 1, clicks: 2 })]);
  expect(details.routes[0]).toMatchObject({ path: "/dashboard", title: "Dashboard", views: 2, visitors: 2, signedIn: 1 });
  expect(report.hours[14].details.clicks).toBe(1);
});
