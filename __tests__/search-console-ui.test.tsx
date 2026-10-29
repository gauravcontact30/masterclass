import { render, screen } from "@testing-library/react";
import { SuperAdminSearchConsole } from "@/components/super-admin-search-console";
const report = { status: "not_configured", property: "https://www.masterclassbuddy.com/tech-buzz", startDate: "2026-10-01", endDate: "2026-10-28", timezone: "America/Los_Angeles", generatedAt: "2026-10-29T00:00:00Z", totals: null, daily: [], queries: [], pages: [], countries: [], devices: [] };
test("missing credentials never renders fabricated search totals", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => report });
  render(<SuperAdminSearchConsole days={30} query="" />);
  expect(await screen.findByText(/credentials are not configured/)).toBeInTheDocument();
  expect(screen.queryByText("Search impressions")).not.toBeInTheDocument();
});
test("verified totals show the reporting scope and limitations", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ...report, status: "connected", totals: { clicks: 7, impressions: 100, ctr: .07, position: 4.25 } }) });
  render(<SuperAdminSearchConsole days={30} query="" />);
  expect(await screen.findByText("7.00%")).toBeInTheDocument();
  expect(screen.getByText(/privacy filtering can hide queries/)).toBeInTheDocument();
  expect(screen.getByText(/Pacific time/)).toBeInTheDocument();
});
