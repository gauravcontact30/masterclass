import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { matchesQuery, TraceTable, type TraceRow } from "@/components/super-admin-trace-table";

const row = (i: number, over: Partial<TraceRow> = {}): TraceRow => ({ at: new Date(Date.UTC(2026, 9, 20, 0, i)).toISOString(), method: "POST", path: "/api/documents", status: 403, reason: "Not allowed (admin only)", ip: "203.0.113.9", ua: "curl/8", requestId: `req-${i}`, ...over });
const rows: TraceRow[] = [
  ...Array.from({ length: 14 }, (_, i) => row(i)),
  ...Array.from({ length: 3 }, (_, i) => row(20 + i, { status: 429, reason: "Rate limit hit", ip: "198.51.100.4", path: "/api/study-chat" })),
  row(30, { status: 401, reason: "Not signed in", path: "/api/super-admin/users", ip: "192.0.2.1", ua: "Mozilla/5.0 Firefox" }),
];
function Harness() { const [query, setQuery] = useState(""); return <TraceTable rows={rows} query={query} onQuery={setQuery} truncated={false} />; }
const bodyRows = () => within(screen.getByRole("table")).getAllByRole("row").slice(1);

test("field queries narrow to one column; bare words match any; every term must match", () => {
  expect(matchesQuery(rows[0], "ip:203.0.113")).toBe(true);
  expect(matchesQuery(rows[0], "status:429")).toBe(false);
  expect(matchesQuery(rows[14], "rate study-chat")).toBe(true);
  expect(matchesQuery(rows[17], 'browser:"mozilla/5.0 firefox"')).toBe(true);
  expect(matchesQuery(rows[17], "path:/api/super-admin status:401")).toBe(true);
});

test("ten rows a page, with icon filters that show their counts", () => {
  render(<Harness />);
  expect(bodyRows()).toHaveLength(10);
  expect(screen.getByText("Showing 1–10 of 18")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  expect(bodyRows()).toHaveLength(8);

  const filters = screen.getByRole("group", { name: "Filter by kind of block" });
  fireEvent.click(within(filters).getByRole("button", { name: "Rate limited: 3" }));
  expect(bodyRows()).toHaveLength(3);
  expect(within(filters).getByRole("button", { name: "Oversized: 0" })).toBeDisabled();
  fireEvent.click(within(filters).getByRole("button", { name: "Admin API: 1" }));
  expect(bodyRows()).toHaveLength(1);
});

test("suggestions complete a field and a value; clear resets search and filter", () => {
  render(<Harness />);
  const search = screen.getByRole("combobox", { name: "Search blocked requests" });
  fireEvent.change(search, { target: { value: "st" } });
  fireEvent.mouseDown(screen.getByRole("option", { name: /^status:/ }));
  expect(search).toHaveValue("status:");
  fireEvent.change(search, { target: { value: "status:42" } });
  // Keyboard: the first suggestion is the 429 value.
  fireEvent.keyDown(search, { key: "ArrowDown" });
  fireEvent.keyDown(search, { key: "Enter" });
  expect(search).toHaveValue("status:429 ");
  expect(bodyRows()).toHaveLength(3);

  fireEvent.click(screen.getByRole("button", { name: "Clear search and filters" }));
  expect(search).toHaveValue("");
  expect(screen.getByText("Showing 1–10 of 18")).toBeInTheDocument();
});

test("a source address traces every block from it", () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  fireEvent.click(within(bodyRows()[5]).getByRole("button", { name: "198.51.100.4" }));
  expect(screen.getByRole("combobox")).toHaveValue("ip:198.51.100.4");
  expect(bodyRows()).toHaveLength(3);
});
