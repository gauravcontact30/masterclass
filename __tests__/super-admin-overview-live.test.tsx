import { act, render, screen, within } from "@testing-library/react";
import { OverviewLive } from "@/components/super-admin-overview-live";

const NOW = Date.parse("2026-10-31T01:00:00Z");
const base = { visitor_id: "visitor-1", session_id: "session-1", country: "IN", city: "Delhi", device: "desktop", path: "/learn", email: "learner@example.test" };
const live = { generatedAt: new Date(NOW).toISOString(), totals: { liveNow: 0, liveSignedIn: 0, pageViews: 0, visitors: 0, bounceRate: null, avgSessionSeconds: null }, hours: [], recent: [] };
const ago = (seconds: number) => new Date(NOW - seconds * 1000).toISOString();
function mockFeed(visits: object[], presence: object[] = []) {
  const stream = { days: 5, generatedAt: ago(0), visits, presence };
  global.fetch = jest.fn(async (url: RequestInfo | URL) => ({ ok: true, json: async () => String(url).includes("/activity/stream") ? { ...stream, generatedAt: new Date(Date.now()).toISOString() } : live })) as jest.Mock;
}
beforeEach(() => { jest.useFakeTimers({ now: NOW, doNotFake: ["queueMicrotask", "nextTick"] }); });
afterEach(() => { jest.useRealTimers(); });
async function timeline() {
  render(<OverviewLive snapshot={null} onRefreshSnapshot={() => {}} />);
  return within(await screen.findByRole("group", { name: "Session timeline" }));
}

test("arrival and visibility-end timestamps show seconds and their own IST dates across midnight", async () => {
  const arrived = "2026-10-30T18:29:58.000Z", left = "2026-10-30T18:30:03.000Z";
  mockFeed([{ ...base, event: "page_view", created_at: arrived }, { ...base, event: "page_leave", created_at: left, duration_ms: 5000 }]);
  const card = await timeline();
  expect(card.getByText("11:59:58 pm")).toHaveAttribute("dateTime", arrived);
  expect(card.getByText("12:00:03 am")).toHaveAttribute("dateTime", left);
  expect(card.getByText(/30 Oct 2026/)).toBeVisible();
  expect(card.getByText(/31 Oct 2026/)).toBeVisible();
  expect(card.getByText("Estimated arrival")).toBeVisible();
  expect(card.getByText("Left / hidden (IST)")).toBeVisible();
  expect(card.getByText("Visibility ended; exit unconfirmed")).toBeVisible();
  expect(card.getAllByText("5s")).toHaveLength(2);
  expect(card.queryByText(/Exact:/)).not.toBeInTheDocument();
});

test("a missing leave signal is shown as last seen, never a confirmed departure", async () => {
  mockFeed([{ ...base, event: "page_view", created_at: ago(900) }], [{ session_id: base.session_id, path: base.path, started_at: ago(900), seen_at: ago(600) }]);
  const card = await timeline();
  expect(card.getByText("Last seen (IST)")).toBeVisible();
  expect(card.getByText("Departure not confirmed")).toBeVisible();
  expect(card.getAllByText("5m 0s")).toHaveLength(2);
  expect(card.getByText(/Incomplete timing/)).toBeVisible();
});

test("durations retain seconds after an hour, and the five-day feed includes older visits", async () => {
  mockFeed([{ ...base, event: "page_view", created_at: ago(3 * 86400) }, { ...base, event: "page_leave", created_at: ago(3 * 86400 - 3723), duration_ms: 3723000 }]);
  const card = await timeline();
  expect(card.getAllByText("1h 2m 3s")).toHaveLength(2);
  expect(screen.getByText(/1 visitor · 1 views in the last 5 days/)).toBeVisible();
});

test("live duration ticks, expires without inventing a leave, and refreshes incrementally", async () => {
  mockFeed([{ ...base, event: "page_view", created_at: ago(200) }], [{ session_id: base.session_id, path: base.path, started_at: ago(200), seen_at: ago(20) }]);
  const card = await timeline();
  expect(card.getByText("Recently active")).toBeVisible();
  expect(card.getAllByText("3m 20s")).toHaveLength(2);
  await act(async () => { await jest.advanceTimersByTimeAsync(15_000); });
  expect(card.getAllByText("3m 35s")).toHaveLength(2);
  expect(jest.mocked(fetch).mock.calls.some(([url]) => String(url).includes("/activity/stream?since="))).toBe(true);
  // Keep the same observation time but update generatedAt so repeated test responses cannot rewind the clock.
  global.fetch = jest.fn(async (url: RequestInfo | URL) => ({ ok: true, json: async () => String(url).includes("/activity/stream") ? { days: 5, generatedAt: new Date(Date.now()).toISOString(), visits: [], presence: [] } : live })) as jest.Mock;
  await act(async () => { await jest.advanceTimersByTimeAsync(85_000); });
  expect(card.getByText("Last seen (IST)")).toBeVisible();
  expect(card.getByText("Departure not confirmed")).toBeVisible();
  expect(card.getAllByText("3m 0s")).toHaveLength(2);
});
