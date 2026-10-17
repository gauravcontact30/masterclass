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
