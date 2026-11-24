import { indexVisits, periodSummary, streamVisitors, type StreamVisit } from "@/lib/live-visits";
import { uncountedBrowsers, visitorReport } from "@/lib/visitor-report";

const NOW = Date.parse("2026-11-24T06:00:00Z");
const DAY_START = Date.parse("2026-11-24T00:00:00+05:30");
let id = 0;
/** A page view and, when `readMs` is given, its leave beacon with that much visible time. */
function view(visitor: string, session: string, at: string, path: string, extra: Partial<StreamVisit> = {}, readMs?: number): StreamVisit[] {
  const base = { visitor_id: visitor, session_id: session, user_id: null, path, title: null, country: "IN", city: "Pune", device: "Desktop", browser: "Chrome", os: "Windows", ...extra } as unknown as StreamVisit;
  const rows = [{ ...base, id: String(++id), event: "page_view", created_at: at } as StreamVisit];
  if (readMs != null) rows.push({ ...base, id: String(++id), event: "page_leave", created_at: new Date(Date.parse(at) + readMs).toISOString(), duration_ms: readMs, new_visitor: false } as StreamVisit);
  return rows;
}

const rows: StreamVisit[] = [
  // A new guest from Google who read two pages.
  ...view("a", "s1", "2026-11-24T03:00:00Z", "/", { new_visitor: true, referrer_host: "www.google.com" }, 30_000),
  ...view("a", "s1", "2026-11-24T03:01:00Z", "/courses", {}, 45_000),
  // A new visitor who signed up during the visit.
  ...view("b", "s2", "2026-11-24T04:00:00Z", "/subscribe", { new_visitor: true, utm_source: "instagram", utm_campaign: "launch" }, 20_000),
  ...view("b", "s2", "2026-11-24T04:02:00Z", "/learning", { user_id: "11111111-1111-1111-1111-111111111111" }, 60_000),
  // A returning guest: first seen two days ago, back today.
  ...view("c", "s3", "2026-11-22T10:00:00Z", "/tech-buzz", { new_visitor: true }, 10_000),
  ...view("c", "s4", "2026-11-24T05:00:00Z", "/tech-buzz", {}, 15_000),
  // A scraper-style page load: never on screen (no leave beacon, no heartbeat).
  ...view("z", "s9", "2026-11-24T05:30:00Z", "/api-reference/x", { new_visitor: true, country: "CN", city: "Beijing" }),
];

const everyone = streamVisitors(indexVisits(rows, []), NOW);

test("counts people who saw the site, with new visitors split into guests and sign-ups", () => {
  const report = visitorReport(everyone, DAY_START);
  expect(report.people).toBe(3);
  expect(report.newSummary).toMatchObject({ total: 2, guests: 1, signedUp: 1, bounced: 0 });
  expect(report.newVisitors.map(v => v.sourceLabel).sort()).toEqual(["Google", "Instagram"]);
  expect(report.newVisitors.find(v => v.signedUp)?.campaign).toBe("launch");
  expect(report.countries.find(c => c.key === "CN")).toBeUndefined();
});

test("agrees with the stream's own period summary", () => {
  const report = visitorReport(everyone, DAY_START), sum = periodSummary(everyone, DAY_START);
  expect(report.people).toBe(sum.people);
  // The summary counts new guests only (a new visitor who signed up is under signed in); the report counts both.
  expect(report.newSummary.guests).toBe(sum.newVisitors);
  expect(report.people_.map(p => p.kind).sort()).toEqual(["New", "Returning", "Signed in"]);
});

test("the page load that was never on screen is counted only as left out", () => {
  expect(uncountedBrowsers(rows, everyone, DAY_START)).toBe(1);
  expect(visitorReport(everyone, DAY_START).visits.some(v => v.entry.startsWith("/api-reference"))).toBe(false);
});
