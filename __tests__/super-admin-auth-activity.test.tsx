import { fireEvent, render, screen, within } from "@testing-library/react";
import { SuperAdminAuthActivity } from "@/components/super-admin-auth-activity";

const agent = "Mozilla/5.0 " + "LongBrowserDeviceInformation".repeat(20);
const props = {
  users: [{ id: "user-1", email: "learner@example.test" }],
  sessions: [{ id: "session-1", user_id: "user-1", ip: "2001:db8::1234", user_agent: agent, created_at: "2026-10-19T03:00:00Z", updated_at: "2026-10-19T03:10:00Z", not_after: null }],
  logins: [{ id: "event-1", actor_id: "user-1", action: "login", ip_address: "2001:db8::1234", created_at: "2026-10-19T03:00:00Z" }],
  days: 30, query: "", generatedAt: "2026-10-19T04:00:00Z", refreshing: false, onRefresh: jest.fn(),
};

test("session and audit cards retain full values, readable dates and separate labels", () => {
  render(<SuperAdminAuthActivity {...props} />);
  const sessions = within(screen.getByRole("region", { name: "Authentication session records" }));
  expect(sessions.getByRole("cell", { name: agent })).toHaveTextContent(agent);
  expect(sessions.getByRole("cell", { name: "learner@example.test" })).toBeVisible();
  expect(sessions.getByRole("cell", { name: "session-1" })).toBeVisible();
  expect(sessions.getByText("No explicit expiry recorded")).toBeVisible();
  expect(sessions.getByText(/19 Oct 2026, 03:10:00 UTC/)).toBeVisible();
  const logins = within(screen.getByRole("region", { name: "Authentication audit history" }));
  expect(logins.getByRole("cell", { name: "event-1" })).toBeVisible();
  expect(logins.getByRole("cell", { name: "login" })).toBeVisible();
  expect(logins.getByText(/not a count of successful logins/)).toBeVisible();
});

test("search is isolated by section and refresh uses the dashboard callback", () => {
  render(<SuperAdminAuthActivity {...props} />);
  fireEvent.change(screen.getByRole("combobox", { name: "Search Auth sessions" }), { target: { value: "missing-user" } });
  expect(screen.queryByRole("cell", { name: "session-1" })).not.toBeInTheDocument();
  expect(screen.getByRole("cell", { name: "event-1" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Refresh Login history" }));
  expect(props.onRefresh).toHaveBeenCalledTimes(1);
});

test("missing directory entries and invalid timestamps have honest fallbacks", () => {
  render(<SuperAdminAuthActivity {...props} users={[]} refreshing sessions={[{ id: "session-2", user_id: "missing", created_at: "bad-date" }]} logins={[]} />);
  expect(screen.getByText("Not in loaded user directory")).toBeVisible();
  expect(screen.getByText("Invalid timestamp")).toBeVisible();
  expect(screen.getByRole("button", { name: "Refresh Auth sessions" })).toBeDisabled();
  expect(screen.getByText("No auth events match the current search or filters.")).toBeVisible();
});
