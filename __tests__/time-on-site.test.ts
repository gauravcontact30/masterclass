/** @jest-environment node */
import { indexVisits, streamVisitors, type Presence, type StreamVisit } from "@/lib/live-visits";
import { stayClock, stayText, timeOnSite } from "@/lib/time-on-site";

const NOW = Date.parse("2026-11-25T14:30:00+05:30");
const FROM = Date.parse("2026-11-25T00:00:00+05:30");
const iso = (ms: number) => new Date(ms).toISOString();
let s = 0;
/** A visit: pages opened one after another, each read for the given seconds and closed with its leave beacon. */
function visit(visitor: string, start: number, reads: [path: string, seconds: number][], extra: Partial<StreamVisit> = {}): StreamVisit[] {
  const session = `s${s++}`, rows: StreamVisit[] = [];
  let t = start;
  for (const [path, seconds] of reads) {
    const base = { visitor_id: visitor, session_id: session, path, country: "IN", device: "Desktop", ...extra };
    rows.push({ ...base, created_at: iso(t), event: "page_view" }, { ...base, created_at: iso(t + seconds * 1000), event: "page_leave", duration_ms: seconds * 1000 });
    t += seconds * 1000 + 1000;
  }
  return rows;
}

describe("timeOnSite", () => {
  const rows = [
    ...visit("a", NOW - 3 * 3600_000, [["/learn", 120], ["/pricing", 60]], { new_visitor: true, referrer_host: "google.com" }),
    ...visit("b", NOW - 2 * 3600_000, [["/learn", 5]], { country: "US" }),
    ...visit("c", NOW - 3600_000, [["/docs", 400]]),
  ];
  const everyone = streamVisitors(indexVisits(rows, []), NOW);
  const report = timeOnSite(everyone, FROM, Infinity);

  it("adds up each visitor's recorded time on screen", () => {
    expect(report.people).toBe(3);
    expect(report.visits).toBe(3);
    expect(Math.round(report.totalOnScreenMs / 1000)).toBe(585);
    expect(Math.round(report.medianOnScreenMs! / 1000)).toBe(180);
    expect(report.engaged).toBe(2);
    expect(report.deep).toBe(2);
    expect(report.bounced).toBe(2);
    expect(report.timing.recorded).toBe(3);
  });

  it("places every visitor in exactly one stay bucket", () => {
    expect(report.buckets.reduce((sum, b) => sum + b.people, 0)).toBe(3);
    expect(report.buckets.find(b => b.label === "Under 10 s")?.people).toBe(1);
    expect(report.buckets.find(b => b.label === "3–10 min")?.people).toBe(2);
  });

  it("ranks pages by time on screen and records where visits ended", () => {
    expect(report.pages[0]).toMatchObject({ path: "/docs", views: 1 });
    expect(report.pages.find(p => p.path === "/learn")).toMatchObject({ views: 2, people: 2 });
    expect(report.exits.find(e => e.path === "/pricing")).toMatchObject({ exits: 1, exitRate: 100 });
    expect(report.longest[0].entry).toBe("/docs");
  });

  it("lists visitors on the site now with their running visit", () => {
    const open: StreamVisit[] = [{ visitor_id: "d", session_id: "live", path: "/learn", created_at: iso(NOW - 90_000), event: "page_view", country: "IN" }];
    const presence: Presence[] = [{ session_id: "live", path: "/learn", started_at: iso(NOW - 90_000), seen_at: iso(NOW - 10_000) }];
    const live = timeOnSite(streamVisitors(indexVisits(open, presence), NOW), FROM).live;
    expect(live).toHaveLength(1);
    expect(live[0].reading).toBe(true);
    expect(Math.round(live[0].stayMs / 1000)).toBeGreaterThanOrEqual(90);
  });

  it("formats durations", () => {
    expect(stayText(38_000)).toBe("38s");
    expect(stayText(245_000)).toBe("4m 05s");
    expect(stayText(4_320_000)).toBe("1h 12m");
    expect(stayClock(3_725_000)).toBe("01:02:05");
  });
});

describe("timeLeaders", () => {
  it("ranks every visitor by total time on screen, most first", async () => {
    const { timeLeaders } = await import("@/lib/time-on-site");
    const rows = [
      ...visit("x", NOW - 5 * 3600_000, [["/a", 50]]), ...visit("x", NOW - 4 * 3600_000, [["/b", 100]]),
      ...visit("y", NOW - 3 * 3600_000, [["/c", 120]]),
      ...visit("z", NOW - 2 * 3600_000, [["/d", 5]]),
    ];
    const leaders = timeLeaders(streamVisitors(indexVisits(rows, []), NOW), FROM);
    expect(leaders.map(l => [l.rank, l.key.replace(/^visitor:/, "")])).toEqual([[1, "x"], [2, "y"], [3, "z"]]);
    expect(leaders[0]).toMatchObject({ visits: 2, views: 2, topPage: "/b" });
    expect(Math.round(leaders[0].onScreenMs / 1000)).toBe(150);
  });
});
