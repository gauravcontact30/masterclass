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
  it("lays out 24 slots on the 24-hour IST clock for each window", () => {
    expect(slotStarts("today", NOW)[0]).toBe(ist("00:00"));
    expect(slotStarts("yesterday", NOW)[23]).toBe(ist("23:00", "2026-11-24"));
    const last24 = slotStarts("24h", NOW);
    expect(last24).toHaveLength(24);
    expect(last24[0]).toBe(ist("15:00", "2026-11-24"));
    expect(last24[23]).toBe(istHourStart(NOW));
    expect(hourSpan(9)).toBe("09:00:00–10:00:00");
    expect(hourSpan(0)).toBe("00:00:00–01:00:00");
    expect(hourSpan(23)).toBe("23:00:00–24:00:00");
    expect(istClock(NOW + 7_000)).toBe("14:30:07");
  });

  it("counts visitors per hour and highlights the busiest hour", () => {
    const rows = [
      ...visit("a", ist("09:05"), { new_visitor: true }), ...visit("b", ist("09:40"), { new_visitor: true }), ...visit("c", ist("09:59")),
      ...visit("a", ist("11:15")),
      ...visit("d", ist("14:10"), { country: "US" }),
    ];
    const report = hourlyVisitors(people(rows), "today", NOW);
    const at = (hour: number) => report.slots[hour];
    expect(at(9)).toMatchObject({ people: 3, newVisitors: 2, views: 3, topCountry: "IN" });
    expect(at(11)).toMatchObject({ people: 1, newVisitors: 0 });
    expect(at(14)).toMatchObject({ people: 1, current: true, topCountry: "US" });
    expect(at(15).future).toBe(true);
    expect(report.peakHours).toEqual([9]);
    expect(report.peakPeople).toBe(3);
    // "a" came at 09:00 and 11:00 but is one visitor in the window.
    expect(report.people).toBe(4);
    expect(report.activeHours).toBe(3);
  });

  it("highlights every hour tied for the most visitors, and none when nobody came", () => {
    const tied = hourlyVisitors(people([...visit("a", ist("08:10")), ...visit("b", ist("13:10"))]), "today", NOW);
    expect(tied.peakHours).toEqual([8, 13]);
    expect(hourlyVisitors([], "today", NOW).peakHours).toEqual([]);
  });
});
