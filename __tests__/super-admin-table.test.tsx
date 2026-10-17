import { fireEvent, render, screen, within } from "@testing-library/react";
import { AdminTable } from "@/components/super-admin-table";

const rows = Array.from({ length: 12 }, (_, i) => ({ id: `r${i}`, name: `Learner ${String(i + 1).padStart(2, "0")}`, status: i % 3 === 0 ? "failed" : "active", created_at: `2026-10-${String(i + 1).padStart(2, "0")}T10:00:00Z` }));
const names = () => screen.getAllByRole("row").slice(1).map(row => within(row).getAllByRole("cell")[0].textContent);

test("quick icon chips filter by status and show counts", () => {
  render(<AdminTable title="People" rows={rows} columns={["name", "status", "created_at"]} />);
  const chips = screen.getByRole("group", { name: "Filter by status" });
  fireEvent.click(within(chips).getByRole("button", { name: /failed/i }));
  expect(screen.getByText("4 of 12")).toBeInTheDocument();
  expect(within(chips).getByRole("button", { name: /failed/i })).toHaveAttribute("aria-pressed", "true");
});

test("columns sort ascending then descending, and Reset clears sort, search and filters", () => {
  render(<AdminTable title="People" rows={rows} columns={["name", "status", "created_at"]} />);
  fireEvent.click(screen.getByRole("button", { name: "Sort by Name" }));
  fireEvent.click(screen.getByRole("button", { name: "Sort by Name" }));
  expect(names()[0]).toBe("Learner 12");
  fireEvent.change(screen.getByRole("combobox", { name: "Search People" }), { target: { value: "Learner 0" } });
  expect(screen.getByText("9 of 12")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Reset search, filters and sorting" }));
  expect(screen.getByText("12 records")).toBeInTheDocument();
  expect(names()[0]).toBe("Learner 01");
});

test("rows per page changes the page size and the pager", () => {
  render(<AdminTable title="People" rows={rows} columns={["name", "status"]} />);
  expect(screen.getAllByRole("row")).toHaveLength(6);
  fireEvent.change(screen.getByRole("combobox", { name: "Rows per page" }), { target: { value: "25" } });
  expect(screen.getAllByRole("row")).toHaveLength(13);
  expect(screen.getByText("Showing 1–12 of 12")).toBeInTheDocument();
});

test("an empty result offers a one-click reset", () => {
  render(<AdminTable title="People" rows={rows} columns={["name", "status"]} />);
  fireEvent.change(screen.getByRole("combobox", { name: "Search People" }), { target: { value: "nobody" } });
  expect(screen.getByText("No records match your search or filters.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Reset search and filters" }));
  expect(screen.getByText("12 records")).toBeInTheDocument();
});
