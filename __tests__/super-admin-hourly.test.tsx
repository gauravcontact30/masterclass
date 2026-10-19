import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { SuperAdminHourly } from "@/components/super-admin-hourly";
import { activityHours } from "@/lib/activity-hours";

const originalFetch = global.fetch;
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-10-19T06:29:50Z")); // 11:59:50 IST
  global.fetch = jest.fn(async (url: RequestInfo | URL) => {
    const date = new URL(String(url), "https://example.com").searchParams.get("date")!;
    return { ok: true, json: async () => ({ ...activityHours([], date), generatedAt: new Date().toISOString(), capped: false }) } as Response;
  });
});
afterEach(() => { jest.useRealTimers(); global.fetch = originalFetch; });

test("current hour is highlighted, follows rollover and can be revisited after manual inspection", async () => {
  await act(async () => { render(<SuperAdminHourly />); });
  expect(screen.getByRole("button", { name: /^Current hour, 11:00/ })).toHaveAttribute("aria-current", "time");
  const detail = () => within(screen.getByRole("region", { name: "Selected hour details" }));
  expect(detail().getByRole("heading", { level: 3 })).toHaveTextContent("11:00–12:00");
  await act(async () => { jest.advanceTimersByTime(15_000); });
  expect(screen.getByRole("button", { name: /^Current hour, 12:00/ })).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: /^09:00 IST/ }));
  expect(detail().getByRole("heading", { level: 3 })).toHaveTextContent("09:00–10:00");
  expect(screen.getByRole("button", { name: /^Current hour, 12:00/ })).toHaveAttribute("aria-current", "time");
  fireEvent.click(screen.getByRole("button", { name: "Follow current hour" }));
  expect(detail().getByText("Current hour · in progress")).toBeInTheDocument();
  expect(detail().getByText("First tracked view (IST)")).toBeInTheDocument();
});

test("historical dates do not display a current-hour indicator", async () => {
  await act(async () => { render(<SuperAdminHourly />); });
  await act(async () => { fireEvent.change(screen.getByLabelText("Busiest hours date"), { target: { value: "2026-10-18" } }); });
  expect(screen.queryByRole("button", { name: /^Current hour,/ })).not.toBeInTheDocument();
  expect(screen.queryByText("Current hour · in progress")).not.toBeInTheDocument();
});
