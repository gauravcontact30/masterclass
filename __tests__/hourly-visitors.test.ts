/** @jest-environment node */
import { indexVisits, streamVisitors, type StreamVisit } from "@/lib/live-visits";
import { hourlyVisitors, hourSpan, istClock, istHourStart, slotStarts } from "@/lib/hourly-visitors";

// 2026-11-25 14:30 IST.
const NOW = Date.parse("2026-11-25T14:30:00+05:30");
const ist = (hhmm: string, day = "2026-11-25") => Date.parse(`${day}T${hhmm}:00+05:30`);
let n = 0;
/** One page view and its leave beacon (10 s on screen) for a visitor's own session. */
function visit(visitor: string, at: number, extra: Partial<StreamVisit> = {}): StreamVisit[] {
  const session = `s-${visitor}-${n++}`;
  const base = { visitor_id: visitor, session_id: session, path: "/learn", country: "IN", ...extra };
  return [
    { ...base, created_at: new Date(at).toISOString(), event: "page_view" },
    { ...base, created_at: new Date(at + 10_000).toISOString(), event: "page_leave", duration_ms: 10_000 },
  ];
}
const people = (rows: StreamVisit[]) => streamVisitors(indexVisits(rows, []), NOW);

describe("hourlyVisitors", () => {
  it("lays out a calendar day from 00:00:00 to 24:00:00 IST", () => {
    expect(slotStarts(0, NOW)[0]).toBe(ist("00:00"));
    expect(slotStarts(0, NOW)[23]).toBe(ist("23:00"));
    expect(slotStarts(1, NOW)[0]).toBe(ist("00:00", "2026-11-24"));
    expect(istHourStart(NOW)).toBe(ist("14:00"));
    expect(hourSpan(0)).toBe("00:00:00–01:00:00");
    expect(hourSpan(9)).toBe("09:00:00–10:00:00");
    expect(hourSpan(23)).toBe("23:00:00–24:00:00");
    expect(istClock(NOW + 7_000)).toBe("14:30:07");
  });

  it("counts each hour and marks the current and upcoming hours", () => {
    const rows = [
      ...visit("a", ist("09:05"), { new_visitor: true }), ...visit("b", ist("09:40"), { new_visitor: true }), ...visit("c", ist("09:59")),
      ...visit("a", ist("11:15")),
      ...visit("d", ist("14:10"), { country: "US" }),
    ];
    const report = hourlyVisitors(people(rows), 0, NOW);
    const at = (hour: number) => report.slots[hour];
    expect(at(9)).toMatchObject({ people: 3, newVisitors: 2, returning: 1, views: 3, topCountry: "IN", readingMs: 30_000 });
    expect(at(14)).toMatchObject({ people: 1, current: true, topCountry: "US" });
    expect(at(15).future).toBe(true);
    // "a" came at 09:00 and 11:00 but is one visitor in the day.
    expect(report.people).toBe(4);
    expect(report.activeHours).toBe(3);
  });

  it("ranks the top three hours by visitors, then page views, then the earlier hour", () => {
    const rows = [
      ...visit("a", ist("08:10")), ...visit("b", ist("08:20")), ...visit("c", ist("08:30")),
      ...visit("d", ist("10:10")), ...visit("d", ist("10:20")), ...visit("e", ist("10:30")),
      ...visit("f", ist("12:10")), ...visit("g", ist("12:20")),
      ...visit("h", ist("13:10")),
    ];
    const report = hourlyVisitors(people(rows), 0, NOW);
    expect(report.top.map(s => [s.hour, s.rank])).toEqual([[8, 1], [10, 2], [12, 3]]);
    expect(report.slots[13].rank).toBeNull();
  });

  it("ranks fewer hours when fewer had visitors, and none on an empty day", () => {
    expect(hourlyVisitors(people(visit("a", ist("08:10"))), 0, NOW).top).toHaveLength(1);
    expect(hourlyVisitors([], 0, NOW).top).toEqual([]);
  });
});
