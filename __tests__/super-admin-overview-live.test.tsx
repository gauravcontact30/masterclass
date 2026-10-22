import { render, screen } from "@testing-library/react";
import { OverviewLive } from "@/components/super-admin-overview-live";

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
const base = { visitor_id: "visitor-1", country: "IN", city: "Delhi", device: "desktop" };

const clock = (iso: string) => new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).format(new Date(iso));
const dayOf = (iso: string) => new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(iso));

test("lists each visitor once, with exact arrival and leaving times", async () => {
  const arrived = ago(7 * 60_000), leftAt = ago(20 * 60_000);
  const live = {
    generatedAt: ago(0), totals: { liveNow: 1, liveSignedIn: 1, pageViews: 4, visitors: 2, bounceRate: null, avgSessionSeconds: null }, hours: [],
    recent: [
      { ...base, created_at: ago(90_000), event: "page_view", person: "user-1", email: "learner@example.test", session_id: "session-1", path: "/learn" },
      { ...base, created_at: ago(5 * 60_000), event: "page_leave", person: "user-1", session_id: "session-1", path: "/pricing", duration_ms: 125_000 },
      { ...base, created_at: arrived, event: "page_view", person: "user-1", email: "learner@example.test", session_id: "session-1", path: "/pricing" },
      { ...base, visitor_id: "visitor-2", created_at: leftAt, event: "page_leave", session_id: "session-2", path: "/workflows", duration_ms: 60_000 },
      { ...base, visitor_id: "visitor-2", created_at: ago(21 * 60_000), event: "page_view", new_visitor: true, session_id: "session-2", path: "/workflows" },
    ],
    people: [{ person: "user-1", sessions: 2, engaged_seconds: 600, first_seen: ago(3600_000) }],
  };
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => live });
  render(<OverviewLive snapshot={null} onRefreshSnapshot={() => {}} />);
  // Two page views from the learner become one row, on their latest page, which is still being read.
  expect(await screen.findByText("learner@example.test")).toBeVisible();
  expect(screen.getAllByText("learner@example.test")).toHaveLength(1);
  expect(screen.getByText(/1m 3\ds · reading/)).toBeVisible();
  expect(screen.getByText(/2 page views · 2 pages/)).toBeVisible();
  // Total = 600 s engaged + the ~90 s of the page still open.
  expect(screen.getByText(/11m 3\ds on site · 2 sessions/)).toBeVisible();
  expect(screen.getByText(clock(arrived))).toBeVisible();
  expect(screen.getByText("On the site now", { selector: "b" })).toBeVisible();
  // Each row has its own Date column, separate from the Arrived and Left times.
  expect(screen.getAllByText(dayOf(arrived)).length).toBeGreaterThanOrEqual(1);
  // The anonymous visitor left: their leave beacon is the exact Left time.
  expect(screen.getByText("New visitor")).toBeVisible();
  expect(screen.getByText(clock(leftAt))).toBeVisible();
  expect(screen.getByText("20m ago")).toBeVisible();
  expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  expect(screen.getByText(/2 visitors · 3 views in 24 h/)).toBeVisible();
});

test("the stream reads its own five-day feed, so older visitors still show", async () => {
  const live = { generatedAt: ago(0), totals: { liveNow: 0, liveSignedIn: 0, pageViews: 0, visitors: 0, bounceRate: null, avgSessionSeconds: null }, hours: [], recent: [], people: [] };
  const old = ago(3 * 86_400_000);
  const stream = { days: 5, visits: [{ ...base, visitor_id: "visitor-9", created_at: old, event: "page_view", person: "visitor:visitor-9", email: null, new_visitor: false, session_id: "s-9", path: "/compare" }] };
  global.fetch = jest.fn(async (url: RequestInfo | URL) => ({ ok: true, json: async () => String(url).includes("/activity/stream") ? stream : live })) as jest.Mock;
  render(<OverviewLive snapshot={null} onRefreshSnapshot={() => {}} />);
  expect(await screen.findByText("Returning visitor")).toBeVisible();
  expect(screen.getByText(/1 visitor · 1 views in the last 5 days/)).toBeVisible();
  expect(screen.getByText(dayOf(old))).toBeVisible();
});
