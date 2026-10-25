import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NotificationCenter } from "@/components/notification-center";
import { LanguageProvider } from "@/components/language-provider";
import { setAuthNotice } from "@/lib/auth-notice";

jest.mock("sonner", () => ({ toast: Object.assign(jest.fn(), { success: jest.fn() }) }));
const { toast } = jest.requireMock("sonner") as { toast: jest.Mock & { success: jest.Mock } };
const recent = new Date().toISOString();
const reply = (notifications: object[], unread: number) => ({ ok: true, json: async () => ({ notifications, unread }) });
const renderCenter = () => render(<LanguageProvider><NotificationCenter /></LanguageProvider>);

beforeEach(() => { sessionStorage.clear(); window.history.replaceState(null, "", "/learning"); global.fetch = jest.fn().mockResolvedValue(reply([], 0)) as jest.Mock; });

test("the sign-in confirmation toast shows once, from the auth page's notice", async () => {
  setAuthNotice("signed_in");
  renderCenter();
  await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Signed in successfully", expect.anything()));
  expect(sessionStorage.getItem("mc:auth-notice")).toBeNull();
});

test("an emailed link's ?notice=verified toasts and is removed from the address bar", async () => {
  window.history.replaceState(null, "", "/learning?notice=verified&tab=1");
  renderCenter();
  await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Email verified. You are signed in", expect.anything()));
  expect(window.location.search).toBe("?tab=1");
});

test("the bell shows the unread count, lists notifications and marks them all read", async () => {
  (global.fetch as jest.Mock).mockResolvedValue(reply([
    { id: "a", kind: "sign_in", title: "Signed in successfully", body: "New sign-in", link: "/learning/settings", created_at: recent, read_at: null },
    { id: "b", kind: "email_verified", title: "Email verified", body: "", link: null, created_at: recent, read_at: "2026-10-20T00:00:00Z" },
  ], 1));
  renderCenter();
  const bell = await screen.findByRole("button", { name: "Notifications, 1 unread" });
  await act(async () => { fireEvent.click(bell); });
  expect(await screen.findByText("Email verified")).toBeInTheDocument();
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: /Mark all read/ })); });
  expect(global.fetch).toHaveBeenCalledWith("/api/notifications", expect.objectContaining({ method: "PATCH", body: JSON.stringify({ all: true }) }));
  expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument();
  // Account events are confirmed by the sign-in toast, so they are not toasted again from the list.
  expect(toast).not.toHaveBeenCalled();
});

test("a new announcement is toasted once as it arrives", async () => {
  (global.fetch as jest.Mock).mockResolvedValue(reply([{ id: "c", kind: "announcement", title: "New course: LangGraph", body: "Start today", link: null, created_at: recent, read_at: null }], 1));
  const first = renderCenter();
  await waitFor(() => expect(toast).toHaveBeenCalledWith("New course: LangGraph", { description: "Start today" }));
  first.unmount();
  renderCenter();
  await screen.findByRole("button", { name: "Notifications, 1 unread" });
  expect(toast).toHaveBeenCalledTimes(1);
});
