import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { SuggestionBox } from "@/components/suggestion-box";
import { SuperAdminSuggestions } from "@/components/super-admin-suggestions";
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });
const reply = (body: unknown) => ({ ok: true, json: async () => body });

test("a guest gets a tracking code and can read the admin reply without signing in", async () => {
  const trackingCode = `00000000-0000-4000-8000-000000000001.${"a".repeat(64)}`;
  const fetcher = jest.fn().mockResolvedValueOnce(reply({ trackingCode })).mockResolvedValueOnce(reply({ suggestion: { title: "Practice examples", body: "Please include practice examples for new learners.", status: "planned" }, updates: [{ id: "reply1", status: "planned", reply: "We will include this in the next lesson update.", created_at: "2026-10-17T10:00:00Z" }] }));
  global.fetch = fetcher;
  render(<SuggestionBox />);
  fireEvent.click(screen.getByRole("button", { name: "Suggestion Box", exact: true }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.change(within(dialog).getByLabelText("Your name"), { target: { value: "Learner" } });
  fireEvent.change(within(dialog).getByLabelText("Suggestion title"), { target: { value: "Practice examples" } });
  fireEvent.change(within(dialog).getByLabelText("Your suggestion"), { target: { value: "Please include practice examples for new learners." } });
  fireEvent.submit(within(dialog).getByRole("button", { name: "Submit suggestion" }).closest("form")!);
  expect(await screen.findByText("Your suggestion is in the inbox.")).toBeInTheDocument();
  expect(screen.getByLabelText("Private tracking code")).toHaveValue(trackingCode);
  fireEvent.click(screen.getByRole("button", { name: "Check progress" }));
  fireEvent.submit(screen.getByRole("button", { name: "View progress & replies" }).closest("form")!);
  expect(await screen.findByText("We will include this in the next lesson update.")).toBeInTheDocument();
  expect(fetcher).toHaveBeenLastCalledWith("/api/suggestions", expect.objectContaining({ headers: { Authorization: `Bearer ${trackingCode}` } }));
});

test("admin inbox requests server pages of ten and sends status filters", async () => {
  const rows = Array.from({ length: 10 }, (_, i) => ({ id: `row-${i}`, title: `Idea ${i}`, name: "Learner", category: "feature", status: "new", priority: "normal", created_at: "2026-10-17T10:00:00Z" }));
  const fetcher = jest.fn().mockResolvedValue(reply({ suggestions: rows, total: 23, counts: { new: 23 } }));
  global.fetch = fetcher;
  render(<SuperAdminSuggestions />);
  expect(await screen.findByText("Showing 1–10 of 23")).toBeInTheDocument();
  expect(screen.getAllByRole("row")).toHaveLength(11);
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  await waitFor(() => expect(fetcher.mock.calls.at(-1)?.[0]).toContain("page=2"));
  await screen.findByText("Showing 11–20 of 23");
  fireEvent.click(screen.getByRole("button", { name: "Planned 0" }));
  await waitFor(() => expect(fetcher.mock.calls.at(-1)?.[0]).toContain("status=planned"));
  expect(fetcher.mock.calls.at(-1)?.[0]).toContain("page=1");
});

test("admin can select rows and move them to a status in one bulk action", async () => {
  const rows = [0, 1, 2].map(i => ({ id: `00000000-0000-4000-8000-00000000000${i}`, title: `Idea ${i}`, body: "Please add more practice for this.", name: "Learner", category: "feature", status: "new", priority: "normal", reply_count: 0, created_at: "2026-10-17T10:00:00Z" }));
  const fetcher = jest.fn().mockImplementation(async (url: string, init?: RequestInit) => init?.method === "POST" ? reply({ affected: 2 }) : reply({ suggestions: rows, total: 3, counts: { new: 3 }, awaitingReply: 3, urgent: 0 }));
  global.fetch = fetcher;
  render(<SuperAdminSuggestions />);
  fireEvent.click(await screen.findByRole("checkbox", { name: "Select Idea 0" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "Select Idea 2" }));
  expect(screen.getByText("2 selected")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Set status" }));
  fireEvent.click(await screen.findByRole("menuitem", { name: "Planned" }));
  await waitFor(() => expect(fetcher).toHaveBeenCalledWith("/api/super-admin/suggestions", expect.objectContaining({ method: "POST" })));
  const post = fetcher.mock.calls.find(([, init]) => init?.method === "POST");
  expect(JSON.parse(post![1].body)).toEqual({ action: "update", status: "planned", ids: [rows[0].id, rows[2].id] });
  expect(await screen.findByText("Updated 2 suggestions.")).toBeInTheDocument();
});

test("search scope, clear search and the basic-mode notice before migration 0026", async () => {
  const fetcher = jest.fn().mockResolvedValue(reply({ suggestions: [], total: 0, counts: {}, legacy: true }));
  global.fetch = fetcher;
  render(<SuperAdminSuggestions />);
  expect(await screen.findByRole("note")).toHaveTextContent("0026_suggestion_box_admin.sql");
  expect(screen.getByRole("combobox", { name: "Search in" })).toBeDisabled();
  fireEvent.change(screen.getByRole("searchbox", { name: "Search suggestions" }), { target: { value: "dark mode" } });
  await waitFor(() => expect(fetcher.mock.calls.at(-1)?.[0]).toContain("search=dark+mode"));
  fireEvent.click(screen.getByRole("button", { name: "Clear suggestion search" }));
  await waitFor(() => expect(fetcher.mock.calls.at(-1)?.[0]).not.toContain("search="));
  expect(screen.getByRole("searchbox", { name: "Search suggestions" })).toHaveValue("");
});
