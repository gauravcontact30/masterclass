import { render, screen } from "@testing-library/react";
import { OverviewLive } from "@/components/super-admin-overview-live";

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
const base = { visitor_id: "visitor-1", country: "IN", city: "Delhi", device: "desktop" };

test("each stream row shows time on the page and the person's total time on the platform", async () => {
  const live = {
    generatedAt: ago(0), totals: { liveNow: 1, liveSignedIn: 1, pageViews: 2, visitors: 1, bounceRate: null, avgSessionSeconds: null }, hours: [],
    recent: [
      { ...base, created_at: ago(90_000), event: "page_view", person: "user-1", email: "learner@example.test", session_id: "session-1", path: "/learn" },
      { ...base, created_at: ago(5 * 60_000), event: "page_leave", person: "user-1", session_id: "session-1", path: "/pricing", duration_ms: 125_000 },
      { ...base, created_at: ago(7 * 60_000), event: "page_view", person: "user-1", email: "learner@example.test", session_id: "session-1", path: "/pricing" },
    ],
    people: [{ person: "user-1", sessions: 2, engaged_seconds: 600, first_seen: ago(3600_000) }],
  };
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => live });
  render(<OverviewLive snapshot={null} onRefreshSnapshot={() => {}} />);
  // The latest page has no leave beacon yet, so it is still being read; the earlier one was read for 2m 5s.
  expect(await screen.findByText(/1m 3\ds · reading/)).toBeVisible();
  expect(screen.getByText("2m 5s")).toBeVisible();
  // Total = 600 s engaged + the ~90 s of the page still open.
  expect(screen.getAllByText(/11m 3\ds on site · 2 sessions/)).toHaveLength(2);
});
