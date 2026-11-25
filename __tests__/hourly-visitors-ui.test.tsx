import { render, screen, within } from "@testing-library/react";
import { indexVisits, streamVisitors, type StreamVisit } from "@/lib/live-visits";
import { SuperAdminHourlyVisitors } from "@/components/super-admin-hourly-visitors";

const NOW = Date.parse("2026-11-25T14:30:00+05:30");
const ist = (hhmm: string) => Date.parse(`2026-11-25T${hhmm}:00+05:30`);
const view = (visitor: string, at: number): StreamVisit[] => [
  { visitor_id: visitor, session_id: `s-${visitor}-${at}`, path: "/learn", country: "IN", created_at: new Date(at).toISOString(), event: "page_view" },
  { visitor_id: visitor, session_id: `s-${visitor}-${at}`, path: "/learn", country: "IN", created_at: new Date(at + 10_000).toISOString(), event: "page_leave", duration_ms: 10_000 },
];

it("shows the whole day, ranks the top three hours and marks the live hour", () => {
  const rows = [...view("a", ist("08:10")), ...view("b", ist("08:20")), ...view("c", ist("10:10")), ...view("d", ist("10:40")), ...view("e", ist("12:10")), ...view("f", ist("14:05"))];
  render(<SuperAdminHourlyVisitors everyone={streamVisitors(indexVisits(rows, []), NOW)} now={NOW} exact ownHosts={[]} days={3} />);
  const podium = screen.getByLabelText("Top three hours by visitors");
  expect(within(podium).getByText("08:00:00–09:00:00")).toBeTruthy();
  expect(within(podium).getByText("10:00:00–11:00:00")).toBeTruthy();
  expect(within(podium).getByText("12:00:00–13:00:00")).toBeTruthy();
  const body = screen.getAllByRole("rowgroup")[1];
  expect(within(body).getAllByRole("row")).toHaveLength(24);
  expect(within(body).getByText("23:00:00–24:00:00")).toBeTruthy();
  expect(screen.getAllByText("Upcoming")).toHaveLength(9);
  expect(screen.getByText(/Live · 14:30:00/)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Yesterday" })).toBeTruthy();
});
