import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { SuperAdminOverallVisitors } from "@/components/super-admin-overall-visitors";
const report = { totals: { views: 8, visitors: 3, sessions: 4, accounts: 1, recent: 1, first: "2026-10-22T01:00:00Z", latest: "2026-10-26T01:00:00Z" }, daily: [], pages: [], sources: [], countries: [], generatedAt: "2026-10-26T01:00:00Z", retentionDays: 5 };
test("overall report displays actual coverage and refreshes from its endpoint", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => report });
  render(<SuperAdminOverallVisitors />);
  expect(screen.getByRole("heading", { name: "Overall Visitors Tracking" })).toBeInTheDocument();
  expect(await screen.findByText(/Visit retention is configured for 5 days/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Refresh overall tracking" }));
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
});
test("unavailable data never renders invented zero totals", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "migration_required" }) });
  render(<SuperAdminOverallVisitors />);
  expect(await screen.findByRole("alert")).toHaveTextContent("0040_overall_visitor_tracking.sql");
  expect(screen.queryByText("unique browsers")).not.toBeInTheDocument();
});
