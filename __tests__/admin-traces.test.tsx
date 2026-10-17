import { fireEvent, render, screen } from "@testing-library/react";
import { filterTraces } from "@/lib/admin-traces";
import { SuperAdminTraces } from "@/components/super-admin-traces";

const events = [
  { id: "a", kind: "request", status: 500, duration_ms: 1200, created_at: "2026-10-17T10:00:00Z", details: { request_id: "req-1" } },
  { id: "b", kind: "audit", actor_id: "user-1", created_at: "2026-10-17T11:00:00Z", details: { owner_id: "user-2", record_id: "record-1" } },
  { id: "c", kind: "request", status: 200, duration_ms: 25, created_at: "2026-10-17T12:00:00Z", details: { request_id: "req-10" } },
];
test("trace IDs match exactly across allowlisted identifiers, newest first", () => {
  expect(filterTraces(events, " req-1 ", "all").map(row => row.id)).toEqual(["a"]);
  expect(filterTraces(events, "user-2", "all").map(row => row.id)).toEqual(["b"]);
  expect(filterTraces(events, "record-1", "all").map(row => row.id)).toEqual(["b"]);
  expect(filterTraces(events, "", "all").map(row => row.id)).toEqual(["c", "b", "a"]);
  expect(filterTraces(events, "", "slow").map(row => row.id)).toEqual(["a"]);
  expect(filterTraces(events, "", "errors").map(row => row.id)).toEqual(["a"]);
});
test("clicking a request ID scopes the timeline and reset restores events", () => {
  render(<SuperAdminTraces events={events} query="" />);
  fireEvent.click(screen.getByRole("button", { name: "req-1" }));
  expect(screen.getByLabelText("Trace by ID")).toHaveValue("req-1");
  expect(screen.getByText("1 records")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Reset trace" }));
  expect(screen.getByText("3 records")).toBeInTheDocument();
});
