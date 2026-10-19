import { fireEvent, render, screen } from "@testing-library/react";
import { SuperAdminDashboard } from "@/components/super-admin-dashboard";

jest.mock("next/navigation", () => ({ useRouter: () => ({ replace: jest.fn(), refresh: jest.fn() }) }));
jest.mock("@/components/super-admin-overview-live", () => ({ OverviewLive: () => null }));
jest.mock("@/components/super-admin-notepad", () => ({ SuperAdminNotepad: () => <input aria-label="Test document" defaultValue="Draft" /> }));

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

test("Notepad loads on first visit and preserves its mounted editor across section switches", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({ error: "service_error" }) });
  render(<SuperAdminDashboard userId="test-admin" />);
  expect(screen.queryByLabelText("Test document")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Notepad" }));
  const editor = await screen.findByLabelText("Test document");
  fireEvent.change(editor, { target: { value: "Unsaved edits" } });
  fireEvent.click(screen.getByRole("button", { name: "Overview" }));
  expect(editor).not.toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Notepad" }));
  expect(screen.getByLabelText("Test document")).toBe(editor);
  expect(editor).toBeVisible();
  expect(editor).toHaveValue("Unsaved edits");
});
