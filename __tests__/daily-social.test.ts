import { dailySocial, dayBounds, reportDay, type DailyEvent } from "@/lib/daily-social";
const event = (values: Partial<DailyEvent> = {}): DailyEvent => ({ id: "1", created_at: "2026-10-18T18:30:00.000Z", event: "page_view", visitor_id: "browser-1", session_id: "session-1", user_id: null, path: "/", utm_source: "instagram", utm_medium: "social", utm_campaign: "launch", referrer_host: null, ...values });

test("daily windows use India midnight, including exact boundary events", () => {
  expect(reportDay(new Date("2026-10-18T18:30:00Z"))).toBe("2026-10-19");
  expect(dayBounds("2026-10-19")).toEqual({ since: "2026-10-18T18:30:00.000Z", until: "2026-10-19T18:30:00.000Z" });
  const data = dailySocial([event({ created_at: "2026-10-18T18:30:00+00:00" }), event({ id: "2", created_at: "2026-10-19T18:30:00.000Z" })], "2026-10-19");
  expect(data.totals.views).toBe(1);
});

test("social attribution follows a visitor through routes and topic clicks across midnight", () => {
  const data = dailySocial([
    event({ created_at: "2026-10-18T18:29:00.000Z" }),
    event({ id: "2", path: "/learning/techy", utm_source: null, utm_campaign: null }),
    event({ id: "3", created_at: "2026-10-18T18:31:00.000Z", event: "interaction", path: "/learning/techy", utm_source: null, topic: "React", option: "Next lesson" }),
    event({ id: "4", visitor_id: "browser-2", session_id: "session-2", utm_source: null, utm_campaign: null }),
  ], "2026-10-19");
  expect(data.totals).toEqual({ visitors: 2, views: 2, clicks: 1 });
  expect(data.platforms.find(row => row.platform === "Instagram")).toMatchObject({ visitors: 1, views: 1, clicks: 1, dashboard: 1 });
  expect(data.matrix.find(row => row.option === "Next lesson")).toMatchObject({ topic: "React", route: "/learning/techy", platform: "Instagram" });
  expect(data.platforms.find(row => row.platform === "Direct / unknown")?.visitors).toBe(1);
  expect(data.traces[0].id).toBe("3");
});

test("admin routes are excluded and later social clicks do not rewrite earlier direct visits", () => {
  const data = dailySocial([event({ utm_source: null }), event({ id: "2", created_at: "2026-10-18T18:31:00.000Z", utm_source: "facebook" }), event({ id: "3", path: "/super-admin" })], "2026-10-19");
  expect(data.traces).toHaveLength(2);
  expect(data.traces.find(row => row.id === "1")?.platform).toBe("Direct / unknown");
});

test("visitor sessions use email and city and sum recorded duration without inflating views", () => {
  const data = dailySocial([
    event({ user_id: "user-1", email: "learner@example.test", city: "Delhi", region: "DL", country: "IN" }),
    event({ id: "2", event: "page_leave", created_at: "2026-10-18T18:32:00.000Z", duration_ms: 120_000, user_id: "user-1", email: "learner@example.test", city: "Delhi" }),
    event({ id: "3", created_at: "2026-10-18T18:33:00.000Z", path: "/learning", user_id: "user-1", email: "learner@example.test" }),
    event({ id: "4", event: "page_leave", created_at: "2026-10-18T18:34:00.000Z", duration_ms: 60_000, path: "/learning" }),
  ], "2026-10-19");
  expect(data.visitors).toHaveLength(1);
  expect(data.visitors[0]).toMatchObject({ email: "learner@example.test", city: "Delhi", region: "DL", country: "IN", duration: 180_000, time: "2026-10-18T18:30:00.000Z" });
  expect(data.totals.views).toBe(2);
  expect(data.totals.clicks).toBe(0);
});

test("missing duration stays unknown and reading time is clipped at midnight", () => {
  expect(dailySocial([event()], "2026-10-19").visitors[0]).toMatchObject({ email: "Anonymous", city: "Not available", duration: null });
  const data = dailySocial([event({ event: "page_leave", created_at: "2026-10-18T18:31:00.000Z", duration_ms: 300_000 })], "2026-10-19");
  expect(data.visitors[0].duration).toBe(60_000);
});
