import { indexVisits, LIVE_MS, streamVisitors, type Presence, type StreamVisit } from "@/lib/live-visits";

const NOW = Date.parse("2026-10-24T08:00:00Z");
const t = (secondsAgo: number) => new Date(NOW - secondsAgo * 1000).toISOString();
const view = (secondsAgo: number, path: string, extra: Partial<StreamVisit> = {}): StreamVisit => ({ created_at: t(secondsAgo), event: "page_view", visitor_id: "visitor-1", session_id: "session-1", path, ...extra });
const leave = (secondsAgo: number, path: string, seconds: number, extra: Partial<StreamVisit> = {}): StreamVisit => ({ created_at: t(secondsAgo), event: "page_leave", visitor_id: "visitor-1", session_id: "session-1", path, duration_ms: seconds * 1000, ...extra });
const beat = (path: string, startedAgo: number, seenAgo: number, session = "session-1"): Presence => ({ session_id: session, path, started_at: t(startedAgo), seen_at: t(seenAgo) });
const run = (rows: StreamVisit[], presence: Presence[] | null, now = NOW) => streamVisitors(indexVisits(rows, presence), now);

test("a page still being read is timed to the second from its heartbeat stretch", () => {
  const [visitor] = run([view(130, "/learn")], [beat("/learn", 130, 40)]);
  expect(visitor.live).toBe(true);
  expect(visitor.page).toEqual({ ms: 130_000, open: true });
  expect(visitor.left).toBeNull();
});

test("time in a background tab does not count, and coming back resumes the clock", () => {
  // Read 60 s, hid the tab for 10 minutes, came back 30 s ago and is still reading.
  const rows = [view(690, "/learn"), leave(630, "/learn", 60)];
  const [visitor] = run(rows, [beat("/learn", 30, 30)]);
  expect(visitor.live).toBe(true);
  expect(visitor.page).toEqual({ ms: 90_000, open: true });
  expect(visitor.engagedMs).toBe(90_000);
});

test("a hidden tab with no heartbeat since is not on the site, and shows its beacon time", () => {
  const [visitor] = run([view(690, "/learn"), leave(630, "/learn", 60)], [beat("/learn", 690, 645)]);
  expect(visitor.live).toBe(false);
  expect(visitor.page).toEqual({ ms: 60_000, open: false });
  expect(visitor.beacon).toBe(true);
  expect(visitor.left).toBe(Date.parse(t(630)));
});

test("a page whose leave beacon was lost is timed to its last heartbeat and then counts as left", () => {
  const [visitor] = run([view(600, "/pricing")], [beat("/pricing", 600, 300)]);
  expect(visitor.live).toBe(false);
  expect(visitor.page).toEqual({ ms: 300_000, open: false });
  expect(visitor.beacon).toBe(false);
  expect(visitor.left).toBe(Date.parse(t(300)));
});

test("a page just opened counts as open until its first heartbeat is overdue", () => {
  expect(run([view(20, "/")], [])[0]).toMatchObject({ live: true, page: { ms: 20_000, open: true } });
  const stale = run([view(LIVE_MS / 1000 + 5, "/")], [])[0];
  expect(stale.live).toBe(false);
  expect(stale.page).toBeNull();
});

test("one person across pages, sessions and signing in: totals add up and the journey reads in order", () => {
  const rows = [
    view(4000, "/", { session_id: "old", referrer_host: "google.com" }), leave(3900, "/", 100, { session_id: "old" }),
    view(300, "/", { utm_source: "linkedin" }), leave(240, "/", 60),
    view(240, "/learn", { user_id: "user-1" }), leave(120, "/learn", 120, { user_id: "user-1" }),
    view(120, "/pricing", { user_id: "user-1" }),
    // The same path opened again later in the session is a new page view with its own time.
    { ...view(4100, "/", { visitor_id: "visitor-2", session_id: "other" }) },
  ];
  const visitors = streamVisitors(indexVisits(rows, [beat("/pricing", 120, 10)]), NOW, { "user-1": "learner@example.test" });
  expect(visitors).toHaveLength(2);
  const [person] = visitors;
  expect(person).toMatchObject({ email: "learner@example.test", signedIn: true, live: true, views: 4, pages: 3, sessions: 2, source: "linkedin" });
  expect(person.current.path).toBe("/pricing");
  expect(person.trail).toEqual(["/", "/learn", "/pricing"]);
  expect(person.engagedMs).toBe((100 + 60 + 120 + 120) * 1000);
});

test("a repeated path keeps each view's own beacons", () => {
  const rows = [view(500, "/a"), leave(450, "/a", 50), view(450, "/b"), leave(400, "/b", 50), view(400, "/a"), leave(380, "/a", 20)];
  const [visitor] = run(rows, []);
  expect(visitor.engagedMs).toBe(120_000);
  expect(visitor.page).toEqual({ ms: 20_000, open: false });
});

test("without heartbeats the older rule holds: the latest page without a beacon is open for 30 minutes", () => {
  expect(run([view(600, "/learn")], null)[0]).toMatchObject({ live: true, page: { ms: 600_000, open: true } });
  expect(run([view(31 * 60, "/learn")], null)[0].live).toBe(false);
});

test("visitors on the site come first, then the most recently active", () => {
  const rows = [view(50, "/", { visitor_id: "a", session_id: "sa" }), leave(40, "/", 10, { visitor_id: "a", session_id: "sa" }), view(900, "/", { visitor_id: "b", session_id: "sb" })];
  const visitors = run(rows, [beat("/", 900, 20, "sb")]);
  expect(visitors.map(v => v.key)).toEqual(["visitor:b", "visitor:a"]);
});
