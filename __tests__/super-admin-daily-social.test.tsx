import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { SuperAdminDailySocial } from "@/components/super-admin-daily-social";
import { dailySocial } from "@/lib/daily-social";

const data = { ...dailySocial([], "2026-10-19"), generatedAt: "2026-10-19T06:00:00Z", capped: false };
test("shows a dated platform matrix and requests a selected calendar day", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => data });
  render(<SuperAdminDailySocial />);
  expect(await screen.findByRole("heading", { name: "Instagram" })).toBeVisible();
  expect(screen.getByRole("status")).toHaveTextContent("Today: 2026-10-19");
  expect(screen.getByRole("status")).toHaveTextContent("Latest refresh");
  expect(screen.getByRole("heading", { name: "Daily visitor trace" })).toBeVisible();
  fireEvent.change(screen.getByLabelText("Daily tracking date"), { target: { value: "2026-10-18" } });
  await waitFor(() => expect(fetch).toHaveBeenLastCalledWith("/api/super-admin/promotions/daily?date=2026-10-18", expect.objectContaining({ cache: "no-store" })));
});

test("failed daily requests show an error rather than fabricated totals", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false });
  render(<SuperAdminDailySocial />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Daily tracking is unavailable");
  expect(screen.queryByText("unique browsers")).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("No successful refresh yet");
});

test("visitor trace displays only email, city, time and duration", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ...data, visitors: [{ id: "session", email: "learner@example.test", city: "Delhi", time: "2026-10-19T06:00:00Z", duration: 125_000, platform: "Instagram", pages: ["Learning dashboard"] }] }) });
  render(<SuperAdminDailySocial />);
  await screen.findAllByText("learner@example.test");
  const table = screen.getAllByRole("table").find(table => within(table).queryByText("Duration"))!;
  expect(within(table).getAllByRole("columnheader")).toHaveLength(4);
  expect(within(table).getByText("Delhi")).toBeVisible();
  expect(within(table).getByText("2m 5s")).toBeVisible();
  expect(within(table).queryByText("session")).not.toBeInTheDocument();
});
